// Patches components/home-v3-mock/matanho-runtime.js to wire the Matanho AI panel to a real LLM
// (POST /api/assistant/chat -> LlmChatService, see execution-plan.md's Phase 1b note).
// Run: node scripts/patch-home-v3-assistant.mjs
//
// CRLF trap: the runtime file is 100% CRLF. Normalize to LF for matching, patch, restore CRLF on
// write. Every replace is FUNCTION-FORM (`.replace(old, () => new)`) — string-form silently
// corrupts on any `$`-prefixed sequence in the replacement.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const target = join(__dirname, "..", "components", "home-v3-mock", "matanho-runtime.js")

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

// --- aiSources(): "Documents" was a flat hardcoded count:8 with nothing behind it (no document
// repository concept exists anywhere in this build) — dropped. Forums/News/People now reflect the
// same real D.forumPosts/D.newsPosts/D.directory Phases 6-7 already loaded, instead of the mock
// fixture's D.forums/D.news/D.people. -------------------------------------------------------------
patch(
  "aiSources real counts",
  `function aiSources(){
    return [
      {id:'work',label:'My Work',icon:'check',count:state.workTasks.length,detail:\`\${state.workTasks.filter(t=>!t.done).length} open tasks\`},
      {id:'calendar',label:'Calendar',icon:'calendar',count:D.schedule.length,detail:'Meetings and focus blocks'},
      {id:'documents',label:'Documents',icon:'folder',count:8,detail:'Files you can access'},
      {id:'forums',label:'Forums',icon:'forum',count:D.forums.length,detail:'Discussions and accepted answers'},
      {id:'news',label:'News',icon:'news',count:D.news.length,detail:'Internal and trusted sources'},
      {id:'people',label:'People',icon:'people',count:D.people.length,detail:'Profiles, skills and availability'}
    ];
  }`,
  `function aiSources(){
    return [
      {id:'work',label:'My Work',icon:'check',count:state.workTasks.length,detail:\`\${state.workTasks.filter(t=>!t.done).length} open tasks\`},
      {id:'calendar',label:'Calendar',icon:'calendar',count:D.schedule.length,detail:'Meetings and focus blocks'},
      {id:'forums',label:'Forums',icon:'forum',count:(D.forumPosts||[]).length,detail:'Discussions across the company'},
      {id:'news',label:'News',icon:'news',count:(D.newsPosts||[]).length,detail:'Company announcements'},
      {id:'people',label:'People',icon:'people',count:(D.directory||[]).length,detail:'Colleague directory'}
    ];
  }`,
)

// --- aiRespond(): was 100% synchronous canned keyword-matching (aiAnswerFor — if(prompt.includes
// ('leave'))... a small hardcoded FAQ bot, not AI). Every entry point (top composer, panel
// composer, workflow suggestion cards, recent-question list, cmd/ctrl+Enter) already funnels
// through this one function, so patching it here covers all of them. Now fires a real request and
// shows a "Thinking…" placeholder — aiMessageView() already has a plain-text fallback path for a
// title-less assistant message, so no separate view-function patch is needed. --------------------
patch(
  "aiRespond -> real async LLM call",
  `function aiRespond(prompt){
    const p=String(prompt||'').trim(); if(!p)return;
    state.aiMode='ask';
    state.aiMessages.push({role:'user',text:p,createdAt:Date.now()});
    const answer=aiAnswerFor(p);
    state.aiMessages.push({role:'assistant',prompt:p,createdAt:Date.now(),...answer});
    state.aiRecent=[{id:\`ai-\${Date.now()}\`,title:answer.title,prompt:p,meta:'Just now'},...state.aiRecent.filter(x=>x.prompt!==p)].slice(0,8);
    saveState(); render();
    setTimeout(()=>{const thread=document.getElementById('aiConversation');if(thread)thread.scrollTo({top:thread.scrollHeight,behavior:'smooth'})},60);
  }`,
  `function aiRespond(prompt){
    const p=String(prompt||'').trim(); if(!p)return;
    state.aiMode='ask';
    const historyForApi=state.aiMessages.filter(m=>!m.pending).map(m=>({role:m.role,content:m.text||m.summary||''}));
    state.aiMessages.push({role:'user',text:p,createdAt:Date.now()});
    state.aiMessages.push({role:'assistant',text:'Thinking…',pending:true,createdAt:Date.now()});
    saveState(); render();
    setTimeout(()=>{const thread=document.getElementById('aiConversation');if(thread)thread.scrollTo({top:thread.scrollHeight,behavior:'smooth'})},60);
    emitIntegrationEvent('assistant.message.sent',{prompt:p,history:historyForApi});
  }`,
)

// --- New host->runtime data path: no hydrate() API exists, and unlike every other action in this
// build a full reload would destroy the conversation, so the host calls this directly (see
// home-v3-app.tsx's onAssistantMessageSent) once the real reply comes back, replacing the
// "Thinking…" placeholder in place. -----------------------------------------------------------
patch(
  "add receiveAssistantReply to the exposed runtime API",
  `setSessionUser(user) {
      applySessionUser(user);
    },
    `,
  `setSessionUser(user) {
      applySessionUser(user);
    },
    receiveAssistantReply(text, isError) {
      const idx = state.aiMessages.findIndex(m => m.pending);
      const promptText = idx > 0 ? (state.aiMessages[idx - 1].text || '') : '';
      const msg = { role: 'assistant', text: String(text || ''), createdAt: Date.now(), error: !!isError };
      if (idx !== -1) state.aiMessages[idx] = msg; else state.aiMessages.push(msg);
      if (!isError) {
        state.aiRecent = [{ id: \`ai-\${Date.now()}\`, title: String(text || '').slice(0, 60), prompt: promptText, meta: 'Just now' }, ...state.aiRecent].slice(0, 8);
      }
      saveState(); render();
      setTimeout(() => { const thread = document.getElementById('aiConversation'); if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' }) }, 60);
    },
    `,
)

if (missed.length) {
  console.error(`MISSED (${missed.length}):`)
  for (const m of missed) console.error(" -", m)
  process.exit(1)
}

if (isCrlf) src = src.replace(/\n/g, "\r\n")
writeFileSync(target, src, "utf8")
console.log("Patched matanho-runtime.js — 0 missed.")
