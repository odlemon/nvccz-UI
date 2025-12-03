"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
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
  CiHome,
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
}

export function DepartmentScorecardDrawer({ scorecard, isOpen, onClose }: DepartmentScorecardDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'goals' | 'reviews'>('overview')

  const getPerformanceColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'needs improvement':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'no users':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getComparisonColor = (comparison: string) => {
    if (comparison.startsWith('+')) return 'text-green-600'
    if (comparison.startsWith('-')) return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'improving':
        return <CiCircleChevUp className="w-4 h-4 text-green-600" />
      case 'declining':
        return <CiCircleChevDown className="w-4 h-4 text-red-600" />
      case 'stable':
        return <CiCircleMinus className="w-4 h-4 text-gray-600" />
      default:
        return <CiCircleMinus className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-4 [&>button[aria-label='Close']]:hidden">
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
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: CiGrid41 },
              { id: 'tasks', label: 'Tasks', icon: CiCircleCheck },
              { id: 'goals', label: 'Goals', icon: CiTrophy },
              { id: 'reviews', label: 'Reviews', icon: CiStar }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm  transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overall Performance */}
              <div className="border border-gray-200 rounded-xl p-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CiGrid41 className="w-5 h-5" />
                    Overall Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`text-4xl  ${getScoreColor(scorecard.averageScore)}`}>
                      {scorecard.averageScore}
                    </div>
                    <p className="text-sm text-gray-600">Overall Score</p>
                    <Badge className={`mt-2 ${getPerformanceColor(scorecard.performanceCategory)}`}>
                      {scorecard.performanceCategory}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl  text-blue-600">#{scorecard.comparison.rankInCompany}</div>
                      <div className="text-xs text-gray-600">Company Rank</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl  text-green-600">{scorecard.performanceDistribution.highPerformerPercentage}%</div>
                      <div className="text-xs text-gray-600">High Performers</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl  text-purple-600">{scorecard.reviewMetrics.totalReviews}</div>
                      <div className="text-xs text-gray-600">Total Reviews</div>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Performance Distribution */}
              <div className="border border-gray-200 rounded-xl p-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CiUser className="w-5 h-5" />
                    Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm  text-green-600">High Performers</span>
                      <span className="text-sm ">{scorecard.performanceDistribution.highPerformerPercentage}%</span>
                    </div>
                    <Progress value={scorecard.performanceDistribution.highPerformerPercentage} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm  text-yellow-600">Average Performers</span>
                      <span className="text-sm ">{scorecard.performanceDistribution.averagePerformerPercentage}%</span>
                    </div>
                    <Progress value={scorecard.performanceDistribution.averagePerformerPercentage} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm  text-red-600">Needs Improvement</span>
                      <span className="text-sm ">{scorecard.performanceDistribution.needsImprovementPercentage}%</span>
                    </div>
                    <Progress value={scorecard.performanceDistribution.needsImprovementPercentage} className="h-2" />
                  </div>
                </CardContent>
              </div>

              {/* Company Comparison */}
              <div className="border border-gray-200 rounded-xl p-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CiGrid41 className="w-5 h-5" />
                    Company Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm ">vs Company Average</span>
                      <span className={`text-sm  ${getComparisonColor(scorecard.comparison.vsCompanyAverage)}`}>
                        {scorecard.comparison.vsCompanyAverage}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm ">vs Best Department</span>
                      <span className={`text-sm  ${getComparisonColor(scorecard.comparison.vsBestDepartment)}`}>
                        {scorecard.comparison.vsBestDepartment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm ">vs Worst Department</span>
                      <span className={`text-sm  ${getComparisonColor(scorecard.comparison.vsWorstDepartment)}`}>
                        {scorecard.comparison.vsWorstDepartment}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CiCircleCheck className="w-5 h-5" />
                    Task Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl  text-blue-600">{scorecard.taskMetrics.totalTasks}</div>
                      <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl  text-green-600">{scorecard.taskMetrics.completedTasks}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm ">Completion Rate</span>
                      <span className="text-sm ">{scorecard.taskMetrics.completionRate}%</span>
                    </div>
                    <Progress value={scorecard.taskMetrics.completionRate} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm ">Quality Score</span>
                      <span className="text-sm ">{scorecard.taskMetrics.qualityScore}/100</span>
                    </div>
                    <Progress value={scorecard.taskMetrics.qualityScore} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg  text-orange-600">{scorecard.taskMetrics.overdueTasks}</div>
                      <div className="text-xs text-gray-600">Overdue Tasks</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg  text-blue-600">{scorecard.taskMetrics.averageCompletionTime}</div>
                      <div className="text-xs text-gray-600">Avg. Time (days)</div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CiTrophy className="w-5 h-5" />
                    Goal Achievement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl  text-blue-600">{scorecard.goalMetrics.totalGoals}</div>
                      <div className="text-sm text-gray-600">Total Goals</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl  text-green-600">{scorecard.goalMetrics.achievedGoals}</div>
                      <div className="text-sm text-gray-600">Achieved</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm ">Goal Completion Rate</span>
                      <span className="text-sm ">{scorecard.goalMetrics.completionRate}%</span>
                    </div>
                    <Progress value={scorecard.goalMetrics.completionRate} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm ">Average Progress</span>
                      <span className="text-sm ">{scorecard.goalMetrics.averageProgress}%</span>
                    </div>
                    <Progress value={scorecard.goalMetrics.averageProgress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg  text-orange-600">{scorecard.goalMetrics.overdueGoals}</div>
                      <div className="text-xs text-gray-600">Overdue Goals</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg  text-purple-600">{scorecard.goalMetrics.progressSpeed}</div>
                      <div className="text-xs text-gray-600">Progress Speed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl p-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CiStar className="w-5 h-5" />
                    Review Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl  text-blue-600">{scorecard.reviewMetrics.totalReviews}</div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl  text-green-600">{scorecard.reviewMetrics.averageScore}</div>
                      <div className="text-sm text-gray-600">Average Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm ">Review Completion Rate</span>
                      <span className="text-sm ">{scorecard.reviewMetrics.completionRate}%</span>
                    </div>
                    <Progress value={scorecard.reviewMetrics.completionRate} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(scorecard.reviewMetrics.improvementTrend)}
                      <span className="text-sm ">Improvement Trend</span>
                    </div>
                    <span className="text-sm ">{scorecard.reviewMetrics.improvementTrend}</span>
                  </div>

                  {scorecard.reviewMetrics.lastReviewDate && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CiCalendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm ">Last Review</span>
                      </div>
                      <span className="text-sm ">
                        {new Date(scorecard.reviewMetrics.lastReviewDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}