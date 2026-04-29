"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import {
  fetchStrategies,
  fetchScorecardPillars,
  createStrategy,
  archiveStrategy,
  uploadStrategyDocument,
  fetchVisionStatement,
  updateStrategy,
} from "@/lib/store/slices/performanceConfigSlice"
import { performanceConfigApi } from "@/lib/api/performance-config-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Plus,
  Loader2,
  FileText,
  Upload,
  Archive,
  Download,
  AlertTriangle,
  Calendar,
  Eye,
  X,
  Pencil,
  Search,
  Filter,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { usePerformancePermissions } from "@/lib/hooks/usePerformancePermissions"
import { extractApiError, responseMessageIfFailed } from "@/lib/utils/api-error"
import { isValid100PercentSum } from "@/lib/utils/performance-math"

export function StrategyUploader() {
  const dispatch = useAppDispatch()
  const { permissions } = usePerformancePermissions()
  const { strategies, archives, pillars, visionStatement } = useAppSelector(
    (s) => s.performanceConfig
  )

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all")
  const [createOpen, setCreateOpen] = useState(false)

  const [title, setTitle] = useState("")
  const [periodStart, setPeriodStart] = useState<Date | undefined>(undefined)
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(undefined)
  const [vision, setVision] = useState("")
  const [pillarWeightsForm, setPillarWeightsForm] = useState<
    Record<string, number>
  >({})
  const [creating, setCreating] = useState(false)

  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const [drawerStrategyId, setDrawerStrategyId] = useState<string | null>(null)
  const [drawerStrategy, setDrawerStrategy] = useState<any>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    dispatch(fetchStrategies(false))
    dispatch(fetchScorecardPillars())
    dispatch(fetchVisionStatement())
  }, [dispatch])

  // Prefill pillar weights when opening Create dialog from scorecard pillars
  useEffect(() => {
    if (!createOpen) return
    if (pillars.length === 0) return
    const seed: Record<string, number> = {}
    pillars.forEach((p) => {
      // Backend create payload uses canonicalName as keys
      seed[p.canonicalName] = p.weight ?? 25
    })
    setPillarWeightsForm(seed)
    if (visionStatement && !vision) setVision(visionStatement)
  }, [createOpen, pillars, visionStatement])

  const pillarWeightsValidation = useMemo(
    () => isValid100PercentSum(pillarWeightsForm),
    [pillarWeightsForm]
  )

  const handleCreate = async () => {
    if (!title.trim() || !periodStart || !periodEnd) {
      toast.error("Title and period dates are required")
      return
    }
    if (periodEnd < periodStart) {
      toast.error("Period end must be after period start")
      return
    }
    if (!pillarWeightsValidation.valid) {
      toast.error(pillarWeightsValidation.error || "Pillar weights must sum to 100%")
      return
    }
    setCreating(true)
    try {
      const result = await dispatch(
        createStrategy({
          title: title.trim(),
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          visionStatement: vision.trim() || undefined,
          pillarWeights: pillarWeightsForm,
        })
      ).unwrap()
      const failMsg = responseMessageIfFailed(result as any)
      if (failMsg) {
        toast.error(failMsg)
        return
      }
      toast.success("Strategy cycle created")
      setTitle("")
      setPeriodStart(undefined)
      setPeriodEnd(undefined)
      setVision("")
      setPillarWeightsForm({})
      setCreateOpen(false)
      dispatch(fetchStrategies(false))
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to create strategy"))
    } finally {
      setCreating(false)
    }
  }

  const handleUpload = async (id: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed")
      return
    }
    setUploadingId(id)
    try {
      const result = await dispatch(uploadStrategyDocument({ id, file })).unwrap()
      const failMsg = responseMessageIfFailed(result as any)
      if (failMsg) {
        toast.error(failMsg)
        return
      }
      toast.success("Strategy document uploaded")
      dispatch(fetchStrategies(false))
    } catch (e: any) {
      toast.error(extractApiError(e, "Upload failed"))
    } finally {
      setUploadingId(null)
    }
  }

  const handleArchive = async () => {
    if (!archiveConfirmId) return
    setArchivingId(archiveConfirmId)
    try {
      await dispatch(archiveStrategy(archiveConfirmId)).unwrap()
      toast.success("Strategy archived (now read-only)")
      setArchiveConfirmId(null)
      setDrawerStrategyId(null)
      dispatch(fetchStrategies(false))
    } catch (e: any) {
      toast.error(extractApiError(e, "Archive failed"))
    } finally {
      setArchivingId(null)
    }
  }

  const openDrawer = async (strategyId: string) => {
    setDrawerStrategyId(strategyId)
    setDrawerLoading(true)
    setEditMode(false)
    try {
      const res = await performanceConfigApi.getStrategy(strategyId)
      setDrawerStrategy(res.data)
      setEditForm({
        title: res.data?.title || "",
        periodStart: res.data?.periodStart ? new Date(res.data.periodStart) : undefined,
        periodEnd: res.data?.periodEnd ? new Date(res.data.periodEnd) : undefined,
        visionStatement: res.data?.visionStatement || "",
        pillarWeights: res.data?.pillarWeights || {},
      })
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to load strategy"))
    } finally {
      setDrawerLoading(false)
    }
  }

  const editValidation = useMemo(
    () =>
      isValid100PercentSum(
        Object.values(editForm.pillarWeights || {}).map(Number) as number[]
      ),
    [editForm.pillarWeights]
  )

  const handleSaveEdit = async () => {
    if (!drawerStrategyId) return
    if (!editForm.periodStart || !editForm.periodEnd) {
      toast.error("Period dates are required")
      return
    }
    if (editForm.periodEnd < editForm.periodStart) {
      toast.error("Period end must be after period start")
      return
    }
    if (!editValidation.valid) {
      toast.error(editValidation.error || "Pillar weights must sum to 100%")
      return
    }
    setSavingEdit(true)
    try {
      await dispatch(
        updateStrategy({
          id: drawerStrategyId,
          data: {
            title: editForm.title,
            periodStart: editForm.periodStart.toISOString(),
            periodEnd: editForm.periodEnd.toISOString(),
            visionStatement: editForm.visionStatement,
            pillarWeights: editForm.pillarWeights,
          },
        })
      ).unwrap()
      toast.success("Strategy updated")
      const res = await performanceConfigApi.getStrategy(drawerStrategyId)
      setDrawerStrategy(res.data)
      setEditMode(false)
      dispatch(fetchStrategies(false))
    } catch (e: any) {
      toast.error(extractApiError(e, "Failed to update strategy"))
    } finally {
      setSavingEdit(false)
    }
  }

  const filteredStrategies = strategies.filter((s) => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter === "active" && (s as any).status !== "ACTIVE") return false
    if (statusFilter === "archived" && (s as any).status !== "ARCHIVED") return false
    return true
  })

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Strategy Cycles
            </h2>
            <p className="text-sm text-gray-500">
              Vision, multi-year strategies, PDF documents, and archives.
            </p>
          </div>
          {permissions.canManageStrategies && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-full gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
            >
              <Plus className="w-4 h-4" /> New Cycle
            </Button>
          )}
        </div>

        {/* Vision banner */}
        {visionStatement && (
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-blue-700">
                Active Vision
              </p>
              <p className="text-sm italic text-gray-800 mt-1">
                "{visionStatement}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search strategies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                statusFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                statusFilter === "active" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"
              }`}
            >
              Active
            </button>
          </div>
          <Badge variant="outline" className="text-xs">
            <Filter className="w-3 h-3 mr-1" /> {filteredStrategies.length} result
            {filteredStrategies.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Strategies list */}
        <Card>
          <CardContent className="pt-6">
            {filteredStrategies.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {search ? `No strategies match "${search}"` : "No active strategies."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStrategies.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openDrawer(s.id)}
                    className="border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all bg-white group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{s.title}</p>
                          <Badge
                            className={
                              (s as any).status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          >
                            {(s as any).status || "ACTIVE"}
                          </Badge>
                          {s.strategyDocumentUrl && (
                            <Badge
                              variant="outline"
                              className="text-blue-700 border-blue-300"
                            >
                              <FileText className="w-3 h-3 mr-1" /> PDF
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(s.periodStart), "MMM d, yyyy")} —{" "}
                            {format(new Date(s.periodEnd), "MMM d, yyyy")}
                          </span>
                        </div>
                        {s.visionStatement && (
                          <p className="text-xs text-gray-600 italic mt-2 line-clamp-1">
                            "{s.visionStatement}"
                          </p>
                        )}
                      </div>
                      <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Cycle Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Strategy Cycle</DialogTitle>
            <DialogDescription>
              Multi-year cycles supported. Pillar weights are pre-filled from current
              system pillars and must total 100%.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="2026 Strategy Cycle"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Period Start *</Label>
                <DatePicker
                  value={periodStart}
                  onChange={setPeriodStart}
                  placeholder="Select start date"
                  allowFutureDates
                />
              </div>
              <div>
                <Label>Period End *</Label>
                <DatePicker
                  value={periodEnd}
                  onChange={setPeriodEnd}
                  placeholder="Select end date"
                  allowFutureDates
                />
              </div>
            </div>
            <div>
              <Label>Vision Statement</Label>
              <Textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                rows={3}
                placeholder="Our vision for this cycle..."
              />
            </div>

            {/* Pillar weights with validation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Pillar Weights (must total 100%)</Label>
                <Badge
                  className={
                    pillarWeightsValidation.valid
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }
                >
                  Total: {pillarWeightsValidation.total}%
                </Badge>
              </div>
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                {pillars.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3"
                  >
                    <span className="flex-1 text-sm font-medium">
                      {p.displayName}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={pillarWeightsForm[p.canonicalName] ?? 0}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value)
                        setPillarWeightsForm((prev) => ({
                          ...prev,
                          [p.canonicalName]: Number.isFinite(num) ? num : 0,
                        }))
                      }}
                      className="w-24"
                    />
                    <span className="text-xs text-gray-500 w-4">%</span>
                  </div>
                ))}
              </div>
              {!pillarWeightsValidation.valid && (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {pillarWeightsValidation.error}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !pillarWeightsValidation.valid}
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Sheet open={drawerStrategyId !== null} onOpenChange={(o) => !o && setDrawerStrategyId(null)}>
        <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-white border-b p-6 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold truncate">
                    {drawerStrategy?.title || "Strategy"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {drawerStrategy?.status || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {permissions.canManageStrategies &&
                  drawerStrategy?.status === "ACTIVE" &&
                  !editMode && (
                    <>
                      <input
                        ref={(el) => {
                          if (drawerStrategyId) fileInputs.current[drawerStrategyId] = el
                        }}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && drawerStrategyId) handleUpload(drawerStrategyId, file)
                          e.target.value = ""
                        }}
                      />
                      <Button
                        onClick={() =>
                          drawerStrategyId &&
                          fileInputs.current[drawerStrategyId]?.click()
                        }
                        disabled={uploadingId === drawerStrategyId}
                        className="rounded-full h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        {uploadingId === drawerStrategyId ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {drawerStrategy?.strategyDocumentUrl ? "Replace PDF" : "Upload PDF"}
                      </Button>
                      <Button
                        onClick={() => setEditMode(true)}
                        className="rounded-full h-10 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button
                        onClick={() => setArchiveConfirmId(drawerStrategyId)}
                        className="rounded-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                      >
                        <Archive className="w-4 h-4 mr-2" /> Archive
                      </Button>
                    </>
                  )}
                {editMode && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="rounded-full h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !editValidation.valid}
                      className="rounded-full h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      {savingEdit ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerStrategyId(null)}
                  className="rounded-full h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {drawerLoading || !drawerStrategy ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : editMode ? (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Period Start</Label>
                      <DatePicker
                        value={editForm.periodStart}
                        onChange={(d) =>
                          setEditForm({ ...editForm, periodStart: d })
                        }
                        placeholder="Select start date"
                        allowFutureDates
                      />
                    </div>
                    <div>
                      <Label>Period End</Label>
                      <DatePicker
                        value={editForm.periodEnd}
                        onChange={(d) =>
                          setEditForm({ ...editForm, periodEnd: d })
                        }
                        placeholder="Select end date"
                        allowFutureDates
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Vision Statement</Label>
                    <Textarea
                      value={editForm.visionStatement}
                      onChange={(e) =>
                        setEditForm({ ...editForm, visionStatement: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Pillar Weights</Label>
                      <Badge
                        className={
                          editValidation.valid
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        Total: {editValidation.total}%
                      </Badge>
                    </div>
                    <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                      {Object.entries(editForm.pillarWeights || {}).map(
                        ([key, val]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="flex-1 text-sm font-medium">{key}</span>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={val as number}
                              onChange={(e) => {
                                const num = parseFloat(e.target.value)
                                setEditForm({
                                  ...editForm,
                                  pillarWeights: {
                                    ...editForm.pillarWeights,
                                    [key]: Number.isFinite(num) ? num : 0,
                                  },
                                })
                              }}
                              className="w-24"
                            />
                            <span className="text-xs text-gray-500 w-4">%</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Period</p>
                      <p className="font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {format(new Date(drawerStrategy.periodStart), "MMM d, yyyy")} —{" "}
                        {format(new Date(drawerStrategy.periodEnd), "MMM d, yyyy")}
                      </p>
                    </div>
                    {drawerStrategy.visionStatement && (
                      <div>
                        <p className="text-xs text-gray-500">Vision</p>
                        <p className="italic text-gray-800 mt-0.5">
                          "{drawerStrategy.visionStatement}"
                        </p>
                      </div>
                    )}
                    {drawerStrategy.strategyDocumentUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Strategy Document</p>
                        <a
                          href={drawerStrategy.strategyDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Download PDF
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {drawerStrategy.pillarWeights && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Pillar Weights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1.5">
                        {Object.entries(drawerStrategy.pillarWeights).map(
                          ([key, val]: any) => (
                            <div
                              key={key}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{key}</span>
                              <Badge variant="outline">{val}%</Badge>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Archive confirm */}
      <Dialog
        open={archiveConfirmId !== null}
        onOpenChange={(o) => !o && setArchiveConfirmId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Archive this strategy?
            </DialogTitle>
            <DialogDescription>
              Archiving makes the strategy read-only and hides it from active dashboards.
              It will appear in Archives.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArchiveConfirmId(null)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleArchive}
              disabled={!!archivingId}
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            >
              {archivingId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
