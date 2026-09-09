import { generateUAPool, getRandomDelay } from './ua.js';
import { sendNotification } from './notify.js';

// --- 核心伪装引擎：基于 UA 动态生成 100% 逼真的现代浏览器指纹头 ---
function buildStealthHeaders(ua) {
  const isChrome = ua.includes('Chrome');
  const isEdge = ua.includes('Edg/');
  const isMac = ua.includes('Macintosh');
  const isIOS = ua.includes('iPhone');
  
  // 模拟真实人类的流量来源（谷歌搜索、必应搜索、推特短链跳转等）
  const referers = [
    "https://www.google.com/", 
    "https://www.bing.com/", 
    "https://t.co/",
    "https://duckduckgo.com/"
  ];
  const randomReferer = referers[Math.floor(Math.random() * referers.length)];

  // 基础标准请求头（极力模仿浏览器真实网络请求）
  const headers = {
    "User-Agent": ua,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
    "Referer": randomReferer
  };

  // 针对 Chromium (Chrome/Edge) 内核，自动提取主版本号并补全严格的 Client Hints
  if (isChrome && !isIOS) {
    const match = ua.match(/Chrome\/(\d+)/);
    const version = match ? match[1] : "153";
    
    if (isEdge) {
      headers["sec-ch-ua"] = `"Microsoft Edge";v="${version}", "Chromium";v="${version}", "Not?A_Brand";v="24"`;
    } else {
      headers["sec-ch-ua"] = `"Google Chrome";v="${version}", "Chromium";v="${version}", "Not?A_Brand";v="24"`;
    }
    headers["sec-ch-ua-mobile"] = "?0";
    headers["sec-ch-ua-platform"] = isMac ? '"macOS"' : '"Windows"';
  }

  return headers;
}

export async function pingSite(site, env) {
  // 1. 同一批次的探测任务生成 0~15 秒随机抖动，防止并发高频发包被 WAF 拦截
  const delayMs = getRandomDelay(0, 15000); 
  await new Promise(r => setTimeout(r, delayMs));

  // 2. 提取用户自定义 UA，若无则从指纹引擎中动态抽取最新版特征
  let ua = site.custom_ua;
  if (!ua || ua.trim() === '') {
    const uas = generateUAPool(10);
    ua = uas[Math.floor(Math.random() * uas.length)];
  }

  // 3. 将 UA 送入伪装引擎，构建全套 HTTP 头部
  const stealthHeaders = buildStealthHeaders(ua);
  const startTime = Date.now();
  let statusCode = 0;

  try {
    const res = await fetch(site.url, {
      method: "GET",
      headers: stealthHeaders
    });
    statusCode = res.status;
  } catch (err) {
    statusCode = 500;
  }

  const latency = Date.now() - startTime;
  const now = Date.now();

  // 4. 计算下次执行的偏移时刻（基础周期 - 随机提前窗口）
  const baseMs = site.base_interval_minutes * 60 * 1000;
  const jitterMs = getRandomDelay(0, site.random_window_minutes * 60 * 1000);
  const nextRunAt = now + baseMs - jitterMs;

  // 5. 状态变更拦截器：判断是否需要向 TG 等渠道推送告警
  const previousStatus = site.last_status || 0;
  const isNowDown = statusCode >= 400 || statusCode === 0;
  const wasDown = previousStatus >= 400 || previousStatus === 0;

  if (previousStatus !== 0) { // 忽略第一次录入时的状态突变
    if (!wasDown && isNowDown) await sendNotification(site, statusCode, 'DOWN');
    if (wasDown && !isNowDown) await sendNotification(site, statusCode, 'UP');
  }

  // 6. 批量异步写入 Cloudflare D1 数据库
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE sites 
      SET next_run_at = ?, last_run_at = ?, last_status = ?, last_latency = ? 
      WHERE id = ?
    `).bind(nextRunAt, now, statusCode, latency, site.id),
    env.DB.prepare(`
      INSERT INTO logs (site_id, status_code, response_time, executed_at, used_ua) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(site.id, statusCode, latency, now, ua)
  ]);
}