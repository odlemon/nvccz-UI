import { applicationPortalApi } from '@/lib/api/application-portal-api'
import { procurementApiV2 } from '@/lib/api/procurement-api-v2'

export type InvesteePortalLivePayload = {
  profile: Awaited<ReturnType<typeof applicationPortalApi.getProfile>> | null
  application: Awaited<ReturnType<typeof applicationPortalApi.getApplication>> | null
  company: Awaited<ReturnType<typeof applicationPortalApi.getCompany>> | null
  termSheets: Awaited<ReturnType<typeof applicationPortalApi.getMyTermSheets>> | null
  dashboard: Awaited<ReturnType<typeof applicationPortalApi.getDashboard>> | null
  reportingRequests: Awaited<ReturnType<typeof applicationPortalApi.getReportingRequests>> | null
  financialReports: Awaited<ReturnType<typeof applicationPortalApi.getFinancialReports>> | null
  /** Applicant drawdown ledger including purchase requisitions (capital/procurement requests). */
  drawdown: Awaited<ReturnType<typeof procurementApiV2.getApplicantDrawdown>> | null
  errors: string[]
}

export async function loadInvesteePortalLiveData(): Promise<InvesteePortalLivePayload> {
  const errors: string[] = []
  const safe = async <T>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn()
    } catch (e: unknown) {
      errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }

  const [
    profile,
    application,
    company,
    termSheets,
    dashboard,
    reportingRequests,
    financialReports,
    drawdown,
  ] = await Promise.all([
    safe('profile', () => applicationPortalApi.getProfile()),
    safe('application', () => applicationPortalApi.getApplication()),
    safe('company', () => applicationPortalApi.getCompany()),
    safe('termSheets', () => applicationPortalApi.getMyTermSheets()),
    safe('dashboard', () => applicationPortalApi.getDashboard()),
    safe('reportingRequests', () => applicationPortalApi.getReportingRequests()),
    safe('financialReports', () => applicationPortalApi.getFinancialReports()),
    safe('drawdown', () => procurementApiV2.getApplicantDrawdown()),
  ])

  return {
    profile,
    application,
    company,
    termSheets,
    dashboard,
    reportingRequests,
    financialReports,
    drawdown,
    errors,
  }
}
