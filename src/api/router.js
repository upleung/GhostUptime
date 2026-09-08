import { getHtmlDashboard } from '../views/dashboard.js';
import { generateUAPool } from '../core/ua.js';
import { pingSite } from '../core/ping.js';

export async function handleApiRequest(req, env, ctx) {
  const url = new URL(req.url);

  if (url.pathname === "/api/sites" && req.method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM sites ORDER BY id DESC").all();
    return Response.json(results);
  }

  if (url.pathname === "/api/sites" && req.method === "POST") {
    const body = await req.json();
    const baseMins = parseInt(body.base_interval_minutes, 10);
    const windowMins = parseInt(body.random_window_minutes || 0, 10);
    await env.DB.prepare(`
      INSERT INTO sites (name, url, base_interval_minutes, random_window_minutes, next_run_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(body.name, body.url, baseMins, windowMins, Date.now()).run();
    return Response.json({ success: true });
  }

  if (url.pathname === "/api/sites" && req.method === "DELETE") {
    const id = url.searchParams.get("id");
    await env.DB.prepare("DELETE FROM sites WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  }

  if (url.pathname === "/api/sites/test" && req.method === "POST") {
    const id = url.searchParams.get("id");
    const site = await env.DB.prepare("SELECT * FROM sites WHERE id = ?").bind(id).first();
    if (site) {
      ctx.waitUntil(pingSite(site, env));
      return Response.json({ success: true });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (url.pathname === "/api/ua/generate") {
    const count = parseInt(url.searchParams.get("count") || 10, 10);
    return Response.json(generateUAPool(count));
  }

  return new Response(getHtmlDashboard(), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}