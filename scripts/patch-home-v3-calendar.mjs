import fs from "fs"
import path from "path"

// Sixth pass. Same CRLF-normalise / function-form-replace rules as the earlier
// patch-home-v3-*.mjs scripts. The calendarView()/calendarEventsForDay() replacement is loaded
// from a plain fragment file (scripts/_patch-fragments/calendar-view.js.fragment) instead of
// being inlined as an escaped string here — that function pair is large and full of backticks
// and ${...}, and hand-escaping all of it in an outer template literal is exactly how the very
// first patch script in this series corrupted the runtime (see patch-home-v3-live-data.mjs's
// header). Reading a raw file sidesteps escaping entirely.
const p = "components/home-v3-mock/matanho-runtime.js"
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n")
let missed = 0

function patch(label, oldStr, buildNew) {
  if (s.includes(oldStr)) {
    s = s.replace(oldStr, () => buildNew())
  } else {
    missed++
    console.error(`MISS: ${label}`)
  }
}

// 1. calendarView() + calendarEventsForDay(): was two fully hardcoded functions (a frozen
//    "Mon 27 – Fri 31" week in July 2026, a 2-item fake event detailMap, a static "July 2026"
//    month grid). Replaced with date-math-driven versions reading D.myCalendarEntries (personal,
//    read/write) and D.companyEvents (the real Event model, read-only — see
//    design-refs/home-page/execution-plan.md Phase 4 for why creation isn't wired to it: it
//    notifies every user in the system). Agenda / "meeting intelligence" are dropped entirely —
//    no backing data for either exists anywhere.
const oldCalendarBlock = fs.readFileSync(
  path.join("scripts", "_patch-fragments", "calendar-view-old.js.fragment"),
  "utf8"
).replace(/\r\n/g, "\n").replace(/\n$/, "")
const newCalendarBlock = fs.readFileSync(
  path.join("scripts", "_patch-fragments", "calendar-view.js.fragment"),
  "utf8"
).replace(/\r\n/g, "\n").replace(/\n$/, "")
patch("calendarView + calendarEventsForDay", oldCalendarBlock, () => newCalendarBlock)

// 2. data-event click handler coerced the id with Number(...)||1 — fine for the old hardcoded
//    ids (1, 2) but silently maps every real cuid/uuid id to NaN -> falls back to 1. Keep the
//    raw string id instead.
patch(
  "data-event click handler id coercion",
  "const ev=e.target.closest('[data-event]'); if(ev){if(state.route==='calendar'){state.calendarSelectedEvent=Number(ev.dataset.event)||1;state.calendarDetailsOpen=true;saveState();render()}else eventDrawer(ev.dataset.event);return}",
  () =>
    "const ev=e.target.closest('[data-event]'); if(ev){if(state.route==='calendar'){state.calendarSelectedEvent=ev.dataset.event;state.calendarDetailsOpen=true;saveState();render()}else eventDrawer(ev.dataset.event);return}"
)

// 3. eventForm submit: was closePortal()+toast only, no data captured at all. Now builds a
//    start/end from the form's date+time (defaulting to a 1-hour block, since the form has no
//    duration field) and emits the same integration-event pattern every other write action uses.
patch(
  "eventForm submit handler",
  "if(e.target.id==='eventForm'){closePortal();toast('Event created.','success');return}",
  () =>
    "if(e.target.id==='eventForm'){const f=new FormData(e.target);const dateStr=String(f.get('date')||'');const timeStr=String(f.get('time')||'09:00');const start=dateStr?new Date(dateStr+'T'+timeStr):new Date();const end=new Date(start.getTime()+60*60000);const attendees=String(f.get('attendees')||'').trim();emitIntegrationEvent('calendar.entry.created',{title:f.get('title'),startDate:start.toISOString(),endDate:end.toISOString(),description:attendees?('Attendees: '+attendees):null});closePortal();toast('Event created.','success');return}"
)

// 4. New delete-calendar-entry action, for the "Remove" button calendarView() now renders on
//    the detail panel for entries the user owns (source==='mine'). Same anchor/shape as
//    delete-wallpaper from the previous patch.
patch(
  "reset-daily-cover anchor for delete-calendar-entry action",
  "if(action==='reset-daily-cover'){state.cover.theme='Porcelain';state.cover.wallpaper='auto';state.heroOffset=0;state.settings.autoHero=true;saveState();emitIntegrationEvent('preferences.theme.updated',{theme:'Porcelain',wallpaper:'auto'});render();toast('Daily Cover reset to automatic rotation.','success');return}",
  () =>
    "if(action==='reset-daily-cover'){state.cover.theme='Porcelain';state.cover.wallpaper='auto';state.heroOffset=0;state.settings.autoHero=true;saveState();emitIntegrationEvent('preferences.theme.updated',{theme:'Porcelain',wallpaper:'auto'});render();toast('Daily Cover reset to automatic rotation.','success');return}\n      if(action==='delete-calendar-entry'){const id=e.target.closest('[data-action=\"delete-calendar-entry\"]')?.dataset.entryId;if(!id)return;emitIntegrationEvent('calendar.entry.deleted',{id});return}"
)

fs.writeFileSync(p, s.replace(/\n/g, "\r\n"))
console.log(missed === 0 ? "0 missed" : `${missed} missed`)
