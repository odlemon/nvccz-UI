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

export function opsErrorMessage(err: unknown, fallback = 'Request failed') {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message)
  return fallback
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
      accountNumber: String(a.accountNumber ?? a.id),
      clientName: String(a.clientName ?? a['clientOrVehicleName'] ?? '—'),
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

function formatActivity(value: unknown) {
  if (value == null || value === '') return '—'
  const s = String(value)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
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
  const s = String(value)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.slice(0, 10)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapLedgerType(raw: unknown): 'Receipt' | 'Payment' | 'Transfer' {
  const t = String(raw ?? '').toUpperCase()
  if (t.includes('RECEIPT') || t.includes('CREDIT') || t.includes('INFLOW') || t.includes('DIVIDEND')) return 'Receipt'
  if (t.includes('PAYMENT') || t.includes('DEBIT') || t.includes('OUTFLOW') || t.includes('FEE')) return 'Payment'
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
      client: String(r['clientName'] ?? '—'),
      account: String(r['accountNumber'] ?? r.cashAccountId ?? '—'),
      cashAccount: String(r['cashAccountName'] ?? r.cashAccountId ?? '—'),
      bank: String(r['providerName'] ?? r['bankName'] ?? '—'),
      type: mapLedgerType(r.type),
      description: String(r.description ?? '—'),
      debit: r.debit && r.debit !== '0' && r.debit !== '0.00' ? formatMoneyDisplay(r.debit) : '—',
      credit: r.credit && r.credit !== '0' && r.credit !== '0.00' ? formatMoneyDisplay(r.credit) : '—',
      balance: formatMoneyDisplay(bal),
      currency: String(r.currency ?? 'USD'),
      approval: mapApproval(r.approvalStatus ?? r.status),
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

export type FundWorkspaceEntry = { id: string; date: string; description: string; amount: number }
export type FundBreakRow = { id: string; date: string; type: string; details: string; amount: number }
export type FundSuggestion = {
  internal: string
  bank: string
  reason: string
  confidence: number
  internalLineId?: string
  externalLineId?: string
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
    }
  }

  const flatInternal = unwrapList(data.unmatchedInternal)
  const flatExternal = unwrapList(data.unmatchedExternal)
  const nestedInternal = unwrapList(data.internal)
  const nestedExternal = unwrapList(data.external)
  const internal = (flatInternal.length ? flatInternal : nestedInternal).map(mapEntry)
  const external = (flatExternal.length ? flatExternal : nestedExternal).map(mapEntry)

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
      details: `${r.internalLineId ?? '—'} ↔ ${r.externalLineId ?? '—'}`,
      amount: Number(String(r.matchedAmount ?? 0).replace(/,/g, '')) || 0,
    }
  })
  const suggestions = unwrapList(data.suggested).map((row) => {
    const r = (row ?? {}) as Record<string, unknown>
    const score = Number(r.scoreTotal ?? r.confidence ?? 0)
    const confidence = score <= 1 ? Math.round(score * 100) : Math.round(score)
    return {
      internal: String(r.internalLineId ?? '—'),
      bank: String(r.externalLineId ?? '—'),
      reason: String(r.reason ?? 'Suggested match'),
      confidence,
      internalLineId: r.internalLineId != null ? String(r.internalLineId) : undefined,
      externalLineId: r.externalLineId != null ? String(r.externalLineId) : undefined,
    }
  })

  return {
    internal,
    external,
    breaks,
    matched,
    unmatched: [
      ...internal.map((e) => ({
        id: e.id,
        date: e.date,
        type: 'Unmatched Internal',
        details: e.description,
        amount: e.amount,
      })),
      ...external.map((e) => ({
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
    unmatchedCount: internal.length + external.length,
  }
}

export function mapFundSummaryKpis(
  summary: FundCashSummary | null | undefined,
  batchSummary?: Record<string, unknown> | null,
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
    fundsLabel: s.fundId ? String(s.fundId) : '—',
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
      let status: 'Pending Approval' | 'Investigating' | 'Overdue' = 'Investigating'
      if (overdueFlag) {
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
        account: String(e['accountNumber'] ?? e['cashAccountId'] ?? '—'),
        client: String(e['clientName'] ?? e['clientOrVehicleId'] ?? '—'),
        source: String(e['source'] ?? e.category ?? '—'),
        reason: String(e['reason'] ?? e.category ?? e['title'] ?? 'Exception'),
        diffUsd: formatMoneyDisplay(diffTxn),
        diffZwl: formatMoneyDisplay(diffLocal),
        ageDays: Number(e['ageDays'] ?? 0),
        assignee: String(e['assigneeName'] ?? e['assignedTo'] ?? e.assignedToId ?? '—'),
        status,
        title: String(e['title'] ?? e.category ?? 'Exception'),
        custodian: String(e['custodianName'] ?? '—'),
        instrument: String(e['instrument'] ?? e['instrumentName'] ?? '—'),
        quantity: String(e['quantity'] ?? '—'),
        tradeDate: shortDate(e['tradeDate']),
        settleDate: shortDate(e['settleDate']),
        approver: String(e['approverName'] ?? e['approver'] ?? e['approverId'] ?? '—'),
        version: e.version,
        raw: e,
      }
    }),
  }
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
    }
  }
  const bySeverity = (data.bySeverity ?? {}) as Record<string, number>
  const critical = Number(
    data.criticalExceptions ?? data.critical ?? bySeverity.CRITICAL ?? 0,
  )
  const overdue = Number(data.overdueApprovals ?? data.overdue ?? 0)
  const pending = Number(data.pendingAdjustments ?? data.pendingApproval ?? data.pending ?? 0)
  const stpRaw = data.straightThroughMatchRate ?? data.stpRate ?? data.matchRate
  return {
    critical,
    overdue,
    pending,
    stpRate: stpRaw != null && stpRaw !== '' ? `${Number(stpRaw).toFixed(2)}%` : '—',
    criticalAmount:
      data.criticalAmount != null && data.criticalAmount !== ''
        ? formatMoneyDisplay(data.criticalAmount)
        : '—',
    overdueAmount:
      data.overdueAmount != null && data.overdueAmount !== ''
        ? formatMoneyDisplay(data.overdueAmount)
        : '—',
    pendingAmount:
      data.pendingAmount != null && data.pendingAmount !== ''
        ? formatMoneyDisplay(data.pendingAmount)
        : '—',
    open: Number(data.open ?? 0),
    investigating: Number(data.investigating ?? 0),
  }
}

export function mapExceptionTimeline(data: unknown) {
  const items = unwrapList<Record<string, unknown>>(data)
  if (!items.length && data && typeof data === 'object' && Array.isArray((data as { events?: unknown }).events)) {
    return ((data as { events: Record<string, unknown>[] }).events).map((item, i) => ({
      title: String(item.title ?? item.eventType ?? item.action ?? `Event ${i + 1}`),
      when: formatActivity(item.at ?? item.createdAt ?? item.when),
      who: String(item.actorName ?? item.actorId ?? item.who ?? 'System'),
      tone: String(item.tone ?? item.severity ?? '').toLowerCase().includes('warn') ||
        String(item.eventType ?? '').toUpperCase().includes('OVERDUE')
        ? ('amber' as const)
        : ('blue' as const),
    }))
  }
  return items.map((item, i) => ({
    title: String(item.title ?? item.eventType ?? item.action ?? `Event ${i + 1}`),
    when: formatActivity(item.at ?? item.createdAt ?? item.when),
    who: String(item.actorName ?? item.actorId ?? item.who ?? 'System'),
    tone: String(item.tone ?? '').toLowerCase().includes('amber') ? ('amber' as const) : ('blue' as const),
  }))
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
      const status =
        statusUpper.includes('DELIVER') || statusUpper.includes('APPROV') || statusUpper.includes('RELEASE')
          ? ('Released' as const)
          : ('Ready for Release' as const)
      const recipients = s['recipientCount'] ?? s['clientCount'] ?? s['investorCount']
      const sections = (s['sections'] && typeof s['sections'] === 'object'
        ? s['sections']
        : {}) as Record<string, unknown>
      const movements = Array.isArray(sections.movements) ? sections.movements : []
      return {
        id: s.id,
        period: `${shortDate(periodFrom)} – ${shortDate(periodTo)}`.replace(/^— – | – —$/g, '') || '—',
        periodFrom: periodFrom != null ? String(periodFrom) : '',
        periodTo: periodTo != null ? String(periodTo) : '',
        asAt: shortDate(periodTo),
        status,
        clients: recipients != null ? String(recipients) : '—',
        investors: recipients != null ? String(recipients) : '—',
        generatedBy: String(s['generatedByName'] ?? s['approvedById'] ?? '—'),
        generatedOn: formatActivity(s['generatedAt'] ?? s['createdAt']),
        version: s.version,
        cashAccountId: cashAccountId || undefined,
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

export type { OpsPaged }
