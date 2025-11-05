import { db } from './database.js';

export default async function handler(req, res) {
  const sql = await db();

  if (req.method === 'GET') {
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 1000);
    const rows = await sql/*sql*/`
      SELECT id, name, action, ts
      FROM attendance
      ORDER BY ts DESC
      LIMIT ${limit};
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    try {
      const { name, action } = req.body || {};
      if (!name || !action) return res.status(400).json({ error: 'Missing name or action.' });
      if (action !== 'Sign In' && action !== 'Sign Out') return res.status(400).json({ error: 'Invalid action.' });
      await sql/*sql*/`INSERT INTO attendance (name, action) VALUES (${name}, ${action});`;
      return res.status(200).json({ message: `${name} ${action} recorded.` });
    } catch {
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
