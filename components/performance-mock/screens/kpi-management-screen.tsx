"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  Search,
  Filter,
  Plus,
  Upload,
  Pencil,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutGrid,
  User,
  Crosshair,
  FlaskConical,
  Cloud,
  Hexagon,
  Building2,
  Settings2,
  Users,
  Monitor,
  Megaphone,
} from "lucide-react"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmPageHeader, PmStatusPill, PmAvatar, PmProgress } from "@/components/performance-mock/primitives"
import { PM_PHOTOS, pmPhoto } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const PURPLE_DEEP = "#7C3AED"

type Category = "Financial" | "Customer" | "Internal Process" | "Learning & Growth"

type KpiRow = {
  id: string
  code: string
  name: string
  category: Category
  owner: string
  ownerSrc: string
  dataSource: string
  calcMethod: string
  updateFreq: string
  status: "Approved" | "Pending"
  thresholdMin: string
  thresholdMax: string
  threshLow: "red" | "orange"
  threshHigh: "green"
}

const categoryMeta: Record<Category, { color: string; bg: string; Icon: typeof Cloud }> = {
  Financial: { color: PURPLE_DEEP, bg: "#F3E8FF", Icon: Cloud },
  Customer: { color: "#2563EB", bg: "#DBEAFE", Icon: Cloud },
  "Internal Process": { color: "#7C3AED", bg: "#EDE9FE", Icon: Hexagon },
  "Learning & Growth": { color: "#F59E0B", bg: "#FEF3C7", Icon: Cloud },
}

const sourceMeta: Record<string, { bg: string; color: string; mark: string }> = {
  "Oracle ERP": { bg: "#FEE2E2", color: "#DC2626", mark: "O" },
  Salesforce: { bg: "#DBEAFE", color: "#2563EB", mark: "S" },
  "Power BI": { bg: "#FEF3C7", color: "#D97706", mark: "P" },
  SurveyMonkey: { bg: "#D1FAE5", color: "#059669", mark: "SM" },
  "SAP ERP": { bg: "#DBEAFE", color: "#1D4ED8", mark: "SAP" },
  "Culture Amp": { bg: "#FCE7F3", color: "#DB2777", mark: "CA" },
  LMS: { bg: "#E0E7FF", color: "#4F46E5", mark: "L" },
}

const owners = [
  { name: "Farai Muchengeti", src: PM_PHOTOS.farai },
  { name: "Anesu Mlambo", src: pmPhoto(21) },
  { name: "Rupatadzo Zulu", src: pmPhoto(44) },
  { name: "Takudzwa Chari", src: pmPhoto(32) },
  { name: "Tendai Nyathi", src: PM_PHOTOS.tendai },
  { name: "Tatenda Chikomo", src: pmPhoto(52) },
  { name: "Chipo Dube", src: PM_PHOTOS.chipo },
]

const initialRows: KpiRow[] = [
  { id: "k1", code: "FIN-001", name: "Revenue Growth (%)", category: "Financial", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, dataSource: "Oracle ERP", calcMethod: "% Change", updateFreq: "Monthly", status: "Approved", thresholdMin: "15%", thresholdMax: "25%", threshLow: "red", threshHigh: "green" },
  { id: "k2", code: "FIN-002", name: "Net Profit Margin (%)", category: "Financial", owner: "Anesu Mlambo", ownerSrc: pmPhoto(21), dataSource: "Oracle ERP", calcMethod: "(A-B) / A", updateFreq: "Monthly", status: "Approved", thresholdMin: "10%", thresholdMax: "20%", threshLow: "red", threshHigh: "green" },
  { id: "k3", code: "FIN-003", name: "Operating Margin (%)", category: "Financial", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, dataSource: "Oracle ERP", calcMethod: "(A-B) / A", updateFreq: "Monthly", status: "Approved", thresholdMin: "12%", thresholdMax: "22%", threshLow: "red", threshHigh: "green" },
  { id: "k4", code: "FIN-004", name: "Return on Invested Capital (%)", category: "Financial", owner: "Anesu Mlambo", ownerSrc: pmPhoto(21), dataSource: "Oracle ERP", calcMethod: "Average", updateFreq: "Quarterly", status: "Approved", thresholdMin: "10%", thresholdMax: "18%", threshLow: "orange", threshHigh: "green" },
  { id: "k5", code: "FIN-005", name: "Cash Reserves Ratio (%)", category: "Financial", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, dataSource: "Oracle ERP", calcMethod: "% of Total", updateFreq: "Monthly", status: "Pending", thresholdMin: "20%", thresholdMax: "35%", threshLow: "orange", threshHigh: "green" },
  { id: "k6", code: "FIN-006", name: "Budget Variance (%)", category: "Financial", owner: "Anesu Mlambo", ownerSrc: pmPhoto(21), dataSource: "Oracle ERP", calcMethod: "(A-B) / A", updateFreq: "Monthly", status: "Approved", thresholdMin: "-5%", thresholdMax: "5%", threshLow: "red", threshHigh: "green" },
  { id: "k7", code: "FIN-007", name: "Cost Optimization (%)", category: "Financial", owner: "Farai Muchengeti", ownerSrc: PM_PHOTOS.farai, dataSource: "Oracle ERP", calcMethod: "% Change", updateFreq: "Monthly", status: "Approved", thresholdMin: "8%", thresholdMax: "15%", threshLow: "red", threshHigh: "green" },
  { id: "k8", code: "CUS-001", name: "Customer Satisfaction (NPS)", category: "Customer", owner: "Rupatadzo Zulu", ownerSrc: pmPhoto(44), dataSource: "SurveyMonkey", calcMethod: "Average", updateFreq: "Quarterly", status: "Approved", thresholdMin: "50", thresholdMax: "80", threshLow: "orange", threshHigh: "green" },
  { id: "k9", code: "CUS-002", name: "Customer Retention Rate (%)", category: "Customer", owner: "Takudzwa Chari", ownerSrc: pmPhoto(32), dataSource: "Salesforce", calcMethod: "% of Total", updateFreq: "Monthly", status: "Pending", thresholdMin: "70%", thresholdMax: "90%", threshLow: "orange", threshHigh: "green" },
  { id: "k10", code: "CUS-003", name: "Market Share (%)", category: "Customer", owner: "Rupatadzo Zulu", ownerSrc: pmPhoto(44), dataSource: "Salesforce", calcMethod: "% of Total", updateFreq: "Quarterly", status: "Approved", thresholdMin: "15%", thresholdMax: "30%", threshLow: "red", threshHigh: "green" },
  { id: "k11", code: "CUS-004", name: "Digital Adoption Rate (%)", category: "Customer", owner: "Takudzwa Chari", ownerSrc: pmPhoto(32), dataSource: "SurveyMonkey", calcMethod: "Average", updateFreq: "Monthly", status: "Approved", thresholdMin: "55%", thresholdMax: "75%", threshLow: "orange", threshHigh: "green" },
  { id: "k12", code: "CUS-005", name: "Customer Lifetime Value ($)", category: "Customer", owner: "Rupatadzo Zulu", ownerSrc: pmPhoto(44), dataSource: "Salesforce", calcMethod: "Average", updateFreq: "Quarterly", status: "Approved", thresholdMin: "$2,500", thresholdMax: "$5,000", threshLow: "red", threshHigh: "green" },
  { id: "k13", code: "CUS-006", name: "Complaint Resolution Time (hrs)", category: "Customer", owner: "Takudzwa Chari", ownerSrc: pmPhoto(32), dataSource: "Salesforce", calcMethod: "Average", updateFreq: "Weekly", status: "Approved", thresholdMin: "2", thresholdMax: "6", threshLow: "orange", threshHigh: "green" },
  { id: "k14", code: "INT-001", name: "Process Compliance (%)", category: "Internal Process", owner: "Tendai Nyathi", ownerSrc: PM_PHOTOS.tendai, dataSource: "Power BI", calcMethod: "(A/B)*100", updateFreq: "Monthly", status: "Approved", thresholdMin: "80%", thresholdMax: "95%", threshLow: "red", threshHigh: "green" },
  { id: "k15", code: "INT-002", name: "Cycle Time (Days)", category: "Internal Process", owner: "Tatenda Chikomo", ownerSrc: pmPhoto(52), dataSource: "SAP ERP", calcMethod: "Average", updateFreq: "Weekly", status: "Approved", thresholdMin: "5", thresholdMax: "10", threshLow: "orange", threshHigh: "green" },
  { id: "k16", code: "INT-003", name: "Quality Score (%)", category: "Internal Process", owner: "Tendai Nyathi", ownerSrc: PM_PHOTOS.tendai, dataSource: "Power BI", calcMethod: "Average", updateFreq: "Monthly", status: "Approved", thresholdMin: "85%", thresholdMax: "98%", threshLow: "red", threshHigh: "green" },
  { id: "k17", code: "INT-004", name: "On-time Delivery (%)", category: "Internal Process", owner: "Tatenda Chikomo", ownerSrc: pmPhoto(52), dataSource: "SAP ERP", calcMethod: "% of Total", updateFreq: "Weekly", status: "Approved", thresholdMin: "85%", thresholdMax: "97%", threshLow: "orange", threshHigh: "green" },
  { id: "k18", code: "INT-005", name: "System Uptime (%)", category: "Internal Process", owner: "Tendai Nyathi", ownerSrc: PM_PHOTOS.tendai, dataSource: "Power BI", calcMethod: "% of Total", updateFreq: "Monthly", status: "Approved", thresholdMin: "97%", thresholdMax: "99.9%", threshLow: "red", threshHigh: "green" },
  { id: "k19", code: "INT-006", name: "IT Security Compliance (%)", category: "Internal Process", owner: "Tatenda Chikomo", ownerSrc: pmPhoto(52), dataSource: "SAP ERP", calcMethod: "(A/B)*100", updateFreq: "Quarterly", status: "Pending", thresholdMin: "90%", thresholdMax: "100%", threshLow: "orange", threshHigh: "green" },
  { id: "k20", code: "LRN-001", name: "Employee Engagement (%)", category: "Learning & Growth", owner: "Chipo Dube", ownerSrc: PM_PHOTOS.chipo, dataSource: "Culture Amp", calcMethod: "Average", updateFreq: "Quarterly", status: "Pending", thresholdMin: "60%", thresholdMax: "80%", threshLow: "orange", threshHigh: "green" },
  { id: "k21", code: "LRN-002", name: "Training Completion Rate (%)", category: "Learning & Growth", owner: "Rupatadzo Zulu", ownerSrc: pmPhoto(44), dataSource: "LMS", calcMethod: "(A/B)*100", updateFreq: "Monthly", status: "Approved", thresholdMin: "75%", thresholdMax: "95%", threshLow: "red", threshHigh: "green" },
  { id: "k22", code: "LRN-003", name: "Leadership Bench Strength (%)", category: "Learning & Growth", owner: "Chipo Dube", ownerSrc: PM_PHOTOS.chipo, dataSource: "Culture Amp", calcMethod: "Average", updateFreq: "Quarterly", status: "Approved", thresholdMin: "60%", thresholdMax: "85%", threshLow: "orange", threshHigh: "green" },
  { id: "k23", code: "LRN-004", name: "Critical Skill Coverage (%)", category: "Learning & Growth", owner: "Rupatadzo Zulu", ownerSrc: pmPhoto(44), dataSource: "LMS", calcMethod: "% of Total", updateFreq: "Quarterly", status: "Approved", thresholdMin: "65%", thresholdMax: "90%", threshLow: "red", threshHigh: "green" },
  { id: "k24", code: "LRN-005", name: "Employee Turnover Rate (%)", category: "Learning & Growth", owner: "Chipo Dube", ownerSrc: PM_PHOTOS.chipo, dataSource: "Culture Amp", calcMethod: "% Change", updateFreq: "Monthly", status: "Approved", thresholdMin: "0%", thresholdMax: "10%", threshLow: "orange", threshHigh: "green" },
]

const integrations = [
  { name: "Oracle ERP", count: 23 },
  { name: "Salesforce", count: 12 },
  { name: "Power BI", count: 18 },
  { name: "SurveyMonkey", count: 8 },
  { name: "SAP ERP", count: 14 },
]

const workflowRules = [
  { name: "KPI Approval Flow", level: "Level 2" },
  { name: "KPI Review Flow", level: "Level 2" },
  { name: "KPI Update Flow", level: "Level 1" },
]

const departmentMapping = [
  { name: "Finance Department", count: 7, pct: 29, Icon: Building2, color: PURPLE_DEEP, bg: "#F3E8FF" },
  { name: "Operations Department", count: 6, pct: 25, Icon: Settings2, color: "#0D9488", bg: "#CCFBF1" },
  { name: "Sales & Marketing", count: 5, pct: 21, Icon: Megaphone, color: "#2563EB", bg: "#DBEAFE" },
  { name: "Human Resources", count: 4, pct: 17, Icon: Users, color: "#DB2777", bg: "#FCE7F3" },
  { name: "Information Technology", count: 2, pct: 8, Icon: Monitor, color: "#4F46E5", bg: "#E0E7FF" },
]

const recentUpdates = [
  { name: "Anesu Mlambo", action: "updated Net Profit Margin (%)", time: "2h ago", src: pmPhoto(21) },
  { name: "Rupatadzo Zulu", action: "submitted Customer Retention Rate (%)", time: "5h ago", src: pmPhoto(44) },
  { name: "Takudzwa Chari", action: "updated Cycle Time (Days)", time: "1d ago", src: pmPhoto(32) },
  { name: "Farai Muchengeti", action: "approved Revenue Growth (%)", time: "1d ago", src: PM_PHOTOS.farai },
]

const categories: Category[] = ["Financial", "Customer", "Internal Process", "Learning & Growth"]
const calcMethods = ["% Change", "(A-B) / A", "Average", "(A/B)*100", "% of Total"]

const emptyForm = {
  code: "",
  name: "",
  category: "Financial" as Category,
  owner: owners[0].name,
  dataSource: "Oracle ERP",
  calcMethod: "% Change",
  updateFreq: "Monthly",
  thresholdMin: "",
  thresholdMax: "",
}

function SourceBadge({ name }: { name: string }) {
  const meta = sourceMeta[name] || { bg: "#F3F4F6", color: "#4B5563", mark: name.slice(0, 2).toUpperCase() }
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[#374151] whitespace-nowrap">
      <span
        className="h-6 w-6 rounded-md text-[9px] font-bold flex items-center justify-center shrink-0"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        {meta.mark}
      </span>
      {name}
    </span>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  const meta = categoryMeta[category]
  const Icon = meta.Icon
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#374151] whitespace-nowrap">
      <span className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      {category}
    </span>
  )
}

function ThresholdCell({ min, max, low }: { min: string; max: string; low: "red" | "orange" }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[#374151] whitespace-nowrap">
      <span className="inline-flex items-center gap-1">
        <span className={cn("h-2 w-2 rounded-full", low === "red" ? "bg-[#EF4444]" : "bg-[#F59E0B]")} />
        <span>{min}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#10B981]" />
        <span>{max}</span>
      </span>
    </span>
  )
}

function FilterChip({
  icon,
  value,
  options,
  onChange,
}: {
  icon: ReactNode
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="relative inline-flex items-center h-9 rounded-lg border border-[#E5E7EB] bg-white pl-2.5 pr-2 text-xs text-[#374151] hover:bg-[#F9FAFB] cursor-pointer shadow-sm">
      <span className="text-[#6B7280] mr-1.5 shrink-0">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent outline-none pr-4 cursor-pointer max-w-[160px]"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function KpiManagementMockScreen() {
  const router = useRouter()
  const [rows, setRows] = useState<KpiRow[]>(initialRows)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [ownerFilter, setOwnerFilter] = useState("All KPI Owners")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [calcFilter, setCalcFilter] = useState("All Calculation Methods")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingWeights, setEditingWeights] = useState(false)
  const [weights, setWeights] = useState({ Financial: 30, Customer: 25, "Internal Process": 25, "Learning & Growth": 20 })
  const [weightsDraft, setWeightsDraft] = useState(weights)

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter !== "All Categories" && r.category !== categoryFilter) return false
      if (ownerFilter !== "All KPI Owners" && r.owner !== ownerFilter) return false
      if (statusFilter !== "All Status" && r.status !== statusFilter) return false
      if (calcFilter !== "All Calculation Methods" && r.calcMethod !== calcFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, categoryFilter, ownerFilter, statusFilter, calcFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = { Financial: 0, Customer: 0, "Internal Process": 0, "Learning & Growth": 0 }
    rows.forEach((r) => counts[r.category]++)
    return counts
  }, [rows])

  const categoryDonutData = categories.map((c) => ({ name: c, value: categoryCounts[c], color: categoryMeta[c].color }))

  const handleCreateKpi = () => {
    if (!form.code.trim() || !form.name.trim()) return
    const owner = owners.find((o) => o.name === form.owner) || owners[0]
    const newRow: KpiRow = {
      id: `k${Date.now()}`,
      code: form.code,
      name: form.name,
      category: form.category,
      owner: owner.name,
      ownerSrc: owner.src,
      dataSource: form.dataSource,
      calcMethod: form.calcMethod,
      updateFreq: form.updateFreq,
      status: "Pending",
      thresholdMin: form.thresholdMin || "—",
      thresholdMax: form.thresholdMax || "—",
      threshLow: "orange",
      threshHigh: "green",
    }
    setRows((prev) => [newRow, ...prev])
    setModalOpen(false)
    setForm(emptyForm)
    setPage(1)
  }

  const weightsTotal = Object.values(weightsDraft).reduce((s, v) => s + v, 0)

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageRows.forEach((r) => next.delete(r.id))
      else pageRows.forEach((r) => next.add(r.id))
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration", "KPI Management"]} />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="KPI Management"
          subtitle="Manage and configure all KPIs across the organization."
          actions={
            <>
              <div className="flex items-center h-10 w-[280px] rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm shadow-sm">
                <Search className="h-4 w-4 text-[#9CA3AF] mr-2 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search KPIs by name, code or owner..."
                  className="flex-1 outline-none text-sm placeholder:text-[#9CA3AF] min-w-0"
                />
                <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] text-[10px] font-medium text-[#9CA3AF] ml-2">
                  ⌘ K
                </kbd>
              </div>
              <PmButton variant="outline">
                <Upload className="h-3.5 w-3.5" /> Export
              </PmButton>
              <PmButton variant="primary" className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={() => setModalOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New KPI
              </PmButton>
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
            value={categoryFilter}
            options={["All Categories", ...categories]}
            onChange={(v) => {
              setCategoryFilter(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<User className="h-3.5 w-3.5" />}
            value={ownerFilter}
            options={["All KPI Owners", ...owners.map((o) => o.name)]}
            onChange={(v) => {
              setOwnerFilter(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<Crosshair className="h-3.5 w-3.5" />}
            value={statusFilter}
            options={["All Status", "Approved", "Pending"]}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          />
          <FilterChip
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            value={calcFilter}
            options={["All Calculation Methods", ...calcMethods]}
            onChange={(v) => {
              setCalcFilter(v)
              setPage(1)
            }}
          />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] shadow-sm"
          >
            <Filter className="h-3.5 w-3.5 text-[#6B7280]" /> More Filters
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          {/* LEFT COLUMN: registry + bottom widgets */}
          <div className="min-w-0 space-y-3">
            <PmCard className="overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#111827]">KPI Registry ({filtered.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[1100px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-[#9CA3AF] border-y border-[#F1F5F9] bg-[#FAFAFB]">
                      <th className="px-3 py-2 font-semibold w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          className="rounded border-[#D1D5DB] accent-[#8B5CF6]"
                        />
                      </th>
                      {["KPI Code", "KPI Name", "Category", "KPI Owner", "Data Source", "Calculation Method", "Update Freq.", "Status", "Threshold", "Actions"].map(
                        (h) => (
                          <th key={h} className="px-3 py-3 font-semibold whitespace-nowrap">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[#F8FAFC] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                        onClick={() => router.push(`/performance/kpis/${r.id}`)}
                      >
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="rounded border-[#D1D5DB] accent-[#8B5CF6]"
                          />
                        </td>
                        <td className="px-3 py-3 text-[#6B7280] font-medium whitespace-nowrap">{r.code}</td>
                        <td className="px-3 py-3 font-semibold text-[#111827] whitespace-nowrap">{r.name}</td>
                        <td className="px-3 py-3">
                          <CategoryBadge category={r.category} />
                        </td>
                        <td className="px-3 py-3">
                          <PmAvatar initials={r.owner.slice(0, 2)} name={r.owner} src={r.ownerSrc} size="sm" />
                        </td>
                        <td className="px-3 py-3">
                          <SourceBadge name={r.dataSource} />
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center h-6 px-2 rounded-md bg-[#F5F3FF] text-[#6D28D9] text-[11px] font-semibold whitespace-nowrap">
                            {r.calcMethod}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[#6B7280] whitespace-nowrap">{r.updateFreq}</td>
                        <td className="px-3 py-3">
                          <PmStatusPill label={r.status} tone={r.status === "Approved" ? "success" : "warning"} />
                        </td>
                        <td className="px-3 py-3">
                          <ThresholdCell min={r.thresholdMin} max={r.thresholdMax} low={r.threshLow} />
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5">
                            <button type="button" className="h-7 w-7 rounded-md flex items-center justify-center text-[#8B5CF6] hover:bg-[#F5F3FF]">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" className="h-7 w-7 rounded-md flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280]">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pageRows.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-[#6B7280] text-sm">
                          No KPIs match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-3 py-2 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#6B7280]">
                  Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} results
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "h-8 w-8 rounded-full text-xs font-semibold flex items-center justify-center",
                        page === i + 1 ? "bg-[#8B5CF6] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="h-8 rounded-lg border border-[#E5E7EB] px-2 text-xs text-[#374151] bg-white"
                >
                  {[8, 10, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </PmCard>

            {/* Bottom widgets sit under the table, same left-column width */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PmCard className="p-4">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Category Summary</h3>
                <div className="flex items-center gap-3">
                  <div className="h-28 w-28 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryDonutData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={52} paddingAngle={3} strokeWidth={0}>
                          {categoryDonutData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-base font-bold text-[#111827] leading-none">{rows.length}</p>
                      <p className="text-[9px] text-[#9CA3AF] mt-0.5">Total KPIs</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {categories.map((c) => (
                      <div key={c} className="flex items-center justify-between text-[11px] gap-1">
                        <span className="inline-flex items-center gap-1.5 text-[#374151] min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: categoryMeta[c].color }} />
                          <span className="truncate">{c}</span>
                        </span>
                        <span className="text-[#6B7280] shrink-0 font-medium">
                          {categoryCounts[c]} · {Math.round((categoryCounts[c] / Math.max(rows.length, 1)) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PmCard>

              <PmCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#111827]">Department Mapping</h3>
                  <button type="button" className="text-[11px] font-medium text-[#8B5CF6] hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-2.5">
                  {departmentMapping.map((d) => {
                    const Icon = d.Icon
                    return (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-xs text-[#374151] min-w-0">
                          <span className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: d.bg, color: d.color }}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate font-medium">{d.name}</span>
                        </span>
                        <span className="text-[11px] text-[#6B7280] shrink-0 font-medium">
                          {d.count} · {d.pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </PmCard>

              <PmCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#111827]">Recent KPI Updates</h3>
                  <button type="button" className="text-[11px] font-medium text-[#8B5CF6] hover:underline">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {recentUpdates.map((u) => (
                    <div key={u.time + u.name} className="flex items-start gap-2">
                      <img src={u.src} alt={u.name} className="h-7 w-7 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" referrerPolicy="no-referrer" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-[#374151] leading-snug">
                          <span className="font-semibold text-[#111827]">{u.name}</span> {u.action}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap shrink-0">{u.time}</span>
                    </div>
                  ))}
                </div>
              </PmCard>
            </div>
          </div>

          {/* RIGHT COLUMN: stacked admin cards */}
          <div className="space-y-3 xl:sticky xl:top-24">
            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Integration Mapping</h3>
                <button type="button" className="text-[11px] font-medium text-[#8B5CF6] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {integrations.map((i) => (
                  <div key={i.name} className="flex items-center justify-between gap-2">
                    <SourceBadge name={i.name} />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-[#059669]">Connected</span>
                      <span className="text-[11px] text-[#9CA3AF]">{i.count} KPIs</span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-4 w-full inline-flex items-center justify-between text-xs font-semibold text-[#8B5CF6] hover:underline">
                Manage Integrations
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">Workflow Rules</h3>
                <button type="button" className="text-[11px] font-medium text-[#8B5CF6] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {workflowRules.map((w) => (
                  <div key={w.name} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#374151] truncate">{w.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-[#059669]">Active</span>
                      <span className="text-[11px] text-[#9CA3AF]">{w.level}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-4 w-full inline-flex items-center justify-between text-xs font-semibold text-[#8B5CF6] hover:underline">
                Manage Workflows
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </PmCard>

            <PmCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#111827]">BSC Pillar Weights</h3>
                {editingWeights ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWeightsDraft(weights)
                        setEditingWeights(false)
                      }}
                      className="text-[11px] font-medium text-[#6B7280] hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWeights(weightsDraft)
                        setEditingWeights(false)
                      }}
                      disabled={weightsTotal !== 100}
                      className="text-[11px] font-semibold text-[#8B5CF6] hover:underline disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setEditingWeights(true)} className="text-[11px] font-medium text-[#8B5CF6] hover:underline">
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-3.5">
                {categories.map((c) => (
                  <div key={c}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[#374151] font-medium">
                        <span className="h-5 w-5 rounded-md flex items-center justify-center" style={{ backgroundColor: categoryMeta[c].bg, color: categoryMeta[c].color }}>
                          {(() => {
                            const Icon = categoryMeta[c].Icon
                            return <Icon className="h-3 w-3" />
                          })()}
                        </span>
                        {c}
                      </span>
                      {editingWeights ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={weightsDraft[c]}
                          onChange={(e) => setWeightsDraft((prev) => ({ ...prev, [c]: Number(e.target.value) }))}
                          className="w-14 h-6 rounded-md border border-[#E5E7EB] px-1.5 text-right text-[11px]"
                        />
                      ) : (
                        <span className="font-bold text-[#111827]">{weights[c]}%</span>
                      )}
                    </div>
                    <PmProgress value={editingWeights ? weightsDraft[c] : weights[c]} color="#8B5CF6" />
                  </div>
                ))}
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Total</span>
                <span className={cn("font-bold", editingWeights && weightsTotal !== 100 ? "text-[#EF4444]" : "text-[#111827]")}>
                  {editingWeights ? weightsTotal : 100}%
                </span>
              </div>
            </PmCard>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">New KPI</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-[#9CA3AF] hover:text-[#111827]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#374151]">KPI Code</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. FIN-008"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151]">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#374151]">KPI Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Working Capital Ratio (%)"
                  className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#374151]">Owner</label>
                  <select
                    value={form.owner}
                    onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                  >
                    {owners.map((o) => (
                      <option key={o.name} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151]">Data Source</label>
                  <select
                    value={form.dataSource}
                    onChange={(e) => setForm((f) => ({ ...f, dataSource: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                  >
                    {[...integrations.map((i) => i.name), "Culture Amp", "LMS"].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#374151]">Calculation Method</label>
                  <select
                    value={form.calcMethod}
                    onChange={(e) => setForm((f) => ({ ...f, calcMethod: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                  >
                    {calcMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151]">Update Frequency</label>
                  <select
                    value={form.updateFreq}
                    onChange={(e) => setForm((f) => ({ ...f, updateFreq: e.target.value }))}
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm text-[#111827]"
                  >
                    {["Weekly", "Monthly", "Quarterly"].map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#374151]">Threshold Min</label>
                  <input
                    value={form.thresholdMin}
                    onChange={(e) => setForm((f) => ({ ...f, thresholdMin: e.target.value }))}
                    placeholder="e.g. 15%"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#374151]">Threshold Max</label>
                  <input
                    value={form.thresholdMax}
                    onChange={(e) => setForm((f) => ({ ...f, thresholdMax: e.target.value }))}
                    placeholder="e.g. 25%"
                    className="mt-1 w-full h-9 rounded-lg border border-[#E5E7EB] px-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E5E7EB]">
              <PmButton variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </PmButton>
              <PmButton variant="primary" className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={handleCreateKpi}>
                Create KPI
              </PmButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
