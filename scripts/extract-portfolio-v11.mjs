/**
 * Extract Matanho Portfolio V11 for Mode A Next.js port (portfolio-v11).
 * Source: Matanho_Portfolio_Management_v11_Production_Handoff
 */
import fs from "fs"
import path from "path"

const CLIENT =
  "C:/Users/lysp/Downloads/Matanho_Portfolio_Management_v11_Production_Handoff"
const ROOT = "portfolio-v11-root"
const OUT_CSS = "components/portfolio-v11-mock/portfolio-v11.css"
const OUT_RUNTIME = "components/portfolio-v11-mock/matanho-portfolio-runtime.js"
const OUT_SHELL = "components/portfolio-v11-mock/shell.html"
const PUBLIC_ASSETS = "public/portfolio-v11/assets"

fs.mkdirSync("components/portfolio-v11-mock", { recursive: true })
fs.mkdirSync("lib/portfolio-v11-mock", { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })

// --- assets ---
const assetSrc = path.join(CLIENT, "public/assets")
for (const f of fs.readdirSync(assetSrc)) {
  fs.copyFileSync(path.join(assetSrc, f), path.join(PUBLIC_ASSETS, f))
}
console.log("assets", fs.readdirSync(PUBLIC_ASSETS).length)

// --- shell HTML (from dist index, path-rewritten) ---
const indexHtml = fs.readFileSync(path.join(CLIENT, "dist/index.html"), "utf8")
const shellMatch = indexHtml.match(/<div id="app"[\s\S]*?<\/div>\s*<link rel="stylesheet"/)
if (!shellMatch) throw new Error("shell not found")
let shell = shellMatch[0].replace(/\s*<link rel="stylesheet"$/, "")
shell = shell.replace(/\.\/assets\//g, "/portfolio-v11/assets/")
shell = shell.replace(/src="\/assets\//g, 'src="/portfolio-v11/assets/')
shell = shell.replace(/\u2318/g, "Cmd")
fs.writeFileSync(OUT_SHELL, shell)
fs.writeFileSync(
  "components/portfolio-v11-mock/shell.ts",
  `export const PORTFOLIO_V11_SHELL_HTML = ${JSON.stringify(shell)};\n`
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
        if (sel.startsWith("@")) return sel
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
        // Drop unresolved Tailwind directives (client ships them uncompiled)
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
css = css.replace(/url\((['"]?)\/?assets\//g, "url($1/portfolio-v11/assets/")
css = css.replace(/url\((['"]?)\.\/assets\//g, "url($1/portfolio-v11/assets/")
const scoped = scopeCss(css)
fs.writeFileSync(
  OUT_CSS,
  `/* Scoped Matanho Portfolio Management V11 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(OUT_CSS).size)

// --- runtime wrap ---
let code = fs.readFileSync(path.join(CLIENT, "src/app.js"), "utf8")
// unwrap IIFE
code = code.replace(/^\s*\(\(\)\s*=>\s*\{/, "")
code = code.replace(/\}\)\(\);\s*$/, "")

// theme on mount root
code = code.replace(
  /document\.body\.dataset\.theme\s*=\s*state\.theme/g,
  "rootEl.dataset.theme = state.theme; document.body.dataset.theme = state.theme"
)

// navigate → Next bridge
code = code.replace(
  /function navigate\(page\) \{\s*state\.previousPage = state\.page;\s*state\.page = page;\s*state\.mobileNavOpen = false;\s*state\.tableSearch = '';\s*closeOverlays\(\);\s*render\(\);\s*requestAnimationFrame\(\(\) => workspace\.focus\(\{preventScroll:true\}\)\);\s*\}/,
  `function navigate(page) {
    state.previousPage = state.page;
    state.page = page;
    state.mobileNavOpen = false;
    state.tableSearch = '';
    closeOverlays();
    if (typeof window.__PORTFOLIO_V11_NAV__ === 'function') window.__PORTFOLIO_V11_NAV__(page);
    render();
    requestAnimationFrame(() => { try { workspace.focus({preventScroll:true}); } catch (_) {} });
  }`
)

const runtime = `/* Auto-extracted Matanho Portfolio V11 runtime — adapted for Next.js */
export function startPortfolioV11Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'dashboard';
  window.__PORTFOLIO_V11_NAV__ = options.onNavigate || (() => {});

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = 'light';

  const __pv11Abort = new AbortController();
  const __pv11Sig = { signal: __pv11Abort.signal };
  let api = { setPage() {}, destroy() {} };

  ${code}

  // Force initial page if provided (after state exists)
  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }

  // Rebind document listeners with abort signal where we can wrap new ones —
  // patch common addEventListener calls was done via string replace below if present.

  if (typeof render === 'function') render();

  api = {
    setPage(page, detail = {}) {
      if (detail && typeof detail === 'object') {
        if (detail.selectedDealId != null) state.selectedDealId = detail.selectedDealId;
        if (detail.selectedCompanyId != null) state.selectedCompanyId = detail.selectedCompanyId;
        if (detail.selectedFundId != null) state.selectedFundId = detail.selectedFundId;
        if (detail.selectedLPId != null) state.selectedLPId = detail.selectedLPId;
        if (detail.selectedCapitalCallId != null) state.selectedCapitalCallId = detail.selectedCapitalCallId;
      }
      state.page = page;
      state.mobileNavOpen = false;
      render();
    },
    destroy() {
      try { __pv11Abort.abort(); } catch (_) {}
      delete window.__PORTFOLIO_V11_NAV__;
      try { delete window.MatanhoPortfolioUI; } catch (_) {}
      rootEl.innerHTML = '';
    },
  };

  return api;
}
`

// Inject abort signals on document.addEventListener
let rt = runtime.replace(
  /document\.addEventListener\('(click|change|input|keydown|submit)',\s*/g,
  "document.addEventListener('$1', "
)

// Add signal before closing `);` of each document.addEventListener — brace match
function injectSignal(src) {
  const types = ["click", "change", "input", "keydown", "submit"]
  let out = src
  for (const type of types) {
    const start = `document.addEventListener('${type}', `
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
      const after = out.slice(k, k + 30)
      if (after.startsWith(", __pv11Sig)") || after.startsWith(",__pv11Sig)")) {
        idx = k + 1
        continue
      }
      if (out[k] === ")") {
        out = out.slice(0, k) + ", __pv11Sig" + out.slice(k)
        idx = k + 12
      } else idx = k + 1
    }
  }
  return out
}

rt = injectSignal(rt)
fs.writeFileSync(OUT_RUNTIME, rt)
console.log("runtime", fs.statSync(OUT_RUNTIME).size)

// --- nav map ts ---
const navTs = `/** Portfolio V11 page id → Next path */
export const PV11_PAGE_TO_PATH: Record<string, string> = {
  dashboard: '/portfolio-v11',
  deals: '/portfolio-v11/deals',
  funds: '/portfolio-v11/funds',
  'capital-calls': '/portfolio-v11/capital-calls',
  companies: '/portfolio-v11/companies',
  'cash-accounts': '/portfolio-v11/cash-accounts',
  'cash-overview': '/portfolio-v11/cash-overview',
  'cash-ledger': '/portfolio-v11/cash-ledger',
  'cash-reservations': '/portfolio-v11/cash-reservations',
  'statement-imports': '/portfolio-v11/statement-imports',
  reconciliations: '/portfolio-v11/reconciliations',
  exceptions: '/portfolio-v11/exceptions',
  'period-close': '/portfolio-v11/period-close',
  reporting: '/portfolio-v11/reporting',
  'fund-performance': '/portfolio-v11/fund-performance',
  lps: '/portfolio-v11/lps',
  'documents-vault': '/portfolio-v11/documents',
  'reports-vault': '/portfolio-v11/reports-vault',
  'e-signatures': '/portfolio-v11/e-signatures',
  'mailer-lists': '/portfolio-v11/mailer-lists',
  settings: '/portfolio-v11/settings',
  // details
  'deal-detail': '/portfolio-v11/deals/detail',
  'company-detail': '/portfolio-v11/companies/detail',
  'fund-detail': '/portfolio-v11/funds/detail',
  'lp-detail': '/portfolio-v11/lps/detail',
  'capital-call-detail': '/portfolio-v11/capital-calls/detail',
  'reconciliation-workspace': '/portfolio-v11/reconciliations/workspace',
  'report-builder': '/portfolio-v11/reports-vault/builder',
  'applicant-portal': '/portfolio-v11/applicant-portal',
  'analytics-detail': '/portfolio-v11/analytics',
}

export const PV11_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PV11_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPv11Page(pathname: string): string {
  if (pathname in PV11_PATH_TO_PAGE) return PV11_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/portfolio-v11/deals')) return 'deals'
  if (pathname.startsWith('/portfolio-v11/funds')) return 'funds'
  if (pathname.startsWith('/portfolio-v11/companies')) return 'companies'
  if (pathname.startsWith('/portfolio-v11/lps')) return 'lps'
  if (pathname.startsWith('/portfolio-v11/capital-calls')) return 'capital-calls'
  if (pathname.startsWith('/portfolio-v11/reconciliations')) return 'reconciliations'
  if (pathname.startsWith('/portfolio-v11/reports-vault')) return 'reports-vault'
  return 'dashboard'
}

export const PV11_NAV_PAGES = [
  { id: 'pv11-dashboard', page: 'dashboard', path: '/portfolio-v11', name: 'Dashboard' },
  { id: 'pv11-deals', page: 'deals', path: '/portfolio-v11/deals', name: 'Deal Flow' },
  { id: 'pv11-funds', page: 'funds', path: '/portfolio-v11/funds', name: 'Funds' },
  { id: 'pv11-capital-calls', page: 'capital-calls', path: '/portfolio-v11/capital-calls', name: 'Capital Calls' },
  { id: 'pv11-companies', page: 'companies', path: '/portfolio-v11/companies', name: 'Portfolio Companies' },
  { id: 'pv11-cash-accounts', page: 'cash-accounts', path: '/portfolio-v11/cash-accounts', name: 'Client / Fund Accounts' },
  { id: 'pv11-cash-overview', page: 'cash-overview', path: '/portfolio-v11/cash-overview', name: 'Cash Overview' },
  { id: 'pv11-cash-ledger', page: 'cash-ledger', path: '/portfolio-v11/cash-ledger', name: 'Cash Ledger' },
  { id: 'pv11-cash-reservations', page: 'cash-reservations', path: '/portfolio-v11/cash-reservations', name: 'Reservations' },
  { id: 'pv11-statement-imports', page: 'statement-imports', path: '/portfolio-v11/statement-imports', name: 'Statement Imports' },
  { id: 'pv11-reconciliations', page: 'reconciliations', path: '/portfolio-v11/reconciliations', name: 'Reconciliations' },
  { id: 'pv11-exceptions', page: 'exceptions', path: '/portfolio-v11/exceptions', name: 'Exceptions' },
  { id: 'pv11-period-close', page: 'period-close', path: '/portfolio-v11/period-close', name: 'Period Close & GL' },
  { id: 'pv11-reporting', page: 'reporting', path: '/portfolio-v11/reporting', name: 'Reporting Schedules' },
  { id: 'pv11-fund-performance', page: 'fund-performance', path: '/portfolio-v11/fund-performance', name: 'Fund Performance' },
  { id: 'pv11-lps', page: 'lps', path: '/portfolio-v11/lps', name: 'LP Management' },
  { id: 'pv11-documents', page: 'documents-vault', path: '/portfolio-v11/documents', name: 'Documents Vault' },
  { id: 'pv11-reports-vault', page: 'reports-vault', path: '/portfolio-v11/reports-vault', name: 'Reports Vault' },
  { id: 'pv11-e-signatures', page: 'e-signatures', path: '/portfolio-v11/e-signatures', name: 'E-Signatures' },
  { id: 'pv11-mailer-lists', page: 'mailer-lists', path: '/portfolio-v11/mailer-lists', name: 'Mailer Lists' },
  { id: 'pv11-settings', page: 'settings', path: '/portfolio-v11/settings', name: 'Settings & Integrations' },
] as const
`
fs.writeFileSync("lib/portfolio-v11-mock/nav.ts", navTs)
console.log("nav written")
console.log("done")
