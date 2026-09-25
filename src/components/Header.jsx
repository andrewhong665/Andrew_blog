// src/components/Header.jsx
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        My React Blog
      </Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/table">Data Table</Link>
      </nav>
    </header>
  );
}

export default Header;
