import fs from "fs"
import path from "path"

const CLIENT =
  process.env.PM245_CLIENT_PACKAGE ||
  "C:/Users/lysp/Downloads/Matanho_Performance_Management_v24_5_Dynamic_RBAC_Settings-20260901T221848Z-1-001/Matanho_Performance_Management_v24_5_Dynamic_RBAC_Settings"
const INDEX = path.join(CLIENT, "Matanho_Performance_Management_Interactive_v24_5_Dynamic_RBAC_Settings.html")
const ROOT = "performance-v22-root"
const OUT_DIR = "components/performance-v22-mock"
const LIB_DIR = "lib/performance-v22-mock"
const PUBLIC_ASSETS = "public/performance-v22/assets"

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })

const html = fs.readFileSync(INDEX, "utf8")

// --- assets (4 external scripts referenced but NOT in source package; create empty stubs) ---
const pubSrc = path.join(CLIENT, "public")
const stubFiles = [
  "runtime-config.js",
  path.join("assets", "api-client.js"),
  path.join("assets", "services.js"),
  path.join("assets", "backend-bridge.js"),
]

for (const rel of stubFiles) {
  const srcFile = path.join(pubSrc, rel)
  const dstFile = path.join("public/performance-v22", rel)
  const dstDir = path.dirname(dstFile)
  fs.mkdirSync(dstDir, { recursive: true })
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, dstFile)
  } else {
    fs.writeFileSync(dstFile, "/* stub — source package did not include this file */\n")
  }
}
console.log("assets ok")

// --- shell ---
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
if (!bodyMatch) throw new Error("no body found")
let shell = bodyMatch[1]
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .trim()
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
  .trim()

// strip inner topbar (lines 396-422 in v24.5 source)
shell = shell.replace(/<header class="topbar">[\s\S]*?<\/header>/, "<!-- inner topbar removed; outer SharedTopbar used -->")
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
  `/* Scoped Matanho Performance Management V24.5 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "performance-v22.css")).size)

// --- runtime ---
const scriptRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi
const scriptMatches = [...html.matchAll(scriptRe)]
const inlineScripts = scriptMatches
  .filter((m) => !/src=/.test(m[1]))
  .map((m) => m[2])

let code = inlineScripts[0] || ""
if (inlineScripts.length > 1) {
  code += "\nwindow.render = render;\nwindow.handle = handle;\nwindow.openDrawer = openDrawer;\nwindow.openDocument = openDocument;\n"
  code += inlineScripts.slice(1).join("\n;\n")
}

// rewrites (same as v22 extractor)
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
// These legacy aliases redirect away from fully registered V8 workspaces.
// In Next they also race the pathname bridge and can land on the fallback UI.
code = code.replace(
  /^\s*if\(state\.page==='(?:themes|kpiAnalytics|bscPillars)'\)\{[^\r\n]*\}\r?$/gm,
  ""
)
code = code.replace(/document\.querySelectorAll\('body \*'\)/g, "rootEl.querySelectorAll('*')")
code = code.replace(/document\.querySelectorAll\("body \*"\)/g, "rootEl.querySelectorAll('*')")
// Several historical revisions force the rail closed during initialization.
// This comparison route defaults to the full navigation, while the collapse
// control remains available through its existing classList.toggle handler.
code = code.replace(/\.classList\.remove\('expanded'\)/g, ".classList.add('expanded')")
code = code.replace(/state\.sidebar=false/g, "state.sidebar=true")
code = code.replace(
  /state\.page\s*=(?!=)\s*('[^']+'|"[^"]+"|[A-Za-z_][\w.]*)/g,
  "__setPm22Page($1)"
)
// Classic inline scripts keep a top-level `render` binding and `window.render`
// synchronized automatically. Once hosted inside this module function they
// diverge, so every later patch must wrap the live lexical renderer and publish
// the new wrapper back to `window.render`.
code = code.replace(/const baseRender=window\.render;/g, "const baseRender=render;")
code = code.replace(/const baseRender=window\.render\|\|render;/g, "const baseRender=render;")
code = code.replace(/const renderBase=window\.render\|\|render;/g, "const renderBase=render;")
code = code.replace(/const renderBase=window\.render;/g, "const renderBase=render;")
code = code.replace(/const renderPrev=window\.render\|\|render;/g, "const renderPrev=render;")
code = code.replace(/const prevRender=window\.render\|\|render;/g, "const prevRender=render;")
code = code.replace(/window\.render=function/g, "window.render=render=function")
// The source passes this dynamic heading as a quoted string inside a template
// expression, which displays `${ts.week}` literally rather than its value.
code = code.replace("'Weekly Timesheet — ${ts.week}'", "'Weekly Timesheet — '+ts.week")
// The V22 cleanup removes the depth bar that V10 uses as its insertion anchor.
// Materialize the approved banner first, then remove the now-redundant bar.
code = code.replace(
  "function removeGenericIntelligenceLaunchClutter(){",
  "function removeGenericIntelligenceLaunchClutter(){\n  window.MatanhoSignatureV9?.refresh?.();\n  window.MatanhoSignatureV10?.refresh?.();"
)
// V10 is the approved command-centre composition used by this comparison
// route. Preserve its V8 dashboard renderer while allowing all subsequent
// source revisions to contribute their richer non-dashboard workspaces.
code = code.replace(
  /(window\.MatanhoSignatureV10=Object\.freeze\(\{decisionRoom:room,closeDecisionRoom:closeRoom\}\);\s*\}\)\(\);)/,
  "$1\nconst __pm22ApprovedDashboard=dashboard;"
)
// Publish the two visual decorator passes so the final Next renderer can run
// them after later source revisions finish their asynchronous cleanup.
code = code.replace(
  "close:closeLayer});",
  "close:closeLayer,refresh:enrich});"
)
code = code.replace(
  "window.MatanhoSignatureV10=Object.freeze({decisionRoom:room,closeDecisionRoom:closeRoom});",
  "window.MatanhoSignatureV10=Object.freeze({decisionRoom:room,closeDecisionRoom:closeRoom,refresh:enrich10});"
)

const runtime = `/* Auto-extracted Matanho Performance Management V24.5 — adapted for Next.js */
import {
  applySessionUserToProfile,
  buildArcusProfilePopoverHtml,
  clientDesignSignOut,
  getClientDesignSessionUser,
  onClientDesignSessionUser,
} from "@/components/client-design-mock/runtime-auth";
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
  (function pm22EnsureExpanded(){const a=rootEl.querySelector('#app');if(a){a.classList.add('expanded');}})();

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

  if (typeof __pm22ApprovedDashboard === 'function') {
    dashboard = __pm22ApprovedDashboard;
  }
  // Later cleanup intentionally removes the generic intelligence rail. Run
  // the approved V9/V10 decorators once more after that cleanup so the V10
  // executive banner remains, then discard only its temporary insertion rail.
  const __pm22RenderWithApprovedDashboard = render;
  render = function () {
    const output = __pm22RenderWithApprovedDashboard.apply(this, arguments);
    if (state.page === 'dashboard') {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        window.MatanhoSignatureV9?.refresh?.();
        window.MatanhoSignatureV10?.refresh?.();
        rootEl.querySelectorAll('.sig-depthbar,.sig-card-tool').forEach((node) => node.remove());
      })));
    }
    return output;
  };
  window.render = render;

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();
  __pm22Ready = true;

  const __pm22SessionOff = onClientDesignSessionUser(() => applySessionUserToProfile(rootEl))

  api = {
    setPage(page) {
      if (!page) return;
      if (typeof canPage === 'function' && !canPage(page)) return;
      state.page = page;
      if (typeof render === 'function') render();
      try { $('#app')?.classList?.remove('mobile-nav'); } catch (_) {}
    },
    destroy() {
      try { __pm22SessionOff?.() } catch (_) {}
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

// Next.js Arcus session bridge
if (!rt.includes("function openUserMenu")) {
  rt = rt.replace(
    /function search\(\)/,
    `function openUserMenu(anchor){
  const sessionUser=getClientDesignSessionUser();
  const person=sessionUser?.name||(typeof rolePerson!=='undefined'&&rolePerson[state.role])||'Tariro Moyo';
  const r=(anchor&&anchor.getBoundingClientRect)?anchor.getBoundingClientRect():{bottom:56,right:innerWidth-20};
  const p=document.createElement('div');p.className='popover';p.style.top=(r.bottom+8)+'px';p.style.right=Math.max(16,innerWidth-r.right)+'px';p.style.position='fixed';p.style.zIndex='120';
  p.innerHTML=buildArcusProfilePopoverHtml(sessionUser||{name:person,email:sessionUser?.email||'',role:sessionUser?.role||state.role,initials:sessionUser?.initials||person.split(/\\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()},icon('users'));
  $('#popoverLayer').innerHTML='';$('#popoverLayer').appendChild(p);
}
function search()`
  )
}

// v24.5 uses toggleProfileMenu() instead of toast('User profile',...); replace both variants
rt = rt.replace(
  `'user-menu':()=>toast('User profile','Identity, delegated authority and access scope are centrally managed.'),`,
  `'user-menu':()=>openUserMenu(el),\n  'client-design-sign-out':()=>{closeOverlays();clientDesignSignOut()},`
)
rt = rt.replace(
  `'user-menu':()=>toggleProfileMenu(),`,
  `'user-menu':()=>openUserMenu(el),\n  'client-design-sign-out':()=>{closeOverlays();clientDesignSignOut()},`
)

rt = rt.replace(
  /function openApps\(anchor\)\{const r=anchor\.getBoundingClientRect\(\)/,
  `function openApps(_anchor){if(typeof window.__openArcusAppSwitcher==='function'){window.__openArcusAppSwitcher();return;}const r=(_anchor&&_anchor.getBoundingClientRect)?_anchor.getBoundingClientRect():{bottom:56}`
)
if (!rt.includes("'module-switcher'")) {
  rt = rt.replace(
    `'apps':()=>openApps(el),`,
    `'apps':()=>openApps(el),'module-switcher':()=>openApps(el),`
  )
}
rt = rt.replace(
  / w\.innerHTML=pages\[state\.page\]\(\); wireIcons\(\); w\.scrollTop=0;/,
  ' const __pageFn=pages[state.page];if(typeof __pageFn===\'function\'){w.innerHTML=__pageFn();}else{w.innerHTML=`<div class="page">${pageHead(\'Unavailable\',String(state.page||\'Unknown\'),\'This workspace page is not registered in the current build.\')}</div>`;console.warn(\'[performance-v22] missing page renderer\',state.page);}wireIcons(); w.scrollTop=0;'
)

fs.writeFileSync(path.join(OUT_DIR, "matanho-performance-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-performance-runtime.js")).size)
console.log("nav bridge", rt.includes("__PERFORMANCE_V22_NAV__"))
console.log("setPage helper", rt.includes("__setPm22Page"))

// --- nav map (unchanged from v22 — covers all v24.5 direct routes) ---
const pages = [
  ["dashboard", "/performance-v22", "Command Centre"],
  ["strategy", "/performance-v22/strategy", "Company Strategy"],
  ["themes", "/performance-v22/themes", "Strategic Themes"],
  ["risks", "/performance-v22/risks", "Risks & Assumptions"],
  ["scorecards", "/performance-v22/scorecards", "Scorecards"],
  ["objectives", "/performance-v22/objectives", "Objectives & KPIs"],
  ["tasks", "/performance-v22/tasks", "Tasks & Projects"],
  ["contracts", "/performance-v22/contracts", "Performance Contracts"],
  ["reviews", "/performance-v22/reviews", "Performance Reviews"],
  ["corrective", "/performance-v22/corrective", "Corrective Actions"],
  ["reports", "/performance-v22/reports", "Reports & Compliance"],
  ["vault", "/performance-v22/vault", "Document Vault"],
  ["alerts", "/performance-v22/alerts", "Alerts & Audit"],
  ["access", "/performance-v22/access", "Access & Settings"],
  ["departments", "/performance-v22/departments", "Departments"],
  ["integrations", "/performance-v22/integrations", "Integrations"],
  ["kpiAnalytics", "/performance-v22/kpi-analytics", "KPI Analytics"],
  ["kpiManagement", "/performance-v22/kpi-management", "KPI Management"],
  ["bscPillars", "/performance-v22/bsc-pillars", "BSC Pillars"],
  ["performanceReports", "/performance-v22/performance-reports", "Performance Reports"],
  ["adHocReports", "/performance-v22/ad-hoc-reports", "Ad-hoc Reports"],
  ["scheduledReports", "/performance-v22/scheduled-reports", "Scheduled Reports"],
  ["reportHistory", "/performance-v22/report-history", "Report History"],
  ["settings", "/performance-v22/settings", "Settings"],
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
    const directMatch = Object.entries(PM22_PAGE_TO_PATH).find(([, path]) => path === \`/performance-v22/\${seg}\`)
    if (directMatch) return directMatch[0]
  }
  return 'dashboard'
}

export const PM22_NAV_PAGES = [
${pages.map(([id, p, name]) => `  { id: 'pm22-${id}', page: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)

console.log("done")
