"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Loader2, MoreHorizontal, Plus } from "lucide-react"
import { FpaPageHeader } from "./fpa-page-header"
import { FpaStatusBadge } from "./fpa-status-badge"
import { FpaModelSetupModal } from "./fpa-model-setup-modal"
import { type FpaModel } from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFpaModels } from "@/lib/store/slices/fpaSlice"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"

function pickDefaultPlanningModel(models: FpaModel[]): FpaModel | null {
  const active = models.filter((m) => String(m.status).toUpperCase() !== "ARCHIVED")
  const published = active.filter((m) => String(m.status).toUpperCase() === "PUBLISHED")
  return published[0] || active[0] || models[0] || null
}

export function FpaModelsList() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const stayOnCatalog = searchParams.get("catalog") === "1"
  const { models, loadingModels, error } = useAppSelector((s) => s.fpa)
  const { canCreateModel } = useFpaPermissions()
  const [setupOpen, setSetupOpen] = useState(false)
  const [redirecting, setRedirecting] = useState(!stayOnCatalog)

  const defaultModel = useMemo(() => pickDefaultPlanningModel(models), [models])

  useEffect(() => {
    if (stayOnCatalog) {
      setRedirecting(false)
      return
    }
    if (loadingModels && models.length === 0) return
    if (defaultModel) {
      setRedirecting(true)
      router.replace(`/forecasting/models/${defaultModel.id}/worksheet`)
      return
    }
    setRedirecting(false)
  }, [stayOnCatalog, loadingModels, models.length, defaultModel, router])

  const refresh = () => {
    void dispatch(fetchFpaModels())
  }

  const sorted = useMemo(() => {
    const rank = (s?: string) => {
      const u = String(s || "").toUpperCase()
      if (u === "PUBLISHED") return 0
      if (u === "LOCKED") return 1
      if (u === "DRAFT") return 2
      if (u === "ARCHIVED") return 9
      return 5
    }
    return [...models].sort((a, b) => rank(a.status) - rank(b.status))
  }, [models])

  if (redirecting && !stayOnCatalog) {
    return (
      <div className="min-h-full bg-[#f8fafc] flex items-center justify-center gap-2 text-[#64748b]">
        <Loader2 className="w-5 h-5 animate-spin" />
        Opening latest planning model…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Model Planning"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {defaultModel ? (
              <Link
                href={`/forecasting/models/${defaultModel.id}/worksheet`}
                className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8] shadow-sm"
              >
                Open workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
            {canCreateModel ? (
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="h-9 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc]"
              >
                <Plus className="w-3.5 h-3.5" />
                New model
              </button>
            ) : null}
          </div>
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        {defaultModel ? (
          <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#0f172a]">
                Default workspace · {defaultModel.name}
              </p>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                Opens the latest published model when you enter Model Planning. Status:{" "}
                {defaultModel.status}
              </p>
            </div>
            <Link
              href={`/forecasting/models/${defaultModel.id}/worksheet`}
              className="h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8]"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : null}

        {error && (
          <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
            <button type="button" className="ml-3 underline" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {loadingModels && models.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-[#64748b] gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading models…
          </div>
        ) : models.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white p-10 text-center">
            <p className="text-sm font-medium text-[#0f172a]">No planning models yet</p>
            <p className="text-xs text-[#64748b] mt-1">
              {canCreateModel
                ? "Complete the setup wizard to create a model with type, horizon, line items, and more in one go."
                : "No published model yet. Ask FP&A to build and publish a model first."}
            </p>
            {canCreateModel && (
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="mt-4 inline-flex h-9 items-center rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white"
              >
                Start model setup
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-medium text-[#64748b]">All models</p>
              <p className="text-[11px] text-[#94a3b8]">Published models are listed first</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.slice(0, 6).map((m) => (
                <ModelCard key={m.id} model={m} preferred={m.id === defaultModel?.id} />
              ))}
            </div>

            <div className="rounded-md border border-[#e2e8f0] bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-left text-xs text-[#64748b]">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Currency</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m) => (
                    <tr key={m.id} className="border-t border-[#e2e8f0]">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">
                        {m.name}
                        {m.id === defaultModel?.id ? (
                          <span className="ml-2 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-semibold text-[#15803d]">
                            Default
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#475569]">{m.modelType}</td>
                      <td className="px-4 py-3 text-[#475569]">{m.baseCurrency}</td>
                      <td className="px-4 py-3">
                        <FpaStatusBadge tone={statusTone(m.status)}>{m.status}</FpaStatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3 text-xs font-medium">
                          <Link
                            href={`/forecasting/models/${m.id}/worksheet`}
                            className="text-[#2563eb] hover:underline"
                          >
                            Open
                          </Link>
                          <Link
                            href={`/forecasting/model-builder/${m.id}`}
                            className="text-[#475569] hover:underline"
                          >
                            Builder
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <FpaModelSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />
    </div>
  )
}

function ModelCard({ model: m, preferred }: { model: FpaModel; preferred?: boolean }) {
  return (
    <article
      className={
        preferred
          ? "rounded-lg border border-[#93c5fd] bg-white shadow-sm p-5 flex flex-col gap-4 ring-1 ring-[#bfdbfe]"
          : "rounded-lg border border-[#e2e8f0] bg-white shadow-sm p-5 flex flex-col gap-4"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#0f172a] truncate">{m.name}</h2>
          <p className="text-xs text-[#64748b] mt-1">
            {m.modelType} · {m.baseCurrency} · {fmtDate(m.startPeriod)} – {fmtDate(m.endPeriod)}
          </p>
        </div>
        <button type="button" className="text-[#94a3b8]" aria-label="More">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <FpaStatusBadge tone={statusTone(m.status)}>{m.status}</FpaStatusBadge>
        {preferred ? (
          <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#15803d]">
            Default
          </span>
        ) : null}
      </div>
      <div className="flex gap-2 mt-auto pt-2">
        <Link
          href={`/forecasting/models/${m.id}/worksheet`}
          className="h-9 flex-1 inline-flex items-center justify-center rounded-full bg-[#2563eb] px-3 text-xs font-medium text-white hover:bg-[#1d4ed8]"
        >
          Worksheet
        </Link>
        <Link
          href={`/forecasting/model-builder/${m.id}`}
          className="h-9 flex-1 inline-flex items-center justify-center rounded-full border border-[#e2e8f0] px-3 text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc]"
        >
          Builder
        </Link>
      </div>
    </article>
  )
}

function fmtDate(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
}

function statusTone(status?: string): "info" | "warning" | "success" | "danger" | "neutral" {
  const s = String(status || "").toUpperCase()
  if (s === "PUBLISHED" || s === "APPROVED" || s === "LOCKED") return "success"
  if (s === "DRAFT") return "warning"
  if (s === "OPEN" || s === "ACTIVE") return "info"
  if (s === "ARCHIVED") return "neutral"
  return "info"
}
