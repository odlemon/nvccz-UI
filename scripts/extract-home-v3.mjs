import fs from "fs"
import path from "path"

const src =
  "C:/Users/lysp/Downloads/Matanho_Employee_Hub_Premium_v17_1/index.html"
const html = fs.readFileSync(src, "utf8")

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/)
if (!styleMatch) throw new Error("No style block")
let css = styleMatch[1]
css = css.replace(/:root\b/g, ".home-v3-root")
css = css.replace(/html\[data-cover-theme=/g, ".home-v3-root[data-cover-theme=")
css = css.replace(/\bhtml\b(?=\s*\{)/g, ".home-v3-root")
css = css.replace(/\bbody\b(?=\s*[,{])/g, ".home-v3-root")
css = css.replace(/url\((['"]?)assets\//g, "url($1/home-v3/assets/")

const outCss = "components/home-v3-mock/home-v3.css"
fs.mkdirSync(path.dirname(outCss), { recursive: true })
fs.writeFileSync(
  outCss,
  "/* Scoped Matanho Employee Hub Premium V17.1 styles for Home Version 3 */\n" + css
)
console.log("Wrote CSS", fs.statSync(outCss).size)

// Extract MATANHO_DATA object literal
const marker = "window.MATANHO_DATA"
const start = html.indexOf(marker)
if (start < 0) throw new Error("No MATANHO_DATA")
const eq = html.indexOf("=", start)
let i = eq + 1
while (html[i] === " " || html[i] === "\n") i++
if (html[i] !== "{") throw new Error("Expected object")
let depth = 0
let end = i
for (; end < html.length; end++) {
  const c = html[end]
  if (c === "{") depth++
  else if (c === "}") {
    depth--
    if (depth === 0) {
      end++
      break
    }
  }
}
const objSrc = html.slice(i, end)
const fixturesDir = "lib/home-v3-mock"
fs.mkdirSync(fixturesDir, { recursive: true })
const fixturesPath = path.join(fixturesDir, "matanho-data.ts")
// Rewrite asset paths in data strings
const rewritten = objSrc
  .replace(/assets\//g, "/home-v3/assets/")
  .replace(/'\/home-v3\/assets\//g, "'/home-v3/assets/")
fs.writeFileSync(
  fixturesPath,
  `/* eslint-disable */\n// Extracted from Matanho Employee Hub Premium V17.1\nexport const MATANHO_DATA = ${rewritten} as const\n`
)
console.log("Wrote fixtures", fs.statSync(fixturesPath).size)

// Extract heroScenes array
const hs = html.indexOf("heroScenes")
const snippet = html.slice(hs, hs + 2500)
const hsMatch = snippet.match(/heroScenes\s*=\s*(\[[\s\S]*?\])\s*;/)
if (hsMatch) {
  let arr = hsMatch[1].replace(/assets\//g, "/home-v3/assets/")
  fs.writeFileSync(
    path.join(fixturesDir, "hero-scenes.ts"),
    `export type HeroScene = { src: string; tablet: string; mobile: string; label: string; mood: string }\nexport const HERO_SCENES: HeroScene[] = ${arr}\n`
  )
  console.log("Wrote hero scenes")
} else {
  console.log("heroScenes extract failed, snippet:", snippet.slice(0, 400))
}

// Dump function bodies for reference
const names = [
  "renderSidebar",
  "renderTopbar",
  "workdaySessionPanel",
  "homeView",
  "dailyCoverView",
  "newsLibraryView",
  "newsArticleView",
  "newslettersView",
  "newsletterReaderView",
  "newsletterEditorView",
  "forumsView",
  "forumThreadView",
  "calendarView",
  "myWorkView",
  "performanceView",
  "peopleView",
  "profileView",
  "servicesView",
  "appsView",
  "aiView",
]
const dumpDir = "components/home-v3-mock/_client-excerpts"
fs.mkdirSync(dumpDir, { recursive: true })
for (const name of names) {
  const re = new RegExp(`function ${name}\\s*\\([^)]*\\)\\s*\\{`)
  const m = html.match(re)
  if (!m || m.index == null) {
    console.log("missing", name)
    continue
  }
  let startFn = m.index
  let brace = html.indexOf("{", startFn)
  let d = 0
  let e = brace
  for (; e < html.length; e++) {
    if (html[e] === "{") d++
    else if (html[e] === "}") {
      d--
      if (d === 0) {
        e++
        break
      }
    }
  }
  fs.writeFileSync(path.join(dumpDir, `${name}.js`), html.slice(startFn, e))
  console.log("excerpt", name, e - startFn)
}
