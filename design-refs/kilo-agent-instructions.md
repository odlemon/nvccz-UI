# Kilo Agent Instructions — Arcus / NVCCZ

This file is the **mandatory quick-reference** for every Kilo session on this project.
The full source-of-truth handbook is at:

`C:\Users\lysp\Downloads\nvccz-new\design-refs\agent-operations-and-deployment-handbook.md`

**Read the entire handbook before any substantive work.** Do not rely solely on this summary.

---

## 1. Two-Repository Rule

| Repo | Absolute Path | Role |
|------|---------------|------|
| **Frontend (UI)** | `C:\Users\lysp\Downloads\nvccz-new` | Next.js 14 app — all portals, modules, deploy compose files |
| **Backend (API)** | `C:\Users\lysp\Downloads\nvccz` | Node/Express + Prisma + MySQL |

- Do NOT assume backend code lives in the frontend repo.
- Do NOT modify backend unless the task explicitly requires backend work.
- Do NOT modify unrelated modules while investigating.

---

## 2. Local Development Ports

| Service | Port | Command / Notes |
|---------|------|-----------------|
| MySQL | `3306` | Start via `C:\Users\lysp\Downloads\nvccz\scripts\start-local-mysql.bat` or `npm run start:servers` |
| Backend API | `3009` | From backend repo: `npm run dev` |
| Staff frontend | `3000` | From frontend repo: `npm run dev` |
| LP frontend | `3110` | From frontend repo: `npm run dev:lp` |
| Investee frontend | `3120` | From frontend repo: `npm run dev:investee` |
| Apply frontend | `3130` | From frontend repo: `npm run dev:apply` |

**"Start servers" always means:** MySQL → Backend → Frontend. Use `npm run start:servers` from the frontend repo.

---

## 3. Multi-Portal Separation (Non-Negotiable)

Arcus/NVCCZ has **four independent frontend deployments**:

- Staff (`NEXT_PUBLIC_PORTAL=staff`)
- LP (`NEXT_PUBLIC_PORTAL=lp`)
- Investee (`NEXT_PUBLIC_PORTAL=investee`)
- Apply (`NEXT_PUBLIC_PORTAL=apply`)

Rules:
- Do NOT merge portal behavior.
- Do NOT expose staff routes to LP/investee.
- Do NOT make Apply require authentication.
- Do NOT bypass portal routing/security (`middleware.ts`, `lib/portal/config.ts`).
- Auth cookies and JWT `aud` claims are intentionally isolated per portal.

---

## 4. No-Guessing Rule

Do NOT:
- Guess user intent.
- Invent requirements, endpoints, DB fields, files, components, routes, ports, or env vars.
- Assume a service/DB/API is running or available.
- Replace existing architecture with your preferred architecture.
- Refactor, rename, or delete existing code unless explicitly required.

If something is unclear, **STOP and ask**.

---

## 5. Verification Requirement

Every implementation must pass two verification passes:

1. **Static pass:** Re-read changed files; confirm imports, paths, types, and behavior match the request; confirm no unrelated files changed.
2. **Runtime pass:** Grep/trace UI → API client → backend; run lint/build/type checks; restart services; hit health endpoints; perform smoke tests.

Only after both passes may you describe something as wired/live/working.

---

## 6. No Fake Data (Hard Requirement)

If a real API returns no data:
- Show the appropriate empty state.
- Do NOT invent numbers or silently fall back to fixtures.
- Do NOT use demo data to hide backend/API problems.

Fixtures are only allowed when explicitly documented for public preview or local demo.

---

## 7. Documentation Is Part of Implementation

- `design-refs/` is source of truth. Update it when status, architecture, or backend requirements change.
- Document backend gaps in `design-refs/*-backend-asks.md`.
- Do not leave critical knowledge only in chat.

---

## 8. No Unrequested Git Actions

Do NOT commit, push, create PRs, or amend commits unless the project owner explicitly asks.

---

## 9. Database & Migration Safety

- Local DB: `127.0.0.1:3306` / database `arcus_dev`.
- After Prisma schema changes: `npx prisma generate` → `npx prisma db push` → restart backend → verify.
- Log every local schema/data change in `design-refs/vps-pending-migrations.md` with `appliedToLocal` / `appliedToVps`.
- **Never** run `docker compose down -v` against production.
- **Never** blindly run production seeds on production/client databases.
- Server migrations run automatically on API container start via `docker-entrypoint.sh` (`prisma db push --skip-generate`).

---

## 10. Agent Workflow (Short Testable Slices)

1. Read relevant `design-refs`.
2. Search codebase for existing implementation.
3. Audit status: Implemented / Partial / Missing / BE-blocked / Broken.
4. Implement **only** the current requested stage.
5. Wire UI → `lib/api/*` → backend endpoint.
6. Update docs.
7. Verify twice.
8. Hand off with numbered browser test path.

---

## 11. Credentials

Server credentials and test accounts are documented in the handbook and gitignored local files (e.g., `deploy/nvccz/CREDENTIALS.nts-prod.local.md`).
**Never commit secrets.**

---

## 12. Quick Reference

```text
FE repo:     C:\Users\lysp\Downloads\nvccz-new
BE repo:     C:\Users\lysp\Downloads\nvccz
Local DB:    127.0.0.1:3306  arcus_dev / localdev_arcus_2026
Local API:   http://127.0.0.1:3009/api
Local staff: http://localhost:3000

Start all:   npm run start:servers   (MySQL + BE + FE)

Schema:      cd nvccz && npx prisma db push
Migrations:  design-refs/vps-pending-migrations.md

NTS VPS:     31.220.82.129  (root / password in handbook/CREDENTIALS file)
Client VPS:  102.217.49.126  (user / user@123 :3131) — OFFLINE

Deploy Arcus:  python scripts/deploy-arcus-docker-vps.py
Deploy NVCCZ:  python scripts/deploy-nvccz-nts-prod.py

Staff login:   admin@nts.com / admin123
Docs home:     design-refs/
```

---

*Last updated: 30 Aug 2026.*
