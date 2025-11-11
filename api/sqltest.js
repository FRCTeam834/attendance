import { Client } from 'pg';

export default async function handler(req, res) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return res.status(500).json({ error: 'Missing DATABASE_URL' });
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }});
  try {
    await client.connect();
    const r = await client.query('select now() as ts, current_database() as db, current_user as usr');
    res.status(200).json({ ok: true, row: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  } finally {
    try { await client.end(); } catch {}
  }
}
