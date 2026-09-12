/**
 * Extract Matanho Procurement V23 for Mode A Next.js port (procurement-v23).
 */
import fs from "fs"
import path from "path"

const CLIENT_HTML =
  "C:/Users/lysp/Downloads/Procurement FE-20260819T064256Z-1-001/Procurement FE/matanho-procurement-ui-v23/dist/index.html"
const ROOT = "procurement-v23-root"
const OUT_DIR = "components/procurement-v23-mock"
const LIB_DIR = "lib/procurement-v23-mock"

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
  const head = source.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ""
  const styles = []
  const re = /<style(?:[^>]*)>([\s\S]*?)<\/style>/gi
  let m
  while ((m = re.exec(head)) !== null) styles.push(m[1])
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
  return body.replace(/<script[\s\S]*$/i, "").trim()
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
        if (after.startsWith(", __pr23Sig)") || after.startsWith(",__pr23Sig)")) {
          idx = k + 1
          continue
        }
        if (out[k] === ")") {
          out = out.slice(0, k) + ", __pr23Sig" + out.slice(k)
          idx = k + 12
        } else idx = k + 1
      }
    }
  }
  return out
}

let css = extractStyles(html)
const scoped = scopeCss(css)
fs.writeFileSync(
  path.join(OUT_DIR, "procurement-v23.css"),
  `/* Scoped Matanho Procurement V23 styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "procurement-v23.css")).size)

const shell = extractShell(html)
fs.writeFileSync(path.join(OUT_DIR, "shell.html"), shell)
fs.writeFileSync(
  path.join(OUT_DIR, "shell.ts"),
  `export const PROCUREMENT_V23_SHELL_HTML = ${JSON.stringify(shell)};\n`
)
console.log("shell", shell.length)

let code = extractScripts(html)

code = code.replace(
  /const \$=\(s,r=document\)=>r\.querySelector\(s\), \$\$=\(s,r=document\)=>\[\.\.\.r\.querySelectorAll\(s\)\]/,
  () => "const $=(s,r=rootEl)=>r.querySelector(s), $$=(s,r=rootEl)=>[...rootEl.querySelectorAll(s)]"
)
code = code.replace(/document\.documentElement\.dataset\.theme/g, "rootEl.dataset.theme")
code = code.replace(
  /const state=\{page:'dashboard'/,
  "const state={page:(typeof initialPage==='string'&&initialPage)?initialPage:'dashboard'"
)
code = code.replace(
  /function navigate\(p\)\{if\(!pages\[p\]\)return;state\.page=p;state\.evaluationTender=p==='evaluation'\?state\.evaluationTender:null;\$\('#app'\)\.classList\.remove\('mobile-open'\);closeOverlay\(\);render\(\)\}/,
  "function navigate(p){if(!pages[p])return;state.page=p;state.evaluationTender=p==='evaluation'?state.evaluationTender:null;if(typeof window.__PROCUREMENT_V23_NAV__==='function')window.__PROCUREMENT_V23_NAV__(p);$('#app').classList.remove('mobile-open');closeOverlay();render()}"
)
code = code.replace(
  /history\.replaceState\(null,'','#'\+state\.page\);/,
  "if(typeof window.__PROCUREMENT_V23_NAV__==='function')window.__PROCUREMENT_V23_NAV__(state.page);"
)
code = code.replace(
  /history\.replaceState\(null,'',`#\$\{page\}`\);/g,
  "if(typeof window.__PROCUREMENT_V23_NAV__==='function')window.__PROCUREMENT_V23_NAV__(page);"
)
code = code.replace(
  /requestAnimationFrame\(\(\)=>history\.replaceState\(null,'',`#\$\{page\}`\)\);/g,
  "requestAnimationFrame(()=>{if(typeof window.__PROCUREMENT_V23_NAV__==='function')window.__PROCUREMENT_V23_NAV__(page);});"
)
code = code.replace(
  /const hash=location\.hash\.slice\(1\);if\(pages\[hash\]\)state\.page=hash;/,
  "if(initialPage&&pages[initialPage])state.page=initialPage;"
)
code = code.replace(
  /const initialHash=location\.hash\.replace\('#',''\);\s*if\(initialHash && supportedPages\.has\(initialHash\)\) requestAnimationFrame\(\(\)=>navigateV14\(initialHash\)\);/,
  "if(initialPage&&supportedPages.has(initialPage))requestAnimationFrame(()=>navigateV14(initialPage));"
)

const runtime = `/* Auto-extracted Matanho Procurement V23 — adapted for Next.js */
export function startProcurementV23Runtime(rootEl, runtimeOptions = {}) {
  const initialPage = runtimeOptions.initialPage || 'dashboard';
  window.__PROCUREMENT_V23_NAV__ = runtimeOptions.onNavigate || (() => {});
  window.__MATANHO_CONFIG__ = Object.assign(
    { API_BASE_URL: '/api/v1', MOCK_MODE: true, environment: 'preview' },
    window.__MATANHO_CONFIG__ || {}
  );

  rootEl.innerHTML = runtimeOptions.shellHtml || '';
  rootEl.dataset.theme = rootEl.dataset.theme || 'light';
  rootEl.classList.add('${ROOT}');

  const __pr23Abort = new AbortController();
  const __pr23Sig = { signal: __pr23Abort.signal };
  let api = { setPage() {}, destroy() {} };

${code}

  if (typeof state !== 'undefined' && initialPage) {
    state.page = initialPage;
  }
  if (typeof render === 'function') render();

  api = {
    setPage(page) {
      if (typeof navigate === 'function') navigate(page);
      else if (typeof state !== 'undefined') {
        state.page = page;
        if (typeof render === 'function') render();
      }
    },
    destroy() {
      try { __pr23Abort.abort(); } catch (_) {}
      delete window.__PROCUREMENT_V23_NAV__;
      rootEl.innerHTML = '';
    },
  };
  return api;
}
`

let rt = injectSignal(runtime)
fs.writeFileSync(path.join(OUT_DIR, "matanho-procurement-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-procurement-runtime.js")).size)
console.log("nav bridge", rt.includes("__PROCUREMENT_V23_NAV__"))

const pages = [
  ["dashboard", "/procurement-v23", "Command Centre"],
  ["plan", "/procurement-v23/plan", "Annual Procurement Plan"],
  ["approvals", "/procurement-v23/approvals", "Approval Centre"],
  ["requisitions", "/procurement-v23/requisitions", "Purchase Requisitions"],
  ["tenders", "/procurement-v23/tenders", "Tenders & RFx"],
  ["evaluation", "/procurement-v23/evaluation", "Bid Evaluation"],
  ["vendors", "/procurement-v23/vendors", "Vendor Registry"],
  ["contracts", "/procurement-v23/contracts", "Contracts & Awards"],
  ["orders", "/procurement-v23/purchase-orders", "Purchase Orders"],
  ["receiving", "/procurement-v23/goods-received", "Receiving & Inspection"],
  ["invoices", "/procurement-v23/invoices", "Invoices & 3-Way Match"],
  ["accounts", "/procurement-v23/accounts", "Accounts & Asset Transfers"],
  ["documents", "/procurement-v23/documents", "Document Vault"],
  ["reports", "/procurement-v23/reports", "Reports Vault"],
  ["audit", "/procurement-v23/audit", "Audit & Compliance"],
  ["settings", "/procurement-v23/settings", "Configuration & RBAC"],
  ["analytics", "/procurement-v23/analytics", "Analytics"],
]

const navTs = `/** Procurement V23 page id → Next path */
export const PR23_PAGE_TO_PATH: Record<string, string> = {
${pages.map(([id, p]) => `  '${id}': '${p}',`).join("\n")}
}

export const PR23_PATH_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(PR23_PAGE_TO_PATH).map(([page, p]) => [p, page])
)

export function pathToPr23Page(pathname: string): string {
  if (pathname in PR23_PATH_TO_PAGE) return PR23_PATH_TO_PAGE[pathname]
  if (pathname.startsWith('/procurement-v23/')) {
    const seg = pathname.replace('/procurement-v23/', '').split('/')[0]
    const hit = Object.entries(PR23_PAGE_TO_PATH).find(([, p]) => p === '/procurement-v23/' + seg)
    if (hit) return hit[0]
  }
  return 'dashboard'
}

export const PR23_NAV_PAGES = [
${pages.map(([id, p, name]) => `  { id: 'pr23-${id}', page: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)
console.log("done")
