import fs from "fs"

const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8")

if (!s.includes("__hv3Abort")) {
  s = s.replace(
    "let api = { setRoute() {}, destroy() {} };",
    `let api = { setRoute() {}, destroy() {} };
  const __hv3Abort = new AbortController();
  const __hv3Sig = { signal: __hv3Abort.signal };`
  )
}

// Rewrite document.addEventListener('type', handler) to include abort signal.
// Handlers are either `e => { ... });` multiline ending with `});`
s = s.replace(
  /document\.addEventListener\('(click|input|change|submit|keydown)',\s*/g,
  "document.addEventListener('$1', "
)

// After each of these listener registrations, the closing is `});` — inject signal before that close.
// Safer: replace the five known closings by tracking — use a unique marker approach.

function injectSignal(src) {
  const types = ["click", "input", "change", "submit", "keydown"]
  let out = src
  for (const type of types) {
    const start = `document.addEventListener('${type}', `
    let idx = 0
    while ((idx = out.indexOf(start, idx)) !== -1) {
      // find matching closing `});` for this arrow/function — naive brace match from first `{` or from `=>`
      let j = idx + start.length
      // skip to start of handler
      while (j < out.length && out[j] !== "=" && out[j] !== "f") j++
      // find first `{` of handler body for arrow, or handle `function`
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
      // expect `);` or `, {signal...});`
      const after = out.slice(k, k + 40)
      if (after.startsWith(", __hv3Sig)") || after.startsWith(",__hv3Sig)")) {
        idx = k + 1
        continue
      }
      if (out[k] === ")") {
        // already `});` → insert before )
        out = out.slice(0, k) + ", __hv3Sig" + out.slice(k)
        idx = k + 12
      } else {
        idx = k + 1
      }
    }
  }
  return out
}

s = injectSignal(s)

s = s.replace(
  /delete window\.__HOME_V3_NAV__;\n\s*rootEl\.innerHTML = "";/,
  `__hv3Abort.abort();\n      delete window.__HOME_V3_NAV__;\n      rootEl.innerHTML = "";`
)

fs.writeFileSync(p, s)
console.log("Patched abort signals")
console.log("signal count", (s.match(/__hv3Sig/g) || []).length)
