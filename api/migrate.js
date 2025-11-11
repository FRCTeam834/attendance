import sql from './_db.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    await sql`
      create table if not exists sessions (
        id bigserial primary key,
        name text not null,
        start_at timestamptz not null default now(),
        end_at timestamptz
      );
    `;
    await sql`
      create table if not exists totals (
        name text primary key,
        total_seconds bigint not null default 0
      );
    `;
    return res.status(200).json({ ok: true, message: 'migrations complete' });
  } catch (err) {
    console.error('migrate error', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
