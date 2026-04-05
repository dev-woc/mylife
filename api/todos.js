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

  // GET /api/todos?date=YYYY-MM-DD  → todos for one day
  // GET /api/todos?month=YYYY-MM   → { [date]: todo[] } for whole month
  if (req.method === "GET") {
    const { date, month } = req.query;
    if (month) {
      const rows = await sql`
        SELECT date::text, id, text, done, position, start_hour, end_hour, block_id
        FROM planner_day_todos
        WHERE user_id = ${user.id} AND to_char(date, 'YYYY-MM') = ${month}
        ORDER BY date, position, id
      `;
      const result = {};
      for (const row of rows) {
        if (!result[row.date]) result[row.date] = [];
        result[row.date].push({ id: row.id, text: row.text, done: row.done, position: row.position, start_hour: row.start_hour, end_hour: row.end_hour, block_id: row.block_id });
      }
      return res.status(200).json(result);
    }
    if (!date) return res.status(400).json({ error: "date or month required" });
    const rows = await sql`
      SELECT id, text, done, position, start_hour, end_hour, block_id
      FROM planner_day_todos
      WHERE user_id = ${user.id} AND date = ${date}
      ORDER BY position, id
    `;
    return res.status(200).json(rows);
  }

  // POST { date, text, start_hour?, end_hour?, block_id? }
  if (req.method === "POST") {
    const { date, text, start_hour = null, end_hour = null, block_id = null } = req.body;
    if (!date || !text) return res.status(400).json({ error: "date and text required" });
    const [{ max }] = await sql`
      SELECT COALESCE(MAX(position), 0) AS max
      FROM planner_day_todos
      WHERE user_id = ${user.id} AND date = ${date}
    `;
    const id = createId();
    const [row] = await sql`
      INSERT INTO planner_day_todos (id, user_id, date, text, done, position, start_hour, end_hour, block_id)
      VALUES (${id}, ${user.id}, ${date}, ${text}, false, ${Number(max) + 1}, ${start_hour}, ${end_hour}, ${block_id})
      RETURNING id, text, done, position, start_hour, end_hour, block_id
    `;
    return res.status(201).json(row);
  }

  // PATCH { id, done?, text?, start_hour?, end_hour?, block_id? }
  if (req.method === "PATCH") {
    const { id, done, text, start_hour, end_hour, block_id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    if (done !== undefined) await sql`UPDATE planner_day_todos SET done = ${done}, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
    if (text !== undefined) await sql`UPDATE planner_day_todos SET text = ${text}, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
    if (start_hour !== undefined) await sql`UPDATE planner_day_todos SET start_hour = ${start_hour}, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
    if (end_hour !== undefined) await sql`UPDATE planner_day_todos SET end_hour = ${end_hour}, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
    if (block_id !== undefined) await sql`UPDATE planner_day_todos SET block_id = ${block_id}, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
    return res.status(200).json({ ok: true });
  }

  // DELETE { id }
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await sql`DELETE FROM planner_day_todos WHERE id = ${id} AND user_id = ${user.id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
