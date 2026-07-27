"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
  XCircle,
  Building2,
  Cloud,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmButton, PmCard, PmModal, PmPageHeader, PmStatusPill, PmToggle } from "@/components/performance-mock/primitives"
import {
  mappingFrequencyOptions,
  mappingRows as mappingRowsSeed,
  mappingSourceOptions,
  mappingStatusOptions,
  mappingTypeOptions,
  sourceSystems,
  type MappingRow,
  type MappingStatus,
} from "@/lib/performance-mock/fixtures/integrations"
import { cn } from "@/lib/utils"

const PURPLE = "#8B5CF6"

const statusDot: Record<MappingStatus, string> = {
  Active: "#10B981",
  Warning: "#F59E0B",
  Failed: "#EF4444",
  Inactive: "#9CA3AF",
}

const sourceIcons: Record<string, { icon: ReactNode; bg: string; color: string }> = {
  "src-erp": { icon: <Database className="h-3.5 w-3.5" />, bg: "#FEE2E2", color: "#DC2626" },
  "src-hr": { icon: <Users className="h-3.5 w-3.5" />, bg: "#DBEAFE", color: "#2563EB" },
  "src-crm": { icon: <Cloud className="h-3.5 w-3.5" />, bg: "#FFEDD5", color: "#EA580C" },
  "src-gsheets": { icon: <FileSpreadsheet className="h-3.5 w-3.5" />, bg: "#D1FAE5", color: "#059669" },
}

const DETAIL_TABS = [
  { id: "details", label: "Details" },
  { id: "sample", label: "Sample Data" },
  { id: "tests", label: "Test Results" },
  { id: "sync", label: "Sync & Logs" },
]

function StatusIcon({ status }: { status: MappingStatus }) {
  if (status === "Active") return <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
  if (status === "Warning") return <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
  if (status === "Failed") return <XCircle className="h-4 w-4 text-[#EF4444]" />
  return <CheckCircle2 className="h-4 w-4 text-[#9CA3AF]" />
}

function FilterCard({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: ReactNode
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 h-10 rounded-full border border-[#E2E8F0] bg-white pl-1.5 pr-3 cursor-pointer hover:bg-[#F8FAFC] shrink-0">
      <span className="h-7 w-7 rounded-full bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 leading-tight pr-1">
        <p className="text-[9px] text-[#94A3B8] font-medium">{label}</p>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent outline-none text-[12px] font-bold text-[#0F172A] cursor-pointer max-w-[120px] truncate"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
    </label>
  )
}

function Connector() {
  return (
    <div className="flex items-center shrink-0 w-8 sm:w-10">
      <div className="h-0.5 flex-1 bg-[#C4B5FD]" />
      <div className="h-2.5 w-2.5 rounded-full border-2 border-[#8B5CF6] bg-white shrink-0" />
      <div className="h-0.5 flex-1 bg-[#C4B5FD]" />
    </div>
  )
}

function emptyMappingDraft() {
  return { sourceField: "", sourceSystem: sourceSystems[0].name, transformation: "Transform", targetField: "", targetCategory: "KPI (Financial)" }
}

export function IntegrationsMockScreen() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [sourceSystems[0].id]: true })
  const [sourceSearch, setSourceSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState(mappingSourceOptions[0])
  const [typeFilter, setTypeFilter] = useState(mappingTypeOptions[0])
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [freqFilter, setFreqFilter] = useState(mappingFrequencyOptions[0])
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<MappingRow[]>(mappingRowsSeed)
  const [selectedId, setSelectedId] = useState(mappingRowsSeed[mappingRowsSeed.length - 1].id)
  const [detailOpen, setDetailOpen] = useState(true)
  const [detailTab, setDetailTab] = useState("details")
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState(emptyMappingDraft())

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (sourceFilter !== mappingSourceOptions[0]) {
        const short = sourceFilter.replace(/ \(.*\)/, "")
        if (!r.sourceSystem.includes(short) && r.sourceSystem !== sourceFilter) return false
      }
      if (typeFilter !== mappingTypeOptions[0] && r.transformation !== typeFilter) return false
      if (statusFilter !== "All Statuses" && r.status !== statusFilter) return false
      if (freqFilter !== mappingFrequencyOptions[0] && r.syncFrequency !== freqFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!r.sourceField.toLowerCase().includes(q) && !r.targetField.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, sourceFilter, typeFilter, statusFilter, freqFilter, search])

  const selected = rows.find((r) => r.id === selectedId) || rows[0]

  const statusCounts = useMemo(() => {
    const counts: Record<MappingStatus, number> = { Active: 0, Warning: 0, Failed: 0, Inactive: 0 }
    rows.forEach((r) => counts[r.status]++)
    return counts
  }, [rows])

  const toggleMapping = (id: string, enabled: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled, status: enabled ? r.status === "Inactive" ? "Active" : r.status : "Inactive" } : r)))
    toast.success(`Mapping ${enabled ? "activated" : "deactivated"}`)
  }

  const addMapping = () => {
    if (!draft.sourceField.trim() || !draft.targetField.trim()) {
      toast.error("Source field and target field are required")
      return
    }
    const newMapping: MappingRow = {
      id: `MAP-${String(rows.length + 1).padStart(4, "0")}`,
      sourceField: draft.sourceField,
      sourceType: "String",
      sourceSystem: draft.sourceSystem,
      transformation: draft.transformation,
      transformationDetail: "Configured on save",
      targetField: draft.targetField,
      targetType: "Number",
      targetCategory: draft.targetCategory,
      enabled: true,
      status: "Active",
      owner: "Adm. User",
      ownerInitials: "AU",
      description: `Maps ${draft.sourceField} to ${draft.targetField}.`,
      syncFrequency: "Monthly",
      validation: [{ level: "success", label: "Passed", detail: "New mapping — awaiting first sync" }],
      syncLogs: [{ at: "Just now", tone: "success", title: "Mapping created", detail: "Awaiting first sync run" }],
      sampleData: [],
      testResults: [],
    }
    setRows((prev) => [...prev, newMapping])
    setSelectedId(newMapping.id)
    setDetailOpen(true)
    setAddOpen(false)
    setDraft(emptyMappingDraft())
    toast.success("Mapping added", { description: `${newMapping.sourceField} → ${newMapping.targetField}` })
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration", "Integration Mapping"]} />
      <div className="p-4 lg:p-5 space-y-3">
        <PmPageHeader
          title="Integration Mapping"
          subtitle="Map data from source systems to KPI and Scorecard fields."
          actions={
            <>
              <PmButton variant="outline" className="rounded-full" onClick={() => toast.success("Sources refreshed")}>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </PmButton>
              <PmButton variant="outline" className="rounded-full" onClick={() => toast.success("Export started", { description: "Mapping configuration will download shortly." })}>
                <Download className="h-3.5 w-3.5" /> Export
              </PmButton>
              <PmButton className="rounded-full !bg-[#7C3AED] hover:!bg-[#6D28D9]" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Mapping
              </PmButton>
            </>
          }
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterCard
            icon={<Database className="h-3.5 w-3.5" />}
            label="Source System"
            value={sourceFilter}
            options={mappingSourceOptions}
            onChange={setSourceFilter}
          />
          <FilterCard
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Source Type"
            value={typeFilter}
            options={mappingTypeOptions}
            onChange={setTypeFilter}
          />
          <FilterCard
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            label="Status"
            value={statusFilter}
            options={["All Statuses", ...mappingStatusOptions]}
            onChange={setStatusFilter}
          />
          <FilterCard
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label="Sync Frequency"
            value={freqFilter}
            options={mappingFrequencyOptions}
            onChange={setFreqFilter}
          />
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mappings by name or field..."
              className="w-full h-10 pl-9 pr-4 rounded-full border border-[#E2E8F0] text-[12px] outline-none focus:border-[#7C3AED] bg-white placeholder:text-[#94A3B8]"
            />
          </div>
          <button
            type="button"
            onClick={() => toast("More filters", { description: "Advanced filter panel opens here." })}
            className="h-10 w-10 rounded-full border border-[#E2E8F0] bg-white text-[#64748B] inline-flex items-center justify-center hover:bg-[#F8FAFC] shrink-0"
            aria-label="More filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* 3-column workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* LEFT: Source Systems (~20%) */}
          <PmCard className="overflow-hidden flex flex-col xl:col-span-3 xl:sticky xl:top-24">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">Source Systems</h3>
              <button type="button" className="h-7 w-7 rounded-lg flex items-center justify-center text-[#8B5CF6] hover:bg-[#F5F3FF]">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 border-b border-[#E5E7EB]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                <input
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder="Search source fields..."
                  className="w-full h-8 pl-8 pr-2 rounded-lg border border-[#E5E7EB] text-xs outline-none focus:border-[#C4B5FD]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[480px]">
              {sourceSystems.map((s) => {
                const meta = sourceIcons[s.id] || { icon: <Building2 className="h-3.5 w-3.5" />, bg: "#F3E8FF", color: PURPLE }
                const fields = s.fields.filter((f) => !sourceSearch.trim() || f.name.toLowerCase().includes(sourceSearch.toLowerCase()))
                return (
                  <div key={s.id} className="border-b border-[#F1F5F9]">
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#FAFAFA]"
                    >
                      {expanded[s.id] ? <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />}
                      <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.icon}
                      </span>
                      <span className="flex-1 text-xs font-semibold text-[#111827] truncate">{s.name}</span>
                      <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F3F4F6] h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">{s.fieldCount}</span>
                    </button>
                    {expanded[s.id] && (
                      <div className="pb-2 pl-6 relative">
                        <div className="absolute left-[22px] top-0 bottom-2 w-px bg-[#E5E7EB]" />
                        {fields.map((f) => (
                          <button
                            key={f.name}
                            type="button"
                            onClick={() => setSearch(f.name)}
                            className="relative w-full flex items-center justify-between px-3 py-1.5 pl-5 text-[11px] hover:bg-[#F5F3FF] rounded-md mx-1"
                          >
                            <span className="absolute left-0 top-1/2 w-3 h-px bg-[#E5E7EB]" />
                            <span className="font-mono text-[#374151] truncate">{f.name}</span>
                            <span className="text-[#9CA3AF] shrink-0 ml-2">{f.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="p-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => toast("Connect a new source system or file to begin mapping.")}
                className="w-full flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl border border-dashed border-[#C4B5FD] text-[#8B5CF6] hover:bg-[#F5F3FF]"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <Plus className="h-3.5 w-3.5" /> Add New Source
                </span>
                <span className="text-[10px] font-normal text-[#9CA3AF]">Connect a new system or file</span>
              </button>
            </div>
          </PmCard>

          {/* MIDDLE: Mapping canvas (~55% with detail, ~75% without) */}
          <PmCard className={cn("overflow-hidden flex flex-col", detailOpen ? "xl:col-span-5" : "xl:col-span-9")}>
            <div className="px-3 py-2 border-b border-[#E5E7EB] grid grid-cols-[1fr_auto_1fr_auto_1fr_auto] gap-1 text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold">
              <span>Source Field</span>
              <span className="w-8 sm:w-10" />
              <span>Mapping & Transformation</span>
              <span className="w-8 sm:w-10" />
              <span>Target Field</span>
              <span className="w-16" />
            </div>
            <div className="flex-1 overflow-y-auto max-h-[520px] p-3 space-y-3 bg-[#FAFAFB]">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(m.id)
                    setDetailOpen(true)
                    setDetailTab("details")
                  }}
                  className={cn(
                    "w-full flex items-center gap-0 text-left rounded-xl p-2 transition-colors",
                    selectedId === m.id && detailOpen ? "bg-[#F5F3FF] ring-1 ring-[#C4B5FD]" : "hover:bg-white"
                  )}
                >
                  {/* Source card */}
                  <div className="flex-1 min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-sm">
                    <p className="text-xs font-bold text-[#111827] font-mono truncate">{m.sourceField}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">
                      {m.sourceType} · {m.sourceSystem}
                    </p>
                  </div>
                  <Connector />
                  {/* Transform card */}
                  <div className="flex-1 min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="h-5 w-5 rounded-md bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0 text-[10px] font-bold">fx</span>
                      <p className="text-xs font-semibold text-[#111827] truncate flex-1">{m.transformation}</p>
                      <ChevronDown className="h-3 w-3 text-[#9CA3AF] shrink-0" />
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate pl-6">{m.transformationDetail}</p>
                  </div>
                  <Connector />
                  {/* Target card */}
                  <div className="flex-1 min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-2.5 shadow-sm">
                    <p className="text-xs font-bold text-[#111827] truncate">{m.targetField}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">
                      {m.targetType} · {m.targetCategory}
                    </p>
                  </div>
                  {/* Status */}
                  <div className="w-16 flex items-center justify-end gap-1.5 shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                    <PmToggle size="sm" checked={m.enabled} onChange={(v) => toggleMapping(m.id, v)} />
                    <StatusIcon status={m.status} />
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-center text-xs text-[#6B7280] py-10">No mappings match the current filters.</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3 text-[10px] text-[#6B7280] flex-wrap">
                <LegendDot color={statusDot.Active} label={`Active (${statusCounts.Active})`} />
                <LegendDot color={statusDot.Warning} label={`Warning (${statusCounts.Warning})`} />
                <LegendDot color={statusDot.Failed} label={`Failed (${statusCounts.Failed})`} />
                <LegendDot color={statusDot.Inactive} label={`Inactive (${statusCounts.Inactive})`} />
                <span className="text-[#9CA3AF]">· {rows.length} Mappings</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toast.success("Auto-map suggestions ready", { description: "3 new field suggestions found." })}
                  className="text-xs font-semibold text-[#8B5CF6] hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Auto-map suggestions
                </button>
                <button type="button" className="text-xs font-semibold text-[#8B5CF6] hover:underline">
                  View (3)
                </button>
              </div>
            </div>
          </PmCard>

          {/* RIGHT: Selected Mapping detail */}
          {detailOpen && (
            <PmCard className="xl:col-span-4 overflow-hidden flex flex-col max-h-[640px] xl:sticky xl:top-24">
              <div className="px-4 pt-4 pb-2 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">Selected Mapping</h3>
                    <span className="text-[10px] font-mono text-[#9CA3AF]">{selected.id}</span>
                  </div>
                  <button type="button" onClick={() => setDetailOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2 mt-1">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate">
                      <span className="font-mono text-[#6B7280]">{selected.sourceField}</span>
                      <span className="mx-1.5 text-[#8B5CF6]">→</span>
                      {selected.targetField}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">
                      {selected.sourceSystem}
                      <span className="mx-1 text-[#C4B5FD]">→</span>
                      {selected.targetCategory}
                    </p>
                  </div>
                  <PmStatusPill
                    label={selected.status}
                    tone={selected.status === "Active" ? "success" : selected.status === "Warning" ? "warning" : selected.status === "Failed" ? "danger" : "neutral"}
                  />
                </div>
              </div>

              <div className="px-2 border-b border-[#E5E7EB] flex items-center gap-0.5 overflow-x-auto">
                {DETAIL_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDetailTab(t.id)}
                    className={cn(
                      "px-2.5 py-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors",
                      detailTab === t.id ? "border-[#8B5CF6] text-[#8B5CF6]" : "border-transparent text-[#6B7280] hover:text-[#111827]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {detailTab === "details" && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-2">Mapping Details</p>
                      <div className="space-y-2 rounded-xl bg-[#F9FAFB] p-3">
                        <DetailRow label="Transformation" value={selected.transformation} />
                        <DetailRow label="Calculation" value={selected.transformationDetail} />
                        <DetailRow label="Data Type (Source)" value={selected.sourceType} />
                        <DetailRow label="Data Type (Target)" value={selected.targetType} />
                        <DetailRow label="Sync Frequency" value={selected.syncFrequency} />
                        <DetailRow
                          label="Owner"
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-5 w-5 rounded-full bg-[#8B5CF6] text-white text-[9px] font-bold flex items-center justify-center">{selected.ownerInitials}</span>
                              {selected.owner}
                            </span>
                          }
                        />
                      </div>
                      <p className="text-[#6B7280] mt-2 leading-relaxed">{selected.description}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-2">Validation Status</p>
                      <div className="space-y-2">
                        {selected.validation.map((v, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] p-2.5">
                            {v.level === "danger" ? (
                              <XCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" />
                            ) : v.level === "warning" ? (
                              <AlertTriangle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                            )}
                            <p className="text-[#374151]">
                              <span className={cn("font-semibold", v.level === "danger" ? "text-[#EF4444]" : v.level === "warning" ? "text-[#D97706]" : "text-[#10B981]")}>
                                {v.label}
                              </span>{" "}
                              — {v.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wide text-[#9CA3AF] font-semibold">Last Sync Logs</p>
                        <button type="button" className="text-[11px] font-semibold text-[#8B5CF6] hover:underline">
                          View all Logs →
                        </button>
                      </div>
                      <div className="relative space-y-3 pl-4">
                        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-[#E5E7EB]" />
                        {selected.syncLogs.map((l, i) => (
                          <div key={i} className="relative flex items-start gap-2">
                            <span
                              className={cn(
                                "absolute -left-4 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                                l.tone === "danger" ? "bg-[#EF4444]" : l.tone === "warning" ? "bg-[#F59E0B]" : "bg-[#10B981]"
                              )}
                            />
                            <div>
                              <p className="text-[#111827] font-semibold text-[11px]">{l.at}</p>
                              <p className="text-[#374151] mt-0.5">{l.title}</p>
                              <p className="text-[#9CA3AF]">{l.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === "sample" && (
                  <div className="text-xs">
                    {selected.sampleData.length === 0 ? (
                      <p className="text-[#9CA3AF] py-6 text-center">No sample data captured yet.</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-[10px] uppercase text-[#9CA3AF]">
                            <th className="text-left font-semibold pb-2">Source Value</th>
                            <th className="text-left font-semibold pb-2">Mapped Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.sampleData.map((s, i) => (
                            <tr key={i} className="border-t border-[#F1F5F9]">
                              <td className="py-2 text-[#374151] font-mono">{s.source}</td>
                              <td className="py-2 text-[#111827] font-semibold">{s.mapped}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {detailTab === "tests" && (
                  <div className="space-y-2 text-xs">
                    {selected.testResults.length === 0 ? (
                      <p className="text-[#9CA3AF] py-6 text-center">No test results yet.</p>
                    ) : (
                      selected.testResults.map((t, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-[#E5E7EB] p-2.5">
                          {t.passed ? <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" /> : <XCircle className="h-4 w-4 text-[#EF4444] shrink-0" />}
                          <div>
                            <p className="text-[#111827] font-semibold">{t.name}</p>
                            <p className="text-[#9CA3AF]">{t.detail}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "sync" && (
                  <div className="space-y-2">
                    {selected.syncLogs.map((l, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs rounded-lg border border-[#E5E7EB] p-2.5">
                        <span className={cn("h-2 w-2 rounded-full mt-1 shrink-0", l.tone === "danger" ? "bg-[#EF4444]" : l.tone === "warning" ? "bg-[#F59E0B]" : "bg-[#10B981]")} />
                        <div>
                          <p className="text-[#111827] font-semibold">{l.at}</p>
                          <p className="text-[#374151]">{l.title}</p>
                          <p className="text-[#9CA3AF]">{l.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PmCard>
          )}
        </div>
      </div>

      <PmModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Mapping"
        description="Map a source field to a KPI or Scorecard target field."
        footer={
          <>
            <PmButton variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </PmButton>
            <PmButton className="!bg-[#8B5CF6] hover:!bg-[#7C3AED]" onClick={addMapping}>
              <Plus className="h-3.5 w-3.5" /> Add Mapping
            </PmButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Source System</span>
            <select
              value={draft.sourceSystem}
              onChange={(e) => setDraft((d) => ({ ...d, sourceSystem: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6] bg-white"
            >
              {sourceSystems.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Source Field *</span>
            <input
              value={draft.sourceField}
              onChange={(e) => setDraft((d) => ({ ...d, sourceField: e.target.value }))}
              placeholder="e.g. gross_margin"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Transformation</span>
            <select
              value={draft.transformation}
              onChange={(e) => setDraft((d) => ({ ...d, transformation: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6] bg-white"
            >
              {mappingTypeOptions.slice(1).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Target Field *</span>
            <input
              value={draft.targetField}
              onChange={(e) => setDraft((d) => ({ ...d, targetField: e.target.value }))}
              placeholder="e.g. Gross Margin"
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6]"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-[#374151] mb-1">Target Category</span>
            <select
              value={draft.targetCategory}
              onChange={(e) => setDraft((d) => ({ ...d, targetCategory: e.target.value }))}
              className="w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#8B5CF6] bg-white"
            >
              {["KPI (Financial)", "KPI (People)", "KPI (Customer)", "KPI (Operations)"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </PmModal>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[#6B7280]">{label}</span>
      <span className="text-[#111827] font-semibold text-right">{value}</span>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  )
}
