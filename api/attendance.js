// api/attendance.js
const { pool } = require('./_db');

// ONE TABLE schema idea:
// CREATE TABLE totals (
//   name TEXT PRIMARY KEY,
//   total_minutes INTEGER NOT NULL DEFAULT 0,
//   is_checked_in BOOLEAN NOT NULL DEFAULT FALSE,
//   last_checkin TIMESTAMPTZ
// );

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // optional: return current totals
    try {
      const { rows } = await pool.query(
        `SELECT name, total_minutes, is_checked_in, last_checkin
         FROM totals
         ORDER BY name`
      );
      return res.status(200).json(rows);
    } catch (e) {
      if (String(e).includes('relation "totals" does not exist')) {
        return res.status(400).json({
          error: 'Table "totals" not found. Run the migration SQL shown in /api/migrate (see below).',
        });
      }
      return res.status(500).json({ error: String(e) });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST { name, action }' });
  }

  try {
    const { name, action } = req.body || {};
    if (!name || !action) {
      return res.status(400).json({ error: 'Missing name or action' });
    }

    if (action === 'Sign In') {
      // Upsert row; if already checked in, do nothing
      const upsert = `
        INSERT INTO totals (name, total_minutes, is_checked_in, last_checkin)
        VALUES ($1, 0, TRUE, NOW())
        ON CONFLICT (name)
        DO UPDATE SET
          last_checkin = CASE WHEN totals.is_checked_in = FALSE THEN NOW() ELSE totals.last_checkin END,
          is_checked_in = TRUE
        RETURNING name, total_minutes, is_checked_in, last_checkin;
      `;
      const { rows } = await pool.query(upsert, [name]);
      return res.status(200).json({ message: 'Checked in', record: rows[0] });
    }

    if (action === 'Sign Out') {
      // Add elapsed minutes (now - last_checkin) if currently checked in
      const update = `
        UPDATE totals
        SET
          total_minutes = CASE
            WHEN is_checked_in = TRUE AND last_checkin IS NOT NULL
            THEN total_minutes + CEIL(EXTRACT(EPOCH FROM (NOW() - last_checkin))/60.0)::int
            ELSE total_minutes
          END,
          is_checked_in = FALSE,
          last_checkin = NULL
        WHERE name = $1
        RETURNING name, total_minutes, is_checked_in, last_checkin;
      `;
      const { rows } = await pool.query(update, [name]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Name not found. Check in first.' });
      }
      return res.status(200).json({ message: 'Checked out', record: rows[0] });
    }

    return res.status(400).json({ error: 'Unknown action (use "Sign In" or "Sign Out")' });
  } catch (e) {
    if (String(e).includes('relation "totals" does not exist')) {
      return res.status(400).json({
        error: 'Table "totals" not found. Run the migration SQL shown in /api/migrate (see below).',
      });
    }
    return res.status(500).json({ error: String(e) });
  }
};
