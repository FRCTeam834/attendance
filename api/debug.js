import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    const { name } = typeof req.query === 'object' ? req.query : {};
    if (!name) return res.status(400).json({ ok:false, error:'Pass ?name=Your Name' });

    const latest = await sql`
      SELECT id, name, start_at, end_at,
             CASE WHEN end_at IS NULL THEN NULL
                  ELSE EXTRACT(EPOCH FROM (end_at - start_at))::bigint
             END AS secs
      FROM sessions
      WHERE name = ${name}
      ORDER BY start_at DESC
      LIMIT 3
    `;

    const tot = await sql`SELECT name, total_seconds FROM totals WHERE name = ${name}`;

    // Also include DB identity to catch “wrong DB URL” issues
    const ident = await sql`SELECT current_database() AS db, current_user AS usr, now() AS now`;

    res.status(200).json({ ok:true, ident: ident[0], latest, totals: tot });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
