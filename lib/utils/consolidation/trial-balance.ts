type CurrencyLike = {
  id: string
  code: string
}

type ExchangeRateLike = {
  date: string
  fromCurrencyId: string
  toCurrencyId: string
  rate: string | number
  isActive?: boolean
}

type TrialBalanceAccountLike = {
  accountId: string
  accountNo: string
  accountName: string
  accountType: string
  debitBalance: number
  creditBalance: number
}

type TrialBalanceLike = {
  date: string
  accounts: TrialBalanceAccountLike[]
  totals: {
    totalDebits: number
    totalCredits: number
    isBalanced: boolean
  }
}

export type ConsolidatedTrialBalanceRow = {
  accountId: string
  accountNo: string
  accountName: string
  accountType: string
  sourceCurrencyCode: string
  sourceDebit: number
  sourceCredit: number
  conversionRate: number
  consolidatedDebit: number
  consolidatedCredit: number
}

export type ConsolidatedTrialBalance = {
  date: string
  reportingCurrencyCode: string
  rows: ConsolidatedTrialBalanceRow[]
  totals: {
    totalDebits: number
    totalCredits: number
    isBalanced: boolean
  }
  missingRates: Array<{ fromCurrencyCode: string; date: string }>
}

const toCents = (value: number): number => Math.round((value || 0) * 100)
const fromCents = (value: number): number => value / 100

const resolveRate = (
  rates: ExchangeRateLike[],
  fromCurrencyId: string,
  toCurrencyId: string,
  effectiveDate: string
): number | null => {
  if (fromCurrencyId === toCurrencyId) return 1

  const t = new Date(effectiveDate).getTime()

  const direct = rates
    .filter((r) => (r.isActive ?? true) && r.fromCurrencyId === fromCurrencyId && r.toCurrencyId === toCurrencyId)
    .map((r) => ({ ...r, rt: Number(r.rate), dt: new Date(r.date).getTime() }))
    .filter((r) => Number.isFinite(r.rt) && Number.isFinite(r.dt) && r.dt <= t)
    .sort((a, b) => b.dt - a.dt)[0]

  if (direct) return direct.rt

  const reverse = rates
    .filter((r) => (r.isActive ?? true) && r.fromCurrencyId === toCurrencyId && r.toCurrencyId === fromCurrencyId)
    .map((r) => ({ ...r, rt: Number(r.rate), dt: new Date(r.date).getTime() }))
    .filter((r) => Number.isFinite(r.rt) && Number.isFinite(r.dt) && r.rt !== 0 && r.dt <= t)
    .sort((a, b) => b.dt - a.dt)[0]

  if (reverse) return 1 / reverse.rt

  return null
}

export const buildConsolidatedTrialBalance = (
  statements: Array<{ currency: CurrencyLike; trialBalance: TrialBalanceLike }>,
  rates: ExchangeRateLike[],
  reportingCurrency: CurrencyLike
): ConsolidatedTrialBalance | null => {
  if (!statements.length) return null

  const rows: ConsolidatedTrialBalanceRow[] = []
  const missingRates: Array<{ fromCurrencyCode: string; date: string }> = []
  let totalDebitsCents = 0
  let totalCreditsCents = 0

  statements.forEach(({ currency, trialBalance }) => {
    const effectiveDate = trialBalance.date
    const rate = resolveRate(rates, currency.id, reportingCurrency.id, effectiveDate)

    if (rate === null) {
      missingRates.push({ fromCurrencyCode: currency.code, date: effectiveDate })
      return
    }

    trialBalance.accounts.forEach((account) => {
      const sourceDebit = Number(account.debitBalance || 0)
      const sourceCredit = Number(account.creditBalance || 0)

      const consolidatedDebit = fromCents(toCents(sourceDebit * rate))
      const consolidatedCredit = fromCents(toCents(sourceCredit * rate))

      totalDebitsCents += toCents(consolidatedDebit)
      totalCreditsCents += toCents(consolidatedCredit)

      rows.push({
        accountId: `${account.accountId}-${currency.id}`,
        accountNo: account.accountNo,
        accountName: account.accountName,
        accountType: account.accountType,
        sourceCurrencyCode: currency.code,
        sourceDebit,
        sourceCredit,
        conversionRate: rate,
        consolidatedDebit,
        consolidatedCredit,
      })
    })
  })

  const totalDebits = fromCents(totalDebitsCents)
  const totalCredits = fromCents(totalCreditsCents)

  return {
    date: statements[0].trialBalance.date,
    reportingCurrencyCode: reportingCurrency.code,
    rows,
    totals: {
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    },
    missingRates,
  }
}
