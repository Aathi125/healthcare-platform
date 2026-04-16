import { useState } from "react";
import "./platform-chrome.css";

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {"hub"|"auth"|"consult"|null} props.activePage
 * @param {boolean} [props.showHero]
 */
export function PlatformChrome({ children, activePage = null, showHero = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="platform-root">
      <a className="mc-skip" href="#main-content">
        Skip to content
      </a>

      <header className="mc-topbar">
        <div className="mc-topbar-inner">
          <a className="mc-logo" href="/">
            <span className="mc-logo-mark" aria-hidden="true">
              +
            </span>
            <span>Care Platform</span>
          </a>

          <div className="mc-nav-util">
            <a
              className={`mc-util-link ${activePage === "consult" ? "mc-nav-active" : ""}`}
              href="/consult.html"
            >
              Request appointment
            </a>
            <a
              className={`mc-util-link ${activePage === "auth" ? "mc-nav-active" : ""}`}
              href="/auth.html"
            >
              <IconUser />
              Register / Log in
            </a>
            <button type="button" className="mc-icon-btn" aria-label="Search (demo)">
              <IconSearch />
            </button>
            <button
              type="button"
              className="mc-burger"
              aria-expanded={mobileOpen}
              aria-label="Menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className={`mc-mobile-drawer ${mobileOpen ? "open" : ""}`} id="mobile-nav">
          <a href="/consult.html">Request appointment</a>
          <a href="/auth.html">Register / Log in</a>
          <a href="/consult.html">Virtual visit</a>
          <a href="/">Home</a>
        </div>
      </header>

      {showHero ? (
        <section className="mc-hero" aria-label="Featured">
          <div className="mc-hero-bg" aria-hidden="true" />
          <button type="button" className="mc-hero-play" aria-label="Play video (demo)">
            <IconPlay />
          </button>
          <div className="mc-hero-content">
            <h1>Transforming your care</h1>
            <a className="mc-hero-sub" href="/consult.html">
              Learn how we drive innovation
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <div>
              <a className="mc-btn-ghost" href="/consult.html">
                Request appointment
              </a>
            </div>
          </div>
        </section>
      ) : null}

      <main className="mc-main" id="main-content">
        {children}
      </main>

      <a className="mc-feedback-tab" href="#main-content">
        Feedback
      </a>
    </div>
  );
}
