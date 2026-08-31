/**
 * "Get in touch" relay — Cloudflare Worker
 * ---------------------------------------------------------------------
 * The about screen POSTs { name, contact, message } here and this forwards
 * it to the study team. Adapted from the owner's portfolio relay
 * (g-portfolio/cloudflare-worker/worker.js), which is the shape the web
 * app was already written against.
 *
 * It runs OUTSIDE the platform on purpose. The obvious alternative was a
 * route on the API — same origin, one less service — but every /v1 route
 * sits behind the auth middleware, and this has to answer somebody who
 * cannot sign in. Carving an unauthenticated POST out of the middleware
 * that protects participants' records, on the service that holds them, is
 * a larger thing than a contact form should ever be. Out here the worst a
 * flood can do is fill an inbox.
 *
 * Secrets live in Cloudflare and never in this repository or the bundle:
 *   BOT_TOKEN   Telegram bot token (@BotFather)
 *   CHAT_ID     where messages land
 * Variables:
 *   ALLOWED_ORIGIN  comma-separated origins allowed to post. REQUIRED.
 *
 * **What crosses this boundary.** A participant was invited to write
 * freely, so a message may carry health information, distress, or somebody
 * else's name. Nothing here logs the body, and nothing should be added
 * that does.
 */

const MAX_MESSAGE = 4000;
const MAX_FIELD = 200;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    /*
     * An unconfigured ALLOWED_ORIGIN refuses, where the portfolio's version
     * echoes the caller's own origin. That default makes the relay usable
     * from any site on the web — fine for a personal contact form, and here
     * it would mean anybody's page could post into the study team's inbox
     * wearing this project's name. Deployed without the variable, this
     * answers nothing at all, which is the safe direction to fail.
     */
    if (allowed.length === 0) {
      return json({ ok: false, error: 'Relay not configured' }, 500, { 'Access-Control-Allow-Origin': 'null' });
    }
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, cors);
    if (!allowed.includes(origin)) return json({ ok: false, error: 'Origin not allowed' }, 403, cors);

    /*
     * Optional rate limit. Bound, it caps how fast one address can post;
     * unbound, this is a no-op and Cloudflare's own protections are all
     * there is. Written as optional so the relay deploys and works before
     * anybody configures it, rather than being a step that gets skipped and
     * silently leaves nothing in its place.
     */
    if (env.RATE_LIMITER) {
      const who = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: who });
      if (!success) return json({ ok: false, error: 'Too many messages' }, 429, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, cors);
    }

    // Honeypot: a bot fills the hidden field, a person never sees it.
    if (body.website) return json({ ok: true }, 200, cors);

    const message = str(body.message);
    const name = str(body.name);
    const contact = str(body.contact);

    if (!message) return json({ ok: false, error: 'Message is required' }, 400, cors);
    /*
     * Refused, not trimmed. The portfolio relay slices to the limit and
     * forwards what survived, so a long message arrives with the end
     * missing and nobody is told. On a platform whose promise is that
     * somebody's words stay their words, that is the wrong failure — and
     * the browser already refuses at these same numbers, so the two agree
     * and a message either arrives whole or does not arrive.
     */
    if (message.length > MAX_MESSAGE || name.length > MAX_FIELD || contact.length > MAX_FIELD) {
      return json({ ok: false, error: 'Too long' }, 413, cors);
    }

    if (!env.BOT_TOKEN || !env.CHAT_ID) {
      return json({ ok: false, error: 'Relay not configured' }, 500, cors);
    }

    const text =
      `📬 A message from the icareu about page\n\n` +
      `👤 Name: ${name || 'Not given'}\n` +
      `✉️ Reply to: ${contact || 'NOT GIVEN — this person cannot be answered'}\n\n` +
      `💬 ${message}`;

    const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text, disable_web_page_preview: true }),
    });
    if (!res.ok) return json({ ok: false, error: 'Delivery failed' }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function corsHeaders(origin, allowed) {
  return {
    // The caller's origin only when it is on the list; otherwise the first
    // configured origin, so a disallowed caller gets a header it cannot use.
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
