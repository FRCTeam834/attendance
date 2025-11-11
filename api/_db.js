// api/_db.js
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

// Ensure table exists (one table only)
async function ensure() {
  await sql/* sql */`
    CREATE TABLE IF NOT EXISTS totals (
      name TEXT PRIMARY KEY,
      total_minutes INTEGER NOT NULL DEFAULT 0,
      last_checkin TIMESTAMPTZ
    );
  `;
}

module.exports = { sql, ensure };
