import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

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

          {user ? (
            <NavLink to="/dashboard" className="nav-link nav-link-user">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="nav-avatar"
                />
              )}
              <span>{user.displayName || "Profil"}</span>
            </NavLink>
          ) : (
            <NavLink to="/Login" className="nav-link">
              Login
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
