export interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: string
  category: string
  balance: number
}

export interface ChartOfAccountsState {
  chartOfAccounts: ChartOfAccount[]
  chartOfAccountsLoading: boolean
  chartOfAccountsError: string | null
}

// Chart of Accounts actions
export const setChartOfAccounts = (payload: ChartOfAccount[]) => ({
  type: 'accounting/setChartOfAccounts',
  payload
})

export const setChartOfAccountsLoading = (payload: boolean) => ({
  type: 'accounting/setChartOfAccountsLoading', 
  payload
})

export const setChartOfAccountsError = (payload: string) => ({
  type: 'accounting/setChartOfAccountsError',
  payload
})

export const updateChartOfAccount = (payload: ChartOfAccount) => ({
  type: 'accounting/updateChartOfAccount',
  payload
})

export const removeChartOfAccount = (payload: string) => ({
  type: 'accounting/removeChartOfAccount',
  payload
})