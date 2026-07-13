"use client"

import { useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaStatusBadge } from "./fpa-status-badge"
import { FpaExportDownloadModal } from "@/components/fpa/fpa-export-download-modal"
import { extractFpaExportId } from "@/lib/fpa/download-export"
import { fpaApi, type FpaExportJob } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"

const REPORT_TYPES: Array<{ name: string; exportType: "BOARD_PACK" | "MANAGEMENT_REPORT"; desc: string }> = [
  { name: "Board pack", exportType: "BOARD_PACK", desc: "Executive summary for board distribution" },
  { name: "Management report", exportType: "MANAGEMENT_REPORT", desc: "Operating pack for leadership" },
]

export function FpaReports() {
  const { selectedModelId, selectedVersionId } = useAppSelector((s) => s.fpa)
  const { canExportBoardPack, canPrepareReports } = useFpaPermissions()
  const [jobs, setJobs] = useState<FpaExportJob[]>([])
  const [busyType, setBusyType] = useState<string | null>(null)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [downloadJob, setDownloadJob] = useState<FpaExportJob | null>(null)

  const canGenerate = canExportBoardPack || canPrepareReports

  const generate = async (exportType: "BOARD_PACK" | "MANAGEMENT_REPORT") => {
    if (!selectedModelId) {
      toast.error("Select a model first")
      return
    }
    setBusyType(exportType)
    try {
      const res = await fpaApi.createExport({
        modelId: selectedModelId,
        versionId: selectedVersionId || undefined,
        exportType,
      })
      if (!res.success || !res.data) throw new Error(res.message || "Export failed")
      setJobs((prev) => [res.data!, ...prev])
      toast.success(`${exportType.replace("_", " ")} queued`)
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/v1/fpa/exports/board-pack",
        method: "POST",
        message: errorMessage(err),
        impact: "Reports Generate/Export failed",
        request: { exportType, modelId: selectedModelId, versionId: selectedVersionId },
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusyType(null)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="Reports" />

      <div className="p-4 sm:p-5 space-y-4">
        <p className="text-sm text-[#64748b]">
          Board packs and management reports from the selected model/version. Generate queues an export job via the API.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {REPORT_TYPES.map((r) => {
            const job = jobs.find((j) => j.exportType === r.exportType)
            const busy = busyType === r.exportType
            return (
              <article key={r.exportType} className="rounded-md border border-[#e2e8f0] bg-white p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-[#eff6ff] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#2563eb]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-[#0f172a]">{r.name}</h2>
                    <p className="text-xs text-[#64748b] mt-1">{r.desc}</p>
                  </div>
                </div>
                <FpaStatusBadge tone={job?.status === "COMPLETED" ? "success" : job ? "info" : "neutral"}>
                  {job?.status || "Not generated"}
                </FpaStatusBadge>
                <div className="flex gap-2 mt-auto">
                  <button
                    type="button"
                    disabled={busy || !selectedModelId || !canGenerate}
                    onClick={() => void generate(r.exportType)}
                    className="h-9 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#2563eb] text-xs font-medium text-white disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Generate
                  </button>
                  <button
                    type="button"
                    disabled={!job}
                    onClick={() => {
                      if (!job) return
                      setDownloadJob(job)
                      setDownloadOpen(true)
                    }}
                    className="h-9 flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e2e8f0] text-xs font-medium text-[#475569] disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {jobs.length > 0 && (
          <section className="rounded-md border border-[#e2e8f0] bg-white p-4">
            <h2 className="text-sm font-semibold mb-2">Recent jobs</h2>
            <ul className="space-y-1 text-xs text-[#475569]">
              {jobs.map((j) => (
                <li key={j.id}>
                  {j.exportType} · {j.status} · {j.id.slice(0, 8)}…
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <FpaExportDownloadModal
        open={downloadOpen}
        onOpenChange={(open) => {
          setDownloadOpen(open)
          if (!open) setDownloadJob(null)
        }}
        title={downloadJob?.exportType === "BOARD_PACK" ? "Board pack" : "Management report"}
        description="Download the generated report file."
        url={downloadJob?.downloadUrl || downloadJob?.url}
        exportId={
          downloadJob?.id ||
          (downloadJob?.downloadUrl || downloadJob?.url
            ? extractFpaExportId(String(downloadJob.downloadUrl || downloadJob.url))
            : null)
        }
        filename={`${(downloadJob?.exportType || "report").toLowerCase()}.json`}
      />
    </div>
  )
}
