# Supabase setup and security model

This guide is for the TownThread Supabase project. The SQL migration is in
`supabase/migrations/20261121000000_auth_and_tickets.sql`.

## Roles and access

| Role | Who creates the account | Access |
| --- | --- | --- |
| Citizen | Public email sign-up or anonymous report | Read only tickets linked to their verified account |
| Official | Admin-issued invitation | Read all reports and update operational ticket fields |
| Admin | Bootstrap manually by the project owner, then admin-managed | Manage accounts/settings through trusted server functions |

The app role is stored in `profiles.role`. Users cannot write that column from the browser. The official/admin dashboard routes are only UI guards; Postgres Row Level Security is the actual access boundary.

“Admin” here means application account/settings administration. Editing source code still requires repository access and an approved GitHub change.

## Anonymous reports and account claiming

- The citizen form remains usable without an account.
- Anonymous reports may include an optional email for later claiming; it is stored only in `private.ticket_private`, never in the public ticket row.
- After email verification/sign-in with the same address, a trusted server function can associate the anonymous report with that citizen account.
- A report without a verified email can still be submitted and receives a ticket reference, but cannot appear in an account's private history later.
- Public report creation must use an Edge Function with server-side validation and abuse controls. Do not grant `anon` direct insert access to `tickets`.

## Duplicate grouping

The database groups likely duplicates (it does not delete or combine reports) when all are true:

- Same category.
- Same normalized locality + ward.
- Similar complaint text (Postgres `pg_trgm` similarity threshold currently `0.32`).
- Existing unresolved report was submitted within the preceding 30 days.

The grouping is a candidate heuristic. Officers should be able to review the group and keep separate tickets where appropriate. Adjust threshold/time window only after trying representative examples.

## Create/configure the Supabase project

1. Create a Supabase project and keep its database password private.
2. In **Project Settings → API**, copy the Project URL and **publishable** key (or legacy anon key).
3. Create a local `.env.local` from `.env.example` and set:

   ```dotenv
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

4. Never put a `service_role` key or database password in a `VITE_` variable, frontend code, screenshots, or Git. The service key is only for Edge Function secrets.
5. Run the migration with the Supabase CLI (`supabase link` then `supabase db push`) or paste/review it in the SQL Editor.
6. Configure email auth, sender details, email confirmation, password reset, and allowed redirect URLs for local development and the Vercel deployment.
7. Set up a private photo bucket and policies before storing resident-uploaded photos in production.
8. Deploy the Edge Functions for anonymous report intake, verified report claiming, and official invitations. Use function secrets for server-only keys; never return them to the browser.
9. Bootstrap the first admin through a controlled owner-only process after verifying email. Never expose a public role selector or self-service admin sign-up.

## Abuse prevention and privacy

The report Edge Function should validate payload length, image size/type, locality/ward, and email; rate-limit by IP and verified email; use CAPTCHA/Turnstile for anonymous submissions; and return generic errors that do not reveal whether an email/account exists. Add retention and deletion rules for contact emails and photos.

The migration intentionally denies browser-side anonymous inserts and keeps contact email outside the RLS-exposed `public` schema. Do not loosen these policies to make a failing client request work; fix the Edge Function or policy design instead.

## Values needed locally (do not post secrets in chat)

- Project URL and publishable key in local `.env.local`.
- Supabase project ref for CLI linking.
- Which email provider/from-address to configure.
- Vercel production URL for auth redirects.

The project URL and publishable key are client configuration, but should still be kept in local environment configuration. Never share or commit the service-role key, database password, SMTP credentials, or invite tokens.
