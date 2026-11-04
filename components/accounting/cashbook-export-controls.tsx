"use client"

import { useState } from "react"
import { toast } from "sonner"
import { downloadAc52Export, type Ac52ExportKind, type Ac52ExportSpec } from "@/lib/accounting-v52/export"
import { AccountingExportButtonGroup } from "./accounting-export-controls"

export function CashbookExportControls({ spec }: { spec: Ac52ExportSpec }) {
  const [busy, setBusy] = useState<Ac52ExportKind | null>(null)
  const exportFile = async (kind: Ac52ExportKind) => {
    setBusy(kind)
    try {
      const name = await downloadAc52Export(kind, spec)
      toast.success("Exported", { description: `${spec.rows.length} rows saved as ${name}.` })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed")
    } finally {
      setBusy(null)
    }
  }

  return <AccountingExportButtonGroup label={spec.title} onExport={exportFile} busy={busy} />
}
