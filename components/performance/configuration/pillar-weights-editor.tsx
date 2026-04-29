"use client"

import { useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchScorecardPillars,
  setPillarWeights as setPillarWeightsThunk,
} from "@/lib/store/slices/performanceConfigSlice"
import { performanceConfigApi } from "@/lib/api/performance-config-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  Loader2,
  Save,
  Pencil,
  BarChart2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { isValid100PercentSum } from "@/lib/utils/performance-math"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { GoalWeightsEditor } from "./goal-weights-editor"
import { extractApiError } from "@/lib/utils/api-error"

const PILLAR_GRADIENTS: Record<string, string> = {
  bsc_financial: "from-emerald-500 to-emerald-600",
  bsc_customer_market: "from-blue-500 to-blue-600",
  bsc_internal_operations: "from-purple-500 to-purple-600",
  bsc_learning_growth_hr: "from-orange-500 to-orange-600",
}

const PILLAR_HOVER_SHADOWS: Record<string, string> = {
  bsc_financial: "hover:shadow-lg hover:shadow-emerald-500/30 hover:border-emerald-300",
  bsc_customer_market: "hover:shadow-lg hover:shadow-blue-500/30 hover:border-blue-300",
  bsc_internal_operations: "hover:shadow-lg hover:shadow-purple-500/30 hover:border-purple-300",
  bsc_learning_growth_hr: "hover:shadow-lg hover:shadow-orange-500/30 hover:border-orange-300",
}

export function PillarWeightsEditor() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { pillars, saving } = useAppSelector((s) => s.performanceConfig)

  const [weights, setWeights] = useState<Record<string, number>>({})
  const [editingPillar, setEditingPillar] = useState<{
    id: string
    displayName: string
    description?: string
  } | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renameDescDraft, setRenameDescDraft] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [goalWeightsPillarId, setGoalWeightsPillarId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchScorecardPillars())
  }, [dispatch])

  useEffect(() => {
    const next: Record<string, number> = {}
    pillars.forEach((p) => {
      next[p.id] = p.weight ?? 0
    })
    setWeights(next)
  }, [pillars])

  const validation = useMemo(() => isValid100PercentSum(weights), [weights])

  const handleChange = (id: string, value: string) => {
    const num = parseFloat(value)
    setWeights((prev) => ({
      ...prev,
      [id]: Number.isFinite(num) ? num : 0,
    }))
  }

  const handleSave = async () => {
    if (!validation.valid) {
      toast.error(validation.error || "Weights must sum to 100%")
      return
    }
    try {
      await dispatch(setPillarWeightsThunk(weights)).unwrap()
      toast.success("Pillar weights saved successfully")
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to save weights"))
    }
  }

  const startRename = (p: { id: string; displayName: string; description?: string }) => {
    setEditingPillar(p)
    setRenameDraft(p.displayName)
    setRenameDescDraft(p.description || "")
  }

  const handleRenameSave = async () => {
    if (!editingPillar || !renameDraft.trim()) return
    setRenaming(true)
    try {
      await performanceConfigApi.updateScorecardPillar(editingPillar.id, {
        displayName: renameDraft.trim(),
        description: renameDescDraft.trim() || undefined,
      })
      await dispatch(fetchScorecardPillars()).unwrap()
      toast.success("Pillar updated")
      setEditingPillar(null)
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to rename pillar"))
    } finally {
      setRenaming(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header + summary */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" /> Balanced Scorecard Pillars
            </h2>
            <p className="text-sm text-gray-500">
              Set weights for the 4 system pillars. Total must equal 100%.
            </p>
          </div>
          <Badge
            className={
              validation.valid
                ? "bg-green-100 text-green-800 border-green-200 px-3 py-1"
                : "bg-amber-100 text-amber-800 border-amber-200 px-3 py-1"
            }
          >
            {validation.valid ? (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            )}
            Total: {validation.total}%
          </Badge>
        </div>

        {/* Pillar cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pillars.map((p) => {
            const gradient = PILLAR_GRADIENTS[p.id] || "from-gray-500 to-gray-600"
            const hoverShadow =
              PILLAR_HOVER_SHADOWS[p.id] ||
              "hover:shadow-lg hover:shadow-gray-500/30 hover:border-gray-300"
            return (
              <Card
                key={p.id}
                className={`overflow-hidden border border-gray-200 transition-all duration-200 ${hoverShadow}`}
              >
                <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">
                        {p.displayName}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {p.canonicalName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setGoalWeightsPillarId(p.id)}
                        title="View goal weights in this pillar"
                        className="h-8 w-8 rounded-full"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                      {permissions.canEditPillarWeights && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startRename(p)}
                          title="Rename / edit description"
                          className="h-8 w-8 rounded-full"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Label className="text-xs text-gray-500 flex-1">Weight</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={weights[p.id] ?? 0}
                      onChange={(e) => handleChange(p.id, e.target.value)}
                      disabled={!permissions.canEditPillarWeights}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 w-4">%</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Validation banner */}
        {!validation.valid && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Balance Required:</strong> {validation.error}
            </p>
          </div>
        )}

        {/* Save action */}
        {permissions.canEditPillarWeights && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!validation.valid || saving}
              className="rounded-full gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Pillar Weights
            </Button>
          </div>
        )}
      </div>

      {/* Rename Pillar Dialog */}
      <Dialog
        open={editingPillar !== null}
        onOpenChange={(open) => !open && setEditingPillar(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pillar</DialogTitle>
            <DialogDescription>
              Rename the display name or update the description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Display Name</Label>
              <Input
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={renameDescDraft}
                onChange={(e) => setRenameDescDraft(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPillar(null)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSave}
              disabled={renaming || !renameDraft.trim()}
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {renaming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Weights Sheet */}
      {goalWeightsPillarId && (
        <GoalWeightsEditor
          pillarId={goalWeightsPillarId}
          pillarName={pillars.find((p) => p.id === goalWeightsPillarId)?.displayName || ""}
          onClose={() => setGoalWeightsPillarId(null)}
        />
      )}
    </>
  )
}
