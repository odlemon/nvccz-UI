"use client"

import { Info } from "lucide-react"
import { FpaStatusBadge } from "@/components/fpa/fpa-status-badge"
import {
  buildApprovalFeedRows,
  formatDateTime,
  type ApprovalFeedRow,
  type WorkflowTaskRow,
} from "@/components/fpa/workflow/workflow-utils"
import type { FpaReviewWorkspace } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#ede9fe] text-[#6d28d9]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#ffedd5] text-[#c2410c]",
  "bg-[#fce7f3] text-[#be185d]",
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"
}

function avatarClass(name: string, index: number) {
  return AVATAR_COLORS[(name.length + index) % AVATAR_COLORS.length]
}

function DeltaLine({
  delta,
  positiveIsBad,
}: {
  delta?: number | null
  positiveIsBad?: boolean
}) {
  if (typeof delta !== "number") return null
  const up = delta > 0
  const down = delta < 0
  const bad = positiveIsBad ? up : down
  const good = positiveIsBad ? down : up
  return (
    <p
      className={cn(
        "text-[11px] mt-1.5 font-medium leading-none",
        bad && "text-[#dc2626]",
        good && "text-[#16a34a]",
        !bad && !good && "text-[#94a3b8]",
      )}
    >
      {up ? "↑" : down ? "↓" : "·"} {Math.abs(delta)} vs last week
    </p>
  )
}

/** Middle card — matches screenshot: big counts, hairline divider, link footer. */
export function WorkflowReviewQueueCard({
  pending,
  returned,
  pendingDelta,
  returnedDelta,
  onViewAll,
}: {
  pending: number
  returned: number
  pendingDelta?: number | null
  returnedDelta?: number | null
  onViewAll: () => void
}) {
  const empty = pending === 0 && returned === 0

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 h-full flex flex-col min-w-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-1.5 mb-6">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">Review Queue</h2>
        <span
          className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-[#cbd5e1] text-[#94a3b8]"
          title="Tasks awaiting review or returned for correction"
        >
          <Info className="w-2.5 h-2.5" />
        </span>
      </div>

      {empty ? (
        <div className="flex-1 flex flex-col justify-center py-2">
          <p className="text-[28px] font-bold text-[#cbd5e1] tabular-nums leading-none">0</p>
          <p className="text-[12px] text-[#64748b] mt-3 leading-relaxed">
            No items in the review queue yet.
          </p>
          <p className="text-[11px] text-[#94a3b8] mt-1">
            Pending and returned counts will appear when owners submit.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-start pt-1">
          <div className="flex-1 min-w-0">
            <p className="text-[36px] font-bold text-[#0f172a] tabular-nums tracking-tight leading-none">
              {pending}
            </p>
            <p className="text-[12px] text-[#64748b] mt-2.5 leading-none">Pending Approvals</p>
            <DeltaLine delta={pendingDelta} positiveIsBad />
          </div>
          <div className="w-px self-stretch bg-[#e2e8f0] mx-4 min-h-[72px]" />
          <div className="flex-1 min-w-0">
            <p className="text-[36px] font-bold text-[#0f172a] tabular-nums tracking-tight leading-none">
              {returned}
            </p>
            <p className="text-[12px] text-[#64748b] mt-2.5 leading-none">Returned Items</p>
            <DeltaLine delta={returnedDelta} positiveIsBad={false} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="mt-auto pt-6 text-[12px] font-medium text-[#2563eb] hover:underline text-left"
      >
        View all queue →
      </button>
    </section>
  )
}

function ApprovalRow({
  row,
  index,
  compact,
}: {
  row: ApprovalFeedRow
  index: number
  compact?: boolean
}) {
  const tone =
    row.statusLabel === "Returned"
      ? "danger"
      : row.statusLabel === "Locked"
        ? "neutral"
        : "success"

  return (
    <li className="flex items-center gap-2.5 min-w-0">
      <div
        className={cn(
          "h-8 w-8 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0",
          avatarClass(row.name, index),
        )}
      >
        {initials(row.name)}
      </div>
      <div className={cn("min-w-0", compact ? "w-[34%]" : "w-[28%] sm:w-[30%]")}>
        <p className="text-[12px] font-semibold text-[#0f172a] truncate leading-tight">
          {row.name}
        </p>
        <p className="text-[10px] text-[#94a3b8] truncate leading-tight mt-0.5">{row.role}</p>
      </div>
      <p
        className={cn(
          "text-[10px] text-[#64748b] tabular-nums flex-1 text-left sm:text-center truncate px-1",
          !row.at && "italic text-[#94a3b8]",
        )}
        title={row.at ? formatDateTime(row.at) : "Date not available"}
      >
        {row.at ? formatDateTime(row.at) : "Date not available"}
      </p>
      <FpaStatusBadge tone={tone}>{row.statusLabel}</FpaStatusBadge>
    </li>
  )
}

/** Right card — avatar / name / date / Approved badge. */
export function WorkflowRecentApprovalsCard({
  review,
  tasks,
  events,
  onViewAll,
}: {
  review: FpaReviewWorkspace | null
  tasks: WorkflowTaskRow[]
  events?: import("@/lib/api/fpa-api").FpaApprovalEvent[] | null
  onViewAll: () => void
}) {
  const allRows = buildApprovalFeedRows(review, tasks, events)
  const rows = allRows.slice(0, 5)

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 h-full flex flex-col min-w-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[13px] font-semibold text-[#0f172a]">Recent Approvals</h2>
          <span
            className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-[#cbd5e1] text-[#94a3b8]"
            title="Latest approvals on this cycle"
          >
            <Info className="w-2.5 h-2.5" />
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[12px] font-medium text-[#2563eb] hover:underline shrink-0"
        >
          View all
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center py-4">
          <p className="text-[13px] font-medium text-[#475569]">No recent approvals</p>
          <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
            Approvals will show here after FP&A or CFO actions on this cycle.
          </p>
        </div>
      ) : (
        <ul className="space-y-3.5 flex-1">
          {rows.map((r, i) => (
            <ApprovalRow key={r.id} row={r} index={i} compact />
          ))}
        </ul>
      )}
    </section>
  )
}

export { ApprovalRow, initials, avatarClass }
