import { generateUAPool, getRandomDelay } from './ua.js';

export async function pingSite(site, env) {
  // 随机错峰 0~15秒
  const delayMs = getRandomDelay(0, 15000); 
  await new Promise(r => setTimeout(r, delayMs));

  const uas = generateUAPool(10);
  const ua = uas[Math.floor(Math.random() * uas.length)];
  const startTime = Date.now();
  let statusCode = 0;

  try {
    const res = await fetch(site.url, {
      method: "GET",
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1"
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