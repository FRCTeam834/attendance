import { sql } from "./_db.js";

export default async function handler(req, res) {
  try {
    const [{ ts }] = await sql`select now() as ts`;
    res.status(200).json({ ok: true, ts });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
