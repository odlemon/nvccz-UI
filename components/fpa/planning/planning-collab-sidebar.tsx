"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PlanningAssignTaskDialog,
  type PlanningAssignDept,
} from "@/components/fpa/planning/planning-assign-task-dialog"

export type PlanningComment = {
  id: string
  cycleId?: string
  parentCommentId?: string
  author: string
  initials: string
  avatarTone: string
  when: string
  createdAt?: string
  body: string
  likes?: number
  replies?: PlanningComment[]
}

export type PlanningTask = {
  id: string
  cycleId?: string
  title: string
  assignee: string
  due: string
  /** Raw ISO due date when available */
  dueDate?: string
  done?: boolean
  departmentId?: string
  departmentName?: string
  assigneeId?: string
  status?: string
  priority?: string
  description?: string
  /** Dept plan slice vs ad-hoc planning task */
  kind?: "owner_slice" | "planning"
}

export type PlanningActivity = {
  id: string
  when: string
  text: string
  cycleId?: string
  actor?: string
  action?: string
  type?: string
  status?: string
  createdAt?: string
}

type Tab = "comments" | "tasks" | "activity" | "approvals"

export type PlanningApproval = {
  id: string
  text: string
  when: string
  status?: "approved" | "returned" | "pending" | "submitted"
  cycleId?: string
  actor?: string
  action?: string
  type?: string
  createdAt?: string
}

type Props = {
  comments?: PlanningComment[]
  tasks?: PlanningTask[]
  activity?: PlanningActivity[]
  approvals?: PlanningApproval[]
  onAddComment?: (body: string, parentCommentId?: string) => void | Promise<void>
  onReplyComment?: (body: string, parentCommentId: string) => Promise<void>
  disabledComment?: boolean
  commentPlaceholder?: string
  mode?: "planning" | "compare"
  /** @deprecated Design always shows Tasks tab + Tasks card; kept for call-site compat. */
  hideTasksTab?: boolean
  liveCycle?: boolean
  canAssignTasks?: boolean
  assignDepartments?: PlanningAssignDept[]
  assignUsers?: import("@/lib/api/users-api").AppUser[]
  defaultAssignDepartmentId?: string | null
  onAssignTask?: (body: {
    title: string
    assigneeId: string
    departmentId?: string | null
    dueDate?: string | null
    priority?: string | null
    description?: string | null
  }) => Promise<void>
  assignBusy?: boolean
  onCompleteTask?: (taskId: string) => Promise<void>
  canReviewTasks?: boolean
  onApproveTask?: (taskId: string, comment?: string) => Promise<void>
  onReturnTask?: (taskId: string, comment: string) => Promise<void>
  taskActionBusyId?: string | null
  className?: string
}

const AVATAR_TONES = [
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#bfdbfe] text-[#1e40af]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#fce7f3] text-[#be185d]",
  "bg-[#ffedd5] text-[#c2410c]",
]

export function planningInitials(name: string): string {
  const parts = String(name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
}

export function planningAvatarTone(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length
  return AVATAR_TONES[h] || AVATAR_TONES[0]
}

function renderBodyWithMentions(body: string) {
  const parts = body.split(/(@[\w][\w.\- ]*[\w])/g)
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-medium text-[#2563eb]">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function CommentItem({
  comment,
  nested = false,
  onReply,
  disabled,
}: {
  comment: PlanningComment
  nested?: boolean
  onReply?: (body: string, parentCommentId: string) => Promise<void>
  disabled?: boolean
}) {
  const [replying, setReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState("")
  const [replyBusy, setReplyBusy] = useState(false)

  const submitReply = async () => {
    const body = replyDraft.trim()
    if (!body || !onReply || replyBusy) return
    setReplyBusy(true)
    try {
      await onReply(body, comment.id)
      setReplyDraft("")
      setReplying(false)
    } finally {
      setReplyBusy(false)
    }
  }

  return (
    <article className={cn("flex gap-2.5", nested && "ml-8 mt-3")}>
      <span
        className={cn(
          "h-8 w-8 shrink-0 rounded-full text-[10px] font-semibold inline-flex items-center justify-center",
          comment.avatarTone,
        )}
      >
        {comment.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-[13px] font-semibold text-[#101828] truncate">
            {comment.author}
          </p>
          <span className="text-[11px] text-[#98a2b3] shrink-0">{comment.when}</span>
        </div>
        <p className="text-[13px] text-[#475467] mt-0.5 leading-relaxed">
          {renderBodyWithMentions(comment.body)}
        </p>
        {onReply ? (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            disabled={disabled || replyBusy}
            className="mt-1 rounded-full text-[11px] font-medium text-[#2563eb] hover:underline disabled:opacity-50"
          >
            Reply
          </button>
        ) : null}
        {replying ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void submitReply()
                }
              }}
              disabled={replyBusy}
              placeholder="Write a reply..."
              className="h-8 min-w-0 flex-1 rounded-full border border-[#d0d5dd] px-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            />
            <button
              type="button"
              onClick={() => void submitReply()}
              disabled={!replyDraft.trim() || replyBusy}
              className="h-8 rounded-full bg-[#2563eb] px-3 text-[11px] font-medium text-white disabled:opacity-50"
            >
              {replyBusy ? "Posting..." : "Post"}
            </button>
          </div>
        ) : null}
        {(comment.replies || []).map((r) => (
          <CommentItem key={r.id} comment={r} nested onReply={onReply} disabled={disabled} />
        ))}
      </div>
    </article>
  )
}

function TaskRow({
  task,
  onToggle,
  canReview,
  onApprove,
  onReturn,
  busy,
}: {
  task: PlanningTask
  onToggle: () => void
  canReview?: boolean
  onApprove?: (taskId: string, comment?: string) => Promise<void>
  onReturn?: (taskId: string, comment: string) => Promise<void>
  busy?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [returning, setReturning] = useState(false)
  const [returnComment, setReturnComment] = useState("")
  const statusLabel = String(task.status || (task.done ? "COMPLETED" : "OPEN")).replace(
    /_/g,
    " ",
  )
  const reviewable = /SUBMITTED|PENDING_REVIEW|UNDER_REVIEW/.test(
    String(task.status || "").toUpperCase(),
  )

  return (
    <li className="py-2.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (busy) return
            onToggle()
          }}
          disabled={busy}
          aria-label={task.done ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 inline-flex items-center justify-center disabled:opacity-50",
            task.done
              ? "border-[#2563eb] bg-[#2563eb]"
              : "border-[#d0d5dd] bg-white hover:border-[#98a2b3]",
          )}
        >
          {task.done ? (
            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/25"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[13px] font-medium text-[#101828] leading-snug",
                  task.done && "line-through text-[#98a2b3]",
                )}
              >
                {task.title}
              </p>
              <p className="text-[12px] text-[#667085] mt-0.5">{task.assignee}</p>
              {task.kind === "owner_slice" ? (
                <span className="inline-flex mt-1 rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-medium text-[#1d4ed8]">
                  Dept plan
                </span>
              ) : null}
            </div>
            <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
              {task.due ? (
                <span className="text-[12px] font-medium text-[#f04438]">{task.due}</span>
              ) : null}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-[#98a2b3] transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </div>
          </div>
        </button>
      </div>

      {expanded ? (
        <div className="ml-[30px] mt-2 rounded-xl border border-[#eaecf0] bg-[#f9fafb] px-3 py-2.5 space-y-2">
          <dl className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-1.5 text-[12px]">
            <dt className="text-[#98a2b3]">Status</dt>
            <dd className="text-[#344054] font-medium capitalize">{statusLabel.toLowerCase()}</dd>
            {task.priority ? (
              <>
                <dt className="text-[#98a2b3]">Priority</dt>
                <dd className="text-[#344054] font-medium capitalize">
                  {String(task.priority).toLowerCase()}
                </dd>
              </>
            ) : null}
            {task.departmentName || task.departmentId ? (
              <>
                <dt className="text-[#98a2b3]">Department</dt>
                <dd className="text-[#344054] font-medium">
                  {task.departmentName || task.departmentId}
                </dd>
              </>
            ) : null}
            <dt className="text-[#98a2b3]">Assignee</dt>
            <dd className="text-[#344054] font-medium">{task.assignee || "Unassigned"}</dd>
            {task.due || task.dueDate ? (
              <>
                <dt className="text-[#98a2b3]">Due</dt>
                <dd className="text-[#344054] font-medium">{task.due || task.dueDate}</dd>
              </>
            ) : null}
            <dt className="text-[#98a2b3]">Type</dt>
            <dd className="text-[#344054] font-medium">
              {task.kind === "owner_slice" ? "Department plan slice" : "Planning task"}
            </dd>
          </dl>
          {task.description ? (
            <div>
              <p className="text-[11px] font-medium text-[#98a2b3] mb-0.5">Notes</p>
              <p className="text-[12px] text-[#475467] leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          ) : null}
          {task.kind === "owner_slice" && !task.done ? (
            <p className="text-[11px] text-[#667085]">
              Complete this via <span className="font-medium">Submit my plan</span>, not the
              checkbox.
            </p>
          ) : null}
          {canReview && reviewable && (onApprove || onReturn) ? (
            <div className="space-y-2 border-t border-[#eaecf0] pt-2">
              {returning ? (
                <textarea
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  rows={2}
                  placeholder="Required return comment"
                  disabled={busy}
                  className="w-full rounded-lg border border-[#d0d5dd] bg-white px-2.5 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 disabled:opacity-50"
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                {onApprove ? (
                  <button
                    type="button"
                    onClick={() => void onApprove(task.id).catch(() => {})}
                    disabled={busy}
                    className="h-8 rounded-full bg-[#16a34a] px-3 text-[11px] font-medium text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                ) : null}
                {onReturn ? (
                  returning ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          const comment = returnComment.trim()
                          if (!comment) return
                          try {
                            await onReturn(task.id, comment)
                            setReturning(false)
                            setReturnComment("")
                          } catch {
                            // Parent callback displays the persistent API error.
                          }
                        }}
                        disabled={busy || !returnComment.trim()}
                        className="h-8 rounded-full bg-[#dc2626] px-3 text-[11px] font-medium text-white disabled:opacity-50"
                      >
                        Confirm return
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturning(false)}
                        disabled={busy}
                        className="h-8 rounded-full border border-[#d0d5dd] bg-white px-3 text-[11px] font-medium text-[#344054] disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReturning(true)}
                      disabled={busy}
                      className="h-8 rounded-full border border-[#fca5a5] bg-white px-3 text-[11px] font-medium text-[#dc2626] disabled:opacity-50"
                    >
                      Return
                    </button>
                  )
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function PlanningCollabSidebar({
  comments,
  tasks,
  activity,
  approvals,
  onAddComment,
  onReplyComment,
  disabledComment,
  commentPlaceholder = "Add a comment...",
  mode = "planning",
  className,
  canAssignTasks = false,
  assignDepartments = [],
  assignUsers = [],
  defaultAssignDepartmentId,
  onAssignTask,
  assignBusy = false,
  onCompleteTask,
  canReviewTasks = false,
  onApproveTask,
  onReturnTask,
  taskActionBusyId,
}: Props) {
  const [tab, setTab] = useState<Tab>("comments")
  const [draft, setDraft] = useState("")
  const [localTasks, setLocalTasks] = useState<PlanningTask[]>(() => tasks || [])
  const [allCommentsOpen, setAllCommentsOpen] = useState(false)
  const [allTasksOpen, setAllTasksOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const [localComments, setLocalComments] = useState<PlanningComment[]>([])
  const [postingComment, setPostingComment] = useState(false)

  useEffect(() => {
    setLocalComments(comments || [])
  }, [comments])

  useEffect(() => {
    setTab("comments")
  }, [mode])

  useEffect(() => {
    setLocalTasks(tasks || [])
  }, [tasks])

  const activityRows = activity || []
  const approvalRows = approvals ?? []
  const displayTasks = localTasks
  const openTaskCount = displayTasks.filter((t) => !t.done).length

  const tabs: Array<{ id: Tab; label: string; badge?: number }> =
    mode === "compare"
      ? [
          { id: "comments", label: "Comments", badge: localComments.length },
          { id: "approvals", label: "Approvals" },
          { id: "activity", label: "Activity" },
        ]
      : [
          { id: "comments", label: "Comments" },
          { id: "tasks", label: "Tasks", badge: openTaskCount },
          { id: "activity", label: "Activity" },
        ]

  const postComment = async () => {
    const body = draft.trim()
    if (!body || disabledComment || !onAddComment || postingComment) return
    setPostingComment(true)
    try {
      await onAddComment(body)
      setDraft("")
    } catch {
      // Parent callback owns the persistent API error message.
    } finally {
      setPostingComment(false)
    }
  }

  const toggleTask = async (id: string) => {
    const task = localTasks.find((t) => t.id === id)
    if (!task || task.done) return

    if (task.kind === "owner_slice") {
      toast.message("Use Submit my plan to complete this department slice task.")
      return
    }

    try {
      if (onCompleteTask) await onCompleteTask(id)
      setLocalTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: true } : x)))
    } catch {
      // keep local state unchanged on failure
    }
  }

  return (
    <>
      <aside
        className={cn(
          "rounded-xl border border-[#eaecf0] bg-white shadow-sm flex flex-col min-h-0 overflow-hidden",
          className,
        )}
      >
        <div className="flex items-center gap-5 border-b border-[#eaecf0] px-4 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative h-11 inline-flex items-center gap-1.5 text-[13px] font-medium border-b-2 -mb-px",
                tab === t.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#667085] hover:text-[#101828]",
              )}
            >
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f2f4f7] px-1.5 text-[11px] font-semibold text-[#667085]">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-4 py-3 flex flex-col">
          {tab === "comments" && (
            <div className="flex flex-col flex-1 min-h-0 divide-y divide-[#eaecf0]">
              {/* Comments Section */}
              <div className="pb-4 flex flex-col flex-1 min-h-0">
                <div className="relative shrink-0 mb-4">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void postComment()
                      }
                    }}
                    placeholder={commentPlaceholder}
                    disabled={disabledComment || postingComment || !onAddComment}
                    className="h-10 w-full rounded-[10px] border border-[#d0d5dd] bg-white px-3.5 text-[13px] text-[#101828] placeholder:text-[#98a2b3] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] disabled:opacity-50"
                  />
                </div>
                <p className="-mt-2 mb-3 text-[11px] text-[#98a2b3]">
                  Replies, reactions, and attachments are unavailable.
                </p>

                <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
                  {localComments.length ? (
                  localComments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      onReply={onReplyComment}
                      disabled={disabledComment || postingComment}
                    />
                  ))
                  ) : (
                    <p className="py-8 text-center text-[13px] text-[#98a2b3]">No comments yet.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setAllCommentsOpen(true)}
                  className="mt-4 shrink-0 w-full text-center text-[13px] font-semibold text-[#1570ef] hover:underline py-1"
                >
                  View all comments
                </button>
              </div>

            </div>
          )}

          {tab === "tasks" && (
            <div className="flex flex-col flex-1 min-h-0">
              {canAssignTasks && onAssignTask ? (
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="mb-2 inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3 text-[12px] font-medium text-[#344054] hover:bg-[#f9fafb]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign task
                </button>
              ) : null}
              {displayTasks.length === 0 ? (
                <p className="text-[12px] text-[#98a2b3] py-4 text-center">
                  No tasks yet. Assign one to chase department input.
                </p>
              ) : (
                <ul className="divide-y divide-[#f2f4f7]">
                  {displayTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onToggle={() => void toggleTask(t.id)}
                      canReview={canReviewTasks}
                      onApprove={onApproveTask}
                      onReturn={onReturnTask}
                      busy={Boolean(taskActionBusyId)}
                    />
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setAllTasksOpen(true)}
                className="mt-3 shrink-0 w-full text-center text-[13px] font-medium text-[#2563eb] hover:underline py-1"
              >
                View all tasks
              </button>
            </div>
          )}

          {tab === "approvals" && (
            !approvalRows.length ? (
              <div className="py-8 px-2 text-center space-y-3">
                <p className="text-[13px] text-[#98a2b3]">
                  No approval events for this cycle yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {approvalRows.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-[#eaecf0] px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] text-[#475467] leading-relaxed">{a.text}</p>
                      {a.status ? (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            a.status === "approved" && "bg-[#dcfce7] text-[#15803d]",
                            a.status === "returned" && "bg-[#fef2f2] text-[#dc2626]",
                            a.status === "submitted" && "bg-[#dbeafe] text-[#1d4ed8]",
                            a.status === "pending" && "bg-[#f1f5f9] text-[#64748b]",
                          )}
                        >
                          {a.status}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#98a2b3] mt-1">{a.when}</p>
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === "activity" && (
            !activityRows.length ? (
              <p className="text-[13px] text-[#98a2b3] text-center py-8">No recent activity.</p>
            ) : (
              <ul className="space-y-3">
                {activityRows.map((a) => (
                  <li key={a.id} className="flex gap-3 text-[13px]">
                    <span className="text-[11px] text-[#98a2b3] w-[4.5rem] shrink-0 pt-0.5">
                      {a.when}
                    </span>
                    <span className="text-[#475467] leading-relaxed">{a.text}</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </aside>

      <Dialog open={allCommentsOpen} onOpenChange={setAllCommentsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-5 py-4 border-b border-[#eaecf0] shrink-0">
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              All comments
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!localComments.length ? (
              <p className="text-[13px] text-[#98a2b3] text-center py-10">No comments yet.</p>
            ) : (
              localComments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  onReply={onReplyComment}
                  disabled={disabledComment || postingComment}
                />
              ))
            )}
          </div>
          <div className="shrink-0 border-t border-[#eaecf0] px-5 py-3 bg-[#f9fafb]">
            <div className="relative">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void postComment()
                  }
                }}
                placeholder={commentPlaceholder}
                disabled={disabledComment || postingComment || !onAddComment}
                className="h-10 w-full rounded-lg border border-[#d0d5dd] bg-white px-3 text-[13px] text-[#101828] placeholder:text-[#98a2b3] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 disabled:opacity-50"
              />
            </div>
            <p className="mt-2 text-[11px] text-[#98a2b3]">
              Replies, reactions, and attachments are unavailable.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={allTasksOpen} onOpenChange={setAllTasksOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-5 py-4 border-b border-[#eaecf0] shrink-0">
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              All tasks
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-2">
            <ul className="divide-y divide-[#f2f4f7]">
              {displayTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => void toggleTask(t.id)}
                  canReview={canReviewTasks}
                  onApprove={onApproveTask}
                  onReturn={onReturnTask}
                  busy={Boolean(taskActionBusyId)}
                />
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {canAssignTasks && onAssignTask ? (
        <PlanningAssignTaskDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          departments={assignDepartments}
          users={assignUsers}
          defaultDepartmentId={defaultAssignDepartmentId}
          busy={assignBusy}
          onSubmit={onAssignTask}
        />
      ) : null}
    </>
  )
}

/** Separate Tasks card for the design’s right-rail lower panel. */
export function PlanningTasksCard({
  tasks = [],
  className,
  canAssignTasks = false,
  assignDepartments = [],
  assignUsers = [],
  defaultAssignDepartmentId,
  onAssignTask,
  assignBusy = false,
  onCompleteTask,
}: {
  tasks?: PlanningTask[]
  viewAllHref?: string
  className?: string
  liveCycle?: boolean
  canAssignTasks?: boolean
  assignDepartments?: PlanningAssignDept[]
  assignUsers?: import("@/lib/api/users-api").AppUser[]
  defaultAssignDepartmentId?: string | null
  onAssignTask?: (body: {
    title: string
    assigneeId: string
    departmentId?: string | null
    dueDate?: string | null
    priority?: string | null
    description?: string | null
  }) => Promise<void>
  assignBusy?: boolean
  onCompleteTask?: (taskId: string) => Promise<void>
}) {
  const [localTasks, setLocalTasks] = useState(() => tasks)
  const [allOpen, setAllOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const toggleTask = async (id: string) => {
    const task = localTasks.find((t) => t.id === id)
    if (!task || task.done) return

    if (task.kind === "owner_slice") {
      toast.message("Use Submit my plan to complete this department slice task.")
      return
    }

    try {
      if (onCompleteTask) await onCompleteTask(id)
      setLocalTasks((prev) => prev.map((x) => (x.id === id ? { ...x, done: true } : x)))
    } catch {
      // keep local state unchanged on failure
    }
  }

  return (
    <>
      <section
        className={cn(
          "rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden shrink-0",
          className,
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaecf0] gap-2">
          <h3 className="text-[14px] font-semibold text-[#101828]">Tasks</h3>
          <div className="flex items-center gap-2">
            {canAssignTasks && onAssignTask ? (
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#d0d5dd] bg-white px-3 text-[12px] font-medium text-[#344054] hover:bg-[#f9fafb]"
              >
                <Plus className="w-3.5 h-3.5" />
                Assign
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className="text-[13px] font-medium text-[#2563eb] hover:underline"
            >
              View all
            </button>
          </div>
        </div>
        <div className="px-4 py-1 max-h-[280px] overflow-auto">
          {localTasks.length ? (
            <ul className="divide-y divide-[#f2f4f7]">
              {localTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => void toggleTask(t.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-[12px] text-[#98a2b3]">No tasks yet.</p>
          )}
        </div>
      </section>

      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-5 py-4 border-b border-[#eaecf0] flex-row items-center justify-between space-y-0 shrink-0">
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              All tasks
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-2">
            <ul className="divide-y divide-[#f2f4f7]">
              {localTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => void toggleTask(t.id)}
                />
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {canAssignTasks && onAssignTask ? (
        <PlanningAssignTaskDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          departments={assignDepartments}
          users={assignUsers}
          defaultDepartmentId={defaultAssignDepartmentId}
          busy={assignBusy}
          onSubmit={onAssignTask}
        />
      ) : null}
    </>
  )
}
