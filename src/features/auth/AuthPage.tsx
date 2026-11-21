import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { TextInput } from "../../components/Inputs";
import { useAuth } from "./AuthProvider";

type AuthMode = "login" | "signup";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, signIn, signUp, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!configured) return <Navigate to="/setup" replace />;
  if (user) return <Navigate to="/my-reports" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password, displayName);
        setMessage(
          "Account created. You can sign in now.",
        );
      } else {
        await signIn(email.trim(), password);
        const destination = (location.state as { from?: string } | null)?.from;
        navigate(destination || "/my-reports", { replace: true });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page--narrow">
      <div className="page-heading">
        <p className="eyebrow">Citizen account</p>
        <h1>{mode === "login" ? "Sign in to TownThread" : "Create your account"}</h1>
        <p className="page-heading__lede">
          {mode === "login"
            ? "Sign in to view the reports linked to your account."
            : "Create an account to track reports you submit and claim anonymous reports using their one-time claim code."}
        </p>
      </div>
      <Card className="auth-card">
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          {mode === "signup" && (
            <Field id="auth-name" label="Name">
              <TextInput
                id="auth-name"
                name="name"
                autoComplete="name"
                maxLength={100}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </Field>
          )}
          <Field id="auth-email" label="Email">
            <TextInput
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field
            id="auth-password"
            label="Password"
            hint={mode === "signup" ? "Use at least 12 characters." : undefined}
          >
            <TextInput
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 12 : 1}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {error && <p className="form-alert" role="alert">{error}</p>}
          {message && <p className="feedback feedback--success" role="status">{message}</p>}
          <Button type="submit" fullWidth size="lg" loading={busy}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? (
            <>New to TownThread? <Link to="/signup">Create a citizen account</Link>.</>
          ) : (
            <>Already registered? <Link to="/login">Sign in</Link>.</>
          )}
        </p>
        <p className="auth-official-note">
          Officials do not self-register. Contact your TownThread administrator for an invitation.
        </p>
      </Card>
    </div>
  );
}
