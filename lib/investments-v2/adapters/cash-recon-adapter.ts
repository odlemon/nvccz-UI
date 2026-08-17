import {
  formatMoneyDisplay,
  unwrapList,
  unwrapPaged,
  type OpsEnvelope,
  type OpsPaged,
} from '@/lib/api/investment-ops-helpers'
import type {
  CashOverview,
  ClientCashAccount,
  CashLedgerLine,
  ReconException,
  ClientStatement,
  BrokerCustodianItem,
  BatchWorkspace,
  FundCashSummary,
} from '@/lib/api/stock-picker-cash-api'

export function requireOpsData<T>(res: OpsEnvelope<T> | undefined | null, label: string): T {
  if (!res || (res as OpsEnvelope<T>).success === false) {
    throw new Error((res as OpsEnvelope<T>)?.message || `Failed to load ${label}`)
  }
  if (res.data === undefined || res.data === null) {
    throw new Error((res as OpsEnvelope<T>).message || `${label} returned no data`)
  }
  return res.data
}

/** Prefer ApiError.response.code / envelope code for recon import gates. */
export function opsErrorDetails(err: unknown): Record<string, unknown> | null {
  if (err == null || typeof err !== 'object') return null
  const o = err as {
    details?: unknown
    response?: { details?: unknown; error?: { details?: unknown } }
  }
  const raw = o.response?.error?.details ?? o.response?.details ?? o.details
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  return null
}

export function opsErrorCode(err: unknown): string | undefined {
  if (err == null || typeof err !== 'object') return undefined
  const o = err as { code?: unknown; response?: { code?: unknown; error?: unknown } }
  if (o.code != null && String(o.code).trim()) return String(o.code)
  const r = o.response
  if (r?.code != null && String(r.code).trim()) return String(r.code)
  if (typeof r?.error === 'string' && r.error.trim()) return r.error
  return undefined
}

export function opsErrorMessage(err: unknown, fallback = 'Request failed') {
  const code = opsErrorCode(err)
  let message = fallback
  if (err instanceof Error && err.message) message = err.message
  else if (typeof err === 'object' && err && 'message' in err) {
    message = String((err as { message: unknown }).message)
  }
  if (typeof err === 'object' && err && 'response' in err) {
    const r = (err as { response?: { message?: unknown } }).response
    if (r?.message != null && String(r.message).trim()) message = String(r.message)
  }
  if (code === 'MAKER_CHECKER_CONFLICT') {
    return `${message} — maker and checker must differ (admins may bypass). (${code})`
  }
  if (code === 'DUPLICATE_SOURCE') {
    return `${message} — same file hash already imported/committed (SRD 11.4). (${code})`
  }
  if (code === 'CONTROL_TOTAL_FAILED' || code === 'CONTROL_MISMATCH') {
    return `${message} — opening + movements must equal closing (±0.01). (${code})`
  }
  if (code) return message.includes(`(${code})`) ? message : `${message} (${code})`
  return message
}

/** BA-R1 — normalize controlTotals from validate/commit/detail payloads. */
export function mapImportControlTotals(payload: Record<string, unknown> | null | undefined) {
  if (!payload) return null
  const ct = (payload.controlTotals ?? {}) as Record<string, unknown>
  const opening = ct.opening ?? payload.controlOpening ?? payload.openingBalance
  const closing = ct.closing ?? payload.controlClosing ?? payload.closingBalance
  const movements = ct.movements ?? payload.movementTotal
  const expectedMovement = ct.expectedMovement
  const balanced =
    ct.balanced === true || payload.controlBalanced === true || payload.arithmeticOk === true
      ? true
      : ct.balanced === false || payload.controlBalanced === false || payload.arithmeticOk === false
        ? false
        : undefined
  return {
    opening: opening != null && String(opening) !== '' ? String(opening) : undefined,
    closing: closing != null && String(closing) !== '' ? String(closing) : undefined,
    movements: movements != null && String(movements) !== '' ? String(movements) : undefined,
    expectedMovement:
      expectedMovement != null && String(expectedMovement) !== '' ? String(expectedMovement) : undefined,
    balanced,
  }
}

/** Merge control totals without wiping a known `balanced` with undefined from a sparser payload. */
export function mergeImportControlTotals(
  prev: ReturnType<typeof mapImportControlTotals>,
  next: ReturnType<typeof mapImportControlTotals>,
): ReturnType<typeof mapImportControlTotals> {
  if (!next) return prev
  if (!prev) return next
  return {
    opening: next.opening ?? prev.opening,
    closing: next.closing ?? prev.closing,
    movements: next.movements ?? prev.movements,
    expectedMovement: next.expectedMovement ?? prev.expectedMovement,
    balanced: next.balanced !== undefined ? next.balanced : prev.balanced,
  }
}

/** BA-R6 — validate inline errors + GET /errors `{ errors: [] }`. */
export function mapImportLineErrors(data: unknown): {
  line?: string
  field?: string
  code?: string
  message: string
}[] {
  let list: unknown[] = []
  if (Array.isArray(data)) list = data
  else if (data && typeof data === 'object') {
    const root = data as Record<string, unknown>
    if (Array.isArray(root.errors)) list = root.errors
    else list = unwrapList(root)
  }
  return list.map((row) => {
    const e = (row ?? {}) as Record<string, unknown>
    return {
      line: e.lineNumber != null ? String(e.lineNumber) : e.line != null ? String(e.line) : undefined,
      field: e.field != null ? String(e.field) : undefined,
      code: e.code != null ? String(e.code) : undefined,
      message: String(e.message ?? e.detail ?? e.requiredAction ?? 'Validation error'),
    }
  })
}

function score01(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const num = Number(value)
  if (!Number.isFinite(num)) return undefined
  return num > 1 ? num / 100 : num
}

export function mapCashOverviewKpis(data: CashOverview | null | undefined) {
  if (!data) return null
  const byCurrency = data.byCurrency ?? []
  const usd = byCurrency.find((c) => c.currency === 'USD')
  const zwl = byCurrency.find((c) => c.currency === 'ZWL' || c.currency === 'ZWG')
  return {
    accountCount: data.accountCount ?? 0,
    totalCash: formatMoneyDisplay(data.totalPostedSettledCash),
    available: formatMoneyDisplay(data.totalOrderEligibleAvailableCash),
    reservations: formatMoneyDisplay(data.totalActiveReservations),
    unhealthyAccounts: data.unhealthyAccounts ?? 0,
    byCurrency,
    primaryCurrency: usd?.currency ?? byCurrency[0]?.currency ?? 'USD',
    secondaryCurrency: zwl?.currency ?? null,
    secondaryCash: zwl ? formatMoneyDisplay(zwl.postedSettledCash) : null,
    secondaryAvailable: zwl ? formatMoneyDisplay(zwl.orderEligibleAvailableCash) : null,
  }
}

export function mapClientAccounts(data: unknown) {
  const page = unwrapPaged<ClientCashAccount>(data)
  const items = page.items.length ? page.items : unwrapList<ClientCashAccount>(data)
  const mapped = items.map((a) => {
    const statusRaw = String(a.status ?? 'Active')
    const statusUpper = statusRaw.toUpperCase()
    const status: 'Active' | 'Restricted' =
      statusUpper.includes('RESTRICT') || statusUpper.includes('SUSPEND') || statusUpper.includes('HOLD')
        ? 'Restricted'
        : 'Active'
    const currency = String(a.baseCurrency ?? 'USD')
    return {
      id: a.id,
      accountNumber: cashAccountDisplayLabel(a),
      clientName: displayLabel(a.clientName ?? a['clientOrVehicleName'], '—'),
      baseCurrency: currency,
      accountType: String(a.accountType ?? '—'),
      provider: String(a.provider ?? a['custodianName'] ?? '—'),
      status,
      cashBalance: `${currency} ${formatMoneyDisplay(a['postedSettledCash'] ?? a['balance'] ?? 0)}`,
      availableBalance: `${currency} ${formatMoneyDisplay(a['orderEligibleAvailableCash'] ?? a['available'] ?? 0)}`,
      cashUsd: formatMoneyDisplay(a['postedSettledCash'] ?? a['balance'] ?? 0),
      availableUsd: formatMoneyDisplay(a['orderEligibleAvailableCash'] ?? a['available'] ?? 0),
      unreconciled: Number(a['unreconciledCount'] ?? 0),
      health: String(a['health'] ?? (Number(a['unreconciledCount'] ?? 0) > 0 ? 'Open breaks' : 'Healthy')),
      lastActivity: formatActivity(a['updatedAt'] ?? a['lastActivityAt']),
      star: 'none' as const,
    }
  })
  return { ...page, items: mapped, total: page.total || mapped.length }
}

export function formatActivity(value: unknown) {
  if (value == null || value === '') return '—'
  const s = String(value).trim()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) {
    const isoDay = s.match(/^(\d{4}-\d{2}-\d{2})/)
    return isoDay ? shortDate(isoDay[1]) : '—'
  }
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortDate(value: unknown) {
  if (value == null || value === '') return '—'
  const s = String(value).trim()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) {
    const isoDay = s.match(/^(\d{4}-\d{2}-\d{2})/)
    return isoDay ? isoDay[1] : '—'
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapLedgerType(raw: unknown): 'Receipt' | 'Payment' | 'Transfer' {
  const t = String(raw ?? '').toUpperCase()
  if (t.includes('RECEIPT') || t.includes('CREDIT') || t.includes('INFLOW') || t.includes('DIVIDEND')) return 'Receipt'
  if (t.includes('PAYMENT') || t.includes('DEBIT') || t.includes('OUTFLOW') || t.includes('FEE')) return 'Payment'
  return 'Transfer'
}

function ledgerMovementType(r: CashLedgerLine): 'Receipt' | 'Payment' | 'Transfer' {
  const fromPurpose = mapLedgerType(r.type ?? r['postingPurpose'] ?? r['transactionType'])
  if (fromPurpose !== 'Transfer') return fromPurpose
  const debit = Number(String(r.debit ?? '0').replace(/,/g, ''))
  const credit = Number(String(r.credit ?? '0').replace(/,/g, ''))
  if (debit > 0 && !(credit > 0)) return 'Receipt'
  if (credit > 0 && !(debit > 0)) return 'Payment'
  return 'Transfer'
}

function mapApproval(raw: unknown): 'Approved' | 'Pending' {
  const t = String(raw ?? '').toUpperCase()
  if (t.includes('PEND') || t.includes('DRAFT') || t.includes('SUBMIT')) return 'Pending'
  return 'Approved'
}

/** Flatten journal envelopes (with nested lines) or flat ledger lines into UI rows. */
export function mapCashLedgerRows(data: unknown) {
  const page = unwrapPaged<Record<string, unknown>>(data)
  const rawItems = page.items.length ? page.items : unwrapList<Record<string, unknown>>(data)
  const flat: CashLedgerLine[] = []

  for (const item of rawItems) {
    const lines = item['lines']
    if (Array.isArray(lines) && lines.length) {
      for (const line of lines as Record<string, unknown>[]) {
        flat.push({
          id: String(line.id ?? item.id ?? ''),
          valueDate: String(item.valueDate ?? item.postedAt ?? item.tradeDate ?? ''),
          postedAt: String(item.postedAt ?? ''),
          portfolioId: String(item.portfolioId ?? ''),
          cashAccountId: String(line.cashAccountId ?? item.cashAccountId ?? ''),
          currency: String(line.currency ?? item.currency ?? 'USD'),
          type: String(item.postingPurpose ?? item.type ?? line.ledgerAccountCode ?? 'Transfer'),
          description: String(line.description ?? item.description ?? '—'),
          debit: String(line.debit ?? '0'),
          credit: String(line.credit ?? '0'),
          balance: String(line.runningBalance ?? line.balance ?? item.balance ?? '0'),
          runningBalance: String(line.runningBalance ?? line.balance ?? item.balance ?? '0'),
          status: String(item.status ?? ''),
          approvalStatus: String(item.status ?? ''),
          tradeId:
            line.tradeId != null || item.tradeId != null || item.trade_id != null
              ? String(line.tradeId ?? item.tradeId ?? item.trade_id)
              : null,
          fundName: item.fundName,
          clientName: item.clientName,
          accountNumber: item.accountNumber,
          cashAccountName: item.cashAccountName,
          providerName: item.providerName ?? item.bankName,
          bankName: item.bankName,
        } as CashLedgerLine)
      }
    } else {
      flat.push(item as CashLedgerLine)
    }
  }

  return {
    ...page,
    total: page.total || flat.length,
    items: flat.map((r) => {
      const bal = r.runningBalance ?? r.balance ?? '0'
      return {
      date: shortDate(r.valueDate ?? r.postedAt),
      fund: String(r['fundName'] ?? r.portfolioId ?? '—'),
      client: displayLabel(r['clientName'], '—'),
      account: cashAccountDisplayLabel({
        clientName: r['clientName'],
        name: r['cashAccountName'] ?? r['cashAccountLabel'],
        accountNumber: r['accountNumber'],
        accountNumberMasked: r['accountNumberMasked'],
        moneyClass: r['accountPurpose'],
      }),
      cashAccount: cashAccountDisplayLabel({
        clientName: r['clientName'],
        name: r['cashAccountName'] ?? r['cashAccountLabel'],
        accountNumber: r['accountNumber'],
        accountNumberMasked: r['accountNumberMasked'],
        moneyClass: r['accountPurpose'],
      }),
      cashAccountId: String(r.cashAccountId ?? ''),
      bank: displayLabel(r['providerName'] ?? r['bankName'], '—'),
      type: ledgerMovementType(r),
      description: String(r.description ?? '—'),
      debit: r.debit && r.debit !== '0' && r.debit !== '0.00' ? formatMoneyDisplay(r.debit) : '—',
      credit: r.credit && r.credit !== '0' && r.credit !== '0.00' ? formatMoneyDisplay(r.credit) : '—',
      balance: formatMoneyDisplay(bal),
      currency: String(r.currency ?? 'USD'),
      approval: mapApproval(r.approvalStatus ?? r.status),
      tradeId:
        r.tradeId != null && String(r.tradeId).trim()
          ? String(r.tradeId)
          : r['trade_id'] != null && String(r['trade_id']).trim()
            ? String(r['trade_id'])
            : null,
    }}),
  }
}

export function mapDailyCashMovement(data: unknown) {
  const items = unwrapList<Record<string, unknown>>(data)
  return items.map((row) => ({
    date: shortDate(row.date ?? row.valueDate),
    net: Number(String(row.net ?? 0).replace(/,/g, '')) || 0,
    close: Number(String(row.close ?? row.closingBalance ?? 0).replace(/,/g, '')) || 0,
  }))
}

export function mapCurrencyPie(
  byCurrency: { currency: string; postedSettledCash: string; orderEligibleAvailableCash: string }[],
) {
  const colors = ['#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#64748B', '#F43F5E']
  const amounts = byCurrency.map((c) => ({
    name: c.currency,
    amount: Number(String(c.postedSettledCash).replace(/,/g, '')) || 0,
  }))
  const total = amounts.reduce((s, a) => s + a.amount, 0) || 1
  return amounts.map((a, i) => ({
    name: a.name,
    pct: Math.round((a.amount / total) * 1000) / 10,
    value: `USD ${formatMoneyDisplay(a.amount)}`.replace('USD USD', 'USD'),
    color: colors[i % colors.length],
    amount: a.amount,
  }))
}

export type FundWorkspaceEntry = {
  id: string
  date: string
  description: string
  amount: number
  matchStatus?: string
}
export type FundBreakRow = { id: string; date: string; type: string; details: string; amount: number }
export type FundSuggestion = {
  internal: string
  bank: string
  reason: string
  confidence: number
  /** 0–1 score total when available */
  scoreTotal: number
  band: 'auto' | 'suggested' | 'weak' | 'none'
  scoreAmount?: number
  scoreDate?: number
  scoreReference?: number
  scoreCounterparty?: number
  /** BA-R2 policy weights (typically 0.5 / 0.2 / 0.2 / 0.1) */
  weightAmount?: number
  weightDate?: number
  weightReference?: number
  weightCounterparty?: number
  weightedAmount?: number
  weightedDate?: number
  weightedReference?: number
  weightedCounterparty?: number
  hardRuleFailed?: boolean
  hardRuleReason?: string
  hardFailures?: string[]
  matchedAmount?: string
  internalLineId?: string
  externalLineId?: string
}

/** SRD 12.5 score bands (amount 50 / date 20 / ref 20 / counterparty 10 when BE sends components). */
export function suggestionBand(score01: number): FundSuggestion['band'] {
  if (score01 >= 0.95) return 'auto'
  if (score01 >= 0.85) return 'suggested'
  if (score01 >= 0.65) return 'weak'
  return 'none'
}

export function mapBatchReconcileLabels(status: string | null | undefined, openBreaks: number, unmatched: number) {
  const u = String(status ?? '').toUpperCase()
  const fully =
    u.includes('RECONCILED') ||
    u === 'CLOSED' ||
    (u.includes('BALANCED') && openBreaks === 0 && unmatched === 0)
  const balanced =
    fully ||
    u.includes('BALANCED') ||
    u === 'BALANCED_WITH_OPEN_ITEMS' ||
    (openBreaks === 0 && unmatched === 0 && (u.includes('MATCH') || u === 'COMPLETE' || u === 'DONE'))
  return {
    balanced: balanced ? 'Balanced' : 'Not balanced',
    fullyReconciled: fully ? 'Fully reconciled' : 'Not fully reconciled',
    raw: String(status ?? '—'),
  }
}

export function mapFundWorkspace(data: BatchWorkspace | null | undefined) {
  if (!data) {
    return {
      internal: [] as FundWorkspaceEntry[],
      external: [] as FundWorkspaceEntry[],
      breaks: [] as FundBreakRow[],
      matched: [] as FundBreakRow[],
      unmatched: [] as FundBreakRow[],
      suggestions: [] as FundSuggestion[],
      matchedCount: 0,
      breakCount: 0,
      unmatchedCount: 0,
    }
  }

  const mapEntry = (row: unknown, i: number): FundWorkspaceEntry => {
    const r = (row ?? {}) as Record<string, unknown>
    const signed = Number(String(r.signedCashAmount ?? r.amount ?? r.debit ?? r.credit ?? 0).replace(/,/g, ''))
    return {
      id: String(r.lineId ?? r.id ?? `row_${i}`),
      date: shortDate(r.valueDate ?? r.postedAt ?? r.date),
      description: String(r.description ?? r.reference ?? r.id ?? '—'),
      amount: Number.isFinite(signed) ? signed : 0,
      matchStatus: r.matchStatus != null ? String(r.matchStatus) : undefined,
    }
  }

  const unmatchedInternal = unwrapList(data.unmatchedInternal)
  const unmatchedExternal = unwrapList(data.unmatchedExternal)
  const nestedInternalObj = data.internal as { entries?: unknown } | unknown[] | undefined
  const nestedExternalObj = data.external as { entries?: unknown } | unknown[] | undefined
  const nestedInternal = Array.isArray(nestedInternalObj)
    ? nestedInternalObj
    : unwrapList((nestedInternalObj as { entries?: unknown } | undefined)?.entries)
  const nestedExternal = Array.isArray(nestedExternalObj)
    ? nestedExternalObj
    : unwrapList((nestedExternalObj as { entries?: unknown } | undefined)?.entries)
  const allInternal = unwrapList(data.allInternal)
  const allExternal = unwrapList(data.allExternal)
  const internal = (allInternal.length ? allInternal : nestedInternal.length ? nestedInternal : unmatchedInternal).map(mapEntry)
  const external = (allExternal.length ? allExternal : nestedExternal.length ? nestedExternal : unmatchedExternal).map(mapEntry)
  const isUnmatched = (e: FundWorkspaceEntry) => String(e.matchStatus ?? 'UNMATCHED').toUpperCase() !== 'MATCHED'

  const flatBreaks = unwrapList(data.breaks)
  const nestedResults = unwrapList(data.results)
  const breakSource = flatBreaks.length ? flatBreaks : nestedResults.filter((row) => {
    const r = (row ?? {}) as Record<string, unknown>
    const t = String(r.kind ?? r.type ?? r.status ?? '').toUpperCase()
    return t.includes('BREAK') || t.includes('EXCEPT') || t.includes('UNMATCH')
  })

  const breaks = breakSource.map((row, i) => {
    const r = (row ?? {}) as Record<string, unknown>
    return {
      id: String(r.breakId ?? r.lineId ?? r.id ?? `brk_${i}`),
      date: shortDate(r.createdAt ?? r.date),
      type: String(r.category ?? r.type ?? 'Break'),
      details: String(r.details ?? r.status ?? r.category ?? 'Open break'),
      amount: Number(String(r.amount ?? 0).replace(/,/g, '')) || 0,
    }
  })
  const matched = unwrapList(data.matches).map((row, i) => {
    const r = (row ?? {}) as Record<string, unknown>
    return {
      id: String(r.linkId ?? r.id ?? `m_${i}`),
      date: shortDate(r.createdAt ?? r.date),
      type: String(r.method ?? r.topology ?? 'Match'),
      details: `${formatWorkspaceLineRef(internal.find((e) => e.id === String(r.internalLineId ?? ''))?.description ?? r.details, r.internalLineId)} ↔ ${formatWorkspaceLineRef(external.find((e) => e.id === String(r.externalLineId ?? ''))?.description ?? r.details, r.externalLineId)}`,
      amount: Number(String(r.matchedAmount ?? 0).replace(/,/g, '')) || 0,
    }
  })
  const suggestions = [
    ...unwrapList(data.suggested),
    ...unwrapList((data as { suggestions?: unknown }).suggestions),
    ...unwrapList((data as { matchSuggestions?: unknown }).matchSuggestions),
  ].map((row) => {
    const r = (row ?? {}) as Record<string, unknown>
    const scoreRaw = Number(r.scoreTotal ?? r.confidence ?? 0)
    const scoreTotal = scoreRaw > 1 ? scoreRaw / 100 : scoreRaw
    const confidence = Math.round(scoreTotal * 100)
    const internalDesc = internal.find((e) => e.id === String(r.internalLineId ?? ''))?.description
    const externalDesc = external.find((e) => e.id === String(r.externalLineId ?? ''))?.description
    const comps = (r.scoreComponents ?? r.components ?? {}) as Record<string, unknown>
    const weights = (r.weights ?? {}) as Record<string, unknown>
    const weighted = (r.weighted ?? r.weightedContributions ?? {}) as Record<string, unknown>
    const hardList = [
      ...unwrapList(r.hardRuleFailures),
      ...unwrapList(r.hardFailures),
    ].map((h) => {
      if (typeof h === 'string') return h
      const hr = (h ?? {}) as Record<string, unknown>
      return String(hr.message ?? hr.code ?? hr.rule ?? h)
    }).filter(Boolean)
    const hardRuleFailed =
      r.hardRuleFailed === true ||
      String(r.hardRuleStatus ?? '').toUpperCase().includes('FAIL') ||
      String(r.blockReason ?? '').length > 0 ||
      hardList.length > 0
    const amt =
      r.matchedAmount != null
        ? String(r.matchedAmount)
        : r.amount != null
          ? String(r.amount)
          : undefined
    const hardRuleReason =
      r.hardRuleReason != null
        ? String(r.hardRuleReason)
        : r.blockReason != null
          ? String(r.blockReason)
          : hardList.length
            ? hardList.join('; ')
            : undefined
    return {
      internal: formatWorkspaceLineRef(internalDesc ?? r.reason, r.internalLineId),
      bank: formatWorkspaceLineRef(externalDesc ?? r.reason, r.externalLineId),
      reason: String(r.reason ?? hardRuleReason ?? 'Suggested match'),
      confidence,
      scoreTotal,
      band: hardRuleFailed ? 'none' : suggestionBand(scoreTotal),
      scoreAmount: score01(comps.amount ?? r.scoreAmount),
      scoreDate: score01(comps.date ?? r.scoreDate),
      scoreReference: score01(comps.reference ?? comps.ref ?? r.scoreReference ?? r.scoreRef),
      scoreCounterparty: score01(comps.counterparty ?? comps.cpty ?? r.scoreCounterparty),
      weightAmount: score01(weights.amount),
      weightDate: score01(weights.date),
      weightReference: score01(weights.reference ?? weights.ref),
      weightCounterparty: score01(weights.counterparty ?? weights.cpty),
      weightedAmount: score01(weighted.amount),
      weightedDate: score01(weighted.date),
      weightedReference: score01(weighted.reference ?? weighted.ref),
      weightedCounterparty: score01(weighted.counterparty ?? weighted.cpty),
      hardRuleFailed,
      hardRuleReason,
      hardFailures: hardList.length ? hardList : undefined,
      matchedAmount: amt,
      internalLineId: r.internalLineId != null ? String(r.internalLineId) : undefined,
      externalLineId: r.externalLineId != null ? String(r.externalLineId) : undefined,
    } satisfies FundSuggestion
  })

  return {
    internal,
    external,
    breaks,
    matched,
    unmatched: [
      ...internal.filter(isUnmatched).map((e) => ({
        id: e.id,
        date: e.date,
        type: 'Unmatched Internal',
        details: e.description,
        amount: e.amount,
      })),
      ...external.filter(isUnmatched).map((e) => ({
        id: e.id,
        date: e.date,
        type: 'Unmatched External',
        details: e.description,
        amount: e.amount,
      })),
    ],
    suggestions,
    matchedCount: matched.length,
    breakCount: breaks.length,
    unmatchedCount: internal.filter(isUnmatched).length + external.filter(isUnmatched).length,
  }
}

export function mapFundSummaryKpis(
  summary: FundCashSummary | null | undefined,
  batchSummary?: Record<string, unknown> | null,
  fundName?: string | null,
) {
  const s = (summary ?? {}) as Record<string, unknown>
  const b = batchSummary ?? {}
  const openBreaks = Number(s.openBreaks ?? s.openExceptionCount ?? s.breakCount ?? b.openBreakCount ?? 0)
  const unmatched = Number(s.unmatchedCount ?? b.unmatchedInternalCount ?? 0) + Number(b.unmatchedExternalCount ?? 0)
  const matchRateRaw = s.matchRate ?? b.matchRate
  const matchRate =
    matchRateRaw != null && matchRateRaw !== ''
      ? `${Number(matchRateRaw) <= 1 && Number(matchRateRaw) > 0 ? (Number(matchRateRaw) * 100).toFixed(2) : Number(matchRateRaw).toFixed(2)}%`
      : '—'
  const trend = (s.trendVsPrior7d ?? {}) as Record<string, unknown>
  const trendPp = trend.matchRatePp
  const matchRateTrend =
    trendPp != null && trendPp !== ''
      ? `${Number(trendPp) >= 0 ? '+' : ''}${Number(trendPp).toFixed(2)} pp`
      : null
  const currency = String(s.currency ?? b.currency ?? 'USD')
  const totalCash = s.totalCash ?? s.postedSettledCash
  const variance = s.openBreakVariance ?? b.variance
  return {
    fundsLabel: fundName || displayLabel(s.fundName ?? s.fundId, '—'),
    openBreaks,
    unmatchedCount: Number(s.unmatchedCount ?? unmatched),
    matchedCount: Number(s.matchedCount ?? 0),
    exceptionCount: Number(s.exceptionCount ?? openBreaks),
    unreconciledValue: variance != null ? `${currency} ${formatMoneyDisplay(variance)}` : '—',
    awaitingStatements: unmatched,
    awaitingValue: totalCash != null ? `${currency} ${formatMoneyDisplay(totalCash)}` : '—',
    matchRate,
    matchRateTrend,
    totalCash: totalCash != null ? `${currency} ${formatMoneyDisplay(totalCash)}` : '—',
    available:
      s.orderEligibleAvailableCash != null
        ? `${currency} ${formatMoneyDisplay(s.orderEligibleAvailableCash)}`
        : '—',
  }
}

export function mapExceptions(data: unknown) {
  const page = unwrapPaged<ReconException>(data)
  const items = page.items.length ? page.items : unwrapList<ReconException>(data)
  return {
    ...page,
    total: page.total || items.length,
    items: items.map((e) => {
      const severityRaw = String(e.severity ?? 'Medium').toLowerCase()
      const severity =
        severityRaw === 'critical' || severityRaw === 'high'
          ? severityRaw === 'critical'
            ? 'Critical'
            : 'High'
          : severityRaw === 'low'
            ? 'Low'
            : 'Medium'
      const statusRaw = String(e.status ?? 'OPEN').toUpperCase()
      const overdueFlag = e.overdue === true
      let status:
        | 'Pending Approval'
        | 'Investigating'
        | 'Overdue'
        | 'Resolved'
        | 'Closed'
        | 'Rejected' = 'Investigating'
      if (
        statusRaw.includes('RESOLV') ||
        statusRaw.includes('APPROVED') ||
        statusRaw === 'ADJUSTED' ||
        statusRaw === 'CLOSED'
      ) {
        status = statusRaw.includes('CLOS') ? 'Closed' : 'Resolved'
      } else if (statusRaw.includes('REJECT')) {
        status = 'Rejected'
      } else if (overdueFlag) {
        status = 'Overdue'
      } else if (
        statusRaw.includes('PENDING') ||
        statusRaw.includes('PROPOSED') ||
        statusRaw.includes('APPROVAL') ||
        statusRaw === 'INFO_REQUESTED'
      ) {
        status = 'Pending Approval'
      } else if (statusRaw.includes('INVESTIGAT') || statusRaw === 'OPEN' || statusRaw === 'ASSIGNED') {
        status = 'Investigating'
      }
      const diffTxn =
        e.amountDifference ??
        e['amountTxn'] ??
        e['amountReporting'] ??
        (e['difference'] as { transaction?: { amount?: string } } | undefined)?.transaction?.amount ??
        e['diffUsd'] ??
        0
      const diffLocal =
        e['amountDifferenceLocal'] ??
        e['diffZwl'] ??
        (e['difference'] as { reporting?: { amount?: string } } | undefined)?.reporting?.amount ??
        0
      return {
        id: String(e.id ?? e['exceptionId'] ?? ''),
        severity: severity as 'Critical' | 'High' | 'Medium' | 'Low',
        cashAccountId: String(e['cashAccountId'] ?? ''),
        portfolioId: String(e['portfolioId'] ?? e['fundId'] ?? ''),
        portfolio: displayLabel(e['fundName'] ?? e['portfolioName'], '—'),
        account: cashAccountDisplayLabel({
          clientName: e['clientName'] ?? e['clientOrVehicleName'],
          name: e['cashAccountLabel'] ?? e['cashAccountName'] ?? e['accountLabel'],
          accountNumber: e['accountNumber'],
          accountNumberMasked: e['accountNumberMasked'],
        }),
        client: displayLabel(e['clientName'] ?? e['clientOrVehicleName'], '—'),
        source: String(e['source'] ?? e.category ?? '—'),
        reason: String(e['reason'] ?? e.category ?? e['title'] ?? 'Exception'),
        diffUsd: formatMoneyDisplay(diffTxn),
        diffZwl: formatMoneyDisplay(diffLocal),
        ageDays: Number(e['ageDays'] ?? 0),
        assignee: personDisplayLabel(e['assigneeName'] ?? e['assignedTo'], 'Unassigned'),
        status,
        title: String(e['title'] ?? e.category ?? 'Exception'),
        custodian: displayLabel(e['custodianName'], '—'),
        instrument: instrumentDisplayLabel(e['instrument'] ?? e['instrumentName']),
        quantity: String(e['quantity'] ?? '—'),
        tradeDate: shortDate(e['tradeDate']),
        settleDate: shortDate(e['settleDate']),
        approver: personDisplayLabel(e['approverName'] ?? e['approver'], '—'),
        version: e.version,
        raw: e,
        statusRaw,
      }
    }),
  }
}

function nestedFinite(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number(value.replace(/,/g, '').replace(/%/g, '').trim())
    return Number.isFinite(n) ? n : null
  }
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return nestedFinite(o.count ?? o.pct ?? o.value ?? o.total)
  }
  return null
}

function nestedMoney(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return nestedMoney(o.valueUsd ?? o.amount ?? o.value)
  }
  const formatted = formatMoneyDisplay(value)
  if (!formatted || /^nan$/i.test(formatted)) return '—'
  return formatted
}

function nestedPct(value: unknown): string {
  const n = nestedFinite(value)
  if (n == null) return '—'
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}%`
}

export function mapExceptionsSummary(data: Record<string, unknown> | null | undefined) {
  if (!data) {
    return {
      critical: 0,
      overdue: 0,
      pending: 0,
      stpRate: '—',
      criticalAmount: '—',
      overdueAmount: '—',
      pendingAmount: '—',
      open: 0,
      investigating: 0,
      autoConfirmed: 0,
      matchLinks: 0,
    }
  }
  const bySeverity = (data.bySeverity ?? {}) as Record<string, unknown>
  const criticalOnly =
    nestedFinite(data.criticalExceptions) ??
    nestedFinite(data.critical) ??
    nestedFinite(bySeverity.CRITICAL) ??
    0
  const high = nestedFinite(bySeverity.HIGH) ?? 0
  const medium = nestedFinite(bySeverity.MEDIUM) ?? 0
  const low = nestedFinite(bySeverity.LOW) ?? 0
  const overdue =
    nestedFinite(data.overdueApprovals) ?? nestedFinite(data.overdue) ?? 0
  const pending =
    nestedFinite(data.pendingAdjustments) ??
    nestedFinite(data.pendingApproval) ??
    nestedFinite(data.pending) ??
    0
  const openFromApi = nestedFinite(data.open)
  const open = openFromApi ?? criticalOnly + high + medium + low
  return {
    critical: criticalOnly + high,
    overdue,
    pending,
    stpRate: nestedPct(data.straightThroughMatchRate ?? data.stpRate ?? data.matchRate),
    criticalAmount: nestedMoney(data.criticalAmount ?? data.criticalExceptions),
    overdueAmount: nestedMoney(data.overdueAmount ?? data.overdueApprovals),
    pendingAmount: nestedMoney(data.pendingAmount ?? data.pendingAdjustments),
    open,
    investigating: nestedFinite(data.investigating) ?? 0,
    autoConfirmed: nestedFinite(data.autoConfirmedCount) ?? nestedFinite(data.confirmedAutoMatches) ?? 0,
    matchLinks: nestedFinite(data.matchLinkCount) ?? nestedFinite(data.allLinks) ?? 0,
  }
}

export function mapExceptionTimeline(data: unknown) {
  const mapItem = (item: Record<string, unknown>, i: number) => ({
    title: humanizeEventTitle(item.title ?? item.eventType ?? item.action, `Event ${i + 1}`),
    when: formatActivity(item.at ?? item.createdAt ?? item.when),
    who: personDisplayLabel(item.actorName ?? item.actor ?? item.who ?? item.actorId, 'System'),
    tone:
      String(item.tone ?? item.severity ?? '').toLowerCase().includes('warn') ||
      String(item.eventType ?? '').toUpperCase().includes('OVERDUE')
        ? ('amber' as const)
        : ('blue' as const),
  })
  const items = unwrapList<Record<string, unknown>>(data)
  if (!items.length && data && typeof data === 'object' && Array.isArray((data as { events?: unknown }).events)) {
    return ((data as { events: Record<string, unknown>[] }).events).map(mapItem)
  }
  return items.map(mapItem)
}

function flattenStatementMovements(sections: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(sections.movements) && sections.movements.length) {
    return sections.movements as Record<string, unknown>[]
  }
  const out: Record<string, unknown>[] = []
  for (const key of ['receipts', 'payments', 'fees', 'realisedGainsLosses']) {
    const block = sections[key]
    const items =
      block && typeof block === 'object' && Array.isArray((block as { items?: unknown }).items)
        ? ((block as { items: Record<string, unknown>[] }).items)
        : []
    for (const item of items) out.push(item)
  }
  return out
}

export function mapStatements(data: unknown) {
  const page = unwrapPaged<ClientStatement>(data)
  const items = page.items.length ? page.items : unwrapList<ClientStatement>(data)
  return {
    ...page,
    total: page.total || items.length,
    items: items.map((s) => {
      const run = (s['run'] && typeof s['run'] === 'object' ? s['run'] : {}) as Record<string, unknown>
      const periodFrom = s.periodFrom ?? run.periodFrom
      const periodTo = s.periodTo ?? run.periodTo
      const cashAccountId = String(s.cashAccountId ?? run.cashAccountId ?? '')
      const currency = String(s.currency ?? run.currency ?? 'USD')
      const statementType = String(s.statementType ?? run.statementType ?? 'PERIODIC')
      const clientOrVehicleId = String(s['clientOrVehicleId'] ?? run.clientOrVehicleId ?? '')
      const statusUpper = String(s.status ?? run.status ?? '').toUpperCase()
      let status: 'Draft' | 'Pending Approval' | 'Approved' | 'Delivered' | 'Ready for Release' | 'Released'
      if (statusUpper.includes('DELIVER')) status = 'Delivered'
      else if (statusUpper.includes('APPROV')) status = 'Approved'
      else if (statusUpper.includes('PEND')) status = 'Pending Approval'
      else if (statusUpper.includes('DRAFT')) status = 'Draft'
      else if (statusUpper.includes('RELEASE')) status = 'Released'
      else status = 'Ready for Release'
      const recipients = s['recipientCount'] ?? s['clientCount'] ?? s['investorCount']
      const sections = (s['sections'] && typeof s['sections'] === 'object'
        ? s['sections']
        : {}) as Record<string, unknown>
      const movements = flattenStatementMovements(sections)
      return {
        id: s.id,
        period: `${shortDate(periodFrom)} – ${shortDate(periodTo)}`.replace(/^— – | – —$/g, '') || '—',
        periodFrom: periodFrom != null ? String(periodFrom).slice(0, 10) : '',
        periodTo: periodTo != null ? String(periodTo).slice(0, 10) : '',
        asAt: shortDate(periodTo),
        status,
        clients: recipients != null ? String(recipients) : '—',
        investors: recipients != null ? String(recipients) : '—',
        generatedBy: personDisplayLabel(
          s['generatedByName'] ??
            s['approvedByName'] ??
            s['createdByName'] ??
            s['generatedByEmail'] ??
            s['createdByEmail'] ??
            s['generatedBy'] ??
            s['approvedBy'],
        ),
        generatedOn: formatActivity(s['generatedAt'] ?? s['createdAt']),
        version: s.version,
        cashAccountId: cashAccountId || undefined,
        account: cashAccountDisplayLabel({
          clientName: s['clientName'] ?? run.clientName ?? s['clientOrVehicleName'],
          name: s['cashAccountLabel'] ?? s['cashAccountName'] ?? run.cashAccountLabel ?? run.cashAccountName,
          accountNumber: s['accountNumber'] ?? run.accountNumber,
          accountNumberMasked: s['accountNumberMasked'] ?? run.accountNumberMasked,
        }),
        clientName: displayLabel(s['clientName'] ?? run.clientName ?? s['clientOrVehicleName'], '—'),
        clientOrVehicleId: clientOrVehicleId || undefined,
        currency,
        statementType,
        openingCash: formatMoneyDisplay(s['openingCash'] ?? 0),
        closingCash: formatMoneyDisplay(s['closingCash'] ?? 0),
        openingCashRaw: s['openingCash'] != null ? String(s['openingCash']) : undefined,
        closingCashRaw: s['closingCash'] != null ? String(s['closingCash']) : undefined,
        movementLines: movements.map((m, i) => {
          const row = (m ?? {}) as Record<string, unknown>
          return {
            label: String(row.description ?? row.label ?? row.type ?? `Movement ${i + 1}`),
            amount: formatMoneyDisplay(row.amount ?? row.credit ?? row.debit ?? 0),
          }
        }),
        raw: s,
      }
    }),
  }
}

export function mapStatementsSummary(data: Record<string, unknown> | null | undefined) {
  if (!data) {
    return {
      draft: 0,
      pendingApproval: 0,
      approved: 0,
      delivered: 0,
      ready: 0,
      total: 0,
      clientCashCovered: null as string | null,
      accountsInScope: null as number | null,
      periodMovements: null as string | null,
      pendingDelivery: 0,
    }
  }
  const draft = Number(data.draft ?? 0)
  const pendingApproval = Number(data.pendingApproval ?? 0)
  const approved = Number(data.approved ?? 0)
  const delivered = Number(data.delivered ?? 0)
  const ready = draft + pendingApproval + approved
  const total = Number(data.total ?? ready + delivered)
  return {
    draft,
    pendingApproval,
    approved,
    delivered,
    ready,
    total: total || ready + delivered,
    clientCashCovered:
      data.clientCashCovered != null || data.totalCash != null
        ? formatMoneyDisplay(data.clientCashCovered ?? data.totalCash)
        : null,
    accountsInScope:
      data.accountsInScope != null || data.accountCount != null
        ? Number(data.accountsInScope ?? data.accountCount)
        : null,
    periodMovements:
      data.periodMovements != null || data.movementTotal != null
        ? formatMoneyDisplay(data.periodMovements ?? data.movementTotal)
        : null,
    pendingDelivery: Number(data.pendingDelivery ?? draft + pendingApproval),
  }
}

function mapSideStatus(raw: unknown): 'Matched' | 'Potential' | 'Exception' | null {
  const t = String(raw ?? '').toUpperCase()
  if (!t) return null
  if (t.includes('MATCH')) return 'Matched'
  if (t.includes('EXCEPT') || t.includes('ESCALAT')) return 'Exception'
  if (t.includes('PEND') || t.includes('POTENTIAL') || t.includes('NEW')) return 'Potential'
  return 'Potential'
}

export type BrokerUiRow = {
  id: string
  internal: {
    date: string
    reference: string
    security: string
    amount: string | null
    status: 'Matched' | 'Potential' | 'Exception' | null
  }
  broker: {
    date: string
    reference: string
    security: string
    amount: string | null
    status: 'Matched' | 'Potential' | 'Exception' | null
  }
  custodian: {
    date: string
    reference: string
    security: string
    amount: string | null
    status: 'Matched' | 'Potential' | 'Exception' | null
  }
  detail?: {
    isin: string
    currency: string
    quantity: string
    price: string
    transactionType: string
    tradeDate: string
    settleDate: string
    differenceUsd: string
    assignee: string
    assigneeInitials: string
    comment?: {
      author: string
      initials: string
      when: string
      body: string
    }
  }
  overallStatus: 'Matched' | 'Potential' | 'Exception'
  difference: string
  security: string
  status: 'Matched' | 'Potential' | 'Exception'
  raw: BrokerCustodianItem
}

export function mapBrokerWorkspace(data: unknown) {
  const page = unwrapPaged<BrokerCustodianItem>(data)
  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
  const items = page.items.length
    ? page.items
    : unwrapList<BrokerCustodianItem>(root.items ?? data)
  const counts = (root.queueCounts ?? root.counts ?? {}) as Record<string, number>

  const mapped: BrokerUiRow[] = items.map((item) => {
    const overall = String(item.overallStatus ?? 'POTENTIAL').toUpperCase()
    const status: 'Matched' | 'Potential' | 'Exception' = overall.includes('MATCH')
      ? 'Matched'
      : overall.includes('EXCEPT') || overall.includes('ESCALAT') || overall.includes('NEW')
        ? overall.includes('NEW')
          ? 'Potential'
          : 'Exception'
        : 'Potential'
    const security = String(item.security ?? item['instrumentName'] ?? item['symbol'] ?? '—')
    const date = shortDate(item['tradeDate'] ?? item['settleDate'] ?? item['updatedAt'])
    const sideAmt = (key: 'internalAmount' | 'brokerAmount' | 'custodianAmount', fallbackKey: string) =>
      formatMoneyDisplay(
        item[key] ??
          item[fallbackKey] ??
          item['notional'] ??
          item['quantity'] ??
          item.difference ??
          item['differenceAmount'] ??
          0,
      )
    const side = (
      statusKey: string,
      refPrefix: string,
      amountKey: 'internalAmount' | 'brokerAmount' | 'custodianAmount',
      fallbackAmtKey: string,
      refKey: string,
    ) => ({
      date,
      reference: String(
        item[refKey as keyof BrokerCustodianItem] ??
          item[`${statusKey}Reference` as keyof BrokerCustodianItem] ??
          `${refPrefix}-${String(item.id).slice(-5)}`,
      ),
      security,
      amount: sideAmt(amountKey, fallbackAmtKey),
      status: mapSideStatus(item[statusKey as keyof BrokerCustodianItem] ?? item.overallStatus),
    })
    const assignee = String(item['assigneeName'] ?? item['assignedToId'] ?? 'Unassigned')
    const initials = assignee
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '—'
    const comments = item['comments']
    const firstComment =
      Array.isArray(comments) && comments[0] && typeof comments[0] === 'object'
        ? (comments[0] as Record<string, unknown>)
        : null

    return {
      id: item.id,
      internal: side('internalStatus', 'IL', 'internalAmount', 'internalNotional', 'internalReference'),
      broker: side('brokerStatus', 'BRK', 'brokerAmount', 'brokerNotional', 'brokerReference'),
      custodian: side('custodianStatus', 'CUS', 'custodianAmount', 'custodianNotional', 'custodianReference'),
      detail: {
        isin: String(item['instrumentIsin'] ?? item['isin'] ?? '—'),
        currency: String(item['currency'] ?? 'USD'),
        quantity: formatMoneyDisplay(item['quantity'] ?? 0),
        price: formatMoneyDisplay(item['price'] ?? 0),
        transactionType: String(item['transactionType'] ?? '—'),
        tradeDate: shortDate(item['tradeDate']),
        settleDate: shortDate(item['settleDate']),
        differenceUsd: formatMoneyDisplay(item.difference ?? item['differenceAmount'] ?? item['differenceUsd'] ?? 0),
        assignee,
        assigneeInitials: initials,
        comment: firstComment
          ? {
              author: String(firstComment.authorName ?? firstComment.author ?? 'Analyst'),
              initials: String(firstComment.initials ?? 'AN'),
              when: formatActivity(firstComment.at ?? firstComment.createdAt),
              body: String(firstComment.body ?? firstComment.text ?? ''),
            }
          : undefined,
      },
      overallStatus: status,
      difference: formatMoneyDisplay(item.difference ?? item['differenceAmount'] ?? item['differenceUsd'] ?? 0),
      security,
      status,
      raw: item,
    }
  })

  const queueCounts = {
    new: Number(counts.new ?? 0),
    potential: Number(counts.potential ?? mapped.filter((r) => r.overallStatus === 'Potential').length),
    matched: Number(counts.matched ?? mapped.filter((r) => r.overallStatus === 'Matched').length),
    exception: Number(counts.exception ?? mapped.filter((r) => r.overallStatus === 'Exception').length),
    escalated: Number(counts.escalated ?? mapped.filter((r) => String(r.raw.overallStatus).toUpperCase().includes('ESCALAT')).length),
    total: Number(counts.total ?? page.total ?? mapped.length),
  }

  return {
    ...page,
    total: queueCounts.total,
    items: mapped,
    counts: queueCounts,
  }
}

export function buildBrokerQueueColumns(
  rows: BrokerUiRow[],
  counts: { new: number; potential: number; matched: number; exception: number; escalated: number },
) {
  const take = (pred: (r: BrokerUiRow) => boolean, count: number, accent: string, tint: string, label: string, id: string) => {
    const cards = rows.filter(pred).slice(0, 3).map((r) => ({
      id: r.id,
      security: r.internal.security,
      reference: r.internal.reference,
      date: r.internal.date,
      amount: r.internal.amount ?? '0.00',
    }))
    const more = Math.max(0, count - cards.length)
    return {
      id,
      label,
      count: String(count),
      accent,
      tint,
      more: more > 0 ? `+ ${more} more` : '+ 0 more',
      cards,
    }
  }
  return [
    take(() => false, counts.new, '#3B82F6', 'rgba(59,130,246,0.06)', 'New', 'new'),
    take((r) => r.overallStatus === 'Potential', counts.potential, '#38BDF8', 'rgba(56,189,248,0.06)', 'Potential Match', 'potential'),
    take((r) => r.overallStatus === 'Matched', counts.matched, '#22C55E', 'rgba(34,197,94,0.06)', 'Matched', 'matched'),
    take((r) => r.overallStatus === 'Exception', counts.exception, '#F59E0B', 'rgba(245,158,11,0.07)', 'Exception', 'exception'),
    take(
      (r) => String(r.raw.overallStatus).toUpperCase().includes('ESCALAT'),
      counts.escalated,
      '#EF4444',
      'rgba(239,68,68,0.07)',
      'Escalated',
      'escalated',
    ),
  ]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OPAQUE_ID_RE = /^(cm[a-z]?_|cca_|creb_|cimp_|cjl_|cjnl_|ccst_|usr_|prov_|clay_)/i
/** Prisma/cuid style: e.g. cmrsujspx008tunlofkog32jx */
const CUID_LIKE_RE = /^c[a-z0-9]{20,}$/i

/** True when a value looks like a DB / opaque identifier rather than a human label. */
export function isOpaqueId(value: unknown): boolean {
  if (value == null || value === '') return false
  const s = String(value).trim()
  if (!s) return false
  if (UUID_RE.test(s)) return true
  if (OPAQUE_ID_RE.test(s)) return true
  if (CUID_LIKE_RE.test(s)) return true
  if (/^[a-z]{2,5}_[0-9a-z]{6,}$/i.test(s)) return true
  return s.length >= 24 && !/\s/.test(s) && /^[a-z0-9_-]+$/i.test(s)
}

/** Prefer a readable label; hide opaque ids from UI surfaces. */
export function displayLabel(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return displayLabel(
      o.name ?? o.fullName ?? o.displayName ?? o.label ?? o.email ?? o.symbol ?? o.ticker ?? o.accountNumber,
      fallback,
    )
  }
  const s = String(value).trim()
  return isOpaqueId(s) ? fallback : s
}

/** Prefer a person name/email; hide opaque user ids. */
export function personDisplayLabel(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return displayLabel(o.name ?? o.fullName ?? o.email ?? o.displayName, fallback)
  }
  return displayLabel(value, fallback)
}

/** Instrument / security label from string or nested object. */
export function instrumentDisplayLabel(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return displayLabel(o.name ?? o.instrumentName ?? o.symbol ?? o.ticker ?? o.isin, fallback)
  }
  return displayLabel(value, fallback)
}

export function humanizeEventTitle(value: unknown, fallback = 'Event'): string {
  if (value == null || value === '') return fallback
  const s = String(value).trim()
  if (!s) return fallback
  if (isOpaqueId(s)) return fallback
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolvePortfolioName(
  id: unknown,
  portfolios: { id: string; name: string }[],
  fallback = '—',
): string {
  if (id == null || id === '') return fallback
  const s = String(id)
  const hit = portfolios.find((p) => p.id === s)
  if (hit?.name) return hit.name
  return displayLabel(s, fallback)
}

export function resolveCashAccountLabel(
  id: unknown,
  accounts: { id: string; label: string }[],
  fallback = '—',
): string {
  if (id == null || id === '') return fallback
  const s = String(id)
  const hit = accounts.find((a) => a.id === s)
  if (hit?.label && !isOpaqueId(hit.label) && !isMaskedAccountLabel(hit.label)) return hit.label
  return displayLabel(s, fallback)
}

/** Seeded masks like ****FUND / ****TRADING — not useful as a picker label. */
export function isMaskedAccountLabel(value: unknown): boolean {
  const s = String(value ?? '').trim()
  if (!s) return true
  if (/^\*+[A-Z][A-Z0-9_]*$/i.test(s)) return true
  if (/^[•]+[A-Z][A-Z0-9_]*$/i.test(s)) return true
  return false
}

function cashPurposeLabel(value: unknown): string {
  const s = String(value ?? '').trim().toUpperCase()
  if (!s) return ''
  const map: Record<string, string> = {
    FUND_CASH: 'Fund cash',
    TRADING_CASH: 'Trading cash',
    FUND: 'Fund cash',
    TRADING: 'Trading cash',
    OMNIBUS: 'Fund cash',
    CLIENT: 'Client cash',
    CUSTODY: 'Custody cash',
  }
  if (map[s]) return map[s]
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Human label for a cash account row — never falls back to a DB id or ****FUND mask. */
export function cashAccountDisplayLabel(a: {
  accountNumber?: unknown
  accountNumberMasked?: unknown
  maskedIdentifier?: unknown
  clientName?: unknown
  clientOrVehicleName?: unknown
  name?: unknown
  label?: unknown
  moneyClass?: unknown
  accountType?: unknown
  accountPurpose?: unknown
  currency?: unknown
  baseCurrency?: unknown
}): string {
  const client = displayLabel(a.clientName ?? a.clientOrVehicleName, '')
  if (client && !isMaskedAccountLabel(client)) return client

  const named = displayLabel(a.name ?? a.label, '')
  if (named && !isMaskedAccountLabel(named) && !isOpaqueId(named)) return named

  const purpose = cashPurposeLabel(a.moneyClass ?? a.accountPurpose ?? a.accountType)
  const ccy = displayLabel(a.currency ?? a.baseCurrency, '')
  if (purpose) return ccy ? `${purpose} · ${ccy}` : purpose

  const number = displayLabel(
    a.accountNumber ?? a.accountNumberMasked ?? a.maskedIdentifier,
    '',
  )
  if (number && !isMaskedAccountLabel(number)) return number
  return 'Cash account'
}

/** Map listClientCashAccounts payload into id/label options for resolveCashAccountLabel. */
export function mapCashAccountOptions(data: unknown): { id: string; label: string }[] {
  return unwrapList<Record<string, unknown>>(data)
    .map((a) => ({
      id: String(a.id ?? ''),
      label: cashAccountDisplayLabel(a),
    }))
    .filter((a) => a.id)
}

export function formatBatchLabel(
  batch: {
    periodFrom?: unknown
    periodTo?: unknown
    currency?: unknown
    status?: unknown
    cashAccountId?: unknown
  },
  accountLabel?: string,
): string {
  const from = shortDate(batch.periodFrom)
  const to = shortDate(batch.periodTo)
  const period = from !== '—' && to !== '—' ? `${from} – ${to}` : from !== '—' ? from : to
  const parts = [period !== '—' ? period : null, batch.currency ? String(batch.currency) : null, accountLabel]
    .filter(Boolean)
    .join(' · ')
  const status = batch.status ? String(batch.status).replace(/_/g, ' ') : ''
  return parts ? `${parts}${status ? ` (${status})` : ''}` : status || 'Reconciliation batch'
}

export function formatWorkspaceLineRef(
  description: unknown,
  id: unknown,
  index?: number,
): string {
  const desc = String(description ?? '').trim()
  if (desc && desc !== '—' && !isOpaqueId(desc)) return desc
  if (index != null) return `Line ${index + 1}`
  return displayLabel(id, 'Entry')
}

export function mapActiveReconciliationRules(data: unknown): { label: string; mode: string }[] {
  if (!data || typeof data !== 'object') return []
  const root = data as Record<string, unknown>
  const policy = (root.matchWeightPolicy ?? root.policy) as Record<string, unknown> | undefined
  const hardRules = unwrapList<string>(root.hardRules ?? root.rules)
  const rows: { label: string; mode: string }[] = []

  if (policy) {
    const auto = policy.autoMatchThreshold
    const suggest = policy.suggestThreshold
  if (auto != null) {
      rows.push({
        label: 'Auto-match threshold',
        mode: `${Number(auto) <= 1 ? Math.round(Number(auto) * 100) : Number(auto)}%`,
      })
    }
    if (suggest != null) {
      rows.push({
        label: 'Suggest threshold',
        mode: `${Number(suggest) <= 1 ? Math.round(Number(suggest) * 100) : Number(suggest)}%`,
      })
    }
    if (policy.dateToleranceDays != null) {
      rows.push({ label: 'Date tolerance', mode: `${policy.dateToleranceDays} days` })
    }
    if (policy.amountTolerance != null) {
      rows.push({ label: 'Amount tolerance', mode: String(policy.amountTolerance) })
    }
  }

  for (const rule of hardRules) {
    const label = String(rule)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
    rows.push({ label, mode: 'Hard rule' })
  }

  const list = unwrapList<Record<string, unknown>>(data)
  if (!rows.length && list.length) {
    return list.map((r) => ({
      label: String(r.name ?? r.label ?? r.ruleKey ?? 'Rule'),
      mode: String(r.mode ?? r.action ?? (r.autoMatch ? 'Auto-match' : 'Review')),
    }))
  }

  return rows
}

export function formatValuationRunLabel(run: {
  id?: string
  asOf?: string | null
  status?: string | null
  parametersJson?: { costBasisMethod?: string } | null
}): string {
  const date = formatActivity(run.asOf).split(',')[0] || shortDate(run.asOf)
  const method = run.parametersJson?.costBasisMethod
  const status = run.status ? formatStatusLabel(run.status) : null
  const parts = [date !== '—' ? date : null, method, status].filter(Boolean)
  return parts.length ? parts.join(' · ') : displayLabel(run.id, 'Valuation run')
}

function formatStatusLabel(raw: string) {
  return String(raw)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export type { OpsPaged }
