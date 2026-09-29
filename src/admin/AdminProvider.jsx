import { useEffect, useMemo, useState } from "react";
import { AdminContext } from "./AdminContext";

async function getResponseError(response, fallback) {
  const result = await response.json().catch(() => ({}));
  return result.error || fallback;
}

function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await getResponseError(response, "Session check failed."),
          );
        }

        return response.json();
      })
      .then((result) => {
        if (isCurrent) {
          setIsAdmin(result.isAdmin === true);
        }
      })
      .catch((error) => {
        console.error("Unable to check administrator session:", error);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function login(username, password) {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(await getResponseError(response, "Sign-in failed."));
    }

    setIsAdmin(true);
  }

  async function logout() {
    const response = await fetch("/api/admin/logout", { method: "POST" });

    if (!response.ok) {
      throw new Error(await getResponseError(response, "Sign-out failed."));
    }

    setIsAdmin(false);
  }

  const value = useMemo(() => ({ isAdmin, login, logout }), [isAdmin]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export default AdminProvider;
