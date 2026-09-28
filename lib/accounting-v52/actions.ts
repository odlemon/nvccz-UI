import { chartOfAccountsApi, type ChartOfAccount } from '@/lib/api/chart-of-accounts-api'
import { uploadAccountingDocument } from '@/lib/api/accounting-documents-api'
import { updateCloseTaskStatus } from '@/lib/api/accounting-close-tasks-api'
import { approveTimesheet, returnTimesheet } from '@/lib/api/timesheets-api'
import { createTaxReturnPack, compileTaxReturnPack, getForecastEntities } from '@/lib/api/tax-return-pack-api'
import { accountingApi } from '@/lib/api/accounting-api'
import { cashbookApi } from '@/lib/api/cashbook-api'
import { reconciliationApi } from '@/lib/api/reconciliation-api'
import { approveApprovalRequest, rejectApprovalRequest } from '@/lib/api/approvals-api'
import { payProcurementInvoice } from '@/lib/api/procurement-v23-api'
import { ac52AccountTypeToBackend, ac52FinancialStatementForType } from './adapters'

export type Ac52ActionResult = {
  handled: boolean
  error?: string
  message?: string
}

type CoaSavePayload = {
  /** Original account code, or '' when creating a new account. */
  original?: string
  code: string
  name: string
  type: string
  natural?: string
  posting?: boolean
  control?: boolean
  active?: boolean
  financialStatement?: string
  /** Real backend id for the account being edited, resolved by the host from its live cache. */
  backendId?: string
}

async function handleCoaSave(payload: CoaSavePayload): Promise<Ac52ActionResult> {
  const backendType = ac52AccountTypeToBackend(payload.type)
  const financialStatement = payload.financialStatement || ac52FinancialStatementForType(backendType)

  if (payload.original && payload.backendId) {
    await chartOfAccountsApi.updateChartOfAccount(payload.backendId, {
      accountNo: payload.code,
      accountName: payload.name,
      accountType: backendType,
      financialStatement,
      isActive: payload.active,
    })
    return { handled: true, message: `${payload.code} updated in the live Chart of Accounts.` }
  }

  await chartOfAccountsApi.createChartOfAccount({
    accountNo: payload.code,
    accountName: payload.name,
    accountType: backendType,
    financialStatement,
    isActive: payload.active ?? true,
  })
  return { handled: true, message: `${payload.code} created in the live Chart of Accounts.` }
}

type UploadDocumentPayload = {
  file: File
  category: string
}

async function handleUploadDocument(payload: UploadDocumentPayload): Promise<Ac52ActionResult> {
  const res = await uploadAccountingDocument(payload.file, payload.category)
  return { handled: true, message: `${res.data.name} uploaded to ${res.data.category}.` }
}

type CloseTaskCompletePayload = { taskId: string }

async function handleCloseTaskComplete(payload: CloseTaskCompletePayload): Promise<Ac52ActionResult> {
  const res = await updateCloseTaskStatus(payload.taskId, 'COMPLETE')
  return { handled: true, message: `${res.data.task} marked complete.` }
}

type TimesheetIdPayload = { id: string }

async function handleTimesheetApprove(payload: TimesheetIdPayload): Promise<Ac52ActionResult> {
  // approve/return return the raw Timesheet row without the `user` relation
  // (unlike the pending-approval/mine list endpoints) — don't assume it's present.
  await approveTimesheet(payload.id)
  return { handled: true, message: 'Timesheet approved.' }
}

async function handleTimesheetReturn(payload: TimesheetIdPayload): Promise<Ac52ActionResult> {
  await returnTimesheet(payload.id)
  return { handled: true, message: 'Timesheet returned to the employee.' }
}

type CreateTaxPackPayload = {
  taxRegime: 'ZIMRA_CIT' | 'ZIMRA_VAT' | 'ZIMRA_WHT' | 'ZIMRA_SAFT'
  taxYear: number
  taxPeriod: 'ANNUAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
}

async function handleCreateTaxPack(payload: CreateTaxPackPayload): Promise<Ac52ActionResult> {
  const entitiesRes = await getForecastEntities()
  const entities = entitiesRes.data || []
  const entity = entities.find((e) => e.isDefault && e.isActive) || entities.find((e) => e.isActive) || entities[0]
  if (!entity) return { handled: true, error: 'No forecast entity exists yet to provision a tax pack against.' }
  const created = await createTaxReturnPack({
    forecastEntityId: entity.id,
    taxYear: payload.taxYear,
    taxPeriod: payload.taxPeriod,
    taxRegime: payload.taxRegime,
  })
  // Compile immediately so the pack shows real reconciliation/liability data
  // rather than sitting in DRAFT with nothing computed yet.
  await compileTaxReturnPack(created.data.id)
  return { handled: true, message: `${payload.taxRegime.replace('ZIMRA_', '')} pack for ${payload.taxPeriod} ${payload.taxYear} created and compiled.` }
}

type ApprovalDecisionPayload = {
  backendKind: 'journal' | 'approval'
  backendId: string
  decision: 'approve' | 'reject'
  comments?: string
}

/**
 * The Approval Centre queue merges two genuinely different real backends into one list:
 * pending journal entries (no ApprovalRequest/Approval row exists for these — approving
 * means posting the journal directly) and everything else (Master Data / Payment /
 * Investment), which IS backed by a real Approval row and goes through the generic
 * /approvals/:id/approve|reject endpoints. backendKind (set by the adapters) says which.
 */
type JournalSubmitLine = { account: string; debit: number; credit: number; description: string }
type JournalSubmitPayload = {
  date: string
  reference: string
  description: string
  currency: string
  isEliminationEntry?: boolean
  lines: JournalSubmitLine[]
}

/** The manual Journal Entry builder ("Journal Entry Maker–Checker") previously only mutated local mock state (S.journals via postJournal8) — it never called the real backend. Resolves account codes/currency code to real ids, then posts through the same endpoint the rest of the module already reads from. */
async function handleJournalSubmit(payload: JournalSubmitPayload): Promise<Ac52ActionResult> {
  const [accounts, currenciesRes] = await Promise.all([
    chartOfAccountsApi.getChartOfAccounts(),
    accountingApi.getCurrencies(),
  ])
  const coaByCode = new Map((accounts as ChartOfAccount[]).map((a) => [a.accountNo, a.id]))
  const currency = (currenciesRes.data || []).find((c) => c.code === payload.currency)
  if (!currency) return { handled: true, error: `Currency ${payload.currency} is not configured in the Chart of Currencies.` }

  const journalEntryLines = payload.lines
    .filter((l) => l.account && (l.debit || l.credit))
    .map((l) => {
      const chartOfAccountId = coaByCode.get(l.account)
      if (!chartOfAccountId) throw new Error(`Account ${l.account} was not found in the live Chart of Accounts.`)
      return {
        chartOfAccountId,
        debitAmount: l.debit || 0,
        creditAmount: l.credit || 0,
        description: l.description || payload.description,
      }
    })
  if (journalEntryLines.length < 2) return { handled: true, error: 'A journal needs at least 2 lines with an account and an amount.' }

  await accountingApi.createJournalEntry({
    transactionDate: payload.date,
    referenceNumber: payload.reference,
    description: payload.description,
    currencyId: currency.id,
    journalEntryLines,
    isEliminationEntry: !!payload.isEliminationEntry,
  })
  return { handled: true, message: `${payload.reference} is balanced and routed to an independent checker.` }
}

async function handleApprovalDecision(payload: ApprovalDecisionPayload): Promise<Ac52ActionResult> {
  if (payload.backendKind === 'journal') {
    if (payload.decision === 'approve') await accountingApi.postJournalEntry(payload.backendId)
    else await accountingApi.voidJournalEntry(payload.backendId)
    return { handled: true, message: payload.decision === 'approve' ? 'Journal posted.' : 'Journal voided and returned.' }
  }
  if (payload.decision === 'approve') await approveApprovalRequest(payload.backendId, payload.comments)
  else await rejectApprovalRequest(payload.backendId, payload.comments)
  return { handled: true, message: payload.decision === 'approve' ? 'Approved and applied.' : 'Returned to the maker.' }
}

type ApPayBillPayload = {
  source?: 'procurement' | 'accounting'
  recordId?: string
  billId: string
  vendor?: string
  bankId: string
  bankName?: string
  date: string
  reference?: string
  amount: number
  file?: File | null
}

const cents = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * Pay a supplier bill from Payables (SRD Procurement §3: approved invoices are paid from Accounts Payable, and the
 * payment updates procurement). A procurement invoice is paid through procurement's payment endpoint, which posts the
 * journal and cashbook entry, keeps the proof of payment and marks the invoice paid; a bill captured in Accounting is
 * paid through its own endpoint, which may send a large payment to the CFO first.
 */
async function handleApPayBill(p: ApPayBillPayload): Promise<Ac52ActionResult> {
  if (!p.recordId || !p.source) return { handled: true, error: `${p.billId} is no longer in the register. Refresh and try again.` }
  if (!p.bankId) return { handled: true, error: 'Choose the account the payment is made from.' }
  if (!p.date) return { handled: true, error: 'Enter the payment date.' }
  if (p.source === 'procurement') {
    if (!(p.file instanceof File)) {
      return { handled: true, error: 'Attach the proof of payment: a procurement invoice is paid with its bank evidence.' }
    }
    const form = new FormData()
    form.append('paymentAmount', String(p.amount))
    form.append('paymentDate', p.date)
    form.append('paymentMethod', 'BANK')
    form.append('bankAccountId', p.bankId)
    if (p.reference) form.append('paymentReference', p.reference)
    form.append('proofOfPayment', p.file)
    await payProcurementInvoice(p.recordId, form)
    return {
      handled: true,
      message: `${p.billId} paid ${cents(p.amount)} to ${p.vendor ?? 'the vendor'}. The journal and cashbook entry are posted, and procurement shows the invoice paid.`,
    }
  }
  const res: any = await accountingApi.payPurchaseInvoice(p.recordId, {
    paymentMethod: 'BANK',
    bankId: p.bankId,
    paymentDate: p.date,
    paymentReference: p.reference || undefined,
  } as any)
  if (res?.data?.status === 'pending_approval') {
    return { handled: true, message: `${p.billId}: the payment is above the approval threshold and was sent to the CFO. It is posted once approved.` }
  }
  return { handled: true, message: `${p.billId} paid ${cents(p.amount)} to ${p.vendor ?? 'the vendor'}. The journal and cashbook entry are posted.` }
}

type InvoiceCreatePayload = {
  customerId: string
  date: string
  due?: string
  currency: string
  net: number
  vatRate?: number
  description?: string
  project?: string
}

/** Customer invoice from Receivables "New invoice" (v8 modal) — previously only mutated local mock S.invoices. */
async function handleInvoiceCreate(p: InvoiceCreatePayload): Promise<Ac52ActionResult> {
  if (!p.customerId) return { handled: true, error: 'Select a customer.' }
  const net = Number(p.net) || 0
  if (net <= 0) return { handled: true, error: 'Enter a positive net amount.' }
  const currenciesRes = await accountingApi.getCurrencies()
  const currency = (currenciesRes.data || []).find((c) => c.code === (p.currency || 'USD'))
  if (!currency) return { handled: true, error: `Currency ${p.currency || 'USD'} is not configured.` }
  const isTaxable = Number(p.vatRate || 0) > 0
  const description = (p.description || 'Customer invoice').trim()
  const created = await accountingApi.createInvoice({
    customerId: p.customerId,
    amount: net,
    currencyId: currency.id,
    invoiceDate: p.date || new Date().toISOString().slice(0, 10),
    transactionDate: p.date || new Date().toISOString().slice(0, 10),
    description,
    isTaxable,
    items: [{ description, quantity: 1, unitPrice: net, amount: net, taxRate: isTaxable ? Number(p.vatRate) * 100 : 0 }],
  })
  let inv = created.data
  // Prefer SENT so receipts can mark-as-paid; some roles cannot post the send journal — keep the create either way.
  if (inv?.id && inv.status === 'DRAFT') {
    try {
      const sent = await accountingApi.sendInvoice(inv.id)
      inv = sent.data || inv
    } catch (err: any) {
      return {
        handled: true,
        message: `${inv?.invoiceNumber || 'Invoice'} created as draft${inv?.journalEntry?.referenceNumber ? ` · journal ${inv.journalEntry.referenceNumber}` : ''}. Send for collection needs ledger-post authority: ${err?.message || 'send failed'}.`,
      }
    }
  }
  return {
    handled: true,
    message: `${inv?.invoiceNumber || 'Invoice'} created${inv?.journalEntry?.referenceNumber ? ` · journal ${inv.journalEntry.referenceNumber}` : ''}${inv?.status === 'SENT' ? ' and sent' : ''}.`,
  }
}

type CustomerCreatePayload = {
  name: string
  email?: string
  phone?: string
  taxNumber?: string
}

/** Receivables "Create customer" — master data for invoices / receipts. */
async function handleCustomerCreate(p: CustomerCreatePayload): Promise<Ac52ActionResult> {
  const name = (p.name || '').trim()
  if (!name) return { handled: true, error: 'Enter the customer name.' }
  const created = await accountingApi.createCustomer({
    name,
    email: p.email || undefined,
    phone: p.phone || undefined,
    taxNumber: p.taxNumber || undefined,
    isActive: true,
  })
  const c = created.data
  return { handled: true, message: `${c?.name || name} was added to the customer register.` }
}

type CashPostPayload = {
  kind: 'receipt' | 'payment' | 'transfer'
  bankId: string
  targetBankId?: string
  currency?: string
  account?: string
  vatRate?: number
  date: string
  reference?: string
  amount: number
  project?: string
  description?: string
  counterparty?: string
}

/** Cashbook receipt / payment / transfer from Cash "New receipt|payment|transfer" — previously only mutated local mock S.cashbook. */
async function handleCashPost(p: CashPostPayload): Promise<Ac52ActionResult> {
  const amount = Number(p.amount) || 0
  if (!p.bankId) return { handled: true, error: 'Select a cashbook / bank.' }
  if (amount <= 0) return { handled: true, error: 'Enter a positive amount.' }
  const date = p.date || new Date().toISOString().slice(0, 10)
  const description = (p.description || `${p.kind} cashbook entry`).trim()
  const reference = p.reference || `${(p.kind || 'cash').toUpperCase()}-${Date.now().toString().slice(-6)}`
  const vatCode = Number(p.vatRate || 0) > 0 ? '15%' : '0%'

  if (p.kind === 'transfer') {
    if (!p.targetBankId || p.targetBankId === p.bankId) {
      return { handled: true, error: 'Select a different destination bank for the transfer.' }
    }
    await cashbookApi.createCashbookTransfer({
      fromBankId: p.bankId,
      toBankId: p.targetBankId,
      amount,
      transferDate: date,
      description,
      reference,
      projectCode: p.project || undefined,
    })
    return { handled: true, message: `${reference} transferred ${cents(amount)} between cashbooks.` }
  }

  if (!p.account) return { handled: true, error: 'Select the contra GL account.' }
  const accounts = (await chartOfAccountsApi.getChartOfAccounts()) as ChartOfAccount[]
  const gl = accounts.find((a) => a.accountNo === p.account)
  if (!gl) return { handled: true, error: `Account ${p.account} was not found in the live Chart of Accounts.` }

  const body = {
    bankId: p.bankId,
    transactionDate: date,
    description,
    amount,
    reference,
    counterpartyType: 'GL' as const,
    glAccountId: gl.id,
    vatCode,
    projectCode: p.project || undefined,
  }
  if (p.kind === 'payment') {
    await cashbookApi.createCashbookPayment(body)
    return { handled: true, message: `${reference} payment of ${cents(amount)} posted to the cashbook.` }
  }
  await cashbookApi.createCashbookReceipt(body)
  return { handled: true, message: `${reference} receipt of ${cents(amount)} posted to the cashbook.` }
}

type ReceiptPostPayload = {
  invoiceId: string
  bankId: string
  date: string
  reference?: string
  amount: number
}

/**
 * Allocate a customer receipt against an open invoice. Posts cashbook receipt, then matches open items
 * when possible; full clear still falls through to mark-as-paid.
 */
async function handleReceiptPost(p: ReceiptPostPayload): Promise<Ac52ActionResult> {
  if (!p.invoiceId) return { handled: true, error: 'Select an invoice to allocate against.' }
  if (!p.bankId) return { handled: true, error: 'Select the receiving bank.' }
  const amount = Number(p.amount) || 0
  if (amount <= 0) return { handled: true, error: 'Enter a positive allocation amount.' }
  const invRes = await accountingApi.getInvoiceById(p.invoiceId)
  let inv = invRes.data
  if (!inv) return { handled: true, error: 'Invoice was not found.' }
  const outstanding =
    inv.outstandingAmount !== undefined && inv.outstandingAmount !== null
      ? Number(inv.outstandingAmount)
      : Number((inv as any).totalAmount) || Number((inv as any).total) || 0
  if (amount > outstanding + 0.01) {
    return { handled: true, error: `Amount exceeds the outstanding balance of ${cents(outstanding)}.` }
  }
  const date = p.date || new Date().toISOString().slice(0, 10)
  const reference = p.reference || `RCPT-${Date.now().toString().slice(-6)}`
  const receiptRes = await cashbookApi.createCashbookReceipt({
    bankId: p.bankId,
    transactionDate: date,
    description: `Receipt · ${inv.invoiceNumber || inv.id}`,
    amount,
    reference,
    counterpartyType: 'CUSTOMER',
    customerId: inv.customerId,
    vatCode: 'EXEMPT',
  })
  const entryId = receiptRes?.data?.id || (receiptRes as any)?.data?.entry?.id
  const invoiceNumber = inv.invoiceNumber || p.invoiceId
  const customerId = inv.customerId
  if (entryId && customerId) {
    try {
      const openRes = await cashbookApi.getOpenItemsForCustomer(customerId)
      const openItems = Array.isArray(openRes?.data) ? openRes.data : []
      const match =
        openItems.find((o) => o.id === p.invoiceId) ||
        openItems.find((o) => o.invoiceNumber === inv!.invoiceNumber) ||
        openItems.find((o) => String((o as any).invoiceId || '') === p.invoiceId)
      if (match) {
        await cashbookApi.matchOpenItems(entryId, [
          {
            openItemId: match.id,
            allocatedAmount: amount,
            discountAmount: 0,
            description: reference,
          },
        ])
        return {
          handled: true,
          message: `${cents(amount)} allocated to ${invoiceNumber}${amount < outstanding - 0.01 ? ' (partial)' : ''}.`,
        }
      }
    } catch {
      // Fall through to mark-as-paid when open-item match is unavailable.
    }
  }
  // The receipt is posted (Dr bank, Cr receivables). It is never followed by "mark as paid": that posted a second credit
  // to receivables for the same money. An unmatched receipt is allocated from the Receivables page.
  return {
    handled: true,
    message: `${cents(amount)} receipt posted for ${invoiceNumber}; allocate it to the invoice on the Receivables page (the automatic allocation did not apply).`,
  }
}

const FALLBACK_EXPENSE_CATEGORIES = [
  'Salaries and Wages',
  'Travel and Accommodation',
  'Operations',
  'Branding and Marketing',
  'Office Equipment',
]

type ExpenseCreatePayload = {
  vendorId: string
  categoryId?: string
  category?: string
  amount: number
  currency?: string
  transactionDate: string
  description: string
}

async function handleExpenseCreate(p: ExpenseCreatePayload): Promise<Ac52ActionResult> {
  if (!p.vendorId) return { handled: true, error: 'Select a vendor / supplier for the expense.' }
  const amount = Number(p.amount) || 0
  if (amount <= 0) return { handled: true, error: 'Enter a positive amount.' }
  const description = (p.description || '').trim()
  if (!description) return { handled: true, error: 'Enter a description / business purpose.' }
  const currenciesRes = await accountingApi.getCurrencies()
  const currency = (currenciesRes.data || []).find((c) => c.code === (p.currency || 'USD'))
  if (!currency) return { handled: true, error: `Currency ${p.currency || 'USD'} is not configured.` }
  const category = (p.category || '').trim() || FALLBACK_EXPENSE_CATEGORIES[2]
  const body: any = {
    vendorId: p.vendorId,
    amount,
    currencyId: currency.id,
    transactionDate: p.transactionDate || new Date().toISOString().slice(0, 10),
    description,
  }
  if (p.categoryId) body.categoryId = p.categoryId
  else body.category = category
  const created = await accountingApi.createExpense(body)
  const exp = created.data as any
  return {
    handled: true,
    message: `${exp?.expenseNumber || 'Expense'} recorded${exp?.journalEntry?.referenceNumber ? ` · ${exp.journalEntry.referenceNumber}` : ''}.`,
  }
}

type StockAdjustPayload = {
  kind: 'receipt' | 'issue' | 'adjust' | 'count' | 'transfer'
  itemId: string
  quantity: number
  reason?: string
  reference?: string
  notes?: string
  unitCost?: number
}

async function handleStockAdjust(p: StockAdjustPayload): Promise<Ac52ActionResult> {
  if (!p.itemId) return { handled: true, error: 'Select an inventory item.' }
  const qty = Number(p.quantity)
  if (!qty || Number.isNaN(qty)) return { handled: true, error: 'Enter a non-zero quantity.' }
  if (p.kind === 'transfer') {
    return { handled: true, error: 'Stock transfer between warehouses is not available on the live inventory API yet.' }
  }
  const reason = (p.reason || p.notes || `${p.kind} stock movement`).trim()
  if (p.kind === 'adjust' || p.kind === 'count') {
    await accountingApi.createStockAdjustment({ itemId: p.itemId, quantity: qty, reason })
    return { handled: true, message: `Stock adjustment of ${qty} posted for the selected item.` }
  }
  const movementType = p.kind === 'issue' ? 'OUT' : 'IN'
  await accountingApi.createStockMovement({
    itemId: p.itemId,
    movementType,
    quantity: Math.abs(qty),
    unitCost: p.unitCost,
    referenceNumber: p.reference,
    notes: reason,
  })
  return {
    handled: true,
    message: `${movementType === 'IN' ? 'Receipt' : 'Issue'} of ${Math.abs(qty)} posted to inventory.`,
  }
}

type AssetCreatePayload = {
  assetName: string
  assetCode?: string
  cost: number
  usefulLifeYears?: number
  depreciationMethod?: string
  purchaseDate?: string
  location?: string
  vendor?: string
  description?: string
  assetAccountCode?: string
  accumAccountCode?: string
  expenseAccountCode?: string
}

async function handleAssetCreate(p: AssetCreatePayload): Promise<Ac52ActionResult> {
  const assetName = (p.assetName || '').trim()
  if (!assetName) return { handled: true, error: 'Enter the asset description / name.' }
  const cost = Number(p.cost) || 0
  if (cost <= 0) return { handled: true, error: 'Enter a positive acquisition cost.' }
  const accounts = (await chartOfAccountsApi.getChartOfAccounts()) as ChartOfAccount[]
  const byCode = (code?: string) => {
    if (!code) return undefined
    const codeOnly = code.split('·')[0].trim()
    return accounts.find((a) => a.accountNo === codeOnly || a.accountNo === code)
  }
  const assetGl =
    byCode(p.assetAccountCode) ||
    accounts.find((a) => /fixed|ppe|property|equipment|vehicle|computer/i.test(`${a.accountName} ${a.accountNo}`)) ||
    accounts.find((a) => a.accountType === 'ASSET')
  const accumGl =
    byCode(p.accumAccountCode) ||
    accounts.find((a) => /accumulat.*deprec/i.test(a.accountName)) ||
    accounts.find((a) => a.accountNo.startsWith('16') && a.id !== assetGl?.id)
  const expenseGl =
    byCode(p.expenseAccountCode) ||
    accounts.find((a) => /depreciation expense/i.test(a.accountName)) ||
    accounts.find((a) => /depreciation/i.test(a.accountName) && a.accountType === 'EXPENSE')
  if (!assetGl || !accumGl || !expenseGl) {
    return {
      handled: true,
      error: 'Chart of Accounts is missing fixed-asset, accumulated depreciation, or depreciation expense accounts.',
    }
  }
  const methodRaw = (p.depreciationMethod || 'Straight line').toLowerCase()
  const depreciationMethod = methodRaw.includes('reduc') || methodRaw.includes('diminish')
    ? 'DIMINISHING_BALANCE'
    : 'STRAIGHT_LINE'
  const life = Number(String(p.usefulLifeYears || '5').replace(/[^\d]/g, '')) || 5
  const assetCode = (p.assetCode || `FA-${Date.now().toString().slice(-6)}`).trim()
  const created = await accountingApi.createAsset({
    assetName,
    assetCode,
    description: (p.description || assetName).trim(),
    cost,
    usefulLifeYears: life,
    depreciationMethod,
    assetAccountId: assetGl.id,
    accumulatedDepreciationAccountId: accumGl.id,
    depreciationExpenseAccountId: expenseGl.id,
    purchaseDate: p.purchaseDate || new Date().toISOString().slice(0, 10),
    location: p.location || undefined,
    vendor: p.vendor || undefined,
  })
  const a = created.data
  return { handled: true, message: `${a?.assetCode || assetCode} · ${a?.assetName || assetName} added to the fixed asset register.` }
}

type RecurringRunPayload = { id?: string; asOf?: string }

async function handleRecurringRun(p: RecurringRunPayload): Promise<Ac52ActionResult> {
  if (!p.id) return { handled: true, error: 'Select a recurring schedule to run.' }
  const res = await accountingApi.runRecurringJournalTemplate(p.id, p.asOf)
  const out = res.data
  if (out?.skipped) {
    return { handled: true, message: `Schedule skipped${out.reason ? `: ${out.reason}` : '.'}` }
  }
  return {
    handled: true,
    message: `Recurring journal posted${out?.referenceNumber ? ` · ${out.referenceNumber}` : out?.journalEntryId ? ` · ${out.journalEntryId}` : ''}.`,
  }
}

async function handleRecurringRunDue(p: RecurringRunPayload): Promise<Ac52ActionResult> {
  const res = await accountingApi.runDueRecurringJournalTemplates(p.asOf)
  const posted = res.data?.posted || []
  const ok = posted.filter((x) => !x.skipped && !x.error).length
  const skipped = posted.filter((x) => x.skipped || x.error).length
  return {
    handled: true,
    message: `Due schedules processed: ${ok} posted${skipped ? `, ${skipped} skipped` : ''}.`,
  }
}

type ReconSignoffPayload = {
  bankId: string
  statementEndBalance: number
  statementDate?: string
  reference?: string
}

async function handleReconSignoff(p: ReconSignoffPayload): Promise<Ac52ActionResult> {
  if (!p.bankId) return { handled: true, error: 'Select a cashbook / bank to sign off.' }
  const asOf = p.statementDate || new Date().toISOString().slice(0, 10)
  const statementEndBalance = Number(p.statementEndBalance)
  if (Number.isNaN(statementEndBalance)) {
    return { handled: true, error: 'Statement closing balance is required to finish reconciliation.' }
  }
  const entriesRes = await reconciliationApi.getReconciliationEntries(p.bankId, asOf)
  const entries = Array.isArray(entriesRes?.data) ? entriesRes.data : []
  const selectedEntryIds = entries.filter((e) => !e.isReconciled).map((e) => e.id)
  const sessionRes = await reconciliationApi.createDraftSession(p.bankId, {
    statementDate: asOf,
    statementEndBalance,
    reference: p.reference || `REC-${asOf}`,
    selectedEntryIds,
  })
  const session = sessionRes.data
  if (!session?.id) return { handled: true, error: 'Could not create a reconciliation session.' }
  try {
    await reconciliationApi.finishSession(session.id)
  } catch (err: any) {
    await reconciliationApi.discardSession(session.id).catch(() => undefined)
    return { handled: true, error: err?.message || 'Reconciliation could not be signed off (difference or open lines remain).' }
  }
  return {
    handled: true,
    message: `Bank reconciliation signed off for ${asOf} (${selectedEntryIds.length} cashbook line(s) cleared).`,
  }
}

export async function handleAccountingV52Action(detail: {
  action: string
  payload: Record<string, unknown>
}): Promise<Ac52ActionResult> {
  try {
    switch (detail.action) {
      case 'coa-save':
        return await handleCoaSave(detail.payload as CoaSavePayload)
      case 'upload-document':
        return await handleUploadDocument(detail.payload as unknown as UploadDocumentPayload)
      case 'close-task-complete':
        return await handleCloseTaskComplete(detail.payload as unknown as CloseTaskCompletePayload)
      case 'timesheet-approve':
        return await handleTimesheetApprove(detail.payload as unknown as TimesheetIdPayload)
      case 'timesheet-return':
        return await handleTimesheetReturn(detail.payload as unknown as TimesheetIdPayload)
      case 'create-tax-pack':
        return await handleCreateTaxPack(detail.payload as unknown as CreateTaxPackPayload)
      case 'approval-decision':
        return await handleApprovalDecision(detail.payload as unknown as ApprovalDecisionPayload)
      case 'journal-submit':
        return await handleJournalSubmit(detail.payload as unknown as JournalSubmitPayload)
      case 'ap-pay-bill':
        return await handleApPayBill(detail.payload as unknown as ApPayBillPayload)
      case 'invoice-create':
        return await handleInvoiceCreate(detail.payload as unknown as InvoiceCreatePayload)
      case 'customer-create':
        return await handleCustomerCreate(detail.payload as unknown as CustomerCreatePayload)
      case 'cash-post':
        return await handleCashPost(detail.payload as unknown as CashPostPayload)
      case 'receipt-post':
        return await handleReceiptPost(detail.payload as unknown as ReceiptPostPayload)
      case 'expense-create':
        return await handleExpenseCreate(detail.payload as unknown as ExpenseCreatePayload)
      case 'stock-adjust':
        return await handleStockAdjust(detail.payload as unknown as StockAdjustPayload)
      case 'asset-create':
        return await handleAssetCreate(detail.payload as unknown as AssetCreatePayload)
      case 'recurring-run':
        return await handleRecurringRun(detail.payload as unknown as RecurringRunPayload)
      case 'recurring-run-due':
        return await handleRecurringRunDue(detail.payload as unknown as RecurringRunPayload)
      case 'recon-signoff':
        return await handleReconSignoff(detail.payload as unknown as ReconSignoffPayload)
      default:
        return { handled: false }
    }
  } catch (err: any) {
    return { handled: true, error: err?.message || 'Request failed' }
  }
}
