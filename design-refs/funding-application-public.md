# Funding application (public Matanho apply)

## Product rule

Applicant-facing funding application must live **outside** Portfolio Management (staff shell), as its own public URL — same role as legacy `/applications/form`.

## FE route

- **URL:** `/funding-application` (no login)
- **Standalone domain:** dedicated Apply portal (`NEXT_PUBLIC_PORTAL=apply`) — see [`funding-application-standalone-domain.md`](./funding-application-standalone-domain.md)
- **UI:** Matanho-style multi-step form (`components/funding-application/`)
- Empty fields by default; draft in `localStorage` (`arcus-funding-application-draft-v1`) with autosave
- Files upload immediately via public API; URLs stored in draft
- Portfolio **Launch applicant portal** opens the apply URL (external when configured)
- `/portfolio-v11/applicant-portal` redirects to apply URL / `/funding-application`
## APIs used (existing BE)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/applications/upload-documents` | Multipart `files` + `documentTypes` JSON; no `applicationId` → temp media URLs |
| `POST` | `/api/applications` | JSON body with `documents: [{ documentType, fileName, fileUrl, fileSize }]` for final submit |

Required document types on submit: `BUSINESS_PLAN`, `PROOF_OF_CONCEPT`, `MARKET_RESEARCH`, `PROJECTED_CASH_FLOWS`.

## FE consumers

- `lib/api/applications-api.ts` → `uploadDocuments`, `createWithDocumentUrls`
- `components/funding-application/funding-application-app.tsx`

## Emails + AI shortlisting

`POST /api/applications` (JSON or multipart) already:

1. Sends **application received** email to the applicant (`EmailNotificationService.sendApplicationReceivedEmail`)
2. Starts **AI shortlisting** (`ApplicationScoringService` → `ChatGPTService` → `LlmChatService` / DeepSeek)

FE `createWithDocumentUrls` uses that same create endpoint — no separate email call needed.

DeepSeek defaults (UAT): `nvccz/src/config/llmGlobals.ts` (`LLM_GLOBAL_DEFAULTS`). Rotate before production.

## Verify

1. Open `/funding-application` logged out — form empty, no CIO chrome.
2. Fill step 1 → Continue → Previous works; Add/Remove use-of-funds on Funding Request.
3. Upload a file → network hit to `upload-documents` → file name shown; refresh page → draft restored including file URL.
4. Declarations checkboxes are normal size and aligned with labels.
5. Complete declarations + 4 required docs → Submit → success screen; draft cleared; applicant receives received email; BE logs shortlisting / DeepSeek score.

## Dev note (media)

Uploads go through BE → remote upload service (`:3050`). If Singapore `:3050` is down locally, run the BE mock:

`npx ts-node --transpile-only scripts/local-upload-mock-server.ts` in `nvccz` (agent should start this when testing uploads).

Local mock uploads rewrite public URLs to `http://127.0.0.1:<PORT>/api/public-media/...` so AI shortlisting can fetch documents on this machine.
