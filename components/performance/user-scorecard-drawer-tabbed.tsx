"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CiUser, 
  CiHome, 
  CiCircleCheck, 
  CiClock1, 
  CiCircleAlert,
  CiGrid41,
  CiStar,
  CiTrophy,
  CiCalendar,
  CiCircleCheck as CiTargetIcon,
  CiTimer,
  CiTrophy as CiTrophyIcon,
  CiGrid41 as CiActivityIcon,
  CiStar as CiStarIcon,
  CiCircleChevUp,
  CiCircleChevDown,
  CiCircleMinus,
  CiShield
} from "react-icons/ci"

interface UserScorecard {
  userId: string
  userName: string
  department: string
  role: string
  overallScore: number
  performanceCategory: string
  taskMetrics: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    completionRate: number
    averageCompletionTime: number
    overdueRate: number
    qualityScore: number
  }
  goalMetrics: {
    totalGoals: number
    achievedGoals: number
    overdueGoals: number
    completionRate: number
    progressSpeed: number
    overdueRate: number
    averageProgress: number
  }
  activityMetrics: {
    totalActivities: number
    logFrequency: number
    engagementScore: number
    responseTime: number
    proactiveActions: number
  }
  reviewMetrics: {
    totalReviews: number
    averageScore: number
    latestScore: number
    improvementTrend: string
    lastReviewDate: string | null
  }
}

interface UserScorecardDrawerProps {
  scorecard: UserScorecard
  isOpen: boolean
  onClose: () => void
  loading?: boolean
}

export function UserScorecardDrawer({ scorecard, isOpen, onClose, loading = false }: UserScorecardDrawerProps) {
  const getPerformanceColor = (category: string) => {
    switch (category) {
      case "High Performance":
        return "bg-green-100 text-green-800 border-green-200"
      case "Average Performance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Needs Improvement":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <CiShield className="w-5 h-5 text-purple-600" />
      case "portfolio_company":
        return <CiHome className="w-5 h-5 text-blue-600" />
      case "applicant":
        return <CiUser className="w-5 h-5 text-gray-600" />
      default:
        return <CiUser className="w-5 h-5 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "portfolio_company":
        return "bg-blue-100 text-blue-800"
      case "applicant":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Improving":
        return <CiCircleChevUp className="w-4 h-4 text-green-600" />
      case "Declining":
        return <CiCircleChevDown className="w-4 h-4 text-red-600" />
      default:
        return <CiCircleMinus className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CiUser className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <SheetTitle className="text-xl font-normal">{scorecard.userName}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <CiHome className="w-4 h-4" />
                {scorecard.department}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Overall Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiGrid41 className="w-5 h-5" />
                      Overall Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-normal ${getScoreColor(scorecard.overallScore)}`}>
                        {scorecard.overallScore}
                      </div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                      <div className="flex justify-center gap-2 mt-2">
                        <Badge className={getPerformanceColor(scorecard.performanceCategory)}>
                          {scorecard.performanceCategory}
                        </Badge>
                        <Badge className={getRoleColor(scorecard.role)}>
                          {getRoleIcon(scorecard.role)}
                          <span className="ml-1 capitalize">{scorecard.role.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiGrid41 className="w-5 h-5" />
                      Activity & Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-normal text-blue-600">{scorecard.activityMetrics.totalActivities}</div>
                        <div className="text-sm text-gray-600">Total Activities</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-normal text-green-600">{scorecard.activityMetrics.proactiveActions}</div>
                        <div className="text-sm text-gray-600">Proactive Actions</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Engagement Score</span>
                        <span className="text-sm font-normal">{scorecard.activityMetrics.engagementScore}/100</span>
                      </div>
                      <Progress value={scorecard.activityMetrics.engagementScore} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-normal text-purple-600">{scorecard.activityMetrics.logFrequency}</div>
                        <div className="text-xs text-gray-600">Log Frequency</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-normal text-orange-600">{scorecard.activityMetrics.responseTime}</div>
                        <div className="text-xs text-gray-600">Response Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiCircleCheck className="w-5 h-5" />
                      Task Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-normal text-blue-600">{scorecard.taskMetrics.totalTasks}</div>
                        <div className="text-sm text-gray-600">Total Tasks</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-normal text-green-600">{scorecard.taskMetrics.completedTasks}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Completion Rate</span>
                        <span className="text-sm font-normal">{scorecard.taskMetrics.completionRate}%</span>
                      </div>
                      <Progress value={scorecard.taskMetrics.completionRate} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Quality Score</span>
                        <span className="text-sm font-normal">{scorecard.taskMetrics.qualityScore}/100</span>
                      </div>
                      <Progress value={scorecard.taskMetrics.qualityScore} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-normal text-orange-600">{scorecard.taskMetrics.overdueTasks}</div>
                        <div className="text-xs text-gray-600">Overdue Tasks</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-normal text-blue-600">{scorecard.taskMetrics.averageCompletionTime}</div>
                        <div className="text-xs text-gray-600">Avg. Time (days)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiTrophy className="w-5 h-5" />
                      Goal Achievement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-normal text-blue-600">{scorecard.goalMetrics.totalGoals}</div>
                        <div className="text-sm text-gray-600">Total Goals</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-normal text-green-600">{scorecard.goalMetrics.achievedGoals}</div>
                        <div className="text-sm text-gray-600">Achieved</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Goal Completion Rate</span>
                        <span className="text-sm font-normal">{scorecard.goalMetrics.completionRate}%</span>
                      </div>
                      <Progress value={scorecard.goalMetrics.completionRate} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Average Progress</span>
                        <span className="text-sm font-normal">{scorecard.goalMetrics.averageProgress}%</span>
                      </div>
                      <Progress value={scorecard.goalMetrics.averageProgress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-normal text-orange-600">{scorecard.goalMetrics.overdueGoals}</div>
                        <div className="text-xs text-gray-600">Overdue Goals</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-normal text-purple-600">{scorecard.goalMetrics.progressSpeed}</div>
                        <div className="text-xs text-gray-600">Progress Speed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiStar className="w-5 h-5" />
                      Review Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-normal text-blue-600">{scorecard.reviewMetrics.totalReviews}</div>
                        <div className="text-sm text-gray-600">Total Reviews</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-normal text-green-600">{scorecard.reviewMetrics.latestScore}</div>
                        <div className="text-sm text-gray-600">Latest Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Average Score</span>
                        <span className="text-sm font-normal">{scorecard.reviewMetrics.averageScore}/100</span>
                      </div>
                      <Progress value={scorecard.reviewMetrics.averageScore} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(scorecard.reviewMetrics.improvementTrend)}
                        <span className="text-sm font-normal">Improvement Trend</span>
                      </div>
                      <span className="text-sm font-normal">{scorecard.reviewMetrics.improvementTrend}</span>
                    </div>

                    {scorecard.reviewMetrics.lastReviewDate && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CiCalendar className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-normal">Last Review</span>
                        </div>
                        <span className="text-sm font-normal">
                          {new Date(scorecard.reviewMetrics.lastReviewDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
