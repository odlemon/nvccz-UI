"use client"

import { useEffect, useMemo, useState } from "react"
import { Ban, Clock, Coins, Download, Loader2, Plus, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GEOGRAPHY_OPTIONS, commissionStatusClass, type PlacementAgentKpi } from "./placement-agents-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrTableSkeleton,
  FrViewAllDialog,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"
import { fundraisingApi, asNumber, toastFrError } from "@/lib/api/fundraising-api"
import { mapPlacementAgentRow, mapPlacementCommissionRow, moneyLabel } from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const KPI_ICONS = {
  users: Users,
  coins: Coins,
  clock: Clock,
  ban: Ban,
} as const

type MappedAgent = ReturnType<typeof mapPlacementAgentRow>
type AssignedOpportunityVM = {
  id: string
  investor: string
  campaign: string
  opportunity: string
  amount: string
  status: string
  eligible: boolean
}

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

type MappedCommission = ReturnType<typeof mapPlacementCommissionRow>

function DetailPanel({
  agent,
  detailLoading,
  assignedOpportunities,
  onViewAllOpportunities,
  onAssign,
  assignableOpportunities,
  assigning,
  assignTargetId,
  onAssignTargetChange,
  commissions,
  commissionsLoading,
}: {
  agent: MappedAgent
  detailLoading: boolean
  assignedOpportunities: AssignedOpportunityVM[]
  onViewAllOpportunities: () => void
  onAssign: () => void
  assignableOpportunities: Record<string, any>[]
  assigning: boolean
  assignTargetId: string
  onAssignTargetChange: (id: string) => void
  commissions: MappedCommission[]
  commissionsLoading: boolean
}) {
  const eligible = assignedOpportunities.filter((o) => o.eligible).length

  return (
    <aside className={cn(CARD, "flex flex-col overflow-hidden")}>
      <div className="border-b border-[#f1f5f9] px-4 py-4">
        <h2 className="text-[13px] font-semibold text-[#0f172a]">{agent.name}</h2>
        <p className="mt-0.5 text-[11px] text-[#64748b]">{agent.geography}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusChip
            label={agent.commissionStatus ?? "—"}
            className={agent.commissionStatus ? commissionStatusClass(agent.commissionStatus as any) : "bg-[#f1f5f9] text-[#64748b]"}
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
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Accrued commission</dt>
            <dd className="font-medium text-[#0f172a]">{agent.accruedCommissionLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Paid commission</dt>
            <dd className="text-[#64748b]">{agent.paidCommissionLabel}</dd>
          </div>
        </dl>
      </div>

      {agent.exclusions.length > 0 ? (
        <div className="border-b border-[#f1f5f9] px-4 py-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Exclusions</p>
          <ul className="mt-2 space-y-1">
            {agent.exclusions.map((ex: string) => (
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
          <h3 className="text-[12px] font-semibold text-[#0f172a]">Assigned Opportunities</h3>
          <span className="text-[11px] tabular-nums text-[#64748b]">
            {detailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${eligible}/${assignedOpportunities.length} eligible`}
          </span>
        </div>
        {assignedOpportunities.length === 0 ? (
          <p className="mt-2 text-[11px] text-[#94a3b8]">
            {detailLoading ? "Loading assigned opportunities…" : "No opportunities assigned yet."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {assignedOpportunities.slice(0, 4).map((o) => (
              <li key={o.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-[#0f172a]">{o.investor}</p>
                  <p className="truncate text-[10px] text-[#64748b]">{o.campaign} · {o.opportunity}</p>
                  <p className="text-[10px] text-[#94a3b8]">{o.amount}</p>
                </div>
                <StatusChip
                  label={o.status}
                  className={
                    o.eligible ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#dc2626]"
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {assignedOpportunities.length > 0 ? (
          <button
            type="button"
            className="mt-3 text-[11px] font-medium text-[#2563eb] hover:underline"
            onClick={onViewAllOpportunities}
          >
            View all assigned opportunities &gt;
          </button>
        ) : null}
      </div>

      <div className="border-t border-[#f1f5f9] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[#0f172a]">Commissions</h3>
          <span className="text-[11px] tabular-nums text-[#64748b]">
            {commissionsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : `${commissions.length}`}
          </span>
        </div>
        {commissions.length === 0 ? (
          <p className="mt-2 text-[11px] text-[#94a3b8]">
            {commissionsLoading ? "Loading commissions…" : "No commission entries recorded yet."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {commissions.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-[#0f172a]">{c.investor}</p>
                  <p className="text-[10px] text-[#94a3b8]">{c.amount} · {c.date}</p>
                </div>
                <StatusChip
                  label={c.status}
                  className={c.status ? commissionStatusClass(c.status as any) : "bg-[#f1f5f9] text-[#64748b]"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto border-t border-[#f1f5f9] px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold text-[#0f172a]">Assign Opportunity</p>
        <div className="flex gap-2">
          <select
            className={cn(frSelectClass, "h-8 rounded-full text-[11px]")}
            value={assignTargetId}
            onChange={(e) => onAssignTargetChange(e.target.value)}
          >
            <option value="">
              {assignableOpportunities.length ? "Select opportunity" : "No unassigned opportunities"}
            </option>
            {assignableOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {(o.investor?.legalName || o.investorName || "Investor")} · {(o.campaign?.name || o.campaignName || "Campaign")}
              </option>
            ))}
          </select>
          <Button
            variant="gradient-info"
            className="h-8 shrink-0 rounded-full px-3 text-[11px] font-semibold"
            disabled={!assignTargetId || assigning}
            onClick={onAssign}
          >
            {assigning ? "Assigning…" : "Assign"}
          </Button>
        </div>
      </div>
    </aside>
  )
}

const CREATE_FORM_DEFAULT = {
  legalName: "",
  territory: GEOGRAPHY_OPTIONS[0],
  commissionPct: "1.0",
  retainer: "",
  successFee: "",
  protectedUntil: "",
  investorRestrictions: "",
  supportingAgreement: "",
  appointmentStart: "",
  appointmentEnd: "",
}

export function FundraisingPlacementAgents() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [oppsOpen, setOppsOpen] = useState(false)
  const [form, setForm] = useState(CREATE_FORM_DEFAULT)
  const [editForm, setEditForm] = useState(CREATE_FORM_DEFAULT)
  const [editing, setEditing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [rawAgents, setRawAgents] = useState<Record<string, any>[]>([])
  const [detailById, setDetailById] = useState<Record<string, Record<string, any>>>({})
  const [detailLoading, setDetailLoading] = useState(false)

  const [allOpportunities, setAllOpportunities] = useState<Record<string, any>[]>([])
  const [assignTargetId, setAssignTargetId] = useState("")
  const [assigning, setAssigning] = useState(false)

  const [commissionsById, setCommissionsById] = useState<Record<string, Record<string, any>[]>>({})
  const [commissionsLoading, setCommissionsLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const agents = await fundraisingApi.listPlacementAgents()
      setRawAgents(agents ?? [])
    } catch (err) {
      toastFrError(err, "Could not load placement agents")
      setRawAgents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    fundraisingApi
      .listOpportunities()
      .then((res) => setAllOpportunities(res ?? []))
      .catch(() => setAllOpportunities([]))
  }, [])

  const mapped = useMemo(() => rawAgents.map((raw, idx) => mapPlacementAgentRow(raw, idx)), [rawAgents])

  const merged = useMemo(
    () =>
      mapped.map((agent) => {
        const detail = detailById[agent.id]
        return detail ? mapPlacementAgentRow(detail, mapped.findIndex((a) => a.id === agent.id)) : agent
      }),
    [mapped, detailById],
  )

  const kpis: PlacementAgentKpi[] = useMemo(() => {
    let introduced = 0
    let eligibleAmount = 0
    let excluded = 0
    for (const agent of merged) {
      introduced += agent.opportunities.length
      for (const o of agent.opportunities as Array<{ eligible: boolean; amountRaw?: number }>) {
        if (o.eligible) eligibleAmount += o.amountRaw ?? 0
        else excluded += 1
      }
    }
    return [
      {
        id: "agents",
        label: "Active Appointments",
        value: loading ? "—" : String(merged.length),
        sublabel: "Placement agent appointments",
        icon: "users",
        iconColor: "#7c3aed",
        iconBg: "#f3e8ff",
      },
      {
        id: "introduced",
        label: "Introduced Opportunities",
        value: loading ? "—" : String(introduced),
        sublabel: "Commission-eligible pipeline",
        icon: "coins",
        iconColor: "#2563eb",
        iconBg: "#dbeafe",
      },
      {
        id: "eligible-amount",
        label: "Eligible Pipeline",
        value: loading ? "—" : moneyLabel(eligibleAmount),
        sublabel: "Sum of eligible introduced amounts",
        icon: "clock",
        iconColor: "#d97706",
        iconBg: "#ffedd5",
      },
      {
        id: "exclusions",
        label: "Exclusion Conflicts",
        value: loading ? "—" : String(excluded),
        sublabel: "Introductions marked ineligible",
        icon: "ban",
        iconColor: "#dc2626",
        iconBg: "#fee2e2",
      },
    ]
  }, [merged, loading])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return merged
    return merged.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.geography.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q),
    )
  }, [merged, search])

  const selected = filtered.find((a) => a.id === selectedId) ?? null

  useEffect(() => {
    if (!loading && merged.length > 0 && !merged.find((a) => a.id === selectedId)) {
      setSelectedId(merged[0].id)
    }
  }, [loading, merged, selectedId])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setDetailLoading(true)
    fundraisingApi
      .getPlacementAgent(selectedId)
      .then((res) => {
        if (cancelled) return
        setDetailById((prev) => ({ ...prev, [selectedId]: res }))
      })
      .catch(() => {
        // detail endpoint optional — list data remains the fallback
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    setCommissionsLoading(true)
    fundraisingApi
      .listPlacementCommissions(selectedId)
      .then((res) => {
        if (cancelled) return
        setCommissionsById((prev) => ({ ...prev, [selectedId]: res ?? [] }))
      })
      .catch(() => {
        if (!cancelled) setCommissionsById((prev) => ({ ...prev, [selectedId]: [] }))
      })
      .finally(() => {
        if (!cancelled) setCommissionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selectedCommissions = useMemo(
    () => (selected ? (commissionsById[selected.id] ?? []).map(mapPlacementCommissionRow) : []),
    [selected, commissionsById],
  )

  const selectedAssignedOpportunities = useMemo<AssignedOpportunityVM[]>(() => {
    if (!selected) return []
    const detail = detailById[selected.id]
    const sourceItems =
      (Array.isArray(detail?.assignments) && detail.assignments) ||
      (Array.isArray(detail?.assignedOpportunities) && detail.assignedOpportunities) ||
      (Array.isArray(detail?.opportunities) && detail.opportunities) ||
      (Array.isArray(detail?.introducedOpportunities) && detail.introducedOpportunities) ||
      []

    return sourceItems.map((assignment: Record<string, any>, index: number) => {
      const embedded = assignment.opportunity && typeof assignment.opportunity === "object"
        ? assignment.opportunity
        : assignment
      const opportunityId = String(assignment.opportunityId || embedded.id || "")
      const listed = allOpportunities.find((opportunity) => String(opportunity.id) === opportunityId) || {}
      const opportunity = { ...listed, ...embedded }
      const investor =
        opportunity.investor?.legalName ||
        opportunity.investorName ||
        assignment.investor?.legalName ||
        assignment.investorName ||
        "Investor not named"
      const campaign =
        opportunity.campaign?.name ||
        opportunity.campaignName ||
        assignment.campaign?.name ||
        assignment.campaignName ||
        "Campaign not named"
      const opportunityName =
        opportunity.name ||
        opportunity.title ||
        opportunity.opportunityName ||
        assignment.opportunityName ||
        "Opportunity not named"
      const amount =
        opportunity.indicativeAmount ??
        opportunity.softCircleAmount ??
        opportunity.signedAmount ??
        opportunity.commitmentAmount ??
        opportunity.amount
      const eligible = assignment.eligible !== false && opportunity.eligible !== false
      const status = String(assignment.status || opportunity.status || (eligible ? "ELIGIBLE" : "EXCLUDED"))
        .replace(/_/g, " ")

      return {
        id: opportunityId || `assigned-${index}`,
        investor,
        campaign,
        opportunity: opportunityName,
        amount: amount == null ? "Amount not recorded" : moneyLabel(amount, opportunity.currency),
        status,
        eligible,
      }
    })
  }, [selected, detailById, allOpportunities])

  const assignedOpportunityIds = useMemo(
    () => new Set(selectedAssignedOpportunities.map((opportunity) => opportunity.id)),
    [selectedAssignedOpportunities],
  )

  const assignableOpportunities = useMemo(
    () => allOpportunities.filter((opportunity) => !assignedOpportunityIds.has(String(opportunity.id))),
    [allOpportunities, assignedOpportunityIds],
  )

  async function addAppointment() {
    if (!form.legalName.trim()) {
      toast.error("Agent name is required")
      throw new Error("validation")
    }
    try {
      await fundraisingApi.createPlacementAgent({
        legalName: form.legalName.trim(),
        territory: form.territory,
        geography: [form.territory],
        commissionPct: asNumber(form.commissionPct),
        retainer: form.retainer ? asNumber(form.retainer) : undefined,
        successFee: form.successFee ? asNumber(form.successFee) : undefined,
        protectedUntil: form.protectedUntil || undefined,
        investorRestrictions: form.investorRestrictions.split(",").map((v) => v.trim()).filter(Boolean),
        supportingAgreement: form.supportingAgreement || undefined,
        appointmentStart: form.appointmentStart || undefined,
        appointmentEnd: form.appointmentEnd || undefined,
      })
      toast.success(`${form.legalName.trim()} added as placement agent`)
      setForm(CREATE_FORM_DEFAULT)
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not create placement agent")
      throw err
    }
  }

  function openEditSelected() {
    if (!selected) return
    const raw = detailById[selected.id] || selected.raw || {}
    const territory = raw.territory || (Array.isArray(raw.geography) ? raw.geography[0] : raw.geography) || ""
    const dateValue = (value: unknown) => value ? String(value).slice(0, 10) : ""
    const restrictions = raw.investorRestrictions || raw.restrictions || []
    setEditForm({
      legalName: raw.legalName || raw.name || selected.name,
      territory,
      commissionPct: String(raw.commissionPct ?? selected.feePct ?? ""),
      retainer: raw.retainer == null ? "" : String(raw.retainer),
      successFee: raw.successFee == null ? "" : String(raw.successFee),
      protectedUntil: dateValue(raw.protectedUntil),
      investorRestrictions: Array.isArray(restrictions) ? restrictions.join(", ") : String(restrictions || ""),
      supportingAgreement: String(raw.supportingAgreement || raw.supportingAgreementReference || ""),
      appointmentStart: dateValue(raw.appointmentStart),
      appointmentEnd: dateValue(raw.appointmentEnd),
    })
    setEditOpen(true)
  }

  async function editSelected() {
    if (!selected) return
    setEditing(true)
    try {
      const updated = await fundraisingApi.patchPlacementAgent(selected.id, {
        legalName: editForm.legalName.trim(),
        territory: editForm.territory || undefined,
        geography: editForm.territory ? [editForm.territory] : undefined,
        commissionPct: asNumber(editForm.commissionPct),
        retainer: editForm.retainer ? asNumber(editForm.retainer) : null,
        successFee: editForm.successFee ? asNumber(editForm.successFee) : null,
        appointmentStart: editForm.appointmentStart || null,
        appointmentEnd: editForm.appointmentEnd || null,
        protectedUntil: editForm.protectedUntil || null,
        investorRestrictions: editForm.investorRestrictions.split(",").map((value) => value.trim()).filter(Boolean),
        supportingAgreement: editForm.supportingAgreement.trim() || null,
      })
      setDetailById((previous) => ({ ...previous, [selected.id]: updated }))
      setEditOpen(false)
      toast.success("Appointment updated")
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not update appointment")
    } finally {
      setEditing(false)
    }
  }

  function exportPlacementAgents() {
    exportFundraisingCsv(
      filtered,
      [
        { key: "name", label: "Agent" },
        { key: "geography", label: "Geography" },
        { key: "feePct", label: "Commission (%)" },
        { key: "retainer", label: "Retainer" },
        { key: "period", label: "Appointment period" },
        { key: "introducedCount", label: "Assigned opportunities" },
        { key: "commissionStatus", label: "Commission status" },
        { key: "accruedCommissionLabel", label: "Accrued commission" },
        { key: "paidCommissionLabel", label: "Paid commission" },
        { key: "owner", label: "Owner" },
      ],
      "fundraising-placement-agents",
    )
    toast.success(`Exported ${filtered.length} placement agents`)
  }

  async function handleAssign() {
    if (!selected || !assignTargetId) return
    setAssigning(true)
    try {
      await fundraisingApi.assignPlacementOpportunity(selected.id, assignTargetId)
      toast.success("Opportunity assigned")
      setAssignTargetId("")
      const detail = await fundraisingApi.getPlacementAgent(selected.id)
      setDetailById((prev) => ({ ...prev, [selected.id]: detail }))
    } catch (err) {
      toastFrError(err, "Could not assign opportunity")
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#0f172a] md:text-[22px]">
            Placement Agents
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#94a3b8]" /> : null}
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Agent appointments, geography coverage and commission-eligible opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            disabled={loading || filtered.length === 0}
            onClick={exportPlacementAgents}
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
          <Button type="button" variant="outline" className="h-9 rounded-full px-4" disabled={!selected || detailLoading || editing} onClick={openEditSelected}>
            {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editing ? "Saving…" : "Edit Appointment"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(CARD, "overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Appointments</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {merged.length}
              </span>
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                className="h-8 rounded-full border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
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
                {loading ? (
                  <FrTableSkeleton columns={8} rows={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-[13px] text-[#94a3b8]">
                      {merged.length === 0 ? "No placement agents appointed yet." : "No agents match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
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
                          label={a.commissionStatus ?? "—"}
                          className={a.commissionStatus ? commissionStatusClass(a.commissionStatus as any) : "bg-[#f1f5f9] text-[#64748b]"}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{a.owner}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? (
          <DetailPanel
            agent={selected}
            detailLoading={detailLoading}
            assignedOpportunities={selectedAssignedOpportunities}
            onViewAllOpportunities={() => setOppsOpen(true)}
            onAssign={handleAssign}
            assignableOpportunities={assignableOpportunities}
            assigning={assigning}
            assignTargetId={assignTargetId}
            onAssignTargetChange={setAssignTargetId}
            commissions={selectedCommissions}
            commissionsLoading={commissionsLoading}
          />
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Placement Agent Appointment"
        steps={[{ id: "agent", short: "1", label: "Agent" }, { id: "terms", short: "2", label: "Commercial terms" }, { id: "review", short: "3", label: "Review" }]}
        submitLabel="Create appointment"
        validateStep={(step) => step === "agent" && !form.legalName.trim() ? ["Agent name is required"] : []}
        onFinish={addAppointment}
      >
        {(step) => step === "agent" ? <div className="space-y-3">
          <FrField label="Agent legal name">
            <input
              className={cn(frInputClass, "rounded-full")}
              value={form.legalName}
              onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
              placeholder="e.g. Emerging Markets Capital Ltd"
            />
          </FrField>
          <FrField label="Territory">
            <select
              className={cn(frSelectClass, "rounded-full")}
              value={form.territory}
              onChange={(e) => setForm((f) => ({ ...f, territory: e.target.value }))}
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
            <FrField label="Commission (%)">
              <input
                className={cn(frInputClass, "rounded-full")}
                type="number"
                step="0.05"
                min="0"
                value={form.commissionPct}
                onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
              />
            </FrField>
            <FrField label="Retainer (US$, optional)">
              <input
                className={cn(frInputClass, "rounded-full")}
                value={form.retainer}
                onChange={(e) => setForm((f) => ({ ...f, retainer: e.target.value }))}
                placeholder="15000"
              />
            </FrField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FrField label="Success fee (optional)">
              <input className={cn(frInputClass, "rounded-full")} value={form.successFee} onChange={(e) => setForm((f) => ({ ...f, successFee: e.target.value }))} />
            </FrField>
            <FrField label="Protected until">
              <input type="date" className={cn(frInputClass, "rounded-full")} value={form.protectedUntil} onChange={(e) => setForm((f) => ({ ...f, protectedUntil: e.target.value }))} />
            </FrField>
          </div>
          <FrField label="Investor restrictions (comma separated)">
            <input className={cn(frInputClass, "rounded-full")} value={form.investorRestrictions} onChange={(e) => setForm((f) => ({ ...f, investorRestrictions: e.target.value }))} />
          </FrField>
          <FrField label="Supporting agreement reference">
            <input className={cn(frInputClass, "rounded-full")} value={form.supportingAgreement} onChange={(e) => setForm((f) => ({ ...f, supportingAgreement: e.target.value }))} />
          </FrField>
          <div className="grid grid-cols-2 gap-3">
            <FrField label="Appointment start">
              <input type="date" className={cn(frInputClass, "rounded-full")} value={form.appointmentStart} onChange={(e) => setForm((f) => ({ ...f, appointmentStart: e.target.value }))} />
            </FrField>
            <FrField label="Appointment end">
              <input type="date" className={cn(frInputClass, "rounded-full")} value={form.appointmentEnd} onChange={(e) => setForm((f) => ({ ...f, appointmentEnd: e.target.value }))} />
            </FrField>
          </div>
        </div> : <ReviewList items={[
          { label: "Agent", value: form.legalName || "—" },
          { label: "Territory", value: form.territory },
          { label: "Commission / retainer", value: `${form.commissionPct}% · ${form.retainer ? moneyLabel(asNumber(form.retainer)) : "None"}` },
          { label: "Period", value: `${form.appointmentStart || "—"} → ${form.appointmentEnd || "—"}` },
        ]} />}
      </FrSimpleWizard>

      <FrDialogShell
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Placement Agent Appointment"
        description={selected ? `Update commercial terms for ${selected.name}` : undefined}
        size="lg"
        footer={
          <FrFormFooter
            onCancel={() => setEditOpen(false)}
            onSubmit={editSelected}
            submitLabel={editing ? "Saving…" : "Save Appointment"}
            submitDisabled={editing || !editForm.legalName.trim()}
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Agent legal name">
            <input
              className={cn(frInputClass, "rounded-full")}
              value={editForm.legalName}
              disabled={editing}
              onChange={(event) => setEditForm((current) => ({ ...current, legalName: event.target.value }))}
            />
          </FrField>
          <FrField label="Territory">
            <input
              className={cn(frInputClass, "rounded-full")}
              value={editForm.territory}
              disabled={editing}
              onChange={(event) => setEditForm((current) => ({ ...current, territory: event.target.value }))}
              placeholder="e.g. SSA"
            />
          </FrField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FrField label="Commission (%)">
              <input type="number" min="0" step="0.05" className={cn(frInputClass, "rounded-full")} value={editForm.commissionPct} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, commissionPct: event.target.value }))} />
            </FrField>
            <FrField label="Retainer (US$)">
              <input type="number" min="0" className={cn(frInputClass, "rounded-full")} value={editForm.retainer} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, retainer: event.target.value }))} />
            </FrField>
            <FrField label="Success fee">
              <input type="number" min="0" className={cn(frInputClass, "rounded-full")} value={editForm.successFee} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, successFee: event.target.value }))} />
            </FrField>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FrField label="Appointment start">
              <input type="date" className={cn(frInputClass, "rounded-full")} value={editForm.appointmentStart} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, appointmentStart: event.target.value }))} />
            </FrField>
            <FrField label="Appointment end">
              <input type="date" className={cn(frInputClass, "rounded-full")} value={editForm.appointmentEnd} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, appointmentEnd: event.target.value }))} />
            </FrField>
            <FrField label="Protected until">
              <input type="date" className={cn(frInputClass, "rounded-full")} value={editForm.protectedUntil} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, protectedUntil: event.target.value }))} />
            </FrField>
          </div>
          <FrField label="Investor restrictions (comma separated)">
            <input className={cn(frInputClass, "rounded-full")} value={editForm.investorRestrictions} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, investorRestrictions: event.target.value }))} />
          </FrField>
          <FrField label="Supporting agreement reference">
            <input className={cn(frInputClass, "rounded-full")} value={editForm.supportingAgreement} disabled={editing} onChange={(event) => setEditForm((current) => ({ ...current, supportingAgreement: event.target.value }))} />
          </FrField>
        </div>
      </FrDialogShell>

      <FrViewAllDialog
        open={oppsOpen}
        onOpenChange={setOppsOpen}
        title={`Assigned Opportunities — ${selected?.name ?? ""}`}
        description={`${selectedAssignedOpportunities.length} assignments`}
        rows={selectedAssignedOpportunities.map((o) => ({
          id: o.id,
          title: o.investor,
          subtitle: `${o.campaign} · ${o.opportunity} · ${o.amount}`,
          badge: o.status,
          badgeClass: o.eligible
            ? "bg-[#dcfce7] text-[#15803d]"
            : "bg-[#fee2e2] text-[#dc2626]",
        }))}
      />
    </div>
  )
}
