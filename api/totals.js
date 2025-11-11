// api/totals.js
const db = require("./_db");

module.exports = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT name, total_minutes, (last_checkin IS NOT NULL) AS is_logged_in
         FROM attendance_totals
         ORDER BY name ASC;`
    );
    res.status(200).json({ ok: true, totals: result.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
