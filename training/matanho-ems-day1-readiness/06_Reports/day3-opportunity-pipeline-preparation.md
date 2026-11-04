# Day 3 Opportunity Pipeline Preparation

**Status:** Partially verified in local UAT on 15 October 2026; committee completion remains blocked by required document upload.

## Intended demonstration

1. Open the investment opportunity pipeline from the visible application navigation.
2. Create a synthetic opportunity using only fields rendered by the live form.
3. Assign the opportunity to an authorized investment owner.
4. Save, refresh, and retrieve the record.
5. Edit an allowed field and verify persistence.
6. Move the record through stages offered by the live workflow.
7. Apply pipeline filters and confirm the record remains discoverable.
8. Repeat a direct-route and backend permission check with a restricted user.

## Evidence rule

This is not a PASS until the browser evidence records the actual route, labels, synthetic record identifier, saved result, refresh/retrieval result, stage transition, owner assignment, and permission outcome. Do not invent stage names, screening fields, or investment decisions before the live UI is inspected.

## Synthetic data boundary

Use harmless fictional companies and non-financial narrative values only. Do not enter client prospects, valuations, investor communications, or transaction instructions.

## Local UAT checkpoint — 15 October 2026

- Portfolio Management → Deal Flow loaded live opportunities, stage filters, owner filters, and the **Add Deal** wizard.
- The wizard accepted synthetic details for `UAT Opportunity Analytics` through Details, Ownership, and Review.
- Application creation did not proceed because the Review step requires four files: Business plan, Proof of concept, Market research, and Projected cash flows. The browser session could not complete native file-picker selection, so no synthetic application ID was claimed.
- Existing synthetic opportunity `NTS - Seed` was opened successfully. Its live detail showed AI screening `62/100`, Due Diligence `Complete`, recommendation `APPROVE`, and attached document records.
- The same record exposed **Create term sheet**, but term-sheet creation requires a term sheet PDF. The Board & IC Decision control remained disabled until a term sheet exists.
- **Result:** screening and due-diligence read-path verified; opportunity creation, term-sheet creation, committee decision, and full audit-chain acceptance remain open pending a supported browser file-upload method.

### Required follow-up

The local runtime now exposes clearly labeled, local-only synthetic fixture controls for the four application files, term-sheet PDF, and investment memorandum. These controls populate the existing required file inputs with in-memory `File` objects and do not bypass the upload or audit integration event; production does not receive the option. Repeat the test using those controls, then record the application ID, screening transition, DD assessment persistence, term-sheet ID, board-review/committee decision, refresh results, and audit event IDs before marking this exercise PASS.
