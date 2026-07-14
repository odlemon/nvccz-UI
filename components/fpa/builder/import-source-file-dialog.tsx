"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { fpaApi } from "@/lib/api/fpa-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

type Props = {
  open: boolean
  modelId: string | null
  onClose: () => void
  onImported: () => void
}

const SOURCE_OPTIONS = [
  { value: "Custom / CSV", accept: ".csv,text/csv", label: "Custom / CSV" },
  {
    value: "Excel",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel",
    label: "Excel",
  },
] as const

/**
 * Upload CSV/Excel for mapping ingest.
 * POST …/data-mappings/import (multipart) — backend shipped 80e6e1c.
 */
export function ImportSourceFileDialog({ open, modelId, onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sourceSystem, setSourceSystem] = useState<(typeof SOURCE_OPTIONS)[number]["value"]>(
    "Custom / CSV",
  )
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSourceSystem("Custom / CSV")
    setFile(null)
    setBusy(false)
    setErr(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [open])

  if (!open) return null

  const accept =
    SOURCE_OPTIONS.find((o) => o.value === sourceSystem)?.accept || ".csv,.xlsx,.xls"

  const handleUpload = async () => {
    if (!modelId) {
      setErr("No model selected")
      return
    }
    if (!file) {
      setErr("Choose a CSV or Excel file")
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const res = await fpaApi.importDataMappingFile(modelId, {
        file,
        sourceSystem,
      })
      if (!res.success) throw new Error(res.message || "Import failed")
      const created =
        (res.data?.createdFields || 0) +
        (res.data?.createdMappings || 0) +
        (res.data?.rowsImported || 0)
      toast.success(
        created
          ? `Imported ${res.data?.rowsImported || 0} rows · ${res.data?.createdMappings || 0} mappings`
          : res.message || "Import accepted",
      )
      onImported()
      onClose()
    } catch (e) {
      const msg = errorMessage(e)
      const missing =
        /404|not found|not implemented|not shipped|endpoint/i.test(msg) ||
        /Failed to fetch/i.test(msg)
      logFpaGap({
        category: missing ? "missing" : "broken",
        path: `/v1/fpa/models/${modelId}/data-mappings/import`,
        method: "POST",
        message: msg,
        impact: "CSV/Excel file ingest unavailable — FE dialog ready",
        response: e,
      })
      setErr(
        missing
          ? "File ingest endpoint is unreachable (POST …/data-mappings/import). Try again or map fields manually."
          : msg,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        role="dialog"
        aria-labelledby="import-source-title"
        className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <h2 id="import-source-title" className="text-sm font-semibold text-[#0f172a]">
            Import CSV / Excel
          </h2>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <p className="text-[12px] text-[#64748b]">
            Upload a CSV or Excel file to create source fields and mapping suggestions for this
            model.
          </p>

          <label className="block text-[11px] font-medium text-[#64748b]">
            Source system
            <select
              className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a]"
              value={sourceSystem}
              disabled={busy}
              onChange={(e) =>
                setSourceSystem(e.target.value as (typeof SOURCE_OPTIONS)[number]["value"])
              }
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-medium text-[#64748b]">
            File
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              disabled={busy}
              className="mt-1 block w-full text-[12px] text-[#334155] file:mr-3 file:h-8 file:rounded-full file:border-0 file:bg-[#eff6ff] file:px-3 file:text-[11px] file:font-medium file:text-[#1d4ed8]"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {file ? (
            <p className="text-[11px] text-[#0f172a]">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          ) : null}

          {err ? <p className="text-[12px] text-[#b91c1c] leading-snug">{err}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e2e8f0] px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-9 rounded-full border border-[#e2e8f0] px-4 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !file}
            onClick={() => void handleUpload()}
            className="h-9 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 text-xs font-medium text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload
          </button>
        </div>
      </div>
    </div>
  )
}
