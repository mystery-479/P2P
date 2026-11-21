import type { Severity, TicketStatus } from "../types/ticket";

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`badge badge--severity badge--${severity.toLowerCase()}`}>
      <span className="badge__dot" aria-hidden="true" />
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const modifier = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`badge badge--status badge--status-${modifier}`}>{status}</span>;
}

export function CategoryBadge({ category }: { category: string }) {
  return <span className="badge badge--neutral">{category}</span>;
}
