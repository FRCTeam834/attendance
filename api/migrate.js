import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    // Create sessions with ONLY start_at/end_at (idempotent)
    await sql/*sql*/`
      CREATE TABLE IF NOT EXISTS sessions (
        id       BIGSERIAL PRIMARY KEY,
        name     TEXT NOT NULL,
        start_at TIMESTAMPTZ,
        end_at   TIMESTAMPTZ
      )
    `;
    // Ensure required columns exist even if table was created differently before
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ`;
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_at   TIMESTAMPTZ`;

    // Only one open session per name (based on end_at only)
    await sql/*sql*/`
      CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_open_per_name
      ON sessions(name) WHERE end_at IS NULL
    `;

    // Totals table
    await sql`CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY)`;
    const hasTotal = await sql/*sql*/`
      SELECT 1 FROM information_schema.columns
      WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
    `;
    if (hasTotal.length === 0) {
      await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
    } else {
      const t = await sql/*sql*/`
        SELECT data_type FROM information_schema.columns
        WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
      `;
      if (t.length && t[0].data_type !== 'bigint') {
        await sql`ALTER TABLE totals ALTER COLUMN total_seconds TYPE BIGINT USING total_seconds::bigint`;
      }
    }

    res.status(200).json({ ok: true, message: 'migrations/repairs applied' });
  } catch (e) {
    console.error('migrate error', e);
    res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
