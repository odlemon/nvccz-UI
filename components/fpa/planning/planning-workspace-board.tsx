"use client"

/**
 * Model Planning — Planning Workspace (SRD mock, hardcoded).
 * Matches the FP&A Model Planning workspace composition until APIs land.
 */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronDown,
  ChevronRight,
  Columns3,
  MoreHorizontal,
  Paperclip,
  Percent,
  RefreshCw,
  Sparkles,
  ThumbsUp,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FpaPageHeader } from "@/components/fpa/fpa-page-header"
import { KpiSparkline } from "@/components/fpa/kpi-sparkline"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const SCENARIOS = ["Budget 2026", "Forecast Q3", "Best Case", "Base Case", "Downside"] as const

type DeptRow = {
  id: string
  name: string
  values: number[]
  fy: number
  children?: DeptRow[]
}

/** Exact SRD planning grid — Total Company + departments */
const GRID_ROWS: DeptRow[] = [
  {
    id: "total",
    name: "Total Company",
    values: [9845, 10012, 10240, 10480, 10720, 10960, 11210, 11460, 11720, 11980, 12350, 12828],
    fy: 128424,
    children: [
      {
        id: "sm",
        name: "Sales & Marketing",
        values: [2140, 2180, 2220, 2280, 2340, 2400, 2460, 2520, 2580, 2640, 2720, 2860],
        fy: 29340,
      },
      {
        id: "product",
        name: "Product",
        values: [1680, 1710, 1745, 1780, 1815, 1850, 1890, 1930, 1975, 2020, 2080, 2160],
        fy: 22635,
      },
      {
        id: "eng",
        name: "Engineering",
        values: [1920, 1950, 1985, 2020, 2060, 2100, 2145, 2190, 2240, 2290, 2360, 2450],
        fy: 25710,
      },
      {
        id: "cs",
        name: "Customer Success",
        values: [980, 995, 1020, 1045, 1070, 1095, 1120, 1145, 1175, 1200, 1240, 1285],
        fy: 13370,
      },
      {
        id: "ga",
        name: "General & Admin",
        values: [1120, 1135, 1155, 1180, 1205, 1230, 1255, 1280, 1310, 1340, 1380, 1430],
        fy: 15020,
      },
      {
        id: "rd",
        name: "R&D",
        values: [1245, 1265, 1290, 1320, 1350, 1380, 1415, 1450, 1485, 1520, 1570, 1630],
        fy: 16920,
      },
      {
        id: "ops",
        name: "Operations",
        values: [760, 777, 825, 855, 880, 905, 925, 945, 955, 970, 1000, 1013],
        fy: 10810,
      },
    ],
  },
]

const KPIS = [
  {
    label: "Revenue",
    value: "$128.4M",
    delta: "↑ 8.7% vs Plan",
    up: true,
    spark: [98, 102, 105, 108, 112, 115, 118, 120, 122, 124, 126, 128.4],
    color: "#2563eb",
  },
  {
    label: "Opex",
    value: "$72.6M",
    delta: "↑ 6.3% vs Plan",
    up: true,
    spark: [58, 60, 62, 63, 65, 66, 68, 69, 70, 71, 72, 72.6],
    color: "#7c3aed",
  },
  {
    label: "EBITDA",
    value: "$55.8M",
    delta: "↑ 12.4% vs Plan",
    up: true,
    spark: [38, 40, 42, 44, 46, 48, 50, 51, 53, 54, 55, 55.8],
    color: "#0d9488",
  },
  {
    label: "Cash Runway",
    value: "14.6 Months",
    delta: "↓ 1.1 MoM",
    up: false,
    spark: [16.2, 15.9, 15.7, 15.5, 15.3, 15.1, 15.0, 14.9, 14.8, 14.7, 14.65, 14.6],
    color: "#2563eb",
  },
  {
    label: "Variance to Plan",
    value: "$3.9M",
    delta: "↑ 2.1% of Revenue",
    up: true,
    spark: [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0, 3.2, 3.4, 3.6, 3.8, 3.9],
    color: "#16a34a",
  },
]

const DRIVERS = [
  { name: "Volume Growth", prior: "12.5%", plan: "9.8%", change: "↓ 2.7 pp", up: false },
  { name: "Price Change", prior: "3.2%", plan: "2.5%", change: "↓ 0.7 pp", up: false },
  { name: "Headcount Plan", prior: "512", plan: "568", change: "↑ 56", up: true },
  { name: "Inflation (US)", prior: "3.4%", plan: "2.6%", change: "↓ 0.8 pp", up: true },
  { name: "FX Rate (USD/EUR)", prior: "1.08", plan: "1.12", change: "↑ 0.04", up: true },
]

/** Jan–May actuals, Jun–Dec plan (USD M) — matches mock trend */
const TREND = {
  labels: MONTHS,
  revenueActual: [9.8, 10.1, 10.4, 10.6, 10.9, null, null, null, null, null, null, null] as Array<
    number | null
  >,
  revenuePlan: [9.5, 9.8, 10.0, 10.3, 10.5, 10.8, 11.0, 11.2, 11.4, 11.6, 11.8, 12.0] as number[],
  opexActual: [5.4, 5.5, 5.7, 5.8, 5.9, null, null, null, null, null, null, null] as Array<
    number | null
  >,
  opexPlan: [5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7] as number[],
}

const COMMENTS = [
  {
    id: "c1",
    author: "Michael Chen",
    initials: "MC",
    tone: "bg-[#dbeafe] text-[#1d4ed8]",
    when: "2h ago",
    body: "Marketing spend in Q3 looks elevated vs campaign calendar — can @Sarah Delgado confirm before we lock?",
    likes: 2,
  },
  {
    id: "c2",
    author: "Sarah Delgado",
    initials: "SD",
    tone: "bg-[#dcfce7] text-[#15803d]",
    when: "Yesterday",
    body: "Updated Engineering headcount for H2. Please refresh calc after reviewing the driver pack.",
    likes: 1,
  },
  {
    id: "c3",
    author: "Priya Nair",
    initials: "PN",
    tone: "bg-[#fce7f3] text-[#be185d]",
    when: "May 11",
    body: "Cash runway uses May actuals. Flag if FP&A wants a conservative buffer on closing cash.",
    likes: 0,
  },
]

const TASKS = [
  { id: "t1", title: "Review Marketing Plan", assignee: "Priya Nair", due: "May 16", urgent: false },
  { id: "t2", title: "Validate Headcount Plan", assignee: "Daniel Lee", due: "May 18", urgent: true },
  { id: "t3", title: "Check FX Assumptions", assignee: "Arjun Patel", due: "May 19", urgent: false },
  { id: "t4", title: "Review Opex by Dept", assignee: "James Whitaker", due: "May 20", urgent: false },
]

const WORKFLOW = [
  {
    id: "w1",
    label: "Draft",
    status: "done" as const,
    detail: "Sarah Delgado, May 12, 2026 9:15 AM",
  },
  {
    id: "w2",
    label: "Submitted",
    status: "done" as const,
    detail: "Michael Chen, May 12, 2026 2:45 PM",
  },
  {
    id: "w3",
    label: "Under Review",
    status: "active" as const,
    detail: "FP&A Team, Due May 19, 2026",
  },
  {
    id: "w4",
    label: "Approved",
    status: "pending" as const,
    detail: "James Whitaker, Due May 26, 2026",
  },
]

function fmt(n: number) {
  return n.toLocaleString("en-US")
}

function cloneGrid(rows: DeptRow[]): DeptRow[] {
  return rows.map((r) => ({
    ...r,
    values: [...r.values],
    children: r.children ? cloneGrid(r.children) : undefined,
  }))
}

function sumFy(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

function recomputeTotal(rows: DeptRow[]): DeptRow[] {
  return rows.map((root) => {
    if (!root.children?.length) {
      return { ...root, fy: sumFy(root.values) }
    }
    const children = root.children.map((c) => ({ ...c, values: [...c.values], fy: sumFy(c.values) }))
    const values = MONTHS.map((_, i) => children.reduce((acc, c) => acc + (c.values[i] || 0), 0))
    return { ...root, children, values, fy: sumFy(values) }
  })
}

type Props = {
  modelId?: string
}

export function PlanningWorkspaceBoard({ modelId }: Props) {
  const [scenario, setScenario] = useState<(typeof SCENARIOS)[number]>("Budget 2026")
  const [version, setVersion] = useState("v3.2 Working")
  const [cycle, setCycle] = useState("FY2026 Budget")
  const [gridRows, setGridRows] = useState(() => cloneGrid(GRID_ROWS))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ total: true })
  const [sideTab, setSideTab] = useState<"comments" | "tasks" | "activity">("comments")
  const [draft, setDraft] = useState("")
  const [taskDone, setTaskDone] = useState<Record<string, boolean>>({})
  const [actionsOpen, setActionsOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState("total")
  const [editing, setEditing] = useState<{ rowId: string; col: number } | null>(null)
  const [draftCell, setDraftCell] = useState("")

  const flatRows = useMemo(() => {
    const out: Array<DeptRow & { depth: number }> = []
    const walk = (rows: DeptRow[], depth: number) => {
      for (const r of rows) {
        out.push({ ...r, depth })
        if (r.children?.length && expanded[r.id]) walk(r.children, depth + 1)
      }
    }
    walk(gridRows, 0)
    return out
  }, [expanded, gridRows])

  const commitCell = (rowId: string, col: number, raw: string) => {
    const cleaned = raw.replace(/,/g, "").trim()
    const value = Number(cleaned)
    if (!Number.isFinite(value)) {
      setEditing(null)
      return
    }
    setGridRows((prev) => {
      const next = cloneGrid(prev)
      const patch = (rows: DeptRow[]): boolean => {
        for (const r of rows) {
          if (r.id === rowId && !r.children?.length) {
            r.values[col] = Math.round(value)
            r.fy = sumFy(r.values)
            return true
          }
          if (r.children && patch(r.children)) return true
        }
        return false
      }
      patch(next)
      return recomputeTotal(next)
    })
    setEditing(null)
    toast.success("Cell updated")
  }

  const compareHref = modelId
    ? `/forecasting/scenarios?modelId=${encodeURIComponent(modelId)}`
    : "/forecasting/scenarios"

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <FpaPageHeader
        title="Model Planning"
        hideFilters
        actions={
          <Link
            href="/forecasting/models?catalog=1"
            className="h-9 inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 text-xs font-medium text-[#475569] hover:bg-[#f8fafc]"
          >
            All models
          </Link>
        }
      />

      <div className="flex-1 p-3 sm:p-4 space-y-3 overflow-auto">
        {/* Version · Cycle · Scenarios · Actions */}
        <section className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[11px] text-[#64748b] inline-flex items-center gap-2">
              <span className="font-medium">Model Version</span>
              <span className="relative inline-flex items-center">
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="h-9 appearance-none rounded-full border border-[#e2e8f0] bg-white pl-3 pr-16 text-[13px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                >
                  <option>v3.2 Working</option>
                  <option>v3.1 Published</option>
                  <option>v3.0 Locked</option>
                </select>
                <span className="pointer-events-none absolute right-2 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-semibold text-[#15803d]">
                  Latest
                </span>
              </span>
            </label>

            <label className="text-[11px] text-[#64748b] inline-flex items-center gap-2">
              <span className="font-medium">Planning Cycle</span>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="h-9 rounded-full border border-[#e2e8f0] bg-white px-3 text-[13px] font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              >
                <option>FY2026 Budget</option>
                <option>FY2026 Q3 Rolling Forecast</option>
                <option>FY2025 Budget</option>
              </select>
            </label>
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-2 border-t border-[#f1f5f9] pt-1">
            <div className="flex flex-wrap items-end gap-0.5">
              {SCENARIOS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScenario(s)}
                  className={cn(
                    "h-9 px-3.5 text-[13px] font-medium border-b-2 -mb-px transition-colors",
                    scenario === s
                      ? "border-[#2563eb] text-[#2563eb]"
                      : "border-transparent text-[#64748b] hover:text-[#0f172a]",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pb-1">
              <Link
                href={compareHref}
                className="h-9 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3.5 text-[12px] font-medium text-[#475569] hover:bg-[#f8fafc]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
                Compare
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((o) => !o)}
                  className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-[12px] font-medium text-white shadow-sm hover:bg-[#1d4ed8]"
                >
                  Actions
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>
                {actionsOpen ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10"
                      aria-label="Close"
                      onClick={() => setActionsOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-md">
                      {["Export CSV", "Refresh calc", "Copy link", "Submit for review"].map((a) => (
                        <button
                          key={a}
                          type="button"
                          className="w-full px-3 py-2 text-left text-[12px] text-[#0f172a] hover:bg-[#f8fafc]"
                          onClick={() => {
                            toast.message(a)
                            setActionsOpen(false)
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* KPI strip */}
        <section className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] px-3 py-2.5 min-h-[96px]"
              >
                <p className="text-[11px] font-medium text-[#64748b]">{k.label}</p>
                <div className="mt-1 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[20px] font-semibold text-[#0f172a] tabular-nums leading-none">
                      {k.value}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-medium mt-1.5",
                        k.up ? "text-[#16a34a]" : "text-[#dc2626]",
                      )}
                    >
                      {k.delta}
                    </p>
                  </div>
                  <Sparkline values={k.spark} color={k.color} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94a3b8]">
            <span>All values in USD</span>
            <div className="inline-flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-[#64748b]">
                View by
                <select className="h-8 rounded-full border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-[#0f172a]">
                  <option>Total Company</option>
                  <option>By Department</option>
                  <option>By Region</option>
                </select>
              </label>
              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                onClick={() => toast.success("KPIs refreshed")}
                aria-label="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Grid + sidebar · Trend + Drivers · Workflow */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-3 items-start">
          <div className="space-y-3 min-w-0">
            <PlanningGrid
              rows={flatRows}
              expanded={expanded}
              selectedId={selectedDept}
              editing={editing}
              draft={draftCell}
              onDraft={setDraftCell}
              onSelect={setSelectedDept}
              onToggle={(id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))}
              onStartEdit={(rowId, col, value) => {
                setSelectedDept(rowId)
                setEditing({ rowId, col })
                setDraftCell(String(value))
              }}
              onCommitEdit={(raw) => {
                if (!editing) return
                commitCell(editing.rowId, editing.col, raw)
              }}
              onCancelEdit={() => setEditing(null)}
            />

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
              <TrendCard />
              <DriversCard />
            </div>
          </div>

          <CollabSidebar
            tab={sideTab}
            onTab={setSideTab}
            draft={draft}
            onDraft={setDraft}
            taskDone={taskDone}
            onToggleTask={(id) => setTaskDone((p) => ({ ...p, [id]: !p[id] }))}
          />
        </div>

        <WorkflowBar />
      </div>
    </div>
  )
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  return (
    <KpiSparkline
      values={values}
      color={color}
      width={56}
      height={22}
      strokeWidth={1.25}
      showDots={false}
    />
  )
}

function PlanningGrid({
  rows,
  expanded,
  selectedId,
  editing,
  draft,
  onDraft,
  onSelect,
  onToggle,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: {
  rows: Array<DeptRow & { depth: number }>
  expanded: Record<string, boolean>
  selectedId: string
  editing: { rowId: string; col: number } | null
  draft: string
  onDraft: (v: string) => void
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onStartEdit: (rowId: string, col: number, value: number) => void
  onCommitEdit: (raw: string) => void
  onCancelEdit: () => void
}) {
  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] px-4 py-2.5">
        <h2 className="text-[14px] font-semibold text-[#0f172a]">Planning Grid</h2>
        <div className="inline-flex items-center gap-1.5">
          <ToolBtn label="%" icon={<Percent className="w-3.5 h-3.5" />} />
          <ToolBtn label="Auto-fit" />
          <ToolBtn label="Columns" icon={<Columns3 className="w-3.5 h-3.5" />} />
          <button
            type="button"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] text-[11px] text-[#64748b] border-b border-[#e2e8f0]">
              <th className="sticky left-0 z-10 bg-[#f8fafc] px-3 py-2.5 font-medium min-w-[200px] border-r border-[#e2e8f0]">
                Department
              </th>
              {MONTHS.map((m) => (
                <th key={m} className="px-2.5 py-2.5 font-medium text-right whitespace-nowrap">
                  {m}
                </th>
              ))}
              <th className="px-3 py-2.5 font-semibold text-right text-[#0f172a] whitespace-nowrap">
                FY2026 Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasKids = Boolean(row.children?.length)
              const sel = row.id === selectedId
              const editable = !hasKids
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  className={cn(
                    "border-b border-[#e2e8f0] cursor-pointer text-[12px]",
                    sel ? "bg-[#f8fbff]" : "bg-white hover:bg-[#fafbfc]",
                    row.depth === 0 && "font-semibold",
                  )}
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 px-2 py-2 border-r border-[#e2e8f0]",
                      sel ? "bg-[#f8fbff]" : "bg-white",
                    )}
                  >
                    <div
                      className="flex items-center gap-1 min-w-0"
                      style={{ paddingLeft: row.depth * 14 }}
                    >
                      {hasKids ? (
                        <button
                          type="button"
                          className="h-5 w-5 inline-flex items-center justify-center text-[#94a3b8] hover:text-[#64748b]"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggle(row.id)
                          }}
                          aria-label={expanded[row.id] ? "Collapse" : "Expand"}
                        >
                          {expanded[row.id] ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}
                      <span className="truncate text-[#0f172a]">{row.name}</span>
                    </div>
                  </td>
                  {row.values.map((v, i) => {
                    const isEditing = editing?.rowId === row.id && editing.col === i
                    return (
                      <td
                        key={i}
                        className={cn(
                          "px-1.5 py-1 text-right tabular-nums text-[#0f172a] whitespace-nowrap",
                          editable && "cursor-text",
                        )}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          if (!editable) {
                            toast.message("Edit department rows — Total Company is calculated")
                            return
                          }
                          onStartEdit(row.id, i, v)
                        }}
                        onClick={(e) => {
                          if (!editable) return
                          e.stopPropagation()
                          onSelect(row.id)
                        }}
                        title={editable ? "Double-click to edit" : "Calculated total"}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => onDraft(e.target.value)}
                            onBlur={(e) => onCommitEdit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                onCommitEdit((e.target as HTMLInputElement).value)
                              if (e.key === "Escape") onCancelEdit()
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full min-w-[4.5rem] h-8 rounded border-2 border-[#2563eb] px-1.5 text-right text-[12px] tabular-nums outline-none"
                          />
                        ) : (
                          <span
                            className={cn(
                              "inline-block w-full min-h-[28px] px-1 py-1 rounded",
                              editable && "hover:bg-[#eff6ff]",
                            )}
                          >
                            {fmt(v)}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#0f172a] whitespace-nowrap">
                    {fmt(row.fy)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[#f1f5f9] px-4 py-2 text-[11px] text-[#94a3b8]">
        Double-click a department month cell to edit. Total Company and FY totals recalculate automatically.
      </p>
    </section>
  )
}

function ToolBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => toast.message(label)}
      className="h-8 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-[#475569] hover:bg-[#f8fafc]"
    >
      {icon}
      {label}
    </button>
  )
}

function TrendCard() {
  const w = 480
  const h = 200
  const padL = 40
  const padR = 12
  const padT = 16
  const padB = 28
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const yMax = 15
  const toX = (i: number) => padL + (i / 11) * plotW
  const toY = (v: number) => padT + plotH - (v / yMax) * plotH

  const line = (vals: Array<number | null>, color: string, dashed?: boolean) => {
    const segments: string[] = []
    let cur: string[] = []
    vals.forEach((v, i) => {
      if (v == null) {
        if (cur.length) {
          segments.push(cur.join(" "))
          cur = []
        }
        return
      }
      cur.push(`${toX(i)},${toY(v)}`)
    })
    if (cur.length) segments.push(cur.join(" "))
    return segments.map((pts, i) => (
      <polyline
        key={i}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeDasharray={dashed ? "4 3" : undefined}
        strokeLinejoin="round"
        points={pts}
      />
    ))
  }

  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-[13px] font-semibold text-[#0f172a]">Revenue vs Expense Trend</h3>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            className="text-[11px] font-medium text-[#2563eb] hover:underline"
            onClick={() => toast.message("Edit Chart")}
          >
            Edit Chart
          </button>
          <MoreHorizontal className="w-4 h-4 text-[#94a3b8]" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-[#64748b] mb-1">
        <Legend color="#2563eb" label="Revenue (Actual)" />
        <Legend color="#2563eb" label="Revenue (Plan)" dashed />
        <Legend color="#7c3aed" label="Opex (Actual)" />
        <Legend color="#7c3aed" label="Opex (Plan)" dashed />
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet">
        <text
          x={12}
          y={padT + plotH / 2}
          fontSize="8"
          fill="#94a3b8"
          textAnchor="middle"
          transform={`rotate(-90 12 ${padT + plotH / 2})`}
        >
          USD (M)
        </text>
        {[0, 5, 10, 15].map((v) => (
          <g key={v}>
            <line
              x1={padL}
              y1={toY(v)}
              x2={w - padR}
              y2={toY(v)}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
            <text x={padL - 4} y={toY(v) + 3} fontSize="8" fill="#94a3b8" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {line(TREND.revenuePlan, "#2563eb", true)}
        {line(TREND.opexPlan, "#7c3aed", true)}
        {line(TREND.revenueActual, "#2563eb")}
        {line(TREND.opexActual, "#7c3aed")}
        {MONTHS.map((m, i) => (
          <text key={m} x={toX(i)} y={h - 8} fontSize="8" fill="#94a3b8" textAnchor="middle">
            {m}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#f1f5f9] text-[10px] text-[#64748b]">
        <label className="inline-flex items-center gap-1">
          Actuals through
          <select className="h-7 rounded-full border border-[#e2e8f0] px-2 text-[10px] font-medium text-[#0f172a]">
            <option>May</option>
            <option>Apr</option>
            <option>Jun</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-1">
          Frequency
          <select className="h-7 rounded-full border border-[#e2e8f0] px-2 text-[10px] font-medium text-[#0f172a]">
            <option>Monthly</option>
            <option>Quarterly</option>
          </select>
        </label>
      </div>
    </section>
  )
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="16" height="8" aria-hidden>
        <line
          x1="0"
          y1="4"
          x2="16"
          y2="4"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? "3 2" : undefined}
        />
      </svg>
      {label}
    </span>
  )
}

function DriversCard() {
  const [drivers, setDrivers] = useState(() => DRIVERS.map((d) => ({ ...d })))
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const commit = (name: string, raw: string) => {
    const next = raw.trim()
    if (!next) {
      setEditing(null)
      return
    }
    setDrivers((prev) =>
      prev.map((d) => (d.name === name ? { ...d, plan: next, change: "Edited", up: true } : d)),
    )
    setEditing(null)
    toast.success(`Updated ${name}`)
  }

  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-[#0f172a]">Driver Assumptions</h3>
        <Link
          href="/forecasting/drivers"
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          Edit Drivers
        </Link>
      </div>
      <table className="w-full text-[11px] flex-1">
        <thead>
          <tr className="text-left text-[#94a3b8] border-b border-[#e2e8f0]">
            <th className="py-1.5 pr-2 font-medium">Driver</th>
            <th className="py-1.5 pr-2 font-medium text-right">FY2025 Actual</th>
            <th className="py-1.5 pr-2 font-medium text-right">FY2026 Plan</th>
            <th className="py-1.5 font-medium text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.name} className="border-b border-[#f1f5f9]">
              <td className="py-2.5 pr-2 font-medium text-[#0f172a]">{d.name}</td>
              <td className="py-2.5 pr-2 text-right tabular-nums text-[#64748b]">{d.prior}</td>
              <td
                className="py-2.5 pr-2 text-right tabular-nums font-medium text-[#0f172a] cursor-text"
                title="Double-click to edit"
                onDoubleClick={() => {
                  setEditing(d.name)
                  setDraft(d.plan)
                }}
              >
                {editing === d.name ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => commit(d.name, draft)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit(d.name, draft)
                      if (e.key === "Escape") setEditing(null)
                    }}
                    className="w-full min-w-[4rem] h-7 rounded border-2 border-[#2563eb] px-1.5 text-right text-[11px] outline-none"
                  />
                ) : (
                  <span className="inline-block w-full min-h-[28px] px-1 py-1 rounded hover:bg-[#eff6ff]">
                    {d.plan}
                  </span>
                )}
              </td>
              <td
                className={cn(
                  "py-2.5 text-right tabular-nums font-medium",
                  d.up ? "text-[#16a34a]" : "text-[#dc2626]",
                )}
              >
                {d.change}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-[#94a3b8] mt-2">
        Double-click FY2026 Plan to edit · pp = percentage points
      </p>
    </section>
  )
}

function CollabSidebar({
  tab,
  onTab,
  draft,
  onDraft,
  taskDone,
  onToggleTask,
}: {
  tab: "comments" | "tasks" | "activity"
  onTab: (t: "comments" | "tasks" | "activity") => void
  draft: string
  onDraft: (v: string) => void
  taskDone: Record<string, boolean>
  onToggleTask: (id: string) => void
}) {
  const openTasks = TASKS.filter((t) => !taskDone[t.id]).length
  const [comments, setComments] = useState(() => [...COMMENTS])
  const [likes, setLikes] = useState<Record<string, number>>(() =>
    Object.fromEntries(COMMENTS.map((c) => [c.id, c.likes || 0])),
  )

  return (
    <aside className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm flex flex-col overflow-hidden xl:sticky xl:top-3 min-h-[520px] max-h-[calc(100vh-8rem)]">
      <div className="flex border-b border-[#e2e8f0] shrink-0">
        {(
          [
            { id: "comments" as const, label: "Comments" },
            { id: "tasks" as const, label: `Tasks (${openTasks})` },
            { id: "activity" as const, label: "Activity" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            className={cn(
              "flex-1 h-10 text-[12px] font-medium border-b-2 -mb-px",
              tab === t.id
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-[#64748b] hover:text-[#0f172a]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3">
        {tab === "comments" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2">
              <textarea
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                placeholder="Add a comment…"
                rows={3}
                className="w-full resize-none bg-transparent text-[12px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full text-[#94a3b8] hover:bg-white"
                  aria-label="Attach"
                  onClick={() => toast.message("Attachments coming soon")}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!draft.trim()}
                  onClick={() => {
                    const body = draft.trim()
                    setComments((prev) => [
                      {
                        id: `local-${Date.now()}`,
                        author: "You",
                        initials: "YO",
                        tone: "bg-[#e0e7ff] text-[#3730a3]",
                        when: "Just now",
                        body,
                        likes: 0,
                      },
                      ...prev,
                    ])
                    onDraft("")
                    toast.success("Comment posted")
                  }}
                  className="h-8 rounded-full bg-[#2563eb] px-3.5 text-[11px] font-medium text-white disabled:opacity-40 hover:bg-[#1d4ed8]"
                >
                  Post
                </button>
              </div>
            </div>

            {comments.map((c) => (
              <article key={c.id} className="flex gap-2.5">
                <span
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full text-[10px] font-semibold inline-flex items-center justify-center",
                    c.tone,
                  )}
                >
                  {c.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[12px] font-semibold text-[#0f172a] truncate">{c.author}</p>
                    <span className="text-[10px] text-[#94a3b8] shrink-0">{c.when}</span>
                  </div>
                  <p className="text-[12px] text-[#475569] mt-0.5 leading-relaxed">{c.body}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#64748b]">
                    <button
                      type="button"
                      className="hover:text-[#2563eb]"
                      onClick={() => toast.message(`Reply to ${c.author}`)}
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-[#2563eb]"
                      onClick={() =>
                        setLikes((p) => ({ ...p, [c.id]: (p[c.id] || 0) + 1 }))
                      }
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {likes[c.id] || "Like"}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <button
              type="button"
              className="text-[11px] font-medium text-[#2563eb] hover:underline"
              onClick={() => toast.message(`${comments.length} comments in this thread`)}
            >
              View all comments
            </button>
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] font-semibold text-[#0f172a]">Tasks</p>
              <button
                type="button"
                className="text-[11px] font-medium text-[#2563eb]"
                onClick={() => toast.message("Task list")}
              >
                View all
              </button>
            </div>
            {TASKS.map((t) => (
              <label
                key={t.id}
                className="rounded-lg border border-[#e2e8f0] px-3 py-2.5 flex gap-2.5 items-start cursor-pointer hover:bg-[#fafbfc]"
              >
                <input
                  type="checkbox"
                  checked={Boolean(taskDone[t.id])}
                  onChange={() => onToggleTask(t.id)}
                  className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1] text-[#2563eb]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    {t.urgent ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" aria-hidden />
                    ) : null}
                    <span
                      className={cn(
                        "text-[12px] font-medium text-[#0f172a]",
                        taskDone[t.id] && "line-through text-[#94a3b8]",
                      )}
                    >
                      {t.title}
                    </span>
                  </span>
                  <span className="block text-[11px] text-[#64748b] mt-0.5">{t.assignee}</span>
                  <span className="block text-[11px] font-medium text-[#dc2626] mt-0.5">
                    Due {t.due}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}

        {tab === "activity" && (
          <ul className="space-y-3 text-[12px]">
            {[
              { when: "9:12 AM", text: "Michael Chen updated EBITDA driver pack" },
              { when: "8:47 AM", text: "Sarah Delgado remapped Payroll Expense" },
              { when: "Yesterday", text: "Workflow moved to Under Review" },
              { when: "May 11", text: "Budget 2026 scenario copied from Base Case" },
            ].map((a) => (
              <li key={a.when + a.text} className="flex gap-3">
                <span className="text-[10px] text-[#94a3b8] w-16 shrink-0">{a.when}</span>
                <span className="text-[#475569]">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

function WorkflowBar() {
  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white px-4 py-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-[13px] font-semibold text-[#0f172a]">Workflow Status</h3>
        <Link
          href="/forecasting/workflow"
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View Workflow Details
        </Link>
      </div>

      <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
        {WORKFLOW.map((step, i) => {
          const last = i === WORKFLOW.length - 1
          return (
            <li key={step.id} className="relative flex sm:flex-1 gap-3 sm:flex-col sm:items-center sm:text-center">
              {!last ? (
                <span
                  className="hidden sm:block absolute top-3 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 bg-[#e2e8f0]"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  step.status === "done" && "bg-[#2563eb] text-white",
                  step.status === "active" && "bg-[#7c3aed] text-white",
                  step.status === "pending" &&
                    "bg-[#f1f5f9] text-[#94a3b8] border border-[#e2e8f0]",
                )}
              >
                {step.status === "done" ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 sm:mt-2">
                <p className="text-[12px] font-semibold text-[#0f172a]">{step.label}</p>
                <p className="text-[11px] text-[#64748b] mt-0.5 leading-snug">{step.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
