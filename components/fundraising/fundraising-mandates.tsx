"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  StickyNote,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  MANDATES,
  TOTAL_MANDATES,
  mandateDetailFor,
  scoreLabel,
  type MandateRow,
  type MandateStage,
} from "./mandates-mock-data"

const CARD =
  "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

/** Design tokens — 6px controls, 4px badges */
const R6 = "rounded-[6px]"
const R4 = "rounded-[4px]"

const STAGE_BADGE: Record<MandateStage, string> = {
  rfp: "bg-[#dbeafe] text-[#1d4ed8]",
  mandate_live: "bg-[#ede9fe] text-[#6d28d9]",
  shortlist: "bg-[#ffedd5] text-[#c2410c]",
  evaluation: "bg-[#e0f2fe] text-[#0369a1]",
}

const STAGE_LABEL: Record<MandateStage, string> = {
  rfp: "RFP",
  mandate_live: "Mandate Live",
  shortlist: "Shortlist",
  evaluation: "Evaluation",
}

function scoreTone(score: number) {
  if (score >= 85) return { border: "border-[#16a34a]", text: "text-[#15803d]", bg: "bg-white" }
  if (score >= 70) return { border: "border-[#22c55e]", text: "text-[#16a34a]", bg: "bg-white" }
  if (score >= 55) return { border: "border-[#eab308]", text: "text-[#ca8a04]", bg: "bg-white" }
  return { border: "border-[#f97316]", text: "text-[#ea580c]", bg: "bg-white" }
}

function ScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score)
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-[28px] items-center justify-center border px-1 text-[11px] font-semibold tabular-nums",
        R4,
        tone.border,
        tone.text,
        tone.bg,
      )}
    >
      {score}
    </span>
  )
}

function MandateCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] bg-white hover:border-[#94a3b8]",
      )}
    >
      {checked && (
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function FilterSelect({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-w-[118px] flex-col items-stretch border border-[#e2e8f0] bg-white px-3 py-2 text-left hover:bg-[#fafbfc]",
        R6,
      )}
    >
      <span className="text-[10px] font-medium leading-none text-[#64748b]">{label}</span>
      <span className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xs leading-none text-[#94a3b8]">All</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" strokeWidth={2} />
      </span>
    </button>
  )
}

function OrgLogo({ row, size = "sm" }: { row: MandateRow; size?: "sm" | "lg" }) {
  const isLg = size === "lg"
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-bold",
        isLg ? "h-10 w-10 text-[10px]" : "h-7 w-7 text-[9px]",
        R4,
      )}
      style={{ backgroundColor: row.logoBg, color: row.logoText }}
    >
      {row.logoLabel}
    </span>
  )
}

function DetailSectionHeader({
  title,
  action = "View all",
}: {
  title: string
  action?: string
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <h3 className="text-[13px] font-semibold text-[#0f172a]">{title}</h3>
      {action ? (
        <button type="button" className="text-[11px] font-medium text-[#2563eb] hover:underline">
          {action}
        </button>
      ) : null}
    </div>
  )
}

const CONTACT_AVATARS = [
  "bg-[#ede9fe] text-[#6d28d9]",
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#dcfce7] text-[#15803d]",
]

function DetailPanel({ mandate, onClose }: { mandate: MandateRow; onClose: () => void }) {
  const detail = mandateDetailFor(mandate.id)
  if (!detail) return null

  return (
    <aside className={cn(CARD, "thin-scroll max-h-[calc(100vh-8rem)] overflow-y-auto")}>
      {/* Header */}
      <div className="border-b border-[#f1f5f9] px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <OrgLogo row={mandate} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15px] font-semibold leading-snug text-[#0f172a]">{mandate.name}</h2>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#64748b]",
                  R6,
                )}
                aria-label="Close detail panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#64748b]">
              {mandate.orgType} • {mandate.detailGeography}
              {mandate.geographyFlag ? ` ${mandate.geographyFlag}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 border border-[#16a34a] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#15803d]",
                  R4,
                )}
              >
                <FileText className="h-3 w-3" strokeWidth={2} />
                RFP
              </span>
              <div className="inline-flex items-center gap-1.5">
                <span className="text-[11px] text-[#94a3b8]">Score</span>
                <span
                  className={cn(
                    "inline-flex min-w-[26px] items-center justify-center bg-[#dcfce7] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#15803d]",
                    R4,
                  )}
                >
                  {mandate.score}
                </span>
                <span
                  className={cn(
                    "inline-flex border border-[#16a34a] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#15803d]",
                    R4,
                  )}
                >
                  {scoreLabel(mandate.score)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 bg-[#4f46e5] px-3.5 text-xs font-medium text-white hover:bg-[#4338ca]",
              R6,
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Schedule Meeting
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 border border-[#e2e8f0] bg-white px-3.5 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]",
              R6,
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Open RFP Doc
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-1.5 border border-[#e2e8f0] bg-white px-3.5 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]",
              R6,
            )}
          >
            <Send className="h-3.5 w-3.5" />
            Send Materials
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center gap-1.5 border border-[#e2e8f0] bg-white text-xs font-medium text-[#334155] hover:bg-[#f8fafc]",
              R6,
            )}
          >
            <StickyNote className="h-3.5 w-3.5" />
            Add Note
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]",
              R6,
            )}
            aria-label="More note options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Contact persons */}
      <div className="border-b border-[#f1f5f9]">
        <DetailSectionHeader title="Contact Persons" />
        <ul className="divide-y divide-[#f1f5f9]">
          {detail.contacts.map((contact, index) => (
            <li key={contact.id} className="px-5 py-3.5">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    CONTACT_AVATARS[index % CONTACT_AVATARS.length],
                  )}
                >
                  {contact.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0f172a]">{contact.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#64748b]">{contact.role}</p>
                  <p className="mt-1 truncate text-[11px] text-[#94a3b8]">{contact.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  {contact.isPrimary && (
                    <span
                      className={cn(
                        "mb-1 inline-flex bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-semibold text-[#15803d]",
                        R4,
                      )}
                    >
                      Primary
                    </span>
                  )}
                  <p className="text-[11px] text-[#64748b] whitespace-nowrap">{contact.phone}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Interaction history */}
      <div className="border-b border-[#f1f5f9]">
        <DetailSectionHeader title="Interaction History (last 90 days)" action="" />
        <ol className="relative space-y-4 px-5 pb-2">
          {detail.interactions.length > 1 && (
            <span aria-hidden className="absolute bottom-3 left-[27px] top-2 w-px bg-[#e2e8f0]" />
          )}
          {detail.interactions.map((item) => (
            <li key={item.id} className="relative flex gap-3">
              <span className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full border-2 border-[#2563eb] bg-white ring-4 ring-white" />
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-[11px] text-[#94a3b8]">{item.date}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#0f172a]">{item.title}</p>
                {item.detail && (
                  <p className="mt-1 text-[11px] leading-relaxed text-[#64748b]">{item.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="px-5 pb-4">
          <button type="button" className="text-[11px] font-medium text-[#2563eb] hover:underline">
            View all history
          </button>
        </div>
      </div>

      {/* Interests */}
      <div className="border-b border-[#f1f5f9]">
        <DetailSectionHeader title="Interests" />
        <div className="flex flex-wrap gap-1.5 px-5 pb-4">
          {detail.interests.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex bg-[#f1f5f9] px-2.5 py-1 text-[10px] font-medium text-[#2563eb]",
                R4,
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Documents shared */}
      <div className="border-b border-[#f1f5f9]">
        <DetailSectionHeader title="Documents Shared" />
        <ul className="divide-y divide-[#f1f5f9]">
          {detail.documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2.5 px-5 py-3">
              <FileText className="h-4 w-4 shrink-0 text-[#dc2626]" strokeWidth={1.75} />
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-[#0f172a]">{doc.name}</p>
              <p className="shrink-0 text-[10px] text-[#94a3b8] whitespace-nowrap">Shared {doc.sharedOn}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent emails */}
      <div className="border-b border-[#f1f5f9]">
        <DetailSectionHeader title="Recent Emails" />
        <ul className="divide-y divide-[#f1f5f9]">
          {detail.emails.map((email) => (
            <li key={email.id} className="flex items-center gap-3 px-5 py-3">
              <span className="w-[72px] shrink-0 text-[11px] text-[#94a3b8]">{email.date}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#0f172a]">{email.subject}</span>
              <span className="shrink-0 text-[11px] text-[#64748b]">{email.from}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Meeting timeline */}
      <div>
        <DetailSectionHeader title="Meeting Timeline" />
        <ul className="relative space-y-4 px-5 pb-5">
          {detail.meetings.length > 1 && (
            <span aria-hidden className="absolute bottom-8 left-[27px] top-2 w-px bg-[#e2e8f0]" />
          )}
          {detail.meetings.map((meeting) => (
            <li key={meeting.id} className="relative flex gap-3">
              <span className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full border-2 border-[#cbd5e1] bg-white ring-4 ring-white" />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pb-1">
                <div className="min-w-0">
                  <p className="text-[11px] text-[#94a3b8]">{meeting.date}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0f172a]">{meeting.title}</p>
                  {meeting.detail && (
                    <p className="mt-1 text-[11px] text-[#64748b]">{meeting.detail}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-0.5 text-[10px] font-medium",
                    R4,
                    meeting.status === "Completed" && "bg-[#dcfce7] text-[#15803d]",
                    meeting.status === "Scheduled" && "bg-[#dbeafe] text-[#1d4ed8]",
                    meeting.status === "Upcoming" && "border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]",
                  )}
                >
                  {meeting.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

const PAGE_ITEMS: (number | "ellipsis")[] = [1, 2, 3, 4, 5, "ellipsis", 10]

export function FundraisingMandates() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string>("m1")
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MANDATES
    return MANDATES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.organization.toLowerCase().includes(q) ||
        m.mandateType.toLowerCase().includes(q),
    )
  }, [search])

  const selected = filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? null

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (checked.size === filtered.length) setChecked(new Set())
    else setChecked(new Set(filtered.map((m) => m.id)))
  }

  const allChecked = checked.size === filtered.length && filtered.length > 0

  return (
    <div className="mx-auto max-w-[1680px] p-4 sm:p-5 md:p-6">
      {/* Page header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-[28px]">Mandates</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#334155] shadow-sm hover:bg-[#f8fafc]",
              R6,
            )}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#4f46e5] px-5 text-sm font-medium text-white shadow-sm hover:bg-[#4338ca]"
          >
            <Plus className="h-4 w-4" />
            Add Mandate
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm hover:bg-[#f8fafc]",
              R6,
            )}
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table card — filters + table + pagination in one container */}
      <div
        className={cn(
          "grid items-start gap-4",
          selected ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]" : "grid-cols-1",
        )}
      >
        <div className={cn(CARD, "min-w-0 overflow-hidden")}>
          {/* View tabs row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 border border-[#2563eb] bg-white px-3 text-xs font-semibold text-[#2563eb]",
                R6,
              )}
            >
              <LayoutList className="h-4 w-4 shrink-0" strokeWidth={2} />
              All Mandates
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center bg-[#eff6ff] px-1.5 text-[10px] font-semibold tabular-nums text-[#2563eb]",
                  R4,
                )}
              >
                {TOTAL_MANDATES}
              </span>
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border border-[#e2e8f0] bg-white px-3 text-xs font-medium text-[#64748b] hover:bg-[#fafbfc]",
                R6,
              )}
            >
              Saved Views
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
            <div className="relative w-full min-w-[200px] flex-1 sm:max-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mandates..."
                className={cn(
                  "h-9 w-full border border-[#e2e8f0] bg-white pl-9 pr-3 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15",
                  R6,
                )}
              />
            </div>

            <FilterSelect label="Mandate Type" />
            <FilterSelect label="Geography" />
            <FilterSelect label="Asset Class" />
            <FilterSelect label="Stage" />
            <FilterSelect label="Status" />

            <button
              type="button"
              className={cn(
                "inline-flex h-[46px] items-center gap-1.5 border border-[#2563eb] bg-white px-3 text-xs font-medium text-[#2563eb] hover:bg-[#eff6ff]",
                R6,
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              More Filters
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563eb] px-1 text-[9px] font-semibold text-white">
                2
              </span>
            </button>

            <button type="button" className="px-1 text-xs font-medium text-[#64748b] hover:text-[#334155]">
              Clear
            </button>

            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center border border-[#2563eb] bg-white px-3 text-xs font-medium text-[#2563eb] hover:bg-[#eff6ff]",
                R6,
              )}
            >
              Save View
            </button>
          </div>

          {/* Table */}
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="w-11 px-4 py-3">
                    <MandateCheckbox checked={allChecked} onChange={toggleAll} label="Select all mandates" />
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Mandate
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Mandate Type
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Organization
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Asset Class
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Geography
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Mandate Size
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Stage
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    RFP Due Date
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Next Step
                  </th>
                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isSelected = row.id === selectedId
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f1f5f9] transition-colors",
                        isSelected ? "bg-[#f8fafc]" : "hover:bg-[#fafbfc]",
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <MandateCheckbox
                          checked={checked.has(row.id)}
                          onChange={() => toggleCheck(row.id)}
                          label={`Select ${row.name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-[200px] items-center gap-2.5">
                          <OrgLogo row={row} />
                          <span className="text-[13px] font-semibold leading-snug text-[#1d4ed8] hover:underline">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.mandateType}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.organization}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.assetClass}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.geography}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] font-medium tabular-nums text-[#0f172a]">
                        {row.mandateSize}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 text-[11px] font-medium",
                            R4,
                            STAGE_BADGE[row.stage],
                          )}
                        >
                          {STAGE_LABEL[row.stage]}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-[13px] tabular-nums",
                          row.rfpDueDate === "—" ? "text-[#94a3b8]" : "text-[#334155]",
                        )}
                      >
                        {row.rfpDueDate}
                      </td>
                      <td className="max-w-[150px] truncate whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">
                        {row.nextStep}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <ScoreBadge score={row.score} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-[#e2e8f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#64748b]">
              Showing 1 to {filtered.length} of {TOTAL_MANDATES} mandates
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40",
                  R6,
                )}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {PAGE_ITEMS.map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-1 text-xs text-[#94a3b8]">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cn(
                      "inline-flex h-8 min-w-8 items-center justify-center px-2 text-xs font-medium",
                      R6,
                      page === item
                        ? "border border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                        : "border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]",
                  R6,
                )}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {selected && (
          <div className="min-w-0 xl:sticky xl:top-4 xl:min-w-[420px]">
            <DetailPanel mandate={selected} onClose={() => setSelectedId("")} />
          </div>
        )}
      </div>
    </div>
  )
}
