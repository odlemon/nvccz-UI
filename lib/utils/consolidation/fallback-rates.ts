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

const USD_ZWL_FALLBACK_RATE = 25.3745

export const withUsdZwlFallbackRates = (
  rates: ExchangeRateLike[],
  currencies: CurrencyLike[]
): ExchangeRateLike[] => {
  const usd = currencies.find((c) => c.code?.toUpperCase() === "USD")
  const zwl = currencies.find((c) => {
    const code = c.code?.toUpperCase()
    return code === "ZWL" || code === "ZIG" || code === "ZIG$"
  })

  if (!usd || !zwl) return rates

  const hasUsdToZwl = rates.some(
    (r) => r.fromCurrencyId === usd.id && r.toCurrencyId === zwl.id && Number.isFinite(Number(r.rate))
  )
  const hasZwlToUsd = rates.some(
    (r) => r.fromCurrencyId === zwl.id && r.toCurrencyId === usd.id && Number.isFinite(Number(r.rate))
  )

  const baseDate = "1970-01-01T00:00:00.000Z"
  const fallback: ExchangeRateLike[] = []

  if (!hasUsdToZwl) {
    fallback.push({
      date: baseDate,
      fromCurrencyId: usd.id,
      toCurrencyId: zwl.id,
      rate: USD_ZWL_FALLBACK_RATE,
      isActive: true,
    })
  }

  if (!hasZwlToUsd) {
    fallback.push({
      date: baseDate,
      fromCurrencyId: zwl.id,
      toCurrencyId: usd.id,
      rate: 1 / USD_ZWL_FALLBACK_RATE,
      isActive: true,
    })
  }

  return [...rates, ...fallback]
}
