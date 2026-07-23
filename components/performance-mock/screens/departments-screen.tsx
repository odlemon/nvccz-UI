"use client"

import { useMemo, useState } from "react"
import { Search, Building2, Users, Target, TrendingUp, X, Mail, Phone, ChevronRight } from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmAvatar, PmCard, PmPageHeader, PmProgress, PmStatusPill } from "@/components/performance-mock/primitives"
import { cn } from "@/lib/utils"

type DeptGroup = "Executive" | "Core" | "Support"
type DeptStatus = "On Track" | "At Risk" | "Off Track"

type Department = {
  id: string
  name: string
  group: DeptGroup
  head: string
  headInitials: string
  headColor: string
  headcount: number
  score: number
  status: DeptStatus
  kpiCount: number
  goalCount: number
  email: string
  phone: string
  description: string
}

const departments: Department[] = [
  {
    id: "d1",
    name: "Executive Office",
    group: "Executive",
    head: "Tariro Moyo",
    headInitials: "TM",
    headColor: "#7C3AED",
    headcount: 6,
    score: 88,
    status: "On Track",
    kpiCount: 8,
    goalCount: 5,
    email: "exec.office@arcus.co.zw",
    phone: "+263 4 123 4567",
    description: "Sets company-wide strategic direction and oversees execution across all departments.",
  },
  {
    id: "d2",
    name: "Finance",
    group: "Core",
    head: "Anesu Mlambo",
    headInitials: "AM",
    headColor: "#2563EB",
    headcount: 14,
    score: 90,
    status: "On Track",
    kpiCount: 7,
    goalCount: 4,
    email: "finance@arcus.co.zw",
    phone: "+263 4 123 4001",
    description: "Manages financial planning, reporting, treasury and regulatory compliance.",
  },
  {
    id: "d3",
    name: "Sales & Marketing",
    group: "Core",
    head: "Takudzwa Chari",
    headInitials: "TC",
    headColor: "#F97316",
    headcount: 22,
    score: 74,
    status: "At Risk",
    kpiCount: 6,
    goalCount: 5,
    email: "sales@arcus.co.zw",
    phone: "+263 4 123 4002",
    description: "Drives revenue growth through customer acquisition, retention and brand positioning.",
  },
  {
    id: "d4",
    name: "Operations",
    group: "Core",
    head: "Tatenda Chikomo",
    headInitials: "TC",
    headColor: "#10B981",
    headcount: 31,
    score: 86,
    status: "On Track",
    kpiCount: 9,
    goalCount: 6,
    email: "operations@arcus.co.zw",
    phone: "+263 4 123 4003",
    description: "Oversees day-to-day service delivery, process efficiency and quality management.",
  },
  {
    id: "d5",
    name: "Customer Success",
    group: "Core",
    head: "Rupatadzo Zulu",
    headInitials: "RZ",
    headColor: "#EC4899",
    headcount: 18,
    score: 79,
    status: "At Risk",
    kpiCount: 6,
    goalCount: 4,
    email: "success@arcus.co.zw",
    phone: "+263 4 123 4004",
    description: "Owns customer onboarding, support responsiveness and satisfaction outcomes.",
  },
  {
    id: "d6",
    name: "Human Resources",
    group: "Support",
    head: "Chipo Dube",
    headInitials: "CD",
    headColor: "#8B5CF6",
    headcount: 9,
    score: 82,
    status: "On Track",
    kpiCount: 5,
    goalCount: 3,
    email: "hr@arcus.co.zw",
    phone: "+263 4 123 4005",
    description: "Manages talent acquisition, engagement, learning and organizational development.",
  },
  {
    id: "d7",
    name: "Information Technology",
    group: "Support",
    head: "Tendai Nyathi",
    headInitials: "TN",
    headColor: "#3B82F6",
    headcount: 11,
    score: 91,
    status: "On Track",
    kpiCount: 6,
    goalCount: 3,
    email: "it@arcus.co.zw",
    phone: "+263 4 123 4006",
    description: "Maintains core systems, infrastructure security and digital transformation initiatives.",
  },
  {
    id: "d8",
    name: "Legal & Compliance",
    group: "Support",
    head: "Nyasha Dube",
    headInitials: "ND",
    headColor: "#64748B",
    headcount: 5,
    score: 84,
    status: "On Track",
    kpiCount: 4,
    goalCount: 2,
    email: "legal@arcus.co.zw",
    phone: "+263 4 123 4007",
    description: "Ensures regulatory compliance, contract governance and risk management.",
  },
]

const groups: DeptGroup[] = ["Executive", "Core", "Support"]

function statusTone(status: DeptStatus): "success" | "warning" | "danger" {
  if (status === "On Track") return "success"
  if (status === "At Risk") return "warning"
  return "danger"
}

export function DepartmentsMockScreen() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return departments
    const q = search.toLowerCase()
    return departments.filter((d) => d.name.toLowerCase().includes(q) || d.head.toLowerCase().includes(q))
  }, [search])

  const grouped = useMemo(() => {
    const map: Record<DeptGroup, Department[]> = { Executive: [], Core: [], Support: [] }
    filtered.forEach((d) => map[d.group].push(d))
    return map
  }, [filtered])

  const selected = departments.find((d) => d.id === selectedId) || null
  const totalHeadcount = departments.reduce((s, d) => s + d.headcount, 0)
  const avgScore = Math.round(departments.reduce((s, d) => s + d.score, 0) / departments.length)
  const atRiskCount = departments.filter((d) => d.status !== "On Track").length

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration", "Departments"]} searchPlaceholder="Search departments…" />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="Departments"
          subtitle="View organizational structure, ownership and performance across departments."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Departments</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{departments.length}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Total Headcount</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{totalHeadcount}</p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
          <PmCard className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Avg. Score</p>
                <p className="mt-1 text-xl font-bold text-[#111827]">{avgScore}%</p>
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
                <Target className="h-4 w-4" />
              </div>
            </div>
          </PmCard>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments or heads…"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-xs outline-none focus:border-[#7C3AED]"
          />
        </div>

        <div className={cn("grid grid-cols-1 gap-6", selected && "xl:grid-cols-[1fr_340px]")}>
          <div className="space-y-6">
            {groups.map((group) => {
              const items = grouped[group]
              if (items.length === 0) return null
              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-[#111827]">{group}</h3>
                    <span className="text-[11px] text-[#9CA3AF]">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {items.map((d) => (
                      <PmCard key={d.id} className="p-4" onClick={() => setSelectedId(d.id)}>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-[#111827] leading-snug">{d.name}</h4>
                          <PmStatusPill label={d.status} tone={statusTone(d.status)} />
                        </div>
                        <div className="mt-2.5">
                          <PmAvatar initials={d.headInitials} name={d.head} role="Department Head" color={d.headColor} size="sm" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-[#6B7280]">Performance Score</span>
                          <span className="font-semibold text-[#111827]">{d.score}%</span>
                        </div>
                        <PmProgress value={d.score} className="mt-1.5" />
                        <div className="mt-3 flex items-center gap-4 text-[11px] text-[#6B7280]">
                          <span>{d.headcount} staff</span>
                          <span>{d.kpiCount} KPIs</span>
                          <span>{d.goalCount} goals</span>
                        </div>
                      </PmCard>
                    ))}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="py-10 text-center text-sm text-[#6B7280]">No departments match your search.</p>}
          </div>

          {selected && (
            <PmCard className="p-0 h-fit sticky top-16">
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{selected.group} Department</span>
                <button type="button" onClick={() => setSelectedId(null)} className="text-[#9CA3AF] hover:text-[#111827]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-4 pt-2 pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[#111827] leading-snug">{selected.name}</h3>
                  <PmStatusPill label={selected.status} tone={statusTone(selected.status)} />
                </div>
                <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">{selected.description}</p>
              </div>
              <div className="px-3 py-3 border-b border-[#F1F5F9]">
                <p className="text-xs font-semibold text-[#111827] mb-2">Department Head</p>
                <PmAvatar initials={selected.headInitials} name={selected.head} role="Department Head" color={selected.headColor} />
                <div className="mt-3 space-y-1.5 text-xs text-[#6B7280]">
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {selected.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}
                  </p>
                </div>
              </div>
              <div className="px-3 py-3 border-b border-[#F1F5F9]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#6B7280]">Performance Score</span>
                  <span className="font-semibold text-[#111827]">{selected.score}%</span>
                </div>
                <PmProgress value={selected.score} />
              </div>
              <div className="px-3 py-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-[#111827]">{selected.headcount}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Staff</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#111827]">{selected.kpiCount}</p>
                  <p className="text-[10px] text-[#9CA3AF]">KPIs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#111827]">{selected.goalCount}</p>
                  <p className="text-[10px] text-[#9CA3AF]">Goals</p>
                </div>
              </div>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border-t border-[#F1F5F9] text-xs font-medium text-[#7C3AED] hover:bg-[#F9FAFB]"
              >
                View Department Scorecard <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </PmCard>
          )}
        </div>
      </div>
    </div>
  )
}
