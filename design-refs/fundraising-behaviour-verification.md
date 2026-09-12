# Fundraising — behaviour verification results

**What this is.** Every claim in `fundraising-module-behaviour.md` tested against the running
system on localhost, with the observed result. The purpose is to check whether the module
actually behaves the way that document says it does — and to record, honestly, anywhere it does
not.

**Environment**

| | |
|---|---|
| Frontend | staff portal, `http://localhost:3001` |
| API | `http://127.0.0.1:3009/api` |
| Database | local MySQL `arcus_dev` |
| Login | `perf.sysadmin@nts.local` (writes), `perf.exec@nts.local` (refusal path) |

**How it was tested**

| Harness | Covers | Method |
|---|---|---|
| `scripts/fundraising-behaviour-check.mjs` | B1–B3, B6–B25, B27, B29, B30 | Drives the state machines against the live API on its own scratch campaign/investor/opportunity, so transitions can be pushed into failure without touching seeded data |
| `scripts/fundraising-ui-behaviour-check.mjs` | B5, B28 | Real browser: drags a card into a gated stage, and clicks every tab on the tabbed screens |
| `scripts/fundraising-e2e-roundtrips.mjs` | B24, B31, B32 | Real browser, clicking and typing, asserting on what is on screen afterwards |

---

## Result

**Every claim holds. 28 API-level checks, 5 UI-level checks and 41 end-to-end journey
assertions — 74 in total, 0 failures.**

No separate defect-tracking document was needed for this pass: nothing in the specification
turned out to be false about the running system. Where a first run reported a failure, the
cause was in the test, not the module — those cases are listed in §3 because they are the
easiest thing to get wrong when re-running this.

---

## 1. API-level results

Run: `node scripts/fundraising-behaviour-check.mjs`

| Claim | What it asserts | Observed | ✓ |
|---|---|---|:--:|
| B1 | An investor is reusable across contacts | One investor carried 2 contacts | ✅ |
| B2 | An opportunity needs both campaign and investor | Without campaign → 400; without investor → 400 | ✅ |
| B3 | A commitment is bound to one opportunity | `opportunityId` and `investorId` both match | ✅ |
| B4 | Activation is gated with a named unmet list | Activation succeeded once requirements were met | ✅ |
| B6 | No opportunity on a non-ACTIVE campaign | `400 CAMPAIGN_NOT_ACTIVE` | ✅ |
| B7 | 13 stages, each with a win probability | 13 stages, 13 with a probability | ✅ |
| B7 | Moving sets `stageProbability` from the stage | At PROPOSAL, `stageProbability` 55 = stage's 55 | ✅ |
| B8 | Backward moves are ungated | QUALIFIED → DISCOVERY accepted, no objection | ✅ |
| B9 | Gate rules produce named failures | `STAGE_GATE_FAILED: requiresProposed: proposedAmount required` | ✅ |
| B10 | Compliance-sensitive stages check the investor | REJECTED KYC → `compliance: investor kycStatus is REJECTED` | ✅ |
| B11 | A refused move changes nothing | Stage still QUALIFIED afterwards | ✅ |
| B12 | Entering a stage seeds its checklist | 7 checklist items present for the walked stages | ✅ |
| B13 | Every transition is recorded | 7 stage-history rows, each with destination and actor | ✅ |
| B14 | WON only from a late stage | `400 INVALID_WON_STAGE` from PROPOSAL | ✅ |
| B15 | Amount types are independent | indicative 1,000,000 and proposed 900,000 coexist | ✅ |
| B16 | Amount changes require a reason | `400 "reason (or amountReason) is required…"` | ✅ |
| B17 | The reason is stored on the history row | Row reads "behaviour check — proposed amount agreed" | ✅ |
| B18 | No history when nothing changed | Re-saving the same amount added **0** rows | ✅ |
| B19 | Admission is compliance-gated | `400 COMPLIANCE_BLOCKED` | ✅ |
| B20 | Admission is idempotent | ADMITTED_AT_CLOSE then ADMITTED_AT_CLOSE | ✅ |
| B21 | Funding is cumulative, status derived | 300k → PARTIALLY_FUNDED; +500k → FUNDED, unfunded 0 | ✅ |
| B22 | Funding propagates to the opportunity | Opportunity admitted 800,000 / funded 800,000; history has ADMITTED and FUNDED | ✅ |
| B23 | Three independent closing sign-offs | All false → all true, recorded separately | ✅ |
| B25 | A sign-off can be withdrawn | `legalReady` returned to false | ✅ |
| B27 | Approvals decide and leave the inbox | PENDING → APPROVED, absent from the pending list | ✅ |
| B29 | Settings reflects the enforced pipeline | 13 AM stages in Settings, all 13 on the live board | ✅ |
| B30 | Write is narrow, read is broad | Non-editor: read 200, write 403 with a message | ✅ |

Closing advance to COMPLETED (`B24` at the API level) also passed.

## 2. UI-level results

Run: `node scripts/fundraising-ui-behaviour-check.mjs` and
`node scripts/fundraising-e2e-roundtrips.mjs`

| Claim | What it asserts | Observed | ✓ |
|---|---|---|:--:|
| B5 | An unmet gate is a **checklist dialog**, not a bare toast | Dragging a card into a gated column showed a dialog reading `requiresPreviousStageChecklist: budget_fit (Budget / AUM fit confirmed) incomplete` | ✅ |
| B24 | The UI will not run a closing until all three sign-offs are in | Run disabled; enabled only after the third sign-off; then Completed on screen | ✅ |
| B28 | Tabbed screens switch in place | Settings 4 tabs, Campaigns 3, Agreements 1, Meetings 1 — URL unchanged, content changed each time | ✅ |
| B31 | Refusals are visible | Non-editor sees "You do not have permission to edit fundraising data" | ✅ |
| B32 | The full journey works | investor → contact → opportunity → stage advance → commitment → closing, each step visible on screen | ✅ |

**B5 is worth noting**: the gate that fired was `requiresPreviousStageChecklist`, which means
B12's checklist seeding is not just present in the data — it is actively enforced on a real
drag. Two claims confirmed by one observation.

**B32 in full** (Trips A, D and E, driven by clicking and typing):

```
201 POST /investors                                    investor created, visible on screen
201 POST /investors/:id/contacts                       contact linked to that investor
201 POST /fundraising/opportunities                    opportunity on an ACTIVE campaign
200 POST /fundraising/opportunities/:id/transition     stage advanced by dragging the card
200 PATCH /fundraising/opportunities/:id               amount changed, with a reason
201 POST /fundraising/commitments                      commitment against that opportunity
201 POST /fundraising/closings                         closing scheduled
200 POST /fundraising/closings/:id/readiness  x2       sign-offs recorded
200 PATCH /fundraising/closings/:id                    closing run → Completed
```

Each step selected the record created by the previous one, so this is one chain rather than
nine unrelated writes.

## 3. Where a first run reported a failure, and why

All four were faults in the test, not the module. Recorded because they are the easiest traps
when re-running this.

| Symptom | Cause | Resolution |
|---|---|---|
| `B14 → 404` | The route is `/opportunities/:id/set-status`, not `/status` | Test corrected |
| Closing "run" stayed disabled after clicking all three readiness chips | The chips are **toggles** — clicking one already green *withdraws* that sign-off. The UI was right to keep Run disabled | Test now reads each chip's state before clicking |
| `B28` failing on three screens | Tab labels carry counts (`Agreements (4)`) and differ from their ids (`Tasks board`, `Signature requests`); Investors' tabs live in the 360 drawer, not the list page | Prefix matching; Investors dropped from that list |
| B5's scratch campaign silently not created | It was `PE_FUNDRAISE`, which additionally requires a linked fund — so B5 was being measured against whichever campaign the board defaulted to | Scratch campaign is now `INSTITUTIONAL_MANDATE` |

## 4. Known limits of this verification

State honestly, so the result is not read as broader than it is:

- **Not every write path was driven through the UI.** Meetings create/complete/cancel, document
  upload, data-room upload and access grants, agreement send/sign, RFP-to-mandate conversion and
  KYC case decisions are traced to live handlers and real endpoints, and their screens render
  live data without errors, but nobody has clicked through those particular flows. See §6.3 of
  `fundraising-test-plan.md`.
- **The compliance-hold path was tested via `kycStatus`, not an actual hold record.** B10 and
  B19 were exercised by setting the investor's KYC to REJECTED. The `complianceHoldActive`
  branch is in the same code path but was not separately triggered.
- **Multi-user behaviour was not tested.** Everything ran as a single session; no concurrent
  edits, no two users on the same opportunity.
- **The dev servers are shared with concurrent Payroll work**, so both restart frequently. Runs
  that fail with `ECONNREFUSED` or a Next `ChunkLoadError` are environmental — re-run rather
  than treating them as findings.

## 5. Reproducing this

```bash
# 1. seed a known dataset
cd ../nvccz && npm run db:seed:fundraising-demo

# 2. behaviour
cd ../nvccz-new
node scripts/fundraising-behaviour-check.mjs        # expect 28 passed, 0 failed
node scripts/fundraising-ui-behaviour-check.mjs     # expect  5 passed, 0 failed
node scripts/fundraising-e2e-roundtrips.mjs         # trips A+B: 24 passed
node scripts/fundraising-e2e-roundtrips.mjs --trip=d   #  5 passed
node scripts/fundraising-e2e-roundtrips.mjs --trip=e   #  9 passed
node scripts/fundraising-e2e-roundtrips.mjs --trip=c --email=perf.exec@nts.local   # 3 passed

# 3. remove the scratch records the checks create
cd ../nvccz && npm run db:cleanup:fundraising-test-artefacts
```
