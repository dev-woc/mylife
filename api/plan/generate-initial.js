import { requireUser } from "../_lib/auth.js";
import { createId, ensurePlannerSchema, sql } from "../_lib/db.js";
import { ONBOARDING_QUESTIONS, getMonthlyPlans, getOnboardingAnswers, getProfile, replacePlanForUser } from "../_lib/plans.js";

const PROFILE_FIELDS = ["display_name", "city", "timezone", "life_stage", "work_style", "planning_style", "energy_pattern", "budget_style", "primary_focus"];

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

  const incomingProfile = req.body?.profile && typeof req.body.profile === "object" ? req.body.profile : null;
  const incomingAnswers = req.body?.answers && typeof req.body.answers === "object" ? req.body.answers : null;

  if (incomingProfile) {
    const payload = Object.fromEntries(
      PROFILE_FIELDS.map((field) => [field, String(incomingProfile[field] ?? "").trim()])
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
  }

  if (incomingAnswers) {
    const entries = Object.entries(incomingAnswers)
      .filter(([key]) => ONBOARDING_QUESTIONS.some((question) => question.key === key))
      .map(([questionKey, answerText]) => [questionKey, String(answerText ?? "").trim()]);

    await Promise.all(entries.map(([questionKey, answerText]) =>
      sql`
        INSERT INTO planner_onboarding_answers (id, user_id, question_key, answer_text, updated_at)
        VALUES (${createId()}, ${user.id}, ${questionKey}, ${answerText}, NOW())
        ON CONFLICT (user_id, question_key)
        DO UPDATE SET answer_text = ${answerText}, updated_at = NOW()
      `
    ));
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
