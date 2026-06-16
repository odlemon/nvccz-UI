"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Plus, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  MoreHorizontal, ExternalLink, TrendingUp, Lock, Archive,
  LayoutGrid, List, Search, Filter, Clock, Database,
  Cpu, Target, Calendar, Layers, ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { AppDispatch, RootState } from "@/lib/store/store"
import {
  fetchScenarios, fetchEntities, setStatusFilter, setCreateModalOpen,
  setPage, updateScenario, setLockModalOpen, fetchScenario,
} from "@/lib/store/slices/forecastingSlice"
import { CreateScenarioModal } from "./create-scenario-modal"
import type { ForecastScenario } from "@/lib/api/forecasting-api"

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { label: "All",      value: null     },
  { label: "Draft",    value: "DRAFT"  },
  { label: "Active",   value: "ACTIVE" },
  { label: "Locked",   value: "LOCKED" },
  { label: "Archived", value: "ARCHIVED" },
]

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  DRAFT:    { color: "text-gray-600",   bg: "bg-gray-100",   dot: "bg-gray-400"   },
  ACTIVE:   { color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500"  },
  LOCKED:   { color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"   },
  ARCHIVED: { color: "text-orange-600", bg: "bg-orange-100", dot: "bg-orange-400" },
}

const GRAN_LABELS: Record<string, string> = {
  MONTHLY: "Monthly", QUARTERLY: "Quarterly", ANNUALLY: "Annual",
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

// ─── Scenario Card (card view) ────────────────────────────────────────────────
function ScenarioCard({
  scenario, onOpen, onPromote, onLock, onArchive,
}: {
  scenario: ForecastScenario
  onOpen: () => void
  onPromote: () => void
  onLock: () => void
  onArchive: () => void
}) {
  const cfg = STATUS_CONFIG[scenario.status] ?? STATUS_CONFIG.DRAFT
  const isLocked = scenario.status === "LOCKED"
  const isDraft = scenario.status === "DRAFT"
  const isActive = scenario.status === "ACTIVE"

  return (
    <Card
      className={`bg-white border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${
        isLocked ? "border-blue-200" : "border-gray-200"
      }`}
      onClick={onOpen}
    >
      {/* Status accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.dot.replace("bg-", "bg-")}`} />

      <CardContent className="p-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{scenario.name}</p>
            {scenario.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{scenario.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={scenario.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen() }}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Workspace
                </DropdownMenuItem>
                {isDraft && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPromote() }}>
                    <TrendingUp className="w-4 h-4 mr-2" /> Promote to Active
                  </DropdownMenuItem>
                )}
                {isActive && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLock() }}>
                    <Lock className="w-4 h-4 mr-2" /> Lock Scenario
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {!isLocked && (
                  <DropdownMenuItem
                    className="text-orange-600 focus:text-orange-700"
                    onClick={(e) => { e.stopPropagation(); onArchive() }}
                  >
                    <Archive className="w-4 h-4 mr-2" /> Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
          {[
            { icon: Database, label: scenario.entity_name ?? scenario.entity?.name ?? "—" },
            { icon: Target,   label: scenario.base_currency ?? "—" },
            { icon: Calendar, label: GRAN_LABELS[scenario.granularity ?? ""] ?? scenario.granularity ?? "—" },
            { icon: Layers,   label: `${scenario.driver_count ?? 0} drivers` },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* Horizon bar */}
        <div className="mt-3 px-2.5 py-1.5 bg-gray-50 rounded-lg flex items-center gap-2">
          <Clock className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="text-xs font-mono text-gray-600">
            {scenario.horizon_start_date?.slice(0, 7)} → {scenario.horizon_end_date?.slice(0, 7)}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-muted-foreground">
            {scenario.updated_at
              ? `Updated ${format(new Date(scenario.updated_at), "MMM d, yyyy")}`
              : "Never updated"}
          </span>
          <Button
            variant="ghost" size="sm"
            className="h-6 px-2 rounded-full text-blue-600 hover:bg-blue-50 text-xs"
            onClick={(e) => { e.stopPropagation(); onOpen() }}
          >
            Open <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const LIMIT = 15

export function ScenariosList() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const {
    scenarios, scenariosLoading, scenariosError,
    scenariosPagination, statusFilter, entities,
  } = useSelector((state: RootState) => state.forecasting)

  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [search, setSearch]     = useState("")
  const [entityFilter, setEntityFilter] = useState<string>("ALL")
  const [currencyFilter, setCurrencyFilter] = useState<string>("ALL")

  useEffect(() => {
    dispatch(fetchEntities())
    dispatch(fetchScenarios({ status: statusFilter ?? undefined, page: scenariosPagination.page, limit: LIMIT }))
  }, [dispatch, statusFilter, scenariosPagination.page])

  // Client-side filter on top of server-side status filter
  const filtered = scenarios.filter((s: ForecastScenario) => {
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.entity_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase())
    const matchEntity = entityFilter === "ALL" || s.entity_id === entityFilter
    const matchCurrency = currencyFilter === "ALL" || s.base_currency === currencyFilter
    return matchSearch && matchEntity && matchCurrency
  })

  const totalPages = Math.ceil(scenariosPagination.total / LIMIT)

  const handlePromote = async (scenario: ForecastScenario) => {
    try {
      await dispatch(updateScenario({ id: scenario.id, data: { status: "ACTIVE" } })).unwrap()
      toast.success(`"${scenario.name}" promoted to ACTIVE`)
      dispatch(fetchScenarios({ status: statusFilter ?? undefined, page: scenariosPagination.page, limit: LIMIT }))
    } catch (err: any) {
      toast.error("Failed to promote", { description: err?.message })
    }
  }

  const handleArchive = async (scenario: ForecastScenario) => {
    try {
      await dispatch(updateScenario({ id: scenario.id, data: { status: "ARCHIVED" } })).unwrap()
      toast.success(`"${scenario.name}" archived`)
      dispatch(fetchScenarios({ status: statusFilter ?? undefined, page: scenariosPagination.page, limit: LIMIT }))
    } catch (err: any) {
      toast.error("Failed to archive", { description: err?.message })
    }
  }

  const uniqueCurrencies = Array.from(new Set(scenarios.map((s: ForecastScenario) => s.base_currency).filter(Boolean)))

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scenarios</h1>
          <p className="text-sm text-muted-foreground">
            {scenariosPagination.total} total · {filtered.length} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "card" ? "bg-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="outline" size="sm" className="rounded-full h-9 bg-white"
            onClick={() => dispatch(fetchScenarios({ status: statusFilter ?? undefined, page: scenariosPagination.page, limit: LIMIT }))}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm" className="rounded-full h-9 gradient-primary text-white shadow"
            onClick={() => dispatch(setCreateModalOpen(true))}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Scenario
          </Button>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search scenarios…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs rounded-full border-gray-200 bg-white"
          />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
          {STATUS_TABS.map(tab => (
            <button
              key={String(tab.value)}
              onClick={() => dispatch(setStatusFilter(tab.value as any))}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                statusFilter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Entity filter */}
        {entities.length > 0 && (
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[130px] text-xs rounded-full bg-white border-gray-200">
              <Database className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All entities</SelectItem>
              {entities.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Currency filter */}
        {uniqueCurrencies.length > 1 && (
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[110px] text-xs rounded-full bg-white border-gray-200">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All currencies</SelectItem>
              {uniqueCurrencies.map(c => (
                <SelectItem key={c} value={c!}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {scenariosLoading ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          </Card>
        )
      ) : scenariosError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-red-600 font-medium">Failed to load scenarios</p>
          <p className="text-xs text-muted-foreground mt-1">{scenariosError}</p>
          <Button variant="outline" size="sm" className="mt-3 rounded-full"
            onClick={() => dispatch(fetchScenarios({ status: statusFilter ?? undefined, page: 1, limit: LIMIT }))}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {search || statusFilter || entityFilter !== "ALL"
              ? "No scenarios match your filters"
              : "No scenarios yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || statusFilter || entityFilter !== "ALL"
              ? "Try adjusting your search or filter criteria"
              : "Create your first forecasting scenario to get started"}
          </p>
          {!search && !statusFilter && entityFilter === "ALL" && (
            <Button size="sm" className="mt-4 rounded-full gradient-primary text-white h-9"
              onClick={() => dispatch(setCreateModalOpen(true))}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create first scenario
            </Button>
          )}
        </div>
      ) : viewMode === "card" ? (
        /* ── Card grid view ──────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: ForecastScenario) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onOpen={() => router.push(`/forecasting/scenarios/${s.id}`)}
              onPromote={() => handlePromote(s)}
              onLock={() => {
                dispatch(fetchScenario(s.id))
                dispatch(setLockModalOpen(true))
                router.push(`/forecasting/scenarios/${s.id}`)
              }}
              onArchive={() => handleArchive(s)}
            />
          ))}
        </div>
      ) : (
        /* ── Table view ──────────────────────────────────────────────────── */
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Name", "Status", "Entity", "Currency", "Granularity", "Horizon", "Updated", ""].map(h => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide ${
                      ["Currency", "Granularity"].includes(h) ? "hidden lg:table-cell" : ""
                    } ${ h === "Horizon" ? "hidden xl:table-cell" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s: ForecastScenario) => (
                  <tr
                    key={s.id}
                    className="hover:bg-blue-50/20 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/forecasting/scenarios/${s.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-[120px]">
                      {s.entity_name ?? s.entity?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-gray-700">{s.base_currency}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600">
                      {GRAN_LABELS[s.granularity ?? ""] ?? s.granularity}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs font-mono text-gray-600">
                        {s.horizon_start_date?.slice(0, 7)} → {s.horizon_end_date?.slice(0, 7)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.updated_at ? format(new Date(s.updated_at), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"
                            className="h-7 w-7 p-0 rounded-full">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push(`/forecasting/scenarios/${s.id}`)}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Open Workspace
                          </DropdownMenuItem>
                          {s.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => handlePromote(s)}>
                              <TrendingUp className="w-4 h-4 mr-2" /> Promote to Active
                            </DropdownMenuItem>
                          )}
                          {s.status === "ACTIVE" && (
                            <DropdownMenuItem onClick={() => {
                              dispatch(fetchScenario(s.id))
                              dispatch(setLockModalOpen(true))
                              router.push(`/forecasting/scenarios/${s.id}`)
                            }}>
                              <Lock className="w-4 h-4 mr-2" /> Lock Scenario
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {s.status !== "ARCHIVED" && s.status !== "LOCKED" && (
                            <DropdownMenuItem
                              className="text-orange-600 focus:text-orange-700"
                              onClick={() => handleArchive(s)}
                            >
                              <Archive className="w-4 h-4 mr-2" /> Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-muted-foreground">
                Page {scenariosPagination.page} of {totalPages} · {scenariosPagination.total} scenarios
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={scenariosPagination.page <= 1}
                  onClick={() => dispatch(setPage(scenariosPagination.page - 1))}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={scenariosPagination.page === page ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 rounded-full text-xs ${
                      scenariosPagination.page === page ? "gradient-primary text-white" : "bg-white"
                    }`}
                    onClick={() => dispatch(setPage(page))}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0 rounded-full bg-white"
                  disabled={scenariosPagination.page >= totalPages}
                  onClick={() => dispatch(setPage(scenariosPagination.page + 1))}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <CreateScenarioModal />
    </div>
  )
}
