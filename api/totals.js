const { sql, ensureSchema } = require('./_db');

function format(seconds) {
  const s = Number(seconds || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return { hours, minutes, seconds: secs, h:mm:ss: `${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` };
}

module.exports = async (req, res) => {
  try {
    await ensureSchema();
    const db = sql();

    // Optional: name filter ?name=Someone
    const name = (req.query.name || '').trim();
    const rows = name
      ? await db/* sql */`select name, total_seconds, is_checked_in, last_checkin from attendance_totals where name = ${name} order by name;`
      : await db/* sql */`select name, total_seconds, is_checked_in, last_checkin from attendance_totals order by name;`;

    const data = rows.map(r => ({
      name: r.name,
      total_seconds: Number(r.total_seconds || 0),
      total_formatted: format(r.total_seconds).h:mm:ss,
      is_checked_in: r.is_checked_in,
      last_checkin: r.last_checkin
    }));

    res.status(200).json({ ok: true, totals: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
