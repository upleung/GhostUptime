import { handleApiRequest } from './api/router.js';
import { pingSite } from './core/ping.js';

export default {
  // 1. Cron 触发器执行入口 (每分钟自动拉起)
  async scheduled(event, env, ctx) {
    const now = Date.now();
    const { results: sites } = await env.DB.prepare(
      `SELECT * FROM sites WHERE status = 'active' AND next_run_at <= ?`
    ).bind(now).all();

    if (sites && sites.length > 0) {
      ctx.waitUntil(Promise.all(sites.map(site => pingSite(site, env))));
    }
  },

  // 2. 网页端交互与 API 响应入口
  async fetch(req, env, ctx) {
    return await handleApiRequest(req, env, ctx);
  }
};