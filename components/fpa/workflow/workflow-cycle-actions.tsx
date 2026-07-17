"use client"

import { Loader2, Lock } from "lucide-react"
import { getCycleActionControls } from "@/components/fpa/workflow/workflow-utils"
import type { FpaBudgetCycle } from "@/lib/api/fpa-api"

export function WorkflowCycleActions({
  cycle,
  busyKey,
  comment,
  onComment,
  canReviewSubmissions,
  canApproveBudget,
  canReturnTask,
  canLockVersion,
  onFpaAccept,
  onCfoApprove,
  onReturn,
  onLock,
}: {
  cycle: FpaBudgetCycle | null
  busyKey: string | null
  comment: string
  onComment: (v: string) => void
  canReviewSubmissions: boolean
  canApproveBudget: boolean
  canReturnTask: boolean
  canLockVersion: boolean
  onFpaAccept: () => void
  onCfoApprove: () => void
  onReturn: () => void
  onLock: () => void
}) {
  if (!cycle) return null

  const controls = getCycleActionControls({
    cycleStatus: cycle.status,
    canReviewSubmissions,
    canApproveBudget,
    canReturnTask,
    canLockVersion,
  })
  const busy = (k: string) => busyKey === k
  const {
    showFpaAccept,
    showCfoApprove,
    showReturn,
    showLock,
    commentEnabled,
    readOnlyMessage,
  } = controls

  if (
    !showFpaAccept &&
    !showCfoApprove &&
    !showReturn &&
    !showLock &&
    !readOnlyMessage
  ) {
    return null
  }

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a]">Cycle actions</h2>
          <p className="text-[11px] text-[#64748b]">
            FP&A accept, CFO approve, return, and lock for this planning cycle.
          </p>
        </div>
      </div>

      {readOnlyMessage ? (
        <div className="flex items-start gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 text-[#64748b] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#475569] leading-relaxed">{readOnlyMessage}</p>
        </div>
      ) : null}

      {commentEnabled ? (
        <textarea
          value={comment}
          onChange={(e) => onComment(e.target.value)}
          rows={2}
          disabled={!!busyKey}
          placeholder={
            showReturn
              ? "Comment required to return; optional for accept/approve/lock"
              : "Optional comment"
          }
          className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-xs disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
        />
      ) : null}

      {(showFpaAccept || showCfoApprove || showReturn || showLock) && (
        <div className="flex flex-wrap gap-2">
          {showFpaAccept ? (
            <button
              type="button"
              disabled={!!busyKey}
              onClick={onFpaAccept}
              className="h-9 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {busy("fpa-accept") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Accept for CFO review
            </button>
          ) : null}
          {showCfoApprove ? (
            <button
              type="button"
              disabled={!!busyKey}
              onClick={onCfoApprove}
              className="h-9 rounded-full bg-[#16a34a] px-4 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {busy("cfo-approve") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Approve budget
            </button>
          ) : null}
          {showReturn ? (
            <button
              type="button"
              disabled={!!busyKey || !comment.trim()}
              title={!comment.trim() ? "Add a comment to return" : "Return for correction"}
              onClick={onReturn}
              className="h-9 rounded-full border border-[#dc2626] px-4 text-xs font-medium text-[#dc2626] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy("return") ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />
              ) : null}
              Return for correction
            </button>
          ) : null}
          {showLock ? (
            <button
              type="button"
              disabled={!!busyKey}
              onClick={onLock}
              className="h-9 rounded-full bg-[#0f172a] px-4 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {busy("lock") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Lock budget version
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
