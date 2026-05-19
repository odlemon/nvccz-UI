"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Send,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react"
import { lpFeesApi, type ManagementFeePeriod, type FeeAllocation } from "@/lib/api/lp-fees-distributions-api"
import { toast } from "sonner"

function fmtCurrency(val: string | number, symbol = "$") {
  const n = Number(val)
  if (isNaN(n)) return "—"
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtPct(rate: string | number | null | undefined) {
  if (rate == null) return "—"
  return `${(Number(rate) * 100).toFixed(4).replace(/\.?0+$/, "")}%`
}

function statusBadge(status: string) {
  switch (status) {
    case "ACCRUED": return "bg-blue-100 text-blue-700"
    case "INVOICED": return "bg-indigo-100 text-indigo-700"
    case "PARTIALLY_PAID": return "bg-amber-100 text-amber-700"
    case "PAID": return "bg-emerald-100 text-emerald-700"
    case "PENDING": return "bg-gray-100 text-gray-600"
    default: return "bg-gray-100 text-gray-700"
  }
}

function allocationStatusIcon(status: string) {
  if (status === "PAID") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (status === "PARTIALLY_PAID") return <AlertCircle className="w-4 h-4 text-amber-500" />
  return <Clock className="w-4 h-4 text-gray-400" />
}

// ── Record Payment sub-modal ───────────────────────────────────────────

interface RecordFeePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  periodId: string
  allocation: FeeAllocation
  symbol: string
  currencyCode: string
  onRecorded: (updated: ManagementFeePeriod) => void
}

function RecordFeePaymentModal({
  isOpen, onClose, fundId, periodId, allocation, symbol, currencyCode, onRecorded,
}: RecordFeePaymentModalProps) {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const remaining = Number(allocation.shareOfFee) - Number(allocation.amountPaid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount)
    if (!amount || isNaN(num) || num <= 0) { setError("Enter a valid amount greater than 0"); return }
    if (num > remaining + 0.001) { setError(`Amount exceeds remaining ${fmtCurrency(remaining, symbol)}`); return }
    try {
      setSubmitting(true)
      const res = await lpFeesApi.recordFeePayment(fundId, periodId, allocation.id, { amount: num })
      toast.success(res.message || "Payment recorded")
      setAmount(""); setError("")
      onRecorded(res.data)
      onClose()
    } catch (e: any) {
      toast.error("Failed to record payment", { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !submitting) { setAmount(""); setError(""); onClose() } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Record Payment</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{allocation.lpLegalNameSnapshot}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-2 rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee Due</span>
            <span className="font-medium">{fmtCurrency(allocation.shareOfFee, symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-medium text-emerald-600">{fmtCurrency(allocation.amountPaid, symbol)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Remaining</span>
            <span className="font-semibold text-amber-600">{fmtCurrency(remaining, symbol)}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Payment Amount ({currencyCode}) *</Label>
            <Input
              type="number" step="0.01" min="0.01" max={remaining}
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={`e.g. ${remaining.toFixed(2)}`} className="rounded-full"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {remaining > 0 && (
              <Button type="button" variant="outline" size="sm" className="rounded-full text-xs"
                onClick={() => setAmount(remaining.toFixed(2))}>
                Full: {fmtCurrency(remaining, symbol)}
              </Button>
            )}
            {remaining > 0 && (
              <Button type="button" variant="outline" size="sm" className="rounded-full text-xs"
                onClick={() => setAmount((remaining / 2).toFixed(2))}>
                Half: {fmtCurrency(remaining / 2, symbol)}
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => { setAmount(""); setError(""); onClose() }} disabled={submitting}>Cancel</Button>
            <Button type="submit" className="rounded-full gap-1.5 gradient-primary text-white" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Drawer ────────────────────────────────────────────────────────

interface FeePeriodDrawerProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  periodId: string | null
  onUpdated: () => void
}

export function FeePeriodDrawer({ isOpen, onClose, fundId, periodId, onUpdated }: FeePeriodDrawerProps) {
  const [period, setPeriod] = useState<ManagementFeePeriod | null>(null)
  const [loading, setLoading] = useState(false)
  const [sendingInvoices, setSendingInvoices] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [expandedAllocs, setExpandedAllocs] = useState<Set<string>>(new Set())
  const [paymentTarget, setPaymentTarget] = useState<FeeAllocation | null>(null)

  const load = useCallback(async () => {
    if (!fundId || !periodId) return
    try {
      setLoading(true)
      const res = await lpFeesApi.getFeePeriod(fundId, periodId)
      setPeriod(res.data)
    } catch (e: any) {
      toast.error("Failed to load fee period", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }, [fundId, periodId])

  useEffect(() => {
    if (isOpen && periodId) load()
  }, [isOpen, periodId, load])

  const handleSendInvoices = async () => {
    if (!period) return
    try {
      setSendingInvoices(true)
      const res = await lpFeesApi.sendInvoices(fundId, period.id)
      toast.success(res.message || "Invoices sent successfully")
      load()
      onUpdated()
    } catch (e: any) {
      toast.error("Failed to send invoices", { description: e?.message })
    } finally {
      setSendingInvoices(false)
      setConfirmSend(false)
    }
  }

  const symbol = period?.currency?.symbol || "$"
  const code = period?.currency?.code || ""
  const allocations = period?.allocations || []
  const totalPaid = allocations.reduce((s, a) => s + Number(a.amountPaid), 0)
  const totalFee = Number(period?.totalFee || 0)
  const paidPct = totalFee > 0 ? Math.min(100, (totalPaid / totalFee) * 100) : 0

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-base">Management Fee Period</SheetTitle>
                {period && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {fmtDate(period.periodStart)} – {fmtDate(period.periodEnd)}
                  </p>
                )}
              </div>
              {period && (
                <Badge className={`text-xs rounded-full ${statusBadge(period.status)}`}>
                  {period.statusLabel}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && period && (
            <div className="mt-4 space-y-5">
              {/* Header summary */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Fee</p>
                    <p className="text-lg font-bold text-foreground">{fmtCurrency(period.totalFee, symbol)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collected</p>
                    <p className="text-lg font-bold text-emerald-600">{fmtCurrency(totalPaid, symbol)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="text-lg font-bold text-amber-600">{fmtCurrency(totalFee - totalPaid, symbol)}</p>
                  </div>
                </div>
                <Progress value={paidPct} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">{paidPct.toFixed(1)}% collected</p>
              </div>

              {/* Period info */}
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="bg-primary px-5 py-3">
                  <h3 className="text-sm font-semibold text-primary-foreground">Period Details</h3>
                </div>
                <div className="px-5 py-1 divide-y divide-border text-sm">
                  {[
                    ["Fee Base", period.feeBase],
                    ["Base Amount", fmtCurrency(period.feeBaseAmount, symbol)],
                    ["Annual Rate", fmtPct(period.rate)],
                    ["LPs Billed", String(period._count?.allocations ?? allocations.length)],
                    ["Invoices Sent", period.invoicesSentAt ? fmtDate(period.invoicesSentAt) : "Not sent"],
                    ["Journal Entry", period.journalEntry?.referenceNumber || period.journalEntryId || "—"],
                    ["GL Date", period.journalEntry?.transactionDate ? fmtDate(period.journalEntry.transactionDate) : "—"],
                    ["Notes", period.notes || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2.5">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-right max-w-[200px] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  onClick={() => setConfirmSend(true)}
                  disabled={sendingInvoices}
                >
                  {sendingInvoices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {period.status === "ACCRUED" ? "Send Invoices" : "Re-send Invoices"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={load}>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>

              {/* Allocations table */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">LP Allocations</h3>
                <div className="space-y-2">
                  {allocations.map((alloc) => {
                    const rem = Number(alloc.shareOfFee) - Number(alloc.amountPaid)
                    const paid = Number(alloc.amountPaid)
                    const share = Number(alloc.shareOfFee)
                    const pct = share > 0 ? Math.min(100, (paid / share) * 100) : 0
                    const expanded = expandedAllocs.has(alloc.id)

                    return (
                      <div key={alloc.id} className="rounded-xl border bg-card overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {allocationStatusIcon(alloc.status)}
                              <div>
                                <p className="text-sm font-medium">{alloc.lpLegalNameSnapshot}</p>
                                <p className="text-xs text-muted-foreground">{alloc.client?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs rounded-full ${statusBadge(alloc.status)}`}>
                                {alloc.statusLabel}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setExpandedAllocs((s) => {
                                  const ns = new Set(s)
                                  ns.has(alloc.id) ? ns.delete(alloc.id) : ns.add(alloc.id)
                                  return ns
                                })}
                              >
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Fee Due</p>
                              <p className="font-medium">{fmtCurrency(alloc.shareOfFee, symbol)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paid</p>
                              <p className="font-medium text-emerald-600">{fmtCurrency(alloc.amountPaid, symbol)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Remaining</p>
                              <p className="font-medium text-amber-600">{fmtCurrency(rem, symbol)}</p>
                            </div>
                          </div>
                          <Progress value={pct} className="h-1.5 mt-2" />

                          {alloc.status !== "PAID" && (
                            <Button
                              size="sm"
                              className="mt-3 rounded-full gap-1.5 gradient-primary text-white h-7 text-xs"
                              onClick={() => setPaymentTarget(alloc)}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Record Payment
                            </Button>
                          )}
                        </div>

                        {expanded && alloc.payments.length > 0 && (
                          <div className="border-t bg-muted/30 px-4 py-3 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Payment History
                            </p>
                            {alloc.payments.map((pmt) => (
                              <div key={pmt.id} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{fmtDate(pmt.recordedAt)}</span>
                                <span className="font-medium text-emerald-600">{fmtCurrency(pmt.amount, symbol)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {expanded && alloc.payments.length === 0 && (
                          <div className="border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                            No payments recorded yet
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {allocations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No LP allocations found</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm send invoices */}
      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Fee Invoices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email each LP their management fee invoice. Clicking again will re-send all emails.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendInvoices}>
              {sendingInvoices ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Invoices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Record payment modal */}
      {paymentTarget && period && (
        <RecordFeePaymentModal
          isOpen={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          fundId={fundId}
          periodId={period.id}
          allocation={paymentTarget}
          symbol={symbol}
          currencyCode={code}
          onRecorded={(updated) => {
            setPeriod(updated)
            setPaymentTarget(null)
            onUpdated()
          }}
        />
      )}
    </>
  )
}
