"use client"

import { useEffect, useState, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchGoalLineWeights,
  setGoalLineWeights,
} from "@/lib/store/slices/performanceConfigSlice"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Loader2,
  Save,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import { isValid100PercentSum } from "@/lib/utils/performance-math"
import { extractApiError } from "@/lib/utils/api-error"

interface Props {
  pillarId: string
  pillarName: string
  onClose: () => void
}

export function GoalWeightsEditor({ pillarId, pillarName, onClose }: Props) {
  const dispatch = useAppDispatch()
  const { saving } = useAppSelector((s) => s.performanceConfig)
  // Read directly from store — DO NOT use `|| []` fallback in render,
  // it creates a new array every render and triggers an infinite loop
  // through useEffect dependencies.
  const goalsFromStore = useAppSelector(
    (s) => s.performanceConfig.goalLineWeights[pillarId]
  )
  const goals = useMemo(() => goalsFromStore ?? [], [goalsFromStore])

  const [weights, setWeights] = useState<Record<string, number>>({})
  const [includedGoals, setIncludedGoals] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dispatch(fetchGoalLineWeights(pillarId)).finally(() => setLoading(false))
  }, [pillarId, dispatch])

  // Sync local state only when the store data actually arrives or changes.
  useEffect(() => {
    if (!goalsFromStore) return
    const w: Record<string, number> = {}
    const inc: Record<string, boolean> = {}
    goalsFromStore.forEach((g) => {
      const num =
        g.scorecardWeight !== null && g.scorecardWeight !== undefined
          ? Number(g.scorecardWeight)
          : 0
      w[g.id] = num
      inc[g.id] =
        g.status === "active" &&
        g.scorecardWeight !== null &&
        g.scorecardWeight !== undefined
    })
    setWeights(w)
    setIncludedGoals(inc)
  }, [goalsFromStore])

  const includedWeightMap = useMemo(() => {
    const m: Record<string, number> = {}
    Object.entries(includedGoals).forEach(([id, isIncluded]) => {
      if (isIncluded) m[id] = weights[id] ?? 0
    })
    return m
  }, [weights, includedGoals])

  const validation = useMemo(
    () => isValid100PercentSum(includedWeightMap),
    [includedWeightMap]
  )

  const includedCount = Object.values(includedGoals).filter(Boolean).length

  const handleSave = async () => {
    if (includedCount === 0) {
      toast.error("Include at least one goal before saving")
      return
    }
    if (!validation.valid) {
      toast.error(validation.error || "Goal weights must sum to 100%")
      return
    }
    try {
      await dispatch(
        setGoalLineWeights({ pillarId, goalWeights: includedWeightMap })
      ).unwrap()
      toast.success("Goal weights saved successfully")
      onClose()
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to save weights"))
    }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-white border-b p-6 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold truncate">
                  Goal Weights — {pillarName}
                </h2>
                <p className="text-xs text-gray-500">
                  Active goals must total 100%. Goals not included become inactive.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  validation.valid
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {validation.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                )}
                Total: {validation.total}%
              </Badge>
              <Button
                onClick={handleSave}
                variant="gradient"
                disabled={!validation.valid || saving || includedCount === 0}
                className="rounded-full h-10"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button
                size="icon"
                onClick={onClose}
                variant="gradient-danger"
                className="rounded-full h-10 w-10 shadow-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {!validation.valid && includedCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>Balance Required:</strong> {validation.error}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  Toggle <strong>Include</strong> to mark a goal active. Goals
                  not included will be set to inactive (scorecardWeight = null).
                </p>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>
                      Goals in this pillar ({goals.length})
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {includedCount} included
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {goals.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-8">
                      No goals in this pillar yet. Create company goals first.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {goals.map((g) => (
                        <div
                          key={g.id}
                          className={`grid grid-cols-12 gap-3 items-center p-3 border rounded-lg transition-colors ${
                            includedGoals[g.id] ? "bg-blue-50/50 border-blue-200" : "bg-white"
                          }`}
                        >
                          <div className="col-span-1">
                            <input
                              type="checkbox"
                              checked={!!includedGoals[g.id]}
                              onChange={(e) =>
                                setIncludedGoals((prev) => ({
                                  ...prev,
                                  [g.id]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <div className="col-span-7 min-w-0">
                            <p className="font-medium text-sm truncate">{g.title}</p>
                            <Badge
                              variant="outline"
                              className={
                                g.status === "active"
                                  ? "text-green-700 border-green-300 mt-1"
                                  : "text-gray-600 mt-1"
                              }
                            >
                              {g.status}
                            </Badge>
                          </div>
                          <div className="col-span-4 flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={weights[g.id] ?? 0}
                              disabled={!includedGoals[g.id]}
                              onChange={(e) =>
                                setWeights((prev) => ({
                                  ...prev,
                                  [g.id]: parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-24"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
