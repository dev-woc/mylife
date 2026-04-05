import { requireUser } from "./_lib/auth.js";
import { createId, ensurePlannerSchema, sql } from "./_lib/db.js";
import { getActiveCycle, getMonthlyPlans } from "./_lib/plans.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const [cycle, monthlyPlans] = await Promise.all([getActiveCycle(user.id), getMonthlyPlans(user.id)]);
    return res.status(200).json({ cycle, months: monthlyPlans });
  }

  if (req.method === "PATCH") {
    const { id, phase, theme, vibe, milestone, travel, budget_level, color, experiences } = req.body || {};
    if (!id) return res.status(400).json({ error: "id required" });

    await sql`
      UPDATE planner_monthly_plans
      SET
        phase = ${String(phase ?? "")},
        theme = ${String(theme ?? "")},
        vibe = ${String(vibe ?? "")},
        milestone = ${String(milestone ?? "")},
        travel = ${String(travel ?? "")},
        budget_level = ${String(budget_level ?? "$")},
        color = ${String(color ?? "#FFD700")},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (Array.isArray(experiences)) {
      await sql`DELETE FROM planner_monthly_experiences WHERE monthly_plan_id = ${id} AND user_id = ${user.id}`;
      for (const [index, text] of experiences.entries()) {
        const trimmed = String(text ?? "").trim();
        if (!trimmed) continue;
        await sql`
          INSERT INTO planner_monthly_experiences (id, monthly_plan_id, user_id, text, position)
          VALUES (${createId()}, ${id}, ${user.id}, ${trimmed}, ${index + 1})
        `;
      }
    }

    const monthlyPlans = await getMonthlyPlans(user.id);
    return res.status(200).json({ months: monthlyPlans });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
