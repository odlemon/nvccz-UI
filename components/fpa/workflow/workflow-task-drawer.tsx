"use client"

import Link from "next/link"
import {
  Check,
  Loader2,
  Lock,
  MoreHorizontal,
  RotateCcw,
  UserRoundCog,
  X,
} from "lucide-react"
import { FpaStatusBadge } from "@/components/fpa/fpa-status-badge"
import {
  formatDateTime,
  formatShortDate,
  getTaskActionControls,
  taskStatusTone,
  type WorkflowTaskRow,
} from "@/components/fpa/workflow/workflow-utils"
import type { AppUser } from "@/lib/api/users-api"
import type { FpaTaskAttachment, FpaTaskSummary, FpaWorkflowComment } from "@/lib/api/fpa-api"
import { asNumber, formatMoney } from "@/lib/api/fpa-api"
import { cn } from "@/lib/utils"

/** Fixed right-column budget detail panel (not an overlay drawer). */
export function WorkflowTaskDetailPanel({
  task,
  cycleStatus,
  summary,
  attachments,
  taskComments,
  onClose,
  comment,
  onComment,
  reassignUserId,
  onReassignUserId,
  users,
  busy,
  busyAction,
  canApprove,
  canReturn,
  canReassign,
  canPostInternal,
  worksheetHref,
  onApprove,
  onReturn,
  onReassign,
  onUploadAttachment,
  onDownloadAttachment,
  onDeleteAttachment,
  taskCommentDraft,
  onTaskCommentDraft,
  taskCommentVisibility,
  onTaskCommentVisibility,
  onPostTaskComment,
}: {
  task: WorkflowTaskRow | null
  cycleStatus?: string | null
  summary?: FpaTaskSummary | null
  attachments?: FpaTaskAttachment[]
  taskComments?: FpaWorkflowComment[]
  onClose: () => void
  comment: string
  onComment: (v: string) => void
  reassignUserId: string
  onReassignUserId: (v: string) => void
  users: AppUser[]
  busy: boolean
  busyAction?: "approve" | "return" | "reassign" | string | null
  canApprove: boolean
  canReturn: boolean
  canReassign: boolean
  canPostInternal?: boolean
  worksheetHref: string | null
  onApprove: () => void
  onReturn: () => void
  onReassign: () => void
  onUploadAttachment?: (file: File) => void
  onDownloadAttachment?: (id: string, fileName?: string) => void
  onDeleteAttachment?: (id: string) => void
  taskCommentDraft?: string
  onTaskCommentDraft?: (v: string) => void
  taskCommentVisibility?: "ALL" | "INTERNAL"
  onTaskCommentVisibility?: (v: "ALL" | "INTERNAL") => void
  onPostTaskComment?: () => void
}) {
  if (!task) {
    return (
      <aside className="h-full min-h-[420px] xl:min-h-0 flex-1 rounded-xl border border-[#e2e8f0] bg-white p-5 flex flex-col items-center justify-center text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[13px] font-medium text-[#475569]">No task selected</p>
        <p className="text-[11px] text-[#94a3b8] mt-1.5 max-w-[200px] leading-relaxed">
          Select a row in Workflow Tasks to review budget details, notes, and actions.
        </p>
      </aside>
    )
  }

  const controls = getTaskActionControls({
    cycleStatus,
    taskStatus: task.status,
    canApprove,
    canReturn,
    canReassign,
  })

  const approveDisabled = busy || !controls.approveEnabled
  const returnDisabled = busy || !controls.returnEnabled || !comment.trim()
  const reassignDisabled = busy || !controls.reassignEnabled || !reassignUserId
  const reassignCandidates = users.filter((u) => u.id !== task.assigneeId)

  return (
    <aside className="h-full max-h-full min-h-[420px] xl:min-h-0 flex-1 rounded-xl border border-[#e2e8f0] bg-white flex flex-col overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-2 px-4 py-3.5 border-b border-[#e2e8f0] shrink-0">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[#0f172a] leading-snug">{task.title}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <FpaStatusBadge tone={taskStatusTone(task.status)}>
              {String(task.status).replace(/_/g, " ")}
            </FpaStatusBadge>
            <p className="text-[10px] text-[#94a3b8]">
              {task.submittedOn
                ? `Submitted ${formatDateTime(task.submittedOn)}`
                : `Due ${formatShortDate(task.dueDate)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#94a3b8] hover:text-[#64748b] p-1 rounded-lg hover:bg-[#f8fafc]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {controls.banner ? (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 shrink-0">
          <Lock className="w-3.5 h-3.5 text-[#64748b] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#475569] leading-relaxed">{controls.banner}</p>
        </div>
      ) : null}

      <div className="fpa-thin-scroll flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-sm">
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[12px] font-semibold text-[#0f172a]">Budget Summary</h3>
            {worksheetHref ? (
              <Link
                href={worksheetHref}
                className="text-[11px] font-medium text-[#2563eb] hover:underline"
              >
                View in model
              </Link>
            ) : null}
          </div>
          <div className="fpa-thin-scroll rounded-lg border border-[#e2e8f0] max-h-48 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-[#f8fafc] text-[#64748b]">
                <tr>
                  <th className="text-left px-2 py-1.5 font-medium">Metric</th>
                  <th className="text-right px-2 py-1.5 font-medium">Prior FY</th>
                  <th className="text-right px-2 py-1.5 font-medium">Request</th>
                  <th className="text-right px-2 py-1.5 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {summary?.lines && summary.lines.length > 0 ? (
                  summary.lines.map((line) => {
                    const prior = asNumber(line.prior)
                    const request = asNumber(line.request)
                    const pct =
                      line.pctChange != null
                        ? asNumber(line.pctChange)
                        : prior
                          ? ((request - prior) / Math.abs(prior)) * 100
                          : null
                    return (
                      <tr key={line.label} className="border-t border-[#f1f5f9]">
                        <td className="px-2 py-1.5 text-[#0f172a]">{line.label}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-[#475569]">
                          {formatMoney(prior, summary.currency || "USD")}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-[#0f172a]">
                          {formatMoney(request, summary.currency || "USD")}
                        </td>
                        <td
                          className={cn(
                            "px-2 py-1.5 text-right tabular-nums font-medium",
                            pct != null && pct > 0 && "text-[#dc2626]",
                            pct != null && pct < 0 && "text-[#16a34a]",
                            pct == null && "text-[#94a3b8]",
                          )}
                        >
                          {pct == null
                            ? "—"
                            : `${pct > 0 ? "↑" : pct < 0 ? "↓" : "·"} ${Math.abs(pct).toFixed(1)}%`}
                        </td>
                      </tr>
                    )
                  })
                ) : summary && (summary.priorFy != null || summary.request != null) ? (
                  <tr className="border-t border-[#f1f5f9]">
                    <td className="px-2 py-1.5 text-[#0f172a]">Total</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[#475569]">
                      {formatMoney(summary.priorFy, summary.currency || "USD")}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[#0f172a]">
                      {formatMoney(summary.request, summary.currency || "USD")}
                    </td>
                    <td
                      className={cn(
                        "px-2 py-1.5 text-right tabular-nums font-medium",
                        asNumber(summary.pctChange) > 0 && "text-[#dc2626]",
                        asNumber(summary.pctChange) < 0 && "text-[#16a34a]",
                      )}
                    >
                      {summary.pctChange == null
                        ? "—"
                        : `${asNumber(summary.pctChange) > 0 ? "↑" : "↓"} ${Math.abs(asNumber(summary.pctChange)).toFixed(1)}%`}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2 py-5 text-center text-[#94a3b8] text-[11px] leading-relaxed"
                    >
                      No budget summary available for this task yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Change Notes</h3>
          {task.changeNotes || summary?.changeNotes ? (
            <p className="text-[11px] text-[#475569] rounded-lg border border-[#e2e8f0] px-3 py-3 leading-relaxed">
              {task.changeNotes || summary?.changeNotes}
            </p>
          ) : (
            <p className="text-[11px] text-[#94a3b8] rounded-lg border border-dashed border-[#e2e8f0] px-3 py-3 leading-relaxed">
              No change notes on this task yet.
            </p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-[12px] font-semibold text-[#0f172a]">
              Attachments{" "}
              <span className="font-normal text-[#94a3b8]">
                · {attachments?.length || 0} files
              </span>
            </h3>
            {onUploadAttachment ? (
              <label className="text-[11px] font-medium text-[#2563eb] hover:underline cursor-pointer">
                + Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onUploadAttachment(file)
                    e.target.value = ""
                  }}
                />
              </label>
            ) : null}
          </div>
          {!attachments || attachments.length === 0 ? (
            <p className="text-[11px] text-[#94a3b8]">No attachments yet.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#0f172a] truncate">
                      {a.fileName || a.name || "File"}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">
                      {a.size != null || a.fileSize != null
                        ? `${Math.round(((a.size ?? a.fileSize) as number) / 1024)} KB`
                        : "—"}
                      {a.uploadedAt || a.createdAt
                        ? ` · ${formatShortDate(a.uploadedAt || a.createdAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                  {onDownloadAttachment ? (
                    <button
                      type="button"
                      onClick={() => onDownloadAttachment(a.id, a.fileName || a.name)}
                      className="text-[11px] font-medium text-[#2563eb]"
                    >
                      Download
                    </button>
                  ) : null}
                  {onDeleteAttachment && (canApprove || canReturn) ? (
                    <button
                      type="button"
                      onClick={() => onDeleteAttachment(a.id)}
                      disabled={busy}
                      className="text-[11px] font-medium text-[#dc2626] disabled:opacity-40"
                    >
                      Delete
                    </button>
                  ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-[12px] font-semibold text-[#0f172a] mb-2">History</h3>
          <ul className="space-y-3 border-l-2 border-[#e2e8f0] pl-3 ml-1">
            <li className="relative">
              <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-[#2563eb] ring-2 ring-white" />
              <p className="text-[11px] text-[#0f172a] font-medium">
                Current status: {String(task.status).replace(/_/g, " ")}
              </p>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">
                {task.departmentName || "Department"} · {task.assigneeName || "Unassigned"}
              </p>
            </li>
            {task.submittedOn ? (
              <li className="relative">
                <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-[#cbd5e1] ring-2 ring-white" />
                <p className="text-[11px] text-[#0f172a]">
                  Submitted by {task.assigneeName || "owner"}
                </p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5">
                  {formatDateTime(task.submittedOn)}
                </p>
              </li>
            ) : null}
            {task.reviewerName ? (
              <li className="relative">
                <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-[#cbd5e1] ring-2 ring-white" />
                <p className="text-[11px] text-[#0f172a]">Assigned to {task.reviewerName}</p>
              </li>
            ) : null}
          </ul>
        </section>

        <section>
          <h3 className="text-[12px] font-semibold text-[#0f172a] mb-1.5">Task comments</h3>
          <div className="fpa-thin-scroll space-y-2.5 mb-2 max-h-36 overflow-y-auto">
            {(taskComments || []).length === 0 ? (
              <p className="text-[11px] text-[#94a3b8]">No task comments yet.</p>
            ) : (
              (taskComments || []).map((c) => (
                <div key={c.id} className="rounded-lg border border-[#e2e8f0] px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#0f172a] truncate">
                      {c.authorName || "User"}
                    </p>
                    {String(c.visibility || "").toUpperCase() === "INTERNAL" ? (
                      <span className="text-[9px] font-medium uppercase tracking-wide text-[#7c3aed] bg-[#f5f3ff] px-1.5 py-0.5 rounded">
                        Internal
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-[#94a3b8]">
                    {c.createdAt ? formatDateTime(c.createdAt) : "—"}
                  </p>
                  <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">{c.body}</p>
                </div>
              ))
            )}
          </div>
          {onPostTaskComment && onTaskCommentDraft ? (
            <div className="space-y-1.5">
              <textarea
                className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-[11px]"
                rows={2}
                value={taskCommentDraft || ""}
                disabled={busy || !controls.commentEnabled}
                onChange={(e) => onTaskCommentDraft(e.target.value)}
                placeholder={
                  controls.commentEnabled
                    ? "Add a task comment…"
                    : "Comments closed for this status"
                }
              />
              <div className="flex items-center justify-between gap-2">
                {canPostInternal && onTaskCommentVisibility ? (
                  <select
                    value={taskCommentVisibility || "ALL"}
                    onChange={(e) =>
                      onTaskCommentVisibility(e.target.value as "ALL" | "INTERNAL")
                    }
                    disabled={busy || !controls.commentEnabled}
                    className="h-7 rounded-md border border-[#e2e8f0] px-2 text-[10px] text-[#475569]"
                  >
                    <option value="ALL">Visible to all</option>
                    <option value="INTERNAL">Internal (FP&A/CFO)</option>
                  </select>
                ) : (
                  <span className="text-[10px] text-[#94a3b8]">Visibility: All</span>
                )}
                <button
                  type="button"
                  disabled={
                    busy ||
                    !controls.commentEnabled ||
                    !(taskCommentDraft || "").trim()
                  }
                  onClick={onPostTaskComment}
                  className="h-7 px-2.5 rounded-md bg-[#2563eb] text-[11px] font-medium text-white disabled:opacity-40 inline-flex items-center gap-1"
                >
                  {busyAction === "task-comment" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : null}
                  Post
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-2">
          <div>
            <p className="text-[11px] text-[#64748b] mb-1">Action comment</p>
            <textarea
              className={cn(
                "w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-[11px]",
                !controls.commentEnabled && "bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed",
              )}
              rows={2}
              value={comment}
              disabled={!controls.commentEnabled || busy}
              onChange={(e) => onComment(e.target.value)}
              placeholder={
                controls.returnEnabled
                  ? "Required for return; optional for approve"
                  : controls.commentEnabled
                    ? "Optional comment"
                    : "Comments closed for this status"
              }
            />
          </div>
          {canReassign || controls.reassignEnabled ? (
            <div>
              <p className="text-[11px] text-[#64748b] mb-1">Reassign to</p>
              <select
                value={reassignUserId}
                onChange={(e) => onReassignUserId(e.target.value)}
                disabled={!controls.reassignEnabled || busy}
                title={controls.reassignTitle}
                className={cn(
                  "w-full h-8 rounded-lg border border-[#e2e8f0] px-2.5 text-[11px]",
                  !controls.reassignEnabled && "bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed",
                )}
              >
                <option value="">Select user…</option>
                {(reassignCandidates.length > 0 ? reassignCandidates : users).map((u) => (
                  <option key={u.id} value={u.id}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                  </option>
                ))}
              </select>
              {users.length === 0 ? (
                <p className="text-[10px] text-[#94a3b8] mt-1">No users loaded — refresh the page.</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <div className="border-t border-[#e2e8f0] p-3 space-y-2 shrink-0">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5">
          <button
            type="button"
            disabled={approveDisabled}
            title={controls.approveTitle}
            onClick={onApprove}
            className={cn(
              "h-9 rounded-lg text-[11px] font-medium text-white inline-flex items-center justify-center gap-1",
              "bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-40 disabled:hover:bg-[#16a34a] disabled:cursor-not-allowed",
            )}
          >
            {busyAction === "approve" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Approve
          </button>
          <button
            type="button"
            disabled={returnDisabled}
            title={
              controls.returnEnabled && !comment.trim()
                ? "Add a comment to return"
                : controls.returnTitle
            }
            onClick={onReturn}
            className="h-9 rounded-lg border border-[#fecaca] bg-white text-[11px] font-medium text-[#dc2626] inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fef2f2] disabled:hover:bg-white"
          >
            {busyAction === "return" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Return
          </button>
          <button
            type="button"
            disabled={reassignDisabled}
            title={
              controls.reassignEnabled && !reassignUserId
                ? "Select a user to reassign"
                : controls.reassignTitle
            }
            onClick={onReassign}
            className="h-9 rounded-lg border border-[#e2e8f0] bg-white text-[11px] font-medium text-[#475569] inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f8fafc] disabled:hover:bg-white"
          >
            {busyAction === "reassign" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserRoundCog className="w-3.5 h-3.5" />
            )}
            Reassign
          </button>
          <button
            type="button"
            className="h-9 w-9 rounded-lg border border-[#e2e8f0] text-[#64748b] inline-flex items-center justify-center hover:bg-[#f8fafc]"
            aria-label="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

/** @deprecated Use WorkflowTaskDetailPanel */
export function WorkflowTaskDrawer(
  props: React.ComponentProps<typeof WorkflowTaskDetailPanel> & { open?: boolean },
) {
  if (props.open === false) return null
  const { open: _open, ...rest } = props
  return <WorkflowTaskDetailPanel {...rest} />
}
