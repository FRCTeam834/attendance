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

    // Compute the elapsed seconds since last_checkin if currently checked in
    const rows = await db/* sql */`
      with updated as (
        update attendance_totals
        set
          total_seconds = total_seconds + (
            case
              when is_checked_in = true and last_checkin is not null
              then extract(epoch from (now() - last_checkin))::bigint
              else 0
            end
          ),
          is_checked_in = false,
          last_checkin = null
        where name = ${name}
        returning *
      )
      select * from updated;
    `;

    if (rows.length === 0) {
      // If the user doesn't exist yet, create them with zero and not checked in
      const created = await db/* sql */`
        insert into attendance_totals (name, total_seconds, is_checked_in, last_checkin)
        values (${name}, 0, false, null)
        on conflict (name) do nothing
        returning *;
      `;
      res.status(200).json({
        ok: true,
        user: created[0] || { name, total_seconds: 0, is_checked_in: false, last_checkin: null }
      });
      return;
    }

    res.status(200).json({ ok: true, user: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
