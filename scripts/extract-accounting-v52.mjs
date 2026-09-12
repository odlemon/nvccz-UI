/**
 * Extract Matanho Accounting V52 for Mode A Next.js port (accounting-v52).
 */
import fs from "fs"
import path from "path"

const CLIENT_HTML =
  "C:/Users/lysp/Downloads/Accounting FE/Matanho_Accounting_V52.html"
const ROOT = "accounting-v52-root"
const OUT_DIR = "components/accounting-v52-mock"
const LIB_DIR = "lib/accounting-v52-mock"

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })

const html = fs.readFileSync(CLIENT_HTML, "utf8")

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

function extractStyles(source) {
  const styles = []
  const re = /<style(?:[^>]*)>([\s\S]*?)<\/style>/gi
  let m
  while ((m = re.exec(source)) !== null) styles.push(m[1])
  return styles.join("\n\n")
}

function extractScripts(source) {
  const body = source.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || ""
  const scripts = []
  const re = /<script(?:[^>]*)>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(body)) !== null) scripts.push(m[1])
  return scripts.join("\n\n")
}

function extractShell(source) {
  const body = source.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || ""
  return body.replace(/<script[\s\S]*$/i, "").trim().replace(/\u2318/g, "Cmd")
}

function injectSignal(src) {
  const types = ["click", "change", "input", "keydown", "submit"]
  let out = src
  for (const type of types) {
    for (const start of [
      `document.addEventListener('${type}',`,
      `document.addEventListener("${type}",`,
      `document.addEventListener('${type}', `,
    ]) {
      let idx = 0
      while ((idx = out.indexOf(start, idx)) !== -1) {
        let j = idx + start.length
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
        if (after.startsWith(", __ac52Sig)") || after.startsWith(",__ac52Sig)")) {
          idx = k + 1
          continue
        }
        if (out[k] === ")") {
          out = out.slice(0, k) + ", __ac52Sig" + out.slice(k)
          idx = k + 12
        } else idx = k + 1
      }
    }
  }
  return out
}

// --- CSS ---
let css = extractStyles(html)
const scoped = scopeCss(css)
fs.writeFileSync(
  path.join(OUT_DIR, "accounting-v52.css"),
  `/* Scoped Matanho Accounting V52 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "accounting-v52.css")).size)

// --- shell ---
const shell = extractShell(html)
fs.writeFileSync(path.join(OUT_DIR, "shell.html"), shell)
fs.writeFileSync(
  path.join(OUT_DIR, "shell.ts"),
  `export const ACCOUNTING_V52_SHELL_HTML = ${JSON.stringify(shell)};\n`
)
console.log("shell", shell.length)

// --- runtime ---
let code = extractScripts(html)

code = code.replace(
  /const \$=s=>document\.querySelector\(s\), \$\$=s=>\[\.\.\.document\.querySelectorAll\(s\)\]/,
  () => "const $=s=>rootEl.querySelector(s), $$=s=>[...rootEl.querySelectorAll(s)]"
)
code = code.replace(/document\.documentElement\.dataset\.theme/g, "rootEl.dataset.theme")
code = code.replace(
  /const state=\{page:'overview'/,
  "const state={page:(typeof initialPage==='string'&&initialPage)?initialPage:'overview'"
)
code = code.replace(
  /function goPage\(id\)\{if\(!permittedPage\(id\)\)return deny\(pagePermission\[id\]\);state\.page=id;closeDrawer\(\);closeModal\(\);closeCommand\(\);\$\('#app'\)\.classList\.remove\('mobile-nav'\);render\(\)\}/,
  "function goPage(id){if(!permittedPage(id))return deny(pagePermission[id]);state.page=id;if(typeof window.__ACCOUNTING_V52_NAV__==='function')window.__ACCOUNTING_V52_NAV__(id);closeDrawer();closeModal();closeCommand();$('#app').classList.remove('mobile-nav');render()}"
)
code = code.replace(
  /if\(location\.hash\.slice\(1\)!==state\.page\)history\.replaceState\(null,'',`#\$\{state\.page\}`\)/,
  "if(typeof window.__ACCOUNTING_V52_NAV__==='function')window.__ACCOUNTING_V52_NAV__(state.page)"
)
code = code.replace(
  /const initialHash=location\.hash\.slice\(1\);if\(pages\[initialHash\]\)state\.page=initialHash;render\(\);/,
  "if(initialPage&&pages[initialPage])state.page=initialPage;render();"
)

const runtime = `/* Auto-extracted Matanho Accounting V52 — adapted for Next.js */
export function startAccountingV52Runtime(rootEl, runtimeOptions = {}) {
  const initialPage = runtimeOptions.initialPage || 'overview';
  window.__ACCOUNTING_V52_NAV__ = runtimeOptions.onNavigate || (() => {});
  window.__MATANHO_CONFIG__ = window.__MATANHO_CONFIG__ || { useMocks: true, environment: 'preview' };

  rootEl.innerHTML = runtimeOptions.shellHtml || '';
  rootEl.dataset.theme = rootEl.dataset.theme || 'light';
  rootEl.classList.add('${ROOT}');

  const __ac52Abort = new AbortController();
  const __ac52Sig = { signal: __ac52Abort.signal };
  let api = { setPage() {}, destroy() {} };

${code}

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();

  api = {
    setPage(page) {
      if (typeof permittedPage === 'function' && !permittedPage(page)) return;
      if (typeof goPage === 'function') goPage(page);
      else {
        state.page = page;
        if (typeof render === 'function') render();
      }
    },
    destroy() {
      try { __ac52Abort.abort(); } catch (_) {}
      delete window.__ACCOUNTING_V52_NAV__;
      rootEl.innerHTML = '';
    },
  };
  return api;
}
`

let rt = injectSignal(runtime)
fs.writeFileSync(path.join(OUT_DIR, "matanho-accounting-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-accounting-runtime.js")).size)
console.log("nav bridge", rt.includes("__ACCOUNTING_V52_NAV__"))

const pages = [
  ["overview", "/accounting-v52", "Command Centre"],
  ["approvals", "/accounting-v52/approvals", "Approval Queue"],
  ["close", "/accounting-v52/close", "Period Close"],
  ["ledger", "/accounting-v52/general-ledger", "General Ledger"],
  ["journals", "/accounting-v52/journals", "Journal Entries"],
  ["cash", "/accounting-v52/cash-book", "Cash & Liquidity"],
  ["reconciliation", "/accounting-v52/bank-reconciliation", "Bank Reconciliation"],
  ["payables", "/accounting-v52/payables", "Payables & Payments"],
  ["receivables", "/accounting-v52/receivables", "Receivables"],
  ["expenses", "/accounting-v52/expenses", "Expenses & Claims"],
  ["inventory", "/accounting-v52/inventory", "Inventory Accounting"],
  ["assets", "/accounting-v52/assets", "Fixed Assets"],
  ["investments", "/accounting-v52/short-term-investments", "Short-Term Investments"],
  ["reports", "/accounting-v52/reports", "Financial Reports"],
  ["compliance", "/accounting-v52/tax", "Compliance & Tax"],
  ["fx", "/accounting-v52/fx-revaluation", "FX Revaluation"],
  ["consolidation", "/accounting-v52/consolidation", "Group Consolidation"],
  ["coa", "/accounting-v52/chart-governance", "Chart of Accounts"],
  ["vault", "/accounting-v52/vault", "Document Vault"],
  ["audit", "/accounting-v52/audit", "Audit Trail"],
  ["access", "/accounting-v52/access", "Access Control"],
  ["integrations", "/accounting-v52/integrations", "Integrations"],
  ["settings", "/accounting-v52/settings", "Settings"],
]

const navTs = `/** Accounting V52 page id → Next path */
export const AC52_PAGE_TO_PATH: Record<string, string> = {
${pages.map(([id, p]) => `  '${id}': '${p}',`).join("\n")}
}

export const AC52_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(AC52_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToAc52Page(pathname: string): string {
  if (pathname in AC52_PATH_TO_PAGE) return AC52_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/accounting-v52/')) {
    const seg = pathname.replace('/accounting-v52/', '').split('/')[0]
    const hit = Object.entries(AC52_PAGE_TO_PATH).find(([, p]) => p === '/accounting-v52/' + seg)
    if (hit) return hit[0]
  }
  return 'overview'
}

export const AC52_NAV_PAGES = [
${pages.map(([id, p, name]) => `  { id: 'ac52-${id}', page: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)
console.log("done")
