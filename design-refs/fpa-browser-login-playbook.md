# How to log in and drive the product (browser / agent playbook)

Use this when an agent must **interact with the real running app** the way we did during FP&A Model Planning work — not only read code.

---

## 0. Prerequisites (do these first)

### Dev server

From repo root:

```powershell
cd C:\Users\lysp\Downloads\nvccz-new
npm run dev
```

Wait until you see something like:

```
▲ Next.js 14.x
- Local: http://localhost:3000
✓ Ready
```

| | |
|--|--|
| **App (browser)** | `http://localhost:3000` |
| **API** | `NEXT_PUBLIC_API_BASE_URL` → usually `http://31.220.82.129:3009/api` |
| **Env file** | `.env.local` on the machine (gitignored) — do not invent a new base URL unless you confirm it |

If port 3000 is busy or the cache is corrupt:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

### API smoke (optional, before UI)

Login API returns a **top-level** `token` (not nested under `data.accessToken`):

```powershell
curl -s -X POST "http://31.220.82.129:3009/api/auth/login" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@nts.com\",\"password\":\"admin123\"}"
```

Expect JSON with `token` + `user`. If this fails, the UI login will fail too.

---

## 1. Accounts we use

| Role | Email | Password | Typical use |
|------|-------|----------|-------------|
| **Admin / FP&A** (primary) | `admin@nts.com` | `admin123` | Almost all Model Planning / Forecasting smoke |
| CFO (budgeting UAT only) | `info@niakazi.com` | `password123` | Workflow approve flows — **not** required for Model Planning |

Admin is enough for Model Planning.

---

## 2. Login in the browser — exact steps

We never deep-linked into Forecasting while logged out and expected magic cookies. Always establish a session first.

### Steps

1. Open **`http://localhost:3000/login`**
   - If you open a protected URL first (e.g. `/forecasting/workforce`), middleware redirects to  
     `/login?from=%2Fforecasting%2Fworkforce` (or similar). That is fine — login still works.

2. On the login form:
   - **Email:** `admin@nts.com`
   - **Password:** `admin123`
   - Submit (main Sign in button)

3. Wait for success toast / redirect. Admin usually lands on **`/`** (home) after login.

4. **Do not treat a blue “Loading…” overlay as permanent** if it lasts &gt; ~10s — that was an old AuthProvider bug (should be fixed). If it still hangs:
   - Hard refresh (`Ctrl+Shift+R`)
   - Clear site cookies for `localhost:3000`
   - Log in again
   - Confirm API login curl still works

### What login actually stores

- Cookie named by `NEXT_PUBLIC_AUTH_TOKEN_KEY` (default **`token`**)
- User cookie (encoded JSON)
- Auth header on API calls: `Authorization: Bearer {token}` via the shared API client

Session must remain for subsequent navigations. If the agent opens a **new** browser context without cookies, log in again.

---

## 3. Navigate to Forecasting / Model Planning (after login)

### Via UI (preferred — matches how humans use the product)

1. After login, use the **left sidebar / module nav**.
2. Open **Forecasting** (module).
3. Sub-items we care about:

| Nav label (approx.) | URL |
|---------------------|-----|
| Home / FP&A home | `/forecasting` |
| **Model Planning** | `/forecasting/models` → often auto-opens latest model worksheet |
| Worksheet | `/forecasting/models/{modelId}/worksheet` |
| Scenario Comparison (in workspace) | same worksheet + `?view=compare` |
| **Scenarios** (standalone) | `/forecasting/scenarios` |
| Revenue / Expenses / Cash / Workforce / etc. | `/forecasting/revenue`, `…/expenses`, … |

### Via direct URL (ok after login)

Examples:

```
http://localhost:3000/forecasting
http://localhost:3000/forecasting/models
http://localhost:3000/forecasting/scenarios
http://localhost:3000/forecasting/models/<MODEL_ID>/worksheet
http://localhost:3000/forecasting/models/<MODEL_ID>/worksheet?view=compare
```

Get `<MODEL_ID>` from:

- UI after opening Model Planning, **or**
- `GET {API}/v1/fpa/models` with the Bearer token

Example sample model ids seen in docs (may change):

- `cmrgagtqn0003kt4m1ykg39vb` (older UAT)
- `cmrgm59xg00i3kt4malx3fx46` (**dd** in budgeting guide)

**Always prefer listing models in the live API** over hardcoding an id.

### Header context after landing on Forecasting

Wait a moment for Redux bootstrap. The Forecasting chrome should settle on something like:

- **Scenario** (e.g. BASE / Base Case) — not stuck forever on “—”
- **Version** (e.g. Working)

If selectors stay “—” forever, API bootstrap failed — check Network tab for `/v1/fpa/models` / `GET /models/{id}`.

---

## 4. What we did on Model Planning (click path)

### Planning tab

1. Go to **Model Planning** → land on worksheet.
2. Confirm grid loads for selected version/scenario.
3. Switch **scenario tabs** / version if present (only real API scenarios — no fake `__demo__` tabs when data exists).
4. Edit a cell if unlocked; save / bulk tools if testing grid.
5. Drivers panel under the grid — edits call `PUT /drivers/{id}` when IDs exist.
6. Refresh (Actions / refresh control) reloads dashboard + drivers + planning-summary.

### Scenario Comparison mode

1. On the worksheet, open **Compare** (Actions / Compare toggle) → URL gains `?view=compare`.
2. Multi-select scenarios in the header.
3. Metric table should call `POST /v1/fpa/scenarios/{anchor}/compare`.
4. Assumptions editor saves via drivers bulk/PUT then re-compares.
5. Waterfall / sensitivity: **only if backend returns them**; otherwise empty text — **do not invent demo numbers**.

### Standalone Scenarios page

1. Navigate to `/forecasting/scenarios` (or header “Scenarios” link).
2. Model/version come from global FP&A selection (bootstrap after login).
3. Select scenarios → matrix from compare API.
4. **New Scenario** / **Duplicate** / **Promote** hit create / copy / promote endpoints (not local-only state).

---

## 5. Agent browser interaction rules (why others fail)

Agents often fail because they skip session or race the UI. Follow this order:

1. **Confirm `npm run dev` is Ready** on `:3000`.
2. **Open `/login`**, type credentials, submit.
3. **Wait for redirect off `/login`** (URL is no longer `/login`).
4. **Then** navigate to Forecasting routes.
5. After each navigation, **wait for network idle or visible content** (grid, cards, “Loading scenarios…” gone) before clicking again.
6. If redirected back to `/login` → session lost → log in again.
7. Prefer **clicking nav labels** over guessing URLs when unsure.
8. Hard refresh if you see webpack/500 / missing chunk errors after a long-running `npm run dev`.

### Do **not**

- Expect protected pages to work without the login cookie.
- Use production Vercel URLs unless env is pointed there.
- Treat toast “demo” / empty waterfall as an FE bug if Network shows compare 404 / empty payload — that is often **BE still thin** (see requirements MD).
- Reintroduce hardcoded SRD scenario names as live data.

---

## 6. Network checks while browsing

In DevTools → Network (filter `fpa` or `auth`):

| When | Expect |
|------|--------|
| Login submit | `POST …/auth/login` → 200, body has `token` |
| First Forecasting load | `GET …/v1/fpa/models`, then `GET …/models/{id}` |
| Worksheet | `GET …/models/{id}/grid?versionId=&scenarioId=` |
| Compare mode | `POST …/scenarios/{id}/compare` |
| Scenarios page actions | `POST …/scenarios`, `…/copy`, `…/promote` |
| KPI strip (new) | `GET …/models/{id}/planning-summary?versionId=&scenarioId=` (may 404 until BE ships) |

Auth header: `Authorization: Bearer <token>`.

---

## 7. Logout / switch user

1. Use the app’s account menu → Sign out (clears auth cookies), **or** clear cookies for `localhost:3000`.
2. Open `/login` again.
3. For CFO flows only, use `info@niakazi.com` / `password123`.

---

## 8. Quick copy-paste checklist for an agent

```
1. Ensure npm run dev → http://localhost:3000 Ready
2. Open http://localhost:3000/login
3. Email: admin@nts.com   Password: admin123   → Submit
4. Wait until URL is NOT /login
5. Go to Forecasting → Model Planning (or /forecasting/models)
6. Wait for worksheet / model list to load (scenario + version filled)
7. For compare: open Compare (?view=compare) or /forecasting/scenarios
8. If stuck: hard refresh, clear cookies, re-login, verify API login curl
```

---

## 9. Related docs

| Doc | Purpose |
|-----|---------|
| [fpa-model-planning-handoff.md](./fpa-model-planning-handoff.md) | What was built / where left off |
| [fpa-model-planning-api-requirements.md](./fpa-model-planning-api-requirements.md) | Backend contracts |
| [fpa-budgeting-manual-test-guide.md](./fpa-budgeting-manual-test-guide.md) | Broader budgeting login + role switches |

---

*This is the operational playbook for driving Arcus FP&A in the browser the same way we did during Model Planning work.*
