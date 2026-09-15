import fs from "fs"

// Second pass on top of patch-home-v3-live-data.mjs (must run after it). Same CRLF-normalise
// and function-form-replace rules apply — see that script's header comment for why.
const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")
let missed = 0

// 1. aumSnapshotMarkup: add a middle state between "full chart" and "nothing at all" — a real
//    current total with no history to trend yet (this dev dataset has no historical AUM
//    snapshots, only a current figure).
const oldAumFn =
  "function aumSnapshotMarkup(){\n" +
  "    const a = D.workdaySnapshot && D.workdaySnapshot.aum;\n" +
  "    if (!a || !Array.isArray(a.values) || !a.values.length) {\n" +
  "      return '<div class=\"snapshot-time-pane\"><div class=\"snapshot-chart-heading\"><div><span class=\"eyebrow\">Portfolio signal</span><strong>Assets under management</strong></div></div><div class=\"chart-empty-state\">Portfolio AUM is unavailable right now.</div></div>';\n" +
  "    }"
if (s.includes(oldAumFn)) {
  const newAumFn =
    "function aumSnapshotMarkup(){\n" +
    "    const a = D.workdaySnapshot && D.workdaySnapshot.aum;\n" +
    "    if (!a) {\n" +
    "      return '<div class=\"snapshot-time-pane\"><div class=\"snapshot-chart-heading\"><div><span class=\"eyebrow\">Portfolio signal</span><strong>Assets under management</strong></div></div><div class=\"chart-empty-state\">Portfolio AUM is unavailable right now.</div></div>';\n" +
    "    }\n" +
    "    if (!Array.isArray(a.values) || !a.values.length) {\n" +
    "      return `<div class=\"snapshot-time-pane\"><div class=\"snapshot-chart-heading\"><div><span class=\"eyebrow\">Portfolio signal</span><strong>Assets under management</strong></div>${a.yoyLabel?`<span class=\"trend-positive\">${esc(a.yoyLabel)}</span>`:''}</div><div class=\"chart-context\"><span>${esc(a.totalLabel||'Not available')}</span><span>No trend history yet</span></div></div>`;\n" +
    "    }"
  s = s.replace(oldAumFn, () => newAumFn)
} else if (!s.includes("No trend history yet")) {
  missed++
  console.error("MISS: aumSnapshotMarkup not-full-chart branch not found verbatim")
}

// 2. Today's Priorities: honest empty state instead of a bare, unexplained blank list when the
//    signed-in user genuinely has zero tasks.
const oldPriorities =
  "${state.priorities.map(t=>`<div class=\"task-row\"><button class=\"check-circle ${t.done?'checked':''}\" data-priority-toggle=\"${t.id}\">${t.done?icon('check'):''}</button><div class=\"task-copy\"><strong style=\"${t.done?'text-decoration:line-through;color:var(--muted)':''}\">${t.title}</strong><span>${t.meta}</span></div><span class=\"status-pill ${t.priority.toLowerCase()}\">${t.priority}</span></div>`).join('')}"
if (s.includes(oldPriorities)) {
  const newPriorities =
    "${state.priorities.length?state.priorities.map(t=>`<div class=\"task-row\"><button class=\"check-circle ${t.done?'checked':''}\" data-priority-toggle=\"${t.id}\">${t.done?icon('check'):''}</button><div class=\"task-copy\"><strong style=\"${t.done?'text-decoration:line-through;color:var(--muted)':''}\">${t.title}</strong><span>${t.meta}</span></div><span class=\"status-pill ${t.priority.toLowerCase()}\">${t.priority}</span></div>`).join(''):'<div class=\"empty-state-row\">No open tasks right now.</div>'}"
  s = s.replace(oldPriorities, () => newPriorities)
} else if (!s.includes("No open tasks right now.")) {
  missed++
  console.error("MISS: priorities list markup not found verbatim")
}

// 3. Upcoming Schedule: same treatment.
const oldSchedule =
  "${D.schedule.map((e,i)=>`<div class=\"schedule-row\" data-event=\"${e.id}\"><div class=\"date-tile\">${e.month}<strong>${e.day}</strong></div><div class=\"event-copy\"><strong>${e.title}</strong><span>${e.time} · ${e.location}</span></div><div class=\"avatar-stack\">${e.people.map((p,j)=>avatar(p,colorByIndex(j))).join('')}</div></div>`).join('')}"
if (s.includes(oldSchedule)) {
  const newSchedule =
    "${D.schedule.length?D.schedule.map((e,i)=>`<div class=\"schedule-row\" data-event=\"${e.id}\"><div class=\"date-tile\">${e.month}<strong>${e.day}</strong></div><div class=\"event-copy\"><strong>${e.title}</strong><span>${e.time} · ${e.location}</span></div><div class=\"avatar-stack\">${e.people.map((p,j)=>avatar(p,colorByIndex(j))).join('')}</div></div>`).join(''):'<div class=\"empty-state-row\">Nothing on your calendar yet.</div>'}"
  s = s.replace(oldSchedule, () => newSchedule)
} else if (!s.includes("Nothing on your calendar yet.")) {
  missed++
  console.error("MISS: schedule list markup not found verbatim")
}

fs.writeFileSync(p, s.replace(/\n/g, "\r\n"))
console.log(missed === 0 ? "0 missed" : `${missed} missed`)
