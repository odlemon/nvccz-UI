export const money = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const compact = (n: number) =>
  Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)

export const qty = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 })

export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
