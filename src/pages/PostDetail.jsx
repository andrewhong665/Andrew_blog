// src/pages/PostDetail.jsx
import { useParams, Link } from "react-router-dom";
import { posts } from "../data/posts";
import Header from "../components/Header";
import Footer from "../components/Footer";

function PostDetail() {
  const { id } = useParams();
  const post = posts.find((p) => p.id === Number(id));

  if (!post) {
    return (
      <>
        <Header />
        <main className="container">
          <h1>Post not found</h1>
          <Link to="/">Go back to home</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <Link to="/" className="back-link">← Back to all posts</Link>
        <article className="post-detail">
          <h1>{post.title}</h1>
          <div className="post-meta">{post.date}</div>
          <div className="post-content">
            <p>{post.content}</p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

export default PostDetail;
