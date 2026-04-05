import { requireUser } from "./_lib/auth.js";
import { createId, ensurePlannerSchema, sql } from "./_lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  // GET /api/task-links?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const rows = await sql`
      SELECT id, hour, block_id, task_text, stop_id
      FROM planner_task_stop_links
      WHERE user_id = ${user.id} AND date = ${date}
    `;
    return res.status(200).json(rows);
  }

  // POST { date, hour, block_id, task_text, stop_id } — upsert
  if (req.method === "POST") {
    const { date, hour, block_id, task_text, stop_id } = req.body;
    if (!date || !task_text || !stop_id) return res.status(400).json({ error: "date, task_text, stop_id required" });
    // Remove any existing link for this task first
    await sql`
      DELETE FROM planner_task_stop_links
      WHERE user_id = ${user.id}
        AND date = ${date}
        AND task_text = ${task_text}
        AND (hour = ${hour ?? null} OR hour IS NULL)
        AND (block_id = ${block_id ?? null} OR block_id IS NULL)
    `;
    const id = createId();
    const [row] = await sql`
      INSERT INTO planner_task_stop_links (id, user_id, date, hour, block_id, task_text, stop_id)
      VALUES (${id}, ${user.id}, ${date}, ${hour ?? null}, ${block_id ?? null}, ${task_text}, ${stop_id})
      RETURNING id, hour, block_id, task_text, stop_id
    `;
    return res.status(201).json(row);
  }

  // DELETE { id }
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await sql`DELETE FROM planner_task_stop_links WHERE id = ${id} AND user_id = ${user.id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
