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

type BalanceAccount = {
  accountNo: string
  accountName: string
  balance: number
}

type BalanceSheetLike = {
  asOfDate: string
  currency: string
  assets: {
    currentAssets: { accounts: BalanceAccount[]; total: number }
    fixedAssets: { accounts: BalanceAccount[]; total: number; accumulatedDepreciation?: number }
    otherAssets: { accounts: BalanceAccount[]; total: number }
    totalAssets: number
  }
  liabilities: {
    currentLiabilities: { accounts: BalanceAccount[]; total: number }
    longTermLiabilities: { accounts: BalanceAccount[]; total: number }
    totalLiabilities: number
  }
  equity: {
    accounts: BalanceAccount[]
    total: number
    retainedEarnings: number
  }
  totalLiabilitiesAndEquity: number
}

export type ConsolidatedBalanceRow = {
  section: "assets" | "liabilities" | "equity"
  group: string
  accountNo: string
  accountName: string
  sourceCurrencyCode: string
  sourceAmount: number
  spotRate: number
  consolidatedAmount: number
}

export type ConsolidatedBalanceSheet = {
  asOfDate: string
  reportingCurrencyCode: string
  rows: ConsolidatedBalanceRow[]
  totals: {
    assets: number
    liabilities: number
    equity: number
    liabilitiesAndEquity: number
  }
  isBalanced: boolean
  difference: number
  missingRates: Array<{ fromCurrencyCode: string; date: string }>
}

const toCents = (value: number): number => Math.round((value || 0) * 100)
const fromCents = (value: number): number => value / 100

const getSpotRate = (
  rates: ExchangeRateLike[],
  fromCurrencyId: string,
  toCurrencyId: string,
  asOfDate: string
): number | null => {
  if (fromCurrencyId === toCurrencyId) return 1

  const t = new Date(asOfDate).getTime()

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

export const buildConsolidatedBalanceSheet = (
  statements: Array<{ currency: CurrencyLike; sheet: BalanceSheetLike }>,
  rates: ExchangeRateLike[],
  reportingCurrency: CurrencyLike
): ConsolidatedBalanceSheet | null => {
  if (!statements.length) return null

  const rows: ConsolidatedBalanceRow[] = []
  const missingRates: Array<{ fromCurrencyCode: string; date: string }> = []

  let totalAssetsCents = 0
  let totalLiabilitiesCents = 0
  let totalEquityCents = 0

  const addRows = (
    section: "assets" | "liabilities" | "equity",
    group: string,
    accounts: BalanceAccount[],
    sourceCurrency: CurrencyLike,
    asOfDate: string
  ) => {
    const rate = getSpotRate(rates, sourceCurrency.id, reportingCurrency.id, asOfDate)
    if (rate === null) {
      missingRates.push({ fromCurrencyCode: sourceCurrency.code, date: asOfDate })
      return
    }

    accounts.forEach((account) => {
      const sourceAmount = Number(account.balance || 0)
      const consolidatedAmount = fromCents(toCents(sourceAmount * rate))

      rows.push({
        section,
        group,
        accountNo: account.accountNo,
        accountName: account.accountName,
        sourceCurrencyCode: sourceCurrency.code,
        sourceAmount,
        spotRate: rate,
        consolidatedAmount,
      })

      if (section === "assets") totalAssetsCents += toCents(consolidatedAmount)
      if (section === "liabilities") totalLiabilitiesCents += toCents(consolidatedAmount)
      if (section === "equity") totalEquityCents += toCents(consolidatedAmount)
    })
  }

  statements.forEach(({ currency, sheet }) => {
    const asOfDate = sheet.asOfDate

    addRows("assets", "Current Assets", sheet.assets.currentAssets.accounts || [], currency, asOfDate)
    addRows("assets", "Fixed Assets", sheet.assets.fixedAssets.accounts || [], currency, asOfDate)
    addRows("assets", "Other Assets", sheet.assets.otherAssets.accounts || [], currency, asOfDate)

    addRows("liabilities", "Current Liabilities", sheet.liabilities.currentLiabilities.accounts || [], currency, asOfDate)
    addRows("liabilities", "Long-Term Liabilities", sheet.liabilities.longTermLiabilities.accounts || [], currency, asOfDate)

    addRows("equity", "Equity", sheet.equity.accounts || [], currency, asOfDate)
  })

  const assets = fromCents(totalAssetsCents)
  const liabilities = fromCents(totalLiabilitiesCents)
  const equity = fromCents(totalEquityCents)
  const liabilitiesAndEquity = fromCents(totalLiabilitiesCents + totalEquityCents)
  const difference = fromCents(Math.abs(totalAssetsCents - (totalLiabilitiesCents + totalEquityCents)))

  return {
    asOfDate: statements[0].sheet.asOfDate,
    reportingCurrencyCode: reportingCurrency.code,
    rows,
    totals: {
      assets,
      liabilities,
      equity,
      liabilitiesAndEquity,
    },
    isBalanced: difference < 0.01,
    difference,
    missingRates,
  }
}
