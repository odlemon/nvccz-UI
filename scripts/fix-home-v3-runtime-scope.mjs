import fs from "fs"

const path = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(path, "utf8")

// Remove the erroneous block wrapper around the IIFE body so state/render stay in function scope
s = s.replace(
  /let api = \{ setRoute\(\) \{\}, destroy\(\) \{\} \};\n\n  \{\n  'use strict';/,
  "let api = { setRoute() {}, destroy() {} };\n\n  'use strict';"
)

// Remove the closing brace that was the end of the block (before api =)
s = s.replace(
  /  render\(\);\n\}\n\n  api = \{/,
  "  render();\n\n  api = {"
)

fs.writeFileSync(path, s)
console.log("Fixed scope")

// Sanity: ensure no stray top-level block
const lines = s.split("\n")
console.log("line18:", lines[17])
console.log("around render end:", lines.slice(790, 800).join("\n"))
