# `scripts/perf-patches/` — one file per Performance page

Each `*.mjs` here default-exports an array of patches applied to the vendored
`components/performance-v22-mock/matanho-performance-runtime.js` by
`scripts/patch-performance-runtime.mjs`.

One file per page so several people can work in parallel without colliding. **Never hand-edit
the runtime.** It is regenerated from a clean `git checkout` plus this directory; a hand edit
is lost the first time anyone does that.

---

## The rule this exists to enforce

> A card showing a plausible number that never changes is a defect.
> A button that shows a success toast without a network request is a defect.

So:

| Situation | What to render |
|---|---|
| Endpoint loaded, returned 5 rows | `5` |
| Endpoint loaded, returned 0 rows | `0` — a real zero is information |
| Endpoint errored / not loaded yet | `—` (`__perfDash()`) plus "Unavailable" |
| Nothing anywhere can produce this figure | `—` plus "Not yet tracked" |
| A chart with no time series behind it | `__perfNoSeries('…')` — not a drawn curve |
| A table with no rows | `__perfEmptyRow(scope, colCount, 'noun')` |

Never `0` for unknown, never `N/A` as a number, never "keep the shape by scaling the old
fixture". If you cannot source it, say so in the UI.

**Do not change the UI design.** Same layout, same classes, same card order, same copy tone.
You are replacing values, not redesigning pages.

---

## The one trap that has caught everyone

The runtime is 2.2 MB of stacked generations. The same page is defined three or four times;
later "layers" reassign `window.render` or the page function and take over. **The occurrence
you find by grepping is usually the dead one.**

Two defences, both mandatory:

1. **`patch()` refuses an ambiguous anchor.** If your `find` string matches more than once you
   get `AMBIGUOUS … matches 3x, expected 1` and the run refuses to write. Lengthen the anchor
   (span several adjacent cards, include a nearby unique class or `style=` attribute) until it
   is unique. Only pass `occurrences: 3` / `occurrences: "all"` when you have checked that
   every match *should* change — true for shared helpers like `bullet()`, false for page copy.

2. **Prove it with the DOM, not with the diff.** `scripts/perf-page-dump.mjs` renders the real
   page in a real browser as a real user. If the number is still on screen afterwards, you
   patched a dead layer, regardless of what the patch log said.

To find which function really renders a page: grep for a distinctive string from the dump,
then follow reassignments (`pageName=function(){…}`, `const base…=pageName`, `v8Pages`,
`window.render=render=function(){…}`) forwards from that line to the end of the file.

---

## Workflow

```bash
# 1. See what the page actually shows now
node scripts/perf-page-dump.mjs --pages=strategy,bscPillars --role=sysadmin
#    -> .perf-dumps/sysadmin__strategy.txt  (numbers on screen + full text + bridge scopes)

# 2. Write scripts/perf-patches/<page>.mjs   (see the template below)

# 3. Apply. Safe to run while others are running it - it takes an exclusive lock.
node scripts/patch-performance-runtime.mjs

# 4. Prove it changed on screen
node scripts/perf-page-dump.mjs --pages=strategy,bscPillars --role=sysadmin
```

`--check` reports without writing. A run that reports `missed=N` refuses to write at all, so a
broken anchor can never leave the runtime half-patched.

---

## Template

```js
/**
 * <Page name> (`/performance/<route>`).
 *
 * LIVE RENDERER: <function name> at L<line> — reached via <chain you traced>.
 *                Dead twins at L<...> carry identical strings; ignore them.
 * WHAT WAS FABRICATED: <the specific numbers and rows, and what table is actually empty>
 * WHAT IT SHOWS NOW:   <which scope feeds what, and what honestly has no source>
 */
export default [
  {
    label: "strategy-kpis",              // unique across the whole repo
    find: "${kpi('Objectives','24',…)}", // must match EXACTLY once
    repl: "${/* patched:strategy-kpis */ … }",  // MUST contain this marker
  },
]
```

`repl` **must** contain `/* patched:<label> */`. That marker is how the patcher knows the
patch already landed; without it the loader rejects the file outright.

Because these files are `.mjs` and the runtime is a template-literal soup, remember:

- `${` inside a JS template literal in *your* file interpolates in *your* file. Write the
  patch body as a normal `"…"` string, or escape as `` `\${…}` `` when you want the runtime to
  see `${…}`.
- Backticks inside a `repl` you wrote as a template literal need escaping.
- Anchors are matched EOL-agnostically — write `\n`, the patcher converts.

---

## Bridge API available inside the runtime

Published by the `bridge-readers` / `bridge-readers-2` patches; call these from any `repl`.

| Helper | Returns |
|---|---|
| `__perfScope(id)` | the array for an array scope, or `null` if not loaded / errored |
| `__perfObject(id)` | the object for an object scope, or `null` |
| `__perfDash()` | `—` |
| `__perfCount(id, fn?)` | row count as a string, or `—`; optional filter predicate |
| `__perfNum(id, key, suffix?)` | a number out of an object scope, or `—` |
| `__perfTally(id, group, key)` | e.g. `__perfTally('alertSummary','byStatus','open')` |
| `__perfPct(v, digits?)` | `82%` / `—`; never `NaN%` |
| `__perfSum(id, field)` | sum of a numeric field across rows, or `—` |
| `__perfDate(v)` | `08 Sep 2026` or `—`; never `Invalid Date` |
| `__perfLabel(v)` | `in_progress` → `In progress`, `null` → `—` |
| `__perfEmptyRow(id, cols, noun)` | a `<tr>` that distinguishes empty from unavailable |
| `__perfNoSeries(msg)` | a chart-height note in place of a fabricated chart |

Runtime helpers you may also reuse: `esc()`, `badge()`, `kpi()`, `kpiV8()`, `progress()`,
`personV5()`, `v8Person()`, `compactBarV8()`, `insightV8()`, `stat()`.

## Scopes (all verified live against the API)

`departments` `tasks` `kpis` `pillars` `themes` `strategies` `goals` `contracts` `risks`
`users` `correctiveActions` `alerts` `documents` `reviews` `reviewCycles` `timesheets`
`pillarConfig` `archivedStrategies` `deptComparison` `syncJobs`
— arrays.

`correctiveSummary` `alertSummary` `documentFolders` `vision` `analyticsKpi`
`analyticsDashboard` `analyticsReports`
— objects.

Every dump file lists the live row count of every scope in its `SCOPES` line. Definitions and
the exact endpoint behind each are in `lib/performance-v22-mock/{types,live-loaders}.ts`.

**If a page needs data no scope provides, do not invent a scope and do not edit
`live-loaders.ts`** (it is shared — concurrent edits collide). Render the honest dash and
report the gap.

## Worked example

`corrective.mjs` is complete and verified: 42 fabricated numbers on screen → 2 real ones.
Read it before writing your first patch — especially the KPI-strip comment explaining why five
separate card patches had to become one block anchor.
