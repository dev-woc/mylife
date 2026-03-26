import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET /api/habits?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const rows = await sql`SELECT label, done FROM day_habits WHERE date = ${date}`;
    return res.status(200).json(rows);
  }

  // POST { date, label, done } — upsert a single habit
  if (req.method === "POST") {
    const { date, label, done } = req.body;
    if (!date || !label) return res.status(400).json({ error: "date and label required" });
    await sql`
      INSERT INTO day_habits (date, label, done)
      VALUES (${date}, ${label}, ${done ?? false})
      ON CONFLICT (date, label) DO UPDATE SET done = ${done ?? false}
    `;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
