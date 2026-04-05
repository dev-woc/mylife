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

  // GET /api/notes?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const [row] = await sql`
      SELECT text
      FROM planner_day_notes
      WHERE user_id = ${user.id} AND date = ${date}
    `;
    return res.status(200).json({ text: row?.text ?? "" });
  }

  // POST { date, text }
  if (req.method === "POST") {
    const { date, text } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });
    await sql`
      INSERT INTO planner_day_notes (user_id, date, text, updated_at)
      VALUES (${user.id}, ${date}, ${text ?? ""}, NOW())
      ON CONFLICT (user_id, date) DO UPDATE SET text = ${text ?? ""}, updated_at = NOW()
    `;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
