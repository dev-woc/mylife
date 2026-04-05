import crypto from "node:crypto";
import { createId, ensurePlannerSchema, sql } from "./db.js";

const SESSION_COOKIE = "planner_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function buildCookie(value, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function normalizeUsername(username = "") {
  return username.trim().toLowerCase();
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash = "") {
  const [salt, savedHash] = storedHash.split(":");
  if (!salt || !savedHash) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(savedHash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

export async function getSessionUser(req) {
  await ensurePlannerSchema();

  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE];
  if (!sessionId) return null;

  const [row] = await sql`
    SELECT planner_users.id, planner_users.username
    FROM planner_sessions
    JOIN planner_users ON planner_users.id = planner_sessions.user_id
    WHERE planner_sessions.id = ${sessionId}
      AND planner_sessions.expires_at > NOW()
    LIMIT 1
  `;

  if (!row) {
    return null;
  }

  return { id: row.id, username: row.username };
}

export async function requireUser(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user;
}

export async function createSession(res, userId) {
  await ensurePlannerSchema();

  const sessionId = createId();
  await sql`
    INSERT INTO planner_sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, NOW() + INTERVAL '30 days')
  `;
  res.setHeader("Set-Cookie", buildCookie(sessionId, SESSION_MAX_AGE));
}

export async function clearSession(req, res) {
  await ensurePlannerSchema();

  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies[SESSION_COOKIE];
  if (sessionId) {
    await sql`DELETE FROM planner_sessions WHERE id = ${sessionId}`;
  }
  res.setHeader("Set-Cookie", buildCookie("", 0));
}
