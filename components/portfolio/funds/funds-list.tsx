"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  TrendingUp,
  Wallet,
  BarChart3,
  ArrowUpRight,
  Building2,
  RefreshCw,
} from "lucide-react"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import { FundCreateModal } from "./fund-create-modal"
import { FundDrawer } from "./fund-drawer"
import { toast } from "sonner"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PORTFOLIO_ACTIONS } from "@/lib/config/role-permissions"

const STATUS_STYLES: Record<string, { card: string; badge: string; dot: string }> = {
  OPEN: {
    card: "from-[#0f2744] via-[#0d3d6b] to-[#0a5a8a]",
    badge: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
    dot: "bg-emerald-400",
  },
  CLOSED: {
    card: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    badge: "bg-slate-400/20 text-slate-300 border-slate-400/30",
    dot: "bg-slate-400",
  },
  PAUSED: {
    card: "from-[#2d1b00] via-[#4a2e00] to-[#6b4200]",
    badge: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    dot: "bg-amber-400",
  },
}

function fmtMoney(val: string | number, compact = false) {
  const n = Number(val)
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  }
  return `$${n.toLocaleString()}`
}

function deployedPct(total: string, remaining: string) {
  const t = Number(total)
  const r = Number(remaining)
  if (!t) return 0
  return Math.max(0, Math.min(100, ((t - r) / t) * 100))
}

// Minimal SVG ring for the hero metric
function Ring({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(52,211,153,0.9)" strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FundsList() {
  const { hasSpecificAction } = useRolePermissions()
  const canCreateFund = hasSpecificAction("portfolio-management", PORTFOLIO_ACTIONS.CREATE_FUND)

  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [industry, setIndustry] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Fund | null>(null)

  const loadFunds = async () => {
    try {
      setLoading(true)
      const res = await fundsApi.getAll()
      setFunds(res.data.funds || [])
    } catch (e: any) {
      toast.error("Failed to load funds", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFunds() }, [])

  // Summary stats
  const stats = useMemo(() => {
    const totalAUM = funds.reduce((s, f) => s + Number(f.totalAmount), 0)
    const totalDeployed = funds.reduce((s, f) => {
      const disbursed = (f.fundDisbursements || [])
        .filter(d => d.status === "DISBURSED")
        .reduce((a, d) => a + Number(d.amount), 0)
      return s + disbursed
    }, 0)
    const openCount = funds.filter(f => f.status === "OPEN").length
    return { totalAUM, totalDeployed, totalRemaining: totalAUM - totalDeployed, openCount }
  }, [funds])

  const allIndustries = useMemo(() => {
    const set = new Set<string>()
    funds.forEach(f => (f.focusIndustries || []).forEach(i => set.add(i)))
    return Array.from(set).sort()
  }, [funds])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return funds.filter(f => {
      const matchQ = !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      const matchS = status === "all" || f.status === status
      const matchI = industry === "all" || (f.focusIndustries || []).includes(industry)
      return matchQ && matchS && matchI
    })
  }, [funds, query, status, industry])

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => { setCurrentPage(1) }, [query, status, industry])

  const openCard = (f: Fund) => { setSelected(f); setDrawerOpen(true) }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Venture Capital Funds</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage and monitor all fund allocations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={loadFunds} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreateFund && (
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-full gap-1.5 gradient-primary text-white">
              <Plus className="w-4 h-4" />
              Create Fund
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total AUM", value: fmtMoney(stats.totalAUM, true), icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Deployed", value: fmtMoney(stats.totalDeployed, true), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Remaining", value: fmtMoney(stats.totalRemaining, true), icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Open Funds", value: String(stats.openCount), icon: Building2, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search funds..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="rounded-full pl-9 h-10"
          />
        </div>
        <select
          className="border rounded-full px-4 py-2 text-sm bg-white"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="PAUSED">Paused</option>
        </select>
        <select
          className="border rounded-full px-4 py-2 text-sm bg-white"
          value={industry}
          onChange={e => setIndustry(e.target.value)}
        >
          <option value="all">All Industries</option>
          {allIndustries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* ── Fund Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200" />
              <div className="h-36 bg-gray-100 p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No funds found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginated.map(f => {
            const styles = STATUS_STYLES[f.status] || STATUS_STYLES.CLOSED
            const pct = deployedPct(f.totalAmount, f.remainingAmount)
            const deployed = Number(f.totalAmount) - Number(f.remainingAmount)
            const disbursedCount = (f.fundDisbursements || []).filter(d => d.status === "DISBURSED").length
            const appEnd = new Date(f.applicationEnd)
            const daysLeft = Math.max(0, Math.ceil((appEnd.getTime() - Date.now()) / 86_400_000))

            return (
              <div
                key={f.id}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-white/10"
                onClick={() => openCard(f)}
              >
                {/* ── Dark gradient top ── */}
                <div className={`bg-gradient-to-br ${styles.card} p-5 relative overflow-hidden`}>
                  {/* subtle background pattern */}
                  <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

                  {/* Top row: icon + status + arrow */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-white font-bold text-sm border border-white/20">
                        {f.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm leading-tight line-clamp-1">{f.name}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border mt-0.5 ${styles.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                          {f.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  {/* Hero metric: deployed % + ring */}
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/50 text-xs mb-0.5">Capital Deployed</p>
                      <p className="text-white text-4xl font-bold leading-none">{pct.toFixed(2)}%</p>
                      <p className="text-white/60 text-xs mt-1.5">
                        {fmtMoney(f.totalAmount, true)} total capital
                      </p>
                    </div>
                    <div className="relative flex items-center justify-center">
                      <Ring pct={pct} size={76} />
                      <span className="absolute text-white text-[10px] font-medium">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* ── White metrics bottom ── */}
                <div className="bg-white p-4 space-y-3">
                  {/* Capital row */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
                    <div className="pr-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Deployed</p>
                      <p className="text-sm font-semibold text-blue-600">{fmtMoney(deployed, true)}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Remaining</p>
                      <p className="text-sm font-semibold text-emerald-600">{fmtMoney(f.remainingAmount, true)}</p>
                    </div>
                    <div className="pl-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Disbursements</p>
                      <p className="text-sm font-semibold text-purple-600">{disbursedCount}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Capital deployment</span>
                      <span>{pct.toFixed(1)}% deployed</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Min / Max + days left */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      Min {fmtMoney(f.minInvestment, true)} · Max {fmtMoney(f.maxInvestment, true)}
                    </span>
                    {f.status === "OPEN" && (
                      <span className={`font-medium ${daysLeft < 30 ? "text-red-500" : "text-gray-500"}`}>
                        {daysLeft}d left
                      </span>
                    )}
                  </div>

                  {/* Industries */}
                  {(f.focusIndustries || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {(f.focusIndustries || []).slice(0, 4).map(ind => (
                        <span key={ind} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {ind}
                        </span>
                      ))}
                      {(f.focusIndustries || []).length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          +{(f.focusIndustries || []).length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="rounded-full" disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"} size="sm"
                className="rounded-full w-8 h-8 p-0" onClick={() => setCurrentPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="rounded-full" disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <FundCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={loadFunds} />
      <FundDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} fund={selected} />
    </div>
  )
}
