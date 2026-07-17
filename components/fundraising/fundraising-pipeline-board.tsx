"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  Building2,
  Check,
  ChevronRight,
  Clock,
  Coins,
  FileText,
  Filter,
  Landmark,
  Loader2,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { fundraisingApi, toastFrError, type FrBoard } from "@/lib/api/fundraising-api"
import { mapOpportunityRow } from "@/lib/fundraising/mappers"
import { FrOpportunityWizard } from "@/components/fundraising/fundraising-create-wizards"
import {
  FrRequirementsDialog,
  requirementsFromError,
  emptyRequirementsState,
  type FrRequirementsState,
  FrDialogShell,
  FrFormFooter,
  FrField,
  FrPromptDialog,
  frInputClass,
  frSelectClass,
} from "@/components/fundraising/fundraising-modals"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const AMOUNT_TYPES = [
  { key: "indicativeAmount", label: "Indicative" },
  { key: "qualifiedAmount", label: "Qualified" },
  { key: "softCircleAmount", label: "Soft Circle" },
  { key: "proposedAmount", label: "Proposed" },
  { key: "signedAmount", label: "Signed" },
] as const


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

const STAGE_DOT_COLORS = ["#3b82f6", "#0ea5e9", "#8b5cf6", "#f59e0b", "#16a34a", "#ec4899", "#6366f1", "#ea580c"]

function avatarTone(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[h]
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"
}

function cardTypeIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes("family") || t.includes("angel") || t.includes("person")) return Users
  if (t.includes("pension") || t.includes("bank") || t.includes("authority")) return Landmark
  return Building2
}

function moneyLabel(n: number, currency = "USD") {
  if (!n) return "—"
  if (Math.abs(n) >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${currency} ${(n / 1_000).toFixed(0)}K`
  return `${currency} ${n.toLocaleString()}`
}

type OppRow = ReturnType<typeof mapOpportunityRow>

function CardMetaRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
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

function OpportunityCardContent({ row }: { row: OppRow }) {
  const TypeIcon = cardTypeIcon(row.investor)
  const ownerInitials = row.owner !== "—" ? initialsFor(row.owner) : "—"

  return (
    <>
      <div className="flex items-start gap-2.5 px-3 pt-3 pb-2.5">
        <TypeIcon className="w-[18px] h-[18px] text-[#3b82f6] shrink-0 mt-0.5" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#0f172a] leading-snug">{row.investor}</p>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">{row.campaign}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold",
            row.priority === "HIGH" || row.priority === "URGENT"
              ? "bg-[#fee2e2] text-[#dc2626]"
              : row.priority === "MEDIUM"
                ? "bg-[#ffedd5] text-[#c2410c]"
                : "bg-[#f1f5f9] text-[#64748b]",
          )}
        >
          {row.priority}
        </span>
      </div>

      <div className="mx-3 mb-3 divide-y divide-[#f1f5f9] border-t border-[#f1f5f9]">
        <CardMetaRow label="Indicative" value={row.indicative} strong />
        <CardMetaRow label="Soft circle" value={row.softCircle} />
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="text-[11px] text-[#94a3b8] shrink-0">Owner</span>
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "w-5 h-5 rounded-full text-[8px] font-semibold flex items-center justify-center shrink-0",
                avatarTone(row.owner),
              )}
            >
              {ownerInitials}
            </span>
            <span className="text-[11px] font-medium text-[#334155] truncate">{row.owner}</span>
          </span>
        </div>
        <CardMetaRow label="Stage age" value={`${row.ageDays} days`} />
        <CardMetaRow label="Next action" value={row.nextAction || "—"} />
      </div>
    </>
  )
}

function DraggableOpportunityCard({
  row,
  selected,
  onSelect,
}: {
  row: OppRow
  selected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      className={cn(
        "w-full text-left rounded-[10px] border bg-white overflow-hidden transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        selected
          ? "border-[#6366f1] ring-2 ring-[#6366f1]/15"
          : "border-[#e2e8f0] hover:border-[#cbd5e1]",
      )}
    >
      <OpportunityCardContent row={row} />
    </div>
  )
}

function DroppableColumn({
  stageCode,
  children,
}: {
  stageCode: string
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageCode })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "thin-scroll flex-1 min-h-0 px-2.5 pb-2 space-y-2.5 overflow-y-auto rounded-[8px] transition-colors",
        isOver && "bg-[#eef2ff]",
      )}
    >
      {children}
    </div>
  )
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

function DetailRow({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-xs text-[#94a3b8] shrink-0">{label}</span>
      {children ?? <span className="text-xs font-semibold text-[#0f172a] text-right">{value}</span>}
    </div>
  )
}

function AmountEditDialog({
  row,
  open,
  onOpenChange,
  onSaved,
}: {
  row: OppRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [amountType, setAmountType] = useState<string>(AMOUNT_TYPES[0].key)
  const [value, setValue] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [reqState, setReqState] = useState<FrRequirementsState>(emptyRequirementsState)

  async function submit() {
    if (!reason.trim()) {
      toast.error("A reason is required for every amount change")
      return
    }
    setSaving(true)
    try {
      await fundraisingApi.patchOpportunity(row.id, {
        [amountType]: Number(value.replace(/,/g, "")) || 0,
        reason: reason.trim(),
      })
      toast.success("Amount updated")
      onOpenChange(false)
      setValue("")
      setReason("")
      onSaved()
    } catch (err) {
      const req = requirementsFromError(err, "Amount change rejected")
      if (req.open) setReqState(req)
      else toastFrError(err, "Could not update amount")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <FrDialogShell
        open={open}
        onOpenChange={onOpenChange}
        title="Update amount"
        description={`${row.investor} · a reason is stored in the immutable amount history`}
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => onOpenChange(false)}
            onSubmit={submit}
            submitLabel={saving ? "Saving…" : "Save change"}
            submitDisabled={saving}
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Amount type">
            <select
              className={frSelectClass}
              value={amountType}
              onChange={(e) => setAmountType(e.target.value)}
            >
              {AMOUNT_TYPES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </FrField>
          <FrField label="New value">
            <input
              className={frInputClass}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="numeric"
              placeholder="0"
            />
          </FrField>
          <FrField label="Reason (required)">
            <input
              className={frInputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this amount changing?"
            />
          </FrField>
        </div>
      </FrDialogShell>
      <FrRequirementsDialog
        state={reqState}
        onOpenChange={(o) => setReqState((s) => ({ ...s, open: o }))}
      />
    </>
  )
}

function DetailPanel({
  row,
  stageName,
  onReload,
}: {
  row: OppRow
  stageName?: string
  onReload: () => void
}) {
  const TypeIcon = cardTypeIcon(row.investor)
  const [tasks, setTasks] = useState<Record<string, any>[]>([])
  const [timeline, setTimeline] = useState<Record<string, any>[]>([])
  const [loadingExtra, setLoadingExtra] = useState(false)
  const [amountOpen, setAmountOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lostOpen, setLostOpen] = useState(false)
  const [lostReason, setLostReason] = useState("")

  function reloadTimeline() {
    fundraisingApi
      .getOpportunityTimeline(row.id)
      .then((res) => setTimeline(res.events ?? []))
      .catch(() => {})
    onReload()
  }

  async function markLost() {
    setBusy(true)
    try {
      await fundraisingApi.markOpportunityLost(row.id, lostReason.trim())
      toast.success("Opportunity marked lost")
      setLostOpen(false)
      setLostReason("")
      reloadTimeline()
    } catch (err) {
      toastFrError(err, "Could not mark lost")
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(status: string) {
    setBusy(true)
    try {
      await fundraisingApi.setOpportunityStatus(row.id, { status })
      toast.success(`Status set to ${status}`)
      reloadTimeline()
    } catch (err) {
      toastFrError(err, "Could not set status")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoadingExtra(true)
    Promise.allSettled([
      fundraisingApi.listTasks({ opportunityId: row.id }),
      fundraisingApi.getOpportunityTimeline(row.id),
    ])
      .then(([tasksRes, timelineRes]) => {
        if (cancelled) return
        setTasks(tasksRes.status === "fulfilled" ? tasksRes.value.performanceTasks ?? [] : [])
        setTimeline(timelineRes.status === "fulfilled" ? timelineRes.value.events ?? [] : [])
      })
      .finally(() => {
        if (!cancelled) setLoadingExtra(false)
      })
    return () => {
      cancelled = true
    }
  }, [row.id])

  return (
    <div className="thin-scroll flex flex-col gap-3 h-full min-h-0 overflow-y-auto pb-1">
      <section className={cn(CARD, "overflow-hidden")}>
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0">
              <TypeIcon className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#0f172a] leading-snug">{row.investor}</h2>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{row.campaign}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] shrink-0"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {stageName ? <StageRibbon label={stageName} /> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-[11px] gap-1.5"
              disabled={busy}
              onClick={() => setAmountOpen(true)}
            >
              <Coins className="h-3.5 w-3.5" /> Edit amounts
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-[11px] gap-1.5"
              disabled={busy}
              onClick={() => setStatus("ON_HOLD")}
            >
              <Clock className="h-3.5 w-3.5" /> On hold
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-[11px] gap-1.5 text-[#b91c1c] hover:text-[#b91c1c]"
              disabled={busy}
              onClick={() => setLostOpen(true)}
            >
              <X className="h-3.5 w-3.5" /> Mark lost
            </Button>
          </div>
        </div>

        <div className="mt-2 divide-y divide-[#f1f5f9] border-t border-[#f1f5f9]">
          <DetailRow label="Indicative" value={row.indicative} />
          <DetailRow label="Soft Circle" value={row.softCircle} />
          <DetailRow label="Signed" value={row.signed} />
          <DetailRow label="Owner">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  "w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center shrink-0",
                  avatarTone(row.owner),
                )}
              >
                {row.owner !== "—" ? initialsFor(row.owner) : "—"}
              </span>
              <span className="text-xs font-medium text-[#0f172a] truncate">{row.owner}</span>
            </span>
          </DetailRow>
          <DetailRow label="Stage Age" value={`${row.ageDays} days`} />
          <DetailRow label="Next Action" value={row.nextAction || "—"} />
          <DetailRow label="Priority" value={row.priority} />
        </div>
      </section>

      <section className={cn(CARD, "overflow-hidden")}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-[#0f172a]">Open Tasks</h3>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f1f5f9] px-1.5 text-[10px] font-semibold text-[#64748b] tabular-nums">
              {tasks.length}
            </span>
          </div>
        </div>
        {loadingExtra ? (
          <div className="flex items-center gap-2 px-4 py-4 text-[11px] text-[#94a3b8]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : tasks.length === 0 ? (
          <p className="px-4 py-4 text-[11px] text-[#94a3b8]">No open tasks for this opportunity.</p>
        ) : (
          <ul className="divide-y divide-[#f1f5f9]">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2.5 px-4 py-3">
                <span className="mt-0.5 w-8 h-8 rounded-lg bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#0f172a] leading-snug">{t.title}</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}</p>
                </div>
                <span className="shrink-0 rounded-md bg-[#dcfce7] text-[#15803d] px-2 py-0.5 text-[10px] font-medium mt-0.5">
                  {t.status || "OPEN"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cn(CARD, "px-4 py-4")}>
        <h3 className="text-xs font-semibold text-[#0f172a] mb-3">Recent Activity</h3>
        {timeline.length === 0 ? (
          <p className="text-xs text-[#94a3b8]">No timeline events yet.</p>
        ) : (
          <ul className="space-y-3">
            {timeline.slice(0, 8).map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-xs font-medium text-[#0f172a] leading-snug">
                    {item.type === "stage" ? `Moved to ${item.toStageCode}` : `${item.amountType} updated → ${item.newValue}`}
                  </p>
                  <p className="mt-1 text-[10px] text-[#94a3b8]">{item.at ? new Date(item.at).toLocaleString() : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
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

      <AmountEditDialog
        row={row}
        open={amountOpen}
        onOpenChange={setAmountOpen}
        onSaved={reloadTimeline}
      />
      <FrPromptDialog
        open={lostOpen}
        onOpenChange={setLostOpen}
        title="Mark opportunity as lost"
        description="Record why this opportunity was lost for the audit trail."
        label="Lost reason"
        value={lostReason}
        onValueChange={setLostReason}
        multiline
        required
        loading={busy}
        submitLabel="Mark lost"
        onSubmit={markLost}
      />
    </div>
  )
}

export function FundraisingPipelineBoard({
  campaignId: fixedCampaignId,
}: {
  campaignId?: string
}) {
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])
  const [campaignId, setCampaignId] = useState(fixedCampaignId || "")
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [board, setBoard] = useState<FrBoard | null>(null)
  const [boardLoading, setBoardLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState<OppRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [reqState, setReqState] = useState<FrRequirementsState>(emptyRequirementsState)

  useEffect(() => {
    if (fixedCampaignId) return
    setCampaignsLoading(true)
    fundraisingApi
      .listCampaigns()
      .then((list) => {
        setCampaigns(list ?? [])
        const active = list?.find((c) => String(c.status).toUpperCase() === "ACTIVE") ?? list?.[0]
        if (active) setCampaignId(String(active.id))
      })
      .catch((err) => toastFrError(err, "Could not load campaigns"))
      .finally(() => setCampaignsLoading(false))
  }, [fixedCampaignId])

  async function loadBoard(id: string) {
    if (!id) return
    setBoardLoading(true)
    try {
      const data = await fundraisingApi.getCampaignBoard(id)
      setBoard(data)
    } catch (err) {
      toastFrError(err, "Could not load pipeline board")
      setBoard(null)
    } finally {
      setBoardLoading(false)
    }
  }

  useEffect(() => {
    if (campaignId) loadBoard(campaignId)
  }, [campaignId])

  const rowsByStage = useMemo(() => {
    const map = new Map<string, OppRow[]>()
    board?.columns.forEach((col) => {
      map.set(col.stage.stageCode, (col.cards ?? []).map(mapOpportunityRow))
    })
    return map
  }, [board])

  const allRows = useMemo(() => Array.from(rowsByStage.values()).flat(), [rowsByStage])
  const selectedRow = allRows.find((r) => r.id === selectedId) ?? null
  const selectedStage = board?.columns.find((c) => c.stage.stageCode === selectedRow?.stageCode)?.stage

  const kpis = useMemo(() => {
    const totalOpps = allRows.length
    const indicativeSum = board?.columns.reduce((s, c) => s + (Number(c.totals?.indicativeAmount) || 0), 0) ?? 0
    const weightedSum = board?.columns.reduce((s, c) => s + (Number(c.totals?.weightedAmount) || 0), 0) ?? 0
    const avgAge = totalOpps > 0 ? Math.round(allRows.reduce((s, r) => s + r.ageDays, 0) / totalOpps) : 0
    return { totalOpps, indicativeSum, weightedSum, avgAge }
  }, [allRows, board])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragStart(event: DragStartEvent) {
    const row = allRows.find((r) => r.id === event.active.id)
    setActiveCard(row ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return
    const row = allRows.find((r) => r.id === active.id)
    if (!row) return
    const toStageCode = String(over.id)
    if (!toStageCode || toStageCode === row.stageCode) return

    try {
      await fundraisingApi.transitionOpportunity(row.id, { toStageCode })
      await loadBoard(campaignId)
    } catch (err) {
      // Surface unmet stage-gate requirements as a checklist, not just a toast.
      const req = requirementsFromError(err, "Stage transition failed")
      if (req.open) setReqState(req)
      else toastFrError(err, "Stage transition failed")
      // Never keep an optimistic move — reload to restore server state.
      await loadBoard(campaignId)
    }
  }

  const loading = campaignsLoading || boardLoading

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {!fixedCampaignId ? (
          <Select value={campaignId} onValueChange={setCampaignId} disabled={campaignsLoading || campaigns.length === 0}>
            <SelectTrigger className="h-9 w-[240px] rounded-full border-[#e2e8f0] bg-white text-xs font-medium">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} {c.status ? `(${c.status})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {loading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading board…
          </span>
        ) : null}
      </div>

      {!loading && !board ? (
        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
          {campaigns.length === 0 ? "No campaigns yet — create one to start a pipeline." : "Select a campaign to view its board."}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 justify-start">
            {[
              { id: "opps", label: "Open Opportunities", value: String(kpis.totalOpps), icon: Filter, accent: "#7c3aed" },
              { id: "indicative", label: "Indicative Pipeline", value: moneyLabel(kpis.indicativeSum), icon: Coins, accent: "#2563eb" },
              { id: "weighted", label: "Weighted Pipeline", value: moneyLabel(kpis.weightedSum), icon: TrendingUp, accent: "#16a34a" },
              { id: "age", label: "Avg Stage Age", value: `${kpis.avgAge}d`, icon: Clock, accent: "#d97706" },
            ].map((kpi) => (
              <div key={kpi.id} className={cn(CARD, "flex items-center gap-3 px-3.5 py-3 w-[min(100%,200px)] shrink-0")}>
                <span className="shrink-0" style={{ color: kpi.accent }}>
                  <kpi.icon className="w-7 h-7" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#64748b] leading-tight truncate">{kpi.label}</p>
                  <p className="mt-0.5 text-xl font-semibold text-[#0f172a] tabular-nums tracking-tight leading-none">
                    {kpi.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div
              className={cn(
                "grid gap-4 min-h-[min(70vh,780px)] items-stretch",
                selectedRow ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
              )}
            >
              <div className="thin-scroll min-w-0 overflow-x-auto overflow-y-hidden rounded-[12px]">
                <div className="flex gap-3 h-full min-h-[min(70vh,780px)] w-max">
                  {(board?.columns ?? []).map((col, colIdx) => {
                    const rows = rowsByStage.get(col.stage.stageCode) ?? []
                    return (
                      <div
                        key={col.stage.stageCode}
                        className="w-[260px] shrink-0 flex flex-col rounded-[12px] bg-[#f1f5f9]/70 border border-[#eef2f7] h-full"
                      >
                        <div className="flex items-center gap-2 px-3 py-3 shrink-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: STAGE_DOT_COLORS[colIdx % STAGE_DOT_COLORS.length] }}
                          />
                          <h3 className="text-sm font-semibold text-[#0f172a] truncate flex-1">
                            {col.stage.stageName || col.stage.stageCode}
                          </h3>
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-[#e2e8f0] bg-white px-1.5 text-[11px] font-medium text-[#64748b] tabular-nums">
                            {rows.length}
                          </span>
                        </div>

                        <DroppableColumn stageCode={col.stage.stageCode}>
                          {rows.map((row) => (
                            <DraggableOpportunityCard
                              key={row.id}
                              row={row}
                              selected={row.id === selectedId}
                              onSelect={() => setSelectedId(row.id === selectedId ? null : row.id)}
                            />
                          ))}
                        </DroppableColumn>

                        <div className="px-2.5 pb-2.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
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

              {selectedRow && (
                <div className="min-w-0 lg:min-w-[360px] self-stretch">
                  <DetailPanel
                    row={selectedRow}
                    stageName={selectedStage?.stageName}
                    onReload={() => loadBoard(campaignId)}
                  />
                </div>
              )}
            </div>

            <DragOverlay>
              {activeCard ? (
                <div className="w-[236px] rounded-[10px] border border-[#6366f1] bg-white shadow-lg overflow-hidden">
                  <OpportunityCardContent row={activeCard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <FrOpportunityWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        campaignId={campaignId}
        onCreated={() => loadBoard(campaignId)}
      />

      <FrRequirementsDialog
        state={reqState}
        onOpenChange={(o) => setReqState((s) => ({ ...s, open: o }))}
      />
    </div>
  )
}
