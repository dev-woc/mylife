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

  // GET /api/blocks?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const rows = await sql`
      SELECT id, start_hour, end_hour, label, tasks
      FROM planner_day_blocks WHERE user_id = ${user.id} AND date = ${date}
      ORDER BY start_hour
    `;
    return res.status(200).json(rows);
  }

  // POST { date, start_hour, end_hour, label } — create block
  if (req.method === "POST") {
    const { date, start_hour, end_hour, label } = req.body;
    if (!date || start_hour == null || end_hour == null) return res.status(400).json({ error: "date, start_hour, end_hour required" });
    const id = createId();
    const [row] = await sql`
      INSERT INTO planner_day_blocks (id, user_id, date, start_hour, end_hour, label)
      VALUES (${id}, ${user.id}, ${date}, ${start_hour}, ${end_hour}, ${label || ""})
      RETURNING id, start_hour, end_hour, label, tasks
    `;
    return res.status(201).json(row);
  }

  // PATCH { id, tasks } — update block tasks
  if (req.method === "PATCH") {
    const { id, tasks } = req.body;
    if (!id || !Array.isArray(tasks)) return res.status(400).json({ error: "id and tasks required" });
    await sql`
      UPDATE planner_day_blocks
      SET tasks = ${tasks}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    return res.status(200).json({ ok: true });
  }

  // DELETE { id }
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await sql`DELETE FROM planner_day_blocks WHERE id = ${id} AND user_id = ${user.id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
