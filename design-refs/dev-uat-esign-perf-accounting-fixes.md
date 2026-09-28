# Dev UAT fixes — E-Signatures, Performance bounce, Accounting journals

**Date:** 2026-09-23  
**Env:** https://dev.matanho.com (staff)

## Reproduced

| Issue | Evidence on dev |
|--------|-----------------|
| E-Signatures hard to find | Page works at `/portfolio/e-signatures`, but omitted from App Switcher `modules.ts` shortcuts; buried mid–Reporting & Records; New envelope was mock-only |
| Performance “click takes you back” | `performance-v22` module paths still pointed at `/performance-v22/*` while the live app is `/performance/*`, so `getModuleByPath` resolved the superseded `performance-management` module; Access/Settings also FE-allowed then middleware-bounced non-`full` roles |
| Accounting “can’t record” | Journal Maker–Checker defaults to fixture account `5140`; live COA has no `5140` → toast `Account 5140 was not found in the live Chart of Accounts.` Journals page did not load `coa` scope |

## Fixes shipped

1. **Portfolio / E-Signatures**
   - Add `pv11-e-signatures` to `portfolio-v11` subModules in `lib/config/modules.ts`
   - Promote E-Signatures to top of REPORTING & RECORDS nav
   - Wire `submit-new-envelope` → `api-create-envelope` (live fundraising agreements)

2. **Performance**
   - Point `performance-v22` paths at `/performance/*` in `modules.ts`
   - Harden `onNavigate` (no unknown-page → dashboard) and `pathToPm22Page` (strip query/trailing slash)
   - Roles & Access: require `manage_rbac` (admin `*` only); Settings middleware submodule no longer admin-gated

3. **Accounting**
   - Load `coa` with journals/ledger scopes
   - On hydrate, reset journal draft lines to live posting accounts when fixture codes are absent

## Verify after deploy

1. App Switcher → Portfolio → see **E-Signatures**; open page; create envelope persists after refresh  
2. Performance: navigate Contracts / Reviews / Goals / Settings — URL and active nav stay put (no snap to Command Centre)  
3. Accounting → Journal Entries: default accounts are live codes; Review & submit succeeds without “Account … not found”
