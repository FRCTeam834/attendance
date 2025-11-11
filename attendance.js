// /api/attendance.js
const { query } = require("./_db");

// Safely read the body in @vercel/node (req.body may be undefined)
function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) return resolve(req.body);
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        if (!data) return resolve({});
        const ct = String(req.headers["content-type"] || "").toLowerCase();
        if (ct.includes("application/json")) return resolve(JSON.parse(data));
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const { rows } = await query(
        `SELECT id, name, action, occurred_at
           FROM attendance
           ORDER BY occurred_at DESC
           LIMIT 500`
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(rows));
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const { name, action } = body || {};
      if (!name || !action) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Both 'name' and 'action' are required." }));
        return;
      }

      const { rows } = await query(
        `INSERT INTO attendance (name, action, occurred_at)
         VALUES ($1, $2, NOW())
         RETURNING id, name, action, occurred_at`,
        [name, action]
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ message: "Attendance recorded.", record: rows[0] }));
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.statusCode = 405;
    res.end("Method Not Allowed");
  } catch (err) {
    console.error("API error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error." }));
  }
};
