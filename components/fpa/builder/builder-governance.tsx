"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FpaSetupError } from "@/lib/api/fpa-api"

export { BuilderDependencyMap } from "./builder-dependency-map"

type ExcProps = {
  errors: FpaSetupError[]
  warnings: FpaSetupError[]
  info: FpaSetupError[]
  onFocus?: (code?: string) => void
  /** When set, renders as modal overlay instead of inline strip. */
  open?: boolean
  onClose?: () => void
  title?: string
}

/**
 * Validation results — preferred as a modal after Validate Model.
 * Still usable inline if `open` is omitted (legacy).
 */
export function BuilderExceptionsPanel({
  errors,
  warnings,
  info,
  onFocus,
  open,
  onClose,
  title = "Validation results",
}: ExcProps) {
  const tabs = [
    { id: "errors", label: "Errors", rows: errors, tone: "error" as const },
    { id: "warnings", label: "Warnings", rows: warnings, tone: "warning" as const },
    { id: "info", label: "Info", rows: info, tone: "info" as const },
  ]
  const initialTab =
    errors.length > 0 ? "errors" : warnings.length > 0 ? "warnings" : info.length > 0 ? "info" : "errors"
  const [active, setActive] = useState(initialTab)
  useEffect(() => {
    setActive(initialTab)
  }, [initialTab, open, errors.length, warnings.length, info.length])
  const current = tabs.find((t) => t.id === active) || tabs[0]
  const total = errors.length + warnings.length + info.length
  const passed = Math.max(0, total - errors.length - warnings.length)
  const asModal = open !== undefined

  if (asModal && !open) return null

  const body = (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-3 gap-3",
        asModal ? "p-0" : "p-4 border-t border-[#e2e8f0] bg-[#f8fafc]",
      )}
    >
      <div className="lg:col-span-2 rounded-md border border-[#e2e8f0] bg-white overflow-hidden">
        <div className="flex border-b border-[#e2e8f0] px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "h-9 px-2.5 text-[11px] font-medium border-b-2 -mb-px",
                active === t.id
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#64748b]",
              )}
            >
              {t.label} ({t.rows.length})
            </button>
          ))}
        </div>
        <ul className="divide-y divide-[#f1f5f9] max-h-56 overflow-y-auto">
          {current.rows.length === 0 ? (
            <li className="px-3 py-4 text-[11px] text-[#94a3b8]">
              No {current.label.toLowerCase()}.
            </li>
          ) : (
            current.rows.map((e, i) => (
              <li key={`${e.code}-${i}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 flex gap-2 items-start hover:bg-[#f8fafc]"
                  onClick={() => {
                    onFocus?.(e.field || e.code || e.lineItemId || undefined)
                    onClose?.()
                  }}
                >
                  {current.tone === "error" ? (
                    <AlertCircle className="w-3.5 h-3.5 text-[#dc2626] mt-0.5 shrink-0" />
                  ) : current.tone === "warning" ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#d97706] mt-0.5 shrink-0" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-[#2563eb] mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#0f172a]">{e.code || "Issue"}</p>
                    <p className="text-[11px] text-[#64748b]">{e.message}</p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="rounded-md border border-[#e2e8f0] bg-white p-3">
        <h4 className="text-sm font-semibold text-[#0f172a] mb-2">Validation Summary</h4>
        <div className="flex items-center gap-4">
          <Donut
            passed={passed}
            warnings={warnings.length}
            errors={errors.length}
            total={Math.max(total, 1)}
          />
          <ul className="text-[11px] space-y-1 text-[#475569]">
            <li>Total: {total || "—"}</li>
            <li className="text-[#166534]">Passed: {passed}</li>
            <li className="text-[#d97706]">Warnings: {warnings.length}</li>
            <li className="text-[#b91c1c]">Errors: {errors.length}</li>
          </ul>
        </div>
      </div>
    </div>
  )

  if (!asModal) return body

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-validation-title"
        className="w-full max-w-3xl rounded-xl border border-[#e2e8f0] bg-white shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
          <h3 id="builder-validation-title" className="text-sm font-semibold text-[#0f172a]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[#64748b] hover:bg-[#f8fafc]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{body}</div>
        <div className="flex justify-end border-t border-[#e2e8f0] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Donut({
  passed,
  warnings,
  errors,
  total,
}: {
  passed: number
  warnings: number
  errors: number
  total: number
}) {
  const p = (passed / total) * 100
  const w = (warnings / total) * 100
  const e = (errors / total) * 100
  const gradient = `conic-gradient(#16a34a 0 ${p}%, #d97706 ${p}% ${p + w}%, #dc2626 ${p + w}% ${p + w + e}%, #e2e8f0 ${p + w + e}% 100%)`
  return (
    <div className="w-16 h-16 rounded-full shrink-0" style={{ background: gradient }}>
      <div className="w-10 h-10 rounded-full bg-white m-3" />
    </div>
  )
}

type AuditProps = {
  entries: Array<{ time: string; user: string; action: string; details: string }>
  open: boolean
  onClose: () => void
}

export function BuilderAuditDrawer({ entries, open, onClose }: AuditProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="w-full max-w-md h-full bg-white border-l border-[#e2e8f0] shadow-xl flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">Change History</h3>
          <button type="button" className="text-xs text-[#64748b]" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {entries.length === 0 ? (
            <p className="text-xs text-[#94a3b8] py-8 text-center">
              Audit log API not available yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e, i) => (
                <li key={i} className="rounded-md border border-[#e2e8f0] p-2.5 text-[11px]">
                  <p className="font-medium text-[#0f172a]">{e.action}</p>
                  <p className="text-[#64748b] mt-0.5">{e.details}</p>
                  <p className="text-[#94a3b8] mt-1">
                    {e.user} · {e.time}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/** A.4 detailed workspace lives in `builder-detailed-workspace.tsx`. */
export { BuilderDetailedWorkspace } from "./builder-detailed-workspace"
