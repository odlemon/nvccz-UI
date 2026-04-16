"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Plus,
  Search,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Phone,
  Eye,
  Send,
  Loader2,
  Landmark,
  CalendarClock,
  Receipt,
  Users,
  AlertCircle,
} from "lucide-react"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import {
  capitalCallsApi,
  type CapitalCallSummaryRow,
  type LpSummaryRow,
} from "@/lib/api/capital-calls-api"
import { toast } from "sonner"
import { CapitalCallDetailDrawer } from "./capital-call-detail-drawer"
import { InitiateCapitalCallModal } from "./initiate-capital-call-modal"
import { LpSummaryPanel } from "./lp-summary-panel"

function fmtCurrency(val: string | number, symbol = "$") {
  const n = Number(val)
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function SummaryCard({
  title,
  rows,
}: {
  title: string
  rows: [string, string][]
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="bg-primary px-5 py-3">
        <h3 className="text-sm font-semibold text-primary-foreground">
          {title}
        </h3>
      </div>
      <div className="px-5 py-1 divide-y divide-border">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2.5 text-sm"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-card-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CapitalCallsList() {
  // ── Fund switcher state ──
  const [funds, setFunds] = useState<Fund[]>([])
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [fundsLoading, setFundsLoading] = useState(true)

  // ── Capital calls state ──
  const [calls, setCalls] = useState<CapitalCallSummaryRow[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // ── LP Summary state ──
  const [lpSummary, setLpSummary] = useState<LpSummaryRow[]>([])

  // ── Drawer / modal state ──
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [sendingNotices, setSendingNotices] = useState<string | null>(null)
  const [confirmSendCallId, setConfirmSendCallId] = useState<string | null>(null)

  // ── Load funds ──
  const loadFunds = async () => {
    try {
      setFundsLoading(true)
      const res = await fundsApi.getAll()
      const fundsList = res.data.funds || []
      setFunds(fundsList)
      if (fundsList.length > 0 && !selectedFund) {
        setSelectedFund(fundsList[0])
      }
    } catch (e: any) {
      toast.error("Failed to load funds", { description: e?.message })
    } finally {
      setFundsLoading(false)
    }
  }

  // ── Load capital calls + LP summary for selected fund ──
  const loadCallsAndSummary = async () => {
    if (!selectedFund) return
    try {
      setCallsLoading(true)
      const [callsRes, summaryRes] = await Promise.all([
        capitalCallsApi.list(selectedFund.id),
        capitalCallsApi.lpSummary(selectedFund.id),
      ])
      setCalls(callsRes.data || [])
      setLpSummary(summaryRes.data?.byLp || [])
    } catch (e: any) {
      toast.error("Failed to load capital calls", { description: e?.message })
    } finally {
      setCallsLoading(false)
    }
  }

  useEffect(() => {
    loadFunds()
  }, [])

  useEffect(() => {
    if (selectedFund) {
      loadCallsAndSummary()
    }
  }, [selectedFund?.id])

  // ── Computed stats ──
  const stats = useMemo(() => {
    const totalCommitted = lpSummary.reduce(
      (s, lp) => s + lp.totalCommitment,
      0
    )
    const totalCalled = lpSummary.reduce(
      (s, lp) => s + lp.cumulativeCalled,
      0
    )
    const totalReceived = lpSummary.reduce(
      (s, lp) => s + lp.amountReceivedTowardCalls,
      0
    )
    const totalOutstanding = lpSummary.reduce(
      (s, lp) => s + lp.outstandingCallBalance,
      0
    )
    const totalUncalled = lpSummary.reduce(
      (s, lp) => s + lp.uncalledCommitmentBalance,
      0
    )
    return {
      totalCommitted,
      totalCalled,
      totalReceived,
      totalOutstanding,
      totalUncalled,
      calledPct: totalCommitted
        ? ((totalCalled / totalCommitted) * 100).toFixed(2)
        : "0.00",
    }
  }, [lpSummary])

  // ── Filtered calls ──
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return calls.filter((c) => {
      const matchQ =
        !q ||
        c.statusLabel.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      const matchS = statusFilter === "all" || c.status === statusFilter
      return matchQ && matchS
    })
  }, [calls, query, statusFilter])

  // ── Send notices handler ──
  const handleSendNotices = async (callId: string) => {
    if (!selectedFund) return
    try {
      setSendingNotices(callId)
      await capitalCallsApi.sendNotices(selectedFund.id, callId)
      toast.success("Notices sent successfully")
      loadCallsAndSummary()
    } catch (e: any) {
      toast.error("Failed to send notices", { description: e?.message })
    } finally {
      setSendingNotices(null)
    }
  }

  // ── View detail ──
  const openDetail = (callId: string) => {
    setSelectedCallId(callId)
    setDrawerOpen(true)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Breadcrumb bar ── */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3 shrink-0">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Portfolio</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Funds</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-card-foreground font-medium">
            Capital Calls
          </span>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => {
              loadFunds()
              if (selectedFund) loadCallsAndSummary()
            }}
            disabled={callsLoading || fundsLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${callsLoading || fundsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full gap-1.5 gradient-primary text-white"
            size="sm"
            disabled={!selectedFund}
          >
            <Plus className="w-4 h-4" />
            Initiate Call
          </Button>
        </div>
      </header>

      {/* ── Body: main + right LP panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Scrollable main area ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Fund Switcher ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Landmark className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select
                value={selectedFund?.id || ""}
                onValueChange={(val) => {
                  const f = funds.find((f) => f.id === val)
                  setSelectedFund(f || null)
                }}
                disabled={fundsLoading}
              >
                <SelectTrigger className="flex-1" size="sm">
                  <SelectValue
                    placeholder={
                      fundsLoading
                        ? "Loading funds..."
                        : funds.length === 0
                          ? "No funds available"
                          : "Select a fund"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search calls..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-full pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" size="sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="INITIATED">Initiated</SelectItem>
                <SelectItem value="NOTICES_SENT">Notices Sent</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="FULLY_PAID">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── KPI Summary Cards ── */}
          {!callsLoading && selectedFund && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Total Committed
                  </span>
                </div>
                <p className="text-xl font-bold text-card-foreground">
                  {fmtCurrency(stats.totalCommitted)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Capital Called ({stats.calledPct}%)
                  </span>
                </div>
                <p className="text-xl font-bold text-card-foreground">
                  {fmtCurrency(stats.totalCalled)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Outstanding
                  </span>
                </div>
                <p className="text-xl font-bold text-card-foreground">
                  {fmtCurrency(stats.totalOutstanding)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Received
                  </span>
                </div>
                <p className="text-xl font-bold text-card-foreground">
                  {fmtCurrency(stats.totalReceived)}
                </p>
              </div>
            </div>
          )}

          {/* ── Capital Calls Table ── */}
          {callsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-5 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 rounded bg-muted" />
                      <div className="h-3 w-32 rounded bg-muted" />
                    </div>
                    <div className="h-8 w-20 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : !selectedFund ? (
            <div className="text-center py-20 text-muted-foreground">
              <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a fund to view capital calls</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No capital calls found</p>
              <p className="text-xs mt-1">
                Initiate a capital call to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((call) => (
                <div
                  key={call.id}
                  className="rounded-2xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-card-foreground text-sm">
                            {call.callPercent}% Capital Call
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(call.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs font-medium ${getStatusStyle(call.status)}`}
                        variant="secondary"
                      >
                        {call.statusLabel}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Payment Due
                        </span>
                        <p className="font-medium text-card-foreground">
                          {fmtDate(call.paymentDueDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Transaction Date
                        </span>
                        <p className="font-medium text-card-foreground">
                          {fmtDate(call.transactionDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          LP Allocations
                        </span>
                        <p className="font-medium text-card-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {call._count.allocations}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Notices Sent
                        </span>
                        <p className="font-medium text-card-foreground">
                          {call.noticesSentAt
                            ? fmtDate(call.noticesSentAt)
                            : "Not yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-1.5 text-xs"
                        onClick={() => openDetail(call.id)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </Button>
                      {!call.noticesSentAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full gap-1.5 text-xs"
                          onClick={() => setConfirmSendCallId(call.id)}
                          disabled={sendingNotices === call.id}
                        >
                          {sendingNotices === call.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Send Notices
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Bottom summary cards ── */}
          {!callsLoading && selectedFund && lpSummary.length > 0 && (
            <>
              <div className="rounded-full bg-primary px-6 py-3 text-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  Capital Calls &mdash; {selectedFund.name}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SummaryCard
                  title="Capital Overview"
                  rows={[
                    ["Total Committed", fmtCurrency(stats.totalCommitted)],
                    [
                      "Capital Called",
                      `${fmtCurrency(stats.totalCalled)} (${stats.calledPct}%)`,
                    ],
                    ["Uncalled Balance", fmtCurrency(stats.totalUncalled)],
                  ]}
                />
                <SummaryCard
                  title="Collection Status"
                  rows={[
                    ["Amount Received", fmtCurrency(stats.totalReceived)],
                    ["Outstanding", fmtCurrency(stats.totalOutstanding)],
                    ["Total Calls", String(calls.length)],
                  ]}
                />
                <SummaryCard
                  title="LP Overview"
                  rows={[
                    ["Total LPs", String(lpSummary.length)],
                    [
                      "Fully Paid Calls",
                      String(
                        calls.filter((c) => c.status === "FULLY_PAID").length
                      ),
                    ],
                    [
                      "Pending Calls",
                      String(
                        calls.filter(
                          (c) =>
                            c.status === "INITIATED" ||
                            c.status === "NOTICES_SENT"
                        ).length
                      ),
                    ],
                  ]}
                />
              </div>
            </>
          )}
        </main>

        {/* ── Right panel: LP Summary ── */}
        {selectedFund && lpSummary.length > 0 && (
          <aside className="hidden lg:flex w-[360px] shrink-0 overflow-hidden">
            <LpSummaryPanel
              fund={selectedFund}
              lpSummary={lpSummary}
              onClose={() => {}}
            />
          </aside>
        )}
      </div>

      {/* ── Modals / Drawers ── */}
      {selectedFund && (
        <>
          <CapitalCallDetailDrawer
            isOpen={drawerOpen}
            onClose={() => {
              setDrawerOpen(false)
              setSelectedCallId(null)
            }}
            fundId={selectedFund.id}
            capitalCallId={selectedCallId}
            onPaymentRecorded={loadCallsAndSummary}
          />
          <InitiateCapitalCallModal
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            fundId={selectedFund.id}
            fundName={selectedFund.name}
            onCreated={loadCallsAndSummary}
          />
        </>
      )}

      {/* ── Send Notices Confirm Dialog ── */}
      <AlertDialog
        open={!!confirmSendCallId}
        onOpenChange={(open) => {
          if (!open) setConfirmSendCallId(null)
        }}
      >
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
                if (confirmSendCallId) {
                  handleSendNotices(confirmSendCallId)
                }
                setConfirmSendCallId(null)
              }}
            >
              <Send className="w-4 h-4" />
              Send Notices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
