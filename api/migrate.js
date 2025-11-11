import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    // sessions table (supports both new & legacy columns)
    await sql`CREATE TABLE IF NOT EXISTS sessions (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      start_at TIMESTAMPTZ,
      end_at TIMESTAMPTZ,
      checkin TIMESTAMPTZ,
      checkout TIMESTAMPTZ,
      duration_seconds BIGINT
    )`;

    // keep just one open session per name
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_open_per_name
              ON sessions(name) WHERE (end_at IS NULL OR checkout IS NULL)`;

    // totals table + column
    await sql`CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY)`;
    const hasTotal = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1`;
    if (hasTotal.length === 0) {
      await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
    } else {
      const t = await sql`
        SELECT data_type FROM information_schema.columns
        WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1`;
      if (t.length && t[0].data_type !== 'bigint') {
        await sql`ALTER TABLE totals ALTER COLUMN total_seconds TYPE BIGINT USING total_seconds::bigint`;
      }
    }

    res.status(200).json({ ok: true, message: "migrations/repairs applied" });
  } catch (e) {
    console.error('migrate error', e);
    res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
