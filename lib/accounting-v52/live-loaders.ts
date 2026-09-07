import { chartOfAccountsApi } from '@/lib/api/chart-of-accounts-api'
import { accountingApi } from '@/lib/api/accounting-api'
import { adaptAc52Accounts, adaptAc52Journals } from './adapters'
import type { Ac52HydratePayload } from './types'

export type Ac52DataScope = 'coa' | 'journals'

export type Ac52ScopePlan = {
  primary: Ac52DataScope[]
}

/** Which live scopes a given accounting-v52 page needs. Extend as more pages are wired. */
export function scopesForAc52Page(page: string): Ac52ScopePlan {
  switch (page) {
    case 'coa':
      return { primary: ['coa'] }
    // General Ledger and account balances are derived client-side from S.journals
    // (see postedJournals8/ledgerRows8/accountNet8 in the runtime), so both pages
    // need the same 'journals' scope — there is no separate GL dataset to fetch.
    case 'journals':
    case 'ledger':
      return { primary: ['journals'] }
    default:
      return { primary: [] }
  }
}

function settle<T>(p: Promise<T>, label: string, errors: string[]): Promise<T | null> {
  return p.then(
    (v) => v,
    (err) => {
      errors.push(`${label}: ${err?.message || String(err)}`)
      return null
    },
  )
}

export async function loadAc52Scopes(scopes: Ac52DataScope[]): Promise<Ac52HydratePayload & { meta: { errors: string[] } }> {
  const wanted = Array.from(new Set(scopes))
  const errors: string[] = []
  const data: Ac52HydratePayload['data'] = {}

  if (wanted.includes('coa')) {
    // NOTE: chartOfAccountsApi.getChartOfAccounts() already unwraps the {success,data}
    // envelope internally (`return response.data`) despite its TS signature claiming
    // AccountingResponse<ChartOfAccount[]> — the real return value is the array itself.
    const res = await settle(chartOfAccountsApi.getChartOfAccounts(), 'chartOfAccounts', errors)
    // Omit `accounts` entirely on failure so the host leaves existing data untouched
    // instead of wiping the page to empty on a transient network/auth error.
    if (Array.isArray(res)) {
      data.accounts = adaptAc52Accounts(res)
    }
  }

  if (wanted.includes('journals')) {
    // No status filter: backend defaults to POSTED_AND_PENDING, which is exactly
    // what the mock's Journal Entries / General Ledger pages need to show.
    const res = await settle(accountingApi.getJournalEntries(), 'journalEntries', errors)
    if (Array.isArray(res?.data)) {
      data.journals = adaptAc52Journals(res!.data! as any)
    }
  }

  return { data, meta: { errors } }
}
