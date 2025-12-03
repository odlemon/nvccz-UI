"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CiHome, 
  CiUser, 
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
  CiCircleMinus
} from "react-icons/ci"

interface DepartmentScorecard {
  departmentId: string
  departmentName: string
  totalUsers: number
  averageScore: number
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
    averageLogFrequency: number
    engagementScore: number
    averageResponseTime: number
    proactiveActions: number
  }
  reviewMetrics: {
    totalReviews: number
    averageScore: number
    completionRate: number
    improvementTrend: string
    lastReviewDate: string | null
  }
  performanceDistribution: {
    highPerformers: number
    averagePerformers: number
    needsImprovement: number
    highPerformerPercentage: number
    averagePerformerPercentage: number
    needsImprovementPercentage: number
  }
  comparison: {
    rankInCompany: number
    vsCompanyAverage: string
    vsBestDepartment: string
    vsWorstDepartment: string
  }
}

interface DepartmentScorecardDrawerProps {
  scorecard: DepartmentScorecard
  isOpen: boolean
  onClose: () => void
  loading?: boolean
}

export function DepartmentScorecardDrawer({ scorecard, isOpen, onClose, loading = false }: DepartmentScorecardDrawerProps) {
  const getPerformanceColor = (category: string) => {
    switch (category) {
      case "High Performance":
        return "bg-green-100 text-green-800 border-green-200"
      case "Average Performance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Needs Improvement":
        return "bg-red-100 text-red-800 border-red-200"
      case "No Users":
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  const getComparisonColor = (value: string) => {
    if (value.startsWith('+')) return "text-green-600"
    if (value.startsWith('-')) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto p-4 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CiHome className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <SheetTitle className="text-xl font-normal">{scorecard.departmentName}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <CiUser className="w-4 h-4" />
                {scorecard.totalUsers} users
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
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                    </div>
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
                <div className="border border-gray-200 rounded-xl p-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiGrid41 className="w-5 h-5" />
                      Overall Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-normal ${getScoreColor(scorecard.averageScore)}`}>
                        {scorecard.averageScore}
                      </div>
                      <p className="text-sm text-gray-600">Overall Score</p>
                      <Badge className={`mt-2 ${getPerformanceColor(scorecard.performanceCategory)}`}>
                        {scorecard.performanceCategory}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <div className="text-2xl font-normal text-blue-600">#{scorecard.comparison.rankInCompany}</div>
                        <div className="text-xs text-gray-600">Company Rank</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-normal text-green-600">{scorecard.performanceDistribution.highPerformerPercentage}%</div>
                        <div className="text-xs text-gray-600">High Performers</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <div className="text-2xl font-normal text-purple-600">{scorecard.reviewMetrics.totalReviews}</div>
                        <div className="text-xs text-gray-600">Total Reviews</div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Performance Distribution */}
                <div className="border border-gray-200 rounded-xl p-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiUser className="w-5 h-5" />
                      Performance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal text-green-600">High Performers</span>
                        <span className="text-sm font-normal">{scorecard.performanceDistribution.highPerformerPercentage}%</span>
                      </div>
                      <Progress value={scorecard.performanceDistribution.highPerformerPercentage} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal text-yellow-600">Average Performers</span>
                        <span className="text-sm font-normal">{scorecard.performanceDistribution.averagePerformerPercentage}%</span>
                      </div>
                      <Progress value={scorecard.performanceDistribution.averagePerformerPercentage} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal text-red-600">Needs Improvement</span>
                        <span className="text-sm font-normal">{scorecard.performanceDistribution.needsImprovementPercentage}%</span>
                      </div>
                      <Progress value={scorecard.performanceDistribution.needsImprovementPercentage} className="h-2" />
                    </div>
                  </CardContent>
                </div>

                {/* Company Comparison */}
                <div className="border border-gray-200 rounded-xl p-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-normal">
                      <CiGrid41 className="w-5 h-5" />
                      Company Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-normal">vs Company Average</span>
                        <span className={`text-sm font-normal ${getComparisonColor(scorecard.comparison.vsCompanyAverage)}`}>
                          {scorecard.comparison.vsCompanyAverage}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-normal">vs Best Department</span>
                        <span className={`text-sm font-normal ${getComparisonColor(scorecard.comparison.vsBestDepartment)}`}>
                          {scorecard.comparison.vsBestDepartment}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-normal">vs Worst Department</span>
                        <span className={`text-sm font-normal ${getComparisonColor(scorecard.comparison.vsWorstDepartment)}`}>
                          {scorecard.comparison.vsWorstDepartment}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                      </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6 mt-6">
                <div className="border border-gray-200 rounded-xl p-2">
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
                </div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-6 mt-6">
                <div className="border border-gray-200 rounded-xl p-2">
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
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 mt-6">
                <div className="border border-gray-200 rounded-xl p-2">
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
                        <div className="text-2xl font-normal text-green-600">{scorecard.reviewMetrics.averageScore}</div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-normal">Review Completion Rate</span>
                        <span className="text-sm font-normal">{scorecard.reviewMetrics.completionRate}%</span>
                      </div>
                      <Progress value={scorecard.reviewMetrics.completionRate} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(scorecard.reviewMetrics.improvementTrend)}
                        <span className="text-sm font-normal">Improvement Trend</span>
                      </div>
                      <span className="text-sm font-normal">{scorecard.reviewMetrics.improvementTrend}</span>
                    </div>
                  </CardContent>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
