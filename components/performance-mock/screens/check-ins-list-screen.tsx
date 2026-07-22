"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, ChevronLeft, ChevronRight, ClipboardCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmFilterSelect, PmMetricCard, PmPageHeader, PmProgress, PmStatusPill } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type CheckInStatus = "Draft" | "Employee update" | "Manager review" | "Agree actions" | "Completed"

type CheckInSummary = {
  id: string
  objective: string
  perspective: string
  owner: string
  ownerInitials: string
  ownerColor: string
  manager: string
  cycle: string
  quarter: string
  previousProgress: number
  currentProgress: number
  confidence: "High" | "Medium" | "Low"
  status: CheckInStatus
  dueDate: string
}

const checkIns: CheckInSummary[] = [
  { id: "CHK-2026-Q3-0048", objective: "Reduce portfolio reporting turnaround", perspective: "Internal Process", owner: "Nyasha Moyo", ownerInitials: "NM", ownerColor: "#7C3AED", manager: "Farai Moyo", cycle: "FY2026", quarter: "Q3", previousProgress: 68, currentProgress: 74, confidence: "Medium", status: "Employee update", dueDate: "22 Jul 2026" },
  { id: "CHK-2026-Q3-0047", objective: "Strengthen credit risk governance", perspective: "Internal Process", owner: "Rudo Chikore", ownerInitials: "RC", ownerColor: "#2563EB", manager: "Tariro Ncube", cycle: "FY2026", quarter: "Q3", previousProgress: 62, currentProgress: 70, confidence: "High", status: "Manager review", dueDate: "20 Jul 2026" },
  { id: "CHK-2026-Q3-0046", objective: "Grow and protect portfolio value", perspective: "Financial", owner: "Farai Moyo", ownerInitials: "FM", ownerColor: "#10B981", manager: "Tariro Ncube", cycle: "FY2026", quarter: "Q3", previousProgress: 80, currentProgress: 85, confidence: "High", status: "Completed", dueDate: "18 Jul 2026" },
  { id: "CHK-2026-Q3-0045", objective: "Improve stakeholder engagement excellence", perspective: "Customer & Stakeholder", owner: "Chipo Mhlanga", ownerInitials: "CM", ownerColor: "#F97316", manager: "Rudo Chikore", cycle: "FY2026", quarter: "Q3", previousProgress: 55, currentProgress: 55, confidence: "Low", status: "Draft", dueDate: "24 Jul 2026" },
  { id: "CHK-2026-Q3-0044", objective: "Build capability & high-performing team", perspective: "Learning & Growth", owner: "Tendai Sibanda", ownerInitials: "TS", ownerColor: "#7C3AED", manager: "Chipo Mhlanga", cycle: "FY2026", quarter: "Q3", previousProgress: 71, currentProgress: 76, confidence: "Medium", status: "Agree actions", dueDate: "21 Jul 2026" },
  { id: "CHK-2026-Q3-0043", objective: "Enhance compliance & regulatory adherence", perspective: "Customer & Stakeholder", owner: "Blessing Dube", ownerInitials: "BD", ownerColor: "#2563EB", manager: "Chipo Mhlanga", cycle: "FY2026", quarter: "Q3", previousProgress: 90, currentProgress: 92, confidence: "High", status: "Completed", dueDate: "17 Jul 2026" },
  { id: "CHK-2026-Q3-0042", objective: "Reduce non-performing loan ratio", perspective: "Financial", owner: "Brandon Mandiza", ownerInitials: "BM", ownerColor: "#F97316", manager: "Rudo Chikore", cycle: "FY2026", quarter: "Q3", previousProgress: 40, currentProgress: 44, confidence: "Low", status: "Manager review", dueDate: "23 Jul 2026" },
]

const quarters = ["All Quarters", "Q1", "Q2", "Q3", "Q4"]
const statusesList = ["All Statuses", "Draft", "Employee update", "Manager review", "Agree actions", "Completed"]
const confidenceList = ["All Confidence", "High", "Medium", "Low"]

function statusTone(s: CheckInStatus): "success" | "info" | "warning" | "neutral" {
  if (s === "Completed") return "success"
  if (s === "Manager review" || s === "Agree actions") return "info"
  if (s === "Employee update") return "warning"
  return "neutral"
}
function confidenceTone(c: CheckInSummary["confidence"]): "success" | "warning" | "danger" {
  if (c === "High") return "success"
  if (c === "Medium") return "warning"
  return "danger"
}

const PAGE_SIZE = 8

export function CheckInsListMockScreen() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [quarter, setQuarter] = useState(quarters[0])
  const [status, setStatus] = useState(statusesList[0])
  const [confidence, setConfidence] = useState(confidenceList[0])
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return checkIns.filter((c) => {
      if (quarter !== quarters[0] && c.quarter !== quarter) return false
      if (status !== statusesList[0] && c.status !== status) return false
      if (confidence !== confidenceList[0] && c.confidence !== confidence) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!c.objective.toLowerCase().includes(q) && !c.owner.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [quarter, status, confidence, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const completed = checkIns.filter((c) => c.status === "Completed").length
  const inProgress = checkIns.filter((c) => c.status === "Employee update" || c.status === "Manager review" || c.status === "Agree actions").length
  const overdue = checkIns.filter((c) => c.status !== "Completed" && new Date(c.dueDate) < new Date("2026-07-19")).length

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Operations", "Check-ins"]} searchPlaceholder="Search check-ins…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Check-ins"
          subtitle="Track quarterly check-in progress across objectives, owners and teams."
          actions={
            <PmButton variant="primary" onClick={() => toast("New check-in", { description: "Select an objective to start a new check-in." })}>
              <Plus className="h-3.5 w-3.5" /> New check-in
            </PmButton>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PmMetricCard label="Total check-ins" value={String(checkIns.length)} icon={<ClipboardCheck className="h-4 w-4" />} />
          <PmMetricCard label="Completed" value={String(completed)} trend={`${Math.round((completed / checkIns.length) * 100)}% of total`} trendPositive icon={<CheckCircle2 className="h-4 w-4" />} />
          <PmMetricCard label="In progress" value={String(inProgress)} icon={<Clock className="h-4 w-4" />} iconBg="#DBEAFE" />
          <PmMetricCard label="Overdue" value={String(overdue)} trendPositive={false} icon={<AlertTriangle className="h-4 w-4" />} iconBg="#FEE2E2" />
        </div>

        <PmCard className="p-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center h-9 w-64 rounded-lg border border-[#E5E7EB] px-2.5 text-xs text-[#374151] bg-white">
            <Search className="h-3.5 w-3.5 text-[#9CA3AF] mr-1.5" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search objective, owner or ID…"
              className="flex-1 outline-none text-xs placeholder:text-[#9CA3AF]"
            />
          </div>
          <PmFilterSelect label="Quarter" value={quarter} options={quarters} onChange={(v) => { setQuarter(v); setPage(1) }} />
          <PmFilterSelect label="Status" value={status} options={statusesList} onChange={(v) => { setStatus(v); setPage(1) }} />
          <PmFilterSelect label="Confidence" value={confidence} options={confidenceList} onChange={(v) => { setConfidence(v); setPage(1) }} />
        </PmCard>

        <PmCard className="p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#111827]">Check-ins ({filtered.length})</h3>
          </div>
          <table className="w-full text-left text-xs min-w-[920px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                <th className="pb-2 font-semibold pr-2">Check-in ID</th>
                <th className="pb-2 font-semibold pr-2">Objective</th>
                <th className="pb-2 font-semibold pr-2">Owner</th>
                <th className="pb-2 font-semibold pr-2">Manager</th>
                <th className="pb-2 font-semibold pr-2 w-32">Progress</th>
                <th className="pb-2 font-semibold pr-2">Confidence</th>
                <th className="pb-2 font-semibold pr-2">Status</th>
                <th className="pb-2 font-semibold">Due date</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => (
                <tr key={c.id} className="border-t border-[#F1F5F9] hover:bg-[#FAFAFA] cursor-pointer" onClick={() => router.push(`/performance/check-ins/${c.id}`)}>
                  <td className="py-2.5 pr-2 font-semibold text-[#7C3AED] whitespace-nowrap">{c.id}</td>
                  <td className="py-2.5 pr-2 min-w-[220px]">
                    <p className="font-medium text-[#111827] leading-snug">{c.objective}</p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {c.perspective} · {c.cycle} {c.quarter}
                    </p>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className="h-6 w-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center shrink-0" style={{ backgroundColor: c.ownerColor }}>
                        {c.ownerInitials}
                      </span>
                      {c.owner}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-[#6B7280] whitespace-nowrap">{c.manager}</td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <PmProgress value={c.currentProgress} className="w-16" />
                      <span className="text-[11px] font-semibold text-[#111827]">{c.currentProgress}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <PmStatusPill label={c.confidence} tone={confidenceTone(c.confidence)} />
                  </td>
                  <td className="py-2.5 pr-2">
                    <PmStatusPill label={c.status} tone={statusTone(c.status)} />
                  </td>
                  <td className="py-2.5 text-[#6B7280] whitespace-nowrap">{c.dueDate}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    No check-ins match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[#6B7280]">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} check-ins
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "h-7 w-7 rounded-md text-xs font-semibold flex items-center justify-center",
                    page === i + 1 ? "bg-[#7C3AED] text-white" : "border border-[#E5E7EB] text-[#6B7280]"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 rounded-md border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </PmCard>
      </div>
    </div>
  )
}
