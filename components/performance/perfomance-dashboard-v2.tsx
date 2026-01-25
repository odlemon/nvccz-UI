"use client"

import { useState, useMemo } from "react"

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

// Localized Dummy Data Generator
const ZIM_NAMES = ["Tendai Makoni", "Rumbidzai Moyo", "Tinashe Chigumba", "Farai Mutasa", "Nomsa Sibanda", "Blessing Shumba", "Chipo Gumbo", "Kudakwashe Zhou"]
const ZIM_ROLES = ["IT Specialist", "Operations Manager", "HR Analyst", "Finance Lead", "UI/UX Designer", "Software Engineer", "Marketing Lead"]

const generateStats = (seed: string) => {
    // Deterministic random behavior based on filter seed
    const hash = seed.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
    return {
        pendingTasks: { value: 15 + (hash % 20), change: "+11%", progress: 15 + (hash % 15), total: 50 },
        inProgress: { value: 10 + (hash % 15), change: "+9%", progress: 10 + (hash % 10), total: 50 },
        completed: { value: 25 + (hash % 25), change: "-16%", progress: 25 + (hash % 15), total: 50 },
        completionRate: { value: `${20 + (hash % 40)}%`, change: "+12%", progress: 20 + (hash % 40), total: 100 },
    }
}

const generateProductivityData = (monthSeed: string) => {
    const months = ["Jan", "Feb", "Mar", "Apl", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map(m => ({
        month: m,
        tasks: 20 + Math.floor(Math.random() * 30),
        isCurrent: m === monthSeed.substring(0, 3)
    }))
}

const generateDistribution = (seed: string) => {
    const hash = seed.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
    const baseLine = 20 + (hash % 20)
    return [
        { name: "High Performers", value: baseLine, color: "#1a1a1a" },
        { name: "Average", value: Math.max(10, 100 - baseLine - 30), color: "#666666" },
        { name: "Need Improvement", value: 30, color: "#e5e5e5" },
    ]
}

const generateWorkerInsights = () => {
    return [
        { id: 1, name: "Tendai Makoni", type: "Full Time", role: "IT Specialist", progress: 75, tasks: 42 },
        { id: 2, name: "Rumbidzai Moyo", type: "Remote", role: "HR Analyst", progress: 65, tasks: 32 },
        { id: 3, name: "Tinashe Chigumba", type: "Full Time", role: "Operations Manager", progress: 85, tasks: 27 },
        { id: 4, name: "Farai Mutasa", type: "Part Time", role: "Finance Lead", progress: 55, tasks: 14 },
    ]
}

const BUDGET_DATA = {
    totalBudget: 120000,
    totalSpend: 95000,
    remaining: 25000,
}

const EMPLOYEE_OF_THE_MONTH = {
    name: "Nomsa Sibanda",
    role: "Senior UI/UX Designer",
    totalTimeWorked: "14 hours 15 minutes",
    activeTime: 80,
    extraTime: 12,
    pauseTime: 8,
    email: "nomsa.sibanda@techzim.co.zw",
    phone: "+263 77 123 4567",
}

export function PerformanceDashboardV2() {
    const [selectedPeriod, setSelectedPeriod] = useState("This Month")
    const [selectedEntity, setSelectedEntity] = useState("Global")
    const [selectedYear, setSelectedYear] = useState("2026")
    const [selectedMonth, setSelectedMonth] = useState("January")

    const statsData = useMemo(() => generateStats(selectedPeriod + selectedMonth + selectedYear), [selectedPeriod, selectedMonth, selectedYear])
    const monthlyProductivityData = useMemo(() => generateProductivityData(selectedMonth), [selectedMonth])
    const performanceDistribution = useMemo(() => generateDistribution(selectedPeriod + selectedMonth), [selectedPeriod, selectedMonth])
    const workerInsights = useMemo(() => generateWorkerInsights(), []) // Could also vary based on entity

    // Calculate gauge angle for budget tracker
    const budgetPercentage = (BUDGET_DATA.totalSpend / BUDGET_DATA.totalBudget) * 100
    const gaugeAngle = (budgetPercentage / 100) * 180

    return (
        <div className="min-h-screen bg-[#F6F6F6] p-6 -m-6">
            <div className="space-y-4">
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-white rounded-full p-1 border border-gray-200">
                            {["This Week", "This Month", "This Year"].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setSelectedPeriod(p)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${selectedPeriod === p ? "bg-[#262626] text-white" : "text-muted-foreground hover:bg-gray-50"}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                            <SelectTrigger className="w-[140px] h-9 bg-white border-gray-200 rounded-full shadow-none font-bold text-xs ring-0 focus:ring-0">
                                <SelectValue placeholder="Select Entity" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                <SelectItem value="Global" className="font-medium text-xs">Global</SelectItem>
                                <SelectItem value="TechZim" className="font-medium text-xs">TechZim HQ</SelectItem>
                                <SelectItem value="Bulawayo" className="font-medium text-xs">Bulawayo Branch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
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
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 rounded-full shadow-none font-bold text-xs ring-0 focus:ring-0">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                    <SelectItem key={m} value={m} className="font-medium text-xs">{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Pending Tasks */}
                    <div className="bg-white border-none rounded-xl shadow-none">
                        <CardContent className="px-5 py-3">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Pending Tasks</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">{statsData.pendingTasks.value}</span>
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
                                            className={`h-4 w-1 rounded-sm ${i < statsData.pendingTasks.progress ? "bg-foreground" : "bg-muted"}`}
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
                                    <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">{statsData.inProgress.value}</span>
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
                                            className={`h-4 w-1 rounded-sm ${i < statsData.inProgress.progress ? "bg-foreground" : "bg-muted"}`}
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
                                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">{statsData.completed.value}</span>
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
                                            className={`h-4 w-1 rounded-sm ${i < statsData.completed.progress ? "bg-foreground" : "bg-muted"}`}
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
                                    <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-foreground">{statsData.completionRate.value}</span>
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
                                            className={`h-4 w-1 rounded-sm ${i < statsData.completionRate.progress / 2 ? "bg-foreground" : "bg-muted"}`}
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
                                    <p className="text-sm text-muted-foreground">Track task progress and completion rates over time.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-foreground"></div>
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyProductivityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={({ x, y, payload }) => {
                                            const entry = monthlyProductivityData.find(m => m.month === payload.value);
                                            const isCurrent = entry?.isCurrent;
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <rect
                                                        x={-20}
                                                        y={15}
                                                        width={40}
                                                        height={22}
                                                        rx={11}
                                                        fill={isCurrent ? "#1a1a1a" : "#F5F5F5"}
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
                                        tick={{ fontSize: 12, fill: '#666' }}
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
                                        {monthlyProductivityData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.isCurrent ? "#1a1a1a" : "#F5F5F5"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
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
                                                {performanceDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-row justify-center gap-8 w-full">
                                    {performanceDistribution.map((item) => (
                                        <div key={item.name} className="flex items-center gap-3">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <div className="flex flex-col">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{item.name}</p>
                                                <p className="text-lg font-bold text-foreground leading-tight">{item.value}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                            <div className="space-y-4">
                                {workerInsights.map((worker) => (
                                    <div key={worker.id} className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
                                                <AvatarImage src="/blank-profile-picture-973460_1280.webp" />
                                                <AvatarFallback className="bg-muted text-foreground text-sm rounded-none">
                                                    {worker.name.split(' ').map(n => n[0]).join('')}
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
                                                            backgroundColor: '#262626',
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
                                            strokeDasharray={`${(budgetPercentage / 100) * 251.2} 251.2`}
                                        />
                                        <defs>
                                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#e5e5e5" />
                                                <stop offset="50%" stopColor="#666666" />
                                                <stop offset="100%" stopColor="#1a1a1a" />
                                            </linearGradient>
                                        </defs>
                                        {/* Tick marks */}
                                        {[0, 25, 50, 75, 100].map((tick, i) => {
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
                                            x2={100 + 55 * Math.cos(((gaugeAngle - 180) * Math.PI) / 180)}
                                            y2={90 + 55 * Math.sin(((gaugeAngle - 180) * Math.PI) / 180)}
                                            stroke="#1a1a1a"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                        <circle cx="100" cy="90" r="6" fill="#1a1a1a" />
                                    </svg>
                                    {/* Labels */}
                                    <span className="absolute -left-6 bottom-0 text-[10px] font-bold text-muted-foreground">0k</span>
                                    <span className="absolute -left-8 top-4 text-[10px] font-bold text-muted-foreground">20k</span>
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-6 text-[10px] font-bold text-muted-foreground">40k</span>
                                    <span className="absolute -right-8 top-4 text-[10px] font-bold text-muted-foreground">60k</span>
                                    <span className="absolute -right-6 bottom-0 text-[10px] font-bold text-muted-foreground">80k</span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 w-full text-center">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Budget</p>
                                        <p className="font-semibold text-foreground">${BUDGET_DATA.totalBudget.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total Spend</p>
                                        <p className="font-semibold text-foreground">${BUDGET_DATA.totalSpend.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Remaining</p>
                                        <p className="font-semibold text-foreground">${BUDGET_DATA.remaining.toLocaleString()}</p>
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
                                            <h3 className="text-lg font-bold text-foreground leading-tight">{EMPLOYEE_OF_THE_MONTH.name}</h3>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{EMPLOYEE_OF_THE_MONTH.role}</p>
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
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total time worked</span>
                                    <span className="text-sm font-bold text-foreground">{EMPLOYEE_OF_THE_MONTH.totalTimeWorked}</span>
                                </div>

                                <div className="space-y-4">
                                    {/* Multi-segment Striped Progress Bar */}
                                    <div className="w-full h-6 bg-gray-50 rounded-xl overflow-hidden flex p-1 gap-1">
                                        <div
                                            className="h-full rounded-lg"
                                            style={{
                                                width: `${EMPLOYEE_OF_THE_MONTH.activeTime}%`,
                                                backgroundColor: '#262626',
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                            }}
                                        />
                                        <div
                                            className="h-full rounded-lg opacity-40"
                                            style={{
                                                width: `${EMPLOYEE_OF_THE_MONTH.extraTime}%`,
                                                backgroundColor: '#262626',
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                            }}
                                        />
                                        <div
                                            className="h-full rounded-lg opacity-10"
                                            style={{
                                                width: `${EMPLOYEE_OF_THE_MONTH.pauseTime}%`,
                                                backgroundColor: '#262626',
                                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)'
                                            }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Time</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Extra Time</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pause Time</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground w-12 uppercase">Email</span>
                                        <span className="text-xs font-bold text-foreground">{EMPLOYEE_OF_THE_MONTH.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground w-12 uppercase">Phone</span>
                                        <span className="text-xs font-bold text-foreground">{EMPLOYEE_OF_THE_MONTH.phone}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
