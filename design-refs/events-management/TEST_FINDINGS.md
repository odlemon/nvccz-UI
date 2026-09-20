# Events — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). Only 2 screens are actually live (Dashboard, My Events) —
Invitations/Analytics/Venues/Settings sub-modules are commented out in `lib/config/modules.ts`, not built,
out of scope.

## Screens covered

- **Events Dashboard** (`/events`) — KPI cards, monthly Events Overview chart, Upcoming Events list.
  Started genuinely empty (0 events, real not fabricated) with an honest empty state and a "Create First
  Event" CTA.
- **My Events** (`/events/my-events`) — list/grid/calendar view toggle, Create Event wizard.

## FINDING-EVT-001 — Create Event form doesn't mark Description as required, but the backend rejects it without one — fixed

**Severity:** Medium (blocks the core create flow for anyone who reasonably assumes only the `*`-marked
fields are mandatory). **Status: fixed.**

Filled in the Create Event form with everything marked required (Title, Start Date, End Date, Location) and
left Description blank, since its label has no `*` unlike the other four. Submission failed:
`POST /api/events` → 400 `{"message":"Title, description, start date, and end date are required"}`. The
form gave no field-specific error pointing at Description — react-hook-form's `Controller` for it
(`components/events/create-event-wizard.tsx`) had no `rules={{ required: ... }}`, unlike Title's and
Location's identical Controllers a few lines above/below it, so client-side validation silently let it
through. Confirmed the fix by refilling with a description and getting a real `201` — the event
(`cmu9iifde000jsa01yxd0lqz4`) appeared correctly in both the API's own `GET /events` and the Dashboard's
Total Events / monthly chart, then deleted it via `DELETE /events/:id` to leave the environment as found.

**Fix:** added `Description *` label and `rules={{ required: "Description is required" }}` to its
Controller, plus the same inline error span Title/Location already have — matching the existing pattern
exactly rather than inventing a new validation approach.

## Not exercised

- Guest management, budget items/approval, feedback, check-in, Google RSVP sync, bulk guest upload, event
  reports — all real backend routes exist (`nvccz/src/routes/eventRoutes.ts`) but weren't reachable from an
  empty test event without a longer setup (guests, a budget line, etc.); flagging as unexercised rather than
  confirmed-working. Worth a follow-up pass if this module gets real usage.
- List/Grid/Calendar view toggle on My Events — not clicked through individually; the underlying list is
  correct (confirmed via the dashboard reflecting the created/deleted test event), low risk that a pure
  view-mode toggle has a functional bug.

## Coverage note

Core create flow tested end-to-end (write, read-back, delete), one real bug found and fixed. Given the
module's small current surface (2 live screens, most of the built-out event-operations backend not yet
exposed anywhere in the UI per the commented-out sub-modules), this is a reasonable stopping point unless
guest/budget/feedback flows get UI entry points later.
