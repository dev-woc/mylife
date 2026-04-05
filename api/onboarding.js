import { requireUser } from "./_lib/auth.js";
import { createId, ensurePlannerSchema, sql } from "./_lib/db.js";
import { ONBOARDING_QUESTIONS, getOnboardingAnswers } from "./_lib/plans.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const answers = await getOnboardingAnswers(user.id);
    return res.status(200).json({
      questions: ONBOARDING_QUESTIONS,
      answers,
      completed: ONBOARDING_QUESTIONS.every((question) => Boolean(answers[question.key]?.trim())),
    });
  }

  if (req.method === "POST") {
    const entries = Object.entries(req.body?.answers || {})
      .filter(([key]) => ONBOARDING_QUESTIONS.some((question) => question.key === key))
      .map(([questionKey, answerText]) => [questionKey, String(answerText ?? "").trim()]);

    for (const [questionKey, answerText] of entries) {
      await sql`
        INSERT INTO planner_onboarding_answers (id, user_id, question_key, answer_text, updated_at)
        VALUES (${createId()}, ${user.id}, ${questionKey}, ${answerText}, NOW())
        ON CONFLICT (user_id, question_key)
        DO UPDATE SET answer_text = ${answerText}, updated_at = NOW()
      `;
    }

    const answers = await getOnboardingAnswers(user.id);
    return res.status(200).json({
      answers,
      completed: ONBOARDING_QUESTIONS.every((question) => Boolean(answers[question.key]?.trim())),
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
