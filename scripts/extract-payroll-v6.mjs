/**
 * Extract Matanho Payroll HR V6 for Mode A Next.js port (payroll-v6).
 */
import fs from "fs"
import path from "path"

const CLIENT = "C:/Users/lysp/Downloads/Matanho_Payroll_HR_Deploy_v6"
const ROOT = "payroll-v6-root"
const OUT_DIR = "components/payroll-v6-mock"
const LIB_DIR = "lib/payroll-v6-mock"
const PUBLIC_ASSETS = "public/payroll-v6/assets"

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })
fs.mkdirSync(path.join(PUBLIC_ASSETS, "portraits"), { recursive: true })

// --- assets ---
const pubAssets = path.join(CLIENT, "public/assets")
if (fs.existsSync(pubAssets)) {
  for (const f of fs.readdirSync(pubAssets)) {
    const p = path.join(pubAssets, f)
    if (fs.statSync(p).isFile()) fs.copyFileSync(p, path.join(PUBLIC_ASSETS, f))
  }
}
const portraits = path.join(CLIENT, "public/assets/portraits")
if (fs.existsSync(portraits)) {
  for (const f of fs.readdirSync(portraits)) {
    fs.copyFileSync(path.join(portraits, f), path.join(PUBLIC_ASSETS, "portraits", f))
  }
}
console.log("assets ok")

// --- shell ---
const indexHtml = fs.readFileSync(path.join(CLIENT, "index.html"), "utf8")
let shell = indexHtml
  .replace(/[\s\S]*?(<div class="app" id="app">)/, "$1")
  .replace(/<script[\s\S]*$/i, "")
  .trim()
// include overlays that sit outside #app
const outside = indexHtml.match(/<\/div>\s*(<div class="drawer-backdrop"[\s\S]*?<div class="toast-stack"[^>]*>[\s\S]*?<\/div>)/)
if (outside) {
  // shell currently ends with closing #app - rebuild from body contents without scripts
  const body = indexHtml.match(/<body>([\s\S]*)<\/body>/i)
  if (body) {
    shell = body[1]
      .replace(/<script[\s\S]*/i, "")
      .trim()
  }
}
shell = shell.replace(/\u2318/g, "Cmd")
fs.writeFileSync(path.join(OUT_DIR, "shell.html"), shell)
fs.writeFileSync(
  path.join(OUT_DIR, "shell.ts"),
  `export const PAYROLL_V6_SHELL_HTML = ${JSON.stringify(shell)};\n`
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
        // Theme attrs live on the module root, not a descendant
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

let css = fs.readFileSync(path.join(CLIENT, "src/styles.css"), "utf8")
css = css.replace(/url\((['"]?)\/?assets\//g, "url($1/payroll-v6/assets/")
// Client typo: truncated transition value
css = css.replace(
  /transition:transform \.15s,border-color \.15s;background \.15s/g,
  "transition:transform .15s,border-color .15s,background .15s"
)
const scoped = scopeCss(css)
fs.writeFileSync(
  path.join(OUT_DIR, "payroll-v6.css"),
  `/* Scoped Matanho Payroll HR V6 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "payroll-v6.css")).size)

// --- runtime ---
let code = fs.readFileSync(path.join(CLIENT, "src/payroll-ui.js"), "utf8")

// theme on module root
code = code.replace(
  /document\.documentElement\.dataset\.theme\s*=\s*/g,
  "rootEl.dataset.theme = document.documentElement.dataset.theme = "
)

// honor Next initial page before first paint
code = code.replace(
  /const state=\{page:'overview'/,
  "const state={page:(typeof initialPage==='string'&&initialPage)?initialPage:'overview'"
)

// goPage → Next bridge
code = code.replace(
  /function goPage\(id\)\{if\(!permittedPage\(id\)\)\{deny\(pagePermission\[id\]\|\|'workspace access'\);return\}state\.page=id;render\(\);\$\('#app'\)\.classList\.remove\('mobile-nav'\);closeDrawer\(\);closeModal\(\);closeCommand\(\)\}/,
  `function goPage(id){if(!permittedPage(id)){deny(pagePermission[id]||'workspace access');return}state.page=id;if(typeof window.__PAYROLL_V6_NAV__==='function')window.__PAYROLL_V6_NAV__(id);render();$('#app').classList.remove('mobile-nav');closeDrawer();closeModal();closeCommand()}`
)

// Also catch if formatting differs slightly
if (!code.includes("__PAYROLL_V6_NAV__")) {
  code = code.replace(
    "function goPage(id){if(!permittedPage(id)){deny(pagePermission[id]||'workspace access');return}state.page=id;render();",
    "function goPage(id){if(!permittedPage(id)){deny(pagePermission[id]||'workspace access');return}state.page=id;if(typeof window.__PAYROLL_V6_NAV__==='function')window.__PAYROLL_V6_NAV__(id);render();"
  )
}

const runtime = `/* Auto-extracted Matanho Payroll HR V6 — adapted for Next.js */
export function startPayrollV6Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'overview';
  window.__PAYROLL_V6_NAV__ = options.onNavigate || (() => {});
  if (!window.safeStorage) {
    window.safeStorage = {
      getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
      setItem: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
      removeItem: (k) => { try { localStorage.removeItem(k); } catch {} },
    };
  }
  window.__MATANHO_CONFIG__ = window.__MATANHO_CONFIG__ || { useMocks: true, environment: 'preview' };

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = rootEl.dataset.theme || 'light';

  const __pr6Abort = new AbortController();
  const __pr6Sig = { signal: __pr6Abort.signal };
  let api = { setPage() {}, destroy() {} };
  // Client assigns vendorsPage later without a prior declaration (works as
  // implicit global in classic scripts; must be declared in module/function scope).
  let vendorsPage;

${code}

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();

  api = {
    setPage(page) {
      if (typeof permittedPage === 'function' && !permittedPage(page)) return;
      state.page = page;
      if (typeof render === 'function') render();
      try { $('#app')?.classList?.remove('mobile-nav'); } catch (_) {}
      try { closeDrawer(); closeModal(); closeCommand(); } catch (_) {}
    },
    destroy() {
      try { __pr6Abort.abort(); } catch (_) {}
      delete window.__PAYROLL_V6_NAV__;
      try { delete window.MatanhoUI; } catch (_) {}
      rootEl.innerHTML = '';
    },
  };
  return api;
}
`

function injectSignal(src) {
  const types = ["click", "change", "input", "keydown", "submit"]
  let out = src
  for (const type of types) {
    const start = `document.addEventListener('${type}',`
    const start2 = `document.addEventListener("${type}",`
    for (const s of [start, start2, `document.addEventListener('${type}', `]) {
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
        if (after.startsWith(", __pr6Sig)") || after.startsWith(",__pr6Sig)")) {
          idx = k + 1
          continue
        }
        if (out[k] === ")") {
          out = out.slice(0, k) + ", __pr6Sig" + out.slice(k)
          idx = k + 12
        } else idx = k + 1
      }
    }
  }
  return out
}

let rt = injectSignal(runtime)
fs.writeFileSync(path.join(OUT_DIR, "matanho-payroll-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-payroll-runtime.js")).size)
console.log("nav bridge", rt.includes("__PAYROLL_V6_NAV__"))

// --- nav map ---
const pages = [
  ["overview", "/payroll-v6", "Command Centre"],
  ["employees", "/payroll-v6/employees", "Employees"],
  ["onboarding", "/payroll-v6/onboarding", "Onboarding"],
  ["runs", "/payroll-v6/runs", "Payroll Runs"],
  ["inputs", "/payroll-v6/inputs", "Inputs & Validation"],
  ["exceptions", "/payroll-v6/exceptions", "Exception Workbench"],
  ["approvals", "/payroll-v6/approvals", "Maker-Checker Review"],
  ["close", "/payroll-v6/close", "Close & Distribution"],
  ["components", "/payroll-v6/components", "Earnings & Deductions"],
  ["calendar", "/payroll-v6/calendar", "Pay Groups & Calendar"],
  ["tax", "/payroll-v6/tax", "Tax & Statutory Rules"],
  ["training", "/payroll-v6/training", "Training & Compliance"],
  ["leave", "/payroll-v6/leave", "Leave & Benefits"],
  ["vendors", "/payroll-v6/vendors", "Vendors & Quotations"],
  ["vault", "/payroll-v6/vault", "Document Vault"],
  ["reports", "/payroll-v6/reports", "Compliance Reports"],
  ["audit", "/payroll-v6/audit", "Audit Trail"],
  ["access", "/payroll-v6/access", "Roles & Access Control"],
  ["settings", "/payroll-v6/settings", "Settings & Integrations"],
  ["mypay", "/payroll-v6/mypay", "My Pay"],
]

const navTs = `/** Payroll V6 page id → Next path */
export const PR6_PAGE_TO_PATH: Record<string, string> = {
${pages.map(([id, p]) => `  '${id}': '${p}',`).join("\n")}
}

export const PR6_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PR6_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPr6Page(pathname: string): string {
  if (pathname in PR6_PATH_TO_PAGE) return PR6_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/payroll-v6/')) {
    const seg = pathname.replace('/payroll-v6/', '').split('/')[0]
    if (seg && PR6_PAGE_TO_PATH[seg]) return seg
  }
  return 'overview'
}

export const PR6_NAV_PAGES = [
${pages.map(([id, p, name], i) => `  { id: 'pr6-${id}', page: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)
console.log("done")
