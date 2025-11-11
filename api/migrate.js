// api/migrate.js
import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    // Allow GET or POST to run migrations
    if (!['GET', 'POST'].includes((req.method || 'GET').toUpperCase())) {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // --- 1) Ensure sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id       BIGSERIAL PRIMARY KEY,
        name     TEXT NOT NULL,
        start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        end_at   TIMESTAMPTZ
      )
    `;

    // Helpful index for open sessions
    await sql`CREATE INDEX IF NOT EXISTS sessions_open_idx ON sessions (name) WHERE end_at IS NULL`;

    // --- 2) Ensure totals table exists
    await sql`
      CREATE TABLE IF NOT EXISTS totals (
        name TEXT PRIMARY KEY
      )
    `;

    // --- 3) Make sure totals.total_seconds exists
    const hasTotalSeconds = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'totals' AND column_name = 'total_seconds'
      LIMIT 1
    `;
    if (hasTotalSeconds.length === 0) {
      await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
    }

    // --- 4) Upgrade totals.total_seconds to BIGINT if it isn't already
    const colType = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name='totals' AND column_name='total_seconds'
      LIMIT 1
    `;
    if (colType.length && colType[0].data_type !== 'bigint') {
      await sql`ALTER TABLE totals ALTER COLUMN total_seconds TYPE BIGINT USING total_seconds::bigint`;
    }

    // --- 5) OPTIONAL: Migrate from legacy attendance_totals(total_minutes)
    // If you previously used attendance_totals with total_minutes, pull that data in.
    const hasLegacy = await sql`
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'attendance_totals'
      LIMIT 1
    `;
    if (hasLegacy.length) {
      const hasMinutes = await sql`
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'attendance_totals' AND column_name = 'total_minutes'
        LIMIT 1
      `;
      if (hasMinutes.length) {
        // Insert or update totals with converted seconds
        await sql`
          INSERT INTO totals(name, total_seconds)
          SELECT name, (COALESCE(total_minutes,0)::bigint * 60)
          FROM attendance_totals
          ON CONFLICT (name)
          DO UPDATE SET total_seconds = GREATEST(totals.total_seconds, EXCLUDED.total_seconds)
        `;
      }
    }

    return res.status(200).json({ ok: true, message: 'migrations/repairs applied' });
  } catch (e) {
    console.error('migrate error', e);
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
