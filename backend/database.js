import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) throw new Error('Missing DATABASE_URL (or POSTGRES_URL)');

const sql = neon(connectionString);

async function ensureSchema() {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS attendance (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('Sign In','Sign Out')),
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_attendance_ts ON attendance (ts DESC);
    CREATE INDEX IF NOT EXISTS idx_attendance_name ON attendance (name);
  `;
}

let ready;
export async function getSql() {
  if (!ready) ready = ensureSchema();
  await ready;
  return sql;
}
