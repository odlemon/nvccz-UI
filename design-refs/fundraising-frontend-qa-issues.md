# Fundraising frontend QA issues

**Captured:** 2026-07-16T22:48:50.293Z
**App:** http://localhost:3001
**API:** http://localhost:3002/api
**Login:** admin@nts.com

Browser walk of Fundraising after login. **FE** = UI crash, stuck spinner, missing control, client routing, console errors without a clear API failure.

### Session notes

- API login preflight OK
- Logged in → http://localhost:3001/
- Campaigns: h1="" rows=0 empty=false api=0
- Investors: h1="" rows=0 empty=false api=0
- Contacts: h1="" rows=0 empty=false api=0
- Pipeline: h1="" rows=0 empty=false api=0
- Mandates: h1="" rows=0 empty=false api=0
- Due Diligence: h1="" rows=0 empty=false api=0
- Data Rooms: h1="" rows=0 empty=false api=0
- Communications: h1="" rows=0 empty=false api=0
- Meetings & Tasks: h1="" rows=0 empty=false api=0
- Documents: h1="" rows=0 empty=false api=0
- Agreements: h1="" rows=0 empty=false api=0
- Commitments: h1="" rows=0 empty=false api=0
- Onboarding: h1="" rows=0 empty=false api=0
- Placement Agents: h1="" rows=0 empty=false api=0
- Forecasts: h1="" rows=0 empty=false api=0
- Reports: h1="" rows=0 empty=false api=0
- Approvals: h1="" rows=0 empty=false api=0
- Audit: h1="" rows=0 empty=false api=0
- Settings: h1="" rows=0 empty=false api=0

## Summary

| Severity | Count |
|----------|------:|
| critical | 0 |
| high | 22 |
| medium | 19 |
| low | 179 |
| **total** | **220** |

## Issues

### 1. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.456Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-gainers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 2. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.458Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 3. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.460Z
- **Detail:**

```
Error fetching top gainers: TypeError: Failed to fetch
    at fetchTopGainers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:109:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:87:90)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-
```

### 4. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.460Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-losers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 5. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.460Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 6. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.461Z
- **Detail:**

```
Error fetching top losers: TypeError: Failed to fetch
    at fetchTopLosers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:121:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:96:89)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-in
```

### 7. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.467Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/sector-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 8. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.467Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 9. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.467Z
- **Detail:**

```
Error fetching sector indices: TypeError: Failed to fetch
    at fetchSectorIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:145:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:114:93)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (w
```

### 10. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.467Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/market-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 11. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.467Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 12. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.468Z
- **Detail:**

```
Error fetching market indices: TypeError: Failed to fetch
    at fetchMarketIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:133:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:105:93)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (w
```

### 13. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.468Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/african-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 14. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.468Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 15. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.470Z
- **Detail:**

```
Error fetching African indices: TypeError: Failed to fetch
    at fetchAfricanIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:157:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:123:94)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval 
```

### 16. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.470Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/world-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 17. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.470Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 18. [low] Console — console.error

- **When:** 2026-07-16T22:40:18.471Z
- **Detail:**

```
Error fetching world indices: TypeError: Failed to fetch
    at fetchWorldIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:169:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:132:92)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (web
```

### 19. [low] Console — console.error

- **When:** 2026-07-16T22:41:01.431Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 20. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.746Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/market-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 21. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.747Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 22. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.748Z
- **Detail:**

```
Error fetching market indices: TypeError: Failed to fetch
    at fetchMarketIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:133:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:105:93)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (w
```

### 23. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.759Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/world-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 24. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.760Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 25. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.760Z
- **Detail:**

```
Error fetching world indices: TypeError: Failed to fetch
    at fetchWorldIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:169:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:132:92)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (web
```

### 26. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.760Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/african-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 27. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.760Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 28. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.761Z
- **Detail:**

```
Error fetching African indices: TypeError: Failed to fetch
    at fetchAfricanIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:157:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:123:94)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval 
```

### 29. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.860Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-gainers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 30. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.860Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 31. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.861Z
- **Detail:**

```
Error fetching top gainers: TypeError: Failed to fetch
    at fetchTopGainers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:109:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:87:90)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-
```

### 32. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.863Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-losers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 33. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.864Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 34. [low] Console — console.error

- **When:** 2026-07-16T22:41:15.864Z
- **Detail:**

```
Error fetching top losers: TypeError: Failed to fetch
    at fetchTopLosers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:121:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:96:89)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-in
```

### 35. [high] Dashboard — Navigation timeout/error

- **When:** 2026-07-16T22:41:16.949Z
- **Detail:**

```
page.goto: Timeout 60000ms exceeded.
Call log:
  - navigating to "http://localhost:3001/fundraising", waiting until "domcontentloaded"

```

### 36. [low] Console — console.error

- **When:** 2026-07-16T22:41:27.274Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 37. [low] Console — console.error

- **When:** 2026-07-16T22:41:42.841Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 38. [low] Console — console.error

- **When:** 2026-07-16T22:41:52.376Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 39. [low] Console — console.error

- **When:** 2026-07-16T22:41:56.966Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 40. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.641Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/african-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 41. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.641Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 42. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.642Z
- **Detail:**

```
Error fetching African indices: TypeError: Failed to fetch
    at fetchAfricanIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:157:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:123:94)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval 
```

### 43. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.648Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/market-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 44. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.648Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 45. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.648Z
- **Detail:**

```
Error fetching market indices: TypeError: Failed to fetch
    at fetchMarketIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:133:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:105:93)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (w
```

### 46. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.649Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/world-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 47. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.649Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 48. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.650Z
- **Detail:**

```
Error fetching world indices: TypeError: Failed to fetch
    at fetchWorldIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:169:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:132:92)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (web
```

### 49. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.805Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-gainers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 50. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.805Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 51. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.806Z
- **Detail:**

```
Error fetching top gainers: TypeError: Failed to fetch
    at fetchTopGainers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:109:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:87:90)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-
```

### 52. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.807Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-losers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 53. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.807Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 54. [low] Console — console.error

- **When:** 2026-07-16T22:42:15.808Z
- **Detail:**

```
Error fetching top losers: TypeError: Failed to fetch
    at fetchTopLosers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:121:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:96:89)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-in
```

### 55. [low] Console — console.error

- **When:** 2026-07-16T22:42:16.166Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/sector-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 56. [low] Console — console.error

- **When:** 2026-07-16T22:42:16.166Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 57. [low] Console — console.error

- **When:** 2026-07-16T22:42:16.167Z
- **Detail:**

```
Error fetching sector indices: TypeError: Failed to fetch
    at fetchSectorIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:145:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:114:93)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (w
```

### 58. [low] Console — console.error

- **When:** 2026-07-16T22:42:23.750Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 59. [low] Console — console.error

- **When:** 2026-07-16T22:42:54.965Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 60. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.871Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-gainers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 61. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.871Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 62. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.871Z
- **Detail:**

```
Error fetching top gainers: TypeError: Failed to fetch
    at fetchTopGainers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:109:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:87:90)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-
```

### 63. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.872Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/african-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 64. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.873Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 65. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.873Z
- **Detail:**

```
Error fetching African indices: TypeError: Failed to fetch
    at fetchAfricanIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:157:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:123:94)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval 
```

### 66. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.882Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/tradingview/world-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 67. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.882Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 68. [low] Console — console.error

- **When:** 2026-07-16T22:43:15.883Z
- **Detail:**

```
Error fetching world indices: TypeError: Failed to fetch
    at fetchWorldIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:169:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:132:92)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (web
```

### 69. [low] Console — console.error

- **When:** 2026-07-16T22:43:16.061Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/market-indices' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 70. [low] Console — console.error

- **When:** 2026-07-16T22:43:16.065Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 71. [low] Console — console.error

- **When:** 2026-07-16T22:43:16.067Z
- **Detail:**

```
Error fetching market indices: TypeError: Failed to fetch
    at fetchMarketIndices (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:133:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:105:93)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (w
```

### 72. [low] Console — console.error

- **When:** 2026-07-16T22:43:16.073Z
- **Detail:**

```
Access to fetch at 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api/zse/top-losers' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 73. [low] Console — console.error

- **When:** 2026-07-16T22:43:16.074Z
- **Detail:**

```
Failed to load resource: net::ERR_FAILED
```

### 74. [low] Console — console.error

- **When:** 2026-07-16T22:43:16.074Z
- **Detail:**

```
Error fetching top losers: TypeError: Failed to fetch
    at fetchTopLosers (webpack-internal:///(app-pages-browser)/./lib/api/financial-data.ts:121:32)
    at eval (webpack-internal:///(app-pages-browser)/./lib/store/slices/financialDataSlice.ts:96:89)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs:999:79)
    at eval (webpack-in
```

### 75. [low] Console — console.error

- **When:** 2026-07-16T22:43:22.870Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 76. [low] Console — console.error

- **When:** 2026-07-16T22:43:35.387Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 77. [low] Console — console.error

- **When:** 2026-07-16T22:43:43.495Z
- **Detail:**

```
Failed to fetch RSC payload for http://localhost:3001/. Falling back to browser navigation. TypeError: Failed to fetch
    at fetchServerResponse (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/router-reducer/fetch-server-response.js:59:27)
    at fastRefreshReducerImpl (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/router-re
```

### 78. [high] Dashboard — Tab probe crashed

- **When:** 2026-07-16T22:43:43.510Z
- **Detail:**

```
page.evaluate: Execution context was destroyed, most likely because of a navigation
```

### 79. [low] Console — console.error

- **When:** 2026-07-16T22:43:43.511Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 80. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:43:46.711Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 81. [low] Console — console.error

- **When:** 2026-07-16T22:43:46.801Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 82. [low] Console — console.error

- **When:** 2026-07-16T22:43:54.606Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 83. [low] Console — console.error

- **When:** 2026-07-16T22:43:54.680Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 84. [low] Console — console.error

- **When:** 2026-07-16T22:44:12.201Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 85. [low] Console — console.error

- **When:** 2026-07-16T22:44:13.982Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 86. [low] Console — console.error

- **When:** 2026-07-16T22:44:14.217Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 87. [low] Console — console.error

- **When:** 2026-07-16T22:44:14.308Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 88. [low] Console — console.error

- **When:** 2026-07-16T22:44:18.085Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 89. [low] Console — console.error

- **When:** 2026-07-16T22:44:20.302Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 90. [low] Console — console.error

- **When:** 2026-07-16T22:44:21.289Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 91. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:44:25.309Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 92. [low] Console — console.error

- **When:** 2026-07-16T22:44:25.324Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 93. [low] Console — console.error

- **When:** 2026-07-16T22:44:25.502Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 94. [medium] Campaigns — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:44:28.812Z
- **Detail:**

```
/fundraising/campaigns
```

### 95. [low] Console — console.error

- **When:** 2026-07-16T22:44:29.128Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 96. [low] Console — console.error

- **When:** 2026-07-16T22:44:33.791Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 97. [low] Console — console.error

- **When:** 2026-07-16T22:44:42.988Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 98. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:44:44.919Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 99. [low] Console — console.error

- **When:** 2026-07-16T22:44:44.960Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 100. [low] Console — console.error

- **When:** 2026-07-16T22:44:45.054Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 101. [medium] Investors — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:44:48.496Z
- **Detail:**

```
/fundraising/investors
```

### 102. [low] Console — console.error

- **When:** 2026-07-16T22:44:48.997Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 103. [low] Console — console.error

- **When:** 2026-07-16T22:44:56.979Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 104. [low] Console — console.error

- **When:** 2026-07-16T22:44:59.735Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 105. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:45:04.464Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 106. [low] Console — console.error

- **When:** 2026-07-16T22:45:04.497Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 107. [low] Console — console.error

- **When:** 2026-07-16T22:45:05.977Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 108. [medium] Contacts — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:45:07.958Z
- **Detail:**

```
/fundraising/contacts
```

### 109. [low] Console — console.error

- **When:** 2026-07-16T22:45:08.977Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 110. [low] Console — console.error

- **When:** 2026-07-16T22:45:21.799Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 111. [low] Console — console.error

- **When:** 2026-07-16T22:45:26.219Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 112. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:45:27.817Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 113. [low] Console — console.error

- **When:** 2026-07-16T22:45:27.832Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 114. [low] Console — console.error

- **When:** 2026-07-16T22:45:28.214Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 115. [medium] Pipeline — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:45:31.317Z
- **Detail:**

```
/fundraising/pipeline
```

### 116. [low] Console — console.error

- **When:** 2026-07-16T22:45:31.580Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 117. [low] Console — console.error

- **When:** 2026-07-16T22:45:40.615Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 118. [low] Console — console.error

- **When:** 2026-07-16T22:45:44.244Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 119. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:45:46.963Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 120. [low] Console — console.error

- **When:** 2026-07-16T22:45:46.972Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 121. [low] Console — console.error

- **When:** 2026-07-16T22:45:47.585Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 122. [medium] Mandates — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:45:50.465Z
- **Detail:**

```
/fundraising/mandates
```

### 123. [low] Console — console.error

- **When:** 2026-07-16T22:45:50.619Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 124. [low] Console — console.error

- **When:** 2026-07-16T22:45:55.942Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 125. [low] Console — console.error

- **When:** 2026-07-16T22:46:00.466Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 126. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:46:01.484Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 127. [low] Console — console.error

- **When:** 2026-07-16T22:46:01.484Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 128. [low] Console — console.error

- **When:** 2026-07-16T22:46:01.503Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 129. [medium] Due Diligence — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:46:04.996Z
- **Detail:**

```
/fundraising/due-diligence
```

### 130. [low] Console — console.error

- **When:** 2026-07-16T22:46:05.301Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 131. [low] Console — console.error

- **When:** 2026-07-16T22:46:11.237Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 132. [low] Console — console.error

- **When:** 2026-07-16T22:46:14.362Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 133. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:46:14.922Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 134. [low] Console — console.error

- **When:** 2026-07-16T22:46:14.935Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 135. [low] Console — console.error

- **When:** 2026-07-16T22:46:15.431Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 136. [medium] Data Rooms — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:46:18.422Z
- **Detail:**

```
/fundraising/data-rooms
```

### 137. [low] Console — console.error

- **When:** 2026-07-16T22:46:18.526Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 138. [low] Console — console.error

- **When:** 2026-07-16T22:46:23.392Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 139. [low] Console — console.error

- **When:** 2026-07-16T22:46:28.615Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 140. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:46:29.938Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 141. [low] Console — console.error

- **When:** 2026-07-16T22:46:29.951Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 142. [low] Console — console.error

- **When:** 2026-07-16T22:46:30.253Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 143. [medium] Communications — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:46:33.431Z
- **Detail:**

```
/fundraising/communications
```

### 144. [low] Console — console.error

- **When:** 2026-07-16T22:46:33.819Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 145. [low] Console — console.error

- **When:** 2026-07-16T22:46:40.710Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 146. [low] Console — console.error

- **When:** 2026-07-16T22:46:47.559Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 147. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:46:50.159Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 148. [low] Console — console.error

- **When:** 2026-07-16T22:46:50.222Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 149. [low] Console — console.error

- **When:** 2026-07-16T22:46:50.385Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 150. [medium] Meetings & Tasks — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:46:53.668Z
- **Detail:**

```
/fundraising/meetings
```

### 151. [low] Console — console.error

- **When:** 2026-07-16T22:46:54.145Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 152. [low] Console — console.error

- **When:** 2026-07-16T22:46:59.767Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 153. [low] Console — console.error

- **When:** 2026-07-16T22:47:02.287Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 154. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:47:04.030Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 155. [low] Console — console.error

- **When:** 2026-07-16T22:47:04.031Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 156. [low] Console — console.error

- **When:** 2026-07-16T22:47:04.473Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 157. [medium] Documents — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:47:07.547Z
- **Detail:**

```
/fundraising/documents
```

### 158. [low] Console — console.error

- **When:** 2026-07-16T22:47:08.080Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 159. [low] Console — console.error

- **When:** 2026-07-16T22:47:12.235Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 160. [low] Console — console.error

- **When:** 2026-07-16T22:47:17.567Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 161. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:47:19.922Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 162. [low] Console — console.error

- **When:** 2026-07-16T22:47:19.922Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 163. [low] Console — console.error

- **When:** 2026-07-16T22:47:20.549Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 164. [medium] Agreements — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:47:23.448Z
- **Detail:**

```
/fundraising/agreements
```

### 165. [low] Console — console.error

- **When:** 2026-07-16T22:47:23.767Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 166. [low] Console — console.error

- **When:** 2026-07-16T22:47:28.177Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 167. [low] Console — console.error

- **When:** 2026-07-16T22:47:30.095Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 168. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:47:31.308Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 169. [low] Console — console.error

- **When:** 2026-07-16T22:47:31.311Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 170. [low] Console — console.error

- **When:** 2026-07-16T22:47:31.311Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 171. [medium] Commitments — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:47:34.913Z
- **Detail:**

```
/fundraising/commitments
```

### 172. [low] Console — console.error

- **When:** 2026-07-16T22:47:35.129Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 173. [low] Console — console.error

- **When:** 2026-07-16T22:47:37.651Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 174. [low] Console — console.error

- **When:** 2026-07-16T22:47:38.969Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 175. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:47:39.871Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 176. [low] Console — console.error

- **When:** 2026-07-16T22:47:39.871Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 177. [low] Console — console.error

- **When:** 2026-07-16T22:47:39.872Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 178. [medium] Onboarding — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:47:43.436Z
- **Detail:**

```
/fundraising/onboarding
```

### 179. [low] Console — console.error

- **When:** 2026-07-16T22:47:43.581Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 180. [low] Console — console.error

- **When:** 2026-07-16T22:47:45.216Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 181. [low] Console — console.error

- **When:** 2026-07-16T22:47:46.402Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 182. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:47:46.983Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 183. [low] Console — console.error

- **When:** 2026-07-16T22:47:46.983Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 184. [low] Console — console.error

- **When:** 2026-07-16T22:47:47.156Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 185. [medium] Placement Agents — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:47:50.501Z
- **Detail:**

```
/fundraising/placement-agents
```

### 186. [low] Console — console.error

- **When:** 2026-07-16T22:47:50.613Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 187. [low] Console — console.error

- **When:** 2026-07-16T22:47:51.930Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 188. [low] Console — console.error

- **When:** 2026-07-16T22:47:53.564Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 189. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:47:54.037Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 190. [low] Console — console.error

- **When:** 2026-07-16T22:47:54.037Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 191. [low] Console — console.error

- **When:** 2026-07-16T22:47:54.131Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 192. [medium] Forecasts — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:47:57.717Z
- **Detail:**

```
/fundraising/forecasts
```

### 193. [low] Console — console.error

- **When:** 2026-07-16T22:47:58.024Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 194. [low] Console — console.error

- **When:** 2026-07-16T22:47:59.814Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 195. [low] Console — console.error

- **When:** 2026-07-16T22:48:00.875Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 196. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:48:01.458Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 197. [low] Console — console.error

- **When:** 2026-07-16T22:48:01.459Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 198. [low] Console — console.error

- **When:** 2026-07-16T22:48:01.560Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 199. [medium] Reports — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:48:04.960Z
- **Detail:**

```
/fundraising/reports
```

### 200. [low] Console — console.error

- **When:** 2026-07-16T22:48:05.061Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 201. [low] Console — console.error

- **When:** 2026-07-16T22:48:06.061Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 202. [low] Console — console.error

- **When:** 2026-07-16T22:48:06.792Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 203. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:48:07.256Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 204. [low] Console — console.error

- **When:** 2026-07-16T22:48:07.257Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 205. [low] Console — console.error

- **When:** 2026-07-16T22:48:07.337Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 206. [medium] Approvals — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:48:10.937Z
- **Detail:**

```
/fundraising/approvals
```

### 207. [low] Console — console.error

- **When:** 2026-07-16T22:48:11.850Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 208. [low] Console — console.error

- **When:** 2026-07-16T22:48:13.606Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 209. [low] Console — console.error

- **When:** 2026-07-16T22:48:15.116Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 210. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:48:15.696Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 211. [low] Console — console.error

- **When:** 2026-07-16T22:48:15.697Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 212. [low] Console — console.error

- **When:** 2026-07-16T22:48:15.697Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 213. [medium] Audit — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:48:19.202Z
- **Detail:**

```
/fundraising/audit
```

### 214. [low] Console — console.error

- **When:** 2026-07-16T22:48:19.372Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 215. [low] Console — console.error

- **When:** 2026-07-16T22:48:20.761Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 216. [low] Console — console.error

- **When:** 2026-07-16T22:48:21.742Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 217. [high] Runtime — Unhandled page error

- **When:** 2026-07-16T22:48:22.304Z
- **Detail:**

```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 |   const d = new Date(String(v))
 206 |   if (Number.isNaN(d.getTime())) return '—'
 207 |   return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
 208 | }
 209 | 
 210 | export function fmtDateTime(v: unknown): string {
 211 |   if (!v) return '—'
 212 |   const d = new Date(String(v))
 213 |   if (Number.isNaN(d.getTime())) return '—'
 214 |   return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
 215 | }
 216 | 
 217 | export function mapCommunicationRow(raw: Record<string, any>) {
 218 |   const interactionType = String(raw.interactionType || '')
 219 |   const confidentia
```

### 218. [low] Console — console.error

- **When:** 2026-07-16T22:48:22.311Z
- **Detail:**

```
./lib/fundraising/mappers.ts
Error: 
  x the name `fmtDate` is defined multiple times
     ,-[C:\Users\lysp\Documents\frontend nvccz\lib\fundraising\mappers.ts:200:1]
 200 |   NEGATIVE: 'Negative',
 201 | }
 202 | 
 203 | export function fmtDate(v: unknown): string {
     :                 ^^^|^^^
     :                    `-- previous definition of `fmtDate` here
 204 |   if (!v) return '—'
 205 
```

### 219. [low] Console — console.error

- **When:** 2026-07-16T22:48:22.401Z
- **Detail:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### 220. [medium] Settings — No fundraising/investors API calls observed

- **When:** 2026-07-16T22:48:25.936Z
- **Detail:**

```
/fundraising/settings
```
