"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"
import { downloadAc52Export, type Ac52ExportKind, type Ac52ExportSpec } from "@/lib/accounting-v52/export"

const EXPORT_FORMATS = [
  { kind: "pdf", label: "PDF", Icon: FileText },
  { kind: "excel", label: "Excel", Icon: FileSpreadsheet },
  { kind: "csv", label: "CSV", Icon: Download },
] as const satisfies ReadonlyArray<{ kind: Ac52ExportKind; label: string; Icon: typeof FileText }>

export function AccountingExportButtonGroup({
  label,
  onExport,
  disabled = false,
  busy = null,
  showLabels = true,
}: {
  label: string
  onExport: (kind: Ac52ExportKind) => void | Promise<void>
  disabled?: boolean | ((kind: Ac52ExportKind) => boolean)
  busy?: Ac52ExportKind | null
  showLabels?: boolean
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${showLabels ? "al-export-labeled" : ""}`} role="group" aria-label={`Export ${label}`}>
      {EXPORT_FORMATS.map(({ kind, label: formatLabel, Icon }) => {
        const isBusy = busy === kind
        const isDisabled = typeof disabled === "function" ? disabled(kind) : disabled
        return (
          <button
            key={kind}
            type="button"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            title={isBusy ? `Generating ${formatLabel}` : `Export as ${formatLabel}`}
            aria-label={isBusy ? `Generating ${formatLabel}` : `Export as ${formatLabel}`}
            disabled={isDisabled || busy !== null}
            onClick={() => void onExport(kind)}
          >
            <Icon className={`h-4 w-4 shrink-0 ${isBusy ? "animate-spin" : ""}`} aria-hidden="true" />
            {showLabels && <span>{formatLabel}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** The PDF / Excel / CSV control used by Period Close, adapted for legacy React tables. */
export function AccountingExportControls({ spec, label, showLabels = true }: {
  spec: Ac52ExportSpec | (() => Promise<Ac52ExportSpec>)
  label: string
  showLabels?: boolean
}) {
  const [busy, setBusy] = useState<Ac52ExportKind | null>(null)
  const exportFile = async (kind: Ac52ExportKind) => {
    setBusy(kind)
    try {
      const data = typeof spec === "function" ? await spec() : spec
      const name = await downloadAc52Export(kind, data)
      toast.success("Exported", { description: `${data.rows.length} rows saved as ${name}.` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setBusy(null)
    }
  }
  return (
    <AccountingExportButtonGroup label={label} onExport={exportFile} busy={busy} showLabels={showLabels} />
  )
}
