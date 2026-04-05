import { requireUser } from "./_lib/auth.js";
import { ensurePlannerSchema, sql } from "./_lib/db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  // GET /api/tasks?date=YYYY-MM-DD  → hours for one date
  // GET /api/tasks?month=YYYY-MM   → all hours for every day in that month
  // GET /api/tasks                 → all rows
  if (req.method === "GET") {
    const { date, month } = req.query;
    let rows;
    if (date) {
      rows = await sql`
        SELECT date::text, hour, tasks
        FROM planner_day_tasks
        WHERE user_id = ${user.id} AND date = ${date}
        ORDER BY hour
      `;
    } else if (month) {
      rows = await sql`
        SELECT date::text, hour, tasks
        FROM planner_day_tasks
        WHERE user_id = ${user.id} AND to_char(date, 'YYYY-MM') = ${month}
        ORDER BY date, hour
      `;
    } else {
      rows = await sql`
        SELECT date::text, hour, tasks
        FROM planner_day_tasks
        WHERE user_id = ${user.id}
        ORDER BY date, hour
      `;
    }

    // Shape into { [date]: { [hour]: string[] } }
    // Parse hour to Number so keys like "9.0" normalise to "9" on the client
    const result = {};
    for (const row of rows) {
      const d = date || row.date;
      if (!result[d]) result[d] = {};
      result[d][Number(row.hour)] = row.tasks;
    }
    return res.status(200).json(result);
  }

  // POST /api/tasks  body: { date, hour, tasks }
  // Upserts a single hour slot. tasks=[] deletes the row.
  if (req.method === "POST") {
    const { date, hour, tasks } = req.body;
    if (!date || hour == null || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "date, hour, and tasks are required" });
    }

    if (tasks.length === 0) {
      await sql`DELETE FROM planner_day_tasks WHERE user_id = ${user.id} AND date = ${date} AND hour = ${hour}`;
    } else {
      await sql`
        INSERT INTO planner_day_tasks (user_id, date, hour, tasks, updated_at)
        VALUES (${user.id}, ${date}, ${hour}, ${tasks}, NOW())
        ON CONFLICT (user_id, date, hour)
        DO UPDATE SET tasks = ${tasks}, updated_at = NOW()
      `;
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
