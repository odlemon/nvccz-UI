"use client"

import { FpaStatusBadge } from "@/components/fpa/fpa-status-badge"
import { ApprovalRow } from "@/components/fpa/workflow/workflow-review-cards"
import {
  buildApprovalFeedRows,
  formatDateTime,
  formatShortDate,
  isPendingReviewStatus,
  isReturnedStatus,
  taskStatusTone,
  type WorkflowTaskRow,
} from "@/components/fpa/workflow/workflow-utils"
import type { FpaReviewWorkspace } from "@/lib/api/fpa-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function WorkflowReviewQueueModal({
  open,
  onOpenChange,
  tasks,
  onSelectTask,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: WorkflowTaskRow[]
  onSelectTask?: (id: string) => void
}) {
  const pending = tasks.filter((t) => isPendingReviewStatus(t.status))
  const returned = tasks.filter((t) => isReturnedStatus(t.status))
  const empty = pending.length === 0 && returned.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl border border-[#e2e8f0] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9] shrink-0">
          <DialogTitle className="text-base text-[#0f172a]">Review queue</DialogTitle>
          <DialogDescription className="text-sm text-[#64748b]">
            {pending.length} pending · {returned.length} returned
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {empty ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-[#475569]">No items in the review queue</p>
              <p className="text-xs text-[#94a3b8] mt-1.5 max-w-sm mx-auto">
                When department owners submit budgets, pending and returned items will list here.
              </p>
            </div>
          ) : (
            <>
              <QueueSection
                title="Pending approvals"
                count={pending.length}
                tasks={pending}
                emptyLabel="No pending approvals"
                onSelectTask={onSelectTask}
                onOpenChange={onOpenChange}
              />
              <QueueSection
                title="Returned items"
                count={returned.length}
                tasks={returned}
                emptyLabel="No returned items"
                onSelectTask={onSelectTask}
                onOpenChange={onOpenChange}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function QueueSection({
  title,
  count,
  tasks,
  emptyLabel,
  onSelectTask,
  onOpenChange,
}: {
  title: string
  count: number
  tasks: WorkflowTaskRow[]
  emptyLabel: string
  onSelectTask?: (id: string) => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[12px] font-semibold text-[#0f172a]">{title}</h3>
        <span className="text-[11px] tabular-nums text-[#94a3b8]">{count}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[12px] text-[#94a3b8] py-3 px-3 rounded-lg bg-[#f8fafc]">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0] overflow-hidden">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full text-left px-3.5 py-3 hover:bg-[#f8fafc] transition-colors flex items-start gap-3"
                onClick={() => {
                  onSelectTask?.(t.id)
                  onOpenChange(false)
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#0f172a] truncate">{t.title}</p>
                  <p className="text-[11px] text-[#64748b] mt-0.5 truncate">
                    {[t.departmentName, t.assigneeName].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <FpaStatusBadge tone={taskStatusTone(t.status)}>{t.status}</FpaStatusBadge>
                  <p className="text-[10px] text-[#94a3b8] tabular-nums">
                    {t.dueDate
                      ? `Due ${formatShortDate(t.dueDate)}`
                      : t.submittedOn
                        ? `Submitted ${formatDateTime(t.submittedOn)}`
                        : "No date"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function WorkflowRecentApprovalsModal({
  open,
  onOpenChange,
  review,
  tasks,
  events,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  review: FpaReviewWorkspace | null
  tasks: WorkflowTaskRow[]
  events?: import("@/lib/api/fpa-api").FpaApprovalEvent[] | null
}) {
  const rows = buildApprovalFeedRows(review, tasks, events)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl border border-[#e2e8f0] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9] shrink-0">
          <DialogTitle className="text-base text-[#0f172a]">Recent approvals</DialogTitle>
          <DialogDescription className="text-sm text-[#64748b]">
            Full approval history for this planning cycle
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {rows.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-[#475569]">No approvals yet</p>
              <p className="text-xs text-[#94a3b8] mt-1.5 max-w-sm mx-auto">
                Accept, approve, return, and lock actions will appear here with date and actor.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {rows.map((r, i) => (
                <ApprovalRow key={r.id} row={r} index={i} />
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
