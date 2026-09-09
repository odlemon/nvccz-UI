/**
 * Presentation helpers for the fundraising forecasts screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type ScenarioId = "downside" | "base" | "upside"

export type ScenarioAssumptions = {
  closeVelocity: number
  winRate: number
  avgTicketM: number
  feeRatePct: number
  pipelineDecay: number
}

export const DEFAULT_ASSUMPTIONS: ScenarioAssumptions = {
  closeVelocity: 50,
  winRate: 40,
  avgTicketM: 3,
  feeRatePct: 2,
  pipelineDecay: 10,
}

export const SCENARIO_OPTIONS: { id: ScenarioId; label: string; description: string }[] = [
  {
    id: "downside",
    label: "Downside",
    description: "Slower closes, lower win rate — conservative fee outlook",
  },
  {
    id: "base",
    label: "Base",
    description: "Current velocity and conversion — management plan",
  },
  {
    id: "upside",
    label: "Upside",
    description: "Accelerated closes with anchor re-ups and co-invest interest",
  },
]
