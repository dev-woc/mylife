import { requireUser } from "./_lib/auth.js";
import { createId, ensurePlannerSchema, sql } from "./_lib/db.js";
import { getHabitTemplates } from "./_lib/plans.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const habits = await getHabitTemplates(user.id);
    return res.status(200).json({ habits });
  }

  if (req.method === "POST") {
    const label = String(req.body?.label ?? "").trim();
    if (!label) return res.status(400).json({ error: "label required" });
    const [{ max }] = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max FROM planner_habit_templates WHERE user_id = ${user.id}`;
    await sql`
      INSERT INTO planner_habit_templates (id, user_id, label, category, default_enabled, sort_order, updated_at)
      VALUES (${createId()}, ${user.id}, ${label}, ${String(req.body?.category ?? "general")}, ${req.body?.default_enabled !== false}, ${Number(max) + 1}, NOW())
    `;
    const habits = await getHabitTemplates(user.id);
    return res.status(201).json({ habits });
  }

  if (req.method === "PATCH") {
    const { id, label, category, default_enabled, sort_order } = req.body || {};
    if (!id) return res.status(400).json({ error: "id required" });
    await sql`
      UPDATE planner_habit_templates
      SET
        label = ${String(label ?? "")},
        category = ${String(category ?? "general")},
        default_enabled = ${default_enabled !== false},
        sort_order = ${Number(sort_order ?? 0)},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    const habits = await getHabitTemplates(user.id);
    return res.status(200).json({ habits });
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id required" });
    await sql`DELETE FROM planner_habit_templates WHERE id = ${id} AND user_id = ${user.id}`;
    const habits = await getHabitTemplates(user.id);
    return res.status(200).json({ habits });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
