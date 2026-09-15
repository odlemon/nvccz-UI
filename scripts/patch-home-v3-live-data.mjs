import fs from "fs"

// The runtime file is CRLF-terminated on this checkout (verified). Normalise to LF for
// matching/replacing, then restore CRLF on write — see the project's known CRLF trap on
// generated runtime files (design-refs/home-page/module-spec.md).
//
// IMPORTANT: every `.replace(search, replacementString)` below passes the replacement as a
// FUNCTION, never a plain string. A plain-string replacement is special-cased by JS: a literal
// `$'` inside it (e.g. from `yPrefix:'US$'`) is parsed as the "insert text following the match"
// token, not a dollar sign — which silently spliced in the rest of the file and corrupted it
// the first time this script was written without the function form. Returning the text from a
// function callback disables that special-pattern parsing entirely.
const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")
let missed = 0

// 1. Workday Snapshot's AUM chart is currently a hardcoded array baked into the render
//    template. Extract it into a small helper that reads live data off `D.workdaySnapshot.aum`
//    (set by home-v3-app.tsx from the real Portfolio dashboard endpoint), with an honest
//    empty state when it hasn't loaded / isn't available — instead of ever showing fabricated
//    numbers.
const aumAnchor = "let sessionTimerHandle = null;"
if (!s.includes("function aumSnapshotMarkup()")) {
  if (s.includes(aumAnchor)) {
    const newAumFunction = `function aumSnapshotMarkup(){
    const a = D.workdaySnapshot && D.workdaySnapshot.aum;
    if (!a || !Array.isArray(a.values) || !a.values.length) {
      return '<div class="snapshot-time-pane"><div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div></div><div class="chart-empty-state">Portfolio AUM is unavailable right now.</div></div>';
    }
    return \`<div class="snapshot-time-pane"><div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div><span class="trend-positive">\${esc(a.yoyLabel||'')}</span></div><div class="axis-chart-frame detailed-chart-home">\${detailedChartSvg(a.values,{xLabels:a.xLabels||[],yPrefix:'US$',ySuffix:'B',decimals:2,yLabel:'AUM',xLabel:'Month',target:a.target,showValues:false,ariaLabel:'Assets under management, trailing 12 months'})}</div><div class="chart-context"><span>12-month range <strong>\${esc(a.rangeLabel||'')}</strong></span><span>Updated today</span></div></div>\`;
  }
  ${aumAnchor}`
    s = s.replace(aumAnchor, () => newAumFunction)
  } else {
    missed++
    console.error("MISS: aum anchor not found")
  }
}

const oldAumBlock = [
  '          <div class="snapshot-time-pane">',
  '            <div class="snapshot-chart-heading"><div><span class="eyebrow">Portfolio signal</span><strong>Assets under management</strong></div><span class="trend-positive">+16.9% YoY</span></div>',
  "            <div class=\"axis-chart-frame detailed-chart-home\">${detailedChartSvg([1.06,1.08,1.07,1.11,1.13,1.15,1.14,1.18,1.19,1.21,1.22,1.24],{xLabels:['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'],yPrefix:'US$',ySuffix:'B',decimals:2,yLabel:'AUM',xLabel:'Month',target:1.20,showValues:false,ariaLabel:'Assets under management from August to July'})}</div>",
  '            <div class="chart-context"><span>12-month range <strong>US$1.06B–US$1.24B</strong></span><span>Updated today</span></div>',
  "          </div>",
].join("\n")
if (s.includes(oldAumBlock)) {
  s = s.replace(oldAumBlock, () => "          ${aumSnapshotMarkup()}")
} else if (!s.includes("${aumSnapshotMarkup()}")) {
  missed++
  console.error("MISS: old AUM block not found verbatim")
}

// 2. Priority checkbox toggle currently only touches local state — add the same integration
//    event emission pattern already used for workday-session / preferences actions, so the
//    host can persist completion to the real Task API.
const oldToggle =
  "const pri=e.target.closest('[data-priority-toggle]'); if(pri){const t=state.priorities.find(x=>x.id==pri.dataset.priorityToggle);t.done=!t.done;saveState();render();toast(t.done?'Priority completed.':'Priority reopened.',t.done?'success':'');return}"
const newToggle =
  "const pri=e.target.closest('[data-priority-toggle]'); if(pri){const t=state.priorities.find(x=>x.id==pri.dataset.priorityToggle);t.done=!t.done;saveState();emitIntegrationEvent('priorities.task.toggled',{id:t.id,done:t.done});render();toast(t.done?'Priority completed.':'Priority reopened.',t.done?'success':'');return}"
if (s.includes(oldToggle)) {
  s = s.replace(oldToggle, () => newToggle)
} else if (!s.includes("priorities.task.toggled")) {
  missed++
  console.error("MISS: priority toggle handler not found verbatim")
}

fs.writeFileSync(p, s.replace(/\n/g, "\r\n"))
console.log(missed === 0 ? "0 missed" : `${missed} missed`)
