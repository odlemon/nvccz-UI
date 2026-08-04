import fs from "fs"
import path from "path"

const src =
  "C:/Users/lysp/Downloads/Matanho_Employee_Hub_Premium_v17_1/index.html"
const html = fs.readFileSync(src, "utf8")

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
const main = scripts.sort((a, b) => b.length - a.length)[0]

let code = main
code = code.replace(/window\.MATANHO_DATA\s*=\s*\{[\s\S]*?\};/, "/* MATANHO_DATA injected */")
code = code.replace(/window\.MATANHO_CONFIG\s*=\s*\{[\s\S]*?\};/, "/* MATANHO_CONFIG injected */")
code = code.replace(/(['"])assets\//g, "$1/home-v3/assets/")
code = code.replace(/src=\"assets\//g, 'src="/home-v3/assets/')
code = code.replace(/src='assets\//g, "src='/home-v3/assets/")

// Unwrap IIFE: (() => { ... })();  →  { ... }
code = code.replace(/^\s*\(\(\)\s*=>\s*\{/, "{")
code = code.replace(/\}\)\(\);\s*$/, "}")

// Initial route from options, not hash
code = code.replace(
  /route:\s*location\.hash\.replace\('#\/',\s*''\)\s*\|\|\s*'home'/,
  "route: initialRoute || 'home'"
)

// navigate → Next bridge (V17 only sets hash; hashchange owned the render)
code = code.replace(
  /function navigate\(route\)\s*\{[\s\S]*?\n  \}/,
  `function navigate(route) {
    state.route = route;
    state.mobileNav = false;
    if (typeof window.__HOME_V3_NAV__ === 'function') window.__HOME_V3_NAV__(route);
    render();
    try { scrollTo(0,0); } catch (_) {}
  }`
)

// Drop hashchange listener
code = code.replace(
  /window\.addEventListener\('hashchange',\s*\(\)\s*=>\s*\{[^}]+\}\);\s*/g,
  "/* hashchange disabled — Next.js owns routing */\n  "
)

// Scope DOM lookups to mount root
code = code.replace(/document\.getElementById\('app'\)/g, "app")
code = code.replace(/document\.getElementById\(\"app\"\)/g, "app")
code = code.replace(/document\.getElementById\('portal'\)/g, "portal")
code = code.replace(/document\.getElementById\(\"portal\"\)/g, "portal")

// Cover theme + saturation on scoped root
code = code.replace(/document\.documentElement\.style\.setProperty/g, "rootEl.style.setProperty")
code = code.replace(/document\.documentElement\.dataset\.coverTheme/g, "rootEl.dataset.coverTheme")

// Fix brand logo path if still relative in template strings
code = code.replace(/src="\/home-v3\/assets\/matanho-logo\.png"/g, 'src="/home-v3/assets/matanho-logo.png"')
code = code.replace(
  /src="assets\/matanho-logo\.png"/g,
  'src="/home-v3/assets/matanho-logo.png"'
)

const out = "components/home-v3-mock/matanho-runtime.js"
fs.writeFileSync(
  out,
  `/* Auto-extracted Matanho V17.1 runtime — adapted for Home Version 3 */
export function startMatanhoRuntime(rootEl, options = {}) {
  const initialRoute = options.initialRoute || "home";
  window.__HOME_V3_NAV__ = options.onNavigate || (() => {});
  window.MATANHO_DATA = options.data;
  window.MATANHO_CONFIG = options.config || { useMockData: true, apiBaseUrl: "" };

  rootEl.innerHTML = "";
  const app = document.createElement("div");
  app.id = "app";
  const portal = document.createElement("div");
  portal.id = "portal";
  rootEl.appendChild(app);
  rootEl.appendChild(portal);

  let api = { setRoute() {}, destroy() {} };

  ${code}

  api = {
    setRoute(route) {
      state.route = route;
      state.mobileNav = false;
      render();
    },
    destroy() {
      try {
        if (typeof timerInterval !== "undefined" && timerInterval) clearInterval(timerInterval);
      } catch (_) {}
      try {
        if (typeof sessionTimer !== "undefined" && sessionTimer) clearInterval(sessionTimer);
      } catch (_) {}
      delete window.__HOME_V3_NAV__;
      rootEl.innerHTML = "";
    },
  };

  return api;
}
`
)
console.log("Wrote", out, fs.statSync(out).size)

// Also fix CSS scoping for global selectors
const cssPath = "components/home-v3-mock/home-v3.css"
let css = fs.readFileSync(cssPath, "utf8")
css = css.replace(/^\* \{ box-sizing: border-box; \}/m, ".home-v3-root, .home-v3-root * { box-sizing: border-box; }")
css = css.replace(/^button, input, select, textarea \{ font: inherit; \}/m, ".home-v3-root button, .home-v3-root input, .home-v3-root select, .home-v3-root textarea { font: inherit; }")
css = css.replace(/^button \{ color: inherit; \}/m, ".home-v3-root button { color: inherit; }")
css = css.replace(/^a \{ color: inherit; text-decoration: none; \}/m, ".home-v3-root a { color: inherit; text-decoration: none; }")
css = css.replace(/^button, \.clickable \{/m, ".home-v3-root button, .home-v3-root .clickable {")
css = css.replace(/^::selection \{/m, ".home-v3-root ::selection {")
// Scope common bare element rules that appear later
css = css.replace(/^img \{/gm, ".home-v3-root img {")
css = css.replace(/^svg \{/gm, ".home-v3-root svg {")
fs.writeFileSync(cssPath, css)
console.log("Scoped CSS globals")
