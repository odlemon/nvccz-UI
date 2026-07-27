"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Bold,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  FileText,
  Flag,
  Globe2,
  GripVertical,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Target,
  Underline,
  UploadCloud,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { PmToggle } from "@/components/performance-mock/primitives"
import { hubProjects } from "@/lib/performance-mock/fixtures/tasks-hub"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, label: "Task details", sub: "Define what needs to be done" },
  { id: 2, label: "Assignment & schedule", sub: "Who's doing it and when" },
  { id: 3, label: "Review", sub: "Confirm and create" },
] as const

const TEAM_MEMBERS = [
  { name: "Rumbidzai Chaza", src: PM_PHOTOS.rumbidzai },
  { name: "Nyasha Moyo", src: PM_PHOTOS.nyasha },
  { name: "Tendai Dube", src: pmPhoto("tendai-dube") },
  { name: "Tatenda Mlambo", src: pmPhoto(21) },
  { name: "Farai Muchengeti", src: PM_PHOTOS.farai },
]

function findMember(name: string) {
  return TEAM_MEMBERS.find((m) => m.name === name) || TEAM_MEMBERS[0]
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="text-[11px] font-semibold text-[#475569]">
        {label}
        {required && <span className="text-[#EF4444]"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

const inputClass =
  "w-full h-9 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-[13px] text-[#0F172A] outline-none focus:border-[#7C3AED]"

function QualityRing({ pct }: { pct: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[56px] w-[56px] shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#EDE9FE" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="5"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold text-[#0F172A]">{pct}%</span>
    </div>
  )
}

export function CreateTaskMockScreen() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [taskName, setTaskName] = useState("Launch enterprise campaign")
  const [description, setDescription] = useState(
    "Launch a multi-channel enterprise campaign to generate qualified pipeline and secure 12 new enterprise customers in the Southern Africa region."
  )
  const [project, setProject] = useState("Southern Africa Expansion")
  const [section, setSection] = useState("In Progress")
  const [linkedGoal, setLinkedGoal] = useState("Win 12 enterprise accounts")
  const [linkedKr, setLinkedKr] = useState("KR 1.2 — Acquire 120 enterprise customers")
  const [taskType, setTaskType] = useState("Deliverable")
  const [tags, setTags] = useState(["Marketing", "Growth", "Q3"])
  const [tagDraft, setTagDraft] = useState("")

  const [subtasks, setSubtasks] = useState([
    { id: "st1", title: "Approve campaign brief", due: "13 Jul 2026", done: true },
    { id: "st2", title: "Confirm target account list", due: "14 Jul 2026", done: true },
    { id: "st3", title: "Publish landing page", due: "15 Jul 2026", done: false },
    { id: "st4", title: "Activate paid media", due: "17 Jul 2026", done: false },
  ])

  const [criteria, setCriteria] = useState([
    { id: "c1", text: "Campaign brief approved by key stakeholders" },
    { id: "c2", text: "Landing page is live and tracking is validated" },
    { id: "c3", text: "At least 12 qualified enterprise opportunities created in CRM" },
  ])

  const [files, setFiles] = useState([
    { name: "Campaign brief.pdf", type: "PDF", size: "1.2 MB" },
    { name: "Account list.xlsx", type: "XLSX", size: "42 KB" },
  ])

  const [dependencies, setDependencies] = useState(["Partner onboarding playbook"])

  const [owner, setOwner] = useState("Rumbidzai Chaza")
  const [contributors, setContributors] = useState(["Nyasha Moyo", "Tendai Dube"])
  const [reviewer, setReviewer] = useState("Tatenda Mlambo")

  const [startDate, setStartDate] = useState("13 Jul 2026")
  const [dueDate, setDueDate] = useState("18 Jul 2026")
  const [estimate, setEstimate] = useState("40h")
  const [reminder, setReminder] = useState("1 day before")
  const [recurrence, setRecurrence] = useState("None")

  const [priority, setPriority] = useState("High")
  const [status, setStatus] = useState("In Progress")
  const [visibility, setVisibility] = useState("Project members")

  const [automation, setAutomation] = useState({
    notifyOwner: true,
    moveOnComplete: true,
    correctiveOnOverdue: true,
  })

  const addTag = () => {
    if (!tagDraft.trim()) return
    setTags((prev) => [...prev, tagDraft.trim()])
    setTagDraft("")
  }

  const addSubtask = () =>
    setSubtasks((prev) => [...prev, { id: `st-${Date.now()}`, title: "New subtask", due: dueDate, done: false }])
  const addCriterion = () => setCriteria((prev) => [...prev, { id: `c-${Date.now()}`, text: "New acceptance criterion" }])
  const addFile = () => {
    setFiles((prev) => [...prev, { name: `Supporting-doc-${prev.length + 1}.pdf`, type: "PDF", size: "640 KB" }])
    toast.success("File attached")
  }

  const quality = useMemo(() => {
    const checks = [
      { label: "Clear owner", ok: Boolean(owner) },
      { label: "Due date set", ok: Boolean(dueDate) },
      { label: "Goal linked", ok: Boolean(linkedGoal) },
      { label: "Acceptance criteria added", ok: criteria.some((c) => c.text.trim().length > 0) },
    ]
    const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
    return { checks, pct: pct === 100 ? 92 : pct }
  }, [owner, dueDate, linkedGoal, criteria])

  const handleCreate = () => {
    toast.success("Task created", { description: `"${taskName || "Untitled task"}" added to ${project}.` })
    router.push("/performance/tasks")
  }

  const handleSaveAddAnother = () => {
    toast.success("Task created", { description: `"${taskName || "Untitled task"}" added. Ready for the next one.` })
    setTaskName("")
    setDescription("")
    setStep(1)
  }

  const handleSaveDraft = () => {
    toast("Draft saved", { description: `"${taskName || "Untitled task"}" saved as draft.` })
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="p-4 lg:p-5 pb-24 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <nav className="text-[12px] text-[#94A3B8]">
            Tasks &amp; Projects <span className="mx-1.5">/</span>
            <span className="font-semibold text-[#0F172A]">New task</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/performance/tasks")}
              className="h-9 px-4 rounded-full border border-[#C4B5FD] bg-white text-[12px] font-semibold text-[#7C3AED]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="h-9 px-4 rounded-full border border-[#C4B5FD] bg-white text-[12px] font-semibold text-[#7C3AED]"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="h-9 px-4 rounded-full bg-[#7C3AED] text-[12px] font-semibold text-white shadow-sm"
            >
              Create task
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 pt-3 pb-0 overflow-x-auto">
          <div className="flex min-w-[560px]">
            {STEPS.map((s) => {
              const active = step === s.id
              const done = step > s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 pb-3 text-left border-b-2 transition-colors",
                    active ? "border-[#7C3AED]" : "border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0",
                      active || done ? "bg-[#7C3AED] text-white" : "bg-white text-[#94A3B8] border-[1.5px] border-[#CBD5E1]"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.id}
                  </span>
                  <span>
                    <span className={cn("block text-[13px] font-semibold leading-tight", active ? "text-[#7C3AED]" : "text-[#334155]")}>
                      {s.label}
                    </span>
                    <span className="block text-[11px] text-[#94A3B8] mt-0.5">{s.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* LEFT */}
          <div className="space-y-3.5 min-w-0">
            {step === 3 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4">
                <h2 className="text-[15px] font-bold text-[#0F172A]">Review &amp; create</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <p className="text-[#94A3B8]">Task name</p>
                    <p className="font-semibold text-[#0F172A] mt-0.5">{taskName}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8]">Project</p>
                    <p className="font-semibold text-[#0F172A] mt-0.5">{project}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8]">Owner</p>
                    <p className="font-semibold text-[#0F172A] mt-0.5">{owner}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8]">Due</p>
                    <p className="font-semibold text-[#0F172A] mt-0.5">{dueDate}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[#94A3B8]">Description</p>
                    <p className="text-[#475569] mt-0.5 leading-relaxed">{description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="h-10 px-5 rounded-full bg-[#7C3AED] text-[13px] font-semibold text-white inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> Create task
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3.5">
                  <Field label="Task name" required>
                    <input value={taskName} onChange={(e) => setTaskName(e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Description" required>
                    <div className="rounded-lg border border-[#E5E7EB] bg-white overflow-hidden">
                      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#F1F5F9] bg-[#FAFAFB]">
                        <button type="button" className="h-7 px-2 rounded text-[11px] font-semibold text-[#475569] inline-flex items-center gap-1 hover:bg-white">
                          Normal <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
                        </button>
                        <button type="button" className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-white"><Bold className="h-3.5 w-3.5" /></button>
                        <button type="button" className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-white"><Italic className="h-3.5 w-3.5" /></button>
                        <button type="button" className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-white"><Underline className="h-3.5 w-3.5" /></button>
                        <span className="w-px h-4 bg-[#E5E7EB] mx-1" />
                        <button type="button" className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-white"><List className="h-3.5 w-3.5" /></button>
                        <button type="button" className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-white"><ListOrdered className="h-3.5 w-3.5" /></button>
                        <button type="button" className="h-7 w-7 rounded flex items-center justify-center text-[#475569] hover:bg-white"><Link2 className="h-3.5 w-3.5" /></button>
                      </div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2.5 text-[13px] leading-relaxed outline-none resize-none text-[#0F172A]"
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Project" required>
                      <div className="relative">
                        <Globe2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C3AED]" />
                        <select value={project} onChange={(e) => setProject(e.target.value)} className={cn(inputClass, "pl-8 appearance-none")}>
                          {hubProjects.map((p) => (
                            <option key={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </Field>
                    <Field label="Section / Board" required>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#7C3AED]" />
                        <select value={section} onChange={(e) => setSection(e.target.value)} className={cn(inputClass, "pl-7 appearance-none")}>
                          {["Backlog", "To Do", "In Progress", "In Review", "Done"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Linked goal" required>
                      <div className="flex items-center gap-2 h-9 rounded-lg border border-[#E5E7EB] bg-white px-2">
                        <span className="h-5 w-5 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                          <Target className="h-3 w-3 text-[#7C3AED]" />
                        </span>
                        <select value={linkedGoal} onChange={(e) => setLinkedGoal(e.target.value)} className="flex-1 min-w-0 text-[12px] font-semibold text-[#0F172A] outline-none bg-transparent appearance-none">
                          {["Win 12 enterprise accounts", "Expand Southern Africa", "People excellence"].map((g) => (
                            <option key={g}>{g}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setLinkedGoal("")} className="text-[#94A3B8] hover:text-[#EF4444]">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Field>
                    <Field label="Linked key result" required>
                      <div className="flex items-center gap-2 h-9 rounded-lg border border-[#E5E7EB] bg-white px-2">
                        <span className="h-5 w-5 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                          <Target className="h-3 w-3 text-[#7C3AED]" />
                        </span>
                        <select value={linkedKr} onChange={(e) => setLinkedKr(e.target.value)} className="flex-1 min-w-0 text-[12px] font-semibold text-[#0F172A] outline-none bg-transparent appearance-none truncate">
                          {["KR 1.2 — Acquire 120 enterprise customers", "KR 1.1 — Grow qualified pipeline", "KR 1.3 — Reduce country risk exposure"].map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setLinkedKr("")} className="text-[#94A3B8] hover:text-[#EF4444]">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Task type" required>
                      <div className="relative">
                        <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C3AED]" />
                        <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={cn(inputClass, "pl-8 appearance-none")}>
                          {["Deliverable", "Milestone", "Recurring", "Administrative"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </Field>
                    <Field label="Tags">
                      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 min-h-[36px]">
                        {tags.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-[#F5F3FF] text-[#7C3AED] text-[10px] font-bold">
                            {t}
                            <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        <input
                          value={tagDraft}
                          onChange={(e) => setTagDraft(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          placeholder="Add tag…"
                          className="flex-1 min-w-[70px] text-[12px] outline-none"
                        />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Subtasks */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[13px] font-bold text-[#0F172A]">Subtasks</h3>
                    <button type="button" onClick={addSubtask} className="text-[11px] font-semibold text-[#7C3AED] inline-flex items-center gap-1 hover:underline">
                      <Plus className="h-3.5 w-3.5" /> Add subtask
                    </button>
                  </div>
                  <div className="space-y-1">
                    {subtasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-[#FAFAFB]">
                        <GripVertical className="h-3.5 w-3.5 text-[#CBD5E1] shrink-0 cursor-grab" />
                        <button
                          type="button"
                          onClick={() => setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                            s.done ? "bg-[#10B981] border-[#10B981] text-white" : "border-[#CBD5E1] bg-white"
                          )}
                        >
                          {s.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </button>
                        <input
                          value={s.title}
                          onChange={(e) => setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                          className={cn("flex-1 min-w-0 text-[12px] outline-none bg-transparent", s.done && "line-through text-[#94A3B8]")}
                        />
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#64748B] shrink-0">
                          <Calendar className="h-3 w-3 text-[#94A3B8]" /> {s.due}
                        </span>
                        <button type="button" onClick={() => toast("Subtask actions", { description: s.title })} className="text-[#94A3B8] hover:text-[#475569] shrink-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acceptance criteria */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-[13px] font-bold text-[#0F172A]">Acceptance criteria</h3>
                    <button type="button" onClick={addCriterion} className="text-[11px] font-semibold text-[#7C3AED] inline-flex items-center gap-1 hover:underline">
                      <Plus className="h-3.5 w-3.5" /> Add criterion
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {criteria.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                        <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                        <input
                          value={c.text}
                          onChange={(e) => setCriteria((prev) => prev.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))}
                          className="flex-1 min-w-0 text-[12px] outline-none bg-transparent text-[#0F172A]"
                        />
                        <button type="button" onClick={() => toast("Criterion actions")} className="text-[#94A3B8] hover:text-[#475569] shrink-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Files */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <h3 className="text-[13px] font-bold text-[#0F172A] mb-2.5">Files &amp; references</h3>
                  <button
                    type="button"
                    onClick={addFile}
                    className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#C4B5FD] bg-[#FAF8FF] py-6 text-center hover:bg-[#F5F3FF]"
                  >
                    <UploadCloud className="h-6 w-6 text-[#7C3AED]" />
                    <p className="text-[12px] text-[#475569]">
                      Drag and drop files here or <span className="font-bold text-[#7C3AED]">click to browse</span>
                    </p>
                  </button>
                  {files.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {files.map((f) => (
                        <div key={f.name} className="flex items-center gap-2.5 rounded-xl border border-[#E5E7EB] p-2.5 min-w-0">
                          <span className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", f.type === "XLSX" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FEF2F2] text-[#EF4444]")}>
                            {f.type === "XLSX" ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[#0F172A] truncate">{f.name}</p>
                            <p className="text-[10px] text-[#94A3B8]">{f.type} · {f.size}</p>
                          </div>
                          <button type="button" onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))} className="text-[#94A3B8] hover:text-[#EF4444]">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dependencies */}
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                  <h3 className="text-[13px] font-bold text-[#0F172A] mb-2.5">Dependencies</h3>
                  <div className="flex flex-wrap gap-2">
                    {dependencies.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1.5 h-8 pl-2 pr-2 rounded-full border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#0F172A]">
                        <Link2 className="h-3.5 w-3.5 text-[#7C3AED]" />
                        {d}
                        <button type="button" onClick={() => setDependencies((prev) => prev.filter((x) => x !== d))} className="text-[#94A3B8] hover:text-[#EF4444]">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDependencies((prev) => [...prev, "New dependency"])}
                      className="h-8 px-2.5 rounded-full text-[11px] font-semibold text-[#7C3AED] inline-flex items-center gap-1 hover:bg-[#F5F3FF]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-3.5 space-y-4 xl:sticky xl:top-24">
            <div>
              <h3 className="text-[12px] font-bold text-[#0F172A] mb-2.5">Assignment</h3>
              <div className="space-y-2.5">
                <Field label="Owner" required>
                  <div className="relative">
                    <img src={findMember(owner).src} alt="" className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <select value={owner} onChange={(e) => setOwner(e.target.value)} className={cn(inputClass, "pl-8 appearance-none text-[12px]")}>
                      {TEAM_MEMBERS.map((m) => (
                        <option key={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Contributors">
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-[#E5E7EB] bg-white p-1.5 min-h-[36px]">
                    {contributors.map((c) => (
                      <span key={c} className="inline-flex items-center gap-1 pl-0.5 pr-1.5 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-[10px] font-semibold text-[#334155]">
                        <img src={findMember(c).src} alt="" className="h-4 w-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                        {c.split(" ")[0]}
                        <button type="button" onClick={() => setContributors((prev) => prev.filter((x) => x !== c))}>
                          <X className="h-2.5 w-2.5 text-[#94A3B8]" />
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = TEAM_MEMBERS.map((m) => m.name).find((n) => n !== owner && n !== reviewer && !contributors.includes(n))
                        if (next) setContributors((prev) => [...prev, next])
                      }}
                      className="text-[10px] font-semibold text-[#7C3AED] px-1"
                    >
                      + Add
                    </button>
                  </div>
                </Field>
                <Field label="Reviewer">
                  <div className="relative">
                    <img src={findMember(reviewer).src} alt="" className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <select value={reviewer} onChange={(e) => setReviewer(e.target.value)} className={cn(inputClass, "pl-8 appearance-none text-[12px]")}>
                      {TEAM_MEMBERS.map((m) => (
                        <option key={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
            </div>

            <div className="border-t border-[#F1F5F9] pt-3.5">
              <h3 className="text-[12px] font-bold text-[#0F172A] mb-2.5">Schedule</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Start date" required>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <input value={startDate} onChange={(e) => setStartDate(e.target.value)} className={cn(inputClass, "pl-7 text-[11px]")} />
                  </div>
                </Field>
                <Field label="Due date" required>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn(inputClass, "pl-7 text-[11px]")} />
                  </div>
                </Field>
                <Field label="Estimate">
                  <input value={estimate} onChange={(e) => setEstimate(e.target.value)} className={cn(inputClass, "text-[11px]")} />
                </Field>
                <Field label="Reminder">
                  <div className="relative">
                    <Bell className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <select value={reminder} onChange={(e) => setReminder(e.target.value)} className={cn(inputClass, "pl-7 appearance-none text-[11px]")}>
                      {["No reminder", "On due date", "1 day before", "3 days before"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Recurrence" className="col-span-2">
                  <div className="relative">
                    <RefreshCw className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={cn(inputClass, "pl-7 appearance-none text-[11px]")}>
                      {["None", "Weekly", "Monthly", "Quarterly"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
            </div>

            <div className="border-t border-[#F1F5F9] pt-3.5">
              <h3 className="text-[12px] font-bold text-[#0F172A] mb-2.5">Priority &amp; status</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Priority" required>
                  <div className="relative">
                    <Flag className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#EF4444]" />
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className={cn(inputClass, "pl-7 appearance-none text-[11px]")}>
                      {["High", "Medium", "Low"].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </Field>
                <Field label="Status" required>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#7C3AED]" />
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={cn(inputClass, "pl-7 appearance-none text-[11px]")}>
                      {["To Do", "In Progress", "In Review", "Complete"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
            </div>

            <div className="border-t border-[#F1F5F9] pt-3.5">
              <Field label="Visibility">
                <div className="relative">
                  <Eye className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={cn(inputClass, "pl-7 appearance-none text-[11px]")}>
                    {["Project members", "Team only", "Everyone"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            <div className="border-t border-[#F1F5F9] pt-3.5">
              <h3 className="text-[12px] font-bold text-[#0F172A] mb-2.5">Automation</h3>
              <div className="space-y-2.5">
                {[
                  { key: "notifyOwner" as const, label: "Notify owner on creation" },
                  { key: "moveOnComplete" as const, label: "Move to review when all subtasks complete" },
                  { key: "correctiveOnOverdue" as const, label: "Create corrective action when overdue" },
                ].map((a) => (
                  <div key={a.key} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#475569] leading-snug">{a.label}</span>
                    <PmToggle checked={automation[a.key]} onChange={(v) => setAutomation((prev) => ({ ...prev, [a.key]: v }))} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#F1F5F9] pt-3.5">
              <h3 className="text-[12px] font-bold text-[#0F172A] mb-2.5">Goal alignment preview</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "Sustainable growth" },
                  { label: "Expand Southern Africa" },
                  { label: linkedGoal || "Individual goal" },
                ].map((n, i, arr) => (
                  <div key={n.label} className="contents">
                    <span className="inline-flex items-center gap-1 h-7 pl-1 pr-2 rounded-full bg-[#F5F3FF] border border-[#E9E2FB] text-[10px] font-semibold text-[#7C3AED] max-w-[140px]">
                      <span className="h-4 w-4 rounded-full bg-white flex items-center justify-center shrink-0">
                        <Target className="h-2.5 w-2.5" />
                      </span>
                      <span className="truncate">{n.label}</span>
                    </span>
                    {i < arr.length - 1 && <span className="text-[#C4B5FD] text-[10px]">→</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#F1F5F9] pt-3.5">
              <h3 className="text-[12px] font-bold text-[#0F172A] mb-2.5">Task quality</h3>
              <div className="flex items-start gap-3">
                <QualityRing pct={quality.pct} />
                <div className="space-y-1.5 min-w-0">
                  {quality.checks.map((c) => (
                    <div key={c.label} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0", c.ok ? "text-[#10B981]" : "text-[#CBD5E1]")} />
                      <span className={c.ok ? "text-[#334155]" : "text-[#94A3B8]"}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-[#E5E7EB] bg-white/95 backdrop-blur px-4 lg:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-[#64748B] inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" /> Draft saved just now
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAddAnother}
            className="h-9 px-4 rounded-full border border-[#C4B5FD] bg-white text-[12px] font-semibold text-[#7C3AED]"
          >
            Save &amp; add another
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="h-9 px-4 rounded-full bg-[#7C3AED] text-[12px] font-semibold text-white shadow-sm"
          >
            Create task
          </button>
        </div>
      </div>
    </div>
  )
}
