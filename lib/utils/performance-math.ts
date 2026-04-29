/**
 * Performance Module Mathematical Engine
 * Null-safe, division-by-zero safe, 4-decimal precision per UAT C-Series.
 */

const PRECISION = 4

export const round = (value: number, decimals = PRECISION): number => {
  if (!Number.isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export interface WeightedItem {
  value: number | null | undefined
  weight: number | null | undefined
}

/**
 * Weighted rollup with null-safety and division-by-zero protection.
 * Returns 0 when all weights are missing/zero.
 */
export const weightedRollup = (items: WeightedItem[]): number => {
  const valid = items.filter(
    (i) =>
      i.value !== null &&
      i.value !== undefined &&
      Number.isFinite(i.value) &&
      i.weight !== null &&
      i.weight !== undefined &&
      Number.isFinite(i.weight) &&
      i.weight > 0
  )
  if (valid.length === 0) return 0

  const totalWeight = valid.reduce((acc, i) => acc + (i.weight as number), 0)
  if (totalWeight <= 0) return 0

  const weightedSum = valid.reduce(
    (acc, i) => acc + (i.value as number) * (i.weight as number),
    0
  )
  return round(weightedSum / totalWeight)
}

/**
 * Reverse KPI: lower is better. Score is the inverse ratio.
 * Examples: defect rate, cost overrun.
 */
export const reverseKpiScore = (
  actual: number | null | undefined,
  target: number | null | undefined
): number => {
  if (
    actual === null ||
    actual === undefined ||
    target === null ||
    target === undefined ||
    !Number.isFinite(actual) ||
    !Number.isFinite(target)
  ) {
    return 0
  }
  if (actual <= 0) return 100
  if (target <= 0) return 0
  const score = (target / actual) * 100
  return round(Math.min(score, 200))
}

/**
 * Standard KPI: higher is better.
 */
export const standardKpiScore = (
  actual: number | null | undefined,
  target: number | null | undefined
): number => {
  if (
    actual === null ||
    actual === undefined ||
    target === null ||
    target === undefined ||
    !Number.isFinite(actual) ||
    !Number.isFinite(target) ||
    target <= 0
  ) {
    return 0
  }
  return round(Math.min((actual / target) * 100, 200))
}

/**
 * Stretch goal: target is the floor (100%), stretch is the ceiling (200%).
 */
export const stretchGoalScore = (
  actual: number | null | undefined,
  target: number | null | undefined,
  stretchTarget: number | null | undefined
): number => {
  if (
    actual === null ||
    actual === undefined ||
    target === null ||
    target === undefined ||
    !Number.isFinite(actual) ||
    !Number.isFinite(target) ||
    target <= 0
  ) {
    return 0
  }
  if (!stretchTarget || !Number.isFinite(stretchTarget) || stretchTarget <= target) {
    return standardKpiScore(actual, target)
  }
  if (actual <= target) {
    return round((actual / target) * 100)
  }
  const bonus = ((actual - target) / (stretchTarget - target)) * 100
  return round(Math.min(100 + bonus, 200))
}

/**
 * Multi-parent rollup: average contribution to all parent goals.
 * Each parent provides a (score, weight) pair representing this child's share.
 */
export interface ParentContribution {
  score: number | null | undefined
  weight: number | null | undefined
}

export const multiParentRollup = (parents: ParentContribution[]): number =>
  weightedRollup(
    parents.map((p) => ({ value: p.score, weight: p.weight }))
  )

/**
 * Validates that a weight map sums to exactly 100.0 (with float tolerance).
 */
export const isValid100PercentSum = (
  weights: Record<string, number> | number[],
  tolerance = 0.01
): { valid: boolean; total: number; error?: string } => {
  const values = Array.isArray(weights) ? weights : Object.values(weights)
  if (values.length === 0) {
    return { valid: false, total: 0, error: "No weights provided" }
  }
  if (values.some((v) => v < 0)) {
    return { valid: false, total: 0, error: "Weights cannot be negative" }
  }
  const total = round(
    values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0)
  )
  if (Math.abs(total - 100) > tolerance) {
    return {
      valid: false,
      total,
      error: `Balance Required: total is ${total}%, must equal 100%`,
    }
  }
  return { valid: true, total }
}
