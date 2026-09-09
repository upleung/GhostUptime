import { generateUAPool, getRandomDelay } from './ua.js';
import { sendNotification } from './notify.js';

export async function pingSite(site, env) {
  const delayMs = getRandomDelay(0, 15000); 
  await new Promise(r => setTimeout(r, delayMs));

  // 核心逻辑：优先使用用户自定义的固定请求头 UA，否则从引擎抽取
  let ua = site.custom_ua;
  if (!ua || ua.trim() === '') {
    const uas = generateUAPool(10);
    ua = uas[Math.floor(Math.random() * uas.length)];
  }

  const startTime = Date.now();
  let statusCode = 0;

  try {
    const res = await fetch(site.url, {
      method: "GET",
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "max-age=0"
      }
    });
    statusCode = res.status;
  } catch (err) {
    statusCode = 500;
  }

  const latency = Date.now() - startTime;
  const now = Date.now();

  const baseMs = site.base_interval_minutes * 60 * 1000;
  const jitterMs = getRandomDelay(0, site.random_window_minutes * 60 * 1000);
  const nextRunAt = now + baseMs - jitterMs;

  // 状态变更检测与告警拦截
  const previousStatus = site.last_status || 0;
  const isNowDown = statusCode >= 400 || statusCode === 0;
  const wasDown = previousStatus >= 400 || previousStatus === 0;

  if (previousStatus !== 0) { // 忽略首次加载
    if (!wasDown && isNowDown) await sendNotification(site, statusCode, 'DOWN');
    if (wasDown && !isNowDown) await sendNotification(site, statusCode, 'UP');
  }

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