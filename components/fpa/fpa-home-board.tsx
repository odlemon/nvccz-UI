"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Info,
  Briefcase,
  FileText,
  Loader2,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { FpaPageHeader } from "./fpa-page-header"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFpaDashboard } from "@/lib/store/slices/fpaSlice"
import { asNumber, formatMoney } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"
import { logFpaGap } from "@/lib/fpa/fpa-api-gaps"

const CARD = "rounded-md border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

function CardHeader({
  title,
  info,
  right,
}: {
  title: string
  info?: boolean
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <h2 className="text-sm font-semibold text-[#0f172a] truncate">{title}</h2>
        {info && <Info className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {right}
        <button type="button" className="text-[#94a3b8] p-0.5" aria-label="More">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function FpaHomeBoard() {
  const dispatch = useAppDispatch()
  const { selectedModelId, selectedVersionId, dashboard, loadingDashboard, bootstrapped, error } =
    useAppSelector((s) => s.fpa)

  useEffect(() => {
    if (!bootstrapped) return
    void dispatch(
      fetchFpaDashboard({
        modelId: selectedModelId || undefined,
        versionId: selectedVersionId || undefined,
      }),
    )
  }, [bootstrapped, selectedModelId, selectedVersionId, dispatch])

  useEffect(() => {
    if (dashboard && !dashboard.kpis) {
      logFpaGap({
        category: "missing",
        path: "/v1/fpa/home/dashboard",
        method: "GET",
        message: dashboard.message || "Dashboard returned null KPIs",
        impact: "Home KPI strip empty until a model exists",
      })
    }
  }, [dashboard])

  const kpis = useMemo(() => {
    const k = dashboard?.kpis
    if (!k) return []
    return [
      {
        label: "Revenue Forecast",
        value: formatMoney(k.revenue),
        spark: k.sparklines?.revenue,
      },
      { label: "EBITDA", value: formatMoney(k.ebitda), spark: k.sparklines?.ebitda },
      {
        label: "Closing Cash",
        value: formatMoney(k.closingCash),
        spark: k.sparklines?.closingCash,
      },
      {
        label: "Cash Runway",
        value: `${asNumber(k.runwayMonths).toFixed(1)} months`,
        spark: k.sparklines?.runwayMonths,
      },
    ]
  }, [dashboard])

  const cashBars = useMemo(() => {
    return (dashboard?.cashByMonth || []).map((row) => ({
      period: String(row.period).slice(0, 7),
      closing: asNumber(row.closing),
      inflows: asNumber(row.inflows),
      outflows: asNumber(row.outflows),
    }))
  }, [dashboard?.cashByMonth])

  const trendBars = useMemo(() => {
    const rev = dashboard?.kpis?.sparklines?.revenue || []
    const exp = dashboard?.kpis?.sparklines?.ebitda || []
    const len = Math.max(rev.length, exp.length)
    if (!len) return []
    return Array.from({ length: len }, (_, i) => ({
      i: i + 1,
      revenue: asNumber(rev[i]),
      ebitda: asNumber(exp[i]),
    }))
  }, [dashboard?.kpis?.sparklines])

  const workflow = dashboard?.workflowProgress?.[0]
  const donut = useMemo(() => {
    if (!workflow) return []
    const done = workflow.percent
    const rest = Math.max(0, 100 - done)
    return [
      { name: "Complete", value: done, color: "#3b82f6" },
      { name: "Remaining", value: rest, color: "#e2e8f0" },
    ]
  }, [workflow])

  const scenarioRows = useMemo(() => {
    const sc = dashboard?.scenarioCompare
    if (!sc?.left && !sc?.right) return []
    return [
      {
        metric: "Revenue",
        left: formatMoney(sc.left?.revenue),
        right: formatMoney(sc.right?.revenue),
      },
      {
        metric: "EBITDA",
        left: formatMoney(sc.left?.ebitda),
        right: formatMoney(sc.right?.ebitda),
      },
    ]
  }, [dashboard])

  const overBudget = dashboard?.overBudgetDepartments || []
  const openTasks = dashboard?.openTasks || []

  if (!bootstrapped || (loadingDashboard && !dashboard)) {
    return (
      <div className="min-h-full bg-[#f8fafc]">
        <FpaPageHeader title="FP&A Home" />
        <div className="flex items-center justify-center py-24 gap-2 text-[#64748b]">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="FP&A Home" />

      <div className="p-4 sm:p-5 space-y-3 max-w-[1600px]">
        {(error || dashboard?.message) && (
          <div className="rounded-md border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#64748b]">
            {dashboard?.message || error}
            {!selectedModelId && (
              <Link href="/forecasting/models" className="ml-2 text-[#2563eb] font-medium hover:underline">
                Create a model
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.length === 0
            ? ["Revenue Forecast", "EBITDA", "Closing Cash", "Cash Runway"].map((label) => (
                <div key={label} className={cn(CARD, "p-3.5")}>
                  <p className="text-xs text-[#64748b]">{label}</p>
                  <p className="text-xl font-semibold text-[#cbd5e1] mt-2">—</p>
                </div>
              ))
            : kpis.map((kpi) => (
                <div key={kpi.label} className={cn(CARD, "p-3.5")}>
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-[#64748b]">{kpi.label}</p>
                    <MoreHorizontal className="w-4 h-4 text-[#94a3b8]" />
                  </div>
                  <p className="text-[22px] font-semibold text-[#0f172a] mt-2 tabular-nums">{kpi.value}</p>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <section className={cn(CARD, "lg:col-span-5")}>
            <CardHeader title="Revenue vs Expense Trend" />
            <div className="h-48 px-2 pb-3">
              {trendBars.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#94a3b8] text-center px-4">
                  No sparkline series on dashboard yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendBars}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="i" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" width={40} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="ebitda" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-4")}>
            <CardHeader title="Scenario Comparison" />
            <div className="px-4 pb-3">
              {scenarioRows.length === 0 ? (
                <p className="text-xs text-[#94a3b8] py-6 text-center">No scenario compare data.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b border-[#f1f5f9] text-[#94a3b8]">
                      <th className="pb-2 font-medium">Metric</th>
                      <th className="pb-2 font-medium">{dashboard?.scenarioCompare?.left?.name || "Base"}</th>
                      <th className="pb-2 font-medium">{dashboard?.scenarioCompare?.right?.name || "Compare"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map((r) => (
                      <tr key={r.metric} className="border-b border-[#f8fafc]">
                        <td className="py-2 text-[#64748b]">{r.metric}</td>
                        <td className="py-2 font-semibold tabular-nums">{r.left}</td>
                        <td className="py-2 font-semibold tabular-nums">{r.right}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <Link href="/forecasting/scenarios" className="text-xs font-medium text-[#2563eb] hover:underline mt-3 inline-block">
                Compare all
              </Link>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3")}>
            <CardHeader title="Budget Workflow Progress" info />
            <div className="px-4 pb-3">
              {!workflow ? (
                <p className="text-xs text-[#94a3b8] py-8 text-center">No active workflow.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-28 w-28 relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donut} dataKey="value" innerRadius={34} outerRadius={50} stroke="none">
                            {donut.map((d) => (
                              <Cell key={d.name} fill={d.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-lg font-semibold text-[#0f172a]">{workflow.percent}%</p>
                        <p className="text-[10px] text-[#94a3b8]">Complete</p>
                      </div>
                    </div>
                    <div className="text-xs space-y-1 min-w-0">
                      <p className="font-medium text-[#0f172a] truncate">{workflow.name}</p>
                      <p className="text-[#64748b]">{workflow.stage}</p>
                      <p className="text-[#94a3b8]">
                        {workflow.completedTasks}/{workflow.totalTasks} tasks
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded border border-[#f1f5f9] bg-[#f8fafc] px-2.5 py-2">
                    <Briefcase className="w-3.5 h-3.5 text-[#64748b]" />
                    <p className="text-[11px] text-[#475569]">Stage: {workflow.stage}</p>
                  </div>
                </>
              )}
              <Link href="/forecasting/workflow" className="text-xs font-medium text-[#2563eb] hover:underline mt-3 inline-block">
                View workflow
              </Link>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <section className={cn(CARD, "lg:col-span-6")}>
            <CardHeader title="Departments Over Budget" />
            <div className="px-4 pb-3 overflow-x-auto">
              {overBudget.length === 0 ? (
                <p className="text-xs text-[#94a3b8] py-6 text-center">No over-budget departments.</p>
              ) : (
                <table className="w-full text-xs min-w-[420px]">
                  <thead>
                    <tr className="text-left text-[#94a3b8] border-b border-[#f1f5f9]">
                      <th className="pb-2 font-medium">Department</th>
                      <th className="pb-2 font-medium">Plan</th>
                      <th className="pb-2 font-medium">Actual</th>
                      <th className="pb-2 font-medium">Over by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overBudget.map((r) => (
                      <tr key={r.departmentId} className="border-b border-[#f8fafc]">
                        <td className="py-2.5 font-medium text-[#0f172a]">
                          <div className="flex items-center gap-2 min-w-0">
                            {r.ownerAvatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={r.ownerAvatarUrl}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                              />
                            ) : null}
                            <span className="truncate">
                              {r.departmentName || r.departmentId}
                              {r.ownerName ? (
                                <span className="block text-[10px] font-normal text-[#94a3b8]">
                                  {r.ownerName}
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 tabular-nums text-[#64748b]">{formatMoney(r.plan)}</td>
                        <td className="py-2.5 tabular-nums text-[#64748b]">{formatMoney(r.actual)}</td>
                        <td className="py-2.5 tabular-nums text-[#dc2626] font-medium">{formatMoney(r.overBy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3")}>
            <CardHeader title="Cash Runway" />
            <div className="px-4 pb-3">
              <p className="text-[22px] font-semibold text-[#0f172a] tabular-nums">
                {dashboard?.kpis?.runwayMonths != null
                  ? `${asNumber(dashboard.kpis.runwayMonths).toFixed(1)} months`
                  : "—"}
              </p>
              <div className="h-36 mt-3">
                {cashBars.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-[#94a3b8] text-center">
                    Monthly cash bars not in dashboard payload yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashBars}>
                      <XAxis dataKey="period" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip />
                      <ReferenceLine y={0} stroke="#e2e8f0" />
                      <Bar dataKey="closing" fill="#2563eb" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <Link href="/forecasting/cash-flow" className="text-xs font-medium text-[#2563eb] hover:underline">
                View cash flow
              </Link>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3")}>
            <CardHeader
              title="Open Tasks"
              right={
                <Link href="/forecasting/workflow" className="text-xs font-medium text-[#2563eb] hover:underline">
                  View all
                </Link>
              }
            />
            <ul className="px-4 pb-4 space-y-3">
              {openTasks.length === 0 ? (
                <li className="text-xs text-[#94a3b8] py-4 text-center">No open tasks.</li>
              ) : (
                openTasks.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex gap-2.5">
                    <span className="mt-0.5 h-7 w-7 rounded-md bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0f172a] truncate">{t.title}</p>
                      <p className="text-[11px] text-[#94a3b8] mt-0.5">
                        {t.status}
                        {t.dueDate ? ` · due ${new Date(t.dueDate).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
