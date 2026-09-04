import { applicationsApi } from '@/lib/api/applications-api'
import { capitalCallsApi, clientsApi } from '@/lib/api/capital-calls-api'
import { fundsApi } from '@/lib/api/funds-api'
import { fundraisingApi } from '@/lib/api/fundraising-api'
import { fundPerformanceReportingApi } from '@/lib/api/fund-performance-reporting-api'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import { portfolioApi, type PortfolioDashboardParams } from '@/lib/api/portfolio-api'
import { portfolioCompaniesApi } from '@/lib/api/portfolio-companies-api'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import {
  adaptCapitalCalls,
  adaptCashAccounts,
  adaptCashJournals,
  adaptCashReservations,
  adaptCompanies,
  adaptDashboardCharts,
  adaptDashboardMetrics,
  adaptDeals,
  adaptDocuments,
  adaptExceptions,
  adaptFunds,
  adaptLps,
  adaptMailerLists,
  adaptReports,
  adaptReportVault,
  adaptReconciliationBatches,
  adaptSignatureEnvelopes,
  adaptStatementImports,
  asArray,
} from './adapters'
import { loadCurrencyMap, loadPeriodCloseControls, loadSettingsRbac } from './live-loaders'
import type { Pv11HydratePayload } from './types'

export type PortfolioV11LoadFilters = {
  fundId?: string
  fundName?: string
  asOfDate?: string
  currencyId?: string
  currencyCode?: string
  geography?: string
  closePeriod?: string
}

/** Discrete API slices — load only what the current page needs. */
export type PortfolioDataScope =
  | 'applications'
  | 'funds'
  | 'dashboard'
  | 'companies'
  | 'capitalCalls'
  | 'lps'
  | 'cashAccounts'
  | 'cashLedger'
  | 'cashReservations'
  | 'statementImports'
  | 'recon'
  | 'exceptions'
  | 'periodClose'
  | 'documents'
  | 'agreements'
  | 'reporting'
  | 'mailer'
  | 'settings'

export type PageScopePlan = {
  primary: PortfolioDataScope[]
  secondary: PortfolioDataScope[]
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

function parseAsOfToIso(label?: string): string | undefined {
  if (!label || label === 'All' || /latest/i.test(label)) return undefined
  const d = new Date(label)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

function matchesGeography(city: string, geography: string): boolean {
  if (!geography || geography === 'All geographies') return true
  const c = (city || '').toLowerCase()
  if (geography === 'Southern Africa') {
    return /zimbabwe|zambia|south africa|botswana|namibia|mozambique|harare|lusaka|johannesburg|bulawayo/.test(c)
  }
  if (geography === 'East Africa') {
    return /kenya|uganda|tanzania|rwanda|nairobi|kampala/.test(c)
  }
  if (geography === 'West Africa') {
    return /nigeria|ghana|senegal|ivory|lagos|accra/.test(c)
  }
  return true
}

function uniqScopes(scopes: PortfolioDataScope[]): PortfolioDataScope[] {
  return Array.from(new Set(scopes))
}

/**
 * Primary = first paint (ordered; host hydrates after each scope).
 * Secondary = same-page extras loaded after paint without blocking.
 * Never include scopes the page does not render.
 */
export function scopesForPage(page: string): PageScopePlan {
  switch (page) {
    case 'deals':
    case 'deal-detail':
      return { primary: ['applications'], secondary: ['funds'] }

    case 'dashboard':
      // Metrics/charts first; companies + funds + deal activity follow.
      return { primary: ['dashboard'], secondary: ['companies', 'funds', 'applications'] }

    case 'funds':
    case 'fund-detail':
      return { primary: ['funds'], secondary: ['dashboard'] }

    case 'fund-performance':
      return { primary: ['funds'], secondary: ['dashboard'] }

    case 'capital-calls':
    case 'capital-call-detail':
      // Calls are the register; funds are fetched as a dependency of this scope.
      return { primary: ['capitalCalls'], secondary: [] }

    case 'companies':
    case 'company-detail':
      return { primary: ['companies'], secondary: ['funds'] }

    case 'lps':
    case 'lp-detail':
      return { primary: ['lps'], secondary: [] }

    case 'cash-accounts':
    case 'cash-overview':
      return { primary: ['cashAccounts'], secondary: ['funds'] }

    case 'cash-ledger':
      return { primary: ['cashLedger'], secondary: ['cashAccounts'] }

    case 'cash-reservations':
      return { primary: ['cashReservations'], secondary: ['cashAccounts'] }

    case 'statement-imports':
      return { primary: ['statementImports'], secondary: [] }

    case 'reconciliations':
    case 'reconciliation-workspace':
      return { primary: ['recon'], secondary: ['cashAccounts'] }

    case 'exceptions':
      return { primary: ['exceptions'], secondary: [] }

    case 'period-close':
      return { primary: ['periodClose'], secondary: [] }

    case 'reporting':
    case 'reports-vault':
    case 'report-builder':
      // Reporting schedules/vault; funds load as dependency of reporting scope.
      return { primary: ['reporting'], secondary: [] }

    case 'documents-vault':
      return { primary: ['documents'], secondary: [] }

    case 'e-signatures':
      return { primary: ['agreements'], secondary: [] }

    case 'mailer-lists':
      return { primary: ['mailer'], secondary: [] }

    case 'settings':
      return { primary: ['settings'], secondary: [] }

    case 'analytics-detail':
      return { primary: ['dashboard'], secondary: ['funds'] }

    case 'applicant-portal':
      // Redirect/public apply — no portfolio hydrate required.
      return { primary: [], secondary: [] }

    default:
      return { primary: ['dashboard'], secondary: ['companies', 'funds'] }
  }
}

/** Human label for cold-load status (primary scope). */
export function primaryLoadLabel(page: string): string {
  const plan = scopesForPage(page)
  const first = plan.primary[0]
  switch (first) {
    case 'applications':
      return 'Loading applications…'
    case 'dashboard':
      return 'Loading dashboard…'
    case 'funds':
      return 'Loading funds…'
    case 'companies':
      return 'Loading portfolio companies…'
    case 'capitalCalls':
      return 'Loading capital calls…'
    case 'lps':
      return 'Loading LPs…'
    case 'cashAccounts':
      return 'Loading cash accounts…'
    case 'cashLedger':
      return 'Loading cash ledger…'
    case 'cashReservations':
      return 'Loading reservations…'
    case 'statementImports':
      return 'Loading statement imports…'
    case 'recon':
      return 'Loading reconciliations…'
    case 'exceptions':
      return 'Loading exceptions…'
    case 'periodClose':
      return 'Loading period close…'
    case 'documents':
      return 'Loading documents…'
    case 'agreements':
      return 'Loading e-signatures…'
    case 'mailer':
      return 'Loading mailer lists…'
    case 'reporting':
      return 'Loading reporting…'
    case 'settings':
      return 'Loading settings…'
    default:
      return 'Loading live portfolio…'
  }
}

type ScopeLoadContext = {
  filters: PortfolioV11LoadFilters
  errors: string[]
  currencyMap: Record<string, string>
  /** Optional funds already adapted (avoids refetch when loading capitalCalls after funds). */
  fundsCache?: ReturnType<typeof adaptFunds>
}

async function loadFundsScope(ctx: ScopeLoadContext) {
  const fundsRes = await settle(fundsApi.getAll({ limit: 100 }), 'funds', ctx.errors)
  let funds = adaptFunds(asArray(fundsRes))
  if (ctx.filters.fundName && ctx.filters.fundName !== 'All Funds') {
    funds = funds.filter((f) => f.name === ctx.filters.fundName)
  }
  return funds
}

async function loadApplicationsScope(ctx: ScopeLoadContext) {
  // light=true: list fields only (no nested DD/term/board/docs) — critical for localhost → remote DB
  const applicationsRes = await settle(
    applicationsApi.getAll({ light: true }),
    'applications',
    ctx.errors,
  )
  const deals = adaptDeals(asArray(applicationsRes))
  try {
    if (typeof sessionStorage !== 'undefined' && deals.length) {
      sessionStorage.setItem(
        'pv11.dealsCache',
        JSON.stringify({ at: Date.now(), deals }),
      )
    }
  } catch {
    /* ignore quota */
  }
  return deals
}

function readCachedDeals(): ReturnType<typeof adaptDeals> | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem('pv11.dealsCache')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.at || Date.now() - parsed.at > 120_000) return null
    return Array.isArray(parsed.deals) ? parsed.deals : null
  } catch {
    return null
  }
}

export function readCachedApplicationsPayload(): {
  data: { deals: ReturnType<typeof adaptDeals> }
  meta: { partial: boolean; merge: boolean; loadedAt: string; fromCache: boolean }
} | null {
  const deals = readCachedDeals()
  if (!deals?.length) return null
  return {
    data: { deals },
    meta: {
      partial: true,
      merge: true,
      loadedAt: new Date().toISOString(),
      fromCache: true,
    },
  }
}

async function loadDashboardScope(ctx: ScopeLoadContext, funds: ReturnType<typeof adaptFunds>) {
  const currencyCode = (ctx.filters.currencyCode || '').toUpperCase()
  const currencyId =
    ctx.filters.currencyId ||
    (currencyCode && currencyCode !== 'REPORTING CURRENCY' ? ctx.currencyMap[currencyCode] : undefined)

  const dashboardParams: PortfolioDashboardParams = {}
  if (ctx.filters.fundId) dashboardParams.fundId = ctx.filters.fundId
  const asOf = parseAsOfToIso(ctx.filters.asOfDate)
  if (asOf) dashboardParams.asOfDate = asOf
  if (currencyId) dashboardParams.currencyId = currencyId

  let dashboardRes = await settle(portfolioApi.getDashboard(dashboardParams), 'dashboard', ctx.errors)
  let dashboardData: any = (dashboardRes as any)?.data ?? dashboardRes

  if (ctx.filters.fundName && ctx.filters.fundName !== 'All Funds') {
    const match = funds.find((f) => f.name === ctx.filters.fundName)
    if (match) {
      const refetch = await settle(
        portfolioApi.getDashboard({ ...dashboardParams, fundId: match.id }),
        'dashboard:byFund',
        ctx.errors,
      )
      if (refetch) dashboardData = (refetch as any)?.data ?? refetch
    }
  }

  return dashboardData
}

async function loadCapitalCallsScope(ctx: ScopeLoadContext, funds: ReturnType<typeof adaptFunds>) {
  const capitalCallRows: Array<{ fundId: string; fundName: string; call: any }> = []
  const fundsForCalls =
    ctx.filters.fundName && ctx.filters.fundName !== 'All Funds'
      ? funds.filter((f) => f.name === ctx.filters.fundName)
      : funds.slice(0, 20)
  await Promise.all(
    fundsForCalls.map(async (f) => {
      const res = await settle(capitalCallsApi.list(f.id), `capitalCalls:${f.id}`, ctx.errors)
      for (const call of asArray(res)) capitalCallRows.push({ fundId: f.id, fundName: f.name, call })
    }),
  )
  return adaptCapitalCalls(capitalCallRows)
}

async function loadReportingScope(ctx: ScopeLoadContext, funds: ReturnType<typeof adaptFunds>) {
  const fundNameById = Object.fromEntries(funds.map((f) => [f.id, f.name]))
  const reports: ReturnType<typeof adaptReports> = []
  const reportVault: ReturnType<typeof adaptReportVault> = []
  const mailerLists: ReturnType<typeof adaptMailerLists> = []
  await Promise.all(
    funds.slice(0, 10).map(async (f) => {
      const schedules = await settle(fundPerformanceReportingApi.getSchedules(f.id), `schedules:${f.id}`, ctx.errors)
      reports.push(...adaptReports(asArray(schedules), fundNameById))
      const runs = await settle(fundPerformanceReportingApi.getRuns(f.id, 20), `runs:${f.id}`, ctx.errors)
      reportVault.push(...adaptReportVault(asArray(runs), fundNameById))
    }),
  )
  return { reports, reportVault, mailerLists }
}

async function loadMailerScope(ctx: ScopeLoadContext, funds: ReturnType<typeof adaptFunds>) {
  const mailerLists: ReturnType<typeof adaptMailerLists> = []
  await Promise.all(
    funds.slice(0, 10).map(async (f) => {
      const lists = await settle(
        fundPerformanceReportingApi.getDistributionLists(f.id),
        `distLists:${f.id}`,
        ctx.errors,
      )
      mailerLists.push(...adaptMailerLists(asArray(lists).map((l) => ({ ...l, fundName: f.name }))))
    }),
  )
  return mailerLists
}

/**
 * Load only the requested scopes. Payload `data` keys are omitted when not loaded
 * so the runtime merge hydrate leaves other collections untouched.
 */
export async function loadPortfolioV11Scopes(
  scopes: PortfolioDataScope[],
  filters: PortfolioV11LoadFilters = {},
): Promise<Pv11HydratePayload> {
  const wanted = uniqScopes(scopes)
  const errors: string[] = []
  const loadedAt = new Date().toISOString()
  const needsCurrency = wanted.some((s) => s === 'dashboard')
  const currencyMap = needsCurrency ? await loadCurrencyMap() : {}

  const ctx: ScopeLoadContext = { filters, errors, currencyMap }
  const data: Record<string, unknown> = {}
  const state: Record<string, unknown> = {
    liveData: true,
    dataRefreshedAt: loadedAt,
  }

  const needsFunds =
    wanted.includes('funds') ||
    wanted.includes('capitalCalls') ||
    wanted.includes('dashboard') ||
    wanted.includes('reporting') ||
    wanted.includes('mailer') ||
    wanted.includes('companies')

  let funds: ReturnType<typeof adaptFunds> = []
  if (needsFunds) {
    funds = await loadFundsScope(ctx)
    if (
      wanted.includes('funds') ||
      wanted.includes('capitalCalls') ||
      wanted.includes('dashboard') ||
      wanted.includes('reporting') ||
      wanted.includes('mailer') ||
      wanted.includes('companies')
    ) {
      data.funds = funds
    }
    ctx.fundsCache = funds
    state.activeFund = filters.fundName || 'All Funds'
  }

  // Dashboard + companies share portfolioSummary — load dashboard first when both requested.
  let dashboardData: any = null
  if (wanted.includes('dashboard')) {
    dashboardData = await loadDashboardScope(ctx, funds)
    const dealsForCharts = Array.isArray(data.deals) ? (data.deals as any[]) : []
    const metrics = adaptDashboardMetrics(dashboardData)
    const charts = adaptDashboardCharts(dashboardData, dealsForCharts)
    data.dashboardMetrics = metrics
    data.dashboardCharts = charts
    state.dashboardMetrics = metrics
    state.dashboardCharts = charts
    state.asOfDate = filters.asOfDate || 'Latest'
    state.dashboardCurrency = filters.currencyCode || 'USD'
    state.currencyMap = currencyMap
  }

  if (wanted.includes('companies')) {
    // Prefer with-investments (includes disbursement totals); fall back to the full
    // company list when demo companies have no FundDisbursement rows yet.
    let companiesRes = await settle(portfolioCompaniesApi.getAllWithInvestments(), 'companies', errors)
    if (!asArray(companiesRes).length) {
      companiesRes = await settle(portfolioCompaniesApi.getAll(), 'companies:fallback', errors)
    }
    const summary = Array.isArray(dashboardData?.portfolioSummary) ? dashboardData.portfolioSummary : []
    let companies = adaptCompanies(asArray(companiesRes), summary)
    if (filters.geography) {
      companies = companies.filter((c) => matchesGeography(c.city, filters.geography!))
      state.dashboardGeography = filters.geography
    } else {
      state.dashboardGeography = filters.geography || 'All geographies'
    }
    data.companies = companies
  }

  const tasks: Array<Promise<void>> = []

  if (wanted.includes('applications')) {
    tasks.push(
      loadApplicationsScope(ctx).then((deals) => {
        data.deals = deals
        // Refresh dashboard charts with deals when both landed in one payload.
        if (dashboardData && data.dashboardCharts) {
          data.dashboardCharts = adaptDashboardCharts(dashboardData, deals)
          state.dashboardCharts = data.dashboardCharts
        }
      }),
    )
  }

  if (wanted.includes('capitalCalls')) {
    tasks.push(
      loadCapitalCallsScope(ctx, funds).then((calls) => {
        data.capitalCalls = calls
      }),
    )
  }

  if (wanted.includes('lps')) {
    tasks.push(
      settle(clientsApi.list({ page: 1 }), 'clients', errors).then((clientsRes) => {
        data.lps = adaptLps(asArray(clientsRes))
      }),
    )
  }

  if (wanted.includes('cashAccounts')) {
    tasks.push(
      settle(stockPickerCashApi.listClientCashAccounts({ pageSize: 100 }), 'cashAccounts', errors).then((res) => {
        data.cashAccounts = adaptCashAccounts(asArray(res))
      }),
    )
  }

  if (wanted.includes('cashLedger')) {
    tasks.push(
      settle(stockPickerCashApi.getCashLedger({ pageSize: 100 }), 'cashLedger', errors).then((res) => {
        data.cashJournals = adaptCashJournals(asArray(res))
      }),
    )
  }

  if (wanted.includes('cashReservations')) {
    tasks.push(
      settle(stockPickerCashApi.listCashReservations({ pageSize: 100 }), 'cashReservations', errors).then((res) => {
        data.cashReservations = adaptCashReservations(asArray(res))
      }),
    )
  }

  if (wanted.includes('statementImports')) {
    tasks.push(
      settle(stockPickerCashApi.listExternalStatementImports({ pageSize: 100 }), 'statementImports', errors).then(
        (res) => {
          data.statementImports = adaptStatementImports(asArray(res))
        },
      ),
    )
  }

  if (wanted.includes('recon')) {
    tasks.push(
      settle(stockPickerCashApi.listReconciliationBatches({ pageSize: 100 }), 'reconBatches', errors).then((res) => {
        data.reconciliationBatches = adaptReconciliationBatches(asArray(res))
      }),
    )
  }

  if (wanted.includes('exceptions')) {
    tasks.push(
      settle(stockPickerCashApi.listExceptions({ pageSize: 100 }), 'exceptions', errors).then((res) => {
        data.reconciliationExceptions = adaptExceptions(asArray(res))
      }),
    )
  }

  if (wanted.includes('periodClose')) {
    const closePeriod =
      filters.closePeriod ||
      (() => {
        const d = new Date()
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      })()
    tasks.push(
      settle(loadPeriodCloseControls(closePeriod), 'periodClose', errors).then((closeCtrl) => {
        data.closeControls = closeCtrl?.closeControls || []
        state.closePeriod = closePeriod
        state.closeCanClose = closeCtrl?.canClose
        state.closeLegalEntityId = closeCtrl?.legalEntityId || 'le_arcus'
        state.closeReadinessPct = closeCtrl?.readinessPct
      }),
    )
  }

  if (wanted.includes('documents')) {
    tasks.push(
      settle(investmentOpsApi.listDocuments({}), 'documents', errors).then((res) => {
        data.documents = adaptDocuments(asArray(res))
      }),
    )
  }

  if (wanted.includes('agreements')) {
    tasks.push(
      settle(
        fundraisingApi.listAgreements({}).then((items) => ({ data: items })),
        'agreements',
        errors,
      ).then((res) => {
        data.signatureEnvelopes = adaptSignatureEnvelopes(asArray(res))
      }),
    )
  }

  if (wanted.includes('reporting')) {
    tasks.push(
      loadReportingScope(ctx, funds).then(({ reports, reportVault }) => {
        data.reports = reports
        data.reportVaultItems = reportVault
      }),
    )
  }

  if (wanted.includes('mailer')) {
    tasks.push(
      loadMailerScope(ctx, funds).then((mailerLists) => {
        data.mailerLists = mailerLists
      }),
    )
  }

  if (wanted.includes('settings')) {
    tasks.push(
      settle(loadSettingsRbac(), 'settingsRbac', errors).then((rbac) => {
        data.rbac = rbac || { roles: [], users: [] }
        state.rbac = rbac || { roles: [], users: [] }
      }),
    )
  }

  await Promise.all(tasks)

  return {
    data: data as any,
    state: state as any,
    meta: {
      errors,
      loadedAt,
      scopes: wanted,
      partial: true,
    } as any,
  }
}

/** @deprecated Prefer page-scoped `loadPortfolioV11Scopes` / progressive host loading. */
export async function loadPortfolioV11HydratePayload(
  filters: PortfolioV11LoadFilters = {},
): Promise<Pv11HydratePayload> {
  return loadPortfolioV11Scopes(
    [
      'dashboard',
      'companies',
      'funds',
      'applications',
      'lps',
      'cashAccounts',
      'cashLedger',
      'cashReservations',
      'statementImports',
      'recon',
      'exceptions',
      'documents',
      'agreements',
      'periodClose',
      'reporting',
      'mailer',
      'settings',
      'capitalCalls',
    ],
    filters,
  )
}
