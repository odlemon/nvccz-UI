/**
 * Upgrade Matanho Portfolio mock from client V23 handoff (in-place on portfolio-v11 paths).
 * Source: Matanho_Portfolio_Management_v23_Production_Handoff
 */
import fs from "fs"
import path from "path"

const CLIENT =
  "C:/Users/lysp/Downloads/Matanho_Portfolio_Management_v23_Production_Handoff-20260817T072841Z-1-001/Matanho_Portfolio_Management_v23_Production_Handoff"
const ROOT = "portfolio-v11-root"
const OUT_CSS = "components/portfolio-v11-mock/portfolio-v11.css"
const OUT_RUNTIME = "components/portfolio-v11-mock/matanho-portfolio-runtime.js"
const OUT_SHELL = "components/portfolio-v11-mock/shell.html"
const PUBLIC_ASSETS = "public/portfolio/assets"

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
shell = shell.replace(/\.\/assets\//g, "/portfolio/assets/")
shell = shell.replace(/src="\/assets\//g, 'src="/portfolio/assets/')
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
  const standalonePath = path.join(
    clientDir,
    "standalone/Matanho_Portfolio_Management_Interactive_Frontend_v23.html"
  )
  if (fs.existsSync(standalonePath)) {
    const html = fs.readFileSync(standalonePath, "utf8")
    const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1])
    const main = blocks.find((b) => b.includes(".app-shell") && b.length > 50_000)
    if (main) {
      console.log("css source: standalone v23", main.length)
      return main
    }
  }

  const v11Css = path.join(
    "C:/Users/lysp/Downloads/Matanho_Portfolio_Management_v11_Production_Handoff/dist/assets/styles.css"
  )
  const v23Delta = path.join(clientDir, "src/styles.css")
  if (fs.existsSync(v11Css) && fs.existsSync(v23Delta)) {
    console.log("css source: v11 dist + v23 delta")
    return fs.readFileSync(v11Css, "utf8") + "\n" + fs.readFileSync(v23Delta, "utf8")
  }

  throw new Error("Full portfolio CSS not found (standalone or v11+v23 fallback)")
}

let css = extractFullCss(CLIENT)
css = css.replace(/url\((['"]?)\/?assets\//g, "url($1/portfolio/assets/")
css = css.replace(/url\((['"]?)\.\/assets\//g, "url($1/portfolio/assets/")
const scoped = scopeCss(css)
fs.writeFileSync(
  OUT_CSS,
  `/* Scoped Matanho Portfolio Management V23 styles (hosted at /portfolio) */\n${scoped}\n`
)
console.log("css", fs.statSync(OUT_CSS).size)

let code = fs.readFileSync(path.join(CLIENT, "src/app.js"), "utf8")
code = code.replace(/^window\.__MATANHO_RUNTIME__[^\n]*\n?/, "")
code = code.replace(/^\s*\(\(\)\s*=>\s*\{/, "")
code = code.replace(/\}\)\(\);\s*$/, "")

code = code.replace(/"\/assets\//g, '"/portfolio/assets/')
code = code.replace(/'\/assets\//g, "'/portfolio/assets/")

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

const runtime = `/* Auto-extracted Matanho Portfolio V23 runtime — adapted for Next.js (/portfolio) */
export function startPortfolioV11Runtime(rootEl, options = {}) {
  const initialPage = options.initialPage || 'dashboard';
  window.__PORTFOLIO_V11_NAV__ = options.onNavigate || (() => {});

  rootEl.innerHTML = options.shellHtml || '';
  rootEl.dataset.theme = 'light';

  const __pv11Abort = new AbortController();
  const __pv11Sig = { signal: __pv11Abort.signal };
  let api = { setPage() {}, destroy() {} };

  ${code}

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
console.log("done — portfolio-v11 upgraded to client V23")
