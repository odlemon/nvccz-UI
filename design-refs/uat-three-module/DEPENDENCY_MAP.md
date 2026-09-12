# Dependency map — where root causes actually sit

**Stage 1** · 10 September 2026 · derived from `prisma.<model>` call sites in `nvccz/src/services`

Scope decision in force: **fix the root cause where it lives, flag the blast radius**
(confirmed by the user, 10 Sep). This document exists so a defect surfacing in one of the
three modules is fixed where it originates rather than patched at the surface.

---

## 1. LP Portal is a read projection, not a system of record

`src/services/lpPortal/` touches 17 Prisma models. Ranked by call count:

| Model | LP Portal's use | **Who writes it** |
|---|---|---|
| `lpUserRelation` (16) | **owns** — scoping, `lp_role`, `fund_ids` | LP Portal |
| `lpPortalDocument` (11) | **owns** — vault | LP Portal |
| `user`, `userMfaTotp`, `authMfaPending` (23) | access + MFA | shared with Auth |
| `investmentCommitment` (5) | read | **Fundraising**, CapitalCallService, ClientService, DistributionService, ManagementFeeService, capTable, quarterlyStatements |
| `capitalCallAllocation` (5) | read | **CapitalCallService (Portfolio)**, DistributionService |
| `distributionAllocation` (5) | read | **DistributionService (Portfolio)** |
| `client`, `fund` (9) | read | **ClientService / FundService (Portfolio)** |
| `portfolioCompany` (1) | read | Portfolio (21 services) |

**Consequence for this engagement.** Of the two highest-consequence LP surfaces:

- **Data isolation** is LP Portal's own — `lpUserRelation` is the scoping table and LP
  Portal owns it. A leak here is an LP Portal defect, fixed in LP Portal.
- **Money math** is *not* LP Portal's own. Commitment, called and distributed figures
  originate in Fundraising and in Portfolio's CapitalCallService / DistributionService.
  A capital account that does not reconcile is, by default, an **upstream** defect until
  proven otherwise.

So the diagnostic order for any LP money finding is: reconcile the API payload against
the `capital_call_allocations` / `distribution_allocations` rows first. If the payload
matches the rows, the defect is in Portfolio or Fundraising. Only if the payload
disagrees with its own rows is it LP Portal's.

---

## 2. Payroll writes into Accounting

| Direction | Detail |
|---|---|
| **Payroll → Accounting/GL** | `POST /payroll-runs/:id/payment` → `PayrollService.processPayrollPayment` creates a **cashbook entry and a journal entry**. This is the only "payment" in payroll. |
| **Payroll → file** | `POST /payroll-runs/:id/bank-file` returns a **CSV for a human to upload to a bank**. It transmits nothing. |
| **Payroll ← HR** | Employee records, joiners/leavers, compensation. Same `employees` table; HR Manager holds `employees.manage`. |
| **Payroll ← Vendor** | `GET /payroll/vendors` reads the shared `Vendor` table read-only. Creating and emailing vendors belongs to **Procurement**, which owns the registry. |

**No payment rails exist.** No Stripe, Paystack, Flutterwave, EcoCash or bank API is
wired anywhere in the payroll path. Committing a run posts to the ledger; it cannot move
money. This closes the brief's Open Question 2(c).

A gross-to-net figure that reconciles on the payslip but posts a different amount to the
GL is an **Accounting-side** finding, and in scope to fix under the confirmed rule.

---

## 3. Fundraising feeds LP Portal

Fundraising writes `investmentCommitment` and `client`; LP Portal reads both. The handoff
the brief hypothesises — commitment → LP account — is therefore real, but it is a **data**
handoff through shared models, not an API call between modules. There is no
"provision LP" endpoint invoked by Fundraising; LP access is granted by writing
`lpUserRelation` (LP Portal Admin surface) and sending an invite via
`LpPortalInviteService`.

That seam is the most likely place for the lifecycle to break, because nothing enforces
it: a commitment can exist with no corresponding `lpUserRelation`, and an LP can be
provisioned with no commitment. **Both directions are explicit roadmap items.**

---

## 4. Modules in scope for upstream fixes

| Upstream module | Reached via | Fix here? |
|---|---|---|
| **Accounting / GL** | payroll payment posting | Yes — flagged |
| **HR / employee records** | shared `employees` table | Yes — flagged |
| **Portfolio** — CapitalCallService, DistributionService, FundService, ClientService | LP Portal reads their output | Yes — flagged, **highest blast radius**: 21 services touch `portfolioCompany`, 17 touch `fund` |
| **Procurement** | owns `Vendor` | Read-only from payroll; a defect here is escalated, not fixed — Procurement's current module is `/procurement-v23` and the legacy `/procurement` is frozen |
| **Auth** | `user`, MFA models | Shared with every portal — treat as highest blast radius after Portfolio |

Any change outside the three modules is called out in `TEST_FINDINGS.md` with the
services affected, so the risk is visible rather than buried in a diff.
