"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  CheckCircle2,
  Coins,
  Download,
  ExternalLink,
  Info,
  Layers,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type WorkflowHighlight = "subscriptions" | "redemptions" | undefined
type RedemptionMode = "amount" | "units" | "full"
type RequestType = "Subscription" | "Redemption"
type RequestStatus =
  | "Submitted"
  | "Awaiting Funds"
  | "Allocated"
  | "Under Review"
  | "Settled"
  | "Rejected"

interface HistoryRow {
  id: string
  type: RequestType
  fund: string
  shareClass: string
  amount: number
  units: number
  unitsEstimated?: boolean
  status: RequestStatus
  submittedOn: string
  expectedSettlement: string | null
}

const NAV = 9.9987
const AS_OF = "May 31, 2025"
const NOTICE_DAYS = 30
const MIN_BALANCE = 1_000_000
const AVAILABLE_UNITS = 1_835_167.32
const AVAILABLE_VALUE = 18_350_000
const MGMT_FEE_RATE = 0.01
const OTHER_FEE_FLAT = 5_000
const REDEMPTION_FEE_RATE = 0.00208613

const FUNDS = [
  "Arcus Growth Fund V, L.P.",
  "Arcus Buyout Fund IV, L.P.",
  "Arcus Credit Opportunities II",
] as const

const BANKS = [
  "JPMorgan Chase •••• 6789 (USD)",
  "Citibank •••• 4812 (USD)",
  "First Capital Bank •••• 7719 (USD)",
] as const

const INITIAL_HISTORY: HistoryRow[] = [
  {
    id: "SR-2025-00148",
    type: "Subscription",
    fund: "Arcus Growth Fund V, L.P.",
    shareClass: "Class A",
    amount: 2_000_000,
    units: 200_026,
    unitsEstimated: true,
    status: "Submitted",
    submittedOn: "Jun 2, 2025",
    expectedSettlement: "Jun 12, 2025",
  },
  {
    id: "SR-2025-00141",
    type: "Subscription",
    fund: "Arcus Growth Fund V, L.P.",
    shareClass: "Class A",
    amount: 500_000,
    units: 50_006.5,
    unitsEstimated: true,
    status: "Awaiting Funds",
    submittedOn: "May 28, 2025",
    expectedSettlement: "Jun 5, 2025",
  },
  {
    id: "SR-2025-00132",
    type: "Subscription",
    fund: "Arcus Buyout Fund IV, L.P.",
    shareClass: "Class A",
    amount: 1_250_000,
    units: 125_016.25,
    status: "Allocated",
    submittedOn: "May 15, 2025",
    expectedSettlement: "May 31, 2025",
  },
  {
    id: "SR-2025-00125",
    type: "Redemption",
    fund: "Arcus Growth Fund V, L.P.",
    shareClass: "Class A",
    amount: 1_000_000,
    units: 100_013.19,
    unitsEstimated: true,
    status: "Under Review",
    submittedOn: "May 20, 2025",
    expectedSettlement: "Jul 3, 2025",
  },
  {
    id: "SR-2025-00118",
    type: "Redemption",
    fund: "Arcus Growth Fund V, L.P.",
    shareClass: "Class A",
    amount: 350_000,
    units: 35_004.62,
    status: "Settled",
    submittedOn: "Apr 10, 2025",
    expectedSettlement: "May 5, 2025",
  },
  {
    id: "SR-2025-00105",
    type: "Subscription",
    fund: "Arcus Credit Opportunities II",
    shareClass: "Class A",
    amount: 750_000,
    units: 75_009.75,
    status: "Rejected",
    submittedOn: "Apr 2, 2025",
    expectedSettlement: null,
  },
]

function money(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function moneyCompact(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `$${millions.toFixed(2)}M`
  }
  return money(value, 0)
}

function unitsFmt(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function addCalendarDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-[#475569]">{label}</Label>
      {children}
    </div>
  )
}

function FormRow({
  label,
  children,
  labelClassName,
}: {
  label: string
  children: React.ReactNode
  labelClassName?: string
}) {
  return (
    <div className="grid grid-cols-[minmax(100px,36%)_minmax(0,1fr)] items-center gap-x-3">
      <Label className={cn("text-[12px] font-normal leading-4 text-[#64748b]", labelClassName)}>
        {label}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function KpiCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-xl border border-[#e8edf5] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconBg, iconColor)}>
          {icon}
        </span>
        <button
          type="button"
          className="rounded-full p-0.5 text-[#94a3b8] hover:bg-slate-50 hover:text-[#64748b]"
          aria-label={`${label} info`}
          onClick={() => toast.message(label, { description: helper })}
        >
          <Info className="size-3.5" />
        </button>
      </div>
      <p className="mt-2.5 text-[11px] font-medium leading-4 text-[#64748b]">{label}</p>
      <p className="mt-1 text-[18px] font-bold leading-6 tracking-[-0.03em] tabular-nums text-[#0f172a]">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#94a3b8]">{helper}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
        status === "Submitted" && "bg-[#e8f1ff] text-[#2563eb]",
        status === "Awaiting Funds" && "bg-[#fff7ed] text-[#ea580c]",
        status === "Allocated" && "bg-[#e7f8ef] text-[#15803d]",
        status === "Under Review" && "bg-[#f3e8ff] text-[#7c3aed]",
        status === "Settled" && "bg-[#e7f8ef] text-[#15803d]",
        status === "Rejected" && "bg-[#fee2e2] text-[#dc2626]",
      )}
    >
      {status}
    </span>
  )
}

function TypeCell({ type }: { type: RequestType }) {
  const isSub = type === "Subscription"
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0f172a]">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-md",
          isSub ? "bg-[#e8f1ff] text-[#2563eb]" : "bg-[#fce7f3] text-[#db2777]",
        )}
      >
        {isSub ? <ArrowDownToLine className="size-3" /> : <ArrowUpFromLine className="size-3" />}
      </span>
      {type}
    </span>
  )
}

const fieldClass =
  "h-9 rounded-lg border-[#e2e8f0] bg-white text-[12px] shadow-none focus-visible:ring-[#2563eb]/20"
const selectTriggerClass = "h-9 w-full rounded-lg border-[#e2e8f0] bg-white text-[12px] shadow-none"

export function LpSubscriptionsRedemptionsScreen({
  highlight,
}: {
  highlight?: WorkflowHighlight
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [rows, setRows] = React.useState<HistoryRow[]>(INITIAL_HISTORY)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [subscriptionFiles, setSubscriptionFiles] = React.useState<File[]>([])

  const [subscription, setSubscription] = React.useState({
    fund: FUNDS[0],
    shareClass: "Class A",
    amount: "2000000",
    currency: "USD",
    fundingDate: "2025-06-12",
    bank: BANKS[0],
  })

  const [redemption, setRedemption] = React.useState({
    mode: "amount" as RedemptionMode,
    value: "1000000",
    earliestDealingDate: "2025-06-30",
    estimatedSettlementDate: "2025-07-03",
  })

  const subAmount = Number(subscription.amount) || 0
  const mgmtFee = subAmount * MGMT_FEE_RATE
  const otherFee = subAmount > 0 ? OTHER_FEE_FLAT : 0
  const estimatedSubUnits = subAmount > 0 ? subAmount / NAV : 0
  const estimatedTotalInvestment = subAmount + mgmtFee + otherFee

  const redemptionInput = Number(redemption.value) || 0
  const estimatedRedeemUnits =
    redemption.mode === "full"
      ? AVAILABLE_UNITS
      : redemption.mode === "units"
        ? redemptionInput
        : redemptionInput / NAV
  const estimatedGross = estimatedRedeemUnits * NAV
  const estimatedSettlement = Math.max(estimatedGross * (1 - REDEMPTION_FEE_RATE), 0)
  const remainingValue = Math.max((AVAILABLE_UNITS - estimatedRedeemUnits) * NAV, 0)
  const aboveMinBalance = redemption.mode === "full" || remainingValue >= MIN_BALANCE

  const filteredRows = rows.filter((row) => {
    const typeOk =
      typeFilter === "all" ||
      (typeFilter === "subscription" && row.type === "Subscription") ||
      (typeFilter === "redemption" && row.type === "Redemption")
    const statusOk = statusFilter === "all" || row.status === statusFilter
    return typeOk && statusOk
  })

  const onUploadFiles = (files: FileList | null) => {
    if (!files?.length) return
    const next = Array.from(files)
    setSubscriptionFiles((prev) => [...prev, ...next])
    toast.success(`${next.length} file(s) attached.`)
  }

  const reviewSubscription = (event: React.FormEvent) => {
    event.preventDefault()
    if (subAmount <= 0) {
      toast.error("Enter a subscription amount.")
      return
    }
    const id = `SR-2025-${String(200 + rows.length).padStart(5, "0")}`
    setRows((current) => [
      {
        id,
        type: "Subscription",
        fund: subscription.fund,
        shareClass: subscription.shareClass,
        amount: subAmount,
        units: estimatedSubUnits,
        unitsEstimated: true,
        status: "Submitted",
        submittedOn: formatDisplayDate(new Date().toISOString().slice(0, 10)),
        expectedSettlement: formatDisplayDate(subscription.fundingDate),
      },
      ...current,
    ])
    toast.success("Subscription request ready for review.", {
      description: `${id} · ${money(subAmount)} · ~${unitsFmt(estimatedSubUnits)} units`,
    })
  }

  const reviewRedemption = (event: React.FormEvent) => {
    event.preventDefault()
    if (redemption.mode !== "full" && redemptionInput <= 0) {
      toast.error("Enter a redemption amount or units.")
      return
    }
    if (estimatedRedeemUnits > AVAILABLE_UNITS + 0.01) {
      toast.error("Requested units exceed available position.")
      return
    }
    if (!aboveMinBalance) {
      toast.error("Redemption would breach the minimum balance.")
      return
    }
    const id = `SR-2025-${String(200 + rows.length).padStart(5, "0")}`
    setRows((current) => [
      {
        id,
        type: "Redemption",
        fund: FUNDS[0],
        shareClass: "Class A",
        amount: estimatedSettlement,
        units: estimatedRedeemUnits,
        unitsEstimated: true,
        status: "Under Review",
        submittedOn: formatDisplayDate(new Date().toISOString().slice(0, 10)),
        expectedSettlement: formatDisplayDate(redemption.estimatedSettlementDate),
      },
      ...current,
    ])
    toast.success("Redemption request ready for review.", {
      description: `${id} · ~${unitsFmt(estimatedRedeemUnits)} units · ${money(estimatedSettlement)}`,
    })
  }

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#0f172a]">Subscriptions &amp; Redemptions</h1>
        <p className="mt-1 text-[13px] leading-5 text-[#64748b]">
          Submit new subscription or redemption requests and track their status.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<Wallet className="size-4" />}
          iconBg="bg-[#e8f1ff]"
          iconColor="text-[#2563eb]"
          label="Account Value"
          value={moneyCompact(24_680_000)}
          helper={`As of ${AS_OF}`}
        />
        <KpiCard
          icon={<Layers className="size-4" />}
          iconBg="bg-[#e6faf8]"
          iconColor="text-[#0d9488]"
          label="Units Held"
          value={unitsFmt(2_468_311.45)}
          helper={`As of ${AS_OF}`}
        />
        <KpiCard
          icon={<RefreshCw className="size-4" />}
          iconBg="bg-[#f3e8ff]"
          iconColor="text-[#7c3aed]"
          label="NAV per Unit"
          value={money(NAV, 4)}
          helper={`As of ${AS_OF}`}
        />
        <KpiCard
          icon={<Coins className="size-4" />}
          iconBg="bg-[#fff1e8]"
          iconColor="text-[#ea580c]"
          label="Available to Redeem"
          value={moneyCompact(AVAILABLE_VALUE)}
          helper={`${unitsFmt(AVAILABLE_UNITS)} Units`}
        />
        <KpiCard
          icon={<ArrowDownToLine className="size-4" />}
          iconBg="bg-[#f3e8ff]"
          iconColor="text-[#9333ea]"
          label="Pending Subscriptions"
          value={moneyCompact(2_500_000)}
          helper={`${unitsFmt(250_000)} Units`}
        />
        <KpiCard
          icon={<ArrowUpFromLine className="size-4" />}
          iconBg="bg-[#fee2e2]"
          iconColor="text-[#dc2626]"
          label="Pending Redemptions"
          value={moneyCompact(1_200_000)}
          helper={`${unitsFmt(120_000)} Units`}
        />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px] xl:grid-rows-[auto_auto]">
        {/* Subscription — top left */}
        <section
          className={cn(
            "@container flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] xl:col-start-1 xl:row-start-1",
            highlight === "subscriptions" && "ring-2 ring-[#93c5fd]",
          )}
        >
          <div className="flex items-center gap-2.5 px-4 pt-4 sm:px-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[#2563eb]">
              <ArrowDownToLine className="size-4" strokeWidth={2.25} />
            </span>
            <h2 className="text-[14px] font-semibold leading-5 text-[#0f172a]">
              New Subscription Request
            </h2>
          </div>

          <form onSubmit={reviewSubscription} className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5">
            {/* Form | Estimate — equal height columns */}
            <div className="grid min-w-0 flex-1 grid-cols-1 items-stretch gap-4 @[560px]:grid-cols-[minmax(0,1fr)_minmax(0,42%)]">
              {/* Left column */}
              <div className="flex min-w-0 flex-col gap-4">
                <div className="space-y-3.5">
                  <FormRow label="Fund">
                    <Select
                      value={subscription.fund}
                      onValueChange={(fund) => setSubscription((v) => ({ ...v, fund }))}
                    >
                      <SelectTrigger className="h-9 w-full rounded-md border-[#d1d5db] bg-white text-[12px] text-[#0f172a] shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUNDS.map((fund) => (
                          <SelectItem key={fund} value={fund}>
                            {fund}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormRow>

                  <FormRow label="Share Class">
                    <Select
                      value={subscription.shareClass}
                      onValueChange={(shareClass) => setSubscription((v) => ({ ...v, shareClass }))}
                    >
                      <SelectTrigger className="h-9 w-full rounded-md border-[#d1d5db] bg-white text-[12px] text-[#0f172a] shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Class A">Class A</SelectItem>
                        <SelectItem value="Class I">Class I</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormRow>

                  <FormRow label="Amount">
                    <div className="flex overflow-hidden rounded-md border border-[#d1d5db]">
                      <Select
                        value={subscription.currency}
                        onValueChange={(currency) => setSubscription((v) => ({ ...v, currency }))}
                      >
                        <SelectTrigger className="h-9 w-[70px] shrink-0 rounded-none border-0 border-r border-[#d1d5db] bg-white text-[12px] shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={Number(subscription.amount || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, "")
                          if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                            setSubscription((v) => ({ ...v, amount: raw }))
                          }
                        }}
                        className="h-9 min-w-0 flex-1 rounded-none border-0 text-[12px] tabular-nums text-[#0f172a] shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </FormRow>

                  <FormRow label="Expected Funding Date">
                    <label className="relative flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-[#d1d5db] bg-white px-2.5 text-[12px] text-[#0f172a]">
                      <Calendar className="size-4 shrink-0 text-[#64748b]" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate">
                        {formatDisplayDate(subscription.fundingDate)}
                      </span>
                      <input
                        type="date"
                        value={subscription.fundingDate}
                        onChange={(e) =>
                          setSubscription((v) => ({ ...v, fundingDate: e.target.value }))
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Expected Funding Date"
                      />
                    </label>
                  </FormRow>

                  <FormRow label="Source Bank Account">
                    <Select
                      value={subscription.bank}
                      onValueChange={(bank) => setSubscription((v) => ({ ...v, bank }))}
                    >
                      <SelectTrigger className="h-9 w-full rounded-md border-[#d1d5db] bg-white text-[12px] text-[#0f172a] shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormRow>
                </div>

                <div>
                  <p className="mb-2 text-[13px] font-semibold leading-5 text-[#0f172a]">
                    Supporting Documents
                  </p>
                  <div
                    className="rounded-md border border-dashed border-[#cbd5e1] bg-white px-4 py-5"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      onUploadFiles(e.dataTransfer.files)
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        onUploadFiles(e.target.files)
                        e.target.value = ""
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full border-[#93c5fd] bg-white px-3 text-[12px] font-medium text-[#2563eb] shadow-none hover:bg-[#eff6ff]"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="size-3.5" strokeWidth={2.25} />
                        Upload Files
                      </Button>
                      <span className="text-[13px] text-[#64748b]">or drag and drop</span>
                    </div>
                    <p className="mt-2 text-[12px] leading-4 text-[#94a3b8]">
                      {subscriptionFiles.length
                        ? `${subscriptionFiles.length} file(s) selected`
                        : "PDF, DOCX, XLSX (Max 25MB each)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right column — stretches to match left */}
              <div className="flex h-full min-w-0 flex-col gap-3">
                <div className="flex flex-1 flex-col rounded-lg bg-[#f5f8fc] px-5 py-5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-semibold leading-5 text-[#0f172a]">
                      Allocation Estimate
                    </p>
                    <Info className="size-3.5 shrink-0 text-[#94a3b8]" aria-hidden />
                  </div>
                  <p className="mt-0.5 text-[12px] leading-4 text-[#64748b]">Based on current NAV</p>

                  <div className="mt-5 flex flex-1 flex-col">
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="text-[#64748b]">Estimated NAV per Unit</span>
                        <span className="shrink-0 font-semibold tabular-nums text-[#0f172a]">
                          {money(NAV, 4)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="text-[#64748b]">Estimated Units</span>
                        <span className="shrink-0 font-bold tabular-nums text-[#0f172a]">
                          {unitsFmt(estimatedSubUnits)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2.5 text-[13px] font-semibold text-[#0f172a]">Estimated Fees</p>
                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between gap-3 text-[13px]">
                          <span className="text-[#64748b]">Management Fee (Est.)</span>
                          <span className="shrink-0 font-semibold tabular-nums text-[#0f172a]">
                            {money(mgmtFee)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 text-[13px]">
                          <span className="text-[#64748b]">Other Fees (Est.)</span>
                          <span className="shrink-0 font-semibold tabular-nums text-[#0f172a]">
                            {money(otherFee)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-[#e2e8f0] pt-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13px] font-semibold text-[#0f172a]">
                          Estimated Total Investment
                        </span>
                        <span className="shrink-0 text-[15px] font-bold tabular-nums text-[#0f172a]">
                          {money(estimatedTotalInvestment)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 rounded-lg border border-[#bfdbfe] bg-[#ebf1ff] px-3.5 py-3 text-[12px] leading-[18px] text-[#2563eb]">
                  <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
                  <span>
                    Final allocation will be based on the NAV on the applicable dealing date and may
                    differ.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-end pt-4">
              <Button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-[#2563eb] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#1d4ed8]"
              >
                Review Subscription Request
              </Button>
            </div>
          </form>
        </section>

        {/* Redemption — top middle */}
        <section
          className={cn(
            "@container flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] xl:col-start-2 xl:row-start-1",
            highlight === "redemptions" && "ring-2 ring-[#fca5a5]",
          )}
        >
          <div className="flex items-center gap-2.5 px-6 pb-0 pt-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ffe4e6] text-[#f43f5e]">
              <RefreshCw className="size-4" strokeWidth={2.25} />
            </span>
            <h2 className="text-[15px] font-semibold leading-5 tracking-[-0.01em] text-[#0f172a]">
              New Redemption Request
            </h2>
          </div>

          <form onSubmit={reviewRedemption} className="flex min-h-0 flex-1 flex-col px-6 pb-5 pt-5">
            <div className="flex flex-1 flex-col gap-5">
              <div>
                <div className="mb-2.5 flex items-center gap-1.5">
                  <Label className="text-[13px] font-medium leading-5 text-[#0f172a]">
                    Redemption Type
                  </Label>
                  <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: "amount", label: "Amount" },
                      { id: "units", label: "Units" },
                      { id: "full", label: "Full Redemption" },
                    ] as const
                  ).map((option) => {
                    const selected = redemption.mode === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          if (option.id === "full") {
                            setRedemption((v) => ({
                              ...v,
                              mode: "full",
                              value: String(AVAILABLE_VALUE),
                            }))
                          } else {
                            setRedemption((v) => ({ ...v, mode: option.id }))
                          }
                        }}
                        className={cn(
                          "flex h-11 items-center justify-center gap-2 rounded-md border bg-white px-2 text-[13px] font-medium",
                          selected
                            ? "border-[#2563eb] text-[#0f172a]"
                            : "border-[#e5e7eb] text-[#0f172a]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                            selected ? "border-[#2563eb]" : "border-[#cbd5e1]",
                          )}
                        >
                          {selected && <span className="size-2 rounded-full bg-[#2563eb]" />}
                        </span>
                        <span className="leading-none">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {redemption.mode !== "full" && (
                <FormRow
                  label={redemption.mode === "units" ? "Requested Units" : "Requested Amount"}
                  labelClassName="font-medium text-[#0f172a]"
                >
                  <div className="flex gap-2">
                    {redemption.mode === "amount" && (
                      <Select
                        value="USD"
                        onValueChange={() => {
                          /* currency fixed in mock */
                        }}
                      >
                        <SelectTrigger className="h-9 w-[78px] shrink-0 rounded-md border-[#d1d5db] bg-white text-[13px] text-[#0f172a] shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={
                        redemption.mode === "amount"
                          ? Number(redemption.value || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : redemption.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "")
                        if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                          setRedemption((v) => ({ ...v, value: raw }))
                        }
                      }}
                      className="h-9 flex-1 rounded-md border-[#d1d5db] text-right text-[13px] tabular-nums text-[#0f172a] shadow-none"
                    />
                  </div>
                </FormRow>
              )}

              <div className="space-y-2.5 border-b border-[#e5e7eb] pb-5">
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-[#64748b]">Estimated Units to be Cancelled</span>
                  <span className="font-bold tabular-nums text-[#0f172a]">
                    {unitsFmt(estimatedRedeemUnits)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-[#64748b]">Estimated Settlement Amount</span>
                  <span className="font-bold tabular-nums text-[#0f172a]">
                    {money(estimatedSettlement)}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="font-semibold text-[#0f172a]">Notice Period</span>
                  <span className="font-semibold text-[#0f172a]">{NOTICE_DAYS} Calendar Days</span>
                </div>

                <FormRow label="Earliest Dealing Date" labelClassName="text-[#64748b]">
                  <label className="relative flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-[#d1d5db] bg-white px-3 text-[13px] text-[#0f172a]">
                    <span className="truncate">{formatDisplayDate(redemption.earliestDealingDate)}</span>
                    <Calendar className="size-4 shrink-0 text-[#64748b]" strokeWidth={1.75} />
                    <input
                      type="date"
                      value={redemption.earliestDealingDate}
                      onChange={(e) => {
                        const earliest = e.target.value
                        setRedemption((v) => ({
                          ...v,
                          earliestDealingDate: earliest,
                          estimatedSettlementDate: addCalendarDays(earliest, 3),
                        }))
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Earliest Dealing Date"
                    />
                  </label>
                </FormRow>

                <FormRow label="Estimated Settlement Date" labelClassName="text-[#64748b]">
                  <label className="relative flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-[#d1d5db] bg-white px-3 text-[13px] text-[#0f172a]">
                    <span className="truncate">
                      {formatDisplayDate(redemption.estimatedSettlementDate)}
                    </span>
                    <Calendar className="size-4 shrink-0 text-[#64748b]" strokeWidth={1.75} />
                    <input
                      type="date"
                      value={redemption.estimatedSettlementDate}
                      onChange={(e) =>
                        setRedemption((v) => ({
                          ...v,
                          estimatedSettlementDate: e.target.value,
                        }))
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Estimated Settlement Date"
                    />
                  </label>
                </FormRow>
              </div>

              <div className="flex gap-2.5 rounded-md border border-[#fde68a] bg-[#fffbeb] px-3.5 py-3 text-[12px] leading-[18px] text-[#78716c]">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#f59e0b]" strokeWidth={2} />
                <span>
                  Estimates are subject to change based on the final NAV on the dealing date. Actual
                  settlement may vary.
                </span>
              </div>
            </div>

            <div className="mt-auto flex justify-end pt-5">
              <Button
                type="submit"
                className="h-10 w-full shrink-0 rounded-full bg-[#ef4444] text-[13px] font-semibold text-white shadow-none hover:bg-[#dc2626] sm:w-auto sm:min-w-[260px] sm:px-6"
              >
                Review Redemption Request
              </Button>
            </div>
          </form>
        </section>

        {/* Validation Rules — single sidebar card */}
        <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:self-start">
          <div className="border-b border-[#f3f4f6] px-5 py-4">
            <h2 className="text-[15px] font-semibold leading-5 text-[#0f172a]">Validation Rules</h2>
          </div>

          {/* Minimum Balance */}
          <div className="border-b border-[#f3f4f6] px-5 py-4">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-[#0f172a]">Minimum Balance</p>
              <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
            </div>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[#64748b]">
              Minimum account balance after redemption must be at least {money(MIN_BALANCE, 0)} or
              100,000 units.
            </p>
            <div
              className={cn(
                "mt-2.5 flex items-center gap-1.5 text-[12px]",
                aboveMinBalance ? "text-[#0f172a]" : "text-[#dc2626]",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full",
                  aboveMinBalance ? "bg-[#10b981]" : "bg-[#ef4444]",
                )}
              >
                <CheckCircle2 className="size-2.5 text-white" strokeWidth={3} />
              </span>
              <span>
                {aboveMinBalance
                  ? "You will remain above the minimum balance."
                  : "This request would breach the minimum balance."}
              </span>
            </div>
          </div>

          {/* Notice Period */}
          <div className="border-b border-[#f3f4f6] px-5 py-4">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-[#0f172a]">Notice Period</p>
              <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
            </div>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[#64748b]">
              Redemptions require {NOTICE_DAYS} calendar days&apos; notice.
            </p>
            <div className="mt-3">
              <p className="text-[11px] font-medium text-[#64748b]">Next eligible dealing date</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#0f172a]">
                {formatDisplayDate(redemption.earliestDealingDate)}
              </p>
            </div>
          </div>

          {/* Dealing Frequency */}
          <div className="border-b border-[#f3f4f6] px-5 py-4">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-[#0f172a]">Dealing Frequency</p>
              <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
            </div>
            <p className="mt-1.5 text-[12px] leading-[18px] text-[#64748b]">
              Monthly on the last business day.
            </p>
            <div className="mt-3">
              <p className="text-[11px] font-medium text-[#64748b]">Next eligible date</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[#0f172a]">
                {formatDisplayDate(redemption.earliestDealingDate)}
              </p>
            </div>
          </div>

          {/* Compliance Checks */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-[#0f172a]">Compliance Checks</p>
              <Info className="size-3.5 text-[#94a3b8]" aria-hidden />
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                "Accredited Investor Verified",
                "KYC Status: Approved",
                "No Unsettled Capital Calls",
                "No Legal Holds",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[12px] text-[#475569]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#10b981]" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="outline"
              className="mt-5 h-10 w-full rounded-full border-[#bfdbfe] bg-white text-[13px] font-semibold text-[#2563eb] shadow-none hover:bg-[#eff6ff]"
              onClick={() => toast.message("Opening full terms (mock).")}
            >
              View Full Terms
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
        </section>

        {/* History — under both request cards */}
        <section className="overflow-hidden rounded-xl border border-[#e8edf5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:col-span-2 xl:col-start-1 xl:row-start-2">
        <div className="flex flex-col gap-3 border-b border-[#eef2f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14px] font-semibold text-[#0f172a]">
              Subscriptions &amp; Redemptions History
            </h2>
            <button
              type="button"
              className="rounded-full p-0.5 text-[#94a3b8] hover:text-[#64748b]"
              aria-label="History info"
              onClick={() =>
                toast.message("History", {
                  description: "Investor-scoped subscription and redemption requests.",
                })
              }
            >
              <Info className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[130px] rounded-full border-[#e2e8f0] bg-white text-[11px] shadow-none">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscriptions</SelectItem>
                <SelectItem value="redemption">Redemptions</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[140px] rounded-full border-[#e2e8f0] bg-white text-[11px] shadow-none">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(
                  [
                    "Submitted",
                    "Awaiting Funds",
                    "Allocated",
                    "Under Review",
                    "Settled",
                    "Rejected",
                  ] as RequestStatus[]
                ).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full border-[#93c5fd] bg-white px-3 text-[11px] font-semibold text-[#2563eb] shadow-none hover:bg-[#eff6ff]"
              onClick={() => toast.success("Mock history CSV downloaded.")}
            >
              <Download className="size-3.5" />
              Download
            </Button>
          </div>
        </div>

        <div className="w-full overflow-auto">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e8edf5] bg-[#f8fafc]">
                {[
                  "ID",
                  "Type",
                  "Fund",
                  "Share Class",
                  "Amount / Units",
                  "Status",
                  "Submitted On",
                  "Expected Settlement",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="h-9 whitespace-nowrap px-3 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-24 text-center text-[12px] text-[#64748b]">
                    No requests match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc]/80">
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <button
                        type="button"
                        className="text-[12px] font-semibold text-[#2563eb] hover:underline"
                        onClick={() => toast.message(row.id, { description: `${row.type} · ${row.status}` })}
                      >
                        {row.id}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <TypeCell type={row.type} />
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 text-[12px] text-[#334155]">
                      {row.fund}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#334155]">
                      {row.shareClass}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px]">
                      <div className="font-medium tabular-nums text-[#0f172a]">{money(row.amount)}</div>
                      <div className="text-[10px] text-[#94a3b8]">
                        {unitsFmt(row.units)} Units{row.unitsEstimated ? " (Est.)" : ""}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#475569]">
                      {row.submittedOn}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#475569]">
                      {row.expectedSettlement ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full text-[#64748b]"
                            aria-label={`Actions for ${row.id}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => toast.message(`Viewing ${row.id}`)}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toast.success(`Mock confirmation for ${row.id} downloaded.`)}
                          >
                            Download confirmation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  )
}
