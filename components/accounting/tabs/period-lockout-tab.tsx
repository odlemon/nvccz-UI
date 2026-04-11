"use client"

import { useState, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  fetchFiscalCalendar,
  saveLocksDraft,
  commitLocks,
  updateFiscalPolicy,
  fetchFiscalAuditLog,
} from "@/lib/store/slices/cashbookSlice"
import { cashbookApi } from "@/lib/api/cashbook-api"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { AppDispatch, RootState } from "@/lib/store"
import type {
  FiscalPeriod,
  FiscalLockDraftItem,
  FiscalAuditEntry,
  PeriodStatusResponse,
} from "@/lib/api/cashbook-api"
import {
  Lock,
  Unlock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  ShieldOff,
  Calendar,
  Info,
  History,
  FileText,
  Settings,
  Eye,
  X,
} from "lucide-react"

// ─── Constants ───────────────────────────────────────────────────────────────

const MODULE_CODES = ["GL", "BANK", "AP", "AR", "INVENTORY"] as const

const MODULE_LABELS: Record<string, string> = {
  GL: "General Ledger",
  BANK: "Bank / Cashbook",
  AP: "Accounts Payable",
  AR: "Accounts Receivable",
  INVENTORY: "Inventory",
}

const MODULE_COLORS: Record<string, string> = {
  GL: "bg-blue-500",
  BANK: "bg-emerald-500",
  AP: "bg-orange-500",
  AR: "bg-purple-500",
  INVENTORY: "bg-amber-500",
}

type SubTab = "calendar" | "audit" | "policy"

function getModuleLockStatus(period: FiscalPeriod, moduleCode: string): "LOCKED" | "OPEN" {
  const lock = period.moduleLocks.find(l => l.moduleCode === moduleCode)
  return lock?.lockStatus === "LOCKED" ? "LOCKED" : "OPEN"
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PeriodLockoutTab() {
  const dispatch = useDispatch<AppDispatch>()
  const fiscalCalendar = useSelector((state: RootState) => state.cashbook.fiscalCalendar)
  const fiscalCalendarLoading = useSelector((state: RootState) => state.cashbook.fiscalCalendarLoading)
  const fiscalAuditLog = useSelector((state: RootState) => state.cashbook.fiscalAuditLog)
  const fiscalAuditLoading = useSelector((state: RootState) => state.cashbook.fiscalAuditLoading)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>("calendar")
  const [selectedYearId, setSelectedYearId] = useState<string>("")
  const [draftChanges, setDraftChanges] = useState<Map<string, FiscalLockDraftItem>>(new Map())
  const [isSaving, setIsSaving] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [lockModalTarget, setLockModalTarget] = useState<{
    period: FiscalPeriod
    moduleCode: string
    newStatus: "LOCKED" | "OPEN"
  } | null>(null)
  const [lockReason, setLockReason] = useState("")
  const [commitReason, setCommitReason] = useState("")
  const [commitModalOpen, setCommitModalOpen] = useState(false)

  // Period status drawer
  const [statusDrawerOpen, setStatusDrawerOpen] = useState(false)
  const [statusDrawerPeriod, setStatusDrawerPeriod] = useState<string>("")
  const [periodStatus, setPeriodStatus] = useState<PeriodStatusResponse | null>(null)
  const [periodStatusLoading, setPeriodStatusLoading] = useState(false)

  // Policy editing
  const [isSavingPolicy, setIsSavingPolicy] = useState(false)

  // Audit view drawer
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false)
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<FiscalAuditEntry | null>(null)

  useEffect(() => {
    dispatch(fetchFiscalCalendar())
  }, [dispatch])

  useEffect(() => {
    if (fiscalCalendar?.fiscalYears.length && !selectedYearId) {
      const sorted = [...fiscalCalendar.fiscalYears].sort(
        (a, b) => new Date(b.fiscalYear.startDate).getTime() - new Date(a.fiscalYear.startDate).getTime()
      )
      setSelectedYearId(sorted[0].fiscalYear.id)
    }
  }, [fiscalCalendar, selectedYearId])

  useEffect(() => {
    if (activeSubTab === "audit") {
      dispatch(fetchFiscalAuditLog({ take: 100, skip: 0 }))
    }
  }, [activeSubTab, dispatch])

  const sortedFiscalYears = useMemo(() => {
    if (!fiscalCalendar?.fiscalYears) return []
    return [...fiscalCalendar.fiscalYears].sort(
      (a, b) => new Date(b.fiscalYear.startDate).getTime() - new Date(a.fiscalYear.startDate).getTime()
    )
  }, [fiscalCalendar])

  const selectedFiscalYear = useMemo(() => {
    return sortedFiscalYears.find(fy => fy.fiscalYear.id === selectedYearId)
  }, [sortedFiscalYears, selectedYearId])

  const hasDraftChanges = draftChanges.size > 0

  const getEffectiveLockStatus = (period: FiscalPeriod, moduleCode: string): "LOCKED" | "OPEN" => {
    const draftKey = `${period.id}:${moduleCode}`
    const draft = draftChanges.get(draftKey)
    if (draft) return draft.lockStatus
    return getModuleLockStatus(period, moduleCode)
  }

  const isDraftChanged = (period: FiscalPeriod, moduleCode: string): boolean => {
    return draftChanges.has(`${period.id}:${moduleCode}`)
  }

  const openLockModal = (period: FiscalPeriod, moduleCode: string) => {
    const current = getEffectiveLockStatus(period, moduleCode)
    const newStatus = current === "LOCKED" ? "OPEN" : "LOCKED"
    setLockModalTarget({ period, moduleCode, newStatus })
    setLockReason("")
    setLockModalOpen(true)
  }

  const confirmLockChange = () => {
    if (!lockModalTarget) return
    const { period, moduleCode, newStatus } = lockModalTarget
    const draftKey = `${period.id}:${moduleCode}`
    const original = getModuleLockStatus(period, moduleCode)

    if (newStatus === original) {
      setDraftChanges(prev => {
        const next = new Map(prev)
        next.delete(draftKey)
        return next
      })
    } else {
      setDraftChanges(prev => {
        const next = new Map(prev)
        next.set(draftKey, {
          fiscalPeriodId: period.id,
          moduleCode,
          lockStatus: newStatus,
          reason: lockReason || undefined,
        })
        return next
      })
    }
    setLockModalOpen(false)
    setLockModalTarget(null)
  }

  const handleSaveDraft = async () => {
    if (!hasDraftChanges) return
    setIsSaving(true)
    try {
      const draft = Array.from(draftChanges.values())
      await dispatch(saveLocksDraft(draft)).unwrap()
      toast.success("Lock draft saved successfully")
    } catch (error: any) {
      toast.error("Failed to save draft", { description: error?.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCommit = async () => {
    setIsCommitting(true)
    try {
      if (hasDraftChanges) {
        const draft = Array.from(draftChanges.values())
        await dispatch(saveLocksDraft(draft)).unwrap()
      }
      await dispatch(commitLocks(commitReason || undefined)).unwrap()
      setDraftChanges(new Map())
      setCommitReason("")
      setCommitModalOpen(false)
      toast.success("Lock changes committed successfully")
      dispatch(fetchFiscalCalendar())
    } catch (error: any) {
      toast.error("Failed to commit locks", { description: error?.message })
    } finally {
      setIsCommitting(false)
    }
  }

  const handleRefresh = () => {
    dispatch(fetchFiscalCalendar())
    setDraftChanges(new Map())
  }

  const handleDiscardDraft = () => {
    setDraftChanges(new Map())
    toast.info("Draft changes discarded")
  }

  const handleViewPeriodStatus = async (periodName: string) => {
    // Convert period name like "January 2024" to "2024-01" format
    const date = new Date(periodName)
    const periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    setStatusDrawerPeriod(periodName)
    setStatusDrawerOpen(true)
    setPeriodStatusLoading(true)
    setPeriodStatus(null)
    try {
      const response = await cashbookApi.getPeriodStatus(periodStr)
      if (response.success && response.data) {
        setPeriodStatus(response.data as any)
      }
    } catch {
      toast.error("Failed to load period status")
    } finally {
      setPeriodStatusLoading(false)
    }
  }

  const handlePolicyUpdate = async (field: string, value: any) => {
    setIsSavingPolicy(true)
    try {
      await dispatch(updateFiscalPolicy({ [field]: value })).unwrap()
      toast.success("Policy updated successfully")
      dispatch(fetchFiscalCalendar())
    } catch (error: any) {
      toast.error("Failed to update policy", { description: error?.message })
    } finally {
      setIsSavingPolicy(false)
    }
  }

  if (fiscalCalendarLoading && !fiscalCalendar) {
    return <PeriodLockoutSkeleton />
  }

  if (!fiscalCalendar) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fiscal Calendar Data</h3>
        <p className="text-gray-600 mb-4">Could not load the fiscal calendar.</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center border-b">
        {([
          { id: "calendar" as SubTab, label: "Calendar", icon: Calendar },
          { id: "audit" as SubTab, label: "Audit Log", icon: History },
          { id: "policy" as SubTab, label: "Policy Settings", icon: Settings },
        ]).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeSubTab === tab.id
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ═══ Calendar Sub-Tab ═══ */}
      {activeSubTab === "calendar" && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Manage module-level period locks. Config version: {fiscalCalendar.lockConfigVersion}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleRefresh}
              disabled={fiscalCalendarLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1", fiscalCalendarLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Policy Info Badges */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
              <Info className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-700">
                Policy: <span className="font-medium">{fiscalCalendar.policy.lockedPeriodPolicy === "ERROR" ? "Block posting" : "Warn only"}</span>
              </span>
            </div>
            {fiscalCalendar.policy.allowOverridePosting && (
              <Badge variant="outline" className="rounded-full">Override posting allowed</Badge>
            )}
            {fiscalCalendar.policy.glErrorBatchEnabled && (
              <Badge variant="outline" className="rounded-full">GL error batch enabled</Badge>
            )}
          </div>

          {/* Year Selector + Legend + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="w-[200px] rounded-full">
                <SelectValue placeholder="Select Fiscal Year" />
              </SelectTrigger>
              <SelectContent>
                {sortedFiscalYears.map(fy => (
                  <SelectItem key={fy.fiscalYear.id} value={fy.fiscalYear.id}>
                    {fy.fiscalYear.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-2">
              {MODULE_CODES.map(code => (
                <div key={code} className="flex items-center gap-1 text-xs text-gray-600">
                  <div className={cn("w-2.5 h-2.5 rounded-sm", MODULE_COLORS[code])} />
                  <span>{code}</span>
                </div>
              ))}
            </div>

            <div className="flex-1" />

            {hasDraftChanges && (
              <Badge className="bg-amber-100 text-amber-800 rounded-full">
                {draftChanges.size} unsaved change{draftChanges.size !== 1 ? "s" : ""}
              </Badge>
            )}

            {hasDraftChanges && (
              <Button variant="ghost" size="sm" className="rounded-full text-gray-500" onClick={handleDiscardDraft}>
                Discard
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleSaveDraft}
              disabled={!hasDraftChanges || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save Draft
            </Button>

            <Button
              size="sm"
              className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              onClick={() => setCommitModalOpen(true)}
              disabled={isCommitting}
            >
              {isCommitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Commit Locks
            </Button>
          </div>

          {/* Period Grid */}
          {selectedFiscalYear && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedFiscalYear.fiscalYear.name}
                    <Badge variant={selectedFiscalYear.fiscalYear.status === "OPEN" ? "default" : "secondary"} className="rounded-full text-xs">
                      {selectedFiscalYear.fiscalYear.status}
                    </Badge>
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {format(new Date(selectedFiscalYear.fiscalYear.startDate), "MMM d, yyyy")} - {format(new Date(selectedFiscalYear.fiscalYear.endDate), "MMM d, yyyy")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  {/* Column Headers */}
                  <div className="grid grid-cols-[200px_repeat(5,1fr)_80px_60px] bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    <div className="p-3">Period</div>
                    {MODULE_CODES.map(code => (
                      <div key={code} className="p-3 text-center">{code}</div>
                    ))}
                    <div className="p-3 text-center">Status</div>
                    <div className="p-3 text-center">View</div>
                  </div>

                  {/* Period Rows */}
                  {[...selectedFiscalYear.periods]
                    .sort((a, b) => a.periodNumber - b.periodNumber)
                    .map((period) => {
                      const anyLocked = MODULE_CODES.some(code => getEffectiveLockStatus(period, code) === "LOCKED")
                      const anyDraft = MODULE_CODES.some(code => isDraftChanged(period, code))

                      return (
                        <div
                          key={period.id}
                          className={cn(
                            "grid grid-cols-[200px_repeat(5,1fr)_80px_60px] border-b last:border-b-0 transition-colors",
                            anyDraft ? "bg-amber-50/50" : "hover:bg-gray-50/50"
                          )}
                        >
                          <div className="p-3 flex items-center">
                            <span className="font-medium text-sm text-gray-900">{period.name}</span>
                          </div>

                          <TooltipProvider delayDuration={200}>
                            {MODULE_CODES.map(code => {
                              const status = getEffectiveLockStatus(period, code)
                              const isLocked = status === "LOCKED"
                              const isChanged = isDraftChanged(period, code)

                              return (
                                <div key={code} className="p-3 flex items-center justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => openLockModal(period, code)}
                                        className={cn(
                                          "w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2",
                                          isLocked
                                            ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
                                            : "bg-green-50 border-green-300 text-green-600 hover:bg-green-100",
                                          isChanged && "ring-2 ring-amber-400 ring-offset-1"
                                        )}
                                      >
                                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{MODULE_LABELS[code]}: {isLocked ? "Locked" : "Open"}</p>
                                      {isChanged && <p className="text-amber-600 text-xs">Draft change</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )
                            })}
                          </TooltipProvider>

                          <div className="p-3 flex items-center justify-center">
                            {anyLocked ? (
                              <Badge variant="destructive" className="text-xs rounded-full px-2 py-0.5">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 text-xs rounded-full px-2 py-0.5">
                                <Unlock className="w-3 h-3 mr-1" />
                                Open
                              </Badge>
                            )}
                          </div>

                          <div className="p-3 flex items-center justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleViewPeriodStatus(period.name)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>View lock status</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ Audit Log Sub-Tab ═══ */}
      {activeSubTab === "audit" && (
        <div className="space-y-4">
          <ProcurementDataTable
            data={fiscalAuditLog}
            columns={[
              {
                key: "createdAt" as any,
                label: "Timestamp",
                sortable: true,
                render: (value: string) => format(new Date(value), "MMM d, yyyy HH:mm"),
              },
              {
                key: "actionType" as any,
                label: "Action",
                sortable: true,
                render: (value: string) => (
                  <Badge
                    variant={value === "ATTEMPT_REJECTED" ? "destructive" : "outline"}
                    className="text-xs rounded-full"
                  >
                    {value.replace(/_/g, " ")}
                  </Badge>
                ),
              },
              {
                key: "moduleCode" as any,
                label: "Module",
                sortable: true,
                render: (value: string) => (
                  <span className="text-xs font-medium">{value}</span>
                ),
              },
              {
                key: "performedBy" as any,
                label: "User",
                render: (value: any) =>
                  value ? `${value.firstName} ${value.lastName}` : "N/A",
              },
              {
                key: "source" as any,
                label: "Source",
                sortable: true,
                render: (value: string) => (
                  <Badge variant="outline" className="text-xs rounded-full">{value}</Badge>
                ),
              },
              {
                key: "display" as any,
                label: "Period",
                render: (value: any) => {
                  const label = value?.periodLabel
                  if (!label || label === "—" || label.startsWith("Not applicable")) return "—"
                  return <span className="text-xs font-medium">{label}</span>
                },
              },
            ]}
            title="Audit Log"
            searchPlaceholder="Search audit entries..."
            loading={fiscalAuditLoading}
            emptyMessage="No audit entries found."
            onView={(entry: any) => {
              setSelectedAuditEntry(entry)
              setAuditDrawerOpen(true)
            }}
            extraControls={
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => dispatch(fetchFiscalAuditLog({ take: 100, skip: 0 }))}
                disabled={fiscalAuditLoading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", fiscalAuditLoading && "animate-spin")} />
                Refresh
              </Button>
            }
          />
        </div>
      )}

      {/* ═══ Policy Settings Sub-Tab ═══ */}
      {activeSubTab === "policy" && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">Configure how the system handles posting attempts against locked periods.</p>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Lock Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Locked Period Policy */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Locked Period Policy</Label>
                  <p className="text-xs text-gray-500">
                    When a user tries to post in a locked period: ERROR blocks the transaction, WARN shows a warning but allows it.
                  </p>
                </div>
                <Select
                  value={fiscalCalendar.policy.lockedPeriodPolicy}
                  onValueChange={(val) => handlePolicyUpdate("lockedPeriodPolicy", val)}
                  disabled={isSavingPolicy}
                >
                  <SelectTrigger className="w-[140px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERROR">ERROR (Block)</SelectItem>
                    <SelectItem value="WARN">WARN (Allow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allow Override Posting */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Allow Override Posting</Label>
                  <p className="text-xs text-gray-500">
                    When enabled, authorized users can override the lock and post transactions in locked periods.
                  </p>
                </div>
                <Switch
                  checked={fiscalCalendar.policy.allowOverridePosting}
                  onCheckedChange={(val) => handlePolicyUpdate("allowOverridePosting", val)}
                  disabled={isSavingPolicy}
                />
              </div>

              {/* GL Error Batch Enabled */}
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">GL Error Batch Enabled</Label>
                  <p className="text-xs text-gray-500">
                    When enabled, rejected postings are queued into a GL error batch for review instead of being silently dropped.
                  </p>
                </div>
                <Switch
                  checked={fiscalCalendar.policy.glErrorBatchEnabled}
                  onCheckedChange={(val) => handlePolicyUpdate("glErrorBatchEnabled", val)}
                  disabled={isSavingPolicy}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5" />
                Current Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Lock Config Version</p>
                  <p className="font-medium">{fiscalCalendar.lockConfigVersion}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Fiscal Years</p>
                  <p className="font-medium">{fiscalCalendar.fiscalYears.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Lock Confirmation Modal ─── */}
      <Dialog open={lockModalOpen} onOpenChange={setLockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lockModalTarget?.newStatus === "LOCKED" ? (
                <Shield className="w-5 h-5 text-red-500" />
              ) : (
                <ShieldOff className="w-5 h-5 text-green-500" />
              )}
              {lockModalTarget?.newStatus === "LOCKED" ? "Lock" : "Unlock"} Module
            </DialogTitle>
          </DialogHeader>

          {lockModalTarget && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">{lockModalTarget.period.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Module:</span>
                  <span className="font-medium">{MODULE_LABELS[lockModalTarget.moduleCode] || lockModalTarget.moduleCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Action:</span>
                  <Badge variant={lockModalTarget.newStatus === "LOCKED" ? "destructive" : "default"} className="text-xs">
                    {lockModalTarget.newStatus === "LOCKED" ? "Lock" : "Open"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockReason">Reason (optional)</Label>
                <Textarea
                  id="lockReason"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={2}
                />
              </div>

              <p className="text-xs text-gray-500">
                This change will be added as a draft. Click &quot;Commit Locks&quot; to apply all draft changes.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLockModalOpen(false)}>Cancel</Button>
            <Button
              onClick={confirmLockChange}
              className={cn(
                lockModalTarget?.newStatus === "LOCKED"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              {lockModalTarget?.newStatus === "LOCKED" ? (
                <><Lock className="w-4 h-4 mr-1" /> Add Lock to Draft</>
              ) : (
                <><Unlock className="w-4 h-4 mr-1" /> Add Unlock to Draft</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Commit Modal ─── */}
      <Dialog open={commitModalOpen} onOpenChange={setCommitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              Commit Lock Changes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {hasDraftChanges && (
              <p className="text-sm text-gray-600">
                You have {draftChanges.size} draft change{draftChanges.size !== 1 ? "s" : ""} that will be saved and committed.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="commitReason">Commit Reason</Label>
              <Textarea
                id="commitReason"
                value={commitReason}
                onChange={(e) => setCommitReason(e.target.value)}
                placeholder="Enter reason for committing these lock changes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCommit}
              disabled={isCommitting}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              {isCommitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Commit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Period Status Drawer ─── */}
      <Dialog open={statusDrawerOpen} onOpenChange={setStatusDrawerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Period Lock Status: {statusDrawerPeriod}
            </DialogTitle>
          </DialogHeader>

          {periodStatusLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : periodStatus ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">{periodStatus.period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={periodStatus.isLocked ? "destructive" : "default"}>
                    {periodStatus.isLocked ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                    {periodStatus.isLocked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Effective Module Lock:</span>
                  <Badge variant={periodStatus.effectiveModuleLock ? "destructive" : "outline"} className="text-xs">
                    {periodStatus.effectiveModuleLock ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {periodStatus.reason && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reason:</span>
                    <span className="font-medium">{periodStatus.reason}</span>
                  </div>
                )}
              </div>

              {periodStatus.lockedBy && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <h4 className="font-medium text-gray-900">Locked By</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{periodStatus.lockedBy.firstName} {periodStatus.lockedBy.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-700">{periodStatus.lockedBy.email}</span>
                  </div>
                  {periodStatus.lockedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Locked At:</span>
                      <span className="font-medium">{format(new Date(periodStatus.lockedAt), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No status data available for this period.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDrawerOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Audit Entry View Drawer ─── */}
      <Sheet open={auditDrawerOpen} onOpenChange={setAuditDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Audit Entry Details
              {selectedAuditEntry && (
                <Badge
                  variant={selectedAuditEntry.actionType === "ATTEMPT_REJECTED" ? "destructive" : "outline"}
                  className="text-xs rounded-full ml-2"
                >
                  {selectedAuditEntry.actionType.replace(/_/g, " ")}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {selectedAuditEntry && (
            <div className="mt-6 space-y-6">
              {/* General Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Action Type</p>
                    <Badge
                      variant={selectedAuditEntry.actionType === "ATTEMPT_REJECTED" ? "destructive" : "outline"}
                      className="text-xs rounded-full mt-1"
                    >
                      {selectedAuditEntry.actionType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Module</p>
                    <p className="font-medium">{selectedAuditEntry.moduleCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <Badge variant="outline" className="text-xs rounded-full mt-1">{selectedAuditEntry.source}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p className="font-medium">{format(new Date(selectedAuditEntry.createdAt), "MMM d, yyyy HH:mm:ss")}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Scope & Period */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Scope & Period</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Scope</p>
                    <p className="font-medium">{selectedAuditEntry.display.scope.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-medium">{selectedAuditEntry.display.periodLabel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Module Label</p>
                    <p className="font-medium">{selectedAuditEntry.display.moduleLabel}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Performed By */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Performed By</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {selectedAuditEntry.performedBy.firstName} {selectedAuditEntry.performedBy.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedAuditEntry.performedBy.email}</p>
                  </div>
                </div>
              </div>

              {selectedAuditEntry.reason && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Reason</h3>
                    <p className="text-sm">{selectedAuditEntry.reason}</p>
                  </div>
                </>
              )}

              {/* Old Value */}
              {selectedAuditEntry.oldValue && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Previous Value</h3>
                    <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto border">
                      {JSON.stringify(selectedAuditEntry.oldValue, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {/* New Value */}
              {selectedAuditEntry.newValue && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">New Value</h3>
                    <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto border">
                      {JSON.stringify(selectedAuditEntry.newValue, null, 2)}
                    </pre>
                  </div>
                </>
              )}

              {/* Fiscal Period Info */}
              {selectedAuditEntry.fiscalPeriod && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Fiscal Period</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Period Name</p>
                        <p className="font-medium">{selectedAuditEntry.fiscalPeriod.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date Range</p>
                        <p className="font-medium">
                          {format(new Date(selectedAuditEntry.fiscalPeriod.startDate), "MMM d, yyyy")} - {format(new Date(selectedAuditEntry.fiscalPeriod.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Summary */}
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Summary</h3>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-700">{selectedAuditEntry.display.summary}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Skeleton Loaders ────────────────────────────────────────────────────────

function PeriodLockoutSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Sub-tab nav skeleton */}
      <div className="flex items-center border-b gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 w-32 bg-gray-200 rounded-t" />
        ))}
      </div>

      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-80 bg-gray-100 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-7 w-40 bg-gray-100 rounded-full" />
          <div className="h-7 w-44 bg-gray-100 rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-[200px] bg-gray-200 rounded-full" />
          <div className="flex items-center gap-2 ml-2">
            {MODULE_CODES.map(code => (
              <div key={code} className="flex items-center gap-1">
                <div className={cn("w-2.5 h-2.5 rounded-sm", MODULE_COLORS[code])} />
                <div className="h-3 w-6 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <div className="h-8 w-24 bg-gray-200 rounded-full" />
          <div className="h-8 w-28 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Period Grid skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[200px_repeat(5,1fr)_80px_60px] bg-gray-50 border-b">
          <div className="p-3"><div className="h-3 w-14 bg-gray-200 rounded" /></div>
          {MODULE_CODES.map(code => (
            <div key={code} className="p-3 flex justify-center">
              <div className="h-3 w-8 bg-gray-200 rounded" />
            </div>
          ))}
          <div className="p-3 flex justify-center"><div className="h-3 w-10 bg-gray-200 rounded" /></div>
          <div className="p-3 flex justify-center"><div className="h-3 w-8 bg-gray-200 rounded" /></div>
        </div>

        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[200px_repeat(5,1fr)_80px_60px] border-b last:border-b-0">
            <div className="p-3 flex items-center">
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
            {MODULE_CODES.map((code, j) => (
              <div key={code} className="p-3 flex items-center justify-center">
                <div className={cn(
                  "w-9 h-9 rounded-lg border-2",
                  (i + j) % 3 === 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                )} />
              </div>
            ))}
            <div className="p-3 flex items-center justify-center">
              <div className="h-5 w-14 bg-gray-200 rounded-full" />
            </div>
            <div className="p-3 flex items-center justify-center">
              <div className="h-8 w-8 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

