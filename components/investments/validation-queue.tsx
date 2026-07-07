"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchValidationQueue, approveValidationTick, rejectValidationTick } from "@/lib/store/slices/investmentsSlice"
import { Skeleton } from "@/components/ui/skeleton"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { ValidationItemCard } from "./validation-item-card"
import { TerminalStatCard } from "@/components/investments/terminal/stat-card"

export function ValidationQueue() {
  const dispatch = useAppDispatch()
  const { validationQueue, validationLoading } = useAppSelector((s) => s.investments)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    dispatch(fetchValidationQueue())
  }, [dispatch])

  const stats = useMemo(() => {
    const highDeviation = validationQueue.filter((v) => Math.abs(v.deviation_percent) > 15).length
    const exchanges = new Set(validationQueue.map((v) => v.exchange).filter(Boolean)).size
    const avgDeviation = validationQueue.length
      ? validationQueue.reduce((sum, v) => sum + Math.abs(v.deviation_percent), 0) / validationQueue.length
      : 0
    return { total: validationQueue.length, highDeviation, exchanges, avgDeviation }
  }, [validationQueue])

  const handleApprove = async (tickId: string) => {
    try {
      await dispatch(approveValidationTick(tickId)).unwrap()
      toast.success("Tick approved")
    } catch (err: any) {
      toast.error("Failed to approve", { description: err.message })
    }
  }

  const handleRejectSubmit = async (tickId: string) => {
    if (!rejectReason.trim()) return
    try {
      await dispatch(rejectValidationTick({ tickId, reason: rejectReason })).unwrap()
      toast.success("Tick rejected")
      setRejectingId(null)
      setRejectReason("")
    } catch (err: any) {
      toast.error("Failed to reject", { description: err.message })
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TerminalStatCard label="Pending review" value={String(stats.total)} subValue={stats.total ? "Needs attention" : "Queue clear"} />
        <TerminalStatCard label="High deviation (>15%)" value={String(stats.highDeviation)} subValue={stats.highDeviation ? "Review closely" : "None flagged"} />
        <TerminalStatCard label="Exchanges affected" value={String(stats.exchanges)} />
        <TerminalStatCard label="Avg deviation" value={`${stats.avgDeviation.toFixed(2)}%`} />
      </div>

      {validationLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : validationQueue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Check className="mx-auto h-8 w-8 text-gain" />
          <p className="mt-3 text-sm font-medium text-foreground">Queue is clear</p>
          <p className="text-xs text-muted-foreground">All flagged ticks have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {validationQueue.map((item) => (
            <ValidationItemCard
              key={item.tick_id}
              item={item}
              isRejecting={rejectingId === item.tick_id}
              rejectReason={rejectReason}
              onApprove={() => handleApprove(item.tick_id)}
              onRejectToggle={() => {
                if (rejectingId === item.tick_id) {
                  setRejectingId(null)
                  setRejectReason("")
                } else {
                  setRejectingId(item.tick_id)
                  setRejectReason("")
                }
              }}
              onRejectReasonChange={setRejectReason}
              onRejectSubmit={() => handleRejectSubmit(item.tick_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
