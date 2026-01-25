"use client"

import { useState, useMemo } from "react"
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

// Dummy data for the dashboard
const statsData = {
    revenue: { value: 1500000, change: 130000, percent: 4.5 },
    cogs: { value: 1300000, change: -650000, percent: -4.5 },
    grossProfit: { value: 1000000, change: 110000, percent: 4.5 },
    netProfit: { value: 800000, change: -22000, percent: -4.5 },
}

const operatingProfitData = [
    { month: "Jan", value: 2800000, percent: 8 },
    { month: "Feb", value: 3200000, percent: 12 },
    { month: "Mar", value: 4800000, percent: 18 },
    { month: "Apr", value: 5200000, percent: 22 },
    { month: "May", value: 6800000, percent: 28 },
    { month: "Jun", value: 7200000, percent: 32 },
    { month: "Jul", value: 6400000, percent: 25 },
    { month: "Aug", value: 5800000, percent: 20 },
    { month: "Sep", value: 4200000, percent: 15 },
    { month: "Oct", value: 3800000, percent: 12 },
    { month: "Nov", value: 4600000, percent: 18 },
    { month: "Dec", value: 5200000, percent: 22 },
]

const netProfitData = [
    { month: "Jan", netProfit: 180000, grossProfit: 320000, netPercent: 12, grossPercent: 22 },
    { month: "Feb", netProfit: 220000, grossProfit: 380000, netPercent: 15, grossPercent: 25 },
    { month: "Mar", netProfit: 350000, grossProfit: 520000, netPercent: 22, grossPercent: 32 },
    { month: "Apr", netProfit: 480000, grossProfit: 650000, netPercent: 28, grossPercent: 38 },
    { month: "May", netProfit: 620000, grossProfit: 780000, netPercent: 35, grossPercent: 45 },
    { month: "Jun", netProfit: 750000, grossProfit: 850000, netPercent: 42, grossPercent: 48 },
    { month: "Jul", netProfit: 680000, grossProfit: 820000, netPercent: 38, grossPercent: 45 },
    { month: "Aug", netProfit: 580000, grossProfit: 720000, netPercent: 32, grossPercent: 40 },
    { month: "Sep", netProfit: 450000, grossProfit: 580000, netPercent: 25, grossPercent: 32 },
    { month: "Oct", netProfit: 380000, grossProfit: 480000, netPercent: 20, grossPercent: 26 },
    { month: "Nov", netProfit: 420000, grossProfit: 550000, netPercent: 23, grossPercent: 30 },
    { month: "Dec", netProfit: 520000, grossProfit: 680000, netPercent: 28, grossPercent: 38 },
]

const assetsData = {
    currentAssets: 23450000,
    fixedAsset: 20325000,
    cashAndBank: 795404,
    deposits: 600000,
    inventory: 220324,
    accountsReceivable: 1200000,
    shortTermInvest: 500000,
    prepaidExpenses: 150000,
}

const assetsTreemapData = [
    { name: "Liabilities & Equ.", value: 20438000, displayValue: "$20,438,000" },
    { name: "Current Liabili.", value: 20438233, displayValue: "$20,438,233" },
    { name: "Non Current", value: 1546654, displayValue: "-$1,546,654" },
    { name: "Equity", value: 6171030, displayValue: "$6,171,030" },
    { name: "Prov & Accrual", value: 2432546, displayValue: "$2,432,546" },
    { name: "Related Party", value: 13970814, displayValue: "$13,970,814" },
    { name: "Long Term Debt", value: 5000000, displayValue: "$5,000,000" },
    { name: "Other Assets", value: 1200000, displayValue: "$1,200,000" },
]

const expensesData = [
    { name: "Salaries & Benefit", value: 504435 },
    { name: "General Expenses", value: 500000 },
    { name: "Insurance Expenses", value: 490749 },
    { name: "Repair & Maintenance", value: 480123 },
    { name: "Vehicle Cost", value: 450888 },
    { name: "Communication", value: 420890 },
    { name: "Trade License", value: 400111 },
    { name: "Financial Costs", value: 382123 },
]

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

const DATA_SCENARIOS: any = {
    'all': {
        '2025': {
            'mtd': {
                stats: { revenue: 23150000, cogs: 10450000, gross: 12700000, net: 2345432 },
                operatingProfit: [
                    { month: "Jan", value: 1800000, percent: 45 },
                    { month: "Feb", value: 2100000, percent: 48 },
                    { month: "Mar", value: 1950000, percent: 46 },
                    { month: "Apr", value: 2345000, percent: 52 },
                ],
                assets: [
                    { name: "Liabilities & Equ.", displayValue: "$20,438,000" },
                    { name: "Current Liabili.", displayValue: "$20,438,233" },
                    { name: "Non Current", displayValue: "-$1,546,654" },
                    { name: "Equity", displayValue: "$6,171,030" },
                    { name: "Prov & Accrual", displayValue: "$2,432,546" },
                    { name: "Related Party", displayValue: "$13,970,814" },
                    { name: "Long Term Debt", displayValue: "$5,000,000" },
                    { name: "Other Assets", displayValue: "$1,200,000" },
                ]
            },
            'ytd': {
                stats: { revenue: 95400000, cogs: 42000000, gross: 53400000, net: 12450000 },
                operatingProfit: [
                    { month: "Q1", value: 5800000, percent: 45 },
                    { month: "Q2", value: 7100000, percent: 48 },
                    { month: "Q3", value: 6950000, percent: 46 },
                    { month: "Q4", value: 8345000, percent: 52 },
                ],
                assets: [
                    { name: "Liabilities & Equ.", displayValue: "$85,438,000" },
                    { name: "Current Liabili.", displayValue: "$85,438,233" },
                    { name: "Non Current", displayValue: "-$5,546,654" },
                    { name: "Equity", displayValue: "$25,171,030" },
                    { name: "Prov & Accrual", displayValue: "$12,432,546" },
                    { name: "Related Party", displayValue: "$45,970,814" },
                    { name: "Long Term Debt", displayValue: "$20,000,000" },
                    { name: "Other Assets", displayValue: "$5,200,000" },
                ]
            }
        },
        '2024': {
            'mtd': {
                stats: { revenue: 19150000, cogs: 9450000, gross: 9700000, net: 1845432 },
                operatingProfit: [
                    { month: "Jan", value: 1600000, percent: 42 },
                    { month: "Feb", value: 1800000, percent: 44 },
                    { month: "Mar", value: 1750000, percent: 43 },
                    { month: "Apr", value: 1945000, percent: 48 },
                ],
                assets: [
                    { name: "Liabilities & Equ.", displayValue: "$18,438,000" },
                    { name: "Current Liabili.", displayValue: "$18,438,233" },
                    { name: "Non Current", displayValue: "-$1,246,654" },
                    { name: "Equity", displayValue: "$5,171,030" },
                    { name: "Prov & Accrual", displayValue: "$2,132,546" },
                    { name: "Related Party", displayValue: "$11,970,814" },
                    { name: "Long Term Debt", displayValue: "$4,000,000" },
                    { name: "Other Assets", displayValue: "$1,100,000" },
                ]
            }
        }
    },
    'entity1': {
        '2025': {
            'mtd': {
                stats: { revenue: 12150000, cogs: 5450000, gross: 6700000, net: 1145432 },
                operatingProfit: [
                    { month: "Jan", value: 900000, percent: 42 },
                    { month: "Feb", value: 1100000, percent: 44 },
                    { month: "Mar", value: 1050000, percent: 43 },
                    { month: "Apr", value: 1145000, percent: 48 },
                ],
                assets: [
                    { name: "Liabilities & Equ.", displayValue: "$10,438,000" },
                    { name: "Current Liabili.", displayValue: "$10,438,233" },
                    { name: "Non Current", displayValue: "-$846,654" },
                    { name: "Equity", displayValue: "$3,171,030" },
                    { name: "Prov & Accrual", displayValue: "$1,432,546" },
                    { name: "Related Party", displayValue: "$6,970,814" },
                    { name: "Long Term Debt", displayValue: "$2,000,000" },
                    { name: "Other Assets", displayValue: "$800,000" },
                ]
            }
        }
    }
}
export function AccountingDashboardV2() {
    const [period, setPeriod] = useState<"mtd" | "ytd">("mtd")
    const [benchmark, setBenchmark] = useState<"lastYear" | "lastMonth">("lastYear")
    const [entity, setEntity] = useState("all")
    const [financialYear, setFinancialYear] = useState("2026")
    const [selectedMonths, setSelectedMonths] = useState("all")

    // Dynamic data selection
    const activeData = useMemo(() => {
        const entityData = DATA_SCENARIOS[entity] || DATA_SCENARIOS['all']
        const yearData = entityData[financialYear] || entityData['2025'] || DATA_SCENARIOS['all']['2025']
        return yearData[period] || yearData['mtd']
    }, [entity, financialYear, period])

    // Derived values for components
    const stats = activeData.stats
    const opProfitData = activeData.operatingProfit
    const assetsGridData = activeData.assets
    const totalAssetsLabel = period === 'ytd' ? '95M in Total' : '23M in Total'

    const formatCurrency = (value: number) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`
        }
        return `$${value.toLocaleString()}`
    }

    const formatLargeCurrency = (value: number) => {
        return `$${value.toLocaleString()}`
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
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${period === "mtd" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setPeriod("mtd")}
                                >
                                    MTD
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${period === "ytd" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setPeriod("ytd")}
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
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${benchmark === "lastYear" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setBenchmark("lastYear")}
                                >
                                    Last Year
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-full h-8 px-4 text-xs font-semibold ${benchmark === "lastMonth" ? "bg-[#1a3a4a] text-white hover:bg-[#1a3a4a]/90" : "text-muted-foreground hover:bg-gray-50"}`}
                                    onClick={() => setBenchmark("lastMonth")}
                                >
                                    Last Month
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entity</span>
                            <Select value={entity} onValueChange={setEntity}>
                                <SelectTrigger className="w-[140px] bg-white border border-gray-200 rounded-full h-10 text-xs font-semibold shadow-none ring-0 focus:ring-0">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                                    <SelectItem value="all">All Entities</SelectItem>
                                    <SelectItem value="entity1">Entity 1</SelectItem>
                                    <SelectItem value="entity2">Entity 2</SelectItem>
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
                                        <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">{formatLargeCurrency(stats.revenue)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-rose-600 flex items-center gap-1 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                                        <ArrowDownRight className="w-3 h-3" />
                                        8.2%
                                    </span>
                                    <span className="text-muted-foreground">vs {benchmark === "lastYear" ? "last year" : "last month"}</span>
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
                                        <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">{formatLargeCurrency(stats.cogs)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="w-3 h-3" />
                                        12.5%
                                    </span>
                                    <span className="text-muted-foreground">vs {benchmark === "lastYear" ? "last year" : "last month"}</span>
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
                                        <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">{formatLargeCurrency(stats.gross)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <ArrowUpRight className="w-3 h-3" />
                                        4.1%
                                    </span>
                                    <span className="text-muted-foreground">vs {benchmark === "lastYear" ? "last year" : "last month"}</span>
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
                                        <p className="text-4xl font-normal text-foreground mt-1 tracking-tight">{formatLargeCurrency(stats.net)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-rose-600 flex items-center gap-1 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                                        <ArrowDownRight className="w-3 h-3" />
                                        2.3%
                                    </span>
                                    <span className="text-muted-foreground">vs {benchmark === "lastYear" ? "last year" : "last month"}</span>
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
                                        <div className="w-2 h-2 rounded-full bg-[#fbbf24]"></div>
                                        <span>Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                        <span>COGS</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                        <span>Gross Profit (%)</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={opProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
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
                                        formatter={(value: number, name: string) => {
                                            if (name === "percent") return [`${value}%`, "Gross Profit %"]
                                            return [formatCurrency(value), "Value"]
                                        }}
                                    />
                                    <Bar yAxisId="left" dataKey="value" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={12} />
                                    <Line yAxisId="right" type="monotone" dataKey="percent" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Net Profit Chart */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Net Profit</CardTitle>
                                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                                        <span>Net Profit</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#fbbf24]"></div>
                                        <span>Gross Profit (%)</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={netProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                                        formatter={(value: number, name: string) => {
                                            if (name === "netPercent" || name === "grossPercent") return [`${value}%`, name === "netPercent" ? "Net Profit %" : "Gross Profit %"]
                                            return [formatCurrency(value), name === "netProfit" ? "Net Profit" : "Gross Profit"]
                                        }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="netProfit" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={3} />
                                    <Area yAxisId="left" type="monotone" dataKey="grossProfit" fill="#fbbf24" fillOpacity={0.05} stroke="#fbbf24" strokeWidth={3} />
                                    <Line yAxisId="right" type="monotone" dataKey="netPercent" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="grossPercent" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
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
                                <span className="text-sm font-medium text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">25M Total</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-6">
                                {assetsGridData.slice(0, 5).map((asset, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: ASSET_GRID_COLORS[index % ASSET_GRID_COLORS.length] }}></div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{asset.name}</p>
                                            <p className="text-xl font-normal text-foreground mt-1 tracking-tight">{asset.displayValue}</p>
                                        </div>
                                    </div>
                                ))}
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
                            <div className="flex flex-col h-[450px] overflow-hidden rounded-md">
                                {[0, 1, 2, 3].map((rowIdx) => {
                                    const rowWidths = [
                                        ['55%', '45%'],
                                        ['42%', '58%'],
                                        ['60%', '40%'],
                                        ['48%', '52%']
                                    ][rowIdx];

                                    return (
                                        <div key={rowIdx} className={`flex flex-1 ${rowIdx !== 3 ? 'border-b border-white/20' : ''}`}>
                                            {[0, 1].map((colIdx) => {
                                                const dataIdx = rowIdx * 2 + colIdx;
                                                const item = assetsGridData[dataIdx];
                                                if (!item) return null;

                                                return (
                                                    <div
                                                        key={colIdx}
                                                        className="flex flex-col items-center justify-center p-3 transition-colors"
                                                        style={{
                                                            backgroundColor: ASSET_GRID_COLORS[dataIdx % ASSET_GRID_COLORS.length],
                                                            width: rowWidths[colIdx]
                                                        }}
                                                    >
                                                        <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider text-center leading-tight mb-1">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-xl font-light text-white tracking-tight">
                                                            {item.displayValue}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expenses */}
                    <Card className="bg-white border-none rounded-xl shadow-none overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Expenses</CardTitle>
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Active</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-4">
                                {expensesData.map((expense, index) => (
                                    <div key={index} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-medium px-1">
                                            <span className="text-muted-foreground uppercase tracking-wider">{expense.name}</span>
                                            <span className="text-foreground">{expense.value.toLocaleString()}</span>
                                        </div>
                                        <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                style={{ width: `${(expense.value / 504435) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
