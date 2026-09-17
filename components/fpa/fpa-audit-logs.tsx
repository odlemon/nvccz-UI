"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { fpaApi, type FpaAuditEntry } from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"

const ACTION_LABELS: Record<string, string> = {
  MODEL_PLANNING_CYCLE_UPDATE: "Planning cycle updated",
  SCENARIO_UPDATE: "Scenario updated",
  SCENARIO_ARCHIVE: "Scenario archived",
  WORKFLOW_COMMENT: "Workflow comment",
}

function actionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ")
}

function formatWhen(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function normalizeEntries(
  data: { entries: FpaAuditEntry[] } | FpaAuditEntry[] | null | undefined,
): FpaAuditEntry[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return Array.isArray(data.entries) ? data.entries : []
}

export function FpaAuditLogs() {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const [entries, setEntries] = useState<FpaAuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [actionFilter, setActionFilter] = useState("")

  const load = useCallback(async () => {
    if (!selectedModelId) return
    setLoading(true)
    setError(undefined)
    try {
      const res = await fpaApi.getModelAudit(selectedModelId, {
        limit: 100,
        action: actionFilter || undefined,
      })
      if (!res.success) throw new Error(res.message || "Failed to load audit log")
      setEntries(normalizeEntries(res.data))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the audit log.")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [selectedModelId, actionFilter])

  useEffect(() => {
    void load()
  }, [load])

  const actionOptions = Array.from(new Set(entries.map((e) => e.action))).sort()

  return (
    <div className="p-6 md:p-8 max-w-[1100px]">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#6b7c74]">Audit</p>
      <h1 className="text-3xl font-semibold tracking-tight text-[#14201c] mt-1">Audit logs</h1>
      <p className="text-sm text-[#5c6b64] mt-2">
        Every material edit, approval, and lock attempt for the selected model.
      </p>

      {!selectedModelId ? (
        <div className="mt-8 rounded-xl border border-dashed border-[#d5d2c8] bg-white/50 p-8 text-center text-sm text-[#6b7c74]">
          Select a model from another FP&A screen to view its audit log.
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 rounded-md border border-[#d5d2c8] bg-white px-3 text-sm text-[#14201c]"
            >
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {actionLabel(action)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="h-9 rounded-md border border-[#d5d2c8] bg-white px-3 text-sm text-[#14201c] hover:bg-[#f5f4ef]"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[#e5e2d8] bg-white overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#6b7c74]">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading audit log…
              </div>
            ) : error ? (
              <div className="p-8 text-center text-sm text-[#b42318]">
                {error}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="h-8 rounded-md bg-[#14201c] px-4 text-xs font-medium text-white"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6b7c74]">
                No audit entries {actionFilter ? "for this action" : "for this model"} yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e2d8] text-left text-[11px] uppercase tracking-wide text-[#6b7c74]">
                    <th className="px-4 py-2.5 font-medium">When</th>
                    <th className="px-4 py-2.5 font-medium">User</th>
                    <th className="px-4 py-2.5 font-medium">Action</th>
                    <th className="px-4 py-2.5 font-medium">Entity</th>
                    <th className="px-4 py-2.5 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-[#f0eee6] last:border-0">
                      <td className="px-4 py-2.5 whitespace-nowrap text-[#14201c]">{formatWhen(entry.at)}</td>
                      <td className="px-4 py-2.5 text-[#14201c]">{entry.userName || entry.userId || "—"}</td>
                      <td className="px-4 py-2.5 text-[#14201c]">{actionLabel(entry.action)}</td>
                      <td className="px-4 py-2.5 text-[#5c6b64]">
                        {entry.entityType ? `${entry.entityType}${entry.entityId ? ` · ${entry.entityId}` : ""}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[#5c6b64] max-w-[320px] truncate">
                        {entry.summary || entry.details || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
