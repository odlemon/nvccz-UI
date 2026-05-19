"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Plus,
  RefreshCw,
  Loader2,
  Settings2,
  ChevronRight,
  Receipt,
  TrendingDown,
  DollarSign,
  Percent,
  Info,
  CalendarDays,
} from "lucide-react"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import {
  lpFeesApi,
  type FundFeePolicy,
  type ManagementFeePeriod,
  type Distribution,
} from "@/lib/api/lp-fees-distributions-api"
import { toast } from "sonner"
import { FeePolicyModal } from "./fee-policy-modal"
import { AccrueFeeModal } from "./accrue-fee-modal"
import { FeePeriodDrawer } from "./fee-period-drawer"
import { DeclareDistributionModal } from "./declare-distribution-modal"
import { DistributionDrawer } from "./distribution-drawer"

// ── Helpers ────────────────────────────────────────────────────────────

function fmtCurrency(val: string | number | null | undefined, symbol = "$") {
  if (val == null) return "—"
  const n = Number(val)
  if (isNaN(n)) return "—"
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

function fmtPct(frac: number | null | undefined) {
  if (frac == null) return "—"
  const pct = frac * 100
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2)}%`
}

function feePeriodStatusBadge(status: string) {
  switch (status) {
    case "ACCRUED": return "bg-blue-100 text-blue-700"
    case "INVOICED": return "bg-indigo-100 text-indigo-700"
    case "PARTIALLY_PAID": return "bg-amber-100 text-amber-700"
    case "PAID": return "bg-emerald-100 text-emerald-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

function distStatusBadge(status: string) {
  switch (status) {
    case "DECLARED": return "bg-blue-100 text-blue-700"
    case "NOTICES_SENT": return "bg-indigo-100 text-indigo-700"
    case "PARTIALLY_PAID": return "bg-amber-100 text-amber-700"
    case "PAID": return "bg-emerald-100 text-emerald-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

const SOURCE_LABELS: Record<string, string> = {
  DIVIDEND: "Dividend",
  EXIT_PROCEEDS: "Exit Proceeds",
  INTEREST: "Interest",
  OTHER: "Other",
}

// ── KPI Card ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, gradient, icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  gradient: string
  icon: React.ElementType
}) {
  return (
    <div className={`rounded-2xl p-4 ${gradient} border`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="p-1.5 bg-white/60 rounded-lg">
          <Icon className="w-3.5 h-3.5 text-foreground/70" />
        </div>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

export function LpFeesDistributions() {
  // ── Fund state ──
  const [funds, setFunds] = useState<Fund[]>([])
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [fundsLoading, setFundsLoading] = useState(true)

  // ── Policy state ──
  const [policy, setPolicy] = useState<FundFeePolicy | null>(null)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)

  // ── Management fees state ──
  const [feePeriods, setFeePeriods] = useState<ManagementFeePeriod[]>([])
  const [feesLoading, setFeesLoading] = useState(false)
  const [accrueModalOpen, setAccrueModalOpen] = useState(false)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [periodDrawerOpen, setPeriodDrawerOpen] = useState(false)

  // ── Distributions state ──
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [distsLoading, setDistsLoading] = useState(false)
  const [declareModalOpen, setDeclareModalOpen] = useState(false)
  const [selectedDistId, setSelectedDistId] = useState<string | null>(null)
  const [distDrawerOpen, setDistDrawerOpen] = useState(false)

  // ── Load funds ──
  const loadFunds = async () => {
    try {
      setFundsLoading(true)
      const res = await fundsApi.getAll()
      const list: Fund[] = res.data.funds || []
      setFunds(list)
      if (list.length > 0) setSelectedFund(list[0])
    } catch (e: any) {
      toast.error("Failed to load funds", { description: e?.message })
    } finally {
      setFundsLoading(false)
    }
  }

  const loadPolicy = useCallback(async () => {
    if (!selectedFund) return
    try {
      setPolicyLoading(true)
      const res = await lpFeesApi.getFeePolicy(selectedFund.id)
      setPolicy(res.data)
    } catch {
      setPolicy(null)
    } finally {
      setPolicyLoading(false)
    }
  }, [selectedFund])

  const loadFeePeriods = useCallback(async () => {
    if (!selectedFund) return
    try {
      setFeesLoading(true)
      const res = await lpFeesApi.listFeePeriods(selectedFund.id)
      setFeePeriods(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load management fees", { description: e?.message })
    } finally {
      setFeesLoading(false)
    }
  }, [selectedFund])

  const loadDistributions = useCallback(async () => {
    if (!selectedFund) return
    try {
      setDistsLoading(true)
      const res = await lpFeesApi.listDistributions(selectedFund.id)
      setDistributions(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load distributions", { description: e?.message })
    } finally {
      setDistsLoading(false)
    }
  }, [selectedFund])

  useEffect(() => { loadFunds() }, [])

  useEffect(() => {
    if (selectedFund) {
      loadPolicy()
      loadFeePeriods()
      loadDistributions()
    }
  }, [selectedFund?.id])

  // ── Derived stats for Management Fees ──
  const totalFeeAccrued = feePeriods.reduce((s, p) => s + Number(p.totalFee), 0)
  const totalFeeCollected = feePeriods.reduce((s, p) => {
    if (p.status === "PAID") return s + Number(p.totalFee)
    return s
  }, 0)
  const totalFeeOutstanding = totalFeeAccrued - totalFeeCollected
  const symbol = policy?.managementFeeBase ? (selectedFund as any)?.currency?.symbol || "$" : "$"

  // ── Derived stats for Distributions ──
  const totalGross = distributions.reduce((s, d) => s + Number(d.grossAmount), 0)
  const totalCarry = distributions.reduce((s, d) => s + Number(d.carryAmount), 0)
  const totalNet = distributions.reduce((s, d) => s + Number(d.netToLPs), 0)

  return (
    <div className="space-y-6">
      {/* Fund selector + policy strip */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          {fundsLoading ? (
            <div className="h-10 w-52 rounded-full bg-muted animate-pulse" />
          ) : (
            <Select
              value={selectedFund?.id || ""}
              onValueChange={(id) => setSelectedFund(funds.find((f) => f.id === id) || null)}
            >
              <SelectTrigger className="rounded-full w-64">
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Policy summary pill */}
        {policy && (
          <div className="flex items-center gap-2 text-xs bg-muted rounded-full px-4 py-2">
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Mgmt Fee:</span>
            <span className="font-medium">{fmtPct(policy.managementFeeRate)}</span>
            {policy.managementFeeBase && (
              <span className="text-muted-foreground">on {policy.managementFeeBase}</span>
            )}
            {policy.carryRate != null && (
              <>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="text-muted-foreground">Carry:</span>
                <span className="font-medium">{fmtPct(policy.carryRate)}</span>
              </>
            )}
          </div>
        )}
        {!policy && !policyLoading && selectedFund && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-700 rounded-full px-4 py-2 border border-amber-200">
            <Info className="w-3.5 h-3.5" />
            Fee policy not configured
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-1.5"
          onClick={() => setPolicyModalOpen(true)}
          disabled={!selectedFund}
        >
          <Settings2 className="w-4 h-4" />
          {policy ? "Edit Policy" : "Set Policy"}
        </Button>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="management-fees">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="management-fees" className="gap-1.5 data-[state=active]:shadow-none">
            <Receipt className="w-4 h-4" />
            Management Fees
          </TabsTrigger>
          <TabsTrigger value="distributions" className="gap-1.5 data-[state=active]:shadow-none">
            <TrendingDown className="w-4 h-4" />
            Distributions
          </TabsTrigger>
        </TabsList>

        {/* ── Tab A: Management Fees ── */}
        <TabsContent value="management-fees" className="mt-6 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Accrued"
              value={fmtCurrency(totalFeeAccrued)}
              sub={`${feePeriods.length} period${feePeriods.length !== 1 ? "s" : ""}`}
              gradient="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
              icon={Receipt}
            />
            <KpiCard
              label="Collected"
              value={fmtCurrency(totalFeeCollected)}
              gradient="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100"
              icon={DollarSign}
            />
            <KpiCard
              label="Outstanding"
              value={fmtCurrency(totalFeeOutstanding)}
              gradient="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100"
              icon={CalendarDays}
            />
            <KpiCard
              label="Annual Rate"
              value={fmtPct(policy?.managementFeeRate)}
              sub={policy?.managementFeeBase ? `on ${policy.managementFeeBase}` : undefined}
              gradient="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
              icon={Percent}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Fee Periods</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5"
                onClick={loadFeePeriods}
                disabled={feesLoading || !selectedFund}
              >
                <RefreshCw className={`w-4 h-4 ${feesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="rounded-full gap-1.5 gradient-primary text-white"
                onClick={() => setAccrueModalOpen(true)}
                disabled={!selectedFund}
              >
                <Plus className="w-4 h-4" />
                Accrue Fee
              </Button>
            </div>
          </div>

          {/* Fee periods list */}
          {feesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : feePeriods.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Receipt className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm text-muted-foreground">No management fee periods yet.</p>
              <p className="text-xs text-muted-foreground">Click &ldquo;Accrue Fee&rdquo; to bill LPs for the first period.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feePeriods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPeriodId(p.id); setPeriodDrawerOpen(true) }}
                  className="w-full text-left rounded-2xl border bg-card hover:bg-muted/30 transition-colors p-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Receipt className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.feeBase} · {(p._count?.allocations ?? p.allocations?.length ?? 0)} LP{(p._count?.allocations ?? p.allocations?.length ?? 0) !== 1 ? "s" : ""}
                          {p.invoicesSentAt && " · Invoiced"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {fmtCurrency(p.totalFee, p.currency?.symbol || "$")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.currency?.code || ""} {(Number(p.rate) * 100).toFixed(4).replace(/\.?0+$/, "")}% p.a.
                        </p>
                      </div>
                      <Badge className={`text-xs rounded-full ${feePeriodStatusBadge(p.status)}`}>
                        {p.statusLabel}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab B: Distributions ── */}
        <TabsContent value="distributions" className="mt-6 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Declared"
              value={fmtCurrency(totalGross)}
              sub={`${distributions.length} distribution${distributions.length !== 1 ? "s" : ""}`}
              gradient="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100"
              icon={TrendingDown}
            />
            <KpiCard
              label="GP Carry"
              value={fmtCurrency(totalCarry)}
              gradient="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
              icon={Percent}
            />
            <KpiCard
              label="Net to LPs"
              value={fmtCurrency(totalNet)}
              gradient="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
              icon={DollarSign}
            />
            <KpiCard
              label="Carry Rate"
              value={fmtPct(policy?.carryRate)}
              sub={policy?.waterfallType ? policy.waterfallType.charAt(0) + policy.waterfallType.slice(1).toLowerCase() + " waterfall" : undefined}
              gradient="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100"
              icon={CalendarDays}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Distribution History</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-1.5"
                onClick={loadDistributions}
                disabled={distsLoading || !selectedFund}
              >
                <RefreshCw className={`w-4 h-4 ${distsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="rounded-full gap-1.5 gradient-primary text-white"
                onClick={() => setDeclareModalOpen(true)}
                disabled={!selectedFund}
              >
                <Plus className="w-4 h-4" />
                Declare Distribution
              </Button>
            </div>
          </div>

          {/* Distributions list */}
          {distsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : distributions.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm text-muted-foreground">No distributions declared yet.</p>
              <p className="text-xs text-muted-foreground">Click &ldquo;Declare Distribution&rdquo; to pay out LPs after carry.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {distributions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedDistId(d.id); setDistDrawerOpen(true) }}
                  className="w-full text-left rounded-2xl border bg-card hover:bg-muted/30 transition-colors p-4 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {SOURCE_LABELS[d.source] || d.source} · {fmtDate(d.distributionDate)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(d._count?.allocations ?? d.allocations?.length ?? 0)} LP{(d._count?.allocations ?? d.allocations?.length ?? 0) !== 1 ? "s" : ""} ·
                          Net: {fmtCurrency(d.netToLPs, d.currency?.symbol || "$")} ·
                          Carry: {fmtCurrency(d.carryAmount, d.currency?.symbol || "$")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {fmtCurrency(d.grossAmount, d.currency?.symbol || "$")}
                        </p>
                        <p className="text-xs text-muted-foreground">{d.currency?.code || ""} gross</p>
                      </div>
                      <Badge className={`text-xs rounded-full ${distStatusBadge(d.status)}`}>
                        {d.statusLabel}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals & Drawers ── */}

      <FeePolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        fundId={selectedFund?.id || ""}
        fundName={selectedFund?.name || ""}
        policy={policy}
        onSaved={(p) => { setPolicy(p); setPolicyModalOpen(false) }}
      />

      <AccrueFeeModal
        isOpen={accrueModalOpen}
        onClose={() => setAccrueModalOpen(false)}
        fundId={selectedFund?.id || ""}
        fundName={selectedFund?.name || ""}
        onAccrued={(period) => {
          setFeePeriods((prev) => [period, ...prev])
          setSelectedPeriodId(period.id)
          setPeriodDrawerOpen(true)
        }}
      />

      <FeePeriodDrawer
        isOpen={periodDrawerOpen}
        onClose={() => setPeriodDrawerOpen(false)}
        fundId={selectedFund?.id || ""}
        periodId={selectedPeriodId}
        onUpdated={loadFeePeriods}
      />

      <DeclareDistributionModal
        isOpen={declareModalOpen}
        onClose={() => setDeclareModalOpen(false)}
        fundId={selectedFund?.id || ""}
        fundName={selectedFund?.name || ""}
        onDeclared={(dist) => {
          setDistributions((prev) => [dist, ...prev])
          setSelectedDistId(dist.id)
          setDistDrawerOpen(true)
        }}
      />

      <DistributionDrawer
        isOpen={distDrawerOpen}
        onClose={() => setDistDrawerOpen(false)}
        fundId={selectedFund?.id || ""}
        distributionId={selectedDistId}
        onUpdated={loadDistributions}
      />
    </div>
  )
}
