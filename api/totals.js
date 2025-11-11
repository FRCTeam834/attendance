// api/totals.js
const { sql, ensure } = require('./_db');

module.exports = async (_req, res) => {
  try {
    await ensure();
    const rows = await sql/* sql */`SELECT name, total_minutes FROM totals ORDER BY name;`;
    res.json({ ok: true, totals: rows });
  } catch (e) {
    console.error(e);
    res.status
  }}