/**
 * Integration Mapping & Data Sources (`/performance/integrations`).
 *
 * LIVE RENDERER: `integrationsV8()` in the v8 layer (registered in `v8Pages` as
 *   `integrations:integrationsV8`). Confirmed from the DOM, not by grepping: the six
 *   `integrations-kpi-*` patches already applied by `patch-performance-runtime.mjs` live in
 *   this function and are the "— / Not yet tracked" cards visible at the top of the page.
 *   Three other layers contain a "Source systems" heading; none of them renders.
 *
 * WHAT WAS FABRICATED (26 numbers on screen; the six KPI cards were already dashed)
 *   Eight source systems — Oracle ERP, Salesforce, Power BI, HR/Payroll, SurveyMonkey, Task
 *   Management, Portfolio Management, Events — each with an invented mapped-KPI count
 *   (23/12/18/16/8/24/9/5), an invented sync age (2 … 32 min ago) and an invented health
 *   badge. Beside them an "Integration health" ring reading 99.2% with a conic gradient
 *   drawn at 88%/96% bands, and three bars claiming 44 / 3 / 1 of 48 mappings.
 *
 *   No source system, field mapping or sync-history model exists. The only integration read
 *   path is `GET /api/performance/integration/jobs` (`syncJobs`), which returns 0 rows and
 *   whose payload carries only id / name / description / status — no timestamps, no KPI
 *   coverage, no success rate. Every figure above was asserted against nothing.
 *
 * WHAT IT SHOWS NOW
 *   The source list is built from the `syncJobs` scope, so it fills in as jobs are
 *   registered, and today distinguishes "none connected yet" from "could not load".
 *   Coverage and freshness are dashes in the row — the endpoint does not carry them.
 *   The health ring and its three bands have no source at all: nothing records a sync
 *   outcome, so there is no rate to compute. They read as not tracked, and the ring's
 *   gradient is flattened to a neutral track rather than drawing a 99%/1% split.
 */

// --- Source systems ------------------------------------------------------------------------
const SOURCES_FIXTURE_FIND =
  "function integrationsV8(){const sources=[['ERP','Oracle ERP','Financials','23 KPIs','2 min ago','Healthy'],['CRM','Salesforce','Customer / Market','12 KPIs','5 min ago','Healthy'],['BI','Power BI','Operational analytics','18 KPIs','8 min ago','Healthy'],['HR','HR / Payroll','People metrics','16 KPIs','12 min ago','Healthy'],['SUR','SurveyMonkey','NPS / engagement','8 KPIs','18 min ago','Healthy'],['PM','Task Management','Delivery / time','24 KPIs','1 min ago','Healthy'],['PF','Portfolio Management','AUM / IRR / valuation','9 KPIs','15 min ago','Approval gate'],['EV','Events','RSVP / attendance','5 KPIs','32 min ago','Healthy']];"

const SOURCES_FIXTURE_REPL =
  "function integrationsV8(){/* patched:integrations-sources-fixture */\n" +
  "    // Was eight invented connectors. `syncJobs` (GET /performance/integration/jobs) is the\n" +
  "    // only integration read path there is; it carries name / description / status and no\n" +
  "    // timing or coverage, so columns 4 and 5 are dashes rather than plausible ages.\n" +
  "    const __jobs=__perfScope('syncJobs');\n" +
  "    const sources=(__jobs||[]).map(j=>[\n" +
  "      (String(j.name||'').replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase())||'SRC',\n" +
  "      j.name||__perfDash(),\n" +
  "      j.description||__perfDash(),\n" +
  "      __perfDash(),\n" +
  "      __perfDash(),\n" +
  "      __perfLabel(j.status),\n" +
  "    ]);"

const SOURCES_ROWS_FIND =
  "${sources.map((s,i)=>`<div class=\"v8-source-row\" data-v8-action=\"integration-detail\" data-id=\"${i}\"><div class=\"v8-source-logo\" style=\"--tone:${i%3===0?'var(--red)':i%3===1?'var(--blue)':'var(--emerald)'};--soft:${i%3===0?'var(--red-soft)':i%3===1?'var(--blue-soft)':'var(--emerald-soft)'}\">${s[0]}</div><div><strong>${s[1]}</strong><span>${s[2]}</span></div><div><strong>${s[3]}</strong><span>Mapped</span></div><div><strong>${s[4]}</strong><span>Last sync</span></div><div>${badge(s[5])}</div><div>Open →</div></div>`).join('')}"

// Same row markup, unchanged. The only addition is an empty state that says which of the two
// possible facts is true, because "nothing is connected" and "the call failed" are different.
const SOURCES_ROWS_REPL =
  "${/* patched:integrations-sources-rows */ sources.length ? sources.map((s,i)=>`<div class=\"v8-source-row\" data-v8-action=\"integration-detail\" data-id=\"${i}\"><div class=\"v8-source-logo\" style=\"--tone:${i%3===0?'var(--red)':i%3===1?'var(--blue)':'var(--emerald)'};--soft:${i%3===0?'var(--red-soft)':i%3===1?'var(--blue-soft)':'var(--emerald-soft)'}\">${s[0]}</div><div><strong>${s[1]}</strong><span>${s[2]}</span></div><div><strong>${s[3]}</strong><span>Mapped</span></div><div><strong>${s[4]}</strong><span>Last sync</span></div><div>${badge(s[5])}</div><div>Open →</div></div>`).join('') : ('<p style=\"margin:0;padding:28px 12px;text-align:center;color:var(--muted,#6b7280);font-size:12px;line-height:1.6\">' + (__perfScope('syncJobs')===null ? 'Unavailable \\u2014 integration sync jobs could not be loaded.' : 'No source systems are connected yet.') + '</p>')}"

// --- Integration health ---------------------------------------------------------------------
const HEALTH_FIND =
  "<div class=\"v8-ring\" style=\"background:conic-gradient(var(--emerald) 0 88%,var(--amber) 88% 96%,var(--red) 96%)\"><div class=\"v8-ring-center\"><strong>99.2</strong><span>% healthy</span></div></div>${compactBarV8('Healthy mappings',91,'44 / 48','green')}${compactBarV8('Warning',6,'3 / 48','amber')}${compactBarV8('Failed',2,'1 / 48','red')}"

// The bars reproduce `compactBarV8`'s markup verbatim (same classes, same tone variables) with
// the value dashed and the fill at zero, so nothing about the layout changes.
const HEALTH_REPL =
  "${/* patched:integrations-health */(() => {\n" +
  "  const band = (label, tone) => '<div class=\"v8-score-line\" style=\"--tone:' + tone + '\"><strong>' + label + '</strong><b>' + __perfDash() + '</b><div class=\"track\"><i style=\"width:0%\"></i></div><em>Not yet tracked</em></div>';\n" +
  "  return '<div class=\"v8-ring\" style=\"background:conic-gradient(var(--border,#e5e7eb) 0 100%)\"><div class=\"v8-ring-center\"><strong>' + __perfDash() + '</strong><span>Health not tracked</span></div></div>'\n" +
  "    + band('Healthy mappings', 'var(--emerald)')\n" +
  "    + band('Warning', 'var(--amber)')\n" +
  "    + band('Failed', 'var(--red)');\n" +
  "})()}"

// --- Data governance ------------------------------------------------------------------------
// Three panels asserted that a validation policy, historical versioning and an override
// approval rule were all "Active". No endpoint exposes any integration governance setting, so
// those were three green badges standing for configuration nobody had made. A badge asserting
// a control is on is worse than a dash: it is the kind of claim an auditor would rely on.
const GOVERNANCE_FIND =
  "${insightV8('shield','Validation policy','Strict for material KPIs','Active')}${insightV8('history','Data versioning','Historical values retained','Active')}${insightV8('lock','Manual overrides','Justification + approval required','Active')}"

const GOVERNANCE_REPL =
  "${/* patched:integrations-governance */insightV8('shield','Validation policy','Not yet configured',__perfDash())}" +
  "${insightV8('history','Data versioning','Not yet configured',__perfDash())}" +
  "${insightV8('lock','Manual overrides','Not yet configured',__perfDash())}"

export default [
  { label: "integrations-sources-fixture", find: SOURCES_FIXTURE_FIND, repl: SOURCES_FIXTURE_REPL },
  { label: "integrations-sources-rows", find: SOURCES_ROWS_FIND, repl: SOURCES_ROWS_REPL },
  { label: "integrations-health", find: HEALTH_FIND, repl: HEALTH_REPL },
  { label: "integrations-governance", find: GOVERNANCE_FIND, repl: GOVERNANCE_REPL },
]
