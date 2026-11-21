import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { buttonClass } from "./components/Button";
import { Card } from "./components/Card";
import { Layout } from "./components/Layout";
import { DashboardPlaceholder } from "./features/dashboard/DashboardPlaceholder";
import { ComplaintPage } from "./features/complaints/ComplaintPage";
import { ConfirmationPage } from "./features/complaints/ConfirmationPage";

function NotFound() {
  return (
    <div className="page page--narrow">
      <Card className="empty-card">
        <h1>Page not found</h1>
        <p>That page does not exist in this prototype.</p>
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
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/report" replace />} />
          <Route path="/report" element={<ComplaintPage />} />
          <Route path="/confirmation/:ticketId" element={<ConfirmationPage />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
