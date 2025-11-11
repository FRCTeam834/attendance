import sql from './_db.js';

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  try {
    if (cors(req, res)) return;

    if (req.method === 'GET') {
      // optional: list open sessions
      const open = await sql`select id, name, start_at from sessions where end_at is null order by start_at desc`;
      return res.status(200).json(open);
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, action } = req.body || {};
    if (!name || !action) return res.status(400).json({ error: 'Missing name or action' });

    if (action === 'Sign In') {
      // prevent double sign-in (one open session per person)
      const [{ count }] = await sql`select count(*)::int from sessions where name=${name} and end_at is null`;
      if (count > 0) return res.status(400).json({ error: `${name} already signed in` });

      await sql`insert into sessions (name) values (${name})`;
      return res.status(200).json({ ok: true, message: `${name} signed in` });
    }

    if (action === 'Sign Out') {
      // close the latest open session for this name
      const closed = await sql`
        update sessions
           set end_at = now()
         where id = (
           select id from sessions
            where name = ${name} and end_at is null
            order by start_at desc
            limit 1
         )
        returning name, start_at, end_at
      `;

      if (closed.length === 0) {
        return res.status(400).json({ error: `${name} has no open session` });
      }

      const { start_at, end_at } = closed[0];
      const seconds = Math.max(0, Math.floor((new Date(end_at) - new Date(start_at)) / 1000));

      // upsert into totals
      await sql`
        insert into totals (name, total_seconds)
        values (${name}, ${seconds})
        on conflict (name)
        do update set total_seconds = totals.total_seconds + excluded.total_seconds
      `;

      return res.status(200).json({ ok: true, message: `${name} signed out (+${seconds}s)` });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('attendance error', err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
