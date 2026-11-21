import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Card } from "../../components/Card";
import { CategoryBadge, SeverityBadge, StatusBadge } from "../../components/Badges";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { TextInput } from "../../components/Inputs";
import { formatDateTime, summaryOf } from "../../lib/format";
import { claimReport, listTickets } from "../../lib/ticketApi";
import type { Ticket } from "../../types/ticket";

export function MyReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [claimCode, setClaimCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await listTickets());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaiming(true);
    setError("");
    setMessage("");
    try {
      const ticketCode = await claimReport(claimCode);
      setClaimCode("");
      setMessage(`Report ${ticketCode} is now linked to your account.`);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not claim that report.");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="page page--dashboard">
      <div className="page-heading">
        <p className="eyebrow">Citizen account</p>
        <h1>My reports</h1>
        <p className="page-heading__lede">
          Reports submitted while signed in, plus any anonymous reports you claimed, appear here.
        </p>
      </div>

      <Card className="claim-form-card">
        <h2>Link an anonymous report</h2>
        <p>Enter the one-time claim code shown on its receipt. Anyone with this code can claim that report, so keep it private.</p>
        <form className="claim-form" onSubmit={(event) => void handleClaim(event)}>
          <Field id="claim-code" label="One-time claim code">
            <TextInput
              id="claim-code"
              value={claimCode}
              onChange={(event) => setClaimCode(event.target.value)}
              autoComplete="off"
              minLength={20}
              maxLength={100}
              required
            />
          </Field>
          <Button type="submit" loading={claiming} disabled={!claimCode.trim()}>
            Claim report
          </Button>
        </form>
        {error && <p className="form-alert" role="alert">{error}</p>}
        {message && <p className="feedback feedback--success" role="status">{message}</p>}
      </Card>

      <Card className="my-reports-card">
        <h2>Your requests</h2>
        {loading ? (
          <p role="status">Loading your reports…</p>
        ) : tickets.length === 0 ? (
          <div className="empty-card">
            <h3>No linked reports yet</h3>
            <p>Reports you submit while signed in will appear here. You can also claim an anonymous report above.</p>
          </div>
        ) : (
          <div className="ticket-list">
            {tickets.map((ticket) => (
              <article className="ticket-row ticket-row--static" key={ticket.id}>
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
                    <time dateTime={ticket.createdAt}>{formatDateTime(ticket.createdAt)}</time>
                  </p>
                  <p className="ticket-row__flags">
                    <strong>Status:</strong> {ticket.status}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
