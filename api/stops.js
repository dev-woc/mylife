import { requireUser } from "./_lib/auth.js";
import { createId, ensurePlannerSchema, sql } from "./_lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  // GET /api/stops?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const rows = await sql`
      SELECT id, position, name, address, lat::float, lng::float
      FROM planner_day_stops
      WHERE user_id = ${user.id} AND date = ${date}
      ORDER BY position
    `;
    return res.status(200).json(rows);
  }

  // POST /api/stops  { date, name, address, lat, lng }
  if (req.method === "POST") {
    const { date, name, address, lat, lng } = req.body;
    if (!date || !name || !address) return res.status(400).json({ error: "date, name, address required" });
    const [{ max }] = await sql`
      SELECT COALESCE(MAX(position), 0) as max
      FROM planner_day_stops
      WHERE user_id = ${user.id} AND date = ${date}
    `;
    const position = Number(max) + 1;
    const id = createId();
    const [row] = await sql`
      INSERT INTO planner_day_stops (id, user_id, date, position, name, address, lat, lng)
      VALUES (${id}, ${user.id}, ${date}, ${position}, ${name}, ${address}, ${lat ?? null}, ${lng ?? null})
      RETURNING id, position, name, address, lat::float, lng::float
    `;
    return res.status(201).json(row);
  }

  // PATCH /api/stops  { id, lat, lng }  — update coordinates after geocoding
  if (req.method === "PATCH") {
    const { id, lat, lng } = req.body;
    if (!id || lat == null || lng == null) return res.status(400).json({ error: "id, lat, lng required" });
    await sql`
      UPDATE planner_day_stops
      SET lat = ${lat}, lng = ${lng}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    return res.status(200).json({ ok: true });
  }

  // DELETE /api/stops  { id, date }
  if (req.method === "DELETE") {
    const { id, date } = req.body;
    if (!id || !date) return res.status(400).json({ error: "id and date required" });
    const [deleted] = await sql`
      DELETE FROM planner_day_stops
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING position
    `;
    if (deleted) {
      await sql`
        UPDATE planner_day_stops
        SET position = position - 1, updated_at = NOW()
        WHERE user_id = ${user.id} AND date = ${date} AND position > ${deleted.position}
      `;
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
