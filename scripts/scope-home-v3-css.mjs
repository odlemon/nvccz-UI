import fs from "fs"

const src =
  "C:/Users/lysp/Downloads/Matanho_Employee_Hub_Premium_v17_1/index.html"
const html = fs.readFileSync(src, "utf8")
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/)
if (!styleMatch) throw new Error("No style")
let css = styleMatch[1]

css = css.replace(/url\((['"]?)assets\//g, "url($1/home-v3/assets/")

/**
 * Scope every selector under .home-v3-root.
 * Handles @media / @supports nesting; leaves @keyframes as-is.
 */
function scopeCss(input, root = ".home-v3-root") {
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
        // html[data-cover-theme=...] → .home-v3-root[data-cover-theme=...]
        if (sel.startsWith("html[")) return root + sel.slice(4)
        if (sel.startsWith(":root")) return root + sel.slice(5)
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

      // comments
      if (input[i] === "/" && input[i + 1] === "*") {
        const end = input.indexOf("*/", i + 2)
        out += input.slice(i, end + 2)
        i = end + 2
        continue
      }

      // at-rules
      if (input[i] === "@") {
        const nameStart = i
        i++
        const name = readUntil([" ", "\t", "\n", "{", ";", "("]).trim()
        // rest of prelude
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
            // copy raw until matching close
            let d = 1
            while (i < input.length && d > 0) {
              if (input[i] === "{") d++
              else if (input[i] === "}") d--
              if (d > 0) out += input[i]
              else out += "}"
              i++
            }
          } else {
            transformBlock(true)
          }
        }
        continue
      }

      // selector + declarations
      const selectorPart = readUntil(["{"])
      if (input[i] !== "{") break
      i++ // {
      const scoped = scopeSelectorList(selectorPart)
      out += scoped + "{"
      // copy declarations until }
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

const scoped = scopeCss(css)
const outPath = "components/home-v3-mock/home-v3.css"
fs.writeFileSync(
  outPath,
  "/* Scoped Matanho Employee Hub Premium V17.1 styles for Home Version 3 */\n" + scoped
)
console.log("Wrote", outPath, fs.statSync(outPath).size)

// Spot-check media queries
const sample = scoped.match(/@media \(max-width: 1280px\) \{[\s\S]{0,400}/)
console.log(sample ? sample[0] : "no 1280 media")
const broken = scoped.match(/\.home-v3-root\s*\}/)
console.log("broken root close?", !!broken)
