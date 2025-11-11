// api/totals.js
const { pool } = require('./_db');

module.exports = async (req, res) => {
  try {
    const q = `SELECT name, total_minutes, is_checked_in, last_checkin
               FROM totals
               ORDER BY name`;
    const { rows } = await pool.query(q);
    res.status(200).json(rows);
  } catch (e) {
    // If the table doesn't exist yet, surface a helpful message
    if (String(e).includes('relation "totals" does not exist')) {
      return res.status(400).json({
        error: 'Table "totals" not found. Run the migration SQL shown in /api/migrate (see below).',
      });
    }
    res.status(500).json({ error: String(e) });
  }
};
