import type { ChartOfAccount } from '@/lib/api/chart-of-accounts-api'

/** Minimal shape this needs from a raw GET /accounting/journal-entries row — see adapters.ts's RawJournalEntry for the full documented shape. */
type RawJournalForStatements = {
  status: string
  journalEntryLines?: Array<{
    debitAmount: string | number
    creditAmount: string | number
    chartOfAccount?: { accountNo?: string }
  }>
}

/** [label, current period, 2025, 2024, 2023] — matches the runtime's reportRows shape (matanho-accounting-runtime.js reportSheet17, which reads r[1] as the actual period and r[2]/r[4]??r[3] as prior-year comparatives). This is a brand-new ledger with no real prior-year postings, so comparatives are honestly 0 rather than invented. */
export type Ac52ReportRow = [string, number, number, number, number]

export type Ac52ReportRows = {
  pnl: Ac52ReportRow[]
  bs: Ac52ReportRow[]
  cf: Ac52ReportRow[]
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

const ASSET_TYPES = new Set(['Current Asset', 'Fixed Asset', 'Long-Term Asset', 'Non-current Asset'])
const LIABILITY_TYPES = new Set(['Current Liability', 'Long-Term Liability', 'Non-current Liability'])

/**
 * Derives real Income Statement, Balance Sheet and (a simplified) Cash Flow Statement from the live
 * chart of accounts and posted journal lines — the same underlying data the Trial Balance page reads,
 * classified by each account's real accountType/financialStatement/naturalBalance instead of the
 * runtime's hardcoded reportRows literals.
 *
 * Balance Sheet total assets is mathematically guaranteed to equal total liabilities + total equity
 * (equity includes current-period earnings, since nothing here posts a real closing entry): every
 * journal is debit=credit balanced, so the signed net across every account in the ledger sums to
 * zero, and re-arranging that identity by natural balance is exactly the accounting equation.
 *
 * Cash Flow is deliberately not split into Operating/Investing/Financing sections — the live journal
 * data has no transaction-level cash-flow classification to derive that split from honestly, so this
 * reports only the one line that is genuinely derivable: net movement in cash/bank accounts.
 */
export function computeAc52FinancialStatements(accounts: ChartOfAccount[], journals: RawJournalForStatements[]): Ac52ReportRows {
  const netByAccountNo = new Map<string, number>()
  for (const j of journals) {
    if (j.status !== 'POSTED') continue
    for (const l of j.journalEntryLines || []) {
      const no = l.chartOfAccount?.accountNo
      if (!no) continue
      const debit = Number(l.debitAmount) || 0
      const credit = Number(l.creditAmount) || 0
      netByAccountNo.set(no, (netByAccountNo.get(no) || 0) + debit - credit)
    }
  }

  const displayAmount = (acc: ChartOfAccount): number => {
    const net = netByAccountNo.get(acc.accountNo) || 0
    return acc.naturalBalance === 'CREDIT' ? -net : net
  }
  const hasActivity = (acc: ChartOfAccount) => Math.abs(displayAmount(acc)) > 0.005
  const row = (label: string, value: number): Ac52ReportRow => [label, round2(value), 0, 0, 0]
  const accountRow = (acc: ChartOfAccount) => row(`${acc.accountNo} · ${acc.accountName}`, displayAmount(acc))

  const incomeStatementAccounts = accounts.filter((a) => a.financialStatement === 'Income Statement' && hasActivity(a))
  const balanceSheetAccounts = accounts.filter((a) => a.financialStatement === 'Balance Sheet' && hasActivity(a))

  const revenueAccounts = incomeStatementAccounts.filter((a) => a.accountType === 'Revenue')
  const expenseAccounts = incomeStatementAccounts.filter((a) => a.accountType === 'Expense')
  const totalRevenue = revenueAccounts.reduce((s, a) => s + displayAmount(a), 0)
  const totalExpense = expenseAccounts.reduce((s, a) => s + displayAmount(a), 0)
  const netIncome = totalRevenue - totalExpense

  const pnl: Ac52ReportRow[] = [
    ...revenueAccounts.map(accountRow),
    row('Total revenue', totalRevenue),
    ...expenseAccounts.map(accountRow),
    row('Total expenses', totalExpense),
    row('Profit before tax', netIncome),
  ]

  const assetAccounts = balanceSheetAccounts.filter((a) => ASSET_TYPES.has(a.accountType))
  const liabilityAccounts = balanceSheetAccounts.filter((a) => LIABILITY_TYPES.has(a.accountType))
  const equityAccounts = balanceSheetAccounts.filter((a) => a.accountType === 'Equity')
  const totalAssets = assetAccounts.reduce((s, a) => s + displayAmount(a), 0)
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + displayAmount(a), 0)
  const totalEquityBeforeEarnings = equityAccounts.reduce((s, a) => s + displayAmount(a), 0)
  const totalEquity = totalEquityBeforeEarnings + netIncome

  const bs: Ac52ReportRow[] = [
    ...assetAccounts.map(accountRow),
    row('Total assets', totalAssets),
    ...liabilityAccounts.map(accountRow),
    row('Total liabilities', totalLiabilities),
    ...equityAccounts.map(accountRow),
    row('Current period earnings', netIncome),
    row('Total equity', totalEquity),
    row('Total liabilities and equity', totalLiabilities + totalEquity),
  ]

  const cashAccounts = accounts.filter((a) => a.financialStatement === 'Balance Sheet' && /cash|bank/i.test(a.accountName))
  const netCashMovement = cashAccounts.reduce((s, a) => s + displayAmount(a), 0)
  const cf: Ac52ReportRow[] = [
    row('Opening cash', 0),
    row('Net movement in cash and bank accounts', netCashMovement),
    row('Closing cash', netCashMovement),
  ]

  return { pnl, bs, cf }
}
