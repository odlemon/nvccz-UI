# Matanho.com first-party analytics (NTS)

## Already built into the CMS

No Google Analytics required. The site ships anonymous first-party analytics:

| What | Where |
|------|--------|
| Public beacon | `/analytics.js` (injected on public pages) |
| Collect API | `POST /api/analytics/collect` |
| Admin dashboard | https://matanho.com/admin/analytics |
| Overview widgets | https://matanho.com/admin |
| Retention cron | Host crontab → `/api/cron/analytics-retention` daily 03:15 |

Metrics: page views, unique visitors, sessions, top pages, referrers, UTM campaigns, devices/browsers/languages, RUM (LCP/CLS/INP/TTFB), coarse country/region/city.

Privacy: visitor/session IDs are hashed with `ANALYTICS_SALT`; honors GPC/DNT; skips `/admin`.

## NTS notes

- Geo works via proxy headers when present, otherwise a short cached IP→country lookup (`ip-api.com`) so country charts are not empty off Vercel.
- Retention is scheduled on the VPS host (Vercel cron does not run in Docker).

## How to use

1. Complete `/admin/setup` if you have not created an admin yet.
2. Open a few public pages on https://matanho.com
3. Refresh https://matanho.com/admin/analytics (7 / 30 / 90 / 180 day ranges)
