# Pre-rebrand archive (Arcus login + logo)

Client asked to change the **login/homepage design** and the **system name**.  

**Status (2026-07-27):** Matanho login redesign is **live**. This folder remains the rollback kit.

## Snapshot: `2026-07-27-arcus-login/`

| Path | What |
|---|---|
| `pages/login-page.tsx` | Exact copy of `app/login/page.tsx` at archive time (pre-Matanho) |
| `pages/forgot-password-page.tsx` | Matching auth visual twin (`app/forgot-password/page.tsx`) |
| `logos/logo.png` | Live app logo (`public/logo.png`) — used in topbar, favicon, most chrome |
| `logos/logo_copy.png` | Login page logo (`/logo_copy.png`) — **byte-identical** to `logo.png` at archive time |
| `logos/logo.LIVE-at-archive.png` | Extra copy of the live logo (same bytes) |
| `logos/logo_old.png` | Older logo variant already present in `public/` (different file) |
| `BRANDING.md` | System name / copy strings captured at archive time |

## How to revert login UI

From repo root (PowerShell):

```powershell
Copy-Item -Force "design-refs\pre-rebrand-archive\2026-07-27-arcus-login\pages\login-page.tsx" "app\login\page.tsx"
Copy-Item -Force "design-refs\pre-rebrand-archive\2026-07-27-arcus-login\pages\forgot-password-page.tsx" "app\forgot-password\page.tsx"
```

Also restore logos / metadata if needed:

```powershell
Copy-Item -Force "design-refs\pre-rebrand-archive\2026-07-27-arcus-login\logos\logo.png" "public\logo.png"
Copy-Item -Force "design-refs\pre-rebrand-archive\2026-07-27-arcus-login\logos\logo_copy.png" "public\logo_copy.png"
# Then set app/layout.tsx title back to "Arcus - Investment ERP" and icons to /logo.png
# Topbars: src="/logo.png" alt="Arcus"
# Remove or keep MatanhoAuthShell unused — restore pages overwrite imports.
```

## Live Matanho files (post-rebrand)

| Path | Role |
|---|---|
| `app/login/page.tsx` | New glass login |
| `app/forgot-password/page.tsx` | Matching shell |
| `components/auth/matanho-auth-shell.tsx` | Shared landscape + brand column |
| `public/new_logo.jpeg` | Official Matanho wordmark |
| `public/matanho-login-bg.jpg` | Mountain background |

## Notes

- Old Arcus archive stays in `2026-07-27-arcus-login/` — do not delete.
- Desktop login left column uses the crop’s white **matanho** wordmark (JPEG has a light background, so it sits in a white plate on mobile + in topbars/favicon as `/new_logo.jpeg`).
