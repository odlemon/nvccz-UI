"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft, RefreshCw, Zap, Lock, AlertTriangle, Activity,
  LayoutGrid, History, ChevronRight, Settings,
  Database, Calendar, Layers, Cpu, Target, Clock,
  BarChart2, Shield, Search, X, User, CheckSquare, TrendingUp,
  Link2, Plus, Trash2, Loader2, Check, ChevronsUpDown,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { AppDispatch, RootState } from "@/lib/store/store"
import {
  fetchScenario, fetchScenarioSummary, fetchVersions,
  fetchScenarioAudit, setLockModalOpen, setDriversModalOpen,
  triggerCompute, clearSelectedScenario, fetchHighPriorityAudit,
  fetchGoalLinks, createGoalLink, deleteGoalLink, fetchEntityCoa,
} from "@/lib/store/slices/forecastingSlice"
import { ScenarioGrid } from "./scenario-grid"
import { DriversPanel } from "./drivers-panel"
import { LockScenarioModal } from "./lock-scenario-modal"
import { VersionsPanel } from "./versions-panel"
import { GoalSelect } from "@/components/performance/goal-select"
import { GoalLinkViewDrawer } from "./goal-link-view-drawer"
import type { ForecastAuditEntry, GoalLink, ForecastChartOfAccount } from "@/lib/api/forecasting-api"

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  DRAFT:    { color: "text-gray-600",   bg: "bg-gray-100",   dot: "bg-gray-400"  },
  ACTIVE:   { color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500" },
  LOCKED:   { color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"  },
  ARCHIVED: { color: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-400"},
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  SCENARIO_LOCKED:  "Scenario Locked",
  SCENARIO_RECALC:  "Recalculated",
  DRIVER_UPDATED:   "Driver Updated",
  CELL_EDIT:        "Cell Edited",
  VERSION_CREATED:  "Version Created",
  GL_SYNC:          "GL Sync",
}

function fmtNum(n: number | null | undefined, currency?: string): string {
  if (n == null) return "—"
  const formatted = Math.abs(n) >= 1_000_000
    ? (n / 1_000_000).toFixed(2) + "M"
    : Math.abs(n) >= 1_000
    ? (n / 1_000).toFixed(1) + "K"
    : n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return currency ? `${currency} ${formatted}` : formatted
}

// ─── COA Account Combobox (for goal link account selector) ───────────────────
function CoaAccountCombobox({
  coa, loading, value, onChange,
}: {
  coa: ForecastChartOfAccount[]
  loading: boolean
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = coa.find(a => a.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between h-9 text-xs font-normal border-gray-200 bg-white"
        >
          <span className="truncate text-left flex-1">
            {loading
              ? "Loading accounts…"
              : selected
              ? `${selected.account_no} — ${selected.account_name}`
              : coa.length === 0 ? "No accounts loaded" : "Select account (optional)"}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 z-[300]" align="start">
        <Command>
          <CommandInput placeholder="Search by name or code…" className="h-8 text-xs" />
          <CommandList className="max-h-48">
            <CommandEmpty>No accounts found.</CommandEmpty>
            {value && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(""); setOpen(false) }}
                  className="text-xs text-muted-foreground gap-2"
                >
                  <X className="w-3.5 h-3.5" /> Clear selection
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {coa.map(account => (
                <CommandItem
                  key={account.id}
                  value={`${account.account_no} ${account.account_name}`}
                  onSelect={() => { onChange(account.id); setOpen(false) }}
                  className="gap-2 text-xs"
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0", value === account.id ? "opacity-100" : "opacity-0")} />
                  <span className="font-mono text-gray-500 shrink-0 w-20 truncate">{account.account_no}</span>
                  <span className="flex-1 truncate">{account.account_name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{account.account_type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Goal Links Panel ─────────────────────────────────────────────────────────
function GoalLinksPanel({ scenarioId }: { scenarioId: string }) {
  const dispatch = useDispatch<AppDispatch>()
  const { goalLinks, goalLinksLoading, goalLinkSaving, selectedScenario, entityCoa, entityCoaLoading } = useSelector(
    (state: RootState) => state.forecasting
  )

  const [showForm, setShowForm]             = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState("")
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [threshold, setThreshold]           = useState("")
  const [drawerLink, setDrawerLink]         = useState<GoalLink | null>(null)

  // Load entity COA when scenario is available
  useEffect(() => {
    if (selectedScenario?.entity_id && entityCoa.length === 0 && !entityCoaLoading) {
      dispatch(fetchEntityCoa(selectedScenario.entity_id))
    }
  }, [selectedScenario?.entity_id, entityCoa.length, entityCoaLoading, dispatch])

  const resetForm = () => {
    setSelectedGoalId(""); setSelectedAccountId(""); setThreshold(""); setShowForm(false)
  }

  const handleCreate = async () => {
    if (!selectedGoalId) { toast.error("Please select a performance goal"); return }
    try {
      await dispatch(createGoalLink({
        id: scenarioId,
        data: {
          performance_goal_id: selectedGoalId,
          account_id: selectedAccountId || undefined,
          threshold_value: threshold ? parseFloat(threshold) : undefined,
        },
      })).unwrap()
      toast.success("Goal link created")
      resetForm()
    } catch (err: any) {
      toast.error("Failed to link goal", { description: err?.message })
    }
  }

  const handleDelete = async (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation()
    try {
      await dispatch(deleteGoalLink({ id: scenarioId, linkId })).unwrap()
      toast.success("Goal link removed")
    } catch (err: any) {
      toast.error("Failed to remove link", { description: err?.message })
    }
  }

  const accountMap = entityCoa.reduce<Record<string, ForecastChartOfAccount>>((acc, a) => {
    acc[a.id] = a; return acc
  }, {})

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" /> Performance Goal Links
              {goalLinks.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{goalLinks.length}</span>
              )}
            </CardTitle>
            <Button
              size="sm"
              className={cn(
                "h-7 rounded-full text-xs gap-1.5 shadow-sm",
                showForm
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                  : "gradient-primary text-white hover:opacity-90"
              )}
              onClick={() => { setShowForm(v => !v); if (showForm) resetForm() }}
            >
              {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showForm ? "Cancel" : "Link Goal"}
            </Button>
          </div>
        </CardHeader>

        {/* Create form */}
        {showForm && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Performance Goal <span className="text-red-500">*</span>
              </label>
              <GoalSelect
                value={selectedGoalId}
                onChange={setSelectedGoalId}
                placeholder="Search and select a performance goal…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Linked Account <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <CoaAccountCombobox
                  coa={entityCoa}
                  loading={entityCoaLoading}
                  value={selectedAccountId}
                  onChange={setSelectedAccountId}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Threshold <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500000"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={resetForm}>Cancel</Button>
              <Button
                size="sm"
                className="h-8 rounded-full text-xs gradient-primary text-white gap-1.5 shadow-sm"
                onClick={handleCreate}
                disabled={goalLinkSaving || !selectedGoalId}
              >
                {goalLinkSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                Save Link
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {goalLinksLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : goalLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                <Link2 className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-xs font-medium text-gray-500">No goal links yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Click "Link Goal" to connect a performance objective.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {goalLinks.map((link: GoalLink) => {
                const goal = link.performanceGoal
                const acct = link.accountId ? accountMap[link.accountId] : null
                const current = parseFloat(String(goal?.currentValue ?? 0)) || 0
                const target  = parseFloat(String(goal?.targetValue  ?? 1)) || 1
                const pct = Math.min(100, Math.max(0, (current / target) * 100))

                return (
                  <div
                    key={link.id}
                    onClick={() => setDrawerLink(link)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50/30 cursor-pointer group transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Link2 className="w-3.5 h-3.5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Goal title */}
                      <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
                        {goal?.title ?? link.performanceGoalId}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        {goal?.targetValue != null && (
                          <span className="text-[11px] text-muted-foreground">
                            Target: <span className="font-semibold text-gray-700">{Number(goal.targetValue).toLocaleString()}</span>
                          </span>
                        )}
                        {goal?.currentValue != null && (
                          <span className="text-[11px] text-muted-foreground">
                            Current: <span className="font-semibold text-green-600">{Number(goal.currentValue).toLocaleString()}</span>
                          </span>
                        )}
                        {link.thresholdValue != null && link.thresholdValue !== "" && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 font-semibold">
                            ≥ {Number(link.thresholdValue).toLocaleString()}
                          </span>
                        )}
                        {acct && (
                          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                            {acct.account_no}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {goal?.targetValue != null && goal?.currentValue != null && (
                        <div className="mt-1.5 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={e => handleDelete(e, link.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100 mt-0.5"
                      title="Remove link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <GoalLinkViewDrawer
        isOpen={!!drawerLink}
        onClose={() => setDrawerLink(null)}
        link={drawerLink}
        coa={entityCoa}
      />
    </>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, subtitle, icon: Icon, gradient,
}: {
  label: string; value: string | number; subtitle?: string
  icon: any; gradient?: boolean
}) {
  return (
    <Card className={`border shadow-sm hover:shadow-md transition-all duration-200 ${
      gradient ? "gradient-primary" : "bg-white border-gray-200"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium uppercase tracking-wide ${gradient ? "text-white/70" : "text-muted-foreground"}`}>
            {label}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${gradient ? "bg-white/20" : "gradient-primary"}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className={`text-xl font-bold mt-1 ${gradient ? "text-white" : "text-gray-900"}`}>
          {value}
        </div>
        {subtitle && (
          <p className={`text-xs mt-1 ${gradient ? "text-white/60" : "text-muted-foreground"}`}>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ id }: { id: string }) {
  const { selectedScenario, scenarioSummary, summaryLoading, auditLogs, auditLoading } = useSelector(
    (state: RootState) => state.forecasting
  )
  const s = selectedScenario
  const sum = scenarioSummary

  const metrics = [
    { label: "Forecast Total",      value: fmtNum(sum?.total_forecast_value, s?.base_currency), subtitle: "Sum across all periods",   icon: BarChart2,   gradient: true  },
    { label: "Periods Covered",     value: sum?.periods_covered ?? "—",                          subtitle: `${s?.granularity?.toLowerCase() ?? ""} periods`, icon: Calendar,    gradient: false },
    { label: "Forecast Cells",      value: (sum?.cells_count ?? 0).toLocaleString(),             subtitle: "Populated grid cells",    icon: Layers,      gradient: true  },
    { label: "Driver Count",        value: (s as any)?.driver_count ?? "—",                      subtitle: "Active projection rules", icon: Target,      gradient: false },
    { label: "Actual Coverage",     value: sum?.actual_coverage_pct != null ? `${sum.actual_coverage_pct.toFixed(1)}%` : "—", subtitle: "Periods with actuals loaded", icon: CheckSquare, gradient: true  },
    { label: "Forecast Accuracy",   value: sum?.accuracy_pct != null ? `${sum.accuracy_pct.toFixed(1)}%` : "—", subtitle: "Forecast vs actual alignment", icon: TrendingUp,  gradient: false },
    { label: "Updated Cells",       value: (sum as any)?.updated_cells_count ?? "—",             subtitle: "Cells modified this cycle", icon: Activity,    gradient: true  },
    { label: "Override Cells",      value: (sum as any)?.override_cells_count ?? "—",            subtitle: "Manual override entries",  icon: Settings,    gradient: false },
  ]

  return (
    <div className="space-y-5">
      {/* Summary metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : metrics.map(m => <MetricCard key={m.label} {...m} />)
        }
      </div>

      {/* Goal links */}
      <GoalLinksPanel scenarioId={id} />

      {/* Compute info + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Compute information */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" /> Compute Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {summaryLoading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-6 w-full rounded" />)}
              </div>
            ) : (
              [
                { label: "Last Computed",    value: sum?.last_computed_at ? format(new Date(sum.last_computed_at), "MMM d, yyyy HH:mm") : "Not yet computed" },
                { label: "Compute Status",   value: (sum as any)?.compute_status ?? "IDLE" },
                { label: "GL Sync",          value: (sum as any)?.gl_sync_timestamp ? format(new Date((sum as any).gl_sync_timestamp), "MMM d, HH:mm") : "Never synced" },
                { label: "Compute Job ID",   value: (sum as any)?.last_compute_job_id ? String((sum as any).last_compute_job_id).slice(0, 12) + "…" : "—" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-xs font-medium text-gray-800 font-mono">{row.value}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {auditLoading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-muted-foreground">No activities recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {auditLogs.slice(0, 6).map((e: ForecastAuditEntry) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60">
                    <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Activity className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-800 font-mono">
                        {AUDIT_ACTION_LABELS[e.action_type] ?? e.action_type}
                      </span>
                      {e.user_name && (
                        <span className="text-xs text-muted-foreground ml-2">· {e.user_name}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {e.timestamp ? format(new Date(e.timestamp), "MMM d, HH:mm") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────
function AuditTab() {
  const { auditLogs, auditLoading } = useSelector((state: RootState) => state.forecasting)
  const [search, setSearch]     = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [severityFilter, setSeverityFilter] = useState("ALL")

  const filtered = auditLogs.filter((e: ForecastAuditEntry) => {
    const matchSearch = !search || (e.action_type + " " + (e.user_name ?? "") + " " + (e.scenario_name ?? ""))
      .toLowerCase().includes(search.toLowerCase())
    const matchAction = actionFilter === "ALL" || e.action_type === actionFilter
    const matchSeverity = severityFilter === "ALL" || e.priority === severityFilter
    return matchSearch && matchAction && matchSeverity
  })

  const actionTypes = Array.from(new Set(auditLogs.map(e => e.action_type)))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs rounded-full border-gray-200 bg-white"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-9 text-xs w-auto min-w-[140px] rounded-full bg-white border-gray-200">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            {actionTypes.map(t => (
              <SelectItem key={t} value={t}>{AUDIT_ACTION_LABELS[t] ?? t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-9 text-xs w-auto min-w-[120px] rounded-full bg-white border-gray-200">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All severity</SelectItem>
            <SelectItem value="HIGH">High priority</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
          </SelectContent>
        </Select>
        {(search || actionFilter !== "ALL" || severityFilter !== "ALL") && (
          <Button variant="ghost" size="sm" className="h-9 rounded-full text-xs text-gray-500"
            onClick={() => { setSearch(""); setActionFilter("ALL"); setSeverityFilter("ALL") }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} events</span>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        {auditLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No audit events found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {search || actionFilter !== "ALL" ? "Adjust your filters to see more results" : "No activities recorded for this scenario"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((e: ForecastAuditEntry) => {
              const isHigh = e.priority === "HIGH"
              return (
                <div key={e.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors ${
                  isHigh ? "bg-red-50/30 hover:bg-red-50/50" : ""
                }`}>
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isHigh ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"
                  }`}>
                    {isHigh
                      ? <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      : <Activity className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-800 font-mono">
                        {AUDIT_ACTION_LABELS[e.action_type] ?? e.action_type}
                      </span>
                      {isHigh && (
                        <span className="text-[9px] bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-bold uppercase">High</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {e.user_name && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-2.5 h-2.5" /> {e.user_name}
                        </span>
                      )}
                      {(e as any).affected_cells != null && (
                        <span className="text-xs text-muted-foreground">
                          · {(e as any).affected_cells} cells affected
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                    {e.timestamp ? format(new Date(e.timestamp), "MMM d, HH:mm") : "—"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Main workspace ───────────────────────────────────────────────────────────
export function ScenarioWorkspace({ id }: { id: string }) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const {
    selectedScenario, selectedScenarioLoading, selectedScenarioError,
    computeStatus, auditLogs,
  } = useSelector((state: RootState) => state.forecasting)

  useEffect(() => {
    if (id) {
      dispatch(fetchScenario(id))
      dispatch(fetchScenarioSummary(id))
      dispatch(fetchVersions(id))
      dispatch(fetchScenarioAudit(id))
      dispatch(fetchGoalLinks(id))
    }
    return () => { dispatch(clearSelectedScenario()) }
  }, [dispatch, id])

  const handleRecalculate = async () => {
    try {
      await dispatch(triggerCompute({
        scenario_id: id,
        edit_type: "SCENARIO_RECALC",
        options: { include_elapsed_variance: true },
      })).unwrap()
      toast.success("Recalculation triggered", { description: "Processing in background…" })
    } catch (err: any) {
      toast.error("Recalculation failed", { description: err?.message })
    }
  }

  const s = selectedScenario
  const isLocked = s?.status === "LOCKED"
  const isActive = s?.status === "ACTIVE"
  const statusCfg = STATUS_CONFIG[s?.status ?? "DRAFT"] ?? STATUS_CONFIG.DRAFT

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (selectedScenarioLoading && !s) {
    return (
      <div>
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-6 py-4">
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (selectedScenarioError && !s) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-sm text-red-600 font-medium">{selectedScenarioError}</p>
        <Button variant="outline" size="sm" className="mt-3 rounded-full"
          onClick={() => dispatch(fetchScenario(id))}>Retry</Button>
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" className="min-h-screen bg-gray-50/30 flex flex-col">

      {/* ── Sticky header (tabs list only — content scrolls below) ───────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">

        {/* Top info bar */}
        <div className="px-5 pt-3 pb-2 flex items-start justify-between gap-4 flex-wrap">
          {/* Left: breadcrumb + title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push("/forecasting/scenarios")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                <button onClick={() => router.push("/forecasting")} className="hover:text-gray-700">Forecasting</button>
                <ChevronRight className="w-2.5 h-2.5" />
                <button onClick={() => router.push("/forecasting/scenarios")} className="hover:text-gray-700">Scenarios</button>
                <ChevronRight className="w-2.5 h-2.5" />
                <span className="text-gray-600 truncate max-w-[160px]">{s?.name ?? "…"}</span>
              </div>
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-gray-900 leading-tight">
                  {s?.name ?? "Loading…"}
                </h1>
                {s?.status && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${statusCfg.bg} ${statusCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {s.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: action toolbar */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Button
              variant="outline" size="sm"
              className="h-8 rounded-full text-xs gap-1.5 bg-white border-gray-200 shadow-sm hover:bg-gray-50"
              onClick={() => { dispatch(fetchScenario(id)); dispatch(fetchScenarioSummary(id)) }}
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>

            {!isLocked && (
              <>
                <Button
                  size="sm"
                  className="h-8 rounded-full text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  onClick={handleRecalculate}
                  disabled={computeStatus === "running"}
                >
                  <Zap className={`w-3 h-3 ${computeStatus === "running" ? "animate-pulse" : ""}`} />
                  {computeStatus === "running" ? "Computing…" : "Recalculate"}
                </Button>
                <Button
                  size="sm"
                  className="h-8 rounded-full text-xs gap-1.5 gradient-info text-white shadow-sm"
                  onClick={() => dispatch(setDriversModalOpen(true))}
                >
                  <Settings className="w-3 h-3" /> Drivers
                </Button>
              </>
            )}

            {isActive && (
              <Button
                size="sm"
                className="h-8 rounded-full text-xs gap-1.5 gradient-primary text-white shadow-sm"
                onClick={() => dispatch(setLockModalOpen(true))}
              >
                <Lock className="w-3 h-3" /> Lock
              </Button>
            )}
          </div>
        </div>

        {/* Scenario meta strip */}
        {s && (
          <div className="px-5 pb-2.5 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {[
              { icon: Database,  label: s.entity_name ?? s.entity?.name ?? "—" },
              { icon: Calendar,  label: `${s.horizon_start_date?.slice(0, 7)} → ${s.horizon_end_date?.slice(0, 7)}` },
              { icon: Layers,    label: s.granularity ?? "—" },
              { icon: Target,    label: s.base_currency ?? "—" },
              ...(s.updated_at ? [{ icon: Clock, label: `Updated ${format(new Date(s.updated_at), "MMM d, yyyy")}` }] : []),
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-1">
                <Icon className="w-3 h-3 shrink-0" />
                <span className="font-mono">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Locked banner */}
        {isLocked && (
          <div className="mx-5 mb-2.5 rounded-lg border-l-4 border-l-blue-500 bg-blue-50 px-3 py-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-800">
              <strong>Locked.</strong> This is an immutable version snapshot — all cells and drivers are read-only.
            </p>
          </div>
        )}

        {/* Tab bar — inside sticky header */}
        <TabsList className="h-9 px-4 gap-0 rounded-none bg-transparent border-0 w-full justify-start">
          {[
            { value: "overview",  label: "Overview",      icon: BarChart2  },
            { value: "grid",      label: "Forecast Grid", icon: LayoutGrid },
            { value: "versions",  label: "Versions",      icon: History    },
            { value: "audit",     label: "Audit Trail",   icon: Activity   },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none h-9 px-4 text-xs gap-1.5 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-gray-500 hover:text-gray-700"
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Scrollable tab content (outside sticky header) ────────────────── */}
      <div className="flex-1 px-6 py-5 space-y-5">
        <TabsContent value="overview" className="mt-0">
          <OverviewTab id={id} />
        </TabsContent>

        <TabsContent value="grid" className="mt-0">
          <ScenarioGrid scenarioId={id} isLocked={isLocked} />
        </TabsContent>

        <TabsContent value="versions" className="mt-0">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-sm font-semibold text-gray-800">Version Snapshots</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VersionsPanel scenarioId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-0">
          <AuditTab />
        </TabsContent>
      </div>

      <LockScenarioModal scenarioId={id} />
      <DriversPanel scenarioId={id} />
    </Tabs>
  )
}
