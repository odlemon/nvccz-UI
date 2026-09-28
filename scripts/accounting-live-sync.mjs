/**
 * Inlines scripts/accounting-live/*.js into the Accounting V52 runtime, between markers, inside startAccountingV52Runtime just
 * before the runtime builds its API object (so the layer sees `pages`, `state`, `render`, `navGroups`). Re-run after every
 * change to the live files. LF only (the CRLF trap: a CRLF block silently failed to match on Windows checkouts).
 *
 *   node scripts/accounting-live-sync.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const rt = path.join(root, "components/accounting-v52-mock/matanho-accounting-runtime.js")
const dir = path.join(root, "scripts/accounting-live")
const BEGIN = "/* BEGIN_AC52_ACC_LIVE */"
const END = "/* END_AC52_ACC_LIVE */"
const ANCHOR = "\n  api = {\n"

// the core (00-*) first, as is; every page file in its own try, so one failing file cannot take the other pages with it
const src = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort().map((f) => {
  const body = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n")
  return f.startsWith("00-")
    ? `/* ---- accounting-live/${f} ---- */\n${body}`
    : `/* ---- accounting-live/${f} ---- */\ntry {\n${body}\n} catch (e) { if (window.console) console.error("[acc-live] ${f} failed to load", e); }`
}).join("\n")
const block = `${BEGIN}\ntry {\n${src}\n} catch (e) { if (window.console) console.error("[acc-live] layer failed to load", e); }\n${END}\n`
let s = fs.readFileSync(rt, "utf8").replace(/\r\n/g, "\n")
if (s.includes(BEGIN) && s.includes(END)) {
  s = s.slice(0, s.indexOf(BEGIN)) + block + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "")
} else {
  if (s.split(ANCHOR).length !== 2) { console.error("anchor not found exactly once: the runtime's api object"); process.exit(1) }
  // a function, not a string: the layer contains "$'" and "$&", which a replacement string would expand
  s = s.replace(ANCHOR, () => `\n${block}  api = {\n`)
}
fs.writeFileSync(rt, s)
console.log(`synced accounting live layer, ${src.length} chars`)
