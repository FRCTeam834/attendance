// api/attendance.js
import { sql } from './_db.js';

const MAX_SESSION_SECONDS = 7 * 60 * 60; // 10,800 (3 hours)

function parseBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body || {};
}

export default async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();

    // GET: return totals
    if (method === 'GET') {
      const rows = await sql`SELECT name, total_seconds FROM totals ORDER BY name`;
      res.status(200).json(rows);
      return;
    }

    if (method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const { name, action } = parseBody(req);
    if (!name || !action) {
      res.status(400).json({ error: 'Missing name or action' });
      return;
    }

    // SIGN IN: start a session if none is open
    if (action === 'Sign In') {
      const open = await sql`SELECT 1 FROM sessions WHERE name = ${name} AND end_at IS NULL LIMIT 1`;
      if (open.length) {
        res.status(409).json({ error: 'Already signed in' });
        return;
      }
      const r = await sql`
        INSERT INTO sessions (name, start_at, end_at)
        VALUES (${name}, now(), NULL)
        RETURNING id, name, start_at
      `;
      res.status(200).json({ message: `Signed in ${name}`, session: r[0] });
      return;
    }

    // SIGN OUT: close latest open session and add (capped) time to totals
    if (action === 'Sign Out') {
      const r = await sql`
        UPDATE sessions
           SET end_at = now()
         WHERE id = (
           SELECT id FROM sessions
            WHERE name = ${name} AND end_at IS NULL
            ORDER BY start_at DESC
            LIMIT 1
         )
         RETURNING EXTRACT(EPOCH FROM (end_at - start_at))::bigint AS secs
      `;
      if (!r.length) {
        res.status(404).json({ error: `No open session for ${name}` });
        return;
      }

      const rawSeconds = Number(r[0].secs || 0);
      const appliedSeconds = Math.min(Math.max(rawSeconds, 0), MAX_SESSION_SECONDS);

      await sql`INSERT INTO totals (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
      const up = await sql`
        UPDATE totals
           SET total_seconds = total_seconds + ${appliedSeconds}
         WHERE name = ${name}
         RETURNING name, total_seconds
      `;

      res.status(200).json({
        message: `Signed out ${name}`,
        added_seconds: appliedSeconds,
        original_session_seconds: rawSeconds,
        capped: appliedSeconds !== rawSeconds,
        total: up[0]
      });
      return;
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    if (e && e.code === '23505') {
      res.status(409).json({ error: 'Already signed in (unique index)' });
      return;
    }
    console.error('attendance error', e);
    res.status(500).json({ error: 'FUNCTION_INVOCATION_FAILED', detail: String(e?.message || e) });
  }
}
