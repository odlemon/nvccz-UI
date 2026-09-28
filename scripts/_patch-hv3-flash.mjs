import fs from "fs"

const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8")
const nl = s.includes("\r\n") ? "\r\n" : "\n"

function replaceOnce(haystack, needle, replacement, label) {
  const idx = haystack.indexOf(needle)
  if (idx < 0) {
    console.error("MISSING:", label)
    process.exit(1)
  }
  return haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length)
}

// 1) applySessionUser: stop calling render()
if (!s.includes("patchSessionChrome()")) {
  s = replaceOnce(
    s,
    `    render();${nl}  }${nl}  function navigate(route) {`,
    `    patchSessionChrome();${nl}  }${nl}  function patchSessionChrome() {${nl}    const name = D.user.name || "";${nl}    const role = D.user.role || "";${nl}    const first = D.user.firstName || name.split(" ")[0] || "User";${nl}    const initials = D.user.initials || "";${nl}    const loc = state.profile.location || D.user.location || "";${nl}    app.querySelectorAll(".user-chip .meta strong, .user-button .user-copy strong").forEach((el) => {${nl}      el.textContent = name;${nl}    });${nl}    app.querySelectorAll(".user-chip .meta span, #userRoleCopy").forEach((el) => {${nl}      el.textContent = role;${nl}    });${nl}    app.querySelectorAll(".user-button .avatar").forEach((el) => {${nl}      if (!el.querySelector("img")) el.textContent = initials;${nl}    });${nl}    app.querySelectorAll(".user-chip .avatar").forEach((el) => {${nl}      if (D.user.image) {${nl}        el.classList.add("has-photo");${nl}        el.innerHTML = '<img src="' + esc(D.user.image) + '" alt="' + esc(name) + '" loading="lazy"/>';${nl}      } else if (!el.querySelector("img")) {${nl}        el.textContent = initials;${nl}      }${nl}    });${nl}    const greet = app.querySelector(".greeting");${nl}    if (greet) {${nl}      const iconNode = greet.querySelector("svg");${nl}      const iconHtml = iconNode ? iconNode.outerHTML : "";${nl}      const period = (typeof dayInfo === "function" && dayInfo().period) || "day";${nl}      greet.innerHTML = "Good " + period + ", " + esc(first) + " " + iconHtml;${nl}    }${nl}    const locEl = app.querySelector(".hero-location span");${nl}    if (locEl && loc) locEl.textContent = loc;${nl}  }${nl}  function navigate(route) {`,
    "applySessionUser render->patch"
  )
} else {
  console.log("applySessionUser already patched")
}

// 2) navigate: content-only (optional; render() will prefer content-only anyway)
s = replaceOnce(
  s,
  `    syncUrl();${nl}    render();${nl}    try { scrollTo(0,0); } catch (_) {}`,
  `    syncUrl();${nl}    render({ contentOnly: true });${nl}    try { scrollTo(0,0); } catch (_) {}`,
  "navigate contentOnly"
)

// 3) replace render() implementation
{
  const start = s.includes("function render(opts)")
    ? s.indexOf("  function render(opts)")
    : s.indexOf("  function render() {")
  if (start < 0) {
    console.error("MISSING: function render")
    process.exit(1)
  }
  const end = s.indexOf("  function toast(", start)
  if (end < 0) {
    console.error("MISSING: function toast after render")
    process.exit(1)
  }
  const newRender = [
    "  function render(opts) {",
    "    opts = opts || {};",
    "    rootEl.style.setProperty('--user-saturation',String((state.settings.saturation||118)/100));",
    "    rootEl.dataset.coverTheme=String(state.cover.theme||'Porcelain').toLowerCase();",
    "    const shellClasses=[state.sidebarCollapsed?'sidebar-collapsed':'','density-'+(state.settings.density||'comfortable'),state.settings.glass?'glass-on':'glass-off',state.settings.motion?'motion-on':'motion-off'].filter(Boolean).join(' ');",
    "    const existing = app.querySelector('.app-shell');",
    "    // Once the shell is mounted, only rewrite main.content unless a full shell",
    "    // rebuild is required (sidebar collapse / density / glass / first paint).",
    "    // Full app.innerHTML rewrites were the visible ~2s reload flash on every page.",
    "    const contentOnly = existing && !opts.full;",
    "    if (contentOnly) {",
    "      existing.className = 'app-shell ' + shellClasses;",
    "      existing.querySelectorAll('button.nav-item[data-nav]').forEach((btn) => {",
    "        btn.classList.toggle('active', btn.getAttribute('data-nav') === state.route);",
    "      });",
    "      const sidebar = existing.querySelector('aside.sidebar');",
    "      if (sidebar) {",
    "        sidebar.classList.toggle('open', !!state.mobileNav);",
    "        sidebar.classList.toggle('collapsed', !!state.sidebarCollapsed);",
    "      }",
    "      const content = existing.querySelector('main.content');",
    "      if (content) content.innerHTML = viewForRoute();",
    "    } else {",
    "      app.innerHTML = '<div class=\"app-shell ' + shellClasses + '\">' + renderSidebar() + '<div class=\"main\">' + renderTopbar() + '<main class=\"content\">' + viewForRoute() + '</main></div></div>';",
    "    }",
    "    closePortal();",
    "    syncControls(); syncSessionTimer();",
    "  }",
    "",
    "",
  ].join(nl)
  s = s.slice(0, start) + newRender + s.slice(end)
}

// 4) actions that must rebuild the shell
s = s.replace(
  `if(action==='mobile-menu'){state.mobileNav=!state.mobileNav;render();return}`,
  `if(action==='mobile-menu'){state.mobileNav=!state.mobileNav;render({ full: true });return}`
)
s = s.replace(
  `if(action==='collapse-sidebar'||action==='profile-sidebar-toggle'){state.sidebarCollapsed=!state.sidebarCollapsed;saveState();render();return}`,
  `if(action==='collapse-sidebar'||action==='profile-sidebar-toggle'){state.sidebarCollapsed=!state.sidebarCollapsed;saveState();render({ full: true });return}`
)

// 5) setRoute
{
  const needle = `      render();${nl}    },${nl}    setSessionUser(user) {`
  if (s.includes(needle)) {
    s = replaceOnce(
      s,
      needle,
      `      render({ contentOnly: true });${nl}    },${nl}    setSessionUser(user) {`,
      "setRoute contentOnly"
    )
  } else {
    console.log("setRoute render already contentOnly or different")
  }
}

// 6) hero desktop URL uses tablet/1080p asset, not 4k
if (s.includes("--hero-image-desktop:url('${scene.src}')")) {
  s = replaceOnce(
    s,
    "--hero-image-desktop:url('${scene.src}')",
    "--hero-image-desktop:url('${scene.tablet || scene.src}')",
    "hero desktop asset"
  )
} else if (s.includes("--hero-image-desktop:url('${scene.tablet || scene.src}')")) {
  console.log("hero desktop already patched")
} else {
  console.warn("hero desktop pattern missing")
}

fs.writeFileSync(p, s)
console.log("OK patched", p)
