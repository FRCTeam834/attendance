const { sql, ensureSchema } = require('./_db');

module.exports = async (req, res) => {
  try {
    await ensureSchema();

    const name = (req.query.name || req.body?.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const db = sql();

    // Create row if missing, but only set checked in if not already checked in
    const rows = await db/* sql */`
      insert into attendance_totals (name, is_checked_in, last_checkin)
      values (${name}, true, now())
      on conflict (name) do update
        set
          -- If already checked in, keep existing last_checkin; else start a new session
          is_checked_in = true,
          last_checkin = case when attendance_totals.is_checked_in then attendance_totals.last_checkin else now() end
      returning name, total_seconds, is_checked_in, last_checkin;
    `;

    res.status(200).json({ ok: true, user: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
