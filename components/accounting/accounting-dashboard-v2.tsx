"use client"

import { useState, useMemo, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { fetchAccountingDashboard, fetchCurrencies } from "@/lib/store/slices/accountingSlice"
import { AccountingDashboardSkeleton } from "./accounting-dashboard-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Building2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Settings,
    Package,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    IndianRupee,
} from "lucide-react"
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Area,
    Treemap,
    Cell,
} from "recharts"

const ASSET_GRID_COLORS = [
    '#4db6ac', // Row 1 Left (Teal)
    '#00897b', // Row 1 Right (Dark Teal)
    '#2e4d4d', // Row 2 Left (Dark Green)
    '#2a9d8f', // Row 2 Right (Medium Green/Blue)
    '#023e8a', // Row 3 Left (Navy blue)
    '#0077b6', // Row 3 Right (Blue)
    '#1a3a4a', // Row 4 Left
    '#2d4a6f', // Row 4 Right
]

export function AccountingDashboardV2() {
    const dispatch = useDispatch<AppDispatch>()
    const { dashboardData, dashboardLoading, dashboardError, currencies } = useSelector((state: RootState) => state.accounting)
    
    const [period, setPeriod] = useState<"MTD" | "YTD" | "QTD">("MTD")
    const [benchmark, setBenchmark] = useState<"LAST_MONTH" | "LAST_QUARTER" | "LAST_YEAR">("LAST_YEAR")
    const [selectedCurrency, setSelectedCurrency] = useState("")
    const [financialYear, setFinancialYear] = useState("2026")
    const [selectedMonths, setSelectedMonths] = useState("all")

    // Fetch currencies on mount
    useEffect(() => {
        dispatch(fetchCurrencies())
    }, [dispatch])

    // Resolve selected currency symbol (falls back to $)
    const currencySymbol = useMemo(() => {
        if (!selectedCurrency) return "$"
        const match = currencies.find((c: any) => c.id === selectedCurrency)
        return match?.symbol || "$"
    }, [selectedCurrency, currencies])

    // Compute date window from year + quarter filters
    const dateWindow = useMemo(() => {
        const yearSet = financialYear && financialYear !== "all"
        const quarterSet = selectedMonths && selectedMonths !== "all"
        if (!yearSet && !quarterSet) return null

        const year = Number.parseInt(financialYear, 10) || new Date().getFullYear()
        const quarterRanges: Record<string, [number, number, number, number]> = {
            q1: [0, 1, 2, 31],   // Jan 1 - Mar 31
            q2: [3, 4, 5, 30],   // Apr 1 - Jun 30
            q3: [6, 7, 8, 30],   // Jul 1 - Sep 30
            q4: [9, 10, 11, 31], // Oct 1 - Dec 31
        }

        let startMonth = 0, endMonth = 11, endDay = 31
        if (quarterSet && quarterRanges[selectedMonths]) {
            const r = quarterRanges[selectedMonths]
            startMonth = r[0]
            endMonth = r[2]
            endDay = r[3]
        }

        const pad = (n: number) => String(n).padStart(2, "0")
        return {
            startDate: `${year}-${pad(startMonth + 1)}-01`,
            endDate: `${year}-${pad(endMonth + 1)}-${pad(endDay)}`,
        }
    }, [financialYear, selectedMonths])

    // Fetch dashboard data on mount and when filters change
    useEffect(() => {
        const params: Parameters<typeof fetchAccountingDashboard>[0] = {
            benchmark,
            currencyId: selectedCurrency,
        }
        if (dateWindow) {
            params.period = "CUSTOM"
            params.startDate = dateWindow.startDate
            params.endDate = dateWindow.endDate
        } else {
            params.period = period
        }
        dispatch(fetchAccountingDashboard(params))
    }, [dispatch, period, benchmark, selectedCurrency, dateWindow])

    // Use only API data - these hooks must be called before any conditional returns
    const stats = {
        revenue: dashboardData?.metrics?.revenue?.value || 0,
        revenueChange: dashboardData?.metrics?.revenue?.changePercent || 0,
        cogs: dashboardData?.metrics?.cogs?.value || 0,
        cogsChange: dashboardData?.metrics?.cogs?.changePercent || 0,
        gross: dashboardData?.metrics?.grossProfit?.value || 0,
        grossChange: dashboardData?.metrics?.grossProfit?.changePercent || 0,
        net: dashboardData?.metrics?.netProfit?.value || 0,
        netChange: dashboardData?.metrics?.netProfit?.changePercent || 0,
    }

    const opProfitData = dashboardData?.monthlyData || []
    // The asset distribution / list uses the high-level summary breakdown (which now includes
    // "other assets" categories like recoverable VAT, fixed-asset register overlap, short-term
    // investments). Fall back to detailed if summary is unavailable.
    const assetsSummaryData = dashboardData?.assets?.summary || []
    const assetsDetailedData = dashboardData?.assets?.detailed || []
    const assetsGridData = assetsSummaryData.length > 0 ? assetsSummaryData : assetsDetailedData
    const liabilitiesEquityData = dashboardData?.liabilitiesEquity?.summary || []
    const expensesChartData = dashboardData?.expenses || []

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `${currencySymbol}${(value / 1000000).toFixed(1)}M`
        }
        return `${currencySymbol}${value.toLocaleString()}`
    }

    const formatLargeCurrency = (value: number) => {
        return `${currencySymbol}${value.toLocaleString()}`
    }

    const getMetricAmountClass = (formattedAmount: string) => {
        const length = formattedAmount.length
        if (length >= 17) return "text-lg sm:text-xl"
        if (length >= 15) return "text-xl sm:text-2xl"
        if (length >= 13) return "text-2xl sm:text-3xl"
        return "text-3xl sm:text-4xl"
    }

    // Calculate total assets for display
    const totalAssets = dashboardData?.assets?.total || assetsGridData.reduce((sum: number, asset: any) => sum + (asset.amount || 0), 0)
    const totalAssetsLabel = formatCurrency(totalAssets)

    // Calculate total liabilities & equity
    const totalLiabilitiesEquity = dashboardData?.liabilitiesEquity?.total || liabilitiesEquityData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
    
    // Calculate total expenses from API
    const totalExpenses = expensesChartData.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)
    const totalExpensesLabel = formatCurrency(totalExpenses)

    // Show skeleton while loading - AFTER all hooks
    if (dashboardLoading) {
        return <AccountingDashboardSkeleton />
    }

    return (
        <div className="flex min-h-screen bg-[#F6F6F6]">
            {/* Main Content */}
            <main className="flex-1 p-6 space-y-6 overflow-auto">
                {/* Header Filter Row */}
                <div className="flex flex-wrap items-end justify-between gap-6 mb-3">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</span>
                            <div className="flex bg-white rounded-full p-1 border border-gray-200">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${period === "MTD" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setPeriod("MTD")}
                                >
                                    MTD
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${period === "YTD" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setPeriod("YTD")}
                                >
                                    YTD
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Benchmark</span>
                            <div className="flex bg-white rounded-full p-1 border border-gray-200">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${benchmark === "LAST_YEAR" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setBenchmark("LAST_YEAR")}
                                >
                                    Last Year
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${benchmark === "LAST_MONTH" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setBenchmark("LAST_MONTH")}
                                >
                                    Last Month
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Currency</span>
                            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                <SelectTrigger className="w-[140px] bg-white border border-gray-200 rounded-full h-10 text-xs font-semibold shadow-none ring-0 focus:ring-0">
                                    <SelectValue placeholder="USD" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.id} value={currency.id}>
                                            {currency.code} - {currency.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</span>
                            <Select value={financialYear} onValueChange={setFinancialYear}>
                                <SelectTrigger className="w-[110px] bg-white border border-gray-200 rounded-full h-10 text-xs font-semibold shadow-none ring-0 focus:ring-0">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                    <SelectItem value="all">All Years</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2024">2024</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Month</span>
                            <Select value={selectedMonths} onValueChange={setSelectedMonths}>
                                <SelectTrigger className="w-[150px] bg-white border border-gray-200 rounded-full h-10 text-xs font-semibold shadow-none ring-0 focus:ring-0">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                    <SelectItem value="all">All Months</SelectItem>
                                    <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
                                    <SelectItem value="q2">Q2 (Apr-Jun)</SelectItem>
                                    <SelectItem value="q3">Q3 (Jul-Sep)</SelectItem>
                                    <SelectItem value="q4">Q4 (Oct-Dec)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Header Stats */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                        <ArrowUpRight className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                                        <p className={`${getMetricAmountClass(formatLargeCurrency(stats.revenue))} font-normal text-foreground mt-1 tracking-tight leading-tight whitespace-nowrap`}>
                                            {formatLargeCurrency(stats.revenue)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {stats.revenueChange !== 0 && (
                                        <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${stats.revenueChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                            {stats.revenueChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {stats.revenueChange > 0 ? '+' : ''}{stats.revenueChange.toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="text-muted-foreground">vs {benchmark === "LAST_YEAR" ? "last year" : "last month"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* COGS Card */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center">
                                        <ArrowUpRight className="w-6 h-6 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">COGS</p>
                                        <p className={`${getMetricAmountClass(formatLargeCurrency(stats.cogs))} font-normal text-foreground mt-1 tracking-tight leading-tight whitespace-nowrap`}>
                                            {formatLargeCurrency(stats.cogs)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {stats.cogsChange !== 0 && (
                                        <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${stats.cogsChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                            {stats.cogsChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {stats.cogsChange > 0 ? '+' : ''}{stats.cogsChange.toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="text-muted-foreground">vs {benchmark === "LAST_YEAR" ? "last year" : "last month"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gross Profit Card */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                        <Target className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</p>
                                        <p className={`${getMetricAmountClass(formatLargeCurrency(stats.gross))} font-normal text-foreground mt-1 tracking-tight leading-tight whitespace-nowrap`}>
                                            {formatLargeCurrency(stats.gross)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {stats.grossChange !== 0 && (
                                        <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${stats.grossChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                            {stats.grossChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {stats.grossChange > 0 ? '+' : ''}{stats.grossChange.toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="text-muted-foreground">vs {benchmark === "LAST_YEAR" ? "last year" : "last month"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Net Profit Card */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                        <IndianRupee className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
                                        <p className={`${getMetricAmountClass(formatLargeCurrency(stats.net))} font-normal text-foreground mt-1 tracking-tight leading-tight whitespace-nowrap`}>
                                            {formatLargeCurrency(stats.net)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {stats.netChange !== 0 && (
                                        <span className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${stats.netChange > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                            {stats.netChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {stats.netChange > 0 ? '+' : ''}{stats.netChange.toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="text-muted-foreground">vs {benchmark === "LAST_YEAR" ? "last year" : "last month"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Operating Profit Chart */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Operating Profit</CardTitle>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]"></div>
                                        <span>Profit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                                        <span>COGS</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                                        <span>Margin %</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            {opProfitData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={opProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${currencySymbol}${(v / 1000000).toFixed(0)}M`}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number | undefined, name: string | undefined) => {
                                            if (name === 'percent') return [`${value}%`, 'Margin']
                                            return [`${currencySymbol}${((value || 0) / 1000000).toFixed(1)}M`, name === 'value' ? 'Profit' : 'COGS']
                                        }}
                                    />
                                    <Bar yAxisId="left" dataKey="value" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={12} />
                                    <Bar yAxisId="left" dataKey="cogs" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={12} />
                                    <Line yAxisId="right" type="monotone" dataKey="percent" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <TrendingUp className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No operating profit data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Operating profit data will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Net Profit Chart */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Net Profit</CardTitle>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#065f46]"></div>
                                        <span>Net Profit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                        <span>Gross Profit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#facc15]"></div>
                                        <span>Growth (%)</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            {opProfitData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={opProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${v}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number | undefined, name: string | undefined) => {
                                            if (name === "netPercent" || name === "grossPercent") return [`${value}%`, name === "netPercent" ? "Net Profit %" : "Gross Profit %"]
                                            return [formatCurrency(value || 0), name === "netProfit" ? "Net Profit" : "Gross Profit"]
                                        }}
                                    />
                                    <Bar yAxisId="left" dataKey="netProfit" fill="#065f46" radius={[4, 4, 0, 0]} barSize={10} />
                                    <Bar yAxisId="left" dataKey="grossProfit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                                    <Line yAxisId="right" type="monotone" dataKey="netPercent" stroke="#facc15" strokeWidth={2} dot={{ fill: '#facc15', r: 3 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="grossPercent" stroke="#facc15" strokeWidth={2} dot={{ fill: '#facc15', r: 3 }} strokeDasharray="5 5" />
                                </ComposedChart>
                            </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <DollarSign className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No net profit data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Net profit data will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row - Assets and Expenses */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Assets List */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Assets</CardTitle>
                                <span className="text-sm font-medium text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">{totalAssetsLabel} Total</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-6">
                                {assetsGridData.length > 0 ? (
                                    assetsGridData.slice(0, 8).map((asset: any, index: number) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: ASSET_GRID_COLORS[index % ASSET_GRID_COLORS.length] }}></div>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{asset.category}</p>
                                                <p className="text-xl font-normal text-foreground mt-1 tracking-tight">{currencySymbol}{(asset.amount ?? 0).toLocaleString()}</p>
                                                {typeof asset.percent === 'number' && (
                                                    <p className="text-[11px] font-medium text-muted-foreground/70 mt-0.5">{asset.percent.toFixed(1)}% of total</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                            <ArrowUpRight className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No asset data available</p>
                                        <p className="text-xs text-muted-foreground mt-1">Asset information will appear here when available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assets Treemap / Distribution Grid */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Asset Distribution</CardTitle>
                                <span className="text-sm font-medium text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">{totalAssetsLabel}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            {assetsGridData.length > 0 ? (
                                <div className="flex flex-col h-[450px] overflow-hidden rounded-md">
                                    {(() => {
                                        const rowWidthPatterns = [
                                            ['55%', '45%'],
                                            ['42%', '58%'],
                                            ['60%', '40%'],
                                            ['48%', '52%'],
                                            ['52%', '48%'],
                                        ]
                                        const rowCount = Math.ceil(assetsGridData.length / 2)
                                        return Array.from({ length: rowCount }).map((_, rowIdx) => {
                                            const left = assetsGridData[rowIdx * 2]
                                            const right = assetsGridData[rowIdx * 2 + 1]
                                            const widths = rowWidthPatterns[rowIdx % rowWidthPatterns.length]
                                            const isLast = rowIdx === rowCount - 1
                                            return (
                                                <div key={rowIdx} className={`flex flex-1 ${!isLast ? 'border-b border-white/20' : ''}`}>
                                                    {[left, right].map((item: any, colIdx: number) => {
                                                        if (!item) return null
                                                        const dataIdx = rowIdx * 2 + colIdx
                                                        // If this row only has one item, give it the full width
                                                        const width = !right && colIdx === 0 ? '100%' : widths[colIdx]
                                                        return (
                                                            <div
                                                                key={colIdx}
                                                                className="flex flex-col items-center justify-center p-3 transition-colors"
                                                                style={{
                                                                    backgroundColor: ASSET_GRID_COLORS[dataIdx % ASSET_GRID_COLORS.length],
                                                                    width,
                                                                }}
                                                            >
                                                                <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider text-center leading-tight mb-1">
                                                                    {item.category}
                                                                </span>
                                                                <span className="text-xl font-light text-white tracking-tight">
                                                                    {currencySymbol}{(item.amount ?? 0).toLocaleString()}
                                                                </span>
                                                                {typeof item.percent === 'number' && (
                                                                    <span className="text-[10px] font-medium text-white/80 mt-0.5">
                                                                        {item.percent.toFixed(1)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[450px] text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <ArrowUpRight className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No distribution data available</p>
                                    <p className="text-xs text-muted-foreground mt-1">Asset distribution will appear here when available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Expenses */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Expenses</CardTitle>
                                <span className="text-sm font-medium text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">{totalExpensesLabel} Total</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                {expensesChartData.length > 0 ? (
                                    expensesChartData.map((expense: any, index: number) => (
                                        <div key={index} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-medium px-1">
                                                <span className="text-muted-foreground uppercase tracking-wider">{expense.category}</span>
                                                <span className="text-foreground">{currencySymbol}{(expense.amount || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                    style={{ width: `${expensesChartData.length > 0 ? ((expense.amount || 0) / Math.max(...expensesChartData.map((e: any) => e.amount || 0))) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                            <ArrowUpRight className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No expense data available</p>
                                        <p className="text-xs text-muted-foreground mt-1">Expense breakdown will appear here when available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
