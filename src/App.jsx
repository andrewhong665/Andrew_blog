// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import DataTable from "./pages/DataTable";
import Album from "./pages/Album";
import Latest from "./pages/Latest";

const stars = Array.from({ length: 24 }, (_, index) => ({
  left: `${(index * 41 + 13) % 100}%`,
  animationDuration: `${5 + (index % 8)}s`,
  animationDelay: `${((index * 7) % 50) / 10}s`,
  opacity: 0.22 + ((index * 3) % 6) * 0.05,
  transform: `scale(${0.6 + ((index * 2) % 5) * 0.1})`,
}));

function App() {
  return (
    <>
      <section className="falling-stars" aria-hidden="true">
        {stars.map((star, index) => (
          <span key={index} className="star" style={star} />
        ))}
      </section>

      {/* 頁面內容（路由） */}
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/post/:id" element={<PostDetail />} />
          {/* 之後會從 Supabase 讀取資料的表格頁面 */}
          <Route path="/table" element={<DataTable />} />
          <Route path="/album" element={<Album />} />
        </Routes>
      </div>
    </>
  );
}

export default App;