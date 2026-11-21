import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Card } from "../../components/Card";
import { useAuth, type AppRole } from "./AuthProvider";

export function RequireRole({ allowed }: { allowed: AppRole[] }) {
  const { user, role, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) return <Navigate to="/setup" replace />;
  if (loading) {
    return (
      <div className="page page--narrow" aria-busy="true">
        <Card className="auth-card">
          <p role="status">Checking your session…</p>
        </Card>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!role) {
    return (
      <div className="page page--narrow">
        <Card className="auth-card">
          <h1>Account access is not ready</h1>
          <p>Your account role could not be loaded. Ask an administrator to review your account.</p>
        </Card>
      </div>
    );
  }
  if (!allowed.includes(role)) return <Navigate to={role === "citizen" ? "/my-reports" : "/dashboard"} replace />;

  return <Outlet />;
}
