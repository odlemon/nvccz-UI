# Fundraising KYC — UI handoff

> **Status:** Integrated — client Matanho Investor KYC Onboarding under `/fundraising-kyc`.  
> **Source:** `C:\Users\lysp\Downloads\Matanho_INVESTOR_KYC_Onboarding_Deployment_Package`  
> **Mode:** Interactive mock (Mode A runtime host) — mock API (`useMockApi: true`).  
> **Live module left alone:** `/fundraising` (Fundraising & Investor Relations)

## What shipped

Paperless 8-step investor / LP onboarding wizard:

1. Applicant profile  
2. Identity and contact  
3. Selfie and liveness  
4. Ownership and control  
5. Investment and funds  
6. Compliance declarations  
7. Documents and signature  
8. Review and submit  

Includes Zimbabwe-specific KYC fields, camera liveness UX, draft autosave, and mock document upload.

## Routes

| Step | Next path |
|------|-----------|
| Applicant profile | `/fundraising-kyc` |
| Identity and contact | `/fundraising-kyc/identity` |
| Selfie and liveness | `/fundraising-kyc/liveness` |
| Ownership and control | `/fundraising-kyc/ownership` |
| Investment and funds | `/fundraising-kyc/investment` |
| Compliance declarations | `/fundraising-kyc/compliance` |
| Documents and signature | `/fundraising-kyc/documents` |
| Review and submit | `/fundraising-kyc/review` |

## Code map

| Layer | Path |
|-------|------|
| Module | `lib/config/modules.ts` — `fundraising-kyc` / **Fundraising KYC** |
| Host | `components/fundraising-kyc-mock/fundraising-kyc-app.tsx` |
| Runtime | `components/fundraising-kyc-mock/matanho-fundraising-kyc-runtime.js` |
| Shell | `components/fundraising-kyc-mock/shell.ts` |
| CSS | `fundraising-kyc.css` (scoped Tailwind build) + overrides |
| Nav | `lib/fundraising-kyc-mock/nav.ts` |
| Assets | `public/fundraising-kyc/assets/` |
| Extract script | `scripts/extract-fundraising-kyc.mjs` |

## Deviations

1. Arcus SharedTopbar above client chrome.
2. Step index synced to Next paths via `__FR_KYC_NAV__`.
3. Client Tailwind radii/colors kept (not Arcus pills).
4. ES modules (model/validation/storage/api/app) bundled into one runtime host.
5. Live `/fundraising` unchanged.
6. Public preview: middleware pass-through `/fundraising-kyc`.

## Public preview

**http://localhost:3002/fundraising-kyc**

(No login required.)

## Verify

1. Open `/fundraising-kyc` — applicant step with client sidebar
2. Continue through steps — URL updates under `/fundraising-kyc/...`
3. Deep-link `/fundraising-kyc/liveness` and `/fundraising-kyc/review`
4. App Switcher shows **Fundraising KYC** next to live **Fundraising & Investor Relations**
