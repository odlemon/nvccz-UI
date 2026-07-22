"use client"

import { useMemo, useState } from "react"
import { Plus, Search, FileDown, MoreVertical, Medal, Building2, Crown, Users2, User } from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmAvatar, PmButton, PmCard, PmModal, PmPageHeader, PmProgress, PmSelectChip, PmStatusPill, PmTabPills } from "@/components/performance-mock/primitives"

type ContractType = "BOARD" | "CEO" | "DEPARTMENT" | "EMPLOYEE"
type ContractStatus = "Draft" | "Active" | "Under Review" | "Approved" | "Expired"

type Contract = {
  id: string
  type: ContractType
  holder: string
  holderInitials: string
  holderColor: string
  role: string
  period: string
  weight: number
  score: number
  status: ContractStatus
  dueDate: string
}

const typeMeta: Record<ContractType, { label: string; icon: typeof Medal; color: string }> = {
  BOARD: { label: "Board", icon: Users2, color: "#7C3AED" },
  CEO: { label: "CEO", icon: Crown, color: "#F59E0B" },
  DEPARTMENT: { label: "Department", icon: Building2, color: "#2563EB" },
  EMPLOYEE: { label: "Employee", icon: User, color: "#10B981" },
}

const initialContracts: Contract[] = [
  { id: "PC-001", type: "BOARD", holder: "Board of Directors", holderInitials: "BD", holderColor: "#7C3AED", role: "Governing Body", period: "FY 2026", weight: 100, score: 88, status: "Active", dueDate: "30 Jun 2026" },
  { id: "PC-002", type: "CEO", holder: "Tariro Moyo", holderInitials: "TM", holderColor: "#F59E0B", role: "Chief Executive Officer", period: "FY 2026", weight: 100, score: 82, status: "Active", dueDate: "30 Jun 2026" },
  { id: "PC-003", type: "DEPARTMENT", holder: "Finance Department", holderInitials: "FD", holderColor: "#2563EB", role: "Department Contract", period: "FY 2026", weight: 100, score: 90, status: "Approved", dueDate: "30 Jun 2026" },
  { id: "PC-004", type: "DEPARTMENT", holder: "Sales & Marketing", holderInitials: "SM", holderColor: "#2563EB", role: "Department Contract", period: "FY 2026", weight: 100, score: 74, status: "Under Review", dueDate: "30 Jun 2026" },
  { id: "PC-005", type: "DEPARTMENT", holder: "Operations Department", holderInitials: "OD", holderColor: "#2563EB", role: "Department Contract", period: "FY 2026", weight: 100, score: 86, status: "Active", dueDate: "30 Jun 2026" },
  { id: "PC-006", type: "EMPLOYEE", holder: "Rupatadzo Zulu", holderInitials: "RZ", holderColor: "#10B981", role: "Head of Customer Success", period: "FY 2026", weight: 100, score: 79, status: "Active", dueDate: "30 Jun 2026" },
  { id: "PC-007", type: "EMPLOYEE", holder: "Takudzwa Chari", holderInitials: "TC", holderColor: "#10B981", role: "Sales Manager", period: "FY 2026", weight: 100, score: 68, status: "Draft", dueDate: "30 Jun 2026" },
  { id: "PC-008", type: "EMPLOYEE", holder: "Tendai Nyathi", holderInitials: "TN", holderColor: "#10B981", role: "IT Operations Lead", period: "FY 2026", weight: 100, score: 91, status: "Approved", dueDate: "30 Jun 2026" },
  { id: "PC-009", type: "EMPLOYEE", holder: "Chipo Dube", holderInitials: "CD", holderColor: "#10B981", role: "HR Business Partner", period: "FY 2025", weight: 100, score: 72, status: "Expired", dueDate: "30 Jun 2025" },
]

function statusTone(status: ContractStatus): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "Active" || status === "Approved") return "success"
  if (status === "Under Review") return "warning"
  if (status === "Expired") return "danger"
  return "neutral"
}

const emptyForm = { type: "EMPLOYEE" as ContractType, holder: "", role: "", period: "FY 2026", weight: 100 }

export function ContractsMockScreen() {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)
  const [tab, setTab] = useState<"ALL" | ContractType>("ALL")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: contracts.length, BOARD: 0, CEO: 0, DEPARTMENT: 0, EMPLOYEE: 0 }
    contracts.forEach((r) => (c[r.type] = (c[r.type] || 0) + 1))
    return c
  }, [contracts])

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (tab !== "ALL" && c.type !== tab) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!c.holder.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q) && !c.role.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [contracts, tab, search])

  const avgScore = Math.round(contracts.reduce((s, c) => s + c.score, 0) / contracts.length)
  const activeCount = contracts.filter((c) => c.status === "Active").length
  const pendingCount = contracts.filter((c) => c.status === "Draft" || c.status === "Under Review").length

  const handleCreate = () => {
    if (!form.holder.trim()) {
      toast.error("Contract holder is required")
      return
    }
    const meta = typeMeta[form.type]
    const initials = form.holder
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    const newContract: Contract = {
      id: `PC-${String(contracts.length + 1).padStart(3, "0")}`,
      type: form.type,
      holder: form.holder,
      holderInitials: initials,
      holderColor: meta.color,
      role: form.role || meta.label,
      period: form.period,
      weight: form.weight,
      score: 0,
      status: "Draft",
      dueDate: "30 Jun 2026",
    }
    setContracts((prev) => [newContract, ...prev])
    setCreateOpen(false)
    setForm(emptyForm)
    toast.success("Performance contract created", { description: `${newContract.id} · ${newContract.holder}` })
  }

  const exportPdf = (contract: Contract) => {
    toast.success("Exporting contract to PDF", { description: `${contract.id} · ${contract.holder}` })
  }

  return (
    <div className="min-h-full">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Performance Contracts"]} searchPlaceholder="Search contracts…" />
      <div className="p-4 lg:p-6 space-y-5">
        <PmPageHeader
          title="Performance Contracts"
          subtitle="Manage balanced-scorecard performance contracts across the Board, CEO, Departments and Employees."
          actions={
            <>
              <PmButton variant="outline" onClick={() => toast.success("Exporting contract list to PDF…")}>
                <FileDown className="h-3.5 w-3.5" /> Export PDF
              </PmButton>
              <PmButton variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Create Contract
              </PmButton>
            </>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PmCard className="p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">Total Contracts</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{contracts.length}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">Active</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{activeCount}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">Pending Approval</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{pendingCount}</p>
          </PmCard>
          <PmCard className="p-3.5">
            <p className="text-[11px] font-medium text-[#6B7280]">Avg. Score</p>
            <p className="mt-1 text-xl font-bold text-[#111827]">{avgScore}%</p>
          </PmCard>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PmTabPills
            tabs={[
              { id: "ALL", label: `All (${counts.ALL})` },
              { id: "BOARD", label: `Board (${counts.BOARD})` },
              { id: "CEO", label: `CEO (${counts.CEO})` },
              { id: "DEPARTMENT", label: `Department (${counts.DEPARTMENT})` },
              { id: "EMPLOYEE", label: `Employee (${counts.EMPLOYEE})` },
            ]}
            active={tab}
            onChange={(id) => setTab(id as "ALL" | ContractType)}
          />
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by holder, role or ID…"
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-xs outline-none focus:border-[#7C3AED]"
            />
          </div>
        </div>

        <PmCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[840px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[#9CA3AF] border-b border-[#F1F5F9]">
                  {["Contract ID", "Holder", "Type", "Period", "Weight", "Score", "Status", "Due Date", ""].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const meta = typeMeta[c.type]
                  const Icon = meta.icon
                  return (
                    <tr key={c.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFAFA]">
                      <td className="py-3 px-3 font-semibold text-[#7C3AED] whitespace-nowrap">{c.id}</td>
                      <td className="py-3 px-3">
                        <PmAvatar initials={c.holderInitials} name={c.holder} role={c.role} color={c.holderColor} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-[#374151] whitespace-nowrap">
                          <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} /> {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{c.period}</td>
                      <td className="py-3 px-3 text-[#374151]">{c.weight}%</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <PmProgress value={c.score} className="w-16" />
                          <span className="font-semibold text-[#111827]">{c.score}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <PmStatusPill label={c.status} tone={statusTone(c.status)} />
                      </td>
                      <td className="py-3 px-3 text-[#6B7280] whitespace-nowrap">{c.dueDate}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => exportPdf(c)} className="h-7 w-7 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#7C3AED]">
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="h-7 w-7 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-sm text-[#6B7280]">
                      No contracts match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PmCard>
      </div>

      <PmModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Performance Contract"
        description="Set up a new balanced-scorecard performance contract."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </PmButton>
            <PmButton variant="primary" onClick={handleCreate}>
              Create Contract
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Contract Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContractType }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
            >
              {Object.entries(typeMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Contract Holder *</span>
            <input
              value={form.holder}
              onChange={(e) => setForm((f) => ({ ...f, holder: e.target.value }))}
              placeholder="e.g. Finance Department"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Role / Title</span>
            <input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Head of Finance"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#7C3AED]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Period</span>
              <select
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm bg-white"
              >
                {["FY 2026", "FY 2025"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[#374151] mb-1">Weight (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: Number(e.target.value) }))}
                className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm"
              />
            </label>
          </div>
        </div>
      </PmModal>
    </div>
  )
}
