# Remaining NTS gaps close-out (ex-SmartStream)



**Exclude:** SmartStream §26–27, §75 and related discovery.



**Include:** all P1 Partial/Gap rows + Phase 2 RPA / MFA·SSO / AI usage admin + P0-5 report builder polish.



| Cluster | Items | Approach | Status |

|---------|-------|----------|--------|

| Reports | §37 builder | Wire `build-report` / preview / create-template to live `__pr23ExportFile` register exports | **Closed** |

| Vendor | §8 country/risk/status/expiry notify | Schema + create/update accept `country`/`riskRating`/`lifecycleStatus`; `POST /compliance-reminders/run` + FE | **Closed** |

| Plan/PR | §10 plan link, §11 branch/BU/budget/numbering, §39 formats | PR columns + settings number formats; create/update accept fields | **Closed** |

| Sourcing | §13 method enum, §14 delivery status, §19 conflict | `procurementMethod`, invite `deliveryStatus` SENT/FAILED, `POST …/conflict-declarations` | **Closed** |

| Ops | §22 service GRN, §24 tolerances, §34 notify rules, §36 page, §38 FX, §40 vocab | GRN `lineType=SERVICE`; settings match % → match services; settings JSON for rules/vocab; FX endpoint; list limit/offset | **Closed** |

| Access | §7 user proc fields, §70 dept probe | User `branch`/`businessUnit`/`costCentre`/`approvalLimitAmount`; `GET …/dept-isolation-probe` | **Closed** |

| Phase2 | §28 RPA ledger, §31 AI usage, §44–45 MFA | `procurement_rpa_jobs`, `procurement_ai_usage`, staff MFA when TOTP enrolled | **Closed** (SSO IdP still Phase 2 / client) |



**Still excluded (by design):** SmartStream I/O (§26–27, §75), full SSO IdP mapping, OOS inventory/payroll/GRNI/bank-as-core.



## Endpoints added



| Method | Path |

|--------|------|

| GET/PUT | `/api/procurement/settings` |

| POST | `/api/procurement/compliance-reminders/run` |

| GET/POST | `/api/procurement/rpa-jobs` |

| GET | `/api/procurement/ai-usage` |

| POST | `/api/procurement/rfqs/:id/conflict-declarations` |

| GET | `/api/procurement/authz/dept-isolation-probe` |

| GET | `/api/procurement/consolidation-fx` |



## FE wires



- `lib/api/procurement-v23-api.ts` — client methods above

- `lib/procurement-v23/actions.ts` — compliance reminders, report builder export, conflict, settings, RPA, AI usage; PR/vendor/RFQ/GRN field pass-through



## Migration



`nvccz/scripts/run-nts-remaining-migration.ts` (idempotent DDL).

