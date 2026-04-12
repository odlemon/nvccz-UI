"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { fetchRateHistory, fetchAccruals, fetchAuditTrail, fetchSTIInstruments } from "@/lib/store/slices/shortTermInvestmentsSlice"
import { fetchSTIDashboard } from "@/lib/store/slices/shortTermInvestmentsSlice"
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
  Clock,
  FileText,
  Shield,
  Plus,
  Ban,
  CheckCircle,
  Trash2,
  Edit2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { STIInstrument } from "@/lib/api/short-term-investments-api"
import {
  addRate,
  voidInstrument,
  approveAccruals,
  deleteInstrument,
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
  const stiState = useSelector((state: RootState) => state.shortTermInvestments)
  const rateHistory = stiState?.rateHistory ?? []
  const rateHistoryLoading = stiState?.rateHistoryLoading ?? false
  const accruals = stiState?.accruals ?? []
  const accrualsLoading = stiState?.accrualsLoading ?? false
  const auditTrail = stiState?.auditTrail ?? []
  const auditTrailLoading = stiState?.auditTrailLoading ?? false

  const [tab, setTab] = useState<DetailTab>("details")
  const [showAddRate, setShowAddRate] = useState(false)
  const [newApy, setNewApy] = useState("")
  const [newEffectiveDate, setNewEffectiveDate] = useState<Date | undefined>(undefined)
  const [addingRate, setAddingRate] = useState(false)
  const [isLiquidateOpen, setIsLiquidateOpen] = useState(false)

  useEffect(() => {
    if (open && instrument) {
      dispatch(fetchRateHistory(instrument.id))
      dispatch(fetchAccruals(instrument.id))
      dispatch(fetchAuditTrail(instrument.id))
    }
  }, [open, instrument, dispatch])

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const refreshAll = () => {
    dispatch(fetchSTIInstruments())
    dispatch(fetchSTIDashboard({}))
  }

  const handleAddRate = async () => {
    if (!newApy || !newEffectiveDate) {
      toast.error("Please fill in APY and effective date")
      return
    }
    setAddingRate(true)
    try {
      await addRate(instrument.id, { apy: parseFloat(newApy), effectiveFromIso: format(newEffectiveDate, "yyyy-MM-dd") })
      toast.success("Rate added successfully")
      dispatch(fetchRateHistory(instrument.id))
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

  const handleApproveAccruals = async () => {
    try {
      await approveAccruals(instrument.id)
      toast.success("Accruals approved successfully")
      dispatch(fetchAccruals(instrument.id))
      refreshAll()
    } catch (e: any) {
      toast.error("Failed to approve accruals", { description: extractErrorMessage(e) })
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

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: "details", label: "Details", icon: FileText },
    { id: "rates", label: "Rates", icon: TrendingUp },
    { id: "accruals", label: "Accruals", icon: DollarSign },
    { id: "audit", label: "Audit", icon: Shield },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-semibold">{instrument.name}</SheetTitle>
                <SheetDescription className="text-xs mt-1">
                  {instrument.category} &middot; {instrument.broker}
                </SheetDescription>
              </div>
              {getStatusBadge(instrument.status)}
            </div>

            {instrument.capitalErosion && (
              <Badge className="bg-red-50 text-red-600 border-red-200 rounded-full text-xs px-3 w-fit mt-2" variant="outline">
                Capital Erosion Instrument
              </Badge>
            )}

            {/* Action Buttons */}
            {instrument.status === "ACTIVE" && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" className="rounded-full h-8 text-xs gap-1.5 bg-[#4f77ff] hover:bg-[#4f77ff]/90" onClick={() => setIsLiquidateOpen(true)}>
                  <DollarSign className="w-3.5 h-3.5" /> Liquidate
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 text-xs gap-1.5" onClick={handleApproveAccruals}>
                  <CheckCircle className="w-3.5 h-3.5" /> Approve Accruals
                </Button>
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
                  <p className="text-lg font-semibold mt-0.5">{instrument.currency.code} {formatCurrency(instrument.principal)}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Settlement Bank</p>
                  <p className="text-sm font-semibold mt-0.5">{instrument.settlementBank.name}</p>
                  <p className="text-[10px] text-muted-foreground">{instrument.settlementBank.accountNumber}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Investment Parameters</h4>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <DetailRow label="Compounding Method" value={instrument.compoundingMethod.replace(/_/g, " ")} />
                  <DetailRow label="Day Count Convention" value={instrument.dayCountConvention.replace(/_/g, "/")} />
                  <DetailRow label="Start Date" value={format(new Date(instrument.startDate), "MMM dd, yyyy")} />
                  <DetailRow label="Maturity Date" value={format(new Date(instrument.maturityDate), "MMM dd, yyyy")} />
                  <DetailRow label="Currency" value={instrument.currency.code} />
                  <DetailRow label="Day Count Locked" value={instrument.dayCountLocked ? "Yes" : "No"} />
                </div>
              </div>

              <Separator />

              {instrument.status === "SETTLED" && instrument.liquidationDate && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settlement Details</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-xs">
                    <DetailRow label="Liquidation Date" value={format(new Date(instrument.liquidationDate), "MMM dd, yyyy")} />
                    <DetailRow label="Cash Received" value={instrument.liquidationCashReceived ? formatCurrency(instrument.liquidationCashReceived) : "—"} />
                    {instrument.carryingFunctionalAtSettlement && (
                      <DetailRow label="Carrying Value (Functional)" value={formatCurrency(instrument.carryingFunctionalAtSettlement)} />
                    )}
                  </div>
                </div>
              )}

              {instrument.status === "VOIDED" && instrument.voidedAt && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-600">Voided on {format(new Date(instrument.voidedAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Record Info</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <DetailRow label="Created" value={format(new Date(instrument.createdAt), "MMM dd, yyyy HH:mm")} />
                  <DetailRow label="Updated" value={format(new Date(instrument.updatedAt), "MMM dd, yyyy HH:mm")} />
                </div>
              </div>
            </div>
          )}

          {/* Rate History Tab */}
          {tab === "rates" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Effective-Dated Rate Table</h4>
                {instrument.status === "ACTIVE" && (
                  <Button variant="outline" size="sm" className="rounded-full h-7 text-[10px] gap-1" onClick={() => setShowAddRate(!showAddRate)}>
                    <Plus className="w-3 h-3" /> Add Rate
                  </Button>
                )}
              </div>

              {showAddRate && (
                <Card className="border border-blue-200 bg-blue-50/50 shadow-none">
                  <CardContent className="p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">New APY</Label>
                        <Input type="number" step="0.001" value={newApy} onChange={(e) => setNewApy(e.target.value)} placeholder="e.g. 0.06" className="rounded-full h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium">Effective From</Label>
                        <DatePicker value={newEffectiveDate} onChange={setNewEffectiveDate} placeholder="Pick date" allowFutureDates className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-full" onClick={() => setShowAddRate(false)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-[10px] rounded-full bg-[#4f77ff]" onClick={handleAddRate} disabled={addingRate}>
                        {addingRate ? "Saving..." : "Save Rate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {rateHistoryLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : rateHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No rate history found</p>
              ) : (
                <div className="space-y-2">
                  {rateHistory.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                      <div>
                        <p className="font-medium">APY: {(Number(rate.apy) * 100).toFixed(3)}%</p>
                        <p className="text-muted-foreground mt-0.5">Effective from {format(new Date(rate.effectiveFrom), "MMM dd, yyyy")}</p>
                      </div>
                      <p className="text-muted-foreground">{format(new Date(rate.createdAt), "MMM dd, yy HH:mm")}</p>
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
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Accruals</h4>
                {instrument.status === "ACTIVE" && (
                  <Button variant="outline" size="sm" className="rounded-full h-7 text-[10px] gap-1" onClick={handleApproveAccruals}>
                    <CheckCircle className="w-3 h-3" /> Approve All
                  </Button>
                )}
              </div>

              {accrualsLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : accruals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No accruals found</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left font-medium text-muted-foreground py-2 px-3">Date</th>
                        <th className="text-right font-medium text-muted-foreground py-2 px-3">Amount</th>
                        <th className="text-center font-medium text-muted-foreground py-2 px-3">Journal Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accruals.map((acc, index) => (
                        <tr key={acc.id} className={`border-b ${index % 2 !== 0 ? "bg-muted/20" : ""}`}>
                          <td className="py-2 px-3">{format(new Date(acc.accrualDate), "MMM dd, yyyy")}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            <span className={parseFloat(acc.amount) < 0 ? "text-red-600" : "text-emerald-600"}>
                              {formatCurrency(acc.amount)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge
                              variant="outline"
                              className={`rounded-full text-[9px] px-2 ${
                                acc.journalStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : acc.journalStatus === "DRAFT" ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {acc.journalStatus || "Pending"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail Tab */}
          {tab === "audit" && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Immutable Audit Trail</h4>
              {auditTrailLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
              ) : auditTrail.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No audit trail entries</p>
              ) : (
                <div className="space-y-2">
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="p-3 bg-gray-50 rounded-lg text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="rounded-full text-[9px] px-2">{entry.field}</Badge>
                        <span className="text-muted-foreground">{format(new Date(entry.changedAt), "MMM dd, yyyy HH:mm")}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-red-600 line-through">{entry.oldValue || "—"}</span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="text-emerald-600 font-medium">{entry.newValue}</span>
                      </div>
                    </div>
                  ))}
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
