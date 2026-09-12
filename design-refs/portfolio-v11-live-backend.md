# Portfolio V11 — force live backend (no Matanho fixtures)

**Date:** 2026-08-27  
**Goal:** Authenticated Portfolio V11 never paints Matanho demo data (Nova Analytics, fake data-room folders, etc.). All screens use API payloads or empty live states.

## FE changes

1. **`liveOnly: true`** (default) on `startPortfolioV11Runtime` from `portfolio-v11-app.tsx`.
2. **Pre-paint clear** of fixture collections before first `render()`.
3. **Hydrating gate** — while `liveOnly && hydrating && !liveData`, show skeleton (all pages, not only dashboard).
4. **`isLiveMode()`** — `liveData || liveOnly`; drives `demoOnly` / deal tabs / company deep tabs / fund charts.
5. **Deal Documents** — uses `detail.documents` from API; empty data room when none.
6. **Deal detail hydrate** — `getById` **without** `light` so documents + form data are present (`live-loaders.ts`).
7. **Deal data-room upload** — `api-upload-application-document` → `applicationsApi.uploadDocuments(..., applicationId)`.

## BE residual (not FE fixtures)

| Gap | Status |
|-----|--------|
| Application document columns (owner, uploaded, version, file size) | **Fixed** — `GET /api/applications/:id` returns `uploadedAt`, `fileSize`, `version`, `owner`, `versionHistory`, `reviewers` |
| Data room access / permissions / missing-doc requests | **Fixed** — `dataRoom` on application detail (`accessGroups`, `permissionsSummary`, `documentRequests`) |
| Company deep tabs (performance / board / VC / financials / activity) | Live empty states — needs portfolio-company series APIs |
| Fundraising-grade data room (folders, grants, revoke) | Use fundraising data-room APIs when deal is campaign-linked; application data room is application-scoped |

## Verify

1. Sign in → `/portfolio-v11` → Deal Flow shows seeded deals (NTS / Arcus Demo), not Nova Analytics.
2. Open deal → Documents tab → application PDFs from API (or empty), **not** Certificate of Incorporation / Corporate & Legal demo folders.
3. Hard refresh on Documents tab — no Nova flash.
4. Company detail deep tabs show empty live states, not fake ISO 27001 / board packs.
