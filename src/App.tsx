import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { buttonClass } from "./components/Button";
import { Card } from "./components/Card";
import { Layout } from "./components/Layout";
import { AuthPage } from "./features/auth/AuthPage";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";
import { RequireRole } from "./features/auth/RequireRole";
import { SetupPage } from "./features/auth/SetupPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TicketDetailPage } from "./features/dashboard/TicketDetailPage";
import { ComplaintPage } from "./features/complaints/ComplaintPage";
import { ConfirmationPage } from "./features/complaints/ConfirmationPage";
import { MyReportsPage } from "./features/citizen/MyReportsPage";
import { AdminPage } from "./features/admin/AdminPage";

function NotFound() {
  return (
    <div className="page page--narrow">
      <Card className="empty-card">
        <h1>Page not found</h1>
        <p>That page does not exist in TownThread.</p>
        <Link className={buttonClass("primary")} to="/report">
          Report an issue
        </Link>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { configured } = useAuth();

  if (!configured) {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="*" element={<SetupPage />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/report" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/report" element={<ComplaintPage />} />
        <Route path="/confirmation/:ticketId" element={<ConfirmationPage />} />
        <Route element={<RequireRole allowed={["citizen"]} />}>
          <Route path="/my-reports" element={<MyReportsPage />} />
        </Route>
        <Route element={<RequireRole allowed={["official", "admin"]} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:ticketId" element={<TicketDetailPage />} />
        </Route>
        <Route element={<RequireRole allowed={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
