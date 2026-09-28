// src/components/Header.jsx
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className={`header${isOpen ? " is-open" : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocusCapture={() => setIsOpen(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        className="menu-toggle"
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls="main-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="menu-icon" aria-hidden="true">
          ☰
        </span>
        <span className="menu-toggle-label">Menu</span>
      </button>

      <Link to="/" className="logo" aria-label="Anderw Blog home page">
        Anderw Blog
      </Link>

      <nav className="main-menu" id="main-menu" aria-label="Main menu">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/table">Data Table</NavLink>
        <NavLink to="/album">Photo Album</NavLink>
        <NavLink to="/latest">Latest</NavLink>
      </nav>
    </header>
  );
}

export default Header;
