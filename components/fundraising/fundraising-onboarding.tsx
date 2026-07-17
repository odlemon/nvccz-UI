"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  Clock,
  Download,
  Loader2,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  KYC_STATUS_LABEL,
  MANDATE_STATUS_LABEL,
  ONBOARDING_KPIS,
  kycStatusClass,
  mandateStatusClass,
  type KycOnboardingStatus,
  type MandateOnboardingStatus,
} from "./onboarding-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrTableSkeleton,
  FrViewAllDialog,
  FrRequirementsDialog,
  emptyRequirementsState,
  requirementsFromError,
  type FrRequirementsState,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { mapKycCaseToOnboarding, mapMandateToOnboarding } from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const KPI_ICONS = {
  users: Users,
  shield: Shield,
  clock: Clock,
  alert: AlertTriangle,
} as const

type OnboardingRow = ReturnType<typeof mapKycCaseToOnboarding> | ReturnType<typeof mapMandateToOnboarding>
const KYC_LIFECYCLE_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DOCUMENTS_REQUESTED",
  "DOCUMENTS_RECEIVED",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "APPROVED_WITH_CONDITIONS",
  "APPROVED",
  "CLEARED",
  "REJECTED",
  "EXPIRED",
] as const

function safeDisplay(value: unknown, fallback = "Unassigned") {
  const text = String(value || "").trim()
  return !text || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? fallback
    : text
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

function KpiCard({ kpi }: { kpi: (typeof ONBOARDING_KPIS)[number] }) {
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

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-[2px] bg-[#f1f5f9]">
        <div
          className="h-full rounded-[2px] bg-[#7c3aed] transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums text-[#64748b]">{pct}%</span>
    </div>
  )
}

function DetailPanel({
  item,
  onViewAllChecklist,
  onRequestDocs,
  onActivateMandate,
  onToggleMandateFlag,
  requestingDocs,
  activating,
  togglingKey,
}: {
  item: OnboardingRow
  onViewAllChecklist: () => void
  onRequestDocs: () => void
  onActivateMandate: () => void
  onToggleMandateFlag: (key: string, value: boolean) => void
  requestingDocs: boolean
  activating: boolean
  togglingKey: string | null
}) {
  const isMandate = item.kind === "MANDATE"
  const done = item.checklist.filter((c) => c.done).length
  const total = item.checklist.length

  return (
    <aside className={cn(CARD, "flex flex-col overflow-hidden")}>
      <div className="border-b border-[#f1f5f9] px-4 py-4">
        <div className="flex items-start gap-2">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-[#0f172a]">{safeDisplay(item.investor, "Investor")}</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">
              {item.type} · {safeDisplay(item.campaign, "No campaign")}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusChip
            label={KYC_STATUS_LABEL[item.kycStatus as KycOnboardingStatus] ?? item.kycStatus}
            className={kycStatusClass(item.kycStatus as KycOnboardingStatus)}
          />
          {item.mandateStatus ? (
            <StatusChip
              label={MANDATE_STATUS_LABEL[item.mandateStatus as MandateOnboardingStatus] ?? item.mandateStatus}
              className={mandateStatusClass(item.mandateStatus as MandateOnboardingStatus)}
            />
          ) : null}
        </div>
        {item.complianceHold ? (
          <div className="mt-3 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 text-[11px] text-[#b91c1c]">
            Compliance hold — cannot admit, fund, or activate until cleared.
          </div>
        ) : null}
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-[#94a3b8]">Owner</span>
          <span className="font-medium text-[#0f172a]">{safeDisplay(item.owner)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-[#94a3b8]">Started</span>
          <span className="text-[#64748b]">{item.startedAt}</span>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-[#0f172a]">
            {isMandate ? "Activation Checklist" : "Readiness Checklist"}
          </h3>
          <span className="text-[11px] tabular-nums text-[#64748b]">
            {done}/{total}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
          <div
            className="h-full rounded-[2px] bg-[#16a34a] transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
        <ul className="mt-3 space-y-2">
          {item.checklist.slice(0, 5).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span className={cn("text-[11px]", c.done ? "text-[#64748b]" : "text-[#0f172a]")}>
                {c.label}
              </span>
              {isMandate ? (
                <button
                  type="button"
                  disabled={togglingKey === c.id}
                  onClick={() => onToggleMandateFlag(c.id, !c.done)}
                  aria-label={c.label}
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full disabled:opacity-50",
                    c.done ? "bg-[#16a34a] text-white" : "border border-[#cbd5e1] bg-white",
                  )}
                >
                  {c.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                </button>
              ) : (
                <span
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                    c.done ? "bg-[#16a34a] text-white" : "border border-[#cbd5e1] bg-white",
                  )}
                >
                  {c.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                </span>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-[11px] font-medium text-[#2563eb] hover:underline"
          onClick={onViewAllChecklist}
        >
          View full checklist &gt;
        </button>
      </div>

      <div className="mt-auto border-t border-[#f1f5f9] px-4 py-3">
        {isMandate ? (
          <Button
            variant="gradient-info"
            className="h-8 w-full rounded-full text-[11px] font-semibold"
            disabled={item.complianceHold || item.mandateStatus === "ACTIVE" || activating}
            onClick={onActivateMandate}
          >
            {activating ? "Activating…" : item.mandateStatus === "ACTIVE" ? "Mandate Active" : "Activate Mandate"}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-8 w-full rounded-full text-[11px]"
            disabled={item.complianceHold || item.kycStatus === "DOCUMENTS_REQUESTED" || requestingDocs}
            onClick={onRequestDocs}
          >
            {requestingDocs ? "Sending…" : "Request Documents"}
          </Button>
        )}
      </div>
    </aside>
  )
}

export function FundraisingOnboarding() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [docsNote, setDocsNote] = useState("")
  const [kycLifecycleOpen, setKycLifecycleOpen] = useState(false)
  const [kycTargetStatus, setKycTargetStatus] = useState("UNDER_REVIEW")
  const [kycDocsNote, setKycDocsNote] = useState("")
  const [kycNotes, setKycNotes] = useState("")
  const [requirements, setRequirements] = useState<FrRequirementsState>(emptyRequirementsState)

  const [loading, setLoading] = useState(true)
  const [rawKycCases, setRawKycCases] = useState<Record<string, any>[]>([])
  const [rawMandates, setRawMandates] = useState<Record<string, any>[]>([])
  const [rawInvestors, setRawInvestors] = useState<Record<string, any>[]>([])
  const [rawCampaigns, setRawCampaigns] = useState<Record<string, any>[]>([])

  const [requestingDocs, setRequestingDocs] = useState(false)
  const [updatingKyc, setUpdatingKyc] = useState(false)
  const [activating, setActivating] = useState(false)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  // Start-onboarding wizard
  const [wizardInvestors, setWizardInvestors] = useState<Record<string, any>[]>([])
  const [wizardLoadingInvestors, setWizardLoadingInvestors] = useState(false)
  const [form, setForm] = useState({ investorId: "", riskRating: "MEDIUM" })

  async function loadData() {
    setLoading(true)
    try {
      const [kycCases, mandates, investors, campaigns] = await Promise.all([
        fundraisingApi.listKycCases(),
        fundraisingApi.listMandates(),
        fundraisingApi.listInvestors({ pageSize: 200 }),
        fundraisingApi.listCampaigns(),
      ])
      setRawKycCases(kycCases ?? [])
      setRawMandates(mandates ?? [])
      setRawInvestors(investors?.items ?? [])
      setRawCampaigns(campaigns ?? [])
    } catch (err) {
      toastFrError(err, "Could not load onboarding cases")
      setRawKycCases([])
      setRawMandates([])
      setRawInvestors([])
      setRawCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const investorsById = useMemo(() => {
    const map: Record<string, any> = {}
    rawInvestors.forEach((i) => {
      map[String(i.id)] = i
    })
    return map
  }, [rawInvestors])

  const campaignsById = useMemo(() => {
    const map: Record<string, any> = {}
    rawCampaigns.forEach((c) => {
      map[String(c.id)] = c
    })
    return map
  }, [rawCampaigns])

  const cases: OnboardingRow[] = useMemo(() => {
    const kycRows = rawKycCases.map((c) => mapKycCaseToOnboarding(c, investorsById))
    const mandateRows = rawMandates.map((m) => mapMandateToOnboarding(m, investorsById, campaignsById))
    return [...kycRows, ...mandateRows]
  }, [rawKycCases, rawMandates, investorsById, campaignsById])

  const kpis = useMemo(() => {
    const active = cases.length
    const cleared = cases.filter((c) =>
      c.kind === "MANDATE"
        ? c.mandateStatus === "ACTIVE"
        : ["APPROVED", "APPROVED_WITH_CONDITIONS", "CLEARED"].includes(c.kycStatus),
    ).length
    const inReview = cases.filter((c) =>
      c.kind === "MANDATE"
        ? ["ONBOARDING", "ASSETS_IN_TRANSITION", "PARTIALLY_FUNDED"].includes(c.mandateStatus || "")
        : ["UNDER_REVIEW", "DOCUMENTS_REQUESTED", "IN_PROGRESS"].includes(c.kycStatus),
    ).length
    const holds = cases.filter((c) => c.complianceHold).length
    return ONBOARDING_KPIS.map((kpi) => {
      switch (kpi.id) {
        case "active":
          return { ...kpi, value: String(active) }
        case "kyc-approved":
          return { ...kpi, value: String(cleared) }
        case "in-review":
          return { ...kpi, value: String(inReview) }
        case "holds":
          return { ...kpi, value: String(holds) }
        default:
          return kpi
      }
    })
  }, [cases])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cases
    return cases.filter(
      (c) =>
        c.investor.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    )
  }, [cases, search])

  const selected = filtered.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (!loading && cases.length > 0 && !cases.find((c) => c.id === selectedId)) {
      setSelectedId(cases[0].id)
    }
  }, [loading, cases, selectedId])

  const holdBanner = selected?.complianceHold

  useEffect(() => {
    if (!createOpen) return
    setWizardLoadingInvestors(true)
    fundraisingApi
      .listInvestors({ pageSize: 200 })
      .then((res) => setWizardInvestors(res.items ?? []))
      .catch(() => setWizardInvestors([]))
      .finally(() => setWizardLoadingInvestors(false))
  }, [createOpen])

  async function startCase() {
    if (!form.investorId) {
      toast.error("Investor is required")
      throw new Error("validation")
    }
    try {
      await fundraisingApi.createKycCase({
        investorId: form.investorId,
        status: "NOT_STARTED",
        riskRating: form.riskRating,
      })
      const investorName =
        wizardInvestors.find((i) => String(i.id) === form.investorId)?.legalName || "Investor"
      toast.success(`Onboarding case started for ${investorName}`)
      setForm({ investorId: "", riskRating: "MEDIUM" })
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not start onboarding case")
      throw err
    }
  }

  async function requestDocuments() {
    if (!selected || selected.kind !== "KYC") return
    setRequestingDocs(true)
    try {
      await fundraisingApi.patchKycCase(String(selected.raw.id), {
        status: "DOCUMENTS_REQUESTED",
        docsNote: docsNote.trim() || undefined,
      })
      setDocsOpen(false)
      setDocsNote("")
      toast.success(`Document request sent to ${safeDisplay(selected.investor, "investor")}`)
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not send document request")
    } finally {
      setRequestingDocs(false)
    }
  }

  async function activateMandateCase() {
    if (!selected || selected.kind !== "MANDATE") return
    setActivating(true)
    try {
      await fundraisingApi.activateMandate(String((selected as any).mandateId))
      toast.success(`${safeDisplay(selected.investor, "Investor")} mandate activated`)
      await loadData()
    } catch (err) {
      const state = requirementsFromError(err, "Mandate cannot be activated")
      if (state.open) setRequirements(state)
      else toastFrError(err, "Mandate cannot be activated")
    } finally {
      setActivating(false)
    }
  }

  function openKycLifecycle(status: string) {
    if (!selected || selected.kind !== "KYC") return
    setKycTargetStatus(status)
    setKycDocsNote(String(selected.raw.docsNote || ""))
    setKycNotes(String(selected.raw.notes || ""))
    setKycLifecycleOpen(true)
  }

  async function updateKycStatus() {
    if (!selected || selected.kind !== "KYC") return
    setUpdatingKyc(true)
    try {
      await fundraisingApi.patchKycCase(String(selected.raw.id), {
        status: kycTargetStatus,
        docsNote: kycDocsNote.trim() || undefined,
        notes: kycNotes.trim() || undefined,
      })
      toast.success(`KYC status updated to ${kycTargetStatus.replace(/_/g, " ").toLowerCase()}`)
      setKycLifecycleOpen(false)
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not update KYC status")
    } finally {
      setUpdatingKyc(false)
    }
  }

  function exportOnboarding() {
    exportFundraisingCsv(
      filtered,
      [
        { key: "investor", label: "Investor", value: (row) => safeDisplay(row.investor, "Investor") },
        { key: "type", label: "Case type" },
        { key: "kycStatus", label: "KYC status" },
        { key: "mandateStatus", label: "Mandate status" },
        { key: "progress", label: "Progress (%)" },
        { key: "complianceHold", label: "Compliance hold", value: (row) => row.complianceHold ? "Yes" : "No" },
        { key: "owner", label: "Owner", value: (row) => safeDisplay(row.owner) },
        { key: "startedAt", label: "Started" },
      ],
      "fundraising-client-onboarding",
    )
    toast.success(`Exported ${filtered.length} onboarding cases`)
  }

  async function toggleMandateFlag(key: string, value: boolean) {
    if (!selected || selected.kind !== "MANDATE") return
    setTogglingKey(key)
    try {
      await fundraisingApi.patchMandate(String((selected as any).mandateId), { [key]: value })
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not update checklist")
    } finally {
      setTogglingKey(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#0f172a] md:text-[22px]">
            Client Onboarding
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#94a3b8]" /> : null}
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            KYC, compliance readiness and mandate activation
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4 shadow-sm"
            disabled={loading || filtered.length === 0}
            onClick={exportOnboarding}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Start Onboarding
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {holdBanner ? (
        <div className="mt-4 flex items-start gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#dc2626]" />
          <div>
            <p className="text-[12px] font-semibold text-[#b91c1c]">Compliance hold active</p>
            <p className="mt-0.5 text-[11px] text-[#991b1b]">
              {safeDisplay(selected?.investor, "This investor")} cannot be admitted, funded, or activated until the hold is
              released by Compliance.
            </p>
          </div>
        </div>
      ) : null}
      {selected?.kind === "KYC" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="self-center text-[11px] font-medium text-[#64748b]">
            Current: {String(selected.kycStatus).replace(/_/g, " ")}
          </span>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px]" disabled={updatingKyc} onClick={() => openKycLifecycle("UNDER_REVIEW")}>Under review</Button>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px]" disabled={updatingKyc} onClick={() => openKycLifecycle("MORE_INFORMATION_REQUIRED")}>Request more info</Button>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px] text-[#15803d]" disabled={updatingKyc} onClick={() => openKycLifecycle("APPROVED")}>Approved</Button>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px] text-[#15803d]" disabled={updatingKyc} onClick={() => openKycLifecycle("CLEARED")}>Cleared</Button>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px] text-[#b91c1c]" disabled={updatingKyc} onClick={() => openKycLifecycle("REJECTED")}>Reject</Button>
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px]" disabled={updatingKyc} onClick={() => openKycLifecycle(String(selected.kycStatus))}>More actions</Button>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className={cn(CARD, "overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Onboarding Cases</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {cases.length}
              </span>
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="h-8 rounded-full border-[#e2e8f0] bg-white pl-8 text-[12px] shadow-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {[
                    "Investor",
                    "Type",
                    "KYC",
                    "Mandate",
                    "Progress",
                    "Hold",
                    "Owner",
                    "Started",
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
                      {cases.length === 0 ? "No onboarding cases yet." : "No cases match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f1f5f9] last:border-0",
                        selectedId === c.id ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span className="text-[12px] font-medium text-[#0f172a]">{safeDisplay(c.investor, "Investor")}</span>
                        {c.complianceHold ? (
                          <AlertTriangle className="ml-1.5 inline h-3 w-3 text-[#dc2626]" />
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{c.type}</td>
                      <td className="px-3 py-2.5">
                        <StatusChip
                          label={KYC_STATUS_LABEL[c.kycStatus as KycOnboardingStatus] ?? c.kycStatus}
                          className={kycStatusClass(c.kycStatus as KycOnboardingStatus)}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#64748b]">
                        {c.mandateStatus
                          ? MANDATE_STATUS_LABEL[c.mandateStatus as MandateOnboardingStatus] ?? c.mandateStatus
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <ProgressBar pct={c.progress} />
                      </td>
                      <td className="px-3 py-2.5">
                        {c.complianceHold ? (
                          <StatusChip label="Hold" className="bg-[#fee2e2] text-[#dc2626]" />
                        ) : (
                          <span className="text-[11px] text-[#94a3b8]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{safeDisplay(c.owner)}</td>
                      <td className="px-3 py-2.5 text-[11px] text-[#94a3b8]">{c.startedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? (
          <DetailPanel
            item={selected}
            onViewAllChecklist={() => setChecklistOpen(true)}
            onRequestDocs={() => setDocsOpen(true)}
            onActivateMandate={activateMandateCase}
            onToggleMandateFlag={toggleMandateFlag}
            requestingDocs={requestingDocs}
            activating={activating}
            togglingKey={togglingKey}
          />
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Start Onboarding"
        steps={[
          { id: "investor", short: "1", label: "Investor" },
          { id: "risk", short: "2", label: "Risk profile" },
          { id: "review", short: "3", label: "Review" },
        ]}
        submitLabel="Start case"
        validateStep={(step) => (step === "investor" && !form.investorId ? ["Investor is required"] : [])}
        onFinish={startCase}
      >
        {(step) =>
          step === "investor" ? (
            <FrField label="Investor">
              <select
                className={cn(frSelectClass, "rounded-full")}
                value={form.investorId}
                disabled={wizardLoadingInvestors}
                onChange={(e) => setForm((f) => ({ ...f, investorId: e.target.value }))}
              >
                <option value="">{wizardLoadingInvestors ? "Loading investors…" : "Select investor"}</option>
                {wizardInvestors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.legalName || i.name}
                  </option>
                ))}
              </select>
            </FrField>
          ) : step === "risk" ? (
            <FrField label="Risk rating">
              <select
                className={cn(frSelectClass, "rounded-full")}
                value={form.riskRating}
                onChange={(e) => setForm((f) => ({ ...f, riskRating: e.target.value }))}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </FrField>
          ) : (
            <ReviewList
              items={[
                {
                  label: "Investor",
                  value: wizardInvestors.find((i) => String(i.id) === form.investorId)?.legalName || "—",
                },
                { label: "Risk rating", value: form.riskRating },
              ]}
            />
          )
        }
      </FrSimpleWizard>

      <FrDialogShell
        open={docsOpen}
        onOpenChange={setDocsOpen}
        title="Request Documents"
        description={`Send a document request to ${safeDisplay(selected?.investor, "selected case")}`}
        footer={
          <FrFormFooter
            onCancel={() => setDocsOpen(false)}
            onSubmit={requestDocuments}
            submitLabel={requestingDocs ? "Sending…" : "Send Request"}
            submitDisabled={requestingDocs}
          />
        }
      >
        <div className="space-y-3">
          <p className="text-[12px] text-[#64748b]">
            Standard pack: investor profile, UBO declaration, source of funds, and certified ID
            copies.
          </p>
          <FrField label="Additional note (optional)">
            <textarea
              className={cn(frInputClass, "min-h-[72px] resize-none rounded-[22px] py-2")}
              value={docsNote}
              onChange={(e) => setDocsNote(e.target.value)}
              placeholder="Specify any additional documents required..."
            />
          </FrField>
        </div>
      </FrDialogShell>

      <FrDialogShell
        open={kycLifecycleOpen}
        onOpenChange={setKycLifecycleOpen}
        title="Update KYC Lifecycle"
        description={selected ? `${safeDisplay(selected.investor, "Investor")} · current status ${String(selected.kycStatus).replace(/_/g, " ")}` : undefined}
        footer={
          <FrFormFooter
            onCancel={() => setKycLifecycleOpen(false)}
            onSubmit={updateKycStatus}
            submitLabel={updatingKyc ? "Updating…" : "Update KYC"}
            submitDisabled={updatingKyc}
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Target status">
            <select
              className={cn(frSelectClass, "rounded-full")}
              value={kycTargetStatus}
              disabled={updatingKyc}
              onChange={(event) => setKycTargetStatus(event.target.value)}
            >
              {KYC_LIFECYCLE_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Document note (optional)">
            <textarea
              className={cn(frInputClass, "min-h-[72px] resize-none rounded-[22px] py-2")}
              value={kycDocsNote}
              disabled={updatingKyc}
              onChange={(event) => setKycDocsNote(event.target.value)}
              placeholder="Documents received, missing, or requested"
            />
          </FrField>
          <FrField label="Lifecycle notes (optional)">
            <textarea
              className={cn(frInputClass, "min-h-[88px] resize-none rounded-[22px] py-2")}
              value={kycNotes}
              disabled={updatingKyc}
              onChange={(event) => setKycNotes(event.target.value)}
              placeholder="Decision rationale, conditions, or follow-up"
            />
          </FrField>
        </div>
      </FrDialogShell>

      <FrViewAllDialog
        open={checklistOpen}
        onOpenChange={setChecklistOpen}
        title={`${selected?.kind === "MANDATE" ? "Activation" : "Readiness"} Checklist — ${safeDisplay(selected?.investor, "Investor")}`}
        description={`${selected?.progress ?? 0}% complete`}
        rows={(selected?.checklist ?? []).map((c) => ({
          id: c.id,
          title: c.label,
          badge: c.done ? "Done" : "Pending",
          badgeClass: c.done ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#64748b]",
        }))}
      />
      <FrRequirementsDialog
        state={requirements}
        onOpenChange={(open) => setRequirements((current) => ({ ...current, open }))}
      />
    </div>
  )
}
