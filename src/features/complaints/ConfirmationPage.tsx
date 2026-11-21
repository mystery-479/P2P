import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckIcon, EyeIcon } from "../../components/Icons";
import { Button, buttonClass } from "../../components/Button";
import { Card } from "../../components/Card";
import { DemoNotice } from "../../components/DemoNotice";
import { SeverityBadge, StatusBadge } from "../../components/Badges";
import { formatDateTime } from "../../lib/format";
import { getTicket } from "../../lib/ticketApi";
import type { Ticket } from "../../types/ticket";

type ConfirmationState = { ticket?: Ticket; claimCode?: string };

export function ConfirmationPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedClaim, setCopiedClaim] = useState(false);
  const state = location.state as ConfirmationState | null;
  const [ticket, setTicket] = useState<Ticket | undefined>(
    state?.ticket && state.ticket.id === ticketId ? state.ticket : undefined,
  );
  const [claimCode] = useState(state?.claimCode);
  const [loading, setLoading] = useState(!ticket);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    if (ticket) {
      document.title = `Ticket ${ticket.id} — TownThread`;
      headingRef.current?.focus();
      setLoading(false);
      return;
    }
    if (!ticketId) {
      setLoading(false);
      return;
    }
    void getTicket(ticketId)
      .then((found) => {
        if (active) setTicket(found);
      })
      .catch((cause) => {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Could not load report.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ticket, ticketId]);

  if (loading) {
    return <div className="page page--narrow"><p role="status">Loading your receipt…</p></div>;
  }

  if (!ticket) {
    return (
      <div className="page page--narrow">
        <Card className="empty-card">
          <h1 ref={headingRef} tabIndex={-1}>
            Report receipt unavailable
          </h1>
          <p>{loadError || "The receipt is only shown immediately after anonymous submission. If you saved the claim code, sign in and claim it from My reports."}</p>
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

  async function copyClaimCode() {
    if (!claimCode) return;
    try {
      await navigator.clipboard.writeText(claimCode);
      setCopiedClaim(true);
    } catch {
      setCopiedClaim(false);
    }
  }

  return (
    <div className="page page--confirmation">
      <div className="success-banner" role="status">
        <CheckIcon className="success-banner__icon" size={30} />
        <div>
          <h1 ref={headingRef} tabIndex={-1}>
            Thanks — we've got your report
          </h1>
          <p>Your complaint has been turned into a ticket. Here's what happens next.</p>
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
              <EyeIcon className="review-note__icon" /> An officer will take a closer look at this one —
              the details were either unclear or written in a language our demo rules can't read.
            </p>
          )}

          {claimCode && (
            <div className="claim-code-card" role="status">
              <h2>Save your one-time claim code</h2>
              <p>Keep this code private. After signing in, enter it in My reports to link this anonymous report to your account.</p>
              <div className="claim-code-row">
                <code>{claimCode}</code>
                <button type="button" className="link-button" onClick={() => void copyClaimCode()}>
                  {copiedClaim ? "Copied!" : "Copy code"}
                </button>
              </div>
              <strong>This code is shown only once.</strong>
            </div>
          )}
        </Card>

        <aside className="confirmation-aside" aria-label="Next steps">
          <DemoNotice />
          <Card className="next-steps-card">
            <h2>Keep this ticket ID handy</h2>
            <p>Sign in to view reports linked to your account.</p>
            <div className="stack-actions">
              <Link className={buttonClass("primary", "md", "btn--full")} to="/login">
                Sign in to track reports
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
