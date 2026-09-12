/**
 * Upgrade Matanho Portfolio mock from client V25 Production Handoff.
 * Public routes: /portfolio/*  |  Internal packages stay portfolio-v11-*
 * Source: Matanho_Portfolio_Management_v25_Production_Handoff
 */
import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"

const CLIENT =
  "C:/Users/lysp/Downloads/Portfolio Management FE-20260901T224054Z-1-001/Portfolio Management FE/Matanho_Portfolio_Management_v25_Production_Handoff"
const ROOT = "portfolio-v11-root"
const OUT_CSS = "components/portfolio-v11-mock/portfolio-v11.css"
const OUT_RUNTIME = "components/portfolio-v11-mock/matanho-portfolio-runtime.js"
const OUT_SHELL = "components/portfolio-v11-mock/shell.html"
const PUBLIC_ASSETS = "public/portfolio/assets"
const ASSET_PREFIX = "/portfolio/assets/"

fs.mkdirSync("components/portfolio-v11-mock", { recursive: true })
fs.mkdirSync("lib/portfolio-v11-mock", { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })

function copyAssetsFrom(dir) {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const f of fs.readdirSync(dir)) {
    const src = path.join(dir, f)
    if (!fs.statSync(src).isFile()) continue
    fs.copyFileSync(src, path.join(PUBLIC_ASSETS, f))
    n++
  }
  return n
}

let assetCount = copyAssetsFrom(path.join(CLIENT, "public/assets"))
if (!assetCount) assetCount = copyAssetsFrom(path.join(CLIENT, "dist/assets"))
console.log("assets", assetCount, fs.readdirSync(PUBLIC_ASSETS).length)

const indexHtml = fs.readFileSync(path.join(CLIENT, "dist/index.html"), "utf8")
const shellMatch = indexHtml.match(/<div id="app"[\s\S]*?<div id="toastStack"[\s\S]*?<\/div>\s*<\/div>/)
if (!shellMatch) throw new Error("shell not found")
let shell = shellMatch[0]
shell = shell.replace(/\.\/assets\//g, ASSET_PREFIX)
shell = shell.replace(/src="\/assets\//g, `src="${ASSET_PREFIX}`)
shell = shell.replace(/\u2318/g, "Cmd")
fs.writeFileSync(OUT_SHELL, shell + "\n")
fs.writeFileSync(
  "components/portfolio-v11-mock/shell.ts",
  `export const PORTFOLIO_V11_SHELL_HTML = ${JSON.stringify(shell)};\n`
)
console.log("shell", shell.length)

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

function extractFullCss(clientDir) {
  const candidates = [
    "standalone/Matanho_Portfolio_Management_Interactive_Frontend_v25.html",
    "Matanho_Portfolio_Management_Interactive_Frontend_v25.html",
    "standalone/Matanho_Portfolio_Management_Interactive_Frontend_v24.html",
    "standalone/Matanho_Portfolio_Management_Interactive_Frontend_v23.html",
  ]
  for (const rel of candidates) {
    const standalonePath = path.join(clientDir, rel)
    if (!fs.existsSync(standalonePath)) continue
    const html = fs.readFileSync(standalonePath, "utf8")
    const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1])
    const main = blocks.find((b) => b.includes(".app-shell") && b.length > 50_000)
    if (main) {
      console.log("css source:", rel, main.length)
      return main
    }
  }

  const distCss = path.join(clientDir, "dist/assets")
  if (fs.existsSync(distCss)) {
    const cssFile = fs.readdirSync(distCss).find((f) => f.endsWith(".css"))
    if (cssFile) {
      console.log("css source: dist/assets/" + cssFile)
      return fs.readFileSync(path.join(distCss, cssFile), "utf8")
    }
  }

  const srcCss = path.join(clientDir, "src/styles.css")
  if (fs.existsSync(srcCss)) {
    console.log("css source: src/styles.css")
    return fs.readFileSync(srcCss, "utf8")
  }

  throw new Error("Full portfolio CSS not found (standalone v25 / dist / src)")
}

let css = extractFullCss(CLIENT)
css = css.replace(/url\((['"]?)\/?assets\//g, `url($1${ASSET_PREFIX}`)
css = css.replace(/url\((['"]?)\.\/assets\//g, `url($1${ASSET_PREFIX}`)
const scoped = scopeCss(css)
fs.writeFileSync(
  OUT_CSS,
  `/* Scoped Matanho Portfolio Management V25 styles (hosted at /portfolio) */\n${scoped}\n`
)
console.log("css", fs.statSync(OUT_CSS).size)

let code = fs.readFileSync(path.join(CLIENT, "src/app.js"), "utf8")
code = code.replace(/^window\.__MATANHO_RUNTIME__[^\n]*\n?/, "")
code = code.replace(/^\s*\(\(\)\s*=>\s*\{/, "")
code = code.replace(/\}\)\(\);\s*$/, "")

code = code.replace(/"\/assets\//g, `"${ASSET_PREFIX}`)
code = code.replace(/'\/assets\//g, `'${ASSET_PREFIX}`)

code = code.replace(
  /document\.body\.dataset\.theme\s*=\s*state\.theme/g,
  "rootEl.dataset.theme = state.theme; document.body.dataset.theme = state.theme"
)

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

// Expand MatanhoPortfolioUI with host live-wiring helpers (before Object.freeze).
const uiFreezeRe =
  /window\.MatanhoPortfolioUI\s*=\s*Object\.freeze\(\{\s*version:\s*'[^']*',\s*hydrate:\s*hydrateFromBackend,/
if (!uiFreezeRe.test(code)) {
  throw new Error("MatanhoPortfolioUI freeze block not found — update extract patch")
}
code = code.replace(
  uiFreezeRe,
  `function __pv11ClearFixtures() {
    const cols = [funds, companies, deals, capitalCalls, lps, reports, documents, cashAccounts, cashJournals, cashReservations, statementImports, reconciliationBatches, reconciliationExceptions, reportVaultItems, signatureEnvelopes, mailerLists];
    cols.forEach((c) => { if (Array.isArray(c)) c.splice(0, c.length); });
  }
  function __pv11BeginLiveLoad() {
    try { rootEl.classList.add('is-hydrating'); } catch (_) {}
    __pv11ClearFixtures();
    if (typeof render === 'function') render();
  }
  function __pv11FailLiveLoad(message) {
    try { rootEl.classList.remove('is-hydrating'); rootEl.classList.add('is-host-error'); } catch (_) {}
    if (typeof toast === 'function') toast('Live data failed', message || 'Could not load portfolio data.', 'error');
  }
  function __pv11SetActionBusy(busy, message, actionName) {
    try {
      rootEl.classList.toggle('is-action-busy', Boolean(busy));
      let banner = rootEl.querySelector('.pv11-action-busy-banner');
      if (busy) {
        if (!banner) {
          banner = document.createElement('div');
          banner.className = 'pv11-action-busy-banner';
          rootEl.appendChild(banner);
        }
        banner.textContent = message || (actionName ? ('Working: ' + actionName) : 'Working…');
      } else if (banner) banner.remove();
    } catch (_) {}
  }
  window.MatanhoPortfolioUI = Object.freeze({
    version: '25.0.0',
    hydrate: function(payload) {
      try { rootEl.classList.remove('is-hydrating', 'is-host-error'); } catch (_) {}
      return hydrateFromBackend(payload);
    },
    beginLiveLoad: __pv11BeginLiveLoad,
    failLiveLoad: __pv11FailLiveLoad,
    setActionBusy: __pv11SetActionBusy,
    notify: function(title, body, tone) { if (typeof toast === 'function') toast(title, body || '', tone || 'info'); },
    closeOverlays: function() { if (typeof closeOverlays === 'function') closeOverlays(); },
    setDealTab: function(tab) { if (tab) { state.dealTab = tab; render(); } },
    setDealDetail: function(detail) {
      if (!detail || typeof detail !== 'object') return;
      if (detail.selectedDealId != null) state.selectedDealId = detail.selectedDealId;
      if (detail.dealDetail != null) state.dealDetail = detail.dealDetail;
      Object.assign(state, detail);
      render();
    },
    setDealDetailLoading: function(loading) {
      state.dealDetailLoading = Boolean(loading);
      try { rootEl.classList.toggle('is-deal-loading', Boolean(loading)); } catch (_) {}
      render();
    },
    setInvestmentUsers: function(users) { state.investmentUsers = Array.isArray(users) ? users : []; },
    openDdTaskModal: function(users) {
      if (Array.isArray(users)) state.investmentUsers = users;
      if (typeof showAssignDdTaskModal === 'function') showAssignDdTaskModal();
      else if (typeof toast === 'function') toast('Assign DD task', 'Open Due Diligence on the deal to assign tasks.');
    },
    hydrate: hydrateFromBackend,`
)

// Fix duplicate hydrate key introduced above — keep the wrapping hydrate only.
code = code.replace(
  /hydrate: function\(payload\) \{[\s\S]*?return hydrateFromBackend\(payload\);\s*\},\s*beginLiveLoad:[\s\S]*?openDdTaskModal:[\s\S]*?hydrate: hydrateFromBackend,/,
  (m) => m.replace(/,\s*hydrate: hydrateFromBackend,$/, ",")
)

const runtime = `/* Auto-extracted Matanho Portfolio V25 runtime — adapted for Next.js (/portfolio) */
export function startPortfolioV11Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'dashboard';
  const liveOnly = Boolean(options.liveOnly);
  window.__PORTFOLIO_V11_NAV__ = options.onNavigate || (() => {});

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = 'light';
  rootEl.classList.add('portfolio-v11-root');

  const __pv11Abort = new AbortController();
  const __pv11Sig = { signal: __pv11Abort.signal };
  let api = { setPage() {}, destroy() {} };

  ${code}

  if (liveOnly && typeof __pv11ClearFixtures === 'function') {
    __pv11ClearFixtures();
  }

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }

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
    hydrate: (payload) => {
      if (window.MatanhoPortfolioUI && typeof window.MatanhoPortfolioUI.hydrate === 'function') {
        return window.MatanhoPortfolioUI.hydrate(payload);
      }
      return hydrateFromBackend(payload);
    },
    beginLiveLoad: window.MatanhoPortfolioUI && window.MatanhoPortfolioUI.beginLiveLoad,
    failLiveLoad: window.MatanhoPortfolioUI && window.MatanhoPortfolioUI.failLiveLoad,
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

const rt = injectSignal(runtime)
fs.writeFileSync(OUT_RUNTIME, rt)
console.log("runtime", fs.statSync(OUT_RUNTIME).size)

// T0.1 — always re-apply hand patches so regenerations stay safe.
const patch = spawnSync(process.execPath, ["scripts/patch-portfolio-runtime.mjs"], {
  encoding: "utf8",
  cwd: process.cwd(),
})
if (patch.stdout) process.stdout.write(patch.stdout)
if (patch.stderr) process.stderr.write(patch.stderr)
if (patch.status !== 0) {
  console.error("patch-portfolio-runtime.mjs failed — runtime written but unpatched")
  process.exit(patch.status || 1)
}
console.log("done — portfolio upgraded to client V25 (+ runtime patches)")
