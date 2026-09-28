import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const bucketName = "Andrew_Blog_photos";
const providedPhotoPath = "IMG_5697.HEIC";
const pageSize = 100;
const imageExtensions = /\.(avif|bmp|gif|heic|jpe?g|png|svg|webp)$/i;

function isImage(file) {
  return (
    file.metadata?.mimetype?.startsWith("image/") ||
    imageExtensions.test(file.name)
  );
}

function getImageTitle(path) {
  const fileName = path.split("/").at(-1) ?? path;
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
}

async function listAlbumImages() {
  const storage = supabase.storage.from(bucketName);
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
      const { data, error } = await storage.list(prefix, {
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

  const listedPhotos = await Promise.all(
    imagePaths.map(async (path) => {
      const { data, error } = await storage.createSignedUrl(path, 3600);

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(`Could not create a viewing link for ${path}.`);
      }

      return { path, url: data.signedUrl };
    }),
  );

  if (!imagePaths.includes(providedPhotoPath)) {
    const { data } = storage.getPublicUrl(providedPhotoPath, {
      transform: {
        width: 1000,
        height: 750,
        resize: "contain",
      },
    });

    listedPhotos.push({ path: providedPhotoPath, url: data.publicUrl });
  }

  return listedPhotos;
}

function Album() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isCurrent = true;

    async function loadPhotos() {
      try {
        const albumPhotos = await listAlbumImages();

        if (isCurrent) {
          setPhotos(albumPhotos);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "An unexpected error occurred while loading the album.",
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadPhotos();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <div className="album-heading">
          <div>
            <p className="album-eyebrow">PHOTO COLLECTION</p>
            <h1>Andrew&apos;s Album</h1>
          </div>
          {!loading && !error && (
            <p className="album-count">
              {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </p>
          )}
        </div>

        {!isSupabaseConfigured ? (
          <p className="table-message" role="alert">
            Supabase is not configured. Add your project URL and publishable
            key to a local <code>.env</code> file, then restart the app.
          </p>
        ) : error ? (
          <p className="table-message" role="alert">
            Could not load the photo album: {error}
          </p>
        ) : loading ? (
          <p className="table-message" role="status" aria-live="polite">
            Loading photos...
          </p>
        ) : photos.length === 0 ? (
          <p className="table-message">
            No photos found in <code>{bucketName}</code> yet. Upload images to
            the bucket and they will appear here.
          </p>
        ) : (
          <div className="album-grid">
            {photos.map((photo) => (
              <a
                className="album-photo"
                href={photo.url}
                key={photo.path}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={photo.url}
                  alt={getImageTitle(photo.path)}
                  loading="lazy"
                />
                <span className="album-photo-title">
                  {getImageTitle(photo.path)}
                </span>
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default Album;
