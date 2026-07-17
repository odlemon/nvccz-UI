# Forecasts & Analytics — Stage-by-stage flow

**Index:** [`fundraising-stages-index.md`](./fundraising-stages-index.md)  
**SRD:** Forecasting + analytics; FE combines Forecasts & Analytics  
**Route:** `/fundraising/forecasts`  
**Component:** `components/fundraising/fundraising-forecasts.tsx`  
**Mock:** `forecasts-mock-data.ts`  
**Backend asks (when implementing):** `fundraising-forecasts-backend-asks.md` *(create on first BE gap)*

**Product rules**

- Scenarios: Downside / Base / Upside — **must never modify live opportunity records**.
- Show Target, Signed, Activated AUM, Gross/Weighted Pipeline, Remaining, Coverage, expected monthly/quarterly closings, fee revenue, concentration.
- Weighted pipeline uses approved FX × stage probability × confidence.
- Analytics extras (geo map, source analysis, owner leaderboard, stage ageing heatmap) may live here or in Reports — document honestly if deferred.

---

## Status diagram

```
[0 Open Forecasts]
   → [1 Select scenario]
   → [2 Read scenario KPIs + charts]
   → [3 Edit assumptions (scenario-only)]
   → [4 Funnel / concentration analytics]
   → [5 Owner / source / ageing views]
   → [6 Export]
```

---

## Stage 0 — Open Forecasts & Analytics

| | |
|---|---|
| **Who** | Head of Fundraising / Exec |
| **Goal** | Land on forecast workspace |
| **Steps** | Open `/fundraising/forecasts`. |
| **Done when** | Scenario chrome visible. |
| **FE now / BE blocked** | Mock scenarios + charts. |

---

## Stage 1 — Select scenario

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Switch Downside / Base / Upside without touching ops data |
| **Steps** | Click scenario chips; confirm KPIs/chart swap. |
| **Done when** | Scenario datasets isolated from live pipeline. |
| **FE now / BE blocked** | Static scenario datasets (isolation is conceptual only). |

---

## Stage 2 — KPIs and close curve

| | |
|---|---|
| **Who** | Exec |
| **Goal** | Read forecast KPIs and monthly closes |
| **Steps** | KPI cards + cumulative area chart; open monthly closes detail. |
| **Done when** | Numbers from BE forecast engine. |
| **FE now / BE blocked** | Mock KPIs + Recharts area. |

---

## Stage 3 — Edit assumptions

| | |
|---|---|
| **Who** | Head of Fundraising |
| **Goal** | Adjust close velocity, win rate, ticket, fee rate, decay — scenario only |
| **Steps** | Edit assumptions → recalculate scenario outputs (not live opps). |
| **Done when** | KPIs/chart update from new assumptions. |
| **FE now / BE blocked** | Dialog save toast — **explicitly does not recalculate**. |

---

## Stage 4 — Funnel and concentration

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Stage-weighted funnel + investor concentration risk |
| **Steps** | Funnel table (gross vs weighted, conversion); concentration by investor/tier. |
| **Done when** | Analytics match live/scenario inputs per mode. |
| **FE now / BE blocked** | Tables present on mock. |

---

## Stage 5 — Extended analytics

| | |
|---|---|
| **Who** | Exec / Analyst |
| **Goal** | Geo distribution, source analysis, owner performance, stage ageing |
| **Steps** | Open analytics sections (map, sources, leaderboard, heatmap) when built. |
| **Done when** | SRD analytics sections available or explicitly deferred to Reports. |
| **FE now / BE blocked** | **Mostly missing** on this screen. |

---

## Stage 6 — Export

| | |
|---|---|
| **Who** | Analyst |
| **Goal** | Export forecast pack |
| **Steps** | Export. |
| **Done when** | File downloaded. |
| **FE now / BE blocked** | Toast only. |

---

## Status table

| Stage | UI today | Notes |
|------:|----------|-------|
| 0 Open | Mock | Combined tab |
| 1 Scenario | Partial | Static sets |
| 2 KPIs/chart | Partial | Mock |
| 3 Assumptions | Partial | No recalc |
| 4 Funnel/concentration | Partial | Mock tables |
| 5 Extended analytics | Missing | SRD gap |
| 6 Export | Missing | Toast |
