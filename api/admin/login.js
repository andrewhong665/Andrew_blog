import {
  getAdminCredentials,
  getRequestBody,
  isSameOrigin,
  makeSessionCookie,
  safeEqual,
  sendJson,
} from "../../server/admin.js";

const attemptsByIp = new Map();
const attemptWindowMilliseconds = 15 * 60 * 1000;
const maximumAttempts = 8;

function isRateLimited(ip) {
  const now = Date.now();

  if (attemptsByIp.size > 1000) {
    for (const [trackedIp, trackedAttempts] of attemptsByIp) {
      const recentAttempts = trackedAttempts.filter(
        (attempt) => now - attempt < attemptWindowMilliseconds,
      );

      if (recentAttempts.length === 0) {
        attemptsByIp.delete(trackedIp);
      } else {
        attemptsByIp.set(trackedIp, recentAttempts);
      }
    }
  }

  const attempts = (attemptsByIp.get(ip) ?? []).filter(
    (attempt) => now - attempt < attemptWindowMilliseconds,
  );

  attemptsByIp.set(ip, attempts);
  return attempts.length >= maximumAttempts;
}

function recordAttempt(ip) {
  const attempts = attemptsByIp.get(ip) ?? [];
  attempts.push(Date.now());
  attemptsByIp.set(ip, attempts);
}

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { error: "Request origin is not allowed." });
  }

  const ip =
    request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return sendJson(response, 429, {
      error: "Too many login attempts. Please try again later.",
    });
  }

  try {
    const credentials = getAdminCredentials();
    const body = getRequestBody(request);
    const username =
      typeof body?.username === "string" ? body.username : "";
    const password =
      typeof body?.password === "string" ? body.password : "";

    if (
      !safeEqual(username, credentials.username) ||
      !safeEqual(password, credentials.password)
    ) {
      recordAttempt(ip);
      return sendJson(response, 401, {
        error: "The username or password is incorrect.",
      });
    }

    attemptsByIp.delete(ip);
    response.setHeader(
      "Set-Cookie",
      makeSessionCookie(request, credentials.username),
    );
    return sendJson(response, 200, { success: true });
  } catch (error) {
    console.error("Admin sign-in configuration error:", error);
    return sendJson(response, 500, {
      error: "Administrator sign-in is not configured correctly.",
    });
  }
}
