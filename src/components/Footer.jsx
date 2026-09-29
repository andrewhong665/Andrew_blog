import { useRef, useState } from "react";
import { useAdmin } from "../admin/AdminContext";

function Footer() {
  const { isAdmin, login, logout } = useAdmin();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clickCount = useRef(0);
  const resetClickCountTimer = useRef(null);

  function handleCopyrightClick() {
    clickCount.current += 1;
    clearTimeout(resetClickCountTimer.current);

    if (clickCount.current >= 4) {
      clickCount.current = 0;
      setError("");
      setIsLoginOpen(true);
      return;
    }

    resetClickCountTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 1500);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(username, password);
      setPassword("");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setIsSubmitting(true);

    try {
      await logout();
      setIsLoginOpen(false);
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Unable to sign out.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <footer className="footer">
      <button
        className="footer-admin-trigger"
        type="button"
        aria-label="Open administrator sign-in by clicking four times"
        onClick={handleCopyrightClick}
      >
        © Anderw React Blog
      </button>

      {isLoginOpen && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsLoginOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="admin-login-title"
            aria-modal="true"
            className="admin-modal"
            role="dialog"
          >
            <button
              aria-label="Close administrator dialog"
              className="admin-modal-close"
              type="button"
              onClick={() => setIsLoginOpen(false)}
            >
              ×
            </button>
            <p className="album-eyebrow">PRIVATE ACCESS</p>
            <h2 id="admin-login-title">
              {isAdmin ? "Administrator" : "Admin login"}
            </h2>
            {isAdmin ? (
              <>
                <p className="admin-session-message">
                  You are signed in. You can now manage album photos.
                </p>
                <button
                  className="admin-button admin-button-secondary"
                  disabled={isSubmitting}
                  type="button"
                  onClick={handleLogout}
                >
                  {isSubmitting ? "Signing out..." : "Sign out"}
                </button>
              </>
            ) : (
              <form className="admin-login-form" onSubmit={handleSubmit}>
                <label>
                  Username
                  <input
                    autoComplete="username"
                    autoFocus
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    value={username}
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {error && (
                  <p className="admin-form-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="admin-button"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}
            {isAdmin && error && (
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </footer>
  );
}

export default Footer;
