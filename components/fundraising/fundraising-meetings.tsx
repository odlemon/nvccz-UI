"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  List,
  Loader2,
  Phone,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { toast } from "sonner"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import {
  mapMeetingRecord,
  mapTaskCard,
  type FrTaskStatusValue,
} from "@/lib/fundraising/mappers"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrPromptDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type FrMeeting = ReturnType<typeof mapMeetingRecord>
type FrTask = ReturnType<typeof mapTaskCard>

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function displayOwner(owner: string) {
  const value = owner.trim()
  return !value || UUID_PATTERN.test(value) ? "Name unavailable" : value
}

function meetingStatusClass(s: FrMeeting["status"]): string {
  switch (s) {
    case "Scheduled":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Completed":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Cancelled":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "No show":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

function frTaskStatusClass(status: FrTaskStatusValue): string {
  switch (status) {
    case "OVERDUE":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "IN_PROGRESS":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "COMPLETED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "WAITING_ON_INVESTOR":
    case "WAITING_ON_INTERNAL_TEAM":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "CANCELLED":
      return "bg-[#f1f5f9] text-[#64748b]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}

function frTaskStatusLabel(status: FrTaskStatusValue): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

function priorityClass(p: FrTask["priority"]): string {
  switch (p) {
    case "High":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "Medium":
      return "bg-[#ffedd5] text-[#c2410c]"
    default:
      return "bg-[#dcfce7] text-[#15803d]"
  }
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
  return <CalendarDays className="h-3.5 w-3.5" />
}

const TASK_COLUMNS: { id: FrTaskStatusValue; label: string; match: (s: FrTaskStatusValue) => boolean; color: string }[] = [
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

function TaskKanbanCard({
  task,
  moving,
  onMove,
}: {
  task: FrTask
  moving: boolean
  onMove: (id: string, status: FrTaskStatusValue) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: moving })
  const owner = displayOwner(task.owner)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-none rounded-[8px] border border-[#e2e8f0] bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        (moving || isDragging) && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-semibold leading-snug text-[#0f172a]">{task.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold",
            priorityClass(task.priority),
          )}
        >
          {task.priority}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-[#64748b]">
        {task.related} · {task.campaign}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#94a3b8]">Due {task.dueDate}</span>
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white",
            avatarColor(owner),
          )}
          title={owner}
          aria-label={`Owner: ${owner}`}
        >
          {initials(owner)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {TASK_COLUMNS.filter((column) => !column.match(task.status)).slice(0, 2).map((column) => (
          <button
            key={column.id}
            type="button"
            disabled={moving}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMove(task.id, column.id)}
            className="rounded-full border border-[#e2e8f0] px-2 py-0.5 text-[9px] font-medium text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-50"
          >
            → {column.label}
          </button>
        ))}
      </div>
      <span
        className={cn(
          "mt-2 inline-flex rounded-[4px] px-1.5 py-0.5 text-[9px] font-semibold",
          frTaskStatusClass(task.status),
        )}
      >
        {frTaskStatusLabel(task.status)}
      </span>
    </div>
  )
}

function TaskKanbanColumn({
  column,
  cards,
  movingTaskId,
  onMove,
  onAdd,
}: {
  column: (typeof TASK_COLUMNS)[number]
  cards: FrTask[]
  movingTaskId: string | null
  onMove: (id: string, status: FrTaskStatusValue) => void
  onAdd: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex w-[260px] shrink-0 flex-col rounded-[10px] border border-[#e2e8f0] bg-[#f1f5f9]/80">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
        <h3 className="text-[12px] font-semibold text-[#0f172a]">{column.label}</h3>
        <span className="ml-auto rounded-full bg-white px-1.5 text-[10px] font-semibold tabular-nums text-[#64748b]">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 max-h-[min(70vh,640px)] flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-2.5 transition-colors",
          isOver && "bg-blue-50 ring-2 ring-inset ring-blue-300",
        )}
      >
        <SortableContext items={cards.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {cards.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              moving={movingTaskId === task.id}
              onMove={onMove}
            />
          ))}
        </SortableContext>
        {cards.length === 0 ? (
          <p className="px-1 py-6 text-center text-[11px] text-[#94a3b8]">Drop tasks here</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="m-2 flex h-8 items-center justify-center gap-1 rounded-full text-[11px] font-medium text-[#64748b] hover:bg-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add card
      </button>
    </div>
  )
}

function MeetingsCardsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className={cn(CARD, "space-y-4 p-4")}>
          <div className="flex justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  )
}

function TasksBoardSkeleton() {
  return (
    <div className="mt-4 flex gap-3 overflow-hidden">
      {TASK_COLUMNS.map((column) => (
        <div key={column.id} className="w-[260px] shrink-0 space-y-3 rounded-[10px] border border-[#e2e8f0] bg-[#f1f5f9]/80 p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-[8px] border border-[#e2e8f0] bg-white p-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

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

function MeetingsCalendarView({
  meetings,
  onSelectMeeting,
  onSelectEmptyDate,
}: {
  meetings: FrMeeting[]
  onSelectMeeting: (meeting: FrMeeting) => void
  onSelectEmptyDate: (date: Date) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const meetingsForDay = (day: Date) =>
    meetings.filter((meeting) => {
      const value = meeting.scheduledStart
      if (!value) return false
      const date = new Date(value)
      return !Number.isNaN(date.getTime()) && isSameDay(date, day)
    })

  return (
    <div className={cn(CARD, "mt-4 p-6")}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">{day}</div>
        ))}
        {days.map((day) => {
          const dayMeetings = meetingsForDay(day)
          const today = isSameDay(day, new Date())
          const current = isSameMonth(day, currentMonth)
          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-32 cursor-pointer rounded-lg border p-2 transition-all",
                dayMeetings.length === 0 && "hover:border-blue-400 hover:bg-blue-50/30 hover:ring-2 hover:ring-blue-100",
                today ? "border-primary bg-primary/5" : "border-border bg-background",
                !current && "opacity-50",
              )}
              onClick={() => dayMeetings.length === 0 && onSelectEmptyDate(day)}
            >
              <div className={cn("mb-1 text-sm font-medium", today ? "text-primary" : "text-foreground")}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayMeetings.map((meeting) => (
                  <button
                    key={meeting.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelectMeeting(meeting)
                    }}
                    className={cn(
                      "block w-full rounded-full px-2 py-1 text-left text-[10px] font-medium",
                      meeting.status === "Completed"
                        ? "border border-blue-200 bg-blue-100 text-blue-800"
                        : meeting.status === "Cancelled"
                          ? "border border-red-200 bg-red-100 text-red-800"
                          : "border border-yellow-200 bg-yellow-100 text-yellow-800",
                    )}
                  >
                    <span className="block truncate">{meeting.title}</span>
                    <span className="block truncate opacity-75">{meeting.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t pt-6">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        {[
          ["border-yellow-200 bg-yellow-100", "Scheduled"],
          ["border-blue-200 bg-blue-100", "Completed"],
          ["border-red-200 bg-red-100", "Cancelled"],
        ].map(([color, label]) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded border", color)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FundraisingMeetings() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [tab, setTab] = useState<"meetings" | "tasks">("meetings")
  const [meetingView, setMeetingView] = useState<"list" | "calendar">("list")
  const [search, setSearch] = useState("")
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [rawMeetings, setRawMeetings] = useState<Record<string, any>[]>([])
  const [rawTasks, setRawTasks] = useState<Record<string, any>[]>([])
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<FrMeeting | null>(null)
  const [meetingActionId, setMeetingActionId] = useState<string | null>(null)
  const [cancelMeeting, setCancelMeeting] = useState<FrMeeting | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completionForm, setCompletionForm] = useState({
    discussionNotes: "",
    outcomeSummary: "",
    decisions: "",
    actionItems: "",
  })
  const [completionKey, setCompletionKey] = useState("")

  const [loadingRefs, setLoadingRefs] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])
  const [opportunities, setOpportunities] = useState<Record<string, any>[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // schedule form
  const [title, setTitle] = useState("")
  const [meetingDate, setMeetingDate] = useState(() => new Date())
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("11:00")
  const [meetingType, setMeetingType] = useState<FrMeeting["type"]>("Video")
  const [campaignId, setCampaignId] = useState("")
  const [investorId, setInvestorId] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [attendees, setAttendees] = useState<string[]>([])
  const [attendeeInput, setAttendeeInput] = useState("")
  const [agenda, setAgenda] = useState("")

  // task form
  const [taskTitle, setTaskTitle] = useState("")
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("Medium")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskOwnerId, setTaskOwnerId] = useState("")

  const meetings = useMemo(() => rawMeetings.map(mapMeetingRecord), [rawMeetings])
  const tasks = useMemo(() => rawTasks.map(mapTaskCard), [rawTasks])

  async function loadMeetings() {
    setLoadingMeetings(true)
    try {
      const res = await fundraisingApi.listMeetings({ pageSize: 100 })
      setRawMeetings(res ?? [])
    } catch (err) {
      toastFrError(err, "Could not load meetings")
      setRawMeetings([])
    } finally {
      setLoadingMeetings(false)
    }
  }

  async function loadTasks() {
    setLoadingTasks(true)
    try {
      const res = await fundraisingApi.listTasks()
      setRawTasks(res?.performanceTasks ?? [])
    } catch (err) {
      toastFrError(err, "Could not load tasks")
      setRawTasks([])
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    loadMeetings()
    loadTasks()
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingUsers(true)
    usersApi
      .getAll()
      .then((response) => {
        if (!cancelled) setUsers(Array.isArray(response?.data) ? response.data : [])
      })
      .catch(() => {
        if (!cancelled) setUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!createOpen) return
    setLoadingRefs(true)
    Promise.allSettled([
      fundraisingApi.listInvestors({ pageSize: 100 }),
      fundraisingApi.listCampaigns(),
      fundraisingApi.listOpportunities(),
    ])
      .then(([invRes, campRes, oppRes]) => {
        setInvestors(invRes.status === "fulfilled" ? invRes.value.items ?? [] : [])
        setCampaigns(campRes.status === "fulfilled" ? campRes.value ?? [] : [])
        setOpportunities(oppRes.status === "fulfilled" ? oppRes.value ?? [] : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [createOpen])

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

  async function moveTask(id: string, status: FrTaskStatusValue) {
    setMovingTaskId(id)
    try {
      await fundraisingApi.patchTask(id, { status })
      await loadTasks()
      toast.success(`Task moved to ${frTaskStatusLabel(status)}`)
    } catch (err) {
      toastFrError(err, "Could not update task")
      await loadTasks()
    } finally {
      setMovingTaskId(null)
    }
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const task = tasks.find((item) => item.id === String(active.id))
    if (!task) return

    const overId = String(over.id)
    const targetColumn =
      TASK_COLUMNS.find((column) => column.id === overId) ??
      TASK_COLUMNS.find((column) => {
        const overTask = tasks.find((item) => item.id === overId)
        return overTask ? column.match(overTask.status) : false
      })
    const sourceColumn = TASK_COLUMNS.find((column) => column.match(task.status))
    if (!targetColumn || targetColumn.id === sourceColumn?.id) return
    void moveTask(task.id, targetColumn.id)
  }

  async function handleCancelMeeting() {
    if (!cancelMeeting) return
    const meeting = cancelMeeting
    const reason = cancelReason.trim()
    setMeetingActionId(meeting.id)
    try {
      await fundraisingApi.cancelMeeting(meeting.id, reason ? { reason } : undefined)
      toast.success("Meeting cancelled")
      setCancelMeeting(null)
      setCancelReason("")
      setSelectedMeeting(null)
      await loadMeetings()
    } catch (err) {
      toastFrError(err, "Could not cancel meeting")
    } finally {
      setMeetingActionId(null)
    }
  }

  function handleExport() {
    const date = format(new Date(), "yyyy-MM-dd")
    if (tab === "meetings") {
      exportFundraisingCsv(
        filteredMeetings,
        [
          { key: "title", label: "Meeting" },
          { key: "status", label: "Status" },
          { key: "type", label: "Type" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "investor", label: "Investor" },
          { key: "campaign", label: "Campaign" },
          { key: "attendees", label: "Attendees", value: (meeting) => meeting.attendees.join("; ") },
          { key: "agenda", label: "Agenda" },
        ],
        `fundraising-meetings-${date}`,
      )
    } else {
      exportFundraisingCsv(
        filteredTasks,
        [
          { key: "title", label: "Task" },
          { key: "status", label: "Status", value: (task) => frTaskStatusLabel(task.status) },
          { key: "priority", label: "Priority" },
          { key: "dueDate", label: "Due date" },
          { key: "owner", label: "Owner", value: (task) => displayOwner(task.owner) },
          { key: "related", label: "Related record" },
          { key: "campaign", label: "Campaign" },
        ],
        `fundraising-tasks-${date}`,
      )
    }
    toast.success(`${tab === "meetings" ? "Meetings" : "Tasks"} CSV downloaded`)
  }

  function handleCompleteMeeting(meeting: FrMeeting) {
    setCompletionForm({
      discussionNotes: meeting.discussionNotes,
      outcomeSummary: meeting.outcomeSummary,
      decisions: meeting.decisions
        .map((decision: Record<string, any> | string) =>
          typeof decision === "string" ? decision : decision.text || decision.title || "",
        )
        .filter(Boolean)
        .join("\n"),
      actionItems: meeting.actionItems
        .map((item: Record<string, any> | string) =>
          typeof item === "string" ? item : item.title || item.description || "",
        )
        .filter(Boolean)
        .join("\n"),
    })
    setCompletionKey(
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `meeting-${meeting.id}-${Date.now()}`,
    )
    setCompleteOpen(true)
  }

  async function submitMeetingOutcome() {
    if (!selectedMeeting || !completionForm.outcomeSummary.trim()) {
      toast.error("Outcome summary is required")
      return
    }
    setMeetingActionId(selectedMeeting.id)
    try {
      await fundraisingApi.completeMeeting(selectedMeeting.id, {
        discussionNotes: completionForm.discussionNotes.trim() || undefined,
        outcomeSummary: completionForm.outcomeSummary.trim(),
        decisions: completionForm.decisions
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((text) => ({ text })),
        actionItems: completionForm.actionItems
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((title) => ({ title, priority: "medium", createTask: true })),
        createCommunication: true,
        idempotencyKey: completionKey,
      })
      toast.success("Meeting record completed")
      setCompleteOpen(false)
      setSelectedMeeting(null)
      await loadMeetings()
    } catch (err) {
      toastFrError(err, "Could not save meeting outcomes")
    } finally {
      setMeetingActionId(null)
    }
  }

  function addAttendee() {
    const v = attendeeInput.trim()
    if (!v || attendees.includes(v)) return
    setAttendees((prev) => [...prev, v])
    setAttendeeInput("")
  }

  function removeAttendee(name: string) {
    setAttendees((prev) => prev.filter((n) => n !== name))
  }

  function resetMeetingForm() {
    setTitle("")
    setMeetingDate(new Date())
    setStartTime("10:00")
    setEndTime("11:00")
    setMeetingType("Video")
    setCampaignId("")
    setInvestorId("")
    setOpportunityId("")
    setAttendees([])
    setAttendeeInput("")
    setAgenda("")
  }

  function resetTaskForm() {
    setTaskTitle("")
    setTaskPriority("Medium")
    setTaskDueDate("")
    setTaskDescription("")
    setTaskOwnerId("")
  }

  async function submitCreate() {
    if (submitting) return
    setSubmitting(true)
    try {
      if (tab === "meetings") {
        if (!title.trim()) return
        const [sh, sm] = startTime.split(":").map(Number)
        const scheduledStart = new Date(meetingDate)
        scheduledStart.setHours(sh || 0, sm || 0, 0, 0)
        const [eh, em] = endTime.split(":").map(Number)
        const scheduledEnd = new Date(meetingDate)
        scheduledEnd.setHours(eh || 0, em || 0, 0, 0)
        const meetingTypeCode =
          meetingType === "Call" ? "PHONE" : meetingType === "In person" ? "IN_PERSON" : "VIDEO"
        await fundraisingApi.createMeeting({
          title: title.trim(),
          meetingType: meetingTypeCode,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          campaignId: campaignId || undefined,
          investorId: investorId || undefined,
          opportunityId: opportunityId || undefined,
          attendees: attendees.length
            ? attendees.map((a) => (a.includes("@") ? { email: a } : { fullName: a }))
            : undefined,
          agenda: agenda.trim() || undefined,
          status: "SCHEDULED",
        })
        toast.success("Meeting scheduled", { description: `${meetingDate.toLocaleDateString()} · ${startTime}` })
        resetMeetingForm()
        await loadMeetings()
      } else {
        if (!taskTitle.trim()) return
        await fundraisingApi.createTask({
          title: taskTitle.trim(),
          priority: taskPriority.toUpperCase(),
          status: "NOT_STARTED",
          dueDate: taskDueDate || undefined,
          campaignId: campaignId || undefined,
          investorId: investorId || undefined,
          opportunityId: opportunityId || undefined,
          description: taskDescription || undefined,
          ownerId: taskOwnerId || undefined,
        })
        toast.success("Task created")
        resetTaskForm()
        await loadTasks()
      }
      setCreateOpen(false)
    } catch (err) {
      toastFrError(err, tab === "meetings" ? "Could not schedule meeting" : "Could not create task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Meetings & Tasks
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Schedule meeting records, capture agendas and record outcomes and follow-up actions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4" onClick={handleExport}>
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
        <div className="flex flex-wrap items-center gap-2">
          {tab === "meetings" ? (
            <div className="inline-flex rounded-full border border-[#e2e8f0] bg-white p-1">
              <Button
                type="button"
                variant={meetingView === "list" ? "gradient-info" : "ghost"}
                className="h-7 rounded-full px-3 text-[10px]"
                onClick={() => setMeetingView("list")}
              >
                <List className="h-3.5 w-3.5" /> List
              </Button>
              <Button
                type="button"
                variant={meetingView === "calendar" ? "gradient-info" : "ghost"}
                className="h-7 rounded-full px-3 text-[10px]"
                onClick={() => setMeetingView("calendar")}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Calendar
              </Button>
            </div>
          ) : null}
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
      </div>

      {tab === "meetings" ? (
        loadingMeetings ? (
          <MeetingsCardsSkeleton />
        ) : meetingView === "calendar" ? (
          <MeetingsCalendarView
            meetings={filteredMeetings}
            onSelectMeeting={setSelectedMeeting}
            onSelectEmptyDate={(date) => {
              setMeetingDate(date)
              setCreateOpen(true)
            }}
          />
        ) : filteredMeetings.length === 0 ? (
          <div className="mt-4 rounded-[10px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
            No meetings scheduled yet. Use “Schedule Meeting” to add one.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredMeetings.map((m) => (
              <article
                key={m.id}
                className={cn(CARD, "overflow-hidden transition-shadow hover:shadow-md")}
              >
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
                      <Button
                        variant="outline"
                        className="h-8 rounded-full px-3 text-[11px]"
                        onClick={() => setSelectedMeeting(m)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : loadingTasks ? (
        <TasksBoardSkeleton />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {TASK_COLUMNS.map((column) => (
              <TaskKanbanColumn
                key={column.id}
                column={column}
                cards={filteredTasks.filter((task) => column.match(task.status))}
                movingTaskId={movingTaskId}
                onMove={moveTask}
                onAdd={() => setCreateOpen(true)}
              />
            ))}
          </div>
        </DndContext>
      )}

      {/* Schedule / New Task modal */}
      <FrDialogShell
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) {
            resetMeetingForm()
            resetTaskForm()
          }
        }}
        title={tab === "meetings" ? "Schedule meeting" : "New task"}
        description={
          tab === "meetings"
            ? "Set the date, planned discussion, attendees and related fundraising records"
            : "Add a card to the IR task board"
        }
        size="3xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full px-4"
              disabled={submitting}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient-info"
              className="h-9 rounded-full px-5 text-xs font-semibold shadow-sm"
              disabled={submitting || (tab === "meetings" ? !title.trim() : !taskTitle.trim())}
              onClick={submitCreate}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {tab === "meetings" ? "Schedule meeting" : "Create task"}
            </Button>
          </>
        }
      >
        {tab === "meetings" ? (
          <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <MiniCalendar selected={meetingDate} onSelect={setMeetingDate} />
            <div className="space-y-4">
              <FrField label="Meeting title">
                <input className={frInputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ZGF II investment committee briefing" />
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
                    <option value="Video">Online / virtual</option>
                    <option value="Call">Phone call</option>
                    <option value="In person">In person</option>
                  </select>
                </FrField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FrField label="Investor">
                  <select
                    className={frSelectClass}
                    value={investorId}
                    disabled={loadingRefs}
                    onChange={(e) => setInvestorId(e.target.value)}
                  >
                    <option value="">{loadingRefs ? "Loading investors…" : "None"}</option>
                    {investors.map((i) => (
                      <option key={i.id} value={i.id}>{i.legalName || i.name}</option>
                    ))}
                  </select>
                </FrField>
                <FrField label="Campaign">
                  <select
                    className={frSelectClass}
                    value={campaignId}
                    disabled={loadingRefs}
                    onChange={(e) => setCampaignId(e.target.value)}
                  >
                    <option value="">{loadingRefs ? "Loading campaigns…" : "None"}</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </FrField>
              </div>
              <FrField label="Opportunity">
                <select className={frSelectClass} value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
                  <option value="">No opportunity linked</option>
                  {opportunities
                    .filter((o) => !investorId || String(o.investorId) === investorId)
                    .map((o) => <option key={o.id} value={o.id}>{o.investor?.legalName || o.investorName || o.id}</option>)}
                </select>
              </FrField>
              <FrField label="Agenda / planned discussion">
                <textarea
                  className={frInputClass + " h-24 py-2"}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="What should be discussed or achieved in this meeting?"
                />
              </FrField>

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-[#64748b]">Attendees</p>
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
                        className="ml-0.5 rounded-full p-0.5 text-[#94a3b8] hover:text-[#64748b]"
                        onClick={() => removeAttendee(a)}
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
                    placeholder="Type a name or email and press Enter…"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addAttendee()
                      }
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="grid max-w-xl gap-3">
            <FrField label="Task title">
              <input
                className={frInputClass}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Upload Closing #3 pack for legal sign-off"
              />
            </FrField>
            <FrField label="Description">
              <textarea className={frInputClass + " h-20 py-2"} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
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
              <FrField label="Due date">
                <input
                  type="date"
                  className={frInputClass}
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </FrField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FrField label="Investor (optional)">
                <select
                  className={frSelectClass}
                  value={investorId}
                  disabled={loadingRefs}
                  onChange={(e) => setInvestorId(e.target.value)}
                >
                  <option value="">{loadingRefs ? "Loading investors…" : "None"}</option>
                  {investors.map((i) => (
                    <option key={i.id} value={i.id}>{i.legalName || i.name}</option>
                  ))}
                </select>
              </FrField>
              <FrField label="Campaign (optional)">
                <select
                  className={frSelectClass}
                  value={campaignId}
                  disabled={loadingRefs}
                  onChange={(e) => setCampaignId(e.target.value)}
                >
                  <option value="">{loadingRefs ? "Loading campaigns…" : "None"}</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FrField>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FrField label="Opportunity">
                <select className={frSelectClass} value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
                  <option value="">No opportunity linked</option>
                  {opportunities
                    .filter((o) => !investorId || String(o.investorId) === investorId)
                    .map((o) => <option key={o.id} value={o.id}>{o.investor?.legalName || o.investorName || o.id}</option>)}
                </select>
              </FrField>
              <FrField label="Assignee / owner">
                <select
                  className={frSelectClass}
                  value={taskOwnerId}
                  disabled={loadingUsers}
                  onChange={(event) => setTaskOwnerId(event.target.value)}
                >
                  <option value="">{loadingUsers ? "Loading team members…" : "Unassigned"}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                    </option>
                  ))}
                </select>
              </FrField>
            </div>
          </div>
        )}
      </FrDialogShell>

      {/* Meeting detail dialog */}
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-full px-4"
              onClick={() => setSelectedMeeting(null)}
            >
              Close
            </Button>
            {selectedMeeting?.status === "Scheduled" ? (
              <>
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-4 text-[#dc2626] hover:bg-[#fef2f2]"
                  disabled={meetingActionId === selectedMeeting.id}
                  onClick={() => {
                    setCancelReason("")
                    setCancelMeeting(selectedMeeting)
                  }}
                >
                  Cancel meeting
                </Button>
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-4"
                  disabled={meetingActionId === selectedMeeting.id}
                  onClick={() => handleCompleteMeeting(selectedMeeting)}
                >
                  Mark completed
                </Button>
              </>
            ) : null}
          </div>
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
              <p className="mb-2 text-[11px] font-semibold text-[#0f172a]">Agenda / planned discussion</p>
              <p className="whitespace-pre-wrap rounded-[8px] border border-[#e2e8f0] bg-white p-3 text-[12px] leading-relaxed text-[#475569]">
                {selectedMeeting.agenda || "No agenda recorded."}
              </p>
            </div>
            {selectedMeeting.status === "Completed" ? (
              <div className="space-y-3 border-t border-[#f1f5f9] pt-4">
                <div>
                  <p className="text-[11px] font-semibold text-[#0f172a]">Outcome summary</p>
                  <p className="mt-1 whitespace-pre-wrap text-[12px] text-[#475569]">{selectedMeeting.outcomeSummary || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#0f172a]">Discussion notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-[12px] text-[#475569]">{selectedMeeting.discussionNotes || "—"}</p>
                </div>
                {selectedMeeting.decisions.length ? (
                  <div>
                    <p className="text-[11px] font-semibold text-[#0f172a]">Decisions</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-[#475569]">
                      {selectedMeeting.decisions.map((decision: Record<string, any> | string, index: number) => {
                        const text = typeof decision === "string" ? decision : decision.text || decision.title || "Decision"
                        return <li key={`${text}-${index}`}>{text}</li>
                      })}
                    </ul>
                  </div>
                ) : null}
                {selectedMeeting.actionItems.length ? (
                  <div>
                    <p className="text-[11px] font-semibold text-[#0f172a]">Action items</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] text-[#475569]">
                      {selectedMeeting.actionItems.map((item: Record<string, any> | string, index: number) => (
                        <li key={String(typeof item === "string" ? item : item.id ?? index)}>
                          {typeof item === "string" ? item : item.title || item.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
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

      <FrPromptDialog
        open={!!cancelMeeting}
        onOpenChange={(open) => {
          if (!open && !meetingActionId) {
            setCancelMeeting(null)
            setCancelReason("")
          }
        }}
        title="Cancel meeting"
        description="Optionally record why this meeting is being cancelled."
        label="Cancellation reason"
        value={cancelReason}
        onValueChange={setCancelReason}
        placeholder="Enter a reason (optional)"
        multiline
        submitLabel="Cancel meeting"
        loading={Boolean(meetingActionId)}
        onSubmit={handleCancelMeeting}
      />

      <FrDialogShell
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete meeting record"
        description="Capture what happened, decisions made and follow-up actions."
        size="lg"
        footer={
          <FrFormFooter
            onCancel={() => setCompleteOpen(false)}
            onSubmit={submitMeetingOutcome}
            submitLabel={meetingActionId ? "Saving…" : "Complete meeting"}
            submitDisabled={Boolean(meetingActionId) || !completionForm.outcomeSummary.trim()}
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Outcome summary">
            <textarea className={frInputClass + " h-20 py-2"} value={completionForm.outcomeSummary} onChange={(e) => setCompletionForm((form) => ({ ...form, outcomeSummary: e.target.value }))} placeholder="What was achieved?" />
          </FrField>
          <FrField label="Discussion notes">
            <textarea className={frInputClass + " h-28 py-2"} value={completionForm.discussionNotes} onChange={(e) => setCompletionForm((form) => ({ ...form, discussionNotes: e.target.value }))} placeholder="What was discussed?" />
          </FrField>
          <FrField label="Decisions (one per line)">
            <textarea className={frInputClass + " h-20 py-2"} value={completionForm.decisions} onChange={(e) => setCompletionForm((form) => ({ ...form, decisions: e.target.value }))} />
          </FrField>
          <FrField label="Action items (one per line)">
            <textarea className={frInputClass + " h-24 py-2"} value={completionForm.actionItems} onChange={(e) => setCompletionForm((form) => ({ ...form, actionItems: e.target.value }))} placeholder="Send revised deck&#10;Confirm due diligence owner" />
          </FrField>
        </div>
      </FrDialogShell>
    </div>
  )
}
