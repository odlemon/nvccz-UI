"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Send,
  Square,
  Play,
} from "lucide-react"
import { toast } from "sonner"
import { PmAvatar, PmButton, PmCard, PmStatusPill } from "@/components/performance-mock/primitives"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const DAYS = [
  { key: "mon", label: "Mon", date: "13 Jul", weekend: false },
  { key: "tue", label: "Tue", date: "14 Jul", weekend: false },
  { key: "wed", label: "Wed", date: "15 Jul", weekend: false },
  { key: "thu", label: "Thu", date: "16 Jul", weekend: false },
  { key: "fri", label: "Fri", date: "17 Jul", weekend: false },
  { key: "sat", label: "Sat", date: "18 Jul", weekend: true },
  { key: "sun", label: "Sun", date: "19 Jul", weekend: true },
] as const

type DayKey = (typeof DAYS)[number]["key"]

type Row = {
  id: string
  project: string
  task: string
  hours: Record<DayKey, number | null>
  notes: Record<DayKey, string>
}

type RecentEntry = {
  id: string
  date: string
  project: string
  task: string
  duration: string
  source: "Manual" | "Timer"
  status: string
}

const PROJECT_OPTIONS = [
  "Southern Africa Expansion",
  "Performance Review Cycle",
  "Internal Operations",
  "Administration",
  "ISO 27001 Readiness",
]

const TASK_OPTIONS: Record<string, string[]> = {
  "Southern Africa Expansion": [
    "Enterprise campaign launch",
    "Partner onboarding playbook",
    "Pricing localisation model",
    "Map priority sectors",
  ],
  "Performance Review Cycle": ["Launch review cycle", "Calibration pack", "Review reminders"],
  "Internal Operations": ["Team meeting", "Sprint planning", "Ops standup"],
  Administration: ["Learning & development", "Admin overhead"],
  "ISO 27001 Readiness": ["Evidence pack", "Policy review"],
}

const emptyHours = (): Record<DayKey, number | null> => ({
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
})

const emptyNotes = (): Record<DayKey, string> => ({
  mon: "",
  tue: "",
  wed: "",
  thu: "",
  fri: "",
  sat: "",
  sun: "",
})

const initialRows: Row[] = [
  {
    id: "r1",
    project: "Southern Africa Expansion",
    task: "Enterprise campaign launch",
    hours: { mon: 7.5, tue: 6, wed: 2.5, thu: 7.5, fri: 5.5, sat: null, sun: null },
    notes: {
      mon: "",
      tue: "",
      wed: "Working on campaign messaging framework.",
      thu: "",
      fri: "",
      sat: "",
      sun: "",
    },
  },
  {
    id: "r2",
    project: "Southern Africa Expansion",
    task: "Partner onboarding playbook",
    hours: { mon: 2, tue: 2, wed: 2, thu: 2, fri: 2, sat: null, sun: null },
    notes: emptyNotes(),
  },
  {
    id: "r3",
    project: "Performance Review Cycle",
    task: "Launch review cycle",
    hours: { mon: 1.5, tue: 1.5, wed: null, thu: 2, fri: 1.5, sat: null, sun: null },
    notes: emptyNotes(),
  },
  {
    id: "r4",
    project: "Internal Operations",
    task: "Team meeting",
    hours: { mon: 0.5, tue: 0.5, wed: 0.5, thu: 0.5, fri: 0.5, sat: null, sun: null },
    notes: emptyNotes(),
  },
  {
    id: "r5",
    project: "Administration",
    task: "Learning & development",
    hours: { mon: 0.5, tue: 0.5, wed: null, thu: 0.5, fri: 0.5, sat: null, sun: null },
    notes: emptyNotes(),
  },
]

const initialRecent: RecentEntry[] = [
  {
    id: "e1",
    date: "15 Jul 2026, 08:45 AM",
    project: "Southern Africa Expansion",
    task: "Enterprise campaign launch",
    duration: "2.5h",
    source: "Manual",
    status: "Draft",
  },
  {
    id: "e2",
    date: "15 Jul 2026, 08:20 AM",
    project: "Internal Operations",
    task: "Team meeting",
    duration: "0.5h",
    source: "Manual",
    status: "Draft",
  },
  {
    id: "e3",
    date: "14 Jul 2026, 02:15 PM",
    project: "Southern Africa Expansion",
    task: "Enterprise campaign launch",
    duration: "1.0h",
    source: "Timer",
    status: "Draft",
  },
]

function rowTotal(row: Row) {
  return DAYS.reduce((s, d) => s + (row.hours[d.key] || 0), 0)
}

function formatHours(val: number | null | undefined) {
  if (val === null || val === undefined) return "–"
  return val.toFixed(1)
}

export function TimesheetsMockScreen() {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>(initialRecent)
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeCell, setActiveCell] = useState<{ rowId: string; day: DayKey } | null>(null)
  const [cellHours, setCellHours] = useState("2.5")
  const [cellNotes, setCellNotes] = useState("")
  const [timerRunning, setTimerRunning] = useState(true)
  const [timerSeconds, setTimerSeconds] = useState(6138)
  const [timerTask, setTimerTask] = useState({
    project: "Southern Africa Expansion",
    task: "Enterprise campaign launch",
  })
  const [submitted, setSubmitted] = useState(false)
  const [addingRow, setAddingRow] = useState(false)
  const [newProject, setNewProject] = useState(PROJECT_OPTIONS[0])
  const [newTask, setNewTask] = useState(TASK_OPTIONS[PROJECT_OPTIONS[0]][0])
  const popoverRef = useRef<HTMLDivElement>(null)

  const expected = 40
  const weekLabel = weekOffset === 0 ? "13–19 Jul 2026" : weekOffset < 0 ? "6–12 Jul 2026" : "20–26 Jul 2026"
  const weekTitle = weekOffset === 0 ? "13–19 July 2026" : weekOffset < 0 ? "6–12 July 2026" : "20–26 July 2026"

  const dailyTotals = useMemo(() => {
    const totals: Record<DayKey, number> = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }
    rows.forEach((r) => DAYS.forEach((d) => (totals[d.key] += r.hours[d.key] || 0)))
    return totals
  }, [rows])

  const weeklyTotal = useMemo(() => DAYS.reduce((s, d) => s + dailyTotals[d.key], 0), [dailyTotals])
  const billable = Math.round(weeklyTotal * 0.767 * 10) / 10
  const overtime = Math.max(0, Math.round((weeklyTotal - expected) * 10) / 10)
  const pctOfExpected = Math.min(100, Math.round((weeklyTotal / expected) * 100))
  const remaining = Math.max(0, Math.round((expected - weeklyTotal) * 10) / 10)

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => setTimerSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [timerRunning])

  useEffect(() => {
    if (!activeCell) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (popoverRef.current?.contains(t)) return
      if (t.closest?.("[data-timesheet-cell]")) return
      setActiveCell(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveCell(null)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [activeCell])

  const openCell = (rowId: string, day: DayKey) => {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return
    setActiveCell({ rowId, day })
    setCellHours(row.hours[day] !== null && row.hours[day] !== undefined ? String(row.hours[day]) : "0")
    setCellNotes(row.notes[day] || "")
  }

  const bumpHours = (delta: number) => {
    const n = Number(cellHours)
    const base = Number.isFinite(n) ? n : 0
    const next = Math.max(0, Math.min(24, Math.round((base + delta) * 10) / 10))
    setCellHours(String(next))
  }

  const saveCell = () => {
    if (!activeCell) return
    const parsed = cellHours.trim() === "" ? null : Number(cellHours)
    const val = parsed === null || Number.isNaN(parsed) ? null : Math.max(0, Math.min(24, parsed))
    const row = rows.find((r) => r.id === activeCell.rowId)
    setRows((prev) =>
      prev.map((r) =>
        r.id === activeCell.rowId
          ? {
              ...r,
              hours: { ...r.hours, [activeCell.day]: val },
              notes: { ...r.notes, [activeCell.day]: cellNotes.slice(0, 120) },
            }
          : r
      )
    )
    if (row && val !== null && val > 0) {
      const dayMeta = DAYS.find((d) => d.key === activeCell.day)
      setRecentEntries((prev) => [
        {
          id: `e-${Date.now()}`,
          date: `${dayMeta?.date || ""} 2026, ${new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          project: row.project,
          task: row.task,
          duration: `${val.toFixed(1)}h`,
          source: "Manual",
          status: "Draft",
        },
        ...prev,
      ])
    }
    setActiveCell(null)
    toast.success("Time entry saved")
  }

  const startTimerFromCell = () => {
    if (!activeCell) return
    const row = rows.find((r) => r.id === activeCell.rowId)
    if (!row) return
    setTimerTask({ project: row.project, task: row.task })
    setTimerRunning(true)
    toast.success("Timer started", { description: row.task })
  }

  const addRow = () => {
    setAddingRow(true)
    setNewProject(PROJECT_OPTIONS[0])
    setNewTask(TASK_OPTIONS[PROJECT_OPTIONS[0]][0])
  }

  const confirmAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `r${Date.now()}`,
        project: newProject,
        task: newTask,
        hours: emptyHours(),
        notes: emptyNotes(),
      },
    ])
    setAddingRow(false)
    toast.success("Row added", { description: `${newProject} · ${newTask}` })
  }

  const timerLabel = useMemo(() => {
    const h = Math.floor(timerSeconds / 3600)
    const m = Math.floor((timerSeconds % 3600) / 60)
    const s = timerSeconds % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }, [timerSeconds])

  const toggleTimer = () => {
    setTimerRunning((r) => {
      const next = !r
      toast(next ? "Timer started" : "Timer stopped", { description: timerTask.task })
      if (!next && timerSeconds > 0) {
        const hoursLogged = Math.round((timerSeconds / 3600) * 10) / 10
        setRecentEntries((prev) => [
          {
            id: `e-timer-${Date.now()}`,
            date: `15 Jul 2026, ${new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            project: timerTask.project,
            task: timerTask.task,
            duration: `${hoursLogged.toFixed(1)}h`,
            source: "Timer",
            status: "Draft",
          },
          ...prev,
        ])
      }
      return next
    })
  }

  const submissionChecks = [
    { label: "Daily totals complete", ok: true },
    { label: "Notes added", ok: Boolean(rows.some((r) => Object.values(r.notes).some(Boolean))) },
    { label: "No overlapping entries", ok: true },
    { label: `${remaining.toFixed(1)}h remaining`, ok: remaining === 0 },
  ]

  const submitForApproval = () => {
    setSubmitted(true)
    setActiveCell(null)
    toast.success("Timesheet submitted for approval", {
      description: `Week of ${weekLabel} · ${weeklyTotal.toFixed(1)}h`,
    })
  }

  const activeRow = activeCell ? rows.find((r) => r.id === activeCell.rowId) : null

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 space-y-3">
        <nav className="text-xs text-[#94A3B8]">
          <span className="font-medium">Timesheets</span>
          <span className="mx-1.5">/</span>
          <span className="text-[#64748B]">My weekly timesheet</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">
              Weekly Timesheet — {weekTitle}
            </h1>
            <div className="mt-2.5">
              <PmAvatar
                initials="RC"
                name="Rumbidzai Chaza"
                role="Marketing Manager"
                src={PM_PHOTOS.rumbidzai}
                size="md"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PmButton
              variant="outline"
              onClick={() => toast.success("Copied previous week", { description: "Rows pre-filled from last week." })}
            >
              <Copy className="h-3.5 w-3.5" /> Copy previous week
            </PmButton>
            <PmButton variant="outline" onClick={() => toast.success("Draft saved")}>
              <Save className="h-3.5 w-3.5" /> Save draft
            </PmButton>
            <PmButton onClick={submitForApproval} disabled={submitted}>
              <Send className="h-3.5 w-3.5" /> {submitted ? "Submitted" : "Submit for approval"}
            </PmButton>
            <PmStatusPill label={submitted ? "Submitted" : "Draft"} tone={submitted ? "info" : "purple"} />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 h-9 rounded-full border border-[#E2E8F0] bg-white px-2 text-xs text-[#334155] shadow-sm">
            <button
              type="button"
              onClick={() => {
                setWeekOffset((o) => o - 1)
                setActiveCell(null)
              }}
              className="h-7 w-7 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="inline-flex items-center gap-1.5 px-1 font-semibold text-[#0F172A]">
              <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" />
              {weekLabel}
              <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
            </span>
            <button
              type="button"
              onClick={() => {
                setWeekOffset((o) => o + 1)
                setActiveCell(null)
              }}
              className="h-7 w-7 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"
              aria-label="Next week"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Logged", value: `${weeklyTotal.toFixed(1)}h`, icon: Clock },
            { label: "Expected", value: `${expected}h`, icon: Calendar },
            { label: "Billable", value: `${billable.toFixed(1)}h`, icon: Briefcase },
            { label: "Overtime", value: `${overtime}h`, icon: Clock },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 flex items-center gap-2.5 shadow-sm"
            >
              <span className="h-9 w-9 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <m.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] text-[#94A3B8]">{m.label}</p>
                <p className="text-base font-bold text-[#0F172A] leading-tight">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div className="space-y-3 min-w-0">
            <PmCard className="overflow-visible p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[860px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 font-bold text-[#0F172A] text-[12px] min-w-[200px]">Project</th>
                      <th className="py-3 px-3 font-bold text-[#0F172A] text-[12px] min-w-[180px]">Task</th>
                      {DAYS.map((d) => (
                        <th
                          key={d.key}
                          className={cn(
                            "py-2.5 px-1.5 font-bold text-[#0F172A] text-center w-[72px]",
                            d.weekend && "bg-[#F5F3FF]"
                          )}
                        >
                          <span className="block text-[12px] leading-tight">{d.label}</span>
                          <span className="block font-medium text-[10px] text-[#94A3B8] mt-0.5">{d.date}</span>
                        </th>
                      ))}
                      <th className="py-3 px-3 font-bold text-[#0F172A] text-[12px] text-right w-16">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#F1F5F9]">
                        <td className="py-3 px-4 font-bold text-[#0F172A] whitespace-nowrap align-middle">
                          {row.project}
                        </td>
                        <td className="py-3 px-3 text-[#64748B] whitespace-nowrap align-middle">{row.task}</td>
                        {DAYS.map((d) => {
                          const val = row.hours[d.key]
                          const isActive = activeCell?.rowId === row.id && activeCell?.day === d.key
                          return (
                            <td
                              key={d.key}
                              className={cn(
                                "py-2 px-1.5 text-center relative align-middle",
                                d.weekend && "bg-[#F5F3FF]"
                              )}
                            >
                              <button
                                type="button"
                                data-timesheet-cell
                                disabled={submitted}
                                onClick={() => openCell(row.id, d.key)}
                                className={cn(
                                  "h-8 w-[58px] mx-auto rounded-md border bg-white text-[12px] font-semibold tabular-nums transition-all",
                                  val !== null && val !== undefined
                                    ? "text-[#0F172A] border-[#E2E8F0]"
                                    : "text-[#CBD5E1] border-[#E2E8F0]",
                                  !submitted && "hover:border-[#C4B5FD] hover:shadow-sm",
                                  isActive && "border-[#7C3AED] border-2 text-[#0F172A] shadow-sm",
                                  submitted && "opacity-70 cursor-not-allowed"
                                )}
                              >
                                {val !== null && val !== undefined ? formatHours(val) : "–"}
                              </button>

                              {isActive && (
                                <div
                                  ref={popoverRef}
                                  className="absolute z-40 top-[calc(100%-2px)] left-1/2 -translate-x-1/2 w-[220px] rounded-xl border border-[#E2E8F0] bg-white shadow-xl p-3.5 text-left"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Hours</p>
                                  <div className="relative mb-2.5">
                                    <input
                                      type="number"
                                      step={0.5}
                                      min={0}
                                      max={24}
                                      value={cellHours}
                                      onChange={(e) => setCellHours(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveCell()
                                      }}
                                      className="w-full h-9 rounded-lg border border-[#E2E8F0] pl-3 pr-8 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#7C3AED] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      autoFocus
                                    />
                                    <div className="absolute right-1 top-1 bottom-1 flex flex-col">
                                      <button
                                        type="button"
                                        onClick={() => bumpHours(0.5)}
                                        className="flex-1 w-6 rounded-t text-[#64748B] hover:bg-[#F1F5F9] flex items-center justify-center"
                                        aria-label="Increase hours"
                                      >
                                        <ChevronDown className="h-3 w-3 rotate-180" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => bumpHours(-0.5)}
                                        className="flex-1 w-6 rounded-b text-[#64748B] hover:bg-[#F1F5F9] flex items-center justify-center"
                                        aria-label="Decrease hours"
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={startTimerFromCell}
                                    className="w-full h-9 mb-3 rounded-full border border-[#C4B5FD] text-[12px] font-semibold text-[#7C3AED] inline-flex items-center justify-center gap-1.5 hover:bg-[#F5F3FF]"
                                  >
                                    <span className="h-5 w-5 rounded-full border border-[#7C3AED] flex items-center justify-center">
                                      <Play className="h-2.5 w-2.5 fill-[#7C3AED]" />
                                    </span>
                                    Start timer
                                  </button>

                                  <p className="text-[11px] font-semibold text-[#334155] mb-1.5">Notes (optional)</p>
                                  <div className="relative mb-3">
                                    <textarea
                                      value={cellNotes}
                                      onChange={(e) => setCellNotes(e.target.value.slice(0, 120))}
                                      rows={3}
                                      placeholder="What did you work on?"
                                      className="w-full rounded-lg border border-[#E2E8F0] px-2.5 py-2 pb-5 text-[11px] text-[#334155] outline-none focus:border-[#7C3AED] resize-none leading-relaxed"
                                    />
                                    <p className="absolute bottom-1.5 right-2 text-[9px] text-[#94A3B8]">
                                      {cellNotes.length}/120
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={saveCell}
                                    className="w-full h-9 rounded-full bg-[#7C3AED] text-white text-[12px] font-bold hover:bg-[#6D28D9] shadow-sm"
                                  >
                                    Save
                                  </button>

                                  {activeRow && (
                                    <p className="mt-2 text-[9px] text-[#94A3B8] text-center truncate">
                                      {activeRow.task} · {DAYS.find((x) => x.key === activeCell.day)?.label}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}
                        <td className="py-3 px-3 text-right font-bold text-[#0F172A] whitespace-nowrap align-middle tabular-nums">
                          {rowTotal(row).toFixed(1)}h
                        </td>
                      </tr>
                    ))}

                    <tr>
                      <td colSpan={10} className="py-2.5 px-4">
                        {addingRow ? (
                          <div className="flex flex-wrap items-end gap-2 py-1">
                            <label className="text-[11px] space-y-1">
                              <span className="font-semibold text-[#64748B]">Project</span>
                              <select
                                value={newProject}
                                onChange={(e) => {
                                  const p = e.target.value
                                  setNewProject(p)
                                  setNewTask(TASK_OPTIONS[p]?.[0] || "")
                                }}
                                className="block h-8 min-w-[180px] rounded-full border border-[#E2E8F0] bg-white px-3 text-xs outline-none focus:border-[#C4B5FD]"
                              >
                                {PROJECT_OPTIONS.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-[11px] space-y-1">
                              <span className="font-semibold text-[#64748B]">Task</span>
                              <select
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                className="block h-8 min-w-[180px] rounded-full border border-[#E2E8F0] bg-white px-3 text-xs outline-none focus:border-[#C4B5FD]"
                              >
                                {(TASK_OPTIONS[newProject] || []).map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button
                              type="button"
                              onClick={confirmAddRow}
                              className="h-8 px-4 rounded-full bg-[#7C3AED] text-white text-[11px] font-semibold"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingRow(false)}
                              className="h-8 px-3 rounded-full text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={addRow}
                            disabled={submitted}
                            className="text-[12px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add project or task
                          </button>
                        )}
                      </td>
                    </tr>

                    <tr className="border-t border-[#E2E8F0]">
                      <td className="py-3 px-4 font-bold text-[#0F172A]" colSpan={2}>
                        Daily total
                      </td>
                      {DAYS.map((d) => (
                        <td
                          key={d.key}
                          className={cn(
                            "py-3 px-1.5 text-center font-bold text-[#0F172A] tabular-nums",
                            d.weekend && "bg-[#F5F3FF]"
                          )}
                        >
                          {dailyTotals[d.key] > 0 ? `${dailyTotals[d.key].toFixed(1)}h` : "–"}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right font-bold text-[#0F172A] tabular-nums">
                        {weeklyTotal.toFixed(1)}h
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3.5 border-t border-[#E2E8F0]">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[13px] font-bold text-[#0F172A] shrink-0">
                    Weekly total <span className="font-extrabold">{weeklyTotal.toFixed(1)}h</span>{" "}
                    <span className="text-[#94A3B8] font-semibold">/ {expected}h</span>
                  </p>
                  <div className="flex-1 min-w-[140px] h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7C3AED] transition-all"
                      style={{ width: `${pctOfExpected}%` }}
                    />
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A] tabular-nums shrink-0">
                    {pctOfExpected}%
                  </span>
                </div>
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Recent time entries</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead>
                    <tr className="text-[10px] font-semibold text-[#94A3B8] border-b border-[#F1F5F9]">
                      <th className="py-2 pr-2">Date</th>
                      <th className="py-2 pr-2">Project</th>
                      <th className="py-2 pr-2">Task</th>
                      <th className="py-2 pr-2 text-right">Duration</th>
                      <th className="py-2 pr-2">Entry source</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEntries.slice(0, 5).map((e) => (
                      <tr key={e.id} className="border-b border-[#F8FAFC] last:border-0">
                        <td className="py-2.5 pr-2 text-[#64748B] whitespace-nowrap">{e.date}</td>
                        <td className="py-2.5 pr-2 text-[#334155] whitespace-nowrap">{e.project}</td>
                        <td className="py-2.5 pr-2 text-[#334155] whitespace-nowrap">{e.task}</td>
                        <td className="py-2.5 pr-2 text-right font-semibold text-[#0F172A]">{e.duration}</td>
                        <td className="py-2.5 pr-2 text-[#64748B]">{e.source}</td>
                        <td className="py-2.5">
                          <PmStatusPill label={e.status} tone="purple" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => toast("Time entries", { description: "Opening full time entry log." })}
                className="mt-2 text-[11px] font-semibold text-[#7C3AED] hover:underline"
              >
                View all time entries →
              </button>
            </PmCard>
          </div>

          <div className="space-y-3">
            <PmCard className="p-4 text-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-[#94A3B8]">Today — Wednesday 15 Jul</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold",
                    timerRunning ? "text-[#10B981]" : "text-[#94A3B8]"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      timerRunning ? "bg-[#10B981] animate-pulse" : "bg-[#CBD5E1]"
                    )}
                  />
                  {timerRunning ? "Timer running" : "Timer stopped"}
                </span>
              </div>
              <p className="text-3xl font-bold text-[#7C3AED] tracking-tight tabular-nums">{timerLabel}</p>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">{timerTask.task}</p>
              <p className="text-[11px] text-[#94A3B8]">{timerTask.project}</p>
              <button
                type="button"
                onClick={toggleTimer}
                className={cn(
                  "mt-3 w-full h-10 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-sm",
                  timerRunning
                    ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
                    : "bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE]"
                )}
              >
                {timerRunning ? (
                  <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                {timerRunning ? "Stop timer" : "Start timer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = rows.findIndex((r) => r.task === timerTask.task)
                  const next = rows[(idx + 1 + rows.length) % rows.length]
                  setTimerTask({ project: next.project, task: next.task })
                  toast("Switched task", { description: next.task })
                }}
                className="mt-2 text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Switch task
              </button>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Submission checks</h3>
              <div className="space-y-2">
                {submissionChecks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-xs">
                    {c.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" />
                    )}
                    <span className={c.ok ? "text-[#334155]" : "text-[#92400E] font-medium"}>{c.label}</span>
                  </div>
                ))}
              </div>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Approver</h3>
              <PmAvatar initials="NM" name="Nyasha Moyo" role="Department Manager" src={PM_PHOTOS.nyasha} size="md" />
              <button
                type="button"
                onClick={() => toast("Message sent", { description: "Nyasha Moyo will be notified." })}
                className="mt-3 text-[11px] font-semibold text-[#7C3AED] hover:underline inline-flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Send message
              </button>
            </PmCard>

            <PmCard className="p-4">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Activity</h3>
              <div className="space-y-2.5">
                {[
                  { text: "Timesheet draft saved", detail: "Rumbidzai Chaza", at: "Today, 09:02 AM" },
                  { text: "Time adjusted", detail: "Enterprise campaign launch +0.5h", at: "Today, 08:45 AM" },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                    <p className="text-[#334155] leading-snug">
                      {a.text}
                      <span className="block text-[#7C3AED] font-medium">{a.detail}</span>
                      <span className="block text-[10px] text-[#94A3B8] mt-0.5">{a.at}</span>
                    </p>
                  </div>
                ))}
              </div>
            </PmCard>

            <button
              type="button"
              onClick={() => toast("Timesheet policy", { description: "Opening organisation timesheet policy." })}
              className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              <FileText className="h-3.5 w-3.5" /> Timesheet policy <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
