import { sql } from "./_db.js";

export default async function handler(req, res) {
  try {
    // Allow GET/POST
    const m = (req.method || "GET").toUpperCase();
    if (!["GET","POST"].includes(m)) return res.status(405).json({ ok:false, error:"Method Not Allowed" });

    // Ensure totals table/column
    await sql`CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY)`;
    const hasCol = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
    `;
    if (hasCol.length === 0) {
      await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
    }

    // Recompute using whichever columns exist on each row
    const rows = await sql/* sql */`
      INSERT INTO totals (name, total_seconds)
      SELECT s.name,
             COALESCE(
               SUM(
                 CASE
                   WHEN s.end_at IS NOT NULL AND s.start_at IS NOT NULL
                     THEN EXTRACT(EPOCH FROM (s.end_at - s.start_at))::bigint
                   WHEN s.checkout IS NOT NULL AND s.checkin IS NOT NULL
                     THEN EXTRACT(EPOCH FROM (s.checkout - s.checkin))::bigint
                   WHEN s.duration_seconds IS NOT NULL
                     THEN s.duration_seconds::bigint
                   ELSE 0
                 END
               ),
               0
             ) AS total_seconds
      FROM sessions s
      WHERE (s.end_at IS NOT NULL OR s.checkout IS NOT NULL OR s.duration_seconds IS NOT NULL)
      GROUP BY s.name
      ON CONFLICT (name)
      DO UPDATE SET total_seconds = EXCLUDED.total_seconds
      RETURNING name, total_seconds
    `;

    res.status(200).json({ ok:true, updated: rows.length, rows });
  } catch (e) {
    console.error("rebuild_totals error:", e);
    res.status(500).json({ ok:false, error:String(e?.message||e) });
  }
}
