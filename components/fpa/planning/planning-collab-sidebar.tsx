"use client"

import { useState } from "react"
import { Paperclip, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type PlanningComment = {
  id: string
  author: string
  initials: string
  avatarTone: string
  when: string
  body: string
  likes?: number
}

export type PlanningTask = {
  id: string
  title: string
  assignee: string
  due: string
  done?: boolean
}

export type PlanningActivity = {
  id: string
  when: string
  text: string
}

const DEMO_COMMENTS: PlanningComment[] = [
  {
    id: "c1",
    author: "Michael Chen",
    initials: "MC",
    avatarTone: "bg-[#dbeafe] text-[#1d4ed8]",
    when: "2h ago",
    body: "Marketing spend looks high in Q3 — can we align with the campaign calendar before submit?",
    likes: 2,
  },
  {
    id: "c2",
    author: "Sarah Delgado",
    initials: "SD",
    avatarTone: "bg-[#dcfce7] text-[#15803d]",
    when: "Yesterday",
    body: "Updated headcount for Engineering. Please re-run calc after reviewing driver pack.",
    likes: 1,
  },
  {
    id: "c3",
    author: "Priya Nair",
    initials: "PN",
    avatarTone: "bg-[#fce7f3] text-[#be185d]",
    when: "May 11",
    body: "Cash runway assumption uses May actuals. Flag if FP&A wants a conservative buffer.",
  },
]

const DEMO_TASKS: PlanningTask[] = [
  { id: "t1", title: "Review Marketing Plan", assignee: "Michael Chen", due: "May 16" },
  { id: "t2", title: "Confirm headcount hires", assignee: "Sarah Delgado", due: "May 17" },
  { id: "t3", title: "Validate FX rates", assignee: "Priya Nair", due: "May 18" },
  { id: "t4", title: "Submit department pack", assignee: "James Okonkwo", due: "May 20" },
]

const DEMO_ACTIVITY: PlanningActivity[] = [
  { id: "a1", when: "9:12 AM", text: "Michael Chen updated EBITDA formula" },
  { id: "a2", when: "8:47 AM", text: "Sarah Delgado remapped Payroll Expense" },
  { id: "a3", when: "Yesterday", text: "Workflow moved to Under Review" },
  { id: "a4", when: "May 11", text: "Budget 2026 scenario copied from Base Case" },
]

type Tab = "comments" | "tasks" | "activity"

type Props = {
  comments?: PlanningComment[]
  tasks?: PlanningTask[]
  activity?: PlanningActivity[]
  onAddComment?: (body: string) => void
}

export function PlanningCollabSidebar({
  comments,
  tasks,
  activity,
  onAddComment,
}: Props) {
  const [tab, setTab] = useState<Tab>("comments")
  const [draft, setDraft] = useState("")
  const [localTasks, setLocalTasks] = useState(tasks?.length ? tasks : DEMO_TASKS)

  const commentRows = comments?.length ? comments : DEMO_COMMENTS
  const activityRows = activity?.length ? activity : DEMO_ACTIVITY

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "comments", label: "Comments" },
    { id: "tasks", label: `Tasks (${localTasks.filter((t) => !t.done).length})` },
    { id: "activity", label: "Activity" },
  ]

  return (
    <aside className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm flex flex-col min-h-[420px] h-full overflow-hidden">
      <div className="flex border-b border-[#e2e8f0] shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 h-10 text-[12px] font-medium border-b-2 -mb-px",
              tab === t.id
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-[#64748b] hover:text-[#0f172a]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3">
        {tab === "comments" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment…"
                rows={3}
                className="w-full resize-none bg-transparent text-[12px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  className="h-7 w-7 inline-flex items-center justify-center rounded-full text-[#94a3b8] hover:bg-white"
                  onClick={() => toast.message("Attachments — coming soon")}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!draft.trim()}
                  onClick={() => {
                    const body = draft.trim()
                    if (!body) return
                    onAddComment?.(body)
                    toast.success("Comment added")
                    setDraft("")
                  }}
                  className="h-8 rounded-full bg-[#2563eb] px-3.5 text-[11px] font-medium text-white disabled:opacity-40 hover:bg-[#1d4ed8]"
                >
                  Post
                </button>
              </div>
            </div>

            {commentRows.map((c) => (
              <article key={c.id} className="flex gap-2.5">
                <span
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full text-[10px] font-semibold inline-flex items-center justify-center",
                    c.avatarTone,
                  )}
                >
                  {c.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-[12px] font-semibold text-[#0f172a] truncate">{c.author}</p>
                    <span className="text-[10px] text-[#94a3b8] shrink-0">{c.when}</span>
                  </div>
                  <p className="text-[12px] text-[#475569] mt-0.5 leading-relaxed">{c.body}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#64748b]">
                    <button
                      type="button"
                      className="hover:text-[#2563eb]"
                      onClick={() => toast.message("Reply — coming soon")}
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-[#2563eb]"
                      onClick={() => toast.message("Liked")}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {c.likes || "Like"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "tasks" && (
          <ul className="space-y-2">
            {localTasks.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-[#e2e8f0] px-3 py-2.5 flex gap-2.5 items-start"
              >
                <input
                  type="checkbox"
                  checked={Boolean(t.done)}
                  onChange={() => {
                    setLocalTasks((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                    )
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1] text-[#2563eb]"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[12px] font-medium text-[#0f172a]",
                      t.done && "line-through text-[#94a3b8]",
                    )}
                  >
                    {t.title}
                  </p>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{t.assignee}</p>
                  <p className="text-[11px] font-medium text-[#dc2626] mt-0.5">Due {t.due}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "activity" && (
          <ul className="space-y-3">
            {activityRows.map((a) => (
              <li key={a.id} className="flex gap-3 text-[12px]">
                <span className="text-[10px] text-[#94a3b8] w-16 shrink-0 pt-0.5">{a.when}</span>
                <span className="text-[#475569] leading-relaxed">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
