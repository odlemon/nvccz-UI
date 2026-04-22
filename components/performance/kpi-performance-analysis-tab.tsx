"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { 
  fetchAvailableKPIs, 
  fetchAvailableDepartments,
  fetchKPIAnalytics 
} from "@/lib/store/slices/performanceSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { ProcurementDataTable } from "@/components/procurement/procurement-data-table"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { CiTrophy, CiViewTimeline } from "react-icons/ci"
import { TbTarget } from "react-icons/tb"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function getDefaultDateRange() {
  const now = new Date()
  return {
    startDate: format(startOfMonth(now), "yyyy-MM-dd"),
    endDate: format(endOfMonth(now), "yyyy-MM-dd"),
  }
}

export function KPIPerformanceAnalysisTab() {
  const dispatch = useAppDispatch()
  const { 
    availableKPIs, 
    availableDepartments,
    kpiAnalytics,
    kpiAnalyticsLoading,
    kpiAnalyticsSummary
  } = useAppSelector((state) => state.performance)
  
  const [filters, setFilters] = useState(() => {
    const { startDate, endDate } = getDefaultDateRange()
    return { kpiId: "all", department: "all", startDate, endDate }
  })
  
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(getDefaultDateRange().startDate))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(getDefaultDateRange().endDate))

  useEffect(() => {
    dispatch(fetchAvailableKPIs())
    dispatch(fetchAvailableDepartments())
  }, [dispatch])

  useEffect(() => {
    setFilters(f => ({
      ...f,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : ""
    }))
  }, [startDate, endDate])

  useEffect(() => {
    const params: any = {}
    if (filters.kpiId && filters.kpiId !== "all") params.kpiId = filters.kpiId
    if (filters.department && filters.department !== "all") params.department = filters.department
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate

    console.log('Fetching KPI Analytics with params:', params)
    dispatch(fetchKPIAnalytics(params))
  }, [filters, dispatch])

  const handleRefresh = () => {
    const params: any = {}
    if (filters.kpiId && filters.kpiId !== "all") params.kpiId = filters.kpiId
    if (filters.department && filters.department !== "all") params.department = filters.department
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate

    dispatch(fetchKPIAnalytics(params))
  }

  const handleResetFilters = () => {
    const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange()
    setFilters({ kpiId: "all", department: "all", startDate: defaultStart, endDate: defaultEnd })
    setStartDate(new Date(defaultStart))
    setEndDate(new Date(defaultEnd))
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.kpiId && filters.kpiId !== "all") count++
    if (filters.department && filters.department !== "all") count++
    if (filters.startDate !== getDefaultDateRange().startDate) count++
    if (filters.endDate !== getDefaultDateRange().endDate) count++
    return count
  }

  const formatValue = (value: number, kpi: any) => {
    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
    const unitPosition = kpi?.unitPosition || "suffix"
    const unitSymbol = kpi?.unitSymbol || ""

    if (unitPosition === "prefix") {
      return `${unitSymbol}${safeValue.toLocaleString()}`
    }
    return `${safeValue.toLocaleString()}${unitSymbol}`
  }

  const getKpiLabel = (item: any) => item?.kpi?.name || "Unmapped KPI"
  const getKpiType = (item: any) => item?.kpi?.type || "Unknown"
  const getSafePercentage = (value: any) => {
    const numeric = Number.parseFloat(String(value))
    return Number.isFinite(numeric) ? numeric : 0
  }
  const getGoalShare = (part: number, total: number) => {
    if (!total || total <= 0) return 0
    return (part / total) * 100
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500"
    if (percentage >= 60) return "bg-blue-500"
    if (percentage >= 40) return "bg-amber-500"
    return "bg-red-500"
  }

  const getTrendIcon = (progress: number) => {
    if (progress >= 80) return <TrendingUp className="w-4 h-4 text-emerald-600" />
    if (progress >= 40) return <Minus className="w-4 h-4 text-amber-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const columns = [
    {
      key: "kpi.name",
      label: "KPI",
      render: (_: unknown, row: any) => (
        <div>
          <p className="font-medium">{getKpiLabel(row)}</p>
          <p className="text-xs text-muted-foreground">{getKpiType(row)}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "totalGoals",
      label: "Total Goals",
      sortable: true,
    },
    {
      key: "completedGoals",
      label: "Completed",
      render: (value: number) => (
        <Badge variant="default" className="bg-emerald-100 text-emerald-800">
          {value}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "inProgressGoals",
      label: "In Progress",
      render: (value: number) => (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          {value}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "notStartedGoals",
      label: "Not Started",
      render: (value: number) => (
        <Badge variant="secondary">
          {value}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "totalTargetValue",
      label: "Target Value",
      render: (value: number, row: any) => formatValue(value, row.kpi),
      sortable: true,
    },
    {
      key: "totalCurrentValue",
      label: "Current Value",
      render: (value: number, row: any) => formatValue(value, row.kpi),
      sortable: true,
    },
    {
      key: "progressPercentage",
      label: "Progress",
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{parseFloat(value).toFixed(1)}%</span>
          {getTrendIcon(parseFloat(value))}
        </div>
      ),
      sortable: true,
    },
    {
      key: "completionRate",
      label: "Completion Rate",
      render: (value: string) => (
        <Badge variant="outline">{parseFloat(value).toFixed(1)}%</Badge>
      ),
      sortable: true,
    },
  ]

  const exportAnalytics = () => {
    if (!kpiAnalytics?.length) {
      toast.info("No analytics data to export")
      return
    }

    const headers = [
      "KPI",
      "Type",
      "Total Goals",
      "Completed",
      "In Progress",
      "Not Started",
      "Target Value",
      "Current Value",
      "Progress %",
      "Completion Rate %",
    ]

    const rows = kpiAnalytics.map((item: any) => [
      getKpiLabel(item),
      getKpiType(item),
      item.totalGoals,
      item.completedGoals,
      item.inProgressGoals,
      item.notStartedGoals,
      item.totalTargetValue,
      item.totalCurrentValue,
      item.progressPercentage,
      item.completionRate,
    ])

    const csv = [headers, ...rows].map((line) => line.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `kpi-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {kpiAnalyticsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-2 w-full rounded-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : kpiAnalyticsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl gradient-primary text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total KPIs</CardTitle>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CiViewTimeline className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{kpiAnalyticsSummary.totalKPIs}</div>
              <p className="text-xs text-white/80 mt-2">Active KPIs being tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <TbTarget className="h-4 w-4 text-gray-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-900">{kpiAnalyticsSummary.totalGoals}</div>
              <p className="text-xs text-muted-foreground mt-2">Goals across all KPIs</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl gradient-primary text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Average Progress</CardTitle>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <CiTrophy className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{parseFloat(kpiAnalyticsSummary.averageProgress).toFixed(1)}%</div>
              <div className="relative mt-2 h-2 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-white"
                  style={{ width: `${Math.min(parseFloat(kpiAnalyticsSummary.averageProgress), 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getFilterCount() > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getFilterCount()} filter{getFilterCount() !== 1 ? 's' : ''} applied
              </Badge>
              <Button
                onClick={handleResetFilters}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select 
            value={filters.kpiId} 
            onValueChange={(value) => setFilters(f => ({ ...f, kpiId: value }))}
          >
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="All KPIs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-kpis" value="all">All KPIs</SelectItem>
              {availableKPIs.map((kpi: any) => (
                <SelectItem key={`kpi-${kpi.id}`} value={kpi.id}>
                  {kpi.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.department} 
            onValueChange={(value) => setFilters(f => ({ ...f, department: value }))}
          >
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-departments" value="all">All Departments</SelectItem>
              {availableDepartments?.map((dept: any) => (
                <SelectItem key={`dept-${dept.id || dept.name}`} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DatePicker
            value={startDate}
            onChange={setStartDate}
            className="rounded-full"
          />

          <DatePicker
            value={endDate}
            onChange={setEndDate}
            className="rounded-full"
          />
        </div>
      </div>

      {/* KPI Analytics Cards */}
      {kpiAnalyticsLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                {/* Header Section Skeleton */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-4 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="text-center p-3 bg-gray-50 rounded-lg border">
                      <Skeleton className="h-4 w-20 mx-auto mb-2" />
                      <Skeleton className="h-8 w-12 mx-auto mb-2" />
                      <Skeleton className="h-1 w-full rounded-full" />
                    </div>
                  ))}
                </div>

                {/* Financial Details Skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[1, 2].map((j) => (
                    <div key={j} className="p-3 bg-gray-50 rounded-lg border">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
                </div>

                {/* Progress Section Skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full rounded-full" />
                </div>

                {/* Completion Rate Skeleton */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <div>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-7 w-32 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !kpiAnalyticsLoading && kpiAnalytics && kpiAnalytics.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {kpiAnalytics.map((item: any, index: number) => (
            <Card key={item?.kpi?.id || `unmapped-${index}`} className="rounded-2xl bg-white border hover:shadow-lg transition-all duration-300 hover:border-blue-300">
              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                      <CiViewTimeline className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getKpiLabel(item)}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                          {getKpiType(item)}
                        </Badge>
                        {getTrendIcon(getSafePercentage(item.progressPercentage))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">Total Goals</p>
                    <p className="text-3xl font-bold text-gray-900">{item.totalGoals}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Completed</p>
                    <p className="text-2xl font-semibold text-emerald-600">{item.completedGoals}</p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-emerald-500 h-1 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${getGoalShare(item.completedGoals, item.totalGoals)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">In Progress</p>
                    <p className="text-2xl font-semibold text-blue-600">{item.inProgressGoals}</p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${getGoalShare(item.inProgressGoals, item.totalGoals)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200">
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Not Started</p>
                    <p className="text-2xl font-semibold text-gray-600">{item.notStartedGoals}</p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-gray-400 h-1 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${getGoalShare(item.notStartedGoals, item.totalGoals)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Current Value</p>
                    <p className="text-2xl font-semibold text-indigo-900">
                      {formatValue(item.totalCurrentValue, item.kpi)}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Target Value</p>
                    <p className="text-2xl font-semibold text-violet-900">
                      {formatValue(item.totalTargetValue, item.kpi)}
                    </p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {getSafePercentage(item.progressPercentage).toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="relative">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out`}
                        style={{ 
                          width: `${Math.min(getSafePercentage(item.progressPercentage), 100)}%`,
                          background: getSafePercentage(item.progressPercentage) >= 80 ? 'linear-gradient(90deg, #10b981, #059669)' : 
                            getSafePercentage(item.progressPercentage) >= 60 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 
                            getSafePercentage(item.progressPercentage) >= 40 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 
                            'linear-gradient(90deg, #ef4444, #dc2626)'
                        }}
                      >
                        <div className="h-full w-full animate-pulse opacity-20 bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Completion Rate</p>
                    <p className="text-lg font-semibold text-gray-900">{getSafePercentage(item.completionRate).toFixed(1)}%</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-sm px-3 py-1 ${
                      getSafePercentage(item.completionRate) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      getSafePercentage(item.completionRate) >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      getSafePercentage(item.completionRate) >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {getSafePercentage(item.completionRate).toFixed(1)}% Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    
    </div>
  )
}
