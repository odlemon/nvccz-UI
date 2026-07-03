"use client"

import React, { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchValidationQueue, approveValidationTick, rejectValidationTick } from "@/lib/store/slices/investmentsSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export function ValidationQueue() {
  const dispatch = useAppDispatch()
  const { validationQueue, validationLoading } = useAppSelector((s) => s.investments)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    dispatch(fetchValidationQueue())
  }, [dispatch])

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Validation Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Price outliers pending manual review</p>
        </div>
        <Badge variant="secondary" className="font-mono">
          {validationQueue.length} pending
        </Badge>
      </div>

      {validationLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Ticker</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Exchange</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Proposed</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Prev Close</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Deviation</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {validationQueue.map((item) => {
                const isHighDeviation = Math.abs(item.deviation_percent) > 15
                const isRejecting = rejectingId === item.tick_id

                return (
                  <React.Fragment key={item.tick_id}>
                    <tr className="border-b last:border-0">
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-medium">{item.ticker}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs">{item.exchange}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {new Date(item.price_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {item.proposed_price.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                        {item.previous_close.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className={cn("flex items-center justify-end gap-1 font-mono text-xs", isHighDeviation ? "text-amber-600" : "text-muted-foreground")}>
                          {isHighDeviation && <AlertTriangle className="w-3 h-3" />}
                          {item.deviation_percent >= 0 ? "+" : ""}{item.deviation_percent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleApprove(item.tick_id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              if (isRejecting) {
                                setRejectingId(null)
                                setRejectReason("")
                              } else {
                                setRejectingId(item.tick_id)
                                setRejectReason("")
                              }
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isRejecting && (
                      <tr className="border-b bg-red-50/50">
                        <td colSpan={7} className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Rejection reason (required)…"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs shrink-0"
                              disabled={!rejectReason.trim()}
                              onClick={() => handleRejectSubmit(item.tick_id)}
                            >
                              Confirm Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => { setRejectingId(null); setRejectReason("") }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {validationQueue.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    No items pending review
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
