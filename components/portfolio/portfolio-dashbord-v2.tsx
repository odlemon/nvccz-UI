"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    ComposedChart,
    Area,
} from "recharts"
import {
    Search,
    Calendar,
    ChevronDown,
    Download,
    Plus,
} from "lucide-react"

// --- Realistic Zimbabwean Data ---

const ZIM_PORTFOLIO_DATA = [
    { name: "Econet Wireless", date: "03-2016", industry: "Telecoms", sector: "Technology", ownership: "15.5%", invested: "$12.50", realized: "$5.00", fm: "$45.20", total: "$50.20", multiple: "4.02x", irr: "42.15%", fund: "usd-fund-i" },
    { name: "Delta Corporation", date: "06-2017", industry: "Beverages", sector: "Consumer Goods", ownership: "8.2%", invested: "$25.00", realized: "$12.00", fm: "$68.50", total: "$80.50", multiple: "3.22x", irr: "28.40%", fund: "usd-fund-i" },
    { name: "Innscor Africa", date: "01-2018", industry: "Food & Retail", sector: "Consumer Goods", ownership: "12.0%", invested: "$18.70", realized: "$0.00", fm: "$52.80", total: "$52.80", multiple: "2.82x", irr: "22.10%", fund: "usd-fund-i" },
    { name: "Old Mutual Zim", date: "09-2018", industry: "Insurance", sector: "Finance", ownership: "5.5%", invested: "$40.00", realized: "$0.00", fm: "$45.00", total: "$45.00", multiple: "1.13x", irr: "8.50%", fund: "usd-fund-i" },
    { name: "CBZ Holdings", date: "02-2019", industry: "Banking", sector: "Finance", ownership: "10.0%", invested: "$20.00", realized: "$0.00", fm: "$38.00", total: "$38.00", multiple: "1.90x", irr: "18.20%", fund: "usd-fund-i" },
    { name: "Seed Co Limited", date: "11-2019", industry: "Agri-business", sector: "Agriculture", ownership: "25.0%", invested: "$15.00", realized: "$2.50", fm: "$28.40", total: "$30.90", multiple: "2.06x", irr: "21.50%", fund: "eur-fund-ii" },
    { name: "OK Zimbabwe", date: "05-2020", industry: "Retail", sector: "Consumer Goods", ownership: "18.2%", invested: "$8.50", realized: "$0.00", fm: "$12.30", total: "$12.30", multiple: "1.45x", irr: "12.20%", fund: "eur-fund-ii" },
    { name: "Hippo Valley", date: "08-2020", industry: "Sugar", sector: "Agriculture", ownership: "14.5%", invested: "$12.20", realized: "$0.00", fm: "$18.90", total: "$18.90", multiple: "1.55x", irr: "14.80%", fund: "eur-fund-ii" },
    { name: "Meikles Limited", date: "01-2021", industry: "Hospitality", sector: "Consumer Goods", ownership: "11.0%", invested: "$10.00", realized: "$0.00", fm: "$14.50", total: "$14.50", multiple: "1.45x", irr: "11.20%", fund: "eur-fund-ii" },
    { name: "Simbisa Brands", date: "04-2021", industry: "QSR", sector: "Consumer Goods", ownership: "22.5%", invested: "$35.00", realized: "$0.00", fm: "$82.00", total: "$82.00", multiple: "2.34x", irr: "32.50%", fund: "global-growth" },
    { name: "Dairibord Zim", date: "07-2021", industry: "Dairy", sector: "Consumer Goods", ownership: "15.0%", invested: "$6.50", realized: "$0.00", fm: "$9.20", total: "$9.20", multiple: "1.42x", irr: "9.80%", fund: "global-growth" },
    { name: "Zimnat", date: "10-2021", industry: "Insurance", sector: "Finance", ownership: "35.0%", invested: "$12.00", realized: "$0.00", fm: "$15.40", total: "$15.40", multiple: "1.28x", irr: "10.50%", fund: "global-growth" },
    { name: "National Foods", date: "02-2022", industry: "Manufacturing", sector: "Industrials", ownership: "12.2%", invested: "$28.00", realized: "$0.00", fm: "$42.00", total: "$42.00", multiple: "1.50x", irr: "15.20%", fund: "global-growth" },
    { name: "Padenga Holdings", date: "05-2022", industry: "Crocodile", sector: "Agriculture", ownership: "10.5%", invested: "$14.00", realized: "$0.00", fm: "$22.50", total: "$22.50", multiple: "1.61x", irr: "18.40%", fund: "usd-fund-i" },
    { name: "African Sun", date: "09-2022", industry: "Hotels", sector: "Consumer Goods", ownership: "40.0%", invested: "$8.50", realized: "$0.00", fm: "$11.20", total: "$11.20", multiple: "1.32x", irr: "11.20%", fund: "eur-fund-ii" },
    { name: "Axia Corporation", date: "01-2023", industry: "Logistics", sector: "Industrials", ownership: "15.0%", invested: "$12.00", realized: "$0.00", fm: "$16.80", total: "$16.80", multiple: "1.40x", irr: "14.50%", fund: "global-growth" },
    { name: "Tanganda Tea", date: "04-2023", industry: "Tea", sector: "Agriculture", ownership: "28.0%", invested: "$10.50", realized: "$0.00", fm: "$15.20", total: "$15.20", multiple: "1.45x", irr: "16.20%", fund: "eur-fund-ii" },
    { name: "Edgars Zim", date: "08-2023", industry: "Apparel", sector: "Consumer Goods", ownership: "45.0%", invested: "$5.20", realized: "$0.00", fm: "$7.50", total: "$7.50", multiple: "1.44x", irr: "12.80%", fund: "usd-fund-i" },
    { name: "First Mutual", date: "11-2023", industry: "Insurance", sector: "Finance", ownership: "12.5%", invested: "$22.00", realized: "$0.00", fm: "$28.60", total: "$28.60", multiple: "1.30x", irr: "13.20%", fund: "eur-fund-ii" },
]

const PERFORMANCE_DATA = [
    { name: "Paid-in", value: 350 },
    { name: "Total investment", value: -250 },
    { name: "Management...", value: -10 },
    { name: "Other expenses", value: -5 },
    { name: "Realized proceeds", value: 80 },
    { name: "FMV of portfolio", value: 480 },
]

const J_CURVE_DATA = [
    { year: "2015", contribution: -10, distribution: 0, cumulative: -10 },
    { year: "2016", contribution: -30, distribution: 5, cumulative: -35 },
    { year: "2017", contribution: -50, distribution: 15, cumulative: -70 },
    { year: "2018", contribution: -70, distribution: 50, cumulative: -90 },
    { year: "2019", contribution: -150, distribution: 80, cumulative: -160 },
    { year: "2020", contribution: -20, distribution: 40, cumulative: -140 },
    { year: "2021", contribution: -10, distribution: 60, cumulative: -90 },
    { year: "2022", contribution: 0, distribution: 80, cumulative: -10 },
    { year: "2023", contribution: 0, distribution: 100, cumulative: 90 },
    { year: "2024", contribution: 0, distribution: 120, cumulative: 210 },
    { year: "2025", contribution: 0, distribution: 140, cumulative: 350 },
]

const IRR_QUARTER_DATA = [
    { quarter: "2015 Q1", "Investor Net IRR": 0, "Fund Net IRR": 0, "Fund Gross IRR": 0 },
    { quarter: "2016 Q1", "Investor Net IRR": -5, "Fund Net IRR": -2, "Fund Gross IRR": 0 },
    { quarter: "2017 Q1", "Investor Net IRR": 45, "Fund Net IRR": 5, "Fund Gross IRR": 8 },
    { quarter: "2018 Q1", "Investor Net IRR": 10, "Fund Net IRR": 8, "Fund Gross IRR": 12 },
    { quarter: "2019 Q1", "Investor Net IRR": 15, "Fund Net IRR": 3, "Fund Gross IRR": 6 },
    { quarter: "2020 Q1", "Investor Net IRR": 22, "Fund Net IRR": 18, "Fund Gross IRR": 25 },
    { quarter: "2021 Q1", "Investor Net IRR": 18, "Fund Net IRR": 12, "Fund Gross IRR": 15 },
]

export function PortfolioDashboardV2() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedFund, setSelectedFund] = useState("all")
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: new Date(2016, 0, 1),
        to: new Date(2025, 11, 31)
    })
    const [allocationType, setAllocationType] = useState<"sector" | "industry">("sector")
    const [irrType, setIrrType] = useState<"Investor Net IRR" | "Fund Net IRR" | "Fund Gross IRR">("Investor Net IRR")

    const filteredPortfolio = useMemo(() => {
        return ZIM_PORTFOLIO_DATA.filter((item: any) => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.industry.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFund = selectedFund === "all" || item.fund === selectedFund

            // Basic date filter (by investment month/year)
            const [month, year] = item.date.split("-").map(Number)
            const itemDate = new Date(year, month - 1, 1)
            const matchesDate = (!dateRange.from || itemDate >= dateRange.from) &&
                (!dateRange.to || itemDate <= dateRange.to)

            return matchesSearch && matchesFund && matchesDate
        })
    }, [searchQuery, selectedFund, dateRange])

    const summaryStats = useMemo(() => {
        const totalInvested = filteredPortfolio.reduce((acc: number, curr: any) => acc + parseFloat(curr.invested.replace("$", "")), 0)
        const totalFMV = filteredPortfolio.reduce((acc: number, curr: any) => acc + parseFloat(curr.fm.replace("$", "")), 0)
        const totalRealized = filteredPortfolio.reduce((acc: number, curr: any) => acc + parseFloat(curr.realized.replace("$", "")), 0)
        const totalValue = totalFMV + totalRealized
        const tvpi = totalInvested > 0 ? (totalValue / totalInvested).toFixed(2) + "x" : "0.00x"

        return [
            { label: "Total invested", value: `$${totalInvested.toFixed(1)}m` },
            { label: "Realized Proceeds", value: `$${totalRealized.toFixed(1)}m` },
            { label: "Fair Market Value", value: `$${totalFMV.toFixed(1)}m` },
            { label: "Total Value", value: `$${totalValue.toFixed(1)}m` },
            { label: "TVPI", value: tvpi },
        ]
    }, [filteredPortfolio])

    const allocationChartData = useMemo(() => {
        const key = allocationType === "sector" ? "sector" : "industry"
        const groups: Record<string, number> = {}
        filteredPortfolio.forEach((item: any) => {
            const val = item[key] || "Other"
            groups[val] = (groups[val] || 0) + parseFloat((item.invested || "$0").replace("$", ""))
        })

        const total = Object.values(groups).reduce((a, b) => a + b, 0)
        const colors = ["#4f77ff", "#74b9a8", "#2e5b8a", "#3a4a6e", "#cd853f", "#db7093"]

        return Object.entries(groups).map(([name, value], idx) => ({
            name,
            value: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0,
            raw: value,
            color: colors[idx % colors.length]
        }))
    }, [filteredPortfolio, allocationType])

    // Totals for table footer
    const tableTotals = useMemo(() => {
        const invested = filteredPortfolio.reduce((acc, curr) => acc + parseFloat(curr.invested.replace("$", "")), 0)
        const realized = filteredPortfolio.reduce((acc, curr) => acc + parseFloat(curr.realized.replace("$", "")), 0)
        const fm = filteredPortfolio.reduce((acc, curr) => acc + parseFloat(curr.fm.replace("$", "")), 0)
        const total = filteredPortfolio.reduce((acc, curr) => acc + parseFloat(curr.total.replace("$", "")), 0)

        return {
            invested: `$${invested.toFixed(2)}`,
            realized: `$${realized.toFixed(2)}`,
            fm: `$${fm.toFixed(2)}`,
            total: `$${total.toFixed(2)}`,
            multiple: (total / invested || 0).toFixed(2) + "x",
            irr: "16.32%" // Mock average
        }
    }, [filteredPortfolio])

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
                            <h1 className="text-xl font-bold text-foreground">Dashboard - {selectedFund === 'all' ? 'All Funds' : selectedFund === 'usd-fund-i' ? 'USD Fund I' : selectedFund === 'eur-fund-ii' ? 'EUR Fund II' : 'Global Growth'}</h1>
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
                                <SelectItem value="usd-fund-i">USD Fund I</SelectItem>
                                <SelectItem value="eur-fund-ii">EUR Fund II</SelectItem>
                                <SelectItem value="global-growth">Global Growth</SelectItem>
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

                    {/* Performance Overview (Waterfall Mock) */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle className="text-lg font-semibold text-foreground">Performance overview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={PERFORMANCE_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: 'USD (M)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11, fontWeight: '500' } }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
                                        {PERFORMANCE_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.value > 0 ? "#10b981" : "#4f77ff"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* J Curve (Composed Chart) */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">J Curve</CardTitle>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-[#4f77ff]"></div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contribution</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Distribution</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-0.5 bg-[#3a4a6e]"></div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cumulative</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={J_CURVE_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fontWeight: '500', fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{ value: 'USD (M)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11, fontWeight: '500' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="contribution" stackId="a" fill="#4f77ff" radius={[0, 0, 4, 4]} maxBarSize={30} />
                                    <Bar dataKey="distribution" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                    <Line type="monotone" dataKey="cumulative" stroke="#3a4a6e" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Deal Allocation (Donut Chart) */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">Deal allocation (total investment cost)</CardTitle>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setAllocationType("sector")}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${allocationType === "sector" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Sector
                                    </button>
                                    <button
                                        onClick={() => setAllocationType("industry")}
                                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${allocationType === "industry" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Industry
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
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
                                                {allocationChartData.map((entry, index) => (
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
                                        <p className="text-xs font-bold text-foreground">${summaryStats[0].value.replace("$", "")}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 min-w-[150px]">
                                    {allocationChartData.map((item, idx) => (
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
                        </CardContent>
                    </Card>

                    {/* IRR by Quarter (Multi-Line Chart) */}
                    <Card className="bg-white border-none rounded-2xl shadow-none overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-foreground">IRR by quarter</CardTitle>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    {["Investor Net IRR", "Fund Net IRR", "Fund Gross IRR"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setIrrType(type as any)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${irrType === type ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            {type.replace(" IRR", "")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={IRR_QUARTER_DATA} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
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
                                        domain={[-20, 60]}
                                        tickFormatter={(v) => `${v}.0%`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={irrType}
                                        stroke="#4f77ff"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#4f77ff", strokeWidth: 2, stroke: "#fff" }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
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
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Industry</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Investment Cost</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Realized</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Fair Market Val.</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Total Value</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Multiple</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Gross IRR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPortfolio.map((item: any, idx) => (
                                        <TableRow key={idx} className="hover:bg-gray-50/50 border-gray-100 h-14">
                                            <TableCell className="text-xs font-bold text-[#2e5b8a]">{item.name}</TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground">{item.industry}</TableCell>
                                            <TableCell className="text-xs font-bold text-foreground text-right">{item.invested}</TableCell>
                                            <TableCell className="text-xs font-bold text-foreground text-right">{item.realized}</TableCell>
                                            <TableCell className="text-xs font-bold text-foreground text-right">{item.fm}</TableCell>
                                            <TableCell className="text-xs font-bold text-foreground text-right">{item.total}</TableCell>
                                            <TableCell className="text-xs font-bold text-foreground text-right">{item.multiple}</TableCell>
                                            <TableCell className="text-xs font-bold text-foreground text-right">{item.irr}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Table Footer - Totals Row */}
                                    <TableRow className="bg-gray-50/30 border-t-2 border-gray-100 h-16">
                                        <TableCell colSpan={2} className="text-xs font-bold text-foreground">Total (excluding and general expenses)</TableCell>
                                        <TableCell className="text-xs font-bold text-foreground text-right">{tableTotals.invested}</TableCell>
                                        <TableCell className="text-xs font-bold text-foreground text-right">{tableTotals.realized}</TableCell>
                                        <TableCell className="text-xs font-bold text-foreground text-right">{tableTotals.fm}</TableCell>
                                        <TableCell className="text-xs font-bold text-foreground text-right">{tableTotals.total}</TableCell>
                                        <TableCell className="text-xs font-bold text-foreground text-right">{tableTotals.multiple}</TableCell>
                                        <TableCell className="text-xs font-bold text-foreground text-right">{tableTotals.irr}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
