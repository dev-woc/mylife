import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);

let schemaPromise;

export function createId() {
  return crypto.randomUUID();
}

export function ensurePlannerSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS planner_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS planner_sessions_user_idx ON planner_sessions (user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS planner_sessions_expires_idx ON planner_sessions (expires_at)`;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_day_tasks (
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          hour NUMERIC NOT NULL,
          tasks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, date, hour)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_day_blocks (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          start_hour NUMERIC NOT NULL,
          end_hour NUMERIC NOT NULL,
          label TEXT NOT NULL DEFAULT '',
          tasks TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS planner_day_blocks_user_date_idx ON planner_day_blocks (user_id, date, start_hour)`;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_day_todos (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          text TEXT NOT NULL,
          done BOOLEAN NOT NULL DEFAULT FALSE,
          position INTEGER NOT NULL,
          start_hour NUMERIC NULL,
          end_hour NUMERIC NULL,
          block_id TEXT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS planner_day_todos_user_date_idx ON planner_day_todos (user_id, date, position, id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_day_stops (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          position INTEGER NOT NULL,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          lat DOUBLE PRECISION NULL,
          lng DOUBLE PRECISION NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS planner_day_stops_user_date_idx ON planner_day_stops (user_id, date, position)`;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_task_stop_links (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          hour NUMERIC NULL,
          block_id TEXT NULL,
          task_text TEXT NOT NULL,
          stop_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS planner_task_stop_links_user_date_idx ON planner_task_stop_links (user_id, date)`;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_day_habits (
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          label TEXT NOT NULL,
          done BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, date, label)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_day_notes (
          user_id TEXT NOT NULL,
          date DATE NOT NULL,
          text TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, date)
        )
      `;
    })();
  }

  return schemaPromise;
}

export async function importLegacyData(userId) {
  await ensurePlannerSchema();

  const [{ task_count }] = await sql`
    SELECT COUNT(*)::int AS task_count FROM planner_day_tasks WHERE user_id = ${userId}
  `;
  if (Number(task_count) > 0) return;

  const legacyTables = [
    "day_tasks",
    "day_blocks",
    "day_todos",
    "day_stops",
    "task_stop_links",
    "day_habits",
    "day_notes",
  ];

  const checks = await Promise.all(
    legacyTables.map((name) => sql`SELECT to_regclass(${name}) AS table_name`)
  );
  const hasLegacy = checks.some((rows) => rows[0]?.table_name);
  if (!hasLegacy) return;

  if (checks[0][0]?.table_name) {
    await sql`
      INSERT INTO planner_day_tasks (user_id, date, hour, tasks, updated_at)
      SELECT ${userId}, date, hour, tasks, COALESCE(updated_at, NOW())
      FROM day_tasks
      ON CONFLICT (user_id, date, hour) DO NOTHING
    `;
  }

  if (checks[1][0]?.table_name) {
    await sql`
      INSERT INTO planner_day_blocks (id, user_id, date, start_hour, end_hour, label, tasks, updated_at, created_at)
      SELECT id::text, ${userId}, date, start_hour, end_hour, COALESCE(label, ''), COALESCE(tasks, ARRAY[]::TEXT[]), COALESCE(updated_at, NOW()), NOW()
      FROM day_blocks
      ON CONFLICT (id) DO NOTHING
    `;
  }

  if (checks[2][0]?.table_name) {
    await sql`
      INSERT INTO planner_day_todos (id, user_id, date, text, done, position, start_hour, end_hour, block_id, updated_at, created_at)
      SELECT id::text, ${userId}, date, text, COALESCE(done, FALSE), position, start_hour, end_hour, block_id::text, NOW(), NOW()
      FROM day_todos
      ON CONFLICT (id) DO NOTHING
    `;
  }

  if (checks[3][0]?.table_name) {
    await sql`
      INSERT INTO planner_day_stops (id, user_id, date, position, name, address, lat, lng, updated_at, created_at)
      SELECT id::text, ${userId}, date, position, name, address, lat::float, lng::float, COALESCE(updated_at, NOW()), NOW()
      FROM day_stops
      ON CONFLICT (id) DO NOTHING
    `;
  }

  if (checks[4][0]?.table_name) {
    await sql`
      INSERT INTO planner_task_stop_links (id, user_id, date, hour, block_id, task_text, stop_id, created_at)
      SELECT id::text, ${userId}, date, hour, block_id::text, task_text, stop_id::text, NOW()
      FROM task_stop_links
      ON CONFLICT (id) DO NOTHING
    `;
  }

  if (checks[5][0]?.table_name) {
    await sql`
      INSERT INTO planner_day_habits (user_id, date, label, done, updated_at)
      SELECT ${userId}, date, label, COALESCE(done, FALSE), NOW()
      FROM day_habits
      ON CONFLICT (user_id, date, label) DO NOTHING
    `;
  }

  if (checks[6][0]?.table_name) {
    await sql`
      INSERT INTO planner_day_notes (user_id, date, text, updated_at)
      SELECT ${userId}, date, COALESCE(text, ''), COALESCE(updated_at, NOW())
      FROM day_notes
      ON CONFLICT (user_id, date) DO NOTHING
    `;
  }
}
