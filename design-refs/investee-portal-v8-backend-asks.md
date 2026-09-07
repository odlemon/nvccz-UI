# Investee Portal V8 — backend asks (document vault + messages)

**Date:** 5 September 2026  
**Module:** Investee Portal V8 (`/investee-portal-v8`)  
**Related plan:** [`portfolio-investee-gap-analysis-and-plan.md`](./portfolio-investee-gap-analysis-and-plan.md) — T3.7, T4.2  
**FE write channel (Phase 3):** `lib/investee-portal-v8/actions.ts` + `matanho:before-action` in host

---

## 1. T3.7 — Applicant document vault API (blocking FE)

### Product rule / why
Founders need a secure document room (upload, list, download, version) for investment, board, and reporting artefacts. Staff can request documents on deals; founders currently have **no** dedicated vault endpoint. Financial-report file upload and application nested `documents` are **not** a general vault.

### Confirmed absent (repo evidence)
- `lib/api/application-portal-api.ts` — no list/upload/download vault methods for a general document room
- Backend applicant routes — no `/applicant/.../documents` (or vault) collection
- Closest existing paths: financial-report file/template uploads; staff `POST /applications/upload-documents`; Investment Ops / Fundraising document rooms (wrong persona)

### Proposed contract (for BE ticket)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/applicant/documents` | List vault docs (folder, name, version, size, updatedAt, access) |
| `POST` | `/applicant/documents` | Multipart upload (`file`, `folder`, `note?`, `accessProfile?`) |
| `GET` | `/applicant/documents/:id` | Metadata |
| `GET` | `/applicant/documents/:id/download` | Signed URL or file stream |
| `DELETE` | `/applicant/documents/:id` | Soft-delete / archive (optional) |

**Example list item:**
```json
{
  "id": "doc_…",
  "name": "Q2 Management Accounts.xlsx",
  "folder": "Financial Reports",
  "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "sizeBytes": 245760,
  "version": "v3",
  "accessProfile": "Investor Reporting",
  "updatedAt": "2026-09-01T12:00:00.000Z"
}
```

**Errors:** `401` unauthenticated · `403` no portfolio company · `404` missing doc · `413` too large · `415` unsupported type

### How to verify with FE
1. Wire `data-action="complete-upload"` / vault list in investee runtime to new client methods (after this API exists).
2. Upload from Document Vault → row appears on `GET /applicant/documents`.
3. Staff document-request round trip (T4.3) can target the same ids.

### FE files that will consume
- `lib/api/application-portal-api.ts` (new methods)
- `lib/investee-portal-v8/actions.ts` (`complete-upload`, vault list hydrate)
- `components/investee-portal-v8-mock/matanho-investee-portal-runtime.js` (data-room page)

**Status:** Backend ask only — **do not invent FE stubs**.

### Live audit note (5 Sep 2026)
Local `arcus_dev` was missing `reporting_notification_logs` and `financial_reports` (KPI/report writes 500/1146). Tables created via SQL scripts under `nvccz/scripts/sql/` + seed REQUEST rows. **Promote these migrations on shared NTS/dev** — local-only repair is not a deploy. Full upload matrix: [`portfolio-investee-upload-audit.md`](./portfolio-investee-upload-audit.md).

---

## 2. T4.2 — Applicant messages API (blocking FE)

### Product rule / why
Investee Messages UI is inert. There is **no** `/applicant/.../messages` route. Staff deal collaboration (`GET/POST /applications/:id/collaboration/messages`) is the closest feed but is deal-scoped and staff-oriented.

### Options for product decision
| Option | Approach |
|--------|----------|
| **A. Reuse deal collaboration** | Expose applicant-safe `GET/POST /applicant/application/collaboration/messages` (or proxy to application id) |
| **B. New investee thread API** | `/applicant/messages` threads + replies with fund-team recipients |
| **C. Drop** | Remove Messages from founder nav |

### Suggested contract if **B**
| Method | Path |
|--------|------|
| `GET` | `/applicant/messages/threads` |
| `POST` | `/applicant/messages/threads` |
| `GET` | `/applicant/messages/threads/:id` |
| `POST` | `/applicant/messages/threads/:id/replies` |

**Errors:** `401` · `403` · `404` · `422` empty body

### How to verify with FE
Send from Messages → thread appears for staff on chosen destination surface.

### FE files that will consume
- `lib/investee-portal-v8/actions.ts` (`send-conversation`, chat form submit)
- Messages page in investee runtime

**Status:** Product decision + backend — FE not wired.

---

## Not in this ask
- Term sheet sign, KPIs, financial reports, profile/company/letterhead — **already have APIs**; FE Phase 3 wired.
- Capital/procurement requests — founder can use `POST /applicant/procurement/requisitions` (T4.1 partial FE); staff queue `GET /procurement/requisitions/investee`.
