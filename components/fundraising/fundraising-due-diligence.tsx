"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Download,
  FilePenLine,
  Gavel,
  Info,
  Loader2,
  Paperclip,
  Plus,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { downloadCsvPayload, exportFundraisingCsv } from "@/lib/fundraising/export"
import { mapDdqCaseToInvestorCard, mapDdqItemToMatrixRow } from "@/lib/fundraising/mappers"
import {
  FrDialogShell,
  FrField,
  FrTableSkeleton,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type DdInvestorCard = ReturnType<typeof mapDdqCaseToInvestorCard>
type DdMatrixRow = ReturnType<typeof mapDdqItemToMatrixRow>

type EvidenceMeta = { fileName: string; url: string }

function evidenceMeta(value: Record<string, any> | null | undefined, fallbackName = ""): EvidenceMeta {
  const direct = value?._uploadedEvidence || value?.evidence || value?.uploadedEvidence || value
  const evidence = Array.isArray(direct) ? direct[direct.length - 1] : direct
  const nested = evidence?.evidence || evidence?.item?.evidence || evidence
  const url =
    nested?.url ||
    nested?.downloadUrl ||
    nested?.fileUrl ||
    evidence?.url ||
    evidence?.downloadUrl ||
    evidence?.fileUrl ||
    ""
  return {
    fileName:
      nested?.fileName ||
      nested?.filename ||
      nested?.name ||
      evidence?.fileName ||
      evidence?.filename ||
      fallbackName ||
      (url ? "Evidence file" : ""),
    url,
  }
}

function statusStyle(status: string) {
  const u = status.toUpperCase()
  if (u === "REVIEWED" || u === "COMPLETED") return { wrap: "bg-[#dcfce7] text-[#15803d]", dot: "bg-[#16a34a]" }
  if (u === "UPLOADED") return { wrap: "bg-[#dbeafe] text-[#1d4ed8]", dot: "bg-[#2563eb]" }
  if (u === "FOLLOW-UP" || u === "FOLLOW_UP") return { wrap: "bg-[#ffedd5] text-[#c2410c]", dot: "bg-[#ea580c]" }
  return { wrap: "bg-[#ede9fe] text-[#6d28d9]", dot: "bg-[#7c3aed]" }
}

function completionTone(pct: number) {
  if (pct >= 70) return "text-[#16a34a]"
  if (pct >= 50) return "text-[#d97706]"
  return "text-[#ea580c]"
}

function StatusPill({ status }: { status: string }) {
  const style = statusStyle(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[11px] font-medium",
        style.wrap,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  )
}

function InvestorCard({
  investor,
  selected,
  onSelect,
}: {
  investor: DdInvestorCard
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-[6px] border p-3 text-left transition-colors",
        selected ? "border-[#c4b5fd] bg-[#f5f3ff]" : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[10px] font-bold"
          style={{ backgroundColor: investor.logoBg, color: investor.logoText }}
        >
          {investor.logoLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-[#0f172a]">{investor.name}</p>
              <p className="mt-0.5 text-[10px] text-[#94a3b8]">Lead: {investor.lead}</p>
            </div>
            <span className={cn("shrink-0 text-[12px] font-bold tabular-nums", completionTone(investor.completion))}>
              {investor.completion}%
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-[2px] bg-[#f1f5f9]">
            <div className="h-full rounded-[2px] bg-[#16a34a]" style={{ width: `${investor.completion}%` }} />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-[#f1f5f9] pt-2">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">Open</p>
              <p className="text-[12px] font-semibold tabular-nums text-[#0f172a]">{investor.open}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">Overdue</p>
              <p className={cn("text-[12px] font-semibold tabular-nums", investor.overdue > 0 ? "text-[#dc2626]" : "text-[#0f172a]")}>
                {investor.overdue}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#94a3b8]">Days in DD</p>
              <p className="text-[12px] font-semibold tabular-nums text-[#0f172a]">{investor.daysInDd}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export function FundraisingDueDiligence() {
  const [loading, setLoading] = useState(true)
  const [rawCases, setRawCases] = useState<Record<string, any>[]>([])
  const [templates, setTemplates] = useState<Record<string, any>[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [addCaseOpen, setAddCaseOpen] = useState(false)
  const [creatingCase, setCreatingCase] = useState(false)
  const [exporting, setExporting] = useState<"report" | "matrix" | null>(null)
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingItemRef = useRef<string | null>(null)

  const [loadingRefs, setLoadingRefs] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])

  const [caseForm, setCaseForm] = useState({ investorId: "", campaignId: "", templateId: "", title: "" })

  const investorCards = useMemo(() => rawCases.map(mapDdqCaseToInvestorCard), [rawCases])
  const selected = investorCards.find((c) => c.id === selectedId) ?? null
  const selectedCase = rawCases.find((c) => String(c.id) === selectedId) ?? null

  const matrixGrouped = useMemo(() => {
    const items = Array.isArray(selectedCase?.items) ? selectedCase.items : []
    const rows: DdMatrixRow[] = items.map(mapDdqItemToMatrixRow)
    const byCategory = new Map<string, DdMatrixRow[]>()
    rows.forEach((r) => {
      const arr = byCategory.get(r.category) ?? []
      arr.push(r)
      byCategory.set(r.category, arr)
    })
    return Array.from(byCategory.entries()).map(([category, items]) => ({ category, items }))
  }, [selectedCase])

  async function loadCases() {
    setLoading(true)
    try {
      const [caseRes, tplRes] = await Promise.allSettled([
        fundraisingApi.listDdqCases(),
        fundraisingApi.listDdqTemplates(),
      ])
      setRawCases(caseRes.status === "fulfilled" ? caseRes.value ?? [] : [])
      setTemplates(tplRes.status === "fulfilled" ? tplRes.value ?? [] : [])
      if (caseRes.status === "rejected") toastFrError(caseRes.reason, "Could not load DDQ cases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  useEffect(() => {
    if (!addCaseOpen) return
    setLoadingRefs(true)
    Promise.allSettled([
      fundraisingApi.listInvestors({ pageSize: 100 }),
      fundraisingApi.listCampaigns(),
    ])
      .then(([invRes, campRes]) => {
        setInvestors(invRes.status === "fulfilled" ? invRes.value.items ?? [] : [])
        setCampaigns(campRes.status === "fulfilled" ? campRes.value ?? [] : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [addCaseOpen])

  async function selectCase(id: string) {
    setSelectedId(id)
    const existing = rawCases.find((c) => String(c.id) === id)
    if (existing?.items) return
    setLoadingDetail(true)
    try {
      const detail = await fundraisingApi.getDdqCase(id)
      setRawCases((prev) => prev.map((c) => (String(c.id) === id ? { ...c, ...detail } : c)))
    } catch (err) {
      toastFrError(err, "Could not load case detail")
    } finally {
      setLoadingDetail(false)
    }
  }

  function triggerEvidenceUpload(itemId: string) {
    pendingItemRef.current = itemId
    fileInputRef.current?.click()
  }

  async function handleEvidenceFile(file: File | null) {
    const itemId = pendingItemRef.current
    pendingItemRef.current = null
    if (!file || !itemId || !selectedId) return
    setUploadingItemId(itemId)
    try {
      const uploaded = await fundraisingApi.uploadDdqEvidence(selectedId, itemId, file)
      const uploadedEvidence = evidenceMeta(uploaded, file.name)
      toast.success("Evidence uploaded")
      const detail = await fundraisingApi.getDdqCase(selectedId)
      const currentItems = Array.isArray(selectedCase?.items) ? selectedCase.items : []
      const detailItems = Array.isArray(detail?.items) ? detail.items : currentItems
      const items = detailItems.map((item: Record<string, any>) =>
        String(item.id) === itemId ? { ...item, _uploadedEvidence: uploadedEvidence } : item,
      )
      setRawCases((prev) =>
        prev.map((c) =>
          String(c.id) === selectedId
            ? { ...c, ...detail, items }
            : c,
        ),
      )
    } catch (err) {
      toastFrError(err, "Could not upload evidence")
    } finally {
      setUploadingItemId(null)
    }
  }

  async function updateCaseStatus(status: string) {
    if (!selectedId) return
    try {
      const detail = await fundraisingApi.patchDdqCase(selectedId, { status })
      setRawCases((prev) => prev.map((c) => (String(c.id) === selectedId ? { ...c, ...detail } : c)))
      toast.success("DDQ status updated")
    } catch (err) {
      toastFrError(err, "Could not update DDQ status")
    }
  }

  const totalOpen = investorCards.reduce((s, c) => s + c.open, 0)
  const totalOverdue = investorCards.reduce((s, c) => s + c.overdue, 0)
  const avgCompletion = investorCards.length
    ? Math.round(investorCards.reduce((s, c) => s + c.completion, 0) / investorCards.length)
    : 0

  function loadedMatrixRows() {
    return rawCases.flatMap((ddqCase) =>
      (Array.isArray(ddqCase.items) ? ddqCase.items : []).map((item: Record<string, any>) => ({
        caseId: String(ddqCase.id),
        caseTitle: ddqCase.title || ddqCase.investor?.legalName || ddqCase.investorName || "DDQ case",
        ...mapDdqItemToMatrixRow(item),
      })),
    )
  }

  function exportLoadedRows(kind: "report" | "matrix") {
    if (kind === "report") {
      const rows = selectedId ? investorCards.filter((card) => card.id === selectedId) : investorCards
      exportFundraisingCsv(
        rows,
        [
          { key: "name", label: "Investor / Case" },
          { key: "lead", label: "Lead" },
          { key: "completion", label: "Completion %" },
          { key: "open", label: "Open Items" },
          { key: "overdue", label: "Overdue Items" },
          { key: "daysInDd", label: "Days in DD" },
        ],
        selectedId ? `ddq-report-${selectedId}` : "ddq-overview",
      )
      return
    }
    const rows = selectedId
      ? loadedMatrixRows().filter((row) => row.caseId === selectedId)
      : loadedMatrixRows()
    exportFundraisingCsv(
      rows,
      [
        { key: "caseTitle", label: "Case" },
        { key: "category", label: "Category" },
        { key: "document", label: "Item" },
        { key: "status", label: "Status" },
        { key: "lastUpdated", label: "Last Updated" },
        { key: "owner", label: "Owner" },
      ],
      selectedId ? `ddq-matrix-${selectedId}` : "ddq-matrix",
    )
  }

  async function handleExport(kind: "report" | "matrix") {
    setExporting(kind)
    try {
      if (selectedId) {
        try {
          const payload = await fundraisingApi.exportDdqCase(selectedId)
          downloadCsvPayload(payload, `ddq-${kind}-${selectedId}`)
        } catch {
          exportLoadedRows(kind)
          toast.info("Server export unavailable; exported the loaded data instead")
        }
      } else {
        exportLoadedRows(kind)
      }
    } catch (err) {
      toastFrError(err, `Could not export DDQ ${kind}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          handleEvidenceFile(e.target.files?.[0] ?? null)
          e.target.value = ""
        }}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[#0f172a] md:text-[22px]">
          Due Diligence
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="h-9 rounded-full px-4 shadow-sm" disabled={exporting !== null} onClick={() => handleExport("report")}>
            {exporting === "report" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting === "report" ? "Exporting…" : "Export Report"}
          </Button>
          <Button
            variant="gradient-info" className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
            onClick={() => setAddCaseOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New DDQ Case
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={cn(CARD, "h-[112px] animate-pulse bg-[#f1f5f9]")} />
            ))
          : [
          { label: "Active Investors in DD", value: investorCards.length, icon: Users, color: "#2563eb", bg: "#dbeafe" },
          { label: "Open Items", value: totalOpen, icon: FilePenLine, color: "#d97706", bg: "#fef3c7" },
          { label: "Overdue Items", value: totalOverdue, icon: FilePenLine, color: "#dc2626", bg: "#fee2e2" },
          { label: "Avg. Completion", value: `${avgCompletion}%`, icon: Gavel, color: "#16a34a", bg: "#dcfce7" },
          { label: "DDQ Templates", value: templates.length, icon: CalendarDays, color: "#7c3aed", bg: "#ede9fe" },
        ].map((kpi) => (
          <div key={kpi.label} className={cn(CARD, "flex flex-col p-3.5")}>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: kpi.bg, color: kpi.color }}
            >
              <kpi.icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <p className="mt-2.5 text-[11px] font-medium leading-snug text-[#64748b]">{kpi.label}</p>
            <p className="mt-1.5 text-[22px] font-bold leading-none tabular-nums text-[#0f172a]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className={cn(CARD, "space-y-2 p-3")}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[96px] animate-pulse rounded-[6px] bg-[#f1f5f9]" />
            ))}
          </aside>
          <section className={cn(CARD, "overflow-hidden")}>
            <div className="h-14 animate-pulse border-b border-[#f1f5f9] bg-[#f8fafc]" />
            <table className="w-full">
              <tbody><FrTableSkeleton columns={5} rows={7} /></tbody>
            </table>
          </section>
        </div>
      ) : investorCards.length === 0 ? (
        <div className="mt-5 rounded-[10px] border border-[#e2e8f0] bg-white p-10 text-center text-[13px] text-[#94a3b8]">
          No DDQ cases yet. Create one to start tracking due diligence for an investor.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className={cn(CARD, "flex flex-col overflow-hidden")}>
            <div className="flex items-center gap-2 border-b border-[#f1f5f9] px-3 py-3">
              <h2 className="text-[13px] font-semibold text-[#0f172a]">Active Investors in DD</h2>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] bg-[#f1f5f9] px-1.5 text-[11px] font-semibold text-[#64748b]">
                {investorCards.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-2.5">
              {investorCards.map((inv) => (
                <InvestorCard key={inv.id} investor={inv} selected={selected?.id === inv.id} onSelect={() => selectCase(inv.id)} />
              ))}
            </div>
          </aside>

          <section className={cn(CARD, "flex min-w-0 flex-col overflow-hidden")}>
            <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[13px] font-semibold text-[#0f172a]">Due Diligence Matrix</h2>
                <button
                  type="button"
                  className="rounded-full p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
                  title="Item status by category for the selected case"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedId ?? ""} onValueChange={selectCase}>
                  <SelectTrigger className="h-8 w-full rounded-full border-[#e2e8f0] text-[12px] sm:w-[220px]">
                    <SelectValue placeholder="Select a case" />
                  </SelectTrigger>
                  <SelectContent>
                    {investorCards.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full border-[#e2e8f0]"
                  disabled={exporting !== null}
                  onClick={() => handleExport("matrix")}
                >
                  {exporting === "matrix" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-[#64748b]" />}
                  <span className="sr-only">Export matrix</span>
                </Button>
              </div>
            </div>

            {!selected ? (
              <p className="px-4 py-16 text-center text-[12px] text-[#94a3b8]">
                Select a case to view its due diligence matrix.
              </p>
            ) : loadingDetail ? (
              <table className="w-full"><tbody><FrTableSkeleton columns={5} rows={7} /></tbody></table>
            ) : matrixGrouped.length === 0 ? (
              <p className="px-4 py-16 text-center text-[12px] text-[#94a3b8]">
                No items on this case yet.
              </p>
            ) : (
              <>
              <div className="grid gap-2 border-b border-[#f1f5f9] bg-[#fafafa] px-3 py-3 sm:grid-cols-4">
                <div><p className="text-[9px] text-[#94a3b8]">Investor / case</p><p className="text-[11px] font-medium text-[#0f172a]">{selected.name}</p></div>
                <div><p className="text-[9px] text-[#94a3b8]">Owner</p><p className="text-[11px] font-medium text-[#0f172a]">{selected.lead}</p></div>
                <div><p className="text-[9px] text-[#94a3b8]">Progress</p><p className="text-[11px] font-medium text-[#0f172a]">{selected.completion}%</p></div>
                <select className="h-8 rounded-full border border-[#e2e8f0] bg-white px-3 text-[10px]" value={String(selectedCase?.status || "NOT_STARTED")} onChange={(e) => updateCaseStatus(e.target.value)}>
                  <option value="NOT_STARTED">Not started</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="INTERNAL_REVIEW">Internal review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                      <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Category</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Item</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Status ({selected.name})</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Last Updated</th>
                      <th className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixGrouped.map(({ category, items }) =>
                      items.map((row, index) => (
                        <tr key={row.id} className="border-b border-[#f1f5f9] last:border-b-0 hover:bg-[#f8fafc]">
                          {index === 0 ? (
                            <td rowSpan={items.length} className="align-top border-r border-[#f1f5f9] px-3 py-2.5">
                              <span className="text-[11px] font-semibold text-[#0f172a]">{category}</span>
                            </td>
                          ) : null}
                          <td className="px-3 py-2 text-[12px] text-[#0f172a]">{row.document}</td>
                          <td className="px-3 py-2"><StatusPill status={row.status} /></td>
                          <td className="whitespace-nowrap px-3 py-2 text-[11px] text-[#64748b]">{row.lastUpdated}</td>
                          <td className="px-3 py-2">
                            {(() => {
                              const evidence = evidenceMeta(row.raw)
                              return evidence.fileName ? (
                                evidence.url ? (
                                  <a
                                    href={evidence.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mb-1 block max-w-[180px] truncate text-[10px] font-medium text-[#2563eb] hover:underline"
                                    title={evidence.fileName}
                                  >
                                    {evidence.fileName}
                                  </a>
                                ) : (
                                  <span className="mb-1 block max-w-[180px] truncate text-[10px] text-[#475569]" title={evidence.fileName}>
                                    {evidence.fileName}
                                  </span>
                                )
                              ) : null
                            })()}
                            <button
                              type="button"
                              disabled={uploadingItemId === row.id}
                              onClick={() => triggerEvidenceUpload(row.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] px-2 py-1 text-[10px] font-medium text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50"
                            >
                              {uploadingItemId === row.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Paperclip className="h-3 w-3" />
                              )}
                              Upload
                            </button>
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </section>
        </div>
      )}

      <FrDialogShell
        open={addCaseOpen}
        onOpenChange={(v) => {
          setAddCaseOpen(v)
          if (!v) setCaseForm({ investorId: "", campaignId: "", templateId: "", title: "" })
        }}
        title="New DDQ Case"
        description="Start a due diligence questionnaire case for an investor"
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={() => setAddCaseOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient-info"
              className="rounded-full h-9 px-5 shadow-sm font-semibold text-xs gap-2"
              disabled={!caseForm.investorId || !caseForm.title.trim() || creatingCase}
              onClick={async () => {
                setCreatingCase(true)
                try {
                  const created = await fundraisingApi.createDdqCase({
                    investorId: caseForm.investorId,
                    campaignId: caseForm.campaignId || undefined,
                    templateId: caseForm.templateId || undefined,
                    title: caseForm.title.trim(),
                  })
                  toast.success("DDQ case created")
                  setAddCaseOpen(false)
                  setCaseForm({ investorId: "", campaignId: "", templateId: "", title: "" })
                  await loadCases()
                  if (created?.id) selectCase(String(created.id))
                } catch (err) {
                  toastFrError(err, "Could not create DDQ case")
                } finally {
                  setCreatingCase(false)
                }
              }}
            >
              {creatingCase ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {creatingCase ? "Creating…" : "Create case"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FrField label="Investor">
            <select
              className={frSelectClass}
              value={caseForm.investorId}
              disabled={loadingRefs}
              onChange={(e) => setCaseForm((f) => ({ ...f, investorId: e.target.value }))}
            >
              <option value="">{loadingRefs ? "Loading investors…" : "Select investor"}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>{i.legalName || i.name}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Case title">
            <input
              className={frInputClass}
              value={caseForm.title}
              onChange={(e) => setCaseForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Fund IV DDQ — National Pension Fund"
            />
          </FrField>
          <FrField label="Campaign (optional)">
            <select
              className={frSelectClass}
              value={caseForm.campaignId}
              disabled={loadingRefs}
              onChange={(e) => setCaseForm((f) => ({ ...f, campaignId: e.target.value }))}
            >
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Template (optional)">
            <select
              className={frSelectClass}
              value={caseForm.templateId}
              onChange={(e) => setCaseForm((f) => ({ ...f, templateId: e.target.value }))}
            >
              <option value="">{templates.length === 0 ? "No templates available" : "None"}</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </FrField>
        </div>
      </FrDialogShell>
    </div>
  )
}
