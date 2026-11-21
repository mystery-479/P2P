import { useMemo } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "../../components/widgets/StatCard";
import { LineChart } from "../../components/widgets/LineChart";
import { BarChart } from "../../components/widgets/BarChart";
import { DonutChart } from "../../components/widgets/DonutChart";
import { DataTable } from "../../components/widgets/DataTable";
import { summaryOf } from "../../lib/format";
import { useTickets } from "../../lib/ticketStore";
import { useRole } from "../../context/RoleContext";
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
  const { role } = useRole();
  const tickets = useTickets();

  if (role === "citizen") {
    return <CitizenDashboard tickets={tickets} />;
  }

  return <OfficerDashboard tickets={tickets} />;
}

function CitizenDashboard({ tickets }: { tickets: Ticket[] }) {
  const myTickets = useMemo(() => {
    // In demo mode, show all tickets as "your" tickets for demonstration
    return [...tickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [tickets]);

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Your Reports</p>
          <h1 className="dashboard-title">Track your complaints</h1>
          <p className="dashboard-sub">
            See the status of your submitted tickets and what the municipal team is doing about them.
          </p>
        </div>
        <Link to="/report" className="btn btn--primary btn--md">
          + Report a new issue
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard
          title="My Tickets"
          value={counts.total}
          trend={{ label: "total submitted", direction: "up" }}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" x2="2" y1="12" y2="12" />
              <path d="M21 12v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1z" />
            </svg>
          }
        />
        <StatCard
          title="Open"
          value={counts.open}
          trend={{ label: "awaiting action", direction: "up" }}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="12" y2="12.01" />
            </svg>
          }
        />
        <StatCard
          title="In Progress"
          value={counts.inProgress}
          trend={{ label: "being worked on", direction: "up" }}
          variant="pending"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 15 15" />
            </svg>
          }
        />
        <StatCard
          title="Resolved"
          value={counts.resolved}
          trend={{ label: "issues fixed", direction: "up" }}
          variant="resolved"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      <div className="dashboard-grid">
        <div className="grid-col grid-col--left" style={{ gridColumn: "1 / -1" }}>
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Your Recent Tickets</h2>
                <p className="card__subtitle">Latest status updates from the municipal team</p>
              </div>
            </div>
            <div className="card__body">
              {myTickets.length === 0 ? (
                <div className="empty-state">
                  <p style={{ margin: "0", color: "#64748b", fontSize: "0.87rem" }}>
                    No tickets yet. Report your first issue to get started.
                  </p>
                </div>
              ) : (
                <table className="table table-compact">
                  <thead>
                    <tr>
                      <th style={{ width: "120px" }}>Ticket ID</th>
                      <th>Issue</th>
                      <th>Location</th>
                      <th style={{ width: "110px" }}>Severity</th>
                      <th style={{ width: "110px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets.map((t) => (
                      <tr key={t.id} onClick={() => window.location.assign(`/dashboard/${t.id}`)} style={{ cursor: "pointer" }}>
                        <td>
                          <span className="badge badge--neutral" style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>
                            {t.id.replace("CL-", "")}
                          </span>
                        </td>
                        <td>{summaryOf(t.description, 45)}</td>
                        <td>{t.location}</td>
                        <td>
                          <span className={`badge ${t.severity === "Critical" ? "badge--critical" : t.severity === "High" ? "badge--high" : t.severity === "Medium" ? "badge--medium" : "badge--low"}`}>
                            {t.severity}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${t.status === "Open" ? "badge--status-open" : t.status === "In Progress" ? "badge--status-in-progress" : "badge--status-resolved"}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">How It Works</h2>
                <p className="card__subtitle">From report to resolution</p>
              </div>
            </div>
            <div className="card__body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                {
                  step: "1",
                  title: "Submit your report",
                  text: "Describe the issue, add a photo and location.",
                },
                {
                  step: "2",
                  title: "We triage it",
                  text: "Our system classifies the category and suggests severity.",
                },
                {
                  step: "3",
                  title: "Officer reviews",
                  text: "A municipal officer reviews and assigns the right department.",
                },
                {
                  step: "4",
                  title: "Issue resolved",
                  text: "The team fixes it and updates the ticket status.",
                },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span className="severity-dot" style={{ background: "var(--color-brand)", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem", flexShrink: "0" }}>
                    {item.step}
                  </span>
                  <div>
                    <div style={{ fontSize: "0.87rem", fontWeight: 600, color: "#1e293b" }}>{item.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.15rem" }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function OfficerDashboard({ tickets }: { tickets: Ticket[] }) {
  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
    critical: tickets.filter((t) => t.severity === "Critical").length,
  };

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    tickets.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] ?? "#94a3b8" }))
      .sort((a, b) => b.value - a.value);
  }, [tickets]);

  const priorityCounts = useMemo(() => {
    const map: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    tickets.forEach((t) => {
      map[t.severity] = (map[t.severity] || 0) + 1;
    });
    return map;
  }, [tickets]);

  const prioritySegments = [
    { label: "Critical", value: priorityCounts.Critical, color: "#b91c1c" },
    { label: "High", value: priorityCounts.High, color: "#d97706" },
    { label: "Medium", value: priorityCounts.Medium, color: "#d97706" },
    { label: "Low", value: priorityCounts.Low, color: "#15803d" },
  ];

  const lineData = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = tickets.filter((t) => t.createdAt.startsWith(key)).length;
      days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), value: count });
    }
    return days;
  }, [tickets]);

  const recent = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((t): ComplaintRow => ({
        id: t.id,
        values: {
          description: summaryOf(t.description, 45),
          location: t.location,
          category: t.category,
        },
        status: t.status,
        priority: t.severity,
      }));
  }, [tickets]);

  const columns = [
    { key: "id", label: "Complaint ID", width: "120px" },
    { key: "description", label: "Issue Description" },
    { key: "location", label: "Location" },
    { key: "category", label: "Category" },
    { key: "priority", label: "AI Priority", width: "110px" },
    { key: "status", label: "Status", width: "110px" },
  ];

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
        <Link to="/report" className="btn btn--primary btn--md">
          + New Report
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard
          title="Total Complaints"
          value={counts.total}
          trend={{ label: "vs. previous month", direction: "up" }}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" x2="2" y1="12" y2="12" />
              <path d="M21 12v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Resolution"
          value={counts.open + counts.inProgress}
          trend={{ label: "vs. previous month", direction: "up" }}
          variant="pending"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="12" y2="12.01" />
            </svg>
          }
        />
        <StatCard
          title="Critical Issues"
          value={counts.critical}
          trend={{ label: "vs. previous month", direction: "up" }}
          variant="critical"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Resolved This Month"
          value={counts.resolved}
          trend={{ label: "vs. previous month", direction: "up" }}
          variant="resolved"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      <div className="dashboard-grid">
        <div className="grid-col grid-col--left">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Complaints Overview</h2>
                <p className="card__subtitle">Complaint volume over the last 7 days</p>
              </div>
              <div className="chip-group">
                <span className="chip chip--active">Daily</span>
                <span className="chip">Weekly</span>
                <span className="chip">Monthly</span>
              </div>
            </div>
            <div className="card__body">
              <LineChart data={lineData} height={200} />
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Recent Citizen Reports</h2>
                <p className="card__subtitle">Latest complaints received and their current status</p>
              </div>
            </div>
            <div className="card__body">
              <DataTable
                columns={columns}
                rows={recent}
                onRowClick={(id) => window.location.assign(`/dashboard/${id}`)}
              />
            </div>
          </section>
        </div>

        <div className="grid-col grid-col--right">
          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Complaints by Category</h2>
                <p className="card__subtitle">Issues classified by municipal category</p>
              </div>
            </div>
            <div className="card__body" style={{ paddingBottom: "0.5rem" }}>
              <BarChart data={categoryCounts} height={240} />
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Priority Distribution</h2>
                <p className="card__subtitle">Tickets by severity level</p>
              </div>
            </div>
            <div className="card__body" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <DonutChart segments={prioritySegments} total={counts.total} size={200} />
              <div className="legend">
                {prioritySegments.map((seg) => (
                  <div key={seg.label} className="legend-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span className="legend-dot" style={{ backgroundColor: seg.color, width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" }} />
                    <span className="legend-label" style={{ fontSize: "0.82rem", color: "#334155", fontWeight: "500" }}>{seg.label}</span>
                    <span className="legend-count" style={{ fontSize: "0.82rem", color: "#64748b", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="dashboard-bottom">
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Most Reported Areas</h2>
              <p className="card__subtitle">Areas with the highest number of complaints</p>
            </div>
          </div>
          <div className="card__body" style={{ display: "flex", gap: "1rem" }}>
            <div className="map-placeholder" style={{ flex: "1", height: "220px", border: "1px dashed var(--color-line)", borderRadius: "var(--radius-md)", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.85rem" }}>
              Heatmap layer loading…
            </div>
            <div className="areas-list" style={{ width: "240px" }}>
              {[
                { rank: 1, area: "Indiranagar", count: 142, change: "+32%" },
                { rank: 2, area: "Jay nagar", count: 116, change: "+18%" },
                { rank: 3, area: "BTM Layout", count: 98, change: "+14%" },
                { rank: 4, area: "Koramangala", count: 87, change: "+11%" },
                { rank: 5, area: "Whitefield", count: 76, change: "+9%" },
              ].map((a) => (
                <div key={a.area} className="area-row" style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0", borderBottom: "1px solid var(--color-line)" }}>
                  <span className="area-rank" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", minWidth: "20px" }}>{a.rank}</span>
                  <div style={{ flex: "1" }}>
                    <span className="area-name" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", display: "block" }}>{a.area}</span>
                    <span className="area-count" style={{ fontSize: "0.75rem", color: "#64748b" }}>{a.count} complaints</span>
                  </div>
                  <span className="area-change" style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b91c1c" }}>{a.change}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">CivicLens Intelligence</h2>
              <p className="card__subtitle">Automated insights from submitted reports</p>
            </div>
          </div>
          <div className="card__body">
            <div className="insight-list">
              {[
                { icon: "↗", title: "Indiranagar has recorded a 32% increase in pothole complaints this week." },
                { icon: "≣", title: "12 complaints appear to reference similar road damage within a 200m radius." },
                { icon: "⚠", title: "Critical road hazards require immediate departmental attention." },
              ].map((insight, i) => (
                <div key={i} className="insight-item" style={{ display: "flex", gap: "0.75rem", padding: "0.75rem 0", borderBottom: i < 2 ? "1px solid var(--color-line)" : "none" }}>
                  <span className="insight-icon" style={{ width: "28px", height: "28px", borderRadius: "8px", background: "var(--color-brand-soft)", color: "var(--color-brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: "700", flexShrink: "0" }}>
                    {insight.icon}
                  </span>
                  <p className="insight-text" style={{ margin: "0", fontSize: "0.85rem", color: "#334155", lineHeight: "1.5" }}>
                    {insight.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
