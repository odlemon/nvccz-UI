"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Info,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { KpiSparkline } from "@/components/fpa/kpi-sparkline"
import { Button } from "@/components/ui/button"
import {
  mockCashDrivers,
  mockCashKpis,
  mockCashMonthly,
  mockCashRunwayScenarios,
  mockCashStatementRows,
} from "@/components/fpa/mock-data"

const R = "rounded-lg"
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug"] as const
const MONTH_LABELS: Record<(typeof MONTHS)[number], string> = {
  jan: "Jan",
  feb: "Feb",
  mar: "Mar",
  apr: "Apr",
  may: "May",
  jun: "Jun",
  jul: "Jul",
  aug: "Aug",
}

export type CashStatementRow = {
  id: string
  line: string
  type: "inflow" | "outflow" | "total"
  jan: number
  feb: number
  mar: number
  apr: number
  may: number
  jun: number
  jul: number
  aug: number
}

export type CashKpi = {
  label: string
  value: string
  delta?: string
  up?: boolean
  spark?: number[]
}

export type CashDetail = {
  id: string
  line: string
  period: string
  amount: string
  type: string
  ytd: string
  vsBudget: string
  narrative: string
  drivers: Array<{ label: string; value: string }>
}

const VERSION_SCALE: Record<string, number> = {
  Working: 1,
  Locked: 0.99,
  Published: 0.97,
}

const MIN_CASH_THRESHOLD = 15

function fmtM(n: number, signed = false): string {
  const abs = Math.abs(n).toFixed(1)
  if (signed && n < 0) return `($${abs}M)`
  if (signed && n > 0) return `+$${abs}M`
  return `$${abs}M`
}

function cellTone(n: number, type: CashStatementRow["type"]): string {
  if (type === "total") return "font-semibold text-[#101828]"
  if (n === 0) return "text-[#667085]"
  return n > 0 ? "text-[#12b76a]" : "text-[#f04438]"
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`h-10 min-w-[118px] inline-flex items-center ${R} border border-[#d0d5dd] bg-white pl-2.5 pr-7 text-left hover:bg-[#f9fafb]`}
      >
        <span className="flex flex-col justify-center min-w-0 py-1">
          <span className="text-[9px] font-medium uppercase tracking-wide text-[#98a2b3] leading-none">{label}</span>
          <span className="text-[12px] font-semibold text-[#101828] leading-tight mt-0.5 truncate">{value}</span>
        </span>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-[#98a2b3]" />
      </button>
      {open ? (
        <div className={`absolute left-0 top-[calc(100%+4px)] z-40 min-w-[180px] ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg`}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f9fafb]",
                opt === value ? "text-[#1570ef] font-semibold" : "text-[#344054]",
              )}
            >
              {opt}
              {opt === value ? <Check className="size-3.5 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}


function CashKpiCard({ kpi, onClick }: { kpi: CashKpi; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${R} border border-[#e4e7ec] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.03)] flex items-center justify-between gap-3 min-h-[92px] w-full text-left hover:border-[#b2ddff] transition-colors`}
    >
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[13px] font-semibold text-[#344054] leading-tight">{kpi.label}</p>
        <p className="mt-1.5 text-[26px] font-semibold text-[#101828] tabular-nums leading-none tracking-tight">{kpi.value}</p>
        {kpi.delta ? (
          <p className={cn("mt-1.5 text-[12px] font-medium", kpi.up !== false ? "text-[#12b76a]" : "text-[#f04438]")}>
            {kpi.delta}
          </p>
        ) : null}
      </div>
      {kpi.spark ? <KpiSparkline values={kpi.spark} color={kpi.label === "Closing Cash" ? "#2563eb" : "#0d9488"} /> : null}
    </button>
  )
}

export function detailForLine(row: CashStatementRow, monthKey: (typeof MONTHS)[number], period: string): CashDetail {
  const val = row[monthKey]
  const ytd = MONTHS.slice(0, MONTHS.indexOf(monthKey) + 1).reduce((s, m) => s + row[m], 0)
  return {
    id: row.id,
    line: row.line,
    period,
    amount: fmtM(val, true),
    type: row.type === "inflow" ? "Cash Inflow" : row.type === "outflow" ? "Cash Outflow" : "Balance",
    ytd: fmtM(ytd, true),
    vsBudget: val >= 0 ? "+2.1% vs Budget" : "-1.4% vs Budget",
    narrative:
      row.type === "total"
        ? `${row.line} for ${period} reflects consolidated treasury position across all entities.`
        : `${row.line} movement in ${period} driven by operational timing and forecast assumptions.`,
    drivers: mockCashDrivers.slice(0, 3).map((d) => ({
      label: d.name,
      value: d.unit === "days" ? `${d.value} ${d.unit}` : d.unit === "M" ? `$${d.value}M` : String(d.value),
    })),
  }
}

export function mapMockCashStatement(): CashStatementRow[] {
  return mockCashStatementRows.map((r) => ({ ...r }))
}

export function mapMockCashKpis(): CashKpi[] {
  return mockCashKpis.map((k) => ({ ...k }))
}

type CashFlowAnalysisViewProps = {
  loading?: boolean
  kpis?: CashKpi[]
  statementRows?: CashStatementRow[]
  periodLabel?: string
  onRefresh?: () => void
}

export function CashFlowAnalysisView({
  loading = false,
  kpis = mapMockCashKpis(),
  statementRows = mapMockCashStatement(),
  periodLabel = "May 2025",
  onRefresh,
}: CashFlowAnalysisViewProps) {
  const [entity, setEntity] = useState("All Entities")
  const [cashView, setCashView] = useState("Operating")
  const [version, setVersion] = useState("Working")
  const [period, setPeriod] = useState(periodLabel)
  const [view, setView] = useState("Statement View")
  const [collectionDays, setCollectionDays] = useState(45)
  const [detailOpen, setDetailOpen] = useState(true)
  const [selectedDetail, setSelectedDetail] = useState<CashDetail | null>(
    detailForLine(statementRows[1], "may", periodLabel),
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeMonth = useMemo((): (typeof MONTHS)[number] => {
    const map: Record<string, (typeof MONTHS)[number]> = {
      "Jan 2025": "jan",
      "Feb 2025": "feb",
      "Mar 2025": "mar",
      "Apr 2025": "apr",
      "May 2025": "may",
      "Jun 2025": "jun",
      "Jul 2025": "jul",
      "Aug 2025": "aug",
    }
    return map[period] || "may"
  }, [period])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const versionFactor = VERSION_SCALE[version] ?? 1
  const collectionFactor = 1 + (45 - collectionDays) * 0.004

  const scaledRows = useMemo(() => {
    return statementRows.map((r) => {
      const scaled = { ...r }
      for (const m of MONTHS) {
        let v = r[m] * versionFactor
        if (r.type === "inflow" && r.line.includes("Collection")) v *= collectionFactor
        scaled[m] = v
      }
      return scaled
    })
  }, [statementRows, versionFactor, collectionFactor])

  const visibleRows = useMemo(() => {
    if (cashView === "Operating") {
      return scaledRows.filter((r) => !r.line.includes("CapEx") && !r.line.includes("Debt"))
    }
    if (cashView === "Investing") {
      return scaledRows.filter((r) => r.line.includes("CapEx") || r.type === "total")
    }
    return scaledRows.filter((r) => r.line.includes("Debt") || r.type === "total")
  }, [scaledRows, cashView])

  const closingCash = scaledRows.find((r) => r.line === "Closing Cash")?.[activeMonth] ?? 38.4
  const belowThreshold = closingCash < MIN_CASH_THRESHOLD

  const monthlyChart = useMemo(() => {
    return mockCashMonthly.map((d) => ({
      ...d,
      inflow: d.inflow * versionFactor * collectionFactor,
      net: d.net * versionFactor * collectionFactor,
      closing: d.closing * versionFactor,
    }))
  }, [versionFactor, collectionFactor])

  const adjustedKpis = useMemo(() => {
    const runway = Math.max(8, 14.2 * collectionFactor)
    return kpis.map((k, i) => {
      if (i === 0) return { ...k, value: fmtM(closingCash) }
      if (i === 1) return { ...k, value: `${runway.toFixed(1)} mo` }
      if (i === 2) return { ...k, value: fmtM(monthlyChart.find((d) => d.m === "May")?.net ?? 2.2, true) }
      return k
    })
  }, [kpis, closingCash, collectionFactor, monthlyChart])

  const resetFilters = () => {
    setEntity("All Entities")
    setCashView("Operating")
    setVersion("Working")
    setPeriod(periodLabel)
    setView("Statement View")
    setCollectionDays(45)
    toast.message("Filters reset")
  }

  const pickCell = (row: CashStatementRow, month: (typeof MONTHS)[number]) => {
    setSelectedDetail(detailForLine(row, month, `${MONTH_LABELS[month]} 2025`))
    setDetailOpen(true)
  }

  const exportCsv = () => {
    const header = "Line," + MONTHS.map((m) => MONTH_LABELS[m]).join(",") + "\n"
    const body = visibleRows.map((r) => `${r.line},${MONTHS.map((m) => r[m].toFixed(1)).join(",")}`).join("\n")
    const blob = new Blob([header + body], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cash-flow-${period.replace(/\s/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Cash flow export downloaded")
  }

  return (
    <div className="min-h-full bg-[#f1f5f9] flex flex-col">
      <div className="bg-white border-b border-[#e4e7ec]">
        <div className="px-4 sm:px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[18px] font-semibold text-[#101828]">Cash Flow</h1>
            <Button variant="outline" className="rounded-full h-9 px-4 text-xs" onClick={() => onRefresh?.()}>
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <FilterSelect label="Entity" value={entity} options={["All Entities", "North America", "EMEA", "APAC", "LATAM"]} onChange={setEntity} />
            <FilterSelect label="Cash View" value={cashView} options={["Operating", "Investing", "Financing"]} onChange={setCashView} />
            <FilterSelect label="Version" value={version} options={["Working", "Locked", "Published"]} onChange={setVersion} />
            <FilterSelect label="Period" value={period} options={["May 2025", "Apr 2025", "Mar 2025", "Jun 2025", "FY2025"]} onChange={setPeriod} />
            <FilterSelect label="View" value={view} options={["Statement View", "Runway View"]} onChange={setView} />
            <button type="button" onClick={resetFilters} className="ml-auto mb-0.5 px-1 text-[12px] font-semibold text-[#1570ef] hover:underline">
              Reset Filters
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-[#64748b]">
              <Loader2 className="size-5 animate-spin" /> Loading cash flow…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {adjustedKpis.map((k) => (
                <CashKpiCard key={k.label} kpi={k} onClick={() => toast.message(k.label, { description: `${k.value} · ${period}` })} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-auto">
          {belowThreshold ? (
            <section className={`${R} border border-[#fecdca] bg-[#fef3f2] p-4 flex items-center gap-3`}>
              <AlertTriangle className="size-5 text-[#b42318] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#912018]">Below minimum cash threshold</p>
                <p className="text-xs text-[#b42318] mt-0.5">
                  Closing cash {fmtM(closingCash)} is below the ${MIN_CASH_THRESHOLD}M policy floor for {period}.
                </p>
              </div>
            </section>
          ) : null}

          {view === "Runway View" ? (
            <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
              <h2 className="text-sm font-semibold text-[#101828] mb-3">Cash Runway by Scenario</h2>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockCashRunwayScenarios} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f2f4f7" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#667085" }} unit=" mo" />
                    <YAxis type="category" dataKey="scenario" tick={{ fontSize: 11, fill: "#344054" }} width={72} />
                    <Tooltip formatter={(v: number, name: string) => (name === "months" ? `${v} months` : fmtM(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar
                      dataKey="months"
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => toast.message(String(data.scenario), { description: `${data.months} months runway · ${fmtM(data.closing)} closing` })}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#101828]">Net Cash Flow</h2>
                  <button type="button" onClick={() => setInfoOpen(true)} className="text-[#98a2b3] hover:text-[#667085]">
                    <Info className="size-4" />
                  </button>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="inflow" fill="#bbf7d0" name="Inflows" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="outflow" fill="#fecaca" name="Outflows" />
                      <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Net" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#101828]">Closing Cash Balance</h2>
                  <span className="text-xs text-[#667085]">{entity}</span>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f7" />
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#667085" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                      <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <ReferenceLine y={MIN_CASH_THRESHOLD} stroke="#f04438" strokeDasharray="4 4" label={{ value: "Min $15M", fontSize: 10, fill: "#f04438" }} />
                      <Line type="monotone" dataKey="closing" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} name="Closing Cash" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          <section className={`${R} border border-[#e4e7ec] bg-white overflow-hidden`}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#101828]">Cash Statement</h2>
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen((o) => !o)} className="size-8 inline-flex items-center justify-center rounded-full hover:bg-[#f2f4f7] text-[#667085]">
                  <MoreHorizontal className="size-4" />
                </button>
                {menuOpen ? (
                  <div className={`absolute right-0 top-full mt-1 z-30 ${R} border border-[#e4e7ec] bg-white py-1 shadow-lg min-w-[140px]`}>
                    <button type="button" onClick={exportCsv} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f9fafb] flex items-center gap-2">
                      <Download className="size-3.5" /> Export CSV
                    </button>
                    <button type="button" onClick={() => { onRefresh?.(); toast.message("Data refreshed") }} className="w-full px-3 py-2 text-left text-xs hover:bg-[#f9fafb] flex items-center gap-2">
                      <RefreshCw className="size-3.5" /> Refresh
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-y border-[#e4e7ec] text-left text-xs text-[#667085] bg-[#f9fafb]">
                    <th className="px-4 py-3 font-medium sticky left-0 bg-[#f9fafb]">Line Item</th>
                    {MONTHS.map((m) => (
                      <th key={m} className={cn("px-3 py-3 font-medium text-right", m === activeMonth && "bg-[#eff8ff] text-[#1570ef]")}>
                        {MONTH_LABELS[m]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id} className={cn("border-t border-[#f2f4f7]", row.type === "total" && "bg-[#f9fafb]")}>
                      <td className={cn("px-4 py-3 sticky left-0 bg-white", row.type === "total" && "bg-[#f9fafb] font-semibold")}>
                        {row.line}
                      </td>
                      {MONTHS.map((m) => (
                        <td
                          key={m}
                          className={cn(
                            "px-3 py-3 text-right tabular-nums cursor-pointer hover:bg-[#eff8ff]",
                            cellTone(row[m], row.type),
                            m === activeMonth && "bg-[#eff8ff]/50",
                          )}
                          onClick={() => pickCell(row, m)}
                        >
                          {fmtM(row[m], true)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${R} border border-[#e4e7ec] bg-white p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="size-4 text-[#2563eb]" />
              <h2 className="text-sm font-semibold text-[#101828]">What-if: Collection Days</h2>
              <span className="text-xs text-[#667085] ml-auto tabular-nums">{collectionDays} days</span>
            </div>
            <input
              type="range"
              min={30}
              max={60}
              step={1}
              value={collectionDays}
              onChange={(e) => setCollectionDays(Number(e.target.value))}
              className="w-full accent-[#2563eb]"
            />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mockCashDrivers.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => toast.message(d.name, { description: d.impact })}
                  className={`${R} border border-[#e4e7ec] px-3 py-2 text-left hover:border-[#b2ddff] transition-colors`}
                >
                  <p className="text-[11px] text-[#667085]">{d.name}</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {d.unit === "days" ? `${d.value} days` : d.unit === "M" ? `$${d.value}M` : d.value}
                  </p>
                  <p className="text-[10px] text-[#98a2b3] mt-0.5">{d.impact}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {detailOpen && selectedDetail ? (
          <aside className="w-full sm:w-[360px] shrink-0 border-l border-[#e4e7ec] bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-[#e4e7ec] flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-[#667085]">{selectedDetail.type} · {selectedDetail.period}</p>
                <h3 className="text-base font-semibold text-[#101828] mt-0.5">{selectedDetail.line}</h3>
              </div>
              <button type="button" onClick={() => setDetailOpen(false)} className="size-8 rounded-full hover:bg-[#f2f4f7] inline-flex items-center justify-center">
                <X className="size-4 text-[#667085]" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-auto flex-1">
              <div className={`${R} bg-[#f9fafb] border border-[#e4e7ec] p-3`}>
                <p className="text-xs text-[#667085]">Period Amount</p>
                <p className="text-2xl font-semibold tabular-nums mt-1 text-[#101828]">{selectedDetail.amount}</p>
                <p className="text-xs text-[#667085] mt-1">YTD {selectedDetail.ytd} · {selectedDetail.vsBudget}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#344054] mb-2">Cash Drivers</p>
                <ul className="space-y-2">
                  {selectedDetail.drivers.map((d) => (
                    <li key={d.label} className="flex justify-between text-sm">
                      <span className="text-[#667085]">{d.label}</span>
                      <span className="font-medium tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed">{selectedDetail.narrative}</p>
              <Button variant="gradient-info" className="rounded-full h-10 w-full shadow-sm" onClick={() => toast.message("Open in worksheet", { description: "Navigate to Closing Cash line in planning grid" })}>
                Open in Worksheet
              </Button>
            </div>
          </aside>
        ) : null}
      </div>

      {infoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setInfoOpen(false)}>
          <div className={`${R} bg-white max-w-md w-full p-5 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#101828]">Cash Flow Analysis</h3>
            <p className="text-sm text-[#475569] mt-2 leading-relaxed">
              Track inflows, outflows, and closing cash by month. Switch to Runway View for scenario comparison. Adjust collection days to simulate treasury impact.
            </p>
            <Button variant="outline" className="rounded-full mt-4" onClick={() => setInfoOpen(false)}>Close</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
