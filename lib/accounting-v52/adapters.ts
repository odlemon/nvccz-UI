import type { ChartOfAccount } from '@/lib/api/chart-of-accounts-api'
import type { Ac52Account, Ac52Journal } from './types'

/**
 * Raw shape of a backend journal entry as actually returned by GET /accounting/journal-entries
 * (confirmed by direct API call — the `JournalEntry`/`JournalLine` interfaces exported from
 * lib/api/accounting-api.ts are stale and do not match: they claim journalNumber/journalDate/
 * totalDebit/totalCredit/DRAFT|POSTED|REVERSED, but the live API returns referenceNumber/
 * transactionDate/totalAmount/status:'PENDING'|'POSTED'|'VOID' and journalEntryLines[] with
 * chartOfAccountId/debitAmount/creditAmount/chartOfAccount. Typed loosely here rather than
 * against that interface to avoid silently wrong field access.
 */
type RawJournalEntry = {
  id: string
  transactionDate: string
  referenceNumber: string
  description: string
  totalAmount: string | number
  status: 'PENDING' | 'POSTED' | 'VOID' | string
  createdAt: string
  createdBy?: { firstName?: string; lastName?: string; email?: string } | null
  journalEntryLines?: Array<{
    chartOfAccountId: string
    debitAmount: string | number
    creditAmount: string | number
    description?: string
    chartOfAccount?: { accountNo?: string }
  }>
}

const JOURNAL_STATUS_FROM_BACKEND: Record<string, Ac52Journal['status']> = {
  POSTED: 'Posted',
  PENDING: 'Submitted',
  VOID: 'Void',
}

/** accounting-v52 mock account types -> backend ChartOfAccounts.accountType enum. */
const TYPE_TO_BACKEND: Record<string, string> = {
  'Current Asset': 'Current Asset',
  'Non-current Asset': 'Long-Term Asset',
  'Contra Asset': 'Contra-Asset',
  'Current Liability': 'Current Liability',
  'Non-current Liability': 'Long-Term Liability',
  'Equity': 'Equity',
  'Revenue': 'Revenue',
  'Other Income': 'Income',
  'Expense': 'Expense',
  'Bank': 'Current Asset',
}

const TYPE_FROM_BACKEND: Record<string, string> = {
  'Current Asset': 'Current Asset',
  'Fixed Asset': 'Non-current Asset',
  'Long-Term Asset': 'Non-current Asset',
  'Contra-Asset': 'Contra Asset',
  'Current Liability': 'Current Liability',
  'Long-Term Liability': 'Non-current Liability',
  'Equity': 'Equity',
  'Revenue': 'Revenue',
  'Income': 'Other Income',
  'Expense': 'Expense',
}

export function ac52AccountTypeToBackend(mockType: string): string {
  return TYPE_TO_BACKEND[mockType] || 'Current Asset'
}

/** Balance Sheet vs Income Statement, per standard classification — backend requires this and the mock UI's own selector for it isn't wired, so this is the fallback when the user doesn't pick one explicitly. */
export function ac52FinancialStatementForType(backendType: string): string {
  return backendType === 'Revenue' || backendType === 'Expense' || backendType === 'Income'
    ? 'Income Statement'
    : 'Balance Sheet'
}

/** Adapt live ChartOfAccounts rows into the shape matanho-accounting-runtime.js's S.accounts expects. */
export function adaptAc52Accounts(rows: ChartOfAccount[]): Ac52Account[] {
  const parentIds = new Set(rows.map((r) => r.parentId).filter(Boolean) as string[])
  return rows.map((r) => {
    const natural: 'Debit' | 'Credit' = ['Revenue', 'Equity', 'Current Liability', 'Long-Term Liability', 'Contra-Asset', 'Income'].includes(
      r.accountType,
    )
      ? 'Credit'
      : 'Debit'
    return {
      code: r.accountNo,
      name: r.accountName,
      type: TYPE_FROM_BACKEND[r.accountType] || r.accountType,
      normal: natural,
      natural,
      control: false,
      posting: !parentIds.has(r.id),
      scope: 'Group',
      active: r.isActive,
      backendId: r.id,
    }
  })
}

/** Adapt live journal entries into the shape matanho-accounting-runtime.js's S.journals expects. */
export function adaptAc52Journals(rows: RawJournalEntry[]): Ac52Journal[] {
  return rows.map((r) => {
    const lines = (r.journalEntryLines || []).map((l) => {
      const debit = Number(l.debitAmount) || 0
      const credit = Number(l.creditAmount) || 0
      return {
        account: l.chartOfAccount?.accountNo || l.chartOfAccountId,
        debit,
        credit,
        description: l.description || r.description,
        project: 'Corporate',
        currency: 'USD',
        rate: 1,
        baseDebit: debit,
        baseCredit: credit,
      }
    })
    const status = JOURNAL_STATUS_FROM_BACKEND[r.status] || 'Submitted'
    const maker = r.createdBy ? `${r.createdBy.firstName || ''} ${r.createdBy.lastName || ''}`.trim() || r.createdBy.email || 'System' : 'System'
    return {
      id: r.referenceNumber || r.id,
      date: r.transactionDate?.slice(0, 10) || r.createdAt?.slice(0, 10),
      reference: r.referenceNumber,
      description: r.description,
      source: 'Live ledger',
      sourceId: r.referenceNumber,
      currency: 'USD',
      rate: 1,
      status,
      maker,
      checker: status === 'Posted' ? 'System controls' : null,
      createdAt: r.createdAt,
      postedAt: status === 'Posted' ? r.createdAt : null,
      cashFlow: 'Operating',
      evidence: [],
      immutable: status === 'Posted',
      lines,
      total: Number(r.totalAmount) || 0,
      backendId: r.id,
    }
  })
}
