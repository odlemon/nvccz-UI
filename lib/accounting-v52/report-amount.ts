/** Match the two-decimal amounts displayed on Accounting reports. */
export function reportAmount(value: unknown): number {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) throw new Error('The report contains an invalid amount.')
  return Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100
}
