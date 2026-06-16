"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  TrendingUp, FileText, Lock, Archive, Plus, ChevronRight,
  RefreshCw, Activity, Shield, Zap, Copy, AlertTriangle,
  Clock, BarChart2, ArrowUpRight, Database, Target, Cpu,
} from "lucide-react"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import type { AppDispatch, RootState } from "@/lib/store/store"
import {
  fetchScenarios, fetchScenarioCounts, fetchAuditFeed,
  fetchHighPriorityAudit, setCreateModalOpen,
} from "@/lib/store/slices/forecastingSlice"
import { CreateScenarioModal } from "./create-scenario-modal"
import type { ForecastScenario, ForecastAuditEntry } from "@/lib/api/forecasting-api"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtK(n: number | null | undefined): string {
  if (n == null) return "—"
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "K"
  return n.toLocaleString()
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#9CA3AF", ACTIVE: "#10B981", LOCKED: "#3B82F6", ARCHIVED: "#F59E0B",
}
const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  DRAFT:    { color: "text-gray-600",   bg: "bg-gray-100",   dot: "bg-gray-400"  },
  ACTIVE:   { color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500" },
  LOCKED:   { color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"  },
  ARCHIVED: { color: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-400"},
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  SCENARIO_LOCKED: "Scenario Locked",
  SCENARIO_RECALC: "Recalculated",
  DRIVER_UPDATED:  "Driver Updated",
  CELL_EDIT:       "Cell Edited",
  VERSION_CREATED: "Version Created",
  GL_SYNC:         "GL Sync",
}

function AuditIcon({ action }: { action: string }) {
  if (action?.includes("LOCK")) return <Lock className="w-3.5 h-3.5 text-blue-600" />
  if (action?.includes("RECALC") || action?.includes("COMPUTE")) return <Cpu className="w-3.5 h-3.5 text-amber-600" />
  if (action?.includes("DRIVER")) return <Target className="w-3.5 h-3.5 text-purple-600" />
  if (action?.includes("CELL"))   return <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
  if (action?.includes("SYNC"))   return <Database className="w-3.5 h-3.5 text-teal-600" />
  return <Activity className="w-3.5 h-3.5 text-blue-600" />
}

function AuditIconBg({ action }: { action: string }) {
  if (action?.includes("LOCK"))   return "bg-blue-50 border-blue-100"
  if (action?.includes("RECALC") || action?.includes("COMPUTE")) return "bg-amber-50 border-amber-100"
  if (action?.includes("DRIVER")) return "bg-purple-50 border-purple-100"
  if (action?.includes("CELL"))   return "bg-emerald-50 border-emerald-100"
  if (action?.includes("SYNC"))   return "bg-teal-50 border-teal-100"
  return "bg-blue-50 border-blue-100"
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, subtitle, icon: Icon, gradient, loading,
}: {
  title: string; value: string | number; subtitle: string
  icon: any; gradient: boolean; loading: boolean
}) {
  return (
    <Card className={`border shadow-sm hover:shadow-md transition-all duration-200 ${
      gradient ? "gradient-primary" : "bg-white border-gray-200"
    }`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
        <CardTitle className={`text-xs font-medium uppercase tracking-wide ${
          gradient ? "text-white/80" : "text-gray-500"
        }`}>
          {title}
        </CardTitle>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          gradient ? "bg-white/20" : "gradient-primary"
        }`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <Skeleton className={`h-8 w-20 mt-1 ${gradient ? "bg-white/20" : ""}`} />
        ) : (
          <div className={`text-2xl font-bold ${gradient ? "text-white" : "text-gray-900"}`}>
            {value}
          </div>
        )}
        <div className={`flex items-center gap-1 mt-1 ${gradient ? "text-white/60" : "text-gray-400"}`}>
          <ArrowUpRight className="w-3 h-3" />
          <span className="text-xs">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

// ─── Custom pie label ─────────────────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      className="text-[10px] font-semibold" style={{ fontSize: 11, fontWeight: 600 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ForecastingDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const {
    counts, countsLoading, scenarios, scenariosLoading,
    auditLogs, auditLoading, highPriorityAudit,
  } = useSelector((state: RootState) => state.forecasting)

  useEffect(() => {
    dispatch(fetchScenarioCounts())
    dispatch(fetchScenarios({ limit: 30 }))
    dispatch(fetchAuditFeed())
    dispatch(fetchHighPriorityAudit())
  }, [dispatch])

  // ── Derived chart data ─────────────────────────────────────────────────────
  const statusDistData = [
    { name: "Draft",    value: counts?.draft  ?? 0, color: STATUS_COLORS.DRAFT    },
    { name: "Active",   value: counts?.active ?? 0, color: STATUS_COLORS.ACTIVE   },
    { name: "Locked",   value: counts?.locked ?? 0, color: STATUS_COLORS.LOCKED   },
    {
      name: "Archived",
      value: Math.max(0,
        (counts?.total ?? 0) - (counts?.draft ?? 0) - (counts?.active ?? 0) - (counts?.locked ?? 0)
      ),
      color: STATUS_COLORS.ARCHIVED,
    },
  ].filter(d => d.value > 0)

  const entityBarData = Object.entries(
    scenarios.reduce((acc, s: ForecastScenario) => {
      const key = s.entity_name ?? s.entity?.name ?? "Unknown"
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([entity, count]) => ({ entity: entity.length > 14 ? entity.slice(0, 13) + "…" : entity, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  const recentActivities = auditLogs.slice(0, 8)
  const lastComputed = scenarios
    .map(s => s.updated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  return (
    <div className="p-6 space-y-6 bg-gray-50/30 min-h-screen">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forecasting Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Multi-dimensional scenario modeling and hypercube projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="rounded-full h-9 bg-white"
            onClick={() => { dispatch(fetchScenarioCounts()); dispatch(fetchScenarios({ limit: 30 })); dispatch(fetchAuditFeed()) }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button
            size="sm" className="rounded-full h-9 gradient-primary text-white shadow"
            onClick={() => dispatch(setCreateModalOpen(true))}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Scenario
          </Button>
        </div>
      </div>

      {/* ── Primary KPI cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Scenarios"    value={counts?.total  ?? 0} subtitle="All forecasting scenarios" icon={BarChart2} gradient={true}  loading={countsLoading} />
        <KpiCard title="Active Scenarios"   value={counts?.active ?? 0} subtitle="Live projections"           icon={TrendingUp} gradient={false} loading={countsLoading} />
        <KpiCard title="Locked Versions"    value={counts?.locked ?? 0} subtitle="Immutable board snapshots"  icon={Lock}       gradient={true}  loading={countsLoading} />
        <KpiCard title="Draft Scenarios"    value={counts?.draft  ?? 0} subtitle="Work in progress"           icon={FileText}   gradient={false} loading={countsLoading} />
      </div>

      {/* ── Secondary metric strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Last Computed",
            value: lastComputed ? format(new Date(lastComputed), "MMM d, HH:mm") : "—",
            icon: Clock, color: "text-blue-600", bg: "bg-blue-50",
          },
          {
            label: "High-Priority Events",
            value: highPriorityAudit.length > 0 ? `${highPriorityAudit.length} pending` : "All clear",
            icon: Shield, color: highPriorityAudit.length > 0 ? "text-red-600" : "text-emerald-600",
            bg: highPriorityAudit.length > 0 ? "bg-red-50" : "bg-emerald-50",
          },
          {
            label: "Archived Scenarios",
            value: Math.max(0, (counts?.total ?? 0) - (counts?.draft ?? 0) - (counts?.active ?? 0) - (counts?.locked ?? 0)),
            icon: Archive, color: "text-orange-600", bg: "bg-orange-50",
          },
        ].map(item => (
          <Card key={item.label} className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-sm font-bold mt-0.5 truncate ${item.color}`}>{String(item.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scenarios by Entity */}
        <Card className="lg:col-span-3 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-800">Scenarios by Entity</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 rounded-full"
                onClick={() => router.push("/forecasting/scenarios")}>
                View all <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            {scenariosLoading ? (
              <Skeleton className="h-44 w-full rounded-lg" />
            ) : entityBarData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-center">
                <BarChart2 className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-muted-foreground">No scenario data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={entityBarData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="entity" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Bar dataKey="count" name="Scenarios" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-800">Scenario Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {countsLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-28 h-28 rounded-full" />
                <div className="space-y-2 w-full">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-4 w-full rounded" />)}
                </div>
              </div>
            ) : statusDistData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-center">
                <p className="text-xs text-muted-foreground">No scenarios yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={statusDistData}
                      cx="50%" cy="50%"
                      innerRadius={38} outerRadius={64}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={PieLabel}
                    >
                      {statusDistData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                      formatter={(val: any, name: any) => [`${val} scenarios`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1.5">
                  {statusDistData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
                      <span className="truncate">{item.name}</span>
                      <span className="ml-auto font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row: Activity + Quick Actions ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Recent Activity</CardTitle>
                {highPriorityAudit.length > 0 && (
                  <span className="text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-medium">
                    {highPriorityAudit.length} high priority
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 rounded-full"
                onClick={() => router.push("/forecasting/audit")}>
                View all <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {auditLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-muted-foreground">No activities recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivities.map((entry: ForecastAuditEntry) => {
                  const isHigh = entry.priority === "HIGH"
                  return (
                    <div key={entry.id}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors ${
                        isHigh ? "bg-red-50/30" : ""
                      }`}>
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${AuditIconBg({ action: entry.action_type })}`}>
                        <AuditIcon action={entry.action_type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-800 font-mono">
                            {ACTION_TYPE_LABELS[entry.action_type] ?? entry.action_type}
                          </span>
                          {isHigh && (
                            <span className="text-[9px] bg-red-100 text-red-700 rounded px-1 py-0.5 font-medium">HIGH</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {entry.scenario_name
                            ? `Scenario: ${entry.scenario_name}`
                            : entry.user_name
                            ? `By ${entry.user_name}`
                            : "System event"}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                        {entry.timestamp ? format(new Date(entry.timestamp), "MMM d, HH:mm") : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {[
              {
                label: "Create Scenario",
                desc: "New multi-dimensional forecast",
                icon: Plus,
                onClick: () => dispatch(setCreateModalOpen(true)),
                style: "gradient-primary text-white hover:opacity-90",
              },
              {
                label: "View All Scenarios",
                desc: "Manage existing forecasts",
                icon: FileText,
                onClick: () => router.push("/forecasting/scenarios"),
                style: "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200",
              },
              {
                label: "High Priority Audit",
                desc: `${highPriorityAudit.length} event${highPriorityAudit.length !== 1 ? "s" : ""} flagged`,
                icon: Shield,
                onClick: () => router.push("/forecasting/audit"),
                style: highPriorityAudit.length > 0
                  ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200",
              },
              {
                label: "Full Audit Trail",
                desc: "All scenario audit events",
                icon: Activity,
                onClick: () => router.push("/forecasting/audit"),
                style: "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200",
              },
            ].map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${action.style}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  action.style.includes("gradient") ? "bg-white/20" : "bg-white shadow-sm"
                }`}>
                  <action.icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{action.label}</p>
                  <p className={`text-[11px] mt-0.5 truncate ${
                    action.style.includes("gradient") ? "opacity-75" : "text-muted-foreground"
                  }`}>{action.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0 opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Scenarios table ───────────────────────────────────────── */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800">Recent Scenarios</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 rounded-full"
              onClick={() => router.push("/forecasting/scenarios")}>
              View all <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {scenariosLoading ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">Create your first forecasting scenario</p>
              <p className="text-xs text-muted-foreground mt-1">Model multi-dimensional financial projections</p>
              <Button size="sm" className="mt-4 rounded-full gradient-primary text-white h-8 text-xs"
                onClick={() => dispatch(setCreateModalOpen(true))}>
                <Plus className="w-3 h-3 mr-1" /> Get started
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Name", "Status", "Entity", "Horizon", "Updated"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {scenarios.slice(0, 8).map((s: ForecastScenario) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-50 hover:bg-blue-50/20 cursor-pointer transition-colors"
                      onClick={() => router.push(`/forecasting/scenarios/${s.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[180px]">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{s.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-[120px]">
                        {s.entity_name ?? s.entity?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600">
                          {s.horizon_start_date?.slice(0, 7)} → {s.horizon_end_date?.slice(0, 7)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.updated_at ? format(new Date(s.updated_at), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm"
                          className="h-7 px-2 rounded-full text-blue-600 hover:bg-blue-50 text-xs"
                          onClick={e => { e.stopPropagation(); router.push(`/forecasting/scenarios/${s.id}`) }}>
                          Open <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateScenarioModal />
    </div>
  )
}
