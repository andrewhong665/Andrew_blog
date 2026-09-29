import {
  bucketName,
  createStorageAdmin,
  sendJson,
} from "../server/admin.js";

const pageSize = 100;
const imageExtensions = /\.(avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i;

function isImage(file) {
  return (
    file.metadata?.mimetype?.startsWith("image/") ||
    imageExtensions.test(file.name)
  );
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  try {
    const storage = createStorageAdmin().storage;
    const { data: bucket, error: bucketError } =
      await storage.getBucket(bucketName);

    if (bucketError) {
      throw bucketError;
    }

    if (!bucket?.public) {
      return sendJson(response, 403, {
        error: "The photo album bucket must be public to display its photos.",
      });
    }

    const folders = [""];
    const visitedFolders = new Set();
    const imagePaths = [];

    while (folders.length > 0) {
      const prefix = folders.pop();

      if (visitedFolders.has(prefix)) {
        continue;
      }

      visitedFolders.add(prefix);
      let offset = 0;

      while (true) {
        const { data, error } = await storage.from(bucketName).list(prefix, {
          limit: pageSize,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

        if (error) {
          throw error;
        }

        const entries = data ?? [];

        for (const entry of entries) {
          const path = prefix ? `${prefix}/${entry.name}` : entry.name;

          if (entry.id === null && entry.metadata === null) {
            folders.push(path);
          } else if (isImage(entry)) {
            imagePaths.push(path);
          }
        }

        if (entries.length < pageSize) {
          break;
        }

        offset += pageSize;
      }
    }

    const photos = imagePaths.map((path) => {
      const { data } = storage.from(bucketName).getPublicUrl(path, {
        transform: { width: 1000, height: 750, resize: "contain" },
      });
      return { path, url: data.publicUrl };
    });

    return sendJson(response, 200, { photos });
  } catch (error) {
    console.error("Unable to load the public photo album:", error);
    return sendJson(response, 500, {
      error: "Unable to load the photo album. Check server Storage configuration.",
    });
  }
}
