"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Info,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type NoticeStatus = "Unread" | "Opened" | "Acknowledged"
type NoticeKind =
  | "Report Available"
  | "AGM Notice"
  | "Valuation Update"
  | "Capital Call"
  | "Distribution"
  | "Policy Update"

type Notice = {
  id: string
  title: string
  summary: string
  kind: NoticeKind
  fund: string
  audience: string
  publishedAt: string
  status: NoticeStatus
  requiresAck: boolean
  body: string
}

const KIND_STYLE: Record<NoticeKind, string> = {
  "Report Available": "bg-[#dbeafe] text-[#1d4ed8]",
  "AGM Notice": "bg-[#ede9fe] text-[#6d28d9]",
  "Valuation Update": "bg-[#ccfbf1] text-[#0f766e]",
  "Capital Call": "bg-[#ffedd5] text-[#c2410c]",
  Distribution: "bg-[#dcfce7] text-[#15803d]",
  "Policy Update": "bg-[#f3f4f6] text-[#4b5563]",
}

const STATUS_STYLE: Record<NoticeStatus, string> = {
  Unread: "bg-[#dbeafe] text-[#1d4ed8]",
  Opened: "bg-[#fef9c3] text-[#a16207]",
  Acknowledged: "bg-[#dcfce7] text-[#15803d]",
}

const SEED: Notice[] = [
  {
    id: "n-1",
    title: "Capital Call #7 Issued — Due Jun 5, 2025",
    summary: "Arcus Growth Fund V capital call notice is available for acknowledgment.",
    kind: "Capital Call",
    fund: "Arcus Growth Fund V, L.P.",
    audience: "Fund investors",
    publishedAt: "May 20, 2025 11:30 AM",
    status: "Unread",
    requiresAck: true,
    body: "Call #7 for US$6,250,000 has been issued. Please review the notice and acknowledge receipt. Payment due by Jun 5, 2025.",
  },
  {
    id: "n-2",
    title: "Q1 2025 Investor Report Published",
    summary: "Quarterly investor report is now available in Document Centre.",
    kind: "Report Available",
    fund: "Arcus Growth Fund V, L.P.",
    audience: "All investors",
    publishedAt: "May 15, 2025 8:00 AM",
    status: "Opened",
    requiresAck: false,
    body: "The Q1 2025 investor report has been published. Download from Documents → Fund Reports.",
  },
  {
    id: "n-3",
    title: "May 31, 2025 Valuation Status: FINAL",
    summary: "Valuation marks are now FINAL for the May 31 reporting snapshot.",
    kind: "Valuation Update",
    fund: "All Funds",
    audience: "Organisation",
    publishedAt: "Jun 3, 2025 9:00 AM",
    status: "Unread",
    requiresAck: false,
    body: "Reporting metrics as of May 31, 2025 are FINAL. Provisional figures have been replaced across Performance and Account Activity.",
  },
  {
    id: "n-4",
    title: "Distribution DIST-000128 Paid",
    summary: "Net distribution credited to your registered bank account.",
    kind: "Distribution",
    fund: "Arcus Opportunities Fund II, L.P.",
    audience: "Fund investors",
    publishedAt: "May 15, 2025 2:40 PM",
    status: "Acknowledged",
    requiresAck: false,
    body: "Distribution DIST-000128 for US$1,850,000 has been paid. Payment advice is available in Documents.",
  },
  {
    id: "n-5",
    title: "2025 Annual General Meeting Notice",
    summary: "AGM details and registration instructions for Growth Fund V.",
    kind: "AGM Notice",
    fund: "Arcus Growth Fund V, L.P.",
    audience: "Limited Partners",
    publishedAt: "Apr 18, 2025 4:00 PM",
    status: "Opened",
    requiresAck: true,
    body: "Please acknowledge receipt of the AGM notice. Attendance options and proxy forms are attached in Documents → Notices.",
  },
  {
    id: "n-6",
    title: "Holiday Schedule — June 2025",
    summary: "Dealing and settlement calendar update for US and regional holidays.",
    kind: "Policy Update",
    fund: "All Funds",
    audience: "All investors",
    publishedAt: "May 16, 2025 10:15 AM",
    status: "Acknowledged",
    requiresAck: false,
    body: "Dealing dates for open-ended funds may shift around the published holiday schedule. See policy memo for details.",
  },
]

export function LpNoticesScreen() {
  const [notices, setNotices] = React.useState(SEED)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [kindFilter, setKindFilter] = React.useState("all")
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState(SEED[0].id)

  const filtered = React.useMemo(() => {
    return notices.filter((n) => {
      if (statusFilter !== "all" && n.status !== statusFilter) return false
      if (kindFilter !== "all" && n.kind !== kindFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!`${n.title} ${n.summary} ${n.fund}`.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [kindFilter, notices, query, statusFilter])

  const selected = filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null

  React.useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id)
  }, [selected, selectedId])

  const markOpened = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id && n.status === "Unread" ? { ...n, status: "Opened" } : n)),
    )
  }

  const acknowledge = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "Acknowledged" } : n)),
    )
    toast.success("Notice acknowledged (mock).")
  }

  const counts = {
    total: notices.length,
    unread: notices.filter((n) => n.status === "Unread").length,
    ackRequired: notices.filter((n) => n.requiresAck && n.status !== "Acknowledged").length,
    acknowledged: notices.filter((n) => n.status === "Acknowledged").length,
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Notices</h1>
          <button
            type="button"
            className="rounded-full text-[#94a3b8] hover:text-[#64748b]"
            onClick={() => toast.message("Fund and organisation announcements")}
            aria-label="Notices info"
          >
            <Info className="size-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
          Announcements, valuation updates, and actions requiring your attention.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "All Notices", value: counts.total, icon: <Bell className="size-4" />, bg: "bg-[#dbeafe]", color: "text-[#2563eb]" },
          { label: "Unread", value: counts.unread, icon: <Clock3 className="size-4" />, bg: "bg-[#e0f2fe]", color: "text-[#0284c7]" },
          { label: "Ack. Required", value: counts.ackRequired, icon: <FileText className="size-4" />, bg: "bg-[#ffedd5]", color: "text-[#ea580c]" },
          { label: "Acknowledged", value: counts.acknowledged, icon: <CheckCircle2 className="size-4" />, bg: "bg-[#dcfce7]", color: "text-[#16a34a]" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <span className={cn("flex size-8 items-center justify-center rounded-full", card.bg, card.color)}>
              {card.icon}
            </span>
            <p className="mt-3 text-[12px] font-medium text-[#6b7280]">{card.label}</p>
            <p className="mt-1 text-[22px] font-bold tabular-nums text-[#0f172a]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[130px] rounded-full border-[#e5e7eb] text-[12px] shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Unread">Unread</SelectItem>
                <SelectItem value="Opened">Opened</SelectItem>
                <SelectItem value="Acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="h-9 w-[160px] rounded-full border-[#e5e7eb] text-[12px] shadow-none">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(KIND_STYLE) as NoticeKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full border-[#e5e7eb] px-3 text-[12px] shadow-none"
              onClick={() => toast.message("More filters (mock).")}
            >
              <Filter className="size-3.5" />
              Filters
            </Button>
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notices..."
                className="h-9 rounded-full border-[#e5e7eb] pl-9 text-[12px] shadow-none"
              />
            </div>
          </div>

          <ul className="divide-y divide-[#f3f4f6]">
            {filtered.map((notice) => {
              const active = selected?.id === notice.id
              return (
                <li key={notice.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(notice.id)
                      markOpened(notice.id)
                    }}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3.5 text-left transition",
                      active
                        ? "bg-[#eff6ff] shadow-[inset_3px_0_0_0_#2563eb]"
                        : "hover:bg-[#f9fafb]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        notice.status === "Unread" ? "bg-[#2563eb]" : "bg-transparent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#111827]">{notice.title}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            KIND_STYLE[notice.kind],
                          )}
                        >
                          {notice.kind}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[12px] text-[#6b7280]">{notice.summary}</p>
                      <p className="mt-1.5 text-[11px] text-[#9ca3af]">
                        {notice.fund} · {notice.publishedAt}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        STATUS_STYLE[notice.status],
                      )}
                    >
                      {notice.status}
                    </span>
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-10 text-center text-[13px] text-[#9ca3af]">
                No notices match your filters.
              </li>
            )}
          </ul>
        </section>

        {selected && (
          <aside className="sticky top-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#111827]">{selected.title}</h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  STATUS_STYLE[selected.status],
                )}
              >
                {selected.status}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-[#6b7280]">
              {selected.fund} · {selected.audience}
            </p>
            <dl className="mt-4 space-y-2.5 text-[12px]">
              {[
                ["Type", selected.kind],
                ["Published", selected.publishedAt],
                ["Requires Ack.", selected.requiresAck ? "Yes" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] gap-2">
                  <dt className="text-[#9ca3af]">{label}</dt>
                  <dd className="font-medium text-[#111827]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-3 text-[12px] leading-5 text-[#374151]">
              {selected.body}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {selected.requiresAck && selected.status !== "Acknowledged" && (
                <Button
                  type="button"
                  className="h-10 rounded-full bg-[#2563eb] text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
                  onClick={() => acknowledge(selected.id)}
                >
                  Acknowledge Notice
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-[#d1d5db] text-[12px] font-medium text-[#2563eb] shadow-none"
                asChild
              >
                <Link href="/lp-portal/documents?category=Notices">Open in Documents</Link>
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
