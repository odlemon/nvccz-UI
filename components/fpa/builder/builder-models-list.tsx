"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Loader2, Plus, Search } from "lucide-react"
import { FpaPageHeader } from "@/components/fpa/fpa-page-header"
import { FpaStatusBadge, type FpaBadgeTone } from "@/components/fpa/fpa-status-badge"
import { BuilderCreateModelModal } from "@/components/fpa/builder/builder-create-model-modal"
import { type FpaModel } from "@/lib/api/fpa-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFpaModels } from "@/lib/store/slices/fpaSlice"
import { useFpaPermissions } from "@/lib/hooks/useFpaPermissions"
import { cn } from "@/lib/utils"

function fmtPeriod(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function publishedAt(m: FpaModel): string | null {
  const fromModel = (m as { publishedAt?: string | null }).publishedAt
  if (fromModel) return fromModel
  const locked = (m.versions || []).find((v) => String(v.status).toUpperCase() === "LOCKED")
  return locked?.lockedAt || null
}

function statusTone(status?: string): FpaBadgeTone {
  const s = String(status || "").toUpperCase()
  if (s === "DRAFT") return "warning"
  if (s === "VALID" || s === "PUBLISHED" || s === "APPROVED" || s === "LOCKED" || s === "ACTIVE")
    return "success"
  if (s === "INVALID") return "danger"
  if (s === "ARCHIVED") return "neutral"
  if (s === "OPEN") return "info"
  return "info"
}

const BTN_PRIMARY =
  "h-9 inline-flex items-center gap-1.5 rounded-full bg-[#2563eb] px-4 text-xs font-medium text-white hover:bg-[#1d4ed8]"
const BTN_GHOST =
  "h-8 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-white px-3 text-[11px] font-medium text-[#0f172a] hover:bg-[#f8fafc]"

/**
 * Model Builder list — browse / open / create. Structure editing is on the detail page.
 */
export function BuilderModelsList() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { models, loadingModels, error, bootstrapped } = useAppSelector((s) => s.fpa)
  const { canCreateModel, canConfigureBuilder, isAdmin } = useFpaPermissions()
  const canCreate = canCreateModel || canConfigureBuilder || isAdmin
  const [createOpen, setCreateOpen] = useState(false)
  const [q, setQ] = useState("")

  useEffect(() => {
    if (!bootstrapped) void dispatch(fetchFpaModels())
  }, [bootstrapped, dispatch])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return models
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.modelType?.toLowerCase().includes(needle) ||
        m.status?.toLowerCase().includes(needle) ||
        m.baseCurrency?.toLowerCase().includes(needle),
    )
  }, [models, q])

  const refresh = () => {
    void dispatch(fetchFpaModels())
  }

  const openDetail = (id: string) => {
    router.push(`/forecasting/model-builder/${id}`)
  }

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader
        title="Model Builder"
        hideFilters
        searchPlaceholder="Search models…"
        actions={
          canCreate ? (
            <button type="button" onClick={() => setCreateOpen(true)} className={BTN_PRIMARY}>
              <Plus className="w-3.5 h-3.5" />
              New model
            </button>
          ) : undefined
        }
      />

      <div className="p-4 sm:p-5 space-y-4">
        {error && (
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
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
          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-10 text-center max-w-lg mx-auto shadow-sm">
            <p className="text-sm font-medium text-[#0f172a]">No planning models yet</p>
            <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
              Create a model to define line items, formulas, and publish it for Model Planning.
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={cn(BTN_PRIMARY, "mt-4")}
              >
                <Plus className="w-3.5 h-3.5" /> New model
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#e2e8f0] bg-[#fafbfc]">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter by name, status, type…"
                  className="h-9 w-full rounded-full border border-[#e2e8f0] bg-white pl-9 pr-3 text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/25"
                />
              </div>
              <p className="text-[11px] text-[#94a3b8] ml-auto">
                {filtered.length} of {models.length} model{models.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[960px]">
                <thead>
                  <tr className="bg-[#f8fafc] text-left text-[11px] uppercase tracking-wide text-[#64748b] border-b border-[#e2e8f0]">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Currency</th>
                    <th className="px-4 py-3 font-medium">Horizon</th>
                    <th className="px-4 py-3 font-medium">Last updated</th>
                    <th className="px-4 py-3 font-medium">Last published</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#94a3b8]">
                        No models match “{q}”.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m, i) => (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-b border-[#f1f5f9] cursor-pointer transition-colors last:border-b-0",
                          i % 2 === 1 ? "bg-[#fcfcfd]" : "bg-white",
                          "hover:bg-[#eff6ff]/60",
                        )}
                        onClick={() => openDetail(m.id)}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-[#0f172a]">{m.name}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <FpaStatusBadge tone={statusTone(m.status)}>{m.status}</FpaStatusBadge>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-0.5 text-[11px] font-medium text-[#475569]">
                            {m.modelType}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#475569] tabular-nums">{m.baseCurrency}</td>
                        <td className="px-4 py-3.5 text-[#475569] whitespace-nowrap text-[13px]">
                          {fmtPeriod(m.startPeriod)} – {fmtPeriod(m.endPeriod)}
                        </td>
                        <td className="px-4 py-3.5 text-[#64748b] whitespace-nowrap text-[13px]">
                          {fmtDateTime(m.updatedAt)}
                        </td>
                        <td className="px-4 py-3.5 text-[#64748b] whitespace-nowrap text-[13px]">
                          {fmtDateTime(publishedAt(m))}
                        </td>
                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/forecasting/model-builder/${m.id}`}
                            className={BTN_GHOST}
                          >
                            Open
                            <ArrowUpRight className="w-3 h-3 text-[#94a3b8]" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <BuilderCreateModelModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
