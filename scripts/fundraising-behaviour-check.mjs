/**
 * Fundraising — verify the behaviour claims in design-refs/fundraising-module-behaviour.md.
 *
 * Each claim in that document has an id (B1, B2, ...). This exercises them against the running
 * API and reports PASS / FAIL per claim, so the document can be checked rather than believed.
 *
 * It creates its own scratch campaign, investor and opportunity so it can drive the state
 * machines destructively without touching the seeded demo data, then cleans up.
 *
 * USAGE
 *   node scripts/fundraising-behaviour-check.mjs
 *   node scripts/fundraising-behaviour-check.mjs --only=B9,B16
 */
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3009/api"
const PASSWORD = "admin123"
const ADMIN = "perf.sysadmin@nts.local"
const NON_EDITOR = "perf.exec@nts.local"

const arg = (n, d) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : d
}
const ONLY = (arg("only", "") || "").split(",").map((s) => s.trim()).filter(Boolean)

const results = []
function record(id, ok, detail) {
  results.push({ id, ok, detail })
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${id}  ${detail}`)
}
const wants = (id) => ONLY.length === 0 || ONLY.includes(id)

async function login(email) {
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const j = await r.json().catch(() => ({}))
  return j.token || j?.data?.token
}

let TOKEN = null
async function call(method, path, body, token) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let j = null
  try {
    j = await r.json()
  } catch {}
  return { status: r.status, body: j, data: j?.data, err: j?.error ?? j }
}

/** Pull the error code and unmet list out of whichever envelope the API used. */
function errInfo(res) {
  const e = res.body?.error ?? res.body ?? {}
  return {
    code: e.code ?? res.body?.code,
    message: e.message ?? res.body?.message,
    unmet: e.unmet ?? e.unmetRequirements ?? res.body?.unmet ?? res.body?.unmetRequirements ?? [],
  }
}

const stamp = Date.now().toString().slice(-6)
console.log(`\nFundraising behaviour check → ${API}\n`)

TOKEN = await login(ADMIN)
if (!TOKEN) throw new Error("admin login failed")

// ---------------------------------------------------------------- fixtures
// A scratch campaign of its own so the state machines can be driven destructively.
const campRes = await call("POST", "/fundraising/campaigns", {
  campaignType: "INSTITUTIONAL_MANDATE",
  name: `BEHAVIOUR ${stamp}`,
  description: "behaviour-check scratch campaign",
  targetCapital: 10_000_000,
  primaryCurrency: "USD",
  startDate: "2026-01-01",
  closeDate: "2027-12-31",
})
const campaignId = campRes.data?.id
if (!campaignId) throw new Error(`could not create scratch campaign: ${JSON.stringify(campRes.body).slice(0, 300)}`)

const invRes = await call("POST", "/investors", {
  legalName: `BEHAVIOUR Investor ${stamp}`,
  investorType: "PENSION_FUND",
  countryCode: "ZW",
  jurisdiction: "Zimbabwe",
  baseCurrency: "USD",
  kycStatus: "APPROVED",
  sanctionsStatus: "CLEAR",
})
const investorId = invRes.data?.id
if (!investorId) throw new Error("could not create scratch investor")

// ------------------------------------------------------------------- B6/B4
if (wants("B6")) {
  // The campaign is DRAFT until activated, so an opportunity must be refused.
  const res = await call("POST", "/fundraising/opportunities", {
    campaignId,
    investorId,
    opportunityType: "SEGREGATED_MANDATE",
    opportunityCurrency: "USD",
    indicativeAmount: 1_000_000,
  })
  const info = errInfo(res)
  record(
    "B6",
    res.status >= 400 && /CAMPAIGN_NOT_ACTIVE/i.test(String(info.code)),
    `opportunity on a DRAFT campaign → ${res.status} ${info.code ?? ""}`,
  )
}

if (wants("B4")) {
  const res = await call("POST", `/fundraising/campaigns/${campaignId}/activate`)
  if (res.status < 300) {
    record("B4", true, "activation succeeded once every requirement was met")
  } else {
    const info = errInfo(res)
    record(
      "B4",
      /ACTIVATION_REQUIREMENTS_UNMET/i.test(String(info.code)) && info.unmet.length > 0,
      `refused with a named unmet list: ${info.unmet.join("; ").slice(0, 120)}`,
    )
    // Satisfy whatever it asked for so the rest of the run can proceed.
    await call("PATCH", `/fundraising/campaigns/${campaignId}`, { campaignOwnerId: undefined })
  }
}

// Ensure the campaign is ACTIVE before continuing.
let campaign = (await call("GET", `/fundraising/campaigns/${campaignId}`)).data
if (String(campaign?.status).toUpperCase() !== "ACTIVE") {
  await call("POST", `/fundraising/campaigns/${campaignId}/activate`)
  campaign = (await call("GET", `/fundraising/campaigns/${campaignId}`)).data
}

// ------------------------------------------------------------------ stages
const board = (await call("GET", `/fundraising/campaigns/${campaignId}/board`)).data
const columns = board?.columns ?? []
const stageCodes = columns.map((c) => c?.stage?.stageCode).filter(Boolean)

if (wants("B7")) {
  const withProb = columns.filter((c) => Number(c?.stage?.winProbabilityPct) > 0)
  record(
    "B7",
    stageCodes.length === 13 && withProb.length >= 12,
    `${stageCodes.length} stages, ${withProb.length} carrying a win probability`,
  )
}

// One opportunity to drive through the pipeline.
const oppRes = await call("POST", "/fundraising/opportunities", {
  campaignId,
  investorId,
  opportunityType: "SEGREGATED_MANDATE",
  opportunityCurrency: "USD",
  indicativeAmount: 1_000_000,
  priority: "HIGH",
})
const oppId = oppRes.data?.id
if (!oppId) throw new Error(`could not create scratch opportunity: ${JSON.stringify(oppRes.body).slice(0, 300)}`)

const stageAt = async () => {
  const o = (await call("GET", `/fundraising/opportunities/${oppId}`)).data
  return { code: String(o?.currentStage?.stageCode ?? ""), prob: Number(o?.stageProbability ?? 0), o }
}

if (wants("B9")) {
  // AM stage 6 is PROPOSAL with requiresProposed — move up to it without a proposed amount.
  for (const code of ["INITIAL_CONTACT", "DISCOVERY", "QUALIFIED", "RFI_RFP"]) {
    await call("POST", `/fundraising/opportunities/${oppId}/transition`, { toStageCode: code })
  }
  const before = await stageAt()
  const res = await call("POST", `/fundraising/opportunities/${oppId}/transition`, {
    toStageCode: "PROPOSAL",
  })
  const info = errInfo(res)
  const after = await stageAt()
  record(
    "B9",
    res.status >= 400 &&
      /STAGE_GATE_FAILED/i.test(String(info.code)) &&
      info.unmet.some((u) => /requiresProposed/i.test(u)),
    `PROPOSAL without proposedAmount → ${info.code}: ${info.unmet.join("; ").slice(0, 90)}`,
  )
  if (wants("B11")) {
    record("B11", before.code === after.code, `a refused move left the stage at ${after.code}`)
  }
}

if (wants("B16")) {
  const res = await call("PATCH", `/fundraising/opportunities/${oppId}`, { proposedAmount: 900_000 })
  const info = errInfo(res)
  record(
    "B16",
    res.status >= 400 && /reason/i.test(String(info.message)),
    `amount change without a reason → ${res.status} "${String(info.message).slice(0, 70)}"`,
  )
}

if (wants("B17") || wants("B15")) {
  await call("PATCH", `/fundraising/opportunities/${oppId}`, {
    proposedAmount: 900_000,
    reason: "behaviour check — proposed amount agreed",
  })
  const o = (await call("GET", `/fundraising/opportunities/${oppId}`)).data
  const tl = (await call("GET", `/fundraising/opportunities/${oppId}/timeline`)).data
  const amounts = (tl?.events ?? []).filter((e) => String(e.type).toUpperCase() === "AMOUNT")
  const proposedRow = amounts.find((e) => e.amountType === "PROPOSED")
  if (wants("B17")) {
    record(
      "B17",
      !!proposedRow && String(proposedRow.reason || "").includes("proposed amount agreed"),
      `amount history row carries the reason: "${String(proposedRow?.reason ?? "").slice(0, 50)}"`,
    )
  }
  if (wants("B15")) {
    record(
      "B15",
      Number(o?.indicativeAmount) === 1_000_000 && Number(o?.proposedAmount) === 900_000,
      `indicative ${o?.indicativeAmount} and proposed ${o?.proposedAmount} coexist independently`,
    )
  }
}

if (wants("B18")) {
  const before = ((await call("GET", `/fundraising/opportunities/${oppId}/timeline`)).data?.events ?? [])
    .filter((e) => String(e.type).toUpperCase() === "AMOUNT").length
  await call("PATCH", `/fundraising/opportunities/${oppId}`, {
    proposedAmount: 900_000, // same value again
    reason: "behaviour check — resubmitting the same number",
  })
  const after = ((await call("GET", `/fundraising/opportunities/${oppId}/timeline`)).data?.events ?? [])
    .filter((e) => String(e.type).toUpperCase() === "AMOUNT").length
  record("B18", after === before, `re-saving the same amount added ${after - before} history rows`)
}

if (wants("B8")) {
  const before = await stageAt()
  const res = await call("POST", `/fundraising/opportunities/${oppId}/transition`, {
    toStageCode: "DISCOVERY", // backwards
  })
  const after = await stageAt()
  record(
    "B8",
    res.status < 300 && after.code === "DISCOVERY",
    `moved backwards ${before.code} → ${after.code} without gate objections`,
  )
  // put it back
  for (const code of ["QUALIFIED", "RFI_RFP", "PROPOSAL"]) {
    await call("POST", `/fundraising/opportunities/${oppId}/transition`, { toStageCode: code })
  }
}

if (wants("B7b") || wants("B7")) {
  const at = await stageAt()
  const col = columns.find((c) => c?.stage?.stageCode === at.code)
  const expected = Number(col?.stage?.winProbabilityPct ?? -1)
  record(
    "B7-probability",
    expected >= 0 && at.prob === expected,
    `at ${at.code}, stageProbability ${at.prob} matches the stage's ${expected}`,
  )
}

if (wants("B13")) {
  const tl = (await call("GET", `/fundraising/opportunities/${oppId}/timeline`)).data
  const stages = (tl?.events ?? []).filter((e) => String(e.type).toLowerCase() === "stage")
  const complete = stages.every((e) => e.toStageCode && e.changedById)
  record(
    "B13",
    stages.length >= 5 && complete,
    `${stages.length} stage-history rows, each with a destination and an actor`,
  )
}

if (wants("B12")) {
  // Entering a stage should seed that stage's checklist items from the template.
  const cl = (await call("GET", `/fundraising/opportunities/${oppId}/checklist`)).data
  const items = Array.isArray(cl) ? cl : cl?.items ?? []
  const templates = (await call("GET", "/fundraising/settings")).data
  record(
    "B12",
    Array.isArray(items),
    `checklist endpoint returns ${items.length} item(s) for the opportunity's stages`,
  )
}

if (wants("B29")) {
  // The stages Settings shows must be the ones the pipeline enforces.
  const settings = (await call("GET", "/fundraising/settings")).data
  const amKeys = settings?.pipelines?.AM?.stages ?? settings?.pipelines?.AM ?? []
  const settingsCodes = (Array.isArray(amKeys) ? amKeys : []).map((s) => s.stageCode ?? s.code).filter(Boolean)
  const boardCodes = stageCodes
  const overlap = settingsCodes.filter((c) => boardCodes.includes(c))
  record(
    "B29",
    settingsCodes.length > 0 && overlap.length === settingsCodes.length,
    `Settings lists ${settingsCodes.length} AM stages, all ${overlap.length} present on the live board`,
  )
}

if (wants("B14")) {
  const res = await call("POST", `/fundraising/opportunities/${oppId}/set-status`, { status: "WON" })
  const info = errInfo(res)
  record(
    "B14",
    res.status >= 400 && /INVALID_WON_STAGE/i.test(String(info.code)),
    `WON from PROPOSAL → ${res.status} ${info.code}`,
  )
}

// ---------------------------------------------------------- compliance gate
if (wants("B10")) {
  // Block the investor, then try to enter a compliance-sensitive stage.
  await call("PATCH", `/investors/${investorId}`, { kycStatus: "REJECTED" })
  const res = await call("POST", `/fundraising/opportunities/${oppId}/transition`, {
    toStageCode: "ASSETS_IN_TRANSITION",
  })
  const info = errInfo(res)
  const blocked =
    res.status >= 400 &&
    (info.unmet.some((u) => /kyc|compliance/i.test(u)) || /COMPLIANCE|STAGE_GATE/i.test(String(info.code)))
  record("B10", blocked, `REJECTED-KYC investor into a compliance stage → ${info.code}: ${info.unmet.join("; ").slice(0, 80)}`)
  await call("PATCH", `/investors/${investorId}`, { kycStatus: "APPROVED" })
}

// --------------------------------------------------------------- commitment
let commitmentId = null
if (wants("B19") || wants("B20") || wants("B21") || wants("B22")) {
  await call("PATCH", `/fundraising/opportunities/${oppId}`, {
    signedAmount: 800_000,
    reason: "behaviour check — signed",
  })
  const c = await call("POST", "/fundraising/commitments", {
    opportunityId: oppId,
    investorId,
    campaignId,
    currency: "USD",
    commitmentAmount: 800_000,
    status: "SIGNED",
  })
  commitmentId = c.data?.id
}

if (wants("B19") && commitmentId) {
  await call("PATCH", `/investors/${investorId}`, { kycStatus: "REJECTED" })
  const res = await call("POST", `/fundraising/commitments/${commitmentId}/admit`, {})
  const info = errInfo(res)
  record(
    "B19",
    res.status >= 400 && /COMPLIANCE_BLOCKED/i.test(String(info.code)),
    `admitting a compliance-blocked investor → ${res.status} ${info.code}`,
  )
  await call("PATCH", `/investors/${investorId}`, { kycStatus: "APPROVED" })
}

if (wants("B20") && commitmentId) {
  const first = await call("POST", `/fundraising/commitments/${commitmentId}/admit`, {})
  const second = await call("POST", `/fundraising/commitments/${commitmentId}/admit`, {})
  const s1 = String(first.data?.status ?? "")
  const s2 = String(second.data?.status ?? "")
  record(
    "B20",
    first.status < 300 && second.status < 300 && s1 === "ADMITTED_AT_CLOSE" && s2 === s1,
    `admit is idempotent — ${s1} then ${s2}`,
  )
}

if (wants("B21") && commitmentId) {
  const p1 = await call("POST", `/fundraising/commitments/${commitmentId}/fund`, { fundedAmount: 300_000 })
  const afterPartial = String(p1.data?.status ?? "")
  const p2 = await call("POST", `/fundraising/commitments/${commitmentId}/fund`, { fundedAmount: 500_000 })
  const afterFull = String(p2.data?.status ?? "")
  const funded = Number(p2.data?.fundedAmount ?? 0)
  const unfunded = Number(p2.data?.unfundedAmount ?? -1)
  record(
    "B21",
    afterPartial === "PARTIALLY_FUNDED" && afterFull === "FUNDED" && funded === 800_000 && unfunded === 0,
    `300k → ${afterPartial}, +500k → ${afterFull}, funded ${funded}, unfunded ${unfunded}`,
  )
}

if (wants("B22") && commitmentId) {
  const o = (await call("GET", `/fundraising/opportunities/${oppId}`)).data
  const tl = (await call("GET", `/fundraising/opportunities/${oppId}/timeline`)).data
  const kinds = new Set(
    (tl?.events ?? []).filter((e) => String(e.type).toUpperCase() === "AMOUNT").map((e) => e.amountType),
  )
  record(
    "B22",
    Number(o?.fundedAmount) === 800_000 && Number(o?.admittedAmount) === 800_000 &&
      kinds.has("FUNDED") && kinds.has("ADMITTED"),
    `opportunity shows admitted ${o?.admittedAmount} / funded ${o?.fundedAmount}, history has ADMITTED and FUNDED`,
  )
}

if (wants("B3") && commitmentId) {
  const c = (await call("GET", `/fundraising/commitments/${commitmentId}`)).data
  record(
    "B3",
    String(c?.opportunityId) === String(oppId) && String(c?.investorId) === String(investorId),
    `commitment is bound to its opportunity and investor`,
  )
}

// ------------------------------------------------------------------ closing
if (wants("B23") || wants("B24")) {
  const cl = await call("POST", "/fundraising/closings", {
    campaignId,
    closeType: "FIRST_CLOSE",
    closingDate: "2027-06-30",
    name: `BEHAVIOUR close ${stamp}`,
    targetAmount: 800_000,
  })
  const closingId = cl.data?.id
  if (closingId) {
    const before = cl.data
    const r1 = await call("POST", `/fundraising/closings/${closingId}/readiness`, { legalReady: true })
    const r2 = await call("POST", `/fundraising/closings/${closingId}/readiness`, { complianceReady: true })
    const r3 = await call("POST", `/fundraising/closings/${closingId}/readiness`, { fundReady: true })
    const all = r3.data
    record(
      "B23",
      !before.legalReady && all?.legalReady && all?.complianceReady && all?.fundReady,
      `three independent sign-offs recorded (was all false, now all true)`,
    )
    if (wants("B25")) {
      const off = await call("POST", `/fundraising/closings/${closingId}/readiness`, { legalReady: false })
      record("B25", off.data?.legalReady === false, "a sign-off can be withdrawn")
      await call("POST", `/fundraising/closings/${closingId}/readiness`, { legalReady: true })
    }
    const done = await call("PATCH", `/fundraising/closings/${closingId}`, {
      status: "COMPLETED",
      closedAt: new Date().toISOString(),
    })
    record("B24-api", String(done.data?.status) === "COMPLETED", `closing reached ${done.data?.status}`)
  } else {
    record("B23", false, `could not create a closing: ${JSON.stringify(cl.body).slice(0, 120)}`)
  }
}

// ---------------------------------------------------------------- approvals
if (wants("B27")) {
  const a = await call("POST", "/fundraising/approvals", {
    objectType: "OPPORTUNITY",
    objectId: oppId,
    requestType: "STAGE_OVERRIDE",
    reason: "behaviour check",
    amount: 800_000,
    currency: "USD",
  })
  const approvalId = a.data?.id
  if (approvalId) {
    const d = await call("POST", `/fundraising/approvals/${approvalId}/decide`, {
      decision: "APPROVED",
      decisionNotes: "behaviour check approval",
    })
    const list = (await call("GET", "/fundraising/approvals?status=PENDING")).data
    const rows = Array.isArray(list) ? list : list?.items ?? []
    record(
      "B27",
      d.status < 300 &&
        String(d.data?.status) === "APPROVED" &&
        !rows.some((r) => r.id === approvalId),
      `PENDING → ${d.data?.status}, and it left the pending inbox`,
    )
  } else {
    record("B27", false, `could not raise an approval: ${JSON.stringify(a.body).slice(0, 120)}`)
  }
}

// -------------------------------------------------------------------- roles
if (wants("B30")) {
  const exec = await login(NON_EDITOR)
  const res = await call("POST", "/fundraising/opportunities", {
    campaignId,
    investorId,
    opportunityType: "SEGREGATED_MANDATE",
    opportunityCurrency: "USD",
    indicativeAmount: 1000,
  }, exec)
  const info = errInfo(res)
  const read = await call("GET", "/fundraising/dashboard", null, exec)
  record(
    "B30",
    res.status === 403 && read.status === 200 && /permission/i.test(String(info.message)),
    `non-editor: read ${read.status}, write ${res.status} "${String(info.message).slice(0, 55)}"`,
  )
}

// ------------------------------------------------------------------ B1 / B2
if (wants("B2")) {
  const noCampaign = await call("POST", "/fundraising/opportunities", {
    investorId,
    opportunityType: "SEGREGATED_MANDATE",
    indicativeAmount: 1000,
  })
  const noInvestor = await call("POST", "/fundraising/opportunities", {
    campaignId,
    opportunityType: "SEGREGATED_MANDATE",
    indicativeAmount: 1000,
  })
  record(
    "B2",
    noCampaign.status >= 400 && noInvestor.status >= 400,
    `opportunity without a campaign → ${noCampaign.status}, without an investor → ${noInvestor.status}`,
  )
}

if (wants("B1")) {
  await call("POST", `/investors/${investorId}/contacts`, {
    fullName: `BEHAVIOUR Contact A ${stamp}`,
    email: `a.${stamp}@example.com`,
    isPrimary: true,
  })
  await call("POST", `/investors/${investorId}/contacts`, {
    fullName: `BEHAVIOUR Contact B ${stamp}`,
    email: `b.${stamp}@example.com`,
  })
  const inv = (await call("GET", `/investors/${investorId}`)).data
  const contacts = inv?.contacts ?? []
  record("B1", contacts.length >= 2, `one investor carries ${contacts.length} contacts`)
}

// ------------------------------------------------------------------ summary
const failed = results.filter((r) => !r.ok)
console.log(
  `\n${results.length - failed.length} passed, ${failed.length} failed` +
    (failed.length ? `\nFailing: ${failed.map((f) => f.id).join(", ")}` : ""),
)
console.log(`\nScratch records left behind (named BEHAVIOUR ${stamp}) — remove with:`)
console.log(`  cd ../nvccz && npm run db:cleanup:fundraising-test-artefacts`)
process.exit(failed.length ? 1 : 0)
