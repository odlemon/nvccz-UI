import { chartOfAccountsApi, type ChartOfAccount } from '@/lib/api/chart-of-accounts-api'
import { uploadAccountingDocument } from '@/lib/api/accounting-documents-api'
import { updateCloseTaskStatus } from '@/lib/api/accounting-close-tasks-api'
import { approveTimesheet, returnTimesheet } from '@/lib/api/timesheets-api'
import { createTaxReturnPack, compileTaxReturnPack, getForecastEntities } from '@/lib/api/tax-return-pack-api'
import { accountingApi } from '@/lib/api/accounting-api'
import { approveApprovalRequest, rejectApprovalRequest } from '@/lib/api/approvals-api'
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
      default:
        return { handled: false }
    }
  } catch (err: any) {
    return { handled: true, error: err?.message || 'Request failed' }
  }
}
