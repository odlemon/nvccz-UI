/**
 * Presentation helpers for the fundraising pipeline screen:
 * chip/label classes, option lists and shared types.
 *
 * All data on that screen comes from the API — nothing here fabricates values.
 */

export type PipelineFilter = "all" | "vc" | "pe" | "am"

export type PipelineKpi = {
  id: string
  label: string
  value: string
  meta: string
  pct: number
  icon: "target" | "users" | "shield" | "handshake" | "coins" | "pie"
  accent: string
  bar: string
}

export type PipelineStage = {
  name: string
  count: number
  amount: string
  amountNum: number
  pct: number
  color: string
}

export type OpportunityRow = {
  id: string
  investor: string
  initials: string
  type: string
  fundType: PipelineFilter
  stage: string
  stageTone: "blue" | "navy" | "sky" | "green" | "vivid" | "purple"
  ticket: string
  probability: number
  owner: string
  ownerInitials: string
  nextStep: string
  nextDate: string
  lastContact: string
}

export type UpcomingItem = {
  id: string
  title: string
  subtitle: string
  date: string
  time: string
  tone: "purple" | "green" | "indigo" | "blue" | "amber" | "sky"
  kind: "meeting" | "task" | "people" | "travel" | "call" | "prep"
  location?: string
  owner?: string
  notes?: string
  status?: string
}

export type ActivityItem = {
  id: string
  parts: { text: string; bold?: boolean }[]
  actor: string
  when: string
  tone: "blue" | "green" | "purple" | "sky" | "amber"
  detail?: string
}

