import { createId, sql } from "./db.js";

export const ONBOARDING_QUESTIONS = [
  { key: "display_name", label: "What should the planner call you?", placeholder: "Jordan" },
  { key: "life_stage", label: "What season of life are you in right now?", placeholder: "New city, new job, rebuilding routines" },
  { key: "city_context", label: "Where do you live, and what context matters locally?", placeholder: "Boston. Cold winters, lots to explore, commute matters." },
  { key: "top_goals", label: "What are your top goals for the next 3 to 12 months?", placeholder: "Get financially stable, build community, train consistently" },
  { key: "main_constraints", label: "What constraints matter most right now?", placeholder: "Money, energy after work, inconsistent sleep" },
  { key: "ideal_week", label: "What does a strong week look like for you?", placeholder: "Focused weekdays, one social night, one reset day" },
  { key: "energy_pattern", label: "When do you usually have the best energy?", placeholder: "Mornings for deep work, evenings for lighter tasks" },
  { key: "planning_style", label: "What kind of planner are you?", placeholder: "Structured but not rigid" },
  { key: "more_of", label: "What do you want more of in your life?", placeholder: "Momentum, health, good people, creative work" },
  { key: "less_of", label: "What do you want less of?", placeholder: "Impulse spending, wasted evenings, scattered priorities" },
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const COLORS = ["#00E5FF", "#ADFF2F", "#FFD700", "#FF6B35", "#C77DFF", "#FF4E50", "#00B4D8", "#F4A261", "#B5E48C", "#48CAE4", "#F72585", "#FFD700"];

function addMonthsUTC(date, count) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function monthKeyFromDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function titleCase(value = "") {
  return value
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseList(answer = "", fallback = []) {
  const parts = answer
    .split(/\n|,|;/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : fallback;
}

function deriveBudget(constraints = "") {
  const text = constraints.toLowerCase();
  if (text.includes("money") || text.includes("debt") || text.includes("rent") || text.includes("budget")) return "$";
  if (text.includes("travel") || text.includes("save")) return "$$";
  return "$$";
}

function derivePhase(index) {
  if (index < 3) return "FOUNDATION";
  if (index < 6) return "MOMENTUM";
  if (index < 9) return "EXPANSION";
  return "REFINEMENT";
}

function goalTheme(goal, focus, index) {
  const text = (goal || focus || "").toLowerCase();
  if (text.includes("health") || text.includes("train") || text.includes("gym")) return index < 3 ? "Build the Base" : "Stay Consistent";
  if (text.includes("money") || text.includes("finance") || text.includes("save")) return index < 3 ? "Stabilize the Money" : "Stack the Margin";
  if (text.includes("community") || text.includes("friend") || text.includes("network")) return index < 3 ? "Find Your People" : "Deepen the Circle";
  if (text.includes("career") || text.includes("work") || text.includes("job")) return index < 3 ? "Prove the Floor" : "Raise the Ceiling";
  return index < 3 ? "Set the Rhythm" : index < 6 ? "Build the Momentum" : index < 9 ? "Expand the Vision" : "Sharpen the Next Move";
}

function buildMonthPlan({ date, index, goals, focus, constraints, city, energyPattern, moreOf, idealWeek, planningStyle }) {
  const primaryGoal = goals[index % Math.max(goals.length, 1)] || focus || "build a stronger life rhythm";
  const secondaryGoal = goals[(index + 1) % Math.max(goals.length, 1)] || moreOf || "momentum";
  const monthName = MONTH_NAMES[date.getUTCMonth()];
  const theme = goalTheme(primaryGoal, focus, index);
  const phase = derivePhase(index);
  const cityLine = city ? `Use ${city} as context, not background noise.` : "Use your environment intentionally.";
  const energyLine = energyPattern ? `Protect your best energy for what matters: ${energyPattern}.` : "Protect your best energy for high-leverage work.";
  const planningLine = planningStyle ? `Plan in a ${planningStyle.toLowerCase()} way.` : "Keep the plan adaptive, not chaotic.";
  const experiences = [
    `Do one thing this month that clearly supports ${primaryGoal}.`,
    `Create one weekly rhythm around ${secondaryGoal}.`,
    cityLine,
  ];

  return {
    month_key: monthKeyFromDate(date),
    month_name: monthName,
    year: date.getUTCFullYear(),
    phase,
    theme,
    vibe: `${titleCase(monthName)} is for ${theme.toLowerCase()}. ${planningLine}`,
    milestone: `By the end of ${monthName}, feel measurably stronger in ${primaryGoal}.`,
    travel: constraints ? `Keep plans realistic around: ${constraints}.` : "Choose low-friction experiences that keep momentum alive.",
    budget_level: deriveBudget(constraints),
    color: COLORS[index % COLORS.length],
    experiences,
    notes: {
      idealWeek,
      moreOf,
      energyLine,
    },
  };
}

export function buildInitialPlanData(profile, answersMap, horizonType = "year") {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthCount = horizonType === "quarter" ? 3 : 12;
  const goals = parseList(answersMap.top_goals, [profile.primary_focus || "build a life that fits"]);
  const city = answersMap.city_context || profile.city || "";
  const constraints = answersMap.main_constraints || "";
  const energyPattern = answersMap.energy_pattern || profile.energy_pattern || "";
  const idealWeek = answersMap.ideal_week || "";
  const moreOf = answersMap.more_of || "";
  const planningStyle = answersMap.planning_style || profile.planning_style || "";
  const focus = profile.primary_focus || goals[0] || "build a stronger life rhythm";

  const months = Array.from({ length: monthCount }, (_, index) =>
    buildMonthPlan({
      date: addMonthsUTC(start, index),
      index,
      goals,
      focus,
      constraints,
      city,
      energyPattern,
      moreOf,
      idealWeek,
      planningStyle,
    })
  );

  const habitLabels = [];
  if (goals.some((goal) => /health|gym|train|fitness/i.test(goal))) habitLabels.push("Train or Move");
  if (goals.some((goal) => /money|save|finance|budget/i.test(goal))) habitLabels.push("Track Spending");
  if (goals.some((goal) => /community|friend|network|social/i.test(goal))) habitLabels.push("Reach Out");
  if (goals.some((goal) => /career|work|build|project/i.test(goal))) habitLabels.push("Protect Deep Work");
  habitLabels.push("Review Tomorrow Tonight", "Journal the Day");

  const dedupedHabits = [...new Set(habitLabels)].map((label, index) => ({
    label,
    category: "general",
    sort_order: index,
  }));

  return {
    cycle: {
      title: horizonType === "quarter" ? "Quarterly Direction" : "Yearly Direction",
      horizon_type: horizonType,
      start_date: monthKeyFromDate(start) + "-01",
      end_date: monthKeyFromDate(addMonthsUTC(start, monthCount - 1)) + "-01",
    },
    months,
    habits: dedupedHabits,
  };
}

export async function getProfile(userId) {
  const [profile] = await sql`SELECT * FROM planner_profiles WHERE user_id = ${userId} LIMIT 1`;
  return profile || null;
}

export async function getOnboardingAnswers(userId) {
  const rows = await sql`
    SELECT question_key, answer_text
    FROM planner_onboarding_answers
    WHERE user_id = ${userId}
    ORDER BY created_at
  `;
  return Object.fromEntries(rows.map((row) => [row.question_key, row.answer_text]));
}

export async function getHabitTemplates(userId) {
  return sql`
    SELECT id, label, category, default_enabled, sort_order
    FROM planner_habit_templates
    WHERE user_id = ${userId}
    ORDER BY sort_order, created_at
  `;
}

export async function getActiveCycle(userId) {
  const [cycle] = await sql`
    SELECT id, title, horizon_type, start_date::text, end_date::text, status
    FROM planner_plan_cycles
    WHERE user_id = ${userId} AND status = 'active'
    ORDER BY start_date DESC
    LIMIT 1
  `;
  return cycle || null;
}

export async function getMonthlyPlans(userId) {
  const rows = await sql`
    SELECT
      planner_monthly_plans.id,
      planner_monthly_plans.cycle_id,
      planner_monthly_plans.month_key,
      planner_monthly_plans.month_name,
      planner_monthly_plans.year,
      planner_monthly_plans.phase,
      planner_monthly_plans.theme,
      planner_monthly_plans.vibe,
      planner_monthly_plans.milestone,
      planner_monthly_plans.travel,
      planner_monthly_plans.budget_level,
      planner_monthly_plans.color,
      planner_monthly_plans.position,
      COALESCE(
        json_agg(
          json_build_object(
            'id', planner_monthly_experiences.id,
            'text', planner_monthly_experiences.text,
            'position', planner_monthly_experiences.position
          )
          ORDER BY planner_monthly_experiences.position
        ) FILTER (WHERE planner_monthly_experiences.id IS NOT NULL),
        '[]'::json
      ) AS experiences
    FROM planner_monthly_plans
    LEFT JOIN planner_monthly_experiences
      ON planner_monthly_experiences.monthly_plan_id = planner_monthly_plans.id
      AND planner_monthly_experiences.user_id = planner_monthly_plans.user_id
    WHERE planner_monthly_plans.user_id = ${userId}
    GROUP BY planner_monthly_plans.id
    ORDER BY planner_monthly_plans.position
  `;

  return rows.map((row, index) => ({
    id: row.id,
    cycle_id: row.cycle_id,
    month_key: row.month_key,
    month: row.month_name,
    month_name: row.month_name,
    year: String(row.year),
    phase: row.phase,
    theme: row.theme,
    vibe: row.vibe,
    milestone: row.milestone,
    travel: row.travel,
    budget: row.budget_level,
    budget_level: row.budget_level,
    color: row.color,
    position: row.position ?? index + 1,
    experiences: (row.experiences || []).map((experience) => experience.text),
    experience_rows: row.experiences || [],
  }));
}

export async function replacePlanForUser(userId, profile, answersMap, horizonType = "year") {
  const planData = buildInitialPlanData(profile, answersMap, horizonType);
  const cycleId = createId();

  await sql`UPDATE planner_plan_cycles SET status = 'archived', updated_at = NOW() WHERE user_id = ${userId} AND status = 'active'`;

  await sql`
    INSERT INTO planner_plan_cycles (id, user_id, title, horizon_type, start_date, end_date, status, updated_at)
    VALUES (${cycleId}, ${userId}, ${planData.cycle.title}, ${planData.cycle.horizon_type}, ${planData.cycle.start_date}, ${planData.cycle.end_date}, 'active', NOW())
  `;

  await sql`DELETE FROM planner_monthly_experiences WHERE user_id = ${userId}`;
  await sql`DELETE FROM planner_monthly_plans WHERE user_id = ${userId}`;
  await sql`DELETE FROM planner_habit_templates WHERE user_id = ${userId}`;

  for (const [index, month] of planData.months.entries()) {
    const monthlyPlanId = createId();
    await sql`
      INSERT INTO planner_monthly_plans (
        id, user_id, cycle_id, month_key, month_name, year, phase, theme, vibe, milestone, travel, budget_level, color, position, updated_at
      )
      VALUES (
        ${monthlyPlanId}, ${userId}, ${cycleId}, ${month.month_key}, ${month.month_name}, ${month.year}, ${month.phase}, ${month.theme},
        ${month.vibe}, ${month.milestone}, ${month.travel}, ${month.budget_level}, ${month.color}, ${index + 1}, NOW()
      )
    `;

    for (const [experienceIndex, text] of month.experiences.entries()) {
      await sql`
        INSERT INTO planner_monthly_experiences (id, monthly_plan_id, user_id, text, position)
        VALUES (${createId()}, ${monthlyPlanId}, ${userId}, ${text}, ${experienceIndex + 1})
      `;
    }
  }

  for (const habit of planData.habits) {
    await sql`
      INSERT INTO planner_habit_templates (id, user_id, label, category, default_enabled, sort_order, updated_at)
      VALUES (${createId()}, ${userId}, ${habit.label}, ${habit.category}, TRUE, ${habit.sort_order}, NOW())
    `;
  }

  await sql`
    INSERT INTO planner_agent_memory (user_id, summary, preferences, constraints, signals, updated_at)
    VALUES (
      ${userId},
      ${`Current focus: ${profile.primary_focus || ""}`.trim()},
      ${JSON.stringify({ planning_style: profile.planning_style || "", energy_pattern: profile.energy_pattern || "" })}::jsonb,
      ${JSON.stringify({ main_constraints: answersMap.main_constraints || "" })}::jsonb,
      ${JSON.stringify({ generated_from_onboarding: true })}::jsonb,
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      summary = EXCLUDED.summary,
      preferences = EXCLUDED.preferences,
      constraints = EXCLUDED.constraints,
      signals = EXCLUDED.signals,
      updated_at = NOW()
  `;

  await sql`
    INSERT INTO planner_agent_runs (id, user_id, run_type, status, input_snapshot, output_snapshot)
    VALUES (
      ${createId()},
      ${userId},
      'generate-initial',
      'completed',
      ${JSON.stringify({ profile, answersMap, horizonType })}::jsonb,
      ${JSON.stringify(planData)}::jsonb
    )
  `;

  return { cycleId, planData };
}
