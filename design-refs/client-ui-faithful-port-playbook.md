# Client UI faithful port — playbook

**Audience:** Agents (and humans) integrating the next client-delivered UI the same way as Home Version 3.  
**Skill:** `.cursor/skills/client-ui-faithful-port/SKILL.md` (auto-applies when integrating client designs).  
**Reference ship:** `/home-v3` + [home-v3-ui-handoff.md](./home-v3-ui-handoff.md)

---

## What “same as Home V3” means

1. Client folder on disk is the source of truth (code and/or mockups).
2. We integrate into **this** Next.js app as a **new parallel module** (App Switcher entry).
3. Visuals and interactivity match the client — **no redesign**, no Arcus pill override for that module.
4. Existing Homepage / Employee Hub / other live modules stay untouched.
5. Fixture/mock phase is fine; BE asks go to `design-refs/` if needed later.
6. End with a handoff MD + route smoke test.

---

## Working loop

```
Client package path from user
        ↓
Audit stack (vanilla SPA vs React vs PDF-only)
        ↓
Pick mode A / B / C (see skill)
        ↓
Flag CSS/deps conflicts
        ↓
Scaffold module + permissions + assets
        ↓
Extract/port CSS + UI (full suite unless scoped)
        ↓
Wire Next routes + deep links
        ↓
Optional: public pass-through (no login)
        ↓
Handoff MD + verify routes
        ↓
User reviews in browser
```

---

## Mode cheat sheet

| Mode | When | Core idea |
|------|------|-----------|
| **A Runtime host** | Client is vanilla `index.html` SPA | Extract CSS/JS; React host mounts runtime; Next owns URLs |
| **B Component port** | Client already React | Adapt into `components/<module>-mock/` |
| **C Screen rebuild** | PDF/PNG only | Tokens + fixtures + screens (Employee Hub / Accounting V2 style) |

Home V3 used **Mode A**.

---

## Standard file layout

```
app/<module>/...
components/layout/<module>-layout.tsx
components/<module>-mock/          # host, css, runtime or screens
lib/<module>-mock/                 # nav, fixtures, tokens
public/<module>/assets/
design-refs/<module>-ui-handoff.md
lib/config/modules.ts              # App Switcher tile
lib/config/role-permissions.ts
middleware.ts                      # passThrough if public preview
```

---

## Home V3 lessons (don’t skip next time)

1. **Port the whole suite** the client shipped (sidebar IA), not only the first screen.
2. Prefer **extract + host** over rewriting thousands of lines of JSX when fidelity is the goal.
3. **Scope CSS** under a root class or you will break Arcus chrome.
4. Keep runtime **mounted in layout** so navigating child routes doesn’t remount/reset.
5. Wire **deep links** (article/thread/editor) both ways.
6. If port 3001 is Cursor realtime, start Next on **3002** (`Cannot GET` = wrong process).
7. For review with backend down: middleware pass-through + no ModuleGuard.

---

## What to ask the user when a new UI arrives

1. Path to the client folder on this PC  
2. Module display name (e.g. “Payroll Version 2”) and URL slug  
3. Full suite vs one screen only  
4. Need public no-login preview?  
5. Keep SharedTopbar for App Switcher comparison? (default yes)

Then follow the skill checklist end-to-end.
