# Test roadmap — LP Portal, Payroll, Fundraising

**Stage 1** · 10 September 2026 · **59 screens** (LP Portal 19 · Fundraising 19 · Payroll 20 + My Pay)

Every item is evaluated against all three dimensions:

- **UAT** — does it behave as a real user of that persona expects?
- **QAT** — no bugs: controls act, data saves, survives refresh, no dead ends or silent no-ops
- **UI/UX** — consistent, responsive at 375 / 768 / 1440, polished, honest loading/empty/error states

## Cycle tiers (weighted scale, confirmed 10 Sep)

| Tier | Re-tested | What qualifies |
|---|---|---|
| **C — Critical** | **5 full cycles** | Money math, approval workflows, data isolation, the two lifecycle runs. Anything where being wrong has consequences outside the screen. |
| **S — Standard** | 3 cycles | Core CRUD and navigation a persona uses every session. |
| **P — Peripheral** | 2 cycles | Settings, exports, cosmetic surfaces. |

A finding at any tier is fixed and its area returns to the **top** of its tier's count.

---

## 0. Cross-cutting — run against all three modules

| # | Area | Tier | UAT | QAT | UI/UX |
|---|---|---|---|---|---|
| X.1 | **Data isolation — LP** | **C** | LP A sees nothing of B/C and vice versa | URL with a swapped id 404s, not 200; exports and downloaded PDFs carry no foreign rows | refusal is a rendered panel, not a blank page |
| X.2 | **Data isolation — intra-org role** | **C** | VIEWER cannot reach dealing, notice acknowledgement or request creation | the *endpoint* refuses, not just a hidden nav item | disabled state explains why |
| X.3 | **Data isolation — fund entitlement** | **C** | B/C reach only their 2 of 7 funds | fund 3-7 ids refused by the API | — |
| X.4 | **Data isolation — employee** | **C** | plain staff sees only own payslips | swapped payslip id refused; PDF is the caller's own | — |
| X.5 | **Permission enforcement** | **C** | each role's restricted areas genuinely blocked | refusal at the API, not the nav — a hidden link is not access control | required permission named on screen |
| X.6 | **Audit trail** | S | every workflow writes an event with the real actor | append-only; no gaps across the lifecycles | permission-gated |
| X.7 | **Notifications / email** | S | each workflow fires the intended message | mail guard intercepts — assert via the log line and the X-Original-To header | — |
| X.8 | **Tab navigation** | **C** | tabs switch content **in place** | no tab navigates to a different route — a documented recurring defect in this codebase (Reviews, Reports, Enterprise Risk Register, Deal Detail) | active state correct |
| X.9 | Loading / empty / error states | S | — | no infinite spinner; retry works | skeleton on load; empty says why; error is actionable |
| X.10 | Responsiveness | S | — | — | no horizontal body scroll at 375; tables scroll in their own container |

---

## 1. LP Portal — 19 screens

| # | Screen / flow | Tier | Focus |
|---|---|---|---|
| L.1 | Invite to first login, with **forced password set** | **C** | invite mail intercepted; link targets the LP portal build, not staff; password change enforced before anything else is reachable |
| L.2 | Dashboard | **C** | commitment / called / unfunded / distributed reconcile to the allocation rows |
| L.3 | Capital account — ledger, capital activity | **C** | every figure ties to its rows; running balance correct |
| L.4 | Capital calls | **C** | amounts, due dates, payment confirmation; visibility rules |
| L.5 | Distributions | **C** | allocation amounts and dates tie to source |
| L.6 | Performance | **C** | IRR / TVPI / DPI; SI window from the investor's real inception; benchmark reads approved rows only |
| L.7 | Dealing, subscriptions and redemptions | **C** | subscribe / redeem / estimate; **SIGNATORY may, VIEWER may not** |
| L.8 | Documents and vault | **C** | download scoping — the highest-risk leak surface; access logged |
| L.9 | Notices | S | issue, view, acknowledge; receipts recorded |
| L.10 | Messages and service requests | S | threads scoped to the LP; reply authority by lp_role |
| L.11 | Investments catch-all route | S | verify it cannot be walked to another LP's data |
| L.12 | Organisation and colleagues | S | shows only same-client colleagues |
| L.13 | Account activity | S | own activity only |
| L.14 | Reports | P | generation and scoping |
| L.15 | Settings | P | notification prefs, MFA enrolment |
| L.16 | Admin side — provisioning, publishing, visibility | **C** | the lpUserRelation write path; revocation actually revokes |

## 2. Payroll — 20 screens

| # | Screen / flow | Tier | Focus |
|---|---|---|---|
| P.1 | **Two consecutive run lifecycles** | **C** | create, inputs, calculate, submit, **reject-and-return**, resubmit, approve, process, publish |
| P.2 | **Maker-checker segregation** | **C** | Payroll Manager submits and **cannot approve its own run**; CFO approves. Requires the Payroll Manager account to exist |
| P.3 | **Gross-to-net** — runs, close | **C** | manual reconciliation each cycle: gross less deductions less tax equals net, and totals tie to entered inputs |
| P.4 | **Tax and statutory** | **C** | brackets and levies applied correctly |
| P.5 | **GL posting** | **C** | cashbook and journal amounts equal the run's net; an upstream Accounting defect if not |
| P.6 | My Pay self-service | **C** | own record only; **backend-issued** PDF, not browser-built |
| P.7 | Employees, joiners and leavers | S | create with user, edit, terminate |
| P.8 | Approvals | **C** | checker-only; refusal visible |
| P.9 | Inputs and validation | S | validation names the failing row; commit refused while errors exist |
| P.10 | Exceptions | S | derived from real blockers; resolution has no store — expect a documented gap |
| P.11 | Leave and training | S | balances, liability derivation |
| P.12 | Calendar, onboarding, vendors | S | newly built backends |
| P.13 | Components (earnings and deductions) | S | **write side unwired**, endpoints exist |
| P.14 | Audit | S | real actors, maker-checker visible in the data |
| P.15 | Vault and reports | P | **no backend store, no generation endpoint** — confirm honest empty, not fake success |
| P.16 | Access and settings | P | role admin lives in Admin by design |
| P.17 | **Suspend / reinstate / terminate** | S | endpoints exist, **no control emits them** — confirm and re-file |

## 3. Fundraising — 19 screens

| # | Screen / flow | Tier | Focus |
|---|---|---|---|
| F.1 | **Pipeline to commitment to approval to closing**, twice | **C** | full lifecycle, both LP org shapes |
| F.2 | **Commitment recording, amendment, withdrawal** | **C** | amounts written to the model LP Portal reads |
| F.3 | **Approval and sign-off** | **C** | only authorised roles decide; events recorded |
| F.4 | **Handoff to LP Portal** | **C** | commitment to LP relation to invite. **Both orphan directions**: commitment with no LP access, LP access with no commitment |
| F.5 | Target vs raised, closings | **C** | totals reconcile to commitment rows |
| F.6 | Investors, contacts, pipeline | S | stage progression; CRUD |
| F.7 | Due diligence (DDQ cases, items, evidence) | S | not in the brief — a real subsystem |
| F.8 | Data rooms | **C** | document access and **access logging**; scoping per investor |
| F.9 | Agreements | S | templates, versions, signatories |
| F.10 | Campaigns and communications | S | materials, distribution lists — mail intercepted |
| F.11 | Onboarding, mandates, meetings | S | — |
| F.12 | Audit | S | append-only; probe records must not pollute |
| F.13 | Reports, forecasts, placement agents | P | — |
| F.14 | Settings, documents | P | — |

---

## Standing rules for every cycle

1. Real browser session against the staff portal and the LP portal build on its own port.
2. **Money math verified by hand** — payroll gross-to-net and LP capital account traced to
   source rows. A number that displays cleanly but does not tie to its source is
   **CRITICAL**, not cosmetic.
3. **Data isolation verified adversarially** — not just "the nav is hidden": swap ids in
   URLs, check exports, check downloaded PDFs.
4. All three viewports on every UI screen.
5. Probe and test records are cleaned up by the scripts that create them.
6. AI grounding checks: **dropped** — no AI surfaces exist in these three modules.
