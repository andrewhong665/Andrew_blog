// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import DataTable from "./pages/DataTable";

function App() {
  return (
    <>
      {/* 流星背景（固定在最底層） */}
      <section className="falling-stars" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${5 + Math.random() * 7}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.6 + Math.random() * 0.4,
              transform: `scale(${0.6 + Math.random() * 0.8})`,
            }}
          />
        ))}
      </section>

      {/* 頁面內容（路由） */}
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostDetail />} />
          {/* 之後會從 Supabase 讀取資料的表格頁面 */}
          <Route path="/table" element={<DataTable />} />
        </Routes>
      </div>
    </>
  );
}

export default App;