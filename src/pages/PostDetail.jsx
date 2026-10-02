// src/pages/PostDetail.jsx
import { useParams, Link } from "react-router-dom";
import { posts } from "../data/posts";
import Header from "../components/Header";
import Footer from "../components/Footer";

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPostContent(content) {
  const escapedContent = escapeHtml(content);
  const withBold = escapedContent.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = withBold.split("\n");
  const blocks = [];
  let listItems = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (listItems.length > 0) {
        blocks.push(`<ul>${listItems.join("")}</ul>`);
        listItems = [];
      }
      return;
    }

    if (trimmedLine.startsWith("- ")) {
      listItems.push(`<li>${trimmedLine.slice(2)}</li>`);
      return;
    }

    if (listItems.length > 0) {
      blocks.push(`<ul>${listItems.join("")}</ul>`);
      listItems = [];
    }

    blocks.push(`<p>${trimmedLine}</p>`);
  });

  if (listItems.length > 0) {
    blocks.push(`<ul>${listItems.join("")}</ul>`);
  }

  return { __html: blocks.join("") };
}

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
          <div
            className="post-content"
            dangerouslySetInnerHTML={renderPostContent(post.content)}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}

export default PostDetail;
