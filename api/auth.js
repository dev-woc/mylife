import { clearSession, createSession, getSessionUser, hashPassword, normalizeUsername, verifyPassword } from "./_lib/auth.js";
import { createId, ensurePlannerSchema, importLegacyData, sql } from "./_lib/db.js";

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  await ensurePlannerSchema();

  if (req.method === "GET") {
    const user = await getSessionUser(req);
    return sendJson(res, 200, { user });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const { action, username, password } = req.body || {};

  if (action === "logout") {
    await clearSession(req, res);
    return sendJson(res, 200, { ok: true });
  }

  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !password) {
    return sendJson(res, 400, { error: "username and password are required" });
  }
  if (!/^[a-z0-9_-]{3,24}$/.test(normalizedUsername)) {
    return sendJson(res, 400, { error: "username must be 3-24 characters using letters, numbers, underscores, or hyphens" });
  }
  if (password.length < 8) {
    return sendJson(res, 400, { error: "password must be at least 8 characters" });
  }

  if (action === "register") {
    const existing = await sql`SELECT id FROM planner_users WHERE username = ${normalizedUsername} LIMIT 1`;
    if (existing.length) {
      return sendJson(res, 409, { error: "username already exists" });
    }

    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM planner_users`;
    const userId = createId();
    await sql`
      INSERT INTO planner_users (id, username, password_hash)
      VALUES (${userId}, ${normalizedUsername}, ${hashPassword(password)})
    `;

    if (Number(count) === 0) {
      await importLegacyData(userId);
    }

    await createSession(res, userId);
    return sendJson(res, 201, { user: { id: userId, username: normalizedUsername } });
  }

  if (action === "login") {
    const [user] = await sql`
      SELECT id, username, password_hash
      FROM planner_users
      WHERE username = ${normalizedUsername}
      LIMIT 1
    `;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return sendJson(res, 401, { error: "invalid username or password" });
    }

    await createSession(res, user.id);
    return sendJson(res, 200, { user: { id: user.id, username: user.username } });
  }

  return sendJson(res, 400, { error: "invalid action" });
}
