import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET /api/todos?date=YYYY-MM-DD  → todos for one day
  // GET /api/todos?month=YYYY-MM   → { [date]: todo[] } for whole month
  if (req.method === "GET") {
    const { date, month } = req.query;
    if (month) {
      const rows = await sql`
        SELECT date::text, id, text, done, position, start_hour, end_hour, block_id
        FROM day_todos WHERE to_char(date, 'YYYY-MM') = ${month} ORDER BY date, position, id
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
      FROM day_todos WHERE date = ${date} ORDER BY position, id
    `;
    return res.status(200).json(rows);
  }

  // POST { date, text, start_hour?, end_hour?, block_id? }
  if (req.method === "POST") {
    const { date, text, start_hour = null, end_hour = null, block_id = null } = req.body;
    if (!date || !text) return res.status(400).json({ error: "date and text required" });
    const [{ max }] = await sql`SELECT COALESCE(MAX(position), 0) AS max FROM day_todos WHERE date = ${date}`;
    const [row] = await sql`
      INSERT INTO day_todos (date, text, done, position, start_hour, end_hour, block_id)
      VALUES (${date}, ${text}, false, ${Number(max) + 1}, ${start_hour}, ${end_hour}, ${block_id})
      RETURNING id, text, done, position, start_hour, end_hour, block_id
    `;
    return res.status(201).json(row);
  }

  // PATCH { id, done?, text?, start_hour?, end_hour?, block_id? }
  if (req.method === "PATCH") {
    const { id, done, text, start_hour, end_hour, block_id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    if (done !== undefined) await sql`UPDATE day_todos SET done = ${done} WHERE id = ${id}`;
    if (text !== undefined) await sql`UPDATE day_todos SET text = ${text} WHERE id = ${id}`;
    if (start_hour !== undefined) await sql`UPDATE day_todos SET start_hour = ${start_hour} WHERE id = ${id}`;
    if (end_hour !== undefined) await sql`UPDATE day_todos SET end_hour = ${end_hour} WHERE id = ${id}`;
    if (block_id !== undefined) await sql`UPDATE day_todos SET block_id = ${block_id} WHERE id = ${id}`;
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
