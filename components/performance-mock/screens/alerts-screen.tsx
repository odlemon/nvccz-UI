"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import {
  AlertOctagon,
  Bell,
  Calendar,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Columns3,
  ChevronRight,
  LayoutGrid,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmSelectChip, PmStatusPill, PmToggle, PmAvatar } from "@/components/performance-mock/primitives"
import {
  alertMetrics,
  alertRows as alertRowsSeed,
  alertRuleLogic,
  alertRules,
  alertSeverities,
  alertStatuses,
  notificationChannels as notificationChannelsSeed,
  type AlertRow,
  type AlertStatus,
} from "@/lib/performance-mock/fixtures/alerts"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

const statusTone: Record<AlertStatus, "success" | "warning" | "danger" | "info" | "purple" | "neutral"> = {
  Open: "danger",
  Escalated: "warning",
  Investigating: "info",
  Resolved: "success",
  "Auto-Resolved": "success",
}

const severityTone: Record<string, "success" | "warning" | "danger" | "info" | "purple" | "neutral"> = {
  Critical: "danger",
  High: "warning",
  Medium: "warning",
  Low: "success",
}

const metricIcon: Record<string, ReactNode> = {
  critical: <AlertOctagon className="h-4 w-4" />,
  escalated: <ShieldAlert className="h-4 w-4" />,
  sla: <Clock3 className="h-4 w-4" />,
  resolved: <CheckCircle2 className="h-4 w-4" />,
}

const channelMeta: Record<string, { bg: string; color: string; icon: ReactNode }> = {
  Mail: { bg: "#F3E8FF", color: "#8B5CF6", icon: <Mail className="h-3.5 w-3.5" /> },
  Bell: { bg: "#DBEAFE", color: "#2563EB", icon: <Bell className="h-3.5 w-3.5" /> },
  MessageCircle: { bg: "#D1FAE5", color: "#10B981", icon: <MessageCircle className="h-3.5 w-3.5" /> },
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent outline-none pr-3 cursor-pointer max-w-[160px]">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function AlertsMockScreen() {
  const [period] = useState("1 – 31 July 2026")
  const [ruleFilter, setRuleFilter] = useState(alertRules[0])
  const [severityFilter, setSeverityFilter] = useState("All Severities")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [rows] = useState<AlertRow[]>(alertRowsSeed)
  const [selectedId, setSelectedId] = useState<string | null>(alertRowsSeed[0]?.id ?? null)
  const [channels, setChannels] = useState(notificationChannelsSeed)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (ruleFilter !== "All Alert Rules" && r.ruleName !== ruleFilter) return false
      if (severityFilter !== "All Severities" && r.severity !== severityFilter) return false
      if (statusFilter !== "All Statuses" && r.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!r.title.toLowerCase().includes(q) && !r.ownerName.toLowerCase().includes(q) && !r.source.toLowerCase().includes(q) && !r.ruleName.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, ruleFilter, severityFilter, statusFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))

  const selectedRow = rows.find((r) => r.id === selectedId) || pageRows[0] || rows[0]
  const activeRuleName = selectedRow?.ruleName || "KPI Below Threshold"
  const activeRule = alertRuleLogic[activeRuleName]

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
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Alerts & Escalations"]} />
      <div className="p-4 lg:p-5 space-y-3">
        {/* Header */}
        <PmPageHeader
          title="Alerts & Escalations"
          subtitle="Monitor and act on performance alerts, escalations, and SLA breaches across the organization."
          actions={
            <>
              <PmSelectChip icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />} label={period} />
              <PmButton
                className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]"
                onClick={() => toast.success("Alert rule created", { description: "New alert rule draft added." })}
              >
                <Plus className="h-3.5 w-3.5" /> Create Alert Rule
              </PmButton>
            </>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            icon={<LayoutGrid className="h-3.5 w-3.5 text-[#8B5CF6]" />}
            value={ruleFilter}
            options={alertRules}
            onChange={(v) => {
              setRuleFilter(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<AlertOctagon className="h-3.5 w-3.5 text-[#EF4444]" />}
            value={severityFilter}
            options={["All Severities", ...alertSeverities]}
            onChange={(v) => {
              setSeverityFilter(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<Clock3 className="h-3.5 w-3.5 text-[#6B7280]" />}
            value={statusFilter}
            options={["All Statuses", ...alertStatuses]}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          />
        </div>

        {/* 4 metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {alertMetrics.map((m) => (
            <PmCard key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: m.bg, color: m.color }}>
                    {metricIcon[m.id]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#6B7280] truncate">{m.label}</p>
                    <p className="mt-1 text-xl leading-none font-bold tracking-tight text-[#111827]">{m.value}</p>
                    <p className={cn("mt-2 text-[11px] font-semibold", m.trendPositive ? "text-[#10B981]" : "text-[#EF4444]")}>{m.trend}</p>
                  </div>
                </div>
              </div>
              <div className="h-10 mt-3 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={m.data.map((v, i) => ({ i, v }))}>
                    <defs>
                      <linearGradient id={`spark-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={m.color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={m.color} strokeWidth={2} fill={`url(#spark-${m.id})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PmCard>
          ))}
        </div>

        {/* Main: table (~75%) | sidebar (~25%) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <PmCard className="xl:col-span-9 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">Alerts ({filtered.length})</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search alerts by KPI, owner, or rule..."
                    className="h-9 w-64 pl-8 pr-3 rounded-lg border border-[#E5E7EB] text-xs outline-none focus:border-[#C4B5FD] bg-white"
                  />
                </div>
                <button type="button" className="h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#374151] inline-flex items-center gap-1.5 hover:bg-[#F9FAFB] bg-white">
                  <Columns3 className="h-3.5 w-3.5" /> Columns
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                    <th className="py-3 px-4 w-10">
                      <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} className="rounded border-[#D1D5DB] accent-[#8B5CF6]" />
                    </th>
                    {["Alert Title", "Alert Source", "Severity", "Owner", "Esc. Level", "Elapsed Time", "Status", "Actions"].map((h) => (
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
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        "border-b border-[#F8FAFC] cursor-pointer transition-colors",
                        selectedId === r.id ? "bg-[#F5F3FF]" : "hover:bg-[#F9FAFB]"
                      )}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-[#D1D5DB] accent-[#8B5CF6]"
                        />
                      </td>
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 rounded-full shrink-0",
                              r.dotTone === "danger" ? "bg-[#EF4444]" : r.dotTone === "warning" ? "bg-[#F59E0B]" : "bg-[#10B981]"
                            )}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#111827] truncate text-sm">{r.title}</p>
                            <p className="text-[11px] text-[#6B7280] truncate">{r.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 max-w-[160px]">
                        <p className="font-semibold text-[#111827] truncate text-sm">{r.source}</p>
                        <p className="text-[11px] text-[#9CA3AF] truncate">
                          {r.sourceMeta} · {r.sourceDept}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <PmStatusPill label={r.severity} tone={severityTone[r.severity]} />
                      </td>
                      <td className="py-3 px-3">
                        <PmAvatar initials={r.ownerInitials} name={r.ownerName} role={r.ownerRole} src={r.ownerSrc} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-[#374151]">
                          {r.escalationLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={cn("text-xs font-semibold", r.elapsedUrgent ? "text-[#EF4444]" : "text-[#6B7280]")}>{r.elapsed}</span>
                      </td>
                      <td className="py-3 px-3">
                        <PmStatusPill label={r.status} tone={statusTone[r.status]} />
                      </td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280]">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-sm text-[#6B7280]">
                        No alerts match the current filters.
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
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </PmCard>

          {/* Right sidebar */}
          <div className="xl:col-span-3 space-y-3 xl:sticky xl:top-24">
            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Alert Rule Logic</h3>
              {activeRule ? (
                <div className="space-y-3.5 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold">Rule Name</p>
                    <p className="font-bold text-[#111827] mt-0.5">{activeRuleName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-1">Description</p>
                    <p className="text-[#374151] leading-relaxed">{activeRule.description}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-1.5">Conditions</p>
                    <ul className="space-y-1.5">
                      {activeRule.conditions.map((c) => (
                        <li key={c} className="text-[#374151] flex items-start gap-1.5">
                          <span className="text-[#8B5CF6] mt-0.5 font-bold">•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-1.5">Escalation</p>
                    <ul className="space-y-2">
                      {activeRule.escalation.map((e) => (
                        <li key={e.level} className="rounded-lg bg-[#F9FAFB] px-2.5 py-2">
                          <p className="font-semibold text-[#111827]">{e.level}</p>
                          <p className="text-[#6B7280] mt-0.5">
                            {e.who} · {e.after}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-1.5">Actions</p>
                    <ul className="space-y-1.5">
                      {activeRule.actions.map((a) => (
                        <li key={a} className="text-[#374151] flex items-start gap-1.5">
                          <span className="text-[#8B5CF6] mt-0.5 font-bold">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#9CA3AF]">Select an alert to view its rule logic.</p>
              )}
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Notification Channels</h3>
              <div className="space-y-3">
                {channels.map((c) => {
                  const meta = channelMeta[c.icon] || channelMeta.Bell
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>
                          {meta.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate">{c.label}</p>
                          <p className="text-[10px] text-[#9CA3AF] truncate">{c.detail}</p>
                        </div>
                      </div>
                      <PmToggle
                        checked={c.enabled}
                        onChange={(v) => {
                          setChannels((prev) => prev.map((ch) => (ch.id === c.id ? { ...ch, enabled: v } : ch)))
                          toast.success(`${c.label} notifications ${v ? "enabled" : "disabled"}`)
                        }}
                      />
                    </div>
                  )
                })}
              </div>
              <button type="button" className="mt-4 w-full inline-flex items-center justify-between text-xs font-semibold text-[#8B5CF6] hover:underline">
                Manage Notification Settings
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </PmCard>
          </div>
        </div>
      </div>
    </div>
  )
}
