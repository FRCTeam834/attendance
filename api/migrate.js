// api/migrate.js
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'content-type': 'application/json' } });

export default async function handler() {
  try {
    // One statement per call — do not chain with semicolons
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id         serial PRIMARY KEY,
        name       text   NOT NULL,
        start_at   timestamptz NOT NULL DEFAULT now(),
        end_at     timestamptz
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS totals (
        name          text PRIMARY KEY,
        total_seconds integer NOT NULL DEFAULT 0
      )
    `;

    // Optional helpful index
    await sql`CREATE INDEX IF NOT EXISTS sessions_open_idx ON sessions (name) WHERE end_at IS NULL`;

    return json({ ok: true, message: 'migrations applied' });
  } catch (e) {
    console.error('migrate error', e);
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
