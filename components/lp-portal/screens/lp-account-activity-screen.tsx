"use client"

import * as React from "react"
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Receipt,
  RefreshCcw,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type TxStatus = "Posted" | "Settled" | "Under Review" | "Pending"
type TxKind =
  | "contribution"
  | "distribution"
  | "subscription"
  | "redemption"
  | "fee"
  | "net"

type ActivityRow = {
  id: string
  transactionDate: string
  effectiveDate: string
  fund: string
  type: string
  kind: Exclude<TxKind, "net">
  reference: string
  currency: string
  originalAmount: number
  reportingAmount: number
  exchangeRate: number
  status: TxStatus
  structure: "LP" | "Open-End" | "Credit"
  investor: string
  postedDate: string
  postedBy: string
  notes: string
  documents: Array<{ name: string; date: string; size: string }>
  fxNote: string
}

const AS_OF = "May 31, 2025"
const INVESTOR = "Arcus Capital Partners LP"

const SEED_ROWS: ActivityRow[] = [
  {
    id: "txn-001",
    transactionDate: "May 28, 2025",
    effectiveDate: "May 28, 2025",
    fund: "Arcus Growth Fund V, L.P.",
    type: "Capital Call Funded",
    kind: "contribution",
    reference: "CC-000345",
    currency: "USD",
    originalAmount: 6_250_000,
    reportingAmount: 6_250_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "May 28, 2025",
    postedBy: "System",
    notes: "Capital call funded via wire on May 28, 2025. Payment received in full.",
    documents: [
      { name: "Capital Call Notice CC-000345.pdf", date: "May 20, 2025", size: "248 KB" },
      { name: "Wire Confirmation CC-000345.pdf", date: "May 28, 2025", size: "96 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-002",
    transactionDate: "May 15, 2025",
    effectiveDate: "May 15, 2025",
    fund: "Arcus Opportunities Fund II, L.P.",
    type: "Distribution Paid",
    kind: "distribution",
    reference: "DIST-000128",
    currency: "USD",
    originalAmount: 1_850_000,
    reportingAmount: 1_850_000,
    exchangeRate: 1,
    status: "Settled",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "May 15, 2025",
    postedBy: "Fund Operations",
    notes: "Q1 distribution paid to registered investor bank account.",
    documents: [
      { name: "Distribution Notice DIST-000128.pdf", date: "May 5, 2025", size: "182 KB" },
      { name: "Payment Advice DIST-000128.pdf", date: "May 15, 2025", size: "74 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-003",
    transactionDate: "May 1, 2025",
    effectiveDate: "May 1, 2025",
    fund: "Arcus Strategic Income Fund L.P.",
    type: "Subscription",
    kind: "subscription",
    reference: "SUB-000089",
    currency: "USD",
    originalAmount: 5_000_000,
    reportingAmount: 5_000_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "Open-End",
    investor: INVESTOR,
    postedDate: "May 1, 2025",
    postedBy: "Investor Accounting",
    notes: "Subscription accepted at May 1 dealing NAV. Units allocated.",
    documents: [
      { name: "Subscription Confirmation SUB-000089.pdf", date: "May 1, 2025", size: "156 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-004",
    transactionDate: "Apr 22, 2025",
    effectiveDate: "Apr 22, 2025",
    fund: "Arcus Credit Opportunities Fund II L.P.",
    type: "Management Fee",
    kind: "fee",
    reference: "FEE-2025-04",
    currency: "USD",
    originalAmount: 214_500,
    reportingAmount: 214_500,
    exchangeRate: 1,
    status: "Posted",
    structure: "Credit",
    investor: INVESTOR,
    postedDate: "Apr 22, 2025",
    postedBy: "System",
    notes: "April management fee accrual posted per fund terms.",
    documents: [{ name: "Fee Statement April 2025.pdf", date: "Apr 22, 2025", size: "112 KB" }],
    fxNote: "No FX required",
  },
  {
    id: "txn-005",
    transactionDate: "Apr 10, 2025",
    effectiveDate: "Apr 10, 2025",
    fund: "Arcus Growth Fund IV, L.P.",
    type: "Capital Call Funded",
    kind: "contribution",
    reference: "CC-000312",
    currency: "USD",
    originalAmount: 3_400_000,
    reportingAmount: 3_400_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Apr 10, 2025",
    postedBy: "System",
    notes: "Capital call funded in full before the due date.",
    documents: [
      { name: "Capital Call Notice CC-000312.pdf", date: "Mar 28, 2025", size: "236 KB" },
      { name: "Wire Confirmation CC-000312.pdf", date: "Apr 10, 2025", size: "88 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-006",
    transactionDate: "Mar 31, 2025",
    effectiveDate: "Mar 31, 2025",
    fund: "Arcus Strategic Income Fund L.P.",
    type: "Redemption",
    kind: "redemption",
    reference: "RED-000041",
    currency: "USD",
    originalAmount: 1_250_000,
    reportingAmount: 1_250_000,
    exchangeRate: 1,
    status: "Under Review",
    structure: "Open-End",
    investor: INVESTOR,
    postedDate: "—",
    postedBy: "—",
    notes: "Redemption request under review for March dealing cycle.",
    documents: [{ name: "Redemption Request RED-000041.pdf", date: "Mar 20, 2025", size: "134 KB" }],
    fxNote: "No FX required",
  },
  {
    id: "txn-007",
    transactionDate: "Mar 18, 2025",
    effectiveDate: "Mar 18, 2025",
    fund: "Arcus Growth Fund V, L.P.",
    type: "Distribution Paid",
    kind: "distribution",
    reference: "DIST-000119",
    currency: "EUR",
    originalAmount: 920_000,
    reportingAmount: 998_200,
    exchangeRate: 1.085,
    status: "Settled",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Mar 18, 2025",
    postedBy: "Fund Operations",
    notes: "EUR distribution converted at historical posting rate.",
    documents: [
      { name: "Distribution Notice DIST-000119.pdf", date: "Mar 8, 2025", size: "198 KB" },
      { name: "FX Memo DIST-000119.pdf", date: "Mar 18, 2025", size: "64 KB" },
    ],
    fxNote: "Historical FX rate 1.0850 applied on Mar 18, 2025",
  },
  {
    id: "txn-008",
    transactionDate: "Feb 28, 2025",
    effectiveDate: "Feb 28, 2025",
    fund: "Arcus Growth Fund V, L.P.",
    type: "Capital Call Funded",
    kind: "contribution",
    reference: "CC-000298",
    currency: "USD",
    originalAmount: 4_100_000,
    reportingAmount: 4_100_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Feb 28, 2025",
    postedBy: "System",
    notes: "Call 6 funded in full.",
    documents: [
      { name: "Capital Call Notice CC-000298.pdf", date: "Feb 12, 2025", size: "241 KB" },
      { name: "Wire Confirmation CC-000298.pdf", date: "Feb 28, 2025", size: "91 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-009",
    transactionDate: "Feb 14, 2025",
    effectiveDate: "Feb 14, 2025",
    fund: "Arcus Strategic Income Fund L.P.",
    type: "Subscription",
    kind: "subscription",
    reference: "SUB-000077",
    currency: "USD",
    originalAmount: 2_500_000,
    reportingAmount: 2_500_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "Open-End",
    investor: INVESTOR,
    postedDate: "Feb 14, 2025",
    postedBy: "Investor Accounting",
    notes: "Additional subscription at February dealing date.",
    documents: [
      { name: "Subscription Confirmation SUB-000077.pdf", date: "Feb 14, 2025", size: "149 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-010",
    transactionDate: "Jan 31, 2025",
    effectiveDate: "Jan 31, 2025",
    fund: "Arcus Opportunities Fund II, L.P.",
    type: "Distribution Paid",
    kind: "distribution",
    reference: "DIST-000104",
    currency: "USD",
    originalAmount: 2_150_000,
    reportingAmount: 2_150_000,
    exchangeRate: 1,
    status: "Settled",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Jan 31, 2025",
    postedBy: "Fund Operations",
    notes: "Year-end distribution settled.",
    documents: [
      { name: "Distribution Notice DIST-000104.pdf", date: "Jan 20, 2025", size: "176 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-011",
    transactionDate: "Jan 15, 2025",
    effectiveDate: "Jan 15, 2025",
    fund: "Arcus Credit Opportunities Fund II L.P.",
    type: "Management Fee",
    kind: "fee",
    reference: "FEE-2025-01",
    currency: "GBP",
    originalAmount: 168_000,
    reportingAmount: 212_940,
    exchangeRate: 1.2675,
    status: "Posted",
    structure: "Credit",
    investor: INVESTOR,
    postedDate: "Jan 15, 2025",
    postedBy: "System",
    notes: "GBP fee converted using historical fund FX policy rate.",
    documents: [{ name: "Fee Statement January 2025.pdf", date: "Jan 15, 2025", size: "118 KB" }],
    fxNote: "Historical FX rate 1.2675 applied on Jan 15, 2025",
  },
  {
    id: "txn-012",
    transactionDate: "Dec 20, 2024",
    effectiveDate: "Dec 20, 2024",
    fund: "Arcus Growth Fund IV, L.P.",
    type: "Capital Call Funded",
    kind: "contribution",
    reference: "CC-000276",
    currency: "USD",
    originalAmount: 2_850_000,
    reportingAmount: 2_850_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Dec 20, 2024",
    postedBy: "System",
    notes: "Year-end capital call funded.",
    documents: [
      { name: "Capital Call Notice CC-000276.pdf", date: "Dec 5, 2024", size: "229 KB" },
      { name: "Wire Confirmation CC-000276.pdf", date: "Dec 20, 2024", size: "85 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-013",
    transactionDate: "Dec 2, 2024",
    effectiveDate: "Dec 2, 2024",
    fund: "Arcus Strategic Income Fund L.P.",
    type: "Redemption",
    kind: "redemption",
    reference: "RED-000033",
    currency: "USD",
    originalAmount: 750_000,
    reportingAmount: 750_000,
    exchangeRate: 1,
    status: "Pending",
    structure: "Open-End",
    investor: INVESTOR,
    postedDate: "—",
    postedBy: "—",
    notes: "Pending dealing-date NAV confirmation.",
    documents: [{ name: "Redemption Request RED-000033.pdf", date: "Nov 22, 2024", size: "128 KB" }],
    fxNote: "No FX required",
  },
  {
    id: "txn-014",
    transactionDate: "Nov 15, 2024",
    effectiveDate: "Nov 15, 2024",
    fund: "Arcus Growth Fund V, L.P.",
    type: "Distribution Paid",
    kind: "distribution",
    reference: "DIST-000091",
    currency: "USD",
    originalAmount: 1_420_000,
    reportingAmount: 1_420_000,
    exchangeRate: 1,
    status: "Settled",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Nov 15, 2024",
    postedBy: "Fund Operations",
    notes: "Interim distribution paid.",
    documents: [
      { name: "Distribution Notice DIST-000091.pdf", date: "Nov 5, 2024", size: "171 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-015",
    transactionDate: "Oct 30, 2024",
    effectiveDate: "Oct 30, 2024",
    fund: "Arcus Opportunities Fund II, L.P.",
    type: "Capital Call Funded",
    kind: "contribution",
    reference: "CC-000251",
    currency: "USD",
    originalAmount: 1_975_000,
    reportingAmount: 1_975_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Oct 30, 2024",
    postedBy: "System",
    notes: "Call funded via wire.",
    documents: [
      { name: "Capital Call Notice CC-000251.pdf", date: "Oct 15, 2024", size: "220 KB" },
      { name: "Wire Confirmation CC-000251.pdf", date: "Oct 30, 2024", size: "82 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-016",
    transactionDate: "Sep 12, 2024",
    effectiveDate: "Sep 12, 2024",
    fund: "Arcus Strategic Income Fund L.P.",
    type: "Subscription",
    kind: "subscription",
    reference: "SUB-000061",
    currency: "USD",
    originalAmount: 3_750_000,
    reportingAmount: 3_750_000,
    exchangeRate: 1,
    status: "Posted",
    structure: "Open-End",
    investor: INVESTOR,
    postedDate: "Sep 12, 2024",
    postedBy: "Investor Accounting",
    notes: "Subscription accepted at September dealing NAV.",
    documents: [
      { name: "Subscription Confirmation SUB-000061.pdf", date: "Sep 12, 2024", size: "152 KB" },
    ],
    fxNote: "No FX required",
  },
  {
    id: "txn-017",
    transactionDate: "Aug 8, 2024",
    effectiveDate: "Aug 8, 2024",
    fund: "Arcus Growth Fund IV, L.P.",
    type: "Management Fee",
    kind: "fee",
    reference: "FEE-2024-08",
    currency: "USD",
    originalAmount: 198_400,
    reportingAmount: 198_400,
    exchangeRate: 1,
    status: "Posted",
    structure: "LP",
    investor: INVESTOR,
    postedDate: "Aug 8, 2024",
    postedBy: "System",
    notes: "August management fee posted.",
    documents: [{ name: "Fee Statement August 2024.pdf", date: "Aug 8, 2024", size: "109 KB" }],
    fxNote: "No FX required",
  },
  {
    id: "txn-018",
    transactionDate: "Jul 19, 2024",
    effectiveDate: "Jul 19, 2024",
    fund: "Arcus Credit Opportunities Fund II L.P.",
    type: "Distribution Paid",
    kind: "distribution",
    reference: "DIST-000072",
    currency: "USD",
    originalAmount: 640_000,
    reportingAmount: 640_000,
    exchangeRate: 1,
    status: "Settled",
    structure: "Credit",
    investor: INVESTOR,
    postedDate: "Jul 19, 2024",
    postedBy: "Fund Operations",
    notes: "Income distribution settled.",
    documents: [
      { name: "Distribution Notice DIST-000072.pdf", date: "Jul 8, 2024", size: "164 KB" },
    ],
    fxNote: "No FX required",
  },
]

const KIND_META: Record<
  Exclude<TxKind, "net">,
  { label: string; iconBg: string; iconColor: string; icon: React.ReactNode }
> = {
  contribution: {
    label: "Contributions",
    iconBg: "bg-[#dbeafe]",
    iconColor: "text-[#2563eb]",
    icon: <ArrowDownToLine className="size-3.5" strokeWidth={2.25} />,
  },
  distribution: {
    label: "Distributions",
    iconBg: "bg-[#dcfce7]",
    iconColor: "text-[#16a34a]",
    icon: <ArrowUpFromLine className="size-3.5" strokeWidth={2.25} />,
  },
  subscription: {
    label: "Subscriptions",
    iconBg: "bg-[#ede9fe]",
    iconColor: "text-[#7c3aed]",
    icon: <Receipt className="size-3.5" strokeWidth={2.25} />,
  },
  redemption: {
    label: "Redemptions",
    iconBg: "bg-[#ffedd5]",
    iconColor: "text-[#ea580c]",
    icon: <RefreshCcw className="size-3.5" strokeWidth={2.25} />,
  },
  fee: {
    label: "Fees",
    iconBg: "bg-[#fee2e2]",
    iconColor: "text-[#dc2626]",
    icon: <FileText className="size-3.5" strokeWidth={2.25} />,
  },
}

const KPI_CARDS: Array<{
  id: TxKind
  label: string
  value: string
  count: number
  iconBg: string
  iconColor: string
  icon: React.ReactNode
}> = [
  {
    id: "contribution",
    label: "Contributions",
    value: "$212.54M",
    count: 34,
    iconBg: "bg-[#dbeafe]",
    iconColor: "text-[#2563eb]",
    icon: <ArrowDownToLine className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "distribution",
    label: "Distributions",
    value: "$78.34M",
    count: 18,
    iconBg: "bg-[#dcfce7]",
    iconColor: "text-[#16a34a]",
    icon: <ArrowUpFromLine className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "subscription",
    label: "Subscriptions",
    value: "$104.21M",
    count: 22,
    iconBg: "bg-[#ede9fe]",
    iconColor: "text-[#7c3aed]",
    icon: <Receipt className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "redemption",
    label: "Redemptions",
    value: "$36.87M",
    count: 9,
    iconBg: "bg-[#ffedd5]",
    iconColor: "text-[#ea580c]",
    icon: <RefreshCcw className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "fee",
    label: "Fees",
    value: "$2.56M",
    count: 12,
    iconBg: "bg-[#fee2e2]",
    iconColor: "text-[#dc2626]",
    icon: <FileText className="size-4" strokeWidth={2.25} />,
  },
  {
    id: "net",
    label: "Net Cash Flow",
    value: "$277.66M",
    count: 74,
    iconBg: "bg-[#ccfbf1]",
    iconColor: "text-[#0d9488]",
    icon: <ArrowUpFromLine className="size-4 -rotate-45" strokeWidth={2.25} />,
  },
]

const TOTAL_TRANSACTIONS = 74

function buildActivityRows(): ActivityRow[] {
  const funds = [
    "Arcus Growth Fund V, L.P.",
    "Arcus Growth Fund IV, L.P.",
    "Arcus Opportunities Fund II, L.P.",
    "Arcus Credit Opportunities Fund II L.P.",
    "Arcus Strategic Income Fund L.P.",
  ]
  const kinds: Array<Exclude<TxKind, "net">> = [
    "contribution",
    "distribution",
    "subscription",
    "redemption",
    "fee",
  ]
  const typeByKind: Record<Exclude<TxKind, "net">, string> = {
    contribution: "Capital Call Funded",
    distribution: "Distribution Paid",
    subscription: "Subscription",
    redemption: "Redemption",
    fee: "Management Fee",
  }
  const statuses: TxStatus[] = ["Posted", "Settled", "Under Review", "Pending"]
  const currencies = ["USD", "EUR", "GBP", "USD"]

  const rows = [...SEED_ROWS]
  let i = SEED_ROWS.length
  while (rows.length < TOTAL_TRANSACTIONS) {
    const kind = kinds[i % kinds.length]
    const status = statuses[i % statuses.length]
    const currency = currencies[i % currencies.length]
    const amount = 250_000 + (i % 17) * 185_000
    const rate = currency === "USD" ? 1 : currency === "EUR" ? 1.08 + (i % 5) * 0.01 : 1.25 + (i % 4) * 0.01
    const month = ((i * 3) % 12) + 1
    const day = ((i * 5) % 27) + 1
    const year = i % 2 === 0 ? 2025 : 2024
    const date = new Date(Date.UTC(year, month - 1, day))
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
    const refPrefix =
      kind === "contribution"
        ? "CC"
        : kind === "distribution"
          ? "DIST"
          : kind === "subscription"
            ? "SUB"
            : kind === "redemption"
              ? "RED"
              : "FEE"
    const reference = `${refPrefix}-${String(400 + i).padStart(6, "0")}`
    const fund = funds[i % funds.length]
    rows.push({
      id: `txn-gen-${i}`,
      transactionDate: label,
      effectiveDate: label,
      fund,
      type: typeByKind[kind],
      kind,
      reference,
      currency,
      originalAmount: amount,
      reportingAmount: Math.round(amount * rate * 100) / 100,
      exchangeRate: rate,
      status,
      structure: fund.includes("Strategic") ? "Open-End" : fund.includes("Credit") ? "Credit" : "LP",
      investor: INVESTOR,
      postedDate: status === "Under Review" || status === "Pending" ? "—" : label,
      postedBy: status === "Under Review" || status === "Pending" ? "—" : i % 2 ? "Fund Operations" : "System",
      notes: `${typeByKind[kind]} recorded for investor reporting as of ${label}.`,
      documents: [
        { name: `${typeByKind[kind]} ${reference}.pdf`, date: label, size: `${90 + (i % 40)} KB` },
      ],
      fxNote: currency === "USD" ? "No FX required" : `Historical FX rate ${rate.toFixed(4)} applied on ${label}`,
    })
    i += 1
  }
  return rows
}

const ALL_ROWS = buildActivityRows()

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function downloadBlob(contents: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function InfoHint({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full text-[#94a3b8] hover:text-[#64748b]"
      aria-label={`${label} info`}
      onClick={(e) => {
        e.stopPropagation()
        toast.message(label)
      }}
    >
      <Info className="size-3.5" />
    </button>
  )
}

function StatusBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    Posted: "bg-[#dcfce7] text-[#15803d]",
    Settled: "bg-[#dbeafe] text-[#1d4ed8]",
    "Under Review": "bg-[#ffedd5] text-[#c2410c]",
    Pending: "bg-[#fef9c3] text-[#a16207]",
  }
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        styles[status],
      )}
    >
      {status}
    </span>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">{label}</label>
      {children}
    </div>
  )
}

export function LpAccountActivityScreen({
  initialStructure = "all",
}: {
  initialStructure?: string
}) {
  const [metric, setMetric] = React.useState<TxKind | "all">("all")
  const [fund, setFund] = React.useState("all")
  const [txType, setTxType] = React.useState("all")
  const [currency, setCurrency] = React.useState("all")
  const [structure, setStructure] = React.useState(() => {
    if (initialStructure === "private-capital") return "LP"
    if (initialStructure === "open-ended") return "Open-End"
    return "all"
  })
  const [status, setStatus] = React.useState("all")
  const [dateRange] = React.useState("Jun 1, 2024 - May 31, 2025")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(15)
  const [selectedId, setSelectedId] = React.useState<string | null>("txn-001")

  React.useEffect(() => {
    setStructure(
      initialStructure === "private-capital"
        ? "LP"
        : initialStructure === "open-ended"
          ? "Open-End"
          : "all",
    )
  }, [initialStructure])

  const filteredRows = React.useMemo(() => {
    return ALL_ROWS.filter((row) => {
      if (metric !== "all" && metric !== "net" && row.kind !== metric) return false
      if (fund !== "all" && row.fund !== fund) return false
      if (txType !== "all" && row.type !== txType) return false
      if (currency !== "all" && row.currency !== currency) return false
      if (structure !== "all" && row.structure !== structure) return false
      if (status !== "all" && row.status !== status) return false
      return true
    })
  }, [currency, fund, metric, status, structure, txType])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize)
  const selected = filteredRows.find((row) => row.id === selectedId) ?? null

  React.useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [page, safePage])

  React.useEffect(() => {
    if (selectedId && !filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0]?.id ?? null)
    }
  }, [filteredRows, selectedId])

  const clearFilters = () => {
    setMetric("all")
    setFund("all")
    setTxType("all")
    setCurrency("all")
    setStructure("all")
    setStatus("all")
    setPage(1)
    toast.message("Filters cleared")
  }

  const exportRows = (format: "csv" | "excel" | "pdf") => {
    const headers = [
      "Transaction Date",
      "Effective Date",
      "Fund",
      "Type",
      "Reference",
      "Currency",
      "Original Amount",
      "Reporting Amount",
      "Exchange Rate",
      "Status",
    ]
    const data = filteredRows.map((row) => [
      row.transactionDate,
      row.effectiveDate,
      row.fund,
      row.type,
      row.reference,
      row.currency,
      row.originalAmount,
      row.reportingAmount,
      row.exchangeRate,
      row.status,
    ])
    if (format === "csv") {
      const csv = [headers, ...data]
        .map((record) => record.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
        .join("\r\n")
      downloadBlob(csv, "account-activity.csv", "text/csv;charset=utf-8")
      toast.success("CSV exported (mock).")
      return
    }
    if (format === "excel") {
      const table = `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${data
        .map((record) => `<tr>${record.map((v) => `<td>${v}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`
      downloadBlob(table, "account-activity.xls", "application/vnd.ms-excel")
      toast.success("Excel exported (mock).")
      return
    }
    void import("jspdf").then(({ jsPDF }) => {
      const pdf = new jsPDF({ orientation: "landscape" })
      pdf.setFontSize(14)
      pdf.text("Arcus LP Portal — Account Activity", 14, 14)
      pdf.setFontSize(8)
      pdf.text(`As of ${AS_OF} · ${filteredRows.length} transactions`, 14, 22)
      data.slice(0, 40).forEach((record, index) => {
        pdf.text(
          `${record[0]}  ${record[2]}  ${record[3]}  ${record[4]}  ${record[5]} ${record[6]}  ${record[9]}`.slice(
            0,
            175,
          ),
          14,
          30 + index * 5.5,
        )
      })
      pdf.save("account-activity.pdf")
      toast.success("PDF exported (mock).")
    })
  }

  const funds = Array.from(new Set(ALL_ROWS.map((r) => r.fund)))
  const types = Array.from(new Set(ALL_ROWS.map((r) => r.type)))

  const pageNumbers = React.useMemo(() => {
    const max = Math.min(totalPages, 5)
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safePage <= 3) return [1, 2, 3, 4, 5]
    if (safePage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2]
  }, [safePage, totalPages])

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Account Activity</h1>
        <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
          Detailed view of all transactions across your investments
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map((card) => {
          const active = metric === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (card.id === "net") {
                  setMetric(metric === "net" ? "all" : "net")
                } else {
                  setMetric(metric === card.id ? "all" : card.id)
                }
                setPage(1)
              }}
              className={cn(
                "rounded-xl border bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition",
                active ? "border-[#93c5fd] ring-2 ring-[#bfdbfe]" : "border-[#e5e7eb] hover:border-[#cbd5e1]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      card.iconBg,
                      card.iconColor,
                    )}
                  >
                    {card.icon}
                  </span>
                  <p className="text-[12px] font-medium text-[#6b7280]">{card.label}</p>
                </div>
                <InfoHint label={card.label} />
              </div>
              <p className="mt-3 text-[20px] font-bold tabular-nums tracking-[-0.03em] text-[#0f172a]">
                {card.value}
              </p>
              <span className="mt-2 inline-block text-[12px] font-medium text-[#2563eb]">
                {card.count} Transactions
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid gap-3 lg:grid-cols-[repeat(6,minmax(0,1fr))_auto_auto] lg:items-end">
          <FilterField label="Fund">
            <Select value={fund} onValueChange={(v) => { setFund(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#e5e7eb] bg-white text-[12px] shadow-none">
                <SelectValue placeholder="All Funds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Transaction Type">
            <Select value={txType} onValueChange={(v) => { setTxType(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#e5e7eb] bg-white text-[12px] shadow-none">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Date Range">
            <div className="flex h-9 items-center rounded-lg border border-[#e5e7eb] bg-white px-3 text-[12px] text-[#0f172a]">
              {dateRange}
            </div>
          </FilterField>

          <FilterField label="Currency">
            <Select value={currency} onValueChange={(v) => { setCurrency(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#e5e7eb] bg-white text-[12px] shadow-none">
                <SelectValue placeholder="All Currencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Structure">
            <Select value={structure} onValueChange={(v) => { setStructure(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#e5e7eb] bg-white text-[12px] shadow-none">
                <SelectValue placeholder="All Structures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Structures</SelectItem>
                <SelectItem value="LP">LP</SelectItem>
                <SelectItem value="Open-End">Open-End</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Status">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-full rounded-lg border-[#e5e7eb] bg-white text-[12px] shadow-none">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Posted">Posted</SelectItem>
                <SelectItem value="Settled">Settled</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-[#e5e7eb] px-4 text-[12px] font-medium text-[#374151] shadow-none"
            onClick={() => toast.message("More filters (mock).")}
          >
            <SlidersHorizontal className="size-3.5" />
            More Filters
          </Button>

          <button
            type="button"
            className="h-9 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            onClick={clearFilters}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Table + detail */}
      <div
        className={cn(
          "grid items-start gap-4",
          selected ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1",
        )}
      >
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-4 py-3">
            <p className="text-[12px] text-[#6b7280]">
              Showing{" "}
              <span className="font-medium text-[#111827]">
                {filteredRows.length === 0 ? 0 : pageStart + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-[#111827]">
                {Math.min(pageStart + pageSize, filteredRows.length)}
              </span>{" "}
              of <span className="font-medium text-[#111827]">{filteredRows.length}</span> transactions
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-[#e5e7eb] px-3 text-[11px] font-medium text-[#374151] shadow-none"
                onClick={() => exportRows("csv")}
              >
                <FileSpreadsheet className="size-3.5 text-[#16a34a]" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-[#e5e7eb] px-3 text-[11px] font-medium text-[#374151] shadow-none"
                onClick={() => exportRows("excel")}
              >
                <FileSpreadsheet className="size-3.5 text-[#2563eb]" />
                Export Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-full border-[#e5e7eb] px-3 text-[11px] font-medium text-[#374151] shadow-none"
                onClick={() => exportRows("pdf")}
              >
                <FileText className="size-3.5 text-[#dc2626]" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-semibold text-[#6b7280]">
                  <th className="whitespace-nowrap px-4 py-2.5">Transaction Date ↓</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Effective Date</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Fund</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Type</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Reference</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Currency</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right">Original Amount</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right">Reporting Amount</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right">Exchange Rate</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-center">Document</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const kind = KIND_META[row.kind]
                  const isSelected = selected?.id === row.id
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f3f4f6] transition last:border-0",
                        isSelected
                          ? "bg-[#eff6ff] shadow-[inset_3px_0_0_0_#2563eb]"
                          : "hover:bg-[#f9fafb]",
                      )}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#2563eb]">
                        {row.transactionDate}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">{row.effectiveDate}</td>
                      <td className="max-w-[180px] truncate px-3 py-3 font-medium text-[#111827]">
                        {row.fund}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[#374151]">
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-full",
                              kind.iconBg,
                              kind.iconColor,
                            )}
                          >
                            {kind.icon}
                          </span>
                          {row.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-[#4b5563]">
                        {row.reference}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">{row.currency}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-[#111827]">
                        {money(row.originalAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums font-medium text-[#111827]">
                        {money(row.reportingAmount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-[#4b5563]">
                        {row.exchangeRate.toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          className="inline-flex text-[#dc2626] hover:opacity-80"
                          aria-label={`Document for ${row.reference}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toast.message(`Opening ${row.documents[0]?.name ?? "document"} (mock).`)
                          }}
                        >
                          <FileText className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-[13px] text-[#9ca3af]">
                      No transactions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f5f9] px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
              <span>Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[72px] rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 15, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                className="flex size-8 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-[12px] font-medium",
                    n === safePage
                      ? "bg-[#2563eb] text-white"
                      : "border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]",
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                className="flex size-8 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        {selected && (
          <aside className="sticky top-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
              <h2 className="text-[13px] font-semibold text-[#111827]">Transaction Details</h2>
              <button
                type="button"
                className="rounded-full p-1 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#4b5563]"
                onClick={() => setSelectedId(null)}
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] space-y-5 overflow-y-auto px-4 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    KIND_META[selected.kind].iconBg,
                    KIND_META[selected.kind].iconColor,
                  )}
                >
                  {KIND_META[selected.kind].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-[#111827]">{selected.type}</p>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="mt-1 text-[12px] text-[#6b7280]">Reference: {selected.reference}</p>
                </div>
              </div>

              <dl className="space-y-2.5 text-[12px]">
                {[
                  ["Transaction Date", selected.transactionDate],
                  ["Effective Date", selected.effectiveDate],
                  ["Fund", selected.fund],
                  ["Structure", selected.structure],
                  ["Investor", selected.investor],
                  ["Currency", selected.currency],
                  ["Original Amount", money(selected.originalAmount)],
                  ["Reporting Amount", money(selected.reportingAmount)],
                  ["Exchange Rate", selected.exchangeRate.toFixed(4)],
                  ["Status", selected.status],
                  ["Posted Date", selected.postedDate],
                  ["Posted By", selected.postedBy],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-2">
                    <dt className="text-[#9ca3af]">{label}</dt>
                    <dd className="font-medium text-[#111827]">{value}</dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="text-[12px] font-semibold text-[#111827]">
                  Linked Documents ({selected.documents.length})
                </h3>
                <div className="mt-2 space-y-2">
                  {selected.documents.map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-2.5 py-2"
                    >
                      <FileText className="size-4 shrink-0 text-[#dc2626]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-[#111827]">{doc.name}</p>
                        <p className="text-[10px] text-[#9ca3af]">
                          {doc.date} · {doc.size}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full p-1.5 text-[#2563eb] hover:bg-[#eff6ff]"
                        aria-label={`Download ${doc.name}`}
                        onClick={() => {
                          downloadBlob(
                            `Mock document: ${doc.name}\nReference: ${selected.reference}`,
                            doc.name.replace(/\.pdf$/i, ".txt"),
                            "text/plain",
                          )
                          toast.success("Document downloaded (mock).")
                        }}
                      >
                        <Download className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                  onClick={() => toast.message("Opening document centre (mock).")}
                >
                  View all documents <ArrowRight className="size-3.5" />
                </button>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold text-[#111827]">FX Details</h3>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-[12px] text-[#4b5563]">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#e0e7ff] text-[10px] font-bold uppercase text-[#4338ca]">
                    fx
                  </span>
                  {selected.fxNote}
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold text-[#111827]">Notes</h3>
                <p className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-[12px] leading-5 text-[#4b5563]">
                  {selected.notes}
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
