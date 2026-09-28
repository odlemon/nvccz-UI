import { listProcurementInvoices, listPurchaseOrders, listQuotations, listRfqs, listVendors } from '@/lib/api/procurement-v23-api'
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
import { getAuditLogs } from '@/lib/api/audit-log-api'
import { rolesApi } from '@/lib/api/roles-api'
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
  adaptAc52AuditEvents,
  adaptAc52AccessData,
  adaptAc52ProcurementBills,
  procurementOutstanding,
  adaptAc52ApPOs,
  adaptAc52ApRfqs,
} from './adapters'
import type { Ac52HydratePayload } from './types'

export type Ac52DataScope = 'coa' | 'journals' | 'cash' | 'reconciliation' | 'payables' | 'receivables' | 'expenses' | 'inventory' | 'assets' | 'investments' | 'statements' | 'approvals' | 'fx' | 'recurring' | 'vault' | 'compliance' | 'consolidation' | 'close' | 'timesheets' | 'audit' | 'ceo' | 'access'

export type Ac52ScopePlan = {
  primary: Ac52DataScope[]
}

/** Which live scopes a given accounting-v52 page needs. Extend as more pages are wired. */
export function scopesForAc52Page(page: string): Ac52ScopePlan {
  switch (page) {
    case 'payables':
      return { primary: ['payables'] }
    // Pages drawn by the live layer (scripts/accounting-live) load their own records from the server and never read
    // the runtime's hydrated copies, so fetching those (up to 1,000 journals for the ledger pages) only slowed them.
    case 'coa':
    case 'journals':
    case 'ledger':
    case 'trialbalance':
    case 'reports':
    case 'cash':
    case 'reconciliation':
    case 'receivables':
    case 'expenses':
    case 'assets':
    case 'investments':
    case 'approvals':
    case 'fx':
    case 'recurring':
    case 'close':
    case 'audit':
    case 'access':
    case 'settings':
    case 'integrations':
    case 'timesheets':
    case 'inventory':
    case 'compliance':
    case 'consolidation':
    case 'overview':
    case 'ceo':
    case 'vault':
    default:
      return { primary: [] }
  }
}

/**
 * Procurement's purchase orders, RFQs, quotations and supplier invoices, for Payables. A role without procurement
 * access is refused (403) and simply sees none; any other failure is reported like the accounting reads.
 */
async function loadProcurementForPayables(errors: string[]) {
  const read = (p: Promise<unknown>, label: string): Promise<any[]> =>
    p.then(
      (rows) => (Array.isArray(rows) ? rows : []),
      (err: any) => {
        if (err?.status !== 403) errors.push(`${label}: ${err?.message || String(err)}`)
        return []
      },
    )
  const [orders, rfqs, quotations, invoices] = await Promise.all([
    read(listPurchaseOrders(), 'procurement/purchase-orders'),
    read(listRfqs(), 'procurement/rfq'),
    read(listQuotations(), 'vendor-quotations'),
    read(listProcurementInvoices(), 'procurement/invoices'),
  ])
  return { orders, rfqs, quotations, invoices }
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
    const [billsRes, vendorsRes, procurement, banksRes] = await Promise.all([
      settle(accountingApi.getPurchaseInvoices({ limit: 200 }), 'purchaseInvoices', errors),
      settle(accountingApi.getVendors({ limit: 200 }), 'vendors', errors),
      loadProcurementForPayables(errors),
      // The accounts a supplier payment can be made from, for Pay bill.
      settle(cashbookApi.getCashbookBanks(), 'cashbookBanks', errors),
    ])
    if (Array.isArray(banksRes?.data)) {
      data.apBanks = adaptAc52Banks((banksRes!.data as any[]).filter((b) => b.isActive !== false) as any)
    }
    const bills = Array.isArray(billsRes?.data?.invoices) ? billsRes!.data!.invoices : []
    // Supplier invoices captured in procurement are payables too: they sit beside accounting's own bills.
    if (Array.isArray(billsRes?.data?.invoices) || procurement.invoices.length) {
      data.apBills = [...adaptAc52ApBills(bills), ...adaptAc52ProcurementBills(procurement.invoices)]
    }
    if (Array.isArray(vendorsRes?.data)) {
      data.apVendors = adaptAc52ApVendors(vendorsRes!.data as any, [...bills, ...procurementOutstanding(procurement.invoices)] as any)
    }
    // Always sent (empty for a role without procurement access), so the sample orders and RFQs never show.
    data.apPOs = adaptAc52ApPOs(procurement.orders, procurement.invoices)
    data.apRfqs = adaptAc52ApRfqs(procurement.rfqs, procurement.quotations)
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
    const [expRes, usersRes, vendorsRows, catsRes] = await Promise.all([
      settle(accountingApi.getExpenses({ limit: 200 }), 'expenses', errors),
      settle(usersApi.getAll(), 'users', errors),
      settle(listVendors(), 'expenseVendors', errors),
      settle(accountingApi.getExpenseCategories({ isActive: true }), 'expenseCategories', errors),
    ])
    if (Array.isArray(expRes?.data)) {
      const userNames = new Map<string, string>()
      if (Array.isArray(usersRes?.data)) {
        for (const u of usersRes!.data!) userNames.set(u.id, `${u.firstName} ${u.lastName}`.trim())
      }
      data.claims = adaptAc52Claims(expRes!.data as any, userNames)
    }
    const vendorRows = Array.isArray(vendorsRows) ? vendorsRows : []
    const catRows = Array.isArray(catsRes?.data) ? catsRes!.data : []
    data.expenseLookups = {
      vendors: vendorRows.map((v: any) => ({ id: v.id, name: v.name || v.vendorName || v.id })),
      categories: catRows.map((c: any) => ({ id: c.id, name: c.name })),
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
    // The real period list, for Settings > Periods & lock — which showed four hardcoded months
    // with invented lock dates and completion percentages. Most recent first, capped at the
    // handful the tile grid displays.
    if (allPeriods.length) {
      data.fiscalPeriods = [...allPeriods]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, 8)
        .map((p) => ({
          id: p.id,
          // p.name ("January 2026") not a formatted startDate — see the FiscalPeriod type: these
          // are UTC-midnight DATE values, and January 2026 starts 2025-12-31Z, so formatting the
          // start date labels every period with the previous month.
          name: p.name || `Period ${p.periodNumber}`,
          status: p.status === 'OPEN' ? 'Open' : 'Closed',
          isCurrent: p.id === current?.id,
        }))
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

  if (wanted.includes('audit')) {
    const [logRes, usersRes] = await Promise.all([
      settle(getAuditLogs(100), 'auditLogs', errors),
      settle(usersApi.getAll(), 'users', errors),
    ])
    if (Array.isArray(logRes?.data?.items)) {
      // AuditLog carries adminId but no role, so build an id -> role-name lookup to fill the
      // page's Role column instead of leaving every row blank.
      const userRoles = new Map<string, string>()
      if (Array.isArray(usersRes?.data)) {
        for (const u of usersRes!.data!) {
          const role = (u as any).role?.name || (u as any).roleName || (u as any).roleCode
          if (role) userRoles.set(u.id, String(role))
        }
      }
      data.auditLog = adaptAc52AuditEvents(logRes!.data!.items, userRoles)
    }
  }

  if (wanted.includes('access')) {
    const [usersRes, rolesRes] = await Promise.all([
      settle(usersApi.getAll(), 'usersForAccess', errors),
      settle(rolesApi.getAll(), 'rolesForAccess', errors),
    ])
    if (Array.isArray(usersRes?.data) && Array.isArray(rolesRes?.data)) {
      data.access = adaptAc52AccessData(usersRes!.data!, rolesRes!.data!)
    }
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

  // Assembled last, because it is derived from the scopes above rather than fetched: the CEO
  // View's headline figures. Previously this page had no scope at all and rendered its
  // ceoEntities demo fixture end to end (a $6.84m group liquidity against a real $3.50m, and
  // four legal entities against the one that actually exists).
  if (wanted.includes('ceo')) {
    // Cash is derived the same way the reconciliation block above derives it — posted journal
    // lines against each bank's linked GL account — so this figure ties to Command Centre and
    // Cash Book rather than being a second, independently-computed number.
    let cash = 0
    if (rawBanks && rawJournals) {
      for (const b of rawBanks) {
        const glCode = (b as any).glAccount?.accountNo
        if (!glCode) continue
        for (const j of rawJournals) {
          if (j.status !== 'POSTED') continue
          for (const l of j.journalEntryLines || []) {
            if (l.chartOfAccount?.accountNo === glCode) {
              cash += (Number(l.debitAmount) || 0) - (Number(l.creditAmount) || 0)
            }
          }
        }
      }
    }
    const cons = data.consolidation as any
    const consEntities: any[] = Array.isArray(cons?.entities) ? cons.entities : []
    data.ceo = {
      cash,
      revenue: Number(cons?.consolidated?.revenue) || 0,
      netIncome: Number(cons?.consolidated?.netIncome) || 0,
      // One row per real ForecastEntity. Revenue/profit come from that entity's own ledger
      // slice; cash is only attributable to a single entity when there is exactly one, so with
      // several it stays 0 rather than being allocated on an invented basis. `risk` and `close`
      // are 0/null: no finance risk register exists in this backend, and per-entity close
      // progress is not tracked (close tasks are per fiscal period, group-wide).
      entities: consEntities.map((e) => {
        const revenue = Number(e.incomeStatement?.revenue) || 0
        const profit = Number(e.incomeStatement?.netIncome) || 0
        return {
          id: e.forecastEntityId,
          name: e.entityName,
          sector: String(e.entityType || '').replace(/_/g, ' ').toLowerCase() || '—',
          revenue,
          profit,
          cash: consEntities.length === 1 ? cash : 0,
          ar: 0,
          ap: 0,
          risk: 0,
          close: null,
          margin: revenue ? (profit / revenue) * 100 : 0,
        }
      }),
    }
  }

  return { data, meta: { errors } }
}
