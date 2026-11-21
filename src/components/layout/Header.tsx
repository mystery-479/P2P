import { ThemeToggle } from "../ui/ThemeToggle";
import { useRole } from "../../context/RoleContext";

export function Header() {
  const { role, setRole } = useRole();

  return (
    <header className="site-header">
      <div className="header__inner">
        <div className="header__greeting">
          <p className="header__eyebrow">
            {role === "officer" ? "Good morning, Officer." : "Hello, Citizen."}
          </p>
          <h1 className="header__title">
            {role === "officer"
              ? "Here’s what’s happening across your jurisdiction today."
              : "Report an issue or track your tickets."}
          </h1>
        </div>

        <div className="header__actions">
          <div className="header__search">
            <svg className="header__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="header__search-input"
              type="search"
              placeholder={role === "officer" ? "Search by ticket ID, location or issue…" : "Search your tickets…"}
              aria-label="Search tickets"
            />
          </div>

          <button className="header__bell" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="header__bell-count">3</span>
          </button>

          <ThemeToggle className="theme-toggle" />

          <div className="header__user" onClick={() => setRole(role === "officer" ? "citizen" : "officer")} style={{ cursor: "pointer" }} title={`Switch to ${role === "officer" ? "Citizen" : "Officer"} view`}>
            <span className="header__user-avatar">RK</span>
            <div className="header__user-info">
              <div className="header__user-name">
                {role === "officer" ? "R. Kumar" : "Citizen User"}
              </div>
              <div className="header__user-role">
                {role === "officer" ? "Municipal Officer" : "Citizen Portal"}
              </div>
            </div>
            <svg className="header__user-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
