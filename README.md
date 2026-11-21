# TownThread

AI-assisted triage for citizen complaints. TownThread turns a free-text report, with an optional photo and location, into a structured municipal ticket that can be prioritised and routed to the right department.

> **Prototype status:** A Vite + React + TypeScript app with the shared ticket contract, app shell, citizen complaint flow and a full officer dashboard (search, filters, details, officer actions) is implemented. Triage currently uses clearly labelled demo keyword rules — it is not an AI model. Supabase auth/data groundwork is being added; the frontend is not yet connected to a Supabase project.

## Contents

- [Problem and goals](#problem-and-goals)
- [Prototype scope](#prototype-scope)
- [User journeys](#user-journeys)
- [Ticket model](#ticket-model)
- [Classification and routing](#classification-and-routing)
- [Priority rules](#priority-rules)
- [Dashboard requirements](#dashboard-requirements)
- [Team responsibilities](#team-responsibilities)
- [Repository workflow](#repository-workflow)
- [Suggested project structure](#suggested-project-structure)
- [Development setup](#development-setup)
- [Acceptance checklist](#acceptance-checklist)
- [Limitations and safety](#limitations-and-safety)

## Problem and goals

Municipal departments receive many reports about issues such as potholes, overflowing garbage, broken streetlights, water leaks, blocked drains, and fallen trees. Reports may be vague, duplicated, or sent to the wrong team. TownThread aims to help officers review the most urgent issues first.

The prototype should:

1. Accept an unstructured complaint in English or a regional language.
2. Allow an optional photo and location.
3. Classify the issue into a municipal category.
4. Recommend a severity: **Low**, **Medium**, **High**, or **Critical**, with a one-line reason.
5. Recommend the responsible department.
6. Show tickets in a priority-sorted officer dashboard.

## Prototype scope

### In scope

- Citizen complaint form and submission confirmation.
- Structured ticket creation.
- Category, severity, severity reason, and department recommendation.
- Officer dashboard with priority ordering, search, and filters.
- Ticket details and basic officer actions (assignment and status updates).
- Seed/demo tickets so the workflow can be demonstrated.

### Out of scope unless the team explicitly adds it

- Production municipal integrations or dispatch.
- Authentication, role management, and official identity verification.
- Guaranteed translation or diagnosis of every language or image.
- Emergency response service. TownThread is not a replacement for local emergency channels.
- Production-grade duplicate detection, geocoding, or map services.

## User journeys

### Citizen

1. Opens **Report an issue**.
2. Enters a description and optionally adds a photo, location, and contact details.
3. Submits the report.
4. Sees a confirmation with a ticket ID and the system's current recommendations.

### Municipal officer

1. Opens the **Officer dashboard**.
2. Reviews the highest-priority tickets first.
3. Searches or filters the queue.
4. Opens a ticket to inspect its description, image, location, and recommendations.
5. Corrects the category or severity if needed, assigns a department, and updates status.

## Ticket model

The exact implementation may vary with the chosen stack, but the shared data contract should include at least:

```ts
type Severity = "Low" | "Medium" | "High" | "Critical";
type TicketStatus = "Open" | "In Progress" | "Resolved";
type TicketCategory =
  | "Roads"
  | "Waste"
  | "Water"
  | "Electricity"
  | "Trees"
  | "Drainage"
  | "Other";

type Ticket = {
  id: string;
  description: string;
  language: string;
  photoUrl?: string;
  location: string;
  category: TicketCategory;
  severity: Severity;
  severityReason: string;
  department: string;
  status: TicketStatus;
  createdAt: string; // ISO-8601 timestamp
  needsReview?: boolean;
};
```

The team should agree on and publish this contract before the form, classifier, and dashboard are integrated. If using an API, document request/response shapes and error behavior as well.

## Classification and routing

Suggested initial category-to-department mapping:

| Category | Suggested department |
| --- | --- |
| Roads | Public Works / Roads |
| Waste | Sanitation |
| Water | Water Supply |
| Electricity | Electrical |
| Trees | Parks / Horticulture |
| Drainage | Drainage / Public Works |
| Other or unclear | Manual review |

Classification results are recommendations. The prototype should mark unclear or low-confidence results for officer review and allow officers to correct them. If a real AI provider is not connected, any keyword-based/demo classifier must be identified as demo logic in the interface and documentation.

## Priority rules

Default dashboard ordering:

1. Critical
2. High
3. Medium
4. Low

Within each severity, show the oldest ticket first. Search and filters should not silently change the priority ordering of the remaining results.

Severity guidance for the prototype:

- **Critical:** Immediate danger to life or a major public-safety risk.
- **High:** Significant hazard or disruption requiring prompt attention.
- **Medium:** A service issue needing attention but without an immediate severe hazard.
- **Low:** Minor issue with limited impact.

Every severity must include a short, understandable reason. Example: “High — exposed wiring near a busy footpath creates a safety risk.”

## Dashboard requirements

The officer dashboard should provide:

- Counts for Open, In Progress, and Resolved tickets.
- Priority-sorted ticket list.
- Search by ticket ID, description, or location.
- Filters for severity, category, department, and status.
- Ticket summary, location, department, status, submission time, and photo indicator.
- Ticket detail view with the original complaint and classification reason.
- Actions to update status and correct/reassign recommendations.
- Useful empty, loading, and error states.

## Team responsibilities

The three contributors should coordinate ownership and shared interfaces before parallel work.

### Person 1 — Starter UI and citizen reporting

- Establish the app shell, navigation, responsive layout, and shared UI components.
- Build the citizen complaint form, optional photo flow, validation, and confirmation screen.
- Use the shared ticket contract and submit through the agreed data/API interface.

### Person 2 — Project foundation and ticket processing

- Initialize the selected framework/tooling and document setup commands.
- Define the shared ticket types, sample data, and ticket create/list/update interface.
- Implement category, severity, reason, department routing, and review fallback.
- Document whether processing is real AI, a connected service, or demo logic.

### Person 3 — Officer dashboard and ticket management

- Build the officer dashboard, priority sorting, search, filters, and status counts.
- Build ticket details and officer actions.
- Integrate against the shared ticket contract; use sample tickets while the data layer is in progress.
- Test the full submission-to-dashboard workflow and report integration issues.

### Shared responsibilities

- Agree on framework, backend/storage, AI approach, and shared types together.
- Review pull requests and avoid changing shared interfaces without coordinating.
- Test the complete demo flow and keep this README accurate as implementation decisions are made.

## Repository workflow

Repository: [https://github.com/mystery-479/P2P](https://github.com/mystery-479/P2P)

Suggested workflow:

1. Keep `main` in a runnable, reviewable state.
2. Create a feature branch for each coherent piece of work, for example:
   - `feature/starter-and-complaint-form`
   - `feature/ticket-processing`
   - `feature/officer-dashboard`
3. Open a pull request into `main`; include a summary, screenshots for UI changes, and testing notes.
4. Build/test the branch before requesting review.
5. Coordinate edits to shared types, app setup, navigation, and configuration.
6. Do not commit secrets, API keys, or real residents' personal information.

## Suggested project structure

Adapt this to the framework selected by the team:

```text
.
├── public/
├── src/
│   ├── components/       # Shared UI components
│   ├── features/
│   │   ├── complaints/   # Citizen report flow
│   │   ├── dashboard/    # Officer queue and filters
│   │   └── tickets/      # Ticket details and actions
│   ├── services/         # API or storage access
│   ├── types/            # Shared ticket/domain types
│   └── utils/            # Sorting, formatting, validation
├── README.md
└── package.json          # If using a Node-based frontend
```

## Development setup

Stack: **Vite + React 18 + TypeScript** with React Router. The current demo UI still runs without a backend; Supabase integration setup is documented in [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md).

Requirements: Node.js 20+ and npm 10+.

```bash
npm install       # install dependencies
npm run dev       # start the dev server at http://localhost:5173
npm run build     # type-check and create a production build in dist/
npm run preview   # serve the production build locally
npm run typecheck # TypeScript only
npm run lint      # ESLint
```

Notes for the demo:

- Tickets are stored in the browser's `localStorage` under `townthread.tickets.v1`, seeded with synthetic sample tickets on first load.
- `resetTickets()` in `src/lib/ticketStore.ts` restores the sample data (run it from the browser console during testing).
- No real personal data is stored. Optional contact details are shown once on the confirmation screen and discarded.
- Photo uploads are compressed in the browser and kept as data URLs for the demo.
- Supabase schema, role security, and duplicate grouping groundwork are in `supabase/migrations/`; apply them only to the intended Supabase project after review.

### Shared code to build on

| Path | What it provides |
| --- | --- |
| `src/types/ticket.ts` | The agreed `Ticket`, `ComplaintDraft` and `TriageResult` types, category/severity/status constants and department map. |
| `src/lib/ticketStore.ts` | `getTickets`, `getTicket`, `createTicket`, `updateTicket`, `useTickets` and `resetTickets`. New submissions appear in the dashboard immediately. |
| `src/features/complaints/demoTriage.ts` | **Demo keyword rules only.** Person 2 can replace this with the real classification service without touching the form or store. |
| `src/components/` | Reusable `Button`, `Card`, `Field`, inputs, badges, `DemoNotice` and the app shell (`Layout`). |
| `src/features/dashboard/ticketQuery.ts` | Pure priority sorting (`Critical → High → Medium → Low`, oldest first), combined search/filter helpers and status counts. |
| `src/features/dashboard/DashboardPage.tsx` | Full officer queue: counts, search, four filters, review-only toggle, loading/empty/error states. |
| `src/features/dashboard/TicketDetailPage.tsx` | Full complaint, photo, location, severity reason, routing recommendation and officer actions (category, severity, department, status, review flag). |
| `src/styles/` | Design tokens, global styles and dashboard styles with responsive, accessible focus states. |

Routes: `/report` (form), `/confirmation/:ticketId` (receipt), `/dashboard` (officer queue), `/dashboard/:ticketId` (ticket detail and actions). A legacy `/dashboard?ticket=<id>` link redirects to the detail page.

## Acceptance checklist

- [x] Citizen can submit a text complaint with or without a photo.
- [x] The form supports complaints written in English or a regional language, and clearly indicates prototype language limitations (non-English is flagged for review).
- [x] Submission produces a ticket ID and confirmation.
- [x] Ticket includes category, severity, one-line reason, department, status, and timestamp.
- [x] Unclear/low-confidence results can be flagged for review.
- [x] Dashboard sorts Critical, High, Medium, then Low; oldest first within each level.
- [x] Search and filters work together, including a "Needs review only" toggle.
- [x] Officer can inspect a ticket and change its category, severity, department, status or review flag.
- [x] Changes are reflected in the dashboard and persisted in browser storage.
- [x] Application runs from the documented instructions and the demo flow is tested.

## Limitations and safety

- AI classifications can be wrong. Officers must be able to review and correct recommendations.
- Do not promise response times or claim an issue has been dispatched unless a real municipal workflow exists.
- Avoid exposing personal contact details in the general dashboard.
- Use synthetic/demo data during development and presentations.
- Tell citizens to use local emergency services for immediate danger; the prototype is not an emergency service.
