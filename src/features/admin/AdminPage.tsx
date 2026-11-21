import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { TextInput } from "../../components/Inputs";
import { supabase } from "../../lib/supabase";

type ManagedAccount = {
  id: string;
  email: string;
  displayName: string;
  role: "citizen" | "official" | "admin";
  disabled: boolean;
};

export function AdminPage() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAccounts = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-users", {
      body: { action: "list" },
    });
    if (invokeError) setError(invokeError.message);
    else setAccounts((data?.accounts ?? []) as ManagedAccount[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: invokeError } = await supabase.functions.invoke("admin-users", {
      body: { action: "invite-official", email: email.trim(), displayName: displayName.trim() },
    });
    setBusy(false);
    if (invokeError) {
      setError(invokeError.message);
      return;
    }
    setMessage(`An official invitation was sent to ${email.trim()}.`);
    setEmail("");
    setDisplayName("");
    await loadAccounts();
  }

  async function setOfficialAccess(account: ManagedAccount, active: boolean) {
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: invokeError } = await supabase.functions.invoke("admin-users", {
      body: { action: active ? "activate" : "deactivate", userId: account.id },
    });
    setBusy(false);
    if (invokeError) setError(invokeError.message);
    else {
      setMessage(`${account.email} ${active ? "restored" : "suspended"}.`);
      await loadAccounts();
    }
  }

  async function changeRole(account: ManagedAccount, role: "citizen" | "official") {
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const { error: invokeError } = await supabase.functions.invoke("admin-users", {
      body: { action: "set-role", userId: account.id, role },
    });
    setBusy(false);
    if (invokeError) setError(invokeError.message);
    else {
      setMessage(`${account.email} is now ${role}.`);
      await loadAccounts();
    }
  }

  return (
    <div className="page page--dashboard">
      <div className="page-heading">
        <p className="eyebrow">Application administration</p>
        <h1>Manage accounts</h1>
        <p className="page-heading__lede">
          Invite officials and manage application access. Source-code changes still require GitHub access and review.
        </p>
      </div>

      <Card className="admin-invite-card">
        <h2>Invite an official</h2>
        <p>Officials cannot self-register. Supabase sends an invite link so they can set their own password.</p>
        <form className="admin-invite-form" onSubmit={(event) => void handleInvite(event)}>
          <Field id="official-name" label="Official name">
            <TextInput
              id="official-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={100}
              required
            />
          </Field>
          <Field id="official-email" label="Official email">
            <TextInput
              id="official-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />
          </Field>
          <Button type="submit" loading={busy}>Send official invite</Button>
        </form>
        {error && <p className="form-alert" role="alert">{error}</p>}
        {message && <p className="feedback feedback--success" role="status">{message}</p>}
      </Card>

      <Card className="admin-accounts-card">
        <h2>Accounts</h2>
        {loading ? (
          <p role="status">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p>No accounts to show.</p>
        ) : (
          <div className="admin-account-list">
            {accounts.map((account) => (
              <article className="admin-account-row" key={account.id}>
                <div>
                  <strong>{account.displayName || account.email}</strong>
                  <p>{account.email} · {account.role}</p>
                </div>
                {(account.role === "official" || account.role === "citizen") && (
                  <div className="admin-account-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void changeRole(account, account.role === "official" ? "citizen" : "official")}
                    >
                      {account.role === "official" ? "Make citizen" : "Make official"}
                    </Button>
                    {account.role === "official" && (
                  <Button
                    variant={account.disabled ? "secondary" : "danger"}
                    size="sm"
                    disabled={busy}
                    onClick={() => void setOfficialAccess(account, account.disabled)}
                  >
                    {account.disabled ? "Restore access" : "Suspend"}
                  </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
