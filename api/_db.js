const { neon } = require('@neondatabase/serverless');

let _sql;
function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is missing');
    _sql = neon(url);
  }
  return _sql;
}

let _schemaReady = false;
async function ensureSchema() {
  if (_schemaReady) return;
  const db = sql();

  // One-table design with running totals + current session info
  await db/* sql */`
    create table if not exists attendance_totals (
      id serial primary key,
      name text not null unique,
      total_seconds bigint not null default 0,
      is_checked_in boolean not null default false,
      last_checkin timestamptz
    );
  `;

  _schemaReady = true;
}

module.exports = { sql, ensureSchema };
