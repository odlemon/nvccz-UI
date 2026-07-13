# Annual Budgeting — manual test flow

**App:** http://localhost:3000  
**API:** `http://31.220.82.129:3009/api`  
**Dev server:** `npm run dev` must be running  

### Accounts you will use

| Role | Email | Password | Use for |
|------|-------|----------|---------|
| Admin / FP&A | `admin@nts.com` | `admin123` | Create cycle, assign owners, submit to FP&A; on **Workflow**: CFO-approve (second approver), lock |
| CFO | `info@niakazi.com` | `password123` | On **Workflow**: FP&A accept, notifications, board pack |

### Model to use

| Field | Value |
|-------|-------|
| Model | **dd** (`cmrgm59xg00i3kt4malx3fx46`) |
| Scenario | **BASE** |
| Version | **Working** |
| Department | **Finance** |

Pick a **new fiscal year** each run (e.g. **2033**, **2034**) so you do not hit `CYCLE_EXISTS`.

---

## How to use this guide

1. Walk **Part 1 → Part 7 in order** for a full happy path.
2. Tick each checkbox as you go.
3. If a step fails, stop and note the exact toast / status / URL — do not skip maker-checker steps.

---

# Part 1 — Login & Access Denied check

**Goal:** Confirm the app loads without flashing “Access denied”.

- [ ] 1. Open http://localhost:3000/login
- [ ] 2. Sign in as **`admin@nts.com` / `admin123`**
- [ ] 3. Go to **Forecasting → Budgeting** (`/forecasting/budget`)
- [ ] 4. Hard-refresh the page (`Ctrl+Shift+R`)
- [ ] 5. **Pass:** you may see a brief spinner / Loading — you must **not** see **Access denied** before the page appears
- [ ] 6. Confirm header shows **Scenario BASE** and **Version Working** (wait a second if they show “—”)

---

# Part 2 — Create & open a cycle (Admin)

**Goal:** New cycle reaches **Open for input** with a Finance owner.

- [ ] 1. On Budgeting, click **New budget cycle**
- [ ] 2. **Step 1 — Type & model**
  - Planning type: **Annual budget**
  - Source model: **dd (BUDGET)**
  - Cycle name: e.g. `Manual Test 2033`
  - Financial year: **2033** (or any free FY)
  - Click **Next**
- [ ] 3. **Step 2 — Horizon** (must match model period)
  - Planning start: `2026-01-01`
  - Planning end: `2026-12-01`
  - Actuals cut-off: `2025-12-31`
  - Forecast start: `2026-01-01`
  - Submission deadline: optional (e.g. `2026-11-15`)
  - Click **Next**
- [ ] 4. **Step 3 — Departments & owners**
  - Department: **Finance**
  - Budget owner: pick a user (any active user is fine for this pass)
  - Optionally set **owner due date** / **baseline method**
  - Click **Add owner**
  - Keep needed planning areas (Revenue / Payroll at minimum)
  - Click **Next**
- [ ] 5. **Step 4 — Baseline & workflow**
  - Base scenario / version: BASE / Working
  - Optionally keep Load actuals / Load baseline checked
  - Optionally pick a workflow template
  - Click **Next**
- [ ] 6. **Step 5 — Validate & open**
  - Review summary
  - Click **Validate & open cycle**

### Expect

| Check | Pass when |
|-------|-----------|
| Open | Status = **Open for input** |
| Detail panel | Shows progress, planning areas, department register |
| Register labels | Shows **Finance · REVENUE** (not a raw id like `cmh3bbvoh…`) |
| Owner assignment notif | Assigned owner gets **Budget owner assignment** in the bell |

---

# Part 3 — Owner worksheet & submit (Admin as owner, or owner user)

**Goal:** Edit INPUT cells, then submit the department task.

- [ ] 1. On the open cycle detail, click **Open my workspace** (or the worksheet deep link)
- [ ] 2. Confirm URL contains `cycleId`, and preferably `taskId` / `departmentId` / `versionId` / `scenarioId`
- [ ] 3. Edit an **INPUT** cell → blur/Enter → value saves
- [ ] 4. (Optional) Open **Bulk** → Fill right / Spread → cells update
- [ ] 5. (Optional) Open a cell → **View Formula Trace** / cell detail
- [ ] 6. Fill enough mandatory INPUT areas so submit gates clear
- [ ] 7. Click **Submit** (worksheet) or **Submit my budget** (budgeting panel)

### Expect

| Check | Pass when |
|-------|-----------|
| Edit | INPUT saves; toast on success |
| Gates | Submit stays blocked until unmet list is empty |
| Submit | Task status → **SUBMITTED** |

---

# Part 4 — Submit to FP&A (Admin)

**Goal:** Move cycle to **Pending FP&A review**, then hand off to Workflow.

- [ ] 1. Back on **Budgeting**, select the same cycle
- [ ] 2. Run **Validate completeness** if shown (must pass)
- [ ] 3. Click **Submit to FP&A**
- [ ] 4. **Pass:** status = **Pending FP&A review**
- [ ] 5. Detail panel shows **Open in Workflow & Approvals** (not Accept / Approve / Lock on Budgeting)
- [ ] 6. Open the notification bell as Admin or CFO — expect **Budget submitted for review** and/or **Budget task submitted**
- [ ] 7. Click a **review** budget notification (submitted / pending CFO / task submitted / returned / approved / locked)
- [ ] 8. **Pass:** you land on `/forecasting/workflow?cycleId=…` (optionally `&taskId=…`) — **not** Performance tasks, not a 404
- [ ] 9. Owner-assign notifications still open `/forecasting/budget?cycleId=…`

---

# Part 5 — Maker-checker: CFO accept, Admin approve, lock (on Workflow)

**Goal:** Complete review on **Workflow & Approvals** without self-approving.

> Same user cannot accept/approve their own step. Use **two accounts**.

### 5A — CFO accepts (login as CFO)

- [ ] 1. Sign out Admin
- [ ] 2. Sign in as **`info@niakazi.com` / `password123`**
- [ ] 3. Open notification bell → click **Budget submitted for review** (or go to **Forecasting → Workflow**, pick the cycle)
- [ ] 4. Hard-refresh once — confirm **no Access denied flash**
- [ ] 5. On Workflow, confirm cycle header + stage stepper show **FP&A Review** (or equivalent)
- [ ] 6. Click **Accept for CFO** (cycle action bar)
- [ ] 7. **Pass:** status = **Pending CFO review**
- [ ] 8. Try **Approve budget** as the same CFO who just accepted  
  - **Pass:** blocked with **MAKER_CHECKER** / cannot approve own submission

### 5B — Admin approves & locks

- [ ] 9. Sign out CFO → sign in as **`admin@nts.com` / `admin123`**
- [ ] 10. Open **Workflow** for the same `cycleId` (notification or Budgeting → **Open in Workflow & Approvals**)
- [ ] 11. Click **Approve budget**
- [ ] 12. **Pass:** status = **Approved**
- [ ] 13. Click **Lock**
- [ ] 14. **Pass:** status = **Locked**

---

# Part 6 — Board pack (modal download, from Workflow)

**Goal:** Board pack opens in a modal and downloads — no 404 page.

- [ ] 1. Still as Admin (or switch to CFO), on **Workflow** for the **Locked** cycle
- [ ] 2. If needed, click **Generate board pack** first
- [ ] 3. Click **Open board pack**
- [ ] 4. **Pass:** a **modal** opens (“Board pack” / Downloading…) — URL stays on `/forecasting/workflow…`
- [ ] 5. **Pass:** download starts (JSON pack from current API) — you do **not** land on `localhost:3000/api/v1/fpa/exports/…` 404
- [ ] 6. As CFO, confirm **Board pack ready** notification exists; clicking it opens Workflow for the locked cycle

---

# Part 7 — Worksheet export (modal)

**Goal:** Export uses a modal, not a dead page.

- [ ] 1. Open any model worksheet (`Forecasting → Models → dd → worksheet`, or from a cycle workspace link)
- [ ] 2. Click **Export**
- [ ] 3. **Pass:** export modal appears and download starts (or “queued” if not ready yet)
- [ ] 4. **Fail if:** browser navigates to a Next.js 404 under `/api/v1/fpa/exports/...`

---

# Quick checklist (tick when the full run is done)

- [ ] No Access Denied flash on Forecasting / Budgeting load
- [ ] Create → validate → open works
- [ ] Department register shows **names**, not database ids
- [ ] Owner worksheet edit + submit works
- [ ] Submit to FP&A works; Budgeting offers **Open in Workflow & Approvals**
- [ ] Review budget notifications deep-link to `/forecasting/workflow?cycleId=…`
- [ ] Owner-assign notifications still deep-link to `/forecasting/budget?cycleId=…`
- [ ] CFO accept works on Workflow; self-approve blocked (maker-checker)
- [ ] Second user can approve → lock on Workflow
- [ ] Open board pack from Workflow = modal download (no 404)
- [ ] Worksheet Export = modal download (no 404)

---

# Known gotchas

1. **Horizon must fit the model** — end date after model period → `HORIZON_AFTER_MODEL`. Use `2026-12-01` for model `dd`.
2. **One active cycle per FY** — `CYCLE_EXISTS` → pick a free fiscal year.
3. **Maker-checker** — the user who `submit-fpa` / `fpa-accept` cannot do the next approval alone. Always use Admin + CFO.
4. **Board pack / export API** currently returns a **JSON** cell pack (not Excel). Modal download is correct; do not expect `.xlsx` until backend ships a binary file.
5. **Model `dd` grid is mostly INPUT** — CALCULATED-not-editable is hard to prove on this model.

---

# Routes cheat sheet

| Screen | Path |
|--------|------|
| Login | `/login` |
| Budgeting | `/forecasting/budget` |
| Budgeting + cycle | `/forecasting/budget?cycleId={cycleId}` |
| Workflow & Approvals | `/forecasting/workflow` |
| Workflow + cycle | `/forecasting/workflow?cycleId={cycleId}` |
| Workflow + task drawer | `/forecasting/workflow?cycleId={cycleId}&taskId={taskId}` |
| Models | `/forecasting/models` |
| Model setup | `/forecasting/models/{modelId}/setup` |
| Owner worksheet | `/forecasting/models/{modelId}/worksheet?cycleId=…&taskId=…&departmentId=…&versionId=…&scenarioId=…` |

---

# Related docs

- Gaps: [fpa-budgeting-backend-gaps.md](./fpa-budgeting-backend-gaps.md)
- Workflow approvals gaps: [fpa-workflow-approvals-backend-gaps.md](./fpa-workflow-approvals-backend-gaps.md)
- Owner workspace API: [fpa-budgeting-owner-workspace-api.md](./fpa-budgeting-owner-workspace-api.md)
- Prior SRD results: [fpa-budgeting-srd-acceptance-results.md](./fpa-budgeting-srd-acceptance-results.md)
