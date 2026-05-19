"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { portfolioMonitoringApi, type ValuationEvent } from "@/lib/api/portfolio-monitoring-api"
import { RecordValuationModal } from "../record-valuation-modal"
import { toast } from "sonner"
import { Plus, Edit, Trash2, TrendingUp, Loader2 } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  POST_MONEY: "Post-Money",
  PRE_MONEY: "Pre-Money",
  FAIR_MARKET_VALUE: "Fair Market Value",
  BOOK_VALUE: "Book Value",
  LIQUIDATION: "Liquidation",
}

const TYPE_COLORS: Record<string, string> = {
  POST_MONEY: "bg-blue-100 text-blue-700",
  PRE_MONEY: "bg-indigo-100 text-indigo-700",
  FAIR_MARKET_VALUE: "bg-emerald-100 text-emerald-700",
  BOOK_VALUE: "bg-amber-100 text-amber-700",
  LIQUIDATION: "bg-red-100 text-red-700",
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  } catch { return iso }
}

function fmtAmount(amount: string, symbol: string) {
  const n = parseFloat(amount)
  if (isNaN(n)) return `${symbol}${amount}`
  return `${symbol}${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

interface ValuationsSectionProps {
  implementationId: string
}

export function ValuationsSection({ implementationId }: ValuationsSectionProps) {
  const [valuations, setValuations] = useState<ValuationEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ValuationEvent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await portfolioMonitoringApi.listValuations(implementationId)
      setValuations((res as any).data ?? [])
    } catch { } finally {
      setLoading(false)
    }
  }, [implementationId])

  useEffect(() => { load() }, [load])

  const handleSaved = (event: ValuationEvent) => {
    setValuations((prev) => {
      const idx = prev.findIndex((v) => v.id === event.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = event
        return next
      }
      return [event, ...prev]
    })
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      setDeleting(true)
      await portfolioMonitoringApi.deleteValuation(implementationId, deletingId)
      setValuations((prev) => prev.filter((v) => v.id !== deletingId))
      toast.success("Valuation deleted")
    } catch (err: any) {
      toast.error("Failed to delete valuation", { description: err?.message })
    } finally {
      setDeleting(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${valuations.length} valuation${valuations.length !== 1 ? "s" : ""} recorded`}
        </p>
        <Button
          size="sm"
          className="h-8 rounded-full gap-1.5 gradient-primary text-white"
          onClick={() => { setEditing(null); setModalOpen(true) }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Valuation
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && valuations.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
          No valuations recorded yet. Click "Add Valuation" to record the first snapshot.
        </div>
      )}

      {!loading && valuations.length > 0 && (
        <div className="space-y-2">
          {valuations.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {fmtAmount(v.valuationAmount, v.currency?.symbol ?? "")}
                    </p>
                    <span className="text-xs text-muted-foreground">{v.currency?.code}</span>
                    <Badge className={`text-[10px] rounded-full px-2 ${TYPE_COLORS[v.valuationType] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABELS[v.valuationType] ?? v.valuationType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDate(v.valuationDate)}
                    {v.notes && ` · ${v.notes}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={() => { setEditing(v); setModalOpen(true) }}
                >
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setDeletingId(v.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordValuationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        implementationId={implementationId}
        existing={editing}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => { if (!o) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Valuation?</AlertDialogTitle>
            <AlertDialogDescription>
              This valuation snapshot will be permanently removed from the investment history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleDelete() }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
