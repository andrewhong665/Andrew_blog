import { isAdminSession, sendJson } from "../../server/admin.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  return sendJson(response, 200, { isAdmin: isAdminSession(request) });
}
