import { randomUUID } from "node:crypto";
import {
  bucketName,
  createStorageAdmin,
  getRequestBody,
  isSameOrigin,
  requireAdmin,
  sendJson,
} from "../../server/admin.js";

const extensionsToTypes = new Map([
  ["avif", "image/avif"],
  ["bmp", "image/bmp"],
  ["gif", "image/gif"],
  ["heic", "image/heic"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["svg", "image/svg+xml"],
  ["webp", "image/webp"],
]);
const maximumFileSize = 100 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  if (!isSameOrigin(request)) {
    return sendJson(response, 403, { error: "Request origin is not allowed." });
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  const body = getRequestBody(request);
  const fileName =
    typeof body?.fileName === "string" ? body.fileName.trim() : "";
  const fileSize = Number(body?.fileSize);
  const extension = fileName.split(".").pop()?.toLowerCase();
  const contentType = extensionsToTypes.get(extension);

  if (!contentType || !Number.isFinite(fileSize) || fileSize <= 0) {
    return sendJson(response, 400, {
      error: "Choose a supported image file.",
    });
  }

  if (fileSize > maximumFileSize) {
    return sendJson(response, 413, {
      error: "Images must be 100 MB or smaller.",
    });
  }

  try {
    const path = `${randomUUID()}.${extension}`;
    const { data, error } = await createStorageAdmin()
      .storage.from(bucketName)
      .createSignedUploadUrl(path);

    if (error) {
      throw error;
    }

    if (!data?.token) {
      throw new Error("Supabase did not return a signed upload token.");
    }

    return sendJson(response, 200, {
      path,
      token: data.token,
      contentType,
    });
  } catch (error) {
    console.error("Unable to create photo upload authorization:", error);
    return sendJson(response, 500, {
      error: "Unable to prepare the upload. Check Storage configuration.",
    });
  }
}
