# Fundraising backend QA issues

**Captured:** 2026-07-16T22:48:50.298Z
**App:** http://localhost:3001
**API:** http://localhost:3002/api
**Login:** admin@nts.com

Network issues against `NEXT_PUBLIC_API_BASE_URL`. **BE** = connection refused, 4xx/5xx (except expected domain codes), missing endpoints, auth failures.

Expected domain codes (not bugs unless blocking): `ACTIVATION_REQUIREMENTS_UNMET`, `STAGE_GATE_FAILED`, `CAMPAIGN_NOT_ACTIVE`, `VALIDATION_ERROR`, `COMPLIANCE_BLOCKED`.

## Summary

| Severity | Count |
|----------|------:|
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 0 |
| **total** | **0** |

_No issues recorded in this pass._
