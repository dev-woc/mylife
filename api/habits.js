import { requireUser } from "./_lib/auth.js";
import { ensurePlannerSchema, sql } from "./_lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  // GET /api/habits?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const rows = await sql`
      SELECT label, done
      FROM planner_day_habits
      WHERE user_id = ${user.id} AND date = ${date}
    `;
    return res.status(200).json(rows);
  }

  // POST { date, label, done } — upsert a single habit
  if (req.method === "POST") {
    const { date, label, done } = req.body;
    if (!date || !label) return res.status(400).json({ error: "date and label required" });
    await sql`
      INSERT INTO planner_day_habits (user_id, date, label, done, updated_at)
      VALUES (${user.id}, ${date}, ${label}, ${done ?? false}, NOW())
      ON CONFLICT (user_id, date, label) DO UPDATE SET done = ${done ?? false}, updated_at = NOW()
    `;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
