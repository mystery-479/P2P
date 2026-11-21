import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart } from "../../components/widgets/BarChart";
import { DataTable } from "../../components/widgets/DataTable";
import { DonutChart } from "../../components/widgets/DonutChart";
import { LineChart } from "../../components/widgets/LineChart";
import { StatCard } from "../../components/widgets/StatCard";
import { listTickets } from "../../lib/ticketApi";
import { summaryOf } from "../../lib/format";
import type { Ticket } from "../../types/ticket";

const CATEGORY_COLORS: Record<string, string> = {
  Roads: "#2563eb",
  Waste: "#0f766e",
  Water: "#0ea5e9",
  Electricity: "#d97706",
  Trees: "#7c3aed",
  Drainage: "#be185d",
  Other: "#64748b",
};

type ComplaintRow = {
  id: string;
  values: Record<string, string | number>;
  status: string;
  priority: string;
};

export function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listTickets()
      .then((items) => {
        if (active) setTickets(items);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load tickets.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    critical: tickets.filter((ticket) => ticket.severity === "Critical").length,
  };

  const categoryCounts = useMemo(() => {
    const categories = new Map<string, number>();
    tickets.forEach((ticket) => categories.set(ticket.category, (categories.get(ticket.category) ?? 0) + 1));
    return Array.from(categories, ([label, value]) => ({
      label,
      value,
      color: CATEGORY_COLORS[label] ?? "#94a3b8",
    })).sort((a, b) => b.value - a.value);
  }, [tickets]);

  const priorityCounts = {
    Critical: tickets.filter((ticket) => ticket.severity === "Critical").length,
    High: tickets.filter((ticket) => ticket.severity === "High").length,
    Medium: tickets.filter((ticket) => ticket.severity === "Medium").length,
    Low: tickets.filter((ticket) => ticket.severity === "Low").length,
  };
  const prioritySegments = [
    { label: "Critical", value: priorityCounts.Critical, color: "#b91c1c" },
    { label: "High", value: priorityCounts.High, color: "#d97706" },
    { label: "Medium", value: priorityCounts.Medium, color: "#f59e0b" },
    { label: "Low", value: priorityCounts.Low, color: "#15803d" },
  ];

  const lineData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      return {
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        value: tickets.filter((ticket) => ticket.createdAt.startsWith(key)).length,
      };
    });
  }, [tickets]);

  const recent = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
        .map(
          (ticket): ComplaintRow => ({
            id: ticket.id,
            values: {
              description: summaryOf(ticket.description, 45),
              location: ticket.location,
              category: ticket.category,
            },
            status: ticket.status,
            priority: ticket.severity,
          }),
        ),
    [tickets],
  );

  if (loading) {
    return <div className="page" aria-busy="true"><p role="status">Loading officer dashboard…</p></div>;
  }
  if (error) {
    return <div className="page"><p className="form-alert" role="alert">{error}</p></div>;
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Municipal Dashboard</p>
          <h1 className="dashboard-title">Officer Queue</h1>
          <p className="dashboard-sub">
            Review the highest-priority tickets first. Within each level, the oldest ticket comes
            first — so nothing slips through the cracks.
          </p>
        </div>
        <Link to="/report" className="btn btn--primary btn--md">+ New Report</Link>
      </div>

      <div className="stat-grid">
        <StatCard title="Total Complaints" value={counts.total} trend={{ label: "all reports", direction: "up" }} icon={<span aria-hidden="true">▤</span>} />
        <StatCard title="Pending Resolution" value={counts.open + counts.inProgress} trend={{ label: "awaiting action", direction: "up" }} variant="pending" icon={<span aria-hidden="true">◷</span>} />
        <StatCard title="Critical Issues" value={counts.critical} trend={{ label: "needs attention", direction: "up" }} variant="critical" icon={<span aria-hidden="true">⚠</span>} />
        <StatCard title="Resolved" value={counts.resolved} trend={{ label: "closed reports", direction: "up" }} variant="resolved" icon={<span aria-hidden="true">✓</span>} />
      </div>

      <div className="dashboard-grid">
        <div className="grid-col grid-col--left">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Complaints Overview</h2>
                <p className="card__subtitle">Report volume over the last 7 days</p>
              </div>
            </div>
            <div className="card__body"><LineChart data={lineData} height={200} /></div>
          </section>
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Recent Citizen Reports</h2>
                <p className="card__subtitle">Latest complaints and their current status</p>
              </div>
            </div>
            <div className="card__body">
              {recent.length ? (
                <DataTable
                  columns={[
                    { key: "id", label: "Ticket ID", width: "120px" },
                    { key: "description", label: "Issue" },
                    { key: "location", label: "Location" },
                    { key: "category", label: "Category" },
                    { key: "priority", label: "Priority", width: "100px" },
                    { key: "status", label: "Status", width: "110px" },
                  ]}
                  rows={recent}
                  onRowClick={(id) => window.location.assign(`/dashboard/${id}`)}
                />
              ) : <p className="empty-state">No reports yet.</p>}
            </div>
          </section>
        </div>

        <div className="grid-col grid-col--right">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Complaints by Category</h2>
                <p className="card__subtitle">Categories in submitted reports</p>
              </div>
            </div>
            <div className="card__body">
              {categoryCounts.length ? <BarChart data={categoryCounts} height={240} /> : <p className="empty-state">No reports yet.</p>}
            </div>
          </section>
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Priority Distribution</h2>
                <p className="card__subtitle">Tickets by suggested severity</p>
              </div>
            </div>
            <div className="card__body" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              {counts.total > 0 ? (
                <DonutChart segments={prioritySegments} total={counts.total} size={200} />
              ) : <p className="empty-state">No reports yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
