# Person 3 handoff — Officer dashboard and ticket management

This document tells Person 3 what exists, what was originally yours, and what is still worth doing.

## 1. Current state (read this first)

The officer dashboard has **already been implemented and merged** into `main` (PR #2, commits `ffea750`, `f24a9d9`; follow-up lint fix `cfa21d3`, a11y fixes `0f7615f`). `DashboardPlaceholder.tsx` was deleted.

Run locally:

```bash
git checkout main && git pull
npm install
npm run dev          # http://localhost:5173
```

Routes you own:

| Route | Page | File |
| --- | --- | --- |
| `/dashboard` | Officer queue | `src/features/dashboard/DashboardPage.tsx` |
| `/dashboard/:ticketId` | Ticket detail + officer actions | `src/features/dashboard/TicketDetailPage.tsx` |
| pure helpers | sorting, search, filtering, counts | `src/features/dashboard/ticketQuery.ts` |
| styles | dashboard-only CSS | `src/styles/dashboard.css` |

The queue reads the shared store via `useTickets()` from `src/lib/ticketStore.ts`, so citizen submissions appear immediately without a refresh.

## 2. Originally in your scope — implemented status

| Requirement | Status / where |
| --- | --- |
| Summary counts for Open / In Progress / Resolved | ✅ `DashboardPage.tsx`, `countByStatus()` |
| Priority sort Critical → High → Medium → Low, then oldest first | ✅ `sortByPriority()` using `SEVERITY_RANK` from `src/types/ticket.ts` |
| Search by ticket ID, complaint text, location | ✅ `filterTickets()`; `/dashboard?ticket=<id>` redirects to detail |
| Filters for severity, category, department, status | ✅ combined in one `filterTickets()` call; plus "Needs review only" |
| Ticket rows: severity, category, summary, location, department, status, time | ✅ with review/photo flags |
| Ticket detail: complaint, photo, location, severity reason, routing recommendation | ✅ `TicketDetailPage.tsx` |
| Officer actions: correct category/severity, reassign department, update status | ✅ plus review-flag toggle, "Restore recommendation", save feedback |
| Empty, loading, error states | ✅ skeletons, two empty states, save/reset error alerts |
| Persist officer changes | ✅ via `updateTicket()` → localStorage |
| Works with sample and newly submitted tickets | ✅ verified in browser; 10 tickets seed the queue |

Verified with `npm run build`, `npm run lint`, and Lighthouse **1.00** for accessibility on all three pages.

## 3. What is still left for Person 3

### 3.1 Required before the demo — QA and sign-off

1. **Walk the full officer flow yourself** and confirm it matches the plan:
   - Open `/dashboard`, check the first row is `Critical` and that 10 sample tickets are ordered correctly.
   - Search `CL-2026-1041`; then clear and filter by severity + category + status together.
   - Toggle "Needs review only" — expect 3 tickets in the seed data.
   - Open a detail page, change department and status, click **Save changes**, go back — confirm the row and counts changed.
   - Submit a new citizen complaint at `/report`, then find it on your dashboard.
2. **Reset demo data** between rehearsals with the "Reset demo data" link at the top of the dashboard (or `resetTickets()` in the browser console).
3. **Report any bug** to the team; if you fix it, use your own branch and PR. Do not silently change the shared ticket type.

### 3.2 Integration dependency on Person 2

- Person 2's triage service is now wired in at `src/lib/triage.ts` (`demoTriage.ts` is only a compatibility shim). It is still **rule-based demo logic, not an AI model**, but now detects the language from Unicode script, scores categories, explains severity and routes departments. Re-run the flow to confirm category, severity, reason, department and `needsReview` still flow into your queue through `createTicket()`.
- `needsReview` still means "unclear / low-confidence / non-English demo script", so your "Needs review only" filter keeps working. `npm run test:triage` covers these cases (10 checks).

### 3.3 Optional improvements you can own (only if time permits)

- **Persist filters in the URL** so an officer can bookmark/share a filtered view.
- **Audit note on override** — record that an officer corrected the category/severity (currently only the final value is stored; the original recommendation remains visible on the detail page).
- **Cross-tab sync** — `useSyncExternalStore` updates within one tab; a `storage` event listener would sync other tabs too.
- **Sort control inside a severity band** — currently always oldest first, per the plan; add a toggle only if the team agrees it does not break the required default.
- **Demo script / backup video** of the officer flow for the presentation (guide requires a 2–3 minute backup video).

## 4. Shared files — coordinate before editing

These are team-owned; ask before changing:

- `src/types/ticket.ts` — the agreed `Ticket`, `Severity`, `TicketCategory`, `TicketStatus` contract.
- `src/lib/ticketStore.ts` — `createTicket`, `updateTicket`, `useTickets`, `resetTickets`.
- `src/App.tsx` — route table.
- `package.json`, `vite.config.ts`, `tsconfig*.json`.

Your own files are the four listed in section 1 plus `src/styles/dashboard.css` — you can change those freely.

## 5. Git workflow

```bash
git checkout main && git pull
git checkout -b feature/officer-dashboard-qa     # or your chosen task
# make changes
npm run build && npm run lint
git add . && git commit -m "Short description of change"
git push -u origin feature/officer-dashboard-qa
# open a PR into main with a short description
```

Every member's commits are part of the judging evidence, so keep committing as you work and never push feature work straight to `main`.

## 6. Known limitations to mention in the pitch

- No authentication or real municipal backend; data lives in browser `localStorage`.
- Triage recommendations can be wrong — the officer correction flow exists precisely for this reason.
- Recommendations are rule-based demo logic, not an AI model, until Person 2 wires in a real service.
