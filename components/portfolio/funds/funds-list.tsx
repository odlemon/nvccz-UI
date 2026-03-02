"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Wallet, Plus, Eye } from "lucide-react"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import { FundCreateModal } from "./fund-create-modal"
import { FundDrawer } from "./fund-drawer"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { PORTFOLIO_ACTIONS } from "@/lib/config/role-permissions"

export function FundsList() {
  const { hasSpecificAction } = useRolePermissions()
  const canCreateFund = hasSpecificAction('portfolio-management', PORTFOLIO_ACTIONS.CREATE_FUND)

  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [industry, setIndustry] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Fund | null>(null)

  const loadFunds = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fundsApi.getAll()
      setFunds(res.data.funds || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load funds")
      toast.error("Failed to load funds", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFunds() }, [])

  const formatLongDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return iso
    }
  }

  const allIndustries = useMemo(() => {
    const set = new Set<string>()
    funds.forEach(f => (f.focusIndustries || []).forEach(i => set.add(i)))
    return Array.from(set).sort()
  }, [funds])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return funds.filter(f => {
      const matchesQuery = !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      const matchesStatus = status === 'all' || f.status === status
      const matchesIndustry = industry === 'all' || (f.focusIndustries || []).includes(industry)
      return matchesQuery && matchesStatus && matchesIndustry
    })
  }, [funds, query, status, industry])

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginated = filtered.slice(startIndex, endIndex)

  useEffect(() => { setCurrentPage(1) }, [query, status, industry])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            Fund Management
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Filter and review all funds</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-gray-500">Refreshing...</span>}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={loadFunds}
            disabled={loading}
          >
            Refresh
          </Button>
          {canCreateFund && (
            <Button onClick={() => setIsCreateOpen(true)} className="rounded-full gradient-primary text-white font-normal">
              <Plus className="w-4 h-4 mr-2" />
              Create Fund
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            placeholder="Search funds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full pl-4 h-11 text-base"
          />
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Stage</label>
            <select
              className="border rounded-full px-4 py-2.5 text-base"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
              <option value="PAUSED">PAUSED</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Industry</label>
            <select
              className="border rounded-full px-4 py-2.5 text-base"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="all">All</option>
              {allIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        )}
        {!loading && paginated.length === 0 && (
          <div className="text-center text-gray-600 py-12">No funds found</div>
        )}
        {!loading && paginated.map((f) => {
          const totalDisbursed = (f.fundDisbursements || [])
            .filter(d => d.status === 'DISBURSED')
            .reduce((sum, d) => sum + Number(d.amount), 0)

          return (
            <div
              key={f.id}
              className="p-6 rounded-2xl border border-border hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer bg-white relative"
              onClick={() => { setSelected(f); setDrawerOpen(true) }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 rounded-full h-10 w-10 bg-blue-50 text-blue-600 hover:bg-blue-100"
                onClick={(e) => { e.stopPropagation(); setSelected(f); setDrawerOpen(true) }}
                aria-label="View"
              >
                <Eye className="w-5 h-5" />
              </Button>
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-xl">{f.name}</h4>
                    <Badge variant={f.status === 'OPEN' ? 'default' : 'secondary'} className="text-xs">{f.status}</Badge>
                  </div>
                  <p className="text-base text-muted-foreground line-clamp-2">{f.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(f.focusIndustries || []).slice(0, 4).map((ind) => (
                      <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right space-y-2 mt-12">
                  <div>
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-base text-purple-700">${Number(f.totalAmount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Remaining</div>
                    <div className="text-base text-emerald-600">${Number(f.remainingAmount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Disbursed</div>
                    <div className="text-base text-blue-600">${totalDisbursed.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span className="font-medium">Min ${Number(f.minInvestment).toLocaleString()} • Max ${Number(f.maxInvestment).toLocaleString()}</span>
                <span className="font-medium">
                  {formatLongDate(f.applicationStart)} - {formatLongDate(f.applicationEnd)}
                </span>
              </div>
              <div className="space-y-1">
                {(() => {
                  const total = Number(f.totalAmount) || 0
                  const remaining = Number(f.remainingAmount) || 0
                  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Funded</span>
                        <span className="font-medium">{pct.toFixed(0)}% remaining</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </>
                  )
                })()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-base text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="default" className="rounded-full" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</Button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
              const page = i + 1
              return (
                <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="default" className="rounded-full w-9 h-9 p-0 text-base" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              )
            })}
            <Button variant="outline" size="default" className="rounded-full" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}

      <FundCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreated={loadFunds} />
      <FundDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} fund={selected} />
    </div>
  )
}
