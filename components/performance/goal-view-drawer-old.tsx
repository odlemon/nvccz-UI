"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  Flag
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
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Target },
    { id: "progress" as TabType, label: "Progress", icon: Percent },
    { id: "activities" as TabType, label: "Activities", icon: Calendar },
  ]

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
                  size="sm"
                  onClick={() => onEdit(goal)}
                  className="rounded-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full w-9 h-9 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <SheetDescription className="text-left">
            {goal.description}
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="shadow-none border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CiTarget className="w-5 h-5 text-purple-600" />
                    Goal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-900">{goal.description}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Type</p>
                    <Badge variant="outline" className="capitalize">
                      {goal.type}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Category</p>
                    <Badge variant="outline" className="capitalize">
                      {goal.category}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Priority</p>
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Status</p>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Stage</p>
                    <div className="flex items-center gap-2">
                      {getStageIcon(goal.stage)}
                      <span className="capitalize">{goal.stage}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Department</p>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>{goal.department.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="shadow-none border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CiCalendar className="w-5 h-5 text-purple-600" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Start Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{formatDateOnly(goal.startDate)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">End Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{formatDateOnly(goal.endDate)}</span>
                    </div>
                  </div>
                  
                  {goal.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Completed At</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{formatDate(goal.completedAt)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card className="shadow-none border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CiCircleCheck className="w-5 h-5 text-purple-600" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Created By</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{goal.createdBy.firstName} {goal.createdBy.lastName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{goal.createdBy.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Assigned To</p>
                    {goal.assignedTo ? (
                      <>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{goal.assignedTo.firstName} {goal.assignedTo.lastName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{goal.assignedTo.email}</p>
                      </>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "progress" && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <Card className="shadow-none border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CiChart className="w-5 h-5 text-purple-600" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {goal.monetaryValue && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Monetary Target</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-semibold">
                          ${parseFloat(goal.monetaryValue).toLocaleString()}
                        </span>
                      </div>
                      {goal.monetaryValueAchieved && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Achieved</p>
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
                      <p className="text-sm text-gray-600 mb-2">Percentage Target</p>
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600" />
                        <span className="text-lg font-semibold">
                          {goal.percentValue}%
                        </span>
                      </div>
                      {goal.percentValueAchieved && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Achieved</p>
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
                </CardContent>
              </Card>

              {/* KPI Information */}
              {goal.kpi && (
                <Card className="shadow-none border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CiTarget className="w-5 h-5 text-purple-600" />
                      Associated KPI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">KPI Name</p>
                      <p className="font-medium">{goal.kpi.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Type</p>
                      <Badge variant="outline">{goal.kpi.type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Unit</p>
                      <span className="text-sm text-gray-600">
                        {goal.kpi.unitPosition === 'prefix' ? goal.kpi.unitSymbol : ''}
                        {goal.kpi.unitPosition === 'suffix' ? goal.kpi.unitSymbol : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sub Goals */}
              {goal.subGoals && goal.subGoals.length > 0 && (
                <Card className="shadow-none border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <CiList className="w-5 h-5 text-purple-600" />
                      Sub Goals ({goal._count.subGoals})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {goal.subGoals.map((subGoal) => (
                        <div key={subGoal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{subGoal.title}</p>
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
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "activities" && (
            <div className="space-y-6">
              <Card className="shadow-none border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <CiCalendar className="w-5 h-5 text-purple-600" />
                    Activities & Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No activities recorded yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Activities and tasks will appear here as they are added
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
