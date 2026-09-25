// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { posts } from "../data/posts";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Header />
      <main className="container">
        <h1>All Posts</h1>
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.id} className="post-item">
              <Link to={`/post/${post.id}`} className="post-title">
                {post.title}
              </Link>
              <div className="post-meta">{post.date}</div>
              <p className="post-summary">{post.summary}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}

export default Home;
