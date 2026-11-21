import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

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
  const { user, role, signOut, configured } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav__link${isActive ? " nav__link--active" : ""}`;

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <nav className="nav" aria-label="Main navigation">
      <NavLink to="/report" end className={navClass}>
        Report an issue
      </NavLink>
      {role === "citizen" && (
        <NavLink to="/my-reports" className={navClass}>
          My reports
        </NavLink>
      )}
      {(role === "official" || role === "admin") && (
        <NavLink to="/dashboard" className={navClass}>
          Officer dashboard
        </NavLink>
      )}
      {role === "admin" && (
        <NavLink to="/admin" className={navClass}>
          Admin
        </NavLink>
      )}
      {configured &&
        (user ? (
          <button type="button" className="nav__link nav__button" onClick={() => void handleSignOut()}>
            Sign out
          </button>
        ) : (
          <NavLink to="/login" className={navClass}>
            Sign in
          </NavLink>
        ))}
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
