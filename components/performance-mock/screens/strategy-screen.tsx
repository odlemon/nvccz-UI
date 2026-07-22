"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  TrendingUp,
  Users,
  Settings2,
  Network,
  AlertTriangle,
  Target,
  Layers,
  LayoutGrid,
  List,
  Info,
  ChevronUp,
  CheckCircle2,
  Flag,
  FileText,
  X,
  Download,
  Plus,
  Calendar,
} from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmPageHeader, PmSelectChip, PmStatusPill, PmAvatar } from "@/components/performance-mock/primitives"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

type Status = "On Track" | "At Risk" | "Off Track" | "Not Started"

type Objective = {
  code: string
  title: string
  metricLabel: string
  metricValue: string
  status: Status
}

type Perspective = {
  id: string
  title: string
  description: string
  icon: typeof TrendingUp
  color: string
  bg: string
  iconBg: string
  objectives: Objective[]
}

const PHOTOS = PM_PHOTOS

const initialPerspectives: Perspective[] = [
  {
    id: "financial",
    title: "Financial",
    description: "Maximize long-term shareholder value",
    icon: TrendingUp,
    color: "#7C3AED",
    bg: "#F3E8FF",
    iconBg: "#EDE9FE",
    objectives: [
      { code: "F1", title: "Grow Revenue Sustainably", metricLabel: "Revenue Growth", metricValue: "12%", status: "On Track" },
      { code: "F2", title: "Improve Profitability", metricLabel: "Operating Margin", metricValue: "18.5%", status: "On Track" },
      { code: "F3", title: "Optimize Capital Efficiency", metricLabel: "ROIC", metricValue: "15.2%", status: "On Track" },
      { code: "F4", title: "Strengthen Financial Resilience", metricLabel: "Cash Reserves", metricValue: "$8.4M", status: "On Track" },
    ],
  },
  {
    id: "customer",
    title: "Customer",
    description: "Deliver exceptional value and experience",
    icon: Users,
    color: "#2563EB",
    bg: "#DBEAFE",
    iconBg: "#EFF6FF",
    objectives: [
      { code: "C1", title: "Increase Customer Satisfaction", metricLabel: "NPS Score", metricValue: "72", status: "On Track" },
      { code: "C2", title: "Grow Market Share", metricLabel: "Market Share", metricValue: "24.3%", status: "On Track" },
      { code: "C3", title: "Deepen Customer Relationships", metricLabel: "Retention Rate", metricValue: "91%", status: "On Track" },
      { code: "C4", title: "Expand Digital Engagement", metricLabel: "Digital Adoption", metricValue: "68%", status: "At Risk" },
    ],
  },
  {
    id: "internal",
    title: "Internal Process",
    description: "Drive efficient and innovative operations",
    icon: Settings2,
    color: "#0D9488",
    bg: "#CCFBF1",
    iconBg: "#F0FDFA",
    objectives: [
      { code: "P1", title: "Operational Excellence", metricLabel: "Process Efficiency", metricValue: "87%", status: "On Track" },
      { code: "P2", title: "Innovate & Improve", metricLabel: "Process Improvements", metricValue: "12", status: "On Track" },
      { code: "P3", title: "Ensure Quality & Compliance", metricLabel: "Quality Score", metricValue: "94%", status: "On Track" },
      { code: "P4", title: "Optimize Supply Chain", metricLabel: "On-time Delivery", metricValue: "93%", status: "On Track" },
    ],
  },
  {
    id: "learning",
    title: "Learning & Growth",
    description: "Build capabilities and engaged teams",
    icon: Network,
    color: "#EA580C",
    bg: "#FFEDD5",
    iconBg: "#FFF7ED",
    objectives: [
      { code: "L1", title: "Build Future-Ready Skills", metricLabel: "Critical Skill Coverage", metricValue: "78%", status: "On Track" },
      { code: "L2", title: "Engage & Empower People", metricLabel: "Engagement Score", metricValue: "81%", status: "On Track" },
      { code: "L3", title: "Strengthen Leadership Capability", metricLabel: "Leadership Bench Strength", metricValue: "76%", status: "On Track" },
      { code: "L4", title: "Foster Innovation Culture", metricLabel: "Innovation Index", metricValue: "73%", status: "At Risk" },
    ],
  },
]

const keyOwners = [
  { initials: "TM", name: "Tariro Moyo", role: "Chief Financial Officer", count: 4, src: PHOTOS.tariro },
  { initials: "ND", name: "Nyasha Dube", role: "Chief Customer Officer", count: 4, src: PHOTOS.nyasha },
  { initials: "TC", name: "Tawanda Chikore", role: "Chief Operations Officer", count: 4, src: PHOTOS.tawanda },
  { initials: "CN", name: "Chipo Ncube", role: "Chief People Officer", count: 4, src: PHOTOS.chipo },
]

type UpdateTone = "success" | "warning" | "purple"

const recentUpdatesFixture: {
  tone: UpdateTone
  text: string
  detail: string
  time: string
  src: string
}[] = [
  {
    tone: "success",
    text: "Tariro Moyo updated F2. Improve Profitability",
    detail: "Operating Margin target increased to 18.5%",
    time: "2h ago",
    src: PHOTOS.tariro,
  },
  {
    tone: "warning",
    text: "Nyasha Dube flagged C4. Expand Digital Engagement",
    detail: "Digital Adoption at risk due to slow uptake",
    time: "5h ago",
    src: PHOTOS.nyasha,
  },
  {
    tone: "success",
    text: "Tawanda Chikore completed P1. Operational Excellence",
    detail: "Process Efficiency improved to 87%",
    time: "1d ago",
    src: PHOTOS.tawanda,
  },
  {
    tone: "warning",
    text: "Chipo Ncube updated L4. Foster Innovation Culture",
    detail: "Innovation Index at risk — resource constraints",
    time: "2d ago",
    src: PHOTOS.chipo,
  },
  {
    tone: "purple",
    text: "Tendai Sibanda published Q1 Strategy Review",
    detail: "All perspectives reviewed successfully",
    time: "3d ago",
    src: PHOTOS.tendai,
  },
]

function statusDot(status: Status) {
  const colors: Record<Status, string> = {
    "On Track": "#10B981",
    "At Risk": "#F59E0B",
    "Off Track": "#EF4444",
    "Not Started": "#9CA3AF",
  }
  return colors[status]
}

function statusTone(status: Status): "success" | "warning" | "danger" | "neutral" {
  if (status === "On Track") return "success"
  if (status === "At Risk") return "warning"
  if (status === "Off Track") return "danger"
  return "neutral"
}

function CircularScore({ value, size = 58 }: { value: number; size?: number }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EDE9FE" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#7C3AED"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-[#111827]">{value}%</span>
      </div>
    </div>
  )
}

function StrategyMetricCard({
  label,
  value,
  trend,
  trendClass,
  subtext,
  icon,
  iconBg,
  iconColor,
  ring,
}: {
  label: string
  value: string
  trend?: string
  trendClass?: string
  subtext: string
  icon?: ReactNode
  iconBg?: string
  iconColor?: string
  ring?: number
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#6B7280]">{label}</p>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-[28px] leading-none font-bold text-[#111827] tracking-tight">{value}</p>
            {trend && <span className={cn("text-xs font-semibold", trendClass || "text-[#10B981]")}>{trend}</span>}
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF] leading-snug">{subtext}</p>
        </div>
        {ring !== undefined ? (
          <CircularScore value={ring} />
        ) : (
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

function ObjectiveCard({ o }: { o: Objective }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 min-w-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#DDD6FE] transition-colors">
      <p className="text-[13px] font-semibold text-[#111827] leading-snug">
        <span className="text-[#6B7280] font-semibold">{o.code}.</span> {o.title}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-[#9CA3AF] truncate">{o.metricLabel}</p>
          <p className="text-sm font-bold text-[#111827] mt-0.5">{o.metricValue}</p>
        </div>
        <PmStatusPill label={o.status} tone={statusTone(o.status)} />
      </div>
    </div>
  )
}

export function StrategyMockScreen() {
  const [perspectives, setPerspectives] = useState<Perspective[]>(initialPerspectives)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [period, setPeriod] = useState("FY 2026 (Jul 2025 – Jun 2026)")
  const [ownerFilter, setOwnerFilter] = useState("All Owners")
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    perspectiveId: "financial",
    code: "",
    title: "",
    metricLabel: "",
    metricValue: "",
    status: "On Track" as Status,
  })

  const allObjectives = useMemo(
    () => perspectives.flatMap((p) => p.objectives.map((o) => ({ ...o, perspective: p.title, perspectiveColor: p.color }))),
    [perspectives]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { "On Track": 0, "At Risk": 0, "Off Track": 0, "Not Started": 0 }
    allObjectives.forEach((o) => counts[o.status]++)
    return counts
  }, [allObjectives])

  const totalObjectives = allObjectives.length
  const atRiskCount = statusCounts["At Risk"] + statusCounts["Off Track"]

  const handleAddObjective = () => {
    if (!form.title.trim() || !form.code.trim()) return
    setPerspectives((prev) =>
      prev.map((p) =>
        p.id === form.perspectiveId
          ? {
              ...p,
              objectives: [
                ...p.objectives,
                {
                  code: form.code,
                  title: form.title,
                  metricLabel: form.metricLabel || "Metric",
                  metricValue: form.metricValue || "—",
                  status: form.status,
                },
              ],
            }
          : p
      )
    )
    setAddOpen(false)
    setForm({ perspectiveId: "financial", code: "", title: "", metricLabel: "", metricValue: "", status: "On Track" })
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Company Strategy"]} />
      <div className="p-5 lg:p-6 space-y-5">
        <PmPageHeader
          title="Company Strategy"
          subtitle="Visualize our strategic priorities and how they connect to drive long-term value."
          actions={
            <>
              <PmSelectChip
                icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={period}
                onClick={() =>
                  setPeriod(period.startsWith("FY 2026") ? "FY 2025 (Jul 2024 – Jun 2025)" : "FY 2026 (Jul 2025 – Jun 2026)")
                }
              />
              <PmSelectChip
                icon={<Users className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={ownerFilter}
                onClick={() => setOwnerFilter(ownerFilter === "All Owners" ? "Executive Team" : "All Owners")}
              />
              <PmButton variant="primary" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Objective
              </PmButton>
              <PmButton variant="outline">
                <Download className="h-3.5 w-3.5" /> Export
              </PmButton>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StrategyMetricCard
            label="Strategic Themes"
            value="4"
            trend="▲ 1 vs FY 2025"
            trendClass="text-[#10B981]"
            subtext="Organizing our strategic priorities"
            icon={<Layers className="h-5 w-5" />}
            iconBg="#F3E8FF"
            iconColor="#7C3AED"
          />
          <StrategyMetricCard
            label="Active Objectives"
            value={String(totalObjectives)}
            trend="▲ 2 vs FY 2025"
            trendClass="text-[#10B981]"
            subtext="Across all perspectives"
            icon={<Target className="h-5 w-5" />}
            iconBg="#F3E8FF"
            iconColor="#7C3AED"
          />
          <StrategyMetricCard
            label="At Risk Objectives"
            value={String(atRiskCount)}
            trend="▲ 1 vs FY 2025"
            trendClass="text-[#F59E0B]"
            subtext="Require attention"
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBg="#FFF7ED"
            iconColor="#F59E0B"
          />
          <StrategyMetricCard
            label="Strategic Alignment Score"
            value="86.4%"
            trend="▲ 4.7% vs FY 2025"
            trendClass="text-[#10B981]"
            subtext="Company-wide alignment"
            ring={86}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-[#111827]">Strategy Map</h3>
                  <Info className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </div>
                <p className="mt-1 text-sm text-[#6B7280]">Our strategy is built on four perspectives that drive sustainable value.</p>
              </div>
              <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors",
                    viewMode === "list" ? "bg-white shadow-sm text-[#111827]" : "text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  <List className="h-3.5 w-3.5" /> View as List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors",
                    viewMode === "map" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Strategy Map
                </button>
              </div>
            </div>

            {viewMode === "map" ? (
              <div className="space-y-1">
                {perspectives.map((p, idx) => {
                  const Icon = p.icon
                  return (
                    <div key={p.id}>
                      <div className="grid grid-cols-1 lg:grid-cols-[148px_minmax(0,1fr)] gap-3 items-stretch">
                        <div
                          className="rounded-xl p-4 flex flex-col justify-between min-h-[118px]"
                          style={{ backgroundColor: p.bg }}
                        >
                          <div
                            className="h-9 w-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: p.iconBg, color: p.color }}
                          >
                            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                          </div>
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: p.color }}>
                              {p.title}
                            </p>
                            <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{p.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                          {p.objectives.map((o) => (
                            <ObjectiveCard key={o.code} o={o} />
                          ))}
                        </div>
                      </div>
                      {idx < perspectives.length - 1 && (
                        <div className="flex justify-center py-1.5">
                          <div className="h-6 w-6 rounded-full bg-[#F5F3FF] flex items-center justify-center">
                            <ChevronUp className="h-3.5 w-3.5 text-[#7C3AED]" strokeWidth={2.5} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9]">
                      <th className="pb-3 font-semibold pr-3">Code</th>
                      <th className="pb-3 font-semibold pr-3">Objective</th>
                      <th className="pb-3 font-semibold pr-3">Perspective</th>
                      <th className="pb-3 font-semibold pr-3">Metric</th>
                      <th className="pb-3 font-semibold pr-3">Value</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allObjectives.map((o) => (
                      <tr key={o.code} className="border-b border-[#F8FAFC]">
                        <td className="py-3 pr-3 font-semibold text-[#6B7280]">{o.code}</td>
                        <td className="py-3 pr-3 font-medium text-[#111827]">{o.title}</td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex items-center gap-1.5 text-[#374151] text-xs">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.perspectiveColor }} />
                            {o.perspective}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-[#6B7280] text-xs">{o.metricLabel}</td>
                        <td className="py-3 pr-3 font-semibold text-[#111827]">{o.metricValue}</td>
                        <td className="py-3">
                          <PmStatusPill label={o.status} tone={statusTone(o.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                {(["On Track", "At Risk", "Off Track", "Not Started"] as Status[]).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusDot(s) }} />
                    {s} ({statusCounts[s]})
                  </span>
                ))}
              </div>
              <p className="text-xs font-semibold text-[#7C3AED]">Total Objectives: {totalObjectives}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#111827]">Key Owners</h3>
                <button type="button" className="text-xs font-medium text-[#7C3AED] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-3.5">
                {keyOwners.map((owner) => (
                  <div key={owner.name} className="flex items-center justify-between gap-2">
                    <PmAvatar initials={owner.initials} name={owner.name} role={owner.role} src={owner.src} />
                    <span className="h-7 min-w-7 px-1.5 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {owner.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#111827]">Recent Updates</h3>
                <button type="button" className="text-xs font-medium text-[#7C3AED] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-4 flex-1">
                {recentUpdatesFixture.map((u, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: u.tone === "success" ? "#D1FAE5" : u.tone === "warning" ? "#FEF3C7" : "#F3E8FF",
                        color: u.tone === "success" ? "#059669" : u.tone === "warning" ? "#D97706" : "#7C3AED",
                      }}
                    >
                      {u.tone === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : u.tone === "warning" ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <Flag className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <img
                          src={u.src}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-white"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#111827] leading-snug">{u.text}</p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{u.detail}</p>
                        </div>
                        <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap shrink-0">{u.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-5 w-full h-10 rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#EDE9FE] transition-colors"
              >
                <FileText className="h-4 w-4" /> View Strategy Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">Add Objective</h3>
              <button type="button" onClick={() => setAddOpen(false)} className="text-[#9CA3AF] hover:text-[#111827]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-[#374151]">Perspective</label>
                <select
                  value={form.perspectiveId}
                  onChange={(e) => setForm((f) => ({ ...f, perspectiveId: e.target.value }))}
                  className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                >
                  {perspectives.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#374151]">Code</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="F5"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151]">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                  >
                    {(["On Track", "At Risk", "Off Track", "Not Started"] as Status[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151]">Objective Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Diversify revenue streams"
                  className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#374151]">Metric Label</label>
                  <input
                    value={form.metricLabel}
                    onChange={(e) => setForm((f) => ({ ...f, metricLabel: e.target.value }))}
                    placeholder="e.g. Revenue Mix"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151]">Metric Value</label>
                  <input
                    value={form.metricValue}
                    onChange={(e) => setForm((f) => ({ ...f, metricValue: e.target.value }))}
                    placeholder="e.g. 42%"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E5E7EB]">
              <PmButton variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </PmButton>
              <PmButton variant="primary" onClick={handleAddObjective}>
                Add Objective
              </PmButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
