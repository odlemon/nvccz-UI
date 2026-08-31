import { applicationsApi } from '@/lib/api/applications-api'
import { boardReviewApi } from '@/lib/api/board-review-api'
import { dueDiligenceApi } from '@/lib/api/due-diligence-api'
import { termSheetApi } from '@/lib/api/term-sheet-api'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import { usersApi } from '@/lib/api/users-api'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
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
  const [appRes, dd, term, board] = await Promise.all([
    applicationsApi.getById(applicationId).catch((e) => {
      errors.push(`application: ${e?.message || e}`)
      return null
    }),
    dueDiligenceApi.getByApplicationId(applicationId).catch(() => null),
    termSheetApi.getByApplicationId(applicationId).catch(() => null),
    boardReviewApi.getByApplicationId(applicationId).catch(() => null),
  ])

  const app = (appRes as any)?.data ?? appRes

  const ddData = (dd as any)?.data ?? dd
  const termData = (term as any)?.data ?? term ?? app?.termSheet
  const boardData = (board as any)?.data ?? board ?? app?.boardReview

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

  return {
    application: app,
    dueDiligence: ddData || app?.dueDiligenceReview || null,
    termSheet: termData || null,
    boardReview: boardData || null,
    investmentImplementation: app?.investmentImplementation || null,
    documents: app?.documents || [],
    dataRoom: app?.dataRoom || null,
    disbursements: app?.disbursements || [],
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
      portfolioCompanyId: String(
        app?.portfolioCompanyId ||
          app?.portfolioCompany?.id ||
          app?.investmentImplementation?.portfolioCompanyId ||
          '',
      ),
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

export async function loadSettingsRbac() {
  const res = await usersApi.getAll().catch(() => null)
  const users = asArray(res)
  const roleMap = new Map<string, { id: string; name: string; colour: string; members: number }>()
  const colors = ['#2563eb', '#0a9e73', '#f29a1f', '#dc3f72', '#0c879f']
  users.forEach((u: any, i: number) => {
    const roleName = u.role?.name || 'User'
    const roleId = u.role?.id || roleName.toLowerCase().replace(/\s+/g, '-')
    if (!roleMap.has(roleId)) {
      roleMap.set(roleId, {
        id: roleId,
        name: roleName,
        colour: colors[i % colors.length],
        members: 0,
      })
    }
    roleMap.get(roleId)!.members += 1
  })
  return {
    roles: Array.from(roleMap.values()).map((r) => ({
      id: r.id,
      name: r.name,
      colour: r.colour,
      scope: 'Organisation',
      description: `${r.members} user(s)`,
    })),
    users: users.map((u: any) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      role: u.role?.id || u.role?.name || 'user',
      department: typeof u.department === 'string' ? u.department : u.department?.name || '-',
    })),
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
