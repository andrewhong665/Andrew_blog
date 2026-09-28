import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function DataTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let isCurrent = true;

    async function loadItems() {
      try {
        const { data, error: queryError } = await supabase
          .from("MyInfo")
          .select("*");

        if (!isCurrent) {
          return;
        }

        if (queryError) {
          setError(queryError.message);
        } else {
          setRows(data ?? []);
        }
      } catch (queryFailure) {
        if (isCurrent) {
          setError(
            queryFailure instanceof Error
              ? queryFailure.message
              : "An unexpected error occurred.",
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <h1>MyInfo</h1>

        {!isSupabaseConfigured ? (
          <p className="table-message" role="alert">
            Supabase is not configured. Add your project URL and publishable
            key to a local <code>.env</code> file, then restart the app.
          </p>
        ) : error ? (
          <p className="table-message" role="alert">
            Could not load MyInfo from Supabase: {error}
          </p>
        ) : loading ? (
          <p className="table-message" role="status" aria-live="polite">
            Loading MyInfo...
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {rows.length > 0 &&
                  Object.keys(rows[0]).map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id ?? index}>
                  {Object.values(row).map((value, cellIndex) => (
                    <td key={cellIndex}>{formatCellValue(value)}</td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td>No MyInfo rows found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </main>
      <Footer />
    </>
  );
}

export default DataTable;
