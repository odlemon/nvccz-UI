import fs from "fs"

// Fifth pass. Same CRLF-normalise / function-form-replace rules as the earlier
// patch-home-v3-*.mjs scripts. Prompted by live testing: the 15s rotation poll only checks
// while the tab/pane is visible (browsers throttle setInterval in hidden tabs, confirmed via
// document.hidden during a real wait), so a page left in the background can show a stale
// wallpaper until *something* re-renders it. currentHeroScene() itself was already verified
// correct (a reload immediately showed the right image), so this just adds a visibilitychange
// catch-up: the moment the page is looked at again, it re-checks immediately instead of
// waiting up to 15s more.
const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")
let missed = 0

const oldStr =
  "  lastRotationIndex = currentHeroScene().index;\n  wallpaperRotationTimer = window.setInterval(() => {\n    if (state.cover.wallpaper !== 'auto') return;\n    const scene = currentHeroScene();\n    if (scene.index !== lastRotationIndex) { lastRotationIndex = scene.index; render(); }\n  }, 15000);"

if (s.includes(oldStr)) {
  const newStr = `function checkWallpaperRotation(){
    if (state.cover.wallpaper !== 'auto') return;
    const scene = currentHeroScene();
    if (scene.index !== lastRotationIndex) { lastRotationIndex = scene.index; render(); }
  }
  lastRotationIndex = currentHeroScene().index;
  wallpaperRotationTimer = window.setInterval(checkWallpaperRotation, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkWallpaperRotation(); }, __hv3Sig);`
  s = s.replace(oldStr, () => newStr)
} else if (!s.includes("function checkWallpaperRotation()")) {
  missed++
  console.error("MISS: rotation timer block not found verbatim")
}

fs.writeFileSync(p, s.replace(/\n/g, "\r\n"))
console.log(missed === 0 ? "0 missed" : `${missed} missed`)
