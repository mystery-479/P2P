import { Card } from "../../components/Card";
import { CategoryBadge, SeverityBadge, StatusBadge } from "../../components/Badges";
import { formatDateTime, summaryOf } from "../../lib/format";
import { useTickets } from "../../lib/ticketStore";
import { SEVERITY_RANK } from "../../types/ticket";

/**
 * Placeholder route for Person 3. It reads the shared ticket store so newly
 * submitted complaints appear immediately; Person 3 will replace this with the
 * full searchable/filterable dashboard.
 */
export function DashboardPlaceholder() {
  const tickets = useTickets();
  const sorted = [...tickets].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const counts = {
    Open: tickets.filter((ticket) => ticket.status === "Open").length,
    "In Progress": tickets.filter((ticket) => ticket.status === "In Progress").length,
    Resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
  };

  return (
    <div className="page">
      <div className="page-heading">
        <p className="eyebrow">Municipal officers</p>
        <h1>Officer dashboard</h1>
        <p className="page-heading__lede">
          Tickets are ordered by priority — Critical, High, Medium, Low — then oldest first.
        </p>
      </div>

      <div className="stat-grid" aria-label="Ticket status counts">
        {Object.entries(counts).map(([label, value]) => (
          <Card className="stat-card" key={label}>
            <span className="stat-card__value">{value}</span>
            <span className="stat-card__label">{label}</span>
          </Card>
        ))}
      </div>

      <Card className="placeholder-card">
        <p className="placeholder-banner">
          Placeholder view — Person 3 will add search, filters, ticket details and officer actions here.
        </p>
        <div className="ticket-list">
          {sorted.map((ticket) => (
            <article className="ticket-row" key={ticket.id}>
              <SeverityBadge severity={ticket.severity} />
              <div className="ticket-row__body">
                <div className="ticket-row__title">
                  <strong>{summaryOf(ticket.description)}</strong>
                  <span className="ticket-row__id">{ticket.id}</span>
                </div>
                <p className="ticket-row__meta">
                  <CategoryBadge category={ticket.category} />
                  <span>{ticket.location}</span>
                  <span>·</span>
                  <span>{ticket.department}</span>
                  <span>·</span>
                  <time dateTime={ticket.createdAt}>{formatDateTime(ticket.createdAt)}</time>
                </p>
              </div>
              <StatusBadge status={ticket.status} />
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
