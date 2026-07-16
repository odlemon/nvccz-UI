"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown, Paperclip, Plus, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  PlanningAssignTaskDialog,
  type PlanningAssignDept,
} from "@/components/fpa/planning/planning-assign-task-dialog"

export type PlanningComment = {
  id: string
  author: string
  initials: string
  avatarTone: string
  when: string
  body: string
  likes?: number
  replies?: PlanningComment[]
}

export type PlanningTask = {
  id: string
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
}

type Tab = "comments" | "tasks" | "activity" | "approvals"

export type PlanningApproval = {
  id: string
  title: string
  assignee: string
  due: string
  status?: "approved" | "returned" | "pending" | "submitted"
}

type Props = {
  comments?: PlanningComment[]
  tasks?: PlanningTask[]
  activity?: PlanningActivity[]
  approvals?: PlanningApproval[]
  onAddComment?: (body: string) => void
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
  className?: string
}

const AVATAR_TONES = [
  "bg-[#dbeafe] text-[#1d4ed8]",
  "bg-[#bfdbfe] text-[#1e40af]",
  "bg-[#dcfce7] text-[#15803d]",
  "bg-[#fce7f3] text-[#be185d]",
  "bg-[#ffedd5] text-[#c2410c]",
]

export const DEMO_PLANNING_COMMENTS: PlanningComment[] = [
  {
    id: "demo-c1",
    author: "Michael Chen",
    initials: "MC",
    avatarTone: "bg-[#dbeafe] text-[#1d4ed8]",
    when: "2 hours ago",
    body: "@Sarah Delgado Can you confirm the increase in marketing spend in Q4 is intentional?",
    replies: [
      {
        id: "demo-c1-r1",
        author: "Sarah Delgado",
        initials: "SD",
        avatarTone: "bg-[#bfdbfe] text-[#1e40af]",
        when: "1 hour ago",
        body: "Yes, that includes the product launch campaign and partner event.",
        likes: 2,
      },
    ],
  },
  {
    id: "demo-c2",
    author: "Priya Nair",
    initials: "PN",
    avatarTone: "bg-[#dcfce7] text-[#15803d]",
    when: "30 mins ago",
    body: "Let's review the headcount plan for Engineering. Looks aggressive.",
  },
]

export const DEMO_COMPARE_COMMENTS: PlanningComment[] = [
  {
    id: "comp-c1",
    author: "Michael Chen",
    initials: "MC",
    avatarTone: "bg-[#eff8ff] text-[#175cd3] font-semibold border border-[#b2ddff]",
    when: "2 hours ago",
    body: "@Sarah Delgado Revenue upside in Best Case assumes 12% price uplift and 6% volume growth. Let me know if that looks reasonable."
  },
  {
    id: "comp-c2",
    author: "Sarah Delgado",
    initials: "SD",
    avatarTone: "bg-[#eff8ff] text-[#175cd3] font-semibold border border-[#b2ddff]",
    when: "1 hour ago",
    body: "Thanks Michael. Looks good. I'll validate with Sales."
  },
  {
    id: "comp-c3",
    author: "Priya Nair",
    initials: "PN",
    avatarTone: "bg-[#edfcf2] text-[#087443] font-semibold border border-[#abefc6]",
    when: "30 mins ago",
    body: "Downside opex includes hiring freeze and 5% discretionary spend reduction."
  }
]

export const DEMO_PLANNING_TASKS: PlanningTask[] = [
  {
    id: "demo-t1",
    title: "Review Marketing Plan",
    assignee: "Priya Nair",
    due: "May 16",
  },
  {
    id: "demo-t2",
    title: "Validate Headcount Plan",
    assignee: "Daniel Lee",
    due: "May 18",
  },
  {
    id: "demo-t3",
    title: "Check FX Assumptions",
    assignee: "Arjun Patel",
    due: "May 19",
  },
  {
    id: "demo-t4",
    title: "Review Opex by Dept",
    assignee: "James Whitaker",
    due: "May 20",
  },
]

export const DEMO_PLANNING_ACTIVITY: PlanningActivity[] = [
  {
    id: "demo-a1",
    when: "2h ago",
    text: "Michael Chen commented on Marketing OpEx · Q4",
  },
  {
    id: "demo-a2",
    when: "1h ago",
    text: "Sarah Delgado replied in the marketing spend thread",
  },
  {
    id: "demo-a3",
    when: "45m ago",
    text: "Priya Nair opened task · Review Marketing Plan",
  },
  {
    id: "demo-a4",
    when: "30m ago",
    text: "Priya Nair flagged Engineering headcount as aggressive",
  },
  {
    id: "demo-a5",
    when: "12m ago",
    text: "Daniel Lee started · Validate Headcount Plan",
  },
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
}: {
  comment: PlanningComment
  nested?: boolean
}) {
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
        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[#98a2b3]">
          <button
            type="button"
            className="hover:text-[#2563eb] font-medium"
            onClick={() => toast.message("Threaded replies — pending API")}
          >
            Reply
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-[#2563eb]"
            onClick={() => toast.message("Liked")}
          >
            <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            {comment.likes && comment.likes > 0 ? comment.likes : null}
          </button>
        </div>
        {(comment.replies || []).map((r) => (
          <CommentItem key={r.id} comment={r} nested />
        ))}
      </div>
    </article>
  )
}

function TaskRow({
  task,
  onToggle,
}: {
  task: PlanningTask
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusLabel = String(task.status || (task.done ? "COMPLETED" : "OPEN")).replace(
    /_/g,
    " ",
  )

  return (
    <li className="py-2.5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          aria-label={task.done ? "Mark incomplete" : "Mark complete"}
          className={cn(
            "mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 inline-flex items-center justify-center",
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
  disabledComment,
  commentPlaceholder = "Add a comment...",
  mode = "planning",
  liveCycle = false,
  className,
  canAssignTasks = false,
  assignDepartments = [],
  assignUsers = [],
  defaultAssignDepartmentId,
  onAssignTask,
  assignBusy = false,
  onCompleteTask,
}: Props) {
  const [tab, setTab] = useState<Tab>("comments")
  const [draft, setDraft] = useState("")
  const [localTasks, setLocalTasks] = useState<PlanningTask[]>(
    () => (tasks?.length ? tasks : liveCycle ? [] : DEMO_PLANNING_TASKS),
  )
  const [allCommentsOpen, setAllCommentsOpen] = useState(false)
  const [allTasksOpen, setAllTasksOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const isCompareMode = mode === "compare"

  // Interactive local comments state
  const [localComments, setLocalComments] = useState<PlanningComment[]>([])

  useEffect(() => {
    setLocalComments(
      comments?.length
        ? comments
        : isCompareMode
          ? DEMO_COMPARE_COMMENTS
          : liveCycle
            ? []
            : DEMO_PLANNING_COMMENTS,
    )
  }, [comments, isCompareMode, liveCycle])

  // Interactive approvals state
  const [selectedApproval, setSelectedApproval] = useState<PlanningApproval | null>(null)
  const [isApprovalOpen, setIsApprovalOpen] = useState(false)

  const openApprovalModal = (title: string, assignee: string, due: string) => {
    setSelectedApproval({ id: `appr-${Date.now()}`, title, assignee, due, status: "pending" })
    setIsApprovalOpen(true)
  }

  useEffect(() => {
    setTab("comments")
  }, [mode])

  useEffect(() => {
    setLocalTasks(tasks?.length ? tasks : liveCycle ? [] : DEMO_PLANNING_TASKS)
  }, [tasks, liveCycle])

  const activityRows = activity?.length ? activity : liveCycle ? [] : DEMO_PLANNING_ACTIVITY
  const approvalRows = approvals ?? []
  const displayTasks = localTasks
  const openTaskCount = displayTasks.filter((t) => !t.done).length

  const tabs: Array<{ id: Tab; label: string; badge?: number }> =
    mode === "compare"
      ? [
          { id: "comments", label: "Comments", badge: 5 },
          { id: "approvals", label: "Approvals" },
          { id: "activity", label: "Activity" },
        ]
      : [
          { id: "comments", label: "Comments" },
          { id: "tasks", label: "Tasks", badge: openTaskCount },
          { id: "activity", label: "Activity" },
        ]

  const postComment = () => {
    const body = draft.trim()
    if (!body || disabledComment) return

    // In-memory update for fast interaction feedback
    const newComment: PlanningComment = {
      id: `local-c-${Date.now()}`,
      author: "Admin User",
      initials: "AD",
      avatarTone: "bg-[#ffedd5] text-[#c2410c] font-semibold border border-[#fedf89]",
      when: "Just now",
      body,
    }
    setLocalComments((prev) => [newComment, ...prev])
    onAddComment?.(body)
    setDraft("")
    toast.success("Comment added")
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

  const handleApprove = () => {
    if (selectedApproval) {
      toast.success(`Approved stage: "${selectedApproval.title}" successfully!`)
    }
    setIsApprovalOpen(false)
  }

  const handleReject = () => {
    if (selectedApproval) {
      toast.warning(`Returned stage: "${selectedApproval.title}" for revision.`)
    }
    setIsApprovalOpen(false)
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
                        postComment()
                      }
                    }}
                    placeholder={commentPlaceholder}
                    disabled={disabledComment}
                    className="h-10 w-full rounded-[10px] border border-[#d0d5dd] bg-white pl-3.5 pr-10 text-[13px] text-[#101828] placeholder:text-[#98a2b3] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-[#98a2b3] hover:bg-[#f9fafb] hover:text-[#667085]"
                    onClick={() => toast.message("Attachments — coming soon")}
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
                  {localComments.map((c) => (
                    <CommentItem key={c.id} comment={c} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setAllCommentsOpen(true)}
                  className="mt-4 shrink-0 w-full text-center text-[13px] font-semibold text-[#1570ef] hover:underline py-1"
                >
                  View all comments
                </button>
              </div>

              {/* Approvals Section (only in compare mode) */}
              {isCompareMode && (
                <div className="py-4 shrink-0">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-[14px] font-semibold text-[#101828]">Approvals</h4>
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f2f4f7] px-1 text-[11px] font-semibold text-[#667085]">
                        2
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3.5">
                    <li className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-full bg-[#f4f3ff] text-[#53389e] font-semibold text-[13px] flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#101828]">Under Review</div>
                          <div className="text-[11px] text-[#667085] truncate">FP&A Team</div>
                          <div className="text-[11px] text-[#667085] mt-0.5">Due May 19, 2026</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openApprovalModal("Under Review", "FP&A Team", "Due May 19, 2026")}
                        className="h-8 rounded-lg border border-[#d0d5dd] bg-white px-3.5 text-[12px] font-semibold text-[#344054] hover:bg-[#f9fafb] shrink-0"
                      >
                        Open
                      </button>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-full bg-[#f2f4f7] text-[#344054] font-semibold text-[13px] flex items-center justify-center shrink-0">
                          4
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#101828]">Approval</div>
                          <div className="text-[11px] text-[#667085] truncate">James Whitaker</div>
                          <div className="text-[11px] text-[#667085] mt-0.5">Due May 26, 2026</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openApprovalModal("Approval", "James Whitaker", "Due May 26, 2026")}
                        className="h-8 rounded-lg border border-[#d0d5dd] bg-white px-3.5 text-[12px] font-semibold text-[#344054] hover:bg-[#f9fafb] shrink-0"
                      >
                        Open
                      </button>
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => toast.message("All approvals details opened")}
                    className="mt-3.5 w-full text-center text-[13px] font-semibold text-[#1570ef] hover:underline"
                  >
                    View all approvals
                  </button>
                </div>
              )}

              {/* Scenario Notes Section (only in compare mode) */}
              {isCompareMode && (
                <div className="pt-4 shrink-0">
                  <h4 className="text-[14px] font-semibold text-[#101828] mb-1.5">Scenario Notes</h4>
                  <p className="text-[12px] text-[#475467] leading-relaxed">
                    Key assumptions and risks documented in the
                  </p>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      toast.info("Opening Planning Narrative file")
                    }}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1570ef] hover:underline mt-0.5"
                  >
                    Planning Narrative
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </Link>
                </div>
              )}
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
                    <TaskRow key={t.id} task={t} onToggle={() => void toggleTask(t.id)} />
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
              localComments.map((c) => <CommentItem key={c.id} comment={c} />)
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
                    postComment()
                  }
                }}
                placeholder={commentPlaceholder}
                disabled={disabledComment}
                className="h-10 w-full rounded-lg border border-[#d0d5dd] bg-white pl-3 pr-10 text-[13px] text-[#101828] placeholder:text-[#98a2b3] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-[#98a2b3]"
                onClick={() => toast.message("Attachments — coming soon")}
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
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
                <TaskRow key={t.id} task={t} onToggle={() => void toggleTask(t.id)} />
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interactive approvals details modal */}
      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              Approval Workflow Stage
            </DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="py-3.5 space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Stage Title</span>
                <p className="text-[14px] font-bold text-[#101828] mt-0.5">{selectedApproval.title}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Assigned Reviewer</span>
                <p className="text-[13px] font-medium text-[#344054] mt-0.5">{selectedApproval.assignee}</p>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#667085]">Deadline</span>
                <p className="text-[13px] font-medium text-[#f04438] mt-0.5">{selectedApproval.due}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={handleReject}
              className="h-9 rounded-lg border border-[#fda29b] bg-[#fffbfa] px-4 text-[13px] font-semibold text-[#b42318] hover:bg-[#fef3f2]"
            >
              Return for Revision
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="h-9 rounded-lg bg-[#079455] px-4 text-[13px] font-semibold text-white hover:bg-[#067647]"
            >
              Approve Stage
            </button>
          </DialogFooter>
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
  liveCycle = false,
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
  const [localTasks, setLocalTasks] = useState(() =>
    tasks.length ? tasks : liveCycle ? [] : DEMO_PLANNING_TASKS,
  )
  const [allOpen, setAllOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  useEffect(() => {
    setLocalTasks(tasks.length ? tasks : liveCycle ? [] : DEMO_PLANNING_TASKS)
  }, [tasks, liveCycle])

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
