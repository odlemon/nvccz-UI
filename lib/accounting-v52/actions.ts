import { chartOfAccountsApi } from '@/lib/api/chart-of-accounts-api'
import { ac52AccountTypeToBackend, ac52FinancialStatementForType } from './adapters'

export type Ac52ActionResult = {
  handled: boolean
  error?: string
  message?: string
}

type CoaSavePayload = {
  /** Original account code, or '' when creating a new account. */
  original?: string
  code: string
  name: string
  type: string
  natural?: string
  posting?: boolean
  control?: boolean
  active?: boolean
  financialStatement?: string
  /** Real backend id for the account being edited, resolved by the host from its live cache. */
  backendId?: string
}

async function handleCoaSave(payload: CoaSavePayload): Promise<Ac52ActionResult> {
  const backendType = ac52AccountTypeToBackend(payload.type)
  const financialStatement = payload.financialStatement || ac52FinancialStatementForType(backendType)

  if (payload.original && payload.backendId) {
    await chartOfAccountsApi.updateChartOfAccount(payload.backendId, {
      accountNo: payload.code,
      accountName: payload.name,
      accountType: backendType,
      financialStatement,
      isActive: payload.active,
    })
    return { handled: true, message: `${payload.code} updated in the live Chart of Accounts.` }
  }

  await chartOfAccountsApi.createChartOfAccount({
    accountNo: payload.code,
    accountName: payload.name,
    accountType: backendType,
    financialStatement,
    isActive: payload.active ?? true,
  })
  return { handled: true, message: `${payload.code} created in the live Chart of Accounts.` }
}

export async function handleAccountingV52Action(detail: {
  action: string
  payload: Record<string, unknown>
}): Promise<Ac52ActionResult> {
  try {
    switch (detail.action) {
      case 'coa-save':
        return await handleCoaSave(detail.payload as CoaSavePayload)
      default:
        return { handled: false }
    }
  } catch (err: any) {
    return { handled: true, error: err?.message || 'Request failed' }
  }
}
