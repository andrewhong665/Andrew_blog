// src/pages/DataTable.jsx
// 這個頁面之後會改成從 Supabase 抓資料。
// 目前先用假資料(fakeData)顯示表格結構。
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// TODO: 之後刪掉這段假資料,改成呼叫 Supabase
// import { supabase } from "../lib/supabase";
const fakeData = [
  { id: 1, title: "Sample Item 1", category: "study",  created_at: "2026-09-20" },
  { id: 2, title: "Sample Item 2", category: "life",   created_at: "2026-09-21" },
  { id: 3, title: "Sample Item 3", category: "travel", created_at: "2026-09-22" },
];

function DataTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 之後改成真的 Supabase 查詢,例如:
    // async function load() {
    //   const { data, error } = await supabase.from("items").select("*");
    //   if (!error) setItems(data);
    //   setLoading(false);
    // }
    // load();

    // 目前先用假資料模擬
    setItems(fakeData);
    setLoading(false);
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <h1>Data Table</h1>
        <p className="post-summary">
          This table will load data from Supabase later.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td>{item.created_at}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="4">No data yet.</td>
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
