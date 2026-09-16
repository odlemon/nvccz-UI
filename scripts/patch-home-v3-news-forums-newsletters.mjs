// Patches components/home-v3-mock/matanho-runtime.js for Phase 6 (News, Newsletters, Forums).
// Run: node scripts/patch-home-v3-news-forums-newsletters.mjs
//
// CRLF trap: the runtime file is 100% CRLF. Normalize to LF for matching, patch, restore CRLF on
// write. Every replace is FUNCTION-FORM (`.replace(old, () => new)`) — string-form silently
// corrupts on any `$`-prefixed sequence in the replacement.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, "..", "components", "home-v3-mock", "matanho-runtime.js")
const fragDir = join(__dirname, "_patch-fragments")

const raw = readFileSync(target, "utf8")
const isCrlf = raw.includes("\r\n")
let src = raw.replace(/\r\n/g, "\n")

let missed = []
function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    missed.push(label)
    return
  }
  src = src.replace(oldStr, () => newStr)
}
function frag(name) {
  return readFileSync(join(fragDir, name), "utf8").replace(/\r\n/g, "\n")
}
function patchFromFragments(label, oldFragName, newFragName) {
  patch(label, frag(oldFragName), frag(newFragName))
}

// --- Whole-function rewrites (fragment files avoid hand-escaping large nested template literals)
patchFromFragments("news-library-view", "news-library-view-old.fragment", "news-library-view-new.fragment")
patchFromFragments("news-article-view", "news-article-view-old.fragment", "news-article-view-new.fragment")
patchFromFragments("newsletters-view", "newsletters-view-old.fragment", "newsletters-view-new.fragment")
patchFromFragments(
  "newsletter-reader-view",
  "newsletter-reader-view-old.fragment",
  "newsletter-reader-view-new.fragment",
)
// newsletter-editor-view (the fake "Studio") is deleted outright — replaced by a simple create
// modal (see the new-newsletter action patch below). Its new fragment is empty.
patchFromFragments(
  "newsletter-editor-view (deleted)",
  "newsletter-editor-view-old.fragment",
  "newsletter-editor-view-new.fragment",
)
patchFromFragments("forums-view", "forums-view-old.fragment", "forums-view-new.fragment")
patchFromFragments("forum-thread-view", "forum-thread-view-old.fragment", "forum-thread-view-new.fragment")

// --- newsView() dispatcher still read the stale D.news fixture (no .replies array), even
// though newsLibraryView/newsArticleView themselves were rewritten to use D.newsPosts — missed
// because this one-line dispatcher wasn't part of either function's own fragment extraction.
// Caught live: clicking into a real post crashed with "Cannot read properties of undefined
// (reading 'forEach')" inside nestReplies, since the OLD fixture objects have no .replies.
patch(
  "newsView dispatcher reads D.newsPosts",
  `function newsView(){ return state.selectedNews ? newsArticleView(D.news.find(x=>x.id===state.selectedNews)||D.news[0]) : newsLibraryView(); }`,
  `function newsView(){ return state.selectedNews ? newsArticleView((D.newsPosts||[]).find(x=>x.id===state.selectedNews)||(D.newsPosts||[])[0]) : newsLibraryView(); }`,
)

// --- Shared helpers (timeAgo, excerpt, postContentHtml, nestReplies, forumCategories,
// postReplyForm) — inserted once, right before newsLibraryView (which is itself replaced above,
// so match against its NEW content to control insertion order deterministically).
patch(
  "insert shared helpers",
  frag("news-library-view-new.fragment"),
  frag("news-forums-helpers.fragment") + frag("news-library-view-new.fragment"),
)

// --- id-coercion bugs: dataset ids were Number()-coerced throughout, correct only for the
// mock's small integer ids. Real Post/Newsletter ids are cuid strings — Number(cuid) is NaN,
// which silently breaks navigation (the same bug class fixed for Calendar in Phase 4 and My
// Work in Phase 5). ---------------------------------------------------------------------------
patch(
  "data-news-open id coercion",
  `const no=e.target.closest('[data-news-open]'); if(no){state.selectedNews=Number(no.dataset.newsOpen);state.route='news';syncUrl();render();scrollTo(0,0);return}`,
  `const no=e.target.closest('[data-news-open]'); if(no){state.selectedNews=no.dataset.newsOpen;state.route='news';syncUrl();render();scrollTo(0,0);return}`,
)
patch(
  "data-newsletter-open id coercion",
  `const nlo=e.target.closest('[data-newsletter-open]'); if(nlo){state.selectedNewsletter=Number(nlo.dataset.newsletterOpen);state.newsletterMode='reader';state.route='newsletters';syncUrl();render();scrollTo(0,0);return}`,
  `const nlo=e.target.closest('[data-newsletter-open]'); if(nlo){state.selectedNewsletter=nlo.dataset.newsletterOpen;state.newsletterMode='reader';state.route='newsletters';syncUrl();render();scrollTo(0,0);return}`,
)
patch(
  "data-forum-open id coercion",
  `const fo=e.target.closest('[data-forum-open]'); if(fo){state.forumThread=Number(fo.dataset.forumOpen);state.route='forums';syncUrl();render();scrollTo(0,0);return}`,
  `const fo=e.target.closest('[data-forum-open]'); if(fo){state.forumThread=fo.dataset.forumOpen;state.route='forums';syncUrl();render();scrollTo(0,0);return}`,
)

// --- new-discussion modal: category select had no `name` (would never submit) and only 3 of
// the page's own 5 category pills; back-forums; add data-forum-filter handling -----------------
patch(
  "new-discussion modal + focus-reply selector",
  `if(action==='focus-reply'){document.querySelector('#forumReply textarea')?.focus();return}`,
  `if(action==='focus-reply'){document.querySelector('#postReplyForm textarea')?.focus();return}`,
)
patch(
  "new-newsletter action (Studio -> simple modal)",
  `if(action==='new-newsletter'){if(state.newsletterRole==='Read only'){toast('Your role has read-only access.');return}state.newsletterMode='editor';syncUrl();render();return}
      if(action==='preview-newsletter'){toast('Preview opened in a clean reading layout.');state.newsletterMode='reader';syncUrl();render();return}
      if(action==='publish-newsletter'){return}
      if(action==='confirm-schedule'){closePortal();toast('Newsletter scheduled.','success');return}`,
  `if(action==='new-newsletter'){modal('Create newsletter',\`<form id="newsletterForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field full"><label>Content</label><textarea class="textarea-control" name="content" required rows="8"></textarea></div><div class="form-field full"><label>Cover image (optional)</label><input type="file" name="image" accept="image/*"/></div></div><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Publish newsletter</button></div></form>\`);return}
      if(action==='new-post'){modal('New post',\`<form id="postForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field full"><label>Message</label><textarea class="textarea-control" name="content" required rows="6"></textarea></div></div><label class="setting-toggle"><div><strong>Notify everyone</strong><span>Send an in-app notification to all staff.</span></div><input type="checkbox" name="notify"/><i></i></label><div class="form-actions"><button type="button" class="secondary-btn" data-action="close-portal">Cancel</button><button class="primary-btn">Publish</button></div></form>\`);return}
      if(action==='toggle-solved'){const btn=e.target.closest('[data-post-solved]');const id=btn&&btn.dataset.postSolved;const p=(D.forumPosts||[]).find(x=>x.id===id);if(p){p.isSolved=!p.isSolved;render();toast(p.isSolved?'Marked as solved.':'Marked as unsolved.','success');emitIntegrationEvent('post.solved.toggled',{id:p.id,title:p.title,content:p.content,isSolved:p.isSolved})}return}`,
)
patch(
  "new-discussion modal category field + personalise-news removal",
  `if(action==='new-discussion'){modal('Start a discussion',\`<form id="discussionForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field"><label>Topic</label><select class="select-control"><option>Investment Insights</option><option>Client Experience</option><option>People & Culture</option></select></div><div class="form-field full"><label>Opening message</label><textarea class="textarea-control" name="body"></textarea></div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn">Publish discussion</button></div></form>\`);return}`,
  `if(action==='new-discussion'){modal('Start a discussion',\`<form id="discussionForm"><div class="form-grid"><div class="form-field full"><label>Title</label><input class="input-control" name="title" required/></div><div class="form-field full"><label>Topic</label><select class="select-control" name="category">\${forumCategories().map(c=>\`<option>\${esc(c)}</option>\`).join('')}</select></div><div class="form-field full"><label>Opening message</label><textarea class="textarea-control" name="body" required rows="5"></textarea></div></div><div class="form-actions"><button class="secondary-btn" type="button" data-action="close-portal">Cancel</button><button class="primary-btn">Publish discussion</button></div></form>\`);return}`,
)

// --- data-forum-filter: new segmented control in the rebuilt forumsView, no handler existed yet
patch(
  "add data-forum-filter handler",
  `const nf=e.target.closest('[data-news-filter]'); if(nf){state.newsFilter=nf.dataset.newsFilter;render();return}`,
  `const nf=e.target.closest('[data-news-filter]'); if(nf){state.newsFilter=nf.dataset.newsFilter;render();return}
    const ff=e.target.closest('[data-forum-filter]'); if(ff){state.forumFilter=ff.dataset.forumFilter;render();return}`,
)

// --- Real submit handlers: discussionForm and forumReply were both 100% fake (a toast with no
// data change); postForm/newsletterForm did not exist at all. -----------------------------------
patch(
  "discussionForm submit -> real emit",
  `if(e.target.id==='discussionForm'){closePortal();toast('Discussion published.','success');return}`,
  `if(e.target.id==='discussionForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('post.created',{title:f.get('title'),content:f.get('body'),category:f.get('category')});return}
    if(e.target.id==='postForm'){const f=new FormData(e.target);closePortal();emitIntegrationEvent('post.created',{title:f.get('title'),content:f.get('content'),category:null,isNotified:f.has('notify')});return}
    if(e.target.id==='newsletterForm'){const f=new FormData(e.target);const imageFile=f.get('image');closePortal();emitIntegrationEvent('newsletter.created',{title:f.get('title'),content:f.get('content'),imageFile:(imageFile&&imageFile.size)?imageFile:null});return}`,
)
patch(
  "forumReply submit -> postReplyForm real emit (shared by News comments and Forum replies)",
  `if(e.target.id==='forumReply'){const f=new FormData(e.target),text=(f.get('reply')||'').trim();if(!text)return;const key=state.forumThread||1;state.forumComments[key]=state.forumComments[key]||[];state.forumComments[key].push({id:Date.now(),person:'alex',text,time:'Just now',likes:0});saveState();e.target.reset();render();toast('Reply posted to the discussion.','success');return}`,
  `if(e.target.id==='postReplyForm'){const f=new FormData(e.target),text=String(f.get('reply')||'').trim();if(!text)return;emitIntegrationEvent('post.reply.created',{postId:e.target.dataset.replyPost,content:text});return}`,
)

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
