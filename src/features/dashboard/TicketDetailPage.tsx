import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SeverityBadge, StatusBadge } from "../../components/Badges";
import { Button, buttonClass } from "../../components/Button";
import { Card } from "../../components/Card";
import { DemoNotice } from "../../components/DemoNotice";
import { Field } from "../../components/Field";
import { Select } from "../../components/Inputs";
import { formatDateTime } from "../../lib/format";
import { updateTicket, useTickets } from "../../lib/ticketStore";
import {
  CATEGORIES,
  DEPARTMENTS,
  SEVERITIES,
  STATUSES,
  type Severity,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from "../../types/ticket";

type ActionForm = {
  category: TicketCategory;
  severity: Severity;
  department: string;
  status: TicketStatus;
  needsReview: boolean;
};

function toForm(ticket: Ticket): ActionForm {
  return {
    category: ticket.category,
    severity: ticket.severity,
    department: ticket.department,
    status: ticket.status,
    needsReview: Boolean(ticket.needsReview),
  };
}

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const tickets = useTickets();
  const ticket = tickets.find((item) => item.id === ticketId);

  const [form, setForm] = useState<ActionForm | null>(null);
  const [recommendation, setRecommendation] = useState<ActionForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ticket) return;
    const initial = toForm(ticket);
    setForm(initial);
    setRecommendation(initial);
    setFeedback(null);
    document.title = `Ticket ${ticket.id} — CivicLens`;
    // Only re-initialise when navigating to a different ticket, not after a save.
  }, [ticket?.id]);

  function set<K extends keyof ActionForm>(key: K, value: ActionForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setFeedback(null);
  }

  async function handleSave() {
    if (!ticket || !form) return;
    setSaving(true);
    setFeedback(null);
    try {
      updateTicket(ticket.id, form);
      setFeedback({ kind: "success", text: "Saved. Your queue now shows the updated ticket." });
    } catch {
      setFeedback({ kind: "error", text: "We could not save those changes. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  function restoreRecommendation() {
    if (!recommendation) return;
    setForm(recommendation);
    setFeedback(null);
  }

  if (loading) {
    return (
      <div className="page page--dashboard" aria-busy="true">
        <p className="eyebrow">Municipal officers</p>
        <h1>Ticket detail</h1>
        <Card className="detail-loading">
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--short" />
          <span className="skeleton skeleton--line" />
        </Card>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page page--narrow">
        <Card className="empty-card">
          <h1>Ticket not found</h1>
          <p>We could not find that ticket in this browser's demo data.</p>
          <Link className={buttonClass("primary")} to="/dashboard">
            Back to dashboard
          </Link>
        </Card>
      </div>
    );
  }

  const departments = Array.from(
    new Set([...Object.values(DEPARTMENTS), ticket.department]),
  ).filter(Boolean).sort();

  return (
    <div className="page page--dashboard">
      <Link className="back-link" to="/dashboard">
        ← Back to dashboard
      </Link>

      <div className="detail-header">
        <div>
          <p className="eyebrow">Ticket detail</p>
          <h1>{ticket.id}</h1>
          <p className="detail-header__meta">
            Submitted {formatDateTime(ticket.createdAt)} · {ticket.language}
          </p>
        </div>
        <div className="detail-header__badges">
          <SeverityBadge severity={form?.severity ?? ticket.severity} />
          <StatusBadge status={form?.status ?? ticket.status} />
          {(form?.needsReview ?? ticket.needsReview) && (
            <span className="flag flag--review">Needs review</span>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <Card className="detail-card">
            <h2>Original complaint</h2>
            <p className="detail-complaint preserve-lines">{ticket.description}</p>
            <dl className="detail-facts">
              <div>
                <dt>Location</dt>
                <dd>{ticket.location}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDateTime(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{ticket.language}</dd>
              </div>
            </dl>
            {ticket.photoUrl && (
              <figure className="detail-photo">
                <img src={ticket.photoUrl} alt={`Photo attached to ticket ${ticket.id}`} />
                <figcaption>Photo provided with the complaint</figcaption>
              </figure>
            )}
          </Card>

          <Card className="detail-card">
            <h2>Triage recommendation</h2>
            <div className="recommendation-grid">
              <div>
                <span className="summary-item__label">Suggested severity</span>
                <SeverityBadge severity={ticket.severity} />
              </div>
              <div>
                <span className="summary-item__label">Suggested category</span>
                <strong>{ticket.category}</strong>
              </div>
              <div>
                <span className="summary-item__label">Recommended department</span>
                <strong>{ticket.department}</strong>
              </div>
            </div>
            <p className="severity-reason">
              <strong>Why this severity:</strong> {ticket.severityReason}
            </p>
            <DemoNotice>
              Routing and severity are rule-based recommendations for this demo. Use the officer
              actions to correct them and record the final decision.
            </DemoNotice>
          </Card>
        </div>

        <aside className="detail-aside">
          <Card className="action-card">
            <h2>Officer actions</h2>
            <p className="action-card__lede">
              Make it yours — correct the triage and update the status as you work it.
            </p>

            {feedback && (
              <p className={feedback.kind === "success" ? "feedback feedback--success" : "form-alert"} role="status">
                {feedback.kind === "success" ? "✓ " : "⚠ "}
                {feedback.text}
              </p>
            )}

            {form && (
              <div className="action-form">
                <Field id="action-category" label="Category">
                  <Select
                    id="action-category"
                    value={form.category}
                    onChange={(event) => set("category", event.target.value as TicketCategory)}
                  >
                    {CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="action-severity" label="Severity">
                  <Select
                    id="action-severity"
                    value={form.severity}
                    onChange={(event) => set("severity", event.target.value as Severity)}
                  >
                    {SEVERITIES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="action-department" label="Assigned department">
                  <Select
                    id="action-department"
                    value={form.department}
                    onChange={(event) => set("department", event.target.value)}
                  >
                    {departments.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field id="action-status" label="Status">
                  <Select
                    id="action-status"
                    value={form.status}
                    onChange={(event) => set("status", event.target.value as TicketStatus)}
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                </Field>

                <label className="check-control">
                  <input
                    type="checkbox"
                    checked={form.needsReview}
                    onChange={(event) => set("needsReview", event.target.checked)}
                  />
                  Keep flagged for review
                </label>

                <div className="stack-actions">
                  <Button type="button" size="lg" fullWidth loading={saving} onClick={() => void handleSave()}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                  <Button type="button" variant="secondary" fullWidth onClick={restoreRecommendation}>
                    Restore recommendation
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
