/**
 * Presentation helpers for the fundraising settings screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type PipelineStage = {
  id: string
  name: string
  /** null when this is a reference stage code (no live campaign/probability configured) */
  probability: number | null
}

export type StageGate = {
  id: string
  from: string
  to: string
  requirements: string[]
}

export type FrRole = {
  id: string
  name: string
  summary: string
  permissions: string[]
}

export type FrNotification = {
  id: string
  label: string
  enabled: boolean
}

/**
 * Fallback reference stages — used only when no live campaign of that type exists yet.
 * Codes/order from design-refs/fundraising-frontend-api.md ("PE / VC stage codes (seed order)"
 * and "AM mandate stage codes"). No probability shown — that is server-configured per campaign.
 */

/** SRD amount type labels (fundraising-frontend.md guardrails table) — read-only, independent, never overwrite each other. */
export const AMOUNT_TYPES = [
  "Indicative",
  "Qualified",
  "Soft Circle",
  "Proposed",
  "Signed",
  "Admitted",
  "Funded",
  "Expected AUM",
  "Activated AUM",
] as const

export type AmountType = (typeof AMOUNT_TYPES)[number]

export function probabilityColor(value: number | null): string {
  if (value == null) return "#94a3b8"
  if (value >= 80) return "#16a34a"
  if (value >= 60) return "#2563eb"
  if (value >= 40) return "#0284c7"
  if (value >= 25) return "#7c3aed"
  return "#94a3b8"
}
