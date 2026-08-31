import type {
  Pv11CapitalCall,
  Pv11CashAccount,
  Pv11CashJournal,
  Pv11CashReservation,
  Pv11Company,
  Pv11DashboardCharts,
  Pv11DashboardMetrics,
  Pv11Deal,
  Pv11Document,
  Pv11Exception,
  Pv11Fund,
  Pv11Lp,
  Pv11MailerList,
  Pv11Report,
  Pv11ReportVaultItem,
  Pv11ReconciliationBatch,
  Pv11SignatureEnvelope,
  Pv11StatementImport,
} from './types'

const COLORS = ['#4778bc', '#0a9e73', '#2563eb', '#f29a1f', '#dc3f72', '#0c879f', '#111827']

function num(v: unknown, fallback = 0): number {
  if (v == null || v === '') return fallback
  const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : fallback
}

function fmtDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysBetween(from: unknown): number {
  if (!from) return 0
  const start = new Date(String(from)).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(0, Math.round((Date.now() - start) / 86400000))
}

const STAGE_MAP: Record<string, string> = {
  DRAFT: 'Sourcing',
  SUBMITTED: 'Screening',
  UNDER_REVIEW: 'Initial Review',
  INITIAL_SCREENING: 'Screening',
  SCREENING_PENDING: 'Screening',
  SCREENING: 'Screening',
  SHORTLISTED: 'Initial Review',
  IC_PENDING: 'Investment Committee',
  INVESTMENT_COMMITTEE: 'Investment Committee',
  UNDER_BOARD_REVIEW: 'Investment Committee',
  BOARD_APPROVED: 'Term Sheet',
  BOARD_CONDITIONAL: 'Term Sheet',
  BOARD_REJECTED: 'Rejected',
  ACTIVE_DD: 'Due Diligence',
  DUE_DILIGENCE: 'Due Diligence',
  DUE_DILIGENCE_COMPLETED: 'Due Diligence',
  TERM_SHEET: 'Term Sheet',
  TERM_SHEET_ISSUED: 'Term Sheet',
  TERM_SHEET_NEGOTIATION: 'Term Sheet',
  APPROVED: 'Term Sheet',
  INVESTMENT_IMPLEMENTATION: 'Portfolio',
  DISBURSEMENT: 'Portfolio',
  DISBURSED: 'Portfolio',
  FUNDED: 'Portfolio',
  PORTFOLIO: 'Portfolio',
  PORTFOLIO_MANAGEMENT: 'Portfolio',
  ACTIVE: 'Portfolio',
  REJECTED: 'Rejected',
  REJECTED_SCREENING: 'Rejected',
  AUTO_REJECTED: 'Rejected',
  BELOW_THRESHOLD: 'Rejected',
  DECLINED: 'Rejected',
  WITHDRAWN: 'Rejected',
}

export function adaptFunds(raw: any[]): Pv11Fund[] {
  return (raw || []).map((f, i) => {
    const commitment = num(f.totalAmount ?? f.commitment)
    const remaining = num(f.remainingAmount, commitment)
    const called = Math.max(0, commitment - remaining)
    const fee = num(f.managementFeeRate)
    const carry = num(f.carryRate)
    const hurdle = num(f.hurdleRate)
    return {
      id: String(f.id),
      name: String(f.name || 'Fund'),
      vintage: f.createdAt ? new Date(f.createdAt).getFullYear() : new Date().getFullYear(),
      strategy: Array.isArray(f.focusIndustries) && f.focusIndustries.length
        ? String(f.focusIndustries[0])
        : String(f.fundPurpose || f.strategy || 'Private Equity'),
      currency: String(f.currencyCode || f.currency || 'USD'),
      commitment,
      called,
      nav: remaining,
      distributed: 0,
      grossIrr: 0,
      netIrr: 0,
      tvpi: commitment > 0 ? remaining / commitment : 0,
      dpi: 0,
      status: String(f.status || 'OPEN') === 'OPEN' ? 'Investing' : String(f.status || 'Investing'),
      geography: '—',
      managementFee: fee ? `${(fee * (fee < 1 ? 100 : 1)).toFixed(1)}%` : '—',
      carry: carry
        ? `${(carry * (carry < 1 ? 100 : 1)).toFixed(0)}%${hurdle ? ` above ${(hurdle * (hurdle < 1 ? 100 : 1)).toFixed(0)}% hurdle` : ''}`
        : '—',
      _colorIndex: i,
    } as Pv11Fund
  })
}

export function adaptCompanies(raw: any[], dashboardSummary: any[] = []): Pv11Company[] {
  if (raw?.length) {
    return raw.map((c, i) => {
      const invested = num(c.totalInvested ?? c.totalInvestmentCost ?? c.invested)
      const fair = num(c.fairMarketValue ?? c.fairValue ?? c.currentValue, invested)
      return {
        id: String(c.id),
        name: String(c.name || 'Company'),
        sector: String(c.industry || c.mainIndustry || c.sector || '—'),
        stage: String(c.status || 'ACTIVE'),
        entry: fmtDate(c.startDate || c.createdAt),
        invested,
        fairValue: fair,
        ownership: num(c.currentOwnership ?? c.ownership),
        revenueGrowth: num(c.revenueGrowth),
        runway: num(c.runway, 12),
        health: Math.min(100, Math.max(40, Math.round(60 + (fair - invested) / Math.max(invested, 1) * 10))),
        boardDate: '—',
        lastReport: fmtDate(c.updatedAt),
        fund: String(c.fund?.name || c.fundName || '—'),
        city: String(c.address || '—'),
        revenue: [],
        ebitda: [],
        arr: num(c.totalRevenue),
        margin: 0,
        nrr: 0,
        clients: 0,
        esg: [70, 70, 70],
        color: COLORS[i % COLORS.length],
      }
    })
  }
  return (dashboardSummary || []).map((s, i) => {
    const invested = num(s.totalInvestmentCost ?? s.currentInvestmentCost)
    const fair = num(s.fairMarketValue, invested)
    return {
      id: String(s.companyId || s.id || `CO-${i + 1}`),
      name: String(s.name || 'Company'),
      sector: String(s.mainIndustry || '—'),
      stage: 'Growth',
      entry: '—',
      invested,
      fairValue: fair,
      ownership: num(s.currentOwnership),
      revenueGrowth: 0,
      runway: 12,
      health: Math.min(100, Math.max(40, Math.round(50 + num(s.grossIRR)))),
      boardDate: '—',
      lastReport: '—',
      fund: '—',
      city: '—',
      revenue: [],
      ebitda: [],
      arr: num(s.totalRevenue),
      margin: 0,
      nrr: 0,
      clients: 0,
      esg: [70, 70, 70],
      color: COLORS[i % COLORS.length],
    }
  })
}

export function adaptDeals(raw: any[]): Pv11Deal[] {
  return (raw || []).map((a) => {
    const stageKey = String(a.currentStage || a.status || '').toUpperCase()
    const stage = STAGE_MAP[stageKey] || 'Screening'
    const score = num(a.screeningScore ?? a.initialScreeningScore ?? a.dueDiligenceScore ?? a.applicationProgress, 50)
    const analyst = a.assignedAnalyst
    const owner =
      a.assignedAnalystName ||
      (analyst ? `${analyst.firstName || ''} ${analyst.lastName || ''}`.trim() : '') ||
      a.applicantName ||
      'Unassigned'
    return {
      id: String(a.id),
      applicationId: String(a.id),
      name: String(a.businessName || a.applicantName || 'Deal'),
      sector: String(a.industry || '-'),
      round: String(a.businessStage || '-'),
      amount: num(a.requestedAmount),
      owner: String(owner),
      age: daysBetween(a.submittedAt || a.createdAt),
      priority: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low',
      stage,
      score: Math.min(100, Math.round(score)),
      fund: String(a.fund?.name || 'Unassigned fund'),
      featured: stage === 'Due Diligence',
      progress: optionalProgress(a.applicationProgress),
      hasDueDiligence: Boolean(a.hasDueDiligence || a.dueDiligenceReview?.id),
      hasTermSheet: Boolean(a.hasTermSheet || a.termSheet?.id),
      hasBoardReview: Boolean(a.hasBoardReview || a.boardReview?.id),
    }
  })
}

function optionalProgress(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function adaptCapitalCalls(
  rows: Array<{ fundId: string; fundName: string; call: any }>,
): Pv11CapitalCall[] {
  return rows.map(({ fundId, fundName, call }) => {
    const allocations = call.allocations || []
    const amount = allocations.length
      ? allocations.reduce((s: number, a: any) => s + num(a.currentCallAmount), 0)
      : num(call.callPercent) // placeholder when detail not loaded
    const collected = allocations.reduce((s: number, a: any) => s + num(a.amountPaid), 0)
    return {
      id: String(call.id),
      fundId,
      fund: fundName,
      callDate: fmtDate(call.transactionDate || call.createdAt),
      dueDate: fmtDate(call.paymentDueDate),
      purpose: 'Capital call',
      amount: amount || num(call.callPercent),
      lpCount: num(call._count?.allocations, allocations.length),
      collected,
      status: String(call.statusLabel || call.status || 'Draft'),
      approval: call.noticesSentAt ? 'Issued' : String(call.statusLabel || call.status || 'Draft'),
    }
  })
}

export function adaptLps(raw: any[]): Pv11Lp[] {
  return (raw || []).map((c, i) => {
    const commitment = num(c.totalCommitment ?? c.commitment ?? c.commitments?.[0]?.amount)
    const called = num(c.cumulativeCalled ?? c.called)
    return {
      id: String(c.id),
      name: String(c.legalName || c.name || 'LP'),
      type: String(c.type || c.investorType || 'Institutional'),
      geography: String(c.country || c.geography || '—'),
      commitment,
      called,
      distributed: num(c.distributed),
      netIrr: num(c.netIrr),
      owner: String(c.relationshipManager || '—'),
      lastInteraction: fmtDate(c.updatedAt || c.createdAt),
      kyc: String(c.kycStatus || c.kyc || 'In Review'),
      portal: c.userId || c.linkedUserId ? 'Active' : 'Inactive',
      unfunded: Math.max(0, commitment - called),
      tvpi: num(c.tvpi, commitment > 0 ? called / commitment : 0),
      dpi: num(c.dpi),
      color: COLORS[i % COLORS.length],
    }
  })
}

export function adaptReports(raw: any[], fundNameById: Record<string, string> = {}): Pv11Report[] {
  return (raw || []).map((r) => ({
    id: String(r.id),
    type: String(r.name || r.reportType || r.type || 'Report'),
    fund: fundNameById[r.fundId] || String(r.fundName || r.fund || '—'),
    entity: String(r.entityName || r.entity || fundNameById[r.fundId] || '—'),
    owner: String(r.ownerName || r.createdByName || '—'),
    frequency: String(r.frequency || r.cadence || 'Quarterly'),
    due: fmtDate(r.nextDueDate || r.dueDate || r.due),
    status: String(r.status || 'Not Started'),
    progress: num(r.progress, r.status === 'COMPLETED' ? 100 : r.status === 'IN_PROGRESS' ? 50 : 0),
    channel: String(r.channel || 'Portal'),
  }))
}

export function adaptDocuments(raw: any[]): Pv11Document[] {
  return (raw || []).map((d) => {
    const title = String(d.title || d.fileName || d.name || 'Document')
    const ext = (title.split('.').pop() || 'PDF').toUpperCase()
    return {
      id: String(d.id),
      folder: String(d.documentType || d.folder || d.category || 'General'),
      name: title,
      type: ext.length <= 5 ? ext : 'FILE',
      version: String(d.versionLabel || d.version || 'v1.0'),
      owner: String(d.uploadedByName || d.owner || '—'),
      uploaded: fmtDate(d.createdAt || d.uploadedAt || d.updatedAt),
      status: String(d.status || 'Verified'),
      access: 'Internal',
      classification: 'Internal confidential',
      signatureStatus: 'Not required',
      retention: 'Fund life + 10 years',
      size: d.fileSize ? `${Math.max(1, Math.round(num(d.fileSize) / 1024))} KB` : '—',
      pages: 1,
    }
  })
}

export function adaptCashAccounts(raw: any[]): Pv11CashAccount[] {
  return (raw || []).map((a) => {
    const settled = num(a.postedSettledCash ?? a.settledBalance ?? a.balance ?? a.settled)
    const reserved = num(a.activeReservations ?? a.reserved)
    const held = num(a.held)
    const acct = String(a.accountNumber || a.id || '')
    return {
      id: String(a.id),
      fund: String(a.fundName || a.clientName || a.portfolioName || '—'),
      vehicle: String(a.vehicleName || a.clientName || a.accountName || 'Main'),
      purpose: String(a.accountPurpose || a.accountType || a.purpose || 'FUND_OPERATING_BANK'),
      provider: String(a.providerName || a.provider || '—'),
      masked: acct ? `••••${acct.slice(-4)}` : '••••',
      currency: String(a.baseCurrency || a.currency || 'USD'),
      ownership: String(a.ownership || 'SEGREGATED'),
      status: String(a.status || 'ACTIVE'),
      posted: settled + held,
      settled,
      reserved,
      held,
      expectedIn: num(a.expectedIn),
      expectedOut: num(a.expectedOut),
      deployable: Math.max(0, settled - reserved),
      distributable: Math.max(0, settled - reserved - held),
      reconHealth: num(a.reconHealth ?? a.matchRate, 100),
      lastStatement: fmtDate(a.lastStatementDate || a.updatedAt),
      tolerance: num(a.tolerance, 100),
      gl: String(a.glAccount || a.gl || 'Cash Control'),
    }
  })
}

export function adaptCashJournals(raw: any[]): Pv11CashJournal[] {
  return (raw || []).map((j) => {
    const debit = num(j.debit ?? j.debitAmount)
    const credit = num(j.credit ?? j.creditAmount)
    const signed = num(j.signedCashAmount ?? j.signed, credit - debit)
    return {
      id: String(j.id || j.lineId),
      source: String(j.tradeId || j.sourceRef || j.journalId || '—'),
      event: String(j.type || j.description || j.event || 'Cash movement'),
      account: String(j.cashAccountId || j.accountId || '—'),
      fund: String(j.portfolioId || j.fundId || '—'),
      valueDate: fmtDate(j.valueDate || j.postedAt),
      debit: debit || Math.abs(Math.min(0, signed)),
      credit: credit || Math.abs(Math.max(0, signed)),
      signed,
      status: String(j.status || j.approvalStatus || 'POSTED'),
      reconciled: num(j.reconciledAmount, Math.abs(signed)),
      accounting: String(j.glExportStatus || 'Pending export'),
      maker: String(j.makerName || j.createdBy || '—'),
      checker: String(j.checkerName || '—'),
    }
  })
}

export function adaptCashReservations(raw: any[]): Pv11CashReservation[] {
  return (raw || []).map((r) => ({
    id: String(r.id),
    source: String(r.sourceRef || r.tradeId || r.source || '—'),
    fund: String(r.fundName || r.portfolioId || '—'),
    vehicle: String(r.vehicleName || '—'),
    account: String(r.cashAccountId || r.accountId || '—'),
    beneficiary: String(r.beneficiary || r.counterparty || '—'),
    amount: num(r.amount ?? r.reservedAmount),
    remaining: num(r.remainingAmount ?? r.remaining, num(r.amount)),
    required: fmtDate(r.requiredBy || r.valueDate),
    expiry: fmtDate(r.expiresAt || r.expiry),
    purpose: String(r.purpose || r.reservationType || 'OTHER'),
    status: String(r.status || 'ACTIVE'),
    owner: String(r.ownerName || r.createdBy || '—'),
    approval: String(r.approvalStatus || r.status || '—'),
  }))
}

export function adaptStatementImports(raw: any[]): Pv11StatementImport[] {
  return (raw || []).map((imp) => {
    const opening = num(imp.controlOpening ?? imp.openingBalance)
    const closing = num(imp.controlClosing ?? imp.closingBalance)
    return {
      id: String(imp.id),
      provider: String(imp.providerName || imp.providerId || '—'),
      account: String(imp.cashAccountId || '—'),
      period: '—',
      filename: String(imp.fileName || 'statement'),
      lines: num(imp.lineCount ?? imp.stagedLineCount),
      opening,
      movements: closing - opening,
      closing,
      status: String(imp.status || 'STAGED'),
      errors: num(imp.errorCount),
      warnings: num(imp.warningCount),
      duplicate: 'Clear',
      received: fmtDate(imp.createdAt),
      parser: String(imp.layoutId || '—'),
    }
  })
}

export function adaptReconciliationBatches(raw: any[]): Pv11ReconciliationBatch[] {
  return (raw || []).map((b) => ({
    id: String(b.id),
    account: String(b.cashAccountId || b.accountId || '—'),
    fund: String(b.fundId || b.portfolioId || '—'),
    currency: String(b.currency || 'USD'),
    period: b.periodFrom ? `${fmtDate(b.periodFrom)} – ${fmtDate(b.periodTo)}` : '—',
    opening: num(b.openingBalance),
    internal: num(b.internalBalance ?? b.internal),
    external: num(b.externalBalance ?? b.external),
    adjusted: num(b.adjustedBalance ?? b.internalBalance),
    variance: num(b.variance),
    matched: num(b.matchRate ?? b.matchedPct, 0),
    breaks: num(b.breakCount ?? b.breaks),
    status: String(b.status || 'OPEN'),
    owner: String(b.ownerName || b.createdBy || '—'),
    approvals: String(b.approvalsLabel || '—'),
  }))
}

export function adaptExceptions(raw: any[]): Pv11Exception[] {
  return (raw || []).map((e) => ({
    id: String(e.id),
    code: String(e.code || e.exceptionCode || e.type || 'EXC'),
    title: String(e.title || e.description || e.code || 'Exception'),
    account: String(e.cashAccountId || '—'),
    amount: num(e.amount ?? e.varianceAmount),
    owner: String(e.ownerName || e.assigneeName || '—'),
    age: daysBetween(e.createdAt),
    sla: String(e.slaStatus || e.sla || 'On track'),
    status: String(e.status || 'OPEN'),
    severity: String(e.severity || e.priority || 'Medium'),
    evidence: String(e.evidenceCount ?? e.attachmentCount ?? 0),
  }))
}

export function adaptReportVault(raw: any[], fundNameById: Record<string, string> = {}): Pv11ReportVaultItem[] {
  return (raw || []).map((r) => ({
    id: String(r.id),
    type: String(r.reportType || r.templateName || r.name || 'Fund Report'),
    fund: fundNameById[r.fundId] || String(r.fundName || '—'),
    period: String(r.periodLabel || r.reportingPeriod || fmtDate(r.createdAt)),
    status: String(r.status || 'Draft'),
    pages: num(r.pageCount, 12),
    recipients: num(r.recipientCount ?? r.distributionCount),
    owner: String(r.createdByName || '—'),
    updated: fmtDate(r.updatedAt || r.createdAt),
  }))
}

export function adaptSignatureEnvelopes(raw: any[]): Pv11SignatureEnvelope[] {
  return (raw || []).map((a) => {
    const signers = Array.isArray(a.signatories) ? a.signatories.length : num(a.signerCount)
    const signed = Array.isArray(a.signatories)
      ? a.signatories.filter((s: any) => s.signedAt || s.status === 'SIGNED').length
      : num(a.signedCount)
    return {
      id: String(a.id),
      name: String(a.title || a.name || a.agreementType || 'Agreement'),
      status: String(a.status || 'Draft'),
      progress: signers ? Math.round((signed / signers) * 100) : 0,
      signers,
      signed,
      template: String(a.templateName || a.agreementType || '—'),
      owner: String(a.createdByName || '—'),
      due: fmtDate(a.dueDate || a.updatedAt),
    }
  })
}

export function adaptMailerLists(raw: any[]): Pv11MailerList[] {
  return (raw || []).map((l) => {
    const members = num(l.memberCount ?? l.recipients?.length ?? l.members)
    return {
      id: String(l.id),
      name: String(l.name || 'Distribution list'),
      source: String(l.source || l.fundName || 'Fund reporting'),
      status: String(l.status || 'Active'),
      members,
      active: num(l.activeCount, members),
      pending: num(l.pendingCount),
      bounced: num(l.bouncedCount),
      campaigns: num(l.campaignCount),
      tags: Array.isArray(l.tags) ? l.tags.map(String) : ['LP'],
      channels: Array.isArray(l.channels) ? l.channels.map(String) : ['Email'],
    }
  })
}

export function adaptDashboardMetrics(data: any): Pv11DashboardMetrics {
  const m = data?.metrics || {}
  const summary = Array.isArray(data?.portfolioSummary) ? data.portfolioSummary : []
  const active = summary.filter((s: any) => num(s.fairMarketValue) > 0 || num(s.totalInvestmentCost) > 0).length
  const realized = summary.filter((s: any) => num(s.realized) > 0 && num(s.fairMarketValue) <= 0).length
  return {
    totalInvested: num(m.totalInvested),
    availableForDrawdown: num(m.availableForDrawdown),
    fundGrossIRR: num(m.fundGrossIRR),
    lpNetIRR: num(m.lpNetIRR),
    tvpi: num(m.tvpi),
    dpi: num(m.dpi),
    unrealizedValue: num(data?.totals?.fairMarketValue ?? data?.performanceOverview?.fmvUnrealizedPortfolio),
    companyCount: num(data?.aumKpis?.totalCompanies ?? summary.length),
    activeInvestments: active || num(data?.portfolioComposition?.headline?.numberOfHoldings),
    realizedInvestments: realized,
  }
}

const SECTOR_COLORS = ['#2475f5', '#0ba780', '#f5a623', '#60a5fa', '#11a5b7', '#d9475c', '#adb5c3']

/** Build chart payloads from GET /portfolio/dashboard (empty arrays when API has no series). */
export function adaptDashboardCharts(data: any, deals: any[] = []): Pv11DashboardCharts {
  const po = data?.performanceOverview || {}
  const jCurveRaw = Array.isArray(data?.jCurve) ? data.jCurve : []
  const dealAlloc = Array.isArray(data?.dealAllocation) ? data.dealAllocation : []
  const aumSectors = Array.isArray(data?.aumKpis?.sectorDistribution)
    ? data.aumKpis.sectorDistribution
    : Array.isArray(data?.portfolioComposition?.aumBySector)
      ? data.portfolioComposition.aumBySector
      : []
  const irrQ = Array.isArray(data?.irrByQuarter) ? data.irrByQuarter : []

  const sectorSource = dealAlloc.length
    ? dealAlloc.map((s: any) => ({
        label: String(s.sector || 'Other'),
        value: num(s.investmentCost ?? s.percentage ?? s.value),
        display:
          s.percentage != null
            ? `${num(s.percentage).toFixed(1)}%`
            : undefined,
      }))
    : aumSectors.map((s: any) => ({
        label: String(s.sector || s.label || 'Other'),
        value: num(s.aum ?? s.value ?? s.amount),
        display: s.percentage != null ? `${num(s.percentage).toFixed(1)}%` : undefined,
      }))

  const sectorTotal = sectorSource.reduce((s: number, x: any) => s + x.value, 0) || 1
  const sectors = sectorSource.map((s: any, i: number) => ({
    label: s.label,
    value: s.value,
    display: s.display || `${((s.value / sectorTotal) * 100).toFixed(1)}%`,
    color: SECTOR_COLORS[i % SECTOR_COLORS.length],
  }))

  const paidIn = num(po.paidIn) / 1e6
  const invested = num(po.totalInvestment) / 1e6
  const mgmt = num(po.managementExpenses) / 1e6
  const other = num(po.otherExpenses) / 1e6
  const realized = num(po.realizedProceedsAndIncome) / 1e6
  const net = realized - invested - mgmt - other

  return {
    performance: {
      labels: ['Paid-in / Activity'],
      capitalInvested: [invested],
      distributions: [realized],
      otherExpenses: [mgmt + other],
      netCashFlow: [net],
    },
    jCurve: {
      labels: jCurveRaw.map((p: any) => `Y${p.year}`),
      values: jCurveRaw.map((p: any) => num(p.cumulativeAmount) / 1e6),
    },
    sectors,
    valueTrend: {
      labels: irrQ.map((q: any) => String(q.quarter || `${q.year}-Q${q.quarterNumber}`)),
      values: irrQ.map((q: any) => num(q.fundGrossIRR ?? q.investorNetIRR)),
    },
    recentActivity: (deals || [])
      .slice(0, 4)
      .map((d: any) => ({
        title: String(d.name || d.businessName || 'Deal'),
        detail: `${d.stage || d.currentStage || 'Update'} · ${d.age != null ? `${d.age}d` : 'recent'}`,
      })),
  }
}

/** Unwrap OpsEnvelope / various list wrappers into an array */
export function asArray(payload: any): any[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  const d = payload.data ?? payload
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.items)) return d.items
  if (Array.isArray(d?.funds)) return d.funds
  if (Array.isArray(d?.clients)) return d.clients
  if (Array.isArray(d?.applications)) return d.applications
  if (Array.isArray(d?.documents)) return d.documents
  if (Array.isArray(d?.schedules)) return d.schedules
  if (Array.isArray(d?.runs)) return d.runs
  if (Array.isArray(d?.lists)) return d.lists
  return []
}
