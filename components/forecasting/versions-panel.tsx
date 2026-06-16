"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Copy, Lock, GitBranch, User, Clock, Layers } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { fetchVersions, duplicateVersion } from "@/lib/store/slices/forecastingSlice"
import type { ForecastVersion } from "@/lib/api/forecasting-api"

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—"
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (abs >= 1_000)     return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

export function VersionsPanel({ scenarioId }: { scenarioId: string }) {
  const dispatch = useDispatch<AppDispatch>()
  const router   = useRouter()
  const { versions, versionsLoading } = useSelector((state: RootState) => state.forecasting)

  useEffect(() => {
    if (scenarioId) dispatch(fetchVersions(scenarioId))
  }, [dispatch, scenarioId])

  const handleDuplicate = async (version: ForecastVersion) => {
    const name = `${version.version_label} — Working Copy`
    try {
      const result = await dispatch(
        duplicateVersion({ id: scenarioId, versionId: version.id, name })
      ).unwrap()
      const newId = result?.id ?? result?.scenario_id
      toast.success("Working copy created", { description: name })
      if (newId) router.push(`/forecasting/scenarios/${newId}`)
    } catch (err: any) {
      toast.error("Failed to create working copy", { description: err?.message })
    }
  }

  if (versionsLoading) {
    return (
      <div className="p-5 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-0.5 h-12 mt-2" />
            </div>
            <Skeleton className="flex-1 h-24 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <GitBranch className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">No immutable snapshots exist yet</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
          Lock this scenario to create a board-approved version snapshot. Locked versions
          are read-only and serve as permanent records.
        </p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-0">
      {versions.map((version: ForecastVersion, idx: number) => {
        const isLast = idx === versions.length - 1
        return (
          <div key={version.id} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shadow-sm shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-200 to-gray-100 my-2 min-h-[32px]" />
              )}
            </div>

            {/* Version card */}
            <div className={`flex-1 min-w-0 ${isLast ? "" : "mb-4"}`}>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono text-gray-900 leading-snug">
                      {version.version_label}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                      {idx === 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="h-8 rounded-full text-xs gap-1.5 bg-white border-gray-200 shadow-sm hover:bg-gray-50 shrink-0"
                    onClick={() => handleDuplicate(version)}
                  >
                    <Copy className="w-3 h-3" /> Create Working Copy
                  </Button>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    {
                      icon: Clock, label: "Locked At",
                      value: version.locked_at
                        ? format(new Date(version.locked_at), "MMM d, yyyy 'at' HH:mm")
                        : "—",
                    },
                    {
                      icon: User, label: "Locked By",
                      value: (version as any).locked_by_name ?? (version as any).locked_by ?? "—",
                    },
                    ...(
                      (version as any).cell_count != null
                        ? [{ icon: Layers, label: "Cell Count", value: fmtNum((version as any).cell_count) }]
                        : []
                    ),
                    ...(
                      (version as any).forecast_total != null
                        ? [{ icon: Lock, label: "Forecast Total", value: fmtNum((version as any).forecast_total) }]
                        : []
                    ),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3 h-3 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
