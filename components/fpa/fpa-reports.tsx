"use client"

import { useMemo, useState } from "react"
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  downloadGeneratedReport,
  generateLocalReport,
  reportFormatLabel,
  reportTypeLabel,
  reportSectionCount,
  type GeneratedReport,
  type LocalReportType,
} from "@/lib/fpa/local-report-export"

type ReportTemplate = {
  name: string
  exportType: LocalReportType
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

type ReportJob = GeneratedReport & { id: string }

const PERIOD_OPTIONS = [
  "Q2 FY2026 (Apr–Jun 2026)",
  "Q1 FY2026 (Jan–Mar 2026)",
  "FY2026 Full Year",
  "Rolling 12 Months",
]

export function FpaReports() {
  const { selectedModelId, models } = useAppSelector((s) => s.fpa)
  const { canExportBoardPack, canPrepareReports } = useFpaPermissions()

  const modelName = useMemo(
    () => models.find((m) => m.id === selectedModelId)?.name || "FY2026 Consolidated Model",
    [models, selectedModelId],
  )

  const [period, setPeriod] = useState(PERIOD_OPTIONS[0])
  const [jobs, setJobs] = useState<ReportJob[]>([])
  const [generatingType, setGeneratingType] = useState<LocalReportType | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null)

  const canGenerate = canExportBoardPack || canPrepareReports

  const latestByType = useMemo(() => {
    const map = new Map<LocalReportType, ReportJob>()
    for (const job of jobs) {
      if (!map.has(job.exportType)) map.set(job.exportType, job)
    }
    return map
  }, [jobs])

  const generateReport = (exportType: LocalReportType) => {
    setGeneratingType(exportType)
    setGenerationProgress(0)

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 100
        }
        return prev + 18
      })
    }, 120)

    setTimeout(() => {
      clearInterval(interval)
      setGenerationProgress(100)

      const report = generateLocalReport(exportType, { modelName, period })
      const job: ReportJob = { ...report, id: `job-${Date.now()}` }
      setJobs((prev) => [job, ...prev])
      setGeneratingType(null)
      toast.success(`${reportTypeLabel(exportType)} generated`)
    }, 900)
  }

  const handleDownload = (job: ReportJob) => {
    downloadGeneratedReport(job)
    toast.success("Download started")
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
      return "Just now"
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="Reports" />

      <div className="px-4 sm:px-5 pb-6 space-y-4 w-full">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-[#64748b] max-w-3xl">
            Board-ready financial packs with document control headers, multi-section analysis, variance
            commentary, and downloadable CSV/JSON workbooks suitable for Excel review.
          </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {REPORT_TEMPLATES.map((r) => {
            const isGenerating = generatingType === r.exportType
            const job = latestByType.get(r.exportType)
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
                      {reportSectionCount(r.exportType)} sections · {reportFormatLabel(r.exportType)}
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
                        Generating ({generationProgress}%)
                      </span>
                    ) : (
                      <FpaStatusBadge tone={job ? "success" : "neutral"}>
                        {job ? "Ready" : "Not generated"}
                      </FpaStatusBadge>
                    )}
                  </div>

                  {isGenerating && (
                    <div className="h-1.5 rounded-full bg-[#eaecf0] overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb] transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isGenerating || !canGenerate}
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
                      disabled={!job || isGenerating}
                      onClick={() => job && handleDownload(job)}
                      className="rounded-full h-9 flex-1 min-w-[100px] text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {jobs.length > 0 && (
          <section className="rounded-xl border border-[#eaecf0] bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaecf0] flex items-center justify-between gap-2 bg-white">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#475467]" />
                <h2 className="text-[14px] font-semibold text-[#101828]">Recent Export Jobs</h2>
              </div>
              <span className="text-[11px] text-[#667085]">{jobs.length} generated</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#eaecf0] bg-[#f9fafb] text-[#667085] text-[10px] uppercase font-bold">
                    <th className="px-5 py-3 font-semibold">Report</th>
                    <th className="px-4 py-3 font-semibold">Model</th>
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 font-semibold">Format</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaecf0] text-[12px]">
                  {jobs.map((j) => (
                    <tr key={j.id} className="hover:bg-[#f9fafb]/50">
                      <td className="px-5 py-3 font-semibold text-[#101828]">
                        {reportTypeLabel(j.exportType)}
                      </td>
                      <td className="px-4 py-3 text-[#475467]">{modelName}</td>
                      <td className="px-4 py-3 text-[#667085]">{period}</td>
                      <td className="px-4 py-3 font-semibold text-[#344054]">
                        {reportFormatLabel(j.exportType)}
                      </td>
                      <td className="px-4 py-3 text-[#475467] font-semibold">{j.sizeLabel}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatTime(j.generatedAt)}</td>
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
                            className="h-8 rounded-full bg-[#2563eb] px-3 font-semibold text-white hover:bg-[#1d4ed8] inline-flex items-center gap-1"
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
              {previewReport ? reportTypeLabel(previewReport.exportType) : "Report preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-lg border border-[#eaecf0] bg-[#f9fafb] p-3">
            <pre className="text-[11px] leading-relaxed text-[#344054] whitespace-pre-wrap font-mono">
              {previewReport?.content.slice(0, 12000)}
              {(previewReport?.content.length || 0) > 12000 ? "\n\n… truncated preview (download for full report) …" : ""}
            </pre>
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
                className="rounded-full h-9 px-5 shadow-sm"
                onClick={() => {
                  downloadGeneratedReport(previewReport)
                  toast.success("Download started")
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download {previewReport.filename}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
