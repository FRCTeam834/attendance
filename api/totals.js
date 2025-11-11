// api/totals.js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql/*sql*/`
      SELECT
        name,
        COALESCE(
          SUM(duration_seconds),
          SUM(EXTRACT(EPOCH FROM (checkout - checkin))::bigint)
        ) AS total_seconds
      FROM sessions
      WHERE checkout IS NOT NULL
      GROUP BY name
      ORDER BY name;
    `;
    res.status(200).json(rows);
  } catch (err) {
    console.error('totals error:', err);
    res.status(500).json({ error: 'Failed to load totals' });
  }
}
