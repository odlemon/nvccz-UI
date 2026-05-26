"use client"

import { useState, useEffect } from "react"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CiViewList as List, CiCircleCheck as Activity, CiFileOn } from "react-icons/ci"
import { DollarSign, X, Eye, User, Mail, Phone, Building2, FileText } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchTaskActivities } from "@/lib/store/slices/taskSlice"
import { TaskCard } from "./task-card"
import { ActivityCard } from "./activity-card"
import { CreateActivityModal } from "./create-activity-modal"
import { TaskActivityModal } from "@/components/applications/task-activity-modal"
import { DocumentPreviewModal } from "@/components/applications/document-preview-modal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "../ui/card"

interface TaskDrawerViewProps {
  task: any
  onClose: () => void
}

type DrawerTab = "details" | "activity"

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in_progress":
      return "bg-blue-100 text-blue-800"
    case "todo":
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "blocked":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "critical":
      return "bg-red-100 text-red-800"
    case "high":
      return "bg-orange-100 text-orange-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "low":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const ActivityListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="p-4 border rounded-lg animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

function formatTaskValue(task: any): string {
  const unitSymbol = task?.valueDisplay?.unitSymbol ?? task?.kpi?.unitSymbol ?? ''
  const unitPosition = task?.kpi?.unitPosition ?? 'prefix'
  const unitCategory = task?.kpi?.unitCategory ?? ''
  const raw = unitCategory === 'Currency' || (!task?.percentValueAchieved && task?.monetaryValueAchieved)
    ? parseFloat(task?.monetaryValueAchieved ?? 0)
    : parseFloat(task?.percentValueAchieved ?? 0)
  const formatted = raw.toLocaleString()
  return unitPosition === 'prefix' ? `${unitSymbol}${formatted}` : `${formatted}${unitSymbol}`
}

export function TaskDrawerView({ task, onClose }: TaskDrawerViewProps) {
  const dispatch = useAppDispatch()
  const { activities, activitiesLoading, activitiesError } = useAppSelector((state) => state.tasks)
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>("details")
  const [isCreateActivityModalOpen, setCreateActivityModalOpen] = useState(false)
  const [isTaskActivityModalOpen, setTaskActivityModalOpen] = useState(false)
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (activeDrawerTab === "activity" && task?.id) {
      dispatch(fetchTaskActivities(task.id))
    }
  }, [activeDrawerTab, task?.id, dispatch])

  useEffect(() => {
    if (activitiesError) {
      toast.error("Failed to load task activities.", {
        description: activitiesError,
      })
    }
  }, [activitiesError])

  if (!task) return null

  const drawerTabs = [
    { id: "details", label: "Task Details", icon: List },
    { id: "activity", label: "Activity Log", icon: Activity },
  ]

  const isInvestmentTask = task?.department === "Investments"

  const handlePreviewDocument = (index: number) => {
    setSelectedDocumentIndex(index)
    setPreviewOpen(true)
  }

  return (
    <>
      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-3 truncate">
            <span className="truncate">Task View</span>
          </SheetTitle>
          <div className="flex items-center gap-2 mr-8">
            <Button
              onClick={() => setTaskActivityModalOpen(true)}
              className="rounded-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Log Activity
            </Button>
            {/* <Button 
              onClick={() => setCreateActivityModalOpen(true)}
              className="rounded-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Log Activity
            </Button> */}

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
      {/* Tab Navigation */}
      <div className="mt-4 border-b">
        <nav className="flex -mb-px space-x-6">
          {drawerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDrawerTab(tab.id as DrawerTab)}
              className={cn(
                "flex items-center gap-2 py-3 px-1 text-sm font-medium transition-colors",
                activeDrawerTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="mt-6 space-y-6">
        {activeDrawerTab === "details" && (
          <>
            <TaskCard task={task} isDrawerVersion />
            
            {/* Application Information Section */}
            {task?.application && (
              <div className="space-y-4 mt-6">
                {/* Applicant Information */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-500" />
                      <h3 className="text-base font-semibold">Applicant Information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Full Name</p>
                          <p className="text-sm font-medium">{task.application.applicantName || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Email</p>
                          <p className="text-sm font-medium">{task.application.applicantEmail || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Phone</p>
                          <p className="text-sm font-medium">{task.application.applicantPhone || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Business Name</p>
                          <p className="text-sm font-medium">{task.application.businessName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {task.application.description && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-500 mt-1" />
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Description</p>
                            <p className="text-sm text-gray-700">{task.application.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents Section */}
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CiFileOn className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-semibold">
                        Submitted Documents ({task.application.documents?.length || 0})
                      </h3>
                    </div>
                    
                    {!task.application.documents || task.application.documents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CiFileOn className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No documents submitted yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {task.application.documents.map((doc: any, index: number) => (
                          <div 
                            key={doc.id} 
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer group"
                            onClick={() => handlePreviewDocument(index)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-medium truncate">
                                  {doc.documentType?.replaceAll('_', ' ') || 'Document'}
                                </p>
                                <p className="text-xs text-gray-600 truncate">{doc.fileName}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 group-hover:bg-amber-200 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreviewDocument(index)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={doc.isRequired ? 'destructive' : 'secondary'} className="text-xs">
                                {doc.isRequired ? 'Required' : 'Optional'}
                              </Badge>
                              {doc.isSubmitted && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                                  Submitted
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
        {activeDrawerTab === "activity" && (
          <div>
            {activitiesLoading ? (
              <ActivityListSkeleton />
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Activities</p>
                          <p className="text-xl font-semibold text-gray-900">{activities.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {task?.valueDisplay?.showValue && (
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Value Achieved</p>
                            <p className="text-xl font-semibold text-blue-600">
                              {formatTaskValue(task)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Activity List */}
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Activity Found</h3>
                <p className="text-gray-600">There are no activity logs for this task yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateActivityModal
        isOpen={isCreateActivityModalOpen}
        onClose={() => setCreateActivityModalOpen(false)}
        task={task}
        onSuccess={() => {
          setCreateActivityModalOpen(false)
          if (task?.id) {
            dispatch(fetchTaskActivities(task.id))
          }
        }}
      />

      <TaskActivityModal
        isOpen={isTaskActivityModalOpen}
        onClose={() => setTaskActivityModalOpen(false)}
        taskId={task?.id || ''}
        taskTitle={task?.title}
        onSuccess={() => {
          setTaskActivityModalOpen(false)
          if (task?.id) {
            dispatch(fetchTaskActivities(task.id))
          }
          toast.success('Activity logged successfully')
        }}
      />

      {/* Document Preview Modal */}
      {task?.application?.documents && (
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          documents={task.application.documents || []}
          initialDocumentIndex={selectedDocumentIndex || 0}
        />
      )}
    </>
  )
}
