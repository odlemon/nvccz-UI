import fs from "fs"

const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8")

// --- syncUrl helper after navigate ---
if (!s.includes("function syncUrl(")) {
  s = s.replace(
    `function navigate(route) {
    state.route = route;
    state.mobileNav = false;
    if (typeof window.__HOME_V3_NAV__ === 'function') window.__HOME_V3_NAV__(route);
    render();
    try { scrollTo(0,0); } catch (_) {}
  }`,
    `function syncUrl() {
    if (typeof window.__HOME_V3_PATH__ === 'function') {
      window.__HOME_V3_PATH__({
        route: state.route,
        selectedNews: state.selectedNews,
        forumThread: state.forumThread,
        selectedNewsletter: state.selectedNewsletter,
        newsletterMode: state.newsletterMode,
      });
    } else if (typeof window.__HOME_V3_NAV__ === 'function') {
      window.__HOME_V3_NAV__(state.route);
    }
  }
  function navigate(route) {
    state.route = route;
    state.mobileNav = false;
    // Sidebar / top-level navigate always resets drill-downs
    state.selectedNews = null;
    state.forumThread = null;
    if (route === 'newsletters') state.newsletterMode = 'library';
    else state.newsletterMode = 'library';
    syncUrl();
    render();
    try { scrollTo(0,0); } catch (_) {}
  }`
  )
}

// --- setRoute accepts detail hydration ---
s = s.replace(
  /api = \{\s*setRoute\(route\) \{\s*state\.route = route;\s*state\.mobileNav = false;\s*render\(\);\s*\},/,
  `api = {
    setRoute(route, detail = {}) {
      state.route = route;
      state.mobileNav = false;
      if (Object.prototype.hasOwnProperty.call(detail, 'selectedNews')) state.selectedNews = detail.selectedNews;
      if (Object.prototype.hasOwnProperty.call(detail, 'forumThread')) state.forumThread = detail.forumThread;
      if (Object.prototype.hasOwnProperty.call(detail, 'selectedNewsletter') && detail.selectedNewsletter != null) {
        state.selectedNewsletter = detail.selectedNewsletter;
      }
      if (Object.prototype.hasOwnProperty.call(detail, 'newsletterMode') && detail.newsletterMode) {
        state.newsletterMode = detail.newsletterMode;
      }
      if (route === 'news' && detail.selectedNews == null && !Object.prototype.hasOwnProperty.call(detail, 'selectedNews')) {
        /* keep existing */
      }
      render();
    },`
)

// --- copy links use Next paths ---
s = s.replace(
  "if(action==='copy-cover-link'){navigator.clipboard?.writeText(location.href+'#/daily-cover');toast('Share link copied.','success');return}",
  "if(action==='copy-cover-link'){navigator.clipboard?.writeText(location.origin+'/home-v3/cover');toast('Share link copied.','success');return}"
)
s = s.replace(
  "if(action==='copy-profile'){navigator.clipboard?.writeText(location.href+'#/my-profile');toast('Profile link copied.','success');return}",
  "if(action==='copy-profile'){navigator.clipboard?.writeText(location.origin+'/home-v3/profile');toast('Profile link copied.','success');return}"
)

// --- back / open detail → sync URL ---
s = s.replace(
  "if(action==='back-news'){state.selectedNews=null;render();return}",
  "if(action==='back-news'){state.selectedNews=null;syncUrl();render();return}"
)
s = s.replace(
  "if(action==='back-forums'){state.forumThread=null;render();return}",
  "if(action==='back-forums'){state.forumThread=null;syncUrl();render();return}"
)
s = s.replace(
  "if(action==='new-newsletter'){if(state.newsletterRole==='Read only'){toast('Your role has read-only access.');return}state.newsletterMode='editor';render();return}",
  "if(action==='new-newsletter'){if(state.newsletterRole==='Read only'){toast('Your role has read-only access.');return}state.newsletterMode='editor';syncUrl();render();return}"
)
s = s.replace(
  "if(action==='preview-newsletter'){toast('Preview opened in a clean reading layout.');state.newsletterMode='reader';render();return}",
  "if(action==='preview-newsletter'){toast('Preview opened in a clean reading layout.');state.newsletterMode='reader';syncUrl();render();return}"
)

s = s.replace(
  "const no=e.target.closest('[data-news-open]'); if(no){state.selectedNews=Number(no.dataset.newsOpen);render();scrollTo(0,0);return}",
  "const no=e.target.closest('[data-news-open]'); if(no){state.selectedNews=Number(no.dataset.newsOpen);state.route='news';syncUrl();render();scrollTo(0,0);return}"
)
s = s.replace(
  "const nm=e.target.closest('[data-newsletter-mode]'); if(nm){state.newsletterMode=nm.dataset.newsletterMode;render();scrollTo(0,0);return}",
  "const nm=e.target.closest('[data-newsletter-mode]'); if(nm){state.newsletterMode=nm.dataset.newsletterMode;state.route='newsletters';syncUrl();render();scrollTo(0,0);return}"
)
s = s.replace(
  "const nlo=e.target.closest('[data-newsletter-open]'); if(nlo){state.selectedNewsletter=Number(nlo.dataset.newsletterOpen);state.newsletterMode='reader';render();scrollTo(0,0);return}",
  "const nlo=e.target.closest('[data-newsletter-open]'); if(nlo){state.selectedNewsletter=Number(nlo.dataset.newsletterOpen);state.newsletterMode='reader';state.route='newsletters';syncUrl();render();scrollTo(0,0);return}"
)
s = s.replace(
  "const fo=e.target.closest('[data-forum-open]'); if(fo){state.forumThread=Number(fo.dataset.forumOpen);render();scrollTo(0,0);return}",
  "const fo=e.target.closest('[data-forum-open]'); if(fo){state.forumThread=Number(fo.dataset.forumOpen);state.route='forums';syncUrl();render();scrollTo(0,0);return}"
)

// toast → document.body so overflow:clip on root doesn't hide it
s = s.replace(
  "let c=rootEl.querySelector('.toast-container'); if(!c){c=document.createElement('div');c.className='toast-container';rootEl.appendChild(c)}",
  "let c=document.querySelector('.home-v3-toast-host'); if(!c){c=document.createElement('div');c.className='home-v3-toast-host toast-container';document.body.appendChild(c)}"
)

fs.writeFileSync(p, s)
console.log("patched runtime")
console.log("syncUrl", s.includes("function syncUrl("))
console.log("HOME_V3_PATH", s.includes("__HOME_V3_PATH__"))
console.log("setRoute detail", s.includes("setRoute(route, detail"))
