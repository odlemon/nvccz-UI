"use client"

import * as React from "react"
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  Eye,
  FilePenLine,
  FileText,
  Info,
  MoreHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLpPortal } from "@/components/lp-portal/lp-portal-context"
import { cn } from "@/lib/utils"

type CallStatus = "Issued" | "Paid" | "Overdue"
type DistType = "Return of Capital" | "Income"
type ActivityTab = "calls" | "distributions"

interface CapitalCallRow {
  id: string
  callNo: number
  fund: string
  issueDate: string
  dueDate: string
  amount: number
  paid: number
  outstanding: number
  status: CallStatus
  dueSoon?: boolean
  daysUntilDue?: number
}

interface DistributionRow {
  id: string
  ref: string
  fund: string
  type: DistType
  gross: number
  adjustments: number
  netPaid: number
  paymentDate: string
}

const MOCK_CALLS: CapitalCallRow[] = [
  {
    id: "cc-7",
    callNo: 7,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "May 20, 2025",
    dueDate: "Jun 5, 2025",
    amount: 6_250_000,
    paid: 0,
    outstanding: 6_250_000,
    status: "Issued",
    dueSoon: true,
    daysUntilDue: 5,
  },
  {
    id: "cc-6",
    callNo: 6,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "Feb 12, 2025",
    dueDate: "Feb 28, 2025",
    amount: 4_100_000,
    paid: 4_100_000,
    outstanding: 0,
    status: "Paid",
  },
  {
    id: "cc-5",
    callNo: 5,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "Jan 8, 2025",
    dueDate: "Jan 22, 2025",
    amount: 2_850_000,
    paid: 1_200_000,
    outstanding: 1_650_000,
    status: "Overdue",
    dueSoon: true,
  },
  {
    id: "cc-4",
    callNo: 4,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "Nov 3, 2024",
    dueDate: "Nov 20, 2024",
    amount: 5_000_000,
    paid: 5_000_000,
    outstanding: 0,
    status: "Paid",
  },
  {
    id: "cc-3b",
    callNo: 3,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "Sep 15, 2024",
    dueDate: "Sep 30, 2024",
    amount: 3_750_000,
    paid: 3_750_000,
    outstanding: 0,
    status: "Paid",
  },
  {
    id: "cc-3a",
    callNo: 3,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "Jul 2, 2024",
    dueDate: "Jul 18, 2024",
    amount: 2_200_000,
    paid: 2_200_000,
    outstanding: 0,
    status: "Paid",
  },
  {
    id: "cc-2",
    callNo: 2,
    fund: "Arcus Growth Fund V, L.P.",
    issueDate: "Apr 10, 2024",
    dueDate: "Apr 25, 2024",
    amount: 1_800_000,
    paid: 1_800_000,
    outstanding: 0,
    status: "Paid",
  },
  {
    id: "cc-1",
    callNo: 1,
    fund: "Arcus Buyout Fund IV, L.P.",
    issueDate: "Jan 15, 2024",
    dueDate: "Jan 30, 2024",
    amount: 3_000_000,
    paid: 3_000_000,
    outstanding: 0,
    status: "Paid",
  },
]

const MOCK_DISTRIBUTIONS: DistributionRow[] = [
  {
    id: "d-1",
    ref: "DIST-2025-041",
    fund: "Arcus Growth Fund V, L.P.",
    type: "Return of Capital",
    gross: 1_250_000,
    adjustments: 25_000,
    netPaid: 1_225_000,
    paymentDate: "Apr 18, 2025",
  },
  {
    id: "d-2",
    ref: "DIST-2025-028",
    fund: "Arcus Credit Opportunities II",
    type: "Income",
    gross: 420_000,
    adjustments: 8_400,
    netPaid: 411_600,
    paymentDate: "Mar 12, 2025",
  },
  {
    id: "d-3",
    ref: "DIST-2025-015",
    fund: "Arcus Growth Fund IV, L.P.",
    type: "Return of Capital",
    gross: 980_000,
    adjustments: 0,
    netPaid: 980_000,
    paymentDate: "Feb 4, 2025",
  },
  {
    id: "d-4",
    ref: "DIST-2024-112",
    fund: "Arcus Growth Fund V, L.P.",
    type: "Income",
    gross: 315_000,
    adjustments: 6_300,
    netPaid: 308_700,
    paymentDate: "Dec 20, 2024",
  },
  {
    id: "d-5",
    ref: "DIST-2024-098",
    fund: "Arcus Credit Opportunities II",
    type: "Return of Capital",
    gross: 760_000,
    adjustments: 15_200,
    netPaid: 744_800,
    paymentDate: "Oct 8, 2024",
  },
]

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function downloadMockFile(filename: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function StatusBadge({ status }: { status: CallStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        status === "Issued" && "bg-[#e8f1ff] text-[#2563eb]",
        status === "Paid" && "bg-[#e7f8ef] text-[#15803d]",
        status === "Overdue" && "bg-[#fee2e2] text-[#dc2626]",
      )}
    >
      {status}
    </span>
  )
}

function RadioMarker({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mx-auto flex size-[15px] items-center justify-center rounded-full border-[1.5px]",
        selected ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] bg-white",
      )}
    >
      {selected && <span className="size-[5px] rounded-full bg-white" />}
    </span>
  )
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5 shrink-0", className)} aria-hidden>
      <path
        fill="#e11d48"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      />
      <path fill="#fda4af" d="M14 2v6h6" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fill="white"
        fontSize="6"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        PDF
      </text>
    </svg>
  )
}

function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  footer,
  footerExtra,
  onFooterClick,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  footer: string
  footerExtra?: React.ReactNode
  onFooterClick?: () => void
}) {
  return (
    <div className="rounded-xl border border-[#e8edf5] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconBg, iconColor)}>
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-medium leading-4 text-[#475569]">{label}</p>
          <p className="mt-1 text-[20px] font-bold leading-6 tracking-[-0.03em] text-[#0f172a]">{value}</p>
          <button
            type="button"
            className="mt-1.5 text-[11px] font-medium leading-4 text-[#2563eb] hover:underline"
            onClick={onFooterClick}
          >
            {footer}
            {footerExtra}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-[12px]">
      <span className="text-[#64748b]">{label}</span>
      <span className={cn("text-right font-medium tabular-nums text-[#0f172a]", valueClassName)}>{value}</span>
    </div>
  )
}

function OutlineAction({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className="h-8 gap-1.5 rounded-full border-[#93c5fd] bg-white px-3 text-[11px] font-semibold text-[#2563eb] shadow-none hover:bg-[#eff6ff] hover:text-[#1d4ed8] disabled:opacity-45"
    >
      {children}
    </Button>
  )
}

function PrimaryAction({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-8 gap-1.5 rounded-full bg-[#2563eb] px-3.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-45"
    >
      {children}
    </Button>
  )
}

export function LpCapitalActivityScreen({
  initialTab = "calls",
}: {
  initialTab?: ActivityTab
}) {
  const { asOfDate } = useLpPortal()
  const [activeTab, setActiveTab] = React.useState<ActivityTab>(initialTab)
  const [selectedCallId, setSelectedCallId] = React.useState<string | null>(MOCK_CALLS[0]?.id ?? null)
  const [acknowledged, setAcknowledged] = React.useState<Record<string, boolean>>({})
  const [copied, setCopied] = React.useState(false)
  const [showAllCalls, setShowAllCalls] = React.useState(false)
  const [showAllDistributions, setShowAllDistributions] = React.useState(false)
  const paymentInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const selectedCall = MOCK_CALLS.find((call) => call.id === selectedCallId) ?? null
  const isAcknowledged = selectedCall ? Boolean(acknowledged[selectedCall.id]) : false
  const showDetailPanel = activeTab === "calls" && Boolean(selectedCall)

  const visibleCalls = showAllCalls ? MOCK_CALLS : MOCK_CALLS.slice(0, 8)
  const visibleDistributions =
    activeTab === "distributions" || showAllDistributions
      ? MOCK_DISTRIBUTIONS
      : MOCK_DISTRIBUTIONS.slice(0, 3)

  const wiringReference = selectedCall
    ? `AGFV Call ${selectedCall.callNo} – Investor ID ACC-001234`
    : ""

  const acknowledgeCall = (callId: string) => {
    setAcknowledged((current) => ({ ...current, [callId]: true }))
    toast.success("Capital call acknowledged")
  }

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(wiringReference)
      setCopied(true)
      toast.success("Wiring reference copied")
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error("Unable to copy reference")
    }
  }

  const downloadNotice = (call: CapitalCallRow) => {
    downloadMockFile(
      `Call-Notice-No-${call.callNo}.txt`,
      [
        `Capital Call Notice`,
        `Call No. ${call.callNo}`,
        `Fund: ${call.fund}`,
        `Issue Date: ${call.issueDate}`,
        `Due Date: ${call.dueDate}`,
        `Amount Due: ${money(call.outstanding)}`,
        ``,
        `This is a mock portal download for UI demonstration.`,
      ].join("\n"),
    )
    toast.success(`Downloaded Call Notice — Call No. ${call.callNo}`)
  }

  const downloadStatement = () => {
    downloadMockFile(
      "Distribution-Statement.txt",
      [
        "Distribution Statement",
        `As of: ${asOfDate}`,
        "",
        ...MOCK_DISTRIBUTIONS.map(
          (row) =>
            `${row.ref} | ${row.fund} | ${row.type} | Gross ${money(row.gross)} | Adj (${money(row.adjustments)}) | Net ${money(row.netPaid)} | ${row.paymentDate}`,
        ),
        "",
        "This is a mock portal download for UI demonstration.",
      ].join("\n"),
    )
    toast.success("Downloaded distribution statement")
  }

  const downloadDistributionPdf = (row: DistributionRow) => {
    downloadMockFile(
      `${row.ref}.txt`,
      [
        `Distribution Document`,
        `Reference: ${row.ref}`,
        `Fund: ${row.fund}`,
        `Type: ${row.type}`,
        `Gross: ${money(row.gross)}`,
        `Adjustments: (${money(row.adjustments)})`,
        `Net Paid: ${money(row.netPaid)}`,
        `Payment Date: ${row.paymentDate}`,
        "",
        "This is a mock portal download for UI demonstration.",
      ].join("\n"),
    )
    toast.success(`Downloaded ${row.ref}`)
  }

  const downloadLinkedDocument = (name: string) => {
    downloadMockFile(
      `${name.replace(/[^\w.-]+/g, "-")}.txt`,
      `${name}\n\nThis is a mock portal download for UI demonstration.`,
    )
    toast.success(`Downloaded ${name}`)
  }

  const onPaymentConfirmation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedCall) return
    toast.success(`Payment confirmation uploaded for Call No. ${selectedCall.callNo}: ${file.name}`)
    event.target.value = ""
  }

  return (
    <div className="space-y-4" data-as-of={asOfDate}>
      <input
        ref={paymentInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        className="hidden"
        onChange={onPaymentConfirmation}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Capital Calls & Distributions</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage capital calls and distributions across your investments.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {(
            [
              { id: "calls" as const, label: "Capital Calls" },
              { id: "distributions" as const, label: "Distributions" },
            ]
          ).map((tab) => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-[#2563eb] text-[#2563eb]"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={cn("grid gap-4", showDetailPanel && "xl:grid-cols-[minmax(0,1fr)_300px]")}>
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              icon={<Clock3 className="size-4" strokeWidth={2} />}
              iconBg="bg-[#e8f1ff]"
              iconColor="text-[#2563eb]"
              label="Outstanding Calls"
              value="$24.68M"
              footer="8 Calls"
              onFooterClick={() => setActiveTab("calls")}
            />
            <KpiCard
              icon={<CheckCircle2 className="size-4" strokeWidth={2} />}
              iconBg="bg-[#e7f8ef]"
              iconColor="text-[#16a34a]"
              label="Paid Calls"
              value="$156.42M"
              footer="42 Calls"
              onFooterClick={() => setActiveTab("calls")}
            />
            <KpiCard
              icon={<CalendarDays className="size-4" strokeWidth={2} />}
              iconBg="bg-[#fff1e8]"
              iconColor="text-[#f97316]"
              label="Upcoming Due Amount"
              value="$6.35M"
              footer="3 Calls Due"
              onFooterClick={() => setActiveTab("calls")}
            />
            <KpiCard
              icon={<CircleDollarSign className="size-4" strokeWidth={2} />}
              iconBg="bg-[#f3e8ff]"
              iconColor="text-[#7c3aed]"
              label="Total Distributions"
              value="$78.34M"
              footer="Since Inception"
              onFooterClick={() => setActiveTab("distributions")}
            />
            <KpiCard
              icon={<FileText className="size-4" strokeWidth={2} />}
              iconBg="bg-[#e6faf8]"
              iconColor="text-[#0d9488]"
              label="Upcoming Distribution Notices"
              value="$3.25M"
              footer="TVPI"
              footerExtra={<span className="text-[#ef4444]"> (Net)</span>}
              onFooterClick={() => setActiveTab("distributions")}
            />
          </div>

          {activeTab === "calls" && (
            <section className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[14px] font-semibold text-[#0f172a]">Capital Calls</h2>
                  <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OutlineAction
                    disabled={!selectedCall}
                    onClick={() => {
                      if (!selectedCall) return
                      toast.message(`Viewing notice for Call No. ${selectedCall.callNo}`, {
                        description: selectedCall.fund,
                      })
                    }}
                  >
                    <Eye className="size-3.5" />
                    View Notice
                  </OutlineAction>
                  <OutlineAction
                    disabled={!selectedCall}
                    onClick={() => selectedCall && downloadNotice(selectedCall)}
                  >
                    <Download className="size-3.5" />
                    Download Notice
                  </OutlineAction>
                  <PrimaryAction
                    disabled={!selectedCall || isAcknowledged}
                    onClick={() => selectedCall && acknowledgeCall(selectedCall.id)}
                  >
                    <Download className="size-3.5" />
                    Acknowledge
                  </PrimaryAction>
                  <OutlineAction
                    disabled={!selectedCall}
                    onClick={() => paymentInputRef.current?.click()}
                  >
                    <Sparkles className="size-3.5" />
                    Submit Payment Confirmation
                  </OutlineAction>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#eef2f7] text-[11px] font-medium text-[#64748b]">
                      <th className="w-11 px-3 py-3" />
                      <th className="whitespace-nowrap px-3 py-3">Call No.</th>
                      <th className="whitespace-nowrap px-3 py-3">Fund</th>
                      <th className="whitespace-nowrap px-3 py-3">Issue Date</th>
                      <th className="whitespace-nowrap px-3 py-3">Due Date</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Amount</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Paid</th>
                      <th className="whitespace-nowrap px-3 py-3 text-right">Outstanding</th>
                      <th className="whitespace-nowrap px-3 py-3 text-center">Status</th>
                      <th className="w-12 whitespace-nowrap px-3 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCalls.map((row) => {
                      const selected = selectedCallId === row.id
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedCallId(row.id)}
                          className={cn(
                            "cursor-pointer border-b border-[#f1f5f9] transition-colors last:border-0",
                            selected ? "bg-[#eff6ff]" : "bg-white hover:bg-[#f8fafc]",
                          )}
                        >
                          <td className="px-3 py-3">
                            <RadioMarker selected={selected} />
                          </td>
                          <td className="px-3 py-3 font-semibold text-[#0f172a]">{row.callNo}</td>
                          <td className="max-w-[220px] truncate px-3 py-3 text-[#334155]">{row.fund}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-[#475569]">{row.issueDate}</td>
                          <td
                            className={cn(
                              "whitespace-nowrap px-3 py-3",
                              row.dueSoon || row.status === "Overdue"
                                ? "font-semibold text-[#ef4444]"
                                : "text-[#475569]",
                            )}
                          >
                            {row.dueDate}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-[#0f172a]">
                            {money(row.amount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-[#475569]">
                            {money(row.paid)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums font-medium text-[#0f172a]">
                            {money(row.outstanding)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-3 py-3 text-center" onClick={(event) => event.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex size-7 items-center justify-center rounded-full text-[#94a3b8] hover:bg-slate-100 hover:text-slate-600"
                                  aria-label={`Actions for Call No. ${row.callNo}`}
                                >
                                  <MoreHorizontal className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCallId(row.id)
                                    toast.message(`Viewing notice for Call No. ${row.callNo}`)
                                  }}
                                >
                                  <Eye className="size-3.5" />
                                  View Notice
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadNotice(row)}>
                                  <Download className="size-3.5" />
                                  Download Notice
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={Boolean(acknowledged[row.id]) || row.status === "Paid"}
                                  onClick={() => acknowledgeCall(row.id)}
                                >
                                  <Check className="size-3.5" />
                                  Acknowledge
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCallId(row.id)
                                    window.setTimeout(() => paymentInputRef.current?.click(), 0)
                                  }}
                                >
                                  <FilePenLine className="size-3.5" />
                                  Payment Confirmation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#eef2f7] px-4 py-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb] hover:underline"
                  onClick={() => {
                    setShowAllCalls(true)
                    toast.message("Showing all capital calls")
                  }}
                >
                  View all Capital Calls
                  <span aria-hidden>→</span>
                </button>
              </div>
            </section>
          )}

          <section
            className={cn(
              "overflow-hidden rounded-lg border border-slate-200 bg-white",
              activeTab === "distributions" && "ring-1 ring-[#2563eb]/15",
            )}
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-slate-900">Distributions</h2>
                <Info className="size-3.5 text-slate-400" aria-hidden />
              </div>
              <OutlineAction onClick={downloadStatement}>
                <Download className="size-3.5" />
                Download Statement
              </OutlineAction>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2.5">Distribution Ref</th>
                    <th className="px-3 py-2.5">Fund</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5 text-right">Gross Amount</th>
                    <th className="px-3 py-2.5 text-right">Adjustments</th>
                    <th className="px-3 py-2.5 text-right">Net Paid</th>
                    <th className="px-3 py-2.5">Payment Date</th>
                    <th className="px-3 py-2.5 text-center">Document</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDistributions.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-semibold text-[#2563eb]">{row.ref}</td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-700">{row.fund}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{row.type}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-800">
                        {money(row.gross)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {row.adjustments > 0 ? `(${money(row.adjustments)})` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {money(row.netPaid)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{row.paymentDate}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center"
                          aria-label={`Download ${row.ref} PDF`}
                          onClick={() => downloadDistributionPdf(row)}
                        >
                          <PdfIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-2.5">
              <button
                type="button"
                className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                onClick={() => {
                  setActiveTab("distributions")
                  setShowAllDistributions(true)
                  toast.message("Showing all distributions")
                }}
              >
                View all Distributions →
              </button>
            </div>
          </section>
        </div>

        {showDetailPanel && selectedCall && (
          <aside className="h-fit self-start overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:sticky xl:top-4">
            <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
              <h2 className="text-[14px] font-semibold text-[#0f172a]">Selected Capital Call</h2>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-full text-[#94a3b8] hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close detail"
                onClick={() => setSelectedCallId(null)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-bold text-[#0f172a]">Call No. {selectedCall.callNo}</p>
                <StatusBadge status={selectedCall.status} />
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#0f172a]">{selectedCall.fund}</p>

              <div className="mt-3 space-y-0 border-t border-[#eef2f7] pt-1">
                <DetailRow label="Issue Date" value={selectedCall.issueDate} />
                <DetailRow
                  label="Due Date"
                  value={
                    selectedCall.daysUntilDue != null ? (
                      <>
                        {selectedCall.dueDate}{" "}
                        <span className="text-[#ef4444]">(in {selectedCall.daysUntilDue} days)</span>
                      </>
                    ) : (
                      selectedCall.dueDate
                    )
                  }
                  valueClassName={selectedCall.dueSoon ? "font-semibold text-[#ef4444]" : undefined}
                />
                <DetailRow label="Total Amount" value={money(selectedCall.amount)} />
                <DetailRow label="Paid" value={money(selectedCall.paid)} />
                <DetailRow label="Outstanding" value={money(selectedCall.outstanding)} />
              </div>

              {selectedCall.outstanding > 0 && (
                <div className="mt-3 rounded-lg bg-[#eff6ff] px-3 py-3.5 text-center">
                  <p className="text-[12px] font-medium text-[#3b82f6]">Amount Due by {selectedCall.dueDate}</p>
                  <p className="mt-1 text-[22px] font-bold tabular-nums tracking-[-0.02em] text-[#1d4ed8]">
                    {money(selectedCall.outstanding)}
                  </p>
                </div>
              )}

              <div className="mt-4 border-t border-[#eef2f7] pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-[#0f172a]">Wiring Instructions (preview)</h3>
                  <button
                    type="button"
                    className="shrink-0 text-[11px] font-semibold text-[#2563eb] hover:underline"
                    onClick={() =>
                      toast.message("Full wiring details", {
                        description: "Complete banking instructions are available in the call notice.",
                      })
                    }
                  >
                    View full details →
                  </button>
                </div>
                <div className="space-y-0">
                  <DetailRow label="Bank" value="JPMorgan Chase Bank, N.A." />
                  <DetailRow label="Account Name" value="Arcus Growth Fund V, L.P." />
                  <DetailRow label="Account Number" value="123456789" />
                  <DetailRow label="ABA / Routing" value="021000021" />
                  <div className="flex items-start justify-between gap-2 py-2 text-[12px]">
                    <span className="shrink-0 text-[#64748b]">Reference / Memo</span>
                    <span className="flex max-w-[62%] items-start justify-end gap-1.5 text-right font-semibold leading-4 text-[#0f172a]">
                      <span>{wiringReference}</span>
                      <button
                        type="button"
                        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#2563eb] hover:bg-blue-50"
                        aria-label="Copy reference"
                        onClick={copyReference}
                      >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#eef2f7] pt-3">
                <div>
                  <h3 className="mb-3 text-[13px] font-semibold text-[#0f172a]">Timeline</h3>
                  <div className="space-y-0">
                    {(
                      [
                        {
                          label: "Call Issued",
                          detail: selectedCall.issueDate,
                          state: "complete" as const,
                        },
                        {
                          label: "Acknowledged",
                          detail: isAcknowledged ? "Confirmed" : "Pending",
                          state: isAcknowledged ? ("complete" as const) : ("pending" as const),
                        },
                        {
                          label: "Payment Received",
                          detail: selectedCall.status === "Paid" ? "Matched" : "Pending",
                          state: selectedCall.status === "Paid" ? ("complete" as const) : ("pending" as const),
                        },
                        {
                          label: "Call Closed",
                          detail: selectedCall.status === "Paid" ? "Complete" : "Pending",
                          state: selectedCall.status === "Paid" ? ("complete" as const) : ("pending" as const),
                        },
                      ]
                    ).map((step, index, all) => (
                      <div key={step.label} className="flex gap-2.5">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "mt-0.5 flex size-3 items-center justify-center rounded-full",
                              step.state === "complete" && "bg-[#2563eb]",
                              step.state === "pending" && "border-[1.5px] border-[#cbd5e1] bg-white",
                            )}
                          >
                            {step.state === "complete" && <span className="size-1 rounded-full bg-white" />}
                          </span>
                          {index < all.length - 1 && (
                            <span className="my-1 min-h-[18px] w-px flex-1 bg-[#e2e8f0]" />
                          )}
                        </div>
                        <div className={cn(index < all.length - 1 ? "pb-2.5" : "pb-0")}>
                          <p
                            className={cn(
                              "text-[12px] font-semibold leading-4",
                              step.state === "complete" ? "text-[#0f172a]" : "text-[#64748b]",
                            )}
                          >
                            {step.label}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#94a3b8]">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-l border-[#eef2f7] pl-3">
                  <h3 className="mb-3 flex items-center gap-1 text-[13px] font-semibold text-[#0f172a]">
                    Acknowledgment Status
                    <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
                  </h3>
                  <div className="flex flex-col items-center pt-2 text-center">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full",
                          isAcknowledged ? "bg-emerald-100 text-emerald-600" : "bg-[#fff7ed] text-[#f97316]",
                        )}
                      >
                        {isAcknowledged ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : (
                          <Clock3 className="size-3.5" strokeWidth={2.5} />
                        )}
                      </span>
                      <span className="text-[13px] font-bold text-[#0f172a]">
                        {isAcknowledged ? "Acknowledged" : "Pending"}
                      </span>
                    </div>
                    {!isAcknowledged && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 h-8 w-full rounded-full border-[#93c5fd] bg-white px-3 text-[11px] font-semibold text-[#2563eb] shadow-none hover:bg-[#eff6ff]"
                        onClick={() => acknowledgeCall(selectedCall.id)}
                      >
                        Acknowledge Call
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t border-[#eef2f7] pt-3">
                <h3 className="mb-2.5 text-[13px] font-semibold text-[#0f172a]">Linked Documents</h3>
                <div className="space-y-1">
                  {[
                    {
                      name: `Call Notice – Call No. ${selectedCall.callNo}`,
                      date: selectedCall.issueDate,
                    },
                    { name: "Subscription Agreement", date: "Jun 15, 2022" },
                    { name: "Fund Governing Documents", date: "Jun 15, 2022" },
                  ].map((doc) => (
                    <div key={doc.name} className="flex items-center gap-2.5 py-1.5">
                      <PdfIcon className="size-5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-[#2563eb]">{doc.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                          PDF <span className="mx-1">·</span> {doc.date}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[#2563eb] hover:bg-blue-50"
                        aria-label={`Download ${doc.name}`}
                        onClick={() => downloadLinkedDocument(doc.name)}
                      >
                        <Download className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
