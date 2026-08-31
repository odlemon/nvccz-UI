# Portfolio V23 (`/portfolio-v11`) — Backend asks & gaps

Source of truth for FE↔BE gaps while wiring the Matanho Portfolio V23 UI at `/portfolio-v11`.  
**Do not deploy** unless explicitly requested. Local verify: FE `:3001`, BE `:3009`, MySQL tunnel `:3307` → NTS `arcus_dev`.

## Closed in FE (2026-08-25 finish pass)

Primary CTAs when `state.liveData` either call a real API (busy → toast → rehydrate) or are hidden / deep-linked:

| Action | FE emit | Client |
|--------|---------|--------|
| Cash account create | `api-create-cash-account` | `stockPickerCashApi.createClientCashAccount` |
| Reservation create | `api-create-reservation` | `createCashReservation` |
| Statement upload | `api-upload-statement` | `createExternalStatementImport` |
| Company create | `api-create-company` | `portfolioCompaniesApi.adminCreate` |
| Mailer list | `api-create-mailer-list` | `createDistributionList` |
| Report / campaign run | `api-trigger-report-run` | `triggerRun` |
| DD assign | `api-assign-dd-task` | `assignDueDiligenceTask` |
| E-sign envelope | `api-create-envelope` | `createAgreement` + signatory + `sendAgreement` |
| Vault document | `api-upload-document` | `investmentOpsApi.createDocument` |
| Kanban stage | `api-change-deal-stage` | `applicationsApi.changeStage` |
| IC vote | `api-cast-ic-vote` | `boardReviewApi.castVote` |
| Term accept/retain | `api-update-term-sheet` | `termSheetApi.update` |
| Release tranche | `api-release-tranche` | `createDisbursement` (+ optional decision) |
| LP communication | `api-send-lp-communication` | `fundraisingApi.createCommunication` |
| Confirm / manual / reverse match | `api-confirm-match` / `api-manual-match` / `api-reverse-match` | cash match APIs |
| Settings RBAC writes | Deep-link `/admin` | N/A |
| Exception create | Hidden when live | N/A — no create endpoint |

## Remaining true product BE gaps

1. **Reconciliation exception create** — No `POST` create; FE hides CTA when live. Lifecycle on existing exceptions only.
2. **Full mailer bounce / member hub** — Distribution lists exist; member CRUD + bounce metrics still incomplete for a dedicated mailer product.
3. **Dedicated e-sign product** — V23 uses fundraising agreements as the live envelope path. Separate PE envelope hub only if product rejects FR agreements.
4. **LP communication create** — Requires `interactionType` + `occurredAt` (FE sends `EMAIL` + ISO timestamp; `summary` from message). Interaction **log list** / document queue widgets stay honest-empty (no list APIs).
5. **Strict application stage graph** — `POST /applications/:id/change-stage` enforces `validTransitions`; kanban may error with BE message (optimistic UI until rehydrate).

## Phase notes (still true)

| Area | Status |
|------|--------|
| Auth / middleware for `/portfolio-v11` | Done FE |
| Dashboard / funds / LPs / deals reads | Wired |
| Period close controls list | `GET .../cash-periods/:period/controls` (local BE) |
| Statement imports list | `GET .../external-statements/imports` (local BE) |
| Deploy to NTS | Out of scope |

## HTTP verify (login + smoke)

```text
POST /api/auth/login { admin@nts.com / admin123 }
Expect 200 on: GET portfolio/dashboard, funds, applications, clients, users,
  investment-ops/cash-periods/:period/controls, setup/currencies
Safe write smoke (when data allows): POST funds (create), clients (add LP),
  or distribution-list / document create on a known fundId — avoid destructive stage/vote on shared deals without intent.
```

FE files:

- `lib/portfolio-v11/actions.ts`, `bootstrap.ts`, `adapters.ts`, `live-loaders.ts`
- `components/portfolio-v11-mock/portfolio-v11-app.tsx`, `matanho-portfolio-runtime.js`
- `lib/api/{portfolio-companies,applications,fundraising,stock-picker-cash,fund-performance-reporting,investment-ops,board-review,term-sheet,investment-implementation}-api.ts`
- Tracker: `design-refs/portfolio-v23-unfinished-tracker.md`
