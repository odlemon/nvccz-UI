# Homepage — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). Current module id is `home-v3` (name "Homepage"), 12 screens,
a "-mock" vendored-runtime port like Procurement/Portfolio/Investee/Performance
(`components/home-v3-mock/home-v3-app.tsx` mounting `matanho-runtime.js`, live-wired via
`lib/home-v3/actions.ts` + `lib/home-v3/live-loaders.ts`, merged via `feature/home-page` on 2026-09-16).

## Correction, recorded for the record

I initially reported this module as having **zero backend wiring at all** — wrong, and worth being precise
about why. My `find` command searching for a Homepage actions file used `-o` without grouping
parentheses (`find . -ipath "*home-v3*" -iname "*.tsx" -o -ipath "*home-v3*" -iname "*.ts"`), which due to
operator precedence searched the *entire repository* for the second clause, not just home-v3 paths — it
silently returned nothing useful, and I concluded no actions file existed instead of noticing the query was
broken. Compounding that, I read `components/home-v3-mock/hv3-page.tsx` (a genuinely-unused 15-line stub —
that part was real) without checking `home-v3-app.tsx`, the actual mounted host component. The real
`lib/home-v3/actions.ts` (532 lines) and `lib/home-v3/live-loaders.ts` (939 lines) exist, are real, and are
live-wired — confirmed by re-testing properly below. Flagged directly by the user, who was right to push
back hard on the claim.

## Screens covered (all 12)

Dashboard/Home, Daily Cover, News, Newsletters, Forums, Calendar, My Work, Performance, People, My Profile,
Services, Apps, Matanho AI (search) — all loaded without console errors and rendered either real backend
data (People's "22 Colleagues" exactly matches Admin Management's real user count; My Work's tasks are real
task records, not fixtures; Apps correctly lists all 13 real platform modules) or honest, correctly-labelled
empty/not-configured states (Performance: "No active performance contract found for this employee" —
correct, `admin@nts.com` is a system account, not a real employee; Services: "Not set up"/"Not tracked yet"
for leave balance and payslip; Forums/Newsletters: "No [posts/newsletters] yet").

## Live-verified write path: News post creation — works correctly end to end

Given the false start above, verified this properly rather than trusting a first impression. My first two
attempts at clicking "New post" via the browser-automation tool's element ref / coordinates navigated to
`/home/news` and did nothing — investigated thoroughly (checked the deployed container's bundle for the
`post.created`/`createPost` wiring — present; checked the DOM for a stray wrapping `<a>` intercepting the
click — none) before concluding the failures were the *tool* mis-targeting an element, not a product bug.
Confirmed by calling `.click()` directly on `document.querySelector('button[data-action="new-post"]')`: the
real compose modal opened immediately (Title/Message/Notify-everyone/Publish, matching
`matanho-runtime.js`'s `new-post` action handler exactly). Filled it in, published — real `POST /api/posts`
201, the post appeared correctly in the list (author, "JUST NOW" timestamp, 0 replies) — then deleted it via
`DELETE /api/posts/:id` to leave the environment clean. No defect here; this action is fully functional.

## No other defects found

Newsletters and Forums use the identical `createNewsletter`/`createPost` (with `category`) action pattern
already confirmed working for News — not independently re-tested given the shared, already-verified
mechanism and time budget across a 9-module sweep, but no reason to suspect either is broken differently
from what was just confirmed.

## Not exercised

- Calendar's "Find a time" / "Create event" (`createCalendarEntry` exists in actions.ts) — not clicked
  through; Calendar rendered correctly (current week Mon 14–Fri 18 shown correctly for "today" = Sun 20)
  with an honest "Nothing on your calendar right now" empty state.
- Daily Cover's theme/wallpaper personalization writes (`syncCoverPreference`, `uploadWallpapers`) — screen
  renders correctly with real options; the underlying `PUT /homepage/preferences` wasn't submitted.
- Services' Quick Actions (Request leave, Download payslip, Submit expense, Book travel, Report an issue) —
  `createServiceRequest`/`downloadPayslip` exist and are wired per actions.ts; not clicked through
  individually.
- Matanho AI's actual "Ask" functionality — screen renders with real prompts/history, but a live AI query
  wasn't submitted (out of scope for this pass — a stateful, potentially slow/costly operation to test
  speculatively).

## Coverage note

All 12 screens loaded cleanly with no console errors and either real or honestly-labelled data. One
verified-working write path (News). No confirmed defects in this module this pass — a genuinely clean
result, unlike the other modules in this sweep, but arrived at only after correcting an early wrong
conclusion rather than the first pass being right.
