import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    layout: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    report: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    complaint: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12" />
        <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    ),
    map: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" x2="16" y1="2" y2="22" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
    analytics: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" x2="18" y1="20" y2="2" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
    department: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="2" />
        <path d="M5 21v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
      </svg>
    ),
    resolved: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 0.33 1.82l0.06-0.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-0.06-0.06a1.65 1.65 0 0 0-1.82-0.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-0.9A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-0.33l-0.06-0.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l0.06-0.06a1.65 1.65 0 0 0-0.33 1.82 1.65 1.65 0 0 0 1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-0.9A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.51-1" />
      </svg>
    ),
  };

  const icon = icons[name];
  if (!icon) return null;
  return <span aria-hidden="true">{icon}</span>;
}

export function Sidebar() {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const isOfficer = role === "official" || role === "admin";
  const items = isOfficer
    ? [
        { to: "/dashboard", label: "Overview", icon: "layout" },
        { to: "/report", label: "Report an issue", icon: "report" },
        { to: "/map", label: "Live Map", icon: "map" },
        ...(role === "admin" ? [{ to: "/admin", label: "Manage accounts", icon: "settings" }] : []),
      ]
    : user
      ? [
          { to: "/report", label: "Report an issue", icon: "report" },
          { to: "/my-reports", label: "My reports", icon: "complaint" },
        ]
      : [
          { to: "/report", label: "Report an issue", icon: "report" },
          { to: "/login", label: "Sign in", icon: "complaint" },
        ];

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6" />
            <path d="M6 12h6" />
          </svg>
        </span>
        <div>
          <div className="sidebar__name">TownThread</div>
          <div className="sidebar__tag">
            {isOfficer ? "Municipal Operations" : "Citizen Portal"}
          </div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__section">
          <div className="sidebar__section-title">
            {isOfficer ? "Operations" : "Services"}
          </div>
          <ul className="sidebar__list">
            {items.map((item) => (
              <li key={item.label} className="sidebar__item">
                <NavLink
                  to={item.to}
                  end={item.to === "/report"}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? " sidebar__link--active" : ""}`
                  }
                >
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__municipality">Bengaluru Municipal Corporation</div>
        <div className="sidebar__municipality-sub">
          Prototype demo · {isOfficer ? "Officer portal" : "Citizen portal"}
        </div>
        {user && (
          <button
            type="button"
            className="sidebar__signout"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
