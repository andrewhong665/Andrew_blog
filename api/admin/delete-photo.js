import {
  bucketName,
  createStorageAdmin,
  getRequestBody,
  isSameOrigin,
  requireAdmin,
  sendJson,
} from "../../server/admin.js";

const allowedImagePath =
  /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[\w./ -]+\.(?:avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i;

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
  const path = typeof body?.path === "string" ? body.path : "";

  if (!allowedImagePath.test(path)) {
    return sendJson(response, 400, {
      error: "The requested photo path is invalid.",
    });
  }

  try {
    const { error } = await createStorageAdmin()
      .storage.from(bucketName)
      .remove([path]);

    if (error) {
      throw error;
    }

    return sendJson(response, 200, { success: true });
  } catch (error) {
    console.error("Unable to delete album photo:", error);
    return sendJson(response, 500, {
      error: "Unable to delete the photo from Storage.",
    });
  }
}
