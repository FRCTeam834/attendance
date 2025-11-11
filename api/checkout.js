import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    const { name } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!name || !name.trim()) return res.status(400).json({ ok: false, error: 'Missing name' });

    const n = name.trim();

    const r = await sql`
      WITH closed AS (
        UPDATE sessions
           SET end_at = now()
         WHERE id = (
           SELECT id FROM sessions
            WHERE name = ${n} AND end_at IS NULL
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

    if (r.length === 0) return res.status(404).json({ ok: false, error: `No open session for ${n}` });
    res.status(200).json({ ok: true, total: r[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
