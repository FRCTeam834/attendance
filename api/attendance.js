import { sql } from './_db.js';

function parseBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body || {};
}

export default async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();

    // GET totals
    if (method === 'GET') {
      const rows = await sql`SELECT name, total_seconds FROM totals ORDER BY name`;
      return res.status(200).json(rows);
    }

    if (method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { name, action } = parseBody(req);
    if (!name || !action) return res.status(400).json({ error: 'Missing name or action' });

    // SIGN IN — ensure no open session (end_at is NULL)
    if (action === 'Sign In') {
      const open = await sql/*sql*/`
        SELECT 1 FROM sessions WHERE name=${name} AND end_at IS NULL LIMIT 1
      `;
      if (open.length) return res.status(409).json({ error: 'Already signed in' });

      const inserted = await sql/*sql*/`
        INSERT INTO sessions (name, start_at, end_at)
        VALUES (${name}, now(), NULL)
        RETURNING id, name, start_at
      `;
      return res.status(200).json({ message:`Signed in ${name}`, session: inserted[0] });
    }

    // SIGN OUT — close latest open session and add to totals
    if (action === 'Sign Out') {
      const closed = await sql/*sql*/`
        UPDATE sessions
           SET end_at = now()
         WHERE id = (
           SELECT id FROM sessions
            WHERE name=${name} AND end_at IS NULL
            ORDER BY start_at DESC
            LIMIT 1
         )
         RETURNING EXTRACT(EPOCH FROM (end_at - start_at))::bigint AS secs
      `;
      if (closed.length === 0) return res.status(404).json({ error:`No open session for ${name}` });

      const added = Number(closed[0].secs || 0);
      await sql`INSERT INTO totals (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
      const up = await sql/*sql*/`
        UPDATE totals SET total_seconds = total_seconds + ${added}
        WHERE name=${name}
        RETURNING name, total_seconds
      `;
      return res.status(200).json({ message:`Signed out ${name}`, added_seconds: added, total: up[0] });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'Already signed in (unique index)' });
    console.error('attendance error', e);
    return res.status(500).json({ error: 'FUNCTION_INVOCATION_FAILED', detail: String(e?.message || e) });
  }
}
