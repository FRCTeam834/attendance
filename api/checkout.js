// api/checkout.js
const { sql, ensure } = require('./_db');

module.exports = async (req, res) => {
  try {
    await ensure();

    const name = (req.query.name || req.body?.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'Missing name' });

    // Get last_checkin; if absent, nothing to add
    const current = await sql/* sql */`SELECT last_checkin, total_minutes FROM totals WHERE name = ${name};`;

    if (!current.length || !current[0].last_checkin) {
      return res.status(400).json({ ok: false, error: 'Not currently checked in' });
    }

    const last = new Date(current[0].last_checkin).getTime();
    const now  = Date.now();
    const minutes = Math.max(0, Math.round((now - last) / 60000));

    const row = await sql/* sql */`
      UPDATE totals
      SET total_minutes = total_minutes + ${minutes},
          last_checkin = NULL
      WHERE name = ${n
