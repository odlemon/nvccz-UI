"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, ChevronRight, RefreshCw, Wallet } from "lucide-react"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import { FundCreateModal } from "./fund-create-modal"
import { FundCard } from "./fund-card"
import { HoldingDetails } from "./holding-details"
import { FundDetailSections } from "./fund-detail-sections"
import { toast } from "sonner"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PORTFOLIO_ACTIONS } from "@/lib/config/role-permissions"

function SummaryCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="bg-primary px-5 py-3">
        <h3 className="text-sm font-semibold text-primary-foreground">{title}</h3>
      </div>
      <div className="px-5 py-1 divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-card-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FundsList() {
  const { hasSpecificAction } = useRolePermissions()
  const canCreateFund = hasSpecificAction("portfolio-management", PORTFOLIO_ACTIONS.CREATE_FUND)

  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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

  const stats = useMemo(() => {
    const totalAUM = funds.reduce((s, f) => s + Number(f.totalAmount), 0)
    const totalDeployed = funds.reduce((s, f) => s + (Number(f.totalAmount) - Number(f.remainingAmount)), 0)
    return {
      totalAUM,
      totalDeployed,
      openCount: funds.filter(f => f.status === "OPEN").length,
      closedCount: funds.filter(f => f.status === "CLOSED").length,
      pausedCount: funds.filter(f => f.status === "PAUSED").length,
    }
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
      return matchQ && matchS
    })
  }, [funds, query, status])

  const toggleFund = (f: Fund) => setSelectedFund(prev => prev?.id === f.id ? null : f)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Breadcrumb bar ── */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shrink-0">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Assets</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Venture Capital Funds</span>
          {selectedFund && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-card-foreground font-medium">{selectedFund.name}</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={loadFunds} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canCreateFund && (
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-full gap-1.5 gradient-primary text-white" size="sm">
              <Plus className="w-4 h-4" />
              Create Fund
            </Button>
          )}
        </div>
      </header>

      {/* ── Body: main + right panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable main area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Search / filter bar ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search funds..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="rounded-full pl-9 h-9 text-sm"
              />
            </div>
            <select
              className="border rounded-full px-4 py-2 text-sm bg-card"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>

          {/* ── Fund cards ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-3 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-8 w-20 rounded bg-muted" />
                  <div className="h-8 w-28 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No funds found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((f, i) => (
                <FundCard
                  key={f.id}
                  fund={f}
                  index={i}
                  isSelected={selectedFund?.id === f.id}
                  onClick={() => toggleFund(f)}
                />
              ))}
            </div>
          )}

          {/* ── Category banner ── */}
          {!loading && (
            <div className="rounded-full bg-primary px-6 py-3 text-center">
              <span className="text-sm font-semibold text-primary-foreground">
                Venture Capital Funds
              </span>
            </div>
          )}

          {/* ── Bottom sections ── */}
          {!loading && (
            selectedFund ? (
              <FundDetailSections fund={selectedFund} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SummaryCard
                  title="Total AUM"
                  rows={[
                    ["Total Funds", String(funds.length)],
                    ["AUM", `$${stats.totalAUM.toLocaleString()}`],
                    ["Deployed", `$${stats.totalDeployed.toLocaleString()}`],
                  ]}
                />
                <SummaryCard
                  title="Status Overview"
                  rows={[
                    ["Open Funds", String(stats.openCount)],
                    ["Closed Funds", String(stats.closedCount)],
                    ["Paused Funds", String(stats.pausedCount)],
                  ]}
                />
                <SummaryCard
                  title="Industries"
                  rows={allIndustries.slice(0, 4).map(ind => [ind, "Active"] as [string, string])}
                />
              </div>
            )
          )}
        </main>

        {/* ── Right panel: Holding Details ── */}
        {selectedFund && (
          <aside className="hidden lg:flex w-[400px] shrink-0">
            <HoldingDetails
              fund={selectedFund}
              onClose={() => setSelectedFund(null)}
              onCreateFund={canCreateFund ? () => setIsCreateOpen(true) : undefined}
            />
          </aside>
        )}
      </div>

      <FundCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={loadFunds} />
    </div>
  )
}
