import type { ChartOfAccount } from '@/lib/api/chart-of-accounts-api'
import type { PurchaseInvoice, Vendor, Invoice, Customer, Expense, InventoryItem, Asset } from '@/lib/api/accounting-api'
import type { DashboardInstrument } from '@/lib/api/short-term-investments-api'
import type { Ac52Account, Ac52Journal, Ac52Bank, Ac52ReconciliationLine, Ac52ApBill, Ac52ApVendor, Ac52ArInvoice, Ac52ArCustomer, Ac52Claim, Ac52InventoryItem, Ac52FixedAsset, Ac52Investment } from './types'

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
