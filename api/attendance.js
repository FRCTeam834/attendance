// api/attendance.js
import { sql } from './_db.js';

function parseBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body || {};
}

export default async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();

    // ---------------------------
    // GET -> list current totals
    // ---------------------------
    if (method === 'GET') {
      // Ensure totals table/column exist (idempotent safety)
      await sql`CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY)`;
      const hasCol = await sql`
        SELECT 1 FROM information_schema.columns
        WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
      `;
      if (hasCol.length === 0) {
        await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
      }

      const rows = await sql`SELECT name, total_seconds FROM totals ORDER BY name`;
      return res.status(200).json(rows);
    }

    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { name, action } = parseBody(req);
    if (!name || !action) return res.status(400).json({ error: 'Missing name or action' });

    // ---------------------------
    // SIGN IN
    // ---------------------------
    if (action === 'Sign In') {
      // pre-check to avoid unique-index violations across either schema
      const open = await sql/* sql */`
        SELECT 1
        FROM sessions
        WHERE name = ${name}
          AND (end_at IS NULL OR checkout IS NULL)
        LIMIT 1
      `;
      if (open.length) {
        return res.status(409).json({ error: 'Already signed in' });
      }

      // insert writing both old and new columns (legacy compatible)
      const inserted = await sql/* sql */`
        INSERT INTO sessions (name, start_at, checkin, end_at, checkout, duration_seconds)
        VALUES (${name}, now(), now(), NULL, NULL, NULL)
        RETURNING id, name, start_at
      `;
      return res.status(200).json({ message: `Signed in ${name}`, session: inserted[0] });
    }

    // ---------------------------
    // SIGN OUT
    // ---------------------------
    if (action === 'Sign Out') {
      // Close latest open session, support both schemas, compute duration once
      const closed = await sql/* sql */`
        UPDATE sessions
           SET
             end_at = now(),
             checkout = now(),
             duration_seconds = COALESCE(
               duration_seconds,
               EXTRACT(EPOCH FROM ( now() - COALESCE(start_at, checkin) ))::bigint
             )
         WHERE id = (
           SELECT id
           FROM sessions
           WHERE name = ${name}
             AND (end_at IS NULL OR checkout IS NULL)
           ORDER BY COALESCE(start_at, checkin) DESC
           LIMIT 1
         )
         RETURNING COALESCE(
           duration_seconds,
           EXTRACT(EPOCH FROM (end_at - start_at))::bigint,
           EXTRACT(EPOCH FROM (checkout - checkin))::bigint,
           0
         ) AS secs
      `;
      if (closed.length === 0) {
        return res.status(404).json({ error: `No open session for ${name}` });
      }

      const added = Number(closed[0].secs || 0);
      if (!(added >= 0)) return res.status(500).json({ error: 'Bad elapsed time' });

      // Ensure totals exist, then add
      await sql`CREATE TABLE IF NOT EXISTS totals (name TEXT PRIMARY KEY)`;
      const hasCol = await sql`
        SELECT 1 FROM information_schema.columns
        WHERE table_name='totals' AND column_name='total_seconds' LIMIT 1
      `;
      if (hasCol.length === 0) {
        await sql`ALTER TABLE totals ADD COLUMN total_seconds BIGINT NOT NULL DEFAULT 0`;
      }

      await sql`INSERT INTO totals (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
      const up = await sql/* sql */`
        UPDATE totals
           SET total_seconds = total_seconds + ${added}
         WHERE name = ${name}
         RETURNING name, total_seconds
      `;
      return res
        .status(200)
        .json({ message: `Signed out ${name}`, added_seconds: added, total: up[0] });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    // translate unique constraint if it bubbles up
    if (e && e.code === '23505') {
      return res.status(409).json({ error: 'Already signed in (unique index)' });
    }
    console.error('attendance error', e);
    return res
      .status(500)
      .json({ error: 'FUNCTION_INVOCATION_FAILED', detail: String(e?.message || e) });
  }
}
