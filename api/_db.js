// Simple Postgres helper (Node on Vercel)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end()
};
