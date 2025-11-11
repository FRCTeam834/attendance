import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'GET') {
      const rows = await sql`
        SELECT name, total_seconds
        FROM totals
        ORDER BY name
      `;
      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const { name, action } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!name || !action) return res.status(400).json({ error: 'Missing name or action' });

      if (action === 'Sign In') {
        // Prevent double sign-in: only create a new session if there isn't an open one
        const inserted = await sql`
          WITH open AS (
            SELECT id FROM sessions WHERE name = ${name} AND end_at IS NULL LIMIT 1
          )
          INSERT INTO sessions (name, start_at)
          SELECT ${name}, now()
          WHERE NOT EXISTS (SELECT 1 FROM open)
          RETURNING id, name, start_at
        `;
        if (inserted.length === 0) {
          return res.status(409).json({ error: 'Already signed in' });
        }
        return res.status(200).json({ message: `Signed in ${name}`, session: inserted[0] });
      }

      if (action === 'Sign Out') {
        // Close latest open session and upsert totals in ONE statement
        const r = await sql`
          WITH closed AS (
            UPDATE sessions
               SET end_at = now()
             WHERE id = (
               SELECT id FROM sessions
                WHERE name = ${name} AND end_at IS NULL
                ORDER BY start_at DESC
                LIMIT 1
             )
             RETURNING name, EXTRACT(EPOCH FROM (end_at - start_at))::bigint AS secs
          ),
          upsert AS (
            INSERT INTO totals (name, total_seconds)
            SELECT name, secs FROM closed
            ON CONFLICT (name)
            DO UPDATE SET total_seconds = totals.total_seconds + EXCLUDED.total_seconds
            RETURNING name, total_seconds
          )
          SELECT * FROM upsert
        `;
        if (r.length === 0) return res.status(404).json({ error: `No open session for ${name}` });
        return res.status(200).json({ message: `Signed out ${name}`, total: r[0] });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('attendance error', err);
    return res.status(500).json({ error: 'FUNCTION_INVOCATION_FAILED', detail: String(err?.message || err) });
  }
}
