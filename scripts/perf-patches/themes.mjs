/**
 * Strategic Themes (`/performance/themes`).
 *
 * LIVE RENDERER: `themesV8()` (runtime ~L1748), reached through the v8 layer's
 *                `v8Pages` map at L1748 — `v8Pages={... themes:themesV8 ...}`. There is a
 *                second `themes` page id inside the v11 strategy layer, but that one is a
 *                TAB of `/performance/strategy`, not this route; confirmed against
 *                `.perf-dumps/a1/sysadmin__themes.txt`, whose H1 is "Strategic Themes" and
 *                whose body is the v8 KPI strip.
 *
 * WHAT WAS ALREADY DONE (built-in patches in scripts/patch-performance-runtime.mjs)
 *   `themes-live` + `themes-kpi-1..6` already replaced the four-theme fixture and the six
 *   KPI cards. The page's KPI strip is honest today: "Active themes 0 / Linked objectives 0"
 *   are real counts from `themes` and `goals`, and the four figures nothing can produce read
 *   as "Not yet tracked".
 *
 * WHAT WAS STILL FABRICATED
 *   1. The shared "System & governance context" strip asserted "99.2% quality" — a
 *      data-quality score with no endpoint, no table and no computation behind it anywhere
 *      in the module. It renders on 12 of the 22 Performance pages, this one included, and
 *      is owned by `perf-patches/departments.mjs` (see the note below).
 *   2. A LATENT fabrication in the theme record card. The built-in `themes-live` fixture maps
 *      every live theme to a score of literal `0`, and the card template then hardcodes
 *      "Objectives 4" and "Initiatives ${6+i}" — an index-derived count. With zero themes in
 *      the database nothing renders, so the dump does not show it; the moment a user creates
 *      the first theme the card asserts a 0% score, an "At Risk" badge derived from that 0,
 *      four objectives and six initiatives, none of which exist. A defect that is invisible
 *      only because the table is empty is still a defect.
 *
 * WHAT IT SHOWS NOW
 *   The record card shows the theme's real name, real description and real status (read back
 *   out of the `themes` scope by row index, which is the same array the fixture was built
 *   from) and an em dash for score, objectives and initiatives — none of which has a source.
 *
 * STILL WITHOUT A SOURCE (reported, not invented)
 *   Theme score, theme→objective linkage, theme→initiative linkage, theme sponsor,
 *   theme→BSC-perspective linkage, alignment, evidence coverage, executive review status.
 *   `GET /api/performance/config/themes` returns only id/name/description/status.
 */

/* ---------------------------------------------------------------------------------------
 * SHARED CHROME — the "99.2% quality" claim is NOT patched from this file.
 *
 * `wrapSystemMeta()` (runtime L2264) is module-wide furniture: the same strip renders on
 * access, alerts, bsc-pillars, departments, integrations, kpi-analytics, objectives,
 * reports, settings, strategy, themes and vault. It occurs exactly once in the runtime, so
 * exactly one patch file may own it — and `perf-patches/departments.mjs` already does, under
 * the label `departments-system-meta`. A second patch on the same anchor reports MISS, and a
 * MISS makes the patcher refuse to write for everybody, so this file leaves it alone.
 * ------------------------------------------------------------------------------------- */

const THEME_CARD_FIND =
  "<article class=\"v8-record\" data-v8-action=\"theme-detail\" data-id=\"${i}\"><header><div><span class=\"eyebrow\">${t[2]}</span><h4>${t[0]}</h4></div>${badge(t[3]<76?'At Risk':'On Track')}</header><p>${t[1]}</p><div class=\"v8-stat-row\"><div class=\"v8-stat\"><span>Theme score</span><strong>${t[3]}%</strong></div><div class=\"v8-stat\"><span>Objectives</span><strong>4</strong></div><div class=\"v8-stat\"><span>Initiatives</span><strong>${6+i}</strong></div></div><div style=\"margin-top:10px\">${progress(t[3],t[3]<76?'amber':'emerald')}</div><footer>${v8Person(t[4],'Executive owner')}<span>Open theme →</span></footer></article>"

// `__t` is the raw `themes` scope array the built-in `themes-live` patch already put in
// scope, so the real status is available by row index without re-fetching anything. The
// progress bar keeps its element (layout would jump without it) at zero width, because a
// zero-width neutral bar reads as "no value" while a filled one would read as a score.
const THEME_CARD_REPL =
  "<article class=\"v8-record\" data-v8-action=\"theme-detail\" data-id=\"${i}\"><header><div><span class=\"eyebrow\">${/* patched:themes-record-card */t[2]}</span><h4>${t[0]}</h4></div>${badge(__t&&__t[i]&&__t[i].status?__perfLabel(__t[i].status):__perfDash())}</header><p>${t[1]}</p><div class=\"v8-stat-row\"><div class=\"v8-stat\"><span>Theme score</span><strong>${__perfDash()}</strong></div><div class=\"v8-stat\"><span>Objectives</span><strong>${__perfDash()}</strong></div><div class=\"v8-stat\"><span>Initiatives</span><strong>${__perfDash()}</strong></div></div><div style=\"margin-top:10px\">${progress(0,'')}</div><footer>${v8Person(t[4],'Executive owner')}<span>Open theme →</span></footer></article>"

export default [{ label: "themes-record-card", find: THEME_CARD_FIND, repl: THEME_CARD_REPL }]
