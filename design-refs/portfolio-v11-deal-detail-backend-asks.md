# Portfolio V11 deal detail — backend asks

## Product rule / why

Deal detail hero and Application tab need ownership, pre-money, country and progress. Funding application UI already collects `proposedOwnership` / `preMoneyValuation`, but they are not persisted on `Application`. Country has no dedicated field (only `applicantAddress`). `applicationProgress` is computed on list responses but omitted from `getById`.

Portfolio company + login credentials are created today when **due diligence completes** (`BoardReviewService.createUserAndPortfolioCompany`), not when a term sheet is created. Product asked for credentials at term-sheet create — confirm intended timing.

## Endpoints / fields

### 0. Fast pipeline list (done locally)

- `GET /applications?light=true` — list fields only (fund + analyst + stage flags; no nested docs/DD/term/board bodies or disbursement joins).
- FE Deal Flow: `applicationsApi.getAll({ light: true })`.
- Deal detail: parallel `getById(id, { light: true })` + DD/term/board.

### 1. Persist ownership + pre-money on Application

- **POST/PUT** application create/update (and public funding submit)
- Add columns or JSON extras: `proposedOwnership` (Decimal), `preMoneyValuation` (Decimal)
- Return on `GET /applications/:id` and list

Example:

```json
{
  "proposedOwnership": 15.5,
  "preMoneyValuation": 85000000
}
```

**Partial FE mitigation (done):** funding form now persists extended payload on `applicationFormData` JSON (`proposedOwnership`, `preMoneyValuation`, use-of-funds, declarations, impact/ESG, etc.). Dedicated columns still preferred for querying/filtering.

### 1b. `applicationFormData` JSON (done locally)

- Column: `applications.application_form_data`
- Create accepts `applicationFormData`
- Clarification: `POST /applications/:id/request-clarification` `{ subject, message, recipientEmail? }` → real email via ZeptoMail
- FE report: `design-refs/funding-request-deal-detail-bugfix-report.md`
### 2. Country on Application

- Prefer `country` string (ISO or free text)
- Or document that FE should parse from `applicantAddress`

### 3. Progress on getById

- Include `applicationProgress` on `GET /applications/:id` (same formula as list)

### 4. AI screening narrative

- Prefer a dedicated `aiScreeningSummary` / criteria breakdown JSON
- Today FE uses `screeningRejectionReason`, `initialScreeningScore`, `screeningScore`, `screeningOutcome`

### 5. Term-sheet create vs company credentials

- Confirm: keep company/user creation on DD complete, **or** move/copy to term-sheet create
- FE copy currently states DD-complete behaviour

## FE consumers

- `lib/portfolio-v11/live-loaders.ts` (`hero.ownership`, `hero.preMoney`, email/phone/progress)
- `components/portfolio-v11-mock/matanho-portfolio-runtime.js` deal detail tabs
- `lib/portfolio-v11/actions.ts` — initiate DD, create term sheet, board review, implementation

## How to verify with FE

1. Open Deal Flow → deal detail
2. Application tab shows email/phone from `applicantEmail` / `applicantPhone`
3. Ownership / pre-money show dash until BE stores values or term sheet supplies equity/valuation
4. Due Diligence tab → Start due diligence
5. Term sheet tab → Create term sheet
6. Board → Start board review (upload IM)
7. Disbursement → Initiate implementation (needs portfolioCompanyId after DD complete)
