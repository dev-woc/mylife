import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET /api/notes?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const [row] = await sql`SELECT text FROM day_notes WHERE date = ${date}`;
    return res.status(200).json({ text: row?.text ?? "" });
  }

  // POST { date, text }
  if (req.method === "POST") {
    const { date, text } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });
    await sql`
      INSERT INTO day_notes (date, text, updated_at)
      VALUES (${date}, ${text ?? ""}, NOW())
      ON CONFLICT (date) DO UPDATE SET text = ${text ?? ""}, updated_at = NOW()
    `;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
