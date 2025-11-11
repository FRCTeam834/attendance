import sql from './_db.js';

function fmt(seconds) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${h}h ${m}m ${r}s`;
}

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    const rows = await sql`select name, total_seconds from totals order by total_seconds desc, name asc`;
    return res.status(200).json(rows.map(r => ({
      name: r.name,
      total_seconds: Number(r.total_seconds),
      human: fmt(r.total_seconds),
    })));
  } catch (err) {
    console.error('totals error', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
