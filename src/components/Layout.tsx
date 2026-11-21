import { Link, NavLink, Outlet } from "react-router-dom";

function Brand() {
  return (
    <Link className="brand" to="/">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 3 27 8v9c0 7-4.6 10.9-11 13-6.4-2.1-11-6-11-13V8L16 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="m11 16 3.5 3.5L21 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
