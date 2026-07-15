"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Mic,
  Monitor,
  Phone,
  Plus,
  Search,
  Users,
  Video,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FR_MEETINGS,
  FR_TASKS,
  frTaskStatusClass,
  frTaskStatusLabel,
  meetingStatusClass,
  priorityClass,
  type FrMeeting,
  type FrTask,
  type FrTaskStatus,
} from "./meetings-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const PEOPLE_POOL = [
  "Kwame Asante",
  "Tariro Moyo",
  "Farai Ncube",
  "Patience Gumbo",
  "Tawanda Chirwa",
  "Grace Chirwa",
  "Sipho Ndlovu",
  "Natalie Mpofu",
  "Tendai Mawoyo",
  "Blessing Nyoni",
]

const AVATAR_COLORS = [
  "from-[#5b5fc7] to-[#7b83eb]",
  "from-[#00b7c3] to-[#62dce3]",
  "from-[#c239b3] to-[#e59aef]",
  "from-[#13a10e] to-[#5ec75a]",
  "from-[#d83b01] to-[#f09d70]",
  "from-[#8764b8] to-[#b4a0d6]",
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <span
          key={`${n}-${i}`}
          title={n}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[9px] font-bold text-white shadow-sm",
            avatarColor(n),
            i > 0 && "-ml-2",
          )}
        >
          {initials(n)}
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#e2e8f0] text-[9px] font-bold text-[#475569]">
          +{rest}
        </span>
      ) : null}
    </div>
  )
}

function MeetingTypeIcon({ type }: { type: FrMeeting["type"] }) {
  if (type === "Call") return <Phone className="h-3.5 w-3.5" />
  if (type === "In person") return <Users className="h-3.5 w-3.5" />
  return <Video className="h-3.5 w-3.5" />
}

const TASK_COLUMNS: { id: FrTaskStatus | "OPEN"; label: string; match: (s: FrTaskStatus) => boolean; color: string }[] = [
  {
    id: "NOT_STARTED",
    label: "To do",
    match: (s) => s === "NOT_STARTED",
    color: "#64748b",
  },
  {
    id: "IN_PROGRESS",
    label: "In progress",
    match: (s) => s === "IN_PROGRESS",
    color: "#2563eb",
  },
  {
    id: "WAITING_ON_INVESTOR",
    label: "Waiting",
    match: (s) => s === "WAITING_ON_INVESTOR" || s === "WAITING_ON_INTERNAL_TEAM",
    color: "#d97706",
  },
  {
    id: "OVERDUE",
    label: "Overdue",
    match: (s) => s === "OVERDUE",
    color: "#dc2626",
  },
  {
    id: "COMPLETED",
    label: "Done",
    match: (s) => s === "COMPLETED" || s === "CANCELLED",
    color: "#16a34a",
  },
]

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: Date
  onSelect: (d: Date) => void
}) {
  const [cursor, setCursor] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  )
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = cursor.toLocaleString("en", { month: "long", year: "numeric" })

  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="rounded-full p-1 text-[#64748b] hover:bg-[#f1f5f9]"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-[12px] font-semibold text-[#0f172a]">{monthLabel}</p>
        <button
          type="button"
          className="rounded-full p-1 text-[#64748b] hover:bg-[#f1f5f9]"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-[#94a3b8]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />
          const isSel =
            selected.getFullYear() === year &&
            selected.getMonth() === month &&
            selected.getDate() === day
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(new Date(year, month, day))}
              className={cn(
                "flex h-8 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                isSel
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm"
                  : "text-[#334155] hover:bg-[#eff6ff]",
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function FundraisingMeetings() {
  const [tab, setTab] = useState<"meetings" | "tasks">("meetings")
  const [search, setSearch] = useState("")
  const [meetings, setMeetings] = useState<FrMeeting[]>(FR_MEETINGS)
  const [tasks, setTasks] = useState<FrTask[]>(FR_TASKS)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<FrMeeting | null>(null)

  // schedule form
  const [title, setTitle] = useState("ZGF II investment committee briefing")
  const [meetingDate, setMeetingDate] = useState(() => new Date(2026, 6, 22))
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("11:00")
  const [meetingType, setMeetingType] = useState<FrMeeting["type"]>("Video")
  const [campaign, setCampaign] = useState("ZGF II")
  const [investor, setInvestor] = useState("Afreximbank")
  const [attendees, setAttendees] = useState<string[]>(["Tariro Moyo", "Kwame Asante", "Farai Ncube"])
  const [peopleQuery, setPeopleQuery] = useState("")

  // task form
  const [taskTitle, setTaskTitle] = useState("Upload Closing #3 pack for legal sign-off")
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("High")
  const [taskOwner, setTaskOwner] = useState("You")

  const filteredMeetings = useMemo(() => {
    const q = search.trim().toLowerCase()
    return meetings.filter((m) => {
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q) ||
        m.investor.toLowerCase().includes(q) ||
        m.attendees.some((a) => a.toLowerCase().includes(q))
      )
    })
  }, [meetings, search])

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (!q) return true
      return t.title.toLowerCase().includes(q) || t.related.toLowerCase().includes(q)
    })
  }, [tasks, search])

  const overdueCount = tasks.filter((t) => t.status === "OVERDUE").length
  const scheduledCount = meetings.filter((m) => m.status === "Scheduled").length

  function moveTask(id: string, status: FrTaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  function toggleAttendee(name: string) {
    setAttendees((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  function submitCreate() {
    if (tab === "meetings") {
      if (!title.trim()) return
      const dateLabel = meetingDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      const m: FrMeeting = {
        id: `m-${Date.now()}`,
        title: title.trim(),
        investor,
        campaign,
        date: dateLabel,
        time: `${startTime}–${endTime}`,
        type: meetingType,
        owner: attendees[0] ?? "You",
        status: "Scheduled",
        attendees,
        relatedOpportunity: `${investor} · Pipeline`,
      }
      setMeetings((p) => [m, ...p])
      toast.success("Meeting scheduled", { description: `${dateLabel} · ${startTime}` })
      setTitle("ZGF II investment committee briefing")
    } else {
      if (!taskTitle.trim()) return
      setTasks((prev) => [
        {
          id: `t-${Date.now()}`,
          title: taskTitle.trim(),
          related: "New",
          campaign: "ZGF II",
          dueDate: "22 Jul 2026",
          status: "NOT_STARTED",
          owner: taskOwner,
          priority: taskPriority,
        },
        ...prev,
      ])
      toast.success("Task created")
      setTaskTitle("Upload Closing #3 pack for legal sign-off")
    }
    setCreateOpen(false)
  }

  const peopleResults = PEOPLE_POOL.filter(
    (p) =>
      p.toLowerCase().includes(peopleQuery.trim().toLowerCase()) &&
      !attendees.includes(p),
  )

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Meetings & Tasks
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Teams-style meetings and a Trello-style task board for IR follow-ups
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => toast.success("Export started")}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info"
            className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {tab === "meetings" ? "Schedule Meeting" : "New Task"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Upcoming meetings", value: scheduledCount },
          {
            label: "Open tasks",
            value: tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length,
          },
          { label: "Overdue tasks", value: overdueCount },
          { label: "Done", value: tasks.filter((t) => t.status === "COMPLETED").length },
        ].map((k) => (
          <div key={k.label} className={cn(CARD, "p-3.5")}>
            <p className="text-[11px] text-[#64748b]">{k.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-[#e2e8f0] bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("meetings")}
            className={cn(
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
              tab === "meetings"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm"
                : "text-[#64748b] hover:text-[#334155]",
            )}
          >
            Meetings
          </button>
          <button
            type="button"
            onClick={() => setTab("tasks")}
            className={cn(
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors",
              tab === "tasks"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm"
                : "text-[#64748b] hover:text-[#334155]",
            )}
          >
            Tasks board
          </button>
        </div>
        <div className="relative sm:w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "meetings" ? "Search meetings or people…" : "Search tasks…"}
            className="h-9 rounded-full border-[#e2e8f0] pl-8 text-[12px] shadow-none"
          />
        </div>
      </div>

      {tab === "meetings" ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredMeetings.map((m) => (
            <article
              key={m.id}
              className={cn(CARD, "overflow-hidden transition-shadow hover:shadow-md")}
            >
              {/* Meeting card header */}
              <div className="border-b border-[#f1f5f9] bg-[#fafafa] px-4 pt-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                    <MeetingTypeIcon type={m.type} />
                    {m.type}
                  </span>
                  <span
                    className={cn(
                      "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                      meetingStatusClass(m.status),
                    )}
                  >
                    {m.status}
                  </span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug text-[#0f172a]">
                  {m.title}
                </h3>
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-[12px] text-[#334155]">
                  <CalendarDays className="h-3.5 w-3.5 text-[#2563eb]" />
                  <span>
                    {m.date} · <span className="font-medium">{m.time}</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  {m.investor}
                  <span className="text-[#94a3b8]"> · {m.campaign}</span>
                </p>
                {m.relatedOpportunity ? (
                  <p className="text-[10px] text-[#94a3b8]">{m.relatedOpportunity}</p>
                ) : null}

                <div className="flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-3">
                  <AvatarStack names={m.attendees} />
                  <div className="flex gap-1.5">
                    {m.status === "Scheduled" && m.type === "Video" ? (
                      <Button
                        variant="gradient-info"
                        className="h-8 rounded-full px-3 text-[11px] gap-1.5"
                        onClick={() => {
                          setSelectedMeeting(m)
                          toast.success("Joining meeting…", { description: m.title })
                        }}
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-8 rounded-full px-3 text-[11px]"
                        onClick={() => setSelectedMeeting(m)}
                      >
                        Details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {TASK_COLUMNS.map((col) => {
            const cards = filteredTasks.filter((t) => col.match(t.status))
            return (
              <div
                key={col.id}
                className="flex w-[260px] shrink-0 flex-col rounded-[10px] border border-[#e2e8f0] bg-[#f1f5f9]/80"
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="text-[12px] font-semibold text-[#0f172a]">{col.label}</h3>
                  <span className="ml-auto rounded-full bg-white px-1.5 text-[10px] font-semibold tabular-nums text-[#64748b]">
                    {cards.length}
                  </span>
                </div>
                <div className="flex max-h-[min(70vh,640px)] flex-col gap-2 overflow-y-auto px-2.5 pb-2.5">
                  {cards.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-[8px] border border-[#e2e8f0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-semibold leading-snug text-[#0f172a]">{t.title}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold",
                            priorityClass(t.priority),
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-[#64748b]">
                        {t.related} · {t.campaign}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#94a3b8]">Due {t.dueDate}</span>
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white",
                            avatarColor(t.owner),
                          )}
                          title={t.owner}
                        >
                          {initials(t.owner)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {TASK_COLUMNS.filter((c) => !c.match(t.status)).slice(0, 2).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              moveTask(
                                t.id,
                                c.id === "WAITING_ON_INVESTOR"
                                  ? "WAITING_ON_INVESTOR"
                                  : (c.id as FrTaskStatus),
                              )
                            }
                            className="rounded-full border border-[#e2e8f0] px-2 py-0.5 text-[9px] font-medium text-[#64748b] hover:bg-[#f8fafc]"
                          >
                            → {c.label}
                          </button>
                        ))}
                      </div>
                      <span
                        className={cn(
                          "mt-2 inline-flex rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold",
                          frTaskStatusClass(t.status),
                        )}
                      >
                        {frTaskStatusLabel(t.status)}
                      </span>
                    </div>
                  ))}
                  {cards.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[11px] text-[#94a3b8]">No cards</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="m-2 flex h-8 items-center justify-center gap-1 rounded-full text-[11px] font-medium text-[#64748b] hover:bg-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add card
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Schedule / New Task modal */}
      <FrDialogShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={tab === "meetings" ? "Schedule meeting" : "New task"}
        description={
          tab === "meetings"
            ? "Pick a date, set time, and invite people — like Teams"
            : "Add a card to the IR task board"
        }
        size="3xl"
        footer={
          <FrFormFooter
            onCancel={() => setCreateOpen(false)}
            onSubmit={submitCreate}
            submitLabel={tab === "meetings" ? "Schedule meeting" : "Create task"}
            submitDisabled={tab === "meetings" ? !title.trim() : !taskTitle.trim()}
          />
        }
      >
        {tab === "meetings" ? (
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <MiniCalendar selected={meetingDate} onSelect={setMeetingDate} />
            <div className="space-y-4">
              <FrField label="Meeting title">
                <input className={frInputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
              </FrField>
              <div className="grid gap-3 sm:grid-cols-3">
                <FrField label="Start">
                  <input
                    type="time"
                    className={frInputClass}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </FrField>
                <FrField label="End">
                  <input
                    type="time"
                    className={frInputClass}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </FrField>
                <FrField label="Type">
                  <select
                    className={frSelectClass}
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as FrMeeting["type"])}
                  >
                    <option value="Video">Video (Teams)</option>
                    <option value="Call">Phone call</option>
                    <option value="In person">In person</option>
                  </select>
                </FrField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FrField label="Investor">
                  <input
                    className={frInputClass}
                    value={investor}
                    onChange={(e) => setInvestor(e.target.value)}
                  />
                </FrField>
                <FrField label="Campaign">
                  <select
                    className={frSelectClass}
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                  >
                    <option>ZGF II</option>
                    <option>Institutional Mandates FY25</option>
                  </select>
                </FrField>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-[#64748b]">Invite people</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {attendees.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] py-0.5 pl-0.5 pr-2 text-[11px] text-[#0f172a]"
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white",
                          avatarColor(a),
                        )}
                      >
                        {initials(a)}
                      </span>
                      {a}
                      <button
                        type="button"
                        className="ml-0.5 text-[#94a3b8] hover:text-[#64748b]"
                        onClick={() => toggleAttendee(a)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                  <input
                    className={cn(frInputClass, "pl-8")}
                    placeholder="Search people to add…"
                    value={peopleQuery}
                    onChange={(e) => setPeopleQuery(e.target.value)}
                  />
                </div>
                {peopleQuery.trim() ? (
                  <ul className="mt-1 max-h-32 overflow-y-auto rounded-[6px] border border-[#e2e8f0] bg-white">
                    {peopleResults.length === 0 ? (
                      <li className="px-3 py-2 text-[11px] text-[#94a3b8]">No matches</li>
                    ) : (
                      peopleResults.map((p) => (
                        <li key={p}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
                            onClick={() => {
                              toggleAttendee(p)
                              setPeopleQuery("")
                            }}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[9px] font-bold text-white",
                                avatarColor(p),
                              )}
                            >
                              {initials(p)}
                            </span>
                            {p}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PEOPLE_POOL.filter((p) => !attendees.includes(p))
                      .slice(0, 5)
                      .map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleAttendee(p)}
                          className="rounded-full border border-dashed border-[#cbd5e1] px-2.5 py-1 text-[10px] text-[#64748b] hover:border-blue-400 hover:bg-[#eff6ff] hover:text-blue-700"
                        >
                          + {p}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {meetingType === "Video" ? (
                <div className="flex items-center gap-3 rounded-[8px] border border-[#e0e7ff] bg-[#eef2ff] px-3 py-2.5 text-[11px] text-[#3730a3]">
                  <Monitor className="h-4 w-4 shrink-0" />
                  <span>Teams link will be generated on schedule. Optional: enable lobby & mute on entry.</span>
                  <Mic className="ml-auto h-4 w-4 shrink-0 opacity-60" />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid max-w-xl gap-3">
            <FrField label="Task title">
              <input
                className={frInputClass}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </FrField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FrField label="Priority">
                <select
                  className={frSelectClass}
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as "High" | "Medium" | "Low")}
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </FrField>
              <FrField label="Owner">
                <select
                  className={frSelectClass}
                  value={taskOwner}
                  onChange={(e) => setTaskOwner(e.target.value)}
                >
                  <option>You</option>
                  {PEOPLE_POOL.slice(0, 6).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </FrField>
            </div>
          </div>
        )}
      </FrDialogShell>

      {/* Meeting detail popover-style dialog */}
      <FrDialogShell
        open={!!selectedMeeting}
        onOpenChange={(o) => {
          if (!o) setSelectedMeeting(null)
        }}
        title={selectedMeeting?.title ?? "Meeting"}
        description={
          selectedMeeting
            ? `${selectedMeeting.date} · ${selectedMeeting.time} · ${selectedMeeting.type}`
            : undefined
        }
        size="lg"
        footer={
          selectedMeeting?.status === "Scheduled" && selectedMeeting.type === "Video" ? (
            <FrFormFooter
              onCancel={() => setSelectedMeeting(null)}
              onSubmit={() => {
                toast.success("Joined meeting")
                setSelectedMeeting(null)
              }}
              submitLabel="Join now"
              cancelLabel="Close"
            />
          ) : (
            <Button
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={() => setSelectedMeeting(null)}
            >
              Close
            </Button>
          )
        }
      >
        {selectedMeeting ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-5">
              <p className="text-[12px] text-[#64748b]">{selectedMeeting.investor}</p>
              <p className="mt-1 text-[15px] font-semibold text-[#0f172a]">{selectedMeeting.title}</p>
              <p className="mt-2 text-[11px] text-[#64748b]">
                {selectedMeeting.campaign}
                {selectedMeeting.relatedOpportunity
                  ? ` · ${selectedMeeting.relatedOpportunity}`
                  : ""}
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold text-[#0f172a]">Participants</p>
              <ul className="space-y-2">
                {selectedMeeting.attendees.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-[12px] text-[#334155]">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
                        avatarColor(a),
                      )}
                    >
                      {initials(a)}
                    </span>
                    {a}
                    {a === selectedMeeting.owner ? (
                      <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[9px] font-semibold text-blue-700">
                        Organizer
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </FrDialogShell>
    </div>
  )
}
