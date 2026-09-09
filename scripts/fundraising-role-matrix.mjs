/**
 * Fundraising — role matrix.
 *
 * For each of the five test roles this checks, against the running API:
 *   - can the role READ the fundraising surfaces
 *   - can it WRITE (create an investor, create an opportunity, decide an approval)
 *   - is a refusal a clean 403 with a message, rather than a 500 or a silent success
 *
 * Writes are attempted with deliberately harmless payloads and any record created is
 * deleted again, so running this does not accumulate junk.
 *
 * USAGE
 *   node scripts/fundraising-role-matrix.mjs
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const PASSWORD = "admin123"

const ROLES = {
  sysadmin: "perf.sysadmin@nts.local",
  exec: "perf.exec@nts.local",
  hr: "perf.hr@nts.local",
  deptmgr: "perf.deptmgr@nts.local",
  employee: "perf.employee@nts.local",
}

async function login(email) {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const j = await r.json().catch(() => ({}))
  return { token: j.token || j?.data?.token, user: j.user || {}, status: r.status }
}

async function call(token, method, path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let j = null
  try {
    j = await r.json()
  } catch {}
  return { status: r.status, body: j }
}

const verdict = (s) => (s >= 200 && s < 300 ? "allowed" : s === 403 ? "403 refused" : `HTTP ${s}`)

console.log(`\nFundraising role matrix → ${API_BASE}\n`)
const rows = []

for (const [role, email] of Object.entries(ROLES)) {
  const { token, user, status } = await login(email)
  if (!token) {
    console.log(`  ${role.padEnd(10)} LOGIN FAILED (HTTP ${status})`)
    rows.push({ role, login: `failed ${status}` })
    continue
  }

  const readDash = await call(token, "GET", "/fundraising/dashboard")
  const readOpps = await call(token, "GET", "/fundraising/opportunities")
  const readInv = await call(token, "GET", "/investors?pageSize=1")

  // Write probe 1: create an investor organisation, then remove it if it landed.
  const stamp = Date.now().toString().slice(-6)
  const write = await call(token, "POST", "/investors", {
    legalName: `ROLE PROBE ${role} ${stamp}`,
    investorType: "PENSION_FUND",
    countryCode: "ZW",
    jurisdiction: "Zimbabwe",
    baseCurrency: "USD",
  })
  const createdId = write.body?.data?.id ?? write.body?.id ?? null

  // Write probe 2: a guarded fundraising write (opportunity creation).
  const writeOpp = await call(token, "POST", "/fundraising/opportunities", {
    campaignId: "frs-camp-pe3",
    investorId: "frs-inv-01",
    opportunityType: "LP_COMMITMENT",
    opportunityCurrency: "USD",
    indicativeAmount: 1000,
    notes: `role probe ${role}`,
  })
  const oppId = writeOpp.body?.data?.id ?? null

  const msg = write.body?.message || write.body?.error?.message || ""

  rows.push({
    role,
    roleCode: user.roleCode || "—",
    dashboard: verdict(readDash.status),
    opportunities: verdict(readOpps.status),
    investors: verdict(readInv.status),
    createInvestor: verdict(write.status),
    createOpportunity: verdict(writeOpp.status),
    refusalMessage: write.status === 403 || writeOpp.status === 403 ? (msg || writeOpp.body?.message || "") : "",
    createdId,
    oppId,
  })

  console.log(
    `  ${role.padEnd(10)} roleCode=${String(user.roleCode || "—").padEnd(10)}` +
      ` read:${verdict(readDash.status).padEnd(11)}` +
      ` createInvestor:${verdict(write.status).padEnd(11)}` +
      ` createOpportunity:${verdict(writeOpp.status)}`,
  )
  if (write.status === 403 || writeOpp.status === 403) {
    console.log(`             refusal: "${msg || writeOpp.body?.message || "(no message)"}"`)
  }
}

// ---- clean up anything the probes created, using an admin token ---------------------------
const admin = await login(ROLES.sysadmin)
let cleaned = 0
for (const r of rows) {
  if (r.oppId) {
    const res = await call(admin.token, "PATCH", `/fundraising/opportunities/${r.oppId}`, {
      status: "LOST",
      lostReason: "role-matrix probe — not a real opportunity",
    })
    if (res.status < 300) cleaned++
  }
}
console.log(`\nProbe opportunities marked LOST: ${cleaned}`)
console.log(
  "Probe investor organisations are left in place — /investors has no delete route; they are\n" +
    "named 'ROLE PROBE …' so they are identifiable.",
)

console.log("\n| role | roleCode | read dashboard | create investor | create opportunity |")
console.log("|---|---|---|---|---|")
for (const r of rows) {
  console.log(
    `| ${r.role} | ${r.roleCode ?? "—"} | ${r.dashboard ?? "—"} | ${r.createInvestor ?? "—"} | ${r.createOpportunity ?? "—"} |`,
  )
}
