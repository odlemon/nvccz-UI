"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { FpaWorksheet } from "@/components/fpa/fpa-worksheet"
import { fpaApi, type FpaBudgetCycle } from "@/lib/api/fpa-api"
import { errorMessage } from "@/lib/fpa/fpa-api-gaps"

export function FpaBudgetWorkspace({ cycleId }: { cycleId: string }) {
  const [cycle, setCycle] = useState<FpaBudgetCycle | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setCycle(null)
    setError(null)
    void fpaApi
      .getBudgetCycle(cycleId)
      .then((res) => {
        if (cancelled) return
        if (!res.success || !res.data?.modelId) {
          setError(res.message || "Budget cycle has no model scope")
          return
        }
        setCycle(res.data)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Could not load budget workspace"))
      })
    return () => {
      cancelled = true
    }
  }, [cycleId])

  if (error) {
    return (
      <div className="m-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
        {error}
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#64748b]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading budget workspace…
      </div>
    )
  }

  return <FpaWorksheet modelId={cycle.modelId} cycleId={cycle.id} workspaceKind="budget" />
}
