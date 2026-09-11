/**
 * Every superseded LP path must land on a real screen, with its query intact.
 *
 * These paths used to be page components whose body was `redirect(...)`. That
 * never redirected: the throw was streamed as a NEXT_REDIRECT error rather than
 * committed as an HTTP redirect, so each served 200 with an empty <main> while
 * the app sat there hydrated and healthy. The LP dashboard's "Total Commitment"
 * KPI card and its "Latest Reports / View all" link both pointed into that set.
 *
 * They are redirects in `middleware.ts` now. This check exists so that a blank
 * page cannot come back unnoticed: it asserts the destination AND that the
 * destination actually rendered something.
 *
 * Run:  node scripts/_uat/lp-merged-routes-check.mjs
 * Exit: 0 = every merged path resolves and renders, 1 = at least one does not
 */
import { chromium } from "playwright"
import { MODULES, seedAuth } from "./_routes.mjs"

const lp = MODULES.find((m) => m.id === "lp")

const CASES = [
  ["/lp-portal/capital-calls", "/lp-portal/capital-activity?tab=calls"],
  ["/lp-portal/distributions", "/lp-portal/capital-activity?tab=distributions"],
  ["/lp-portal/dealing", "/lp-portal/subscriptions-redemptions"],
  ["/lp-portal/vault", "/lp-portal/documents"],
  ["/lp-portal/ledger", "/lp-portal/account-activity"],
  ["/lp-portal/messages", "/lp-portal/requests?tab=messages"],
  ["/lp-portal/colleagues", "/lp-portal/organisation"],
  ["/lp-portal/reports", "/lp-portal/documents?category=Fund+Reports"],
  ["/lp-portal/investments", "/lp-portal"],
  ["/lp-portal/investments/holdings", "/lp-portal/account-activity?structure=open-ended"],
  ["/lp-portal/investments/capital-account", "/lp-portal/account-activity?structure=private-capital"],
  // The deep link the ledger entry sheet builds: the document id must survive.
  ["/lp-portal/vault?documentId=abc123", "/lp-portal/documents?documentId=abc123"],
  ["/lp-portal/dealing?type=redemptions", "/lp-portal/subscriptions-redemptions?type=redemptions"],
]

const b = await chromium.launch({ headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await seedAuth(ctx, lp.base, lp.user, lp.portal)
const page = await ctx.newPage()
page.setDefaultTimeout(90000)

let bad = 0
for (const [route, expected] of CASES) {
  await page.goto(lp.base + route, { waitUntil: "domcontentloaded" })
  await page
    .waitForFunction(() => {
      const m = document.querySelector("main")
      return !!m && (m.innerText || "").trim().length > 40
    }, null, { timeout: 30000 })
    .catch(() => {})
  const s = await page.evaluate(() => {
    const m = document.querySelector("main")
    return {
      url: location.pathname + location.search,
      mainLen: m ? (m.innerText || "").trim().length : -1,
      head: m ? (m.innerText || "").replace(/\s+/g, " ").trim().slice(0, 55) : "",
    }
  })
  // Compare ignoring param order.
  const norm = (u) => {
    const [p, q = ""] = u.split("?")
    return p + "?" + [...new URLSearchParams(q).entries()].sort().map(([k, v]) => k + "=" + v).join("&")
  }
  const urlOk = norm(s.url) === norm(expected)
  const contentOk = s.mainLen > 40
  if (!urlOk || !contentOk) bad += 1
  console.log(
    `${urlOk && contentOk ? "ok  " : "FAIL"} ${route.padEnd(42)} -> ${s.url.padEnd(50)} main=${String(s.mainLen).padEnd(5)} ${s.head}`,
  )
  if (!urlOk) console.log(`      expected ${expected}`)
}
await b.close()
console.log(`\n${CASES.length} merged paths, ${bad} failing`)
process.exit(bad ? 1 : 0)
