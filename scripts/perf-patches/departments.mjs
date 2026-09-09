/**
 * Departments & Business Units (`/performance/departments`).
 *
 * LIVE RENDERER — `departmentsV8()` in the v8 layer, reached because `render()` at the v8
 *   generation branches on `state.page==='departments'` and every later generation delegates
 *   through it. Proof rather than inference: that function already carries the
 *   `/* patched:departments-live *\/` and `/* patched:departments-kpi-N *\/` markers applied by
 *   `patch-performance-runtime.mjs`, and the dump shows their output ("Departments 9",
 *   "Employees 10 · Assigned across 5 of 9 units", four "Not yet tracked" cards). A patch that
 *   lands on the dead twin does not change the screen; these did.
 *
 * ALREADY DONE ELSEWHERE (do not re-patch): the department fixture (`departments-live`), the
 *   six KPI cards (`departments-kpi-1..6`) and the record-card project count
 *   (`departments-projects`) all live in `scripts/patch-performance-runtime.mjs`.
 *
 * WHAT WAS STILL FABRICATED
 *   1. "Audit on · governed data · 99.2% quality" in the collapsed *System & governance
 *      context* strip. Nothing measures data quality — no rule engine, no completeness score,
 *      no validation run — so 99.2% is a bare literal in `wrapSystemMeta()`.
 *   2. The record-card progress bar. `progress(d[2], d[2]<76?'amber':'emerald')` is fed the
 *      em dash the KPI patch put in `d[2]`. `'—' < 76` is false, so the bar picked
 *      **emerald** — a green "on target" bar — and `Math.min(100,'—')` is NaN so it rendered
 *      at zero width. A green bar for a score we do not have is the same defect as a green
 *      zero in a KPI card.
 *
 * WHAT IT SHOWS NOW
 *   Departments (9) and Employees (10, across 5 of 9 units) are real, from `departments` +
 *   the `userCount` join off `/api/users`. Everything else on the page is an honest dash, the
 *   quality claim says it is unmeasured, and the bar is a neutral empty track until a score
 *   exists.
 *
 * NOTE — `wrapSystemMeta()` is SHARED chrome: the same strip renders on strategy, themes,
 *   objectives, vault, alerts, integrations, kpiAnalytics, reports, access and settings. It is
 *   owned here. Do not target that string from another perf-patches file: two files on one
 *   anchor means whichever runs second reports MISS, and the patcher then refuses to write for
 *   everybody.
 *
 * WHY THE QUALITY STRIP TAKES TWO PATCHES
 *   The first version of `departments-system-meta` put its `/* patched:… *\/` marker INSIDE
 *   `d.innerHTML='…<span>…</span>…'`. That is a plain string, not a template expression, so the
 *   marker was not a comment — it rendered on screen as literal text. It had already been
 *   written into the runtime by the time that was caught, and a marker cannot be withdrawn:
 *   the guard would skip the corrected patch on any runtime that already has the bad one.
 *
 *   So the pair below is deliberate. `departments-system-meta` reproduces the flawed output
 *   verbatim (it is the only thing whose marker the already-patched runtime will match), and
 *   `departments-system-meta-fix` moves the marker out of the string. Both orders converge on
 *   the same file:
 *     clean runtime      -> 1 applies, 2 applies    -> marker outside the string
 *     already-patched    -> 1 skips,   2 applies    -> marker outside the string
 *     patched twice      -> 1 skips,   2 skips      -> no-op
 *   Patch 2 re-emits both markers as real comments, which is what keeps the third row a no-op.
 */
export default [
  {
    label: "departments-system-meta",
    // Same three-part strip, same tone; the unmeasured claim becomes a statement that it is
    // unmeasured. Audit and governed-data are configuration facts, not metrics, so they stay.
    // NOTE: the marker here is inside an HTML string and would be visible — see the header.
    // It is preserved exactly as first shipped so the guard below can recognise it; patch 2
    // immediately removes it.
    find: "<span>Audit on · governed data · 99.2% quality</span></summary>';",
    repl:
      "<span>/* patched:departments-system-meta */Audit on · governed data · data quality not yet measured</span></summary>';",
  },
  {
    label: "departments-system-meta-fix",
    find:
      "<span>/* patched:departments-system-meta */Audit on · governed data · data quality not yet measured</span></summary>';",
    // Marker moved past the closing quote and the semicolon, where it is a real JS comment.
    // Both labels are re-emitted so a re-run skips both instead of missing on patch 1, whose
    // original anchor no longer exists in the file.
    repl:
      "<span>Audit on · governed data · data quality not yet measured</span></summary>';" +
      "/* patched:departments-system-meta */ /* patched:departments-system-meta-fix */",
  },
  {
    label: "departments-progress-bar",
    find: "<div style=\"margin-top:10px\">${progress(d[2],d[2]<76?'amber':'emerald')}</div>",
    // d[2] is the department score, which no endpoint supplies. A track with no fill and no
    // tone reads as "nothing recorded"; emerald read as "on target". Kept as a conditional so
    // the amber/emerald banding comes straight back the day a score exists.
    repl:
      "<div style=\"margin-top:10px\">${/* patched:departments-progress-bar */Number.isFinite(Number(d[2]))?progress(Number(d[2]),Number(d[2])<76?'amber':'emerald'):progress(0,'')}</div>",
  },
]
