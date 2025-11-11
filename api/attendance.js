// api/attendance.js
const db = require("./_db");

// Helper to ensure table exists on first hit (saves you from calling /api/migrate manually)
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS attendance_totals (
      name TEXT PRIMARY KEY,
      total_minutes INTEGER NOT NULL DEFAULT 0,
      last_checkin TIMESTAMPTZ NULL
    );
  `);
}

module.exports = async (req, res) => {
  try {
    await ensureTable();

    if (req.method === "GET") {
      const rows = await db.query(
        `SELECT name, total_minutes, (last_checkin IS NOT NULL) AS is_logged_in
           FROM attendance_totals
           ORDER BY name ASC;`
      );
      return res.status(200).json(rows.rows);
    }

    if (req.method === "POST") {
      const { name, action } = req.body || {};
      if (!name || !action) {
        return res.status(400).json({ error: "Missing name or action" });
      }
      const n = String(name).trim();

      // Make sure the row exists
      await db.query(
        `INSERT INTO attendance_totals(name) VALUES ($1)
         ON CONFLICT (name) DO NOTHING;`,
        [n]
      );

      if (action === "Sign In") {
        // Only set last_checkin if not already signed in
        const result = await db.query(
          `UPDATE attendance_totals
              SET last_checkin = COALESCE(last_checkin, NOW())
            WHERE name = $1
            RETURNING name, total_minutes, last_checkin;`,
          [n]
        );

        const row = result.rows[0];
        const already = row && row.last_checkin && new Date(row.last_checkin) < new Date();
        return res.status(200).json({
          ok: true,
          message: already ? `${n} is now signed in.` : `${n} is now signed in.`,
        });
      }

      if (action === "Sign Out") {
        // Need a last_checkin
        const current = await db.query(
          `SELECT name, total_minutes, last_checkin
             FROM attendance_totals
            WHERE name = $1;`,
          [n]
        );

        if (current.rowCount === 0) {
          return res.status(400).json({ error: "No record for this user. Please sign in first." });
        }
        const row = current.rows[0];
        if (!row.last_checkin) {
          return res.status(400).json({ error: "User is not currently signed in." });
        }

        // Compute minutes between now and last_checkin
        const diff = await db.query(
          `SELECT EXTRACT(EPOCH FROM (NOW() - $1)) AS seconds;`,
          [row.last_checkin]
        );
        const minutes = Math.max(0, Math.round(diff.rows[0].seconds / 60));

        const updated = await db.query(
          `UPDATE attendance_totals
              SET total_minutes = total_minutes + $2,
                  last_checkin = NULL
            WHERE name = $1
            RETURNING total_minutes;`,
          [n, minutes]
        );

        return res.status(200).json({
          ok: true,
          message: `${n} signed out (+${minutes} min). Total: ${updated.rows[0].total_minutes} min.`,
        });
      }

      return res.status(400).json({ error: "Unknown action. Use 'Sign In' or 'Sign Out'." });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
