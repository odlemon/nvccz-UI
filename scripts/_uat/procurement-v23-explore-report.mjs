/**
 * Turns procurement-v23-explore.mjs output into something a tester reads: what each persona is
 * offered, what failed, which controls did nothing or broke, success messages with no backend call
 * behind them, every form, and how roles differ.
 *
 * Run:  node scripts/_uat/procurement-v23-explore-report.mjs <explore-A.json> [<explore-B.json> ...] > report.txt
 */
import fs from "node:fs"

const files = process.argv.slice(2)
if (!files.length) throw new Error("usage: procurement-v23-explore-report.mjs <explore.json> ...")
const personas = files.flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8")).personas)
const out = []
const say = (s = "") => out.push(s)
const short = (email) => email.split("@")[0]

const FLAG = /^(NO VISIBLE EFFECT|COULD NOT OPERATE|ERROR|API WRITE)/
const failedCall = (e) => /^api /.test(e) && !/ (2\d\d|3\d\d)$/.test(e)
// Toasts that refuse, warn or ask for input are not claims that something happened.
const NOT_A_CLAIM = /not connected|nothing was saved|not available|no permission|not allowed|required|select |choose|enter |please|invalid|must |cannot|can't|could not|failed|unable|no .* (yet|found)|only /i

function collect(fn) {
  const map = new Map()
  for (const p of personas)
    for (const pg of p.pages)
      for (const key of fn(pg)) {
        if (!map.has(key)) map.set(key, new Set())
        map.get(key).add(short(p.email))
      }
  return [...map].sort(([a], [b]) => a.localeCompare(b))
}
const print = (rows) => { for (const [k, who] of rows) say(`- ${k}   {${[...who].join(", ")}}`) }

say("PROCUREMENT V23 — EXPLORATORY CENSUS")
say(`personas: ${personas.map((p) => `${short(p.email)}${p.full ? "*" : ""}`).join(", ")}   (* every control clicked)`)
say()

say("== 1. PROBLEMS: render failures, errors, failed calls, dead or unreachable controls, demo data")
print(collect((pg) => {
  const keys = []
  if (pg.renderError) keys.push(`[${pg.id}] page did not render: ${pg.renderError} (at ${pg.url}; "${(pg.text || "").slice(0, 120)}")`)
  for (const e of pg.loadErrors || []) keys.push(`[${pg.id}] on load: ${e}`)
  for (const a of pg.loadApi || []) keys.push(`[${pg.id}] on load: ${a.method} ${a.path} -> ${a.status}`)
  for (const d of pg.demo || []) keys.push(`[${pg.id}] vendored demo record on screen: ${d}`)
  for (const t of pg.suspectText || []) keys.push(`[${pg.id}] "${t}" printed on the page`)
  for (const pr of pg.probes || []) {
    const where = `[${pg.id}] ${pr.path.join(" > ")}${pr.label ? ` "${pr.label}"` : ""}`
    for (const e of pr.effect) if (FLAG.test(e) || failedCall(e)) keys.push(`${where}: ${e}`)
    for (const t of pr.overlay?.suspectText || []) keys.push(`${where}: "${t}" printed in the overlay`)
  }
  return keys
}))
say()

say("== 2. KPI CARDS WITHOUT A LIVE FIGURE")
print(collect((pg) => (pg.kpis || []).filter((k) => /No live source|^[^=]+= —/i.test(k)).map((k) => `[${pg.id}] ${k}`)))
say()

say("== 3. SUCCESS MESSAGES WITH NO API CALL BEHIND THEM (likely claims of work nobody did)")
print(collect((pg) => (pg.probes || []).flatMap((pr) => {
  if (pr.effect.some((e) => /^(api|API WRITE)/.test(e))) return []
  return pr.effect.filter((e) => /^toast/.test(e) && !NOT_A_CLAIM.test(e)).map((e) => `[${pg.id}] ${pr.path.join(" > ")}: ${e}`)
})))
say()

say("== 4. EVERY TOAST, DIALOG, DOWNLOAD AND NEW TAB (judge whether each is true)")
print(collect((pg) => (pg.probes || []).flatMap((pr) => {
  const shown = pr.effect.filter((e) => /^(toast|dialog|download|new tab)/.test(e))
  if (!shown.length) return []
  const calls = pr.effect.filter((e) => /^(api|API WRITE)/.test(e)).map((e) => e.replace(/^api /, ""))
  return [`[${pg.id}] ${pr.path.join(" > ")}: ${shown.join(" · ")}${calls.length ? `   calls: ${calls.join(", ")}` : "   (no API call)"}`]
})))
say()

say("== 5. PAGES (as each persona that clicked everything)")
for (const lead of personas.filter((p) => p.full)) {
  say(`#### ${short(lead.email)} (${lead.role})`)
  for (const pg of lead.pages) {
    say(`-- ${pg.id}  ${pg.url || pg.route}  "${pg.heading || ""}"  calls on load: ${pg.loadCalls ?? "?"}`)
    if (pg.renderError) { say(`   RENDER FAILED: ${pg.renderError}`); continue }
    if (pg.kpis?.length) say(`   KPIs: ${pg.kpis.join(" | ")}`)
    for (const t of pg.tables || []) say(`   table [${t.head.join(" | ")}] rows=${t.rows}${t.first.length ? `\n      ${t.first.join("\n      ")}` : ""}`)
    if (pg.empties?.length) say(`   empty: ${pg.empties.join(" | ")}`)
    if (pg.notices?.length) say(`   notices: ${pg.notices.join(" | ")}`)
    for (const pr of pg.probes || []) say(`   ${pr.path.join(" > ")}${pr.id && pr.path.length === 1 && !/\d{3,}/.test(pr.id) ? `[${pr.id}]` : ""}${pr.label ? ` "${pr.label}"` : ""}${pr.count > 1 ? ` ×${pr.count}` : ""} -> ${pr.effect.join(" · ")}`)
  }
}
say()

say("== 6. MODALS AND DRAWERS (every form a person can open)")
const forms = new Map()
for (const p of personas)
  for (const pg of p.pages)
    for (const pr of pg.probes || []) {
      if (!pr.overlay) continue
      const key = `${pr.effect.find((e) => /^opens/.test(e))}  [${pg.id}: ${pr.path.join(" > ")}]`
      if (!forms.has(key)) forms.set(key, { pr, who: new Set() })
      forms.get(key).who.add(short(p.email))
    }
for (const [key, { pr, who }] of [...forms].sort(([a], [b]) => a.localeCompare(b))) {
  say(`-- ${key}  {${[...who].join(", ")}}  shot ${pr.shot}`)
  say(`   text: ${pr.overlay.text.slice(0, 320)}`)
  for (const f of pr.overlay.fields) say(`   field ${f.name || "(no name)"} ${f.type}${f.required ? " required" : ""} "${f.label}"${f.value ? ` = ${f.value}` : ""}${f.options ? ` options: ${f.options.join(" / ")}` : ""}`)
  say(`   buttons: ${pr.overlay.buttons.join(" | ")}`)
}
say()

say("== 7. ROLES — nav offered (badge counts), and controls per page that differ between personas")
for (const p of personas) {
  const dash = p.pages.find((pg) => pg.id === "dashboard")
  say(`- ${short(p.email)} (${p.role}): ${[...new Set(dash?.nav || [])].join(", ") || "(no nav captured)"}`)
}
const pageIds = [...new Set(personas.flatMap((p) => p.pages.map((pg) => pg.id)))]
for (const id of pageIds) {
  const sets = personas.map((p) => [short(p.email), new Set((p.pages.find((pg) => pg.id === id)?.controls || []).map((c) => c.replace(/ ×\d+| \(disabled\)/g, "")))])
  const all = new Set(sets.flatMap(([, s]) => [...s]))
  const differing = [...all].filter((c) => sets.some(([, s]) => !s.has(c)))
  if (!differing.length) continue
  say(`-- ${id}`)
  for (const c of differing.sort()) say(`   ${c}: ${sets.filter(([, s]) => s.has(c)).map(([n]) => n).join(", ")}`)
}

process.stdout.write(out.join("\n") + "\n")
