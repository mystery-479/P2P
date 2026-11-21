import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { buttonClass, Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { DemoNotice } from "../../components/DemoNotice";
import { SeverityBadge, StatusBadge } from "../../components/Badges";
import { formatDateTime } from "../../lib/format";
import { getTicket } from "../../lib/ticketStore";

type ContactState = { contact?: { name?: string; detail?: string } };

export function ConfirmationPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const ticket = ticketId ? getTicket(ticketId) : undefined;
  const contact = (location.state as ContactState | null)?.contact;

  useEffect(() => {
    document.title = ticket ? `Ticket ${ticket.id} — CivicLens` : "Ticket not found — CivicLens";
    headingRef.current?.focus();
  }, [ticket]);

  if (!ticket) {
    return (
      <div className="page page--narrow">
        <Card className="empty-card">
          <h1 ref={headingRef} tabIndex={-1}>
            Ticket not found
          </h1>
          <p>We could not find that ticket in this browser's demo data.</p>
          <Link className={buttonClass("primary")} to="/report">
            Report a new issue
          </Link>
        </Card>
      </div>
    );
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(ticket!.id);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="page page--confirmation">
      <div className="success-banner" role="status">
        <span className="success-banner__icon" aria-hidden="true">
          ✓
        </span>
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            Report submitted successfully
          </h1>
          <p>Your complaint has been converted into a structured ticket.</p>
        </div>
      </div>

      <div className="confirmation-layout">
        <Card className="ticket-summary">
          <div className="ticket-summary__top">
            <div>
              <p className="eyebrow">Your ticket ID</p>
              <div className="ticket-id-row">
                <strong className="ticket-id">{ticket.id}</strong>
                <button type="button" className="link-button" onClick={() => void copyId()}>
                  {copied ? "Copied!" : "Copy ID"}
                </button>
              </div>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-item__label">Category</span>
              <strong>{ticket.category}</strong>
            </div>
            <div className="summary-item">
              <span className="summary-item__label">Assigned department</span>
              <strong>{ticket.department}</strong>
            </div>
            <div className="summary-item">
              <span className="summary-item__label">Suggested severity</span>
              <SeverityBadge severity={ticket.severity} />
            </div>
            <div className="summary-item">
              <span className="summary-item__label">Submitted</span>
              <strong>{formatDateTime(ticket.createdAt)}</strong>
            </div>
          </div>

          <div className="summary-block">
            <h2>Severity reason</h2>
            <p>{ticket.severityReason}</p>
          </div>

          <div className="summary-block">
            <h2>Complaint summary</h2>
            <p className="preserve-lines">{ticket.description}</p>
          </div>

          <div className="summary-block">
            <h2>Location</h2>
            <p>{ticket.location}</p>
          </div>

          {ticket.photoUrl && (
            <div className="summary-block">
              <h2>Attached photo</h2>
              <img className="confirmation-photo" src={ticket.photoUrl} alt="Photo attached to the complaint" />
            </div>
          )}

          {ticket.needsReview && (
            <p className="review-note">
              <span aria-hidden="true">👁</span> This report is flagged for officer review because the
              triage rules were not confident or the report was not in English.
            </p>
          )}

          {contact?.detail && (
            <p className="privacy-note">
              Contact details ({contact.name || "name not provided"}, {contact.detail}) were not stored
              in this demo ticket.
            </p>
          )}
        </Card>

        <aside className="confirmation-aside" aria-label="Next steps">
          <DemoNotice />
          <Card className="next-steps-card">
            <h2>Save your ticket ID</h2>
            <p>Use it to track the issue or find it on the officer dashboard.</p>
            <div className="stack-actions">
              <Link className={buttonClass("primary", "md", "btn--full")} to={`/dashboard?ticket=${ticket.id}`}>
                View on officer dashboard
              </Link>
              <Button variant="secondary" fullWidth onClick={() => navigate("/report")}>
                Report another issue
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
