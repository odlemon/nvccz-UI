"use client"

import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { useSelector, useDispatch } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { fetchPortfolioDashboard } from "@/lib/store/slices/portfolioDashboardSlice"
import { fetchFunds } from "@/lib/store/slices/fundsSlice"
import { formatCompactNumber } from "@/lib/utils/number-formatting"
import { PortfolioDashboardSkeleton } from "./portfolio-dashboard-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    LineChart,
    Line,
} from "recharts"
import {
    Search,
    Calendar,
    ChevronDown,
    Download,
    Plus,
} from "lucide-react"

export function PortfolioDashboardV2() {
    const dispatch = useDispatch<AppDispatch>()
    const { dashboardData, dashboardLoading } = useSelector((state: RootState) => state.portfolioDashboard)
    const { funds, loading: fundsLoading } = useSelector((state: any) => state.funds)

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedFund, setSelectedFund] = useState("all")
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(2016, 0, 1),
        to: new Date(2025, 11, 31)
    })

    useEffect(() => {
        dispatch(fetchFunds())
    }, [dispatch])

    // Fetch dashboard data on mount and when filters change
    useEffect(() => {
        const currentYear = new Date().getFullYear()
        dispatch(fetchPortfolioDashboard({
            year: currentYear,
            fundId: selectedFund !== "all" ? selectedFund : undefined,
            currencyId: 'USD',
            asOfDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
        }))
    }, [dispatch, selectedFund, dateRange])

    // All hooks MUST be called before conditional returns
    // Use API data
    const apiData = dashboardData as any
    const metrics = apiData?.metrics || {}
    const performanceOverview = apiData?.performanceOverview || {}
    const jCurveData = apiData?.jCurve || []
    const dealAllocationData = apiData?.dealAllocation || []
    const irrData = apiData?.irrByQuarter || []
    const portfolioSummaryData = apiData?.portfolioSummary || []
    const totals = apiData?.totals || {}

    // Summary stats from API
    const summaryStats = useMemo(() => [
        { label: "Total invested", value: formatCompactNumber(metrics.totalInvested, { style: 'currency' }) },
        { label: "Available for Drawdown", value: formatCompactNumber(metrics.availableForDrawdown, { style: 'currency' }) },
        { label: "Fund Gross IRR", value: `${(metrics.fundGrossIRR || 0).toFixed(1)}%` },
        { label: "LP Net IRR", value: `${(metrics.lpNetIRR || 0).toFixed(1)}%` },
        { label: "TVPI", value: `${(metrics.tvpi || 0).toFixed(2)}x` },
    ], [metrics])

    // Performance overview chart data
    const performanceChartData = useMemo(() => [
        { name: "Paid-in", value: performanceOverview.paidIn || 0 },
        { name: "Total investment", value: -(performanceOverview.totalInvestment || 0) },
        { name: "Management...", value: -(performanceOverview.managementExpenses || 0) },
        { name: "Other expenses", value: -(performanceOverview.otherExpenses || 0) },
        { name: "Realized proceeds", value: performanceOverview.realizedProceedsAndIncome || 0 },
        { name: "FMV of portfolio", value: performanceOverview.fmvUnrealizedPortfolio || 0 },
    ], [performanceOverview])

    // Deal allocation with colors
    const allocationChartData = useMemo(() => {
        const colors = ["#4f77ff", "#74b9a8", "#2e5b8a", "#3a4a6e", "#cd853f", "#db7093"]
        return dealAllocationData.map((item: any, idx: number) => ({
            name: item.sector || item.name || "Other",
            value: item.percentage || 0,
            raw: item.investmentCost || 0,
            color: colors[idx % colors.length]
        }))
    }, [dealAllocationData])

    // Filter portfolio summary based on search
    const filteredPortfolio = useMemo(() => {
        return portfolioSummaryData.filter((item: any) => {
            const matchesSearch = (item.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.sector || '').toLowerCase().includes(searchQuery.toLowerCase())
            return matchesSearch
        })
    }, [portfolioSummaryData, searchQuery])

    const selectedFundName = useMemo(() => {
        if (selectedFund === 'all') return 'All Funds'
        const fund = funds.find((f: any) => f.id === selectedFund)
        return fund ? fund.name : 'Unknown Fund'
    }, [selectedFund, funds])

    // Show skeleton while loading - AFTER all hooks
    if (dashboardLoading) {
        return <PortfolioDashboardSkeleton />
    }

    return (
        <div className="bg-[#F6F6F6] p-8">
            <div className="max-w-[1700px] mx-auto space-y-8">

                {/* --- Header & Global Filters --- */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#4f77ff] flex items-center justify-center">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">Dashboard - {selectedFundName}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search portfolio..."
                                className="pl-10 h-11 w-64 rounded-full border-gray-200 bg-white shadow-none text-xs font-semibold ring-0 focus:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select value={selectedFund} onValueChange={setSelectedFund}>
                            <SelectTrigger className="w-[160px] h-11 bg-white border-gray-200 rounded-full shadow-none font-bold text-xs ring-0 focus:ring-0">
                                <SelectValue placeholder="Select Fund" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-200 shadow-xl">
                                <SelectItem value="all">All Funds</SelectItem>
                                {funds.map((fund: any) => (
                                    <SelectItem key={fund.id} value={fund.id}>{fund.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="h-11 px-5 rounded-full gap-2 border-gray-200 bg-white hover:bg-gray-50 font-bold text-xs shadow-none">
                                    <Calendar className="w-4 h-4 text-foreground" />
                                    {dateRange.from && dateRange.to
                                        ? `${format(dateRange.from, "dd MMM yyyy")}`
                                        : "Select Date"}
                                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="end">
                                <CalendarComponent
                                    initialFocus
                                    mode="single"
                                    selected={dateRange.from}
                                    onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* --- Summary Stats Bar --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {summaryStats.map((stat, idx) => (
                        <Card key={idx} className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                            <CardContent className="p-6">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">{stat.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* --- Charts Grid Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Performance Overview */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-semibold text-foreground">Performance overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {performanceChartData.some((d: any) => d.value !== 0) ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performanceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => formatCompactNumber(value)}
                                            label={{ value: 'USD (M)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11, fontWeight: '500' }, offset: 10 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
                                            {performanceChartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.value > 0 ? "#10b981" : "#4f77ff"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <BarChart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No performance data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Performance overview will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* J Curve */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-semibold text-foreground">J Curve</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {jCurveData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={jCurveData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="year"
                                            tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => formatCompactNumber(value)}
                                            label={{ value: 'USD (M)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11, fontWeight: '500' }, offset: 10 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="cumulativeAmount" stroke="#4f77ff" strokeWidth={2} dot={{ r: 4, fill: "#4f77ff" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <LineChart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No J Curve data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">J Curve analysis will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deal Allocation */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-semibold text-foreground">Deal allocation (total investment cost)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {allocationChartData.length > 0 ? (
                                <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                                    <div className="relative w-64 h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={allocationChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    nameKey="name"
                                                >
                                                    {allocationChartData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total =</p>
                                            <p className="text-xs font-bold text-foreground">${summaryStats[0].value.replace("$", "").replace("m", "")}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 min-w-[150px]">
                                        {allocationChartData.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">{item.name}</span>
                                                    <span className="text-xs font-bold text-foreground leading-tight">{item.value}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <PieChart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No deal allocation data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Deal allocation breakdown will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* IRR by Quarter */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-semibold text-foreground">IRR by quarter</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {irrData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={irrData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis
                                            dataKey="quarter"
                                            tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="fundGrossIRR"
                                            stroke="#4f77ff"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: "#4f77ff", strokeWidth: 2, stroke: "#fff" }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <LineChart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No IRR data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">IRR by quarter will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* --- Portfolio Summary Table --- */}
                <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                    <CardHeader className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold text-foreground">Portfolio summary</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">Realization and Portfolio Summary in USD Million unless otherwise stated</p>
                            </div>
                            <Button variant="outline" className="h-10 rounded-full gap-2 border-gray-200 font-bold text-xs">
                                <Download className="w-4 h-4" />
                                Export summary
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc] border-b border-gray-100">
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-3">Name</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sector</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Investment Cost</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Realized</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Fair Market Val.</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Total Value</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Multiple</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Gross IRR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPortfolio.length > 0 ? (
                                        <>
                                            {filteredPortfolio.map((item: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-gray-100 h-14">
                                                    <TableCell className="text-xs font-bold text-[#2e5b8a]">{item.name || 'N/A'}</TableCell>
                                                    <TableCell className="text-xs font-medium text-muted-foreground">{item.mainIndustry || 'N/A'}</TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground text-right">${formatCompactNumber(item.totalInvestmentCost || 0)}</TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground text-right">${formatCompactNumber(item.realized || 0)}</TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground text-right">${formatCompactNumber(item.fairMarketValue || 0)}</TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground text-right">${formatCompactNumber(item.totalValue || 0)}</TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground text-right">{(item.multiplesOfCost || 0).toFixed(2)}x</TableCell>
                                                    <TableCell className="text-xs font-bold text-foreground text-right">{(item.grossIRR || 0).toFixed(2)}%</TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Table Footer - Totals Row */}
                                            <TableRow className="bg-gray-50/30 border-t-2 border-gray-100 h-16">
                                                <TableCell colSpan={2} className="text-xs font-bold text-foreground">Total (excluding and general expenses)</TableCell>
                                                <TableCell className="text-xs font-bold text-foreground text-right">${(totals.totalInvestmentCost || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-xs font-bold text-foreground text-right">${(totals.realized || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-xs font-bold text-foreground text-right">${(totals.fairMarketValue || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-xs font-bold text-foreground text-right">${(totals.totalValue || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-xs font-bold text-foreground text-right">{(totals.multiplesOfCost || 0).toFixed(2)}x</TableCell>
                                                <TableCell className="text-xs font-bold text-foreground text-right">{(totals.grossIRR || 0).toFixed(2)}%</TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                        <Search className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-muted-foreground">No portfolio data available</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Portfolio companies will appear here when available</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
