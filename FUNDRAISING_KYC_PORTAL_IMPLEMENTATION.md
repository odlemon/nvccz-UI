# Fundraising KYC standalone portal

Status: local implementation in progress (2026-10-16). No deployment or Git push was performed.

## Architecture

`/fundraising-kyc` is a public, standalone route in the existing Next.js frontend. It now renders the existing KYC workflow without the staff topbar, shared app switcher, notifications, profile menu, or internal module navigation. Internal Fundraising administration remains under `/fundraising/*`.

The workflow is implemented by `components/fundraising-kyc-mock/matanho-fundraising-kyc-runtime.js` and the shared KYC shell. It supports the existing local draft, validation, document selection/upload flow, liveness flow, review, and submission UI. The sibling backend has authenticated internal `/api/fundraising/kyc-cases` routes, but no matching public `/api/v1/onboarding/*` contract; the runtime therefore remains on its documented local mock transport until an approved external contract exists.

## Changes

- Removed `fundraising-kyc` from `lib/config/modules.ts`, so it is no longer an ERP app-switcher module.
- Replaced `FundraisingKycLayout`'s ERP shell with a standalone portal shell.
- Preserved all existing `/fundraising/*` internal administration routes and permissions.
- Preserved direct KYC URLs and the middleware public pass-through.

## Local URL

`http://127.0.0.1:3001/fundraising-kyc`

## Security boundary

The route is intentionally public and does not expose staff routes. Sensitive production access, live document storage, and live KYC review must not be enabled until the backend invitation/application contract is confirmed and tested. No database schema or migration was changed.

## Verification

Automated build/lint verification is recorded in `FUNDRAISING_KYC_BROWSER_VERIFICATION.md`. Browser verification must be run against local synthetic data only.
