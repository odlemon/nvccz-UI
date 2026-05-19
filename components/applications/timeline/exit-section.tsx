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
import { portfolioMonitoringApi, type ExitRecord, type ExitPerformance } from "@/lib/api/portfolio-monitoring-api"
import { RecordExitModal } from "../record-exit-modal"
import { toast } from "sonner"
import {
  LogOut,
  TrendingUp,
  DollarSign,
  BarChart2,
  Percent,
  Loader2,
  Trash2,
  Edit,
  CheckCircle2,
} from "lucide-react"

const EXIT_TYPE_LABELS: Record<string, string> = {
  ACQUISITION: "Acquisition",
  IPO: "IPO",
  SECONDARY_SALE: "Secondary Sale",
  BUYBACK: "Buyback",
  WRITE_OFF: "Write-off",
  OTHER: "Other",
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  } catch { return iso }
}

function fmtMoney(amount: string, symbol?: string) {
  const n = parseFloat(amount)
  if (isNaN(n)) return `${symbol ?? ""}${amount}`
  return `${symbol ?? ""}${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function fmtPct(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(n)) return "—"
  return `${(n * 100).toFixed(1)}%`
}

function fmtMultiple(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(n)) return "—"
  return `${n.toFixed(2)}×`
}

interface ExitSectionProps {
  implementationId: string
  onExitRecorded?: () => void
}

export function ExitSection({ implementationId, onExitRecorded }: ExitSectionProps) {
  const [exitRecord, setExitRecord] = useState<ExitRecord | null>(null)
  const [performance, setPerformance] = useState<ExitPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await portfolioMonitoringApi.getExit(implementationId)
      const list = (res as any).data ?? []
      setExitRecord(list[0] ?? null)
    } catch { } finally {
      setLoading(false)
    }
  }, [implementationId])

  useEffect(() => { load() }, [load])

  const handleSaved = (exit: ExitRecord, perf: ExitPerformance) => {
    setExitRecord(exit)
    setPerformance(perf)
    onExitRecorded?.()
  }

  const handleRemove = async () => {
    try {
      setRemoving(true)
      await portfolioMonitoringApi.deleteExit(implementationId)
      setExitRecord(null)
      setPerformance(null)
      toast.success("Exit removed; statuses reverted")
      onExitRecorded?.()
    } catch (err: any) {
      toast.error("Failed to remove exit", { description: err?.message })
    } finally {
      setRemoving(false)
      setRemoveOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!exitRecord) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-dashed space-y-3">
          <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
            <LogOut className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No exit recorded</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record the exit when the investment is fully realised.
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 rounded-full gap-1.5 gradient-primary text-white"
            onClick={() => setModalOpen(true)}
          >
            <LogOut className="w-3.5 h-3.5" />
            Record Exit
          </Button>
        </div>

        <RecordExitModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          implementationId={implementationId}
          existing={null}
          onSaved={handleSaved}
        />
      </div>
    )
  }

  const sym = exitRecord.currency?.symbol ?? ""

  const kpis = [
    {
      label: "Exit Proceeds",
      value: fmtMoney(exitRecord.exitProceedsAmount, sym),
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Invested",
      value: fmtMoney(exitRecord.totalInvestedBasis, sym),
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "IRR (annualised)",
      value: fmtPct(exitRecord.irrAnnualized),
      icon: Percent,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "ROI Multiple",
      value: fmtMultiple(exitRecord.roiMultiple),
      icon: BarChart2,
      color: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              {EXIT_TYPE_LABELS[exitRecord.exitType] ?? exitRecord.exitType}
            </p>
            <p className="text-xs text-emerald-700">Exited on {fmtDate(exitRecord.exitDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge className="text-[10px] rounded-full bg-emerald-100 text-emerald-700">Exited</Badge>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full"
            onClick={() => setModalOpen(true)}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setRemoveOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${k.color}`}>
              <k.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{k.label}</p>
              <p className="text-sm font-bold text-foreground">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {exitRecord.notes && (
        <p className="text-xs text-muted-foreground italic bg-muted/40 rounded-lg px-3 py-2">
          {exitRecord.notes}
        </p>
      )}

      {/* Currency note */}
      <p className="text-[10px] text-muted-foreground text-right">
        All figures in {exitRecord.currency?.code} ({exitRecord.currency?.symbol})
      </p>

      <RecordExitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        implementationId={implementationId}
        existing={exitRecord}
        onSaved={handleSaved}
      />

      <AlertDialog open={removeOpen} onOpenChange={(o) => { if (!o) setRemoveOpen(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Exit?</AlertDialogTitle>
            <AlertDialogDescription>
              The exit record will be deleted and investment statuses will revert to their pre-exit state.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleRemove() }}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove Exit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
