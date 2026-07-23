"use client"

import { useMemo, useState } from "react"
import { TrendingUp, Users, Settings, Lightbulb, ChevronDown, ChevronUp, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmProgress } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type PillarId = "financial" | "customer" | "internal" | "learning"

type Goal = { id: string; title: string; weight: number }

type Pillar = {
  id: PillarId
  title: string
  description: string
  icon: typeof TrendingUp
  color: string
  bg: string
  weight: number
  goals: Goal[]
}

const initialPillars: Pillar[] = [
  {
    id: "financial",
    title: "Financial",
    description: "Maximize long-term shareholder value",
    icon: TrendingUp,
    color: "#7C3AED",
    bg: "#F5F3FF",
    weight: 30,
    goals: [
      { id: "f1", title: "Grow Revenue Sustainably", weight: 40 },
      { id: "f2", title: "Improve Profitability", weight: 30 },
      { id: "f3", title: "Optimize Capital Efficiency", weight: 30 },
    ],
  },
  {
    id: "customer",
    title: "Customer",
    description: "Deliver exceptional value and experience",
    icon: Users,
    color: "#2563EB",
    bg: "#EFF6FF",
    weight: 25,
    goals: [
      { id: "c1", title: "Increase Customer Satisfaction", weight: 35 },
      { id: "c2", title: "Grow Market Share", weight: 35 },
      { id: "c3", title: "Deepen Customer Relationships", weight: 30 },
    ],
  },
  {
    id: "internal",
    title: "Internal Process",
    description: "Drive efficient and innovative operations",
    icon: Settings,
    color: "#10B981",
    bg: "#ECFDF5",
    weight: 25,
    goals: [
      { id: "i1", title: "Operational Excellence", weight: 40 },
      { id: "i2", title: "Ensure Quality & Compliance", weight: 35 },
      { id: "i3", title: "Optimize Supply Chain", weight: 25 },
    ],
  },
  {
    id: "learning",
    title: "Learning & Growth",
    description: "Build capabilities and engaged teams",
    icon: Lightbulb,
    color: "#F97316",
    bg: "#FFF7ED",
    weight: 20,
    goals: [
      { id: "l1", title: "Build Future-Ready Skills", weight: 40 },
      { id: "l2", title: "Engage & Empower People", weight: 35 },
      { id: "l3", title: "Strengthen Leadership Capability", weight: 25 },
    ],
  },
]

export function PillarsMockScreen() {
  const [saved, setSaved] = useState<Pillar[]>(initialPillars)
  const [draft, setDraft] = useState<Pillar[]>(initialPillars)
  const [expanded, setExpanded] = useState<Record<PillarId, boolean>>({ financial: true, customer: false, internal: false, learning: false })

  const pillarWeightTotal = useMemo(() => draft.reduce((s, p) => s + p.weight, 0), [draft])

  const goalWeightTotals = useMemo(() => {
    const map: Record<PillarId, number> = { financial: 0, customer: 0, internal: 0, learning: 0 }
    draft.forEach((p) => (map[p.id] = p.goals.reduce((s, g) => s + g.weight, 0)))
    return map
  }, [draft])

  const isDirty = JSON.stringify(saved) !== JSON.stringify(draft)
  const isValid = pillarWeightTotal === 100 && draft.every((p) => goalWeightTotals[p.id] === 100)

  const setPillarWeight = (id: PillarId, weight: number) => {
    setDraft((prev) => prev.map((p) => (p.id === id ? { ...p, weight } : p)))
  }

  const setGoalWeight = (pillarId: PillarId, goalId: string, weight: number) => {
    setDraft((prev) =>
      prev.map((p) => (p.id === pillarId ? { ...p, goals: p.goals.map((g) => (g.id === goalId ? { ...g, weight } : g)) } : p))
    )
  }

  const toggleExpand = (id: PillarId) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleSave = () => {
    if (!isValid) {
      toast.error("Weights must total 100%", { description: "Fix pillar and goal weights before saving." })
      return
    }
    setSaved(draft)
    toast.success("BSC weights saved", { description: "Pillar and goal weights updated for FY 2026." })
  }

  const handleReset = () => {
    setDraft(saved)
    toast.message("Changes discarded")
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration", "BSC Pillars"]} searchPlaceholder="Search pillars, goals…" />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="BSC Pillars & Weights"
          subtitle="Configure the weighting of each balanced-scorecard perspective, and how goals within each pillar are weighted."
          actions={
            <>
              <PmButton variant="outline" onClick={handleReset} disabled={!isDirty}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </PmButton>
              <PmButton variant="primary" onClick={handleSave} disabled={!isDirty}>
                <Save className="h-3.5 w-3.5" /> Save Weights
              </PmButton>
            </>
          }
        />

        <PmCard className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-[#111827]">Pillar Weights</h3>
            <span className={cn("text-sm font-bold", pillarWeightTotal === 100 ? "text-[#10B981]" : "text-[#EF4444]")}>
              Total: {pillarWeightTotal}%
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mb-4">Adjust sliders so the four pillar weights sum to exactly 100%.</p>
          <div className="space-y-3">
            {draft.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]">
                      <span className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: p.bg, color: p.color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {p.title}
                    </span>
                    <span className="text-sm font-bold text-[#111827]">{p.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={p.weight}
                    onChange={(e) => setPillarWeight(p.id, Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#7C3AED]"
                    style={{ background: `linear-gradient(to right, ${p.color} ${p.weight}%, #F3F4F6 ${p.weight}%)` }}
                  />
                </div>
              )
            })}
          </div>
        </PmCard>

        <div>
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Goal Weights per Pillar</h3>
          <div className="space-y-3">
            {draft.map((p) => {
              const Icon = p.icon
              const isOpen = expanded[p.id]
              const goalTotal = goalWeightTotals[p.id]
              return (
                <PmCard key={p.id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpand(p.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#F9FAFB]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: p.bg, color: p.color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-semibold text-[#111827] truncate">{p.title}</p>
                        <p className="text-[11px] text-[#9CA3AF] truncate">{p.goals.length} goals · Pillar weight {p.weight}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn("text-xs font-semibold", goalTotal === 100 ? "text-[#10B981]" : "text-[#EF4444]")}>
                        Goals: {goalTotal}%
                      </span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-[#9CA3AF]" /> : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#F1F5F9]">
                      {p.goals.map((g) => (
                        <div key={g.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#374151]">{g.title}</span>
                            <span className="text-xs font-semibold text-[#111827]">{g.weight}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={g.weight}
                            onChange={(e) => setGoalWeight(p.id, g.id, Number(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ background: `linear-gradient(to right, ${p.color} ${g.weight}%, #F3F4F6 ${g.weight}%)` }}
                          />
                          <PmProgress value={g.weight} className="mt-1" color={p.color} />
                        </div>
                      ))}
                    </div>
                  )}
                </PmCard>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
