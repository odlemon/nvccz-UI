# Fundraising — Agent handoff

**Branch context:** `feature/fundraising` (from `dev`)  
**Playbook:** [`arcus-feature-delivery-playbook.md`](./arcus-feature-delivery-playbook.md)  
**Stages index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD / FE digest:** [`fundraising-srd.md`](./fundraising-srd.md) · [`fundraising-frontend.md`](./fundraising-frontend.md)  
**API:** [`fundraising-frontend-api.md`](./fundraising-frontend-api.md) · [`fundraising-srd-fe-handoff.md`](./fundraising-srd-fe-handoff.md)  
**BE asks:** [`fundraising-backend-asks.md`](./fundraising-backend-asks.md)

---

## Done

- [x] Full SRD + FE digest + per-tab stages
- [x] Local env (gitignored): FE `:3001`, API `http://localhost:3002/api`
- [x] API contract docs saved
- [x] Live API client `lib/api/fundraising-api.ts`
- [x] All sidebar tabs wired (mock seeds no longer source of truth)
- [x] `npm run uat:fundraising:srd` smoke script
- [x] FE gap APIs wired: Settings, Meetings, Documents, engagement, forecast curve, commissions, commitment checklist
- [x] `npm run uat:fundraising:fe-gaps` smoke script

---

## Paths

- Use `/api/fundraising/*` and `/api/investors/*` only
- Never `/api/v1/...` or `/api/fundraising/deals/*`

---

## Next

1. Run `npm run uat:fundraising:srd` and `npm run uat:fundraising:fe-gaps` with BE on `:3002` (after BE migrate if needed)
2. User smoke-tests Settings / Meetings / Documents + prior tabs
3. Remaining asks (if any) in [`fundraising-backend-asks.md`](./fundraising-backend-asks.md)
