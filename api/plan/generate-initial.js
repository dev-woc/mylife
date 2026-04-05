import { requireUser } from "../_lib/auth.js";
import { ensurePlannerSchema } from "../_lib/db.js";
import { getMonthlyPlans, getOnboardingAnswers, getProfile, replacePlanForUser } from "../_lib/plans.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return res.status(400).json({ error: "profile required before generating a plan" });
  }

  const answers = await getOnboardingAnswers(user.id);
  const required = ["life_stage", "top_goals", "main_constraints", "ideal_week", "energy_pattern", "planning_style", "city_context"];
  const missing = required.filter((key) => !String(answers[key] || "").trim());
  if (missing.length) {
    return res.status(400).json({ error: "onboarding incomplete", missing });
  }

  const horizonType = req.body?.horizonType === "quarter" ? "quarter" : "year";
  const { cycleId } = await replacePlanForUser(user.id, profile, answers, horizonType);

  const months = await getMonthlyPlans(user.id);
  return res.status(200).json({ cycle_id: cycleId, months });
}
