"use client"

import * as React from "react"
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  History,
  Info,
  Lock,
  Maximize2,
  Minus,
  MoreHorizontal,
  PenLine,
  Plus,
  Scan,
  Search,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DocCategory =
  | "Statements"
  | "Capital Calls"
  | "Distributions"
  | "Fund Reports"
  | "Tax"
  | "Legal"
  | "Governance"
  | "Subscription Documents"
  | "Notices"
  | "Other"

type DocStatus = "New" | "Requires Signature" | "Published" | "Active" | "Paid"
type FileKind = "pdf" | "xlsx" | "docx"

type DocRow = {
  id: string
  title: string
  fileName: string
  fund: string
  category: DocCategory
  period: string
  publishedDate: string
  publishedAt: string
  version: string
  accessScope: "Investors" | "Advisory Board" | "Authorised Signatories"
  status: DocStatus
  fileKind: FileKind
  fileSize: string
  pages: number
  checksum: string
  documentType: string
  permissions: string[]
  history: Array<{ user: string; at: string; ip: string }>
}

const TOTAL_DOCS = 238
const PAGE_SIZE = 10

const CATEGORY_TABS: Array<{ id: string; label: string; count: number }> = [
  { id: "all", label: "All Documents", count: 238 },
  { id: "Statements", label: "Statements", count: 24 },
  { id: "Capital Calls", label: "Capital Calls", count: 18 },
  { id: "Distributions", label: "Distributions", count: 42 },
  { id: "Fund Reports", label: "Fund Reports", count: 31 },
  { id: "Tax", label: "Tax", count: 14 },
  { id: "Legal", label: "Legal", count: 26 },
  { id: "Governance", label: "Governance", count: 16 },
]

const MORE_CATEGORIES: DocCategory[] = ["Subscription Documents", "Notices", "Other"]

const CATEGORY_STYLE: Record<DocCategory, string> = {
  Statements: "bg-[#dbeafe] text-[#1d4ed8]",
  "Capital Calls": "bg-[#ffedd5] text-[#c2410c]",
  Distributions: "bg-[#ccfbf1] text-[#0f766e]",
  "Fund Reports": "bg-[#dbeafe] text-[#2563eb]",
  Tax: "bg-[#fef9c3] text-[#a16207]",
  Legal: "bg-[#ede9fe] text-[#6d28d9]",
  Governance: "bg-[#ede9fe] text-[#7c3aed]",
  "Subscription Documents": "bg-[#ccfbf1] text-[#0d9488]",
  Notices: "bg-[#dcfce7] text-[#15803d]",
  Other: "bg-[#f3f4f6] text-[#4b5563]",
}

const STATUS_STYLE: Record<DocStatus, string> = {
  New: "bg-[#dbeafe] text-[#1d4ed8]",
  "Requires Signature": "border border-[#fdba74] bg-[#fff7ed] text-[#c2410c]",
  Published: "border border-[#86efac] bg-[#f0fdf4] text-[#15803d]",
  Active: "bg-[#dbeafe] text-[#2563eb]",
  Paid: "bg-[#dcfce7] text-[#15803d]",
}

const SEED: DocRow[] = [
  {
    id: "doc-001",
    title: "LPA Amendment No. 2",
    fileName: "LPA_Amendment_No2_GFV.pdf",
    fund: "Arcus Growth Fund V, L.P.",
    category: "Legal",
    period: "May 2025",
    publishedDate: "May 28, 2025",
    publishedAt: "May 28, 2025 10:32 AM",
    version: "2.0",
    accessScope: "Investors",
    status: "New",
    fileKind: "pdf",
    fileSize: "1.3 MB",
    pages: 14,
    checksum: "b6c5d4a59e8f21c03a7741d8be6c2f90a1d34e57c8b29f06e4a5d718c3b0e2fa",
    documentType: "PDF Document",
    permissions: ["View", "Download", "Investors (organisation-wide)"],
    history: [
      { user: "Jane Smith", at: "May 28, 2025 10:33 AM", ip: "203.0.113.24" },
      { user: "David Lee", at: "May 28, 2025 11:02 AM", ip: "198.51.100.17" },
      { user: "Michael Chen", at: "May 28, 2025 2:18 PM", ip: "192.0.2.44" },
    ],
  },
  {
    id: "doc-002",
    title: "Subscription Booklet",
    fileName: "Subscription_Booklet_SIF.docx",
    fund: "Arcus Strategic Income Fund L.P.",
    category: "Subscription Documents",
    period: "Q2 2025",
    publishedDate: "May 22, 2025",
    publishedAt: "May 22, 2025 · 03:40 PM",
    version: "1.1",
    accessScope: "Authorised Signatories",
    status: "Requires Signature",
    fileKind: "docx",
    fileSize: "860 KB",
    pages: 22,
    checksum: "b1c92e48…a0ff21de",
    documentType: "Word",
    permissions: ["View", "Download", "Sign", "Authorised signatories only"],
    history: [{ user: "Jane Smith", at: "May 23, 2025 09:11 AM", ip: "203.0.113.24" }],
  },
  {
    id: "doc-003",
    title: "Q1 2025 Investor Report",
    fileName: "Q1_2025_Investor_Report_GFV.pdf",
    fund: "Arcus Growth Fund V, L.P.",
    category: "Fund Reports",
    period: "Q1 2025",
    publishedDate: "May 15, 2025",
    publishedAt: "May 15, 2025 · 08:00 AM",
    version: "1.0",
    accessScope: "Investors",
    status: "Published",
    fileKind: "pdf",
    fileSize: "4.2 MB",
    pages: 48,
    checksum: "91dd0af2…77bc4410",
    documentType: "PDF",
    permissions: ["View", "Download", "Investors (organisation-wide)"],
    history: [
      { user: "Jane Smith", at: "May 15, 2025 10:05 AM", ip: "203.0.113.24" },
      { user: "Rudo Maposa", at: "May 16, 2025 04:22 PM", ip: "196.44.177.24" },
    ],
  },
  {
    id: "doc-004",
    title: "Capital Call Notice #7",
    fileName: "Capital_Call_Notice_7_GFV.pdf",
    fund: "Arcus Growth Fund V, L.P.",
    category: "Capital Calls",
    period: "May 2025",
    publishedDate: "May 20, 2025",
    publishedAt: "May 20, 2025 · 11:30 AM",
    version: "1.0",
    accessScope: "Investors",
    status: "Active",
    fileKind: "pdf",
    fileSize: "248 KB",
    pages: 6,
    checksum: "44ab19c0…e912ff03",
    documentType: "PDF",
    permissions: ["View", "Download", "Investors (organisation-wide)"],
    history: [
      { user: "Jane Smith", at: "May 20, 2025 12:01 PM", ip: "203.0.113.24" },
      { user: "Tawanda Moyo", at: "May 21, 2025 08:44 AM", ip: "41.175.88.102" },
    ],
  },
  {
    id: "doc-005",
    title: "Board Consent Resolution",
    fileName: "Board_Consent_Resolution_OFII.pdf",
    fund: "Arcus Opportunities Fund II, L.P.",
    category: "Governance",
    period: "Apr 2025",
    publishedDate: "Apr 30, 2025",
    publishedAt: "Apr 30, 2025 · 05:15 PM",
    version: "1.0",
    accessScope: "Advisory Board",
    status: "Requires Signature",
    fileKind: "pdf",
    fileSize: "512 KB",
    pages: 9,
    checksum: "c80e11fa…55d9aa18",
    documentType: "PDF",
    permissions: ["View", "Download", "Sign", "Advisory Board only"],
    history: [{ user: "Jane Smith", at: "May 1, 2025 09:30 AM", ip: "203.0.113.24" }],
  },
  {
    id: "doc-006",
    title: "Distribution Notice DIST-000128",
    fileName: "Distribution_Notice_DIST-000128.pdf",
    fund: "Arcus Opportunities Fund II, L.P.",
    category: "Distributions",
    period: "May 2025",
    publishedDate: "May 5, 2025",
    publishedAt: "May 5, 2025 · 10:00 AM",
    version: "1.0",
    accessScope: "Investors",
    status: "Paid",
    fileKind: "pdf",
    fileSize: "182 KB",
    pages: 4,
    checksum: "19fe6621…aa091bcc",
    documentType: "PDF",
    permissions: ["View", "Download", "Investors (organisation-wide)"],
    history: [{ user: "Jane Smith", at: "May 15, 2025 02:40 PM", ip: "203.0.113.24" }],
  },
  {
    id: "doc-007",
    title: "2024 K-1 Tax Package",
    fileName: "2024_K1_Tax_Package_GFIV.xlsx",
    fund: "Arcus Growth Fund IV, L.P.",
    category: "Tax",
    period: "Year 2024",
    publishedDate: "Apr 12, 2025",
    publishedAt: "Apr 12, 2025 · 01:20 PM",
    version: "1.0",
    accessScope: "Authorised Signatories",
    status: "Published",
    fileKind: "xlsx",
    fileSize: "1.1 MB",
    pages: 1,
    checksum: "77ac0d44…b201eed9",
    documentType: "Excel",
    permissions: ["View", "Download", "Authorised signatories only"],
    history: [{ user: "Tawanda Moyo", at: "Apr 14, 2025 11:18 AM", ip: "41.175.88.102" }],
  },
  {
    id: "doc-008",
    title: "Monthly Investor Statement",
    fileName: "Monthly_Statement_Apr_2025_SIF.pdf",
    fund: "Arcus Strategic Income Fund L.P.",
    category: "Statements",
    period: "Apr 2025",
    publishedDate: "May 2, 2025",
    publishedAt: "May 2, 2025 · 07:45 AM",
    version: "1.0",
    accessScope: "Investors",
    status: "Published",
    fileKind: "pdf",
    fileSize: "640 KB",
    pages: 8,
    checksum: "5d2b90aa…cc1190fe",
    documentType: "PDF",
    permissions: ["View", "Download", "Investors (organisation-wide)"],
    history: [{ user: "Jane Smith", at: "May 2, 2025 08:12 AM", ip: "203.0.113.24" }],
  },
  {
    id: "doc-009",
    title: "AGM Notice 2025",
    fileName: "AGM_Notice_2025_GFV.pdf",
    fund: "Arcus Growth Fund V, L.P.",
    category: "Notices",
    period: "Year 2025",
    publishedDate: "Apr 18, 2025",
    publishedAt: "Apr 18, 2025 · 04:00 PM",
    version: "1.0",
    accessScope: "Investors",
    status: "New",
    fileKind: "pdf",
    fileSize: "390 KB",
    pages: 5,
    checksum: "aa1188ff…0091bbcd",
    documentType: "PDF",
    permissions: ["View", "Download", "Investors (organisation-wide)"],
    history: [],
  },
  {
    id: "doc-010",
    title: "Side Letter — Preferential Terms",
    fileName: "Side_Letter_Preferential_Terms.pdf",
    fund: "Arcus Credit Opportunities Fund II L.P.",
    category: "Legal",
    period: "Current",
    publishedDate: "Mar 28, 2025",
    publishedAt: "Mar 28, 2025 · 12:10 PM",
    version: "1.2",
    accessScope: "Authorised Signatories",
    status: "Active",
    fileKind: "pdf",
    fileSize: "720 KB",
    pages: 11,
    checksum: "e0f1a2b3…c4d5e6f7",
    documentType: "PDF",
    permissions: ["View", "Download", "Authorised signatories only"],
    history: [{ user: "Jane Smith", at: "Apr 1, 2025 03:33 PM", ip: "203.0.113.24" }],
  },
]

function buildDocuments(): DocRow[] {
  const funds = [
    "Arcus Growth Fund V, L.P.",
    "Arcus Growth Fund IV, L.P.",
    "Arcus Opportunities Fund II, L.P.",
    "Arcus Credit Opportunities Fund II L.P.",
    "Arcus Strategic Income Fund L.P.",
    "Arcus Buyout Fund III, L.P.",
  ]
  const cats = Object.keys(CATEGORY_STYLE) as DocCategory[]
  const statuses: DocStatus[] = ["New", "Requires Signature", "Published", "Active", "Paid"]
  const kinds: FileKind[] = ["pdf", "pdf", "pdf", "xlsx", "docx"]
  const rows = [...SEED]
  let i = SEED.length
  while (rows.length < TOTAL_DOCS) {
    const category = cats[i % cats.length]
    const fund = funds[i % funds.length]
    const status = statuses[i % statuses.length]
    const fileKind = kinds[i % kinds.length]
    const month = ((i * 2) % 12) + 1
    const day = ((i * 3) % 27) + 1
    const year = i % 3 === 0 ? 2024 : 2025
    const date = new Date(Date.UTC(year, month - 1, day))
    const publishedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
    const title = `${category} Document ${String(i + 1).padStart(3, "0")}`
    const ext = fileKind === "pdf" ? "pdf" : fileKind === "xlsx" ? "xlsx" : "docx"
    rows.push({
      id: `doc-gen-${i}`,
      title,
      fileName: `${title.replaceAll(/\s+/g, "_")}.${ext}`,
      fund,
      category,
      period: year === 2025 ? `Q${(i % 4) + 1} 2025` : `Year ${year}`,
      publishedDate,
      publishedAt: `${publishedDate} · 09:00 AM`,
      version: `${1 + (i % 3)}.${i % 5}`,
      accessScope: i % 5 === 0 ? "Advisory Board" : i % 4 === 0 ? "Authorised Signatories" : "Investors",
      status,
      fileKind,
      fileSize: `${200 + (i % 50) * 20} KB`,
      pages: 2 + (i % 40),
      checksum: `${(i * 7919).toString(16)}…${(i * 9973).toString(16)}`,
      documentType: fileKind === "pdf" ? "PDF" : fileKind === "xlsx" ? "Excel" : "Word",
      permissions: ["View", "Download", i % 5 === 0 ? "Advisory Board only" : "Investors (organisation-wide)"],
      history:
        i % 3 === 0
          ? []
          : [{ user: "Jane Smith", at: `${publishedDate} 10:00 AM`, ip: "203.0.113.24" }],
    })
    i += 1
  }
  return rows
}

const ALL_DOCS = buildDocuments()

const KPIS = [
  {
    label: "Total Documents",
    value: "238",
    helper: "Across 6 Funds",
    iconBg: "bg-[#dbeafe]",
    iconColor: "text-[#2563eb]",
    icon: <FileText className="size-4" strokeWidth={2.25} />,
  },
  {
    label: "New This Week",
    value: "12",
    helper: "Published in last 7 days",
    iconBg: "bg-[#dcfce7]",
    iconColor: "text-[#16a34a]",
    icon: <Sparkles className="size-4" strokeWidth={2.25} />,
  },
  {
    label: "Requires Signature",
    value: "3",
    helper: "Awaiting your action",
    iconBg: "bg-[#ffedd5]",
    iconColor: "text-[#ea580c]",
    icon: <PenLine className="size-4" strokeWidth={2.25} />,
  },
  {
    label: "Secure Downloads",
    value: "1,264",
    helper: "This Year",
    iconBg: "bg-[#ede9fe]",
    iconColor: "text-[#7c3aed]",
    icon: <Lock className="size-4" strokeWidth={2.25} />,
  },
]

function InfoHint({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-full text-[#94a3b8] hover:text-[#64748b]"
      aria-label={`${label} info`}
      onClick={() => toast.message(label)}
    >
      <Info className="size-3.5" />
    </button>
  )
}

function FileIcon({ kind }: { kind: FileKind }) {
  if (kind === "xlsx") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#dcfce7] text-[#16a34a]">
        <FileSpreadsheet className="size-4" />
      </span>
    )
  }
  if (kind === "docx") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
        <FileText className="size-4" />
      </span>
    )
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fee2e2] text-[#dc2626]">
      <FileText className="size-4" />
    </span>
  )
}

function StatusBadge({ status }: { status: DocStatus }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {status}
    </span>
  )
}

function CategoryBadge({ category }: { category: DocCategory }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        CATEGORY_STYLE[category],
      )}
    >
      {category}
    </span>
  )
}

function downloadDoc(doc: DocRow) {
  const body = [
    "ARCUS LP PORTAL — SECURE DOCUMENT DOWNLOAD",
    "",
    doc.title,
    `File: ${doc.fileName}`,
    `Fund: ${doc.fund}`,
    `Category: ${doc.category}`,
    `Version: ${doc.version}`,
    `Published: ${doc.publishedAt}`,
    `SHA-256: ${doc.checksum}`,
    "",
    "Mock download for UI demonstration.",
  ].join("\n")
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${doc.title.replaceAll(/[^a-zA-Z0-9 -]/g, "")}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Document downloaded (mock).")
}

export function LpDocumentCentreScreen({
  initialCategory = "All Documents",
}: {
  initialCategory?: string
}) {
  const resolvedTab =
    CATEGORY_TABS.find((t) => t.label === initialCategory || t.id === initialCategory)?.id ??
    (MORE_CATEGORIES.includes(initialCategory as DocCategory) ? "more" : "all")

  const [tab, setTab] = React.useState(resolvedTab)
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState("recent")
  const [page, setPage] = React.useState(1)
  const [selectedId, setSelectedId] = React.useState<string | null>("doc-001")
  const [detailTab, setDetailTab] = React.useState<"details" | "permissions">("details")
  const [previewPage, setPreviewPage] = React.useState(1)
  const [zoom, setZoom] = React.useState(100)

  React.useEffect(() => {
    setTab(resolvedTab)
  }, [resolvedTab])

  const filtered = React.useMemo(() => {
    let rows = ALL_DOCS
    if (tab === "more") {
      rows = rows.filter((d) => MORE_CATEGORIES.includes(d.category))
    } else if (tab !== "all") {
      rows = rows.filter((d) => d.category === tab)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.fund.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      )
    }
    const sorted = [...rows]
    if (sort === "recent") {
      // Already roughly newest-first in seed; keep stable order
    } else if (sort === "name") {
      sorted.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === "fund") {
      sorted.sort((a, b) => a.fund.localeCompare(b.fund))
    }
    return sorted
  }, [query, sort, tab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageRows = filtered.slice(start, start + PAGE_SIZE)
  const selected = filtered.find((d) => d.id === selectedId) ?? null

  React.useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [page, safePage])

  React.useEffect(() => {
    if (selectedId && !filtered.some((d) => d.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null)
    }
  }, [filtered, selectedId])

  React.useEffect(() => {
    setPreviewPage(1)
    setZoom(100)
    setDetailTab("details")
  }, [selectedId])

  const pageNumbers = React.useMemo(() => {
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
        <div className="flex items-center gap-1.5">
          <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Document Centre</h1>
          <InfoHint label="Document Centre" />
        </div>
        <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
          Secure repository for all fund documents and communications.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e7eb] pb-0">
        {CATEGORY_TABS.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id)
                setPage(1)
              }}
              className={cn(
                "relative -mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-2.5 text-[13px] font-medium transition",
                active
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#6b7280] hover:text-[#111827]",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  active ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#f3f4f6] text-[#6b7280]",
                )}
              >
                {item.count}
              </span>
            </button>
          )
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "relative -mb-px inline-flex items-center gap-1 border-b-2 px-1 pb-2.5 text-[13px] font-medium",
                tab === "more"
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#6b7280] hover:text-[#111827]",
              )}
            >
              More <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl">
            {MORE_CATEGORIES.map((cat) => (
              <DropdownMenuItem
                key={cat}
                onClick={() => {
                  setTab("more")
                  setPage(1)
                  toast.message(`Showing ${cat} and other More categories`)
                }}
              >
                {cat}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  kpi.iconBg,
                  kpi.iconColor,
                )}
              >
                {kpi.icon}
              </span>
              <InfoHint label={kpi.label} />
            </div>
            <p className="mt-3 text-[12px] font-medium text-[#6b7280]">{kpi.label}</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums tracking-[-0.03em] text-[#0f172a]">
              {kpi.value}
            </p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">{kpi.helper}</p>
          </div>
        ))}
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
            <div className="relative w-full max-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search documents..."
                className="h-9 rounded-lg border-[#e5e7eb] bg-white pl-9 text-[12px] shadow-none"
              />
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
              <span>Sort by:</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-[140px] rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name">Document Name</SelectItem>
                  <SelectItem value="fund">Fund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-semibold text-[#6b7280]">
                  <th className="px-4 py-2.5">Document Name</th>
                  <th className="px-3 py-2.5">Fund</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Period</th>
                  <th className="whitespace-nowrap px-3 py-2.5">Published Date ↓</th>
                  <th className="px-3 py-2.5">Version</th>
                  <th className="px-3 py-2.5">Access Scope</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((doc) => {
                  const isSelected = selected?.id === doc.id
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedId(doc.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f3f4f6] transition last:border-0",
                        isSelected
                          ? "bg-[#eff6ff] shadow-[inset_3px_0_0_0_#2563eb]"
                          : "hover:bg-[#f9fafb]",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <FileIcon kind={doc.fileKind} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#111827]">{doc.title}</p>
                            <p className="truncate text-[11px] text-[#9ca3af]">{doc.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3 text-[#4b5563]">{doc.fund}</td>
                      <td className="px-3 py-3">
                        <CategoryBadge category={doc.category} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">{doc.period}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#4b5563]">{doc.publishedDate}</td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums text-[#111827]">
                        {doc.version}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[#4b5563]">
                          <User className="size-3.5 text-[#9ca3af]" />
                          {doc.accessScope}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-full p-1.5 text-[#2563eb] hover:bg-[#eff6ff]"
                            aria-label={`Download ${doc.title}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadDoc(doc)
                            }}
                          >
                            <Download className="size-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="rounded-full p-1.5 text-[#6b7280] hover:bg-[#f3f4f6]"
                                aria-label={`More actions for ${doc.title}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="size-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedId(doc.id)
                                  toast.message("Opening preview")
                                }}
                              >
                                Open preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadDoc(doc)}>
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => toast.message("Opening access details (mock).")}
                              >
                                View permissions
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-[#9ca3af]">
                      No documents match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f5f9] px-4 py-3">
            <p className="text-[12px] text-[#6b7280]">
              Showing{" "}
              <span className="font-medium text-[#111827]">
                {filtered.length === 0 ? 0 : start + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-[#111827]">
                {Math.min(start + PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-medium text-[#111827]">{filtered.length}</span> documents
            </p>
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
              {totalPages > 5 && safePage < totalPages - 2 && (
                <>
                  <span className="px-1 text-[#9ca3af]">…</span>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#e5e7eb] px-2 text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                  >
                    {totalPages}
                  </button>
                </>
              )}
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
          <aside className="sticky top-4 flex max-h-[calc(100vh-6rem)] flex-col gap-3 overflow-y-auto">
            {/* Card 1 — document preview + details */}
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-[#111827]">{selected.title}</h2>
                      <StatusBadge status={selected.status} />
                    </div>
                    <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[12px] text-[#6b7280]">
                      <FolderOpen className="size-3.5 shrink-0 text-[#2563eb]" />
                      <span className="truncate">
                        {selected.fund} · {selected.category}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#4b5563]"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close details"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 px-4 pb-4">
                {/* Preview */}
                <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f3f4f6]">
                  <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] tabular-nums text-[#6b7280]">
                      <FileText className="size-3.5" />
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-[#e5e7eb] disabled:opacity-40"
                        disabled={previewPage <= 1}
                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous preview page"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <span>
                        {previewPage} / {selected.pages}
                      </span>
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-[#e5e7eb] disabled:opacity-40"
                        disabled={previewPage >= selected.pages}
                        onClick={() => setPreviewPage((p) => Math.min(selected.pages, p + 1))}
                        aria-label="Next preview page"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#6b7280]">
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[#e5e7eb]"
                        onClick={() => setZoom((z) => Math.max(60, z - 10))}
                        aria-label="Zoom out"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-[36px] text-center text-[10px] tabular-nums">{zoom}%</span>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[#e5e7eb]"
                        onClick={() => setZoom((z) => Math.min(160, z + 10))}
                        aria-label="Zoom in"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[#e5e7eb]"
                        onClick={() => setZoom(100)}
                        aria-label="Fit to screen"
                      >
                        <Scan className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 hover:bg-[#e5e7eb]"
                        onClick={() => toast.message("Fullscreen preview (mock).")}
                        aria-label="Fullscreen"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex h-[200px] items-center justify-center p-4">
                    <div
                      className="flex h-full w-[78%] origin-center flex-col items-center justify-center rounded-sm border border-[#e5e7eb] bg-white px-4 py-5 text-center shadow-sm"
                      style={{ transform: `scale(${zoom / 100})` }}
                    >
                      <p className="text-[8px] font-semibold tracking-[0.14em] text-[#2563eb]">
                        ARCUS CAPITAL PARTNERS
                      </p>
                      <div className="my-2 h-px w-10 bg-[#dbeafe]" />
                      <p className="text-[10px] font-semibold leading-snug text-[#111827]">
                        {selected.id === "doc-001"
                          ? "Fourth Amendment to the Limited Partnership Agreement of Arcus Growth Fund V, L.P."
                          : selected.title}
                      </p>
                      <p className="mt-3 text-[9px] text-[#6b7280]">{selected.publishedDate}</p>
                      <p className="mt-1 text-[8px] font-medium uppercase tracking-wide text-[#9ca3af]">
                        Confidential
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details / Permissions tabs */}
                <div className="flex gap-5 border-b border-[#e5e7eb]">
                  {(
                    [
                      ["details", "Details"],
                      ["permissions", "Permissions"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDetailTab(id)}
                      className={cn(
                        "-mb-px border-b-2 pb-2 text-[13px] font-semibold",
                        detailTab === id
                          ? "border-[#2563eb] text-[#2563eb]"
                          : "border-transparent text-[#6b7280]",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {detailTab === "details" ? (
                  <div className="space-y-3.5">
                    {[
                      {
                        icon: <FileText className="size-3.5" />,
                        label: "Document Type",
                        value: selected.documentType === "PDF" ? "PDF Document" : selected.documentType,
                      },
                      {
                        icon: <CalendarDays className="size-3.5" />,
                        label: "Published Date",
                        value: selected.publishedAt,
                      },
                      {
                        icon: <History className="size-3.5" />,
                        label: "Version",
                        value: selected.version,
                      },
                      {
                        icon: <FileText className="size-3.5" />,
                        label: "File Size",
                        value: selected.fileSize,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-start gap-2.5">
                        <span className="mt-0.5 text-[#9ca3af]">{row.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#9ca3af]">{row.label}</p>
                          <p className="mt-0.5 text-[12px] font-medium text-[#111827]">{row.value}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-[#9ca3af]">
                        <Shield className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-[#9ca3af]">Checksum (SHA-256)</p>
                        <div className="mt-0.5 flex items-start gap-1.5">
                          <p className="break-all font-mono text-[10px] font-medium leading-4 text-[#111827]">
                            {selected.checksum}
                          </p>
                          <button
                            type="button"
                            className="shrink-0 rounded p-0.5 text-[#2563eb] hover:bg-[#eff6ff]"
                            aria-label="Copy checksum"
                            onClick={() => {
                              void navigator.clipboard.writeText(selected.checksum)
                              toast.success("Checksum copied")
                            }}
                          >
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selected.permissions.map((item) => (
                      <li
                        key={item}
                        className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[12px] text-[#374151]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Card 2 — download history */}
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-[#111827]">Download History</h3>
                <button
                  type="button"
                  className="text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                  onClick={() => toast.message("Full download history (mock).")}
                >
                  View All
                </button>
              </div>
              {selected.history.length === 0 ? (
                <p className="mt-3 text-[12px] text-[#9ca3af]">No downloads recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {selected.history.map((entry, idx) => (
                    <li key={`${entry.user}-${entry.at}-${idx}`} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#9ca3af]">
                        <User className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-[#111827]">{entry.user}</p>
                            <p className="mt-0.5 text-[11px] text-[#6b7280]">{entry.at}</p>
                          </div>
                          <p className="shrink-0 text-[11px] text-[#9ca3af]">IP: {entry.ip}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
