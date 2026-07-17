"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Coins,
  Download,
  Handshake,
  Loader2,
  PieChart,
  Settings2,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import {
  asNumber,
  formatCell,
  mapForecastScenario,
  moneyLabel,
  rowColumns,
  titleCase,
  toRowsArray,
  type MonthlyProjectionPoint,
} from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import {
  DEFAULT_ASSUMPTIONS,
  SCENARIO_OPTIONS,
  type ScenarioAssumptions,
  type ScenarioId,
} from "./forecasts-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrTableSkeleton,
  frInputClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type Scenario = ReturnType<typeof mapForecastScenario>

const KPI_ICON = {
  target: Target,
  signed: Handshake,
  gross: Shield,
  weighted: TrendingUp,
  coverage: PieChart,
  fee: Coins,
} as const

const KPI_ACCENT: Record<keyof typeof KPI_ICON, string> = {
  target: "#7c3aed",
  signed: "#16a34a",
  gross: "#2563eb",
  weighted: "#0ea5e9",
  coverage: "#d97706",
  fee: "#6d28d9",
}

type KpiCardModel = {
  id: keyof typeof KPI_ICON
  label: string
  value: string
  pct: number
  meta: string
}

type AnalyticsKind = "stage" | "source" | "owner" | "ageing"

function embeddedName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined
  const item = value as Record<string, any>
  return item.ownerName || item.userName || item.displayName || item.name || item.fullName
}

function analyticsRows(rows: Record<string, any>[], kind: AnalyticsKind) {
  return rows.map((row) => {
    const mapped: Record<string, any> = {}
    const identityKeys =
      kind === "owner"
        ? ["owner", "user", "ownerName", "userName", "displayName"]
        : kind === "source"
          ? ["source", "sourceName", "sourceLabel", "sourceCode"]
          : ["stage", "stageName", "stageLabel", "stageCode"]
    const identity =
      kind === "owner"
        ? row.ownerName ||
          row.userName ||
          row.displayName ||
          embeddedName(row.owner) ||
          embeddedName(row.user) ||
          "Name unavailable"
        : kind === "source"
          ? row.sourceName || row.sourceLabel || row.source || row.sourceCode
          : row.stageName || row.stageLabel || row.stage || row.stageCode

    mapped[kind === "owner" ? "Owner" : kind === "source" ? "Source" : "Stage"] =
      identity === "Name unavailable"
        ? identity
        : identity
          ? titleCase(identity)
          : "Name unavailable"

    for (const [key, value] of Object.entries(row)) {
      if (
        key === "raw" ||
        identityKeys.includes(key) ||
        /(^|_)(id|uuid)$/i.test(key) ||
        /Id$/.test(key)
      ) {
        continue
      }
      mapped[titleCase(key)] =
        typeof value === "string" && /(stage|source|status|type|code)/i.test(key)
          ? titleCase(value)
          : value
    }
    return mapped
  })
}

function KpiCard({ kpi }: { kpi: KpiCardModel }) {
  const Icon = KPI_ICON[kpi.id]
  const accent = KPI_ACCENT[kpi.id]
  return (
    <div className={cn(CARD, "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[6px]"
          style={{ backgroundColor: `${accent}18`, color: accent }}
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
          style={{ width: `${Math.min(Math.max(kpi.pct, 0), 100)}%`, backgroundColor: accent }}
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

function AnalyticsTable({
  title,
  subtitle,
  rows,
  loading,
}: {
  title: string
  subtitle: string
  rows: Record<string, any>[]
  loading: boolean
}) {
  const columns = useMemo(() => rowColumns(rows).slice(0, 6), [rows])
  return (
    <section className={cn(CARD, "overflow-hidden")}>
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
        <p className="text-[11px] text-[#94a3b8]">{subtitle}</p>
      </div>
      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <tbody>
              <FrTableSkeleton columns={6} rows={5} />
            </tbody>
          </table>
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-[12px] text-[#94a3b8]">
          No analytics data yet for this campaign.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                {columns.map((h) => (
                  <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2.5 text-[12px] text-[#0f172a]">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function FundraisingForecasts() {
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [campaignId, setCampaignId] = useState("")

  const [scenario, setScenario] = useState<ScenarioId>("base")
  const [scenariosByType, setScenariosByType] = useState<Record<ScenarioId, Scenario | null>>({
    downside: null,
    base: null,
    upside: null,
  })
  const [scenariosLoading, setScenariosLoading] = useState(false)

  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null)
  const [funnelRows, setFunnelRows] = useState<Record<string, any>[]>([])
  const [sourceRows, setSourceRows] = useState<Record<string, any>[]>([])
  const [ownerRows, setOwnerRows] = useState<Record<string, any>[]>([])
  const [ageingRows, setAgeingRows] = useState<Record<string, any>[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const [curveByScenario, setCurveByScenario] = useState<Record<string, MonthlyProjectionPoint[]>>({})
  const [curveLoading, setCurveLoading] = useState(false)

  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assumptions, setAssumptions] = useState<ScenarioAssumptions>(DEFAULT_ASSUMPTIONS)
  const [projected, setProjected] = useState({ projectedSigned: 0, projectedAum: 0, projectedFees: 0 })

  useEffect(() => {
    setCampaignsLoading(true)
    fundraisingApi
      .listCampaigns()
      .then((list) => {
        setCampaigns(list ?? [])
        const active = list?.find((c: any) => String(c.status).toUpperCase() === "ACTIVE") ?? list?.[0]
        if (active) setCampaignId(String(active.id))
      })
      .catch((err) => toastFrError(err, "Could not load campaigns"))
      .finally(() => setCampaignsLoading(false))
  }, [])

  const campaign = useMemo(
    () => campaigns.find((c) => String(c.id) === campaignId) ?? null,
    [campaigns, campaignId],
  )

  async function loadScenarios(id: string) {
    setScenariosLoading(true)
    try {
      const list = await fundraisingApi.listForecastScenarios({ campaignId: id })
      const mapped = (list ?? []).map(mapForecastScenario)
      const byType: Record<ScenarioId, Scenario | null> = { downside: null, base: null, upside: null }
      for (const s of mapped) {
        const key = s.scenarioType.toLowerCase() as ScenarioId
        if (key !== "downside" && key !== "base" && key !== "upside") continue
        const existing = byType[key]
        if (!existing || (s.createdAt && existing.createdAt && s.createdAt > existing.createdAt)) {
          byType[key] = s
        }
      }
      setScenariosByType(byType)
    } catch (err) {
      toastFrError(err, "Could not load forecast scenarios")
      setScenariosByType({ downside: null, base: null, upside: null })
    } finally {
      setScenariosLoading(false)
    }
  }

  async function loadAnalytics(id: string) {
    setAnalyticsLoading(true)
    try {
      const [dash, funnel, source, owner, ageing] = await Promise.allSettled([
        fundraisingApi.getDashboard({ campaignId: id }),
        fundraisingApi.getAnalyticsFunnel({ campaignId: id }),
        fundraisingApi.getAnalyticsSource({ campaignId: id }),
        fundraisingApi.getAnalyticsOwnerPerformance({ campaignId: id }),
        fundraisingApi.getAnalyticsStageAgeing({ campaignId: id }),
      ])
      setDashboard(dash.status === "fulfilled" ? dash.value : null)
      setFunnelRows(
        funnel.status === "fulfilled" ? analyticsRows(toRowsArray(funnel.value), "stage") : [],
      )
      setSourceRows(
        source.status === "fulfilled" ? analyticsRows(toRowsArray(source.value), "source") : [],
      )
      setOwnerRows(
        owner.status === "fulfilled" ? analyticsRows(toRowsArray(owner.value), "owner") : [],
      )
      setAgeingRows(
        ageing.status === "fulfilled" ? analyticsRows(toRowsArray(ageing.value), "ageing") : [],
      )
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (!campaignId) return
    loadScenarios(campaignId)
    loadAnalytics(campaignId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  const active = scenariosByType[scenario]
  const activeMeta = SCENARIO_OPTIONS.find((o) => o.id === scenario)!

  const curve: MonthlyProjectionPoint[] = (active?.id && curveByScenario[active.id]) || []

  useEffect(() => {
    if (!active?.id) {
      setCurveLoading(false)
      return
    }
    if (Object.prototype.hasOwnProperty.call(curveByScenario, active.id)) {
      setCurveLoading(false)
      return
    }
    let cancelled = false
    setCurveLoading(true)
    fundraisingApi
      .getForecastScenarioCurve(active.id)
      .then((res) => {
        if (cancelled) return
        const points = Array.isArray(res?.monthlyProjection)
          ? res.monthlyProjection.map((point: Record<string, any>) => ({
              month: String(point.month ?? ""),
              cumulativeSigned: asNumber(point.cumulativeSigned),
            }))
          : []
        setCurveByScenario((prev) => ({ ...prev, [active.id]: points }))
      })
      .catch(() => {
        if (!cancelled) setCurveByScenario((prev) => ({ ...prev, [active.id]: [] }))
      })
      .finally(() => {
        if (!cancelled) setCurveLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  const target = asNumber(campaign?.targetCapital ?? campaign?.targetAmount)
  const gross = asNumber(dashboard?.grossPipeline)
  const weighted = asNumber(dashboard?.weightedPipeline)
  const coverage = asNumber(dashboard?.coverageRatio) || (target ? weighted / target : 0)
  const signed = active?.projectedSigned ?? 0
  const fee = active?.projectedFees ?? 0

  const kpis: KpiCardModel[] = useMemo(
    () => [
      {
        id: "target",
        label: "Target Raise",
        value: moneyLabel(target),
        pct: 100,
        meta: campaign ? "Campaign target" : "Select a campaign",
      },
      {
        id: "signed",
        label: "Projected Signed",
        value: moneyLabel(signed),
        pct: target ? Math.min(100, (signed / target) * 100) : 0,
        meta: active ? `${activeMeta.label} scenario` : "No scenario yet",
      },
      {
        id: "gross",
        label: "Gross Pipeline",
        value: moneyLabel(gross),
        pct: target ? Math.min(100, (gross / target) * 100) : 0,
        meta: "Live pipeline",
      },
      {
        id: "weighted",
        label: "Weighted Pipeline",
        value: moneyLabel(weighted),
        pct: target ? Math.min(100, (weighted / target) * 100) : 0,
        meta: "Live pipeline",
      },
      {
        id: "coverage",
        label: "Coverage Ratio",
        value: coverage ? `${coverage.toFixed(1)}x` : "—",
        pct: Math.min(100, coverage * 40),
        meta: "vs target",
      },
      {
        id: "fee",
        label: "Projected Fee Revenue",
        value: moneyLabel(fee),
        pct: target ? Math.min(100, (fee / Math.max(target * 0.02, 1)) * 100) : 0,
        meta: active ? `${activeMeta.label} scenario` : "No scenario yet",
      },
    ],
    [target, signed, gross, weighted, coverage, fee, active, activeMeta, campaign],
  )

  function openAssumptions() {
    setAssumptions({ ...DEFAULT_ASSUMPTIONS, ...(active?.assumptions ?? {}) })
    setProjected({
      projectedSigned: active?.projectedSigned ?? 0,
      projectedAum: active?.projectedAum ?? 0,
      projectedFees: active?.projectedFees ?? 0,
    })
    setAssumptionsOpen(true)
  }

  async function saveAssumptions() {
    if (!campaignId) {
      toast.error("Select a campaign first")
      return
    }
    setSaving(true)
    try {
      await fundraisingApi.createForecastScenario({
        campaignId,
        name: `${activeMeta.label} case`,
        scenarioType: scenario.toUpperCase(),
        assumptions,
        projectedSigned: Number(projected.projectedSigned) || 0,
        projectedAum: Number(projected.projectedAum) || 0,
        projectedFees: Number(projected.projectedFees) || 0,
      })
      toast.success(`${activeMeta.label} scenario saved — new version created, live pipeline untouched`)
      setAssumptionsOpen(false)
      await loadScenarios(campaignId)
    } catch (err) {
      toastFrError(err, "Could not save scenario")
    } finally {
      setSaving(false)
    }
  }

  function exportAnalytics() {
    const exportRows = [
      ...funnelRows.map((row) => ({ Dataset: "Funnel by stage", ...row })),
      ...sourceRows.map((row) => ({ Dataset: "Pipeline by source", ...row })),
      ...ownerRows.map((row) => ({ Dataset: "Owner performance", ...row })),
      ...ageingRows.map((row) => ({ Dataset: "Stage ageing", ...row })),
      ...curve.map((point) => ({
        Dataset: `${activeMeta.label} monthly close curve`,
        Month: point.month,
        "Cumulative signed": point.cumulativeSigned,
      })),
    ]
    if (exportRows.length === 0) {
      toast.error("There is no forecast or analytics data to export")
      return
    }
    const columns = Array.from(new Set(exportRows.flatMap((row) => Object.keys(row)))).map(
      (key) => ({ key, label: key }),
    )
    const campaignName = String(campaign?.name || "campaign")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    exportFundraisingCsv(exportRows, columns, `fundraising-forecast-analytics-${campaignName}`)
    toast.success("Forecast analytics CSV downloaded")
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
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={campaignId}
            onValueChange={setCampaignId}
            disabled={campaignsLoading || campaigns.length === 0}
          >
            <SelectTrigger className="h-9 w-[220px] rounded-full border-[#e2e8f0] bg-white text-xs font-medium">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} {c.status ? `(${c.status})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={exportAnalytics}
            disabled={analyticsLoading || curveLoading}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={openAssumptions}
            disabled={!campaignId}
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
            {!scenariosLoading && !scenariosByType[opt.id] ? (
              <span className="ml-1 opacity-70">(none)</span>
            ) : null}
          </button>
        ))}
        <span className="ml-1 text-[11px] text-[#94a3b8]">{activeMeta.description}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className={cn(CARD, "xl:col-span-8 p-4")}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0f172a]">Monthly close curve</h2>
              <p className="text-[11px] text-[#94a3b8]">{activeMeta.label} scenario</p>
            </div>
          </div>
          {curveLoading ? (
            <div className="flex h-[240px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#e2e8f0] bg-[#fafbfc] text-[12px] text-[#94a3b8]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading close curve…
            </div>
          ) : curve.length === 0 ? (
            <div className="flex h-[240px] w-full items-center justify-center rounded-[6px] border border-dashed border-[#e2e8f0] bg-[#fafbfc] px-6 text-center">
              <p className="text-[12px] leading-relaxed text-[#94a3b8]">
                {active
                  ? "No monthly close curve recorded for this scenario yet."
                  : "Create a scenario to see its monthly close curve."}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={curve} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => moneyLabel(v)}
                  width={56}
                />
                <ReTooltip
                  formatter={(value: number) => [moneyLabel(value), "Cumulative signed"]}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0" }}
                />
                <defs>
                  <linearGradient id="cumulativeSignedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="cumulativeSigned"
                  name="Cumulative signed"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#cumulativeSignedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className={cn(CARD, "xl:col-span-4 p-4")}>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#7c3aed]" />
            <h2 className="text-sm font-semibold text-[#0f172a]">Scenario snapshot</h2>
          </div>
          <dl className="space-y-3">
            {[
              { label: "Close velocity", value: active ? `${active.assumptions.closeVelocity ?? "—"}%` : "—" },
              { label: "Win rate", value: active ? `${active.assumptions.winRate ?? "—"}%` : "—" },
              { label: "Avg ticket", value: active ? `US$${active.assumptions.avgTicketM ?? "—"}M` : "—" },
              { label: "Fee rate", value: active ? `${active.assumptions.feeRatePct ?? "—"}%` : "—" },
              { label: "Pipeline decay", value: active ? `${active.assumptions.pipelineDecay ?? "—"}%` : "—" },
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
            disabled={!campaignId}
          >
            {active ? "Adjust assumptions" : "Create scenario"}
          </Button>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnalyticsTable
          title="Funnel by stage"
          subtitle="Live pipeline funnel — GET /fundraising/analytics/funnel"
          rows={funnelRows}
          loading={analyticsLoading}
        />
        <AnalyticsTable
          title="Pipeline by source"
          subtitle="Live source breakdown — GET /fundraising/analytics/source"
          rows={sourceRows}
          loading={analyticsLoading}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnalyticsTable title="Owner performance" subtitle="Live owner conversion and pipeline" rows={ownerRows} loading={analyticsLoading} />
        <AnalyticsTable title="Stage ageing" subtitle="Live time-in-stage analysis" rows={ageingRows} loading={analyticsLoading} />
      </div>

      <FrDialogShell
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        title={`${active ? "Edit" : "Create"} ${activeMeta.label} assumptions`}
        description="Saves as a new scenario version — never mutates live opportunities."
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setAssumptionsOpen(false)}
            onSubmit={saveAssumptions}
            submitLabel={saving ? "Saving…" : "Save scenario"}
            submitDisabled={saving}
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

          <div className="border-t border-[#f1f5f9] pt-4">
            <p className="mb-2 text-[11px] font-medium text-[#64748b]">
              Projected outcomes (drive the KPI cards above)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FrField label="Projected signed (US$)">
                <input
                  type="number"
                  className={frInputClass}
                  value={projected.projectedSigned}
                  onChange={(e) =>
                    setProjected((p) => ({ ...p, projectedSigned: Number(e.target.value) || 0 }))
                  }
                />
              </FrField>
              <FrField label="Projected AUM (US$)">
                <input
                  type="number"
                  className={frInputClass}
                  value={projected.projectedAum}
                  onChange={(e) =>
                    setProjected((p) => ({ ...p, projectedAum: Number(e.target.value) || 0 }))
                  }
                />
              </FrField>
              <FrField label="Projected fees (US$)">
                <input
                  type="number"
                  className={frInputClass}
                  value={projected.projectedFees}
                  onChange={(e) =>
                    setProjected((p) => ({ ...p, projectedFees: Number(e.target.value) || 0 }))
                  }
                />
              </FrField>
            </div>
          </div>
        </div>
      </FrDialogShell>
    </div>
  )
}
