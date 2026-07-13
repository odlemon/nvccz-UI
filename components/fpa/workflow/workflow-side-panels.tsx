"use client"

import { Info, Loader2, MoreHorizontal, Paperclip } from "lucide-react"
import { formatDateTime, formatRelative } from "@/components/fpa/workflow/workflow-utils"
import type { FpaReviewWorkspace, FpaWorkflowComment } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"

export function WorkflowDeptProgress({
  rows,
  onViewFull,
}: {
  rows: Array<{
    departmentId: string
    departmentName: string
    submitted: number
    inReview: number
    inProgress: number
    notSubmitted: number
    total: number
    percent: number
  }>
  onViewFull?: () => void
}) {
  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] shrink-0">
      <div className="flex items-center gap-1.5 mb-3">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">
          Submission Progress by Department
        </h2>
        <span
          className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-[#cbd5e1] text-[#94a3b8]"
          title="Stacked share of submissions by status"
        >
          <Info className="w-2.5 h-2.5" />
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3.5 text-[10px] text-[#64748b]">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#16a34a]" /> Submitted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#2563eb]" /> In Review
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#eab308]" /> In Progress
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-2 rounded-full bg-[#cbd5e1]" /> Not Submitted
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-[12px] text-[#94a3b8] py-4">
          No department progress for this cycle yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const total = Math.max(1, r.total)
            const w = (n: number) => `${(n / total) * 100}%`
            return (
              <li key={r.departmentId}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[12px] font-medium text-[#0f172a] truncate">
                    {r.departmentName}
                  </p>
                  <p className="text-[11px] tabular-nums text-[#64748b] shrink-0">{r.percent}%</p>
                </div>
                <div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden flex">
                  <span className="h-full bg-[#16a34a]" style={{ width: w(r.submitted) }} />
                  <span className="h-full bg-[#2563eb]" style={{ width: w(r.inReview) }} />
                  <span className="h-full bg-[#eab308]" style={{ width: w(r.inProgress) }} />
                  <span className="h-full bg-[#cbd5e1]" style={{ width: w(r.notSubmitted) }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onViewFull}
        className="mt-4 text-[12px] font-medium text-[#2563eb] hover:underline text-left"
      >
        View full progress report →
      </button>
    </section>
  )
}

export function WorkflowActivityFeed({
  review,
  comments,
  commentDraft,
  onCommentDraft,
  onAddComment,
  canComment,
  canPostInternal,
  visibility,
  onVisibility,
  busy,
  onViewAll,
}: {
  review: FpaReviewWorkspace | null
  comments?: FpaWorkflowComment[]
  commentDraft: string
  onCommentDraft: (v: string) => void
  onAddComment: () => void
  canComment: boolean
  canPostInternal?: boolean
  visibility?: "ALL" | "INTERNAL"
  onVisibility?: (v: "ALL" | "INTERNAL") => void
  busy?: boolean
  onViewAll?: () => void
}) {
  const history = review?.approvalHistory || []
  const feed =
    comments && comments.length > 0
      ? comments.map((c) => ({
          id: c.id,
          name: c.authorName || "User",
          at: c.createdAt,
          body: c.body,
          visibility: c.visibility,
          kind: "comment" as const,
        }))
      : history.map((e, i) => ({
          id: `hist-${i}`,
          name: e.actorName || e.byName || "User",
          at: e.createdAt || e.at,
          body: e.comment || e.commentSnippet || e.action || "Updated the cycle",
          visibility: undefined as string | undefined,
          kind: "event" as const,
        }))

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 flex flex-col flex-1 min-h-0 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">Comments & Activity</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[12px] font-medium text-[#2563eb] hover:underline shrink-0"
        >
          View all
        </button>
      </div>

      <div className="relative mb-2 shrink-0">
        <textarea
          value={commentDraft}
          onChange={(e) => onCommentDraft(e.target.value)}
          placeholder={canComment ? "Add a comment..." : "Comments closed for this status"}
          disabled={!canComment || busy}
          rows={2}
          className={cn(
            "w-full rounded-lg border border-[#e2e8f0] px-3 py-2 pr-10 text-[12px] resize-none",
            (!canComment || busy) && "bg-[#f8fafc] text-[#94a3b8]",
          )}
        />
        <button
          type="button"
          disabled
          title="Use task attachments for file uploads"
          className="absolute right-2 bottom-2 h-7 w-7 inline-flex items-center justify-center rounded-md text-[#94a3b8]"
        >
          <Paperclip className="w-3.5 h-3.5" />
        </button>
      </div>

      {canComment && canPostInternal && onVisibility ? (
        <div className="mb-3 shrink-0">
          <select
            value={visibility || "ALL"}
            onChange={(e) => onVisibility(e.target.value as "ALL" | "INTERNAL")}
            disabled={busy}
            className="h-7 rounded-md border border-[#e2e8f0] px-2 text-[10px] text-[#475569]"
          >
            <option value="ALL">Visible to all</option>
            <option value="INTERNAL">Internal (FP&A/CFO)</option>
          </select>
        </div>
      ) : null}

      <div className="flex-1 space-y-3.5 overflow-y-auto min-h-0">
        {feed.length === 0 ? (
          <p className="text-[12px] text-[#94a3b8] leading-relaxed">
            No activity yet. Comments and approval history will appear here.
          </p>
        ) : (
          feed.map((e) => (
            <div key={e.id} className="flex gap-2.5 group">
              <div className="h-8 w-8 rounded-full bg-[#e0e7ff] text-[10px] font-semibold text-[#3730a3] flex items-center justify-center shrink-0">
                {e.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-[12px] font-semibold text-[#0f172a] truncate">{e.name}</p>
                      {String(e.visibility || "").toUpperCase() === "INTERNAL" ? (
                        <span className="text-[9px] font-medium uppercase tracking-wide text-[#7c3aed] bg-[#f5f3ff] px-1.5 py-0.5 rounded shrink-0">
                          Internal
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-[#94a3b8]">
                      {e.at ? formatDateTime(e.at) : formatRelative(e.at) || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[#cbd5e1] hover:text-[#64748b] opacity-0 group-hover:opacity-100"
                    aria-label="More"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">{e.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {canComment ? (
        <button
          type="button"
          disabled={busy || !commentDraft.trim()}
          onClick={onAddComment}
          className="mt-3 h-8 rounded-lg bg-[#2563eb] text-[12px] font-medium text-white disabled:opacity-50 shrink-0 inline-flex items-center justify-center gap-1.5"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {busy ? "Posting…" : "Post comment"}
        </button>
      ) : null}
    </section>
  )
}
