import { applicationsApi } from '@/lib/api/applications-api'
import { boardReviewApi } from '@/lib/api/board-review-api'
import { dueDiligenceApi } from '@/lib/api/due-diligence-api'
import { termSheetApi } from '@/lib/api/term-sheet-api'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import { usersApi } from '@/lib/api/users-api'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import { portfolioCompaniesApi } from '@/lib/api/portfolio-companies-api'
import { investmentImplementationApi } from '@/lib/api/investment-implementation-api'
import { asArray } from './adapters'

function num(v: unknown, fallback = 0): number {
  if (v == null || v === '') return fallback
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Return a finite number only when the source field is present; otherwise null (UI shows dash). */
function optionalNum(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Load live deal-detail payload for an application id. */
export async function loadDealDetail(applicationId: string) {
  const errors: string[] = []
  // Full application payload — light mode omits documents / form data needed by Deal Detail tabs.
  const [appRes, dd, term, board, boardVotesRes] = await Promise.all([
    applicationsApi.getById(applicationId).catch((e) => {
      errors.push(`application: ${e?.message || e}`)
      return null
    }),
    dueDiligenceApi.getByApplicationId(applicationId).catch(() => null),
    termSheetApi.getByApplicationId(applicationId).catch(() => null),
    boardReviewApi.getByApplicationId(applicationId).catch(() => null),
    boardReviewApi.getVoteSummary(applicationId).catch(() => null),
  ])

  const app = (appRes as any)?.data ?? appRes

  const ddData = (dd as any)?.data ?? dd
  const termData = (term as any)?.data ?? term ?? app?.termSheet
  const boardData = (board as any)?.data ?? board ?? app?.boardReview
  const boardVotesData = (boardVotesRes as any)?.data ?? boardVotesRes ?? null

  // Prefer application-submitted ownership/valuation; only fall back to term sheet
  // equity/valuation when the application fields are absent (avoids wrong hero %).
  const ownership = optionalNum(
    app?.proposedOwnership ??
      app?.ownership ??
      app?.applicationFormData?.proposedOwnership,
  )
  const ownershipFromTerm = optionalNum(termData?.equityPercentage)
  const preMoney = optionalNum(app?.preMoneyValuation ?? app?.valuation)
  const preMoneyFromTerm = optionalNum(termData?.valuation ?? termData?.preMoneyValuation)

  const address = String(app?.applicantAddress || '')
  const countryFromAddress = address
    ? address
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean)
        .pop() || ''
    : ''

  // getById often omits applicationProgress; approximate from stage when missing
  // (mirror ApplicationService.calculateApplicationProgress base map).
  const STAGE_PROGRESS: Record<string, number> = {
    SUBMITTED: 5,
    SCREENING_PENDING: 5,
    SCREENING: 10,
    ACTIVE_DD: 20,
    PENDING_SHORTLISTING: 5,
    SHORTLISTED: 10,
    UNDER_DUE_DILIGENCE: 20,
    DUE_DILIGENCE_COMPLETED: 30,
    TERM_SHEET: 40,
    TERM_SHEET_NEGOTIATION: 45,
    UNDER_BOARD_REVIEW: 50,
    BOARD_APPROVED: 60,
    BOARD_REJECTED: 0,
    BOARD_CONDITIONAL: 55,
    INVESTMENT_IMPLEMENTATION: 70,
    DISBURSED: 85,
    FUNDED: 95,
    PORTFOLIO_MANAGEMENT: 100,
    BELOW_THRESHOLD: 0,
    REJECTED: 0,
    REJECTED_SCREENING: 0,
    AUTO_REJECTED: 0,
    NOT_SELECTED: 0,
  }
  const stageKey = String(app?.currentStage || '').toUpperCase()
  const progress =
    optionalNum(app?.applicationProgress) ??
    (STAGE_PROGRESS[stageKey] != null ? STAGE_PROGRESS[stageKey] : null)

  // Application has no direct portfolioCompany relation in the API response; the company is
  // provisioned (on DD/term-sheet completion) keyed by applicant email, not linked back to the
  // application record, so resolve it by matching contact email against the company list.
  let resolvedPortfolioCompanyId =
    app?.portfolioCompanyId || app?.portfolioCompany?.id || app?.investmentImplementation?.portfolioCompanyId || ''
  if (!resolvedPortfolioCompanyId && app?.applicantEmail) {
    const companiesRes = await portfolioCompaniesApi.getAll().catch(() => null)
    const companies = asArray((companiesRes as any)?.data ?? companiesRes)
    const match = companies.find(
      (c: any) => String(c?.contactEmail || '').toLowerCase() === String(app.applicantEmail).toLowerCase(),
    )
    if (match?.id) resolvedPortfolioCompanyId = match.id
  }

  let disbursementSummary: any = null
  let disbursementBanks: any[] = []
  if (app?.investmentImplementation?.id) {
    const summaryRes = await investmentImplementationApi
      .getDisbursementSummary(app.investmentImplementation.id)
      .catch(() => null)
    disbursementSummary = (summaryRes as any)?.data ?? summaryRes ?? null
    const banksRes = await investmentImplementationApi.getDisbursementBanks().catch(() => null)
    disbursementBanks = asArray((banksRes as any)?.data ?? banksRes)
  }

  return {
    application: app,
    dueDiligence: ddData || app?.dueDiligenceReview || null,
    termSheet: termData || null,
    boardReview: boardData || null,
    boardVotes: boardVotesData || null,
    investmentImplementation: app?.investmentImplementation || null,
    documents: app?.documents || [],
    dataRoom: app?.dataRoom || null,
    disbursements: app?.disbursements || [],
    disbursementSummary,
    disbursementBanks,
    hero: {
      applicationId,
      companyName: String(app?.businessName || app?.companyName || app?.applicantName || ''),
      requestedAmount: num(app?.requestedAmount),
      ownership: ownership ?? ownershipFromTerm,
      preMoney: preMoney ?? preMoneyFromTerm,
      email: String(app?.applicantEmail || app?.email || ''),
      phone: String(app?.applicantPhone || app?.phone || ''),
      address,
      country: String(app?.country || countryFromAddress || ''),
      progress,
      score: optionalNum(
        app?.screeningScore ?? app?.initialScreeningScore,
      ),
      aiScore: optionalNum(app?.initialScreeningScore),
      analystScore: optionalNum(app?.screeningScore),
      screeningOutcome: String(app?.screeningOutcome || ''),
      screeningSummary: String(
        app?.screeningRejectionReason ||
          app?.screeningNotes ||
          app?.aiScreeningSummary ||
          '',
      ),
      stage: String(app?.currentStage || ''),
      fundName: app?.fund?.name || '-',
      fundId: String(app?.fundId || app?.fund?.id || ''),
      industry: app?.industry || '-',
      businessStage: app?.businessStage || '-',
      description: app?.businessDescription || '',
      portfolioCompanyId: String(resolvedPortfolioCompanyId || ''),
    },
    errors,
  }
}

export async function loadPeriodCloseControls(period = '2026-07') {
  const res = await stockPickerCashApi.listPeriodControls(period)
  const data = (res as any)?.data ?? res
  return {
    periodCode: data?.periodCode || period,
    canClose: Boolean(data?.canClose),
    readinessPct: num(data?.readinessPct),
    closeControls: Array.isArray(data?.controls) ? data.controls : [],
    legalEntityId: data?.legalEntityId,
  }
}

/**
 * The Portfolio module's "Roles & Access" tab is a fixed set of 7 demo personas
 * (ceo, admin, cio, analyst, monitoring, legal, accounting) used by an internal
 * role-switcher/preview feature — the same 7 keys gate write-access and nav
 * filtering everywhere else in the module (v11IsFullAuthority whitelists exactly
 * ['ceo','admin','cio']). They are not a 1:1 mirror of real backend Role rows
 * (real roles include INVESTEE, Limited Partner, applicant — portal user types
 * with no persona counterpart). Do not inject new role entries here: replacing
 * or extending v11RoleDefinitions from live data would change which role ids
 * satisfy v11IsFullAuthority and ripple into every other page's permission
 * gating, not just Settings.
 *
 * Real data is applied narrowly instead: each real user's backend role NAME is
 * best-effort matched onto one of the 7 known persona ids purely so the persona
 * member counts are accurate. Unmatched real roles (portal user types) are left
 * out of this view entirely — they aren't staff personas.
 */
function matchPersonaId(roleName: string, roleCode?: string | null): string | null {
  const n = (roleName || '').toLowerCase()
  const c = (roleCode || '').toLowerCase()
  if (n === 'admin' || c === 'admin') return 'admin'
  if (n.includes('chief executive') || n === 'ceo') return 'ceo'
  if (n.includes('chief investment') || n === 'cio') return 'cio'
  if (n.includes('investment analyst') || n.includes('analyst') || c.includes('analyst')) return 'analyst'
  if (n.includes('monitoring') || n.includes('evaluation')) return 'monitoring'
  if (n.includes('legal')) return 'legal'
  if (n.includes('accounting') || n.includes('accountant')) return 'accounting'
  return null
}

export async function loadSettingsRbac() {
  const res = await usersApi.getAll().catch(() => null)
  const users = asArray(res)
  return {
    // Intentionally empty: never inject/overwrite persona identity from live data (see above).
    roles: [] as Array<{ id: string }>,
    users: users
      .map((u: any) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: matchPersonaId(u.role?.name, u.roleCode),
        department: typeof u.department === 'string' ? u.department : u.department?.name || '-',
        title: u.departmentRole || u.role?.name || 'Staff',
        scope: typeof u.department === 'string' ? u.department : u.department?.name || 'Organisation',
        status: 'Active',
        lastActive: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : '—',
      }))
      .filter((u) => u.role) as Array<{
        id: string; name: string; email: string; role: string; department: string
        title: string; scope: string; status: string; lastActive: string
      }>,
  }
}

export async function loadCurrencyMap(): Promise<Record<string, string>> {
  try {
    const res = await investmentOpsApi.listCurrencies()
    const items = asArray(res)
    const map: Record<string, string> = {}
    for (const c of items) {
      const code = String(c.code || '').toUpperCase()
      if (code && c.id) map[code] = String(c.id)
    }
    // UI label "ZWG" historically → treat as ZWL when present
    if (map.ZWL && !map.ZWG) map.ZWG = map.ZWL
    return map
  } catch {
    return {}
  }
}
