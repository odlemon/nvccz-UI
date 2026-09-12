import type { ChartOfAccount } from '@/lib/api/chart-of-accounts-api'
import type { PurchaseInvoice, Vendor, Invoice, Customer, Expense, InventoryItem, Asset, RecurringJournalTemplate } from '@/lib/api/accounting-api'
import type { DashboardInstrument } from '@/lib/api/short-term-investments-api'
import type { Ac52Account, Ac52Journal, Ac52Bank, Ac52ReconciliationLine, Ac52ApBill, Ac52ApVendor, Ac52ArInvoice, Ac52ArCustomer, Ac52Claim, Ac52InventoryItem, Ac52FixedAsset, Ac52Investment, Ac52Approval, Ac52RecurringSchedule, Ac52VaultDocument, Ac52TaxPack, Ac52CloseTask, Ac52CloseTaskV11, Ac52Timesheet, Ac52Project, Ac52AuditEvent, Ac52AccessData } from './types'
import type { AccountingDocument } from '@/lib/api/accounting-documents-api'
import type { TaxReturnPack } from '@/lib/api/tax-return-pack-api'
import type { AccountingCloseTask, CloseTaskPerson } from '@/lib/api/accounting-close-tasks-api'
import type { PendingApproval } from '@/lib/api/approvals-api'
import type { Timesheet, Project } from '@/lib/api/timesheets-api'
import type { AuditLogRow } from '@/lib/api/audit-log-api'
import type { AppUser } from '@/lib/api/users-api'
import type { AppRole } from '@/lib/api/roles-api'

/** Raw shape of GET /cashbook/banks rows. */
type RawCashbookBank = {
  id: string
  name: string
  accountNumber?: string | null
  isActive: boolean
  currency?: { code?: string } | null
  glAccount?: { accountNo?: string } | null
}

/** Raw shape of an unmatched bank transaction line (GET /accounting/bank-reconciliation/:id/unmatched). */
type RawBankTransaction = {
  id: string
  transactionDate?: string
  date?: string
  reference?: string | null
  description?: string | null
  amount: string | number
  isMatched?: boolean
}

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

/** Adapt live PENDING journal entries into the v8 Approval Centre's S.approvals array — a journal awaiting POSTED status, no separate ApprovalRequest/Approval row exists for these (see backendKind on Ac52Approval). */
export function adaptAc52Approvals(rows: RawJournalEntry[]): Ac52Approval[] {
  return rows
    .filter((r) => r.status === 'PENDING')
    .map((r) => ({
      id: `APR-${r.referenceNumber || r.id}`,
      type: 'Journal',
      record: r.referenceNumber || r.id,
      title: r.description,
      amount: Number(r.totalAmount) || 0,
      currency: 'USD',
      maker: r.createdBy ? `${r.createdBy.firstName || ''} ${r.createdBy.lastName || ''}`.trim() || r.createdBy.email || 'System' : 'System',
      requiredRole: 'Finance Director or CEO',
      status: 'Pending',
      backendKind: 'journal',
      backendId: r.id,
    }))
}

const NON_JOURNAL_STAGE_TYPES = new Set(['MASTER_DATA_COA', 'PAYMENT_EXECUTION', 'INVESTMENT_BOOKING'])

/** Adapt real non-journal approval requests (Chart of Accounts changes, payment execution above the $10k USD threshold, investment booking above the $50k USD threshold — see PaymentInvestmentApprovalService) into the Approval Centre's shape, merged alongside adaptAc52Approvals' journal rows. Scoped to the current user's own assigned approvals (GET /approvals/my-pending has no "all pending" view) — 0 rows is the honest, expected result until a real user holds the CFO role these stages target. Master Data changes have no real amount concept, so they stay honestly 0; Payment/Investment carry a real entityData.amountUsd. */
export function adaptAc52NonJournalApprovals(rows: PendingApproval[]): Ac52Approval[] {
  return rows
    .filter((r) => r.status === 'PENDING' && NON_JOURNAL_STAGE_TYPES.has(r.stage.stageType))
    .map((r) => {
      const maker = r.request.requestedBy
        ? `${r.request.requestedBy.firstName} ${r.request.requestedBy.lastName}`.trim() || r.request.requestedBy.email
        : 'System'
      if (r.stage.stageType === 'PAYMENT_EXECUTION') {
        const d = r.request.entityData
        return {
          id: `APR-${r.request.id}`,
          type: 'Payment',
          record: d?.kind === 'BATCH' ? `${d.invoiceIds?.length || 0} bills` : d?.paymentReference || r.request.entityId,
          title: d?.kind === 'BATCH' ? `Batch supplier payment · ${d.invoiceIds?.length || 0} bill(s)` : `Supplier payment · ${d?.paymentReference || r.request.entityId}`,
          amount: Number(d?.amountUsd) || 0,
          currency: d?.currencyCode || 'USD',
          maker,
          requiredRole: r.stage.stepName,
          status: 'Pending',
          backendKind: 'approval',
          backendId: r.id,
        }
      }
      if (r.stage.stageType === 'INVESTMENT_BOOKING') {
        const d = r.request.entityData
        return {
          id: `APR-${r.request.id}`,
          type: 'Investment',
          record: d?.issuer || r.request.entityId,
          title: `New investment booking · ${d?.issuer || 'Unnamed issuer'}`,
          amount: Number(d?.amountUsd ?? d?.principal) || 0,
          currency: d?.currencyCode || 'USD',
          maker,
          requiredRole: r.stage.stepName,
          status: 'Pending',
          backendKind: 'approval',
          backendId: r.id,
        }
      }
      return {
        id: `APR-${r.request.id}`,
        type: 'Master data',
        record: r.request.entityId,
        title: `Chart of Accounts change · ${r.stage.stepName}`,
        amount: 0,
        currency: 'USD',
        maker,
        requiredRole: r.stage.stepName,
        status: 'Pending',
        backendKind: 'approval',
        backendId: r.id,
      }
    })
}

/** [item, currency, FCY balance, book rate, close rate, base carrying, FX movement, status] — matches the runtime's fxPage23 exposure register table shape (matanho-accounting-runtime.js). */
export type Ac52FxExposureRow = [string, string, number, number, number, number, number, string]

export type Ac52FxSummary = {
  exposure: number
  gain: number
  lines: Ac52FxExposureRow[]
}

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000
}

/**
 * Adapt GET /accounting/multi-currency/reports/unrealized-fx into the FX Revaluation page's exposure
 * register. This is the only real FX-revaluation data the backend exposes — open AR invoices' ZiG
 * functional-currency exposure — so bank/AP-side monetary exposure (which the mock's original
 * hardcoded rows implied) isn't covered; there's no backend report for it. Book/close "rate" here is
 * approximated as functional-value ÷ FCY-balance (the report gives functional-currency values, not a
 * bare rate), which is the same concept the mock's rate columns represent even if not the identical
 * currency pair. Empty when there's no open foreign-currency AR — an honest empty state, not a bug
 * (this test ledger has no non-USD invoices).
 */
export function adaptAc52FxExposure(report: { lines?: any[]; totals?: { netUnrealized?: string } }): Ac52FxSummary {
  const lines: Ac52FxExposureRow[] = (report.lines || []).map((l: any) => {
    const fcy = Number(l.outstandingAmount) || 0
    const originalValue = Number(l.originalFunctionalValue) || 0
    const currentValue = Number(l.currentFunctionalValue) || 0
    const movement = (l.gainLossType === 'LOSS' ? -1 : 1) * (Number(l.unrealizedGainLoss) || 0)
    return [
      `${l.invoiceNumber || l.invoiceId} · ${l.customerName}`,
      l.invoiceCurrencyCode,
      fcy,
      fcy ? round4(originalValue / fcy) : 0,
      fcy ? round4(currentValue / fcy) : 0,
      currentValue,
      movement,
      l.gainLossType === 'NONE' ? 'Ready' : 'Review',
    ]
  })
  const exposure = lines.reduce((s, l) => s + Math.abs(l[5]), 0)
  const gain = Number(report.totals?.netUnrealized) || 0
  return { exposure, gain, lines }
}

function nextMonthlyRunDate(dayOfMonth: number): string {
  const now = new Date()
  const clampedDay = Math.min(Math.max(dayOfMonth, 1), 28)
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth()
  if (now.getUTCDate() > clampedDay) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

/**
 * Adapt live recurring journal templates into the v27 Recurring Schedules page's ST27.schedules
 * array. These are recurring JOURNAL templates specifically (debit/credit lines against chart-of-
 * account codes), not the mock's broader "supplier bill / invoice / expense" schedule types — the
 * real backend only supports the journal case, so `type` is honestly 'Journal' throughout rather
 * than claiming a bill/invoice automation this system doesn't have. `counterparty`/`project`/`entity`/
 * `approval` have no equivalent on a generic journal template and carry neutral defaults; `owner`
 * uses the template's real creator.
 */
export function adaptAc52RecurringSchedules(rows: RecurringJournalTemplate[]): Ac52RecurringSchedule[] {
  return rows.map((r) => {
    const amount = (r.linesJson || []).reduce((s, l) => s + (Number(l.debitAmount) || 0), 0)
    const debitLine = (r.linesJson || []).find((l) => (Number(l.debitAmount) || 0) > 0)
    const creditLine = (r.linesJson || []).find((l) => (Number(l.creditAmount) || 0) > 0)
    return {
      id: r.id,
      type: 'Journal',
      counterparty: 'Not applicable',
      description: r.name,
      frequency: 'Monthly',
      cadence: `Monthly · day ${r.dayOfMonth}`,
      nextRun: nextMonthlyRunDate(r.dayOfMonth),
      currency: r.currency?.code || 'USD',
      amount,
      debit: debitLine?.chartOfAccountId || '—',
      credit: creditLine?.chartOfAccountId || '—',
      project: 'Corporate',
      entity: 'Matanho Capital Partners',
      approval: 'Auto-post on run (no approval gate configured)',
      status: r.isActive ? 'Active' : 'Paused',
      amountMode: 'Fixed amount',
      owner: r.createdBy ? `${r.createdBy.firstName} ${r.createdBy.lastName}`.trim() || r.createdBy.email : 'System',
      // A real date isn't available here (the list endpoint returns a run count, not the run rows) —
      // left blank rather than guessing, since this field is date-formatted wherever it's displayed.
      lastRun: '',
      lastResult: r._count?.runs ? 'Successful' : '—',
      exception: '',
      version: 1,
      autoPost: true,
    }
  })
}

/** Adapt live cashbook bank rows into the shape S.banks expects. */
export function adaptAc52Banks(rows: RawCashbookBank[]): Ac52Bank[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    institution: r.name,
    currency: r.currency?.code || 'USD',
    gl: r.glAccount?.accountNo || '',
    account: r.accountNumber || '',
    feed: 'Bank feed',
    status: r.isActive ? 'Active' : 'Inactive',
  }))
}

/** Adapt live unmatched bank transactions into an S.reconciliation.statement-shaped array. Empty when no reconciliation run exists yet — that's the honest state, not a bug. */
export function adaptAc52ReconciliationStatement(rows: RawBankTransaction[]): Ac52ReconciliationLine[] {
  return rows.map((r) => ({
    id: r.id,
    date: (r.transactionDate || r.date || '').slice(0, 10),
    ref: r.reference || r.id,
    description: r.description || '',
    amount: Number(r.amount) || 0,
    status: r.isMatched ? 'Matched' : 'Unmatched',
  }))
}

/** Supplier bill status label the v28 Payables page's status() helper can colour — DRAFT/PENDING isn't in its ok|bad|warn regexes so it falls to a neutral grey, which is fine since none of these is a fabricated claim. */
function apBillStatusLabel(status: string, paymentStatus: string): string {
  if (paymentStatus === 'PAID') return 'Paid'
  if (status === 'DRAFT') return 'Draft'
  return 'Due'
}

/** Adapt live purchase invoices into the shape the v28 Payables page's apBills array expects. No PO/GRN/three-way-match system exists in the backend, so those columns show '—' rather than an invented value. */
export function adaptAc52ApBills(rows: PurchaseInvoice[]): Ac52ApBill[] {
  return rows.map((r) => ({
    id: r.id,
    vendor: r.vendor?.name || 'Unknown vendor',
    invoice: r.invoiceNumber,
    date: (r.invoiceDate || '').slice(0, 10),
    due: (r.dueDate || '').slice(0, 10),
    po: '—',
    grn: '—',
    project: 'Corporate',
    gross: Number(r.totalAmount) || 0,
    open: Number(r.outstandingAmount) || 0,
    match: '—',
    status: apBillStatusLabel(r.status, r.paymentStatus),
    journal: r.journalEntry?.referenceNumber || '',
  }))
}

/** Adapt live vendors into the v28 Payables page's apVendors array. `open` is summed from that vendor's live purchase-invoice outstanding balances (passed in, not re-fetched) — category/terms/KYC/risk have no backend field yet, so they carry honest neutral defaults rather than an invented classification. */
export function adaptAc52ApVendors(rows: Vendor[], bills: PurchaseInvoice[]): Ac52ApVendor[] {
  return rows.map((v) => {
    const outstanding = bills.filter((b) => b.vendorId === v.id).reduce((s, b) => s + (Number(b.outstandingAmount) || 0), 0)
    return {
      id: v.id,
      name: v.name,
      category: 'General',
      open: outstanding,
      terms: Number(v.paymentTerms) || 30,
      kyc: v.isBlacklisted ? 'Blocked' : 'Current',
      risk: v.isBlacklisted ? 'High' : 'Low',
      currency: 'USD',
    }
  })
}

/** Sales invoice status label for the v28 Receivables page. Overdue is computed from the real dueDate when the API has set one (it's nullable and not set by CreateInvoiceRequest, so many invoices won't have it); otherwise it maps to 'Current' rather than guessing a date that doesn't exist. */
function arInvoiceStatusLabel(status: string, dueDate: string | null | undefined, open: number): string {
  if (status === 'PAID') return 'Paid'
  if (status === 'VOID') return 'Void'
  if (status === 'DRAFT') return 'Draft'
  if (open > 0 && dueDate && new Date(dueDate).getTime() < Date.now()) return 'Overdue'
  return 'Current'
}

/** Adapt live customer invoices into the v28 Receivables page's arInvoices array. Uses the API's own outstandingAmount (reflects partial payments) rather than re-deriving it from status. */
export function adaptAc52ArInvoices(rows: Invoice[]): Ac52ArInvoice[] {
  return rows.map((r) => {
    const open = r.outstandingAmount !== undefined ? Number(r.outstandingAmount) || 0 : r.status === 'PAID' || r.status === 'VOID' ? 0 : Number(r.totalAmount) || 0
    return {
      id: r.id,
      customer: r.customer?.name || 'Unknown customer',
      date: (r.transactionDate || '').slice(0, 10),
      due: r.dueDate ? r.dueDate.slice(0, 10) : '—',
      project: 'Corporate',
      gross: Number(r.totalAmount) || 0,
      open,
      status: arInvoiceStatusLabel(r.status, r.dueDate, open),
      journal: r.journalEntry?.referenceNumber || '',
    }
  })
}

/** Adapt live customers into the v28 Receivables page's arCustomers array. `outstanding`/`overdue` sum that customer's live invoice balances (passed in, not re-fetched) using the API's own outstandingAmount and dueDate — `overdue` is 0 for a customer whose invoices carry no dueDate, which is honest given that field is frequently unset rather than a guess. `risk` is derived from the real overdue-to-outstanding ratio instead of a fabricated credit stage. */
export function adaptAc52ArCustomers(rows: Customer[], invoices: Invoice[]): Ac52ArCustomer[] {
  return rows.map((c) => {
    const custInvoices = invoices.filter((i) => i.customerId === c.id && i.status !== 'VOID')
    const outstanding = custInvoices.reduce((s, i) => s + (i.outstandingAmount !== undefined ? Number(i.outstandingAmount) || 0 : i.status === 'PAID' ? 0 : Number(i.totalAmount) || 0), 0)
    const overdue = custInvoices.reduce((s, i) => {
      const open = i.outstandingAmount !== undefined ? Number(i.outstandingAmount) || 0 : i.status === 'PAID' ? 0 : Number(i.totalAmount) || 0
      return open > 0 && i.dueDate && new Date(i.dueDate).getTime() < Date.now() ? s + open : s
    }, 0)
    const overdueRatio = outstanding > 0 ? overdue / outstanding : 0
    return {
      id: c.id,
      name: c.name,
      sector: 'General',
      outstanding,
      overdue,
      limit: 0,
      dso: 0,
      risk: overdueRatio > 0.5 ? 'Stage 3' : overdueRatio > 0 ? 'Stage 2' : 'Stage 1',
      owner: 'Finance team',
    }
  })
}

function claimStatusLabel(status: string): string {
  if (status === 'POSTED') return 'Approved'
  if (status === 'VOID') return 'Returned'
  return 'Review'
}

/**
 * Adapt live expenses into the v34 Expenses & Claims page's claims array. The backend's Expense
 * model is a general-ledger expense posting (vendor + category + journal) — there is no employee
 * T&E-claims domain (no employee/purpose/receipt-count/policy fields exist). `employee` uses the
 * record's real creator, resolved through a one-time users lookup, since that's the closest genuine
 * attribution available rather than mislabelling the vendor as the claimant. `receipts`/`policy`
 * reflect the real (usually absent) receiptNumber instead of inventing an evidence-review state.
 */
export function adaptAc52Claims(rows: Expense[], userNames: Map<string, string>): Ac52Claim[] {
  return rows.map((r) => ({
    id: r.id,
    employee: (r.createdById && userNames.get(r.createdById)) || 'Unassigned',
    purpose: r.description,
    submitted: (r.transactionDate || '').slice(0, 10),
    amount: Number(r.amount) || 0,
    receipts: r.receiptNumber ? 1 : 0,
    policy: r.receiptNumber ? 'Compliant' : 'Missing receipt',
    status: claimStatusLabel(r.status),
  }))
}

function vaultDocTypeLabel(mimeType: string | null): string {
  if (!mimeType) return 'File'
  if (mimeType === 'application/pdf') return 'PDF document'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document'
  return 'File'
}

/** Adapt live uploads into the Document Vault page's `documents` array. No classification/versioning/approval-workflow system exists in the backend for uploaded files (only list+upload, matching the FundDocument precedent it's copied from), so `class`/`versions`/`status` carry honest neutral defaults rather than an invented confidentiality tier or review state — `type` is derived from the real mimeType, `owner`/`modified` are real. */
export function adaptAc52VaultDocuments(rows: AccountingDocument[], userNames: Map<string, string>): Ac52VaultDocument[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    folder: r.category,
    type: vaultDocTypeLabel(r.mimeType),
    owner: (r.uploadedById && userNames.get(r.uploadedById)) || 'Unassigned',
    modified: (r.updatedAt || r.createdAt || '').slice(0, 10),
    class: 'Internal',
    versions: 1,
    status: 'Uploaded',
    content: '',
  }))
}

const TAX_PACK_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  COMPILING: 'Building',
  DRAFT_REVIEW: 'In review',
  SIGNED_OFF: 'Approved',
  FAILED: 'Draft',
}
const TAX_PACK_READINESS: Record<string, number> = {
  DRAFT: 25,
  COMPILING: 50,
  DRAFT_REVIEW: 75,
  SIGNED_OFF: 100,
  FAILED: 25,
}

/** Maps a real TaxReturnPack.taxRegime to the mock `compliancePacks` seed's own `type` strings (VAT/WHT/Income tax/Audit file), so the hydrate hook can tell which mock rows a real pack of the same type should replace. */
const TAX_REGIME_LABEL: Record<string, { type: string; name: string }> = {
  ZIMRA_CIT: { type: 'Income tax', name: 'Income Tax Pack' },
  ZIMRA_VAT: { type: 'VAT', name: 'VAT Return Pack' },
  ZIMRA_WHT: { type: 'WHT', name: 'Withholding Tax Schedule' },
  ZIMRA_SAFT: { type: 'Audit file', name: 'ZIMRA Audit Support File' },
}

/** Adapt real tax-return packs (Income Tax with a full CIT+CGT liability, VAT with a real computed net-payable figure, WHT/SAF-T as evidence-and-readiness tracking only — see backend TaxReturnPackCompileService for the regime split) into the Compliance & Tax page's `compliancePacks` shape. `readiness` is derived from the real compile/review/sign-off status rather than an invented completion score, and `exceptions` stays honest at 0 (not tracked at list-endpoint granularity) rather than guessing. */
export function adaptAc52TaxPacks(rows: TaxReturnPack[], userNames: Map<string, string>): Ac52TaxPack[] {
  return rows.map((r) => {
    const meta = TAX_REGIME_LABEL[r.taxRegime] || { type: 'Income tax', name: 'Tax Pack' }
    return {
      id: r.id,
      name: `${meta.name} · ${r.taxPeriod} ${r.taxYear}`,
      type: meta.type,
      period: `${r.taxPeriod} ${r.taxYear}`,
      status: TAX_PACK_STATUS_LABEL[r.status] || 'Draft',
      readiness: TAX_PACK_READINESS[r.status] ?? 25,
      exceptions: 0,
      owner: (r.compiledById && userNames.get(r.compiledById)) || (r.createdById && userNames.get(r.createdById)) || 'Unassigned',
      due: r.filingDueDate ? r.filingDueDate.slice(0, 10) : 'Not set',
    }
  })
}

const CLOSE_TASK_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETE: 'Complete',
}

function closeTaskPersonName(p: CloseTaskPerson | null): string {
  if (!p) return 'Unassigned'
  return `${p.firstName} ${p.lastName}`.trim() || p.email
}

/** Adapt real close-checklist tasks into the Period Close page's `closeTasks` array (dead-code target, kept for potential reuse — see adaptAc52CloseTasksV11 for the one that actually matters). */
export function adaptAc52CloseTasks(rows: AccountingCloseTask[]): Ac52CloseTask[] {
  return rows.map((r) => ({
    workstream: r.workstream,
    task: r.task,
    owner: closeTaskPersonName(r.owner),
    due: r.dueAt ? r.dueAt.slice(0, 10) : 'Not set',
    evidence: 0,
    status: CLOSE_TASK_STATUS_LABEL[r.status] || 'Not started',
    dependency: r.dependsOn ? r.dependsOn.task : 'None',
    backendId: r.id,
    fiscalPeriodId: r.fiscalPeriodId,
  }))
}

/** Adapt real close-checklist tasks into the V11 Period Close system's `C.tasks` shape — this is the one that actually renders live (home()/workstream()/taskPage(), confirmed empirically). Real id/workstream/name/owner/due/status/dependency; honest neutral defaults for the sub-checklist/evidence-count/priority fields no backend tracks. */
export function adaptAc52CloseTasksV11(rows: AccountingCloseTask[]): Ac52CloseTaskV11[] {
  return rows.map((r) => ({
    id: r.id,
    ws: r.workstream,
    name: r.task,
    owner: closeTaskPersonName(r.owner),
    due: r.dueAt ? r.dueAt.slice(0, 10) : 'Not set',
    status: CLOSE_TASK_STATUS_LABEL[r.status] || 'Not started',
    dependency: r.dependsOn ? r.dependsOn.task : 'None',
    evidence: 0,
    required: 1,
    checklist: [],
    priority: 'Medium',
    source: '',
    note: '',
    control: r.workstream,
  }))
}

const TIMESHEET_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  RETURNED: 'Returned',
}

/** UTC-midnight instant of the Monday starting the viewer's current LOCAL calendar week — used to bucket real timesheet entries onto the Command-tab weekly grid's fixed Mon-Fri columns. Represented in UTC (not local) because entry dates are DATE-only backend values serialized as UTC-midnight ISO strings; comparing local-midnight against those would shift by a day for any non-UTC viewer (confirmed live: this app's real users are UTC+2). */
function currentWeekMonday(now: Date = new Date()): Date {
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + diff))
}

/** UTC-midnight instant of the calendar date a DATE-only backend value represents, read via UTC getters so it isn't shifted by the viewer's local offset. */
function utcDateOnly(iso: string): number {
  const d = new Date(iso)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** Adapt real timesheets (each with 1+ project entries) into the runtime's flat `ts` array shape — one row per timesheet, aggregated across its entries. Real employee/hours/billable/status; `cost` stays honest 0 (no hourly-rate tracking exists) and `owner` ("Approver") stays 'Unassigned' for anything not yet approved. `days` sums each entry's hours onto whichever weekday of the CURRENT calendar week it falls on (entries outside that window aren't bucketed but still count toward `hours`/`billable`). */
export function adaptAc52Timesheets(rows: Timesheet[]): Ac52Timesheet[] {
  const monday = currentWeekMonday()
  return rows.map((r) => {
    const hours = r.entries.reduce((s, e) => s + (Number(e.hours) || 0), 0)
    const billable = r.entries.reduce((s, e) => s + (e.billable ? Number(e.hours) || 0 : 0), 0)
    const projectNames = [...new Set(r.entries.map((e) => e.project?.name).filter(Boolean))]
    const days = [0, 0, 0, 0, 0]
    for (const e of r.entries) {
      const offset = Math.round((utcDateOnly(e.date) - monday.getTime()) / 86400000)
      if (offset >= 0 && offset < 5) days[offset] += Number(e.hours) || 0
    }
    return {
      id: r.id,
      employee: `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email,
      project: projectNames.length === 1 ? projectNames[0] : projectNames.length > 1 ? 'Multiple projects' : 'Unassigned',
      client: r.entries[0]?.project?.clientName || '',
      hours,
      billable,
      cost: 0,
      status: TIMESHEET_STATUS_LABEL[r.status] || r.status,
      owner: 'Unassigned',
      days,
    }
  })
}

/** Adapt real projects into the runtime's `projects` array shape. No hourly-rate/billing-rate/WIP tracking exists on Project itself, so cost/revenue/wip carry honest 0 rather than invented commercial figures. hours/billable ARE real when `timesheets` is supplied — summed from that batch's entries (the only entry-level data this module fetches, i.e. currently-pending-approval timesheets, not an all-time total). */
export function adaptAc52Projects(rows: Project[], timesheets: Timesheet[] = []): Ac52Project[] {
  const byProject = new Map<string, { hours: number; billable: number }>()
  for (const t of timesheets) {
    for (const e of t.entries) {
      const cur = byProject.get(e.projectId) || { hours: 0, billable: 0 }
      cur.hours += Number(e.hours) || 0
      if (e.billable) cur.billable += Number(e.hours) || 0
      byProject.set(e.projectId, cur)
    }
  }
  return rows.map((r) => {
    const agg = byProject.get(r.id) || { hours: 0, billable: 0 }
    return {
      id: r.id,
      name: r.name,
      client: r.clientName || '',
      type: r.projectType || '',
      budget: Number(r.budget) || 0,
      hours: agg.hours,
      billable: agg.billable,
      cost: 0,
      revenue: 0,
      wip: 0,
      status: r.status === 'ACTIVE' ? 'On track' : r.status,
    }
  })
}

/** Adapt live inventory items into the v51 Inventory Accounting page's `inventory` array. No warehouse/category/physical-count system exists in the backend, so those carry honest neutral defaults rather than an invented location or variance. */
export function adaptAc52InventoryItems(rows: InventoryItem[]): Ac52InventoryItem[] {
  return rows.map((r) => {
    const qty = Number(r.quantityOnHand) || 0
    const unitCost = Number(r.costOfPurchase) || 0
    return {
      sku: r.skuNumber || r.id,
      item: r.itemName,
      category: 'General',
      warehouse: 'Main warehouse',
      qty,
      unitCost,
      value: qty * unitCost,
      countVar: 0,
      obsolete: 'No',
      status: r.isActive ? 'Controlled' : 'Review',
    }
  })
}

const DEPRECIATION_METHOD_LABEL: Record<string, string> = {
  STRAIGHT_LINE: 'Straight line',
  REDUCING_BALANCE: 'Reducing balance',
  UNITS_OF_PRODUCTION: 'Units of production',
}

const ASSET_STATUS_LABEL: Record<string, string> = {
  IN_USE: 'Active',
  DISPOSED: 'Disposed',
  UNDER_MAINTENANCE: 'Under maintenance',
}

/** Adapt live fixed assets into the v51 Fixed Assets page's `assets` array. `accum` (accumulated depreciation) is derived from real cost minus real book value rather than re-fetched, since the backend doesn't expose it as its own field. `custodian` has no backend field and defaults honestly to 'Unassigned'. */
export function adaptAc52FixedAssets(rows: Asset[]): Ac52FixedAsset[] {
  return rows.map((r) => {
    const cost = Number(r.cost) || 0
    const nbv = Number(r.currentBookValue) || 0
    return {
      id: r.id,
      desc: r.assetName,
      category: r.assetAccount?.accountName || 'Equipment',
      location: r.location || 'Unassigned',
      custodian: 'Unassigned',
      cost,
      accum: Math.max(0, cost - nbv),
      nbv,
      life: `${r.usefulLifeYears} years`,
      method: DEPRECIATION_METHOD_LABEL[r.depreciationMethod] || r.depreciationMethod,
      status: ASSET_STATUS_LABEL[r.status] || r.status || 'Active',
    }
  })
}

const STI_STATUS_LABEL: Record<string, string> = { ACTIVE: 'Active', SETTLED: 'Settled', VOIDED: 'Voided' }

/**
 * Adapt the live STI dashboard's instrument summaries into the v17 Short-Term Investments page's
 * `investments` array. Uses the dashboard endpoint (not the raw instrument list) because it returns
 * server-computed accruedInterest/carryingValue — recomputing day-count/compounding client-side
 * would risk getting the accrual math wrong. `type` and `limit` (concentration-limit check) have no
 * equivalent on this response shape, so they carry an honest '—' rather than a fabricated classification
 * or a false compliance claim.
 */
export function adaptAc52Investments(rows: DashboardInstrument[]): Ac52Investment[] {
  const now = Date.now()
  return rows.map((r) => ({
    id: r.instrumentId,
    issuer: r.broker,
    type: '—',
    currency: r.currencyCode,
    principal: Number(r.principal) || 0,
    rate: Number(r.apyAsOf) || 0,
    maturity: (r.maturityDate || '').slice(0, 10),
    days: Math.max(0, Math.ceil((new Date(r.maturityDate).getTime() - now) / 86400000)),
    carrying: Number(r.carryingValue) || 0,
    limit: '—',
    status: STI_STATUS_LABEL[r.status] || r.status,
  }))
}

/**
 * Adapt the real users and roles tables into the RBAC page's fixtures. The mock asserted MFA
 * enrolment ("Enforced") and last-active times ("2 min ago") for every user; neither is tracked
 * anywhere in this backend, so both report '—' rather than claiming a security control is in
 * force. The permission matrix is built from the keys roles genuinely hold, so it reflects
 * actual access rather than a hardcoded list of plausible-looking permission names.
 */
export function adaptAc52AccessData(users: AppUser[], roles: AppRole[]): Ac52AccessData {
  const rolePermissions: Record<string, string[]> = {}
  const keySet = new Set<string>()
  for (const r of roles) {
    // `permissions` is typed `unknown` because the column is free-form JSON. In this database it
    // holds `{name, value}` objects (e.g. {name:'manage_accounting', value:true}), but plain
    // strings appear in some roles too, so both are accepted. A permission explicitly set to
    // false is a revocation, not a grant, so it is excluded rather than shown as held.
    const raw = Array.isArray(r.permissions) ? r.permissions : []
    const perms: string[] = []
    for (const p of raw) {
      if (typeof p === 'string') perms.push(p)
      else if (p && typeof p === 'object') {
        const o = p as { name?: unknown; value?: unknown }
        if (typeof o.name === 'string' && o.value !== false) perms.push(o.name)
      }
    }
    rolePermissions[r.name] = perms
    for (const p of perms) keySet.add(p)
  }
  // Accounting-relevant keys first so the matrix opens on what this module actually governs,
  // then everything else alphabetically. Capped because some roles carry very long lists and the
  // matrix is a fixed-width table.
  const permissionKeys = Array.from(keySet)
    .sort((a, b) => {
      const aa = /account|ledger|journal|payable|receivable|tax|payment|period/i.test(a) ? 0 : 1
      const bb = /account|ledger|journal|payable|receivable|tax|payment|period/i.test(b) ? 0 : 1
      return aa - bb || a.localeCompare(b)
    })
    .slice(0, 24)
  return {
    users: users.map((u) => {
      const dept = typeof u.department === 'string' ? u.department : u.department?.name
      return {
        name: `${u.firstName} ${u.lastName}`.trim() || u.email,
        email: u.email,
        role: u.role?.name || '—',
        scope: dept || '—',
        mfa: '—',
        last: u.lastSeen ? new Date(u.lastSeen).toLocaleString('en-GB') : '—',
        status: 'Active',
      }
    }),
    // Only roles that exist in the roles table — the mock listed ten invented job titles.
    // Ordered by how many of the displayed permission keys each role actually holds: the matrix
    // renders the first seven as columns, and an arbitrary slice of 59 roles showed seven that
    // hold no accounting permission at all, so every toggle read as off.
    roles: [...roles]
      .sort((a, b) => (rolePermissions[b.name]?.length || 0) - (rolePermissions[a.name]?.length || 0) || a.name.localeCompare(b.name))
      .map((r) => r.name),
    rolePermissions,
    permissionKeys,
  }
}

/**
 * Map an AuditLog action onto the runtime's `class` column, which drives the status pill.
 * The backend has no classification field, so this is derived from the action verb rather
 * than invented, and anything unrecognised falls back to the neutral 'Control' pill instead
 * of being guessed into a category it may not belong to.
 */
function auditEventClass(action: string): string {
  const a = (action || '').toUpperCase()
  if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('PERMISSION') || a.includes('DENIED')) return 'Security'
  if (a.includes('APPROVE') || a.includes('REJECT') || a.includes('SIGN')) return 'Approval'
  if (a.includes('CREATE') || a.includes('UPDATE') || a.includes('DELETE') || a.includes('POST') || a.includes('VOID')) return 'Change'
  if (a.includes('EXPORT') || a.includes('SYNC') || a.includes('IMPORT')) return 'Integration'
  return 'Control'
}

/**
 * Build the detail cell. The backend stores structured oldValues/newValues rather than the
 * prose sentence the mock showed, so summarise which fields actually changed instead of
 * dumping JSON into a table cell. With nothing structured recorded, name the entity acted
 * on — that is what is genuinely known — rather than narrating an event.
 */
function auditEventDetail(row: AuditLogRow): string {
  const oldV = row.oldValues && typeof row.oldValues === 'object' ? (row.oldValues as Record<string, unknown>) : null
  const newV = row.newValues && typeof row.newValues === 'object' ? (row.newValues as Record<string, unknown>) : null
  if (newV) {
    const changed = Object.keys(newV).filter((k) => !oldV || JSON.stringify(oldV[k]) !== JSON.stringify(newV[k]))
    if (changed.length) {
      return `Changed ${changed.slice(0, 4).join(', ')}${changed.length > 4 ? ` +${changed.length - 4} more` : ''}`
    }
  }
  const entity = [row.entityType, row.entityId].filter(Boolean).join(' ')
  return entity ? `${row.action} on ${entity}` : row.action
}

/**
 * Adapt real AuditLog rows into the runtime's `auditLog` array — used by auditPage() (the
 * standalone Immutable Audit Trail page) and by settings17()'s 'audit' tab, which both read
 * the same array. AuditLog stores only adminId, so `role` is resolved via the users lookup;
 * a service-originated row with no admin reports 'System'/'Service' and its real absence of
 * a client IP, rather than borrowing a person's name or showing a fabricated host address.
 */
export function adaptAc52AuditEvents(rows: AuditLogRow[], userRoles: Map<string, string>): Ac52AuditEvent[] {
  return rows.map((r) => {
    const name = r.admin ? `${r.admin.firstName} ${r.admin.lastName}`.trim() : ''
    const ts = new Date(r.timestamp)
    return {
      time: Number.isNaN(ts.getTime())
        ? '—'
        : ts.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
      event: r.action,
      record: r.entityId || r.entityType || '—',
      user: name || 'System',
      role: (r.adminId && userRoles.get(r.adminId)) || (name ? '—' : 'Service'),
      ip: r.ipAddress || 'service',
      detail: auditEventDetail(r),
      class: auditEventClass(r.action),
    }
  })
}
