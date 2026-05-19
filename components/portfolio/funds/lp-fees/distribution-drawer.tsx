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
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowDownRight,
} from "lucide-react"
import { lpFeesApi, type Distribution, type DistributionAllocation } from "@/lib/api/lp-fees-distributions-api"
import { toast } from "sonner"

function fmtCurrency(val: string | number | null | undefined, symbol = "$") {
  if (val == null) return "—"
  const n = Number(val)
  if (isNaN(n)) return "—"
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
}

const SOURCE_LABELS: Record<string, string> = {
  DIVIDEND: "Dividend",
  EXIT_PROCEEDS: "Exit Proceeds",
  INTEREST: "Interest",
  OTHER: "Other",
}

function statusBadge(status: string) {
  switch (status) {
    case "DECLARED": return "bg-blue-100 text-blue-700"
    case "NOTICES_SENT": return "bg-indigo-100 text-indigo-700"
    case "PARTIALLY_PAID": return "bg-amber-100 text-amber-700"
    case "PAID": return "bg-emerald-100 text-emerald-700"
    case "PENDING": return "bg-gray-100 text-gray-600"
    default: return "bg-gray-100 text-gray-700"
  }
}

function allocStatusIcon(status: string) {
  if (status === "PAID" || status?.toLowerCase().includes("paid") && !status?.toLowerCase().includes("partial"))
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (status?.toLowerCase().includes("partial"))
    return <AlertCircle className="w-4 h-4 text-amber-500" />
  return <Clock className="w-4 h-4 text-gray-400" />
}

// ── Record Payout sub-modal ────────────────────────────────────────────

interface RecordPayoutModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  distributionId: string
  allocation: DistributionAllocation
  symbol: string
  currencyCode: string
  onRecorded: (updated: Distribution) => void
}

function RecordPayoutModal({
  isOpen, onClose, fundId, distributionId, allocation, symbol, currencyCode, onRecorded,
}: RecordPayoutModalProps) {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const remaining = Number(allocation.shareAmount) - Number(allocation.amountPaid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount)
    if (!amount || isNaN(num) || num <= 0) { setError("Enter a valid amount greater than 0"); return }
    if (num > remaining + 0.001) { setError(`Amount exceeds remaining ${fmtCurrency(remaining, symbol)}`); return }
    try {
      setSubmitting(true)
      const res = await lpFeesApi.recordPayout(fundId, distributionId, allocation.id, { amount: num })
      toast.success(res.message || "Payout recorded")
      setAmount(""); setError("")
      onRecorded(res.data)
      onClose()
    } catch (e: any) {
      toast.error("Failed to record payout", { description: e?.message })
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
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle>Record Payout</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{allocation.lpLegalNameSnapshot}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-2 rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">LP Share</span>
            <span className="font-medium">{fmtCurrency(allocation.shareAmount, symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid Out</span>
            <span className="font-medium text-emerald-600">{fmtCurrency(allocation.amountPaid, symbol)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground font-medium">Remaining</span>
            <span className="font-semibold text-amber-600">{fmtCurrency(remaining, symbol)}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Payout Amount ({currencyCode}) *</Label>
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
              Record Payout
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Drawer ────────────────────────────────────────────────────────

interface DistributionDrawerProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  distributionId: string | null
  onUpdated: () => void
}

export function DistributionDrawer({ isOpen, onClose, fundId, distributionId, onUpdated }: DistributionDrawerProps) {
  const [dist, setDist] = useState<Distribution | null>(null)
  const [loading, setLoading] = useState(false)
  const [sendingNotices, setSendingNotices] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [expandedAllocs, setExpandedAllocs] = useState<Set<string>>(new Set())
  const [payoutTarget, setPayoutTarget] = useState<DistributionAllocation | null>(null)

  const load = useCallback(async () => {
    if (!fundId || !distributionId) return
    try {
      setLoading(true)
      const res = await lpFeesApi.getDistribution(fundId, distributionId)
      setDist(res.data)
    } catch (e: any) {
      toast.error("Failed to load distribution", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }, [fundId, distributionId])

  useEffect(() => {
    if (isOpen && distributionId) load()
  }, [isOpen, distributionId, load])

  const handleSendNotices = async () => {
    if (!dist) return
    try {
      setSendingNotices(true)
      const res = await lpFeesApi.sendNotices(fundId, dist.id)
      toast.success(res.message || "Distribution notices sent")
      load()
      onUpdated()
    } catch (e: any) {
      toast.error("Failed to send notices", { description: e?.message })
    } finally {
      setSendingNotices(false)
      setConfirmSend(false)
    }
  }

  const symbol = dist?.currency?.symbol || "$"
  const code = dist?.currency?.code || ""
  const allocations = dist?.allocations || []
  const totalPaidOut = allocations.reduce((s, a) => s + Number(a.amountPaid), 0)
  const netToLPs = Number(dist?.netToLPs || 0)
  const paidPct = netToLPs > 0 ? Math.min(100, (totalPaidOut / netToLPs) * 100) : 0

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-base">Distribution</SheetTitle>
                {dist && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {SOURCE_LABELS[dist.source] || dist.source} · {fmtDate(dist.distributionDate)}
                  </p>
                )}
              </div>
              {dist && (
                <Badge className={`text-xs rounded-full ${statusBadge(dist.status)}`}>
                  {dist.statusLabel}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && dist && (
            <div className="mt-4 space-y-5">
              {/* Waterfall summary */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Gross Amount</p>
                    <p className="text-base font-bold text-foreground">{fmtCurrency(dist.grossAmount, symbol)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">GP Carry</p>
                    <p className="text-base font-bold text-purple-600">{fmtCurrency(dist.carryAmount, symbol)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net to LPs</p>
                    <p className="text-base font-bold text-emerald-600">{fmtCurrency(dist.netToLPs, symbol)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hurdle Applied</p>
                    <p className="text-base font-bold text-foreground">{fmtCurrency(dist.hurdleAppliedAmount, symbol)}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-100">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Paid Out</span>
                    <span>{fmtCurrency(totalPaidOut, symbol)} / {fmtCurrency(dist.netToLPs, symbol)}</span>
                  </div>
                  <Progress value={paidPct} className="h-2" />
                </div>
              </div>

              {/* Distribution info */}
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="bg-primary px-5 py-3">
                  <h3 className="text-sm font-semibold text-primary-foreground">Distribution Details</h3>
                </div>
                <div className="px-5 py-1 divide-y divide-border text-sm">
                  {[
                    ["Source", SOURCE_LABELS[dist.source] || dist.source],
                    ["Distribution Date", fmtDate(dist.distributionDate)],
                    ["LPs", String(dist._count?.allocations ?? allocations.length)],
                    ["Notices Sent", dist.noticesSentAt ? fmtDate(dist.noticesSentAt) : "Not sent"],
                    ["Journal Entry", dist.journalEntry?.referenceNumber || dist.journalEntryId || "—"],
                    ...(dist.sourceCompany ? [["Source Company", dist.sourceCompany.name] as [string, string]] : []),
                    ["Notes", dist.notes || "—"],
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
                  disabled={sendingNotices}
                >
                  {sendingNotices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {dist.status === "DECLARED" ? "Send Notices" : "Re-send Notices"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full gap-1.5" onClick={load}>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>

              {/* LP Allocations */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">LP Payouts</h3>
                <div className="space-y-2">
                  {allocations.map((alloc) => {
                    const rem = Number(alloc.shareAmount) - Number(alloc.amountPaid)
                    const paid = Number(alloc.amountPaid)
                    const share = Number(alloc.shareAmount)
                    const pct = share > 0 ? Math.min(100, (paid / share) * 100) : 0
                    const expanded = expandedAllocs.has(alloc.id)

                    return (
                      <div key={alloc.id} className="rounded-xl border bg-card overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {allocStatusIcon(alloc.status)}
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
                              <p className="text-xs text-muted-foreground">LP Share</p>
                              <p className="font-medium">{fmtCurrency(alloc.shareAmount, symbol)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paid Out</p>
                              <p className="font-medium text-emerald-600">{fmtCurrency(alloc.amountPaid, symbol)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Remaining</p>
                              <p className="font-medium text-amber-600">{fmtCurrency(rem, symbol)}</p>
                            </div>
                          </div>

                          {alloc.paidInSnapshot && (
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Paid-In: {fmtCurrency(alloc.paidInSnapshot, symbol)} · Commitment: {fmtCurrency(alloc.commitmentSnapshot, symbol)}
                            </p>
                          )}
                          <Progress value={pct} className="h-1.5 mt-2" />

                          {rem > 0.001 && (
                            <Button
                              size="sm"
                              className="mt-3 rounded-full gap-1.5 gradient-primary text-white h-7 text-xs"
                              onClick={() => setPayoutTarget(alloc)}
                            >
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              Record Payout
                            </Button>
                          )}
                        </div>

                        {expanded && alloc.payments.length > 0 && (
                          <div className="border-t bg-muted/30 px-4 py-3 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Payout History
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
                            No payouts recorded yet
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

      {/* Confirm send notices */}
      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Distribution Notices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email each LP their distribution notice with their gross/carry/net breakdown. Clicking again will re-send all emails.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendNotices}>
              {sendingNotices ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Notices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Record payout modal */}
      {payoutTarget && dist && (
        <RecordPayoutModal
          isOpen={!!payoutTarget}
          onClose={() => setPayoutTarget(null)}
          fundId={fundId}
          distributionId={dist.id}
          allocation={payoutTarget}
          symbol={symbol}
          currencyCode={code}
          onRecorded={(updated) => {
            setDist(updated)
            setPayoutTarget(null)
            onUpdated()
          }}
        />
      )}
    </>
  )
}
