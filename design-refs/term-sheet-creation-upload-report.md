# Term sheet creation wizard, document upload, local media server

**Date:** 2026-08-28  
**Scope:** Portfolio V11 live term sheet create flow + local upload for dev

---

## Summary

| Item | Root cause / finding | Fix applied | Evidence |
|------|----------------------|-------------|----------|
| **Ownership tab** | Create term sheet used a single-page modal; wizard rail existed for Add Deal only — `wizard-step` / `wizard-next` only called `renderAddDealWizard()` when `state.modalWizard` was set, and create-term-sheet never set it | Added `showCreateTermSheetModal` + `renderCreateTermSheetWizard` with rail **Terms → Ownership → Review**; generalized `captureModalWizardDraft` / `renderModalWizard` | Wizard step 1 shows equity % + pre-money; values persist in `modalWizard.draft` across tab clicks (grep: `renderCreateTermSheetWizard`, `captureModalWizardDraft`) |
| **Review tab** | No review step; summary and document upload missing | Step 2 renders live summary from draft + required PDF input; submit validates file | Review step lists title, amounts, terms; `submit-create-term-sheet` requires `document` file |
| **Document upload** | FE `api-create-term-sheet` did not pass `document` to `termSheetApi.create`; BE already accepts `POST /term-sheets/:applicationId` multipart `document` | `actions.ts` passes `files.document`; BE `formatTermSheetResponse` now returns `documentUrl`, `documentFileName`, `documentSize`, `keyTerms`, `conditions`, `timeline`; live term tab shows preview/download | **curl E2E:** `POST /api/term-sheets/cmtbohutt0005un809rmrijzb` with PDF → `documentUrl` set, `GET /api/public-media/term-sheets/...` returns `%PDF-1.4` (45 bytes, matches upload) |
| **Local media server** | Contabo upload host unreachable; project already uses upload microservice (`REMOTE_UPLOAD_SERVICE_URL` + `REMOTE_MEDIA_INTERNAL_BASE`), not MinIO | Started `npm run upload:mock:local` in `nvccz` (port **3050**); set `REMOTE_UPLOAD_SERVICE_URL` / `REMOTE_MEDIA_INTERNAL_BASE` in `nvccz/.env`; FE `npm run dev:upload` delegates to backend script | Upload health on `:3050`; file on disk under `nvccz/storage/local-upload-mock/term-sheets/`; **no** `127.0.0.1:3050` or Contabo IP in application code (env only) |

---

## FE files

- `components/portfolio-v11-mock/matanho-portfolio-runtime.js` — wizard UI, tab handlers, live term document block
- `lib/portfolio-v11/actions.ts` — `termSheetApi.create` with PDF + validation
- `components/portfolio-v11-mock/portfolio-v11-app.tsx` — navigate to Term tab after create
- `package.json` — `dev:upload` script

## BE files

- `src/controllers/TermSheetController.ts` — response includes document + text fields
- `nvccz/.env` — `REMOTE_UPLOAD_SERVICE_URL=http://127.0.0.1:3050/upload`, `REMOTE_MEDIA_INTERNAL_BASE=http://127.0.0.1:3050/uploads`

---

## Local dev

```bash
# Terminal 1 — upload service
cd nvccz && npm run upload:mock:local

# Terminal 2 — API (reads REMOTE_* from .env)
cd nvccz && npm run dev

# Terminal 3 — staff FE
cd nvccz-new && npm run dev
```

Production switch: set `REMOTE_UPLOAD_SERVICE_URL` and `REMOTE_MEDIA_INTERNAL_BASE` to Contabo/production upload host — **no code changes**.

---

## Verify in UI

**Do not use the NTS deal (`cmtbohutt0005un809rmrijzb`) for agent/API smoke tests** — use other applications (e.g. `investee.test@arcus.co.zw` / Arcus Demo Investee Co, or a fresh screening application).

1. Open a deal in **Term Sheet** stage (not NTS unless explicitly requested).
2. **Create term sheet** → rail tabs **Terms / Ownership / Review**.
3. Complete all steps, upload PDF on Review, **Create term sheet**.
4. Term tab shows summary + **Preview / Download** on document card.

---

## Blockers

- None for local upload. `documentUrl` in API responses uses `BASE_URL` public-media proxy (`dev-api.arcus.co.zw` in current `.env`); downloads work via local `http://127.0.0.1:3009/api/public-media/...` when API is local.
