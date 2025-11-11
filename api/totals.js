import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    const rows = await sql`
      SELECT name, total_seconds
      FROM totals
      ORDER BY name
    `;
    res.status(200).json(rows);
  } catch (e) {
    console.error('totals error', e);
    res.status(500).json({ error: 'Failed to load totals' });
  }
}
