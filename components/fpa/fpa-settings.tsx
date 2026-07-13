"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronRight, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { fpaApi, type ForecastEntity } from "@/lib/api/fpa-api"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"

export function FpaSettings() {
  const { canManageSettings } = useFpaPermissions()
  const [entities, setEntities] = useState<ForecastEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [coa, setCoa] = useState<unknown[] | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fpaApi.listEntities()
      if (!res.success) throw new Error(res.message || "Entities failed")
      setEntities(res.data || [])
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/forecast-entities",
        method: "GET",
        message: errorMessage(err),
        impact: "Settings entities empty",
        response: err,
      })
      toast.error(errorMessage(err))
      setEntities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    logFpaGap({
      category: "missing",
      path: "/v1/fpa/settings",
      method: "GET",
      message: "No variance-threshold / sync-source / workflow-default settings endpoints",
      impact: "Only forecast-entities section is live",
    })
  }, [load])

  const openCoa = async (id: string) => {
    setSelectedEntity(id)
    try {
      const res = await fpaApi.getChartOfAccounts(id)
      if (!res.success) throw new Error(res.message || "COA failed")
      setCoa(res.data || [])
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/forecast-entities/${id}/chart-of-accounts`,
        method: "GET",
        message: errorMessage(err),
        impact: "Cannot show chart of accounts",
        response: err,
      })
      toast.error(errorMessage(err))
      setCoa([])
    }
  }

  const createEntity = async () => {
    if (!newName.trim()) return
    setBusy(true)
    try {
      const res = await fpaApi.createEntity({ name: newName.trim(), type: "COMPANY" })
      if (!res.success) throw new Error(res.message || "Create failed")
      toast.success("Entity created")
      setNewName("")
      await load()
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: "/forecast-entities",
        method: "POST",
        message: errorMessage(err),
        impact: "Cannot create forecast entity",
        response: err,
      })
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title="Settings" filters={[]} />

      <div className="p-4 sm:p-5 max-w-3xl space-y-4">
        <p className="text-sm text-[#64748b]">
          Forecast entities and chart of accounts. Variance thresholds and sync sources are not exposed by the API yet.
        </p>
        {!canManageSettings && (
          <p className="text-xs text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded-full px-3 py-2 inline-block">
            Read-only: your role cannot change FP&A settings.
          </p>
        )}

        <section className="rounded-md border border-[#e2e8f0] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Entities</h2>
            <div className="flex gap-2">
              <input
                className="h-8 rounded-md border border-[#e2e8f0] px-2 text-xs"
                placeholder="New entity name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !newName.trim() || !canManageSettings}
                onClick={() => void createEntity()}
                className="h-8 inline-flex items-center gap-1 rounded-full bg-[#2563eb] px-2 text-xs text-white disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-[#64748b] text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : entities.length === 0 ? (
            <p className="text-sm text-[#94a3b8] py-4">No entities returned from /forecast-entities.</p>
          ) : (
            <ul className="divide-y divide-[#e2e8f0]">
              {entities.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-[#f8fafc]"
                    onClick={() => void openCoa(e.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0f172a]">{e.name}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {e.type} · {e.baseCurrency || e.base_currency || "—"} · accounts{" "}
                        {e.account_count ?? "—"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedEntity && (
          <section className="rounded-md border border-[#e2e8f0] bg-white p-4">
            <h2 className="text-sm font-semibold mb-2">Chart of accounts</h2>
            {!coa ? (
              <p className="text-xs text-[#94a3b8]">Loading…</p>
            ) : coa.length === 0 ? (
              <p className="text-xs text-[#94a3b8]">No accounts.</p>
            ) : (
              <ul className="max-h-64 overflow-auto text-xs space-y-1">
                {coa.slice(0, 100).map((row, i) => {
                  const r = row as Record<string, unknown>
                  return (
                    <li key={String(r.id || i)} className="flex gap-2 border-b border-[#f1f5f9] py-1">
                      <span className="font-mono text-[#64748b]">{String(r.code || r.account_code || "—")}</span>
                      <span>{String(r.name || r.account_name || JSON.stringify(r).slice(0, 60))}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        <ul className="rounded-md border border-dashed border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0]">
          {["Sync sources", "Variance thresholds", "Workflow defaults"].map((title) => (
            <li key={title} className="px-5 py-4 flex items-center justify-between opacity-70">
              <div>
                <p className="text-sm font-medium text-[#0f172a]">{title}</p>
                <p className="text-xs text-[#64748b] mt-0.5">Not exposed by API yet</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-[#94a3b8]">Soon</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
