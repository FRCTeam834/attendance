// api/checkout.js
const db = require("./_db");

module.exports = async (req, res) => {
  try {
    const { name } = (req.method === "POST" ? req.body : req.query) || {};
    if (!name || !name.trim()) return res.status(400).json({ ok: false, error: "Missing name" });

    const n = name.trim();

    // Grab last_checkin and total
    const current = await db.query(
      `SELECT name, total_minutes, last_checkin FROM attendance_totals WHERE name = $1;`,
      [n]
    );
    if (current.rowCount === 0) {
      return res.status(400).json({ ok: false, error: "User has no record. Login first." });
    }

    const row = current.rows[0];
    if (!row.last_checkin) {
      return res.status(400).json({ ok: false, error: "User is not currently logged in." });
    }

    // Compute minutes between now and last_checkin
    const diffRes = await db.query(`SELECT EXTRACT(EPOCH FROM (NOW() - $1)) AS seconds;`, [row.last_checkin]);
    const minutes = Math.max(0, Math.round(diffRes.rows[0].seconds / 60));

    const updated = await db.query(
      `UPDATE attendance_totals
          SET total_minutes = total_minutes + $2,
              last_checkin = NULL
        WHERE name = $1
        RETURNING name, total_minutes;`,
      [n, minutes]
    );

    res.status(200).json({ ok: true, name: updated.rows[0].name, added_minutes: minutes, total_minutes: updated.rows[0].total_minutes });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
