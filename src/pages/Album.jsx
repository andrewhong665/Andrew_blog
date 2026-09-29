import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAdmin } from "../admin/AdminContext";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function getImageTitle(path) {
  const fileName = path.split("/").at(-1) ?? path;
  return fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
}

async function parseApiResponse(response, fallbackMessage) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || fallbackMessage);
  }

  return result;
}

function Album() {
  const { isAdmin } = useAdmin();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState("");
  const fileInput = useRef(null);

  const loadPhotos = useCallback(async () => {
    const response = await fetch("/api/photos", { cache: "no-store" });
    const result = await parseApiResponse(
      response,
      "Unable to load the photo album.",
    );
    return result.photos ?? [];
  }, []);

  useEffect(() => {
    let isCurrent = true;

    loadPhotos()
      .then((albumPhotos) => {
        if (isCurrent) {
          setPhotos(albumPhotos);
        }
      })
      .catch((loadError) => {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "An unexpected error occurred while loading the album.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [loadPhotos]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const authorizationResponse = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
        }),
      });
      const authorization = await parseApiResponse(
        authorizationResponse,
        "Unable to prepare the photo upload.",
      );

      if (!supabase) {
        throw new Error("Supabase is not configured in this deployment.");
      }

      const { error: uploadError } = await supabase.storage
        .from("Andrew_Blog_photos")
        .uploadToSignedUrl(
          authorization.path,
          authorization.token,
          file,
          { contentType: authorization.contentType },
        );

      if (uploadError) {
        throw uploadError;
      }

      setPhotos(await loadPhotos());
    } catch (uploadFailure) {
      setError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Unable to upload this photo.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(photo) {
    if (!window.confirm(`Permanently delete "${getImageTitle(photo.path)}"?`)) {
      return;
    }

    setDeletingPath(photo.path);
    setError("");

    try {
      const response = await fetch("/api/admin/delete-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: photo.path }),
      });
      await parseApiResponse(response, "Unable to delete this photo.");
      setPhotos((currentPhotos) =>
        currentPhotos.filter((currentPhoto) => currentPhoto.path !== photo.path),
      );
    } catch (deleteFailure) {
      setError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Unable to delete this photo.",
      );
    } finally {
      setDeletingPath("");
    }
  }

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

        {isAdmin && (
          <div className="album-admin-tools">
            <input
              accept="image/avif,image/bmp,image/gif,image/heic,image/jpeg,image/png,image/svg+xml,image/webp,.avif,.bmp,.gif,.heic,.jpeg,.jpg,.png,.svg,.webp"
              className="visually-hidden"
              onChange={handleUpload}
              ref={fileInput}
              type="file"
            />
            <button
              className="admin-button"
              disabled={isUploading}
              type="button"
              onClick={() => fileInput.current?.click()}
            >
              {isUploading ? "Uploading..." : "Upload photo"}
            </button>
            <span>Up to 100 MB per image</span>
          </div>
        )}

        {error && (
          <p className="table-message" role="alert">
            {error}
          </p>
        )}

        {!isSupabaseConfigured ? (
          <p className="table-message" role="alert">
            Supabase is not configured. Add the project URL and publishable key
            to the deployment environment.
          </p>
        ) : loading ? (
          <p className="table-message" role="status" aria-live="polite">
            Loading photos...
          </p>
        ) : photos.length === 0 ? (
          <p className="table-message">
            No photos found in <code>Andrew_Blog_photos</code> yet. Upload
            images to the bucket and they will appear here.
          </p>
        ) : (
          <div className="album-grid">
            {photos.map((photo) => (
              <article className="album-photo" key={photo.path}>
                <a
                  className="album-photo-link"
                  href={photo.url}
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
                {isAdmin && (
                  <button
                    aria-label={`Delete ${getImageTitle(photo.path)}`}
                    className="album-delete-button"
                    disabled={deletingPath === photo.path}
                    type="button"
                    onClick={() => handleDelete(photo)}
                  >
                    {deletingPath === photo.path ? "Deleting..." : "Delete"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default Album;
