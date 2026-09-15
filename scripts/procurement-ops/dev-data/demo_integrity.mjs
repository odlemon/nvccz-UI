// Read-only check that the dev demo dataset is intact (after a regression run and its cleanup). Dev only.
//
//   API=https://dev-api.matanho.com/api node scripts/procurement-ops/dev-data/demo_integrity.mjs
//
// Exit 0 when every expectation holds, 1 otherwise; each line says what was found.
const API = process.env.API || "https://dev-api.matanho.com/api"
const PASSWORD = "admin123"
const results = []
const check = (ok, what, detail) => {
  results.push(ok)
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${what}${detail ? ` — ${detail}` : ""}`)
}

async function login(email) {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: PASSWORD, portal: "staff" }) })
  const j = await r.json().catch(() => ({}))
  return j.token || j?.data?.token
}
const tokens = {}
async function rows(who, path) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${tokens[who]}` } })
  const j = await r.json().catch(() => ({}))
  const d = j?.data ?? j
  return Array.isArray(d) ? d : Object.values(d ?? {}).find(Array.isArray) ?? []
}

for (const [who, email] of Object.entries({ mgr: "proc.mgr@nts.local", ap: "proc.ap@nts.local", fin: "payroll.finmgr@nts.local" })) tokens[who] = await login(email)

const DEMO_VENDORS = ["Jacaranda Office Supplies (Pvt) Ltd", "Granite Ridge Stationers (Pvt) Ltd", "Msasa Contract Furniture (Pvt) Ltd", "Kopje Office Furniture (Pvt) Ltd", "Baobab Networks & Computing (Pvt) Ltd", "Kestrel Technology Solutions (Pvt) Ltd", "Sable Facilities Management (Pvt) Ltd", "Hillside Building Services (Pvt) Ltd", "Mopani Fleet Services (Pvt) Ltd"]
const isTest = (s) => /^(UAT|Storyline|E2E)\b/.test(String(s ?? ""))

const vendors = await rows("mgr", "/accounting/vendors")
check(DEMO_VENDORS.every((n) => vendors.some((v) => v.name === n)), "the nine demo vendors exist", `${vendors.filter((v) => DEMO_VENDORS.includes(v.name)).length}/9`)
check(!vendors.some((v) => isTest(v.name)), "no test vendors left", vendors.filter((v) => isTest(v.name)).map((v) => v.name).join(", ") || "none")

const reqs = await rows("mgr", "/procurement/requisitions")
const byTitle = (t) => reqs.find((r) => r.title === t)
check(!reqs.some((r) => isTest(r.title)), "no test requisitions left", String(reqs.filter((r) => isTest(r.title)).length))
check(byTitle("Training room projector replacement")?.status === "PENDING_APPROVAL", "projector requisition still waits on the department head", byTitle("Training room projector replacement")?.status)
check(byTitle("Pool vehicle servicing")?.status === "APPROVED", "fleet requisition still approved, awaiting sourcing", byTitle("Pool vehicle servicing")?.status)
check(byTitle("Height-adjustable desks for all staff")?.status === "REJECTED", "desks requisition still rejected", byTitle("Height-adjustable desks for all staff")?.status)

const rfqs = await rows("mgr", "/procurement/rfq")
check(!rfqs.some((r) => isTest(r.title)), "no test RFQs left", String(rfqs.filter((r) => isTest(r.title)).length))
const network = rfqs.find((r) => r.title === "Supply and installation of network switches and access points")
const quotes = await rows("mgr", "/vendor-quotations")
const networkBids = quotes.filter((q) => q.procurementRfqId === (network?.procurementRfqId ?? network?.id))
check(network && network.status !== "AWARDED" && networkBids.length === 2 && !networkBids.some((q) => q.status === "ACCEPTED"), "network RFQ still has two bids and no award", `${network?.status} · ${networkBids.length} bids`)

const grns = await rows("mgr", "/procurement/goods-received-notes")
const boardroom = grns.find((g) => g.purchaseOrder?.vendor?.name === "Msasa Contract Furniture (Pvt) Ltd" || g.purchaseOrder?.vendorId === vendors.find((v) => v.name === "Msasa Contract Furniture (Pvt) Ltd")?.id)
check(boardroom?.status === "RECEIVED", "boardroom receipt still waits on inspection", boardroom ? `${boardroom.grnNumber} ${boardroom.status}` : "not found")

const invoices = await rows("ap", "/procurement/invoices")
const demoInvoices = invoices.filter((i) => DEMO_VENDORS.includes(i.vendor?.name))
const stationery = demoInvoices.find((i) => i.vendor?.name === "Jacaranda Office Supplies (Pvt) Ltd")
const laptops = demoInvoices.find((i) => i.vendor?.name === "Baobab Networks & Computing (Pvt) Ltd")
check(demoInvoices.length === 2, "the demo has two supplier invoices", String(demoInvoices.length))
check(stationery && ["DRAFT", "PENDING"].includes(String(stationery.status).toUpperCase()), "stationery invoice still waits on Finance", stationery ? `${stationery.invoiceNumber} ${stationery.status}` : "not found")
check(laptops?.paymentStatus === "PAID" && laptops?.journalEntryId, "laptop invoice still paid with its journal", laptops ? `${laptops.invoiceNumber} ${laptops.status}/${laptops.paymentStatus}` : "not found")

const plans = await rows("mgr", "/procurement/plans")
check(!plans.some((p) => isTest(p.name)), "no test plans left", String(plans.filter((p) => isTest(p.name)).length))
check(plans.find((p) => p.name === "FY 2027 Operations Procurement Plan")?.status === "SUBMITTED", "FY 2027 plan still waits on Finance", plans.find((p) => p.name === "FY 2027 Operations Procurement Plan")?.status)
check(plans.find((p) => p.name === "FY 2026 Operations Procurement Plan")?.status === "APPROVED", "FY 2026 plan still approved")

const contracts = await rows("mgr", "/procurement/contracts")
check(contracts.length === 1 && contracts[0].status === "ACTIVE", "one active contract, no test contracts", contracts.map((c) => `${c.contractNumber} ${c.status}`).join(", "))

const journals = await rows("fin", "/accounting/journal-entries?limit=50")
check(!journals.some((j) => /UAT|Storyline/.test(String(j.description))), "no test postings left in the ledger", String(journals.filter((j) => /UAT|Storyline/.test(String(j.description))).length))

// The audit trail names only records that exist: a removed record keeps its raw id as its label, and an RFQ row
// (written against the RFQ number) names a number some RFQ still has. Tidied by dev_audit_tidy.mjs.
const audit = await rows("mgr", "/procurement/audit-events?limit=500")
const rfqNumbers = new Set(rfqs.map((r) => r.rfqNumber))
const orphans = audit.filter((a) => (a.entityType === "RFQ" ? !rfqNumbers.has(a.entityId) : !a.entityLabel))
check(audit.length > 0 && !orphans.length, "the audit trail names only records that exist", orphans.length ? `${orphans.length} orphaned, e.g. ${orphans.slice(0, 3).map((a) => `${a.action} ${a.entityType} ${a.entityId}`).join("; ")}` : `${audit.length} rows`)

const failed = results.filter((x) => !x).length
console.log(`=== RESULT === demo dataset ${failed ? `NOT intact (${failed} check${failed === 1 ? "" : "s"} failed)` : "intact"} · ${results.length - failed}/${results.length}`)
process.exit(failed ? 1 : 0)
