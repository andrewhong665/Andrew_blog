import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

export const bucketName = "Andrew_Blog_photos";
export const sessionCookie = "admin_session";
const sessionDurationSeconds = 8 * 60 * 60;

export function sendJson(response, status, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.status(status).json(payload);
}

export function isSameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers["x-forwarded-host"] ?? request.headers.host;
  const protocol = request.headers["x-forwarded-proto"] ?? "https";

  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

export function getRequestBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return null;
    }
  }

  return null;
}

export function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  }

  return secret;
}

function sign(payload) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function cookieOptions(request, maxAge) {
  const secure =
    process.env.VERCEL === "1" ||
    request.headers["x-forwarded-proto"] === "https";

  return [
    `${sessionCookie}=`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function makeSessionCookie(request, username) {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      expiresAt: Math.floor(Date.now() / 1000) + sessionDurationSeconds,
    }),
  ).toString("base64url");

  return cookieOptions(request, sessionDurationSeconds).replace(
    `${sessionCookie}=`,
    `${sessionCookie}=${payload}.${sign(payload)}`,
  );
}

export function clearSessionCookie(request) {
  return cookieOptions(request, 0);
}

export function isAdminSession(request) {
  const cookieHeader = request.headers.cookie ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookie}=`));
  const token = cookie?.slice(sessionCookie.length + 1);

  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  try {
    if (!safeEqual(signature, sign(payload))) {
      return false;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );

    return (
      session.username === (process.env.ADMIN_USERNAME || "Admin") &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function createStorageAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Server-side Supabase Storage credentials are not set.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function requireAdmin(request, response) {
  if (!isAdminSession(request)) {
    sendJson(response, 401, { error: "Please sign in as the administrator." });
    return false;
  }

  return true;
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || "Admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be set to at least 12 characters.");
  }

  getSessionSecret();
  return { username, password };
}
