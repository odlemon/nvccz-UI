"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/lib/store/store"
import { fetchSTIInstruments, fetchSTIDashboard } from "@/lib/store/slices/shortTermInvestmentsSlice"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePicker } from "@/components/ui/date-picker"
import {
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Shield,
  Plus,
  Ban,
  CheckCircle,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type {
  STIInstrument,
  STIInstrumentDetail,
  AccrualEntry,
  AuditTrailEntry,
} from "@/lib/api/short-term-investments-api"
import {
  addRate,
  voidInstrument,
  approveAllAccruals,
  approveAccrual,
  deleteInstrument,
  getInstrument,
  extractErrorMessage,
} from "@/lib/api/short-term-investments-api"
import { LiquidateInstrumentModal } from "./liquidate-instrument-modal"

interface InstrumentViewDrawerProps {
  instrument: STIInstrument
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DetailTab = "details" | "rates" | "accruals" | "audit"

export function InstrumentViewDrawer({ instrument, open, onOpenChange }: InstrumentViewDrawerProps) {
  const dispatch = useDispatch<AppDispatch>()

  const [tab, setTab] = useState<DetailTab>("details")
  const [detail, setDetail] = useState<STIInstrumentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showAddRate, setShowAddRate] = useState(false)
  const [newApy, setNewApy] = useState("")
  const [newEffectiveDate, setNewEffectiveDate] = useState<Date | undefined>(undefined)
  const [addingRate, setAddingRate] = useState(false)
  const [isLiquidateOpen, setIsLiquidateOpen] = useState(false)
  const [approvingAccrualId, setApprovingAccrualId] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!instrument?.id) return
    setDetailLoading(true)
    try {
      const res = await getInstrument(instrument.id)
      setDetail(res.data)
    } catch (e: any) {
      toast.error("Failed to load instrument detail", { description: extractErrorMessage(e) })
    } finally {
      setDetailLoading(false)
    }
  }, [instrument?.id])

  useEffect(() => {
    if (open && instrument?.id) {
      setTab("details")
      loadDetail()
    }
  }, [open, instrument?.id, loadDetail])

  const refreshAll = () => {
    dispatch(fetchSTIInstruments())
    dispatch(fetchSTIDashboard({}))
  }

  // Use detail where available, fall back to the light instrument row from the list
  const src: STIInstrument | STIInstrumentDetail = detail || instrument
  const accruals: AccrualEntry[] = detail?.accruals ?? []
  const apyRates = detail?.apyRates ?? []
  const auditLogs: AuditTrailEntry[] = detail?.auditLogs ?? []
  const currencyCode = detail?.currency?.code || instrument.currency?.code || ""
  const currencySymbol = (detail?.currency as any)?.symbol || ""

  const pendingAccruals = accruals.filter((a) => a.status === "PENDING_POST")

  const fmtAmount = (amount: string | number | null | undefined) => {
    if (amount === null || amount === undefined) return "—"
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    if (!Number.isFinite(num)) return "—"
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  const handleAddRate = async () => {
    if (!newApy || !newEffectiveDate) {
      toast.error("Please fill in APY and effective date")
      return
    }
    setAddingRate(true)
    try {
      const apy = parseFloat(newApy)
      const normalized = Math.abs(apy) > 1 ? apy / 100 : apy
      await addRate(instrument.id, { apy: normalized, effectiveFromIso: format(newEffectiveDate, "yyyy-MM-dd") })
      toast.success("Rate added successfully")
      await loadDetail()
      setShowAddRate(false)
      setNewApy("")
      setNewEffectiveDate(undefined)
    } catch (e: any) {
      toast.error("Failed to add rate", { description: extractErrorMessage(e) })
    } finally {
      setAddingRate(false)
    }
  }

  const handleVoid = async () => {
    try {
      await voidInstrument(instrument.id)
      toast.success(`"${instrument.name}" has been voided`)
      refreshAll()
      onOpenChange(false)
    } catch (e: any) {
      toast.error("Failed to void instrument", { description: extractErrorMessage(e) })
    }
  }

  const handleApproveAll = async () => {
    if (!pendingAccruals.length) {
      toast.info("No pending accruals to approve")
      return
    }
    setApprovingAll(true)
    try {
      const res = await approveAllAccruals(instrument.id)
      const data: any = res?.data || {}
      toast.success("Accruals approved", {
        description: `Approved ${data.approved ?? pendingAccruals.length} of ${data.pendingFound ?? pendingAccruals.length}` +
          (data.skipped ? ` · skipped ${data.skipped}` : "") +
          (data.failures?.length ? ` · ${data.failures.length} error(s)` : ""),
      })
      await loadDetail()
      refreshAll()
    } catch (e: any) {
      toast.error("Failed to approve all accruals", { description: extractErrorMessage(e) })
    } finally {
      setApprovingAll(false)
    }
  }

  const handleApproveOne = async (accrualId: string) => {
    setApprovingAccrualId(accrualId)
    try {
      await approveAccrual(accrualId)
      toast.success("Accrual approved")
      await loadDetail()
      refreshAll()
    } catch (e: any) {
      toast.error("Failed to approve accrual", { description: extractErrorMessage(e) })
    } finally {
      setApprovingAccrualId(null)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteInstrument(instrument.id)
      toast.success(`"${instrument.name}" has been deleted`)
      refreshAll()
      onOpenChange(false)
    } catch (e: any) {
      toast.error("Failed to delete instrument", { description: extractErrorMessage(e) })
    }
  }

  const handleLiquidated = () => {
    setIsLiquidateOpen(false)
    refreshAll()
    onOpenChange(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full px-3" variant="outline">Active</Badge>
      case "SETTLED": return <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-full px-3" variant="outline">Settled</Badge>
      case "VOIDED": return <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-3" variant="outline">Voided</Badge>
      default: return <Badge variant="outline" className="rounded-full px-3">{status}</Badge>
    }
  }

  const accrualStatusBadge = (status?: string) => {
    switch (status) {
      case "POSTED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full text-[10px] px-2" variant="outline">Posted</Badge>
      case "PENDING_POST":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-full text-[10px] px-2" variant="outline">Pending</Badge>
      case "SKIPPED":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full text-[10px] px-2" variant="outline">Skipped</Badge>
      case "VOIDED":
        return <Badge className="bg-red-50 text-red-700 border-red-200 rounded-full text-[10px] px-2" variant="outline">Voided</Badge>
      default:
        return <Badge variant="outline" className="rounded-full text-[10px] px-2">{status || "—"}</Badge>
    }
  }

  const auditActionLabel = (entry: AuditTrailEntry) => {
    // Prefer detail shape (action + entityType); fall back to legacy field.
    if (entry.action) {
      const action = entry.action.replace(/_/g, " ")
      return entry.entityType
        ? `${action} · ${entry.entityType.replace(/([A-Z])/g, " $1").trim()}`
        : action
    }
    return entry.field || "Change"
  }

  const latestApy = apyRates[0]?.apy ?? (accruals[0]?.apyRate?.apy ?? null)

  const tabs: { id: DetailTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "details", label: "Details", icon: FileText },
    { id: "rates", label: "Rates", icon: TrendingUp, count: apyRates.length },
    { id: "accruals", label: "Accruals", icon: DollarSign, count: accruals.length },
    { id: "audit", label: "Audit", icon: Shield, count: auditLogs.length },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-lg font-semibold truncate">{src.name}</SheetTitle>
                <SheetDescription className="text-xs mt-1">
                  {src.category} &middot; {src.broker}
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {detailLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                {getStatusBadge(src.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full"
                  onClick={() => loadDetail()}
                  disabled={detailLoading}
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${detailLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {src.capitalErosion && (
                <Badge className="bg-red-50 text-red-600 border-red-200 rounded-full text-xs px-3" variant="outline">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Capital Erosion
                </Badge>
              )}
              {pendingAccruals.length > 0 && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 rounded-full text-xs px-3" variant="outline">
                  <Clock className="w-3 h-3 mr-1" /> {pendingAccruals.length} pending accrual{pendingAccruals.length > 1 ? "s" : ""}
                </Badge>
              )}
              {latestApy !== null && (
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 rounded-full text-xs px-3" variant="outline">
                  APY: {(Number(latestApy) * 100).toFixed(3)}%
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            {src.status === "ACTIVE" && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="gradient-info" className="rounded-full h-8 text-xs gap-1.5" onClick={() => setIsLiquidateOpen(true)}>
                  <DollarSign className="w-3.5 h-3.5" /> Liquidate
                </Button>
                {pendingAccruals.length > 0 && (
                  <Button size="sm" variant="gradient-create" className="rounded-full h-8 text-xs gap-1.5" onClick={handleApproveAll} disabled={approvingAll}>
                    {approvingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Approve all ({pendingAccruals.length})
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleVoid}>
                  <Ban className="w-3.5 h-3.5" /> Void
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            )}
          </SheetHeader>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
                    tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-muted-foreground hover:text-gray-700"
                  }`}
                  onClick={() => setTab(t.id)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {typeof t.count === "number" && t.count > 0 && (
                    <span className="text-[9px] px-1.5 py-0 rounded-full bg-gray-200 text-gray-700">{t.count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Details Tab */}
          {tab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Principal</p>
                  <p className="text-lg font-semibold mt-0.5">
                    {currencySymbol || currencyCode} {fmtAmount(src.principal)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Settlement Bank</p>
                  <p className="text-sm font-semibold mt-0.5 truncate">{src.settlementBank?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{src.settlementBank?.accountNumber}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Investment parameters</h4>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <DetailRow label="Compounding" value={src.compoundingMethod.replace(/_/g, " ").toLowerCase()} />
                  <DetailRow label="Day-count rule" value={src.dayCountConvention.replace(/_/g, "/")} />
                  <DetailRow label="Start date" value={format(new Date(src.startDate), "MMM dd, yyyy")} />
                  <DetailRow label="Maturity date" value={format(new Date(src.maturityDate), "MMM dd, yyyy")} />
                  <DetailRow label="Investment currency" value={currencyCode} />
                  <DetailRow
                    label="Reporting currency"
                    value={detail?.functionalCurrency?.code || "Same as investment"}
                  />
                  <DetailRow label="Day-count locked" value={src.dayCountLocked ? "Yes" : "No"} />
                  {latestApy !== null && (
                    <DetailRow label="Current APY" value={`${(Number(latestApy) * 100).toFixed(3)}%`} />
                  )}
                </div>
              </div>

              {src.status === "SETTLED" && src.liquidationDate && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settlement details</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                      <DetailRow label="Liquidation date" value={format(new Date(src.liquidationDate), "MMM dd, yyyy")} />
                      <DetailRow label="Cash received" value={src.liquidationCashReceived ? fmtAmount(src.liquidationCashReceived) : "—"} />
                      {src.carryingFunctionalAtSettlement && (
                        <DetailRow label="Carrying value (reporting)" value={fmtAmount(src.carryingFunctionalAtSettlement)} />
                      )}
                    </div>
                  </div>
                </>
              )}

              {src.status === "VOIDED" && src.voidedAt && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-600">Voided on {format(new Date(src.voidedAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Record info</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <DetailRow label="Created" value={format(new Date(src.createdAt), "MMM dd, yyyy HH:mm")} />
                  <DetailRow label="Updated" value={format(new Date(src.updatedAt), "MMM dd, yyyy HH:mm")} />
                </div>
              </div>
            </div>
          )}

          {/* Rates Tab */}
          {tab === "rates" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Effective-dated APY history</h4>
                {src.status === "ACTIVE" && (
                  <Button variant="outline" size="sm" className="rounded-full h-7 text-[10px] gap-1" onClick={() => setShowAddRate(!showAddRate)}>
                    <Plus className="w-3 h-3" /> Add rate
                  </Button>
                )}
              </div>

              {showAddRate && (
                <Card className="border border-blue-200 bg-blue-50/50 shadow-none">
                  <CardContent className="p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">New APY</Label>
                        <Input type="number" step="0.001" value={newApy} onChange={(e) => setNewApy(e.target.value)} placeholder="5 or 0.05" className="rounded-full h-8 text-xs" />
                        <p className="text-[9px] text-muted-foreground">Enter 5 for 5%, or 0.05 for 5%.</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">Effective from</Label>
                        <DatePicker value={newEffectiveDate} onChange={setNewEffectiveDate} placeholder="Pick date" allowFutureDates className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full" onClick={() => setShowAddRate(false)}>Cancel</Button>
                      <Button size="sm" variant="gradient-update" className="h-7 text-[10px] rounded-full" onClick={handleAddRate} disabled={addingRate}>
                        {addingRate ? "Saving..." : "Save rate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {detailLoading && apyRates.length === 0 ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : apyRates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No APY history.</p>
              ) : (
                <div className="space-y-2">
                  {apyRates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                      <div>
                        <p className="font-semibold">APY: {(Number(rate.apy) * 100).toFixed(3)}%</p>
                        <p className="text-muted-foreground mt-0.5">
                          Effective from {format(new Date(rate.effectiveFrom), "MMM dd, yyyy")}
                          {rate.effectiveTo ? ` to ${format(new Date(rate.effectiveTo), "MMM dd, yyyy")}` : " (current)"}
                        </p>
                      </div>
                      {rate.createdAt && (
                        <p className="text-muted-foreground">{format(new Date(rate.createdAt), "MMM dd, yy HH:mm")}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accruals Tab */}
          {tab === "accruals" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Daily accruals{accruals.length ? ` · ${accruals.length}` : ""}
                </h4>
                {src.status === "ACTIVE" && pendingAccruals.length > 0 && (
                  <Button
                    size="sm"
                    variant="gradient-create"
                    className="rounded-full h-7 text-[10px] gap-1 shadow-sm"
                    onClick={handleApproveAll}
                    disabled={approvingAll}
                  >
                    {approvingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Approve all ({pendingAccruals.length})
                  </Button>
                )}
              </div>

              {detailLoading && accruals.length === 0 ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : accruals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No accruals yet.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground py-2 px-3">Date</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3">Amount</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3">Running balance</th>
                        <th className="text-center font-medium text-muted-foreground py-2 px-3">Status</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accruals.map((acc, index) => {
                        const amount = acc.amountInstrumentCcy ?? acc.amount ?? "0"
                        const running = acc.runningAccruedBalance
                        const isNegative = parseFloat(amount) < 0
                        const isPending = acc.status === "PENDING_POST"
                        return (
                          <tr key={acc.id} className={`border-b ${index % 2 !== 0 ? "bg-muted/20" : ""}`}>
                            <td className="py-2 px-3">{format(new Date(acc.accrualDate), "MMM dd, yyyy")}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className={isNegative ? "text-red-600" : "text-emerald-600"}>
                                {fmtAmount(amount)}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                              {running !== undefined ? fmtAmount(running) : "—"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {accrualStatusBadge(acc.status || acc.journalStatus || undefined)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {isPending && src.status === "ACTIVE" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 rounded-full text-[10px] px-2 gap-1"
                                  onClick={() => handleApproveOne(acc.id)}
                                  disabled={approvingAccrualId === acc.id || approvingAll}
                                >
                                  {approvingAccrualId === acc.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Approve
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Audit Tab */}
          {tab === "audit" && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audit trail</h4>
              {detailLoading && auditLogs.length === 0 ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
              ) : auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No audit entries.</p>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((entry) => {
                    const when = entry.createdAt || entry.changedAt
                    const who = entry.user
                      ? `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.trim() || entry.user.email
                      : ""
                    return (
                      <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="rounded-full text-[9px] px-2">
                            {auditActionLabel(entry)}
                          </Badge>
                          {when && (
                            <span className="text-muted-foreground">{format(new Date(when), "MMM dd, yyyy HH:mm")}</span>
                          )}
                        </div>
                        {who && <p className="text-[11px] text-gray-700 mb-1">{who}</p>}
                        {entry.newValues && typeof entry.newValues === "object" ? (
                          <pre className="text-[10px] bg-white border rounded p-2 overflow-x-auto max-h-28">
                            {JSON.stringify(entry.newValues, null, 2)}
                          </pre>
                        ) : entry.field ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-red-600 line-through">{entry.oldValue || "—"}</span>
                            <span className="text-muted-foreground">&rarr;</span>
                            <span className="text-emerald-600 font-medium">{String(entry.newValue ?? "")}</span>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Liquidate Modal */}
      <LiquidateInstrumentModal
        instrument={instrument}
        open={isLiquidateOpen}
        onOpenChange={setIsLiquidateOpen}
        onLiquidated={handleLiquidated}
      />
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  )
}
