import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET /api/tasks?date=YYYY-MM-DD  → return all hours for that date
  // GET /api/tasks                  → return all rows
  if (req.method === "GET") {
    const { date } = req.query;
    const rows = date
      ? await sql`SELECT hour, tasks FROM day_tasks WHERE date = ${date} ORDER BY hour`
      : await sql`SELECT date::text, hour, tasks FROM day_tasks ORDER BY date, hour`;

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
      await sql`DELETE FROM day_tasks WHERE date = ${date} AND hour = ${hour}`;
    } else {
      await sql`
        INSERT INTO day_tasks (date, hour, tasks, updated_at)
        VALUES (${date}, ${hour}, ${tasks}, NOW())
        ON CONFLICT (date, hour)
        DO UPDATE SET tasks = ${tasks}, updated_at = NOW()
      `;
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
