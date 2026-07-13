"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { downloadFpaExportFile, extractFpaExportId } from "@/lib/fpa/download-export"
import { errorMessage } from "@/lib/fpa/fpa-api-gaps"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  /** Absolute or relative export URL from the API */
  url?: string | null
  exportId?: string | null
  filename?: string
}

export function FpaExportDownloadModal({
  open,
  onOpenChange,
  title = "Download export",
  description = "Your file is being prepared.",
  url,
  exportId,
  filename,
}: Props) {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [savedAs, setSavedAs] = useState<string | null>(null)
  const [formatNote, setFormatNote] = useState<string | null>(null)

  const resolvedId = exportId || (url ? extractFpaExportId(url) : null)

  const runDownload = async () => {
    setStatus("loading")
    setError(null)
    setSavedAs(null)
    setFormatNote(null)
    try {
      const result = await downloadFpaExportFile({
        exportId: resolvedId,
        url,
        filename,
      })
      setSavedAs(result.filename)
      if (result.format === "csv") {
        setFormatNote(
          "Saved as CSV fallback. Prefer regenerating the board pack so the API returns .xlsx.",
        )
      } else if (result.format === "json") {
        setFormatNote(
          "API returned JSON instead of a workbook — regenerate board pack or check export job.",
        )
      } else {
        setFormatNote("Excel workbook download started.")
      }
      setStatus("done")
    } catch (err) {
      setError(errorMessage(err, "Download failed"))
      setStatus("error")
    }
  }

  useEffect(() => {
    if (!open) return
    void runDownload()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when modal opens / target changes
  }, [open, resolvedId, url, filename])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-[#e2e8f0] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9]">
          <DialogTitle className="text-base text-[#0f172a]">{title}</DialogTitle>
          <DialogDescription className="text-sm text-[#64748b]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-6 flex flex-col items-center text-center gap-3">
          {status === "loading" && (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
              <p className="text-sm text-[#475569]">Downloading…</p>
            </>
          )}
          {status === "done" && (
            <>
              <div className="h-10 w-10 rounded-full bg-[#ecfdf5] flex items-center justify-center">
                <Download className="w-5 h-5 text-[#059669]" />
              </div>
              <p className="text-sm font-medium text-[#0f172a]">Download started</p>
              {savedAs ? (
                <p className="text-xs text-[#64748b] truncate max-w-full">{savedAs}</p>
              ) : null}
              {formatNote ? (
                <p className="text-[11px] text-[#64748b] leading-relaxed max-w-sm">{formatNote}</p>
              ) : null}
            </>
          )}
          {status === "error" && (
            <>
              <div className="h-10 w-10 rounded-full bg-[#fef2f2] flex items-center justify-center">
                <X className="w-5 h-5 text-[#dc2626]" />
              </div>
              <p className="text-sm font-medium text-[#0f172a]">Couldn’t download</p>
              <p className="text-xs text-[#64748b]">{error}</p>
            </>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          {status === "error" ? (
            <button
              type="button"
              onClick={() => void runDownload()}
              className="h-9 flex-1 rounded-full bg-[#2563eb] text-sm font-medium text-white"
            >
              Try again
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 flex-1 rounded-full border border-[#e2e8f0] text-sm font-medium text-[#475569]"
          >
            {status === "done" ? "Close" : "Cancel"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
