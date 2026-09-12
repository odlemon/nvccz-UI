"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { 
  CiCircleCheck,
  CiCalendar,
  CiSquareRemove,
  CiEdit,
  CiTrash,
  CiCircleCheck as CiTarget,
  CiCircleCheck as CiChart,
  CiViewList as CiList
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
  Activity
} from "lucide-react"
import { Goal } from "@/lib/api/goals-data"

interface GoalViewDrawerProps {
  goal: Goal | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
}

type TabType = "overview" | "progress" | "activities"

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
  }
]

export function GoalViewDrawer({ goal, isOpen, onClose, onEdit, onDelete }: GoalViewDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview")

  if (!goal) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString: string) => {
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[35vw] min-w-[800px] max-w-[1200px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden [&>button[class*='ring-offset-background']]:hidden [&>button[class*='absolute']]:hidden [&>button[class*='top-4']]:hidden">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <Target className="w-6 h-6" />
              {goal.title}
            </SheetTitle>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(goal)}
                  className="rounded-full h-10 w-10"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10"
              >
                <X className="w-4 h-4" />
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
                <span className="text-sm font-bold text-gray-900">{goal.percentValueAchieved || 0}%</span>
              </div>
              <div className="relative">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${getProgressColor(parseFloat(goal.percentValueAchieved || '0'))}`}
                    style={{ width: `${goal.percentValueAchieved || 0}%` }}
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
                {/* Progress Overview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-normal text-gray-900 flex items-center gap-2 mb-4">
                    <Percent className="w-5 h-5" />
                    Progress Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goal.monetaryValue && (
                      <div>
                        <label className="text-sm font-normal text-gray-500">Monetary Target</label>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-lg font-semibold">
                            ${parseFloat(goal.monetaryValue).toLocaleString()}
                          </span>
                        </div>
                        {goal.monetaryValueAchieved && (
                          <div className="mt-2">
                            <label className="text-sm font-normal text-gray-500">Achieved</label>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-blue-600" />
                              <span className="text-lg font-semibold">
                                ${parseFloat(goal.monetaryValueAchieved).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {goal.percentValue && (
                      <div>
                        <label className="text-sm font-normal text-gray-500">Percentage Target</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Percent className="w-4 h-4 text-blue-600" />
                          <span className="text-lg font-semibold">
                            {goal.percentValue}%
                          </span>
                        </div>
                        {goal.percentValueAchieved && (
                          <div className="mt-2">
                            <label className="text-sm font-normal text-gray-500">Achieved</label>
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-green-600" />
                              <span className="text-lg font-semibold">
                                {goal.percentValueAchieved}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                        <p className="text-sm font-medium text-gray-900 mt-1">{goal.kpi.unitPosition || 'N/A'}</p>
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
                    Activities & Tasks ({goal._count?.tasks || 0})
                  </h3>
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                    <p className="text-gray-600">This goal doesn't have any recorded activities yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Activities and tasks will appear here as they are added
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
