import { sql } from './_db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    // One statement per call (Neon-safe)
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id       BIGSERIAL PRIMARY KEY,
        name     TEXT NOT NULL,
        start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        end_at   TIMESTAMPTZ
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS totals (
        name          TEXT PRIMARY KEY,
        total_seconds BIGINT NOT NULL DEFAULT 0
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS sessions_open_idx ON sessions (name) WHERE end_at IS NULL`;

    res.status(200).json({ ok: true, message: 'migrations applied' });
  } catch (e) {
    console.error('migrate error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
