import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { buttonClass } from "./components/Button";
import { Card } from "./components/Card";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TicketDetailPage } from "./features/dashboard/TicketDetailPage";
import { ComplaintPage } from "./features/complaints/ComplaintPage";
import { ConfirmationPage } from "./features/complaints/ConfirmationPage";
import { LiveMapPage } from "./features/map/LiveMapPage";

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:ticketId" element={<TicketDetailPage />} />
          <Route path="/map" element={<LiveMapPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
