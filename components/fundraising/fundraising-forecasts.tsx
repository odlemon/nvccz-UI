"use client"

import { useMemo, useState } from "react"
import {
  BarChart3,
  Coins,
  Download,
  Handshake,
  PieChart,
  Settings2,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FORECAST_CONCENTRATION,
  FORECAST_FUNNEL,
  FORECAST_SCENARIOS,
  SCENARIO_OPTIONS,
  tierClass,
  type ForecastKpi,
  type ScenarioAssumptions,
  type ScenarioId,
} from "./forecasts-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrViewAllDialog,
  frInputClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const KPI_ICONS = {
  target: Target,
  signed: Handshake,
  gross: Shield,
  weighted: TrendingUp,
  coverage: PieChart,
  fee: Coins,
} as const

function yMaxFor(data: { amount: number }[]) {
  const max = Math.max(...data.map((d) => d.amount), 1)
  return Math.ceil(max / 2) * 2 + 2
}

export function FundraisingForecasts() {
  const [scenario, setScenario] = useState<ScenarioId>("base")
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
  const [closesOpen, setClosesOpen] = useState(false)
  const [assumptions, setAssumptions] = useState<ScenarioAssumptions>(
    FORECAST_SCENARIOS.base.assumptions,
  )

  const active = FORECAST_SCENARIOS[scenario]
  const chartData = active.monthlyCloses
  const yMax = yMaxFor(chartData)

  const closeRows = useMemo(
    () =>
      active.monthlyCloses.map((row, i) => ({
        id: `mc-${i}`,
        title: row.month,
        subtitle: `US$${row.amount.toFixed(1)}M cumulative`,
        meta: i === 0 ? "Starting month" : `+US$${(row.amount - active.monthlyCloses[i - 1].amount).toFixed(1)}M vs prior`,
        badge: i === active.monthlyCloses.length - 1 ? "Latest" : undefined,
        badgeClass: "bg-[#ede9fe] text-[#6d28d9]",
      })),
    [active.monthlyCloses],
  )

  function openAssumptions() {
    setAssumptions(active.assumptions)
    setAssumptionsOpen(true)
  }

  function saveAssumptions() {
    setAssumptionsOpen(false)
    toast.success(`${active.label} assumptions updated (mock)`)
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Forecasts & Analytics</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Weighted pipeline, coverage ratio and expected fee revenue by scenario
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => toast.success("Export started")}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={openAssumptions}
          >
            <Settings2 className="h-4 w-4" /> Edit assumptions
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {SCENARIO_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setScenario(opt.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
              scenario === opt.id
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]",
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-1 text-[11px] text-[#94a3b8]">{active.description}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {active.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className={cn(CARD, "xl:col-span-8 p-4")}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0f172a]">Monthly closes (cumulative)</h2>
              <p className="text-[11px] text-[#94a3b8]">{active.label} scenario — US$ millions</p>
            </div>
            <button
              type="button"
              onClick={() => setClosesOpen(true)}
              className="text-xs font-medium text-[#2563eb] hover:underline"
            >
              View all
            </button>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="closesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, yMax]}
                  tickFormatter={(v) => `US$${v}M`}
                  width={58}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                  }}
                  formatter={(value: number) => [`US$${value.toFixed(1)}M`, "Cumulative"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#closesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={cn(CARD, "xl:col-span-4 p-4")}>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#7c3aed]" />
            <h2 className="text-sm font-semibold text-[#0f172a]">Scenario snapshot</h2>
          </div>
          <dl className="space-y-3">
            {[
              { label: "Close velocity", value: `${active.assumptions.closeVelocity}%` },
              { label: "Win rate", value: `${active.assumptions.winRate}%` },
              { label: "Avg ticket", value: `US$${active.assumptions.avgTicketM}M` },
              { label: "Fee rate", value: `${active.assumptions.feeRatePct}%` },
              { label: "Pipeline decay", value: `${active.assumptions.pipelineDecay}%` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-[12px]">
                <dt className="text-[#64748b]">{row.label}</dt>
                <dd className="font-medium tabular-nums text-[#0f172a]">{row.value}</dd>
              </div>
            ))}
          </dl>
          <Button
            variant="outline"
            className="mt-4 h-8 w-full rounded-full text-[11px]"
            onClick={openAssumptions}
          >
            Adjust assumptions
          </Button>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className={cn(CARD, "overflow-hidden")}>
          <div className="border-b border-[#f1f5f9] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#0f172a]">Funnel by stage</h2>
            <p className="text-[11px] text-[#94a3b8]">Gross vs probability-weighted amounts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {["Stage", "Count", "Gross", "Weighted", "Conv."].map((h) => (
                    <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORECAST_FUNNEL.map((row) => (
                  <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="px-3 py-2.5 text-[12px] font-medium text-[#0f172a]">{row.stage}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#64748b]">{row.count}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#0f172a]">{row.gross}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#0f172a]">{row.weighted}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#64748b]">
                        {row.conversion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={cn(CARD, "overflow-hidden")}>
          <div className="border-b border-[#f1f5f9] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#0f172a]">Concentration by investor</h2>
            <p className="text-[11px] text-[#94a3b8]">Committed capital — ZGF II</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {["Investor", "Committed", "% of signed", "Tier"].map((h) => (
                    <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FORECAST_CONCENTRATION.map((row) => (
                  <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="px-3 py-2.5 text-[12px] font-medium text-[#0f172a]">{row.investor}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#0f172a]">{row.committed}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#64748b]">{row.pct}%</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", tierClass(row.tier))}>
                        {row.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <FrDialogShell
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        title={`Edit ${active.label} assumptions`}
        description="Adjust drivers — forecast recalculates on save (mock)."
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setAssumptionsOpen(false)}
            onSubmit={saveAssumptions}
            submitLabel="Save & recalculate"
          />
        }
      >
        <div className="space-y-4">
          <AssumptionSlider
            label="Close velocity"
            value={assumptions.closeVelocity}
            onChange={(v) => setAssumptions((p) => ({ ...p, closeVelocity: v }))}
            suffix="%"
          />
          <AssumptionSlider
            label="Win rate"
            value={assumptions.winRate}
            onChange={(v) => setAssumptions((p) => ({ ...p, winRate: v }))}
            suffix="%"
          />
          <FrField label="Avg ticket (US$M)">
            <input
              type="number"
              step="0.1"
              className={frInputClass}
              value={assumptions.avgTicketM}
              onChange={(e) =>
                setAssumptions((p) => ({ ...p, avgTicketM: Number(e.target.value) || 0 }))
              }
            />
          </FrField>
          <FrField label="Fee rate (%)">
            <input
              type="number"
              step="0.05"
              className={frInputClass}
              value={assumptions.feeRatePct}
              onChange={(e) =>
                setAssumptions((p) => ({ ...p, feeRatePct: Number(e.target.value) || 0 }))
              }
            />
          </FrField>
          <AssumptionSlider
            label="Pipeline decay"
            value={assumptions.pipelineDecay}
            onChange={(v) => setAssumptions((p) => ({ ...p, pipelineDecay: v }))}
            suffix="%"
          />
        </div>
      </FrDialogShell>

      <FrViewAllDialog
        open={closesOpen}
        onOpenChange={setClosesOpen}
        title="Monthly closes"
        description={`${active.label} scenario — cumulative signed capital`}
        rows={closeRows}
      />
    </div>
  )
}

function KpiCard({ kpi }: { kpi: ForecastKpi }) {
  const Icon = KPI_ICONS[kpi.id]
  return (
    <div className={cn(CARD, "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[6px]"
          style={{ backgroundColor: `${kpi.accent}18`, color: kpi.accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[10px] text-[#94a3b8]">{kpi.meta}</span>
      </div>
      <p className="mt-2 text-[11px] text-[#64748b]">{kpi.label}</p>
      <p className="mt-0.5 text-[15px] font-bold tabular-nums text-[#0f172a]">{kpi.value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(kpi.pct, 100)}%`, backgroundColor: kpi.bar }}
        />
      </div>
    </div>
  )
}

function AssumptionSlider({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix: string
}) {
  return (
    <FrField label={`${label} — ${value}${suffix}`}>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[#7c3aed]"
      />
    </FrField>
  )
}
