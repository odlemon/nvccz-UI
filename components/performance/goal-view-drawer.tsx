"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { 
  CiGrid2H,
} from "react-icons/ci"
import { 
  User, 
  Target, 
  List,
  Edit,
  X,
  Percent,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Flag,
  Activity,
  BarChart,
  Calculator
} from "lucide-react"
import { Goal } from "@/lib/api/goals-data"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchGoalDetails, recalculateGoalRollup, fetchGoalActivities, fetchGoalRollup } from "@/lib/store/slices/performanceSlice"
import { ProcurementDataTable, Column } from "@/components/procurement/procurement-data-table"
import { Progress } from "../ui/progress"
import { toast } from "sonner"
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
import { Card, CardContent } from "../ui/card"
import { RollupSummaryCards } from "./goal-view-drawer/goal-rollup-summary-cards"
import { GoalProgressOverview } from "./goal-view-drawer/goal-progress-overview"
import { GoalDepartmentBreakdown } from "./goal-view-drawer/goal-department-breakdown"

interface GoalViewDrawerProps {
  goal: Goal | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
  onBreakdown?: (goal: Goal) => void
}

type TabType = "overview" | "progress" | "activities" | "rollup"

const tabs = [
  {
    id: "overview" as TabType,
    label: "Overview",
    icon: Target
  },
  {
    id: "progress" as TabType,
    label: "Progress",
    icon: Percent
  },
  {
    id: "activities" as TabType,
    label: "Activities",
    icon: Activity
  },
  {
    id: "rollup" as TabType,
    label: "Roll-up",
    icon: BarChart
  }
]

export function GoalViewDrawer({ goal, isOpen, onClose, onEdit, onDelete, onBreakdown }: GoalViewDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [isRecalculateDialogOpen, setIsRecalculateDialogOpen] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const dispatch = useAppDispatch()
  const { 
    selectedGoalDetails, 
    selectedGoalDetailsLoading, 
    goalActivities, 
    goalActivitiesLoading,
    goalRollupData,
    goalRollupDataLoading
  } = useAppSelector(state => state.performance)

  // Track fetched goal IDs and prevent duplicate requests
  const lastFetchedGoalId = useRef<string | null>(null)
  const isCurrentlyFetching = useRef(false)

  // Memoize fetch function
  const fetchGoalData = useCallback(async (goalId: string) => {
    if (isCurrentlyFetching.current || lastFetchedGoalId.current === goalId) {
      return
    }

    isCurrentlyFetching.current = true
    lastFetchedGoalId.current = goalId

    try {
      await Promise.all([
        dispatch(fetchGoalDetails(goalId)),
        dispatch(fetchGoalActivities(goalId)),
        dispatch(fetchGoalRollup(goalId))
      ])
    } catch (error) {
      console.error('Failed to fetch goal data:', error)
      // Reset on error to allow retry
      lastFetchedGoalId.current = null
    } finally {
      isCurrentlyFetching.current = false
    }
  }, [dispatch])

  useEffect(() => {
    if (isOpen && goal?.id) {
      fetchGoalData(goal.id)
    }

    // Cleanup on close
    return () => {
      if (!isOpen) {
        lastFetchedGoalId.current = null
        isCurrentlyFetching.current = false
      }
    }
  }, [isOpen, goal?.id, fetchGoalData])

  if (!goal) return null

  // Helper function to safely parse numeric values
  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    const parsed = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(parsed) ? 0 : parsed
  }

  // Helper function to format currency
  const formatCurrency = (value: any, prefix: string = '$'): string => {
    const numValue = parseNumericValue(value)
    return `${prefix}${numValue.toLocaleString()}`
  }

  // Helper function to format percentage
  const formatPercentage = (value: any): string => {
    const numValue = parseNumericValue(value)
    return `${numValue.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4" />
      case 'planning': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Goal value-mode: a goal is either monetary OR percent. Prefer the field that's set.
  const isMonetaryGoal =
    goal.monetaryValue !== null && goal.monetaryValue !== undefined && goal.monetaryValue !== ''
  const isPercentGoal =
    !isMonetaryGoal &&
    goal.percentValue !== null && goal.percentValue !== undefined && goal.percentValue !== ''

  // Use the API-provided progressPercentage as the source of truth for the goal's progress.
  // Fall back to percentValueAchieved if the API didn't include it.
  const progressPercentage = parseNumericValue(
    (goal as any).progressPercentage ?? goal.percentValueAchieved,
  )

  const taskColumns: Column<any>[] = [
    { key: 'title', label: 'Task Title', sortable: true },
    { key: 'stage', label: 'Stage', sortable: true, render: (value) => <Badge variant="outline">{value}</Badge> },
    { key: 'priority', label: 'Priority', sortable: true, render: (value) => <Badge>{value}</Badge> },
    { key: 'monetaryValueAchieved', label: 'Value Achieved', sortable: true, render: (value) => `$${parseFloat(value || '0').toLocaleString()}` },
    { key: 'creator', label: 'Creator', render: (value) => value ? `${value.firstName} ${value.lastName}` : 'N/A' },
    { key: 'createdAt', label: 'Created At', sortable: true, render: (value) => formatDate(value) },
  ]

  const handleRecalculateRollup = async () => {
    if (!goal?.id) return

    setIsRecalculating(true)
    try {
      await dispatch(recalculateGoalRollup(goal.id)).unwrap()
      toast.success("Roll-up recalculated successfully", {
        description: "Goal data has been updated with the latest roll-up calculations."
      })
      
      // Force refetch by resetting the cache
      lastFetchedGoalId.current = null
      await fetchGoalData(goal.id)
      
      // Close dialog after successful recalculation
      setIsRecalculateDialogOpen(false)
    } catch (error: any) {
      toast.error("Failed to recalculate roll-up", {
        description: error.message || "An error occurred while recalculating."
      })
      // Keep dialog open on error so user can retry
    } finally {
      setIsRecalculating(false)
    }
  }

  const formatCurrencyValue = (value: string | null): string => {
    if (!value) return '$0'
    const numValue = parseFloat(value)
    return `$${numValue.toLocaleString()}`
  }

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'task_completion':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'goal_update':
        return <Target className="w-4 h-4 text-blue-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'task_completion':
        return 'bg-green-100 text-green-800'
      case 'goal_update':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[35vw] min-w-[800px] max-w-[1200px] overflow-y-auto p-5">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-normal flex items-center gap-2">
                <Target className="w-6 h-6" />
                Goal View
              </SheetTitle>
              <div className="flex items-center gap-2 mr-8">
               
                  <Button
                    onClick={() => setIsRecalculateDialogOpen(true)}
                    className="rounded-full h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Recalculate
                  </Button>
              
                {(goal.type === 'company' || goal.type === 'department') && onBreakdown && (
                  <Button
                    variant="outline"
                    onClick={() => onBreakdown(goal)}
                    className="rounded-full h-10 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
                  >
                    <CiGrid2H className="w-4 h-4 mr-2" />
                    Breakdown
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(goal)}
                    className="rounded-full h-10 w-10 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {/* Custom Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full h-10 w-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Goal Header */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
                    <Target className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {goal.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority}
                      </Badge>
                      <Badge className={getStatusColor(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {goal.type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {goal.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-gray-900">{progressPercentage.toFixed(2)}%</span>
                </div>
                <div className="relative">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
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
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Description</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{goal.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Type</label>
                        <div className="mt-1">
                          <Badge variant="outline" className="capitalize">
                            {goal.type}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Category</label>
                        <div className="mt-1">
                          <Badge variant="outline" className="capitalize">
                            {goal.category}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Priority</label>
                        <div className="mt-1">
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Status</label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Stage</label>
                        <div className="mt-1 flex items-center gap-2">
                          {getStageIcon(goal.stage)}
                          <span className="capitalize">{goal.stage}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Values Section — monetary OR percent, never both */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Target className="w-5 h-5" />
                      Target & Current Values
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Target Value</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {goal.targetValue
                            ? formatCurrency(goal.targetValue, goal.kpi?.unitSymbol || goal.targetUnit || '$')
                            : 'Not Set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Current Value</label>
                        <p className="text-lg font-semibold text-blue-600 mt-1">
                          {formatCurrency(goal.currentValue, goal.kpi?.unitSymbol || goal.targetUnit || '$')}
                        </p>
                      </div>

                      {isMonetaryGoal && (
                        <>
                          <div>
                            <label className="text-sm font-normal text-gray-500">Monetary Target</label>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatCurrency(goal.monetaryValue)}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-normal text-gray-500">Monetary Achieved</label>
                            <p className="text-lg font-semibold text-green-600 mt-1">
                              {formatCurrency(goal.monetaryValueAchieved)}
                            </p>
                          </div>
                        </>
                      )}

                      {isPercentGoal && (
                        <>
                          <div>
                            <label className="text-sm font-normal text-gray-500">Percentage Target</label>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatPercentage(goal.percentValue)}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-normal text-gray-500">Percentage Achieved</label>
                            <p className="text-lg font-semibold text-green-600 mt-1">
                              {formatPercentage(goal.percentValueAchieved)}
                            </p>
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2 pt-2">
                        <label className="text-sm font-normal text-gray-500">Progress</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          {progressPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parent Goal Information */}
                  {goal.parentGoal && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                        <Flag className="w-5 h-5" />
                        Parent Goal
                      </h3>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{goal.parentGoal.title}</p>
                            <Badge variant="outline" className="mt-1 capitalize">
                              {goal.parentGoal.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Department Information */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Building className="w-5 h-5" />
                      Department Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Department</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {goal.department?.name || 'Unknown Department'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Department ID</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">{goal.departmentId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Information */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <User className="w-5 h-5" />
                      Assignment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Created By</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {goal.createdBy ? `${goal.createdBy.firstName} ${goal.createdBy.lastName}` : 'Unknown'}
                        </p>
                        {goal.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">{goal.createdBy.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">Assigned To</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {goal.assignedTo ? `${goal.assignedTo.firstName} ${goal.assignedTo.lastName}` : 'Unassigned'}
                        </p>
                        {goal.assignedTo && (
                          <p className="text-xs text-gray-500 mt-1">{goal.assignedTo.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5" />
                      Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal text-gray-500">Start Date</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatDateOnly(goal.startDate)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-normal text-gray-500">End Date</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatDateOnly(goal.endDate)}
                        </p>
                      </div>
                      {goal.completedAt && (
                        <div>
                          <label className="text-sm font-normal text-gray-500">Completed At</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {formatDate(goal.completedAt)}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-normal text-gray-500">Created</label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatDate(goal.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === "progress" && (
                <div className="space-y-4">
                  {/* Progress Overview — show monetary OR percent block, never both */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Percent className="w-5 h-5" />
                      Progress Overview
                    </h3>
                    <div className="space-y-6">
                      {isMonetaryGoal && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-normal text-gray-500">Monetary Target</label>
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="w-5 h-5 text-green-600" />
                              <span className="text-2xl font-bold">
                                {formatCurrency(goal.monetaryValue)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-normal text-gray-500">Monetary Achieved</label>
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="w-5 h-5 text-blue-600" />
                              <span className="text-2xl font-bold">
                                {formatCurrency(goal.monetaryValueAchieved)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {isPercentGoal && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm font-normal text-gray-500">Percentage Target</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Percent className="w-5 h-5 text-blue-600" />
                              <span className="text-2xl font-bold">
                                {formatPercentage(goal.percentValue)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-normal text-gray-500">Percentage Achieved</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Percent className="w-5 h-5 text-green-600" />
                              <span className="text-2xl font-bold">
                                {formatPercentage(goal.percentValueAchieved)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Goal Progress — driven by API progressPercentage */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-normal text-gray-500">Goal Progress</label>
                          <span className="text-sm font-bold text-gray-900">
                            {progressPercentage.toFixed(2)}%
                          </span>
                        </div>
                        <Progress value={Math.min(progressPercentage, 100)} className="h-2" />
                      </div>

                      {/* Target and Current Values */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <label className="text-sm font-normal text-gray-500">Target Value</label>
                          <p className="text-2xl font-bold mt-1">
                            {goal.targetValue
                              ? formatCurrency(goal.targetValue, goal.kpi?.unitSymbol || goal.targetUnit || '$')
                              : formatCurrency(0, goal.kpi?.unitSymbol || goal.targetUnit || '$')}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-normal text-gray-500">Current Value</label>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {formatCurrency(goal.currentValue, goal.kpi?.unitSymbol || goal.targetUnit || '$')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Information */}
                  {goal.kpi && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5" />
                        Associated KPI
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-normal text-gray-500">KPI Name</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{goal.kpi.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-normal text-gray-500">Type</label>
                          <div className="mt-1">
                            <Badge variant="outline">{goal.kpi.type}</Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-normal text-gray-500">Unit Symbol</label>
                          <p className="text-sm font-medium text-gray-900 mt-1">{goal.kpi.unitSymbol || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-normal text-gray-500">Unit Position</label>
                          <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{goal.kpi.unitPosition || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub Goals */}
                  {goal.subGoals && goal.subGoals.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                        <List className="w-5 h-5" />
                        Sub Goals ({goal._count?.subGoals || 0})
                      </h3>
                      <div className="space-y-3">
                        {goal.subGoals.map((subGoal) => (
                          <div key={subGoal.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">{subGoal.title}</span>
                                <p className="text-sm text-gray-600 capitalize">{subGoal.type}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(subGoal.status)}>
                                  {subGoal.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {subGoal.stage}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === "activities" && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5" />
                      Activities & Tasks ({goalActivities.length})
                    </h3>
                    {goalActivitiesLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 rounded-lg border border-gray-200 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : goalActivities.length > 0 ? (
                      <div className="space-y-3">
                        {goalActivities.map((activity) => (
                          <div key={activity.id} className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {getActivityTypeIcon(activity.activityType)}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                  </div>
                                  <Badge className={`${getActivityTypeBadge(activity.activityType)} text-xs shrink-0`}>
                                    {activity.activityType.replace('_', ' ')}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span>{activity.user.firstName} {activity.user.lastName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{formatDate(activity.createdAt)}</span>
                                    </div>
                                  </div>
                                  
                                  {activity.monetaryValueAchieved && (
                                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                      <DollarSign className="w-4 h-4" />
                                      <span>{formatCurrencyValue(activity.monetaryValueAchieved)}</span>
                                    </div>
                                  )}
                                </div>

                                {activity.task && (
                                  <div className="pt-2 mt-2 border-t bg-gray-50 rounded p-2">
                                    <p className="text-xs text-gray-500 mb-1">Related Task:</p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-medium text-gray-900">{activity.task.title}</p>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {activity.task.stage.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                        <p className="text-gray-600">This goal doesn't have any recorded activities yet.</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Activities and tasks will appear here as they are added
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Roll-up Tab */}
              {activeTab === "rollup" && (
                <div className="space-y-4">
                  {/* Rollup Summary */}
                  {goalRollupDataLoading ? (
                    <div className="space-y-4">
                      <div className="h-32 bg-muted rounded-lg animate-pulse"></div>
                      <div className="h-32 bg-muted rounded-lg animate-pulse"></div>
                    </div>
                  ) : goalRollupData ? (
                    <>
                      {/* Summary Cards */}
                      <RollupSummaryCards
                        completedSubGoals={goalRollupData.rollup.completedSubGoals}
                        inProgressSubGoals={goalRollupData.rollup.inProgressSubGoals}
                        notStartedSubGoals={goalRollupData.rollup.notStartedSubGoals}
                        totalSubGoals={goalRollupData.rollup.totalSubGoals}
                      />

                      {/* Progress Overview */}
                      <GoalProgressOverview
                        totalTargetValue={goalRollupData.rollup.totalTargetValue}
                        totalCurrentValue={goalRollupData.rollup.totalCurrentValue}
                        overallProgressPercentage={goalRollupData.rollup.overallProgressPercentage}
                        unitSymbol={goal.kpi?.unitSymbol || '$'}
                        formatCurrency={formatCurrency}
                      />

                      {/* Department Breakdown */}
                      {goalRollupData.rollup.departmentBreakdown.length > 0 && (
                        <GoalDepartmentBreakdown
                          departments={goalRollupData.rollup.departmentBreakdown}
                          unitSymbol={goal.kpi?.unitSymbol}
                          formatCurrency={formatCurrency}
                          getStatusColor={getStatusColor}
                        />
                      )}

                      {/* Individual Breakdown */}
                      {goalRollupData.rollup.individualBreakdown.length > 0 && (
                        <Card className="border border-gray-200 rounded-lg">
                          <CardContent className="pt-6">
                            <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                              <User className="w-5 h-5" />
                              Individual Breakdown ({goalRollupData.rollup.individualBreakdown.length})
                            </h3>
                            <div className="space-y-2">
                              {goalRollupData.rollup.individualBreakdown.map((indGoal) => {
                                const progress = parseNumericValue(indGoal.progressPercentage)
                                return (
                                  <div key={indGoal.id} className="p-3 rounded-lg bg-gray-50 border flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm text-gray-900">{indGoal.title}</h4>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                        <span>Current: {formatCurrency(indGoal.currentValue, goal.kpi?.unitSymbol)}</span>
                                        <span>•</span>
                                        <span>Progress: {progress.toFixed(1)}%</span>
                                      </div>
                                    </div>
                                    <Badge className={getStatusColor(indGoal.stage)}>{indGoal.stage.replace('_', ' ')}</Badge>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Roll-up Data Available</h3>
                      <p className="text-gray-600">Roll-up data will appear here once sub-goals are added.</p>
                    </div>
                  )}

                  {/* Task Rollup Table */}
                  <ProcurementDataTable
                    data={selectedGoalDetails?.tasks || []}
                    columns={taskColumns}
                    title="Roll-up Task Calculations"
                    loading={selectedGoalDetailsLoading}
                    emptyMessage="No tasks found for roll-up calculation."
                    showSearch={true}
                    showFilters={false}
                    showActions={false}
                  />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Recalculate Confirmation Dialog */}
      <AlertDialog open={isRecalculateDialogOpen} onOpenChange={setIsRecalculateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Recalculate Roll-Up Data
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                This will recalculate all roll-up data for this goal including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Total target and current values from sub-goals</li>
                <li>Overall progress percentage</li>
                <li>Department and individual breakdowns</li>
                <li>Completion statistics</li>
              </ul>
              <p className="font-medium text-gray-900 pt-2">
                Are you sure you want to proceed with the recalculation?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRecalculating} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleRecalculateRollup}
              disabled={isRecalculating}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-full"
            >
              {isRecalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Recalculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Confirm Recalculate
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
