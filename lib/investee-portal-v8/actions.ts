import {
  applicationPortalApi,
  type FinancialReportType,
  type PeriodType,
  type UpdateCompanyRequest,
  type UpdateLetterheadRequest,
  type UpdateProfileRequest,
} from '@/lib/api/application-portal-api'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'
import { loadInvesteePortalLiveData } from '@/lib/investee-portal-v8/live-loaders'

type MatanhoInvesteeUI = {
  hydrate?: (payload: unknown) => void
  notify?: (title: string, message?: string, type?: 'success' | 'error' | 'danger' | 'info') => void
  closeOverlays?: () => void
  getSnapshot?: () => unknown
}

declare global {
  interface Window {
    MatanhoInvesteeUI?: MatanhoInvesteeUI
  }
}

export type InvesteePortalActionDetail = {
  action?: string
  dataset?: Record<string, string>
  file?: File
  files?: File[]
  report?: {
    type?: string
    period?: number
    owner?: string
    values?: Record<string, unknown>
    notes?: Record<string, unknown>
  }
  kpi?: {
    periodStart?: string
    periodEnd?: string
    totalRevenue?: number
    netProfit?: number
    cashFlowNet?: number
  }
  settings?: {
    profile?: UpdateProfileRequest
    company?: UpdateCompanyRequest
    letterhead?: UpdateLetterheadRequest
  }
  request?: {
    title?: string
    description?: string
    type?: string
    category?: string
    currency?: string
    amount?: number
    needBy?: string
    priority?: string
  }
}

async function rehydrate() {
  const payload = await loadInvesteePortalLiveData()
  window.MatanhoInvesteeUI?.hydrate?.(payload)
  return payload
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function periodBoundsFromIndex(periodIndex: number): { periodStart: string; periodEnd: string; reportingPeriod: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = Math.max(0, Math.min(11, Number.isFinite(periodIndex) ? periodIndex : now.getMonth()))
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 0))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const label = start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  return { periodStart: iso(start), periodEnd: iso(end), reportingPeriod: label }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Could not capture signature image'))
      else resolve(blob)
    }, 'image/png')
  })
}

function readDomSignatureBlob(): Promise<Blob> {
  const canvas = document.getElementById('signatureCanvas') as HTMLCanvasElement | null
  if (!canvas || canvas.dataset.signed !== '1') {
    return Promise.reject(new Error('Draw your signature before signing'))
  }
  return canvasToPngBlob(canvas)
}

function mapReportType(uiType?: string): FinancialReportType {
  switch (String(uiType || '').toLowerCase()) {
    case 'balance':
      return 'BALANCE_SHEET'
    case 'cashflow':
      return 'CASHFLOW_STATEMENT'
    case 'income':
      return 'INCOME_STATEMENT'
    case 'management':
    case 'quarterly':
    default:
      return 'INCOME_STATEMENT'
  }
}

function mapTemplateAction(dataset: Record<string, string>): FinancialReportType {
  const hint = `${dataset.template || dataset.name || dataset.id || ''}`.toUpperCase()
  if (hint.includes('BALANCE') || hint.includes('POSITION')) return 'BALANCE_SHEET'
  if (hint.includes('CASH')) return 'CASHFLOW_STATEMENT'
  if (hint.includes('KPI') || hint.includes('OPERATIONAL')) return 'OPERATIONAL_KPIS'
  return 'INCOME_STATEMENT'
}

function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function companyIdFromSnapshot(): string {
  const snap = window.MatanhoInvesteeUI?.getSnapshot?.() as
    | { state?: { livePayload?: { company?: { data?: { id?: string }; id?: string } } } }
    | undefined
  const company = snap?.state?.livePayload?.company
  return String(company?.data?.id || company?.id || '')
}

export async function handleInvesteePortalV8Action(
  detail: InvesteePortalActionDetail,
): Promise<{ handled: boolean; message?: string; error?: string }> {
  const action = detail.action || ''
  const ds = detail.dataset || {}

  try {
    // ——— T3.2 Term sheet signing ———
    if (
      action === 'complete-signature' ||
      action === 'v15-apply-signature' ||
      action === 'sign-term-sheet' ||
      action === 'api-sign-term-sheet'
    ) {
      const applicationId =
        ds.applicationId || ds.dealId || ds.application || ds.termSheetApplicationId || ''
      const termSheetId = ds.termSheetId || ds.id || ds.termSheet || ''
      // Sign route keys off applicationId; accept either and prefer explicit applicationId.
      const signKey = applicationId || termSheetId
      if (!signKey) return { handled: true, error: 'Missing application id for term sheet signing' }
      const name = (document.getElementById('signatureName') as HTMLInputElement | null)?.value?.trim()
      const consent = (document.getElementById('signatureConsent') as HTMLInputElement | null)?.checked
      if (!name || !consent) {
        return { handled: true, error: 'Enter your name and confirm consent before signing' }
      }
      const signature = await readDomSignatureBlob()
      await applicationPortalApi.signTermSheet(signKey, signature)
      window.MatanhoInvesteeUI?.closeOverlays?.()
      await rehydrate()
      return { handled: true, message: 'Term sheet signed' }
    }

    // ——— T3.3 KPI submission ———
    if (action === 'submit-period-kpis' || action === 'submit-kpi' || action === 'complete-kpi-submit') {
      const kpi = detail.kpi || {}
      const periodStart =
        kpi.periodStart ||
        (document.getElementById('kpiPeriodStart') as HTMLInputElement | null)?.value ||
        ''
      const periodEnd =
        kpi.periodEnd || (document.getElementById('kpiPeriodEnd') as HTMLInputElement | null)?.value || ''
      const totalRevenue = num(
        kpi.totalRevenue ?? (document.getElementById('kpiTotalRevenue') as HTMLInputElement | null)?.value,
      )
      const netProfit = num(
        kpi.netProfit ?? (document.getElementById('kpiNetProfit') as HTMLInputElement | null)?.value,
      )
      const cashFlowNet = num(
        kpi.cashFlowNet ?? (document.getElementById('kpiCashFlowNet') as HTMLInputElement | null)?.value,
      )
      if (!periodStart || !periodEnd) {
        return { handled: true, error: 'Period start and end are required' }
      }
      await applicationPortalApi.submitPeriodKPIs({
        periodStart,
        periodEnd,
        totalRevenue,
        netProfit,
        cashFlowNet,
      })
      window.MatanhoInvesteeUI?.closeOverlays?.()
      await rehydrate()
      return { handled: true, message: 'Period KPIs submitted' }
    }

    // ——— T3.4 Financial reporting ———
    if (action === 'download-template') {
      const reportType = mapTemplateAction(ds)
      const csv = await applicationPortalApi.downloadFinancialReportTemplate(reportType)
      downloadTextFile(`${reportType.toLowerCase()}-template.csv`, typeof csv === 'string' ? csv : String(csv))
      return { handled: true, message: 'Template downloaded' }
    }

    if (action === 'save-structured-report' || action === 'submit-structured-report' || action === 'final-submit-report') {
      const report = detail.report || {}
      const values = report.values || {}
      const periodIndex = num(report.period, new Date().getMonth())
      const { periodStart, periodEnd, reportingPeriod } = periodBoundsFromIndex(periodIndex)
      const periodType: PeriodType = 'MONTHLY'
      const titleBase = String(report.owner || 'Investee report')
      const uiType = String(report.type || 'management')

      const incomeData = {
        merchantRevenue: num(values.merchantRevenue),
        enterpriseRevenue: num(values.enterpriseRevenue),
        otherRevenue: num(values.otherRevenue),
        processingCosts: num(values.processingCosts),
        supportLosses: num(values.supportLosses),
        salesMarketing: num(values.salesMarketing),
        productEngineering: num(values.productEngineering),
        generalAdmin: num(values.generalAdmin),
        notes: report.notes || {},
      }
      const balanceData = {
        cashAndEquivalents: num(values.cashAndEquivalents),
        tradeReceivables: num(values.tradeReceivables),
        otherCurrentAssets: num(values.otherCurrentAssets),
        fixedAssets: num(values.fixedAssets),
        otherAssets: num(values.otherAssets),
        tradePayables: num(values.tradePayables),
        accruedExpenses: num(values.accruedExpenses),
        debt: num(values.debt),
        otherLiabilities: num(values.otherLiabilities),
        shareCapital: num(values.shareCapital),
        retainedEarnings: num(values.retainedEarnings),
        notes: report.notes || {},
      }
      const cashFlowData = {
        openingCash: num(values.openingCash),
        operatingCash: num(values.operatingCash),
        capex: num(values.capex),
        financing: num(values.financing),
        notes: report.notes || {},
      }

      const wantsIncome = ['management', 'quarterly', 'income'].includes(uiType)
      const wantsBalance = ['management', 'balance'].includes(uiType)
      const wantsCash = ['management', 'quarterly', 'cashflow'].includes(uiType)

      let anchorId = ''

      if (wantsIncome || uiType === 'impact') {
        const draft = await applicationPortalApi.createIncomeStatementDraft({
          reportingPeriod,
          periodType,
          periodStart,
          periodEnd,
          title: `${titleBase} — Income · ${reportingPeriod}`,
          description: 'Submitted from Investee Portal V8',
          templateVersion: 'v1',
          data: incomeData,
        })
        anchorId = String(draft?.data?.id || '')
      }
      if (wantsBalance) {
        const draft = await applicationPortalApi.createBalanceSheetDraft({
          reportingPeriod,
          periodType,
          periodStart,
          periodEnd,
          title: `${titleBase} — Balance · ${reportingPeriod}`,
          description: 'Submitted from Investee Portal V8',
          templateVersion: 'v1',
          data: balanceData,
        })
        if (!anchorId) anchorId = String(draft?.data?.id || '')
      }
      if (wantsCash) {
        const draft = await applicationPortalApi.createCashFlowDraft({
          reportingPeriod,
          periodType,
          periodStart,
          periodEnd,
          title: `${titleBase} — Cash flow · ${reportingPeriod}`,
          description: 'Submitted from Investee Portal V8',
          templateVersion: 'v1',
          data: cashFlowData,
        })
        if (!anchorId) anchorId = String(draft?.data?.id || '')
      }

      if (!anchorId) {
        // Fallback single draft when type is unknown
        const draft = await applicationPortalApi.createIncomeStatementDraft({
          reportingPeriod,
          periodType,
          periodStart,
          periodEnd,
          title: `${titleBase} — ${mapReportType(uiType)} · ${reportingPeriod}`,
          description: 'Submitted from Investee Portal V8',
          templateVersion: 'v1',
          data: values,
        })
        anchorId = String(draft?.data?.id || '')
      }

      if (!anchorId) return { handled: true, error: 'Could not create financial report draft' }

      const fileInput = document.getElementById('reportEvidenceFile') as HTMLInputElement | null
      const file = detail.file || fileInput?.files?.[0]
      if (file) {
        await applicationPortalApi.uploadFinancialReportFile(anchorId, file)
      }

      if (action === 'save-structured-report') {
        window.MatanhoInvesteeUI?.closeOverlays?.()
        await rehydrate()
        return { handled: true, message: 'Report draft saved' }
      }

      const totalRevenue =
        num(values.merchantRevenue) + num(values.enterpriseRevenue) + num(values.otherRevenue)
      const netProfit =
        totalRevenue -
        num(values.processingCosts) -
        num(values.supportLosses) -
        num(values.salesMarketing) -
        num(values.productEngineering) -
        num(values.generalAdmin)
      const cashFlowNet = num(values.operatingCash) + num(values.capex) + num(values.financing)

      await applicationPortalApi.submitPeriodKPIs({
        periodStart,
        periodEnd,
        totalRevenue,
        netProfit,
        cashFlowNet,
      })
      await applicationPortalApi.submitFinancialReportBundle(anchorId)
      window.MatanhoInvesteeUI?.closeOverlays?.()
      await rehydrate()
      return { handled: true, message: 'Financial report submitted' }
    }

    if (action === 'upload-financial-report-file' && (ds.reportId || ds.id) && detail.file) {
      await applicationPortalApi.uploadFinancialReportFile(ds.reportId || ds.id, detail.file)
      await rehydrate()
      return { handled: true, message: 'Report file uploaded' }
    }

    if (action === 'submit-financial-report-bundle' && (ds.reportId || ds.id)) {
      await applicationPortalApi.submitFinancialReportBundle(ds.reportId || ds.id)
      await rehydrate()
      return { handled: true, message: 'Report bundle submitted' }
    }

    // ——— T3.5 Settings & company / letterhead ———
    if (action === 'save-settings') {
      const settings = detail.settings || {}
      const profile: UpdateProfileRequest = {
        firstName:
          settings.profile?.firstName ||
          (document.getElementById('settingsFirstName') as HTMLInputElement | null)?.value?.trim(),
        lastName:
          settings.profile?.lastName ||
          (document.getElementById('settingsLastName') as HTMLInputElement | null)?.value?.trim(),
        email:
          settings.profile?.email ||
          (document.getElementById('settingsEmail') as HTMLInputElement | null)?.value?.trim(),
      }
      const company: UpdateCompanyRequest = {
        name:
          settings.company?.name ||
          (document.getElementById('settingsCompanyName') as HTMLInputElement | null)?.value?.trim(),
        website:
          settings.company?.website ||
          (document.getElementById('settingsWebsite') as HTMLInputElement | null)?.value?.trim(),
        description:
          settings.company?.description ||
          (document.getElementById('settingsDescription') as HTMLTextAreaElement | null)?.value?.trim(),
        industry:
          settings.company?.industry ||
          (document.getElementById('settingsIndustry') as HTMLInputElement | null)?.value?.trim(),
        contactEmail:
          settings.company?.contactEmail ||
          (document.getElementById('settingsContactEmail') as HTMLInputElement | null)?.value?.trim(),
        contactPhone:
          settings.company?.contactPhone ||
          (document.getElementById('settingsContactPhone') as HTMLInputElement | null)?.value?.trim(),
      }

      if (profile.firstName || profile.lastName || profile.email) {
        await applicationPortalApi.updateProfile(
          Object.fromEntries(Object.entries(profile).filter(([, v]) => v != null && v !== '')) as UpdateProfileRequest,
        )
      }
      const companyPayload = Object.fromEntries(
        Object.entries(company).filter(([, v]) => v != null && v !== ''),
      ) as UpdateCompanyRequest
      if (Object.keys(companyPayload).length) {
        await applicationPortalApi.updateCompany(companyPayload)
      }

      const portfolioCompanyId = companyIdFromSnapshot()
      const letterheadLegal =
        settings.letterhead?.legalName ||
        (document.getElementById('settingsLetterheadLegalName') as HTMLInputElement | null)?.value?.trim()
      if (portfolioCompanyId && letterheadLegal) {
        const letterhead: UpdateLetterheadRequest = {
          legalName: letterheadLegal,
          registrationNumber:
            settings.letterhead?.registrationNumber ||
            (document.getElementById('settingsLetterheadReg') as HTMLInputElement | null)?.value?.trim() ||
            null,
          email:
            settings.letterhead?.email ||
            (document.getElementById('settingsLetterheadEmail') as HTMLInputElement | null)?.value?.trim() ||
            null,
          phone:
            settings.letterhead?.phone ||
            (document.getElementById('settingsLetterheadPhone') as HTMLInputElement | null)?.value?.trim() ||
            null,
          website:
            settings.letterhead?.website ||
            (document.getElementById('settingsLetterheadWebsite') as HTMLInputElement | null)?.value?.trim() ||
            null,
          line1:
            settings.letterhead?.line1 ||
            (document.getElementById('settingsLetterheadLine1') as HTMLInputElement | null)?.value?.trim() ||
            '—',
          city:
            settings.letterhead?.city ||
            (document.getElementById('settingsLetterheadCity') as HTMLInputElement | null)?.value?.trim() ||
            '—',
          country:
            settings.letterhead?.country ||
            (document.getElementById('settingsLetterheadCountry') as HTMLInputElement | null)?.value?.trim() ||
            'Zimbabwe',
        }
        await applicationPortalApi.updateLetterhead(portfolioCompanyId, letterhead)
      }

      const logoInput = document.getElementById('settingsLetterheadLogo') as HTMLInputElement | null
      const logo = detail.file || logoInput?.files?.[0]
      if (portfolioCompanyId && logo) {
        await applicationPortalApi.uploadLetterheadLogo(portfolioCompanyId, logo)
      }

      await rehydrate()
      return { handled: true, message: 'Settings saved' }
    }

    if (action === 'delete-letterhead') {
      const portfolioCompanyId = ds.portfolioCompanyId || companyIdFromSnapshot()
      if (!portfolioCompanyId) return { handled: true, error: 'Missing portfolio company id' }
      await applicationPortalApi.deleteLetterhead(portfolioCompanyId)
      await rehydrate()
      return { handled: true, message: 'Letterhead deleted' }
    }

    // ——— T4.1 partial: founder capital/procurement request ———
    if (action === 'create-request' || action === 'submit-capital-request') {
      const req = detail.request || {}
      const title =
        req.title ||
        (document.getElementById('newRequestTitle') as HTMLInputElement | null)?.value?.trim() ||
        ''
      const description =
        req.description ||
        (document.getElementById('newRequestDescription') as HTMLTextAreaElement | null)?.value?.trim() ||
        ''
      const category =
        req.category ||
        (document.getElementById('newRequestCategory') as HTMLSelectElement | null)?.value ||
        'Working capital'
      const amount = num(
        req.amount ?? (document.getElementById('newRequestAmount') as HTMLInputElement | null)?.value,
      )
      const priority =
        req.priority ||
        (document.getElementById('newRequestPriority') as HTMLSelectElement | null)?.value ||
        'MEDIUM'
      if (!title) return { handled: true, error: 'Request title is required' }
      if (!(amount > 0)) return { handled: true, error: 'Request amount must be greater than zero' }

      const created = await procurementApiV2.createApplicantRequisition({
        title,
        description: description || title,
        priority: String(priority).toUpperCase(),
        justification: description || title,
        sourcingCategory: category,
        drawdownRequestAmount: amount,
        useOfFundsDocumentUrl: 'pending',
        department: 'Investee',
        items: [
          {
            itemName: title,
            description: description || title,
            quantity: 1,
            unit: 'lot',
          },
        ],
      })
      const id = String((created as { data?: { id?: string } })?.data?.id || '')
      if (id && (action === 'create-request' || action === 'submit-capital-request')) {
        try {
          await procurementApiV2.submitApplicantRequisition(id)
        } catch {
          // Draft created even if submit fails (e.g. missing docs) — still a write path.
        }
      }
      window.MatanhoInvesteeUI?.closeOverlays?.()
      await rehydrate()
      return { handled: true, message: 'Request submitted to procurement queue' }
    }

    return { handled: false }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return { handled: true, error: message }
  }
}
