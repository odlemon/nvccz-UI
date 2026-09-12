/**
 * Access & Settings (`/performance/access`).
 *
 * LIVE RENDERER: `function access(){…}` in the base layer. Unique — every distinctive string
 *                on the page ("Defence-in-depth RBAC", "Role permissions matrix", "Critical
 *                segregation controls", "Integration & data authorities") occurs exactly once
 *                in the runtime, so there is no dead twin here. The only later `access=`
 *                match in the file is a local `const access=role==='SysAdmin'?…` inside the
 *                v7 page-meta helper, not a page reassignment. Confirmed against
 *                `.perf-dumps/a7/sysadmin__access.txt`.
 *
 * WHAT WAS FABRICATED
 *   1. "Audit on · governed data · 99.2% quality" — the module-wide governance
 *      context bar injected by `wrapSystemMeta()`. Nothing anywhere measures data quality;
 *      99.2% was a literal. This was the ONLY number on the whole page. It is shared chrome
 *      on ~12 Performance pages and is now owned by `departments.mjs` — see the note below.
 *   2. Five segregation-of-duties controls each badged "Enforced". They are not. The
 *      Performance endpoints are `authenticate`-only with no server-side scope filtering
 *      (design-refs/performance-role-matrix.md §4) — the separation exists in the
 *      interface, so a page whose whole subject is segregation of duties was asserting a
 *      security guarantee the backend does not provide.
 *   3. Six source systems each badged "Connected", two of them claiming a sync cadence
 *      ("daily sync", "approved sync"). `GET /performance/integration/jobs` returns zero
 *      rows: no sync has ever been recorded for any of them, so nothing supported either the
 *      status or the schedule.
 *
 * WHAT IT SHOWS NOW
 *   The governance bar states that data quality is not measured.
 *   Segregation controls read "UI-level only", which is what they are today.
 *   Integration status comes from the live `syncJobs` scope: a recorded job's status when one
 *   exists, "No sync recorded" when the endpoint loads and is empty, "Unavailable" when it
 *   does not load. The two invented cadences are gone.
 *
 * STILL WITHOUT A SOURCE (reported, not invented)
 *   The role permissions matrix (R/W/Scoped cells for Executive / HR/M&E / Dept Manager /
 *   Employee / SysAdmin) is hand-authored in `permRows`. Its five columns do line up with the
 *   tiers in `lib/performance-v22-mock/access.ts`, but the cells are not derived from that
 *   module's permission arrays and cannot be: only the SIGNED-IN user's access is published
 *   to the runtime (`window.__PERF_ACCESS__`). Deriving the full matrix needs an endpoint
 *   that returns the permission set per role.
 */

// ---------------------------------------------------------------------------------------
// 1. Module-wide governance context bar — NOT patched here.
//
//    "Audit on · governed data · 99.2% quality" was the only number on this page, but the
//    bar is shared page chrome injected by `wrapSystemMeta()` onto ~12 Performance pages, and
//    `scripts/perf-patches/departments.mjs` already replaced the statement under the label
//    `departments-system-meta`. Two anchors over one statement means whichever lands first
//    makes the other MISS, and a missed anchor blocks the whole run's write for everyone —
//    so this file defers to that one rather than competing with it. The bar now reads
//    "Audit on · governed data · data quality not yet measured" on both pages, verified in
//    `.perf-dumps/a7d/`.
// ---------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------
// 2. Critical segregation controls.
//
//    One anchor spanning all five rows: `${badge('Enforced')}` on its own appears five times
//    inside this single card and nowhere else, but replacing it five times individually
//    would need five identical anchors and the patcher (correctly) refuses an ambiguous one.
// ---------------------------------------------------------------------------------------
const SEGREGATION_FIND =
  "<div class=\"list-row\"><div class=\"list-main\"><strong>High-stakes KPI evidence</strong><span>Manager/Executive approval before scorecard update</span></div>${badge('Enforced')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Final performance review</strong><span>Manager finalizes; employee + manager sign off</span></div>${badge('Enforced')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Compliance report publication</strong><span>HR/M&E prepares; Executive publishes</span></div>${badge('Enforced')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Role administration</strong><span>HR can manage standard roles; SysAdmin controls privileged roles</span></div>${badge('Enforced')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>External financial data</strong><span>Hidden from HR/M&E and employee profiles</span></div>${badge('Enforced')}</div>"

const SEG_BADGE =
  "${/* patched:access-segregation */badge('UI-level only')}"

const SEGREGATION_REPL =
  "<div class=\"list-row\"><div class=\"list-main\"><strong>High-stakes KPI evidence</strong><span>Manager/Executive approval before scorecard update</span></div>" + SEG_BADGE + "</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Final performance review</strong><span>Manager finalizes; employee + manager sign off</span></div>${badge('UI-level only')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Compliance report publication</strong><span>HR/M&E prepares; Executive publishes</span></div>${badge('UI-level only')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>Role administration</strong><span>HR can manage standard roles; SysAdmin controls privileged roles</span></div>${badge('UI-level only')}</div>" +
  "<div class=\"list-row\"><div class=\"list-main\"><strong>External financial data</strong><span>Hidden from HR/M&E and employee profiles</span></div>${badge('UI-level only')}</div>"

// ---------------------------------------------------------------------------------------
// 3. Integration & data authorities.
//
//    `integration(name, status, description)` -> the status argument is the badge text, so
//    this replaces values only; the helper, markup and row order are untouched.
// ---------------------------------------------------------------------------------------
const INTEGRATIONS_FIND =
  "${integration('Accounting','Connected','Finance metrics · daily sync')}" +
  "${integration('Portfolio Management','Connected','AUM, IRR, valuation · approved sync')}" +
  "${integration('Procurement','Connected','Invoice and contract cycle metrics')}" +
  "${integration('Payroll / HR','Connected','People cost and HR indicators')}" +
  "${integration('Events','Connected','RSVP and engagement metrics')}" +
  "${integration('Task Management','Connected','Task completion, timeliness and training')}"

// Status per source, from the live `syncJobs` scope (GET /performance/integration/jobs).
// A real recorded status when there is one, a real "none recorded" when the endpoint loads
// empty, and "Unavailable" when it does not load - three different facts, three different
// words. The job rows carry no agreed source key yet, so the match is a defensive
// name-contains over whichever of a few plausible fields is present rather than an
// assumption about the row shape.
const SYNC_STATUS =
  "(function(n){" +
  "var j=__perfScope('syncJobs');" +
  "if(j===null)return 'Unavailable';" +
  "var key=String(n).toLowerCase();" +
  "var hit=j.filter(function(x){" +
  "var s=String((x&&(x.source||x.system||x.name||x.integration))||'').toLowerCase();" +
  "return s&&(s.indexOf(key)>-1||key.indexOf(s)>-1);})[0];" +
  "if(!hit)return 'No sync recorded';" +
  "return __perfLabel(hit.status||hit.state);" +
  "})"

const INTEGRATIONS_REPL =
  "${integration('Accounting',/* patched:access-integrations */" + SYNC_STATUS + "('Accounting'),'Finance metrics')}" +
  "${integration('Portfolio Management'," + SYNC_STATUS + "('Portfolio'),'AUM, IRR, valuation')}" +
  "${integration('Procurement'," + SYNC_STATUS + "('Procurement'),'Invoice and contract cycle metrics')}" +
  "${integration('Payroll / HR'," + SYNC_STATUS + "('Payroll'),'People cost and HR indicators')}" +
  "${integration('Events'," + SYNC_STATUS + "('Events'),'RSVP and engagement metrics')}" +
  "${integration('Task Management'," + SYNC_STATUS + "('Task'),'Task completion, timeliness and training')}"

export default [
  { label: "access-segregation", find: SEGREGATION_FIND, repl: SEGREGATION_REPL },
  { label: "access-integrations", find: INTEGRATIONS_FIND, repl: INTEGRATIONS_REPL },
]
