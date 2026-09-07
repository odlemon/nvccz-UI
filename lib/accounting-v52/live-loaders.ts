import { chartOfAccountsApi } from '@/lib/api/chart-of-accounts-api'
import { accountingApi } from '@/lib/api/accounting-api'
import { cashbookApi } from '@/lib/api/cashbook-api'
import { usersApi } from '@/lib/api/users-api'
import { getSTIDashboard } from '@/lib/api/short-term-investments-api'
import { getAccountingDocuments } from '@/lib/api/accounting-documents-api'
import { getTaxReturnPacks } from '@/lib/api/tax-return-pack-api'
import { getConsolidationSummary } from '@/lib/api/consolidation-api'
import { getFiscalCalendar, getCloseTasks, type FiscalPeriod } from '@/lib/api/accounting-close-tasks-api'
import { getMyPendingApprovals } from '@/lib/api/approvals-api'
import { getPendingApprovalTimesheets, getProjects } from '@/lib/api/timesheets-api'
import { computeAc52FinancialStatements } from './financial-statements'
import {
  adaptAc52Accounts,
  adaptAc52Journals,
  adaptAc52Banks,
  adaptAc52ReconciliationStatement,
  adaptAc52ApBills,
  adaptAc52ApVendors,
  adaptAc52ArInvoices,
  adaptAc52ArCustomers,
  adaptAc52Claims,
  adaptAc52InventoryItems,
  adaptAc52FixedAssets,
  adaptAc52Investments,
  adaptAc52Approvals,
  adaptAc52FxExposure,
  adaptAc52RecurringSchedules,
  adaptAc52VaultDocuments,
  adaptAc52TaxPacks,
  adaptAc52CloseTasks,
  adaptAc52CloseTasksV11,
  adaptAc52NonJournalApprovals,
  adaptAc52Timesheets,
  adaptAc52Projects,
} from './adapters'
import type { Ac52HydratePayload } from './types'

export type Ac52DataScope = 'coa' | 'journals' | 'cash' | 'reconciliation' | 'payables' | 'receivables' | 'expenses' | 'inventory' | 'assets' | 'investments' | 'statements' | 'approvals' | 'fx' | 'recurring' | 'vault' | 'compliance' | 'consolidation' | 'close' | 'timesheets'

export type Ac52ScopePlan = {
  primary: Ac52DataScope[]
}

/** Which live scopes a given accounting-v52 page needs. Extend as more pages are wired. */
export function scopesForAc52Page(page: string): Ac52ScopePlan {
  switch (page) {
    // Command Centre (overviewPage8 in the runtime) reads S.banks (cash), S.approvals
    // (pending queue) and S.journals (revenue, recent ledger activity) directly, plus
    // AR/AP totals derived from the same receivables/payables data other pages use — but
    // this page previously had no case here at all, so it never issued its own fetch and
    // relied entirely on whatever localStorage happened to contain from a *different* page
    // visited earlier in the session (found live: a voided journal kept showing "Submitted"
    // on Command Centre indefinitely, in a fresh tab, because nothing ever refetched it here).
    case 'overview':
      return { primary: ['journals', 'cash', 'payables', 'receivables', 'approvals'] }
    case 'coa':
      return { primary: ['coa'] }
    // General Ledger and account balances are derived client-side from S.journals
    // (see postedJournals8/ledgerRows8/accountNet8 in the runtime), so both pages
    // need the same 'journals' scope — there is no separate GL dataset to fetch.
    case 'journals':
    case 'ledger':
      return { primary: ['journals'] }
    case 'cash':
      // Bank balances derive from S.journals via each bank's linked GL account.
      return { primary: ['cash', 'journals'] }
    case 'reconciliation':
      return { primary: ['reconciliation', 'cash', 'journals'] }
    case 'payables':
      return { primary: ['payables'] }
    case 'receivables':
      return { primary: ['receivables'] }
    case 'expenses':
      return { primary: ['expenses'] }
    case 'inventory':
      return { primary: ['inventory'] }
    case 'assets':
      return { primary: ['assets'] }
    case 'investments':
      return { primary: ['investments'] }
    case 'reports':
      return { primary: ['statements'] }
    case 'approvals':
      return { primary: ['approvals'] }
    case 'fx':
      return { primary: ['fx'] }
    case 'recurring':
      return { primary: ['recurring'] }
    case 'vault':
      return { primary: ['vault'] }
    case 'compliance':
      return { primary: ['compliance'] }
    case 'consolidation':
      return { primary: ['consolidation'] }
    case 'close':
      return { primary: ['close'] }
    case 'timesheets':
      return { primary: ['timesheets'] }
    // Trial Balance (trialBalancePage12) computes account balances from S.accounts + S.journals
    // directly (core12()/tb12()) — same missing-case bug as 'overview' above, same fix.
    case 'trialbalance':
      return { primary: ['coa', 'journals'] }
    default:
      return { primary: [] }
  }
}

function settle<T>(p: Promise<T>, label: string, errors: string[]): Promise<T | null> {
  return p.then(
    (v) => v,
    (err) => {
      errors.push(`${label}: ${err?.message || String(err)}`)
      return null
    },
  )
}

export async function loadAc52Scopes(scopes: Ac52DataScope[]): Promise<Ac52HydratePayload & { meta: { errors: string[] } }> {
  const wanted = Array.from(new Set(scopes))
  const errors: string[] = []
  const data: Ac52HydratePayload['data'] = {}
  let rawJournals: any[] | null = null
  let rawBanks: any[] | null = null

  if (wanted.includes('coa')) {
    // NOTE: chartOfAccountsApi.getChartOfAccounts() already unwraps the {success,data}
    // envelope internally (`return response.data`) despite its TS signature claiming
    // AccountingResponse<ChartOfAccount[]> — the real return value is the array itself.
    const res = await settle(chartOfAccountsApi.getChartOfAccounts(), 'chartOfAccounts', errors)
    // Omit `accounts` entirely on failure so the host leaves existing data untouched
    // instead of wiping the page to empty on a transient network/auth error.
    if (Array.isArray(res)) {
      data.accounts = adaptAc52Accounts(res)
    }
  }

  if (wanted.includes('journals') || wanted.includes('reconciliation') || wanted.includes('approvals')) {
    // No status filter: backend defaults to POSTED_AND_PENDING, which is exactly
    // what the mock's Journal Entries / General Ledger pages need to show.
    const res = await settle(accountingApi.getJournalEntries(), 'journalEntries', errors)
    if (Array.isArray(res?.data)) {
      rawJournals = res!.data!
      if (wanted.includes('journals')) data.journals = adaptAc52Journals(rawJournals as any)
      if (wanted.includes('approvals')) data.approvals = adaptAc52Approvals(rawJournals as any)
    }
  }

  if (wanted.includes('approvals')) {
    const res = await settle(getMyPendingApprovals(), 'myPendingApprovals', errors)
    if (Array.isArray(res?.data)) {
      const nonJournal = adaptAc52NonJournalApprovals(res.data)
      data.approvals = [...(data.approvals || []), ...nonJournal]
    }
  }

  if (wanted.includes('cash') || wanted.includes('reconciliation')) {
    // getCashbookBanks() returns the raw {success,data} envelope (unlike getChartOfAccounts).
    const res = await settle(cashbookApi.getCashbookBanks(), 'cashbookBanks', errors)
    if (Array.isArray(res?.data)) {
      rawBanks = res!.data as any[]
      if (wanted.includes('cash')) data.banks = adaptAc52Banks(rawBanks as any)
    }
  }

  if (wanted.includes('reconciliation')) {
    const res = await settle(accountingApi.getBankReconciliations(), 'bankReconciliations', errors)
    const list = res?.data?.reconciliations
    if (Array.isArray(list) && list.length > 0) {
      const latestId = list[0]?.id
      const unmatchedRes = latestId
        ? await settle(accountingApi.getBankReconciliationUnmatched(latestId), 'bankReconciliationUnmatched', errors)
        : null
      const lines = Array.isArray(unmatchedRes?.data) ? adaptAc52ReconciliationStatement(unmatchedRes!.data as any) : []
      data.reconciliation = { statement: lines, ledger: [] }
    } else {
      // Honest empty state: no reconciliation run exists yet, so there is nothing
      // matched or unmatched — this replaces a hardcoded mock count, it isn't a gap.
      data.reconciliation = { statement: [], ledger: [] }
    }

    // The visible Bank Reconciliation page (runtime's v28 layer) reads its own
    // reconBanks/reconLines arrays, not S.reconciliation above. Give it the same
    // real numbers: each bank's ledger balance computed from posted journal lines
    // against that bank's linked GL account (same derivation accountNet8 does for
    // the rest of the module, just recomputed here since v28 can't reach S).
    if (rawBanks) {
      data.reconBanks = rawBanks.map((b: any) => {
        const glCode = b.glAccount?.accountNo
        let debit = 0
        let credit = 0
        if (glCode && rawJournals) {
          for (const j of rawJournals) {
            if (j.status !== 'POSTED') continue
            for (const l of j.journalEntryLines || []) {
              if (l.chartOfAccount?.accountNo === glCode) {
                debit += Number(l.debitAmount) || 0
                credit += Number(l.creditAmount) || 0
              }
            }
          }
        }
        const ledger = debit - credit
        return {
          id: b.id,
          name: b.name,
          currency: b.currency?.code || 'USD',
          // No external bank statement has been imported for any bank yet, so there
          // is no known variance to show — statement = ledger, not a fabricated number.
          statement: ledger,
          ledger,
        }
      })
      data.reconLines = []
    }
  }

  if (wanted.includes('payables')) {
    const [billsRes, vendorsRes] = await Promise.all([
      settle(accountingApi.getPurchaseInvoices({ limit: 200 }), 'purchaseInvoices', errors),
      settle(accountingApi.getVendors({ limit: 200 }), 'vendors', errors),
    ])
    const bills = Array.isArray(billsRes?.data?.invoices) ? billsRes!.data!.invoices : []
    if (Array.isArray(billsRes?.data?.invoices)) data.apBills = adaptAc52ApBills(bills)
    if (Array.isArray(vendorsRes?.data)) data.apVendors = adaptAc52ApVendors(vendorsRes!.data as any, bills)
  }

  if (wanted.includes('receivables')) {
    const [invoicesRes, customersRes] = await Promise.all([
      settle(accountingApi.getInvoices({ limit: 200 }), 'invoices', errors),
      settle(accountingApi.getCustomers({ limit: 200 }), 'customers', errors),
    ])
    const invoices = Array.isArray(invoicesRes?.data?.invoices) ? invoicesRes!.data!.invoices : []
    if (Array.isArray(invoicesRes?.data?.invoices)) data.arInvoices = adaptAc52ArInvoices(invoices)
    if (Array.isArray(customersRes?.data?.customers)) data.arCustomers = adaptAc52ArCustomers(customersRes!.data!.customers, invoices)
  }

  if (wanted.includes('expenses')) {
    const [expRes, usersRes] = await Promise.all([
      settle(accountingApi.getExpenses({ limit: 200 }), 'expenses', errors),
      settle(usersApi.getAll(), 'users', errors),
    ])
    if (Array.isArray(expRes?.data)) {
      const userNames = new Map<string, string>()
      if (Array.isArray(usersRes?.data)) {
        for (const u of usersRes!.data!) userNames.set(u.id, `${u.firstName} ${u.lastName}`.trim())
      }
      data.claims = adaptAc52Claims(expRes!.data as any, userNames)
    }
  }

  if (wanted.includes('inventory')) {
    const res = await settle(accountingApi.getInventoryItems({ limit: 200 }), 'inventoryItems', errors)
    if (Array.isArray(res?.data?.items)) data.inventoryItems = adaptAc52InventoryItems(res!.data!.items)
  }

  if (wanted.includes('assets')) {
    const res = await settle(accountingApi.getAssets({ limit: 200 }), 'assets', errors)
    if (Array.isArray(res?.data?.assets)) data.fixedAssets = adaptAc52FixedAssets(res!.data!.assets as any)
  }

  if (wanted.includes('investments')) {
    const res = await settle(getSTIDashboard({}), 'stiDashboard', errors)
    if (Array.isArray(res?.data?.instruments)) data.investments = adaptAc52Investments(res!.data!.instruments)
  }

  if (wanted.includes('fx')) {
    const res = await settle(accountingApi.getUnrealizedFxGainsReport(), 'unrealizedFx', errors)
    if (res?.data) data.fx = adaptAc52FxExposure(res.data)
  }

  if (wanted.includes('recurring')) {
    const res = await settle(accountingApi.getRecurringJournalTemplates(), 'recurringJournalTemplates', errors)
    if (Array.isArray(res?.data)) data.recurring = adaptAc52RecurringSchedules(res!.data!)
  }

  if (wanted.includes('vault')) {
    const [docsRes, usersRes] = await Promise.all([
      settle(getAccountingDocuments(), 'accountingDocuments', errors),
      settle(usersApi.getAll(), 'users', errors),
    ])
    if (Array.isArray(docsRes?.data)) {
      const userNames = new Map<string, string>()
      if (Array.isArray(usersRes?.data)) {
        for (const u of usersRes!.data!) userNames.set(u.id, `${u.firstName} ${u.lastName}`.trim())
      }
      data.vaultDocuments = adaptAc52VaultDocuments(docsRes!.data!, userNames)
    }
  }

  if (wanted.includes('compliance')) {
    const [packsRes, usersRes] = await Promise.all([
      settle(getTaxReturnPacks(), 'taxReturnPacks', errors),
      settle(usersApi.getAll(), 'users', errors),
    ])
    if (Array.isArray(packsRes?.data)) {
      const userNames = new Map<string, string>()
      if (Array.isArray(usersRes?.data)) {
        for (const u of usersRes!.data!) userNames.set(u.id, `${u.firstName} ${u.lastName}`.trim())
      }
      data.taxPacks = adaptAc52TaxPacks(packsRes!.data!, userNames)
    }
  }

  if (wanted.includes('consolidation')) {
    const res = await settle(getConsolidationSummary(), 'consolidationSummary', errors)
    if (res?.data) data.consolidation = res.data
  }

  if (wanted.includes('close')) {
    const calRes = await settle(getFiscalCalendar(), 'fiscalCalendar', errors)
    const allPeriods: FiscalPeriod[] = []
    for (const fy of calRes?.data?.fiscalYears || []) allPeriods.push(...fy.periods)
    const now = Date.now()
    const current =
      allPeriods.find((p) => p.status === 'OPEN' && new Date(p.startDate).getTime() <= now && now <= new Date(p.endDate).getTime()) ||
      allPeriods.find((p) => p.status === 'OPEN')
    if (current) {
      const tasksRes = await settle(getCloseTasks(current.id), 'accountingCloseTasks', errors)
      if (Array.isArray(tasksRes?.data)) {
        data.closeTasks = adaptAc52CloseTasks(tasksRes!.data!)
        data.closeTasksV11 = adaptAc52CloseTasksV11(tasksRes!.data!)
      }
    }
  }

  if (wanted.includes('timesheets')) {
    const [tsRes, projRes] = await Promise.all([
      settle(getPendingApprovalTimesheets(), 'pendingTimesheets', errors),
      settle(getProjects(), 'projects', errors),
    ])
    if (Array.isArray(tsRes?.data)) data.timesheets = adaptAc52Timesheets(tsRes!.data!)
    if (Array.isArray(projRes?.data)) data.projects = adaptAc52Projects(projRes!.data!, Array.isArray(tsRes?.data) ? tsRes!.data! : [])
  }

  if (wanted.includes('statements')) {
    const [accountsRes, journalsRes] = await Promise.all([
      settle(chartOfAccountsApi.getChartOfAccounts(), 'chartOfAccountsForStatements', errors),
      settle(accountingApi.getJournalEntries({ limit: 1000 }), 'journalEntriesForStatements', errors),
    ])
    if (Array.isArray(accountsRes) && Array.isArray(journalsRes?.data)) {
      data.reportRows = computeAc52FinancialStatements(accountsRes, journalsRes!.data as any)
    }
  }

  return { data, meta: { errors } }
}
