# Portfolio V23 unfinished tracker

Target: `/portfolio-v11` only. Deploy to NTS is out of scope.

Legend: `[ ]` open · `[x]` done · `[N/A]` hidden/deep-linked when live (no API)

## Workstream A — Creates / uploads

- [x] Cash account create → `createClientCashAccount` (`api-create-cash-account`)
- [x] Reservation create → `createCashReservation` (`api-create-reservation`)
- [x] Statement upload → `createExternalStatementImport` (base64 via stage-uploaded-statement)
- [x] Mailer list → `createDistributionList`
- [x] Mailer campaign → `triggerRun` (report run, not fake campaign)
- [x] DD assign task → `assignDueDiligenceTask`
- [x] E-sign envelope → `createAgreement` + signatory + `sendAgreement`
- [x] Document vault upload → `investmentOpsApi.createDocument`
- [x] Report generate/publish → `triggerRun`
- [x] Add company → `portfolioCompaniesApi.adminCreate`

## Workstream B — Deal mutations

- [x] Kanban stage drag → `changeStage` (`api-change-deal-stage`; BE may reject invalid transitions — toast + revert)
- [x] Board/IC vote → `castVote` via confirm-decision → `api-cast-ic-vote`
- [x] Term sheet accept/retain → `termSheetApi.update` via confirm-decision
- [x] Release tranche → `createDisbursement` when implementation id present

## Workstream C — Recon

- [x] Confirm match action name + batch/line ids (`api-confirm-match` / `confirmMatches`)
- [x] Manual / unmatch when ids present (`api-manual-match` / `api-reverse-match`)
- [N/A] Create exception — hide when live (no create API)

## Workstream D — Settings / honesty

- [x] Settings roles → deep-link Admin; disable live writes
- [x] Other settings tabs honest empty when live
- [x] LP communication → `fundraisingApi.createCommunication`
- [x] Central liveBlockedActions / toast for leftover demo CTAs

## Workstream E — Verify

- [x] Pass 1 call-site re-read
- [x] Pass 2 grep api-* → actions → client
- [x] HTTP smoke (see backend-asks)
- [x] Update portfolio-v23-backend-asks.md
