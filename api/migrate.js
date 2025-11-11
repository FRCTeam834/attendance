// api/migrate.js
const db = require("./_db");

module.exports = async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance_totals (
        name TEXT PRIMARY KEY,
        total_minutes INTEGER NOT NULL DEFAULT 0,
        last_checkin TIMESTAMPTZ NULL
      );
    `);
    res.status(200).json({ ok: true, message: "Table ready: attendance_totals" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
