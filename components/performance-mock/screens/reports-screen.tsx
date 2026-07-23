"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Filter,
  LineChart as LineChartIcon,
  MoreVertical,
  Presentation,
  Search,
  Shield,
  Sparkles,
  Target,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmModal, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"
import {
  dataExports,
  reportCategories,
  reportHistory,
  reportInsights,
  reportLibrary as reportLibrarySeed,
  reportOwners,
  reportStatuses,
  reportingScheduleDots,
  scheduledReports,
  type ReportRow,
} from "@/lib/performance-mock/fixtures/reports"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 6
const PURPLE = "#8B5CF6"
const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/men/52.jpg"

const reportIcon: Record<string, ReactNode> = {
  FileBarChart: <FileBarChart className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  LineChart: <LineChartIcon className="h-4 w-4" />,
  ClipboardCheck: <ClipboardCheck className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
}

const formatMeta: Record<string, { bg: string; color: string; icon: ReactNode }> = {
  PDF: { bg: "#FEE2E2", color: "#DC2626", icon: <FileText className="h-3 w-3" /> },
  PPTX: { bg: "#FFEDD5", color: "#EA580C", icon: <Presentation className="h-3 w-3" /> },
  XLSX: { bg: "#D1FAE5", color: "#059669", icon: <FileSpreadsheet className="h-3 w-3" /> },
}

const CAL_ROWS: (number | null)[][] = [
  [null, null, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, 31, null, null],
]
const TODAY = 13
const dotColor: Record<string, string> = { monthly: "#8B5CF6", quarterly: "#3B82F6", weekly: "#10B981", adhoc: "#F59E0B" }

function MiniChart({ type, data, color, id }: { type: "line" | "bar" | "donut"; data: number[]; color: string; id: string }) {
  if (type === "line") {
    return (
      <div className="h-9 w-16">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.map((v, i) => ({ i, v }))}>
            <defs>
              <linearGradient id={`rp-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#rp-${id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }
  if (type === "bar") {
    return (
      <div className="h-9 w-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.map((v, i) => ({ i, v }))}>
            <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  const val = data[0] ?? 70
  return (
    <div className="h-9 w-9">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={[{ v: val }, { v: 100 - val }]} dataKey="v" innerRadius={10} outerRadius={16} startAngle={90} endAngle={-270} strokeWidth={0}>
            <Cell fill={color} />
            <Cell fill="#E5E7EB" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function FilterChip({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="relative inline-flex items-center h-9 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs text-[#374151] hover:bg-[#F9FAFB] cursor-pointer shadow-sm">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent outline-none pr-2 cursor-pointer max-w-[140px]">
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ReportsMockScreen() {
  const [period, setPeriod] = useState("July 2026")
  const [dept, setDept] = useState("All Departments")
  const [tab, setTab] = useState("library")
  const [category, setCategory] = useState(reportCategories[0])
  const [owner, setOwner] = useState(reportOwners[0])
  const [status, setStatus] = useState(reportStatuses[0])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [reports, setReports] = useState<ReportRow[]>(reportLibrarySeed)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [draft, setDraft] = useState({ name: "", category: "Executive", format: "PDF" as "PDF" | "PPTX" | "XLSX" })
  const [generatedCount, setGeneratedCount] = useState(28)

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (category !== reportCategories[0] && r.category !== category) return false
      if (owner !== reportOwners[0] && r.owner !== owner) return false
      if (status !== reportStatuses[0] && r.status !== status) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!r.title.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [reports, category, owner, status, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const clearFilters = () => {
    setCategory(reportCategories[0])
    setOwner(reportOwners[0])
    setStatus(reportStatuses[0])
    setSearch("")
    setPage(1)
  }

  const generateReport = () => {
    if (!draft.name.trim()) {
      toast.error("Report name is required")
      return
    }
    const newReport: ReportRow = {
      id: `RPT-${String(reports.length + 1).padStart(3, "0")}`,
      title: draft.name,
      description: "Newly generated custom report",
      icon: "FileBarChart",
      iconBg: "#F3E8FF",
      iconColor: PURPLE,
      owner: "Adm. User",
      ownerSrc: DEFAULT_AVATAR,
      previewCharts: ["line"],
      previewChartData: [50, 55, 60, 65, 70, 75],
      previewChartColor: PURPLE,
      scheduleFreq: "Ad-hoc",
      scheduleTime: "Just now",
      scheduleActive: true,
      formats: [draft.format],
      recipientEmails: "you@arcus.co.zw",
      recipientSrcs: [DEFAULT_AVATAR],
      recipientsExtra: 0,
      lastRun: "Just now",
      runStatus: "Success",
      status: "Active",
      category: draft.category,
    }
    setReports((prev) => [newReport, ...prev])
    setGeneratedCount((c) => c + 1)
    setGenerateOpen(false)
    setDraft({ name: "", category: "Executive", format: "PDF" })
    setPage(1)
    toast.success("Report generated", { description: newReport.title })
  }

  const tabs = [
    { id: "library", label: "Report Library" },
    { id: "scheduled", label: "Scheduled Reports" },
    { id: "history", label: "Report History" },
    { id: "exports", label: "Data Exports" },
  ]

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Reports", "Performance Reports"]} />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="Performance Reports"
          subtitle="Create, schedule and distribute performance insights across the organization."
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
              <PmButton className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={() => setGenerateOpen(true)}>
                <Sparkles className="h-3.5 w-3.5" /> Generate Report
              </PmButton>
            </>
          }
        />

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[#E5E7EB] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors",
                tab === t.id ? "text-[#8B5CF6] border-[#8B5CF6]" : "text-[#6B7280] border-transparent hover:text-[#111827]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* LEFT ~75% */}
          <div className="xl:col-span-9 space-y-3 min-w-0">
            {tab === "library" && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Search reports..."
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] text-xs outline-none focus:border-[#C4B5FD] bg-white shadow-sm"
                    />
                  </div>
                  <FilterChip value={category} options={reportCategories} onChange={(v) => { setCategory(v); setPage(1) }} />
                  <FilterChip value={owner} options={reportOwners} onChange={(v) => { setOwner(v); setPage(1) }} />
                  <FilterChip value={status} options={reportStatuses} onChange={(v) => { setStatus(v); setPage(1) }} />
                  <button type="button" className="h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#374151] inline-flex items-center gap-1.5 shadow-sm hover:bg-[#F9FAFB]">
                    <Filter className="h-3.5 w-3.5" /> More Filters
                  </button>
                  <button type="button" onClick={clearFilters} className="h-9 px-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] inline-flex items-center gap-1">
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>

                <PmCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[1080px]">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                          {["Report", "Preview", "Schedule", "Format", "Recipients", "Last Run", "Status", "Actions"].map((h) => (
                            <th key={h} className="py-3 px-3 font-semibold whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((r) => (
                          <tr key={r.id} className="border-b border-[#F8FAFC] hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-2 px-3 max-w-[240px]">
                              <div className="flex items-start gap-2.5">
                                <span className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: r.iconBg, color: r.iconColor }}>
                                  {reportIcon[r.icon]}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#111827] truncate">{r.title}</p>
                                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{r.description}</p>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <img src={r.ownerSrc} alt={r.owner} className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                                    <span className="text-[11px] text-[#6B7280] truncate">{r.owner}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                {r.previewCharts.map((t, i) => (
                                  <MiniChart key={`${r.id}-${t}-${i}`} type={t} data={r.previewChartData} color={r.previewChartColor} id={`${r.id}-${i}`} />
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <p className="text-xs font-semibold text-[#111827]">{r.scheduleFreq}</p>
                              <p className="text-[11px] text-[#6B7280]">{r.scheduleTime}</p>
                              {r.scheduleActive && (
                                <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#D1FAE5] text-[#065F46]">Active</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                {r.formats.map((f) => {
                                  const meta = formatMeta[f]
                                  return (
                                    <span
                                      key={f}
                                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                                      style={{ backgroundColor: meta.bg, color: meta.color }}
                                      title={f}
                                    >
                                      {meta.icon}
                                    </span>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center">
                                <div className="flex -space-x-2">
                                  {r.recipientSrcs.slice(0, 3).map((src, i) => (
                                    <img key={i} src={src} alt="" className="h-6 w-6 rounded-full object-cover ring-2 ring-white" referrerPolicy="no-referrer" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-[#6B7280] mt-1 truncate max-w-[120px]">{r.recipientEmails}</p>
                              {r.recipientsExtra > 0 && <p className="text-[10px] font-medium text-[#8B5CF6]">+{r.recipientsExtra} more</p>}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap text-xs text-[#6B7280]">{r.lastRun}</td>
                            <td className="py-2 px-3">
                              <PmStatusPill label={r.runStatus} tone={r.runStatus === "Success" ? "success" : r.runStatus === "Failed" ? "danger" : "info"} />
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => toast.success("Report run started", { description: r.title })}
                                  className="h-7 w-7 rounded-md flex items-center justify-center text-[#10B981] hover:bg-[#ECFDF5]"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button type="button" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6]">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pageRows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-10 text-center text-sm text-[#6B7280]">
                              No reports match the current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-3 py-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#6B7280]">
                      Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} reports
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40">
                        ‹
                      </button>
                      {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className={cn("h-8 w-8 rounded-full text-xs font-semibold", page === n ? "bg-[#8B5CF6] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]")}
                        >
                          {n}
                        </button>
                      ))}
                      <button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40">
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
              </>
            )}

            {tab === "scheduled" && (
              <PmCard className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                      {["Report Name", "Cadence", "Next Run", "Recipients", "Format"].map((h) => (
                        <th key={h} className="py-3 px-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledReports.map((s) => (
                      <tr key={s.id} className="border-b border-[#F8FAFC]">
                        <td className="py-3 px-4 font-semibold text-[#111827]">{s.name}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{s.cadence}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{s.nextRun}</td>
                        <td className="py-3 px-4 text-[#6B7280]">+{s.recipients}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{s.format}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PmCard>
            )}

            {tab === "history" && (
              <PmCard className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                      {["Report Name", "Run At", "Run By", "Status", "Size"].map((h) => (
                        <th key={h} className="py-3 px-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportHistory.map((h) => (
                      <tr key={h.id} className="border-b border-[#F8FAFC]">
                        <td className="py-3 px-4 font-semibold text-[#111827]">{h.name}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{h.runAt}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{h.runBy}</td>
                        <td className="py-3 px-4">
                          <PmStatusPill label={h.status} tone={h.status === "Success" ? "success" : "danger"} />
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">{h.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PmCard>
            )}

            {tab === "exports" && (
              <PmCard className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9] bg-[#FAFAFB]">
                      {["Export Name", "Format", "Requested By", "Requested At", "Status", "Size"].map((h) => (
                        <th key={h} className="py-3 px-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataExports.map((e) => (
                      <tr key={e.id} className="border-b border-[#F8FAFC]">
                        <td className="py-3 px-4 font-semibold text-[#111827]">{e.name}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{e.format}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{e.requestedBy}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{e.requestedAt}</td>
                        <td className="py-3 px-4">
                          <PmStatusPill label={e.status} tone={e.status === "Ready" ? "success" : "info"} />
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">{e.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PmCard>
            )}
          </div>

          {/* RIGHT ~25% sidebar */}
          <div className="xl:col-span-3 space-y-3 xl:sticky xl:top-24">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Reporting Schedule</h3>
                <div className="flex items-center gap-1">
                  <button type="button" className="h-7 w-7 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="h-7 w-7 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center text-[#6B7280]">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-semibold text-[#374151] mb-2">{period}</p>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span key={d} className="text-[9px] text-[#9CA3AF] font-semibold py-1">
                    {d}
                  </span>
                ))}
                {CAL_ROWS.flatMap((row, ri) =>
                  row.map((d, ci) => {
                    const dots = d ? reportingScheduleDots[d] : undefined
                    const isToday = d === TODAY
                    return (
                      <div key={`${ri}-${ci}`} className="flex flex-col items-center gap-0.5 py-0.5 min-h-[36px]">
                        {d ? (
                          <>
                            <span
                              className={cn(
                                "h-7 w-7 rounded-full flex items-center justify-center text-[11px]",
                                isToday ? "bg-[#8B5CF6] text-white font-bold shadow-sm" : "text-[#374151]"
                              )}
                            >
                              {d}
                            </span>
                            <span className="h-1.5 flex gap-0.5">
                              {dots?.map((type, i) => (
                                <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[type] }} />
                              ))}
                            </span>
                          </>
                        ) : (
                          <span className="h-7 w-7" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap mt-3 pt-3 border-t border-[#F1F5F9] text-[10px] text-[#6B7280]">
                <LegendDot color={dotColor.monthly} label="Monthly (4)" />
                <LegendDot color={dotColor.quarterly} label="Quarterly (1)" />
                <LegendDot color={dotColor.weekly} label="Weekly (1)" />
                <LegendDot color={dotColor.adhoc} label="Ad-hoc (2)" />
              </div>
              <button type="button" className="text-xs font-semibold text-[#8B5CF6] hover:underline mt-3">
                View full schedule →
              </button>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">Quick Export</h3>
              <p className="text-[11px] text-[#6B7280] mb-3">Download the current library snapshot</p>
              <div className="space-y-2">
                <QuickExportBtn
                  icon={<FileText className="h-4 w-4 text-[#DC2626]" />}
                  label="Export to PDF"
                  onClick={() => toast.success("Exporting to PDF…")}
                />
                <QuickExportBtn
                  icon={<FileSpreadsheet className="h-4 w-4 text-[#059669]" />}
                  label="Export to Excel"
                  onClick={() => toast.success("Exporting to Excel…")}
                />
                <QuickExportBtn
                  icon={<Presentation className="h-4 w-4 text-[#EA580C]" />}
                  label="Export to PowerPoint"
                  onClick={() => toast.success("Exporting to PowerPoint…")}
                />
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Report Insights</h3>
              <div className="space-y-3.5">
                {reportInsights.map((i, idx) => (
                  <div key={i.label} className="flex items-start gap-2.5">
                    <span className="h-8 w-8 rounded-lg bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
                      {idx === 0 ? <FileBarChart className="h-3.5 w-3.5" /> : idx === 1 ? <Calendar className="h-3.5 w-3.5" /> : <Database className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[#6B7280]">{i.label}</p>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-lg font-bold text-[#111827]">{idx === 0 ? generatedCount : i.value}</p>
                        <p className={cn("text-[11px] font-semibold", i.tone === "success" ? "text-[#10B981]" : "text-[#6B7280]")}>{i.trend}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#6B7280]">Storage used</span>
                    <span className="font-semibold text-[#111827]">24.6 GB of 100 GB</span>
                  </div>
                  <PmProgress value={24.6} color={PURPLE} />
                </div>
              </div>
            </PmCard>
          </div>
        </div>
      </div>

      <PmModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Report"
        description="Create a new report and add it to your Report Library."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </PmButton>
            <PmButton className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={generateReport}>
              <Sparkles className="h-3.5 w-3.5" /> Generate
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Report Name *</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Q3 Departmental Deep Dive"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Category</span>
              <select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
              >
                {reportCategories.filter((c) => c !== "All Categories").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Format</span>
              <select
                value={draft.format}
                onChange={(e) => setDraft((d) => ({ ...d, format: e.target.value as "PDF" | "PPTX" | "XLSX" }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
              >
                {["PDF", "PPTX", "XLSX"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </PmModal>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  )
}

function QuickExportBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#374151] inline-flex items-center gap-2.5 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}
