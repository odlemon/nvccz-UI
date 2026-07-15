"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  Check,
  Circle,
  Coins,
  Download,
  FilePenLine,
  Filter,
  Plus,
  Search,
  Shield,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CLOSING_TIMELINE,
  COMMITMENT_INVESTORS,
  COMMITMENT_KPIS,
  DEFAULT_CHECKLIST,
  FUNDING_STATUS_OPTIONS,
  INVESTOR_CHECKLISTS,
  NEXT_CLOSING_EVENT,
  OWNER_OPTIONS,
  investorLogoUrl,
  type ChecklistItem,
  type CommitmentInvestor,
  type CommitmentKpi,
  type DocsStatus,
  type FundingStatus,
  type KycStatus,
  type SignatureStatus,
  type TimelineStep,
} from "./commitments-mock-data"
import {
  FrField,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

/** Sharper cards to match design (less “pill-soft” than default Arcus cards). */
const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const PAGE_SIZE = 10

const KPI_ICONS = {
  target: Target,
  shield: Shield,
  "file-pen": FilePenLine,
  coins: Coins,
  "badge-check": BadgeCheck,
} as const

function docsBadge(status: DocsStatus) {
  switch (status) {
    case "Complete":
      return "bg-[#dcfce7] text-[#15803d]"
    case "In Progress":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

function kycBadge(status: KycStatus) {
  switch (status) {
    case "Approved":
      return "bg-[#dcfce7] text-[#15803d]"
    case "In Review":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

function signatureBadge(status: SignatureStatus) {
  switch (status) {
    case "Signed":
      return "bg-[#dcfce7] text-[#15803d]"
    default:
      return "bg-[#ffedd5] text-[#c2410c]"
  }
}

function fundingBadge(status: FundingStatus) {
  switch (status) {
    case "Ready to Fund":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Funding Confirmed":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Scheduled":
      return "bg-[#e0f2fe] text-[#0369a1]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

function CircleMark({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#16a34a] text-white">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    )
  }
  return <Circle className="mx-auto h-[18px] w-[18px] text-[#cbd5e1]" strokeWidth={1.75} />
}

function StatusPill({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {label}
    </span>
  )
}

function InvestorLogo({ investor }: { investor: CommitmentInvestor }) {
  const sources = [
    investor.logoSrc,
    investorLogoUrl(investor, 128),
    `https://icons.duckduckgo.com/ip3/${investor.logoDomain}.ico`,
  ].filter(Boolean) as string[]

  const [index, setIndex] = useState(0)

  if (index >= sources.length) {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
        style={{ backgroundColor: investor.logoBg, color: investor.logoText }}
      >
        {investor.logoLabel}
      </span>
    )
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-[#e2e8f0] bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={sources[index]}
        src={sources[index]}
        alt=""
        className="h-full w-full object-contain p-0.5"
        onError={() => setIndex((i) => i + 1)}
      />
    </span>
  )
}

function KpiCard({ kpi }: { kpi: CommitmentKpi }) {
  const Icon = KPI_ICONS[kpi.icon]
  return (
    <div className={cn(CARD, "relative flex flex-col overflow-hidden p-4 pb-5")}>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <p className="mt-3 text-[12px] font-medium leading-none text-[#64748b]">{kpi.label}</p>
      <p className="mt-2 text-[22px] font-bold leading-none tracking-tight text-[#0f172a]">
        {kpi.amount}
      </p>
      <p className="mt-2 text-[11px] leading-none text-[#94a3b8]">
        {kpi.pctOfTarget}% of target
      </p>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#f1f5f9]">
        <div
          className="h-full transition-all"
          style={{ width: `${kpi.pctOfTarget}%`, backgroundColor: kpi.barColor }}
        />
      </div>
    </div>
  )
}

function ChecklistPanel({
  investorName,
  items,
}: {
  investorName: string
  items: ChecklistItem[]
}) {
  const completed = items.filter((i) => i.status === "Completed").length
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0

  return (
    <div className={cn(CARD, "overflow-hidden")}>
      <div className="px-4 pt-3.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Closing Checklist</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">{investorName}</p>
          </div>
          <p className="shrink-0 text-[11px] font-medium tabular-nums text-[#64748b]">
            {completed}/{items.length} completed
          </p>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
          <div
            className="h-full rounded-[2px] bg-[#16a34a] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ul className="divide-y divide-[#f1f5f9] px-2 pb-2">
        {items.map((item) => {
          const done = item.status === "Completed"
          return (
            <li key={item.id} className="flex items-start gap-2.5 px-2 py-2.5">
              <span
                className={cn(
                  "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                  done ? "bg-[#16a34a] text-white" : "border border-[#cbd5e1] bg-white",
                )}
                style={{ width: 18, height: 18 }}
              >
                {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#0f172a]">{item.label}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                  <span
                    className={cn(
                      "font-medium",
                      done
                        ? "text-[#16a34a]"
                        : item.status === "Pending"
                          ? "text-[#c2410c]"
                          : "text-[#94a3b8]",
                    )}
                  >
                    {item.status}
                  </span>
                  {item.date ? <span className="text-[#94a3b8]">{item.date}</span> : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Next Closing Event + Closing Timeline in a single card. */
function ClosingProgressCard({ onViewCalendar }: { onViewCalendar: () => void }) {
  const event = NEXT_CLOSING_EVENT
  const barWidth = Math.min(event.committedPct, 100)

  return (
    <div className={cn(CARD, "overflow-hidden")}>
      {/* Next Closing Event */}
      <div className="px-4 pt-3.5 pb-4">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">Next Closing Event</h2>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="text-[12px] text-[#64748b]">{event.title}</p>
          <p className="text-lg font-bold tabular-nums text-[#7c3aed]">{event.amount}</p>
        </div>
        <div className="mt-3 space-y-2.5 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">Expected Close Date</span>
            <span className="font-medium text-[#0f172a]">{event.expectedCloseDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">Commitments</span>
            <span className="font-medium text-[#0f172a]">{event.commitmentsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8]">Target Amount</span>
            <span className="font-medium text-[#0f172a]">{event.targetAmount}</span>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Committed</span>
              <span className="font-medium text-[#0f172a]">
                {event.committedAmount}{" "}
                <span className="text-[#7c3aed]">({event.committedPct}%)</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
              <div
                className="h-full rounded-[2px] bg-[#7c3aed]"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f1f5f9]" />

      {/* Closing Timeline */}
      <div className="px-4 pt-3.5">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">Closing Timeline</h2>
        <ol className="relative mt-3 space-y-0">
          {CLOSING_TIMELINE.map((step, index) => (
            <TimelineRow
              key={step.id}
              step={step}
              isLast={index === CLOSING_TIMELINE.length - 1}
            />
          ))}
        </ol>
      </div>
      <div className="border-t border-[#f1f5f9] px-4 py-3 text-center">
        <button
          type="button"
          onClick={onViewCalendar}
          className="text-[11px] font-medium text-[#2563eb] hover:underline"
        >
          View closing calendar &gt;
        </button>
      </div>
    </div>
  )
}

function TimelineRow({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-1">
      {!isLast ? (
        <span
          aria-hidden
          className="absolute bottom-0 left-[8px] top-4 w-px bg-[#e2e8f0]"
        />
      ) : null}
      <TimelineNode state={step.state} />
      <div className="min-w-0 pt-0.5">
        <p
          className={cn(
            "text-[12px] leading-snug",
            step.state === "current"
              ? "font-semibold text-[#0f172a]"
              : step.state === "done"
                ? "font-medium text-[#0f172a]"
                : "font-medium text-[#64748b]",
          )}
        >
          {step.label}
        </p>
        <p className="mt-0.5 text-[11px] text-[#94a3b8]">{step.date}</p>
      </div>
    </li>
  )
}

function TimelineNode({ state }: { state: TimelineStep["state"] }) {
  if (state === "done") {
    return (
      <span className="relative z-[1] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    )
  }
  if (state === "current") {
    return (
      <span className="relative z-[1] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-[#2563eb]">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    )
  }
  return (
    <span className="relative z-[1] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border-2 border-[#cbd5e1] bg-white" />
  )
}

function InvestorRow({
  investor,
  selected,
  onSelect,
}: {
  investor: CommitmentInvestor
  selected: boolean
  onSelect: () => void
}) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        "cursor-pointer border-b border-[#f1f5f9] transition-colors last:border-b-0",
        selected ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
      )}
    >
      <td className="whitespace-nowrap px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <InvestorLogo investor={investor} />
          <span className="text-[12px] font-medium text-[#0f172a]">{investor.name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-center">
        <CircleMark checked={investor.softCircled} />
      </td>
      <td className="px-3 py-2.5 text-center">
        <CircleMark checked={investor.hardCircled} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">
        {investor.commitmentAmount}
      </td>
      <td className="px-3 py-2.5">
        <StatusPill label={investor.docsStatus} className={docsBadge(investor.docsStatus)} />
      </td>
      <td className="px-3 py-2.5">
        <StatusPill label={investor.kycStatus} className={kycBadge(investor.kycStatus)} />
      </td>
      <td className="px-3 py-2.5">
        <StatusPill
          label={investor.signatureStatus}
          className={signatureBadge(investor.signatureStatus)}
        />
      </td>
      <td className="px-3 py-2.5">
        <StatusPill
          label={investor.fundingStatus}
          className={fundingBadge(investor.fundingStatus)}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[#64748b]">
        {investor.closeDate ?? "—"}
      </td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
            style={{ backgroundColor: investor.owner.avatarBg }}
          >
            {investor.owner.initials}
          </span>
          <span className="text-[12px] text-[#0f172a]">{investor.owner.name}</span>
        </div>
      </td>
    </tr>
  )
}

export function FundraisingCommitments() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ownerFilter, setOwnerFilter] = useState<string>("all")
  const [selectedId, setSelectedId] = useState(COMMITMENT_INVESTORS[0].id)
  const [showAll, setShowAll] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [allInvestorsOpen, setAllInvestorsOpen] = useState(false)
  const [commitForm, setCommitForm] = useState({
    investor: "National Pension Authority",
    amount: "US$3.00M",
    status: "Soft Circled",
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return COMMITMENT_INVESTORS.filter((inv) => {
      if (q && !inv.name.toLowerCase().includes(q)) return false
      if (statusFilter !== "all" && inv.fundingStatus !== statusFilter) return false
      if (ownerFilter !== "all" && inv.owner.name !== ownerFilter) return false
      return true
    })
  }, [search, statusFilter, ownerFilter])

  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : 1
  const to = Math.min(visible.length, filtered.length)

  const selected =
    filtered.find((i) => i.id === selectedId) ??
    COMMITMENT_INVESTORS.find((i) => i.id === selectedId) ??
    COMMITMENT_INVESTORS[0]

  const checklist = INVESTOR_CHECKLISTS[selected.id] ?? DEFAULT_CHECKLIST

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
          Commitments & Closings
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            onClick={() => toast.success("Export started")}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Commitment
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {COMMITMENT_KPIS.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(CARD, "flex min-w-0 flex-col overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Investors</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {COMMITMENT_INVESTORS.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-0 sm:w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setShowAll(false)
                  }}
                  placeholder="Search investors..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setShowAll(false)
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-[6px] border-[#e2e8f0] text-[12px] sm:w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {FUNDING_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={ownerFilter}
                onValueChange={(v) => {
                  setOwnerFilter(v)
                  setShowAll(false)
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-[6px] border-[#e2e8f0] text-[12px] sm:w-[150px]">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {OWNER_OPTIONS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full border-[#e2e8f0]"
                onClick={() => toast.message("Advanced filters coming soon")}
              >
                <Filter className="h-3.5 w-3.5 text-[#64748b]" />
                <span className="sr-only">Filters</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Investor
                  </th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-[#94a3b8]">
                    Soft Circle
                  </th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-[#94a3b8]">
                    Hard Circle
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Commitment Amount
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Docs Status
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    KYC/AML Status
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Signature Status
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Funding Status
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Close Date
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94a3b8]">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-[13px] text-[#94a3b8]"
                    >
                      No investors match your filters.
                    </td>
                  </tr>
                ) : (
                  visible.map((inv) => (
                    <InvestorRow
                      key={inv.id}
                      investor={inv}
                      selected={selected.id === inv.id}
                      onSelect={() => setSelectedId(inv.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#f1f5f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#94a3b8]">
              Showing {from} to {to} of {filtered.length} investors
            </p>
            {filtered.length > PAGE_SIZE ? (
              <button
                type="button"
                onClick={() => {
                  if (showAll) setShowAll(false)
                  else setAllInvestorsOpen(true)
                }}
                className="text-left text-[11px] font-medium text-[#2563eb] hover:underline sm:text-right"
              >
                {showAll ? "Show less" : "View all investors >"}
              </button>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <ChecklistPanel investorName={selected.name} items={checklist} />
          <ClosingProgressCard onViewCalendar={() => setCalendarOpen(true)} />
        </aside>
      </div>

      <FrViewAllDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        title="Closing calendar"
        description="Upcoming and recent closing milestones"
        rows={[
          ...CLOSING_TIMELINE.map((s) => ({
            id: s.id,
            title: s.label,
            subtitle: NEXT_CLOSING_EVENT.title,
            meta: s.date,
            badge: s.state === "done" ? "Done" : s.state === "current" ? "Current" : "Upcoming",
            badgeClass:
              s.state === "done"
                ? "bg-[#dcfce7] text-[#15803d]"
                : s.state === "current"
                  ? "bg-[#dbeafe] text-[#1d4ed8]"
                  : "bg-[#f1f5f9] text-[#64748b]",
          })),
          {
            id: "close-3",
            title: "ZGF — Closing #3 (interim)",
            subtitle: "Target US$8.00M",
            meta: "30 Jun 2025",
            badge: "Planned",
          },
          {
            id: "close-final",
            title: "ZGF — Final Close",
            subtitle: "Hard cap US$50.00M",
            meta: "30 Nov 2025",
            badge: "Planned",
          },
        ]}
      />

      <FrViewAllDialog
        open={allInvestorsOpen}
        onOpenChange={(open) => {
          setAllInvestorsOpen(open)
          if (!open) return
        }}
        title="All investors"
        description={`${filtered.length} investors in current filter`}
        size="xl"
        rows={filtered.map((inv) => ({
          id: inv.id,
          title: inv.name,
          subtitle: `${inv.commitmentAmount} · ${inv.fundingStatus}`,
          meta: `${inv.owner.name} · ${inv.closeDate ?? "No close date"}`,
          badge: inv.docsStatus,
        }))}
      />

      <FrSimpleWizard
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Commitment"
        steps={[{ id: "investor", short: "1", label: "Investor" }, { id: "amount", short: "2", label: "Commitment" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Record commitment"
        validateStep={(step) => step === "investor" && !commitForm.investor.trim() ? ["Investor is required"] : step === "amount" && !commitForm.amount.trim() ? ["Amount is required"] : []}
        onSubmit={() => {
          toast.success(`Commitment recorded for ${commitForm.investor}`)
          setCommitForm({ investor: "National Pension Authority", amount: "US$3.00M", status: "Soft Circled" })
        }}
      >
        {(step) => step === "investor" ? <FrField label="Investor">
            <input
              className={frInputClass}
              value={commitForm.investor}
              onChange={(e) => setCommitForm((f) => ({ ...f, investor: e.target.value }))}
              placeholder="Legal name"
            />
          </FrField> : step === "amount" ? <div className="space-y-3">
          <FrField label="Amount">
            <input
              className={frInputClass}
              value={commitForm.amount}
              onChange={(e) => setCommitForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="US$1.00M"
            />
          </FrField>
          <FrField label="Status">
            <select
              className={frSelectClass}
              value={commitForm.status}
              onChange={(e) => setCommitForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option>Indicative</option>
              <option>Soft Circled</option>
              <option>Proposed</option>
              <option>Signed</option>
            </select>
          </FrField>
        </div> : <ReviewList items={[
          { label: "Investor", value: commitForm.investor },
          { label: "Amount", value: commitForm.amount },
          { label: "Status", value: commitForm.status },
        ]} />}
      </FrSimpleWizard>
    </div>
  )
}
