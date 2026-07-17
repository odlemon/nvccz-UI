"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Circle,
  Coins,
  Download,
  FilePenLine,
  Filter,
  Loader2,
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
  COMMITMENT_KPIS,
  FUNDING_STATUS_OPTIONS,
  investorLogoUrl,
  type CommitmentInvestor,
  type CommitmentKpi,
  type DocsStatus,
  type FundingStatus,
  type KycStatus,
  type SignatureStatus,
  type TimelineStep,
} from "./commitments-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrTableSkeleton,
  FrViewAllDialog,
  FrRequirementsDialog,
  emptyRequirementsState,
  requirementsFromError,
  type FrRequirementsState,
  frInputClass,
} from "./fundraising-modals"
import { FrCommitmentWizard } from "./fundraising-create-wizards"
import { fundraisingApi, asNumber, toastFrError } from "@/lib/api/fundraising-api"
import { closeTypeLabel, closingState, fmtDate, mapCommitmentRow } from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"

/** Sharper cards to match design (less “pill-soft” than default Arcus cards). */
const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const PAGE_SIZE = 10
const EDITABLE_COMMITMENT_STATUSES = [
  "DRAFT",
  "INDICATIVE",
  "SOFT_CIRCLED",
  "PROPOSED",
  "DOCUMENTS_ISSUED",
  "SIGNED",
  "ACCEPTED",
  "REDUCED",
  "CANCELLED",
] as const

const KPI_ICONS = {
  target: Target,
  shield: Shield,
  "file-pen": FilePenLine,
  coins: Coins,
  "badge-check": BadgeCheck,
} as const

type MappedCommitment = ReturnType<typeof mapCommitmentRow>

type ChecklistRow = {
  id: string
  label: string
  status: "Completed" | "Pending" | "Not Started"
  date: string | null
}

type ClosingEventVM = {
  title: string
  amount: string
  expectedCloseDate: string
  commitmentsCount: number
  targetAmount: string
  committedAmount: string
  committedPct: number
}

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

function InvestorLogo({ investor }: { investor: MappedCommitment }) {
  const sources = [
    investor.logoDomain ? investorLogoUrl(investor as unknown as CommitmentInvestor, 128) : null,
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
        {kpi.pctOfTarget}% of total committed
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
  loading,
  complianceBlocked,
  footer,
  onToggle,
  togglingId,
}: {
  investorName: string
  items: ChecklistRow[]
  loading?: boolean
  complianceBlocked?: boolean
  footer?: ReactNode
  onToggle?: (item: ChecklistRow) => void
  togglingId?: string | null
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

      {complianceBlocked ? (
        <div className="mx-2 mb-2 flex items-start gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 text-[11px] text-[#b91c1c]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Compliance hold — cannot admit or fund until KYC / sanctions are cleared.
        </div>
      ) : null}

      {loading ? (
        <p className="flex items-center gap-2 px-4 py-4 text-[11px] text-[#94a3b8]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading checklist…
        </p>
      ) : items.length === 0 ? (
        <p className="px-4 py-4 text-[11px] text-[#94a3b8]">
          No closing checklist items recorded for this commitment yet.
        </p>
      ) : (
        <ul className="divide-y divide-[#f1f5f9] px-2 pb-2">
          {items.map((item) => {
            const done = item.status === "Completed"
            const isToggling = togglingId === item.id
            return (
              <li key={item.id} className="flex items-start gap-2.5 px-2 py-2.5">
                <button
                  type="button"
                  onClick={() => onToggle?.(item)}
                  disabled={!onToggle || isToggling}
                  aria-pressed={done}
                  aria-label={`Mark "${item.label}" ${done ? "not complete" : "complete"}`}
                  className={cn(
                    "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed",
                    done ? "bg-[#16a34a] text-white" : "border border-[#cbd5e1] bg-white hover:border-[#16a34a]",
                  )}
                  style={{ width: 18, height: 18 }}
                >
                  {isToggling ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : done ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : null}
                </button>
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
      )}

      {footer ? <div className="border-t border-[#f1f5f9] px-4 py-3">{footer}</div> : null}
    </div>
  )
}

/** Next Closing Event + Closing Timeline in a single card. */
function ClosingProgressCard({
  event,
  timeline,
  onViewCalendar,
}: {
  event: ClosingEventVM | null
  timeline: TimelineStep[]
  onViewCalendar: () => void
}) {
  const barWidth = event ? Math.min(event.committedPct, 100) : 0

  return (
    <div className={cn(CARD, "overflow-hidden")}>
      {/* Next Closing Event */}
      <div className="px-4 pt-3.5 pb-4">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">Next Closing Event</h2>
        {event ? (
          <>
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
                    {event.targetAmount !== "—" ? (
                      <span className="text-[#7c3aed]">({event.committedPct}%)</span>
                    ) : null}
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
          </>
        ) : (
          <p className="mt-2 text-[12px] text-[#94a3b8]">No closings scheduled yet.</p>
        )}
      </div>

      <div className="border-t border-[#f1f5f9]" />

      {/* Closing Timeline */}
      <div className="px-4 pt-3.5">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">Closing Timeline</h2>
        {timeline.length === 0 ? (
          <p className="mt-2 pb-3 text-[12px] text-[#94a3b8]">No closings recorded yet.</p>
        ) : (
          <ol className="relative mt-3 space-y-0">
            {timeline.map((step, index) => (
              <TimelineRow key={step.id} step={step} isLast={index === timeline.length - 1} />
            ))}
          </ol>
        )}
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
  investor: MappedCommitment
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [allInvestorsOpen, setAllInvestorsOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [rawCommitments, setRawCommitments] = useState<Record<string, any>[]>([])
  const [rawClosings, setRawClosings] = useState<Record<string, any>[]>([])
  const [rawInvestors, setRawInvestors] = useState<Record<string, any>[]>([])

  const [checklist, setChecklist] = useState<ChecklistRow[]>([])
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  const [fundOpen, setFundOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [admitting, setAdmitting] = useState(false)
  const [funding, setFunding] = useState(false)
  const [lifecycleStatus, setLifecycleStatus] = useState("")
  const [updatingLifecycle, setUpdatingLifecycle] = useState(false)
  const [requirements, setRequirements] = useState<FrRequirementsState>(emptyRequirementsState)

  async function loadData() {
    setLoading(true)
    try {
      const [commitments, closings, investors] = await Promise.all([
        fundraisingApi.listCommitments(),
        fundraisingApi.listClosings(),
        fundraisingApi.listInvestors({ pageSize: 200 }),
      ])
      setRawCommitments(commitments ?? [])
      setRawClosings(closings ?? [])
      setRawInvestors(investors?.items ?? [])
    } catch (err) {
      toastFrError(err, "Could not load commitments")
      setRawCommitments([])
      setRawClosings([])
      setRawInvestors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const investorsById = useMemo(() => {
    const map: Record<string, any> = {}
    rawInvestors.forEach((i) => {
      map[String(i.id)] = i
    })
    return map
  }, [rawInvestors])

  const closingsById = useMemo(() => {
    const map: Record<string, any> = {}
    rawClosings.forEach((c) => {
      map[String(c.id)] = c
    })
    return map
  }, [rawClosings])

  const mapped = useMemo(
    () => rawCommitments.map((raw, idx) => mapCommitmentRow(raw, investorsById, closingsById, idx)),
    [rawCommitments, investorsById, closingsById],
  )

  const ownerOptions = useMemo(
    () => Array.from(new Set(mapped.map((i) => i.owner.name).filter((n) => n && n !== "—"))).sort(),
    [mapped],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mapped.filter((inv) => {
      if (q && !inv.name.toLowerCase().includes(q)) return false
      if (statusFilter !== "all" && inv.fundingStatus !== statusFilter) return false
      if (ownerFilter !== "all" && inv.owner.name !== ownerFilter) return false
      return true
    })
  }, [mapped, search, statusFilter, ownerFilter])

  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : 1
  const to = Math.min(visible.length, filtered.length)

  const selected = useMemo(
    () => filtered.find((i) => i.id === selectedId) ?? mapped.find((i) => i.id === selectedId) ?? filtered[0] ?? null,
    [filtered, mapped, selectedId],
  )

  useEffect(() => {
    if (!loading && mapped.length > 0 && !mapped.find((i) => i.id === selectedId)) {
      setSelectedId(mapped[0].id)
    }
  }, [loading, mapped, selectedId])

  useEffect(() => {
    setLifecycleStatus(selected?.status || "")
  }, [selected?.id, selected?.status])

  // KPIs — real sums from commitmentAmount / fundedAmount, bucketed by status.
  const kpis = useMemo(() => {
    const totals = { soft: 0, hard: 0, signed: 0, funded: 0, ready: 0, total: 0 }
    for (const c of mapped) {
      totals.total += c.commitmentAmountRaw
      if (c.softCircled) totals.soft += c.commitmentAmountRaw
      if (c.hardCircled) totals.hard += c.commitmentAmountRaw
      if (c.hardCircled) totals.signed += c.commitmentAmountRaw
      if (c.status === "FUNDED" || c.status === "PARTIALLY_FUNDED") {
        totals.funded += c.fundedAmountRaw || c.commitmentAmountRaw
      }
      if (c.status === "ADMITTED_AT_CLOSE") totals.ready += c.commitmentAmountRaw
    }
    const pct = (n: number) => (totals.total > 0 ? Math.round((n / totals.total) * 100) : 0)
    return COMMITMENT_KPIS.map((kpi) => {
      switch (kpi.id) {
        case "soft":
          return { ...kpi, amount: moneyFmt(totals.soft), pctOfTarget: pct(totals.soft) }
        case "hard":
          return { ...kpi, amount: moneyFmt(totals.hard), pctOfTarget: pct(totals.hard) }
        case "signed":
          return { ...kpi, amount: moneyFmt(totals.signed), pctOfTarget: pct(totals.signed) }
        case "funded":
          return { ...kpi, amount: moneyFmt(totals.funded), pctOfTarget: pct(totals.funded) }
        case "ready":
          return { ...kpi, amount: moneyFmt(totals.ready), pctOfTarget: pct(totals.ready) }
        default:
          return kpi
      }
    })
  }, [mapped])

  // Closing timeline + next closing event from real closings.
  const sortedClosings = useMemo(
    () =>
      [...rawClosings].sort(
        (a, b) => new Date(a.closingDate || 0).getTime() - new Date(b.closingDate || 0).getTime(),
      ),
    [rawClosings],
  )

  const closingTimeline: TimelineStep[] = useMemo(
    () =>
      sortedClosings.map((c) => ({
        id: String(c.id),
        label: closeTypeLabel(c.closeType),
        date: fmtDate(c.closingDate) ?? "No date set",
        state: closingState(c.status),
      })),
    [sortedClosings],
  )

  const nextClosingEvent: ClosingEventVM | null = useMemo(() => {
    const next =
      sortedClosings.find((c) => closingState(c.status) !== "done") ?? sortedClosings[sortedClosings.length - 1]
    if (!next) return null
    const linked = mapped.filter((c) => c.closingId === String(next.id))
    const committed = linked.reduce((sum, c) => sum + c.commitmentAmountRaw, 0)
    return {
      title: `${closeTypeLabel(next.closeType)} — ${next.campaignId ? "Campaign" : "Fund"}`,
      amount: moneyFmt(committed),
      expectedCloseDate: fmtDate(next.closingDate) ?? "—",
      commitmentsCount: linked.length,
      targetAmount: "—",
      committedAmount: moneyFmt(committed),
      committedPct: 0,
    }
  }, [sortedClosings, mapped])

  function mapChecklistItems(res: any): ChecklistRow[] {
    const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
    return items.map((it: Record<string, any>, i: number) => ({
      id: String(it.id ?? it.itemKey ?? i),
      label: it.label ?? it.itemKey ?? it.name ?? `Checklist item ${i + 1}`,
      status: it.isComplete ? "Completed" : it.required ? "Pending" : "Not Started",
      date: fmtDate(it.completedAt),
    }))
  }

  async function refreshChecklist(commitmentId: string) {
    try {
      const res = await fundraisingApi.getCommitmentChecklist(commitmentId)
      setChecklist(mapChecklistItems(res))
    } catch (err) {
      setChecklist([])
    }
  }

  // Closing/funding checklist for the selected commitment (dedicated resource, not the opportunity checklist).
  useEffect(() => {
    if (!selected?.id) {
      setChecklist([])
      return
    }
    let cancelled = false
    setChecklistLoading(true)
    fundraisingApi
      .getCommitmentChecklist(selected.id)
      .then((res: any) => {
        if (!cancelled) setChecklist(mapChecklistItems(res))
      })
      .catch(() => {
        if (!cancelled) setChecklist([])
      })
      .finally(() => {
        if (!cancelled) setChecklistLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.id])

  async function handleToggleChecklistItem(item: ChecklistRow) {
    if (!selected) return
    setTogglingItemId(item.id)
    try {
      await fundraisingApi.patchCommitmentChecklistItem(selected.id, item.id, {
        isComplete: item.status !== "Completed",
      })
      await refreshChecklist(selected.id)
    } catch (err) {
      toastFrError(err, "Could not update checklist item")
    } finally {
      setTogglingItemId(null)
    }
  }

  async function handleAdmit() {
    if (!selected) return
    setAdmitting(true)
    try {
      await fundraisingApi.admitCommitment(selected.id, selected.closingId ? { closingId: selected.closingId } : undefined)
      toast.success(`${selected.name} admitted`)
      await loadData()
    } catch (err) {
      const state = requirementsFromError(err, "Commitment cannot be admitted")
      if (state.open) setRequirements(state)
      else toastFrError(err, "Could not admit commitment")
    } finally {
      setAdmitting(false)
    }
  }

  function openFundDialog() {
    if (!selected) return
    const remaining = Math.max(selected.commitmentAmountRaw - selected.fundedAmountRaw, 0)
    setFundAmount(remaining ? String(remaining) : String(selected.commitmentAmountRaw))
    setFundOpen(true)
  }

  async function handleFundSubmit() {
    if (!selected) return
    if (!fundAmount.trim()) {
      toast.error("Funded amount is required")
      return
    }
    setFunding(true)
    try {
      await fundraisingApi.fundCommitment(selected.id, { fundedAmount: asNumber(fundAmount) })
      toast.success(`Funding recorded for ${selected.name}`)
      setFundOpen(false)
      await loadData()
    } catch (err) {
      const state = requirementsFromError(err, "Funding cannot be recorded")
      if (state.open) setRequirements(state)
      else toastFrError(err, "Could not record funding")
    } finally {
      setFunding(false)
    }
  }

  async function handleLifecycleUpdate() {
    if (!selected || !lifecycleStatus || lifecycleStatus === selected.status) return
    if (["ADMITTED_AT_CLOSE", "PARTIALLY_FUNDED", "FUNDED"].includes(lifecycleStatus)) {
      toast.error("Use the guarded admit or fund action for this status")
      return
    }
    setUpdatingLifecycle(true)
    try {
      await fundraisingApi.patchCommitment(selected.id, { status: lifecycleStatus })
      toast.success(`Commitment status updated to ${lifecycleStatus.replace(/_/g, " ").toLowerCase()}`)
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not update commitment status")
    } finally {
      setUpdatingLifecycle(false)
    }
  }

  function exportCommitments() {
    exportFundraisingCsv(
      filtered,
      [
        { key: "name", label: "Investor" },
        { key: "status", label: "Lifecycle status" },
        { key: "commitmentAmount", label: "Commitment amount" },
        { key: "docsStatus", label: "Documents" },
        { key: "kycStatus", label: "KYC / AML" },
        { key: "signatureStatus", label: "Signature" },
        { key: "fundingStatus", label: "Funding" },
        { key: "fundedAmountRaw", label: "Funded amount" },
        { key: "closeDate", label: "Close date" },
        { key: "owner", label: "Owner", value: (row) => row.owner.name },
      ],
      "fundraising-commitments",
    )
    toast.success(`Exported ${filtered.length} commitments`)
  }

  const checklistComplete = checklist.length > 0 && checklist.every((item) => item.status === "Completed")
  const canAdmit = Boolean(selected) && checklistComplete && !selected?.complianceBlocked && !["ADMITTED_AT_CLOSE", "PARTIALLY_FUNDED", "FUNDED", "CANCELLED", "DEFAULTED"].includes(selected?.status || "")
  const canFund =
    Boolean(selected) &&
    !selected?.complianceBlocked &&
    ["ADMITTED_AT_CLOSE", "PARTIALLY_FUNDED"].includes(selected?.status || "")

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Commitments & Closings
          </h1>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#94a3b8]" /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            disabled={loading || filtered.length === 0}
            onClick={exportCommitments}
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
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(CARD, "flex min-w-0 flex-col overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Investors</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {mapped.length}
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
                  className="h-8 rounded-full border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setShowAll(false)
                }}
              >
                <SelectTrigger className="h-8 w-full rounded-full border-[#e2e8f0] text-[12px] sm:w-[140px]">
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
                <SelectTrigger className="h-8 w-full rounded-full border-[#e2e8f0] text-[12px] sm:w-[150px]">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {ownerOptions.map((name) => (
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
                {loading ? (
                  <FrTableSkeleton columns={10} rows={6} />
                ) : visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-[13px] text-[#94a3b8]"
                    >
                      {mapped.length === 0
                        ? "No commitments recorded yet."
                        : "No investors match your filters."}
                    </td>
                  </tr>
                ) : (
                  visible.map((inv) => (
                    <InvestorRow
                      key={inv.id}
                      investor={inv}
                      selected={selected?.id === inv.id}
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
          {selected ? (
            <ChecklistPanel
              investorName={selected.name}
              items={checklist}
              loading={checklistLoading}
              complianceBlocked={selected.complianceBlocked}
              onToggle={handleToggleChecklistItem}
              togglingId={togglingItemId}
              footer={
                <div className="space-y-3">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                      Commitment lifecycle
                    </p>
                    <div className="flex gap-2">
                      <select
                        aria-label="Commitment lifecycle status"
                        className={cn(frInputClass, "h-8 flex-1 rounded-full text-[11px]")}
                        value={lifecycleStatus}
                        disabled={updatingLifecycle}
                        onChange={(event) => setLifecycleStatus(event.target.value)}
                      >
                        {EDITABLE_COMMITMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                        {!EDITABLE_COMMITMENT_STATUSES.includes(selected.status as typeof EDITABLE_COMMITMENT_STATUSES[number]) ? (
                          <option value={selected.status}>{selected.status.replace(/_/g, " ")}</option>
                        ) : null}
                      </select>
                      <Button
                        variant="outline"
                        className="h-8 rounded-full px-3 text-[11px]"
                        disabled={updatingLifecycle || lifecycleStatus === selected.status}
                        onClick={handleLifecycleUpdate}
                      >
                        {updatingLifecycle ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Save
                      </Button>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[#64748b]">
                      Signed confirms execution only. Admission and cash funding use the guarded actions below.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8 flex-1 rounded-full text-[11px]"
                      disabled={!canAdmit || admitting}
                      onClick={handleAdmit}
                    >
                      {admitting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      {admitting ? "Admitting…" : "Admit"}
                    </Button>
                    <Button
                      variant="gradient-info"
                      className="h-8 flex-1 rounded-full text-[11px] font-semibold"
                      disabled={!canFund || funding}
                      onClick={openFundDialog}
                    >
                      {funding ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      {funding ? "Recording…" : "Record Funding"}
                    </Button>
                  </div>
                </div>
              }
            />
          ) : null}
          <ClosingProgressCard
            event={nextClosingEvent}
            timeline={closingTimeline}
            onViewCalendar={() => setCalendarOpen(true)}
          />
        </aside>
      </div>

      <FrViewAllDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        title="Closing calendar"
        description="Upcoming and recent closing milestones"
        emptyText="No closings recorded yet."
        rows={sortedClosings.map((c) => {
          const state = closingState(c.status)
          return {
            id: String(c.id),
            title: closeTypeLabel(c.closeType),
            subtitle: String(c.status || "").replace(/_/g, " "),
            meta: fmtDate(c.closingDate) ?? "No date set",
            badge: state === "done" ? "Done" : state === "current" ? "Current" : "Upcoming",
            badgeClass:
              state === "done"
                ? "bg-[#dcfce7] text-[#15803d]"
                : state === "current"
                  ? "bg-[#dbeafe] text-[#1d4ed8]"
                  : "bg-[#f1f5f9] text-[#64748b]",
          }
        })}
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

      <FrCommitmentWizard open={addOpen} onOpenChange={setAddOpen} onCreated={loadData} />

      <FrDialogShell
        open={fundOpen}
        onOpenChange={setFundOpen}
        title="Record Funding"
        description={selected ? `Confirm cash received for ${selected.name}` : undefined}
        footer={
          <FrFormFooter
            onCancel={() => setFundOpen(false)}
            onSubmit={handleFundSubmit}
            submitLabel={funding ? "Recording…" : "Record Funding"}
            submitDisabled={funding}
          />
        }
      >
        <FrField label="Funded amount">
          <input
            className={cn(frInputClass, "rounded-full")}
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            placeholder="0"
          />
        </FrField>
        <p className="mt-2 text-[11px] text-[#64748b]">
          Recorded against cash received — signed documents alone do not mark a commitment as funded.
        </p>
      </FrDialogShell>
      <FrRequirementsDialog
        state={requirements}
        onOpenChange={(open) => setRequirements((current) => ({ ...current, open }))}
      />
    </div>
  )
}

function moneyFmt(n: number): string {
  if (!n) return "US$0.00"
  if (Math.abs(n) >= 1_000_000) return `US$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `US$${(n / 1_000).toFixed(0)}K`
  return `US$${n.toLocaleString()}`
}
