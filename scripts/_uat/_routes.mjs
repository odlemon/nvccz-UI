/**
 * The screens under test, shared by the UAT sweeps so they cannot drift apart.
 *
 * Derived from the app router: `app/payroll/**`, `app/fundraising/**` and
 * `app/lp-portal/**`. Keep in step when a route is added or removed.
 */

const PAYROLL = ["", "employees", "onboarding", "runs", "inputs", "exceptions", "approvals", "close",
  "components", "calendar", "tax", "training", "leave", "vendors", "vault", "reports", "audit",
  "access", "settings", "mypay"]

const FUNDRAISING = ["", "campaigns", "investors", "contacts", "pipeline", "mandates", "due-diligence",
  "data-rooms", "communications", "meetings", "documents", "agreements", "commitments", "onboarding",
  "placement-agents", "forecasts", "reports", "approvals", "audit", "settings"]

const LP = ["", "capital-activity", "capital-calls", "distributions", "performance", "dealing",
  "subscriptions-redemptions", "documents", "vault", "ledger", "notices", "messages", "requests",
  "colleagues", "organisation", "account-activity", "reports", "settings"]

export const STAFF_BASE = process.env.STAFF_BASE || "http://localhost:3001"
export const LP_BASE = process.env.LP_BASE || "http://localhost:3110"
export const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
export const PASSWORD = "admin123"

export const MODULES = [
  { id: "payroll", portal: "staff", base: STAFF_BASE, user: "perf.sysadmin@nts.local", routes: PAYROLL.map((r) => "/payroll" + (r ? "/" + r : "")) },
  { id: "fundraising", portal: "staff", base: STAFF_BASE, user: "perf.sysadmin@nts.local", routes: FUNDRAISING.map((r) => "/fundraising" + (r ? "/" + r : "")) },
  { id: "lp", portal: "lp", base: LP_BASE, user: "lp.test@arcus.co.zw", routes: LP.map((r) => "/lp-portal" + (r ? "/" + r : "")) },
]

/**
 * Older LP paths that redirect to a merged screen, confirmed in the page files
 * themselves — dealing/page.tsx is a bare `redirect(...)`. Landing elsewhere is
 * only a failure when it was not intended.
 */
export const ALIASES = {
  "/lp-portal/capital-calls": "/lp-portal/capital-activity",
  "/lp-portal/distributions": "/lp-portal/capital-activity",
  "/lp-portal/dealing": "/lp-portal/subscriptions-redemptions",
  "/lp-portal/vault": "/lp-portal/documents",
  "/lp-portal/ledger": "/lp-portal/account-activity",
  "/lp-portal/messages": "/lp-portal/requests",
  "/lp-portal/colleagues": "/lp-portal/organisation",
  "/lp-portal/reports": "/lp-portal/documents",
}

/** Seeds an authenticated context. Sets both the plain and per-portal cookie names. */
export async function seedAuth(context, base, email, portal) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, portal }),
  })
  const login = await res.json().catch(() => ({}))
  const token = login.token || login?.data?.token
  if (!token) throw new Error(`login failed for ${email} (${portal}): ${res.status}`)
  const user = login.user || login?.data?.user || {}
  const slim = {
    id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email,
    roleCode: user.roleCode, roleName: user.roleName ?? user.role?.name ?? null,
    role: user.role ? { id: user.role.id, name: user.role.name } : null,
  }
  const { hostname } = new URL(base)
  const common = { domain: hostname, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }
  await context.addCookies([
    { name: "token", value: token, ...common },
    { name: `token_${portal}`, value: token, ...common },
    { name: "user", value: encodeURIComponent(JSON.stringify(user)), ...common },
    { name: "userProfile", value: encodeURIComponent(JSON.stringify(slim)), ...common },
    { name: `userProfile_${portal}`, value: encodeURIComponent(JSON.stringify(slim)), ...common },
  ])
}
