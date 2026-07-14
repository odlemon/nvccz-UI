"use client"

import { useEffect, useState } from "react"
import type { FpaLineItem } from "@/lib/api/fpa-api"
import { normalizeMappingSourceSystem } from "@/lib/fpa/detailed-workspace-adapters"

/** Arcus-owned sources only — no third-party SaaS connectors (NetSuite/Salesforce/etc.). */
export const MAPPING_SOURCE_SYSTEMS = [
  "Custom / CSV",
  "Excel",
  "API",
  "Manual",
  "Procurement",
  "Fixed Assets",
  "Stock",
  "Portfolio",
  "Accounting GL",
  "Payroll",
  "CRM",
  "Banking",
  "Loan",
] as const

export type CreateDataMappingInput = {
  sourceSystem: string
  sourceField: string
  targetLineItemId: string
  status: "MAPPED" | "UNMAPPED" | "SUGGESTED" | "TYPE_MISMATCH" | "STALE"
  notes?: string
}

type Props = {
  open: boolean
  onClose: () => void
  lineItems: FpaLineItem[]
  defaultTargetLineItemId?: string | null
  initial?: Partial<CreateDataMappingInput> & { id?: string }
  onSubmit: (body: CreateDataMappingInput, mappingId?: string) => Promise<void>
}

export function CreateDataMappingDialog({
  open,
  onClose,
  lineItems,
  defaultTargetLineItemId,
  initial,
  onSubmit,
}: Props) {
  const [sourceSystem, setSourceSystem] = useState<string>(MAPPING_SOURCE_SYSTEMS[0])
  const [sourceField, setSourceField] = useState("")
  const [targetLineItemId, setTargetLineItemId] = useState("")
  const [status, setStatus] = useState<CreateDataMappingInput["status"]>("MAPPED")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSourceSystem(
      normalizeMappingSourceSystem(initial?.sourceSystem) || MAPPING_SOURCE_SYSTEMS[0],
    )
    setSourceField(initial?.sourceField || "")
    setTargetLineItemId(
      initial?.targetLineItemId || defaultTargetLineItemId || lineItems[0]?.id || "",
    )
    setStatus(initial?.status || "MAPPED")
    setNotes(initial?.notes || "")
    setErr(null)
    setBusy(false)
  }, [open, initial, defaultTargetLineItemId, lineItems])

  if (!open) return null

  const isEdit = Boolean(initial?.id)
  const targets = lineItems.filter((li) => li.id && li.name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a]">
            {isEdit ? "Edit data mapping" : "Add data mapping"}
          </h3>
          <p className="mt-0.5 text-[11px] text-[#64748b]">
            Link a source-system field to a model line item so imports and coverage stats work.
          </p>
        </div>

        <label className="block text-xs text-[#64748b]">
          Source system
          <select
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a]"
            value={sourceSystem}
            onChange={(e) => setSourceSystem(e.target.value)}
          >
            {MAPPING_SOURCE_SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-[#64748b]">
          Source field
          <input
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm font-mono text-[#0f172a]"
            placeholder="e.g. CSV.COL_REVENUE, XLS.Sheet1_B2, PROC.PO_AMOUNT, GL_ACCOUNT.4000"
            value={sourceField}
            onChange={(e) => setSourceField(e.target.value)}
          />
        </label>

        <label className="block text-xs text-[#64748b]">
          Target line item
          <select
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a]"
            value={targetLineItemId}
            onChange={(e) => setTargetLineItemId(e.target.value)}
            disabled={targets.length === 0}
          >
            {targets.length === 0 ? (
              <option value="">No line items in this module</option>
            ) : (
              targets.map((li) => (
                <option key={li.id} value={li.id}>
                  {li.code ? `${li.code} — ` : ""}
                  {li.name}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="block text-xs text-[#64748b]">
          Status
          <select
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a]"
            value={status}
            onChange={(e) => setStatus(e.target.value as CreateDataMappingInput["status"])}
          >
            <option value="MAPPED">MAPPED</option>
            <option value="UNMAPPED">UNMAPPED</option>
            <option value="SUGGESTED">SUGGESTED</option>
            <option value="TYPE_MISMATCH">TYPE_MISMATCH</option>
            <option value="STALE">STALE</option>
          </select>
        </label>

        <label className="block text-xs text-[#64748b]">
          Notes (optional)
          <input
            className="mt-1 w-full h-9 rounded-full border border-[#e2e8f0] px-3 text-sm text-[#0f172a]"
            placeholder="Import rule, COA note…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {err ? <p className="text-[11px] text-[#b91c1c]">{err}</p> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="h-9 rounded-full border border-[#e2e8f0] px-4 text-xs font-medium text-[#64748b]"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              busy || !sourceField.trim() || !sourceSystem.trim() || !targetLineItemId.trim()
            }
            className="h-9 rounded-full bg-[#2563eb] px-5 text-xs font-medium text-white shadow-sm disabled:opacity-50"
            onClick={async () => {
              setBusy(true)
              setErr(null)
              try {
                await onSubmit(
                  {
                    sourceSystem: sourceSystem.trim(),
                    sourceField: sourceField.trim(),
                    targetLineItemId: targetLineItemId.trim(),
                    status,
                    notes: notes.trim() || undefined,
                  },
                  initial?.id,
                )
                onClose()
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Save failed")
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? "Saving…" : isEdit ? "Save mapping" : "Create mapping"}
          </button>
        </div>
      </div>
    </div>
  )
}
