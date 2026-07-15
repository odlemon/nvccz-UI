"use client"

import { useMemo, useState } from "react"
import {
  Ban,
  CalendarDays,
  Download,
  FilePenLine,
  Files,
  Gavel,
  Info,
  Leaf,
  Paperclip,
  Plus,
  Scale,
  Send,
  Shield,
  TrendingUp,
  Users,
  BarChart3,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DD_AS_AT,
  DD_CATEGORY_ORDER,
  DD_INVESTORS,
  DD_KPIS,
  DD_MATRIX_ROWS,
  DD_REQUESTS,
  DD_STATUS_LEGEND,
  DD_THREAD_SEED,
  OPEN_REQUEST_COUNT,
  RESOLVED_REQUEST_COUNT,
  type DdDocStatus,
  type DdInvestor,
  type DdKpi,
  type DdMatrixCategory,
  type DdMatrixRow,
  type DdPriority,
  type DdRequest,
  type DdThreadMessage,
} from "./due-diligence-mock-data"
import {
  FrField,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const KPI_ICONS = {
  users: Users,
  "file-pen": FilePenLine,
  ban: Ban,
  "trending-up": TrendingUp,
  files: Files,
  calendar: CalendarDays,
} as const

const CATEGORY_META: Record<
  DdMatrixCategory,
  { icon: typeof Gavel; color: string; bg: string }
> = {
  Legal: { icon: Gavel, color: "#7c3aed", bg: "#ede9fe" },
  "Fund Terms": { icon: Scale, color: "#2563eb", bg: "#dbeafe" },
  Team: { icon: Users, color: "#16a34a", bg: "#dcfce7" },
  "Track Record": { icon: BarChart3, color: "#ea580c", bg: "#ffedd5" },
  Compliance: { icon: Shield, color: "#2563eb", bg: "#dbeafe" },
  ESG: { icon: Leaf, color: "#16a34a", bg: "#dcfce7" },
  Financials: { icon: DollarSign, color: "#2563eb", bg: "#dbeafe" },
}

const TREND_TONE: Record<NonNullable<DdKpi["trend"]>["tone"], string> = {
  amber: "text-[#d97706]",
  red: "text-[#dc2626]",
  green: "text-[#16a34a]",
  purple: "text-[#7c3aed]",
}

function statusStyle(status: DdDocStatus) {
  switch (status) {
    case "Reviewed":
      return { wrap: "bg-[#dcfce7] text-[#15803d]", dot: "bg-[#16a34a]" }
    case "Uploaded":
      return { wrap: "bg-[#dbeafe] text-[#1d4ed8]", dot: "bg-[#2563eb]" }
    case "Requested":
      return { wrap: "bg-[#ede9fe] text-[#6d28d9]", dot: "bg-[#7c3aed]" }
    case "Follow-up":
      return { wrap: "bg-[#ffedd5] text-[#c2410c]", dot: "bg-[#ea580c]" }
    default:
      return { wrap: "bg-[#f1f5f9] text-[#475569]", dot: "bg-[#64748b]" }
  }
}

function priorityStyle(priority: DdPriority) {
  switch (priority) {
    case "High":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "Medium":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#dcfce7] text-[#15803d]"
  }
}

function completionTone(pct: number) {
  if (pct >= 70) return "text-[#16a34a]"
  if (pct >= 50) return "text-[#d97706]"
  return "text-[#ea580c]"
}

function StatusPill({ status }: { status: DdDocStatus }) {
  const style = statusStyle(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[11px] font-medium",
        style.wrap,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  )
}

function KpiCard({ kpi }: { kpi: DdKpi }) {
  const Icon = KPI_ICONS[kpi.icon]
  return (
    <div className={cn(CARD, "flex flex-col p-3.5")}>
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-2.5 text-[11px] font-medium leading-snug text-[#64748b]">
        {kpi.label}
      </p>
      <p className="mt-1.5 text-[22px] font-bold leading-none tabular-nums text-[#0f172a]">
        {kpi.value}
      </p>
      {kpi.trend ? (
        <p className={cn("mt-2 text-[10px] font-medium", TREND_TONE[kpi.trend.tone])}>
          ↑ {kpi.trend.text}
        </p>
      ) : (
        <p className="mt-2 text-[10px] text-transparent">—</p>
      )}
    </div>
  )
}

function InvestorCard({
  investor,
  selected,
  onSelect,
}: {
  investor: DdInvestor
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[6px] border p-3 text-left transition-colors",
        selected
          ? "border-[#c4b5fd] bg-[#f5f3ff]"
          : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold"
          style={{ backgroundColor: investor.logoBg, color: investor.logoText }}
        >
          {investor.logoLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[#0f172a]">
                {investor.name}
              </p>
              <p className="mt-0.5 text-[10px] text-[#94a3b8]">Lead: {investor.lead}</p>
            </div>
            <span
              className={cn(
                "shrink-0 text-[12px] font-bold tabular-nums",
                completionTone(investor.completion),
              )}
            >
              {investor.completion}%
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
            <div
              className="h-full rounded-[2px] bg-[#16a34a]"
              style={{ width: `${investor.completion}%` }}
            />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-[#f1f5f9] pt-2">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">Open</p>
              <p className="text-[12px] font-semibold tabular-nums text-[#0f172a]">
                {investor.open}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">Overdue</p>
              <p
                className={cn(
                  "text-[12px] font-semibold tabular-nums",
                  investor.overdue > 0 ? "text-[#dc2626]" : "text-[#0f172a]",
                )}
              >
                {investor.overdue}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">Days in DD</p>
              <p className="text-[12px] font-semibold tabular-nums text-[#0f172a]">
                {investor.daysInDd}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

function MatrixTable({
  investorId,
  investorName,
}: {
  investorId: string
  investorName: string
}) {
  const grouped = useMemo(() => {
    return DD_CATEGORY_ORDER.map((category) => ({
      category,
      rows: DD_MATRIX_ROWS.filter((r) => r.category === category),
    })).filter((g) => g.rows.length > 0)
  }, [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
            <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Category</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Document</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
              Status ({investorName})
            </th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Last Updated</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Owner</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ category, rows }) =>
            rows.map((row, index) => (
              <MatrixRow
                key={row.id}
                row={row}
                investorId={investorId}
                showCategory={index === 0}
                categoryRowSpan={rows.length}
              />
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}

function MatrixRow({
  row,
  investorId,
  showCategory,
  categoryRowSpan,
}: {
  row: DdMatrixRow
  investorId: string
  showCategory: boolean
  categoryRowSpan: number
}) {
  const meta = CATEGORY_META[row.category]
  const Icon = meta.icon
  const status = row.statusByInvestor[investorId] ?? "Requested"

  return (
    <tr className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fafc]">
      {showCategory ? (
        <td
          rowSpan={categoryRowSpan}
          className="align-top border-r border-[#f1f5f9] px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px]"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span className="text-[11px] font-semibold text-[#0f172a]">{row.category}</span>
          </div>
        </td>
      ) : null}
      <td className="whitespace-nowrap px-3 py-2 text-[12px] text-[#0f172a]">{row.document}</td>
      <td className="px-3 py-2">
        <StatusPill status={status} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-[#64748b]">
        {row.lastUpdated}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-[#64748b]">{row.owner}</td>
    </tr>
  )
}

function RequestItem({ request }: { request: DdRequest }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-[#f1f5f9] px-3 py-2.5 last:border-b-0">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
        style={{ backgroundColor: request.logoBg }}
      >
        {request.logoLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-snug text-[#0f172a]">{request.title}</p>
        <p className="mt-0.5 text-[10px] text-[#94a3b8]">{request.investorName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
              priorityStyle(request.priority),
            )}
          >
            {request.priority}
          </span>
          <span className="text-[10px] text-[#94a3b8]">Due: {request.dueDate}</span>
        </div>
      </div>
    </div>
  )
}

function ThreadBubble({ message }: { message: DdThreadMessage }) {
  const isRight = message.side === "right"
  return (
    <div className={cn("flex gap-2", isRight ? "flex-row-reverse" : "flex-row")}>
      <span className="relative shrink-0">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: message.avatarBg }}
        >
          {message.initials}
        </span>
        {message.online ? (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-[#22c55e]" />
        ) : null}
      </span>
      <div className={cn("min-w-0 max-w-[85%]", isRight ? "items-end" : "items-start")}>
        <div
          className={cn(
            "flex items-baseline gap-2",
            isRight ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-[11px] font-semibold text-[#0f172a]">{message.author}</span>
          <span className="text-[9px] text-[#94a3b8]">{message.timestamp}</span>
        </div>
        <div
          className={cn(
            "mt-1 rounded-[6px] px-2.5 py-2 text-[11px] leading-relaxed",
            isRight
              ? "bg-[#ede9fe] text-[#312e81]"
              : "bg-[#f1f5f9] text-[#0f172a]",
          )}
        >
          {message.body}
        </div>
      </div>
    </div>
  )
}

export function FundraisingDueDiligence() {
  const [selectedId, setSelectedId] = useState(DD_INVESTORS[0].id)
  const [qaTab, setQaTab] = useState<"open" | "resolved">("open")
  const [qaInvestorFilter, setQaInvestorFilter] = useState("all")
  const [thread, setThread] = useState<DdThreadMessage[]>(DD_THREAD_SEED)
  const [reply, setReply] = useState("")
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [allRequestsOpen, setAllRequestsOpen] = useState(false)
  const [addDocOpen, setAddDocOpen] = useState(false)
  const [docName, setDocName] = useState("ZGF II signed side letter")

  const selected =
    DD_INVESTORS.find((i) => i.id === selectedId) ?? DD_INVESTORS[0]

  const filteredRequests = useMemo(() => {
    return DD_REQUESTS.filter((r) => {
      if (qaTab === "open" && r.resolved) return false
      if (qaTab === "resolved" && !r.resolved) return false
      if (qaInvestorFilter !== "all" && r.investorId !== qaInvestorFilter) return false
      return true
    })
  }, [qaTab, qaInvestorFilter])

  function sendReply() {
    const text = reply.trim()
    if (!text) return
    const now = new Date()
    const stamp = `${now.getDate()} ${now.toLocaleString("en-GB", { month: "short" })} ${now.getFullYear()}, ${now
      .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      .replace(",", "")}`
    setThread((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        author: "You",
        initials: "YO",
        avatarBg: "#7c3aed",
        online: true,
        timestamp: stamp,
        body: text,
        side: "right",
      },
    ])
    setReply("")
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
          Due Diligence
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#64748b]">
            <CalendarDays className="h-3.5 w-3.5" />
            As at {DD_AS_AT}
          </span>
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            onClick={() => toast.success("Export started")}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setAddDocOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {DD_KPIS.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Body */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* Left investors */}
        <aside className={cn(CARD, "flex flex-col overflow-hidden")}>
          <div className="flex items-center gap-2 border-b border-[#f1f5f9] px-3 py-3">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Active Investors in DD</h2>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
              {DD_INVESTORS.length}
            </span>
          </div>
          <div className="flex flex-col gap-2 p-2.5">
            {DD_INVESTORS.map((inv) => (
              <InvestorCard
                key={inv.id}
                investor={inv}
                selected={selected.id === inv.id}
                onSelect={() => setSelectedId(inv.id)}
              />
            ))}
          </div>
          <div className="mt-auto border-t border-[#f1f5f9] px-3 py-2.5">
            <button
              type="button"
              onClick={() => setArchivedOpen(true)}
              className="text-[11px] font-medium text-[#2563eb] hover:underline"
            >
              View archived investors (2) &gt;
            </button>
          </div>
        </aside>

        {/* Center matrix */}
        <section className={cn(CARD, "flex min-w-0 flex-col overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Due Diligence Matrix</h2>
              <button
                type="button"
                className="text-[#94a3b8] hover:text-[#64748b]"
                title="Document status by category for the selected investor"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-8 w-full rounded-[6px] border-[#e2e8f0] text-[12px] sm:w-[200px]">
                  <SelectValue placeholder="View by Investor" />
                </SelectTrigger>
                <SelectContent>
                  {DD_INVESTORS.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full border-[#e2e8f0]"
                onClick={() => toast.success("Matrix export started")}
              >
                <Download className="h-3.5 w-3.5 text-[#64748b]" />
                <span className="sr-only">Export matrix</span>
              </Button>
            </div>
          </div>

          <MatrixTable investorId={selected.id} investorName={selected.name} />

          <div className="mt-auto flex flex-col gap-2 border-t border-[#f1f5f9] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {DD_STATUS_LEGEND.map((status) => {
                const style = statusStyle(status)
                return (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1.5 text-[10px] text-[#64748b]"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                    {status}
                  </span>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => toast.success("Matrix export started")}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563eb] hover:underline"
            >
              <Download className="h-3 w-3" />
              Export Matrix
            </button>
          </div>
        </section>

        {/* Right Q&A + thread */}
        <aside className="flex flex-col gap-4">
          <div className={cn(CARD, "flex flex-col overflow-hidden")}>
            <div className="border-b border-[#f1f5f9] px-3 pt-3">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Q&A / Requests</h2>
              <div className="mt-2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQaTab("open")}
                  className={cn(
                    "border-b-2 pb-2 text-[12px] font-medium transition-colors",
                    qaTab === "open"
                      ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-[length:100%_2px] bg-bottom bg-no-repeat text-[#2563eb]"
                      : "border-transparent text-[#94a3b8] hover:text-[#64748b]",
                  )}
                >
                  Open ({OPEN_REQUEST_COUNT})
                </button>
                <button
                  type="button"
                  onClick={() => setQaTab("resolved")}
                  className={cn(
                    "border-b-2 pb-2 text-[12px] font-medium transition-colors",
                    qaTab === "resolved"
                      ? "border-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-[length:100%_2px] bg-bottom bg-no-repeat text-[#2563eb]"
                      : "border-transparent text-[#94a3b8] hover:text-[#64748b]",
                  )}
                >
                  Resolved ({RESOLVED_REQUEST_COUNT})
                </button>
              </div>
            </div>
            <div className="border-b border-[#f1f5f9] px-3 py-2">
              <Select value={qaInvestorFilter} onValueChange={setQaInvestorFilter}>
                <SelectTrigger className="h-8 w-full rounded-[6px] border-[#e2e8f0] text-[12px]">
                  <SelectValue placeholder="All Investors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Investors</SelectItem>
                  {DD_INVESTORS.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {filteredRequests.length === 0 ? (
                <p className="px-3 py-6 text-center text-[12px] text-[#94a3b8]">
                  No requests in this view.
                </p>
              ) : (
                filteredRequests.map((req) => <RequestItem key={req.id} request={req} />)
              )}
            </div>
            <div className="border-t border-[#f1f5f9] px-3 py-2.5">
              <button
                type="button"
                onClick={() => setAllRequestsOpen(true)}
                className="text-[11px] font-medium text-[#2563eb] hover:underline"
              >
                View all open requests &gt;
              </button>
            </div>
          </div>

          <div className={cn(CARD, "flex flex-col overflow-hidden")}>
            <div className="border-b border-[#f1f5f9] px-3 py-3">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Recent Q&A Thread</h2>
            </div>
            <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto px-3 py-3">
              {thread.map((msg) => (
                <ThreadBubble key={msg.id} message={msg} />
              ))}
            </div>
            <div className="border-t border-[#f1f5f9] p-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toast.message("Attachments coming soon")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="sr-only">Attach</span>
                </button>
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                  placeholder="Type your reply..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] text-[12px] shadow-none"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="gradient-info" className="rounded-full h-8 w-8 shrink-0 p-0 shadow-sm"
                  onClick={sendReply}
                  disabled={!reply.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <FrViewAllDialog
        open={archivedOpen}
        onOpenChange={setArchivedOpen}
        title="Archived investors"
        description="Investors no longer active in due diligence"
        rows={[
          {
            id: "arch-1",
            title: "Midlands Provident Fund",
            subtitle: "Archived 02 Apr 2025 · Lead: Tendai Banda",
            meta: "Completion 100% · Closed without commitment",
            badge: "Archived",
          },
          {
            id: "arch-2",
            title: "Sable Capital Partners",
            subtitle: "Archived 18 Mar 2025 · Lead: Farai Ncube",
            meta: "Completion 92% · Moved to another vehicle",
            badge: "Archived",
          },
        ]}
      />

      <FrViewAllDialog
        open={allRequestsOpen}
        onOpenChange={setAllRequestsOpen}
        title="All open requests"
        description={`${DD_REQUESTS.filter((r) => !r.resolved).length} open Q&A / document requests`}
        size="xl"
        rows={DD_REQUESTS.filter((r) => !r.resolved).map((r) => ({
          id: r.id,
          title: r.title,
          subtitle: r.investorName,
          meta: `Due ${r.dueDate}`,
          badge: r.priority,
          badgeClass:
            r.priority === "High"
              ? "bg-[#fee2e2] text-[#dc2626]"
              : r.priority === "Medium"
                ? "bg-[#ffedd5] text-[#c2410c]"
                : "bg-[#dcfce7] text-[#15803d]",
        }))}
      />

      <FrSimpleWizard
        open={addDocOpen}
        onOpenChange={setAddDocOpen}
        title="Add Document"
        steps={[{ id: "document", short: "1", label: "Document" }, { id: "category", short: "2", label: "Category" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Add document"
        validateStep={(step) => step === "document" && !docName.trim() ? ["Document name is required"] : []}
        onSubmit={() => {
          toast.success(`Document “${docName.trim()}” added`)
          setDocName("ZGF II signed side letter")
        }}
      >
        {(step) => step === "document" ? <FrField label="Document name">
            <input
              className={frInputClass}
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Side Letter signed copy"
            />
          </FrField> : step === "category" ? <FrField label="Category">
            <select className={frSelectClass} defaultValue="Legal">
              <option>Legal</option>
              <option>Compliance</option>
              <option>Financials</option>
              <option>ESG</option>
            </select>
          </FrField> : <ReviewList items={[
            { label: "Document", value: docName },
            { label: "For", value: selected.name },
            { label: "Category", value: "Legal" },
          ]} />}
      </FrSimpleWizard>
    </div>
  )
}
