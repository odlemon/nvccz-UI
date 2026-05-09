"use client"

import { useState, useMemo, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { fetchPerformanceDashboard } from "@/lib/store/slices/performanceSlice"
import { PerformanceDashboardSkeleton } from "./performance-dashboard-skeleton"
import { VisionBanner } from "./configuration/vision-banner"
import { KPIPerformanceAnalysisTab } from "./kpi-performance-analysis-tab"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import {
    Settings,
    X,
    CheckSquare,
    BarChart3,
    Calendar,
    Expand,
    Circle,
    ArrowUpRight,
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { HiDivide } from "react-icons/hi2"

export function PerformanceDashboardV2() {
    const dispatch = useDispatch<AppDispatch>()
    const { performanceDashboardData, performanceDashboardLoading } = useSelector((state: RootState) => state.performance)
    
    console.log('Redux State - Performance:', { performanceDashboardData, performanceDashboardLoading })
    
    // current yearh and month for default filter values
    const currentDate = new Date()    
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

    //current month name for default filter value
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const [selectedMonth, setSelectedMonth] = useState(monthNames[currentDate.getMonth()])

    // const [selectedYear, setSelectedYear] = useState("2026")
    // const [selectedMonth, setSelectedMonth] = useState("January")
    const [activeView, setActiveView] = useState<"dashboard" | "kpi-analytics">("dashboard")

    // Fetch dashboard data on mount and when filters change
    useEffect(() => {
        const monthNum = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selectedMonth) + 1
        console.log('Dispatching fetchPerformanceDashboard with:', { month: monthNum, year: parseInt(selectedYear) })
        dispatch(fetchPerformanceDashboard({
            month: monthNum,
            year: parseInt(selectedYear)
        }))
    }, [dispatch, selectedMonth, selectedYear])

    // Use only API data - Define all before conditional returns
    // Handle both direct data and nested data structure
    const rawData = performanceDashboardData as any
    const dashboardData = rawData?.data || rawData
    
    // Debug logging
    console.log('Performance Dashboard Debug:', {
        hasRawData: !!rawData,
        hasData: !!dashboardData,
        rawDataKeys: rawData ? Object.keys(rawData) : [],
        summaryCardsValue: rawData?.summaryCards,
        nestedSummaryCards: rawData?.data?.summaryCards
    })
    
    // Extract summary cards data
    const summaryCards = dashboardData?.summaryCards || {}
    const statsData = {
        pendingTasks: {
            value: summaryCards?.pendingTasks?.value || 0,
            change: summaryCards?.pendingTasks?.changePercent ? `${summaryCards.pendingTasks.changePercent > 0 ? '+' : ''}${summaryCards.pendingTasks.changePercent}%` : "+0%",
            progress: summaryCards?.pendingTasks?.progress ? summaryCards.pendingTasks.progress * 100 : 0,
            total: summaryCards?.pendingTasks?.total ?? 0
        },
        inProgress: {
            value: summaryCards?.inProgress?.value || 0,
            change: summaryCards?.inProgress?.changePercent ? `${summaryCards.inProgress.changePercent > 0 ? '+' : ''}${summaryCards.inProgress.changePercent}%` : "+0%",
            progress: summaryCards?.inProgress?.progress ? summaryCards.inProgress.progress * 100 : 0,
            total: summaryCards?.inProgress?.total ?? 0
        },
        completed: {
            value: summaryCards?.completed?.value || 0,
            change: summaryCards?.completed?.changePercent ? `${summaryCards.completed.changePercent > 0 ? '+' : ''}${summaryCards.completed.changePercent}%` : "-0%",
            progress: summaryCards?.completed?.progress ? summaryCards.completed.progress * 100 : 0,
            total: summaryCards?.completed?.total ?? 0
        },
        completionRate: { 
            value: `${summaryCards?.completionRate?.value || 0}%`, 
            change: summaryCards?.completionRate?.changePercent ? `${summaryCards.completionRate.changePercent > 0 ? '+' : ''}${summaryCards.completionRate.changePercent}%` : "+0%", 
            progress: summaryCards?.completionRate?.value || 0, 
            total: 100 
        },
    }

    // Extract monthly productivity data and mark current month
    const currentMonth = dashboardData?.period?.currentMonth || new Date().getMonth() + 1
    const currentYear = dashboardData?.period?.currentYear || new Date().getFullYear()

    // Always render Jan -> Dec calendar order for the selected year.
    // Backend may return a rolling 12-month window; we map it onto a fixed
    // calendar grid so the X-axis is always Jan, Feb, Mar ... Dec.
    const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const apiMonthlyRows: any[] = dashboardData?.monthlyProductivity?.data || []
    const targetYear = parseInt(selectedYear) || currentYear
    const monthlyProductivityData = MONTH_LABELS.map((label, idx) => {
        const monthNumber = idx + 1
        // Prefer exact match for the selected year; fall back to month-only match
        // (the rolling window from the API may not include the full target year)
        const exact = apiMonthlyRows.find(
            (r: any) => r?.monthNumber === monthNumber && r?.year === targetYear
        )
        const monthOnly = exact
            ? null
            : apiMonthlyRows.find((r: any) => r?.monthNumber === monthNumber)
        const item = exact || monthOnly || { monthNumber, year: targetYear, taskCompletedRate: 0 }
        return {
            ...item,
            month: label,
            monthNumber,
            tasks: item.taskCompletedRate || 0,
            isCurrent: monthNumber === currentMonth && (item.year || targetYear) === currentYear,
        }
    })

    // Extract performance distribution and convert to array format for pie chart
    const perfDist = dashboardData?.performanceDistribution || {}
    const performanceDistribution = [
        { name: 'High Performers', value: perfDist.highPerformers || 0, color: '#4c1d95' },
        { name: 'Average', value: perfDist.average || 0, color: '#8b5cf6' },
        { name: 'Need Improvement', value: perfDist.needImprovement || 0, color: '#c4b5fd' }
    ].filter(item => item.value > 0)

    // Extract worker performance
    const workerInsights = (dashboardData?.workerPerformance || []).slice(0, 5).map((worker: any, index: number) => ({
        id: worker.userId || index,
        name: worker.name || 'Unknown',
        role: worker.department || worker.role || 'N/A',
        tasks: worker.taskCount || 0,
        progress: worker.progressPercentage || 0
    }))

    // Extract budget data
    const budgetTracker = dashboardData?.budgetTracker || {}
    const budgetData = {
        totalBudget: budgetTracker.totalBudget || 0,
        totalSpend: budgetTracker.totalSpend || 0,
        remaining: budgetTracker.remaining || 0
    }

    // Extract employee of the month
    const eotm = dashboardData?.employeeOfTheMonth || {}
    const employeeOfMonth = {
        name: eotm.name || "",
        role: eotm.department || eotm.role || "",
        email: eotm.email || "",
        taskCount: eotm.taskCount || 0,
        tasksCompleted: eotm.tasksCompleted || 0,
        tasksInProgress: eotm.tasksInProgress || 0,
        tasksPending: eotm.tasksPending || 0,
        completionRate: eotm.completionRate || 0
    }

    // Calculate task percentages for employee of the month
    const totalTasks = employeeOfMonth.taskCount
    const completedPercent = totalTasks > 0 ? (employeeOfMonth.tasksCompleted / totalTasks) * 100 : 0
    const inProgressPercent = totalTasks > 0 ? (employeeOfMonth.tasksInProgress / totalTasks) * 100 : 0
    const pendingPercent = totalTasks > 0 ? (employeeOfMonth.tasksPending / totalTasks) * 100 : 0

    const budgetPercentage = budgetData.totalBudget > 0 ? (budgetData.totalSpend / budgetData.totalBudget) * 100 : 0
    const gaugeAngle = (budgetPercentage / 100) * 180

    // Show skeleton while loading - AFTER all hooks
    if (performanceDashboardLoading) {
        return <PerformanceDashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-[#F6F6F6] p-6 -m-6">
            <div className="space-y-4">
                {/* Vision Banner */}
                <VisionBanner />

                {/* View Switch */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">View</span>
                        <div className="flex bg-white rounded-full p-1 border border-gray-200">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-full h-8 px-4 text-xs font-semibold ${activeView === "dashboard" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                onClick={() => setActiveView("dashboard")}
                            >
                                Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`rounded-full h-8 px-4 text-xs font-semibold ${activeView === "kpi-analytics" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                onClick={() => setActiveView("kpi-analytics")}
                            >
                                KPI Analytics
                            </Button>
                        </div>
                    </div>
                </div>

                {activeView === "dashboard" && (
                <>
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-start gap-3 mb-4">

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[120px] h-9 bg-white border-gray-200 rounded-full shadow-none font-bold text-xs ring-0 focus:ring-0">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                            <SelectItem value="All" className="font-medium text-xs">All Months</SelectItem>
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                <SelectItem key={m} value={m} className="font-medium text-xs">{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 rounded-full shadow-none font-bold text-xs ring-0 focus:ring-0">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                            <SelectItem value="2026" className="font-medium text-xs">2026</SelectItem>
                            <SelectItem value="2025" className="font-medium text-xs">2025</SelectItem>
                            <SelectItem value="2024" className="font-medium text-xs">2024</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Pending Tasks */}
                    <div className="bg-white border-none rounded-xl shadow-none">
                        <CardContent className="px-5 py-3">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Pending Tasks</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-normal text-foreground tracking-tight">{statsData.pendingTasks.value}</span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <span className="text-foreground">↗</span> {statsData.pendingTasks.change} from last month
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Pending Tasks</span>
                                    <span>{statsData.pendingTasks.progress}/{statsData.pendingTasks.total}</span>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-4 w-1 rounded-sm ${i < (statsData.pendingTasks.progress / 2) ? "bg-[#4c1d95]" : "bg-muted"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white border-none rounded-xl shadow-none">
                        <CardContent className="px-5 py-3">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">In Progress</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-normal text-foreground tracking-tight">{statsData.inProgress.value}</span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <span className="text-foreground">↗</span> {statsData.inProgress.change} from last month
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>In progress</span>
                                    <span>{statsData.inProgress.progress}/{statsData.inProgress.total}</span>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-4 w-1 rounded-sm ${i < (statsData.inProgress.progress / 2) ? "bg-[#4c1d95]" : "bg-muted"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </div>

                    {/* Completed */}
                    <div className="bg-white border-none rounded-xl shadow-none">
                        <CardContent className="px-5 py-3">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-normal text-foreground tracking-tight">{statsData.completed.value}</span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <span className="text-foreground">↘</span> {statsData.completed.change} from last month
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <CheckSquare className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Completed</span>
                                    <span>{statsData.completed.progress}/{statsData.completed.total}</span>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-4 w-1 rounded-sm ${i < (statsData.completed.progress / 2) ? "bg-[#4c1d95]" : "bg-muted"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white border-none rounded-xl shadow-none">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Completion Rate</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-normal text-foreground tracking-tight">{statsData.completionRate.value}</span>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <span className="text-foreground">↗</span> {statsData.completionRate.change} from last month
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Completion Rate</span>
                                    <span>{statsData.completionRate.progress}%</span>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-4 w-1 rounded-sm ${i < statsData.completionRate.progress / 2 ? "bg-[#4c1d95]" : "bg-muted"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Monthly Productivity Overview */}
                    <div className="bg-white border-none rounded-xl py-3 lg:col-span-2 shadow-none">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-foreground">Monthly Productivity Overview</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">Track task progress and completion rates over time.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#4c1d95]"></div>
                                        <span className="text-sm text-muted-foreground">Task Completed Rate</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Expand className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {monthlyProductivityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyProductivityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={({ x, y, payload }) => {
                                            const entry = monthlyProductivityData.find((m: any) => m.month === payload.value);
                                            const isCurrent = entry?.isCurrent;
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <rect
                                                        x={-20}
                                                        y={15}
                                                        width={40}
                                                        height={22}
                                                        rx={11}
                                                        fill={isCurrent ? "#4c1d95" : "#F5F5F5"}
                                                    />
                                                    <text
                                                        x={0}
                                                        y={30}
                                                        textAnchor="middle"
                                                        fill={isCurrent ? "#ffffff" : "#666"}
                                                        style={{ fontSize: 10, fontWeight: isCurrent ? 'bold' : 'normal', fontFamily: 'Inter' }}
                                                    >
                                                        {payload.value}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        height={60}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={[0, 60]}
                                        ticks={[10, 20, 30, 40, 50]}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-foreground text-background px-3 py-2 rounded-lg shadow-lg">
                                                        <p className="font-semibold">{payload[0].value} Tasks</p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar
                                        dataKey="tasks"
                                        radius={[6, 6, 6, 6]}
                                        maxBarSize={32}
                                    >
                                        {monthlyProductivityData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.isCurrent ? "#4c1d95" : "#ede9fe"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <BarChart3 className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No productivity data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Monthly productivity data will appear here when available</p>
                                </div>
                            )}                        </CardContent>
                    </div>

                    {/* Performance Distribution */}
                    <div className="bg-white border-none rounded-xl shadow-none py-3">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Performance Distribution</CardTitle>
                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {performanceDistribution.some((item: any) => item.value > 0) ? (
                            <div className="flex flex-col items-center py-4">
                                <div className="relative w-48 h-48 mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={performanceDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={85}
                                                paddingAngle={2}
                                                dataKey="value"
                                                startAngle={90}
                                                endAngle={-270}
                                            >
                                                {performanceDistribution.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-row flex-wrap justify-center gap-x-4 gap-y-2 w-full">
                                    {performanceDistribution.map((item: any) => (
                                        <div key={item.name} className="flex items-center gap-2 min-w-0">
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight truncate">{item.name}</p>
                                                <p className="text-sm font-semibold text-foreground mt-0.5 tracking-tight">{item.value}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <Circle className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No performance distribution data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Performance distribution will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Worker Performance Insights */}
                    <Card className="bg-white border-none rounded-xl shadow-none">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Worker Performance Insights</CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg">
                                    Manage
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {workerInsights.length > 0 ? (
                            <div className="space-y-4">
                                {workerInsights.map((worker: any) => (
                                    <div key={worker.id} className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
                                                <AvatarImage src="/blank-profile-picture-973460_1280.webp" />
                                                <AvatarFallback className="bg-muted text-foreground text-sm rounded-none">
                                                    {worker.name.split(' ').map((n: string) => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex items-center gap-4">
                                            <div className="w-28 flex-shrink-0">
                                                <p className="font-bold text-foreground text-sm truncate">{worker.name}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{worker.role}</p>
                                            </div>

                                            <div className="flex-1 flex items-center gap-2">
                                                {/* Thinner Striped Progress Bar */}
                                                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden flex items-center p-0.5">
                                                    <div
                                                        className="h-full rounded relative flex items-center px-2 min-w-[50px]"
                                                        style={{
                                                            width: `${worker.progress + 20}%`,
                                                            backgroundColor: worker.id % 2 === 0 ? '#4c1d95' : '#6d28d9',
                                                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                                        }}
                                                    >
                                                        <span className="text-[8px] font-bold text-white whitespace-nowrap">{worker.tasks} Tasks</span>
                                                    </div>
                                                </div>
                                                {/* Percentage Badge with Actual Icon */}
                                                <div className="flex items-center gap-1 bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm flex-shrink-0">
                                                    <span className="text-[9px] font-bold text-[#262626]">{worker.progress}%</span>
                                                    <ArrowUpRight className="w-2.5 h-2.5 text-[#262626]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <CheckSquare className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No worker data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Worker performance insights will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Budget Tracker */}
                    <Card className="bg-white border-none rounded-xl shadow-none">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Budget Tracker</CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg">
                                    Manage
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center">
                                {/* Gauge Chart */}
                                <div className="relative w-52 h-28 mb-4">
                                    <svg viewBox="0 0 200 100" className="w-full h-full">
                                        {/* Background arc */}
                                        <path
                                            d="M 20 90 A 80 80 0 0 1 180 90"
                                            fill="none"
                                            stroke="#e5e5e5"
                                            strokeWidth="20"
                                            strokeLinecap="round"
                                        />
                                        {/* Progress arc */}
                                        <path
                                            d="M 20 90 A 80 80 0 0 1 180 90"
                                            fill="none"
                                            stroke="url(#gaugeGradient)"
                                            strokeWidth="20"
                                            strokeLinecap="round"
                                            strokeDasharray={`${Math.min(100, budgetPercentage) / 100 * 251.2} 251.2`}
                                        />
                                        <defs>
                                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#a78bfa" />
                                                <stop offset="50%" stopColor="#7c3aed" />
                                                <stop offset="100%" stopColor="#4c1d95" />
                                            </linearGradient>
                                        </defs>
                                        {/* Tick marks */}
                                        {[0, 25, 50, 75, 100].map((tick) => {
                                            const angle = (tick / 100) * 180 - 180
                                            const radians = (angle * Math.PI) / 180
                                            const x1 = 100 + 60 * Math.cos(radians)
                                            const y1 = 90 + 60 * Math.sin(radians)
                                            const x2 = 100 + 70 * Math.cos(radians)
                                            const y2 = 90 + 70 * Math.sin(radians)
                                            return (
                                                <line
                                                    key={tick}
                                                    x1={x1}
                                                    y1={y1}
                                                    x2={x2}
                                                    y2={y2}
                                                    stroke="#666"
                                                    strokeWidth="2"
                                                />
                                            )
                                        })}
                                        {/* Needle */}
                                        <line
                                            x1="100"
                                            y1="90"
                                            x2={100 + 55 * Math.cos(((Math.min(180, gaugeAngle) - 180) * Math.PI) / 180)}
                                            y2={90 + 55 * Math.sin(((Math.min(180, gaugeAngle) - 180) * Math.PI) / 180)}
                                            stroke="#4c1d95"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <circle cx="100" cy="90" r="6" fill="#4c1d95" />
                                    </svg>
                                    {/* Labels */}
                                    {(() => {
                                        const formatAmt = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toString();
                                        const total = budgetData.totalBudget;
                                        return (
                                            <>
                                                <span className="absolute -left-6 bottom-0 text-[10px] font-bold text-muted-foreground">0</span>
                                                <span className="absolute -left-8 top-4 text-[10px] font-bold text-muted-foreground">{formatAmt(total * 0.25)}</span>
                                                <span className="absolute left-1/2 -translate-x-1/2 -top-6 text-[10px] font-bold text-muted-foreground">{formatAmt(total * 0.5)}</span>
                                                <span className="absolute -right-8 top-4 text-[10px] font-bold text-muted-foreground">{formatAmt(total * 0.75)}</span>
                                                <span className="absolute -right-6 bottom-0 text-[10px] font-bold text-muted-foreground">{formatAmt(total)}</span>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 w-full text-center">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
                                        <p className="text-xl font-semibold text-foreground tracking-tight">${budgetData.totalBudget.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Spend</p>
                                        <p className="text-xl font-semibold text-foreground tracking-tight">${budgetData.totalSpend.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                                        <p className="text-xl font-semibold text-foreground tracking-tight">${budgetData.remaining.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee of the Month */}
                    <Card className="bg-white border-none rounded-xl shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold text-foreground">Employee Of The Month</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4 mb-6">
                                <Avatar className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                    <AvatarImage src="/blank-profile-picture-973460_1280.webp" />
                                    <AvatarFallback className="bg-muted text-foreground text-lg rounded-none">EC</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-normal text-foreground tracking-tight leading-tight">{employeeOfMonth.name}</h3>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">{employeeOfMonth.role}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100">
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100">
                                                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tasks</span>
                                    <span className="text-sm font-semibold text-foreground">{employeeOfMonth.taskCount}</span>
                                </div>

                                <div className="space-y-4">
                                    {/* Multi-segment Striped Progress Bar */}
                                    <div className="w-full h-6 bg-gray-50 rounded-xl overflow-hidden flex p-1 gap-1">
                                        <div
                                            className="h-full rounded-lg"
                                            style={{
                                                width: `${completedPercent}%`,
                                                backgroundColor: '#4c1d95',
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                            }}
                                        />
                                        <div
                                            className="h-full rounded-lg opacity-60"
                                            style={{
                                                width: `${inProgressPercent}%`,
                                                backgroundColor: '#6d28d9',
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                            }}
                                        />
                                        <div
                                            className="h-full rounded-lg opacity-30"
                                            style={{
                                                width: `${pendingPercent}%`,
                                                backgroundColor: '#8b5cf6',
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#4c1d95]" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#6d28d9]" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Progress</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-muted-foreground w-12 uppercase">Email</span>
                                            <span className="text-xs font-bold text-foreground">{employeeOfMonth.email}</span>
                                        </div>
                                        <span className="text-xs font-bold text-[#4c1d95] bg-[#4c1d95]/10 px-2 py-1 rounded-full">{employeeOfMonth.completionRate}% Completion</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                </>
                )}

                {activeView === "kpi-analytics" && (
                    <div className="bg-white border-none rounded-xl shadow-none p-6">
                        <KPIPerformanceAnalysisTab
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                        />
                    </div>
                )}

            </div>
        </div>
    )
}
