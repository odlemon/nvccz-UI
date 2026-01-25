"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
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
    X,
    MoreVertical,
    Download,
    Plus,
    Search,
    ChevronDown,
    ArrowUpRight,
} from "lucide-react"

// Enhanced Dummy Data for Dynamic Filtering
const generatePayrollData = () => {
    const departments = ["Marketing", "Engineering", "Finance", "HR", "IT", "Operations"]
    const statuses = ["Paid", "Pending", "Processing"]
    const data = []

    // Generate data for 2025 and 2026
    for (let i = 1; i <= 50; i++) {
        const dept = departments[i % departments.length]
        const status = statuses[i % statuses.length]
        const year = i % 2 === 0 ? 2026 : 2025
        const month = (i % 12) + 1
        const baseSalary = 3000 + Math.floor(Math.random() * 4000)
        const bonuses = Math.floor(Math.random() * 1000)

        data.push({
            id: i,
            name: `Employee ${i}`,
            department: dept,
            payDate: `${month < 10 ? '0' + month : month}/25/${year}`,
            month: month,
            year: year,
            status: status,
            baseSalary: baseSalary,
            bonuses: bonuses,
            totalSalary: baseSalary + bonuses,
            avatar: ""
        })
    }
    return data
}

const payrollList = generatePayrollData()

export function PayrollDashboardV2() {
    const [showAlert, setShowAlert] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [selectedMonth, setSelectedMonth] = useState("all") // Default to All Months
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(2025, 1, 27),
        to: new Date(2025, 2, 27)
    })
    const [trendTimeframe, setTrendTimeframe] = useState("6months")

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

    const filteredPayroll = payrollList.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesDepartment = selectedDepartment === "all" || item.department.toLowerCase() === selectedDepartment.toLowerCase()
        const matchesStatus = selectedStatus === "all" || item.status.toLowerCase() === selectedStatus.toLowerCase()
        const matchesMonth = selectedMonth === "all" || item.month.toString() === selectedMonth
        return matchesSearch && matchesDepartment && matchesStatus && matchesMonth
    })

    // Dynamic Stats Calculation
    const totalPayrollValue = filteredPayroll.reduce((acc, curr) => acc + curr.totalSalary, 0)
    const totalEmployeesValue = filteredPayroll.length
    const averageSalaryValue = totalEmployeesValue > 0 ? totalPayrollValue / totalEmployeesValue : 0

    // Dynamic Chart Data
    const monthlyTrendData = useMemo(() => {
        const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
        const count = trendTimeframe === "6months" ? 6 : 12
        const selectedMonths = months.slice(-count)

        return selectedMonths.map((m, idx) => {
            if (m === "Mar") {
                return { month: m, value: totalPayrollValue > 0 ? totalPayrollValue : 295000 }
            }
            // Generate deterministic but "real" looking history
            const seed = m.charCodeAt(0) + m.charCodeAt(1)
            const baseValue = 270000 + (seed % 50) * 1000
            return { month: m, value: baseValue }
        })
    }, [trendTimeframe, totalPayrollValue])

    const deptDistribution = useMemo(() => {
        const departments = ["Marketing", "Engineering", "Finance", "HR", "IT", "Operations"]
        return departments.map(d => {
            const deptItems = filteredPayroll.filter(p => p.department === d)
            return {
                department: d,
                salary: deptItems.reduce((acc, curr) => acc + curr.baseSalary, 0),
                bonus: deptItems.reduce((acc, curr) => acc + curr.bonuses, 0)
            }
        })
    }, [filteredPayroll])

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

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 px-5 rounded-full gap-2 border-gray-200 bg-white hover:bg-gray-50 font-semibold text-xs shadow-none">
                                    <Calendar className="w-4 h-4 text-foreground" />
                                    {dateRange.from && dateRange.to
                                        ? `${format(dateRange.from, "dd MMM")} - ${format(dateRange.to, "dd MMM yyyy")}`
                                        : "Select Date Range"}
                                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                <CalendarComponent
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={{ from: dateRange.from, to: dateRange.to }}
                                    onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>

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
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="w-3 h-3" />
                                        +8.2%
                                    </span>
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
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="w-3 h-3" />
                                        +3
                                    </span>
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
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="w-3 h-3" />
                                        +$94
                                    </span>
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
                                            <span className="text-emerald-600 font-bold">+2.4%</span> from last month
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={trendTimeframe} onValueChange={setTrendTimeframe}>
                                        <SelectTrigger className="w-32 h-8 text-[10px] font-bold rounded-full border-gray-200 shadow-none ring-0 focus:ring-0 bg-gray-50/50">
                                            <SelectValue placeholder="Last 6 months" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                            <SelectItem value="6months">Last 6 months</SelectItem>
                                            <SelectItem value="12months">Last 12 months</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
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
                                            <span className="text-emerald-600 font-bold">+2.4%</span> from last month
                                        </p>
                                    </div>
                                </div>
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
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
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
                                    <SelectTrigger className="w-40 h-10 rounded-full border-gray-200 bg-white shadow-none text-xs font-bold ring-0 focus:ring-0">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="it">IT</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="hr">HR</SelectItem>
                                        <SelectItem value="engineering">Engineering</SelectItem>
                                        <SelectItem value="operations">Operations</SelectItem>
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
                                {filteredPayroll.map((employee) => (
                                    <TableRow key={employee.id} className="border-border">
                                        <TableCell>
                                            <input type="checkbox" className="rounded border-border" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                                                    <AvatarFallback className="bg-muted text-foreground text-xs">
                                                        {employee.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-foreground">{employee.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{employee.department}</TableCell>
                                        <TableCell className="text-muted-foreground">{employee.payDate}</TableCell>
                                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                                        <TableCell className="text-foreground">${employee.baseSalary.toLocaleString()}</TableCell>
                                        <TableCell className="text-foreground">${employee.bonuses.toLocaleString()}</TableCell>
                                        <TableCell className="font-semibold text-foreground">${employee.totalSalary.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
