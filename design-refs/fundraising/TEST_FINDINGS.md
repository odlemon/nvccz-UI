# Fundraising & Investor Relations — Test Findings

Part of the sweep across Payroll/Accounting/Events/Admin Management/Investments/Fundraising/FR-KYC/
Homepage/Street Rates (requested 2026-09-20). 20 screens, a plain (non-vendored-runtime) module with real,
substantial existing backend integration and a real activity/audit history going back to late August 2026 —
clearly an actively-developed, mature module already, not a fresh build.

## Screens covered this pass

Dashboard, Investor Organisations, Commitments & Closings — given the module's size (20 screens) and the
remaining scope of this sweep (Investments ~40 sub-items, Accounting ~22 screens still to go), prioritized
the screens most likely to surface data-integrity issues (dashboard aggregates, the investor directory, and
the commitments/compliance-gated closing flow) over an exhaustive screen-by-screen pass. The other 17
screens were not exercised this round.

## FINDING-FR-001 — Opportunity "Age" always read 0d regardless of real age — fixed

**Severity:** Medium (misleading pipeline-hygiene signal — a stale deal looks fresh). **Status: fixed.**

Dashboard's Open Opportunities table showed "0d" in the Age column for all three real opportunities, despite
one (Goldman Sachs / AgriFund) being genuinely 12 days old per its own `createdAt`
(`2026-09-08T07:13:37Z`, checked live against today 2026-09-20). Root cause:
`lib/fundraising/mappers.ts`'s `ageDays: asNumber(raw.daysInStage ?? raw.ageDays)` — confirmed via a direct
`GET /api/fundraising/opportunities` call that the backend response has **neither** `daysInStage` nor
`ageDays` at all; `asNumber(undefined)` silently resolves to `0`, not a missing-data indicator.

Fixed by falling back to a computed days-since-`updatedAt` when the backend doesn't supply either field —
`updatedAt` is the closest available real signal to "time in current stage" (a stage move should update the
record), following the exact same `Math.max(0, Math.round((Date.now() - new Date(x).getTime()) / 86400000))`
pattern this same file already uses for `daysInDd` a few lines below. This is an honest approximation, not a
precise fix: **the backend has no field tracking when an opportunity actually entered its current stage**,
so "days since last touched" and "days in current stage" aren't strictly the same thing if a note or field
edit happens without a stage change. Flagging the real backend field as a follow-up ask; not fixed further
here.

## FINDING-FR-002 — Investor-level KYC status and commitment-level compliance status disagree — needs clarification, not fixed

**Severity:** Potentially High if this gates real fund admission, but the exact intended relationship
between these two fields isn't clear from the code alone, so this is being surfaced as a question rather
than guessed at. **Status: logged, not fixed.**

Goldman Sachs shows **KYC: Approved** on the Investor Organisations screen, but its own commitment (already
`status: ADMITTED_AT_CLOSE`, `accountingStatus: ADMITTED` — a late-stage, essentially closed deal) shows
**KYC/AML Status: Not Started** on the Commitments & Closings screen. Checked the raw commitment record
directly: `complianceStatus: null` — this is a genuinely separate field on the `FundraisingCommitment`
model from whatever backs the investor org's own KYC field, and it's simply never been set.

Two readings are possible and I don't have enough context to pick one confidently:
1. **Working as designed, badly labelled**: compliance is deliberately tracked per-commitment (re-confirmed
   for each deal, not inherited from a one-time investor-level KYC pass) and this commitment's compliance
   genuinely was never separately signed off — in which case admitting it to close with compliance
   "Not Started" is a real process gap worth its own look, separate from a frontend bug.
2. **A real sync bug**: `complianceStatus` should have been set (e.g., mirrored from the investor's KYC
   approval, or set explicitly during the admission workflow) and something in that write path is missing.

Given a compliance/KYC field is exactly the kind of thing that shouldn't be guessed at, flagging for
whoever owns the Fundraising compliance workflow to clarify which reading is correct before anything gets
changed.

## Also noted, not a bug

- **"Untitled applicant"** on Investor Organisations, KYC "Not Started" — this is the test KYC case created
  earlier in this same sweep pass while verifying the Fundraising KYC persistence fix (an Individual
  applicant with no legal name entered). Expected, not investigated further; no delete endpoint exists to
  clean it up (see the Fundraising KYC findings doc for the same limitation).
- **"Name unavailable"** on one investor row's Owner column (iq investments) — this is an established,
  intentional fallback used consistently across ~10 fundraising components for an unresolved
  person-reference (confirmed by a code comment in `fundraising-audit.tsx` referencing a prior fix for
  exactly this pattern). Traces to that one investor's owner reference genuinely being unset/unresolved on
  the backend — a data-completeness gap on that one record, not a frontend bug; the fallback itself is
  working exactly as intended (showing a clear label instead of a raw UUID or a crash).

## Coverage note

Given this module's size and the sweep's remaining scope, this pass covered 3 of 20 screens in depth. The
module shows clear signs of prior real engineering investment (real audit trail, real commitment lifecycle
gating, real KYC integration just fixed) — a follow-up pass through Campaigns, Pipeline, Mandates & RFPs,
Due Diligence, Data Rooms, Communications, Meetings & Tasks, Documents, Agreements & Signatures, Client
Onboarding, Placement Agents, Forecasts & Analytics, Reports, Approvals, and Audit Logs would be needed for
full coverage.
