"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Table,
} from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaStatusBadge } from "./fpa-status-badge"
import { useAppSelector } from "@/lib/store"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { Button } from "@/components/ui/button"
import {
  fpaApi,
  type FpaExportCapability,
  type FpaExportJob,
  type FpaExportType,
} from "@/lib/api/fpa-api"
import { downloadFpaExportFile } from "@/lib/fpa/download-export"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ReportTemplate = {
  name: string
  exportType: FpaExportType
  desc: string
  icon: typeof FileText
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    name: "Board Pack",
    exportType: "BOARD_PACK",
    desc: "12-section board deck: executive narrative, P&L, cash flow, variance analysis, scenarios, workforce, capex, risks, and action items.",
    icon: BarChart2,
  },
  {
    name: "Management Report",
    exportType: "MANAGEMENT_REPORT",
    desc: "Operating pack with KPI summary, department P&L, revenue bridge, monthly trends, and commentary tracker.",
    icon: FileText,
  },
  {
    name: "Financial Statements",
    exportType: "FINANCIAL_STATEMENTS",
    desc: "Full income statement, balance sheet, and cash flow with prior-year comparisons and accounting footnotes.",
    icon: Table,
  },
  {
    name: "Departmental Expenses",
    exportType: "DEPT_EXPENSES",
    desc: "Department-level expense detail, category breakdown, monthly burn, headcount allocation, and cost-per-FTE.",
    icon: FileText,
  },
]

const PERIOD_OPTIONS = [
  "Q2 FY2026 (Apr–Jun 2026)",
  "Q1 FY2026 (Jan–Mar 2026)",
  "FY2026 Full Year",
  "Rolling 12 Months",
]

const REPORT_NAMES = new Map<FpaExportType, string>(
  REPORT_TEMPLATES.map((template) => [template.exportType, template.name]),
)

const normalizeStatus = (status?: string) => (status || "PENDING").trim().toUpperCase()
const isReady = (status?: string) => ["READY", "COMPLETED"].includes(normalizeStatus(status))
const isActive = (status?: string) => ["PENDING", "RUNNING", "QUEUED", "PROCESSING"].includes(normalizeStatus(status))
const isFailed = (status?: string) =>
  ["FAILED", "ERROR", "CANCELLED", "CANCELED"].includes(normalizeStatus(status))

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const errorStatus = (error: unknown) => {
  if (!error || typeof error !== "object" || !("status" in error)) return null
  const status = Number((error as { status?: unknown }).status)
  return Number.isFinite(status) ? status : null
}

const reportName = (exportType: string) =>
  REPORT_NAMES.get(exportType as FpaExportType) || exportType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const statusTone = (status?: string): "success" | "info" | "danger" | "neutral" => {
  if (isReady(status)) return "success"
  if (isActive(status)) return "info"
  if (isFailed(status)) return "danger"
  return "neutral"
}

export function FpaReports() {
  const { selectedModelId, selectedVersionId, models } = useAppSelector((s) => s.fpa)
  const { canExportBoardPack, canPrepareReports } = useFpaPermissions()

  const modelName = useMemo(
    () => models.find((m) => m.id === selectedModelId)?.name || null,
    [models, selectedModelId],
  )

  const [period, setPeriod] = useState(PERIOD_OPTIONS[0])
  const [jobs, setJobs] = useState<FpaExportJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<Map<FpaExportType, FpaExportCapability> | null>(null)
  const [loadingCapabilities, setLoadingCapabilities] = useState(true)
  const [capabilitiesError, setCapabilitiesError] = useState<string | null>(null)
  const [templateErrors, setTemplateErrors] = useState<Partial<Record<FpaExportType, string>>>({})
  const [generatingType, setGeneratingType] = useState<FpaExportType | null>(null)
  const [previewReport, setPreviewReport] = useState<FpaExportJob | null>(null)
  const selectedModelIdRef = useRef(selectedModelId)
  selectedModelIdRef.current = selectedModelId

  const canGenerateForSelection = (canExportBoardPack || canPrepareReports) && !!selectedModelId

  const latestByType = useMemo(() => {
    const map = new Map<FpaExportType, FpaExportJob>()
    for (const job of jobs) {
      const type = job.exportType as FpaExportType
      if (!map.has(type)) map.set(type, job)
    }
    return map
  }, [jobs])

  const loadJobs = useCallback(async (showError = true) => {
    if (!selectedModelId) {
      setJobs([])
      setListError(null)
      setLoadingJobs(false)
      return
    }

    const requestedModelId = selectedModelId
    setLoadingJobs(true)
    setListError(null)
    try {
      const response = await fpaApi.listExports({ modelId: requestedModelId, limit: 20 })
      if (!response.success || !response.data) {
        throw new Error(response.message || "Could not load export jobs")
      }
      if (selectedModelIdRef.current !== requestedModelId) return
      setJobs(response.data)
    } catch (error) {
      if (selectedModelIdRef.current !== requestedModelId) return
      setJobs([])
      const message = errorMessage(error, "Could not load export jobs")
      setListError(message)
      if (showError) toast.error(message)
    } finally {
      if (selectedModelIdRef.current === requestedModelId) setLoadingJobs(false)
    }
  }, [selectedModelId])

  const loadCapabilities = useCallback(async () => {
    setLoadingCapabilities(true)
    setCapabilitiesError(null)
    setCapabilities(null)
    try {
      const response = await fpaApi.getExportCapabilities()
      if (!response.success || !response.data || !Array.isArray(response.data.exportTypes)) {
        throw new Error(response.message || "Could not load export capabilities")
      }

      const supported = new Map<FpaExportType, FpaExportCapability>()
      for (const capability of response.data.exportTypes) {
        const code = String(capability.code).trim().toUpperCase() as FpaExportType
        if (REPORT_NAMES.has(code)) supported.set(code, capability)
      }
      setCapabilities(supported)
    } catch (error) {
      setCapabilitiesError(errorMessage(error, "Could not load export capabilities"))
    } finally {
      setLoadingCapabilities(false)
    }
  }, [])

  useEffect(() => {
    void loadCapabilities()
  }, [loadCapabilities])

  useEffect(() => {
    setJobs([])
    setListError(null)
    setTemplateErrors({})
    setPreviewReport(null)
    void loadJobs()
  }, [loadJobs])

  const generateReport = async (exportType: FpaExportType) => {
    if (!selectedModelId) {
      toast.error("Select a model before generating a report")
      return
    }

    const capability = capabilities?.get(exportType)
    if (!capability?.enabled) {
      toast.error(
        capability?.reason ||
          (capabilities
            ? "This report type is not available from the server"
            : "Report availability has not been verified. Retry capability discovery."),
      )
      return
    }

    if (!canExportBoardPack && !canPrepareReports) {
      toast.error("You do not have permission to generate reports")
      return
    }

    setGeneratingType(exportType)
    setTemplateErrors((current) => ({ ...current, [exportType]: undefined }))
    try {
      const response = await fpaApi.createExport({
        modelId: selectedModelId,
        versionId: selectedVersionId || undefined,
        exportType,
        period,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || "Could not create export")
      }

      let job = response.data
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)])
      await loadJobs(false)

      for (let attempt = 0; attempt < 8 && isActive(job.status); attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500))
        try {
          const pollResponse = await fpaApi.getExport(job.id)
          if (!pollResponse.success || !pollResponse.data) break
          job = pollResponse.data
          setJobs((current) => [
            job,
            ...current.filter((item) => item.id !== job.id),
          ])
        } catch {
          break
        }
      }

      await loadJobs(false)
      if (isReady(job.status)) {
        toast.success(`${reportName(exportType)} is ready to download`)
      } else if (isFailed(job.status)) {
        toast.error(`${reportName(exportType)} export ${normalizeStatus(job.status).toLowerCase()}`)
      } else {
        toast.message("Export queued", {
          description: "Generation is continuing on the server. Refresh the jobs list shortly.",
        })
      }
    } catch (error) {
      const message = errorMessage(error, "Could not create export")
      const status = errorStatus(error)
      if (status != null && status >= 400 && status < 500) {
        setTemplateErrors((current) => ({ ...current, [exportType]: message }))
      }
      toast.error(message)
    } finally {
      setGeneratingType(null)
    }
  }

  const handleDownload = async (job: FpaExportJob) => {
    if (!isReady(job.status)) {
      toast.error(`This export is ${normalizeStatus(job.status).toLowerCase()} and is not ready to download`)
      return
    }

    try {
      const result = await downloadFpaExportFile({
        exportId: job.id,
        url: job.downloadUrl || job.url,
        filename: `${reportName(job.exportType).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "fpa-export"}.xlsx`,
      })
      toast.success(`Downloaded ${result.filename}`)
    } catch (error) {
      toast.error(errorMessage(error, "Could not download the export"))
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "—"
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="Reports" hideFilters />

      <div className="px-4 sm:px-5 pb-6 space-y-4 w-full">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[#64748b] max-w-3xl">
              Generate board-ready financial packs from the selected model and version.
            </p>
            {!selectedModelId ? (
              <p className="mt-1 text-xs font-medium text-[#b42318]">
                Select a model to load, generate, and download reports.
              </p>
            ) : (
              <p className="mt-1 text-xs text-[#98a2b3]">
                Model: {modelName || selectedModelId}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] font-semibold text-[#667085] uppercase tracking-wide">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 rounded-full border border-[#d0d5dd] bg-white px-4 text-xs font-medium text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingCapabilities ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#b2ddff] bg-[#eff8ff] px-4 py-3 text-xs text-[#175cd3]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking which report exports are available…
          </div>
        ) : null}

        {capabilitiesError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#fecdca] bg-[#fffbfa] px-4 py-3"
          >
            <div>
              <p className="text-xs font-semibold text-[#b42318]">
                Report availability could not be verified
              </p>
              <p className="mt-0.5 text-[11px] text-[#b42318]">
                Generation is disabled until capability discovery succeeds: {capabilitiesError}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-4 text-xs font-semibold"
              disabled={loadingCapabilities}
              onClick={() => void loadCapabilities()}
            >
              {loadingCapabilities ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {REPORT_TEMPLATES.map((r) => {
            const isGenerating = generatingType === r.exportType
            const job = latestByType.get(r.exportType)
            const templateError = templateErrors[r.exportType]
            const capability = capabilities?.get(r.exportType)
            const capabilityReason = loadingCapabilities
              ? "Checking server availability…"
              : capabilitiesError
                ? "Availability could not be verified. Retry above."
                : !capability
                  ? "This export is not available from the server."
                  : !capability.enabled
                    ? capability.reason || "This export is disabled by the server."
                    : null
            const Icon = r.icon

            return (
              <article
                key={r.exportType}
                className="rounded-xl border border-[#eaecf0] bg-white p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-[#eff8ff] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#2563eb]" />
                  </div>
                  <div>
                    <h2 className="text-[13.5px] font-bold text-[#101828]">{r.name}</h2>
                    <p className="text-xs text-[#667085] mt-1 leading-relaxed">{r.desc}</p>
                    <p className="text-[10px] text-[#98a2b3] mt-2 font-medium">
                      {capability?.enabled && !loadingCapabilities
                        ? "Available · Server-generated export"
                        : "Server-generated export"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#f2f4f7] pt-4 mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#667085] uppercase tracking-wider font-semibold">
                      Status
                    </span>
                    {isGenerating ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2563eb] bg-[#eff8ff] px-2 py-0.5 rounded-full">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Generating
                      </span>
                    ) : (
                      <FpaStatusBadge tone={job ? statusTone(job.status) : "neutral"}>
                        {job ? normalizeStatus(job.status) : "Not generated"}
                      </FpaStatusBadge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={
                        isGenerating ||
                        !canGenerateForSelection ||
                        loadingCapabilities ||
                        !!capabilitiesError ||
                        !capability?.enabled
                      }
                      onClick={() => generateReport(r.exportType)}
                      className="rounded-full h-9 flex-1 min-w-[100px] text-xs font-semibold shadow-sm"
                      variant="gradient-info"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      Generate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!job || isGenerating}
                      onClick={() => job && setPreviewReport(job)}
                      className="rounded-full h-9 px-3 text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!job || !isReady(job.status) || isGenerating}
                      onClick={() => job && handleDownload(job)}
                      className="rounded-full h-9 flex-1 min-w-[100px] text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </div>
                  {templateError ? (
                    <p role="alert" className="text-[11px] leading-relaxed text-[#b42318]">
                      This template could not be generated: {templateError}
                    </p>
                  ) : null}
                  {capabilityReason ? (
                    <p
                      role={capabilitiesError || capability?.enabled === false ? "alert" : undefined}
                      className="text-[11px] leading-relaxed text-[#667085]"
                    >
                      {capabilityReason}
                    </p>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        {loadingJobs && selectedModelId ? (
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading recent export jobs…
          </div>
        ) : null}

        {listError && selectedModelId ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#fecdca] bg-[#fffbfa] px-4 py-3"
          >
            <p className="text-xs text-[#b42318]">Could not load recent export jobs: {listError}</p>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-4 text-xs font-semibold"
              disabled={loadingJobs}
              onClick={() => void loadJobs()}
            >
              {loadingJobs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Retry
            </Button>
          </div>
        ) : null}

        {jobs.length > 0 && (
          <section className="rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaecf0] flex items-center justify-between gap-2 bg-white">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#475467]" />
                <h2 className="text-[14px] font-semibold text-[#101828]">Recent Export Jobs</h2>
              </div>
              <span className="text-[11px] text-[#667085]">{jobs.length} jobs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-[#667085] text-[10px] uppercase font-bold">
                    <th className="px-5 py-3 font-semibold">Report</th>
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Completed</th>
                    <th className="px-4 py-3 font-semibold text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0] text-[12px]">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-[#f9fafb]/50">
                      <td className="px-5 py-3 font-semibold text-[#101828]">
                        {reportName(j.exportType)}
                      </td>
                      <td className="px-4 py-3 text-[#667085]">{j.period || "—"}</td>
                      <td className="px-4 py-3">
                        <FpaStatusBadge tone={statusTone(j.status)}>{normalizeStatus(j.status)}</FpaStatusBadge>
                      </td>
                      <td className="px-4 py-3 text-[#667085]">{j.createdAt ? formatTime(j.createdAt) : "—"}</td>
                      <td className="px-4 py-3 text-[#667085]">{j.completedAt ? formatTime(j.completedAt) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewReport(j)}
                            className="h-8 rounded-full border border-[#d0d5dd] bg-white px-3 font-semibold text-[#344054] hover:bg-[#f9fafb] inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(j)}
                            disabled={!isReady(j.status)}
                            className="h-8 rounded-full bg-[#2563eb] px-3 font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#98a2b3] inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#101828]">
              {previewReport ? reportName(previewReport.exportType) : "Export details"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-lg border border-[#eaecf0] bg-[#f9fafb] p-4">
            <p className="text-xs leading-relaxed text-[#667085]">
              File-content preview is unavailable for server-generated exports. Download the completed
              file to review its contents.
            </p>
            {previewReport ? (
              <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-xs">
                <dt className="font-semibold text-[#475467]">Job ID</dt>
                <dd className="break-all text-[#101828]">{previewReport.id}</dd>
                <dt className="font-semibold text-[#475467]">Model</dt>
                <dd className="break-all text-[#101828]">{modelName || previewReport.modelId}</dd>
                <dt className="font-semibold text-[#475467]">Version</dt>
                <dd className="break-all text-[#101828]">{previewReport.versionId || "—"}</dd>
                <dt className="font-semibold text-[#475467]">Period</dt>
                <dd className="text-[#101828]">{previewReport.period || "—"}</dd>
                <dt className="font-semibold text-[#475467]">Status</dt>
                <dd><FpaStatusBadge tone={statusTone(previewReport.status)}>{normalizeStatus(previewReport.status)}</FpaStatusBadge></dd>
                <dt className="font-semibold text-[#475467]">Created</dt>
                <dd className="text-[#101828]">{previewReport.createdAt ? formatTime(previewReport.createdAt) : "—"}</dd>
                <dt className="font-semibold text-[#475467]">Completed</dt>
                <dd className="text-[#101828]">{previewReport.completedAt ? formatTime(previewReport.completedAt) : "—"}</dd>
              </dl>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-9 px-5"
              onClick={() => setPreviewReport(null)}
            >
              Close
            </Button>
            {previewReport ? (
              <Button
                type="button"
                variant="gradient-info"
                disabled={!isReady(previewReport.status)}
                className="rounded-full h-9 px-5 shadow-sm"
                onClick={() => void handleDownload(previewReport)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download export
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
