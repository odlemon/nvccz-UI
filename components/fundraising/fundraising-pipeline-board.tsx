"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  Filter,
  Landmark,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PipelineFilter } from "./pipeline-mock-data"
import {
  BOARD_KPIS,
  BOARD_STAGES,
  boardActionsFor,
  boardActivityFor,
  filterBoardCards,
  type BoardCard,
  type BoardActivity,
  type BoardStageId,
} from "./pipeline-board-mock-data"

const CARD =
  "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const AVATAR_TONES = [
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#ede9fe] text-[#6d28d9]",
  "bg-[#ffedd5] text-[#c2410c]",
  "bg-[#e0e7ff] text-[#4338ca]",
  "bg-[#fce7f3] text-[#be185d]",
]

const KPI_ICONS = {
  funnel: Filter,
  coins: Coins,
  trend: TrendingUp,
  clock: Clock,
  calendar: CalendarDays,
}

function avatarTone(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[h]
}

function cardTypeIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes("family") || t.includes("angel") || t.includes("person")) return Users
  if (t.includes("pension") || t.includes("bank") || t.includes("authority")) return Landmark
  return Building2
}

function shortOwnerName(owner: string) {
  const parts = owner.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function OpportunityCard({
  card,
  selected,
  onSelect,
}: {
  card: BoardCard
  selected: boolean
  onSelect: () => void
}) {
  const TypeIcon = cardTypeIcon(card.type)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-[10px] border bg-white overflow-hidden transition-all",
        selected
          ? "border-[#6366f1] ring-2 ring-[#6366f1]/15"
          : "border-[#e2e8f0] hover:border-[#cbd5e1]",
      )}
    >
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2.5">
        <TypeIcon className="w-[18px] h-[18px] text-[#3b82f6] shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#0f172a] leading-snug">{card.name}</p>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">{card.type}</p>
        </div>
      </div>

      <div className="mx-3 mb-3 divide-y divide-[#f1f5f9] border-t border-[#f1f5f9]">
        <CardMetaRow label="Ticket" value={card.ticket} strong />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[11px] text-[#94a3b8] shrink-0">Owner</span>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "w-5 h-5 rounded-full text-[8px] font-semibold flex items-center justify-center shrink-0",
                avatarTone(card.owner),
              )}
            >
              {card.ownerInitials}
            </span>
            <span className="text-[11px] font-medium text-[#334155] truncate">
              {shortOwnerName(card.owner)}
            </span>
          </span>
        </div>
        <CardMetaRow label="Stage age" value={`${card.stageAge} days`} />
        <CardMetaRow label="Last contact" value={card.lastContact} />
        <CardMetaRow label="Next action" value={card.nextAction || "—"} />
        <CardMetaRow label="Due date" value={card.dueDate} />
      </div>
    </button>
  )
}

function CardMetaRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[11px] text-[#94a3b8] shrink-0">{label}</span>
      <span
        className={cn(
          "text-[11px] text-right truncate",
          strong ? "font-semibold text-[#0f172a]" : "font-medium text-[#334155]",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function detailHeaderIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes("family") || t.includes("angel") || t.includes("pension")) return Users
  if (t.includes("bank") || t.includes("authority")) return Landmark
  return Building2
}

function StageRibbon({ label }: { label: string }) {
  return (
    <div
      className="mt-3 inline-flex max-w-full items-center bg-[#ede9fe] pl-3 pr-4 py-2 text-xs font-semibold text-[#6d28d9]"
      style={{
        clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
      }}
    >
      {label}
    </div>
  )
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-xs text-[#94a3b8] shrink-0">{label}</span>
      {children ?? (
        <span className="text-xs font-semibold text-[#0f172a] text-right">{value}</span>
      )}
    </div>
  )
}

function ActivityIcon({ kind }: { kind: BoardActivity["kind"] }) {
  if (kind === "stage") {
    return (
      <span className="w-7 h-7 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
      </span>
    )
  }
  if (kind === "note") {
    return (
      <span className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <span className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center shrink-0">
      <FileText className="w-3.5 h-3.5" strokeWidth={2} />
    </span>
  )
}

function DetailPanel({ card }: { card: BoardCard }) {
  const stage = BOARD_STAGES.find((s) => s.id === card.stageId)
  const actions = boardActionsFor(card.id)
  const activity = boardActivityFor(card.id)
  const HeaderIcon = detailHeaderIcon(card.type)

  return (
    <div className="thin-scroll flex flex-col gap-3 h-full min-h-0 overflow-y-auto pb-1">
      {/* Card 1 — entity summary */}
      <section className={cn(CARD, "overflow-hidden")}>
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0">
              <HeaderIcon className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#0f172a] leading-snug">{card.name}</h2>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{card.type}</p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] shrink-0"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {stage && <StageRibbon label={stage.name} />}
        </div>

        <div className="mt-2 divide-y divide-[#f1f5f9] border-t border-[#f1f5f9]">
          <DetailRow label="Proposed Ticket" value={card.ticket} />
          <DetailRow label="Expected Raise" value={card.expectedRaise} />
          <DetailRow label="Owner">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center shrink-0",
                  avatarTone(card.owner),
                )}
              >
                {card.ownerInitials}
              </span>
              <span className="text-xs font-medium text-[#0f172a] truncate">{card.owner}</span>
            </span>
          </DetailRow>
          <DetailRow label="Stage Age" value={`${card.stageAge} days`} />
          <DetailRow label="Last Contact" value={card.lastContact} />
          <DetailRow label="Next Action" value={card.nextAction} />
          <DetailRow label="Due Date" value={card.dueDate} />
        </div>
      </section>

      {/* Card 2 — upcoming actions */}
      <section className={cn(CARD, "overflow-hidden")}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-[#0f172a]">Upcoming Actions</h3>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f1f5f9] px-1.5 text-[10px] font-semibold text-[#64748b] tabular-nums">
              {actions.length}
            </span>
          </div>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
            aria-label="Add action"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <ul className="divide-y divide-[#f1f5f9]">
          {actions.map((action) => (
            <li key={action.id} className="flex items-start gap-2.5 px-4 py-3">
              <span className="mt-0.5 w-8 h-8 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#0f172a] leading-snug">{action.title}</p>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{action.date}</p>
              </div>
              <span className="shrink-0 rounded-md bg-[#dcfce7] text-[#15803d] px-2 py-0.5 text-[10px] font-medium mt-0.5">
                {action.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Card 3 — notes */}
      <section className={cn(CARD, "px-4 py-4")}>
        <h3 className="text-xs font-semibold text-[#0f172a] mb-2.5">Notes</h3>
        <p className="text-xs text-[#334155] leading-relaxed">{card.notes}</p>
        <p className="mt-3 text-[10px] text-[#94a3b8] leading-relaxed">
          Last updated by {card.notesUpdatedBy}
          <br />
          {card.notesUpdatedAt}
        </p>
      </section>

      {/* Card 4 — recent activity */}
      <section className={cn(CARD, "px-4 py-4")}>
        <h3 className="text-xs font-semibold text-[#0f172a] mb-3">Recent Activity</h3>
        <ul className="space-y-3">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <ActivityIcon kind={item.kind} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-medium text-[#0f172a] leading-snug">{item.text}</p>
                <p className="mt-1 text-[10px] text-[#94a3b8]">
                  by {item.actor} · {item.when}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2563eb] hover:underline"
          >
            View all activity
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  )
}

export function FundraisingPipelineBoard({ filter }: { filter: PipelineFilter }) {
  const cards = useMemo(() => filterBoardCards(filter), [filter])
  const [selectedId, setSelectedId] = useState<string | null>("q1")

  useEffect(() => {
    if (selectedId && !cards.some((c) => c.id === selectedId)) {
      setSelectedId(cards[0]?.id ?? null)
    }
  }, [cards, selectedId])

  const selected = cards.find((c) => c.id === selectedId) ?? null

  const byStage = useMemo(() => {
    const map: Record<BoardStageId, BoardCard[]> = {
      prospect: [],
      contacted: [],
      qualified: [],
      management: [],
      dd: [],
      ic: [],
    }
    for (const card of cards) map[card.stageId].push(card)
    return map
  }, [cards])

  return (
    <div className="space-y-4">
      {/* Board KPIs — compact cards, do not stretch full width */}
      <div className="flex flex-wrap gap-3 justify-start">
        {BOARD_KPIS.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon]
          return (
            <div
              key={kpi.id}
              className={cn(
                CARD,
                "flex items-center gap-3 px-3.5 py-3 w-[min(100%,200px)] shrink-0",
              )}
            >
              <span className="shrink-0" style={{ color: kpi.accent }}>
                <Icon className="w-7 h-7" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-[#64748b] leading-tight truncate">{kpi.label}</p>
                <p className="mt-0.5 text-xl font-semibold text-[#0f172a] tabular-nums tracking-tight leading-none">
                  {kpi.value}
                </p>
                {kpi.metaTone === "alert" ? (
                  <button
                    type="button"
                    className="mt-1.5 text-[11px] font-medium text-[#dc2626] hover:underline text-left"
                  >
                    {kpi.meta}
                  </button>
                ) : (
                  <p className="mt-1.5 text-[11px] font-medium text-[#16a34a] inline-flex items-center gap-0.5">
                    {kpi.metaTone === "up" ? (
                      <ArrowUp className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    ) : (
                      <ArrowDown className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    )}
                    <span>
                      {kpi.meta.split(" vs ")[0]}
                      <span className="text-[#94a3b8] font-normal"> vs last month</span>
                    </span>
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Board + detail — dedicated right column, board scrolls in remaining space */}
      <div
        className={cn(
          "grid gap-4 min-h-[min(70vh,780px)] items-stretch",
          selected ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
        )}
      >
        <div className="thin-scroll min-w-0 overflow-x-auto overflow-y-hidden rounded-[12px]">
          <div className="flex gap-3 h-full min-h-[min(70vh,780px)] w-max">
            {BOARD_STAGES.map((stage) => {
              const columnCards = byStage[stage.id]
              return (
                <div
                  key={stage.id}
                  className="w-[260px] shrink-0 flex flex-col rounded-[12px] bg-[#f1f5f9]/70 border border-[#eef2f7] h-full"
                >
                  <div className="flex items-center gap-2 px-3 py-3 shrink-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    <h3 className="text-sm font-semibold text-[#0f172a] truncate flex-1">{stage.name}</h3>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#e2e8f0] bg-white px-1.5 text-[11px] font-medium text-[#64748b] tabular-nums">
                      {columnCards.length}
                    </span>
                  </div>

                  <div className="thin-scroll flex-1 min-h-0 px-2.5 pb-2 space-y-2.5 overflow-y-auto">
                    {columnCards.map((card) => (
                      <OpportunityCard
                        key={card.id}
                        card={card}
                        selected={card.id === selectedId}
                        onSelect={() => setSelectedId(card.id === selectedId ? null : card.id)}
                      />
                    ))}
                  </div>

                  <div className="px-2.5 pb-2.5 shrink-0">
                    <button
                      type="button"
                      className="w-full h-9 rounded-full text-xs font-medium text-[#64748b] hover:bg-white hover:text-[#334155] border border-transparent hover:border-[#e2e8f0] transition-colors inline-flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Opportunity
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selected && (
          <div className="min-w-0 lg:min-w-[360px] self-stretch">
            <DetailPanel card={selected} />
          </div>
        )}
      </div>
    </div>
  )
}

