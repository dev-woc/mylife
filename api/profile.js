import { requireUser } from "./_lib/auth.js";
import { ensurePlannerSchema, sql } from "./_lib/db.js";
import { getProfile } from "./_lib/plans.js";

const FIELDS = ["display_name", "city", "timezone", "life_stage", "work_style", "planning_style", "energy_pattern", "budget_style", "primary_focus"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const profile = await getProfile(user.id);
    return res.status(200).json({ profile });
  }

  if (req.method === "POST") {
    const payload = Object.fromEntries(
      FIELDS.map((field) => [field, String(req.body?.[field] ?? "").trim()])
    );

    await sql`
      INSERT INTO planner_profiles (
        user_id, display_name, city, timezone, life_stage, work_style, planning_style, energy_pattern, budget_style, primary_focus, updated_at
      )
      VALUES (
        ${user.id}, ${payload.display_name}, ${payload.city}, ${payload.timezone}, ${payload.life_stage}, ${payload.work_style},
        ${payload.planning_style}, ${payload.energy_pattern}, ${payload.budget_style}, ${payload.primary_focus}, NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        city = EXCLUDED.city,
        timezone = EXCLUDED.timezone,
        life_stage = EXCLUDED.life_stage,
        work_style = EXCLUDED.work_style,
        planning_style = EXCLUDED.planning_style,
        energy_pattern = EXCLUDED.energy_pattern,
        budget_style = EXCLUDED.budget_style,
        primary_focus = EXCLUDED.primary_focus,
        updated_at = NOW()
    `;

    const profile = await getProfile(user.id);
    return res.status(200).json({ profile });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
