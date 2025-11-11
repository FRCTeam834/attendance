import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    const r = await sql`SELECT now() AS ts`;
    res.status(200).json({ ok: true, now: r[0].ts });
  } catch (e) {
    console.error('health error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
