"use client"

import { useMemo, useState } from "react"
import { Ban, Clock, Coins, Download, Plus, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GEOGRAPHY_OPTIONS,
  PLACEMENT_AGENTS,
  PLACEMENT_AGENT_KPIS,
  commissionStatusClass,
  type CommissionStatus,
  type PlacementAgent,
  type PlacementAgentKpi,
} from "./placement-agents-mock-data"
import {
  FrField,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const KPI_ICONS = {
  users: Users,
  coins: Coins,
  clock: Clock,
  ban: Ban,
} as const

function StatusChip({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
        className,
      )}
    >
      {label}
    </span>
  )
}

function KpiCard({ kpi }: { kpi: PlacementAgentKpi }) {
  const Icon = KPI_ICONS[kpi.icon]
  return (
    <div className={cn(CARD, "flex flex-col p-4")}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[6px]"
        style={{ backgroundColor: kpi.iconBg, color: kpi.iconColor }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      <p className="mt-3 text-[12px] font-medium text-[#64748b]">{kpi.label}</p>
      <p className="mt-1.5 text-[22px] font-bold tabular-nums text-[#0f172a]">{kpi.value}</p>
      <p className="mt-1 text-[11px] text-[#94a3b8]">{kpi.sublabel}</p>
    </div>
  )
}

function DetailPanel({
  agent,
  onViewAllOpportunities,
}: {
  agent: PlacementAgent
  onViewAllOpportunities: () => void
}) {
  const eligible = agent.opportunities.filter((o) => o.eligible).length

  return (
    <aside className={cn(CARD, "flex flex-col overflow-hidden")}>
      <div className="border-b border-[#f1f5f9] px-4 py-4">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">{agent.name}</h2>
        <p className="mt-0.5 text-[11px] text-[#64748b]">{agent.geography}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusChip
            label={agent.commissionStatus}
            className={commissionStatusClass(agent.commissionStatus)}
          />
          <StatusChip
            label={`${agent.feePct}% fee`}
            className="bg-[#f1f5f9] text-[#64748b]"
          />
        </div>
        <dl className="mt-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Retainer</dt>
            <dd className="font-medium text-[#0f172a]">{agent.retainer}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Period</dt>
            <dd className="text-[#64748b]">{agent.period}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Owner</dt>
            <dd className="text-[#64748b]">{agent.owner}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Appointed</dt>
            <dd className="text-[#64748b]">{agent.appointedAt}</dd>
          </div>
        </dl>
      </div>

      {agent.exclusions.length > 0 ? (
        <div className="border-b border-[#f1f5f9] px-4 py-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Exclusions</p>
          <ul className="mt-2 space-y-1">
            {agent.exclusions.map((ex) => (
              <li key={ex} className="flex items-start gap-1.5 text-[11px] text-[#64748b]">
                <Ban className="mt-0.5 h-3 w-3 shrink-0 text-[#dc2626]" />
                {ex}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[#0f172a]">Introduced Opportunities</h3>
          <span className="text-[11px] tabular-nums text-[#64748b]">
            {eligible}/{agent.opportunities.length} eligible
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {agent.opportunities.slice(0, 4).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-[#0f172a]">{o.investor}</p>
                <p className="text-[10px] text-[#94a3b8]">{o.amount}</p>
              </div>
              <StatusChip
                label={o.eligible ? "Eligible" : "Excluded"}
                className={
                  o.eligible ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#dc2626]"
                }
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-[11px] font-medium text-[#2563eb] hover:underline"
          onClick={onViewAllOpportunities}
        >
          View all introduced opportunities &gt;
        </button>
      </div>
    </aside>
  )
}

export function FundraisingPlacementAgents() {
  const [agents, setAgents] = useState(PLACEMENT_AGENTS)
  const [selectedId, setSelectedId] = useState(PLACEMENT_AGENTS[0].id)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [oppsOpen, setOppsOpen] = useState(false)
  const [form, setForm] = useState({
    name: "Emerging Markets Capital Ltd",
    geography: GEOGRAPHY_OPTIONS[0],
    feePct: "1.0",
    retainer: "US$15,000 / quarter",
    period: "Jan 2026 – Dec 2027",
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return agents
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.geography.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q),
    )
  }, [agents, search])

  const selected = agents.find((a) => a.id === selectedId) ?? agents[0]

  function addAppointment() {
    if (!form.name.trim()) return
    const next: PlacementAgent = {
      id: `pa-${Date.now()}`,
      name: form.name.trim(),
      geography: form.geography,
      feePct: parseFloat(form.feePct) || 1,
      retainer: form.retainer.trim() || "None",
      period: form.period,
      introducedCount: 0,
      commissionStatus: "Accruing" as CommissionStatus,
      exclusions: [],
      opportunities: [],
      appointedAt: "15 Jul 2026",
      owner: "You",
    }
    setAgents((prev) => [next, ...prev])
    setSelectedId(next.id)
    setCreateOpen(false)
    setForm({
      name: "Emerging Markets Capital Ltd",
      geography: GEOGRAPHY_OPTIONS[0],
      feePct: "1.0",
      retainer: "US$15,000 / quarter",
      period: "Jan 2026 – Dec 2027",
    })
    toast.success("Placement agent appointment created")
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Placement Agents</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Agent appointments, geography coverage and commission-eligible opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            onClick={() => toast.success("Export started")}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Appointment
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEMENT_AGENT_KPIS.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(CARD, "overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Appointments</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {agents.length}
              </span>
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="h-8 rounded-[6px] border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {[
                    "Agent",
                    "Geography",
                    "Fee",
                    "Retainer",
                    "Period",
                    "Introduced",
                    "Commission",
                    "Owner",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "cursor-pointer border-b border-[#f1f5f9] last:border-0",
                      selectedId === a.id ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="px-3 py-2.5 text-[12px] font-medium text-[#0f172a]">{a.name}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{a.geography}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#0f172a]">
                      {a.feePct}%
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{a.retainer}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#94a3b8]">{a.period}</td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[#0f172a]">
                      {a.introducedCount}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusChip
                        label={a.commissionStatus}
                        className={commissionStatusClass(a.commissionStatus)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{a.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? (
          <DetailPanel agent={selected} onViewAllOpportunities={() => setOppsOpen(true)} />
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Placement Agent Appointment"
        steps={[{ id: "agent", short: "1", label: "Agent" }, { id: "terms", short: "2", label: "Commercial terms" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Create appointment"
        validateStep={(step) => step === "agent" && !form.name.trim() ? ["Agent name is required"] : []}
        onSubmit={addAppointment}
      >
        {(step) => step === "agent" ? <div className="space-y-3">
          <FrField label="Agent name">
            <input
              className={frInputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Emerging Markets Capital Ltd"
            />
          </FrField>
          <FrField label="Geography">
            <select
              className={frSelectClass}
              value={form.geography}
              onChange={(e) => setForm((f) => ({ ...f, geography: e.target.value }))}
            >
              {GEOGRAPHY_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FrField>
        </div> : step === "terms" ? <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FrField label="Fee (%)">
              <input
                className={frInputClass}
                type="number"
                step="0.05"
                min="0"
                value={form.feePct}
                onChange={(e) => setForm((f) => ({ ...f, feePct: e.target.value }))}
              />
            </FrField>
            <FrField label="Retainer">
              <input
                className={frInputClass}
                value={form.retainer}
                onChange={(e) => setForm((f) => ({ ...f, retainer: e.target.value }))}
                placeholder="US$15,000 / quarter"
              />
            </FrField>
          </div>
          <FrField label="Appointment period">
            <input
              className={frInputClass}
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
            />
          </FrField>
        </div> : <ReviewList items={[
          { label: "Agent", value: form.name },
          { label: "Geography", value: form.geography },
          { label: "Fee / retainer", value: `${form.feePct}% · ${form.retainer}` },
          { label: "Period", value: form.period },
        ]} />}
      </FrSimpleWizard>

      <FrViewAllDialog
        open={oppsOpen}
        onOpenChange={setOppsOpen}
        title={`Introduced Opportunities — ${selected?.name ?? ""}`}
        description={`${selected?.introducedCount ?? 0} introductions`}
        rows={(selected?.opportunities ?? []).map((o) => ({
          id: o.id,
          title: o.investor,
          subtitle: o.amount,
          badge: o.eligible ? "Eligible" : "Excluded",
          badgeClass: o.eligible
            ? "bg-[#dcfce7] text-[#15803d]"
            : "bg-[#fee2e2] text-[#dc2626]",
        }))}
      />
    </div>
  )
}
