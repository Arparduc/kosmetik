import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserData } from "../lib/firebase";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const userData = await getUserData(user.uid);
        setIsAdmin(userData?.isAdmin === true);
      } else {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [user]);

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

          {isAdmin && (
            <NavLink to="/admin" className="nav-link nav-link-admin">
              Admin
            </NavLink>
          )}

          {user ? (
            <NavLink to="/dashboard" className="nav-link nav-link-user">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="nav-avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              )}
              <span>{user.displayName || "Profil"}</span>
            </NavLink>
          ) : (
            <NavLink to="/Login" className="nav-link">
              Bejelentkezés
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
