"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Target,
  List,
  X,
  Building2,
  Calendar,
  BarChart3,
  Loader2,
  Percent,
  DollarSign,
  Flag,
} from "lucide-react"
import { KPI } from "@/lib/store/slices/performanceSlice"
import { goalApiService } from "@/lib/api/goal-api"

interface KPIViewDrawerProps {
  isOpen: boolean
  onClose: () => void
  kpi: KPI | null
  onEdit: (kpi: KPI) => void
  onDelete: (kpi: KPI) => void
}

type TabType = "kpi" | "goals"

const tabs = [
  {
    id: "kpi" as TabType,
    label: "KPI Details",
    icon: Target
  },
  {
    id: "goals" as TabType,
    label: "Goals",
    icon: List
  }
]

export function KPIViewDrawer({ isOpen, onClose, kpi, onEdit, onDelete }: KPIViewDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("kpi")
  const [goals, setGoals] = useState<any[]>([])
  const [goalsLoading, setGoalsLoading] = useState(false)
  const [goalsError, setGoalsError] = useState<string | null>(null)

  // Reset + fetch goals whenever the drawer opens for a different KPI
  useEffect(() => {
    if (!isOpen || !kpi?.id) {
      setGoals([])
      return
    }
    let cancelled = false
    setGoalsLoading(true)
    setGoalsError(null)
    goalApiService
      .getGoalsByKpi(kpi.id)
      .then((res) => {
        if (cancelled) return
        setGoals(Array.isArray(res?.goals) ? res.goals : [])
      })
      .catch((err: any) => {
        if (cancelled) return
        setGoalsError(err?.message || 'Failed to load goals')
        setGoals([])
      })
      .finally(() => {
        if (!cancelled) setGoalsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, kpi?.id])

  if (!kpi) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

   const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Asset': 'bg-green-100 text-green-800',
      'Liability': 'bg-red-100 text-red-800',
      'Equity': 'bg-purple-100 text-purple-800',
      'Revenue': 'bg-blue-100 text-blue-800',
      'Expense': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Percentage': return 'bg-cyan-100 text-cyan-800'
      case 'Metric': return 'bg-indigo-100 text-indigo-800'
      case 'Count': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800'
      case 'weekly': return 'bg-orange-100 text-orange-800'
      case 'monthly': return 'bg-teal-100 text-teal-800'
      case 'quarterly': return 'bg-indigo-100 text-indigo-800'
      case 'yearly': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span>KPI View</span>
            </SheetTitle>
            {/* Custom Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 mr-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getTypeColor(kpi.type)}>{kpi.type}</Badge>
            {kpi.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
            )}
            {kpi.hardcodedDetails?.isFinancial && (
              <Badge className="bg-indigo-100 text-indigo-800">Financial</Badge>
            )}
          </div>

          {/* KPI Header */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
                  <Target className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {kpi.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(kpi.type)}>
                      {kpi.type}
                    </Badge>
                    <Badge className={kpi.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {kpi.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 py-3 px-1 text-sm font-normal transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  
                  {/* Active tab underline */}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                      layoutId="activeTab"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* KPI Details Tab */}
            {activeTab === "kpi" && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-normal text-gray-500">Name</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{kpi.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Type</label>
                      <div className="mt-1">
                        <Badge className={getTypeColor(kpi.type)}>
                          {kpi.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Unit</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{kpi.unit || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Status</label>
                      <div className="mt-1">
                        <Badge className={kpi.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {kpi.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unit Information */}
                {kpi.hasUnit && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <User className="w-5 h-5" />
                      Unit Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Has Unit</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{kpi.hasUnit ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Unit Category</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{kpi.unitCategory || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Unit Symbol</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{kpi.unitSymbol || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Unit Position</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{kpi.unitPosition || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hardcoded Details */}
                {kpi.hardcodedDetails && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5" />
                      Financial Details
                    </h3>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Description</span>
                        <p className="text-sm text-gray-900 mt-1">{kpi.hardcodedDetails.description}</p>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Account Type</span>
                        <Badge className={getAccountTypeColor(kpi.hardcodedDetails.accountType)}>
                          {kpi.hardcodedDetails.accountType}
                        </Badge>
                      </div>
                      
                      {kpi.hardcodedDetails.accountNumber && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Account Number</span>
                          <span className="text-sm font-medium font-mono">{kpi.hardcodedDetails.accountNumber}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Journal Entry Type</span>
                        <Badge variant="outline" className="text-xs">
                          {kpi.hardcodedDetails.journalEntryType}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Code</span>
                        <span className="text-xs font-mono text-gray-700 bg-gray-200 px-2 py-1 rounded">
                          {kpi.hardcodedDetails.code}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5" />
                    Timestamps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-normal text-gray-500">Created</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(kpi.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-normal text-gray-500">Updated</label>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(kpi.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === "goals" && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <List className="w-5 h-5" />
                    Performance Goals ({goals.length})
                  </h3>

                  {goalsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  ) : goalsError ? (
                    <div className="text-center py-8 text-sm text-red-600">{goalsError}</div>
                  ) : goals.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Found</h3>
                      <p className="text-gray-600">This KPI doesn't have any associated performance goals yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {goals.map((goal: any) => {
                        const progress = parseFloat(goal.progressPercentage ?? goal.percentValueAchieved ?? '0') || 0
                        const isMonetary = goal.monetaryValue !== null && goal.monetaryValue !== undefined && goal.monetaryValue !== ''
                        const isPercent = !isMonetary && goal.percentValue !== null && goal.percentValue !== undefined && goal.percentValue !== ''
                        const unitSymbol = goal.kpi?.unitSymbol || goal.targetUnit || '$'
                        const fmtCurrency = (v: any) => {
                          const n = parseFloat(v ?? '0') || 0
                          return `${unitSymbol}${n.toLocaleString()}`
                        }
                        const fmtPercent = (v: any) => `${(parseFloat(v ?? '0') || 0).toFixed(2)}%`
                        const startDate = goal.startDate ? new Date(goal.startDate).toLocaleDateString() : null
                        const endDate = goal.endDate ? new Date(goal.endDate).toLocaleDateString() : null

                        return (
                          <Card key={goal.id} className="border border-gray-200">
                            <CardContent className="p-4 space-y-3">
                              {/* Title row */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">{goal.title}</h4>
                                  {goal.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>
                                  )}
                                </div>
                                <Badge className={getStatusColor(goal.status)}>
                                  {String(goal.status).replace('_', ' ')}
                                </Badge>
                              </div>

                              {/* Meta badges */}
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <Badge variant="outline" className="capitalize">{goal.type}</Badge>
                                <Badge variant="outline" className="capitalize">{String(goal.stage).replace('_', ' ')}</Badge>
                                <Badge variant="outline" className={`capitalize ${getPriorityColor(goal.priority)}`}>
                                  {goal.priority}
                                </Badge>
                                {goal.scorecardPillar && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Flag className="w-3 h-3 mr-1" />
                                    {goal.scorecardPillar}
                                  </Badge>
                                )}
                                {goal.departmentName && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {goal.departmentName}
                                  </Badge>
                                )}
                              </div>

                              {/* Values */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                {isMonetary && (
                                  <>
                                    <div className="bg-gray-50 rounded p-2">
                                      <div className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> Monetary Target
                                      </div>
                                      <p className="font-semibold text-gray-900 mt-0.5">{fmtCurrency(goal.monetaryValue)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2">
                                      <div className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> Achieved
                                      </div>
                                      <p className="font-semibold text-green-700 mt-0.5">{fmtCurrency(goal.monetaryValueAchieved)}</p>
                                    </div>
                                  </>
                                )}
                                {isPercent && (
                                  <>
                                    <div className="bg-gray-50 rounded p-2">
                                      <div className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> Percent Target
                                      </div>
                                      <p className="font-semibold text-gray-900 mt-0.5">{fmtPercent(goal.percentValue)}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded p-2">
                                      <div className="text-[10px] uppercase tracking-wide text-gray-500 flex items-center gap-1">
                                        <Percent className="w-3 h-3" /> Achieved
                                      </div>
                                      <p className="font-semibold text-green-700 mt-0.5">{fmtPercent(goal.percentValueAchieved)}</p>
                                    </div>
                                  </>
                                )}
                                {goal.targetValue && (
                                  <div className="bg-gray-50 rounded p-2">
                                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Target Value</div>
                                    <p className="font-semibold text-gray-900 mt-0.5">{fmtCurrency(goal.targetValue)}</p>
                                  </div>
                                )}
                                <div className="bg-gray-50 rounded p-2">
                                  <div className="text-[10px] uppercase tracking-wide text-gray-500">Current Value</div>
                                  <p className="font-semibold text-blue-700 mt-0.5">{fmtCurrency(goal.currentValue)}</p>
                                </div>
                              </div>

                              {/* Progress */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs text-gray-500">Progress</span>
                                  <span className="text-xs font-bold text-gray-900">{progress.toFixed(2)}%</span>
                                </div>
                                <Progress value={Math.min(progress, 100)} className="h-2" />
                              </div>

                              {/* Footer meta */}
                              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {startDate || '—'} → {endDate || '—'}
                                </span>
                                {goal.assignedTo && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {goal.assignedTo.firstName} {goal.assignedTo.lastName}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}