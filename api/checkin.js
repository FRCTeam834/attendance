import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    const { name } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!name || !name.trim()) return res.status(400).json({ ok: false, error: 'Missing name' });

    const n = name.trim();

    const inserted = await sql`
      WITH open AS (
        SELECT id FROM sessions WHERE name = ${n} AND end_at IS NULL LIMIT 1
      )
      INSERT INTO sessions (name, start_at)
      SELECT ${n}, now()
      WHERE NOT EXISTS (SELECT 1 FROM open)
      RETURNING id, name, start_at
    `;

    if (inserted.length === 0) return res.status(409).json({ ok: false, error: 'Already signed in' });
    res.status(200).json({ ok: true, session: inserted[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
