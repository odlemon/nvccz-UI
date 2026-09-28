// Fixes a bug found during a full regression pass (see execution-plan.md): opening a News
// article / Forum thread / Newsletter reader from its list would sometimes silently revert to
// the list view 1-1.5+ seconds later, while the URL bar still correctly showed the detail URL.
//
// Root cause (found via live diagnostic tracing — an earlier setRoute()-clobbering theory turned
// out wrong): home-v3-app.tsx's runtime-mount effect depends on
// [isLoading, liveDataReady, isPermissionsLoading]; when isPermissionsLoading flips again some
// time after first mount, its cleanup tears down the running runtime instance and the effect body
// re-mounts it completely fresh via startMatanhoRuntime(). That fresh call already receives a
// correctly URL-derived `initialDetail` (selectedNews/forumThread/selectedNewsletter/
// newsletterMode) — but nothing in this runtime ever read `options.initialDetail` (confirmed via
// grep: zero references before this patch), so the fresh state always started at the list/library
// view regardless of the real URL.
//
// Run: node scripts/patch-home-v3-deep-link-remount-fix.mjs
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
  "read options.initialDetail alongside initialRoute",
  `  const initialRoute = options.initialRoute || "home";`,
  `  const initialRoute = options.initialRoute || "home";\n  const initialDetail = options.initialDetail || {};`
)

patch(
  "apply initialDetail onto freshly-constructed state",
  `  state.apps = state.apps.map(a => ({...a, hasAccess: a.hasAccess ?? !['procurement','analytics'].includes(a.id)}));`,
  `  // Deep-link support: state's own defaults above only ever look at \`saved.X\` (localStorage) or a
  // hardcoded literal, never the URL — fine for a pure client mock, wrong now that this runtime can
  // be (re)mounted directly on a detail URL (e.g. /home/forums/{id}), whether on first page load or
  // if React remounts it later (e.g. a dependency of the host's mount effect changing). Apply the
  // host-computed, URL-derived initialDetail on top so the freshly-constructed state matches the
  // actual URL instead of always starting at the list/library view. Guarded the same way setRoute()
  // guards selectedNewsletter/newsletterMode — only overrides when a real value is present.
  if (initialDetail.selectedNews != null) state.selectedNews = initialDetail.selectedNews;
  if (initialDetail.forumThread != null) state.forumThread = initialDetail.forumThread;
  if (initialDetail.selectedNewsletter != null) state.selectedNewsletter = initialDetail.selectedNewsletter;
  if (initialDetail.newsletterMode) state.newsletterMode = initialDetail.newsletterMode;
  state.apps = state.apps.map(a => ({...a, hasAccess: a.hasAccess ?? !['procurement','analytics'].includes(a.id)}));`
)

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
