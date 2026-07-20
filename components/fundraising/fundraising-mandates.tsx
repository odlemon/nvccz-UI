"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FrMandateWizard } from "@/components/fundraising/fundraising-create-wizards"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import {
  MANDATE_ACTIVATION_FLAGS,
  fmtDate,
  mapMandateRow,
  mapRfpRow,
} from "@/lib/fundraising/mappers"
import {
  emptyRequirementsState,
  FrDialogShell,
  FrField,
  FrRequirementsDialog,
  FrTableSkeleton,
  frInputClass,
  requirementsFromError,
} from "./fundraising-modals"
import type { MandateStage } from "./mandates-mock-data"

const CARD =
  "rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

/** Design tokens — pills for controls, 4px badges */
const R6 = "rounded-full"
const R4 = "rounded-[4px]"

const STAGE_BADGE: Record<MandateStage, string> = {
  rfp: "bg-[#dbeafe] text-[#1d4ed8]",
  mandate_live: "bg-[#ede9fe] text-[#6d28d9]",
  shortlist: "bg-[#ffedd5] text-[#c2410c]",
  evaluation: "bg-[#e0f2fe] text-[#0369a1]",
}

const STAGE_LABEL: Record<MandateStage, string> = {
  rfp: "RFP",
  mandate_live: "Mandate",
  shortlist: "Shortlist",
  evaluation: "Evaluation",
}

type CombinedRow = ReturnType<typeof mapMandateRow> | ReturnType<typeof mapRfpRow>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readableName(value: unknown) {
  const name = String(value || "").trim()
  return name && !UUID_PATTERN.test(name) ? name : ""
}

function ownerLabel(row: CombinedRow) {
  const raw = row.raw
  const embedded = raw.owner || raw.assignedOwner
  return (
    readableName(raw.ownerName) ||
    readableName(embedded?.fullName) ||
    readableName(embedded?.displayName) ||
    readableName(embedded?.name) ||
    "Name unavailable"
  )
}

function nextStepLabel(row: CombinedRow) {
  const raw = row.raw
  const embedded = raw.nextStep
  return (
    readableName(raw.nextStepName) ||
    readableName(embedded?.title) ||
    readableName(embedded?.label) ||
    readableName(embedded?.name) ||
    readableName(row.nextStep) ||
    "Name unavailable"
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className={cn("inline-flex h-7 min-w-[28px] items-center justify-center border px-1 text-[11px] font-semibold text-[#94a3b8]", R4, "border-[#e2e8f0] bg-white")}>
        —
      </span>
    )
  }
  const tone =
    score >= 85
      ? { border: "border-[#16a34a]", text: "text-[#15803d]" }
      : score >= 70
        ? { border: "border-[#22c55e]", text: "text-[#16a34a]" }
        : score >= 55
          ? { border: "border-[#eab308]", text: "text-[#ca8a04]" }
          : { border: "border-[#f97316]", text: "text-[#ea580c]" }
  return (
    <span className={cn("inline-flex h-7 min-w-[28px] items-center justify-center border px-1 text-[11px] font-semibold tabular-nums bg-white", R4, tone.border, tone.text)}>
      {score}
    </span>
  )
}

function MandateCheckbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
        checked ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5e1] bg-white hover:border-[#94a3b8]",
      )}
    >
      {checked && (
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label
      className={cn(
        "inline-flex min-w-[118px] flex-col items-stretch border border-[#e2e8f0] bg-white px-3 py-2 text-left hover:bg-[#fafbfc]",
        R6,
      )}
    >
      <span className="text-[10px] font-medium leading-none text-[#64748b]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 bg-transparent text-xs text-[#475569] outline-none">
        <option value="all">All</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function OrgLogo({ row, size = "sm" }: { row: CombinedRow; size?: "sm" | "lg" }) {
  const isLg = size === "lg"
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-bold",
        isLg ? "h-10 w-10 text-[10px]" : "h-7 w-7 text-[9px]",
        R4,
      )}
      style={{ backgroundColor: row.logoBg, color: row.logoText }}
    >
      {row.logoLabel}
    </span>
  )
}

function DetailSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <h3 className="text-[13px] font-semibold text-[#0f172a]">{title}</h3>
    </div>
  )
}

function DetailPanel({
  row,
  onClose,
  onActivate,
  onConvert,
  onToggleFlag,
  activating,
  converting,
  togglingKey,
}: {
  row: CombinedRow
  onClose: () => void
  onActivate: () => void
  onConvert: () => void
  onToggleFlag: (key: string, value: boolean) => void
  activating: boolean
  converting: boolean
  togglingKey: string | null
}) {
  const isRfp = row.kind === "RFP"

  return (
    <aside className={cn(CARD, "thin-scroll max-h-[calc(100vh-8rem)] overflow-y-auto")}>
      {/* Header */}
      <div className="border-b border-[#f1f5f9] px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <OrgLogo row={row} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[15px] font-semibold leading-snug text-[#0f172a]">{row.name}</h2>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#64748b]",
                  R6,
                )}
                aria-label="Close detail panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-[#64748b]">{row.organization}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold",
                  R4,
                  isRfp ? "border-[#2563eb] text-[#1d4ed8]" : "border-[#16a34a] text-[#15803d]",
                )}
              >
                <FileText className="h-3 w-3" strokeWidth={2} />
                {String(row.status).replace(/_/g, " ")}
              </span>
              <ScoreBadge score={row.score} />
            </div>
          </div>
        </div>

        {"complianceBlocked" in row && row.complianceBlocked ? (
          <div className="mt-3 flex items-start gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 text-[11px] text-[#b91c1c]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Compliance hold — activation blocked until KYC / sanctions clear.
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {isRfp ? (
          <button
            type="button"
              disabled={row.raw.outcome !== "WON" || converting}
              onClick={onConvert}
            className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 text-xs font-medium text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50",
              R6,
            )}
          >
              {converting ? "Converting…" : "Convert to Mandate"}
          </button>
          ) : (
          <button
            type="button"
              disabled={row.status === "ACTIVE" || Boolean((row as any).complianceBlocked) || activating}
              onClick={onActivate}
            className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 text-xs font-medium text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50",
              R6,
            )}
          >
              {activating ? "Activating…" : row.status === "ACTIVE" ? "Mandate Active" : "Activate Mandate"}
          </button>
            )}
        </div>
      </div>

      {isRfp ? (
      <div className="border-b border-[#f1f5f9]">
          <DetailSectionHeader title="RFP Details" />
          <dl className="space-y-2 px-5 pb-4 text-[12px]">
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Reference</dt>
              <dd className="font-medium text-[#0f172a]">{row.raw.referenceNumber || "—"}</dd>
                </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Deadline</dt>
              <dd className="text-[#0f172a]">{row.rfpDueDate}</dd>
                </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Presentation date</dt>
              <dd className="text-[#0f172a]">{fmtDate(row.raw.presentationDate) || "—"}</dd>
              </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#94a3b8]">Outcome</dt>
              <dd className="text-[#0f172a]">{row.raw.outcome || "PENDING"}</dd>
      </div>
          </dl>
        </div>
      ) : (
      <div className="border-b border-[#f1f5f9]">
          <div className="flex items-center justify-between px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-[#0f172a]">Activation Checklist</h3>
            <span className="text-[11px] tabular-nums text-[#64748b]">
              {(row as any).checklistDone}/{(row as any).checklistTotal}
            </span>
        </div>
          <ul className="space-y-2.5 px-5 pb-4">
            {MANDATE_ACTIVATION_FLAGS.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-[#334155]">{f.label}</span>
                <MandateCheckbox
                  checked={Boolean(row.raw[f.key])}
                  disabled={togglingKey === f.key}
                  onChange={() => onToggleFlag(f.key, !row.raw[f.key])}
                  label={f.label}
                />
            </li>
          ))}
        </ul>
      </div>
      )}

      <div>
        <DetailSectionHeader title="Key Facts" />
        <dl className="space-y-2 px-5 pb-5 text-[12px]">
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Mandate size / expected AUM</dt>
            <dd className="font-medium text-[#0f172a]">{row.mandateSize}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Asset class</dt>
            <dd className="text-[#0f172a]">{row.assetClass}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Geography</dt>
            <dd className="text-[#0f172a]">{row.geography}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Owner</dt>
            <dd className="text-[#0f172a]">{ownerLabel(row)}</dd>
                </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#94a3b8]">Next step</dt>
            <dd className="text-right text-[#0f172a]">{nextStepLabel(row)}</dd>
              </div>
        </dl>
      </div>
    </aside>
  )
}

export function FundraisingMandates() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [geographyFilter, setGeographyFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [rfpOpen, setRfpOpen] = useState(false)
  const [rfpSubmitting, setRfpSubmitting] = useState(false)
  const [rfpForm, setRfpForm] = useState({ institutionName: "", deadline: "" })
  const [requirements, setRequirements] = useState(emptyRequirementsState)

  const [loading, setLoading] = useState(true)
  const [rawMandates, setRawMandates] = useState<Record<string, any>[]>([])
  const [rawRfps, setRawRfps] = useState<Record<string, any>[]>([])
  const [rawInvestors, setRawInvestors] = useState<Record<string, any>[]>([])

  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [mandates, rfps, investors] = await Promise.all([
        fundraisingApi.listMandates(),
        fundraisingApi.listRfps(),
        fundraisingApi.listInvestors({ pageSize: 200 }),
      ])
      setRawMandates(mandates ?? [])
      setRawRfps(rfps ?? [])
      setRawInvestors(investors?.items ?? [])
    } catch (err) {
      toastFrError(err, "Could not load mandates")
      setRawMandates([])
      setRawRfps([])
      setRawInvestors([])
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

  const combined: CombinedRow[] = useMemo(() => {
    const mandateRows = rawMandates.map((m, i) => mapMandateRow(m, investorsById, i))
    const rfpRows = rawRfps.map((r, i) => mapRfpRow(r, investorsById, i + mandateRows.length))
    return [...mandateRows, ...rfpRows]
  }, [rawMandates, rawRfps, investorsById])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return combined.filter(
      (m) =>
        (!q ||
        m.name.toLowerCase().includes(q) ||
        m.organization.toLowerCase().includes(q) ||
          m.mandateType.toLowerCase().includes(q)) &&
        (typeFilter === "all" || m.mandateType === typeFilter) &&
        (geographyFilter === "all" || m.geography === geographyFilter) &&
        (stageFilter === "all" || m.stage === stageFilter),
    )
  }, [combined, search, typeFilter, geographyFilter, stageFilter])

  const selected = filtered.find((m) => m.id === selectedId) ?? null

  useEffect(() => {
    if (!loading && combined.length > 0 && !combined.find((m) => m.id === selectedId)) {
      setSelectedId(combined[0].id)
    }
  }, [loading, combined, selectedId])

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (checked.size === filtered.length) setChecked(new Set())
    else setChecked(new Set(filtered.map((m) => m.id)))
  }

  const allChecked = checked.size === filtered.length && filtered.length > 0

  async function handleActivate(row: CombinedRow) {
    setActivatingId(row.id)
    try {
      await fundraisingApi.activateMandate(row.raw.id)
      toast.success("Mandate activated")
      await loadData()
    } catch (err) {
      const state = requirementsFromError(err, "Mandate cannot be activated")
      if (state.open) setRequirements(state)
      else toastFrError(err, "Mandate cannot be activated")
    } finally {
      setActivatingId(null)
    }
  }

  async function handleConvert(row: CombinedRow) {
    setConvertingId(row.id)
    try {
      await fundraisingApi.convertRfpToMandate(row.raw.id)
      toast.success("RFP converted to mandate")
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not convert RFP to mandate")
    } finally {
      setConvertingId(null)
    }
  }

  async function handleCreateRfp() {
    if (!rfpForm.institutionName.trim()) return
    setRfpSubmitting(true)
    try {
      await fundraisingApi.createRfp({
        institutionName: rfpForm.institutionName.trim(),
        deadline: rfpForm.deadline || undefined,
        status: "DRAFT",
        outcome: "PENDING",
      })
      toast.success("RFP created")
      setRfpOpen(false)
      setRfpForm({ institutionName: "", deadline: "" })
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not create RFP")
    } finally {
      setRfpSubmitting(false)
    }
  }

  function handleExport() {
    exportFundraisingCsv(
      filtered,
      [
        { key: "name", label: "Mandate / RFP" },
        { key: "kind", label: "Type" },
        { key: "organization", label: "Organization" },
        { key: "geography", label: "Geography" },
        { key: "mandateSize", label: "Size" },
        { key: "stage", label: "Stage" },
        { key: "rfpDueDate", label: "Due Date" },
        { key: "owner", label: "Owner", value: ownerLabel },
        { key: "nextStep", label: "Next Step", value: nextStepLabel },
        { key: "score", label: "Score" },
      ],
      "fundraising-mandates",
    )
  }

  async function handleToggleFlag(row: CombinedRow, key: string, value: boolean) {
    setTogglingKey(key)
    try {
      await fundraisingApi.patchMandate(row.raw.id, { [key]: value })
      await loadData()
    } catch (err) {
      toastFrError(err, "Could not update checklist")
    } finally {
      setTogglingKey(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1680px] p-4 sm:p-5 md:p-6">
      {/* Page header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-[28px]">Mandates</h1>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#94a3b8]" /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="rounded-full h-10 px-6 gap-2 shadow-sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            type="button"
            variant="gradient-info"
            className="rounded-full h-10 px-6 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Mandate
          </Button>
          <Button type="button" variant="outline" className="rounded-full h-10 px-5 shadow-sm" onClick={() => setRfpOpen(true)}>
            <Plus className="h-4 w-4" />
            Add RFP
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full h-10 w-10 p-0 shadow-sm"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table card — filters + table + pagination in one container */}
      <div
        className={cn(
          "grid items-start gap-4",
          selected ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]" : "grid-cols-1",
        )}
      >
        <div className={cn(CARD, "min-w-0 overflow-hidden")}>
          {/* View tabs row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 border border-[#2563eb] bg-white px-3 text-xs font-semibold text-[#2563eb]",
                R6,
              )}
            >
              <LayoutList className="h-4 w-4 shrink-0" strokeWidth={2} />
              All Mandates
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center bg-[#eff6ff] px-1.5 text-[10px] font-semibold tabular-nums text-[#2563eb]",
                  R4,
                )}
              >
                {combined.length}
              </span>
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-1.5 border border-[#e2e8f0] bg-white px-3 text-xs font-medium text-[#64748b] hover:bg-[#fafbfc]",
                R6,
              )}
            >
              Saved Views
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
            <div className="relative w-full min-w-[200px] flex-1 sm:max-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mandates..."
                className={cn(
                  "h-9 w-full border border-[#e2e8f0] bg-white pl-9 pr-3 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15",
                  R6,
                )}
              />
            </div>

            <FilterSelect label="Mandate Type" value={typeFilter} options={Array.from(new Set(combined.map((row) => row.mandateType))).filter(Boolean)} onChange={setTypeFilter} />
            <FilterSelect label="Geography" value={geographyFilter} options={Array.from(new Set(combined.map((row) => row.geography))).filter(Boolean)} onChange={setGeographyFilter} />
            <FilterSelect label="Stage" value={stageFilter} options={Array.from(new Set(combined.map((row) => row.stage))).filter(Boolean)} onChange={setStageFilter} />

            <button type="button" onClick={() => { setSearch(""); setTypeFilter("all"); setGeographyFilter("all"); setStageFilter("all") }} className="rounded-full px-2 py-1 text-xs font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]">
              Clear
            </button>
          </div>

          {/* Table */}
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="w-11 px-4 py-3">
                    <MandateCheckbox checked={allChecked} onChange={toggleAll} label="Select all mandates" />
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Mandate
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Type
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Organization
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Geography
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Size
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Stage
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Due Date
                  </th>
                  <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Next Step
                  </th>
                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <FrTableSkeleton columns={10} rows={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-[13px] text-[#94a3b8]">
                      {combined.length === 0 ? "No mandates or RFPs recorded yet." : "No mandates match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                  const isSelected = row.id === selectedId
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={cn(
                        "cursor-pointer border-b border-[#f1f5f9] transition-colors",
                        isSelected ? "bg-[#f8fafc]" : "hover:bg-[#fafbfc]",
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <MandateCheckbox
                          checked={checked.has(row.id)}
                          onChange={() => toggleCheck(row.id)}
                          label={`Select ${row.name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-[200px] items-center gap-2.5">
                          <OrgLogo row={row} />
                          <span className="text-[13px] font-semibold leading-snug text-[#1d4ed8] hover:underline">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.mandateType}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.organization}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">{row.geography}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px] font-medium tabular-nums text-[#0f172a]">
                        {row.mandateSize}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 text-[11px] font-medium",
                            R4,
                            STAGE_BADGE[row.stage],
                          )}
                        >
                          {STAGE_LABEL[row.stage]}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-[13px] tabular-nums",
                          row.rfpDueDate === "—" ? "text-[#94a3b8]" : "text-[#334155]",
                        )}
                      >
                        {row.rfpDueDate}
                      </td>
                        <td className="max-w-[170px] truncate whitespace-nowrap px-3 py-2.5 text-[13px] text-[#334155]">
                          {nextStepLabel(row)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <ScoreBadge score={row.score} />
                      </td>
                    </tr>
                  )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-[#e2e8f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#64748b]">
              Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {combined.length} mandates &amp; RFPs
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-40",
                  R6,
                )}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="inline-flex h-8 min-w-8 items-center justify-center px-2 text-xs font-medium text-[#2563eb]">
                {page}
                  </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]",
                  R6,
                )}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {selected && (
          <div className="min-w-0 xl:sticky xl:top-4 xl:min-w-[420px]">
            <DetailPanel
              row={selected}
              onClose={() => setSelectedId(null)}
              onActivate={() => handleActivate(selected)}
              onConvert={() => handleConvert(selected)}
              onToggleFlag={(key, value) => handleToggleFlag(selected, key, value)}
              activating={activatingId === selected.id}
              converting={convertingId === selected.id}
              togglingKey={togglingKey}
            />
          </div>
        )}
      </div>
      <FrMandateWizard open={createOpen} onOpenChange={setCreateOpen} onCreated={loadData} />
      <FrDialogShell
        open={rfpOpen}
        onOpenChange={(open) => {
          if (rfpSubmitting) return
          setRfpOpen(open)
          if (!open) setRfpForm({ institutionName: "", deadline: "" })
        }}
        title="Add RFP"
        description="Capture the institution and submission deadline."
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" className="h-9 rounded-full px-4" disabled={rfpSubmitting} onClick={() => setRfpOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient-info"
              className="h-9 rounded-full px-5 text-xs font-semibold shadow-sm"
              disabled={!rfpForm.institutionName.trim() || rfpSubmitting}
              onClick={handleCreateRfp}
            >
              {rfpSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {rfpSubmitting ? "Creating…" : "Create RFP"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FrField label="Institution name">
            <input
              className={frInputClass}
              value={rfpForm.institutionName}
              onChange={(event) => setRfpForm((form) => ({ ...form, institutionName: event.target.value }))}
              placeholder="Institution or RFP name"
              autoFocus
            />
          </FrField>
          <FrField label="Submission deadline">
            <input
              type="date"
              className={frInputClass}
              value={rfpForm.deadline}
              onChange={(event) => setRfpForm((form) => ({ ...form, deadline: event.target.value }))}
            />
          </FrField>
        </div>
      </FrDialogShell>
      <FrRequirementsDialog
        state={requirements}
        onOpenChange={(open) => setRequirements((current) => ({ ...current, open }))}
      />
    </div>
  )
}
