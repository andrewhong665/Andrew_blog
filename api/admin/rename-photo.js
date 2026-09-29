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
const allowedPhotoName = /^[\p{L}\p{M}\p{N}\p{P}\p{S} ]{1,100}$/u;

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
  const requestedName = typeof body?.name === "string" ? body.name : "";
  const name = requestedName.trim();

  if (!allowedImagePath.test(path)) {
    return sendJson(response, 400, {
      error: "The requested photo path is invalid.",
    });
  }

  if (
    !allowedPhotoName.test(name) ||
    name !== requestedName ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\\")
  ) {
    return sendJson(response, 400, {
      error:
        "Use a photo name of 1 to 100 characters without leading or trailing spaces or path separators.",
    });
  }

  const extension = path.match(/\.([^./]+)$/)?.[1];
  const fileName = `${name}.${extension}`;
  const directory = path.includes("/")
    ? path.slice(0, path.lastIndexOf("/") + 1)
    : "";
  const newPath = `${directory}${fileName}`;

  if (newPath === path) {
    return sendJson(response, 400, {
      error: "Enter a different photo name.",
    });
  }

  try {
    const { error } = await createStorageAdmin()
      .storage.from(bucketName)
      .move(path, newPath);

    if (error) {
      throw error;
    }

    return sendJson(response, 200, { success: true, path: newPath });
  } catch (error) {
    console.error("Unable to rename album photo:", error);
    return sendJson(response, 500, {
      error: "Unable to rename the photo in Storage.",
    });
  }
}
