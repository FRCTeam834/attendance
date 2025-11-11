import sql from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    const [{ now }] = await sql`select now()`;
    return res.status(200).json({ ok: true, now });
  } catch (err) {
    console.error('health error', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
