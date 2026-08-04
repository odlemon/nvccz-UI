export const acConsolidationHeader = {
  title: "Group Consolidation",
  meta: "· July 2026",
}

export const acConsolidationTabs = [
  "Mukuru Capital Partners",
  "Mukuru Advisory",
  "ZimGrowth Fund I",
  "Group Consolidated",
]

export const acConsolidationStats = [
  { label: "Entities", value: "3", sub: "in scope" },
  { label: "Trial balances loaded", value: "3 / 3", sub: "100% complete", tone: "cobalt" as const },
  { label: "Intercompany differences", value: "$18,420", sub: "requires elimination", tone: "exception" as const },
  { label: "Elimination journals", value: "7", sub: "to post" },
  { label: "Consolidation progress", value: "82%", sub: "on track", tone: "cobalt" as const, donut: 82 },
]

export type AcConsolidationEntity = {
  entity: string
  currency: string
  trialBalance: string
  trialBalanceAt: string
  icBalance: string
  differences: string
  eliminations: string
  status: string
  statusTone: "cobalt" | "pending"
  lastUpdated: string
  diffRed?: boolean
}

export const acConsolidationEntities: AcConsolidationEntity[] = [
  { entity: "Mukuru Capital Partners (Pvt) Ltd", currency: "USD", trialBalance: "Loaded", trialBalanceAt: "15 Jul 2026 09:12", icBalance: "$9,842,110", differences: "$12,600", eliminations: "4", status: "In progress", statusTone: "cobalt", lastUpdated: "15 Jul 2026 09:12", diffRed: true },
  { entity: "Mukuru Advisory (Pvt) Ltd", currency: "USD", trialBalance: "Loaded", trialBalanceAt: "15 Jul 2026 09:07", icBalance: "($9,829,510)", differences: "($12,600)", eliminations: "2", status: "In progress", statusTone: "cobalt", lastUpdated: "15 Jul 2026 09:07", diffRed: true },
  { entity: "ZimGrowth Fund I (Pvt) Ltd", currency: "USD", trialBalance: "Loaded", trialBalanceAt: "15 Jul 2026 09:10", icBalance: "($18,420)", differences: "$18,420", eliminations: "1", status: "Review", statusTone: "pending", lastUpdated: "15 Jul 2026 09:10", diffRed: true },
]

export const acConsolidationEntityCount = { shown: "1–3", total: "3" }

export type AcIcMatch = {
  id: string
  pair: string
  account: string
  entityA: string
  entityB: string
  difference: string
  currency: string
  matchState: "Exception" | "Matched" | "Review" | "N/A"
  owner: string
  diffRed?: boolean
  selected?: boolean
}

export const acIcMatches: AcIcMatch[] = [
  { id: "ic-1", pair: "Mukuru Capital Partners ↔ Mukuru Advisory", account: "Management fee expense / income", entityA: "$25,200.00", entityB: "($12,600.00)", difference: "$12,600.00", currency: "USD", matchState: "Exception", owner: "Tariro Ncube", diffRed: true, selected: true },
  { id: "ic-2", pair: "Mukuru Advisory ↔ Mukuru Capital Partners", account: "Reimbursable expenses", entityA: "$6,150.00", entityB: "($6,150.00)", difference: "$0.00", currency: "USD", matchState: "Matched", owner: "Rudo Chikore" },
  { id: "ic-3", pair: "ZimGrowth Fund I ↔ Mukuru Capital Partners", account: "Interest income / expense", entityA: "$9,820.00", entityB: "($8,420.00)", difference: "$1,400.00", currency: "USD", matchState: "Review", owner: "Rudo Chikore", diffRed: true },
  { id: "ic-4", pair: "Mukuru Capital Partners ↔ ZimGrowth Fund I", account: "Service fees", entityA: "$3,000.00", entityB: "($3,000.00)", difference: "$0.00", currency: "USD", matchState: "Matched", owner: "Farai Moyo" },
  { id: "ic-5", pair: "Mukuru Advisory ↔ ZimGrowth Fund I", account: "Loan receivable / payable", entityA: "$0.00", entityB: "$0.00", difference: "$0.00", currency: "USD", matchState: "N/A", owner: "—" },
]

export const acIcPagination = { shown: "1–5", total: "12", page: 1, pages: 3 }

export type AcConsolidatedTbRow = {
  group: string
  localTb: string
  adjustments: string
  eliminations: string
  consolidated: string
  variance: string
  strong?: boolean
}

export const acConsolidatedTb: AcConsolidatedTbRow[] = [
  { group: "Assets", localTb: "23,045,812.31", adjustments: "120,500.00", eliminations: "(12,600.00)", consolidated: "23,153,712.31", variance: "0.00" },
  { group: "Liabilities", localTb: "8,912,430.12", adjustments: "35,000.00", eliminations: "(12,600.00)", consolidated: "8,934,830.12", variance: "0.00" },
  { group: "Equity", localTb: "6,123,450.00", adjustments: "0.00", eliminations: "0.00", consolidated: "6,123,450.00", variance: "0.00" },
  { group: "Income", localTb: "14,825,210.75", adjustments: "(45,300.00)", eliminations: "(12,600.00)", consolidated: "14,767,310.75", variance: "0.00" },
  { group: "Expenses", localTb: "15,603,890.18", adjustments: "(110,200.00)", eliminations: "(12,600.00)", consolidated: "15,481,090.18", variance: "0.00" },
  { group: "Net profit", localTb: "(613,179.43)", adjustments: "0.00", eliminations: "0.00", consolidated: "(613,179.43)", variance: "0.00", strong: true },
]

export const acEliminationDrawer = {
  ref: "ELIM-2026-0715-03",
  status: "Exception",
  pair: "Mukuru Capital Partners ↔ Mukuru Advisory",
  account: "Management fee expense / income",
  difference: "$12,600.00",
  differenceCurrency: "USD",
}

export const acEliminationInvoices = {
  entityA: { entity: "Mukuru Capital Partners (Pvt) Ltd", invoice: "MCP-2026-0715-07", date: "15 Jul 2026", amount: "$25,200.00" },
  entityB: { entity: "Mukuru Advisory (Pvt) Ltd", invoice: "INV-MA-2026-0715-03", date: "15 Jul 2026", amount: "($12,600.00)" },
}

export const acEliminationReciprocal = {
  entityA: { account: "5100 · Management fee expense", amount: "$25,200.00" },
  entityB: { account: "4100 · Management fee income", amount: "($12,600.00)" },
}

export const acEliminationFx = {
  amount: "($12,600.00)",
  rateLabel: "Impact @ 27.94",
  zigAmount: "(ZiG 352,404.00)",
}

export const acEliminationJournal = [
  { account: "4100 - Management fee income", description: "Eliminate intercompany income", debit: "12,600.00", credit: "—" },
  { account: "5100 - Management fee expense", description: "Eliminate intercompany expense", debit: "—", credit: "12,600.00" },
]

export const acEliminationEvidence = [
  { name: "MCP-2026-0715-07.pdf", size: "86 KB" },
  { name: "MA-2026-0715-03.pdf", size: "74 KB" },
  { name: "confirmation.pdf", size: "92 KB" },
]

export const acEliminationComments =
  "Mukuru Advisory raised lower invoice. Variance relates to scope change approved on 14 Jul 2026."

export const acEliminationApproval = [
  { name: "Tariro Ncube", role: "Preparer", at: "15 Jul 2026 09:18", status: "Prepared", tone: "cobalt" as const },
  { name: "Rudo Chikore", role: "Reviewer", at: "15 Jul 2026 09:21", status: "Pending review", tone: "pending" as const },
  { name: "Farai Moyo", role: "Approver", at: "", status: "Pending approval", tone: "faint" as const },
]
