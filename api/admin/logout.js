import {
  clearSessionCookie,
  isSameOrigin,
  sendJson,
} from "../../server/admin.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { error: "Request origin is not allowed." });
  }

  response.setHeader("Set-Cookie", clearSessionCookie(request));
  return sendJson(response, 200, { success: true });
}
