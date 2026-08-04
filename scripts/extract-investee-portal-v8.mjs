/**
 * Extract Matanho Investee Portal V8 for Mode A Next.js port (investee-portal-v8).
 */
import fs from "fs"
import path from "path"

const CLIENT = "C:/Users/lysp/Downloads/Matanho_Investee_Portal_Production_v8"
const ROOT = "investee-portal-v8-root"
const OUT_DIR = "components/investee-portal-v8-mock"
const LIB_DIR = "lib/investee-portal-v8-mock"
const PUBLIC_ASSETS = "public/investee-portal-v8/assets"

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })

// --- assets ---
for (const dir of [
  path.join(CLIENT, "assets"),
  path.join(CLIENT, "public/assets"),
  path.join(CLIENT, "dist/assets"),
]) {
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isFile() && /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(f)) {
      fs.copyFileSync(p, path.join(PUBLIC_ASSETS, f))
    }
  }
}
console.log("assets", fs.readdirSync(PUBLIC_ASSETS))

// --- shell ---
const indexHtml = fs.readFileSync(path.join(CLIENT, "index.html"), "utf8")
const body = indexHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
if (!body) throw new Error("body not found")
let shell = body[1]
  .replace(/<script[\s\S]*$/i, "")
  .trim()
shell = shell.replace(/\.\/assets\//g, "/investee-portal-v8/assets/")
shell = shell.replace(/\u2318/g, "Cmd")
fs.writeFileSync(path.join(OUT_DIR, "shell.html"), shell)
fs.writeFileSync(
  path.join(OUT_DIR, "shell.ts"),
  `export const INVESTEE_PORTAL_V8_SHELL_HTML = ${JSON.stringify(shell)};\n`
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
        if (sel === ":root" || sel === "html" || sel === "body" || sel === ":host") return root
        if (sel.startsWith(root)) return sel
        if (sel.startsWith("html[")) return root + sel.slice(4)
        if (sel.startsWith("body[")) return root + sel.slice(4)
        if (sel.startsWith(":root")) return root + sel.slice(5)
        if (sel.startsWith(":host")) return root + sel.slice(5)
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
        out += input.slice(i, end + 2)
        i = end + 2
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
        if (name === "tailwind" || (name === "layer" && prelude.trim() === "properties")) {
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
          if (name.startsWith("keyframes") || name === "font-face" || name === "property") {
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

const cssPath = fs.existsSync(path.join(CLIENT, "src/styles/app.css"))
  ? path.join(CLIENT, "src/styles/app.css")
  : path.join(CLIENT, "dist/assets/app.css")
let css = fs.readFileSync(cssPath, "utf8")
css = css.replace(/url\((['"]?)\.?\/?assets\//g, "url($1/investee-portal-v8/assets/")
const scoped = scopeCss(css)
fs.writeFileSync(
  path.join(OUT_DIR, "investee-portal-v8.css"),
  `/* Scoped Matanho Investee Portal V8 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "investee-portal-v8.css")).size)

// --- runtime ---
let code = fs.readFileSync(path.join(CLIENT, "src/scripts/app.js"), "utf8")

// Theme on module root (CSS scopes body[data-theme] → .root[data-theme])
code = code.replace(
  /document\.body\.dataset\.theme\s*=\s*/g,
  "rootEl.dataset.theme = document.body.dataset.theme = "
)
code = code.replace(
  /getComputedStyle\(document\.body\)/g,
  "getComputedStyle(rootEl)"
)

// Honor Next initial page
code = code.replace(
  /const state=\{page:\(\(location\.hash\|\|'#dashboard'\)\.slice\(1\)==='integrations'\?'dashboard':\(location\.hash\|\|'#dashboard'\)\.slice\(1\)\)/,
  "const state={page:(typeof initialPage==='string'&&initialPage&&initialPage!=='integrations')?initialPage:'dashboard'"
)

// Navigate → Next bridge (don't write hash)
code = code.replace(
  /function navigate\(page\)\{if\(!pages\[page\]\)return;state\.page=page;\$\('#app'\)\.classList\.remove\('mobile-open'\);closeOverlays\(\);render\(\)\}/,
  `function navigate(page){if(!pages[page])return;state.page=page;if(typeof window.__INVESTEE_V8_NAV__==='function')window.__INVESTEE_V8_NAV__(page);$('#app').classList.remove('mobile-open');closeOverlays();render()}`
)

// Stop hash history writes / hashchange (Next owns URLs)
code = code.replace(
  /history\.replaceState\(null,'',`#\$\{state\.page\}`\);/g,
  ""
)
code = code.replace(
  /window\.addEventListener\('hashchange',\(\)=>\{const p=location\.hash\.slice\(1\);if\(p&&pages\[p\]\)\{state\.page=p;render\(\)\}\}\);/,
  "/* hashchange disabled — Next owns routing */"
)

// Asset paths in any remaining relative refs
code = code.replace(/\.\/assets\//g, "/investee-portal-v8/assets/")

const runtime = `/* Auto-extracted Matanho Investee Portal V8 — adapted for Next.js */
export function startInvesteePortalV8Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'dashboard';
  window.__INVESTEE_V8_NAV__ = options.onNavigate || (() => {});
  window.MATANHO_CONFIG = Object.assign({
    apiBaseUrl: '',
    apiPrefix: '/api/v1/investee-portal',
    useMockData: true,
    credentials: 'include',
    authToken: '',
    csrfToken: '',
    requestTimeoutMs: 20000,
    debug: false,
  }, window.MATANHO_CONFIG || {}, { useMockData: true });

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = rootEl.dataset.theme || 'light';

  const __ip8Abort = new AbortController();
  const __ip8Sig = { signal: __ip8Abort.signal };
  let api = { setPage() {}, destroy() {} };

${code}

  if (typeof state !== 'undefined' && initialPage && pages[initialPage]) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();

  api = {
    setPage(page) {
      if (!pages[page]) return;
      state.page = page;
      if (typeof render === 'function') render();
      try { $('#app')?.classList?.remove('mobile-open'); } catch (_) {}
      try { closeOverlays(); } catch (_) {}
    },
    destroy() {
      try { __ip8Abort.abort(); } catch (_) {}
      delete window.__INVESTEE_V8_NAV__;
      try { delete window.MatanhoPortal; } catch (_) {}
      rootEl.innerHTML = '';
    },
  };
  return api;
}
`

function injectSignal(src) {
  const types = ["click", "change", "input", "keydown", "submit", "focusin"]
  let out = src
  for (const type of types) {
    for (const s of [
      `document.addEventListener('${type}',`,
      `document.addEventListener("${type}",`,
      `window.addEventListener('${type}',`,
      `window.addEventListener("${type}",`,
    ]) {
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
        const after = out.slice(k, k + 20)
        if (after.startsWith(", __ip8Sig)") || after.startsWith(",__ip8Sig)")) {
          idx = k + 1
          continue
        }
        if (out[k] === ")") {
          out = out.slice(0, k) + ", __ip8Sig" + out.slice(k)
          idx = k + 12
        } else idx = k + 1
      }
    }
  }
  return out
}

let rt = injectSignal(runtime)
fs.writeFileSync(path.join(OUT_DIR, "matanho-investee-portal-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-investee-portal-runtime.js")).size)
console.log("nav bridge", rt.includes("__INVESTEE_V8_NAV__"))

const pages = [
  ["dashboard", "/investee-portal-v8", "Overview"],
  ["kpis", "/investee-portal-v8/kpis", "KPI Centre"],
  ["reports", "/investee-portal-v8/reports", "Reporting Centre"],
  ["forecasts", "/investee-portal-v8/forecasts", "Forecast Model"],
  ["terms", "/investee-portal-v8/terms", "Term Sheet"],
  ["cap-table", "/investee-portal-v8/cap-table", "Cap Table"],
  ["governance", "/investee-portal-v8/governance", "Governance"],
  ["signatures", "/investee-portal-v8/signatures", "Signatures"],
  ["requests", "/investee-portal-v8/requests", "Capital & Procurement"],
  ["data-room", "/investee-portal-v8/data-room", "Document Vault"],
  ["messages", "/investee-portal-v8/messages", "Messages"],
  ["team", "/investee-portal-v8/team", "Team & Access"],
  ["settings", "/investee-portal-v8/settings", "Settings"],
]

const navTs = `/** Investee Portal V8 page id → Next path */
export const IP8_PAGE_TO_PATH: Record<string, string> = {
${pages.map(([id, p]) => `  '${id}': '${p}',`).join("\n")}
}

export const IP8_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(IP8_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToIp8Page(pathname: string): string {
  if (pathname in IP8_PATH_TO_PAGE) return IP8_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/investee-portal-v8/')) {
    const seg = pathname.replace('/investee-portal-v8/', '').split('/')[0]
    if (seg && IP8_PAGE_TO_PATH[seg]) return seg
  }
  return 'dashboard'
}

export const IP8_NAV_PAGES = [
${pages.map(([id, p, name]) => `  { id: 'ip8-${id}', page: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)
console.log("done")
