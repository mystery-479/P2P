import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { ThemeToggle } from "../ui/ThemeToggle";

export function Header() {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const isOfficer = role === "official" || role === "admin";
  const displayName =
    (typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    user?.email ||
    "TownThread";

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <header className="site-header">
      <div className="header__inner">
        <div className="header__greeting">
          <p className="header__eyebrow">
            {isOfficer ? "Municipal operations" : "Citizen reporting"}
          </p>
          <h1 className="header__title">
            {isOfficer
              ? "Review reports and track local issues."
              : "Report an issue or track your requests."}
          </h1>
        </div>

        <div className="header__actions">
          <ThemeToggle className="theme-toggle" />
          {user && (
            <>
              <div className="header__user">
                <span className="header__user-avatar" aria-hidden="true">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
                <div className="header__user-info">
                  <div className="header__user-name">{displayName}</div>
                  <div className="header__user-role">
                    {role === "admin" ? "Administrator" : role === "official" ? "Municipal Official" : "Citizen"}
                  </div>
                </div>
              </div>
              <button type="button" className="header__signout" onClick={() => void handleSignOut()}>
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
