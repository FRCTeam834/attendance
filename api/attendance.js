// api/attendance.js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Helper to send JSON
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' }
});

export default async function handler(req, res) {
  try {
    const urlMethod = (req.method || 'GET').toUpperCase();

    if (urlMethod === 'GET') {
      // Return current totals (single statement)
      const rows = await sql`
        SELECT name, total_seconds
        FROM totals
        ORDER BY name
      `;
      return json(rows);
    }

    if (urlMethod === 'POST') {
      const { name, action } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!name || !action) return json({ error: 'Missing name or action' }, 400);

      if (action === 'Sign In') {
        // Start a new session (single statement)
        const r = await sql`
          INSERT INTO sessions (name, start_at)
          VALUES (${name}, now())
          RETURNING id, name, start_at
        `;
        return json({ message: `Signed in ${name}`, session: r[0] });
      }

      if (action === 'Sign Out') {
        // Close the latest open session and upsert totals in ONE statement using CTEs
        const r = await sql`
          WITH closed AS (
            UPDATE sessions
            SET end_at = now()
            WHERE id = (
              SELECT id
              FROM sessions
              WHERE name = ${name} AND end_at IS NULL
              ORDER BY start_at DESC
              LIMIT 1
            )
            RETURNING name, EXTRACT(EPOCH FROM (end_at - start_at))::int AS secs
          ),
          upsert AS (
            INSERT INTO totals (name, total_seconds)
            SELECT name, secs FROM closed
            ON CONFLICT (name)
            DO UPDATE SET total_seconds = totals.total_seconds + EXCLUDED.total_seconds
            RETURNING name, total_seconds
          )
          SELECT * FROM upsert
        `;

        if (!r.length) return json({ error: `No open session found for ${name}` }, 404);
        return json({ message: `Signed out ${name}`, total: r[0] });
      }

      return json({ error: 'Unknown action' }, 400);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err) {
    console.error('attendance error', err);
    return json({ error: 'FUNCTION_INVOCATION_FAILED', detail: String(err?.message || err) }, 500);
  }
}
