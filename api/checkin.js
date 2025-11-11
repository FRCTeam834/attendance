// api/checkin.js
const db = require("./_db");

module.exports = async (req, res) => {
  try {
    const { name } = (req.method === "POST" ? req.body : req.query) || {};
    if (!name || !name.trim()) return res.status(400).json({ ok: false, error: "Missing name" });

    const n = name.trim();

    // Ensure row exists
    await db.query(
      `INSERT INTO attendance_totals(name) VALUES ($1)
       ON CONFLICT (name) DO NOTHING;`,
      [n]
    );

    // Only set last_checkin if it is currently NULL (prevent double-login)
    const result = await db.query(
      `UPDATE attendance_totals
         SET last_checkin = COALESCE(last_checkin, NOW())
       WHERE name = $1
       RETURNING name, total_minutes, last_checkin;`,
      [n]
    );

    const row = result.rows[0];
    res.status(200).json({ ok: true, name: row.name, total_minutes: row.total_minutes, last_checkin: row.last_checkin });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
