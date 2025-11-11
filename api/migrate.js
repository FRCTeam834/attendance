import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    // Accept GET/POST to run migrations
    const m = (req.method || 'GET').toUpperCase();
    if (!['GET', 'POST'].includes(m)) return res.status(405).json({ ok:false, error:'Method Not Allowed' });

    // sessions
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id       BIGSERIAL PRIMARY KEY,
        name     TEXT NOT NULL,
        start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        end_at   TIMESTAMPTZ
      )
    `;

    // totals (add column if missing)
    await sql`CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY)`;
    const hasCol = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
    `;
    if (hasCol.length === 0) {
      await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
    } else {
      const t = await sql`
        SELECT data_type FROM information_schema.columns
        WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
      `;
      if (t.length && t[0].data_type !== 'bigint') {
        await sql`ALTER TABLE totals ALTER COLUMN total_seconds TYPE BIGINT USING total_seconds::bigint`;
      }
    }

    // Only one open session per name
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS sessions_one_open_per_name ON sessions(name) WHERE end_at IS NULL`;

    // Helpful: index to find recent sessions
    await sql`CREATE INDEX IF NOT EXISTS sessions_by_name_time ON sessions(name, start_at DESC)`;

    res.status(200).json({ ok:true, message:'migrations/repairs applied' });
  } catch (e) {
    console.error('migrate error', e);
    res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
