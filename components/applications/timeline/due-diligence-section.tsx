"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/procurement/user-avatar"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Calendar, User, DollarSign, FileText, CheckSquare, Eye, Clock, Play, UserPlus, ChevronDown, ChevronRight, ChevronUp, File, Download, ThumbsUp } from "lucide-react"
import { format } from "date-fns"
import { DueDiligenceSkeleton } from "@/components/ui/skeleton-loader"
import type { DueDiligenceData, DueDiligenceTask } from "@/lib/api/due-diligence-api"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { APPLICATION_PORTAL_ACTIONS } from "@/lib/config/role-permissions"

interface DueDiligenceSectionProps {
  data: DueDiligenceData | null
  loading: boolean
  error: string | null
  currentStage: string
  activityApprovalData?: any
  onApproveActivity?: (activityId: string) => void
  onRefresh: () => void
  onInitiate?: () => void
  onCreateTask?: (category: string) => void
}

export function DueDiligenceSection({
  data,
  loading,
  error,
  currentStage,
  activityApprovalData,
  onRefresh,
  onInitiate,
  onCreateTask,
  onApproveActivity
}: DueDiligenceSectionProps) {
  const { hasSpecificAction } = useRolePermissions();
  const canInitiate = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.INITIATE_DUE_DILIGENCE);
  const canCreateTask = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.CREATE_DD_TASK);
  const canApproveActivity = hasSpecificAction('application-portal', APPLICATION_PORTAL_ACTIONS.APPROVE_DD_ACTIVITY);

  if (loading) {
    return <DueDiligenceSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-2">Failed to load due diligence data</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button onClick={onRefresh} variant="outline" size="sm" className="rounded-full">
          <Clock className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">No due diligence data available</p>
        <p className="text-sm text-gray-400 mb-4">
          Due diligence has not been initiated for this application yet.
        </p>
        <div className="flex gap-2 justify-center">
          {canInitiate && currentStage === "SHORTLISTED" && onInitiate && (
            <Button
              onClick={onInitiate}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Initiate Due Diligence
            </Button>
          )}
          <Button onClick={onRefresh} variant="outline" size="sm" className="rounded-full">
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  const [showFullReport, setShowFullReport] = useState(false);

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Due diligence areas for tabs
  const areas = [
    { key: 'market', label: 'Market Research', category: 'Market Research' },
    { key: 'financial', label: 'Financial Assessment', category: 'Financial Assessment' },
    { key: 'competitive', label: 'Competitive Analysis', category: 'Competitive Analysis' },
    { key: 'management', label: 'Management Team Evaluation', category: 'Management Team Evaluation' },
    { key: 'legal', label: 'Legal Compliance', category: 'Legal Compliance' },
    { key: 'risk', label: 'Risk Assessment', category: 'Risk Assessment' },
  ];
  const [activeArea, setActiveArea] = useState(areas[0].key);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Group tasks by category
  const tasksByCategory = data?.tasks?.reduce((acc: Record<string, DueDiligenceTask[]>, task: DueDiligenceTask) => {
    const category = task.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {}) || {};

  const getTasksForArea = (areaCategory: string) => {
    return tasksByCategory[areaCategory] || [];
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Due Diligence Overview */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
              <Eye className="w-4 h-4 text-amber-500" />
            </div>
            Due Diligence Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showFullReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <Badge className={`mt-1 ${data.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                    }`}>
                    {data.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Overall Score</label>
                  <p className="text-sm font-medium">{data.overallScore || 'Not scored'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Recommendation</label>
                  <Badge className={`mt-1 ${data.recommendation === 'APPROVE'
                    ? 'bg-green-100 text-green-800'
                    : data.recommendation === 'REJECT'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {data.recommendation || 'Pending'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reviewer</label>
                  <p className="text-sm font-medium">
                    {data.reviewer ?
                      `${data.reviewer.firstName} ${data.reviewer.lastName}` :
                      'Not assigned'
                    }
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowFullReport(true)}>
                  View More
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <Badge className={`mt-1 ${data.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                    }`}>
                    {data.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Overall Score</label>
                  <p className="text-sm font-medium">{data.overallScore || 'Not scored'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Recommendation</label>
                  <Badge className={`mt-1 ${data.recommendation === 'APPROVE'
                    ? 'bg-green-100 text-green-800'
                    : data.recommendation === 'REJECT'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {data.recommendation || 'Pending'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reviewer</label>
                  <p className="text-sm font-medium">
                    {data.reviewer ?
                      `${data.reviewer.firstName} ${data.reviewer.lastName}` :
                      'Not assigned'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created At</label>
                  <p className="text-sm">{data.createdAt ? format(new Date(data.createdAt), 'PPPp') : '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Updated At</label>
                  <p className="text-sm">{data.updatedAt ? format(new Date(data.updatedAt), 'PPPp') : '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="text-sm text-gray-500">Market Research Viable</label>
                  <Badge className={data.marketResearchViable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.marketResearchViable ? 'Viable' : 'Not Viable'}
                  </Badge>
                  {data.marketResearchComments && (
                    <p className="text-xs text-gray-600 mt-1">{data.marketResearchComments}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Financial Viable</label>
                  <Badge className={data.financialViable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.financialViable ? 'Viable' : 'Not Viable'}
                  </Badge>
                  {data.financialComments && (
                    <p className="text-xs text-gray-600 mt-1">{data.financialComments}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Competitive Opportunities</label>
                  <Badge className={data.competitiveOpportunities ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.competitiveOpportunities ? 'Viable' : 'Not Viable'}
                  </Badge>
                  {data.competitiveComments && (
                    <p className="text-xs text-gray-600 mt-1">{data.competitiveComments}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Management Team Qualified</label>
                  <Badge className={data.managementTeamQualified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.managementTeamQualified ? 'Qualified' : 'Not Qualified'}
                  </Badge>
                  {data.managementComments && (
                    <p className="text-xs text-gray-600 mt-1">{data.managementComments}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Legal Compliant</label>
                  <Badge className={data.legalCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.legalCompliant ? 'Compliant' : 'Not Compliant'}
                  </Badge>
                  {data.legalComments && (
                    <p className="text-xs text-gray-600 mt-1">{data.legalComments}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Risk Tolerable</label>
                  <Badge className={data.riskTolerable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.riskTolerable ? 'Tolerable' : 'Not Tolerable'}
                  </Badge>
                  {data.riskComments && (
                    <p className="text-xs text-gray-600 mt-1">{data.riskComments}</p>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <label className="text-sm text-gray-500">Final Comments</label>
                <p className="text-sm text-gray-700">{data.finalComments || '-'}</p>
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowFullReport(false)}>
                  View Less
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Due Diligence Area Tabs */}
      <div className="flex gap-1 mb-2">
        {areas.map(area => {
          const taskCount = getTasksForArea(area.category).length;
          return (
            <Button
              key={area.key}
              variant={activeArea === area.key ? 'default' : 'outline'}
              className={`rounded-full px-3 py-0.5 text-xs ${activeArea === area.key ? 'bg-blue-600 text-white' : ''}`}
              onClick={() => setActiveArea(area.key)}
            >
              <span className="flex items-center gap-2">
                {area.label}
                {taskCount > 0 && (
                  <Badge
                    variant={activeArea === area.key ? 'secondary' : 'default'}
                    className={`text-xs px-1.5 py-0.5 h-5 min-w-[20px] flex items-center justify-center ${activeArea === area.key
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {taskCount}
                  </Badge>
                )}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Assessment Details - show only selected area */}
      {activeArea === 'market' && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                Market Research
              </CardTitle>
              {canCreateTask && onCreateTask && (
                <Button
                  onClick={() => onCreateTask('Market Research')}
                  size="sm"
                  className="rounded-full bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Market Research Assessment</h4>
                <Badge className={data.marketResearchViable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.marketResearchViable ? 'Viable' : 'Not Viable'}
                </Badge>
              </div>
              {data.marketResearchComments && (
                <p className="text-sm text-gray-600">{data.marketResearchComments}</p>
              )}
            </div>

            {/* Tasks for this area */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Tasks ({getTasksForArea('Market Research').length})</h4>
              {getTasksForArea('Market Research').length > 0 ? (
                getTasksForArea('Market Research').map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-300"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{task.title}</h5>
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`text-xs ${task.stage === 'completed' ? 'bg-green-100 text-green-800' :
                              task.stage === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {task.stage.replace('_', ' ')}
                            </Badge>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {task.team?.slice(0, 3).map((member: any, index: number) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="md"
                              showDropdown={true}
                              className={index > 0 ? "-ml-2" : ""}
                            />
                          ))}
                          {task.team && task.team.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center -ml-2">
                              <span className="text-xs text-gray-600 font-medium">+{task.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Due: {format(new Date(task.date), 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <UserAvatar user={task.creator} size="sm" showDropdown={true} />
                        </div>
                      </div>

                      {/* Activity Logs */}
                      {isExpanded && task.activityLogs && task.activityLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Activity Logs</h6>
                          <div className="space-y-3">
                            {task.activityLogs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={log.user} size="sm" showDropdown={true} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{log.title}</span>
                                      <Badge className={`text-xs ${log.activityType === 'task_completion' ? 'bg-green-100 text-green-800' :
                                        log.activityType === 'task_update' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.activityType.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {log.description && (
                                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                      {log.monetaryValueAchieved && log.monetaryValueAchieved !== '0' && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${log.monetaryValueAchieved}
                                        </span>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    {log.documents && log.documents.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {log.documents.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                                            <button
                                              onClick={() => window.open(doc.fileUrl, '_blank')}
                                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              <Download className="w-4 h-4 text-blue-500" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Single Review Activity Button for all areas */}
                                    {canApproveActivity && onApproveActivity && (
                                      <div className="mt-3">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            onApproveActivity(log.id);
                                          }}
                                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                        >
                                          Review Activity
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && (!task.activityLogs || task.activityLogs.length === 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center py-2">No activity logs yet</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tasks assigned to this area yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {activeArea === 'financial' && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                Financial Assessment
              </CardTitle>
              {canCreateTask && onCreateTask && (
                <Button
                  onClick={() => onCreateTask('Financial Assessment')}
                  size="sm"
                  className="rounded-full bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Financial Assessment</h4>
                <Badge className={data.financialViable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.financialViable ? 'Viable' : 'Not Viable'}
                </Badge>
              </div>
              {data.financialComments && (
                <p className="text-sm text-gray-600">{data.financialComments}</p>
              )}
            </div>

            {/* Tasks for this area */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Tasks ({getTasksForArea('Financial Assessment').length})</h4>
              {getTasksForArea('Financial Assessment').length > 0 ? (
                getTasksForArea('Financial Assessment').map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25 hover:border-green-300"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{task.title}</h5>
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`text-xs ${task.stage === 'completed' ? 'bg-green-100 text-green-800' :
                              task.stage === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {task.stage.replace('_', ' ')}
                            </Badge>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {task.team?.slice(0, 3).map((member: any, index: number) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="md"
                              showDropdown={true}
                              className={index > 0 ? "-ml-2" : ""}
                            />
                          ))}
                          {task.team && task.team.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center -ml-2">
                              <span className="text-xs text-gray-600 font-medium">+{task.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Due: {format(new Date(task.date), 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <UserAvatar user={task.creator} size="sm" showDropdown={true} />
                        </div>
                      </div>

                      {/* Activity Logs */}
                      {isExpanded && task.activityLogs && task.activityLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Activity Logs</h6>
                          <div className="space-y-3">
                            {task.activityLogs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={log.user} size="sm" showDropdown={true} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{log.title}</span>
                                      <Badge className={`text-xs ${log.activityType === 'task_completion' ? 'bg-green-100 text-green-800' :
                                        log.activityType === 'task_update' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.activityType.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {log.description && (
                                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                      {log.monetaryValueAchieved && log.monetaryValueAchieved !== '0' && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${log.monetaryValueAchieved}
                                        </span>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    {log.documents && log.documents.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {log.documents.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                                            <button
                                              onClick={() => window.open(doc.fileUrl, '_blank')}
                                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              <Download className="w-4 h-4 text-blue-500" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {canApproveActivity && onApproveActivity && (
                                      <div className="mt-3">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            onApproveActivity(log.id);
                                          }}
                                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                        >
                                          Review Activity
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && (!task.activityLogs || task.activityLogs.length === 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center py-2">No activity logs yet</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tasks assigned to this area yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeArea === 'competitive' && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-purple-500" />
                </div>
                Competitive Analysis
              </CardTitle>
              {canCreateTask && onCreateTask && (
                <Button
                  onClick={() => onCreateTask('Competitive Analysis')}
                  size="sm"
                  className="rounded-full bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Competitive Analysis</h4>
                <Badge className={data.competitiveOpportunities ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.competitiveOpportunities ? 'Viable' : 'Not Viable'}
                </Badge>
              </div>
              {data.competitiveComments && (
                <p className="text-sm text-gray-600">{data.competitiveComments}</p>
              )}
            </div>

            {/* Tasks for this area */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Tasks ({getTasksForArea('Competitive Analysis').length})</h4>
              {getTasksForArea('Competitive Analysis').length > 0 ? (
                getTasksForArea('Competitive Analysis').map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 hover:border-purple-300"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{task.title}</h5>
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`text-xs ${task.stage === 'completed' ? 'bg-green-100 text-green-800' :
                              task.stage === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {task.stage.replace('_', ' ')}
                            </Badge>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {task.team?.slice(0, 3).map((member: any, index: number) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="md"
                              showDropdown={true}
                              className={index > 0 ? "-ml-2" : ""}
                            />
                          ))}
                          {task.team && task.team.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center -ml-2">
                              <span className="text-xs text-gray-600 font-medium">+{task.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Due: {format(new Date(task.date), 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <UserAvatar user={task.creator} size="sm" showDropdown={true} />
                        </div>
                      </div>

                      {/* Activity Logs */}
                      {isExpanded && task.activityLogs && task.activityLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Activity Logs</h6>
                          <div className="space-y-3">
                            {task.activityLogs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={log.user} size="sm" showDropdown={true} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{log.title}</span>
                                      <Badge className={`text-xs ${log.activityType === 'task_completion' ? 'bg-green-100 text-green-800' :
                                        log.activityType === 'task_update' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.activityType.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {log.description && (
                                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                      {log.monetaryValueAchieved && log.monetaryValueAchieved !== '0' && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${log.monetaryValueAchieved}
                                        </span>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    {log.documents && log.documents.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {log.documents.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                                            <button
                                              onClick={() => window.open(doc.fileUrl, '_blank')}
                                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              <Download className="w-4 h-4 text-blue-500" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {canApproveActivity && onApproveActivity && (
                                      <div className="mt-3">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            onApproveActivity(log.id);
                                          }}
                                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                        >
                                          Review Activity
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && (!task.activityLogs || task.activityLogs.length === 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center py-2">No activity logs yet</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tasks assigned to this area yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeArea === 'management' && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-500" />
                </div>
                Management Team Evaluation
              </CardTitle>
              {canCreateTask && onCreateTask && (
                <Button
                  onClick={() => onCreateTask('Management Team Evaluation')}
                  size="sm"
                  className="rounded-full bg-orange-600 hover:bg-orange-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Management Team Evaluation</h4>
                <Badge className={data.managementTeamQualified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.managementTeamQualified ? 'Qualified' : 'Not Qualified'}
                </Badge>
              </div>
              {data.managementComments && (
                <p className="text-sm text-gray-600">{data.managementComments}</p>
              )}
            </div>

            {/* Tasks for this area */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Tasks ({getTasksForArea('Management Team Evaluation').length})</h4>
              {getTasksForArea('Management Team Evaluation').length > 0 ? (
                getTasksForArea('Management Team Evaluation').map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 hover:border-orange-300"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{task.title}</h5>
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`text-xs ${task.stage === 'completed' ? 'bg-green-100 text-green-800' :
                              task.stage === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {task.stage.replace('_', ' ')}
                            </Badge>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {task.team?.slice(0, 3).map((member: any, index: number) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="md"
                              showDropdown={true}
                              className={index > 0 ? "-ml-2" : ""}
                            />
                          ))}
                          {task.team && task.team.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center -ml-2">
                              <span className="text-xs text-gray-600 font-medium">+{task.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Due: {format(new Date(task.date), 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <UserAvatar user={task.creator} size="sm" showDropdown={true} />
                        </div>
                      </div>

                      {/* Activity Logs */}
                      {isExpanded && task.activityLogs && task.activityLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Activity Logs</h6>
                          <div className="space-y-3">
                            {task.activityLogs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={log.user} size="sm" showDropdown={true} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{log.title}</span>
                                      <Badge className={`text-xs ${log.activityType === 'task_completion' ? 'bg-green-100 text-green-800' :
                                        log.activityType === 'task_update' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.activityType.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {log.description && (
                                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                      {log.monetaryValueAchieved && log.monetaryValueAchieved !== '0' && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${log.monetaryValueAchieved}
                                        </span>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    {log.documents && log.documents.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {log.documents.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                                            <button
                                              onClick={() => window.open(doc.fileUrl, '_blank')}
                                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              <Download className="w-4 h-4 text-blue-500" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {canApproveActivity && onApproveActivity && (
                                      <div className="mt-3">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            onApproveActivity(log.id);
                                          }}
                                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                        >
                                          Review Activity
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && (!task.activityLogs || task.activityLogs.length === 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center py-2">No activity logs yet</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tasks assigned to this area yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeArea === 'legal' && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                Legal Compliance
              </CardTitle>
              {canCreateTask && onCreateTask && (
                <Button
                  onClick={() => onCreateTask('Legal Compliance')}
                  size="sm"
                  className="rounded-full bg-red-600 hover:bg-red-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Legal Compliance</h4>
                <Badge className={data.legalCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.legalCompliant ? 'Compliant' : 'Not Compliant'}
                </Badge>
              </div>
              {data.legalComments && (
                <p className="text-sm text-gray-600">{data.legalComments}</p>
              )}
            </div>

            {/* Tasks for this area */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Tasks ({getTasksForArea('Legal Compliance').length})</h4>
              {getTasksForArea('Legal Compliance').length > 0 ? (
                getTasksForArea('Legal Compliance').map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 hover:border-red-300"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{task.title}</h5>
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`text-xs ${task.stage === 'completed' ? 'bg-green-100 text-green-800' :
                              task.stage === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {task.stage.replace('_', ' ')}
                            </Badge>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {task.team?.slice(0, 3).map((member: any, index: number) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="md"
                              showDropdown={true}
                              className={index > 0 ? "-ml-2" : ""}
                            />
                          ))}
                          {task.team && task.team.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center -ml-2">
                              <span className="text-xs text-gray-600 font-medium">+{task.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Due: {format(new Date(task.date), 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <UserAvatar user={task.creator} size="sm" showDropdown={true} />
                        </div>
                      </div>

                      {/* Activity Logs */}
                      {isExpanded && task.activityLogs && task.activityLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Activity Logs</h6>
                          <div className="space-y-3">
                            {task.activityLogs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={log.user} size="sm" showDropdown={true} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{log.title}</span>
                                      <Badge className={`text-xs ${log.activityType === 'task_completion' ? 'bg-green-100 text-green-800' :
                                        log.activityType === 'task_update' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.activityType.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {log.description && (
                                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                      {log.monetaryValueAchieved && log.monetaryValueAchieved !== '0' && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${log.monetaryValueAchieved}
                                        </span>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    {log.documents && log.documents.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {log.documents.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                                            <button
                                              onClick={() => window.open(doc.fileUrl, '_blank')}
                                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              <Download className="w-4 h-4 text-blue-500" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {canApproveActivity && onApproveActivity && (
                                      <div className="mt-3">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            onApproveActivity(log.id);
                                          }}
                                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                        >
                                          Review Activity
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && (!task.activityLogs || task.activityLogs.length === 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center py-2">No activity logs yet</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tasks assigned to this area yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeArea === 'risk' && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-normal flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                </div>
                Risk Assessment
              </CardTitle>
              {canCreateTask && onCreateTask && (
                <Button
                  onClick={() => onCreateTask('Risk Assessment')}
                  size="sm"
                  className="rounded-full bg-yellow-600 hover:bg-yellow-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Risk Assessment</h4>
                <Badge className={data.riskTolerable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {data.riskTolerable ? 'Tolerable' : 'Not Tolerable'}
                </Badge>
              </div>
              {data.riskComments && (
                <p className="text-sm text-gray-600">{data.riskComments}</p>
              )}
            </div>

            {/* Tasks for this area */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Tasks ({getTasksForArea('Risk Assessment').length})</h4>
              {getTasksForArea('Risk Assessment').length > 0 ? (
                getTasksForArea('Risk Assessment').map((task) => {
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/25 hover:border-yellow-300"
                      onClick={() => toggleTaskExpansion(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{task.title}</h5>
                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`text-xs ${task.stage === 'completed' ? 'bg-green-100 text-green-800' :
                              task.stage === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {task.stage.replace('_', ' ')}
                            </Badge>
                            {task.isOverdue && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {task.team?.slice(0, 3).map((member: any, index: number) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="md"
                              showDropdown={true}
                              className={index > 0 ? "-ml-2" : ""}
                            />
                          ))}
                          {task.team && task.team.length > 3 && (
                            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center -ml-2">
                              <span className="text-xs text-gray-600 font-medium">+{task.team.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Due: {format(new Date(task.date), 'MMM dd, yyyy')}</span>
                        <div className="flex items-center gap-2">
                          <span>Created by:</span>
                          <UserAvatar user={task.creator} size="sm" showDropdown={true} />
                        </div>
                      </div>

                      {/* Activity Logs */}
                      {isExpanded && task.activityLogs && task.activityLogs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h6 className="text-sm font-medium text-gray-700 mb-3">Activity Logs</h6>
                          <div className="space-y-3">
                            {task.activityLogs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={log.user} size="sm" showDropdown={true} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">{log.title}</span>
                                      <Badge className={`text-xs ${log.activityType === 'task_completion' ? 'bg-green-100 text-green-800' :
                                        log.activityType === 'task_update' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {log.activityType.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {log.description && (
                                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                                      {log.monetaryValueAchieved && log.monetaryValueAchieved !== '0' && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          ${log.monetaryValueAchieved}
                                        </span>
                                      )}
                                    </div>
                                    {/* Documents */}
                                    {log.documents && log.documents.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {log.documents.map((doc: any, docIndex: number) => (
                                          <div key={docIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                            <File className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-700 truncate flex-1">{doc.fileName}</span>
                                            <span className="text-xs text-gray-500">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                                            <button
                                              onClick={() => window.open(doc.fileUrl, '_blank')}
                                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                              <Download className="w-4 h-4 text-blue-500" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {canApproveActivity && onApproveActivity && (
                                      <div className="mt-3">
                                        <Button
                                          onClick={e => {
                                            e.stopPropagation();
                                            onApproveActivity(log.id);
                                          }}
                                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full"
                                        >
                                          Review Activity
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && (!task.activityLogs || task.activityLogs.length === 0) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center py-2">No activity logs yet</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No tasks assigned to this area yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Comments */}
      {data.finalComments && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-normal flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-500" />
              </div>
              Final Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{data.finalComments}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
