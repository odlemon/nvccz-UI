"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Plus,
  MoreHorizontal,
  Building2,
  User,
  Bookmark,
  Info,
  List,
  LayoutGrid,
  ArrowDownRight,
  ArrowUpRight,
  Timer,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import {
  PmButton,
  PmCard,
  PmModal,
  PmPageHeader,
  PmProgress,
  PmSelectChip,
  PmStatusPill,
  PmAvatar,
} from "@/components/performance-mock/primitives"
import {
  actionsBySeverity,
  actionsByStatusOverTime,
  correctiveActionMetrics,
  correctiveActionOwners,
  correctiveActionUnits,
  correctiveActions as correctiveActionsSeed,
  topRootCauses,
  type CorrectiveActionRow,
} from "@/lib/performance-mock/fixtures/corrective-actions"
import { cn } from "@/lib/utils"

const PURPLE = "#8B5CF6"
const PAGE_SIZE = 6

const STATUS_STACK = [
  { key: "open", label: "Open", color: "#8B5CF6" },
  { key: "inProgress", label: "In Progress", color: "#3B82F6" },
  { key: "escalated", label: "Escalated", color: "#F59E0B" },
  { key: "resolved", label: "Resolved", color: "#10B981" },
  { key: "closed", label: "Closed", color: "#64748B" },
] as const

const statusTone: Record<CorrectiveActionRow["status"], "success" | "warning" | "danger" | "info" | "purple" | "neutral"> = {
  Open: "purple",
  "In Progress": "info",
  Escalated: "warning",
  Resolved: "success",
  Closed: "neutral",
}

function emptyDraft() {
  return {
    title: "",
    trigger: "",
    linkedObjective: "",
    rootCause: "",
    ownerName: "",
    ownerDept: "",
    targetDate: "",
    severity: "Medium" as "High" | "Medium" | "Low",
  }
}

function FilterChip({
  icon,
  value,
  options,
  onChange,
}: {
  icon: ReactNode
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="relative inline-flex items-center h-9 rounded-lg border border-[#E5E7EB] bg-white pl-2.5 pr-2 text-xs text-[#374151] hover:bg-[#F9FAFB] cursor-pointer shadow-sm">
      <span className="mr-1.5 shrink-0">{icon}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent outline-none pr-3 cursor-pointer max-w-[150px]">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

function MetricIcon({ type, color }: { type: string; color: string }) {
  const cls = "h-4 w-4"
  if (type === "clipboard") return <ClipboardList className={cls} style={{ color }} />
  if (type === "clock") return <Clock className={cls} style={{ color }} />
  if (type === "alert") return <AlertTriangle className={cls} style={{ color }} />
  if (type === "check") return <CheckCircle2 className={cls} style={{ color }} />
  return <Timer className={cls} style={{ color }} />
}

function SlaBadge({ label, tone }: { label: string; tone: CorrectiveActionRow["slaTone"] }) {
  const styles = {
    danger: "bg-[#FEF2F2] text-[#DC2626]",
    warning: "bg-[#FFFBEB] text-[#D97706]",
    success: "bg-[#ECFDF5] text-[#059669]",
  }
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap", styles[tone])}>{label}</span>
}

export function CorrectiveActionsMockScreen() {
  const [period, setPeriod] = useState("July 2026")
  const [dept, setDept] = useState("All Departments")
  const [severity, setSeverity] = useState("All Severity")
  const [businessUnit, setBusinessUnit] = useState("All Business Units")
  const [owner, setOwner] = useState("All Owners")
  const [overdueStatus, setOverdueStatus] = useState("All Overdue Status")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [logOpen, setLogOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft())
  const [rows, setRows] = useState<CorrectiveActionRow[]>(correctiveActionsSeed)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const resetFilters = () => {
    setSeverity("All Severity")
    setBusinessUnit("All Business Units")
    setOwner("All Owners")
    setOverdueStatus("All Overdue Status")
    setPage(1)
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (severity !== "All Severity") {
        const sev = r.triggerTone === "danger" ? "High" : r.triggerTone === "warning" ? "Medium" : "Low"
        if (sev !== severity) return false
      }
      if (businessUnit !== "All Business Units" && r.ownerDept !== businessUnit) return false
      if (owner !== "All Owners" && r.ownerName !== owner) return false
      if (overdueStatus !== "All Overdue Status") {
        const isOverdue = r.slaTone === "danger"
        const isAtRisk = r.slaTone === "warning"
        if (overdueStatus === "Overdue" && !isOverdue) return false
        if (overdueStatus === "At Risk" && !isAtRisk) return false
        if (overdueStatus === "On Track" && (isOverdue || isAtRisk)) return false
      }
      return true
    })
  }, [rows, severity, businessUnit, owner, overdueStatus])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))

  const submitLogAction = () => {
    if (!draft.title.trim() || !draft.ownerName.trim()) {
      toast.error("Action title and owner are required")
      return
    }
    const severityTone = draft.severity === "High" ? "danger" : draft.severity === "Medium" ? "warning" : "info"
    const newRow: CorrectiveActionRow = {
      id: `CA-${String(rows.length + 1).padStart(3, "0")}`,
      title: draft.title,
      triggerType: "Manually Logged",
      sourceKpi: draft.trigger || "Manual entry",
      actual: "—",
      target: "—",
      triggerTone: severityTone,
      linkedObjective: draft.linkedObjective || "—",
      rootCause: draft.rootCause || "—",
      ownerInitials: draft.ownerName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      ownerName: draft.ownerName,
      ownerDept: draft.ownerDept || "Unassigned",
      ownerSrc: "https://randomuser.me/api/portraits/men/11.jpg",
      targetDate: draft.targetDate || "TBD",
      slaLabel: "New",
      slaTone: "success",
      progress: 0,
      escalation: "None",
      status: "Open",
    }
    setRows((prev) => [newRow, ...prev])
    setLogOpen(false)
    setDraft(emptyDraft())
    setPage(1)
    toast.success("Corrective action logged", { description: newRow.title })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageRows.forEach((r) => next.delete(r.id))
      else pageRows.forEach((r) => next.add(r.id))
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Corrective Actions"]} />
      <div className="p-4 lg:p-5 space-y-3">
        {/* Header */}
        <PmPageHeader
          title="Corrective Actions"
          subtitle="Track, manage and resolve actions triggered by underperforming KPIs, audit findings, or missed objectives."
          actions={
            <>
              <PmSelectChip
                icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={period}
                onClick={() => setPeriod(period === "July 2026" ? "June 2026" : "July 2026")}
              />
              <PmSelectChip
                icon={<Building2 className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={dept}
                onClick={() => setDept(dept === "All Departments" ? "Finance Department" : "All Departments")}
              />
              <PmButton
                variant="outline"
                className="!border-[#C4B5FD] !text-[#7C3AED] hover:!bg-[#F5F3FF]"
                onClick={() => toast.success("Export started", { description: "Corrective actions export will download shortly." })}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </PmButton>
              <PmButton className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={() => setLogOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Log Action
              </PmButton>
            </>
          }
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            icon={<AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />}
            value={severity}
            options={["All Severity", "High", "Medium", "Low"]}
            onChange={(v) => {
              setSeverity(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<Building2 className="h-3.5 w-3.5 text-[#8B5CF6]" />}
            value={businessUnit}
            options={["All Business Units", ...correctiveActionUnits]}
            onChange={(v) => {
              setBusinessUnit(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<User className="h-3.5 w-3.5 text-[#8B5CF6]" />}
            value={owner}
            options={["All Owners", ...correctiveActionOwners]}
            onChange={(v) => {
              setOwner(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<Clock className="h-3.5 w-3.5 text-[#6B7280]" />}
            value={overdueStatus}
            options={["All Overdue Status", "Overdue", "At Risk", "On Track"]}
            onChange={(v) => {
              setOverdueStatus(v)
              setPage(1)
            }}
          />
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 h-9 px-2 text-xs font-medium text-[#6B7280] hover:text-[#111827]">
            <X className="h-3.5 w-3.5" /> Clear Filters
          </button>
          <button type="button" className="ml-auto inline-flex items-center gap-1.5 h-9 px-2 text-xs font-medium text-[#6B7280] hover:text-[#8B5CF6]">
            <Bookmark className="h-3.5 w-3.5" /> Saved Views
          </button>
        </div>

        {/* 5 metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {correctiveActionMetrics.map((m) => (
            <PmCard key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#6B7280] inline-flex items-center gap-1">
                    {m.label}
                    <Info className="h-3 w-3 text-[#D1D5DB]" />
                  </p>
                  <p className="mt-1.5 text-xl leading-none font-bold tracking-tight" style={{ color: m.valueColor }}>
                    {m.value}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-xs font-semibold inline-flex items-center gap-0.5",
                      m.trendPositive ? "text-[#10B981]" : "text-[#EF4444]"
                    )}
                  >
                    {m.trendPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {m.trend}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">vs last month</p>
                </div>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.iconBg }}>
                  <MetricIcon type={m.icon} color={m.iconColor} />
                </div>
              </div>
            </PmCard>
          ))}
        </div>

        {/* Charts row: stacked bar | donut | root causes */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <PmCard className="xl:col-span-5 p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-sm font-semibold text-[#111827]">Actions by Status Over Time</h3>
              <div className="flex items-center gap-1">
                <PmSelectChip label="Last 7 Months" />
                <button type="button" className="h-8 w-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3 flex-wrap text-[11px] text-[#6B7280]">
              {STATUS_STACK.map((l) => (
                <span key={l.key} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
                </span>
              ))}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionsByStatusOverTime} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB" }} />
                  {STATUS_STACK.map((s, i) => (
                    <Bar
                      key={s.key}
                      dataKey={s.key}
                      stackId="s"
                      fill={s.color}
                      radius={i === STATUS_STACK.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PmCard>

          <PmCard className="xl:col-span-3 p-5">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Actions by Severity</h3>
            <div className="flex items-center gap-3">
              <div className="h-36 w-36 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={actionsBySeverity} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                      {actionsBySeverity.map((a) => (
                        <Cell key={a.name} fill={a.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg font-bold text-[#111827] leading-none">68</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">Total Actions</p>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {actionsBySeverity.map((a) => (
                  <div key={a.name} className="text-xs">
                    <div className="flex items-center gap-1.5 text-[#374151] font-medium">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: a.color }} />
                      {a.name} ({a.value})
                    </div>
                    <p className="text-[#9CA3AF] pl-3.5">{a.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          </PmCard>

          <PmCard className="xl:col-span-4 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">Top Root Causes</h3>
              <button type="button" className="text-xs font-medium text-[#8B5CF6] hover:underline">
                View all
              </button>
            </div>
            <div className="space-y-3.5">
              {topRootCauses.map((r) => (
                <div key={r.cause}>
                  <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                    <span className="text-[#374151] font-medium truncate">{r.cause}</span>
                    <span className="text-[#6B7280] shrink-0 font-medium">
                      {r.count} · {r.pct}%
                    </span>
                  </div>
                  <PmProgress value={r.pct} color={PURPLE} />
                </div>
              ))}
            </div>
          </PmCard>
        </div>

        {/* Table */}
        <PmCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827]">Corrective Actions ({filtered.length})</h3>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <select className="h-8 rounded-lg border border-[#E5E7EB] px-2 bg-white text-xs text-[#374151]">
                <option>Group by: None</option>
                <option>Group by: Status</option>
                <option>Group by: Owner</option>
                <option>Group by: Severity</option>
              </select>
              <button type="button" className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                <List className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                <Filter className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="h-8 w-8 rounded-lg border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F9FAFB]">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1280px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} className="rounded border-[#D1D5DB] accent-[#8B5CF6]" />
                  </th>
                  {[
                    "Action Title",
                    "Source KPI / Trigger",
                    "Linked Objective",
                    "Root Cause",
                    "Owner",
                    "Target Resolution",
                    "SLA",
                    "Progress",
                    "Escalation",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="py-3 px-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#F8FAFC] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => (window.location.href = `/performance/corrective-actions/${r.id}`)}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-[#D1D5DB] accent-[#8B5CF6]"
                      />
                    </td>
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0",
                            r.triggerTone === "danger" ? "bg-[#FEE2E2] text-[#EF4444]" : r.triggerTone === "warning" ? "bg-[#FEF3C7] text-[#F59E0B]" : "bg-[#DBEAFE] text-[#2563EB]"
                          )}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#111827] truncate">{r.title}</p>
                          <p className="text-[11px] text-[#9CA3AF] truncate">{r.triggerType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-[200px]">
                      <p className="text-xs font-medium text-[#374151] truncate">{r.sourceKpi}</p>
                      <p className="text-[11px] mt-0.5">
                        <span className="text-[#EF4444]">Actual: {r.actual}</span>
                        <span className="text-[#9CA3AF]"> · </span>
                        <span className="text-[#059669]">Target: {r.target}</span>
                      </p>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#374151] max-w-[160px] truncate">{r.linkedObjective}</td>
                    <td className="py-3 px-3 text-xs text-[#374151] max-w-[180px] truncate">{r.rootCause}</td>
                    <td className="py-3 px-3">
                      <PmAvatar initials={r.ownerInitials} name={r.ownerName} role={r.ownerDept} src={r.ownerSrc} size="sm" />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#374151]">
                        <Calendar className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        {r.targetDate}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <SlaBadge label={r.slaLabel} tone={r.slaTone} />
                    </td>
                    <td className="py-3 px-3 min-w-[110px]">
                      <div className="flex items-center gap-2">
                        <PmProgress value={r.progress} className="flex-1" color={PURPLE} />
                        <span className="text-[11px] font-semibold text-[#6B7280] w-8 text-right">{r.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          r.escalation === "None" && "text-[#9CA3AF]",
                          r.escalation === "Level 1" && "text-[#F59E0B]",
                          r.escalation === "Level 2" && "text-[#EF4444]",
                          r.escalation === "Level 3" && "text-[#DC2626]"
                        )}
                      >
                        {r.escalation}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <PmStatusPill label={r.status} tone={statusTone[r.status]} />
                    </td>
                    <td className="py-3 px-3">
                      <button type="button" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280]">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-sm text-[#6B7280]">
                      No corrective actions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-3 py-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#6B7280]">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} results
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-semibold",
                    page === n ? "bg-[#8B5CF6] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                  )}
                >
                  {n}
                </button>
              ))}
              {pageCount > 5 && <span className="text-[#9CA3AF] px-1">…</span>}
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
              >
                ›
              </button>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151] bg-white"
            >
              {[6, 10, 20].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
        </PmCard>
      </div>

      <PmModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log Corrective Action"
        description="Record a new action to address an underperforming KPI, audit finding, or missed objective."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setLogOpen(false)}>
              Cancel
            </PmButton>
            <PmButton className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={submitLogAction}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Log Action
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Action Title *">
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Reduce Loan Processing Turnaround Time"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </Field>
          <Field label="Source KPI / Trigger">
            <input
              value={draft.trigger}
              onChange={(e) => setDraft((d) => ({ ...d, trigger: e.target.value }))}
              placeholder="e.g. Loan Processing TAT (Days)"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </Field>
          <Field label="Linked Objective">
            <input
              value={draft.linkedObjective}
              onChange={(e) => setDraft((d) => ({ ...d, linkedObjective: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </Field>
          <Field label="Root Cause">
            <input
              value={draft.rootCause}
              onChange={(e) => setDraft((d) => ({ ...d, rootCause: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner *">
              <input
                value={draft.ownerName}
                onChange={(e) => setDraft((d) => ({ ...d, ownerName: e.target.value }))}
                placeholder="e.g. Tinashe Moyo"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
              />
            </Field>
            <Field label="Owner Department">
              <input
                value={draft.ownerDept}
                onChange={(e) => setDraft((d) => ({ ...d, ownerDept: e.target.value }))}
                placeholder="e.g. Operations"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Resolution Date">
              <input
                value={draft.targetDate}
                onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
                placeholder="e.g. 15 Aug 2026"
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
              />
            </Field>
            <Field label="Severity">
              <select
                value={draft.severity}
                onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value as "High" | "Medium" | "Low" }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6] bg-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </Field>
          </div>
        </div>
      </PmModal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#374151] mb-1">{label}</span>
      {children}
    </label>
  )
}
