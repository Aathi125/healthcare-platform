import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { roleHomePath, useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-brand" onClick={closeMenu}>
          <div className="site-brand__icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)"/>
              <path d="M16 8C13.79 8 12 9.79 12 12C12 13.1 12.45 14.1 13.17 14.83L14.59 13.41C14.21 13.03 14 12.55 14 12C14 10.9 14.9 10 16 10C17.1 10 18 10.9 18 12C18 12.55 17.79 13.03 17.41 13.41L18.83 14.83C19.55 14.1 20 13.1 20 12C20 9.79 18.21 8 16 8Z" fill="white"/>
              <path d="M16 4C11.58 4 8 7.58 8 12C8 16.42 11.58 20 16 20C20.42 20 24 16.42 24 12C24 7.58 20.42 4 16 4ZM16 18C12.69 18 10 15.31 10 12C10 8.69 12.69 6 16 6C19.31 6 22 8.69 22 12C22 15.31 19.31 18 16 18Z" fill="white"/>
              <rect x="14" y="20" width="4" height="8" fill="white"/>
              <rect x="12" y="26" width="8" height="2" fill="white"/>
            </svg>
          </div>
          <div className="site-brand__text">
            <span className="site-brand__name">medicare</span>
            <span className="site-brand__tagline">Smart Healthcare</span>
          </div>
        </Link>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="site-header__toggle-line"></span>
          <span className="site-header__toggle-line"></span>
          <span className="site-header__toggle-line"></span>
        </button>

        <div id="public-navigation" className={`site-header__panel${menuOpen ? " is-open" : ""}`}>
          <nav className="site-nav">
            <NavLink to="/" end onClick={closeMenu} className="site-nav__link">
              Home
            </NavLink>
            <NavLink to="/doctors" onClick={closeMenu} className="site-nav__link">
              Doctors
            </NavLink>
            <Link to="/#platform-features" onClick={closeMenu} className="site-nav__link">
              Features
            </Link>
          </nav>

          <div className="site-header__actions">
            {isAuthenticated ? (
              <>
                <div className="site-user">
                  <div className="site-user__avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="site-user__info">
                    <span className="site-user__name">{user?.name || "User"}</span>
                    <span className="site-user__role">{user?.role?.toLowerCase() || "patient"} workspace</span>
                  </div>
                </div>
                <Link className="btn btn-outline" to={roleHomePath(user?.role)} onClick={closeMenu}>
                  Dashboard
                </Link>
                <button type="button" className="btn btn-primary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline" to="/login" onClick={closeMenu}>
                  Sign In
                </Link>
                <Link className="btn btn-primary" to="/register-patient" onClick={closeMenu}>
                  Start Care Journey
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
