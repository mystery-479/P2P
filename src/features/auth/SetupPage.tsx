import { Link } from "react-router-dom";
import { Card } from "../../components/Card";

export function SetupPage() {
  return (
    <div className="page page--narrow">
      <Card className="auth-card">
        <p className="eyebrow">Setup required</p>
        <h1>Connect ReportBox to Supabase</h1>
        <p>
          Authentication and secure ticket access are not enabled until this app is configured
          with the Supabase project URL and publishable key.
        </p>
        <ol>
          <li>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
          <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
          <li>Apply the Supabase migrations and restart the development server.</li>
        </ol>
        <p>
          Never place a service-role key in this app. See <Link to="/report">the public report form</Link> only after setup.
        </p>
      </Card>
    </div>
  );
}
