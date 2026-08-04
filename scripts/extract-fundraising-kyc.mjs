/**
 * Extract Matanho Investor KYC Onboarding for Mode A Next.js port (fundraising-kyc).
 */
import fs from "fs"
import path from "path"

const CLIENT = "C:/Users/lysp/Downloads/Matanho_INVESTOR_KYC_Onboarding_Deployment_Package"
const ROOT = "fundraising-kyc-root"
const OUT_DIR = "components/fundraising-kyc-mock"
const LIB_DIR = "lib/fundraising-kyc-mock"
const PUBLIC_ASSETS = "public/fundraising-kyc/assets"

fs.mkdirSync(OUT_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })
fs.mkdirSync(PUBLIC_ASSETS, { recursive: true })

// --- assets ---
const pubAssets = path.join(CLIENT, "public/assets")
if (fs.existsSync(pubAssets)) {
  for (const f of fs.readdirSync(pubAssets)) {
    const p = path.join(pubAssets, f)
    if (fs.statSync(p).isFile()) fs.copyFileSync(p, path.join(PUBLIC_ASSETS, f))
  }
}
const distAssets = path.join(CLIENT, "dist/assets")
if (fs.existsSync(distAssets)) {
  for (const f of fs.readdirSync(distAssets)) {
    const p = path.join(distAssets, f)
    if (fs.statSync(p).isFile()) fs.copyFileSync(p, path.join(PUBLIC_ASSETS, f))
  }
}
console.log("assets ok")

// --- shell ---
const shell = `<div id="app"></div>`
fs.writeFileSync(path.join(OUT_DIR, "shell.html"), shell)
fs.writeFileSync(
  path.join(OUT_DIR, "shell.ts"),
  `export const FUNDRAISING_KYC_SHELL_HTML = ${JSON.stringify(shell)};\n`
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
        // Drop unresolved / empty layer stubs
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
          if (
            name.startsWith("keyframes") ||
            name === "font-face" ||
            name === "property"
          ) {
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

let css = fs.readFileSync(path.join(CLIENT, "dist/styles.css"), "utf8")
css = css.replace(/url\((['"]?)\.?\/?assets\//g, "url($1/fundraising-kyc/assets/")
const scoped = scopeCss(css)
fs.writeFileSync(
  path.join(OUT_DIR, "fundraising-kyc.css"),
  `/* Scoped Matanho Investor KYC styles */\n${scoped}\n`
)
console.log("css", fs.statSync(path.join(OUT_DIR, "fundraising-kyc.css")).size)

// --- bundle ES modules into one runtime ---
function stripModule(src) {
  return src
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, "")
    .replace(/^export\s+\{[^}]+\};?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+(async\s+function|function|class|const|let|var)\s+/gm, "$1 ")
}

const model = stripModule(fs.readFileSync(path.join(CLIENT, "src/model.js"), "utf8"))
const validation = stripModule(fs.readFileSync(path.join(CLIENT, "src/validation.js"), "utf8"))
const storage = stripModule(fs.readFileSync(path.join(CLIENT, "src/storage.js"), "utf8"))
// api.js and app.js both declare `const config` — rename api module's copy
const apiSrc = stripModule(fs.readFileSync(path.join(CLIENT, "src/api.js"), "utf8"))
  .replace(/const config = window\.MATANHO_CONFIG \|\| \{\};/, "const apiModuleConfig = window.MATANHO_CONFIG || {};")
  .replace(/const apiBaseUrl = String\(config\.apiBaseUrl/g, "const apiBaseUrl = String(apiModuleConfig.apiBaseUrl")
  .replace(/const useMockApi = config\.useMockApi/g, "const useMockApi = apiModuleConfig.useMockApi")

let app = stripModule(fs.readFileSync(path.join(CLIENT, "src/app.js"), "utf8"))

app = app
  .replace(
    /const appRoot = document\.querySelector\('#app'\);/,
    "const appRoot = rootEl.querySelector('#app') || rootEl;"
  )
  .replace(/\.\/assets\//g, "/fundraising-kyc/assets/")
  .replace(
    /const preview = new URLSearchParams\(window\.location\.search\)\.get\('preview'\);/,
    `const preview = options.preview || new URLSearchParams(window.location.search).get('preview');`
  )
  .replace(
    /let currentStep = preview === 'liveness' \? 2 : preview === 'review' \? 7 : 0;/,
    `let currentStep = typeof options.initialStep === 'number' ? options.initialStep : (preview === 'liveness' ? 2 : preview === 'review' ? 7 : 0);`
  )
  .replace(
    /window\.location\.href = window\.location\.pathname;/,
    `if (typeof window.__FR_KYC_NAV__ === 'function') window.__FR_KYC_NAV__(0); else window.location.href = window.location.pathname;`
  )

// AbortController on root click / document listeners added by app
app = app.replace(
  /appRoot\.addEventListener\('click',/,
  "appRoot.addEventListener('click',"
)
// inject signal after first appRoot click listener closing - handled below via generic inject

const runtime = `/* Auto-extracted Matanho Investor KYC — adapted for Next.js */
export function startFundraisingKycRuntime(rootEl, options = {}) {
  window.__FR_KYC_NAV__ = options.onNavigate || (() => {});
  window.MATANHO_CONFIG = window.MATANHO_CONFIG || {
    apiBaseUrl: '',
    useMockApi: true,
    livenessProvider: 'mock',
    supportEmail: 'onboarding@example.co.zw',
    supportPhone: '+263 00 000 0000',
    maxUploadMb: 15,
    sessionIdleMinutes: 20,
  };

  rootEl.innerHTML = options.shellHtml || '<div id="app"></div>';

  const __frAbort = new AbortController();
  const __frSig = { signal: __frAbort.signal };
  let apiHandle = { setStep() {}, destroy() {} };

${model}

${validation}

${storage}

${apiSrc}

${app}

  // Bridge step changes → Next paths (only when step index changes)
  let __lastNavStep = -1;
  const __baseRender = render;
  render = function () {
    __baseRender();
    if (currentStep !== __lastNavStep && typeof window.__FR_KYC_NAV__ === 'function') {
      __lastNavStep = currentStep;
      window.__FR_KYC_NAV__(currentStep);
    }
  };
  if (typeof window.__FR_KYC_NAV__ === 'function') {
    __lastNavStep = currentStep;
    window.__FR_KYC_NAV__(currentStep);
  }

  apiHandle = {
    setStep(step) {
      const n = Number(step);
      if (!Number.isFinite(n) || n < 0) return;
      currentStep = Math.min(n, onboardingSteps.length - 1);
      render();
    },
    destroy() {
      try { __frAbort.abort(); } catch (_) {}
      try { if (typeof stopCamera === 'function') stopCamera(); } catch (_) {}
      delete window.__FR_KYC_NAV__;
      rootEl.innerHTML = '';
    },
  };
  return apiHandle;
}
`

function injectSignal(src) {
  const types = ["click", "change", "input", "keydown", "submit"]
  let out = src
  for (const type of types) {
    for (const target of ["document", "appRoot"]) {
      const start = `${target}.addEventListener('${type}',`
      const start2 = `${target}.addEventListener("${type}",`
      for (const s of [start, start2]) {
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
          if (after.startsWith(", __frSig)") || after.startsWith(",__frSig)")) {
            idx = k + 1
            continue
          }
          if (out[k] === ")") {
            out = out.slice(0, k) + ", __frSig" + out.slice(k)
            idx = k + 12
          } else idx = k + 1
        }
      }
    }
  }
  return out
}

let rt = injectSignal(runtime)
fs.writeFileSync(path.join(OUT_DIR, "matanho-fundraising-kyc-runtime.js"), rt)
console.log("runtime", fs.statSync(path.join(OUT_DIR, "matanho-fundraising-kyc-runtime.js")).size)
console.log("nav bridge", rt.includes("__FR_KYC_NAV__"))
console.log("double render call?", (rt.match(/^\s*render\(\);\s*$/gm) || []).length)

// --- nav map ---
const steps = [
  ["applicant", "/fundraising-kyc", "Applicant profile"],
  ["identity", "/fundraising-kyc/identity", "Identity and contact"],
  ["liveness", "/fundraising-kyc/liveness", "Selfie and liveness"],
  ["ownership", "/fundraising-kyc/ownership", "Ownership and control"],
  ["investment", "/fundraising-kyc/investment", "Investment and funds"],
  ["compliance", "/fundraising-kyc/compliance", "Compliance declarations"],
  ["documents", "/fundraising-kyc/documents", "Documents and signature"],
  ["review", "/fundraising-kyc/review", "Review and submit"],
]

const navTs = `/** Fundraising KYC step id / index → Next path */
export const FR_KYC_STEPS = [
${steps.map(([id, p, name], i) => `  { index: ${i}, id: '${id}', path: '${p}', name: '${name.replace(/'/g, "\\'")}' },`).join("\n")}
] as const

export const FR_KYC_PAGE_TO_PATH: Record<string, string> = {
${steps.map(([id, p]) => `  '${id}': '${p}',`).join("\n")}
}

export const FR_KYC_PATH_TO_INDEX: Record<string, number> = Object.fromEntries(
  FR_KYC_STEPS.map((s) => [s.path, s.index])
)

export function pathToFrKycStep(pathname: string): number {
  if (pathname in FR_KYC_PATH_TO_INDEX) return FR_KYC_PATH_TO_INDEX[pathname]
  if (pathname.startsWith('/fundraising-kyc/')) {
    const seg = pathname.replace('/fundraising-kyc/', '').split('/')[0]
    const hit = FR_KYC_STEPS.find((s) => s.id === seg)
    if (hit) return hit.index
  }
  return 0
}

export function frKycStepToPath(step: number): string {
  return FR_KYC_STEPS[step]?.path || '/fundraising-kyc'
}
`
fs.writeFileSync(path.join(LIB_DIR, "nav.ts"), navTs)
console.log("done")
