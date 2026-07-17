# Fundraising — FE digest (from SRD v1.0)

**Source of truth (full SRD):** [`fundraising-srd.md`](./fundraising-srd.md)  
**Stages (per tab):** [`fundraising-stages-index.md`](./fundraising-stages-index.md) · [`fundraising-handoff.md`](./fundraising-handoff.md)  
**API contract:** [`fundraising-frontend-api.md`](./fundraising-frontend-api.md) · [`fundraising-srd-fe-handoff.md`](./fundraising-srd-fe-handoff.md)  
**BE gaps:** [`fundraising-backend-asks.md`](./fundraising-backend-asks.md)  
**UI:** `app/fundraising/*`, `components/fundraising/*` — wire live via `lib/api/fundraising-api.ts`  
**Playbook:** [`arcus-feature-delivery-playbook.md`](./arcus-feature-delivery-playbook.md)

This file is the FE-facing distillation. Do not invent product rules beyond the SRD. Per-tab stage flows live under the stages index; BE asks are written when implementing a tab.

---

## What this product is

Institutional fundraising + IR + mandate origination for **Asset Management**, **PE**, and **VC** — not a generic CRM.

Every opportunity must attach to **Fund / Product / Mandate + Campaign** and move through commercial, legal, compliance, and onboarding controls.

---

## Non-negotiable guardrails (FE must never fake these)

| Rule | Implication for UI |
|------|-------------------|
| Amount types are independent | Indicative / Qualified / Soft Circle / Proposed / Signed / Admitted / Funded / Expected AUM / Activated AUM never overwrite each other; edits append history |
| Signed ≠ won / ≠ cash | Signed commitment ≠ funded ≠ cash received |
| Awarded ≠ activated AUM | Mandate activation needs full checklist (agreement, KYC, config, assets) |
| Stage moves are server-authoritative | Kanban drag is optimistic UI only after BE validation; show missing-requirements checklist on failure |
| Investor org is unique | Single master 360° record; no duplicates; children hang off it |
| Internal notes stay internal | Never expose on investor portal / external surfaces |
| History is immutable | Amount + stage changes keep old/new/user/timestamp/reason |
| Compliance blocks hard gates | May discuss commercially; cannot Admit / Fund / Activate Assets while blocked |
| Scenario forecasts ≠ live ops | Downside/Base/Upside must not mutate live opportunities |
| Signature binds to document version | New version invalidates pending sigs; archive prior signed versions |

---

## Three models (shared BE, adaptive UI labels)

| Model | UI language bias | Activation / capital end-state |
|-------|------------------|--------------------------------|
| Asset Management | Mandates, Products, AUM, Fees | Mandate Active after agreement + KYC + portfolio/fees/reporting/custodian + assets received |
| Private Equity | Funds, LPs, Commitments, Closings | Indicative → … → Signed → Admitted → Funded; multi-close events |
| Venture Capital | Funds, Investors, Commitments, Capital | Same legal/compliance as PE; higher volume / smaller tickets |

---

## Opportunity formula

`Investor + Campaign + Fund/Product + Relationship Owner = Opportunity`

---

## Campaign activation gates

Cannot go live until: product exists, targets approved, documents uploaded, pipeline configured, team assigned, compliance approval completed. No bypass of approvals.

---

## SRD navigation vs current FE shell

SRD lists Meetings and Tasks separately; Closings separately from Commitments; Forecasts and Analytics separately.

| SRD nav item | Current FE route / note |
|--------------|-------------------------|
| Dashboard | `/fundraising` |
| Campaigns | `/fundraising/campaigns` |
| Investor Organisations | `/fundraising/investors` |
| Contacts | `/fundraising/contacts` |
| Pipeline | `/fundraising/pipeline` (overview + board) |
| Mandates & RFPs | `/fundraising/mandates` |
| Due Diligence | `/fundraising/due-diligence` |
| Data Rooms | `/fundraising/data-rooms` |
| Communications | `/fundraising/communications` |
| Meetings | Combined: `/fundraising/meetings` (Meetings + Tasks tabs) |
| Tasks | ↑ same |
| Documents | `/fundraising/documents` |
| Agreements | `/fundraising/agreements` |
| Commitments | Combined: `/fundraising/commitments` (Commitments & Closings) |
| Closings | ↑ same |
| Client Onboarding | `/fundraising/onboarding` |
| Placement Agents | `/fundraising/placement-agents` |
| Forecasts | Combined: `/fundraising/forecasts` |
| Analytics | ↑ same (or fold into reports — confirm in stages) |
| Reports | `/fundraising/reports` |
| Approvals | `/fundraising/approvals` |
| Audit Logs | `/fundraising/audit` |
| Settings | `/fundraising/settings` |

---

## Major UI workspaces called out by SRD

1. Executive Dashboard (KPIs, charts, activity, upcoming actions)  
2. Pipeline Kanban (server-validated DnD)  
3. Investor Directory + 360 / right drawer tabs  
4. Campaigns & Communications Hub  
5. Commitments & Closings (register + closing timeline + readiness)  
6. Due Diligence workspace (categories + matrix + Q&A drawer)  
7. Data Rooms (secure access, watermarks, monitoring)  
8. Mandates & RFPs (AM pipeline + checklists)  
9. Forecasting / Analytics / Reports  
10. Agreements & e-sign, KYC, Approvals, Audit, Settings  

---

## FE-critical formulas (display only until BE owns them)

- Base value = amount × approved FX  
- Gross pipeline = sum qualified open  
- Weighted = base × stage probability × confidence  
- Commitment progress = (signed or admitted) / target  
- AM progress = activated AUM / target AUM  
- Coverage = weighted open / remaining target  
- Expected fees = expected AUM × fee bps / 10000 × probability  

---

## Roles (SRD) vs current FE packs

SRD: Head of Fundraising, IR Officer, BD, Managing Partner, Compliance, Legal, Finance, Placement Agent, Investor Portal User.  
Current FE maps via `lib/config/fundraising-permissions.ts` onto Arcus RoleCodes (CEO/CFO/FUND_MGR/…, MKT_MGR, FIN_OFF, BOARD_*, etc.). Object-level + campaign/investor/fund/product scopes are **SRD requirements** — not fully modeled in FE yet.

---

## Next (when user directs)

1. Open [`fundraising-stages-index.md`](./fundraising-stages-index.md) and pick a tab (recommended build order starts at Settings → Campaigns).  
2. Audit that tab’s Stage N against the shell + this digest.  
3. Implement FE slice / write `fundraising-<tab>-backend-asks.md` for blockers.  
4. User test → feedback → next stage / next tab.  

Do not replace mocks with fake “live” numbers. Prefer empty/honest states until APIs exist.
