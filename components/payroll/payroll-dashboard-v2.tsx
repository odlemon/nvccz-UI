"use client"

import { useState, useMemo, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { fetchPayrollDashboard } from "@/lib/store/slices/payrollSlice"
import { departmentApiService, type Department } from "@/lib/api/department-api"
import { PayrollDashboardSkeleton } from "./payroll-dashboard-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import {
    Calendar,
    MoreVertical,
    Download,
    Plus,
    Search,
    ArrowUpRight,
} from "lucide-react"

export function PayrollDashboardV2() {
    const dispatch = useDispatch<AppDispatch>()
    const { dashboardData, dashboardLoading } = useSelector((state: RootState) => state.payroll)
    
    const [showAlert, setShowAlert] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [selectedMonth, setSelectedMonth] = useState("all")
    const [selectedYear, setSelectedYear] = useState("2026")
    const [departments, setDepartments] = useState<Department[]>([])

    // Fetch dashboard data on mount and when filters change
    useEffect(() => {
        dispatch(fetchPayrollDashboard({
            month: selectedMonth !== "all" ? parseInt(selectedMonth) : undefined,
            year: parseInt(selectedYear),
            currencyId: 'USD'
        }))
    }, [dispatch, selectedMonth, selectedYear])

    // Load real system departments for the filter
    useEffect(() => {
        let cancelled = false
        departmentApiService
            .getDepartments({ isActive: true })
            .then((res) => {
                if (cancelled) return
                setDepartments(res?.departments || [])
            })
            .catch(() => {
                if (!cancelled) setDepartments([])
            })
        return () => {
            cancelled = true
        }
    }, [])

    // Use only API data - Define all hooks BEFORE conditional returns
    const totalPayrollValue = dashboardData?.metrics?.totalPayrollThisMonth?.value || 0
    const totalPayrollChange = dashboardData?.metrics?.totalPayrollThisMonth?.changePercent || 0
    const totalEmployeesValue = dashboardData?.metrics?.totalEmployeesPaid?.value || 0
    const totalEmployeesChange = dashboardData?.metrics?.totalEmployeesPaid?.change || 0
    const averageSalaryValue = dashboardData?.metrics?.averageSalary?.value || 0
    const averageSalaryChange = dashboardData?.metrics?.averageSalary?.change || 0
    const monthlyTrendData = dashboardData?.monthlyTrend?.map((item: any) => ({
        month: item.month,
        value: item.totalPayroll
    })) || []
    const deptDistribution = dashboardData?.departmentDistribution || []
    const payrollList = dashboardData?.payrollList || []

    // Filter payroll list based on search and filters
    const filteredPayroll = payrollList.filter((item: any) => {
        const matchesSearch = searchQuery === "" || item.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDepartment =
            selectedDepartment === "all" ||
            (item.department || "").toLowerCase() === selectedDepartment.toLowerCase()
        const matchesStatus = selectedStatus === "all" || item.status?.toLowerCase() === selectedStatus.toLowerCase()
        return matchesSearch && matchesDepartment && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Paid":
                return <Badge className="bg-[#dcfce7] text-[#15803d] hover:bg-[#dcfce7] rounded-full px-3">Paid</Badge>
            case "Pending":
                return <Badge className="bg-[#fef3c7] text-[#b45309] hover:bg-[#fef3c7] rounded-full px-3">Pending</Badge>
            case "Processing":
                return <Badge className="bg-[#dbeafe] text-[#1d4ed8] hover:bg-[#dbeafe] rounded-full px-3">Processing</Badge>
            default:
                return <Badge variant="outline" className="rounded-full px-3">{status}</Badge>
        }
    }

    // Show skeleton while loading - AFTER all hooks
    if (dashboardLoading) {
        return <PayrollDashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-[#F6F6F6] p-6 -m-6">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Page Header & Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <h1 className="text-xl font-bold text-foreground">Payroll Overview</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[140px] h-11 bg-white border-gray-200 rounded-full shadow-none font-semibold text-xs ring-0 focus:ring-0">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                                <SelectItem value="all">All Months</SelectItem>
                                <SelectItem value="1">January</SelectItem>
                                <SelectItem value="2">February</SelectItem>
                                <SelectItem value="3">March</SelectItem>
                                <SelectItem value="4">April</SelectItem>
                                <SelectItem value="10">October</SelectItem>
                                <SelectItem value="11">November</SelectItem>
                                <SelectItem value="12">December</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[120px] h-11 bg-white border-gray-200 rounded-full shadow-none font-semibold text-xs ring-0 focus:ring-0">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                                <SelectItem value="all">All Years</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" className="h-11 px-5 rounded-full gap-2 border-gray-200 bg-white hover:bg-gray-50 font-semibold text-xs shadow-none group">
                            <Download className="w-4 h-4 group-hover:translate-y-[-1px] transition-transform" />
                            Export Payroll
                        </Button>
                        <Button className="h-11 px-6 rounded-full gap-2 bg-[#4f77ff] hover:bg-[#4f77ff]/90 font-semibold text-xs shadow-md">
                            <Plus className="w-4 h-4" />
                            Add a New Payroll
                        </Button>
                    </div>
                </div>

                {/* Stats Section - Inline Layout */}
                <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            {/* Total Payroll */}
                            <div className="flex-1 w-full p-6 py-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Payroll This Month</span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">${totalPayrollValue.toLocaleString()}</p>
                                    {totalPayrollChange !== 0 && (
                                        <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${totalPayrollChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                            <ArrowUpRight className={`w-3 h-3 ${totalPayrollChange < 0 ? 'rotate-90' : ''}`} />
                                            {totalPayrollChange > 0 ? '+' : ''}{totalPayrollChange.toFixed(1)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Total Employees */}
                            <div className="flex-1 w-full p-6 py-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Employees Paid</span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">{totalEmployeesValue}</p>
                                    {totalEmployeesChange !== 0 && (
                                        <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${totalEmployeesChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                            <ArrowUpRight className={`w-3 h-3 ${totalEmployeesChange < 0 ? 'rotate-90' : ''}`} />
                                            {totalEmployeesChange > 0 ? '+' : ''}{totalEmployeesChange}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Average Salary */}
                            <div className="flex-1 w-full p-6 py-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Average Salary</span>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">${Math.round(averageSalaryValue).toLocaleString()}</p>
                                    {averageSalaryChange !== 0 && (
                                        <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-full ${averageSalaryChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                            <ArrowUpRight className={`w-3 h-3 ${averageSalaryChange < 0 ? 'rotate-90' : ''}`} />
                                            {averageSalaryChange > 0 ? '+' : ''}${Math.round(averageSalaryChange).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Payroll Trend */}
                    <Card className="bg-white border-none rounded-xl shadow-none">
                        <CardHeader className="pb-0 pt-6 px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-foreground">Monthly Payroll Trend</CardTitle>
                                    <div className="mt-4">
                                        <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">${totalPayrollValue.toLocaleString()}</p>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                                            {totalPayrollChange !== 0 ? (
                                                <>
                                                    <span className={`font-bold ${totalPayrollChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {totalPayrollChange > 0 ? '+' : ''}{totalPayrollChange.toFixed(1)}%
                                                    </span> from last month
                                                </>
                                            ) : (
                                                'No change from last month'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {monthlyTrendData.length > 0 && monthlyTrendData.some((d: any) => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis hide domain={['dataMin - 20000', 'dataMax + 20000']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ display: 'none' }}
                                            formatter={(v?: number) => v ? [`$${v.toLocaleString()}`, 'Payroll'] : ['', '']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#262626"
                                            strokeWidth={3}
                                            dot={{ fill: 'white', stroke: '#262626', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#262626' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[220px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <LineChart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No payroll trend data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Monthly payroll trends will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payroll Distribution by Department */}
                    <Card className="bg-white border-none rounded-xl shadow-none">
                        <CardHeader className="pb-0 pt-6 px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-foreground">Department Distribution</CardTitle>
                                    <div className="mt-4">
                                        <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">${totalPayrollValue.toLocaleString()}</p>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                                            {totalPayrollChange !== 0 ? (
                                                <>
                                                    <span className={`font-bold ${totalPayrollChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {totalPayrollChange > 0 ? '+' : ''}{totalPayrollChange.toFixed(1)}%
                                                    </span> from last month
                                                </>
                                            ) : (
                                                'No change from last month'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {deptDistribution.length > 0 && (
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#4f77ff]"></div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Salary</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#4f77ff]/20"></div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bonus</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {deptDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={deptDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="department"
                                            tick={{ fontSize: 10, fontWeight: '600', fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="salary" fill="#4f77ff" radius={[10, 10, 10, 10]} maxBarSize={48} />
                                        <Bar dataKey="bonus" fill="#4f77ff20" radius={[10, 10, 10, 10]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[220px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <BarChart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No department distribution data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Department payroll distribution will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payroll List */}
                <Card className="bg-white border-none rounded-xl shadow-none mt-6">
                    <CardHeader className="px-6 pt-6 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">Payroll List</CardTitle>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employee"
                                        className="pl-9 h-10 w-48 rounded-full border-gray-200 bg-white shadow-none text-xs font-semibold ring-0 focus:ring-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-48 h-10 rounded-full border-gray-200 bg-white shadow-none text-xs font-bold ring-0 focus:ring-0">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.name}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger className="w-32 h-10 rounded-full border-gray-200 bg-white shadow-none text-xs font-bold ring-0 focus:ring-0">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground">
                                        <input type="checkbox" className="rounded border-border" />
                                    </TableHead>
                                    <TableHead className="text-muted-foreground">Name</TableHead>
                                    <TableHead className="text-muted-foreground">Department</TableHead>
                                    <TableHead className="text-muted-foreground">Pay Date</TableHead>
                                    <TableHead className="text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-muted-foreground">Base Salary</TableHead>
                                    <TableHead className="text-muted-foreground">Bonuses</TableHead>
                                    <TableHead className="text-muted-foreground">Total Salary</TableHead>
                                    <TableHead className="text-muted-foreground">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayroll.length > 0 ? (
                                    filteredPayroll.map((employee: any) => (
                                        <TableRow key={employee.employeeId} className="border-border">
                                            <TableCell>
                                                <input type="checkbox" className="rounded border-border" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="bg-muted text-foreground text-xs">
                                                            {employee.name?.substring(0, 2).toUpperCase() || 'EM'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-foreground">{employee.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{employee.department}</TableCell>
                                            <TableCell className="text-muted-foreground">{employee.payDate || '-'}</TableCell>
                                            <TableCell>{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell className="text-foreground">${employee.baseSalary?.toLocaleString() || 0}</TableCell>
                                            <TableCell className="text-foreground">${employee.bonuses?.toLocaleString() || 0}</TableCell>
                                            <TableCell className="font-semibold text-foreground">${employee.totalSalary?.toLocaleString() || 0}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            No payroll records found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
