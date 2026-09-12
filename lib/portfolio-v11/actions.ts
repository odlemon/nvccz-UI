import { taskApiService } from '@/lib/api/task-api'
import { applicationsApi } from '@/lib/api/applications-api'
import { boardReviewApi } from '@/lib/api/board-review-api'
import { capitalCallsApi, clientsApi } from '@/lib/api/capital-calls-api'
import { dueDiligenceApi } from '@/lib/api/due-diligence-api'
import { fundPerformanceReportingApi } from '@/lib/api/fund-performance-reporting-api'
import { fundraisingApi } from '@/lib/api/fundraising-api'
import { fundsApi } from '@/lib/api/funds-api'
import { investmentImplementationApi } from '@/lib/api/investment-implementation-api'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import { portfolioCompaniesApi } from '@/lib/api/portfolio-companies-api'
import { stockPickerCashApi } from '@/lib/api/stock-picker-cash-api'
import { termSheetApi } from '@/lib/api/term-sheet-api'
import { usersApi } from '@/lib/api/users-api'
import { getAuthUser } from '@/lib/utils/cookies'
import { asArray } from './adapters'
import { loadPortfolioV11Scopes, type PortfolioDataScope } from './bootstrap'
import { loadDealDetail } from './live-loaders'

const UI_STAGE_TO_BE: Record<string, string> = {
  Sourcing: 'SCREENING_PENDING',
  Screening: 'SCREENING',
  'Initial Review': 'ACTIVE_DD',
  'Investment Committee': 'UNDER_BOARD_REVIEW',
  'Due Diligence': 'ACTIVE_DD',
  'Term Sheet': 'TERM_SHEET',
  Portfolio: 'PORTFOLIO_MANAGEMENT',
  Rejected: 'REJECTED_SCREENING',
  'Human Review': 'BELOW_THRESHOLD',
  'Below Threshold': 'BELOW_THRESHOLD',
}

async function rehydrate(scopes: PortfolioDataScope[], filters?: Record<string, string | undefined>) {
  const payload = await loadPortfolioV11Scopes(scopes, filters || {})
  window.MatanhoPortfolioUI?.hydrate(payload)
  return payload
}

function firstFundId(ds: Record<string, string>) {
  return ds.fundId || ds.fund_id || ds.portfolioId || ''
}

export async function handlePortfolioV11Action(detail: {
  action?: string
  dataset?: Record<string, string>
  files?:
    | File[]
    | {
        businessPlan?: File
        proofOfConcept?: File
        marketResearch?: File
        projectedCashFlows?: File
        document?: File
      }
  file?: File
}): Promise<{ handled: boolean; message?: string; error?: string }> {
  const action = detail.action || ''
  const ds = detail.dataset || {}

  try {
    if (action === 'api-create-application' || action === 'submit-add-deal') {
      const filesBag =
        !detail.files || Array.isArray(detail.files)
          ? ({} as {
              businessPlan?: File
              proofOfConcept?: File
              marketResearch?: File
              projectedCashFlows?: File
              document?: File
            })
          : detail.files
      const files = [
        filesBag.businessPlan,
        filesBag.proofOfConcept,
        filesBag.marketResearch,
        filesBag.projectedCashFlows,
      ].filter((f): f is File => Boolean(f))
      if (files.length < 4) {
        return { handled: true, error: 'Upload all four required application documents' }
      }
      if (!ds.applicantName || !ds.applicantEmail || !ds.businessName || !ds.requestedAmount) {
        return {
          handled: true,
          error: 'Applicant name, email, business name and requested amount are required',
        }
      }
      const formDataFields: Record<string, unknown> = {}
      if (ds.proposedOwnership) formDataFields.proposedOwnership = ds.proposedOwnership
      if (ds.preMoneyValuation) formDataFields.preMoneyValuation = ds.preMoneyValuation
      if (ds.ownershipPercent) formDataFields.ownershipPercent = ds.ownershipPercent
      if (ds.boardComposition) formDataFields.boardComposition = ds.boardComposition
      if (ds.keyShareholders) formDataFields.keyShareholders = ds.keyShareholders
      if (ds.governanceNotes) formDataFields.governanceNotes = ds.governanceNotes
      if (ds.targetCloseDate) formDataFields.targetCloseDate = ds.targetCloseDate
      if (ds.fundingRound) formDataFields.fundingRound = ds.fundingRound

      await applicationsApi.create({
        applicantName: ds.applicantName,
        applicantEmail: ds.applicantEmail,
        applicantPhone: ds.applicantPhone || 'N/A',
        applicantAddress: ds.applicantAddress || 'N/A',
        businessName: ds.businessName,
        businessDescription: ds.businessDescription || ds.businessName,
        industry: ds.industry || 'General',
        businessStage: ds.businessStage || 'Seed',
        foundingDate: ds.foundingDate || new Date().toISOString().slice(0, 10),
        requestedAmount: Number(ds.requestedAmount),
        fundId: firstFundId(ds) || undefined,
        // Staff Add Deal / submit-add-deal always INTERNAL (no UI selector).
        source: 'INTERNAL',
        applicationFormData: Object.keys(formDataFields).length ? formDataFields : undefined,
        files,
        documentTypes: [
          'BUSINESS_PLAN',
          'PROOF_OF_CONCEPT',
          'MARKET_RESEARCH',
          'PROJECTED_CASH_FLOWS',
        ],
      })
      await rehydrate(['applications'])
      return { handled: true, message: 'Application created' }
    }

    if (
      (action === 'send-capital-call-notices' || action === 'send-notices') &&
      ds.fundId &&
      (ds.id || ds.capitalCallId)
    ) {
      await capitalCallsApi.sendNotices(ds.fundId, ds.id || ds.capitalCallId)
      await rehydrate(['capitalCalls', 'funds'])
      return { handled: true, message: 'Capital call notices sent' }
    }

    if ((action === 'run-recon-batch' || action === 'start-reconciliation') && ds.id) {
      await stockPickerCashApi.runReconciliationBatch(ds.id)
      await rehydrate(['recon'])
      return { handled: true, message: 'Reconciliation batch run' }
    }

    if (action === 'approve-reservation' && ds.id) {
      await stockPickerCashApi.approveCashReservation(ds.id, {})
      await rehydrate(['cashReservations'])
      return { handled: true, message: 'Reservation approved' }
    }

    if (action === 'release-reservation' && ds.id) {
      await stockPickerCashApi.releaseCashReservation(ds.id, {})
      await rehydrate(['cashReservations'])
      return { handled: true, message: 'Reservation released' }
    }

    if ((action === 'period-precheck' || action === 'run-pre-check') && (ds.period || ds.id)) {
      const period = ds.period || ds.id
      await stockPickerCashApi.periodPrecheck(period, {
        legalEntityId: ds.legalEntityId || 'le_arcus',
      })
      await rehydrate(['periodClose'], { closePeriod: period })
      return { handled: true, message: `Period ${period} precheck complete` }
    }

    if ((action === 'period-close' || action === 'close-period') && (ds.period || ds.id)) {
      const period = ds.period || ds.id
      await stockPickerCashApi.periodClose(period, {
        legalEntityId: ds.legalEntityId || 'le_arcus',
      })
      await rehydrate(['periodClose'], { closePeriod: period })
      return { handled: true, message: `Period ${period} closed` }
    }

    if (action === 'create-gl-export' || action === 'export-gl') {
      await stockPickerCashApi.createGlExport({
        period: ds.period,
        cashAccountId: ds.cashAccountId || ds.accountId,
        currency: ds.currency || 'USD',
        legalEntityId: ds.legalEntityId || 'le_arcus',
      })
      return { handled: true, message: 'GL export created' }
    }

    if (
      (action === 'confirm-match' ||
        action === 'confirm-recon-match' ||
        action === 'api-confirm-match') &&
      (ds.batchId || ds.id)
    ) {
      await stockPickerCashApi.confirmMatches({
        batchId: ds.batchId || ds.id,
        internalLineId: ds.internalLineId,
        externalLineId: ds.externalLineId,
        matchedAmount: ds.matchedAmount ? Number(ds.matchedAmount) : undefined,
      })
      await rehydrate(['recon'])
      return { handled: true, message: 'Match confirmed' }
    }

    if (action === 'manual-match' || action === 'manual-recon-match' || action === 'api-manual-match') {
      await stockPickerCashApi.manualMatch({
        batchId: ds.batchId || ds.id,
        internalLineId: ds.internalLineId,
        externalLineId: ds.externalLineId,
        matchedAmount: ds.matchedAmount ? Number(ds.matchedAmount) : undefined,
      })
      await rehydrate(['recon'])
      return { handled: true, message: 'Manual match recorded' }
    }

    if (
      (action === 'unmatch' || action === 'reverse-match' || action === 'api-reverse-match') &&
      (ds.linkId || ds.id)
    ) {
      await stockPickerCashApi.reverseMatch(ds.linkId || ds.id, {})
      await rehydrate(['recon'])
      return { handled: true, message: 'Match reversed' }
    }

    if (action === 'submit-create-fund' || action === 'create-fund-submit' || action === 'api-create-fund') {
      const name = ds.name || `Fund ${new Date().toISOString().slice(0, 10)}`
      const totalAmount = Number(ds.totalAmount || ds.commitment || 10000000)
      const minInvestment = Number(ds.minInvestment || Math.min(100000, totalAmount))
      const maxInvestment = Number(ds.maxInvestment || Math.max(minInvestment, Math.round(totalAmount * 0.25)))
      // "Management fee" (e.g. "2.0%") and "Carry terms" (e.g. "20% above 8% hurdle") are collected
      // as free text in the wizard; parse the leading percentages into decimals for the backend's
      // managementFeeRate/carryRate/hurdleRate columns, which the create payload previously dropped.
      const pctToDecimal = (text?: string): number | undefined => {
        if (!text) return undefined
        const match = String(text).match(/(\d+(?:\.\d+)?)\s*%/)
        return match ? Number(match[1]) / 100 : undefined
      }
      const carryText = String(ds.carry || '')
      const hurdleMatch = carryText.match(/(\d+(?:\.\d+)?)\s*%\s*hurdle/i)
      await fundsApi.create({
        name,
        description: ds.description || 'Created from Portfolio',
        totalAmount,
        minInvestment,
        maxInvestment,
        focusIndustries: String(ds.focusIndustries || ds.strategy || 'Private Equity')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        applicationStart: new Date().toISOString(),
        applicationEnd: new Date(Date.now() + 365 * 86400000 * 5).toISOString(),
        status: 'OPEN',
        managementFeeRate: pctToDecimal(ds.managementFee),
        carryRate: pctToDecimal(carryText),
        hurdleRate: hurdleMatch ? Number(hurdleMatch[1]) / 100 : undefined,
        vintageYear: ds.vintage ? Number(ds.vintage) : undefined,
        currencyCode: ds.currency || undefined,
        geography: ds.geography || undefined,
      })
      await rehydrate(['funds', 'dashboard'])
      return { handled: true, message: `Fund created: ${name}` }
    }

    if (action === 'submit-fund-edit' || action === 'api-update-fund') {
      const fundId = ds.fundId || ds.id
      if (!fundId) return { handled: true, error: 'Fund is required' }
      const pctToDecimal = (text?: string): number | undefined => {
        if (!text) return undefined
        const match = String(text).match(/(\d+(?:\.\d+)?)\s*%/)
        return match ? Number(match[1]) / 100 : undefined
      }
      const carryText = String(ds.carry || '')
      const hurdleMatch = carryText.match(/(\d+(?:\.\d+)?)\s*%\s*hurdle/i)
      // The edit form's "Status" options (Investing/Fundraising/Realising/Closed) are UI labels, not
      // the backend's real OPEN/CLOSED/PAUSED enum — only map the one unambiguous case (Closed) and
      // leave status untouched otherwise, rather than overwriting real backend state with a guess.
      const statusMap: Record<string, 'OPEN' | 'CLOSED' | 'PAUSED'> = { Closed: 'CLOSED' }
      await fundsApi.update(fundId, {
        name: ds.name || undefined,
        description: ds.description || undefined,
        status: ds.status ? statusMap[ds.status] : undefined,
        managementFeeRate: pctToDecimal(ds.managementFee),
        carryRate: pctToDecimal(carryText),
        hurdleRate: hurdleMatch ? Number(hurdleMatch[1]) / 100 : undefined,
        geography: ds.geography || undefined,
      })
      await rehydrate(['funds', 'dashboard'])
      return { handled: true, message: `Fund updated: ${ds.name || fundId}` }
    }

    if (
      action === 'submit-add-lp' ||
      action === 'add-lp-submit' ||
      action === 'submit-lp' ||
      action === 'add-lp' ||
      action === 'api-add-lp'
    ) {
      await clientsApi.create({
        legal_name: ds.name || ds.legalName || 'New LP',
        email: ds.email || `lp.${Date.now()}@example.com`,
        type: ds.type || 'entity',
        country: ds.country || 'ZW',
        fund_id: ds.fundId || ds.fund_id,
        amount: ds.amount ? Number(ds.amount) : undefined,
      })
      await rehydrate(['lps'])
      return { handled: true, message: 'LP created' }
    }

    if (
      action === 'submit-create-capital-call' ||
      action === 'api-create-capital-call' ||
      action === 'submit-capital-call'
    ) {
      const fundId = ds.fundId
      if (!fundId) return { handled: true, error: 'Fund is required' }
      await capitalCallsApi.initiate(fundId, {
        callPercent: Number(ds.callPercent || 10),
        paymentDueDate:
          ds.paymentDueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        transactionDate: ds.transactionDate || new Date().toISOString().slice(0, 10),
        bankInstructions: ds.bankInstructions || 'Remit per LPA collection account.',
      })
      await rehydrate(['capitalCalls', 'funds'])
      return { handled: true, message: 'Capital call created' }
    }

    if (action === 'api-create-cash-account' || action === 'submit-cash-account') {
      const fundId = firstFundId(ds) || ds.portfolioId
      await stockPickerCashApi.createClientCashAccount({
        legalEntityId: ds.legalEntityId || 'le_arcus',
        clientOrVehicleId: ds.clientOrVehicleId || ds.vehicleId || fundId || 'vehicle_main',
        portfolioId: fundId || ds.portfolioId || 'portfolio_default',
        ownerModel: ds.ownerModel || 'SEGREGATED',
        moneyClass: ds.moneyClass || 'CLIENT_MONEY',
        accountType: ds.accountType || ds.purpose || 'FUND_OPERATING_BANK',
        providerId: ds.providerId || ds.provider || 'provider_cbz',
        currency: ds.currency || 'USD',
        externalAccountIdentifier: ds.externalAccountIdentifier || ds.accountNumber || `ext-${Date.now()}`,
        effectiveFrom: ds.effectiveFrom || new Date().toISOString().slice(0, 10),
      })
      await rehydrate(['cashAccounts'])
      return { handled: true, message: 'Cash account submitted' }
    }

    if (action === 'api-create-reservation' || action === 'v22-submit-reservation') {
      await stockPickerCashApi.createCashReservation({
        portfolioId: ds.portfolioId || firstFundId(ds) || 'portfolio_default',
        cashAccountId: ds.cashAccountId || ds.accountId || ds.account,
        currency: ds.currency || 'USD',
        amount: Number(ds.amount || 0),
        purpose: ds.purpose || 'INVESTMENT_DISBURSEMENT',
        sourceEventId: ds.source || ds.sourceEventId,
        requireApproval: true,
      })
      await rehydrate(['cashReservations'])
      return { handled: true, message: 'Reservation requested' }
    }

    if (action === 'api-upload-statement' || action === 'submit-statement-import') {
      await stockPickerCashApi.createExternalStatementImport({
        cashAccountId: ds.cashAccountId || ds.accountId,
        providerId: ds.providerId || ds.provider || 'provider_cbz',
        currency: ds.currency || 'USD',
        fileName: ds.fileName || 'statement.csv',
        contentBase64: ds.contentBase64,
        rawContent: ds.rawContent,
      })
      await rehydrate(['statementImports'])
      return { handled: true, message: 'Statement import staged' }
    }

    if (action === 'api-create-company' || action === 'submit-company') {
      await portfolioCompaniesApi.adminCreate({
        name: ds.name || 'New portfolio company',
        industry: ds.industry || ds.sector || 'General',
        fund_id: firstFundId(ds) || undefined,
        registrationNumber: ds.registrationNumber || `REG-${Date.now()}`,
        status: 'ACTIVE',
      })
      await rehydrate(['companies', 'funds'])
      return { handled: true, message: 'Portfolio company created' }
    }

    if (action === 'api-create-mailer-list' || action === 'submit-mailer-list') {
      const fundId = firstFundId(ds)
      if (!fundId) return { handled: true, error: 'Select a fund for the distribution list' }
      await fundPerformanceReportingApi.createDistributionList({
        fundId,
        name: ds.name || 'Mailer list',
        sourceType: (ds.sourceType as 'COMMITMENT_COHORT' | 'ROLE_BOUND') || 'COMMITMENT_COHORT',
      })
      await rehydrate(['mailer', 'funds'])
      return { handled: true, message: 'Distribution list created' }
    }

    if (action === 'api-trigger-report-run' || action === 'submit-mailer-campaign' || action === 'submit-performance' || action === 'generate-report-live') {
      const fundId = firstFundId(ds)
      if (!fundId) return { handled: true, error: 'Fund is required for report run' }
      const templatesRes = await fundPerformanceReportingApi.getTemplates(fundId)
      const listsRes = await fundPerformanceReportingApi.getDistributionLists(fundId)
      const templates = asArray(templatesRes)
      const lists = asArray(listsRes)
      const templateId = ds.templateId || templates[0]?.id
      const distributionListId = ds.distributionListId || lists[0]?.id
      if (!templateId || !distributionListId) {
        return {
          handled: true,
          error: 'Need at least one report template and distribution list on the fund',
        }
      }
      const start = ds.periodStart || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
      const end = ds.periodEnd || new Date().toISOString().slice(0, 10)
      await fundPerformanceReportingApi.triggerRun({
        fundId,
        templateId,
        periodStart: start,
        periodEnd: end,
        distributionListId,
      })
      await rehydrate(['reporting', 'funds'])
      return { handled: true, message: 'Report run started' }
    }

    if (action === 'api-assign-dd-task' || action === 'submit-dd-task') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Open a deal before assigning diligence tasks' }
      let assigneeId = ds.assigneeId
      if (!assigneeId) {
        const usersRes = await applicationsApi.getInvestmentUsers().catch(() => null)
        const users = asArray((usersRes as any)?.data ?? usersRes)
        assigneeId = users[0]?.id || users[0]?.userId
      }
      if (!assigneeId) return { handled: true, error: 'No investment user available to assign' }
      const priority = String(ds.priority || 'medium').toLowerCase() as 'low' | 'medium' | 'high'
      await applicationsApi.assignDueDiligenceTask(applicationId, {
        assigneeId,
        title: ds.title || 'Diligence task',
        description: ds.description || ds.evidence || ds.title || 'Assigned from Portfolio V23',
        priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
        dueDate: ds.dueDate || ds.due || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        category: ds.category || ds.workstream || 'General',
      })
      await hydrateDealDetail(applicationId)
      return { handled: true, message: 'Diligence task assigned' }
    }

    if (
      action === 'api-update-dd-task-stage' ||
      action === 'complete-dd-task' ||
      action === 'reopen-dd-task'
    ) {
      const taskId = ds.taskId || ds.id
      const applicationId = ds.applicationId || ds.dealId
      if (!taskId) return { handled: true, error: 'Task id required' }
      const stage =
        ds.stage ||
        (action === 'reopen-dd-task' ? 'todo' : 'completed')
      await taskApiService.updateTaskStage(String(taskId), String(stage))
      if (applicationId) await hydrateDealDetail(String(applicationId))
      return {
        handled: true,
        message: stage === 'completed' ? 'Workstream marked complete' : 'Workstream reopened',
      }
    }

    if (action === 'api-create-envelope' || action === 'submit-new-envelope') {
      const documentType = ds.documentType || ds.type
      if (!documentType) return { handled: true, error: 'Document type is required' }
      if (!ds.subject) return { handled: true, error: 'Envelope subject is required' }
      const agreement = await fundraisingApi.createAgreement({
        title: ds.subject,
        documentType,
        fundId: firstFundId(ds) || undefined,
        applicationId: ds.applicationId || undefined,
      })
      const agreementId = (agreement as any)?.id || (agreement as any)?.data?.id
      if (agreementId && ds.recipientEmail && ds.recipientName) {
        await fundraisingApi.addSignatory(agreementId, {
          fullName: ds.recipientName,
          email: ds.recipientEmail,
          role: ds.recipientRole || 'Signer',
          sequenceOrder: 1,
          expiresAt: ds.expires || undefined,
        })
        await fundraisingApi.sendAgreement(agreementId, {}).catch(() => null)
      }
      await rehydrate(['agreements'])
      return { handled: true, message: 'Agreement envelope created' }
    }

    if (action === 'api-upload-document' || action === 'vault-upload-live') {
      const fundId = firstFundId(ds)
      if (!fundId) return { handled: true, error: 'Fund is required to create a document' }
      const file: File | undefined =
        detail.file instanceof File
          ? detail.file
          : !detail.files || Array.isArray(detail.files)
            ? undefined
            : detail.files.document
      let fileId: string | undefined = ds.fileId
      if (file && !fileId) {
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        const contentBase64 = btoa(binary)
        const uploaded = await investmentOpsApi.uploadBinaryFile({
          fundId,
          fileName: file.name || ds.fileName || 'upload.bin',
          mimeType: file.type || 'application/octet-stream',
          contentBase64,
          byteSize: file.size || bytes.length,
        })
        fileId = uploaded?.data?.fileId
        if (!fileId) {
          return { handled: true, error: uploaded?.message || 'Document upload session failed' }
        }
      }
      if (!fileId) {
        return {
          handled: true,
          error:
            'Choose a file to upload. Vault documents require an Investment Ops upload session (fileId).',
        }
      }
      await investmentOpsApi.createDocument({
        fundId,
        documentType: ds.documentType || ds.folder || 'GENERAL',
        title: ds.title || ds.fileName || file?.name || 'Uploaded document',
        fileId,
      })
      await rehydrate(['documents'])
      return { handled: true, message: 'Document registered' }
    }

    if (action === 'api-upload-application-document') {
      const applicationId = String(ds.applicationId || ds.dealId || ds.id || '')
      if (!applicationId) return { handled: true, error: 'Application id required' }
      const files: File[] = Array.isArray(detail.files)
        ? detail.files.filter((f: unknown) => f instanceof File)
        : detail.file instanceof File
          ? [detail.file]
          : []
      if (!files.length) {
        return {
          handled: true,
          error:
            'Choose a file to upload. The browser must pass the File object to the API action.',
        }
      }
      const documentTypes = files.map(
        () => String(ds.documentType || ds.folder || 'OTHER'),
      )
      await applicationsApi.uploadDocuments(files, documentTypes, applicationId)
      await hydrateDealDetail(applicationId)
      return { handled: true, message: 'Application document uploaded' }
    }

    if (action === 'api-initiate-due-diligence' || action === 'start-due-diligence') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      await dueDiligenceApi.initiate(applicationId)
      await hydrateDealDetail(applicationId)
      await rehydrate(['applications'])
      return { handled: true, message: 'Due diligence started' }
    }

    if (action === 'api-complete-due-diligence' || action === 'complete-due-diligence') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      await dueDiligenceApi.complete(applicationId)
      await hydrateDealDetail(applicationId)
      await rehydrate(['applications'])
      return { handled: true, message: 'Due diligence completed' }
    }

    if (action === 'api-update-due-diligence' || action === 'submit-dd-assessment') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const asBool = (v: unknown) => v === true || v === 'true' || v === '1' || v === 1
      await dueDiligenceApi.update(applicationId, {
        marketResearchViable: asBool(ds.marketResearchViable),
        marketResearchComments: ds.marketResearchComments || undefined,
        financialViable: asBool(ds.financialViable),
        financialComments: ds.financialComments || undefined,
        competitiveOpportunities: asBool(ds.competitiveOpportunities),
        competitiveComments: ds.competitiveComments || undefined,
        managementTeamQualified: asBool(ds.managementTeamQualified),
        managementComments: ds.managementComments || undefined,
        legalCompliant: asBool(ds.legalCompliant),
        legalComments: ds.legalComments || undefined,
        riskTolerable: asBool(ds.riskTolerable),
        riskComments: ds.riskComments || undefined,
        recommendation: (ds.recommendation || 'APPROVE') as 'APPROVE' | 'REJECT' | 'CONDITIONAL',
        finalComments: ds.finalComments || undefined,
      })
      await hydrateDealDetail(applicationId)
      return { handled: true, message: 'Due diligence assessment saved' }
    }

    if (action === 'api-create-term-sheet' || action === 'submit-create-term-sheet') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const investmentAmount = Number(ds.investmentAmount || 0)
      if (!investmentAmount) return { handled: true, error: 'Investment amount is required' }
      const equityPercentage = ds.equityPercentage ? Number(ds.equityPercentage) : undefined
      const valuation = ds.valuation ? Number(ds.valuation) : undefined
      if (!equityPercentage) return { handled: true, error: 'Equity percentage is required' }
      if (!valuation) return { handled: true, error: 'Valuation is required' }
      const document =
        !detail.files || Array.isArray(detail.files) ? undefined : detail.files.document
      if (!document) return { handled: true, error: 'Term sheet PDF document is required' }
      await termSheetApi.create(applicationId, {
        title: ds.title || 'Term Sheet',
        investmentAmount,
        equityPercentage,
        valuation,
        keyTerms: ds.keyTerms || undefined,
        conditions: ds.conditions || undefined,
        timeline: ds.timeline || undefined,
        document,
      })
      await hydrateDealDetail(applicationId)
      await rehydrate(['applications'])
      return { handled: true, message: 'Term sheet created' }
    }

    if (action === 'api-create-board-review' || action === 'submit-start-board-review') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const document = !detail.files || Array.isArray(detail.files) ? undefined : detail.files.document
      if (!document) return { handled: true, error: 'Investment memorandum file is required' }
      // BE only accepts board-review create from UNDER_BOARD_REVIEW (not TERM_SHEET).
      try {
        await applicationsApi.changeStage(applicationId, {
          newStage: 'UNDER_BOARD_REVIEW',
          notes: 'Moved to board review to attach investment memorandum',
        })
      } catch {
        // Already UNDER_BOARD_REVIEW or transition not allowed — create may still succeed.
      }
      await boardReviewApi.create(applicationId, document)
      await hydrateDealDetail(applicationId)
      await rehydrate(['applications'])
      return { handled: true, message: 'Board review started' }
    }

    if (action === 'api-initiate-implementation' || action === 'start-implementation') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const fundId = ds.fundId || firstFundId(ds)
      const portfolioCompanyId = ds.portfolioCompanyId
      if (!fundId) return { handled: true, error: 'Fund id is required' }
      if (!portfolioCompanyId) {
        return {
          handled: true,
          error:
            'No portfolio company on this deal yet. Complete due diligence first (backend creates the company and credentials on DD complete).',
        }
      }
      await investmentImplementationApi.initiate({
        applicationId,
        fundId,
        portfolioCompanyId,
        implementationPlan: ds.implementationPlan || 'Initial implementation from Portfolio V11',
        notes: ds.notes || '',
        disbursementMode: (ds.disbursementMode as any) || 'ONE_TIME',
        totalCommittedAmount: Number(ds.amount || ds.totalCommittedAmount || 0) || undefined,
      })
      await hydrateDealDetail(applicationId)
      await rehydrate(['applications'])
      return { handled: true, message: 'Investment implementation initiated' }
    }

    if (action === 'api-change-deal-stage' || action === 'change-deal-stage') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const uiStage = ds.stage || ds.newStage || ''
      const newStage = ds.beStage || UI_STAGE_TO_BE[uiStage] || uiStage
      await applicationsApi.changeStage(applicationId, {
        newStage,
        notes: ds.notes || `Moved to ${uiStage || newStage} from Portfolio V23`,
      })
      await rehydrate(['applications'])
      if (window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.page === 'deal-detail'
        || window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedDealId === applicationId) {
        await hydrateDealDetail(applicationId)
      }
      return { handled: true, message: `Stage updated to ${uiStage || newStage}` }
    }

    if (action === 'api-request-clarification' || action === 'submit-clarification') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const subject = String(ds.subject || '').trim()
      const message = String(ds.message || ds.question || '').trim()
      if (!subject || !message) {
        return { handled: true, error: 'Subject and clarification message are required' }
      }
      await applicationsApi.requestClarification(applicationId, {
        subject,
        message,
        recipientEmail: ds.recipientEmail || undefined,
      })
      return { handled: true, message: 'Clarification request emailed to the applicant' }
    }

    if (action === 'api-cast-ic-vote' || action === 'final-vote' || action === 'ic-vote-submit' ||
        action === 'vote-approve' || action === 'vote-conditions' || action === 'vote-reject' || action === 'vote-defer') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const raw = String(ds.vote || ds.comment || action || 'APPROVE').toUpperCase()
      const vote = raw.includes('REJECT') ? 'REJECT' : 'APPROVE'
      await boardReviewApi.castVote(applicationId, {
        vote,
        comment: ds.comment || ds.rationale || `Vote: ${ds.vote || vote}`,
      })
      await hydrateDealDetail(applicationId)
      return { handled: true, message: `Vote recorded (${vote})` }
    }

    if (action === 'api-trigger-shortlisting' || action === 'confirm-shortlist') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      // "Confirm shortlist" is meaningful at two different stages, backed by two different
      // endpoints: SCREENING_PENDING -> run the initial AI shortlisting pass; SCREENING (AI has
      // already scored it) -> record the analyst's own confirming score. Using the wrong one for
      // the app's current stage always 400s ("Only applications in SCREENING_PENDING can be
      // processed"), so branch on the real current stage instead of assuming SCREENING_PENDING.
      const current = await applicationsApi.getById(applicationId).catch(() => null)
      const currentStage = String((current as any)?.data?.currentStage ?? (current as any)?.currentStage ?? '')
      if (currentStage === 'SCREENING') {
        const existingScore = Number(
          (current as any)?.data?.initialScreeningScore ?? (current as any)?.initialScreeningScore ?? 75,
        )
        const assignedAnalystId =
          (current as any)?.data?.assignedAnalystId ?? (current as any)?.assignedAnalystId ?? null
        if (!assignedAnalystId) {
          // Analyst screening requires a lead analyst on the record (must be a user in the
          // Investments department with the investment-analyst role). Self-assign when the
          // acting user qualifies; otherwise claim the first eligible analyst on record so the
          // deal isn't permanently stuck with no one able to record a score.
          const me = getAuthUser()
          const meQualifies =
            String(me?.department || '').toLowerCase() === 'investments' ||
            String(me?.roleCode || '').toUpperCase() === 'INV_ANALYST'
          if (me?.id && meQualifies) {
            await applicationsApi.assignAnalyst(applicationId, me.id)
          } else {
            const usersRes = await usersApi.getAll().catch(() => null)
            const users = asArray((usersRes as any)?.data ?? usersRes)
            const eligible = users.find(
              (u: any) =>
                String(u?.department?.name || u?.department || '').toLowerCase() === 'investments',
            )
            if (eligible?.id) await applicationsApi.assignAnalyst(applicationId, eligible.id)
          }
        }
        await applicationsApi.analystScreening(applicationId, Number(ds.score) || existingScore || 75)
      } else {
        await applicationsApi.triggerShortlisting(applicationId)
      }
      await rehydrate(['applications'])
      if (window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedDealId === applicationId) {
        await hydrateDealDetail(applicationId)
      }
      return { handled: true, message: 'Shortlist confirmed' }
    }

    if (
      action === 'api-analyst-screening' ||
      action === 'rerun-screening' ||
      action === 'human-review' ||
      action === 'screen-reject'
    ) {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const score = Number(ds.score || (action === 'screen-reject' ? 40 : 75))
      await applicationsApi.analystScreening(applicationId, score)
      await rehydrate(['applications'])
      if (window.MatanhoPortfolioUI?.getSnapshot?.()?.state?.selectedDealId === applicationId) {
        await hydrateDealDetail(applicationId)
      }
      const msg =
        action === 'screen-reject'
          ? 'Screening score recorded (reject path)'
          : action === 'human-review'
            ? 'Screening score recorded for human review'
            : 'Analyst screening recorded'
      return { handled: true, message: msg }
    }

    if (action === 'api-update-term-sheet' || action === 'accept-counter' || action === 'retain-position') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const decision = action === 'accept-counter' ? 'Accepted company counter' : 'Retained Matanho position'
      const allowedStatus = ['DRAFT', 'FINAL', 'SIGNED'] as const
      const nextStatus = allowedStatus.find((s) => s === ds.status)
      await termSheetApi.update(applicationId, {
        keyTerms: ds.keyTerms || `${decision} · clause ${ds.clause || ds.section || ''}`.trim(),
        ...(nextStatus ? { status: nextStatus } : {}),
      })
      await hydrateDealDetail(applicationId)
      return { handled: true, message: 'Term sheet updated' }
    }

    if (action === 'api-complete-board-review' || action === 'complete-board-review') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      await boardReviewApi.complete(applicationId)
      await hydrateDealDetail(applicationId)
      await rehydrate(['applications'])
      return { handled: true, message: 'Board review completed' }
    }

    if (action === 'api-finalize-term-sheet' || action === 'finalize-term-sheet') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      await termSheetApi.finalize(applicationId)
      await hydrateDealDetail(applicationId)
      return { handled: true, message: 'Term sheet finalized' }
    }

    if (action === 'api-investor-sign-term-sheet' || action === 'investor-sign-term-sheet') {
      const applicationId = ds.applicationId || ds.dealId || ds.id
      if (!applicationId) return { handled: true, error: 'Deal id required' }
      const signerName = ds.signerName || 'Matanho Capital'
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 120
      const ctx = canvas.getContext('2d')
      if (!ctx) return { handled: true, error: 'Could not generate signature' }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#111827'
      ctx.font = 'italic 32px cursive'
      ctx.fillText(signerName, 20, 70)
      const signature = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!signature) return { handled: true, error: 'Could not generate signature' }
      await termSheetApi.investorSign(applicationId, signature)
      await hydrateDealDetail(applicationId)
      return { handled: true, message: 'Term sheet signed as investor' }
    }

    if (action === 'api-release-tranche' || action === 'confirm-release-tranche') {
      const implementationId = ds.implementationId || ds.investmentImplementationId
      if (!implementationId) {
        return { handled: true, error: 'No investment implementation on this deal yet' }
      }
      const created = await investmentImplementationApi.createDisbursement({
        investmentImplementationId: implementationId,
        amount: Number(ds.amount || 0),
        disbursementDate: ds.disbursementDate || new Date().toISOString().slice(0, 10),
        disbursementType: ds.disbursementType || 'EQUITY',
        notes: ds.notes || 'First tranche release from Portfolio V23',
      })
      const disbursementId =
        (created as any)?.data?.id || (created as any)?.id || ds.disbursementId
      if (disbursementId && ds.autoApprove === 'true') {
        await investmentImplementationApi.disbursementDecision(disbursementId, 'APPROVE', ds.bankId)
      }
      if (ds.applicationId) await hydrateDealDetail(ds.applicationId)
      else await rehydrate(['applications'])
      return { handled: true, message: 'Disbursement request created' }
    }

    if (action === 'api-approve-disbursement' || action === 'approve-disbursement') {
      const disbursementId = ds.disbursementId
      if (!disbursementId) return { handled: true, error: 'Disbursement id required' }
      const bankId = ds.bankId
      if (!bankId) return { handled: true, error: 'No eligible disbursement bank configured' }
      await investmentImplementationApi.disbursementDecision(disbursementId, 'APPROVE', bankId)
      if (ds.applicationId) await hydrateDealDetail(ds.applicationId)
      else await rehydrate(['applications'])
      return { handled: true, message: 'Disbursement approved' }
    }

    if (action === 'api-send-lp-communication' || action === 'send-communication') {
      await fundraisingApi.createCommunication({
        subject: ds.subject || 'Investor update',
        summary: ds.body || ds.message || ds.summary || '',
        interactionType: ds.interactionType || 'EMAIL',
        occurredAt: ds.occurredAt || new Date().toISOString(),
        confidentiality: ds.confidentiality || 'INTERNAL',
        channel: ds.channel || 'EMAIL',
        fundId: firstFundId(ds) || undefined,
        campaignId: ds.campaignId || undefined,
        investorId: ds.investorId || undefined,
      })
      return { handled: true, message: 'Communication created' }
    }

    return { handled: false }
  } catch (err: any) {
    return { handled: true, error: err?.message || String(err) }
  }
}

export async function hydrateDealDetail(applicationId: string) {
  const detail = await loadDealDetail(applicationId)
  window.MatanhoPortfolioUI?.setDealDetail?.({
    selectedDealId: applicationId,
    dealDetail: detail,
  })
  return detail
}

export { rehydrate, UI_STAGE_TO_BE }
