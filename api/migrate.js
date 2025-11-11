const { sql } = require("./_db");

module.exports = async (_req, res) => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS attendance_totals (
        name TEXT PRIMARY KEY,
        total_seconds BIGINT NOT NULL DEFAULT 0,
        last_checkin TIMESTAMPTZ
      );
    `;
    res.status(200).json({ ok: true, created: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
