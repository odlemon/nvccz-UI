// Drops the Home dashboard's fake "Workday Snapshot" donut+bars widget — found during a full
// regression pass (see execution-plan.md): "86 Excellent" focus score, "Deep work 4h 48m",
// "Momentum +12%", "Balance 82%" were 100% hardcoded literals with zero connection to state/D,
// sitting directly beside "Today's Priorities" and "Upcoming Schedule" on the same page, both of
// which correctly show honest empty states for the same data. No real time-tracking/focus-session
// data exists anywhere in this build to compute a genuine version of these metrics from, so this
// follows the same precedent as Phase 7's dropped profile tabs: remove the fake section rather
// than invent a new synthetic-metric feature to fill it in. The one real piece of this card
// (aumSnapshotMarkup() — real portfolio AUM, already wired since Phase 1) is kept; only the fake
// donut/bars and the equally-unwired "Today/This week/This month" range selector are dropped.
//
// Run: node scripts/patch-home-v3-drop-fake-workday-snapshot.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, "..", "components", "home-v3-mock", "matanho-runtime.js")

const raw = readFileSync(target, "utf8")
const isCrlf = raw.includes("\r\n")
let src = raw.replace(/\r\n/g, "\n")

let missed = []
function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    missed.push(label)
    return
  }
  src = src.replace(oldStr, () => newStr)
}

patch(
  "drop fake Workday Snapshot donut+bars, keep real AUM chart",
  `      <section class="card card-pad home-insight-card">
        <div class="card-title"><div><h3>Workday Snapshot</h3><p>Focus quality and portfolio momentum in one calm view</p></div><select class="select-control small-btn" data-action="snapshot-range"><option>Today</option><option>This week</option><option>This month</option></select></div>
        <div class="snapshot-chart-pair">
          <div class="snapshot-donut-pane">
            <div class="focus-ring" style="--score:86%"><div><strong>86</strong><span>Excellent</span></div></div>
            <div class="snapshot-signals">
              <div><span>Deep work</span><strong>4h 48m</strong><i class="signal-bar"><b style="width:78%"></b></i></div>
              <div><span>Momentum</span><strong>+12%</strong><i class="signal-bar emerald"><b style="width:88%"></b></i></div>
              <div><span>Balance</span><strong>82%</strong><i class="signal-bar amber"><b style="width:82%"></b></i></div>
            </div>
          </div>
          \${aumSnapshotMarkup()}
        </div>
      </section>`,
  `      <section class="card card-pad home-insight-card">
        <div class="snapshot-chart-pair">
          \${aumSnapshotMarkup()}
        </div>
      </section>`
)

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
