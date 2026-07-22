"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  MessageSquarePlus,
  FileWarning,
  MoreHorizontal,
  X,
  Check,
  Paperclip,
  Plus,
  Database,
  GitCommitHorizontal,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmStatusPill } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type MonthRow = { month: string; target: number; forecast: number; actual: number | null }

type KpiDef = {
  id: string
  code: string
  name: string
  subtitle: string
  status: "On track" | "At risk" | "Off track"
  owner: string
  ownerRole: string
  perspective: string
  kpiType: "Leading" | "Lagging"
  unit: string
  weight: number
  weightedScore: number
  months: MonthRow[]
  commentary: { text: string; by: string; at: string }
}

const kpis: Record<string, KpiDef> = {
  "FIN-001": {
    id: "FIN-001",
    code: "FIN-001",
    name: "Management Fee Revenue",
    subtitle: "Tracks management fee revenue earned from fund mandates and advisory agreements.",
    status: "At risk",
    owner: "Tendai Sibanda",
    ownerRole: "Head of Finance",
    perspective: "Financial",
    kpiType: "Lagging",
    unit: "USD",
    weight: 15,
    weightedScore: 74.6,
    months: [
      { month: "Jan", target: 375000, forecast: 393340, actual: 300000 },
      { month: "Feb", target: 375000, forecast: 393340, actual: 290000 },
      { month: "Mar", target: 375000, forecast: 393340, actual: 310000 },
      { month: "Apr", target: 375000, forecast: 393340, actual: 315000 },
      { month: "May", target: 375000, forecast: 393340, actual: 320000 },
      { month: "Jun", target: 375000, forecast: 393340, actual: 330000 },
      { month: "Jul", target: 375000, forecast: 393340, actual: 326250 },
      { month: "Aug", target: 375000, forecast: 393340, actual: null },
      { month: "Sep", target: 375000, forecast: 393340, actual: null },
      { month: "Oct", target: 375000, forecast: 393340, actual: null },
      { month: "Nov", target: 375000, forecast: 393340, actual: null },
      { month: "Dec", target: 375000, forecast: 393340, actual: null },
    ],
    commentary: {
      text: "FIDinvestor (-11.7%): The shortfall in Q3 was driven by lower than expected fees from Fund III and timing of advisory fee invoices. Corrective actions are in progress to accelerate invoice collections and pipeline conversion.",
      by: "Tendai Sibanda",
      at: "18 Apr 2026 09:32",
    },
  },
}

const lineageChain = [
  { icon: Database, label: "Accounting system", detail: "Sage Evolution (Live)" },
  { icon: GitCommitHorizontal, label: "General Ledger", detail: "Ledger Module" },
  { icon: Database, label: "Revenue account", detail: "4000 – Management Fee Income · GL account" },
  { icon: ShieldCheck, label: "Validated actuals", detail: "Data validation · Posted 18 Apr 2026" },
  { icon: ClipboardCheck, label: "Performance KPI", detail: "FIN-001 – Management Fee Revenue · KPI mapping" },
]

const overrideSteps = ["Draft", "Validate", "Review", "Approve", "Apply"]

const priorValues = [
  { date: "18 Apr 2026 10:12", by: "Nyasha Moyo", value: "326,250", reason: "Original recording" },
  { date: "18 Apr 2026 10:12", by: "Nyasha Moyo", value: "392,000", reason: "Proposed correction" },
]

const currency = (v: number, unit: string) => `${unit === "USD" ? "$" : unit + " "}${v.toLocaleString()}`

export function KpiDetailMockScreen({ kpiId = "FIN-001" }: { kpiId?: string }) {
  const kpi = kpis[kpiId] || kpis["FIN-001"]
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [proposedActual, setProposedActual] = useState("392000")
  const [reason, setReason] = useState("Late posting of INV-7845 (Proline Advisory) of $65,750 relates to July. Reclassification of retention income to revenue.")
  const [evidence, setEvidence] = useState(["INV-7845_Proline_Advisory.pdf"])

  const ytd = useMemo(() => {
    const actualMonths = kpi.months.filter((m) => m.actual !== null)
    const ytdActual = actualMonths.reduce((s, m) => s + (m.actual || 0), 0)
    const ytdTarget = actualMonths.reduce((s, m) => s + m.target, 0)
    const fyTarget = kpi.months.reduce((s, m) => s + m.target, 0)
    const fyForecast = kpi.months.reduce((s, m) => s + m.forecast, 0)
    return {
      ytdActual,
      ytdTarget,
      fyTarget,
      fyForecast,
      attainment: ytdTarget ? (ytdActual / ytdTarget) * 100 : 0,
      forecastVsTarget: fyTarget ? ((fyForecast - fyTarget) / fyTarget) * 100 : 0,
    }
  }, [kpi])

  const monthlyTable = useMemo(() => {
    let cumActual = 0
    let cumTarget = 0
    return kpi.months.map((m) => {
      const hasActual = m.actual !== null
      if (hasActual) {
        cumActual += m.actual || 0
        cumTarget += m.target
      }
      const varianceAmt = hasActual ? (m.actual as number) - m.target : null
      const variancePct = hasActual && m.target ? ((varianceAmt as number) / m.target) * 100 : null
      return {
        ...m,
        varianceAmt,
        variancePct,
        ytdActual: hasActual ? cumActual : null,
        ytdAttainment: hasActual && cumTarget ? (cumActual / cumTarget) * 100 : null,
      }
    })
  }, [kpi])

  const currentMonth = "Jul"

  const chartData = kpi.months.map((m) => ({ month: m.month, target: m.target, forecast: m.forecast, actual: m.actual }))

  const currentActualRecorded = kpi.months.find((m) => m.month === currentMonth)?.actual || 0
  const impactYtdBefore = ytd.attainment
  const impactYtdAfter = useMemo(() => {
    const delta = Number(proposedActual || 0) - currentActualRecorded
    const newYtdActual = ytd.ytdActual + delta
    return ytd.ytdTarget ? (newYtdActual / ytd.ytdTarget) * 100 : 0
  }, [proposedActual, currentActualRecorded, ytd])

  const handleSaveDraft = () => {
    toast.success("Correction saved as draft", { description: `${kpi.code} · Proposed actual ${currency(Number(proposedActual || 0), kpi.unit)} pending review.` })
    setDrawerOpen(false)
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "KPIs", kpi.code]} searchPlaceholder="Search KPIs…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title={`KPI Detail · ${kpi.code} · ${kpi.name}`}
          subtitle={kpi.subtitle}
          actions={
            <>
              <PmStatusPill label={kpi.status} tone={kpi.status === "At risk" ? "warning" : kpi.status === "Off track" ? "danger" : "success"} />
              <PmButton variant="outline" onClick={() => toast("Add commentary", { description: "Opening commentary composer." })}>
                <MessageSquarePlus className="h-3.5 w-3.5" /> Add commentary
              </PmButton>
              <PmButton variant="primary" onClick={() => setDrawerOpen(true)}>
                <FileWarning className="h-3.5 w-3.5" /> Request correction
              </PmButton>
              <button type="button" className="h-9 w-9 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#6B7280] hover:bg-[#F9FAFB]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Original Target (FY2026)</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">${(ytd.fyTarget / 1_000_000).toFixed(2)}m</p>
            <p className="mt-0.5 text-[10px] text-[#9CA3AF]">Fixed · Read-only</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">FP&amp;A current forecast (YTD)</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">${(ytd.fyForecast / 1_000_000).toFixed(2)}m</p>
            <p className="mt-0.5 text-[10px] font-medium text-[#10B981]">▲ {ytd.forecastVsTarget.toFixed(1)}% vs target</p>
            <p className="mt-0.5 text-[10px] text-[#9CA3AF]">Source: FP&amp;A · Read-only</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Accounting actual (YTD)</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">${(ytd.ytdActual / 1_000_000).toFixed(2)}m</p>
            <p className="mt-0.5 text-[10px] text-[#9CA3AF]">Source: GL · Posted 18 Apr 2026 · Read-only</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">YTD attainment</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{ytd.attainment.toFixed(1)}%</p>
            <p className="mt-0.5 text-[10px] text-[#D97706] font-medium">At risk</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Weighted score</p>
            <p className="mt-1 text-lg font-bold text-[#111827]">{kpi.weightedScore}/100</p>
            <p className="mt-0.5 text-[10px] text-[#374151]">
              {kpi.perspective} · {kpi.kpiType} · Weight {kpi.weight}%
            </p>
          </PmCard>
        </div>

        <div className={cn("grid grid-cols-1 gap-4", drawerOpen ? "xl:grid-cols-[1.6fr_1fr_1.1fr]" : "xl:grid-cols-[1fr_340px]")}>
          <div className="space-y-4">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#111827]">Monthly trend ({kpi.unit})</h3>
                <select className="h-7 rounded-md border border-[#E5E7EB] px-2 text-[11px] text-[#374151]" defaultValue="Monthly">
                  <option>Monthly</option>
                  <option>Quarterly</option>
                </select>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#6B7280] mb-2">
                <span className="inline-flex items-center gap-1">
                  <span className="h-0.5 w-3 bg-[#9CA3AF] inline-block" /> Original target
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-0.5 w-3 bg-[#2563EB] inline-block" /> Current forecast (FP&amp;A)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#7C3AED] inline-block" /> Actual
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => currency(v, kpi.unit)} />
                    <Bar dataKey="actual" name="Actual" fill="#7C3AED" radius={[3, 3, 0, 0]} barSize={14} />
                    <Line type="monotone" dataKey="target" name="Original target" stroke="#9CA3AF" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                    <Line type="monotone" dataKey="forecast" name="Current forecast (FP&A)" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </PmCard>

            <PmCard className="p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Monthly performance table ({kpi.unit})</h3>
              <table className="w-full text-left text-[11px] min-w-[620px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <th className="pb-2 font-semibold pr-2">Month</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Original target</th>
                    <th className="pb-2 font-semibold pr-2 text-right">FP&amp;A forecast</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Accounting actual</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Variance ($)</th>
                    <th className="pb-2 font-semibold pr-2 text-right">Variance (%)</th>
                    <th className="pb-2 font-semibold pr-2 text-right">YTD actual</th>
                    <th className="pb-2 font-semibold text-right">YTD attainment</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTable.map((m) => (
                    <tr key={m.month} className={cn("border-t border-[#F1F5F9]", m.month === currentMonth && "bg-[#F5F3FF]")}>
                      <td className="py-2 pr-2 font-medium text-[#111827]">{m.month}</td>
                      <td className="py-2 pr-2 text-right text-[#6B7280]">{m.target.toLocaleString()}</td>
                      <td className="py-2 pr-2 text-right text-[#6B7280]">{m.forecast.toLocaleString()}</td>
                      <td className="py-2 pr-2 text-right font-medium text-[#111827]">{m.actual !== null ? m.actual.toLocaleString() : "–"}</td>
                      <td className={cn("py-2 pr-2 text-right", m.varianceAmt === null ? "text-[#9CA3AF]" : m.varianceAmt < 0 ? "text-[#DC2626]" : "text-[#10B981]")}>
                        {m.varianceAmt !== null ? `(${Math.abs(m.varianceAmt).toLocaleString()})` : "–"}
                      </td>
                      <td className={cn("py-2 pr-2 text-right font-medium", m.variancePct === null ? "text-[#9CA3AF]" : m.variancePct < 0 ? "text-[#DC2626]" : "text-[#10B981]")}>
                        {m.variancePct !== null ? `${m.variancePct.toFixed(1)}%` : "–"}
                      </td>
                      <td className="py-2 pr-2 text-right text-[#374151]">{m.ytdActual !== null ? m.ytdActual.toLocaleString() : "–"}</td>
                      <td className="py-2 text-right font-semibold text-[#111827]">{m.ytdAttainment !== null ? `${m.ytdAttainment.toFixed(1)}%` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-semibold text-[#111827]">Variance commentary</h3>
                <PmButton variant="outline" onClick={() => toast("Add commentary", { description: "Opening commentary composer." })}>
                  <MessageSquarePlus className="h-3.5 w-3.5" /> Add commentary
                </PmButton>
              </div>
              <p className="text-xs text-[#374151] leading-relaxed">{kpi.commentary.text}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-2">
                Commented by {kpi.commentary.by} · {kpi.commentary.at}
              </p>
            </PmCard>
          </div>

          <div className="space-y-4">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Data lineage</h3>
              </div>
              <div className="space-y-0">
                {lineageChain.map((l, i) => (
                  <div key={l.label} className="relative pl-8 pb-4 last:pb-0">
                    {i < lineageChain.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-[#E5E7EB]" />}
                    <span className="absolute left-0 top-0 h-6 w-6 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                      <l.icon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-xs font-semibold text-[#111827]">{l.label}</p>
                    <p className="text-[11px] text-[#6B7280]">{l.detail}</p>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-1 text-[11px] font-medium text-[#7C3AED] hover:underline">
                View data lineage audit →
              </button>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">Source details</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Last refreshed</span>
                  <span className="font-medium text-[#111827]">18 Apr 2026 08:15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Refresh status</span>
                  <PmStatusPill label="Successful" tone="success" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Frequency</span>
                  <span className="font-medium text-[#111827]">Daily</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Next refresh</span>
                  <span className="font-medium text-[#111827]">19 Apr 2026 08:15</span>
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#111827] mb-2">Selected data point · July 2026</h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Accounting actual</span>
                  <span className="font-semibold text-[#111827]">{currency(currentActualRecorded, kpi.unit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">GL posting date</span>
                  <span className="font-medium text-[#111827]">31 Jul 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Journal entries</span>
                  <span className="font-medium text-[#111827]">JRN-4213, JRN-4218</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Source documents</span>
                  <span className="font-medium text-[#111827]">INV-7845, INV-7852</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Evidence</span>
                  <button type="button" onClick={() => toast("Evidence", { description: "Opening 2 attached files." })} className="font-medium text-[#7C3AED] hover:underline">
                    View (2)
                  </button>
                </div>
              </div>
            </PmCard>
          </div>

          {drawerOpen && (
            <PmCard className="p-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-[#F1F5F9]">
                <div>
                  <h3 className="text-sm font-semibold text-[#111827]">Override workflow · Correct actual</h3>
                </div>
                <button type="button" onClick={() => setDrawerOpen(false)} className="text-[#9CA3AF] hover:text-[#111827] shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-[#F1F5F9]">
                <div className="flex items-center">
                  {overrideSteps.map((s, i) => (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                            i === 0 ? "bg-[#7C3AED] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className={cn("text-[9px] whitespace-nowrap", i === 0 ? "text-[#7C3AED] font-semibold" : "text-[#9CA3AF]")}>{s}</span>
                      </div>
                      {i < overrideSteps.length - 1 && <div className="flex-1 h-px bg-[#E5E7EB] mx-1 mb-3.5" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3 space-y-3.5 max-h-[560px] overflow-y-auto">
                <div className="rounded-lg bg-[#F5F3FF] px-3 py-2.5 text-[11px] text-[#6D28D9] leading-snug">
                  Forecasts are sourced from FP&amp;A and cannot be edited in Performance. This workflow is for correcting Accounting actuals only.
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <p className="text-[#9CA3AF]">Record</p>
                    <p className="font-medium text-[#111827]">{kpi.code} · {kpi.name}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Period</p>
                    <p className="font-medium text-[#111827]">July 2026</p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151]">Current actual (as recorded)</label>
                  <input disabled value={currency(currentActualRecorded, kpi.unit)} className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-sm text-[#6B7280]" />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151]">
                    Proposed corrected actual <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="mt-1 flex items-center h-9 rounded-lg border border-[#E5E7EB] px-2.5 gap-1.5">
                    <span className="text-xs text-[#9CA3AF]">$</span>
                    <input
                      value={proposedActual}
                      onChange={(e) => setProposedActual(e.target.value.replace(/[^0-9]/g, ""))}
                      className="flex-1 outline-none text-sm text-[#111827]"
                    />
                    <span className="text-xs text-[#9CA3AF]">{kpi.unit}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151]">
                    Reason for correction <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-xs leading-relaxed outline-none focus:border-[#C4B5FD] resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#374151]">
                    Supporting evidence <span className="text-[#EF4444]">*</span>
                  </label>
                  <div className="mt-1.5 space-y-1.5">
                    {evidence.map((f) => (
                      <div key={f} className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 text-[#374151] truncate">
                          <Paperclip className="h-3 w-3 text-[#7C3AED] shrink-0" /> {f}
                        </span>
                        <button type="button" onClick={() => setEvidence((prev) => prev.filter((x) => x !== f))} className="text-[#9CA3AF] hover:text-[#EF4444] shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEvidence((prev) => [...prev, `Supporting-doc-${prev.length + 1}.pdf`])}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-[#D1D5DB] text-[11px] text-[#6B7280] hover:bg-[#F9FAFB] w-full justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add file
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] p-2.5">
                  <p className="text-[11px] font-semibold text-[#111827] mb-2">Impact on scorecard</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-[#9CA3AF]">YTD attainment</p>
                      <p className="font-medium text-[#111827]">
                        {impactYtdBefore.toFixed(1)}% <span className="text-[#9CA3AF]">→</span> <span className="text-[#7C3AED] font-semibold">{impactYtdAfter.toFixed(1)}%</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[#9CA3AF]">Weighted score</p>
                      <p className="font-medium text-[#111827]">
                        {kpi.weightedScore.toFixed(1)} <span className="text-[#9CA3AF]">→</span>{" "}
                        <span className="text-[#7C3AED] font-semibold">{(kpi.weightedScore + (impactYtdAfter - impactYtdBefore) * 0.2).toFixed(1)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#111827] mb-1.5">Workflow assignments</p>
                  <div className="space-y-1.5">
                    {[
                      { role: "Preparer", name: "Nyasha Moyo", status: "Draft" },
                      { role: "Reviewer", name: "Rudo Chikore", status: "Pending" },
                      { role: "Approver", name: "Farai Moyo", status: "Pending" },
                    ].map((a) => (
                      <div key={a.role} className="flex items-center justify-between text-[11px]">
                        <span className="text-[#374151]">
                          {a.role} — {a.name}
                        </span>
                        <PmStatusPill label={a.status} tone={a.status === "Draft" ? "purple" : "warning"} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-[#111827] mb-1.5">Prior values (immutable audit trail)</p>
                  <div className="space-y-1.5">
                    {priorValues.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] border-b border-[#F1F5F9] pb-1 last:border-0">
                        <span className="text-[#6B7280]">
                          {p.date} · {p.by}
                        </span>
                        <span className="font-medium text-[#111827]">${p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#F1F5F9]">
                <PmButton variant="outline" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </PmButton>
                <PmButton variant="primary" onClick={handleSaveDraft}>
                  <Check className="h-3.5 w-3.5" /> Save draft
                </PmButton>
              </div>
            </PmCard>
          )}
        </div>
      </div>
    </div>
  )
}
