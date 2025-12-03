"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { 
  CiUser, 
  CiCircleCheck, 
  CiClock1, 
  CiCircleAlert,
  CiStar,
  CiTrophy,
  CiSearch,
  CiFilter,
  CiHome
} from "react-icons/ci"
import { RefreshCw } from "lucide-react"
import { UserScorecardDrawer } from "./user-scorecard-drawer"
import { apiClient } from "@/lib/api/api-client"

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
}

export function UserScorecards() {
  const [scorecards, setScorecards] = useState<UserScorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedScorecard, setSelectedScorecard] = useState<UserScorecard | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  useEffect(() => {
    fetchScorecards()
  }, [])

  const fetchScorecards = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/performance-scorecards/users')
      const data = response as { success: boolean; data: UserScorecard[] }
      
      if (data.success) {
        setScorecards(data.data)
      }
    } catch (error) {
      console.error('Error fetching user scorecards:', error)
    } finally {
      setLoading(false)
    }
  }

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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200'
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

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <CiStar className="w-4 h-4" />
      case 'manager':
        return <CiHome className="w-4 h-4" />
      case 'employee':
        return <CiUser className="w-4 h-4" />
      default:
        return <CiUser className="w-4 h-4" />
    }
  }

  const filteredScorecards = scorecards.filter(scorecard => {
    const matchesSearch = scorecard.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scorecard.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCategory === 'all' || scorecard.performanceCategory.toLowerCase() === filterCategory.toLowerCase()
    return matchesSearch && matchesFilter
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredScorecards.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedScorecards = filteredScorecards.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory])

  const handleViewDetails = (scorecard: UserScorecard) => {
    setSelectedScorecard(scorecard)
    setDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">User Scorecards</h1>
            <p className="text-gray-600">Individual performance metrics for all users</p>
          </div>
          <Button 
            variant="outline"
            onClick={fetchScorecards}
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div  key={i} className="animate-pulse border border-gray-200 rounded-xl p-3">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-16 mx-auto"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">User Scorecards</h1>
          <p className="text-gray-600">Individual performance metrics for all users</p>
        </div>
        <Button 
          variant="outline"
          onClick={fetchScorecards}
          disabled={loading}
          className="rounded-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <CiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users or departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <CiFilter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="needs improvement">Needs Improvement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scorecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedScorecards.map((scorecard) => (
          <div key={scorecard.userId} className="border border-gray-200 rounded-xl hover:border-gray-300 transition-colors duration-200 p-3">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CiUser className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-normal">{scorecard.userName}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                      <CiHome className="w-4 h-4" />
                      {scorecard.department}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getPerformanceColor(scorecard.performanceCategory)}>
                    {scorecard.performanceCategory}
                  </Badge>
                  <Badge className={getRoleColor(scorecard.role)}>
                    {getRoleIcon(scorecard.role)}
                    <span className="ml-1 capitalize text-xs">{scorecard.role}</span>
                  </Badge>
                  <Button 
                    onClick={() => handleViewDetails(scorecard)}
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <CiSearch className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 py-2">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`text-2xl font-normal ${getScoreColor(scorecard.overallScore)}`}>
                  {scorecard.overallScore}
                </div>
                <p className="text-xs text-gray-600">Overall Score</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CiCircleCheck className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-normal">Tasks</span>
                  </div>
                  <div className="text-sm font-normal">{scorecard.taskMetrics.totalTasks}</div>
                  <div className="text-xs text-gray-600">
                    {scorecard.taskMetrics.completionRate}% complete
                  </div>
                </div>
                
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CiTrophy className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-normal">Goals</span>
                  </div>
                  <div className="text-sm font-normal">{scorecard.goalMetrics.totalGoals}</div>
                  <div className="text-xs text-gray-600">
                    {scorecard.goalMetrics.completionRate}% achieved
                  </div>
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-normal">Activities</span>
                  <span>{scorecard.activityMetrics.totalActivities}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(scorecard.activityMetrics.totalActivities * 10, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Review Score */}
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CiStar className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-normal">Latest Review</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-normal text-purple-600">{scorecard.reviewMetrics.averageScore}</span>
                  <span className="text-xs text-gray-600">/100</span>
                </div>
              </div>
            </CardContent>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredScorecards.length === 0 && (
        <div className="text-center py-12">
          <CiUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            {searchTerm || filterCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No user scorecards available at the moment.'
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Drawer */}
      {selectedScorecard && (
        <UserScorecardDrawer
          scorecard={selectedScorecard}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}