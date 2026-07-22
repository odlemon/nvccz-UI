# LP Portal — backend gaps (closed)

**Status:** All 27 FE gaps **DONE** on backend; frontend currently runs on **hardcoded mock data**  
**Last updated:** 2026-07-21  
**REST contract:** [`lp-portal-fe-gaps-api.md`](./lp-portal-fe-gaps-api.md) · `lib/api/lp-portal-api.ts`  
**Realtime:** [`lp-portal-realtime-api.md`](./lp-portal-realtime-api.md) · `lib/lp-portal/realtime.ts`  
**UI requirements:** [`lp-portal-srd-ui-requirements.md`](./lp-portal-srd-ui-requirements.md)

## Data mode (mock vs live)

| Flag | File | Current |
|------|------|---------|
| `LP_PORTAL_USE_MOCK` | `lib/lp-portal/config.ts` | **`true`** (hardcoded) |

- Mock store: `lib/lp-portal/mock-store.ts`
- Mock API (same method surface as live client): `lib/lp-portal/mock-api.ts`
- Socket.IO is **disabled** while mock is on (`lib/lp-portal/realtime.ts`)

To restore live `/api/lp-portal`: set `LP_PORTAL_USE_MOCK = false` in `lib/lp-portal/config.ts`.

**Seed (DEV):** `npm run db:seed:lp-portal-srd`  
**Migration:** `npm run db:migrate:lp-portal-fe-gaps`  
**UAT:** `npm run uat:lp-portal:fe-gaps` · `npm run uat:lp-portal:realtime`

---

## Gap closure summary

| # | Gap | Endpoint(s) | BE | FE |
|---|-----|-------------|----|----|
| 1 | Notice category/kind + fundName | `GET /notices`, `GET /notices/{id}` | DONE | Wired |
| 2 | Request attachments on create | `POST /requests/attachments`, `POST /requests` | DONE | Wired |
| 3 | Request list priority/submitter/attachments | `GET /requests`, `GET /requests/{reference}` | DONE | Wired |
| 4 | Thread participants + reply attachments | `GET /messages/{id}`, reply endpoints | DONE | Wired |
| 5 | In-app notification prefs | `GET/PATCH /settings` | DONE | Wired |
| 6 | Digest, display currency, as-of default | `PATCH /settings/notifications`, `PATCH /settings/display` | DONE | Wired |
| 7 | MFA manage / password | `GET /settings/mfa` → `manageUrls` | DONE | Wired |
| 8 | Colleague MFA + last active | `GET /organisation`, `GET /colleagues` | DONE | Wired |
| 9 | Bank instruction changes | `GET/POST /bank-instructions/changes` | DONE | Wired |
| 10 | Colleague invite role/fund | `POST /colleagues` | DONE | Wired |
| 11 | Notification dropdown feed | `GET /notifications?limit=5` | DONE | Wired |
| 12 | Dashboard open-ended NAV history | `GET /dashboard` → `openEndedHistory.points[]` | DONE | Wired |
| 13 | Dashboard action amount/fundName/label | `GET /dashboard/actions` | DONE | Wired |
| 14 | Capital activity KPI summary | `GET /capital-calls/summary` | DONE | Wired |
| 15 | Benchmark selector + open-ended metrics | `GET /performance`, `GET /performance/benchmarks?benchmarkId=` | DONE | Wired |
| 16 | Performance by fund structure | `GET /performance/by-fund` | DONE | Wired |
| 17 | Dealing fundName on list | `GET /dealing/requests` | DONE | Wired |
| 18 | Dealing shareClass on list | `GET /dealing/requests` | DONE | Wired |
| 19 | Subscriptions history export | `GET /dealing/requests/export?format=csv` | DONE | Wired |
| 20 | Account activity structure | `GET /account-activity` | DONE | Wired |
| 21 | Ledger linked documents | `GET /ledger/{entryId}` → `documents[]` | DONE | Wired |
| 22 | Account activity date range | `GET /account-activity?from=&to=` | DONE | Wired |
| 23 | Document per-category counts | `GET /documents/summary` | DONE | Wired |
| 24 | Document centre KPI strip | `GET /documents/summary` | DONE | Wired |
| 25 | Document file metadata | `GET /documents`, `GET /documents/{id}` | DONE | Wired |
| 26 | Document preview | `GET /documents/{id}/preview` | DONE | Wired |
| 27 | Estimate snapshot TTL on submit | `POST /dealing/subscriptions`, `POST /dealing/redemptions` | DONE | Wired |

---

## Wired screens

| Screen | Hook / API | File |
|--------|------------|------|
| Dashboard | `useLpDashboardBundle`, open-ended history, action fields | `components/lp-portal/screens/lp-portal-dashboard-screen.tsx` |
| Capital activity | `useLpCapitalCalls`, summary KPIs | `components/lp-portal/screens/lp-capital-activity-screen.tsx` |
| Performance | `useLpPerformanceBundle(benchmarkId)`, structure, openEndedMetrics | `components/lp-portal/screens/lp-performance-screen.tsx` |
| Subscriptions & redemptions | `exportDealingRequests`, estimate snapshot validation | `components/lp-portal/screens/lp-subscriptions-redemptions-screen.tsx` |
| Account activity | `useLpAccountActivity(from)`, ledger `documents[]`, structure filter | `components/lp-portal/screens/lp-account-activity-screen.tsx` |
| Document centre | `useLpDocuments` + summary KPIs, preview 415 handling | `components/lp-portal/screens/lp-document-centre-screen.tsx` |
| Notices | `useLpNotices`, kind/fundName, `lp_notice_updated` | `components/lp-portal/screens/lp-notices-screen.tsx` |
| Requests & messages | attachments, participants, socket rooms | `components/lp-portal/screens/lp-requests-messages-screen.tsx` |
| Settings | in-app prefs, display settings, MFA URLs | `components/lp-portal/screens/lp-settings-screen.tsx` |
| Organisation | MFA/lastActive, bank instruction changes | `components/lp-portal/screens/lp-organisation-screen.tsx` |
| Topbar | `GET /notifications?limit=5`, document search | `components/layout/lp-portal-topbar.tsx` |
| Session + realtime | `getSession`, Socket.IO invalidation | `components/lp-portal/lp-portal-context.tsx` |

---

## FE verify checklist

1. Notices list/detail show `category` + `fundName`; acknowledge works; realtime refreshes list.
2. Upload attachment → create request with `attachmentIds` → list shows attachments + priority.
3. Thread detail includes `participants[]`; replies accept `attachmentIds`; socket rooms join on selection.
4. Settings GET/PATCH persist email + in-app toggles, digest, currency, as-of preference; MFA links open.
5. Organisation colleagues show `mfaEnabled`, `lastActiveAt`; bank change create/list works.
6. Topbar notification feed from `GET /notifications`; invalidates on `lp_notification`.
7. Dashboard includes `openEndedHistory.points[]`; actions include `amount`, `fundName`, `label`.
8. Capital summary includes `paidCallCount`, `dueSoonCount`, `upcomingDistributionNotices`.
9. Performance benchmarks accept `benchmarkId`; by-fund rows include `structure`/`operatingModel`.
10. Dealing history shows `fundName`, `shareClass`; export CSV downloads.
11. Account activity rows include `structure`; ledger detail includes `documents[]`; optional from-date filter.
12. Document summary powers KPI strip + category badges; list/detail include file metadata.
13. PDF preview inline; non-PDF returns `415 LP_UNSUPPORTED_MEDIA` toast.
14. Subscription/redemption submit validates estimate snapshot TTL (`409 LP_ESTIMATE_EXPIRED`).

---

## Demo credentials

- `lp.signatory@example.com` / `lp.viewer@example.com` · `Password123!`
