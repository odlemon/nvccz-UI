"use client"

import { useEffect, useMemo, useState } from "react"
import { Archive, Building2, Download, Loader2, Pencil, Plus, Search, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  kycChipClass,
  kycLabel,
  type InvestorOrg,
} from "./investors-mock-data"
import {
  FrConfirmDialog,
  FrDialogShell,
  FrField,
  FrTableSkeleton,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"
import { FrSimpleWizard, ReviewList } from "./fundraising-create-wizards"
import { fundraisingApi, asNumber, toastFrError } from "@/lib/api/fundraising-api"
import { mapInvestorOrg } from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const INVESTOR_TYPE_OPTIONS: { code: string; label: string }[] = [
  { code: "PENSION_FUND", label: "Pension Fund" },
  { code: "INSURANCE", label: "Insurer" },
  { code: "FAMILY_OFFICE", label: "Family Office" },
  { code: "DFI", label: "DFI" },
  { code: "SOVEREIGN", label: "Sovereign" },
  { code: "BANK", label: "Bank" },
  { code: "CONSULTANT", label: "Consultant" },
  { code: "CORPORATE", label: "Corporate" },
  { code: "FUND_OF_FUNDS", label: "Fund of Funds" },
]

const STATUS_OPTIONS = [
  { code: "ACTIVE", label: "Active" },
  { code: "PROSPECT", label: "Prospect" },
  { code: "INACTIVE", label: "Inactive" },
]

function statusClass(s: InvestorOrg["status"]) {
  if (s === "Active") return "bg-[#dcfce7] text-[#15803d]"
  if (s === "Prospect") return "bg-[#dbeafe] text-[#1d4ed8]"
  return "bg-[#f1f5f9] text-[#64748b]"
}

function DetailPanel({
  org,
  detail,
  relationship,
  detailLoading,
  onClose,
  onEdit,
  onArchive,
}: {
  org: InvestorOrg
  detail: Record<string, any> | null
  relationship: Record<string, any> | null
  detailLoading: boolean
  onClose: () => void
  onEdit: () => void
  onArchive: () => void
}) {
  const [tab, setTab] = useState("overview")
  const contactsCount = Array.isArray(detail?.contacts) ? detail.contacts.length : null
  const opportunitiesCount = Array.isArray(detail?.opportunities) ? detail.opportunities.length : null
  const tabs = [
    ["overview", "Overview"],
    ["contacts", "Contacts"],
    ["opportunities", "Pipeline"],
    ["meetings", "Meetings"],
    ["documents", "Documents"],
    ["communications", "Communications"],
    ["commitments", "Commitments"],
    ["kycCases", "KYC"],
    ["activity", "Activity"],
  ] as const

  const tabRows =
    tab === "activity"
      ? detail?.activity ?? detail?.timeline
      : tab === "kycCases"
        ? detail?.kycCases ?? detail?.kyc
        : detail?.[tab]

  function rowTitle(row: Record<string, any>, index: number) {
    return (
      row.title ||
      row.name ||
      row.fullName ||
      row.subject ||
      row.documentName ||
      row.status ||
      row.type ||
      `Record ${index + 1}`
    )
  }

  function rowMeta(row: Record<string, any>) {
    return [
      row.status,
      row.stageCode || row.currentStage?.stageName,
      row.email,
      row.occurredAt || row.createdAt || row.updatedAt,
    ]
      .filter(Boolean)
      .map(String)
      .join(" · ")
  }

  return (
    <aside className={cn(CARD, "max-h-[calc(100vh-8rem)] overflow-y-auto xl:sticky xl:top-4")}>
      <div className="flex items-start justify-between border-b border-[#f1f5f9] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] text-sm font-bold text-white"
            style={{ backgroundColor: org.logoBg }}
          >
            {org.logoLabel}
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-[#0f172a]">{org.legalName}</h2>
            <p className="mt-0.5 text-[11px] text-[#64748b]">
              {org.type} · {org.country}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-[#94a3b8] hover:bg-[#f1f5f9]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#f1f5f9] px-3 pt-3">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1.5 text-[10px] font-medium",
              tab === id ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f8fafc]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-4 text-[12px]">
        {detailLoading ? (
          <p className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading 360° detail…
          </p>
        ) : null}

        {tab === "overview" ? (
          <>
        {relationship && Object.keys(relationship).length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(relationship)
              .filter(([, value]) => typeof value === "number" || typeof value === "string")
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key} className="rounded-[6px] bg-[#f8fafc] p-2.5">
                  <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                  </p>
                  <p className="mt-0.5 text-[13px] font-semibold text-[#0f172a]">{String(value)}</p>
                </div>
              ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#94a3b8]">Estimated AUM</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{org.estimatedAum}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Ticket range</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{org.ticketRange}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Contacts</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{contactsCount ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#94a3b8]">Open opportunities</p>
            <p className="mt-0.5 font-semibold text-[#0f172a]">{opportunitiesCount ?? org.openOpportunities}</p>
          </div>
        </div>

        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Relationship</p>
          <dl className="mt-2 space-y-2">
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Owner</dt>
              <dd className="font-medium text-[#0f172a]">{org.owner}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Status</dt>
              <dd>
                <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", statusClass(org.status))}>
                  {org.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Last interaction</dt>
              <dd className="text-[#0f172a]">{org.lastInteraction}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Next action</dt>
              <dd className="text-right text-[#0f172a]">{org.nextAction}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Commitments</dt>
              <dd className="font-medium text-[#0f172a]">{org.commitments}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Compliance</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={cn("rounded-[4px] px-2 py-0.5 text-[10px] font-semibold", kycChipClass(org.kycStatus))}>
              KYC: {kycLabel(org.kycStatus)}
            </span>
            <span
              className={cn(
                "rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
                org.sanctionsStatus === "Clear"
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : org.sanctionsStatus === "Flagged"
                    ? "bg-[#fee2e2] text-[#dc2626]"
                    : "bg-[#f1f5f9] text-[#64748b]",
              )}
            >
              Sanctions: {org.sanctionsStatus}
            </span>
          </div>
        </div>

        <div className="border-t border-[#f1f5f9] pt-3">
          <p className="text-[11px] font-semibold text-[#0f172a]">Asset preferences</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {org.assetPreferences.length === 0 ? (
              <span className="text-[11px] text-[#94a3b8]">None on file</span>
            ) : (
              org.assetPreferences.map((p) => (
                <span key={p} className="rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#475569]">
                  {p}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[#f1f5f9] pt-3">
          <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-full px-3 text-[11px] text-[#b91c1c] hover:text-[#b91c1c]"
            onClick={onArchive}
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
        </div>
          </>
        ) : !Array.isArray(tabRows) || tabRows.length === 0 ? (
          <p className="py-8 text-center text-[11px] text-[#94a3b8]">
            No {tabs.find(([id]) => id === tab)?.[1].toLowerCase()} on file.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f5f9]">
            {tabRows.map((row: Record<string, any>, index: number) => (
              <li key={String(row.id ?? index)} className="py-2.5">
                <p className="font-medium text-[#0f172a]">{rowTitle(row, index)}</p>
                <p className="mt-0.5 text-[10px] text-[#94a3b8]">{rowMeta(row) || "No further detail"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

const CREATE_FORM_DEFAULT = {
  legalName: "",
  tradingName: "",
  registrationNumber: "",
  investorType: INVESTOR_TYPE_OPTIONS[0].code,
  countryCode: "",
  jurisdiction: "",
  relationshipOwnerId: "",
  estimatedAum: "",
  ticketMin: "",
  ticketMax: "",
  kycStatus: "NOT_STARTED",
  sanctionsStatus: "NOT_SCREENED",
  riskRating: "",
  investorClassification: "",
  assetClassPreferences: "",
  geographicInterests: "",
  nextAction: "",
}

const EDIT_FORM_DEFAULT = {
  legalName: "",
  tradingName: "",
  investorType: INVESTOR_TYPE_OPTIONS[0].code,
  countryCode: "",
  jurisdiction: "",
  estimatedAum: "",
  ticketMin: "",
  ticketMax: "",
  nextAction: "",
}

export function FundraisingInvestors() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(CREATE_FORM_DEFAULT)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [archiveSaving, setArchiveSaving] = useState(false)
  const [editForm, setEditForm] = useState(EDIT_FORM_DEFAULT)

  const [loading, setLoading] = useState(true)
  const [rawInvestors, setRawInvestors] = useState<Record<string, any>[]>([])
  const [detail, setDetail] = useState<Record<string, any> | null>(null)
  const [relationship, setRelationship] = useState<Record<string, any> | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const handle = setTimeout(() => {
      setLoading(true)
      fundraisingApi
        .listInvestors({
          q: search.trim() || undefined,
          investorType: typeFilter !== "all" ? typeFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          pageSize: 100,
        })
        .then((res) => {
          if (cancelled) return
          setRawInvestors(res.items ?? [])
        })
        .catch((err) => {
          if (cancelled) return
          toastFrError(err, "Could not load investors")
          setRawInvestors([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, search ? 350 : 0)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [search, typeFilter, statusFilter])

  const mapped = useMemo(
    () => rawInvestors.map((raw, idx) => mapInvestorOrg(raw, idx)),
    [rawInvestors],
  )

  const owners = useMemo(
    () => Array.from(new Set(mapped.map((o) => o.owner).filter((o) => o && o !== "—"))).sort(),
    [mapped],
  )

  const filtered = useMemo(() => {
    return mapped.filter((o) => {
      if (ownerFilter !== "all" && o.owner !== ownerFilter) return false
      return true
    })
  }, [mapped, ownerFilter])

  const selected = filtered.find((o) => o.id === selectedId) ?? null

  useEffect(() => {
    const requested = searchParams.get("investorId")
    if (requested && rawInvestors.some((item) => String(item.id) === requested)) {
      setSelectedId(requested)
    }
  }, [searchParams, rawInvestors])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setRelationship(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    Promise.allSettled([
      fundraisingApi.getInvestor360(selectedId),
      fundraisingApi.getRelationshipSummary(selectedId),
    ])
      .then(([detailResult, relationshipResult]) => {
        if (cancelled) return
        setDetail(detailResult.status === "fulfilled" ? detailResult.value : null)
        setRelationship(relationshipResult.status === "fulfilled" ? relationshipResult.value : null)
      })
      .catch((err) => {
        if (!cancelled) {
          toastFrError(err, "Could not load investor detail")
          setDetail(null)
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  async function handleCreate() {
    if (!form.legalName.trim()) {
      toast.error("Legal name is required")
      throw new Error("validation")
    }
    try {
      await fundraisingApi.createInvestor({
        legalName: form.legalName.trim(),
        tradingName: form.tradingName.trim() || undefined,
        registrationNumber: form.registrationNumber.trim() || undefined,
        investorType: form.investorType,
        countryCode: form.countryCode || undefined,
        jurisdiction: form.jurisdiction || undefined,
        relationshipOwnerId: form.relationshipOwnerId || undefined,
        estimatedAum: form.estimatedAum ? asNumber(form.estimatedAum) : undefined,
        typicalMinimumTicket: form.ticketMin ? asNumber(form.ticketMin) : undefined,
        typicalMaximumTicket: form.ticketMax ? asNumber(form.ticketMax) : undefined,
        kycStatus: form.kycStatus,
        sanctionsStatus: form.sanctionsStatus,
        riskRating: form.riskRating || undefined,
        investorClassification: form.investorClassification || undefined,
        assetClassPreferences: form.assetClassPreferences.split(",").map((v) => v.trim()).filter(Boolean),
        geographicInterests: form.geographicInterests.split(",").map((v) => v.trim()).filter(Boolean),
        nextAction: form.nextAction || undefined,
      })
      toast.success(`${form.legalName.trim()} added`)
      setForm(CREATE_FORM_DEFAULT)
      setLoading(true)
      const res = await fundraisingApi.listInvestors({ pageSize: 100 })
      setRawInvestors(res.items ?? [])
      setLoading(false)
    } catch (err) {
      toastFrError(err, "Could not create investor")
      throw err
    }
  }

  function openEditSelected() {
    if (!selected) return
    const raw = rawInvestors.find((item) => String(item.id) === selected.id) ?? {}
    setEditForm({
      legalName: String(raw.legalName || selected.legalName || ""),
      tradingName: String(raw.tradingName || ""),
      investorType: String(raw.investorType || INVESTOR_TYPE_OPTIONS[0].code),
      countryCode: String(raw.countryCode || ""),
      jurisdiction: String(raw.jurisdiction || ""),
      estimatedAum: raw.estimatedAum == null ? "" : String(raw.estimatedAum),
      ticketMin: raw.typicalMinimumTicket == null ? "" : String(raw.typicalMinimumTicket),
      ticketMax: raw.typicalMaximumTicket == null ? "" : String(raw.typicalMaximumTicket),
      nextAction: String(raw.nextAction || ""),
    })
    setEditOpen(true)
  }

  async function saveSelected() {
    if (!selected || !editForm.legalName.trim()) {
      toast.error("Legal name is required")
      return
    }
    setEditSaving(true)
    try {
      await fundraisingApi.patchInvestor(selected.id, {
        legalName: editForm.legalName.trim(),
        tradingName: editForm.tradingName.trim() || undefined,
        investorType: editForm.investorType,
        countryCode: editForm.countryCode.trim().toUpperCase() || undefined,
        jurisdiction: editForm.jurisdiction.trim() || undefined,
        estimatedAum: editForm.estimatedAum ? asNumber(editForm.estimatedAum) : undefined,
        typicalMinimumTicket: editForm.ticketMin ? asNumber(editForm.ticketMin) : undefined,
        typicalMaximumTicket: editForm.ticketMax ? asNumber(editForm.ticketMax) : undefined,
        nextAction: editForm.nextAction.trim() || undefined,
      })
      toast.success("Investor updated")
      const res = await fundraisingApi.listInvestors({ pageSize: 100 })
      setRawInvestors(res.items ?? [])
      setEditOpen(false)
    } catch (err) {
      toastFrError(err, "Could not update investor")
    } finally {
      setEditSaving(false)
    }
  }

  async function archiveSelected() {
    if (!selected) return
    setArchiveSaving(true)
    try {
      await fundraisingApi.patchInvestor(selected.id, { status: "ARCHIVED" })
      toast.success("Investor archived")
      setSelectedId(null)
      setArchiveOpen(false)
      const res = await fundraisingApi.listInvestors({ pageSize: 100 })
      setRawInvestors(res.items ?? [])
    } catch (err) {
      toastFrError(err, "Could not archive investor")
    } finally {
      setArchiveSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
            Investor Organisations
          </h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Institutional investor database — one org, many opportunities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() =>
              exportFundraisingCsv(
                filtered,
                [
                  { key: "legalName", label: "Organisation" },
                  { key: "type", label: "Type" },
                  { key: "country", label: "Country" },
                  { key: "owner", label: "Owner" },
                  { key: "kycStatus", label: "KYC status" },
                  { key: "status", label: "Status" },
                  { key: "estimatedAum", label: "Estimated AUM" },
                  { key: "ticketRange", label: "Ticket range" },
                  { key: "commitments", label: "Commitments" },
                  { key: "nextAction", label: "Next action" },
                  { key: "score", label: "Score" },
                ],
                "fundraising-investors",
              )
            }
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Investor
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 grid items-start gap-4",
          selected ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
        )}
      >
        <div className={cn(CARD, "min-w-0 overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#64748b]" />
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Directory</h2>
              <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {filtered.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <div className="relative sm:w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search organisations..."
                  className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {INVESTOR_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[150px]">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-full rounded-full text-[12px] sm:w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {["Organisation", "Type", "Owner", "KYC", "Status", "Commitments", "Next action", "Score"].map(
                    (h) => (
                      <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <FrTableSkeleton columns={8} rows={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-[13px] text-[#94a3b8]">
                      No investors match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => setSelectedId(org.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f1f5f9] last:border-b-0",
                        selectedId === org.id ? "bg-[#f5f3ff]" : "hover:bg-[#f8fafc]",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[10px] font-bold text-white"
                            style={{ backgroundColor: org.logoBg }}
                          >
                            {org.logoLabel}
                          </span>
                          <div>
                            <p className="text-[12px] font-medium text-[#0f172a]">{org.legalName}</p>
                            <p className="text-[10px] text-[#94a3b8]">{org.country}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{org.type}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#64748b]">{org.owner}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", kycChipClass(org.kycStatus))}>
                          {kycLabel(org.kycStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold", statusClass(org.status))}>
                          {org.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#0f172a]">{org.commitments}</td>
                      <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] text-[#64748b]">{org.nextAction}</td>
                      <td className="px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#0f172a]">{org.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? (
          <DetailPanel
            org={selected}
            detail={detail}
            relationship={relationship}
            detailLoading={detailLoading}
            onClose={() => setSelectedId(null)}
            onEdit={openEditSelected}
            onArchive={() => setArchiveOpen(true)}
          />
        ) : null}
      </div>

      <FrSimpleWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Investor Organisation"
        steps={[
          { id: "identity", short: "1", label: "Organisation" },
          { id: "profile", short: "2", label: "Investment profile" },
          { id: "compliance", short: "3", label: "Compliance" },
          { id: "review", short: "4", label: "Review" },
        ]}
        submitLabel="Create investor"
        validateStep={(step) => (step === "identity" && !form.legalName.trim() ? ["Legal name is required"] : [])}
        onFinish={handleCreate}
      >
        {(step) => step === "identity" ? <div className="space-y-3">
          <FrField label="Legal name">
            <input className={frInputClass} value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} placeholder="e.g. Zim National Infrastructure Pension Fund" />
          </FrField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FrField label="Trading name">
              <input className={frInputClass} value={form.tradingName} onChange={(e) => setForm((f) => ({ ...f, tradingName: e.target.value }))} />
            </FrField>
            <FrField label="Registration number">
              <input className={frInputClass} value={form.registrationNumber} onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))} />
            </FrField>
          </div>
          <FrField label="Investor type">
            <select className={frSelectClass} value={form.investorType} onChange={(e) => setForm((f) => ({ ...f, investorType: e.target.value }))}>
              {INVESTOR_TYPE_OPTIONS.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Country code">
            <input className={frInputClass} value={form.countryCode} onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))} placeholder="e.g. ZW" maxLength={2} />
          </FrField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FrField label="Jurisdiction">
              <input className={frInputClass} value={form.jurisdiction} onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))} />
            </FrField>
            <FrField label="Relationship owner ID">
              <input className={frInputClass} value={form.relationshipOwnerId} onChange={(e) => setForm((f) => ({ ...f, relationshipOwnerId: e.target.value }))} />
            </FrField>
          </div>
        </div> : step === "profile" ? <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Estimated AUM (US$)">
            <input className={frInputClass} value={form.estimatedAum} onChange={(e) => setForm((f) => ({ ...f, estimatedAum: e.target.value }))} placeholder="180000000" />
          </FrField>
          <div />
          <FrField label="Typical minimum ticket (US$)">
            <input className={frInputClass} value={form.ticketMin} onChange={(e) => setForm((f) => ({ ...f, ticketMin: e.target.value }))} placeholder="3000000" />
          </FrField>
          <FrField label="Typical maximum ticket (US$)">
            <input className={frInputClass} value={form.ticketMax} onChange={(e) => setForm((f) => ({ ...f, ticketMax: e.target.value }))} placeholder="8000000" />
          </FrField>
          <FrField label="Asset class preferences (comma separated)">
            <input className={frInputClass} value={form.assetClassPreferences} onChange={(e) => setForm((f) => ({ ...f, assetClassPreferences: e.target.value }))} placeholder="Private Equity, Infrastructure" />
          </FrField>
          <FrField label="Geographic interests (comma separated)">
            <input className={frInputClass} value={form.geographicInterests} onChange={(e) => setForm((f) => ({ ...f, geographicInterests: e.target.value }))} placeholder="Southern Africa, East Africa" />
          </FrField>
          <FrField label="Next action">
            <input className={frInputClass} value={form.nextAction} onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))} />
          </FrField>
        </div> : step === "compliance" ? <div className="space-y-3"><FrField label="KYC status">
            <select className={frSelectClass} value={form.kycStatus} onChange={(e) => setForm((f) => ({ ...f, kycStatus: e.target.value }))}>
              <option value="NOT_STARTED">Not started</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="APPROVED">Approved</option>
            </select>
          </FrField>
          <FrField label="Sanctions status">
            <select className={frSelectClass} value={form.sanctionsStatus} onChange={(e) => setForm((f) => ({ ...f, sanctionsStatus: e.target.value }))}>
              <option value="NOT_SCREENED">Not screened</option>
              <option value="CLEAR">Clear</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </FrField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FrField label="Risk rating">
              <input className={frInputClass} value={form.riskRating} onChange={(e) => setForm((f) => ({ ...f, riskRating: e.target.value }))} />
            </FrField>
            <FrField label="Investor classification">
              <input className={frInputClass} value={form.investorClassification} onChange={(e) => setForm((f) => ({ ...f, investorClassification: e.target.value }))} />
            </FrField>
          </div>
          </div> : <ReviewList items={[
            { label: "Organisation", value: form.legalName || "—" },
            { label: "Type / country", value: `${INVESTOR_TYPE_OPTIONS.find((t) => t.code === form.investorType)?.label} · ${form.countryCode || "—"}` },
            { label: "AUM / ticket", value: `US$${form.estimatedAum || "0"} · US$${form.ticketMin || "0"}–${form.ticketMax || "0"}` },
            { label: "KYC status", value: form.kycStatus.replace(/_/g, " ") },
          ]} />}
      </FrSimpleWizard>

      <FrDialogShell
        open={editOpen}
        onOpenChange={(open) => {
          if (!editSaving) setEditOpen(open)
        }}
        title="Edit Investor Organisation"
        description="Update the organisation and investment profile."
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" className="h-9 rounded-full px-4" disabled={editSaving} onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="gradient-info" className="h-9 rounded-full px-5" disabled={editSaving} onClick={saveSelected}>
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Legal name">
            <input className={frInputClass} value={editForm.legalName} onChange={(e) => setEditForm((f) => ({ ...f, legalName: e.target.value }))} />
          </FrField>
          <FrField label="Trading name">
            <input className={frInputClass} value={editForm.tradingName} onChange={(e) => setEditForm((f) => ({ ...f, tradingName: e.target.value }))} />
          </FrField>
          <FrField label="Investor type">
            <select className={frSelectClass} value={editForm.investorType} onChange={(e) => setEditForm((f) => ({ ...f, investorType: e.target.value }))}>
              {INVESTOR_TYPE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </FrField>
          <FrField label="Country code">
            <input className={frInputClass} maxLength={2} value={editForm.countryCode} onChange={(e) => setEditForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))} />
          </FrField>
          <FrField label="Jurisdiction">
            <input className={frInputClass} value={editForm.jurisdiction} onChange={(e) => setEditForm((f) => ({ ...f, jurisdiction: e.target.value }))} />
          </FrField>
          <FrField label="Estimated AUM (US$)">
            <input className={frInputClass} inputMode="decimal" value={editForm.estimatedAum} onChange={(e) => setEditForm((f) => ({ ...f, estimatedAum: e.target.value }))} />
          </FrField>
          <FrField label="Typical minimum ticket (US$)">
            <input className={frInputClass} inputMode="decimal" value={editForm.ticketMin} onChange={(e) => setEditForm((f) => ({ ...f, ticketMin: e.target.value }))} />
          </FrField>
          <FrField label="Typical maximum ticket (US$)">
            <input className={frInputClass} inputMode="decimal" value={editForm.ticketMax} onChange={(e) => setEditForm((f) => ({ ...f, ticketMax: e.target.value }))} />
          </FrField>
          <FrField label="Next action" className="sm:col-span-2">
            <input className={frInputClass} value={editForm.nextAction} onChange={(e) => setEditForm((f) => ({ ...f, nextAction: e.target.value }))} />
          </FrField>
        </div>
      </FrDialogShell>

      <FrConfirmDialog
        open={archiveOpen}
        onOpenChange={(open) => {
          if (!archiveSaving) setArchiveOpen(open)
        }}
        title="Archive investor?"
        description={selected ? `Archive ${selected.legalName}? The organisation will no longer appear in active workflows.` : undefined}
        confirmLabel="Archive investor"
        destructive
        loading={archiveSaving}
        onConfirm={archiveSelected}
      />
    </div>
  )
}
