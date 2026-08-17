/**
 * Extract Matanho Performance Management V22.1 for Mode A Next.js port.
 * Leaves /performance (existing mock) untouched.
 */
import fs from "fs"
import path from "path"

const CLIENT =
  "C:/Users/lysp/Downloads/Matanho_Performance_Management_v22_1_Deployment_Developer_Package-20260815T160741Z-1-001/Matanho_Performance_Management_v22_1_Deployment_Developer_Package"
const INDEX = path.join(CLIENT, "public/index.html")
const ROOT = "performance-v22-root"
const OUT_DIR = "components/performance-v22-mock"
const LIB_DIR = "lib/performance-v22-mock"
const PUBLIC_ASSETS = "public/performance-v22/assets"
const APP_DIR = "app/performance-v22"

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })
fs.mkdirSync(APP_DIR, { recursive: true })

const html = fs.readFileSync(INDEX, "utf8")

// --- assets ---
const pubAssets = path.join(CLIENT, "public/assets")
if (fs.existsSync(pubAssets)) {
  for (const f of fs.readdirSync(pubAssets)) {
    const p = path.join(pubAssets, f)
    if (fs.statSync(p).isFile()) fs.copyFileSync(p, path.join(PUBLIC_ASSETS, f))
  }
}
const runtimeConfig = path.join(CLIENT, "public/runtime-config.js")
if (fs.existsSync(runtimeConfig)) {
  fs.copyFileSync(runtimeConfig, path.join("public/performance-v22", "runtime-config.js"))
}
console.log("assets ok")

// --- shell ---
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
if (!body) throw new Error("no body")
let shell = body[1].replace(/<script[\s\S]*?<\/script>/gi, "").trim()
/* Styles are extracted into performance-v22.css — keep them out of shell or they apply unscoped via innerHTML. */
shell = shell.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").trim()
shell = shell.replace(/\n{3,}/g, "\n\n")
shell = shell.replace(/\u2318/g, "Cmd")
fs.writeFileSync(path.join(OUT_DIR, "shell.html"), shell)
fs.writeFileSync(
  path.join(OUT_DIR, "shell.ts"),
  `export const PERFORMANCE_V22_SHELL_HTML = ${JSON.stringify(shell)};\n`
)
console.log("shell", shell.length)

// --- CSS scope ---
function scopeCss(input, root = `.${ROOT}`) {
  let i = 0
  let out = ""
  function skipWs() {
    while (i < input.length && /\s/.test(input[i])) {
      out += input[i]
      i++
    }
  }
  function readUntil(chars) {
    let s = ""
    while (i < input.length && !chars.includes(input[i])) {
      s += input[i]
      i++
    }
    return s
  }
  function scopeSelectorList(selectors) {
    return selectors
      .split(",")
      .map((raw) => {
        const sel = raw.trim()
        if (!sel) return sel
        if (sel === ":root" || sel === "html" || sel === "body") return root
        if (sel.startsWith(root)) return sel
        if (sel.startsWith("html[")) return root + sel.slice(4)
        if (sel.startsWith("body[")) return root + sel.slice(4)
        if (sel.startsWith(":root")) return root + sel.slice(5)
        if (sel.startsWith("[data-theme")) return root + sel
        return `${root} ${sel}`
      })
      .join(", ")
  }
  function transformBlock(stopOnClose = true) {
    while (i < input.length) {
      skipWs()
      if (i >= input.length) break
      if (stopOnClose && input[i] === "}") {
        out += "}"
        i++
        return
      }
      if (input[i] === "/" && input[i + 1] === "*") {
        const end = input.indexOf("*/", i + 2)
        out += input.slice(i, end === -1 ? input.length : end + 2)
        i = end === -1 ? input.length : end + 2
        continue
      }
      if (input[i] === "@") {
        i++
        const name = readUntil([" ", "\t", "\n", "{", ";", "("]).trim()
        let prelude = ""
        let depth = 0
        while (i < input.length) {
          const c = input[i]
          if (c === "(") depth++
          if (c === ")") depth--
          if ((c === "{" || c === ";") && depth <= 0) break
          prelude += c
          i++
        }
        if (name === "tailwind") {
          if (input[i] === ";") i++
          else if (input[i] === "{") {
            i++
            let d = 1
            while (i < input.length && d > 0) {
              if (input[i] === "{") d++
              else if (input[i] === "}") d--
              i++
            }
          }
          continue
        }
        out += `@${name}${prelude}`
        if (input[i] === ";") {
          out += ";"
          i++
          continue
        }
        if (input[i] === "{") {
          out += "{"
          i++
          if (name.startsWith("keyframes") || name === "font-face") {
            let d = 1
            while (i < input.length && d > 0) {
              if (input[i] === "{") d++
              else if (input[i] === "}") d--
              if (d > 0) out += input[i]
              else out += "}"
              i++
            }
          } else transformBlock(true)
        }
        continue
      }
      const selectorPart = readUntil(["{"])
      if (input[i] !== "{") break
      i++
      out += scopeSelectorList(selectorPart) + "{"
      let d = 1
      while (i < input.length && d > 0) {
        const c = input[i]
        if (c === "{") d++
        else if (c === "}") {
          d--
          if (d === 0) {
            out += "}"
            i++
            break
          }
        }
        if (d > 0) {
          out += c
          i++
        }
      }
    }
  }
  transformBlock(false)
  return out
}

const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])
const integrationCssPath = path.join(CLIENT, "public/assets/integration.css")
if (fs.existsSync(integrationCssPath)) {
  styles.push(fs.readFileSync(integrationCssPath, "utf8"))
}
let css = styles.join("\n\n")
css = css.replace(/url\((['"]?)\/?assets\//g, "url($1/performance-v22/assets/")
const scoped = scopeCss(css)
fs.writeFileSync(
  path.join(OUT_DIR, "performance-v22.css"),
  `/* Scoped Matanho Performance Management V22.1 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "performance-v22.css")).size)

// --- runtime ---
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
const inlineScripts = scripts
  .filter((m) => !/src=/.test(m[1]))
  .map((m) => m[2])
let code = inlineScripts[0] || ""
if (inlineScripts.length > 1) {
  code += "\nwindow.render = render;\nwindow.handle = handle;\nwindow.openDrawer = openDrawer;\nwindow.openDocument = openDocument;\n"
  code += inlineScripts.slice(1).join("\n;\n")
}
code = code.replace(
  /const \$=\(s,r=document\)=>r\.querySelector\(s\), \$\$=\(s,r=document\)=>\[\.\.\.r\.querySelectorAll\(s\)\];/,
  () =>
    "const $=(s,r=rootEl)=>((r&&r.querySelector)?r.querySelector(s):null)||document.querySelector(s), $$=(s,r=rootEl)=>[...((r&&r.querySelectorAll)?r.querySelectorAll(s):[])];"
)
code = code.replace(
  /const state=\{page:'dashboard'/,
  "const state={page:(typeof initialPage==='string'&&initialPage)?initialPage:'dashboard'"
)
code = code.replace(
  /const hash=location\.hash\.replace\('#',''\);if\([^;]+\)state\.page=hash;/,
  "/* Next owns the route; hash ignored */"
)
code = code.replace(/document\.querySelectorAll\('body \*'\)/g, "rootEl.querySelectorAll('*')")
code = code.replace(/document\.querySelectorAll\("body \*"\)/g, "rootEl.querySelectorAll('*')")
code = code.replace(
  /state\.page\s*=(?!=)\s*('[^']+'|"[^"]+"|[A-Za-z_][\w.]*)/g,
  "__setPm22Page($1)"
)
// Classic-script globals are function-scoped inside startPerformanceV22Runtime.
code = code.replace(
  /const baseRender=window\.render;/g,
  "const baseRender=window.render||render;"
)

const runtime = `/* Auto-extracted Matanho Performance Management V22.1 — adapted for Next.js */
export function startPerformanceV22Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'dashboard';
  window.__PERFORMANCE_V22_NAV__ = options.onNavigate || (() => {});
  window.MATANHO_CONFIG = window.MATANHO_CONFIG || Object.freeze({
    apiBaseUrl: '',
    appBasePath: '/performance-v22',
    authMode: 'cookie',
    enableBackendHydration: false,
    interceptMutations: false,
    requestTimeoutMs: 15000,
    debug: false,
  });

  rootEl.innerHTML = options.shellHtml || '';

  const __pm22Abort = new AbortController();
  const __pm22Sig = { signal: __pm22Abort.signal };
  let api = { setPage() {}, destroy() {} };

  let __pm22Ready = false;
  function __setPm22Page(p) {
    if (typeof p !== 'string' || !p) return;
    state.page = p;
    if (__pm22Ready && typeof window.__PERFORMANCE_V22_NAV__ === 'function') {
      window.__PERFORMANCE_V22_NAV__(p);
    }
  }

${code}

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();
  __pm22Ready = true;

  api = {
    setPage(page) {
      if (!page) return;
      if (typeof canPage === 'function' && !canPage(page)) return;
      state.page = page;
      if (typeof render === 'function') render();
      try { $('#app')?.classList?.remove('mobile-nav'); } catch (_) {}
    },
    destroy() {
      try { __pm22Abort.abort(); } catch (_) {}
      delete window.__PERFORMANCE_V22_NAV__;
      rootEl.innerHTML = '';
    },
  };
  return api;
}
`

function injectSignal(src) {
  const types = ["click", "change", "input", "keydown", "submit", "keyup"]
  let out = src
  for (const type of types) {
    for (const quote of ["'", '"']) {
      const s = `document.addEventListener(${quote}${type}${quote},`
      let idx = 0
      while ((idx = out.indexOf(s, idx)) !== -1) {
        let j = idx + s.length
        const brace = out.indexOf("{", j)
        if (brace < 0) break
        let depth = 0
        let k = brace
        for (; k < out.length; k++) {
          if (out[k] === "{") depth++
          else if (out[k] === "}") {
            depth--
            if (depth === 0) {
              k++
              break
            }
          }
        }
        const after = out.slice(k, k + 24)
        if (after.startsWith(", __pm22Sig)") || after.startsWith(",__pm22Sig)")) {
          idx = k + 1
          continue
        }
        if (out[k] === ")") {
          out = out.slice(0, k) + ", __pm22Sig" + out.slice(k)
          idx = k + 14
        } else idx = k + 1
      }
    }
  }
  return out
}

let rt = injectSignal(runtime)
fs.writeFileSync(path.join(OUT_DIR, "matanho-performance-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-performance-runtime.js")).size)
console.log("nav bridge", rt.includes("__PERFORMANCE_V22_NAV__"))
console.log("setPage helper", rt.includes("__setPm22Page"))

// --- nav map ---
const pages = [
  ["dashboard", "/performance-v22", "Command Centre"],
  ["strategy", "/performance-v22/strategy", "Company Strategy"],
  ["scorecards", "/performance-v22/scorecards", "Scorecards"],
  ["objectives", "/performance-v22/objectives", "Objectives & KPIs"],
  ["tasks", "/performance-v22/tasks", "Tasks & Projects"],
  ["reviews", "/performance-v22/reviews", "Performance Reviews"],
  ["corrective", "/performance-v22/corrective", "Corrective Actions"],
  ["reports", "/performance-v22/reports", "Reports & Compliance"],
  ["vault", "/performance-v22/vault", "Document Vault"],
  ["alerts", "/performance-v22/alerts", "Alerts & Audit"],
  ["access", "/performance-v22/access", "Access & Settings"],
  ["departments", "/performance-v22/departments", "Departments"],
  ["integrations", "/performance-v22/integrations", "Integrations"],
  ["kpiAnalytics", "/performance-v22/kpi-analytics", "KPI Analytics"],
  ["timesheets", "/performance-v22/timesheets", "Timesheets"],
]

const navTs = `/** Performance V22 page id → Next path */
export const PM22_PAGE_TO_PATH: Record<string, string> = {
${pages.map(([id, p]) => `  '${id}': '${p}',`).join("\n")}
}

export const PM22_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PM22_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPm22Page(pathname: string): string {
  if (pathname in PM22_PATH_TO_PAGE) return PM22_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/performance-v22/')) {
    const seg = pathname.replace('/performance-v22/', '').split('/')[0]
    if (seg === 'kpi-analytics') return 'kpiAnalytics'
    if (seg && PM22_PAGE_TO_PATH[seg]) return seg
  }
  return 'dashboard'
}

export const PM22_NAV_PAGES = [
${pages.map(([id, p, name]) => `  { id: 'pm22-${id}', page: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)

const pageTpl = (label) => `/** Public fixture preview — no ModuleGuard (middleware pass-through). */
export default function Page() {
  return <span>${label}</span>
}
`

fs.writeFileSync(path.join(APP_DIR, "page.tsx"), pageTpl("Performance V22"))
fs.writeFileSync(
  path.join(APP_DIR, "layout.tsx"),
  `"use client"

import type { ReactNode } from "react"
import { PerformanceV22Layout } from "@/components/layout/performance-v22-layout"

export default function PerformanceV22RootLayout({ children }: { children: ReactNode }) {
  return <PerformanceV22Layout>{children}</PerformanceV22Layout>
}
`
)

for (const [id, p, name] of pages) {
  if (id === "dashboard") continue
  const rel = p.replace("/performance-v22/", "")
  const dir = path.join(APP_DIR, rel)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "page.tsx"), pageTpl(name))
}

console.log("done")
