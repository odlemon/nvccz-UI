"use client"

import { useMemo, useState } from "react"
import {
  Layers,
  Target,
  TrendingUp,
  AlertTriangle,
  Plus,
  LayoutGrid,
  List,
  Tag,
  Search,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmModal, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type ThemeStatus = "On Track" | "At Risk" | "Off Track"

type Goal = { id: string; title: string; owner: string }

type Theme = {
  id: string
  name: string
  description: string
  color: string
  bg: string
  owner: string
  ownerInitials: string
  progress: number
  status: ThemeStatus
  goalIds: string[]
}

const availableGoals: Goal[] = [
  { id: "g1", title: "Increase recurring revenue to $4.5M ARR", owner: "Rumbidzai Chaza" },
  { id: "g2", title: "Acquire 120 new enterprise customers", owner: "Rumbidzai Chaza" },
  { id: "g3", title: "Improve CSAT score to 4.6/5", owner: "Kudakwashe Biti" },
  { id: "g4", title: "Reduce average support response time to < 2hrs", owner: "Kudakwashe Biti" },
  { id: "g5", title: "Raise employee engagement score to 85%", owner: "Tatenda Mlambo" },
  { id: "g6", title: "Fill 90% of critical roles within 45 days", owner: "Tatenda Mlambo" },
  { id: "g7", title: "Ship 6 major feature releases", owner: "Ashley Mutema" },
  { id: "g8", title: "Reduce critical bug backlog by 40%", owner: "Ashley Mutema" },
  { id: "g9", title: "Achieve 95% SLA compliance", owner: "Kudakwashe Biti" },
  { id: "g10", title: "Launch customer education academy", owner: "Kudakwashe Biti" },
]

const initialThemes: Theme[] = [
  {
    id: "t1",
    name: "Sustainable Growth",
    description: "Expand recurring revenue and market presence through disciplined, profitable growth.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    owner: "Rumbidzai Chaza",
    ownerInitials: "RC",
    progress: 78,
    status: "On Track",
    goalIds: ["g1", "g2"],
  },
  {
    id: "t2",
    name: "Customer Obsession",
    description: "Deliver world-class experience at every touchpoint, from onboarding through renewal.",
    color: "#2563EB",
    bg: "#EFF6FF",
    owner: "Kudakwashe Biti",
    ownerInitials: "KB",
    progress: 61,
    status: "At Risk",
    goalIds: ["g3", "g4", "g9", "g10"],
  },
  {
    id: "t3",
    name: "People & Culture",
    description: "Build a high-performing, engaged workforce with a strong leadership bench.",
    color: "#10B981",
    bg: "#ECFDF5",
    owner: "Tatenda Mlambo",
    ownerInitials: "TM",
    progress: 84,
    status: "On Track",
    goalIds: ["g5", "g6"],
  },
  {
    id: "t4",
    name: "Product Innovation",
    description: "Accelerate delivery of differentiated capabilities while safeguarding quality.",
    color: "#F97316",
    bg: "#FFF7ED",
    owner: "Ashley Mutema",
    ownerInitials: "AM",
    progress: 53,
    status: "Off Track",
    goalIds: ["g7", "g8"],
  },
]

function statusTone(status: ThemeStatus): "success" | "warning" | "danger" {
  if (status === "On Track") return "success"
  if (status === "At Risk") return "warning"
  return "danger"
}

export function ThemesMockScreen() {
  const [themes, setThemes] = useState<Theme[]>(initialThemes)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [search, setSearch] = useState("")
  const [period, setPeriod] = useState("FY 2026")
  const [tagModalTheme, setTagModalTheme] = useState<Theme | null>(null)
  const [tagDraft, setTagDraft] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", color: "#7C3AED", bg: "#F5F3FF", owner: availableGoals[0].owner })

  const filtered = useMemo(() => {
    if (!search.trim()) return themes
    const q = search.toLowerCase()
    return themes.filter((t) => t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q))
  }, [themes, search])

  const totalGoalsTagged = useMemo(() => themes.reduce((s, t) => s + t.goalIds.length, 0), [themes])
  const avgProgress = Math.round(themes.reduce((s, t) => s + t.progress, 0) / themes.length)
  const atRiskCount = themes.filter((t) => t.status !== "On Track").length

  const openTagModal = (theme: Theme) => {
    setTagModalTheme(theme)
    setTagDraft(new Set(theme.goalIds))
  }

  const toggleGoalTag = (goalId: string) => {
    setTagDraft((prev) => {
      const next = new Set(prev)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  const saveTaggedGoals = () => {
    if (!tagModalTheme) return
    setThemes((prev) => prev.map((t) => (t.id === tagModalTheme.id ? { ...t, goalIds: Array.from(tagDraft) } : t)))
    toast.success("Goals updated", { description: `${tagDraft.size} goal(s) tagged to ${tagModalTheme.name}.` })
    setTagModalTheme(null)
  }

  const handleAddTheme = () => {
    if (!form.name.trim()) {
      toast.error("Theme name is required")
      return
    }
    const owner = availableGoals.find((g) => g.owner === form.owner)?.owner || form.owner
    const initials = owner
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    const newTheme: Theme = {
      id: `t${Date.now()}`,
      name: form.name,
      description: form.description || "New strategic theme.",
      color: form.color,
      bg: form.bg,
      owner,
      ownerInitials: initials,
      progress: 0,
      status: "On Track",
      goalIds: [],
    }
    setThemes((prev) => [...prev, newTheme])
    setAddOpen(false)
    setForm({ name: "", description: "", color: "#7C3AED", bg: "#F5F3FF", owner: availableGoals[0].owner })
    toast.success("Strategic theme created", { description: newTheme.name })
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration", "Themes"]} searchPlaceholder="Search themes…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Strategic Themes"
          subtitle="Organize company objectives under a small set of strategic themes and tag the goals that advance them."
          actions={
            <>
              <PmSelectChip label={period} onClick={() => setPeriod(period === "FY 2026" ? "FY 2025" : "FY 2026")} />
              <PmButton variant="primary" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New Theme
              </PmButton>
            </>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Strategic Themes</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{themes.length}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Goals Tagged</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{totalGoalsTagged}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Target className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Avg. Progress</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{avgProgress}%</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Needs Attention</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{atRiskCount}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#FFF7ED] text-[#F97316] flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search themes by name or owner…"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-xs outline-none focus:border-[#7C3AED]"
            />
          </div>
          <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
                viewMode === "cards" ? "bg-[#7C3AED] text-white shadow-sm" : "text-[#6B7280]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors",
                viewMode === "list" ? "bg-white shadow-sm text-[#111827]" : "text-[#6B7280]"
              )}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
        </div>

        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((theme) => (
              <PmCard key={theme.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.bg, color: theme.color }}>
                    <Layers className="h-5 w-5" />
                  </div>
                  <PmStatusPill label={theme.status} tone={statusTone(theme.status)} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#111827] leading-snug">{theme.name}</h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed line-clamp-2 flex-1">{theme.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Progress</span>
                  <span className="font-semibold text-[#111827]">{theme.progress}%</span>
                </div>
                <PmProgress value={theme.progress} className="mt-1.5" color={theme.color} />
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                      style={{ backgroundColor: theme.color }}
                    >
                      {theme.ownerInitials}
                    </span>
                    <span className="text-[11px] text-[#374151] truncate">{theme.owner}</span>
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] shrink-0">{theme.goalIds.length} goals</span>
                </div>
                <button
                  type="button"
                  onClick={() => openTagModal(theme)}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#DDD6FE] hover:text-[#7C3AED]"
                >
                  <Tag className="h-3.5 w-3.5" /> Tag Goals
                </button>
              </PmCard>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-[#6B7280]">No themes match your search.</div>
            )}
          </div>
        ) : (
          <PmCard className="overflow-hidden">
            <div className="divide-y divide-[#F1F5F9]">
              {filtered.map((theme) => (
                <div key={theme.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: theme.bg, color: theme.color }}>
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827] truncate">{theme.name}</p>
                    <p className="text-[11px] text-[#6B7280] truncate">{theme.owner} · {theme.goalIds.length} goals tagged</p>
                  </div>
                  <div className="w-28 hidden sm:block">
                    <PmProgress value={theme.progress} color={theme.color} />
                  </div>
                  <span className="text-xs font-semibold text-[#111827] w-10 text-right shrink-0">{theme.progress}%</span>
                  <PmStatusPill label={theme.status} tone={statusTone(theme.status)} />
                  <button
                    type="button"
                    onClick={() => openTagModal(theme)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C3AED] hover:underline shrink-0"
                  >
                    <Tag className="h-3.5 w-3.5" /> Tag Goals
                  </button>
                  <ChevronRight className="h-4 w-4 text-[#D1D5DB] shrink-0 hidden sm:block" />
                </div>
              ))}
              {filtered.length === 0 && <div className="py-10 text-center text-sm text-[#6B7280]">No themes match your search.</div>}
            </div>
          </PmCard>
        )}
      </div>

      <PmModal
        open={!!tagModalTheme}
        onClose={() => setTagModalTheme(null)}
        title={`Tag Goals — ${tagModalTheme?.name ?? ""}`}
        description="Select the goals that contribute to this strategic theme."
        widthClass="max-w-lg"
        footer={
          <>
            <PmButton variant="outline" onClick={() => setTagModalTheme(null)}>
              Cancel
            </PmButton>
            <PmButton variant="primary" onClick={saveTaggedGoals}>
              Save Tags ({tagDraft.size})
            </PmButton>
          </>
        }
      >
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {availableGoals.map((goal) => {
            const checked = tagDraft.has(goal.id)
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoalTag(goal.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors",
                  checked ? "border-[#DDD6FE] bg-[#F5F3FF]" : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                )}
              >
                <span
                  className={cn(
                    "h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0",
                    checked ? "bg-[#7C3AED] border-[#7C3AED]" : "border-[#D1D5DB] bg-white"
                  )}
                >
                  {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#111827] truncate">{goal.title}</p>
                  <p className="text-[10px] text-[#9CA3AF] truncate">{goal.owner}</p>
                </div>
              </button>
            )
          })}
        </div>
      </PmModal>

      <PmModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Strategic Theme"
        description="Create a theme to group related company objectives."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </PmButton>
            <PmButton variant="primary" onClick={handleAddTheme}>
              Create Theme
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Theme Name *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Operational Excellence"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What does this theme drive?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED] resize-none"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Owner</span>
            <select
              value={form.owner}
              onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
            >
              {Array.from(new Set(availableGoals.map((g) => g.owner))).map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>
        </div>
      </PmModal>
    </div>
  )
}
