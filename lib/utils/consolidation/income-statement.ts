type ReportCurrency = {
  id: string
  code: string
  name?: string
  symbol?: string
}

type IncomeAccount = {
  accountId: string
  accountName: string
  amount?: number
  netAmount?: number
}

type IncomeSection = {
  label: string
  accounts: IncomeAccount[]
  total: number
}

type IncomeStatementLike = {
  period: {
    startDate: string
    endDate: string
  }
  currency: ReportCurrency
  sections: {
    revenue: IncomeSection
    operatingExpenses: IncomeSection
    incomeTax: IncomeSection
    belowTheLine: IncomeSection
  }
  totals: {
    netIncome: number
    netIncomeBeforeTaxes: number
  }
  generatedAt?: string
}

type ExchangeRateLike = {
  date: string
  fromCurrencyId: string
  toCurrencyId: string
  rate: string | number
  isActive?: boolean
}

export type ConsolidatedIncomeRow = {
  sectionKey: "revenue" | "operatingExpenses" | "incomeTax" | "belowTheLine"
  sectionLabel: string
  accountName: string
  sourceCurrencyCode: string
  sourceAmount: number
  conversionRate: number
  consolidatedAmount: number
}

export type ConsolidatedIncomeStatement = {
  period: {
    startDate: string
    endDate: string
  }
  rows: ConsolidatedIncomeRow[]
  sectionTotals: {
    revenue: number
    operatingExpenses: number
    incomeTax: number
    belowTheLine: number
  }
  totals: {
    netIncomeBeforeTaxes: number
    netIncome: number
  }
  reportingCurrencyCode: string
  missingRates: Array<{
    fromCurrencyCode: string
    date: string
  }>
}

const toCents = (value: number): number => Math.round((value || 0) * 100)
const fromCents = (value: number): number => value / 100

const getRateToReporting = (
  rates: ExchangeRateLike[],
  fromCurrencyId: string,
  toCurrencyId: string,
  effectiveDate: string
): number | null => {
  if (!fromCurrencyId || !toCurrencyId) return null
  if (fromCurrencyId === toCurrencyId) return 1

  const targetTime = new Date(effectiveDate).getTime()

  const direct = rates
    .filter((r) => (r.isActive ?? true) && r.fromCurrencyId === fromCurrencyId && r.toCurrencyId === toCurrencyId)
    .map((r) => ({ ...r, t: new Date(r.date).getTime(), n: Number(r.rate) }))
    .filter((r) => Number.isFinite(r.t) && Number.isFinite(r.n) && r.t <= targetTime)
    .sort((a, b) => b.t - a.t)[0]

  if (direct) return direct.n

  const reverse = rates
    .filter((r) => (r.isActive ?? true) && r.fromCurrencyId === toCurrencyId && r.toCurrencyId === fromCurrencyId)
    .map((r) => ({ ...r, t: new Date(r.date).getTime(), n: Number(r.rate) }))
    .filter((r) => Number.isFinite(r.t) && Number.isFinite(r.n) && r.n !== 0 && r.t <= targetTime)
    .sort((a, b) => b.t - a.t)[0]

  if (reverse) return 1 / reverse.n

  return null
}

export const buildConsolidatedIncomeStatement = (
  statements: IncomeStatementLike[],
  rates: ExchangeRateLike[],
  reportingCurrencyId: string,
  reportingCurrencyCode: string
): ConsolidatedIncomeStatement | null => {
  if (!statements.length) return null

  const rows: ConsolidatedIncomeRow[] = []
  const missingRates: Array<{ fromCurrencyCode: string; date: string }> = []
  const sectionTotalsCents = {
    revenue: 0,
    operatingExpenses: 0,
    incomeTax: 0,
    belowTheLine: 0,
  }

  statements.forEach((statement) => {
    const effectiveDate = statement.period.endDate
    const sectionKeys: Array<"revenue" | "operatingExpenses" | "incomeTax" | "belowTheLine"> = [
      "revenue",
      "operatingExpenses",
      "incomeTax",
      "belowTheLine",
    ]

    sectionKeys.forEach((sectionKey) => {
      const section = statement.sections[sectionKey]
      section.accounts.forEach((account) => {
        const sourceAmount = Number(account.amount ?? account.netAmount ?? 0)
        const rate = getRateToReporting(rates, statement.currency.id, reportingCurrencyId, effectiveDate)

        if (rate === null) {
          missingRates.push({
            fromCurrencyCode: statement.currency.code,
            date: effectiveDate,
          })
          return
        }

        // Business rule confirmed in this project: consolidated amount = source amount * rate.
        const consolidatedAmount = fromCents(toCents(sourceAmount * rate))
        sectionTotalsCents[sectionKey] += toCents(consolidatedAmount)

        rows.push({
          sectionKey,
          sectionLabel: section.label,
          accountName: account.accountName,
          sourceCurrencyCode: statement.currency.code,
          sourceAmount,
          conversionRate: rate,
          consolidatedAmount,
        })
      })
    })
  })

  const revenue = fromCents(sectionTotalsCents.revenue)
  const operatingExpenses = fromCents(sectionTotalsCents.operatingExpenses)
  const incomeTax = fromCents(sectionTotalsCents.incomeTax)
  const belowTheLine = fromCents(sectionTotalsCents.belowTheLine)
  const netIncomeBeforeTaxes = fromCents(toCents(revenue - operatingExpenses))
  const netIncome = fromCents(toCents(netIncomeBeforeTaxes - incomeTax + belowTheLine))

  return {
    period: {
      startDate: statements[0].period.startDate,
      endDate: statements[0].period.endDate,
    },
    rows,
    sectionTotals: {
      revenue,
      operatingExpenses,
      incomeTax,
      belowTheLine,
    },
    totals: {
      netIncomeBeforeTaxes,
      netIncome,
    },
    reportingCurrencyCode,
    missingRates,
  }
}
