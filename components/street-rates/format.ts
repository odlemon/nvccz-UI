export const CURRENCIES = [
  "USD", "ZWG", "ZAR", "GBP", "EUR",
  "BWP", "ZMW", "MZN", "AUD", "CAD", "CNY", "INR", "JPY", "AED",
]

// Respects whatever precision the backend returned in a numeric string (e.g. "26.9181" -> 4dp)
// instead of hardcoding a decimals count nothing in the /widget response actually provides.
export function decimalsOf(numStr: string, fallback = 2): number {
  const idx = numStr.indexOf(".")
  if (idx === -1) return fallback
  return Math.max(fallback, numStr.length - idx - 1)
}

export function fmtRate(value: number | null | undefined, decimals = 2): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}
