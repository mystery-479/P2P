import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { buttonClass } from "../../components/Button";
import { AlertIcon, SearchIcon } from "../../components/Icons";
import { CategoryBadge, SeverityBadge, StatusBadge } from "../../components/Badges";
import { Card } from "../../components/Card";
import { Select, TextInput } from "../../components/Inputs";
import { formatDateTime, summaryOf } from "../../lib/format";
import { resetTickets, useTickets } from "../../lib/ticketStore";
import {
  CATEGORIES,
  DEPARTMENTS,
  SEVERITIES,
  STATUSES,
  type TicketCategory,
  type Severity,
  type TicketStatus,
} from "../../types/ticket";
import { countByStatus, EMPTY_FILTERS, filterTickets, type TicketFilters } from "./ticketQuery";

export function DashboardPage() {
  const tickets = useTickets();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<TicketFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Deep links from the confirmation page: /dashboard?ticket=CL-2026-xxxx
  const deepLinkedTicket = searchParams.get("ticket");
  useEffect(() => {
    if (deepLinkedTicket) navigate(`/dashboard/${deepLinkedTicket}`, { replace: true });
  }, [deepLinkedTicket, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => filterTickets(tickets, filters), [tickets, filters]);
  const counts = countByStatus(tickets);
  const reviewCount = tickets.filter((ticket) => ticket.needsReview).length;

  const departments = useMemo(
    () =>
      Array.from(new Set([...Object.values(DEPARTMENTS), ...tickets.map((ticket) => ticket.department)]))
        .filter(Boolean)
        .sort(),
    [tickets],
  );

  function setFilter<K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function handleReset() {
    if (!window.confirm("Reset demo data to the original sample tickets?")) return;
    try {
      resetTickets();
      setError("");
    } catch {
      setError("Could not reset the demo data. Please refresh the page.");
    }
  }

  return (
    <div className="page page--dashboard">
      <div className="page-heading page-heading--row">
        <div>
          <p className="eyebrow">Municipal officers</p>
          <h1>Your queue</h1>
          <p className="page-heading__lede">
            The most urgent reports land at the top. Within each priority, the oldest ticket comes
            first — so nothing slips through the cracks.
          </p>
        </div>
        <button type="button" className="link-button" onClick={handleReset}>
          Reset demo data
        </button>
      </div>

      <div className="stat-grid" aria-label="Ticket status counts">
        <Card className="stat-card">
          <span className="stat-card__value">{counts.Open}</span>
          <span className="stat-card__label">Open</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__value">{counts["In Progress"]}</span>
          <span className="stat-card__label">In Progress</span>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__value">{counts.Resolved}</span>
          <span className="stat-card__label">Resolved</span>
        </Card>
      </div>

      <Card className="dashboard-panel">
        <div className="dashboard-toolbar">
          <div className="search-field">
            <SearchIcon className="search-field__icon" size={17} />
            <TextInput
              id="ticket-search"
              type="search"
              placeholder="Search by ticket ID, complaint text or location"
              aria-label="Search tickets by ID, complaint text or location"
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
            />
          </div>

          <div className="filter-grid">
            <div className="filter-item">
              <label htmlFor="filter-severity" className="filter-item__label">
                Severity
              </label>
              <Select
                id="filter-severity"
                value={filters.severity}
                onChange={(event) =>
                  setFilter("severity", event.target.value as Severity | "All")
                }
              >
                <option value="All">All severities</option>
                {SEVERITIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
            <div className="filter-item">
              <label htmlFor="filter-category" className="filter-item__label">
                Category
              </label>
              <Select
                id="filter-category"
                value={filters.category}
                onChange={(event) =>
                  setFilter("category", event.target.value as TicketCategory | "All")
                }
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
            <div className="filter-item">
              <label htmlFor="filter-department" className="filter-item__label">
                Department
              </label>
              <Select
                id="filter-department"
                value={filters.department}
                onChange={(event) => setFilter("department", event.target.value)}
              >
                <option value="All">All departments</option>
                {departments.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
            <div className="filter-item">
              <label htmlFor="filter-status" className="filter-item__label">
                Status
              </label>
              <Select
                id="filter-status"
                value={filters.status}
                onChange={(event) => setFilter("status", event.target.value as TicketStatus | "All")}
              >
                <option value="All">All statuses</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="toolbar-footer">
            <label className="check-control">
              <input
                type="checkbox"
                checked={filters.needsReviewOnly}
                onChange={(event) => setFilter("needsReviewOnly", event.target.checked)}
              />
              Needs review only ({reviewCount})
            </label>
            <button
              type="button"
              className="link-button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              disabled={filters === EMPTY_FILTERS}
            >
              Clear filters
            </button>
          </div>
        </div>

        {error && (
          <p className="form-alert" role="alert">
            <AlertIcon /> {error}
          </p>
        )}

        <p className="result-summary" aria-live="polite">
          {loading
            ? "Loading tickets…"
            : `Showing ${visible.length} of ${tickets.length} tickets · priority order`}
        </p>

        {loading ? (
          <div className="ticket-list" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <div className="skeleton-row" key={item}>
                <span className="skeleton skeleton--badge" />
                <span className="skeleton skeleton--line" />
                <span className="skeleton skeleton--short" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-card">
            <h2>{tickets.length === 0 ? "No reports yet" : "Nothing matches those filters"}</h2>
            <p>
              {tickets.length === 0
                ? "When a citizen sends in a report, it'll show up here for you."
                : "Try a different search, or clear the filters to see everything."}
            </p>
            {tickets.length === 0 ? (
              <Link className={buttonClass("primary")} to="/report">
                Report an issue
              </Link>
            ) : (
              <button type="button" className={buttonClass("secondary")} onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="ticket-list">
            {visible.map((ticket) => (
              <Link className="ticket-row" to={`/dashboard/${ticket.id}`} key={ticket.id}>
                <SeverityBadge severity={ticket.severity} />
                <div className="ticket-row__body">
                  <div className="ticket-row__title">
                    <strong>{summaryOf(ticket.description)}</strong>
                    <span className="ticket-row__id">{ticket.id}</span>
                  </div>
                  <p className="ticket-row__meta">
                    <CategoryBadge category={ticket.category} />
                    <span>{ticket.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ticket.department}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={ticket.createdAt}>{formatDateTime(ticket.createdAt)}</time>
                  </p>
                  {(ticket.needsReview || ticket.photoUrl) && (
                    <p className="ticket-row__flags">
                      {ticket.needsReview && <span className="flag flag--review">Needs review</span>}
                      {ticket.photoUrl && <span className="flag">Photo attached</span>}
                    </p>
                  )}
                </div>
                <StatusBadge status={ticket.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
