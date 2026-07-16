# Arcus feature delivery playbook

**Audience:** Any coding agent (or human) picking up a module that should follow the same working style as FP&A Model Planning.  
**Next intended consumer:** Fundraising (similar journey: requirements → stages → implement → BE asks → user test → feedback loop).  
**Reference implementation:** FP&A Model Planning under `design-refs/fpa-model-planning-*` and `components/fpa/`.

This doc describes **how we work**, not fundraising product requirements. Product SRDs and stage flows for Fundraising should be separate files that follow the patterns below.

---

## 1. Working loop (the contract with the user)

We do **not** build the whole module in one shot. We move in short, testable slices:

```
Requirements / design
        ↓
Stage map (user journey + “Done when”)
        ↓
Honest FE audit (what exists vs gaps)
        ↓
Implement what FE can do now
        ↓
Backend asks MD (if blocked or contract missing)
        ↓
User tests that stage in the browser
        ↓
Feedback → fix / next stage
        ↓
(repeat)
```

**Rules of the loop**

1. **One stage (or thin slice) at a time** — finish enough that the user can click through and give feedback before jumping ahead.
2. **Docs are the source of truth** — chat summaries are ephemeral; `design-refs/` holds stages, BE asks, and handoffs.
3. **Never pretend live data** — if the API is empty or missing, show empty states / honest UI. Do not ship fake numbers as production truth.
4. **User tests; agent implements** — after a slice ships, stop and let the user verify. Incorporate feedback before expanding scope.
5. **Backend gaps go to markdown** — never leave “we need X from BE” only in chat (see §5 and workspace rule `backend-asks-md`).

---

## 2. Phase A — Requirements and design

**Goal:** Understand product intent before coding.

| Step | What to do | Output |
|------|------------|--------|
| A1 | Locate SRD / PDF / existing digests / Figma or mock notes | Links in a feature index or handoff MD |
| A2 | Distill into a short FE-facing digest if the SRD is huge | e.g. `design-refs/<module>-frontend.md` |
| A3 | Capture product rules in one place (roles, what is server-owned vs UI-owned) | Top of stages or SRD digest |
| A4 | Note existing routes and components already in the repo | Table of routes → files |

**FP&A examples (copy the shape, not the content):**

- Full SRD digest: [`fpa-model-planning-builder-srd.md`](./fpa-model-planning-builder-srd.md)
- FE must-build digest: [`fpa-model-planning-builder-frontend.md`](./fpa-model-planning-builder-frontend.md)
- Handoff for next agent: [`fpa-model-planning-handoff.md`](./fpa-model-planning-handoff.md)

**For Fundraising:** create analogous files under `design-refs/` (e.g. `fundraising-<area>-srd.md`, `fundraising-<area>-frontend.md`) once product sources exist. Do not invent product rules without a source.

---

## 3. Phase B — Stage map (the testing journey)

**Goal:** Turn the product into an ordered path the user and agent can walk together.

Create:

```
design-refs/<module>-<feature>-stages.md
```

Each stage should include:

| Field | Purpose |
|-------|---------|
| **Who** | Role(s) that act |
| **Goal** | One sentence product outcome |
| **Steps** | Numbered UI / system actions |
| **Done when** | Exit criteria for that stage |
| **FE now / BE blocked** | Honest status (update as you go) |

Also include:

- A **status diagram** of the whole journey (ASCII is fine)
- A **status table** at the bottom: Stage | UI today | Notes
- Route(s) where the user starts testing

**FP&A reference:** [`fpa-model-planning-stages.md`](./fpa-model-planning-stages.md)

**How stages are used in practice**

1. User says “moving to Stage N” (or pastes a stage screenshot).
2. Agent audits code against that stage’s steps.
3. Agent implements missing FE pieces **or** writes BE asks for blockers.
4. User tests Stage N and gives feedback.
5. Only then advance to Stage N+1.

Do not skip stages to “finish the module” unless the user explicitly redirects.

---

## 4. Phase C — Audit before build

Before writing large amounts of code for a stage:

1. Search existing UI, API client, and prior `design-refs` asks for that feature.
2. Produce a short readiness table (in chat and/or in the stages MD):

| Stage step | Status | Notes |
|------------|--------|-------|
| … | Implemented / Partial / Missing | … |

3. Prefer **wiring and fixing** what exists over rewriting the screen.
4. Match **existing Arcus UI patterns** (shared `Button`, layout density, workspace chrome). See workspace rules: pill buttons (`rounded-full`), no MCP browser automation unless the user overrides.

---

## 5. Phase D — Backend asks (mandatory when FE is blocked)

Whenever the frontend needs something from the backend (missing fields, write guards, new endpoints, contract changes):

1. **Write or update** a file under `design-refs/` — do not leave asks only in chat.
2. **Name clearly:** `design-refs/<feature>-backend-asks.md` (or `-backend-gaps.md`).
3. **Prefer updating** an existing ask doc for the same feature over creating duplicates.
4. In chat: **link the file path** + short summary; the MD is the BE ticket source of truth.

### Required sections in a backend-asks MD

Enough for a BE ticket:

- Product rule / why
- Exact endpoints + methods
- Request/response field names + example JSON
- Error codes expected
- How to verify with FE
- Which FE files already consume the contract (if known)

**FP&A references:**

- [`fpa-model-planning-stage3-backend-asks.md`](./fpa-model-planning-stage3-backend-asks.md)
- [`fpa-model-planning-tasks-backend-asks.md`](./fpa-model-planning-tasks-backend-asks.md)
- [`fpa-model-planning-owner-scope-backend-asks.md`](./fpa-model-planning-owner-scope-backend-asks.md)
- Workspace rule: `.cursor/rules/backend-asks-md.mdc`

### FE while waiting on BE

- Implement UI + API client types against the **agreed contract** in the asks MD.
- Handle errors the contract documents (`403`, `409`, domain codes).
- Show empty / locked / unmet states — not demo success data.
- When BE lands, smoke the stage again and tighten types if shapes differ.

---

## 6. Phase E — Implement (frontend)

**Scope discipline**

- Only change what the current stage needs.
- Reuse existing components, API modules, and patterns in that product area.
- Keep diffs focused; no drive-by refactors or unsolicited markdown outside `design-refs` for this workflow.

**Typical FE checklist for a stage**

1. Types + methods in the area API client (e.g. `lib/api/…`).
2. Wire UI actions to live calls.
3. Loading / empty / error states.
4. Permission / role gates if the stage is role-sensitive.
5. After writes: refresh the surfaces the user cares about (lists, KPIs, badges) without requiring a full page reload when possible.
6. Update the **stages** MD status row for that stage.
7. If blocked: update or create **backend-asks** MD.

**Do not**

- Use MCP browser / headless browsing to QA unless the user explicitly overrides the project rule.
- Commit or push unless the user asks.
- Invent BE behaviour; document the ask instead.

---

## 7. Phase F — User test and feedback

**Agent responsibilities when handing a stage to the user**

- State what is ready to test (numbered path).
- State what is still BE-blocked.
- Link the stages + asks MDs.
- Ask for screenshots or concrete failures if something looks wrong (no browser automation by default).

**User responsibilities (as we practice them)**

- Walk the stage in the real app.
- Report what broke, what felt wrong, or what the BE returned.
- Decide when to move to the next stage.

**Agent after feedback**

- Fix FE bugs immediately when they are FE-owned.
- Update backend-asks if the gap is contract/API.
- Update stages status so the next agent does not re-audit from zero.

---

## 8. Document set every feature should grow

Create these as the work progresses (names are templates):

| Document | Role |
|----------|------|
| `design-refs/<module>-<feature>-srd.md` (or frontend digest) | Product / FE intent |
| `design-refs/<module>-<feature>-stages.md` | Ordered test journey + Done when |
| `design-refs/<module>-<feature>-backend-asks.md` (and stage-specific asks) | BE tickets |
| `design-refs/<module>-<feature>-handoff.md` | Next-agent continuity (done / blocked / next) |
| Optional: API requirements MD | Broader contract pack when many endpoints |

**Naming tip:** Prefer one asks file per capability (e.g. tasks, owner-scope, stage3) so BE can ticket cleanly. Link them from the stages MD under the relevant stage.

---

## 9. Suggested kickoff for Fundraising (another agent)

Use this playbook; do not copy FP&A domain logic.

1. **Inventory** — map `app/fundraising/*`, `components/fundraising/*`, `lib/config/fundraising-permissions.ts`, and any existing API client for fundraising.
2. **Sources** — gather SRD / design / stakeholder notes for the fundraising slice in scope (pipeline, commitments, due diligence, etc.).
3. **Write** `design-refs/fundraising-<slice>-frontend.md` (what FE must build) and `design-refs/fundraising-<slice>-stages.md` (journey + Done when).
4. **Audit Stage 0 / Stage 1** against the live UI (much of fundraising may still be mock-data — call that out honestly in the stages table).
5. **Implement Stage 0–1** or the first testable slice; create `design-refs/fundraising-<slice>-backend-asks.md` for gaps.
6. **Hand to user for test** → feedback → next stage.
7. Keep a short `design-refs/fundraising-<slice>-handoff.md` updated when pausing.

Fundraising already has substantial UI shells and mock data. Prefer **replace mocks stage-by-stage with live APIs** over rebuilding screens from scratch, unless the user or SRD says otherwise.

---

## 10. Collaboration norms (this repo)

| Topic | Norm |
|-------|------|
| Commits / PRs | Only when the user asks |
| Backend asks | Always MD under `design-refs/` |
| Browser QA | User tests; agent reads code/docs; no MCP browser unless overridden |
| Buttons | Arcus pills (`rounded-full`) via shared `Button` — see `arcus-button-styles` rule |
| Tone in chat | Direct, concise; link the MD; do not dump the whole playbook every turn |
| Scope | Current stage + feedback; do not “finish Fundraising” unprompted |

---

## 11. One-page checklist (copy into a new feature)

```
[ ] Product sources linked (SRD / design / notes)
[ ] FE digest MD written or updated
[ ] Stages MD with Who / Goal / Steps / Done when / status table
[ ] Stage N audited (implemented / partial / missing)
[ ] FE slice for Stage N implemented
[ ] Backend asks MD written or updated for blockers
[ ] Stages status table updated
[ ] User given a short test path + BE blockers list
[ ] Feedback applied; then Stage N+1
[ ] Handoff MD updated when pausing
```

---

## 12. Where this playbook came from

Practiced on FP&A Model Planning (July 2026): create cycle → orient → owners/tasks → Stage 3 drivers/plan, with iterative user testing and backend-asks files as the contract with BE.

If anything in a feature-specific stages doc conflicts with this playbook, **follow the user’s latest instruction** for that feature, then update the feature docs.

---

*Playbook for Arcus FE agents — July 2026.*
