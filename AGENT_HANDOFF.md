# Agent Handoff — Portfolio V11 UAT Fixes

## Environment Status (all RUNNING)
- **MySQL**: `127.0.0.1:3306` (arcus_dev) — seed data present
- **Backend API**: `http://127.0.0.1:3009` — healthy (`{"status":"OK","database":"connected"}`)
- **Frontend (Staff Portal)**: `http://localhost:3000` — dev server running
- **Playwright MCP Server**: Configured in `C:\Users\lysp\.config\kilo\kilo.jsonc`, connected via `kilo mcp list`

## Code Fixes Already Applied (do NOT re-apply)

### BUG #2 — Fund Detail page crash (CRITICAL) — FIXED
- **File**: `components/portfolio-v11-mock/matanho-portfolio-runtime.js`
- **Location**: `renderFundDetail()` function, ~line 2224
- **Root cause**: When `liveOnly: true`, `__pv11ClearFixtures()` empties the `funds` array during `beginLiveLoad()`, then `render()` is called with empty `funds`. `funds.find(...) || funds[0]` returns `undefined`, and accessing `fund.id` in `renderFundOverviewTab()` crashes with `TypeError: Cannot read properties of undefined (reading 'id')`.
- **Fix**: Added null guard after `const fund = ...` — shows skeleton loading state when `state.hydrating || !state.liveData`, empty state otherwise.
- **Patch script**: Also added to `scripts/patch-portfolio-v25-empty-guards.mjs` (idempotent, won't double-apply)

### BUG #1 — Strategy field saves wrong value — FIXED
- **Files**: `lib/portfolio-v11/actions.ts:238` and `components/portfolio-v11-mock/matanho-portfolio-runtime.js:4013`
- **Root cause**: `focusIndustries || strategy` priority — if the Focus Industries text field had any value, it overrode the Strategy dropdown selection. Backend only has `focusIndustries` column (no `strategy`), and `adaptFunds` displays `focusIndustries[0]` as "Strategy".
- **Fix**: Changed to `strategy || focusIndustries` — Strategy dropdown value takes priority. Backend receives `focusIndustries: ["<strategy>"]` correctly.
- **Patch script**: Also added to `scripts/patch-portfolio-v25-empty-guards.mjs`

## Remaining UAT To Do (Fund Configuration, Investor Records & Data Import)

### Before the client session
- [x] Create test fund (verified via API — "Strategy Test Fund" created with `focusIndustries: ["Growth Equity"]`)
- [ ] Test fund profile edit (Edit fund modal → save → verify)
- [ ] Inspect supplied data for missing fields, duplicates, inconsistent formats
- [ ] Import master records (if any import tool exists)

### During the client session
- [ ] Train on: Accessing fund profiles (BUG #2 fix must be verified — navigate to fund detail page)
- [ ] Train on: Maintaining fund and entity information
- [ ] Train on: Creating investor records (LP records)
- [ ] Train on: Capturing investment commitments
- [ ] Train on: Uploading and retrieving supporting documents
- [ ] Train on: Correcting records and user permissions

### After the client session
- [ ] Configure investment opportunity pipeline (Deal Flow)
- [ ] Establish pipeline stages, opportunity ownership, screening fields
- [ ] Create illustrative opportunities
- [ ] Test stage changes, filtering, editing, opportunity assignments

## Completion Check
"An investment officer can register an opportunity, assign responsibility and update its stage without technical assistance."

## Credentials (for reference)
- **Staff Portal**: `admin@nts.com` / `admin123` at `http://localhost:3000`
- **Backend API**: `127.0.0.1:3009` — JWT token from `POST /api/auth/login`

## Navigation
1. Login at `http://localhost:3000/login`
2. Click "Switch module" → "Portfolio Management"
3. Portfolio Dashboard loads at `/portfolio`
4. Funds list at `/portfolio/funds`
5. Fund detail: click any fund row in the table
6. Create fund: "Create fund" button on Funds page
7. LPs: `/portfolio/lps` (from sidebar)
8. Deal Flow: `/portfolio/deals` (from sidebar)

## What to verify first
1. Navigate to `/portfolio/funds` → click "Matanho Growth Fund I" → verify fund detail page does NOT crash (BUG #2 fix)
2. Navigate to Funds → "Create fund" → select "Growth Equity" strategy → complete wizard → verify strategy shows "Growth Equity" not "FinTech" (BUG #1 fix)
3. Then proceed through the remaining UAT checklist
