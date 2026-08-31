import { applicationPortalApi } from '@/lib/api/application-portal-api'

export type InvesteePortalLivePayload = {
  profile: Awaited<ReturnType<typeof applicationPortalApi.getProfile>> | null
  application: Awaited<ReturnType<typeof applicationPortalApi.getApplication>> | null
  company: Awaited<ReturnType<typeof applicationPortalApi.getCompany>> | null
  termSheets: Awaited<ReturnType<typeof applicationPortalApi.getMyTermSheets>> | null
  dashboard: Awaited<ReturnType<typeof applicationPortalApi.getDashboard>> | null
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

  const [profile, application, company, termSheets, dashboard] = await Promise.all([
    safe('profile', () => applicationPortalApi.getProfile()),
    safe('application', () => applicationPortalApi.getApplication()),
    safe('company', () => applicationPortalApi.getCompany()),
    safe('termSheets', () => applicationPortalApi.getMyTermSheets()),
    safe('dashboard', () => applicationPortalApi.getDashboard()),
  ])

  return { profile, application, company, termSheets, dashboard, errors }
}
