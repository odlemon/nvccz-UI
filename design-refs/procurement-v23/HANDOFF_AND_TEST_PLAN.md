# Procurement V23 — handoff and demo-readiness test plan

**For:** the next agent picking this up cold · **Goal:** the whole Procurement V23 module demo-ready
for the client · **Handoff date:** 12 September 2026

Read the whole document before touching anything. §3 (rules) is not optional — every rule there
exists because breaking it has already cost time or broken something.

---

## 1. What this is

Arcus / Matanho platform. Procurement V23 is a "client-faithful port": a vendored runtime script
rendered inside a Next.js host, with live data and write actions wired to the backend.

| | Path | Notes |
|---|---|---|
| Frontend repo | `C:\Users\lysp\Downloads\nvccz-new` | Next.js 14 · GitHub `odlemon/nvccz-UI` · default branch **`dev`** |
| API repo | `C:\Users\lysp\Downloads\nvccz` | Express + Prisma + MySQL · GitHub `odlemon/nvccz` · default **`master`**, also **`prod`** |
| Working branch (both) | `feature/procurement-v23-live` | |
| Frozen legacy | `app/procurement/**` | **Do not touch.** V23 lives in `app/procurement-v23/**` |

**Frontend key files**
- `components/procurement-v23-mock/matanho-procurement-runtime.js` — vendored runtime. **Generated — never hand-edit.**
- `scripts/procurement-runtime-live-bridge.inc.js` — live bridge functions injected into the runtime
- `scripts/patch-procurement-runtime.mjs` — applies bridge + patches. Run `node scripts/patch-procurement-runtime.mjs`; it must print `0 missed`
- `components/procurement-v23-mock/procurement-v23-app.tsx` — host; intercepts `[data-action]` clicks
- `lib/procurement-v23/actions.ts` — write actions (`LIVE_ACTIONS`, refusals, `OPENER_GRANTS`)
- `lib/procurement-v23/live-loaders.ts` — data, KPI cards, sidebar counts
- `lib/api/procurement-v23-api.ts` — API client
- `lib/procurement-v23-mock/nav.ts` — page id ↔ URL map
- `design-refs/procurement-v23/TEST_FINDINGS.md` — full history, cycles 0–6. **Append cycle seven here.**
- `design-refs/procurement-v23/HOW_PROCUREMENT_WORKS.md` — non-technical user guide
- `design-refs/procurement-v23/PROCUREMENT_SCREEN_BY_SCREEN.md` — every screen as seen on dev (uncommitted)

**API key files:** `src/routes/procurementSuite06Routes.ts`, `src/controllers/ProcurementSuite06Controller.ts`
(`extractForCapture`), `src/services/VendorInvoiceIntakeService.ts`, `src/config/procurementPermissions.ts`
(role grants), `src/services/LlmChatService.ts`, `src/config/llmGlobals.ts`.

---

## 2. Where everything stands

*Updated in cycle seven, 12 September 2026 — details in `TEST_FINDINGS.md`, "Cycle seven".*

| | Dev | Production |
|---|---|---|
| API | `0567a73` (audit trail) | `09a19ad` — **no cycle-seven fix** |
| Staff UI | `74aa990` live; `bb21fd2` deploying (audit labels + CORS compose) | `2a36e93` — **has D2, the listener leak, the grants race and the CORS block** |
| API CORS (Traefik label) | PATCH allowed once the api container is recreated after `bb21fd2` | **PATCH blocked** |
| Register tables | present, with data | migrated 12 Sep, rows 0 |
| Procurement data | UAT dataset ("UAT P2P …", "UAT WF …") | essentially none |

**Production is on hold** by the owner's instruction: nothing from cycle seven is promoted until they say so.

**Git:** cycle-seven commits are local on `feature/procurement-v23-live` in both repos until the dev run is
green — UI `b89e968`, `c9a7fee`, `9ac9e73`, `74aa990`, `4995f5e`, `8aee3cc`, `bb21fd2`; API `0567a73`.
Nothing merged to `dev`, `master` or `prod`.

**Prod rollback tags:** `nvccz-prod-api:pre-registers-20260912`, `nvccz-prod-ui-staff:pre-registers-20260912`.

**Last full regression on dev** (API `09a19ad` + staff `b89e968`): actions **17/17**, workflows **15/15**,
AI capture **13/13**; sidebar-nav 17/17 pages for every persona that signs in. The final run on the
cycle-seven build is pending.

### Defects found and fixed in cycle seven (dev)

| | Defect | Fix |
|---|---|---|
| D1 | After any sidebar navigation, buttons the host does not claim were dead (8 of 11 openers) — the old runtime's document/window listeners outlived the remount and swallowed clicks. "Capture this invoice" was one of them. | UI `b89e968` (patch step 24, `__pr23On`) |
| D2 | AI Invoice Capture had no route (bounced to the Command Centre) | UI `61e756f` — on dev |
| — | For 4–5 s after each navigation the host had no grants: roles opened forms they cannot use, pages were ungated | UI `74aa990` (live payload kept across remounts) |
| — | Contract value summed terminated contracts, and their awards twice | UI `9ac9e73` |
| — | Audit trail omitted plans, contracts, documents, invoice readings and vendor submissions | API `0567a73`, UI `4995f5e` |
| — | Posting a journal did nothing on dev **and production**: Traefik's CORS middleware omitted PATCH | UI `bb21fd2` (both compose files) |

**Handed off, not fixed here:** the same listener leak in other client-design runtimes; the vendor portal's
`Unexpected token '<'` page error (`/_vercel/insights/script.js` redirected to HTML) and its token-decoding
bug.

**Two dev personas cannot sign in:** `perf.sysadmin` and `payroll.cfo` reject the shared test password (changed
on dev outside the seeds). Not reset — other modules' UAT uses them.

**New test:** `scripts/_uat/procurement-v23-sidebar-nav.mjs` opens every page *from the sidebar* and checks each
opener against the role's grants read from the API. The other suites all use `page.goto`, which is why D1 and
the grants race were invisible to them.

**D3 — the local dev server is unreliable after runtime rebuilds.** The 1.1 MB runtime recompiles slowly
and pages can fail to load for minutes. Verify on dev (a production build), not with local timeouts.

---

## 3. Rules — read before doing anything

1. **No synthetic or UAT data on production, and never run the write suites against prod.** They create
   requisitions, vendors, orders, invoices and payments. Production verification is read-only.
2. **No test email to real people.** On dev, turn the mail guard ON before any write test and OFF after:
   `python scripts/procurement-ops/dev_mail_guard.py on | off | status`.
3. **One VPS build at a time.** Dev and prod share a 32 GB box with LMS; parallel builds OOM-killed a
   neighbouring service. Never run two deploys at once. Never touch `lms-*` containers.
4. **Deploy committed code only**, from a clean git worktree at a SHA. The deploy scripts refuse dirty worktrees.
5. **Never run `prisma migrate` or `prisma db push` on a server.** Schema changes go through raw-SQL scripts
   (`npm run db:migrate:<name>`). Before promoting, check whether the range adds one — the stock prod API
   deploy script skips migrations.
6. **Never hand-edit the runtime.** Edit the bridge or patch script, run the patch script, confirm `0 missed`,
   then grep the runtime for your new function. On a Windows (CRLF) checkout bridge edits were once silently dropped.
7. **A new V23 page needs every one of:** sidebar entry (patch: `navGroups`) · page map (patch: `pages={...}`) ·
   `__PR23_PAGE_GRANTS` and `__PR23_PAGE_TITLES` (bridge) · **`PR23_PAGE_TO_PATH` and `PR23_NAV_PAGES` in
   `lib/procurement-v23-mock/nav.ts`** · **`app/procurement-v23/<route>/page.tsx`**. Missing the last two bounces
   users to the dashboard — that is D2, and it happened to Quotation Comparison before.
8. **Dev test runs need three environment variables**, or the login token is minted against the *local*
   database and every request 401s into `/login`: `API`, `STAFF_BASE` and **`NEXT_PUBLIC_API_BASE_URL`** (§5).
9. **Where a test starts matters.** Open pages from somewhere other than the dashboard — starting on the
   dashboard hides routing bugs.
10. **The LLM key is settled.** The committed DeepSeek default in `src/config/llmGlobals.ts` is deliberate,
    the same one the portfolio module uses. Don't add `LLM_*` variables or "fix" it.
11. **Checking container egress:** use `docker exec <container> node -e 'fetch(...)'`, never wget. The images
    carry no CA certificates, so wget reports every host unreachable.
12. **Pushing to `nvccz/master` fires a GitHub Action** ("Deploy to Production") that has failed on every run
    since August and deploys nothing. Expected noise — don't rely on it.
13. **Never print secrets.** SSH credentials come from `scripts/_ssh_creds.py`; the dev persona password is in
    `scripts/_uat/_routes.mjs` (dev test users only).
14. **Merging:** frontend → `dev`; API → `master` and `prod`. Use a scratch worktree and `git merge --no-ff`.
    Never force-push. Never merge in the main working tree — it holds unrelated uncommitted changes and staged
    deletions that must not be swept in.
15. **Legacy is frozen:** `app/procurement/**` and its components.

---

## 4. Environments and people

| | URL / location |
|---|---|
| Dev staff UI | https://dev.matanho.com/procurement-v23 |
| Dev API | https://dev-api.matanho.com/api |
| Prod staff UI | https://nvfnvvcz.my.matanho.com/procurement-v23 (`matanho.nvccz.com` has no DNS) |
| Prod API | https://api.nvccz.online |
| Local | API :3009 · staff :3001 · upload mock :3050 · MySQL :3306 |
| VPS | 31.220.82.129 — dev stack `/var/www/projects/arcus` (`arcus-dev-*`), prod `/var/www/projects/nvccz` (`nvccz-prod-*`) |

Dev pages take 78–130 s to load over the remote link. Use long timeouts, and rerun a "fetch failed" step
before calling it a bug.

**Test personas — dev only, all `@nts.local`**

| Login | Role |
|---|---|
| `proc.mgr` | Procurement Manager |
| `perf.sysadmin` | System Administrator |
| `proc.officer` | Procurement Officer |
| `proc.buyer` | Buyer |
| `proc.requester` | Operations member (requester) |
| `perf.deptmgr` | Operations head (department head) |
| `proc.ap` | Accountant |
| `payroll.finmgr` | Finance Manager |
| `payroll.cfo` | Chief Financial Officer |
| `payroll.intaudit` | Internal Auditor |

---

## 5. Tools

**Ops scripts — `scripts/procurement-ops/`** (uncommitted copies). Their `WORKTREE` constants point at the
previous session's scratchpad `wt-api` / `wt-ui`; point them at your own clean worktrees first.

| Script | Does |
|---|---|
| `dev_mail_guard.py on / off / status` | Blocks outgoing email on dev |
| `dev_p2p_flow.py` | Rebuilds the procure-to-pay dataset on dev — run before the actions suite |
| `deploy_dev_api_committed.py` | Dev API: build → `db:migrate:all` → swap |
| `deploy_dev_staff_committed.py` | Dev staff UI |
| `deploy_prod_api_registers.py` | Prod API with a migration gate — change the migration name for new ones |
| `deploy_prod_staff_only.py` | Prod staff UI only |
| `prod_post_deploy_verify.py` | Read-only production verification |
| `dev_llm_check.py` | Dev LLM / environment check (names only) |

**UAT scripts — `scripts/_uat/`**

| Script | Covers |
|---|---|
| `procurement-v23-actions.mjs` | 17 steps: the procure-to-pay chain through the real UI, checked through the API |
| `procurement-v23-workflows.mjs` | W1–W9 plus N1–N4: reject paths and must-refuse cases |
| `procurement-v23-ai-capture.mjs <pdf>` | AI Invoice Capture, 13 checks |
| `procurement-v23-explore.mjs` | Census: every page × persona, every control |
| `procurement-v23-explore-report.mjs` | Report from the census |
| `procurement-v23-screens.mjs` | Full-page screenshots, all pages × personas |
| `_tmp-v23-ui-inventory.mjs` | Headings, buttons, KPIs, tables per page — used for the screen doc |

**Test invoice:** `scripts/_uat/fixtures/test-invoice.pdf` — text-layer PDF, `INV-SW-4471`, three lines.

**Dev run preamble (PowerShell)**
```powershell
$env:API = "https://dev-api.matanho.com/api"
$env:STAFF_BASE = "https://dev.matanho.com"
$env:NEXT_PUBLIC_API_BASE_URL = "https://dev-api.matanho.com/api"
$env:UAT_LOAD_TIMEOUT_MS = "180000"
$env:UAT_EXTRACT_TIMEOUT_MS = "240000"
```

---

## 6. Test plan — the whole module, demo-ready on dev

Record results in `TEST_FINDINGS.md` as **Cycle seven**. Each phase has an exit criterion; don't move on
until it holds.

### Phase 0 — Preflight
1. `git status` in both repos. Confirm the branch; note the unrelated dirty files and leave them alone.
2. Dev health: `https://dev-api.matanho.com/health` → 200; dev staff page → 200.
3. Confirm dev runs the SHAs in §2 (container image or deploy stamp).
4. `dev_mail_guard.py on`.
5. `dev_p2p_flow.py` to rebuild the dataset.

**Exit:** health 200 · mail guard ON · dataset rebuilt (`procure-to-pay completed through the API`).

### Phase 1 — Fix the open defects
1. Diagnose and fix **D1** (§2). Patch → `0 missed` → typecheck (`npx tsc --noEmit`, filtered to `procurement-v23`).
2. Commit, deploy the staff UI to dev.
3. Run `procurement-v23-ai-capture.mjs` on dev → **13/13**, starting from Invoices.

**Exit:** AI capture 13/13 on dev, including **Capture this invoice** opening the prefilled form on the chosen order.

### Phase 2 — Regression suites on dev
1. `procurement-v23-actions.mjs` → **17/17**
2. `procurement-v23-workflows.mjs` → **15/15**
3. `procurement-v23-ai-capture.mjs` → **13/13**

If steps fail with "no record to act on", rebuild the dataset and rerun them — that is consumed data, not a bug.

**Exit:** 45/45.

### Phase 3 — Every page, every role
1. Add `intake` (AI Invoice Capture) to the page lists in `procurement-v23-explore.mjs` and
   `procurement-v23-screens.mjs` — it isn't there yet.
2. Run the census for all 10 personas on dev, then the report.
3. Run screens for all personas and review them by eye.

For every page × role, check:
- the sidebar shows only what the role's grants allow (compare with `PROCUREMENT_SCREEN_BY_SCREEN.md`)
- the page renders with the right heading and **no page errors**
- the page stays put when opened from another page, and the URL matches
- no fixture or sample data leaks (TechNova, MedEquip, `PO-2026-0584`, "Matanho Holdings Limited", `invoice_aug_001.pdf`)
- every KPI card is a live figure, or "—" with its reason
- every button works (verified through the API), opens a form, or refuses with an honest message — **never a fake success toast**
- empty registers say "No records to show yet"

**Exit:** no page errors, no fixture leaks and no fake-success controls across 10 roles × 19 pages.

### Phase 4 — The demo storyline, end to end
Walk it in the browser as the named persona and log each result.

| # | Persona | Action | Passes when |
|---|---|---|---|
| 1 | `proc.mgr` | Create an annual plan with a line; submit it | Plan SUBMITTED |
| 2 | `payroll.finmgr` | Approve the plan in the Approval Centre | Plan APPROVED; its author is not offered approval |
| 3 | `proc.requester` | Raise a requisition, save a draft, submit | PENDING_APPROVAL, sent to their own department head |
| 4 | `perf.deptmgr` | Return it with a reason; requester corrects and resubmits; head approves | APPROVED |
| 5 | `proc.officer` | Send an RFQ from the approved requisition | RFQ sent to the ticked vendors |
| 6 | vendor portal | Vendors submit quotations through their link | Quotations visible in Quotation Comparison — **not yet verified end to end** |
| 7 | `proc.officer` | Score the bids in Bid Evaluation | Scores stored |
| 8 | `proc.mgr` | Award the winner | Purchase order raised |
| 9 | `proc.officer` | Send the PO | SENT |
| 10 | `proc.officer` | Record the goods received note | RECEIVED |
| 11 | `proc.mgr` | Inspect and accept | APPROVED |
| 12 | `proc.ap` | AI Invoice Capture: upload the PDF, pick the PO, read, check, capture, save | Invoice DRAFT, values match the PDF |
| 13 | `payroll.finmgr` | Approve the invoice | APPROVED |
| 14 | `proc.ap` | Record payment with proof | PAID, journal pending |
| 15 | `proc.ap` | Post the journal in Accounts | Posted |
| 16 | `proc.mgr` | Create a contract from the award and activate it | ACTIVE |
| 17 | `proc.officer` | File a document in the vault, then a new version | v2.0 |
| 18 | `payroll.intaudit` | Open Audit & Compliance | The steps above appear in the trail |
| 19 | `proc.buyer` | Try Create PO | Refused before the form opens |

**Exit:** the whole storyline completes with no workaround, no dead button and no refresh.

### Phase 5 — Demo polish: fix, or record a decision
Found during the screen inventory:
- Approval Centre shows the **"Approval queue" card twice** — the "Group queue" duplicates "My approvals" (open decision from cycle five).
- **Invoices & 3-Way Match** makes you choose a tender first — make sure the demo path picks one, or consider a default.
- **Contract value `$3,409,800`** against 1 active and 3 total contracts on dev — confirm it's real data, not a units error.
- **Tax alerts `18`** across 18 POs — confirm it's meaningful (vendors without tax clearance) and can be explained.
- Reports Vault and Audit & Compliance are mostly "—" — acceptable if explained; consider hiding all-dash cards on demo-critical pages.
- **Not built — these refuse honestly; keep them out of the demo script:** eSignature (New eSignature, Signature queue),
  vendor messaging and inbox, withholding tax, fixed-asset transfers, evaluation committees and declarations,
  report schedules and download logs, budget enforcement, compliance reminder automation (Run reminders).
- **Demo data:** dev records are named "UAT P2P …" and "UAT WF …". For a client demo, seed a clean, realistic
  dataset **on dev — never on prod.**

**Exit:** every item fixed or has a recorded decision, and the demo script avoids unbuilt features.

### Phase 6 — Promote to production (only when dev is fully green)
1. See what actually changed: `git log 09a19ad..HEAD` (API) and `git diff --name-only 2a36e93..HEAD` (UI). Deploy only what changed.
2. If the API range adds any `db:migrate:*`, use the migration-gated script with that migration's name.
3. UI: `deploy_prod_staff_only.py` from a clean worktree at the SHA.
4. Verify read-only: containers healthy, health 200, `/procurement-v23/intake` serves, the page string is in the served chunk, no restarts.
5. Merge: UI → `dev`; API → `master` and `prod` (scratch worktree, `--no-ff`).
6. `dev_mail_guard.py off` when dev work is finished.

**Exit:** production on the demo build, verified read-only, merges pushed, mail guard OFF.

---

## 7. Decisions still owed by the product owner
1. Can an invoice be approved while its three-way match is still AWAITING_RECEIPT — block, require a reason, or allow?
2. Approval Centre "Group queue" duplicates "My approvals" — remove it, or build group routing?
3. Roles with no procurement grants (requester, department head) land on a no-access screen — should they land on their queue instead?
4. **Where does the demo run** — dev (has data) or production (empty)? Production must not get synthetic data.
5. Fix or delete the failing `Deploy to Production` GitHub Action on `nvccz/master`.

---

## 8. Checklist for the next agent
- [ ] Read §3
- [ ] Confirm §2 matches reality
- [ ] Phases 0 → 6 in order, recording each in `TEST_FINDINGS.md` as cycle seven
- [ ] Commit `PROCUREMENT_SCREEN_BY_SCREEN.md` and this file, and merge them into `dev`
- [ ] Mail guard OFF when done
- [ ] Report back: pass counts per phase, defects found and fixed, decisions needed
