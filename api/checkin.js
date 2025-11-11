// api/checkin.js
const { sql, ensure } = require('./_db');

module.exports = async (req, res) => {
  try {
    await ensure();

    const name = (req.query.name || req.body?.name || '').trim();
    if (!name) return res.status(400).json({ ok: false, error: 'Missing name' });

    // Set last_checkin only if not already checked in
    const now = new Date().toISOString();
    const row = await sql/* sql */`
      INSERT INTO totals (name, total_minutes, last_checkin)
      VALUES (${name}, 0, ${now})
      ON CONFLICT (name) DO UPDATE
      SET last_checkin = COALESCE(totals.last_checkin, EXCLUDED.last_checkin)
      RETURNING name, total_minutes, last_checkin;
    `;

    res.json({ ok: true, ...row[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
};
