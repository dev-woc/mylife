import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET /api/todos?date=YYYY-MM-DD
  if (req.method === "GET") {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date required" });
    const rows = await sql`SELECT id, text, done, position FROM day_todos WHERE date = ${date} ORDER BY position, id`;
    return res.status(200).json(rows);
  }

  // POST { date, text } — add todo
  if (req.method === "POST") {
    const { date, text } = req.body;
    if (!date || !text) return res.status(400).json({ error: "date and text required" });
    const [{ max }] = await sql`SELECT COALESCE(MAX(position), 0) AS max FROM day_todos WHERE date = ${date}`;
    const [row] = await sql`
      INSERT INTO day_todos (date, text, done, position)
      VALUES (${date}, ${text}, false, ${Number(max) + 1})
      RETURNING id, text, done, position
    `;
    return res.status(201).json(row);
  }

  // PATCH { id, done?, text? } — toggle or rename
  if (req.method === "PATCH") {
    const { id, done, text } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    if (done !== undefined) {
      await sql`UPDATE day_todos SET done = ${done} WHERE id = ${id}`;
    }
    if (text !== undefined) {
      await sql`UPDATE day_todos SET text = ${text} WHERE id = ${id}`;
    }
    return res.status(200).json({ ok: true });
  }

  // DELETE { id }
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await sql`DELETE FROM day_todos WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
