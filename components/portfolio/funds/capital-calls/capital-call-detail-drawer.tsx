"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  capitalCallsApi,
  type CapitalCall,
  type CapitalCallAllocation,
} from "@/lib/api/capital-calls-api"
import {
  DollarSign,
  X,
  FileText,
  Users,
  Send,
  Loader2,
  Calendar,
  Building2,
  Receipt,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
} from "lucide-react"
import { toast } from "sonner"
import { RecordPaymentModal } from "./record-payment-modal"

function fmtCurrency(val: string | number, symbol = "$") {
  const n = Number(val)
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "INITIATED":
      return "bg-blue-100 text-blue-700"
    case "NOTICES_SENT":
      return "bg-indigo-100 text-indigo-700"
    case "PARTIALLY_PAID":
      return "bg-amber-100 text-amber-700"
    case "FULLY_PAID":
      return "bg-emerald-100 text-emerald-700"
    case "PENDING":
      return "bg-yellow-100 text-yellow-700"
    case "PAID":
      return "bg-emerald-100 text-emerald-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "FULLY_PAID":
    case "PAID":
      return <CheckCircle2 className="w-3.5 h-3.5" />
    case "PARTIALLY_PAID":
      return <AlertCircle className="w-3.5 h-3.5" />
    case "INITIATED":
    case "PENDING":
      return <Clock className="w-3.5 h-3.5" />
    default:
      return null
  }
}

interface CapitalCallDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  capitalCallId: string | null
  onPaymentRecorded: () => void
}

export function CapitalCallDetailDrawer({
  isOpen,
  onClose,
  fundId,
  capitalCallId,
  onPaymentRecorded,
}: CapitalCallDetailDrawerProps) {
  const [call, setCall] = useState<CapitalCall | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "allocations">(
    "overview"
  )
  const [expandedAllocation, setExpandedAllocation] = useState<string | null>(
    null
  )
  const [sendingNotices, setSendingNotices] = useState(false)
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)

  // Payment modal
  const [paymentAllocation, setPaymentAllocation] =
    useState<CapitalCallAllocation | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const loadDetail = async () => {
    if (!capitalCallId) return
    try {
      setLoading(true)
      const res = await capitalCallsApi.detail(fundId, capitalCallId)
      setCall(res.data)
    } catch (e: any) {
      toast.error("Failed to load capital call", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && capitalCallId) {
      loadDetail()
      setActiveTab("overview")
      setExpandedAllocation(null)
    }
  }, [isOpen, capitalCallId])

  const handleSendNotices = async () => {
    if (!call) return
    try {
      setSendingNotices(true)
      await capitalCallsApi.sendNotices(fundId, call.id)
      toast.success("Notices sent successfully")
      loadDetail()
      onPaymentRecorded()
    } catch (e: any) {
      toast.error("Failed to send notices", { description: e?.message })
    } finally {
      setSendingNotices(false)
    }
  }

  const openPaymentModal = (allocation: CapitalCallAllocation) => {
    setPaymentAllocation(allocation)
    setPaymentModalOpen(true)
  }

  const handlePaymentRecorded = () => {
    setPaymentModalOpen(false)
    setPaymentAllocation(null)
    loadDetail()
    onPaymentRecorded()
  }

  const totalCallAmount =
    call?.allocations.reduce(
      (sum, a) => sum + Number(a.currentCallAmount),
      0
    ) || 0
  const totalPaid =
    call?.allocations.reduce((sum, a) => sum + Number(a.amountPaid), 0) || 0
  const paidPct = totalCallAmount
    ? ((totalPaid / totalCallAmount) * 100).toFixed(1)
    : "0"

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-normal">
                    Capital Call Details
                  </SheetTitle>
                  <SheetDescription>
                    {call
                      ? `${call.callPercent}% Call — ${call.fund.name}`
                      : "Loading..."}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {call && !call.noticesSentAt && (
                  <Button
                    onClick={() => setConfirmSendOpen(true)}
                    disabled={sendingNotices}
                    className="rounded-full gap-1.5 gradient-primary text-white"
                    size="sm"
                  >
                    {sendingNotices ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Send Notices
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full h-10 w-10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Tabs */}
          <div className="mt-6 flex gap-6 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === "overview"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Overview
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("allocations")}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === "allocations"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              LP Allocations ({call?.allocations.length || 0})
              {activeTab === "allocations" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 animate-pulse">
                  <div className="h-4 w-40 bg-muted rounded mb-2" />
                  <div className="h-3 w-28 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : !call ? (
            <div className="mt-6 text-center py-12 text-muted-foreground">
              No data available
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {activeTab === "overview" && (
                <>
                  {/* Call Summary Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm text-blue-700 mb-1">
                            Total Call Amount
                          </div>
                          <div className="text-3xl font-semibold text-blue-900">
                            {fmtCurrency(
                              totalCallAmount,
                              call.currency.symbol
                            )}
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                          <DollarSign className="w-7 h-7 text-blue-600" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-blue-700">
                          <span>
                            Collected: {fmtCurrency(totalPaid, call.currency.symbol)}
                          </span>
                          <span>{paidPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Number(paidPct))}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Call Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-normal flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        Call Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Fund</div>
                          <div className="font-medium">{call.fund.name}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Status</div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(call.status)}`}
                          >
                            {getStatusIcon(call.status)}
                            {call.statusLabel}
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-500">Call Percent</div>
                          <div className="font-medium">
                            {call.callPercent}%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Currency</div>
                          <div className="font-medium">
                            {call.currency.code} ({call.currency.symbol})
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Payment Due Date</div>
                          <div className="font-medium flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {fmtDate(call.paymentDueDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Transaction Date</div>
                          <div className="font-medium flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            {fmtDate(call.transactionDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Notices Sent</div>
                          <div className="font-medium">
                            {call.noticesSentAt
                              ? fmtDate(call.noticesSentAt)
                              : "Not yet"}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Created</div>
                          <div className="font-medium">
                            {fmtDate(call.createdAt)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Instructions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-normal flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        Bank Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                        {call.bankInstructions}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Journal Entry */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-normal flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-amber-600" />
                        </div>
                        Journal Entry
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Reference</div>
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                            {call.journalEntry.referenceNumber}
                          </code>
                        </div>
                        <div>
                          <div className="text-gray-500">Status</div>
                          <Badge variant="secondary">
                            {call.journalEntry.status}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-gray-500">
                            Transaction Date
                          </div>
                          <div className="font-medium">
                            {fmtDate(call.journalEntry.transactionDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Audit Trail #</div>
                          <div className="font-medium">
                            {call.journalEntry.auditTrailSequenceNumber}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </>
              )}

              {activeTab === "allocations" && (
                <div className="space-y-4">
                  {call.allocations.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-base">No allocations</p>
                      </CardContent>
                    </Card>
                  ) : (
                    call.allocations.map((alloc) => {
                      const callAmt = Number(alloc.currentCallAmount)
                      const paid = Number(alloc.amountPaid)
                      const remaining = callAmt - paid
                      const pctPaid = callAmt
                        ? ((paid / callAmt) * 100).toFixed(1)
                        : "0"
                      const isExpanded = expandedAllocation === alloc.id

                      return (
                        <Card
                          key={alloc.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardContent className="pt-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {alloc.lpLegalNameSnapshot}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {alloc.client.email}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(alloc.status)}`}
                              >
                                {getStatusIcon(alloc.status)}
                                {alloc.statusLabel}
                              </span>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  Call Amount
                                </div>
                                <div className="text-lg font-semibold text-blue-600">
                                  {fmtCurrency(
                                    alloc.currentCallAmount,
                                    call.currency.symbol
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  Amount Paid
                                </div>
                                <div className="text-lg font-semibold text-emerald-600">
                                  {fmtCurrency(
                                    alloc.amountPaid,
                                    call.currency.symbol
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Remaining
                                </div>
                                <div className="text-lg font-semibold text-amber-600">
                                  {fmtCurrency(
                                    remaining,
                                    call.currency.symbol
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="space-y-1 mb-4">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Payment Progress</span>
                                <span>{pctPaid}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, Number(pctPaid))}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Commitment snapshot */}
                            <div className="pt-3 border-t space-y-2 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Total Commitment</span>
                                <span className="font-medium">
                                  {fmtCurrency(
                                    alloc.totalCommitmentSnapshot,
                                    call.currency.symbol
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Uncalled Before This Call</span>
                                <span className="font-medium">
                                  {fmtCurrency(
                                    alloc.uncalledCapitalBeforeSnapshot,
                                    call.currency.symbol
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Expand payments */}
                            <button
                              onClick={() =>
                                setExpandedAllocation(
                                  isExpanded ? null : alloc.id
                                )
                              }
                              className="flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                              {alloc.payments.length} Payment
                              {alloc.payments.length !== 1 ? "s" : ""} Recorded
                            </button>

                            {isExpanded && alloc.payments.length > 0 && (
                              <div className="mt-3 space-y-2 pl-4 border-l-2 border-blue-200">
                                {alloc.payments.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between text-xs bg-muted/50 rounded-lg p-2.5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="font-semibold text-gray-800">
                                        {fmtCurrency(
                                          p.amount,
                                          call.currency.symbol
                                        )}
                                      </span>
                                    </div>
                                    <span className="text-gray-500">
                                      {fmtDate(p.recordedAt)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Record payment action */}
                            {alloc.status !== "PAID" && (
                              <div className="mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full gap-1.5 text-xs"
                                  onClick={() => openPaymentModal(alloc)}
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Record Payment
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Record Payment Modal */}
      {call && paymentAllocation && (
        <RecordPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false)
            setPaymentAllocation(null)
          }}
          fundId={fundId}
          capitalCallId={call.id}
          allocation={paymentAllocation}
          currencySymbol={call.currency.symbol}
          currencyCode={call.currency.code}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}

      {/* Send Notices Confirm Dialog */}
      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Capital Call Notices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send HTML and PDF notice emails to all LPs with
              allocations on this capital call. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full gap-1.5 gradient-primary text-white"
              onClick={() => {
                setConfirmSendOpen(false)
                handleSendNotices()
              }}
            >
              <Send className="w-4 h-4" />
              Send Notices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
