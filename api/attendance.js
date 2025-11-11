// api/attendance.js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    // Ensure sessions table exists (safe if already created)
    await sql/*sql*/`
      CREATE TABLE IF NOT EXISTS sessions (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        checkin TIMESTAMPTZ DEFAULT now(),
        checkout TIMESTAMPTZ,
        duration_seconds BIGINT
      );
      CREATE INDEX IF NOT EXISTS sessions_name_open_idx
        ON sessions (name) WHERE checkout IS NULL;
    `;

    if (req.method === 'POST') {
      const { name, action } = req.body || {};
      if (!name || !action) {
        return res.status(400).json({ error: 'Missing name or action' });
      }

      if (action === 'Sign In') {
        // Prevent double sign-in: if an open session exists, block
        const open = await sql/*sql*/`
          SELECT id FROM sessions
          WHERE name = ${name} AND checkout IS NULL
          ORDER BY checkin DESC
          LIMIT 1;
        `;
        if (open.length > 0) {
          return res
            .status(400)
            .json({ error: `${name} is already signed in.` });
        }
        await sql/*sql*/`
          INSERT INTO sessions (name, checkin)
          VALUES (${name}, now());
        `;
        return res.status(200).json({ message: `Signed in ${name}.` });
      }

      if (action === 'Sign Out') {
        // Find latest open session and close it
        const open = await sql/*sql*/`
          SELECT id, checkin FROM sessions
          WHERE name = ${name} AND checkout IS NULL
          ORDER BY checkin DESC
          LIMIT 1;
        `;
        if (open.length === 0) {
          return res
            .status(400)
            .json({ error: `${name} has no open session to sign out.` });
        }
        const { id } = open[0];
        await sql/*sql*/`
          UPDATE sessions
          SET checkout = now(),
              duration_seconds = EXTRACT(EPOCH FROM (now() - checkin))::bigint
          WHERE id = ${id};
        `;
        return res.status(200).json({ message: `Signed out ${name}.` });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'GET') {
      // Return recent sessions so your UI can show something if needed
      const rows = await sql/*sql*/`
        SELECT id, name, checkin, checkout, duration_seconds
        FROM sessions
        ORDER BY checkin DESC
        LIMIT 100;
      `;
      return res.status(200).json(rows);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('attendance error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
