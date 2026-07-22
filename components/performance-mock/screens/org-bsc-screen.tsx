"use client"

import { useMemo, useState } from "react"
import { TrendingUp, Users, Settings, Lightbulb, AlertTriangle, CheckCircle2, Bell, Target, Link2 } from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"
import { pm } from "@/lib/performance-mock/tokens"
import { cn } from "@/lib/utils"

type Status = "On Track" | "At Risk" | "Off Track"

type Pillar = {
  id: string
  title: string
  weight: number
  score: number
  status: Status
  icon: typeof TrendingUp
  color: string
  bg: string
  objectiveCount: number
  goalsAligned: number
  goalsTotal: number
}

const pillars: Pillar[] = [
  { id: "financial", title: "Financial", weight: 30, score: 84, status: "On Track", icon: TrendingUp, color: "#7C3AED", bg: "#F5F3FF", objectiveCount: 4, goalsAligned: 11, goalsTotal: 12 },
  { id: "customer", title: "Customer", weight: 25, score: 76, status: "At Risk", icon: Users, color: "#2563EB", bg: "#EFF6FF", objectiveCount: 4, goalsAligned: 9, goalsTotal: 12 },
  { id: "internal", title: "Internal Process", weight: 25, score: 89, status: "On Track", icon: Settings, color: "#10B981", bg: "#ECFDF5", objectiveCount: 4, goalsAligned: 10, goalsTotal: 10 },
  { id: "learning", title: "Learning & Growth", weight: 20, score: 71, status: "At Risk", icon: Lightbulb, color: "#F97316", bg: "#FFF7ED", objectiveCount: 4, goalsAligned: 8, goalsTotal: 11 },
]

type AlertItem = { id: string; severity: "Critical" | "High" | "Medium"; text: string; pillar: string; time: string }

const alerts: AlertItem[] = [
  { id: "a1", severity: "High", text: "Digital Adoption trending below target for 3 consecutive weeks.", pillar: "Customer", time: "2hr ago" },
  { id: "a2", severity: "Medium", text: "Innovation Index at risk due to resource constraints on product roadmap.", pillar: "Learning & Growth", time: "6hr ago" },
  { id: "a3", severity: "Critical", text: "SLA Compliance breached threshold in APAC support region.", pillar: "Customer", time: "1d ago" },
]

const severityTone: Record<AlertItem["severity"], "danger" | "warning" | "info"> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
}

function statusTone(status: Status): "success" | "warning" | "danger" {
  if (status === "On Track") return "success"
  if (status === "At Risk") return "warning"
  return "danger"
}

function CircularScore({ value, size = 120 }: { value: number; size?: number }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#F3F4F6" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={pm.primary} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#111827]">{value}%</span>
        <span className="text-[10px] text-[#9CA3AF]">Overall Score</span>
      </div>
    </div>
  )
}

export function OrgBscMockScreen() {
  const [period, setPeriod] = useState("Q2 2026 (Apr – Jun)")
  const [selectedPillarId, setSelectedPillarId] = useState<string>("financial")

  const overallScore = useMemo(() => {
    const weighted = pillars.reduce((s, p) => s + p.score * (p.weight / 100), 0)
    return Math.round(weighted)
  }, [])

  const goalsAligned = pillars.reduce((s, p) => s + p.goalsAligned, 0)
  const goalsTotal = pillars.reduce((s, p) => s + p.goalsTotal, 0)
  const alignmentPct = Math.round((goalsAligned / goalsTotal) * 100)
  const atRiskPillars = pillars.filter((p) => p.status !== "On Track").length
  const selectedPillar = pillars.find((p) => p.id === selectedPillarId) || pillars[0]

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Scorecards", "Org BSC"]} searchPlaceholder="Search pillars, objectives…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Organizational Balanced Scorecard"
          subtitle="Company-wide scorecard aggregating performance across the four balanced-scorecard perspectives."
          actions={<PmSelectChip label={period} onClick={() => setPeriod(period.startsWith("Q2") ? "Q1 2026 (Jan – Mar)" : "Q2 2026 (Apr – Jun)")} />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <PmCard className="p-5 flex flex-col items-center justify-center text-center">
            <CircularScore value={overallScore} />
            <p className="mt-3 text-xs text-[#6B7280]">{period}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">▲ 3.8% vs prior quarter</span>
          </PmCard>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PmCard className="p-3.5">
              <p className="text-[11px] font-medium text-[#6B7280]">Strategic Pillars</p>
              <p className="mt-1 text-xl font-bold text-[#111827]">{pillars.length}</p>
            </PmCard>
            <PmCard className="p-3.5">
              <p className="text-[11px] font-medium text-[#6B7280]">Goals Aligned</p>
              <p className="mt-1 text-xl font-bold text-[#111827]">
                {goalsAligned}/{goalsTotal}
              </p>
            </PmCard>
            <PmCard className="p-3.5">
              <p className="text-[11px] font-medium text-[#6B7280]">Alignment Rate</p>
              <p className="mt-1 text-xl font-bold text-[#111827]">{alignmentPct}%</p>
            </PmCard>
            <PmCard className="p-3.5">
              <p className="text-[11px] font-medium text-[#6B7280]">Pillars At Risk</p>
              <p className="mt-1 text-xl font-bold text-[#F59E0B]">{atRiskPillars}</p>
            </PmCard>
            <div className="col-span-2 sm:col-span-4">
              <PmCard className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#111827]">Goals Alignment to Strategy</h3>
                  <span className="text-xs font-semibold text-[#7C3AED]">{alignmentPct}%</span>
                </div>
                <PmProgress value={alignmentPct} />
                <p className="mt-2 text-[11px] text-[#6B7280]">
                  {goalsAligned} of {goalsTotal} department and employee goals are explicitly linked to a strategic pillar objective.
                </p>
              </PmCard>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Pillar Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {pillars.map((p) => {
              const Icon = p.icon
              const active = selectedPillarId === p.id
              return (
                <PmCard
                  key={p.id}
                  className={cn("p-4", active && "ring-2 ring-[#DDD6FE]")}
                  onClick={() => setSelectedPillarId(p.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: p.bg, color: p.color }}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <PmStatusPill label={p.status} tone={statusTone(p.status)} />
                  </div>
                  <h4 className="mt-2.5 text-sm font-semibold text-[#111827]">{p.title}</h4>
                  <p className="text-[11px] text-[#9CA3AF]">Weight: {p.weight}%</p>
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">Score</span>
                    <span className="font-semibold text-[#111827]">{p.score}%</span>
                  </div>
                  <PmProgress value={p.score} className="mt-1.5" color={p.color} />
                  <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#6B7280]">
                    <span>{p.objectiveCount} objectives</span>
                    <span>
                      {p.goalsAligned}/{p.goalsTotal} goals
                    </span>
                  </div>
                </PmCard>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          <PmCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-[#7C3AED]" />
              <h3 className="text-sm font-semibold text-[#111827]">{selectedPillar.title} — Goals Alignment</h3>
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: selectedPillar.goalsTotal }).map((_, i) => {
                const aligned = i < selectedPillar.goalsAligned
                return (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-[#F1F5F9]">
                    <span className="inline-flex items-center gap-2 text-xs text-[#374151] min-w-0">
                      <Target className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                      <span className="truncate">
                        {selectedPillar.title} objective goal #{i + 1}
                      </span>
                    </span>
                    {aligned ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981] shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aligned
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#F59E0B] shrink-0">Unaligned</span>
                    )}
                  </div>
                )
              })}
            </div>
          </PmCard>

          <PmCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#EF4444]" />
                <h3 className="text-sm font-semibold text-[#111827]">Strategic Alerts</h3>
              </div>
              <PmButton variant="ghost" className="h-7 px-2 text-[11px]">
                View all
              </PmButton>
            </div>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <PmStatusPill label={a.severity} tone={severityTone[a.severity]} />
                      <span className="text-[10px] text-[#9CA3AF]">{a.pillar}</span>
                    </div>
                    <p className="text-xs text-[#374151] mt-1 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </PmCard>
        </div>
      </div>
    </div>
  )
}
