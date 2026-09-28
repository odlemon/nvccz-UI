# Quotations, Bid Opening, Evaluation and Award (`/procurement`): report

Scope: SRD §15 to §20. Everything was built and tested locally. Nothing is deployed and nothing is committed.

## Verification

| Suite | Result |
|---|---|
| Sourcing e2e (API, adversarial) `nvccz/scripts/_uat/sourcing-evaluation-e2e.ts` | 210/210 |
| Sourcing UI, visible browser, every role `scripts/_uat/sourcing-evaluation-ui.mjs` | 82/82 |
| Planning e2e | 165/165 |
| User master e2e | 69/69 |
| Vendor master e2e | 78/78 |
| Vendor portal adversarial | 56/56 (after renaming the portal RFQ field so it carries no internal-sounding name) |

Screenshots: `design-refs/sourcing-evaluation/screens/`.

## What was missing (found by the gap check)

- Quotations kept no reference, date, VAT rate, delivery period or submission method, and totals were free-typed.
- Nothing was sealed. Anyone with a procurement role could read every quotation and price at any time, including before the deadline.
- No formal bid opening, no attendee record.
- Evaluation was a single number typed per quotation; no criteria, weights, pass/fail, committee, declarations or consolidation.
- The comparison page auto-suggested the lowest bid, and an award needed only the award permission.
- No route for a quotation that arrives by email, hand delivery or courier.
- Evaluators (who hold no procurement role) could not reach the events they sit on.

## What was built

1. **Two submission routes, one record (§15).** Supplier portal, and capture by an authorised procurement user through an approved channel (email, hand delivery, courier, post, portal unavailable). Both produce the same record: supplier, event, reference, date, currency, subtotal, VAT, total, payment terms, delivery period, validity, attachments, submission date and time, submission method. Totals are always computed from the lines and VAT rate; a stated total that does not reconcile is refused. The submitted content is frozen with a SHA-256 snapshot. The supplier's original PDF is retained; capture without one is refused. Portal form gained reference, date, delivery days and, in two-envelope events, a technical/commercial document marker.
2. **Sealed bidding (§16).** Server-side, one access service for every read path. Before the deadline nobody, administrators included, can read submissions or prices; they see a count. After the deadline they stay sealed until formally opened. After opening, release is by role: full for procurement manager/officer, award authority, administrator and auditor; committee members only after they declare and are not recused; recused members never. Denied attempts are audited (`SEALED_ACCESS_DENIED`). Verified adversarially across lists, direct ids, by-event, comparison, documents, downloads, public media paths and the dashboard, for five roles.
3. **Bid opening.** Requires the bid-opening permission, only after the deadline, minimum attendees (configurable, default 2) with the opener recorded automatically and external observers allowed. The record is time-stamped, cannot be edited or deleted by any application path, and carries a hash with a verify endpoint. Opening freezes exchange rates and locks the criteria.
4. **Comparison (§17).** Suppliers as columns; rows for quoted amount, currency, comparable amount, VAT, delivery period, payment terms, validity, compliance status, technical, commercial and total score. Documents drill through to the real files, downloaded through an authenticated endpoint. Ranking is advisory and shown only when the evaluation is complete; the system never selects.
5. **Evaluation (§18).** Configurable criteria (scored, pass/fail, mandatory, weighted; weights must total 100; one computed price criterion), evaluator scorecards, committee consolidation without overwriting individual marks, comments, pass rule (all or majority), minimum evaluators. A failed mandatory criterion excludes the supplier: no total, no rank, out of the price baseline.
6. **Declarations (§19).** Wording and effect (no conflict, conflict disclosed, recusal) are configurable in Configuration. No declaration, no access and no scoring; a recusal is honoured on every path.
7. **Award recommendation (§20).** Event, recommended supplier, amount and currency (taken from the quotation), evaluation summary, justification, deviations (mandatory if not the top-ranked bid), supporting documents. It goes through the existing approval engine on a new stage, `AWARD_RECOMMENDATION`, whose route is editable in Configuration. The preparer cannot approve their own recommendation. The award (`accept`) is refused server-side until the recommendation is approved.

## Maths, checked by hand and by test

Technical = weighted average of the non-price scored criteria, each evaluator's mark as a percentage of its maximum, averaged over counted (non-recused, submitted) evaluators. Commercial = price mark: the lowest comparable qualified total scores 100, others lowest ÷ total × 100. Total = weighted sum. Example in the suite: Alpha technical 70, commercial 73.01, total 71.2; Bravo 70, 100, 82; Charlie excluded.

## Multi-currency decision

Quotations are converted to the reporting currency at the rates frozen at bid opening. With no rate on record a quotation is flagged "not comparable" and cannot be recommended until an authorised user states a rate with a reason (audited).

## Other fixes made on the way

- RFQ list now reports each event's true sealed phase and count (it read "opened" for everything).
- Committee members without procurement grants can now reach the events they sit on (register, page access, quotation reads).
- Purchase order totals no longer drift: the PO uses the awarded quotation's own subtotal, VAT and total.
- Quotation KPIs ("recommendations due", "awaiting award") count only opened events.
- The approval matrix editor is now stage-aware (requisition route and award route share it).

## Interpretation decisions

- Sealing is on by default for every new event; 27 existing open, unopened events were sealed by the migration.
- Administrators are not exempt before opening.
- Two-envelope mode is optional per event: an evaluator sees prices only after submitting their own technical scorecard.
- The chair is a role label only; every counted evaluator has equal weight.
- Quotation documents are PDF only (the existing rule).

## Things the BRD must still settle

Exact sealed-bid rules for high-value and public tenders; who may attend an opening (external observers, bidders); whether two-envelope is mandatory above a value; evaluator visibility of prices; the exchange-rate source and tolerance; tie-break rules.

## Limits and infrastructure notes

- Database triggers cannot be created locally (no SUPER privilege), so the opening record's immutability is enforced by the application (no update or delete path) plus the hash and verify endpoint. On a database where triggers are allowed, add them.
- The raw file server behind the media proxy is still reachable by address; mitigated by random stored file names and by blocking the public proxy path for quotation documents.
- "Declarations complete" and "Committee sessions" dashboard tiles remain hidden; they need cross-event aggregation not built here.

## Migration log (local; apply to other environments in this order, after the earlier ones)

Earlier: user-status, nts-remaining, user-master, vendor-master, planning-requisitions.

1. `npm run db:migrate:sourcing-evaluation` (idempotent): quotation reference, date, VAT rate, delivery days, submission method, capture channel, submitted snapshot and hash; document envelope and capture channel; RFQ evaluation mode, pass rule, minimum evaluators, criteria lock, exchange overrides; sealed default and minimum attendees in settings; new tables for bid openings and attendees, declaration options, criteria, committee, scores, notes, award recommendations.
2. `npm run db:migrate:procurement-permissions` (adds `procurement.quotations.capture` and `procurement.bids.open`; +8 grants).
3. `npx prisma generate`.

No `prisma migrate` or `db push` was used.

## Regression note

The two-envelope portal upload (technical/commercial marker) is covered at API level in the sourcing e2e but not driven through the portal screens in the UI suite. Run the four older suites after any change here: planning-requisitions-e2e, user-master-e2e, vendor-master-e2e, vendor-portal-adversarial. They now use the shared award helper (`_award-helper.ts`) because an award needs an approved recommendation.
