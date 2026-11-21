import { Link, NavLink, Outlet } from "react-router-dom";

function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" />
          <path d="M11 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <span className="brand__text">
        <strong>TownThread</strong>
        <small>Citizen complaint triage</small>
      </span>
    </Link>
  );
}

function Navigation() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav__link${isActive ? " nav__link--active" : ""}`;

  return (
    <nav className="nav" aria-label="Main navigation">
      <NavLink to="/report" end className={navClass}>
        Report an issue
      </NavLink>
      <NavLink to="/dashboard" className={navClass}>
        Officer dashboard
      </NavLink>
    </nav>
  );
}

export function Layout() {
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <span className="header-accent" aria-hidden="true" />
        <div className="container site-header__inner">
          <Brand />
          <Navigation />
        </div>
      </header>

      <main className="container main-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span>TownThread · Prototype demo</span>
          <span>Not an emergency service — call local emergency numbers for immediate danger.</span>
        </div>
      </footer>
    </div>
  );
}
