import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="nav-inner">
        <Link to="/" className="brand">
          Black Beauty
        </Link>

        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Menü"
          onClick={() => setOpen((s) => !s)}
        >
          ☰
        </button>

        <div
          className={`nav-menu ${open ? "open" : ""}`}
          onClick={() => setOpen(false)}
        >
          <NavLink to="/services" className="nav-link">
            Szolgáltatások
          </NavLink>
          <NavLink to="/booking" className="nav-link">
            Időpontfoglalás
          </NavLink>
          <NavLink to="/contact" className="nav-link">
            Kapcsolat
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
