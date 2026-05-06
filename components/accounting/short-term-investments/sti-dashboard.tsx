"use client"

import { useState, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { fetchSTIDashboard } from "@/lib/store/slices/shortTermInvestmentsSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowUpDown,
  BarChart3,
  Clock,
  Bell,
  Wallet,
  PiggyBank,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
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
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { format, addDays, parseISO } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import type { DashboardAlert, SettlementVariance } from "@/lib/api/short-term-investments-api"

export function STIDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const stiState = useSelector((state: RootState) => state.shortTermInvestments)
  const dashboard = stiState?.dashboard ?? null
  const dashboardLoading = stiState?.dashboardLoading ?? false
  const instruments = stiState?.instruments ?? []

  const [asOfDate, setAsOfDate] = useState<Date>(new Date())
  const asOf = format(asOfDate, "yyyy-MM-dd")
  const [broker, setBroker] = useState("")

  useEffect(() => {
    dispatch(fetchSTIDashboard({
      asOfIso: asOf,
      broker: broker || undefined,
    }))
  }, [dispatch, asOf, broker])

  const brokers = useMemo(() => {
    const source = instruments.length > 0 ? instruments : (dashboard?.instruments ?? [])
    return [...new Set(source.map((i) => i.broker).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }, [instruments, dashboard])

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Maturity bucket chart data
  const maturityChartData = useMemo(() => {
    if (!dashboard?.maturityBuckets) return []
    const b = dashboard.maturityBuckets
    return [
      { name: "0-30 Days", value: b.within30Days, color: "#4f77ff" },
      { name: "31-60 Days", value: b.days31to60, color: "#2a9d8f" },
      { name: "61-90 Days", value: b.days61to90, color: "#f59e0b" },
      { name: "90+ Days", value: b.over90Days, color: "#1a3a4a" },
    ]
  }, [dashboard])

  // Daily yield data for bar chart
  const dailyYieldData = useMemo(() => {
    if (!dashboard?.dailyYieldInMonth) return []
    return dashboard.dailyYieldInMonth.map((d) => ({
      day: format(new Date(d.accrualDate), "d"),
      fullDate: format(new Date(d.accrualDate), "MMMM d, yyyy"),
      amount: d.amountSum,
    }))
  }, [dashboard])

  // Active alerts count
  const pendingAlerts = dashboard?.alerts?.filter((a) => a.type === "PENDING_APPROVAL")?.length || 0
  const erosionAlerts = dashboard?.alerts?.filter((a) => a.type === "CAPITAL_EROSION")?.length || 0

  if (dashboardLoading && !dashboard) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">As Of Date</span>
          <DatePicker
            value={asOfDate}
            onChange={(d) => d && setAsOfDate(d)}
            placeholder="Select date"
            className="w-[200px] h-10 text-xs font-semibold"
            allowFutureDates
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Broker</span>
          <Select
            value={broker || "all"}
            onValueChange={(value) => setBroker(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[180px] bg-white border border-gray-200 rounded-full h-10 text-xs font-semibold shadow-none ring-0 focus:ring-0">
              <SelectValue placeholder="All Brokers" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-xl">
              <SelectItem value="all">All Brokers</SelectItem>
              {brokers.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
            {/* Total Portfolio Value */}
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#4f77ff]" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Portfolio Value</span>
              </div>
              <p className="text-3xl font-semibold">
                {formatCurrency(dashboard?.portfolio?.carryingTotal || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Principal: {formatCurrency(dashboard?.portfolio?.principalTotal || 0)}
              </p>
            </div>

            {/* Accrued Interest */}
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accrued Interest</span>
              </div>
              <p className="text-3xl font-semibold">
                {formatCurrency(dashboard?.portfolio?.accruedInterestTotal || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MTD Yield: {formatCurrency(dashboard?.netYield?.monthToDate || 0)}
              </p>
            </div>

            {/* Net Yield */}
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Instruments</span>
              </div>
              <p className="text-3xl font-semibold">
                {dashboard?.instruments?.filter((i) => i.status === "active").length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {dashboard?.instruments?.length || 0} instruments
              </p>
            </div>

            {/* Alerts */}
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Alerts</span>
              </div>
              <p className="text-3xl font-semibold">{pendingAlerts}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {erosionAlerts > 0 && (
                  <span className="text-red-600">{erosionAlerts} capital erosion</span>
                )}
                {erosionAlerts === 0 && "No capital erosion alerts"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Yield Chart */}
        <Card className="shadow-none">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Daily Yield Report</CardTitle>
              <Badge variant="outline" className="rounded-full text-[10px] font-medium">
                {format(new Date(asOf), "MMMM yyyy")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyYieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${formatNumber(value)}`, "Interest"]}
                    labelFormatter={(label) => {
                      const found = dailyYieldData.find((item) => item.day === String(label))
                      return found ? ` (${found.fullDate})` : `n/a`
                    }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {dailyYieldData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.amount > 0 ? "#4f77ff" : entry.amount < 0 ? "#ef4444" : "#e2e8f0"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Liquidity Forecast / Maturity Buckets */}
        <Card className="shadow-none">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Liquidity Forecast</CardTitle>
              <Badge variant="outline" className="rounded-full text-[10px] font-medium">
                Maturity Buckets
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="space-y-4">
              {maturityChartData.map((bucket) => {
                const total = maturityChartData.reduce((s, b) => s + b.value, 0) || 1
                const pct = ((bucket.value / total) * 100).toFixed(1)
                return (
                  <div key={bucket.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{bucket.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(bucket.value)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: bucket.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upcoming Maturities List */}
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming Maturities</p>
              {dashboard?.instruments
                ?.filter((i) => i.status === "active")
                .sort((a, b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime())
                .slice(0, 5)
                .map((inst) => (
                  <div key={inst.instrumentId} className="flex items-center justify-between text-xs p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{inst.instrumentName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {format(new Date(inst.maturityDate), "MMM dd, yyyy")}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(inst.projectedMaturityValueInstrumentCcy)}
                      </span>
                    </div>
                  </div>
                ))}
              {(!dashboard?.instruments || dashboard.instruments.filter((i) => i.status === "active").length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">No active instruments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings Table */}
      <PortfolioHoldingsTable
        instruments={dashboard?.instruments ?? []}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
      />

      {/* Settlement Variance & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Variance Analysis */}
        <Card className="shadow-none">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Settlement Variance Analysis</CardTitle>
              <Badge variant="outline" className="rounded-full text-[10px] font-medium">
                {dashboard?.settlementVariance?.length || 0} settlements
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="space-y-2">
              {dashboard?.settlementVariance?.slice(0, 8).map((sv) => (
                <div key={`${sv.instrumentId}-${sv.settlementDate}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{sv.instrumentName}</p>
                    <p className="text-muted-foreground mt-0.5">
                      Settled: {format(new Date(sv.settlementDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-semibold ${sv.varianceInstrumentCcy >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {sv.varianceInstrumentCcy >= 0 ? "+" : ""}
                      {formatNumber(sv.varianceInstrumentCcy)}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Expected: {formatNumber(sv.expectedSettledAmountInstrumentCcy)}
                    </p>
                  </div>
                </div>
              ))}
              {(!dashboard?.settlementVariance || dashboard.settlementVariance.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-6">No settlement data</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className="shadow-none">
          <CardHeader className="pb-0 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" /> Alerts
              </CardTitle>
              <Badge variant="outline" className="rounded-full text-[10px] font-medium">
                {dashboard?.alerts?.length || 0} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {dashboard?.alerts?.slice(0, 15).map((alert, idx) => (
                <div
                  key={`${alert.instrumentId}-${alert.triggeredAt}-${idx}`}
                  className={`flex items-start gap-3 p-3 rounded-lg text-xs ${
                    alert.type === "CAPITAL_EROSION"
                      ? "bg-red-50 border border-red-100"
                      : alert.type === "RATE_CHANGE"
                      ? "bg-amber-50 border border-amber-100"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <div className="mt-0.5">
                    {alert.type === "CAPITAL_EROSION" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    ) : alert.type === "RATE_CHANGE" ? (
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{alert.instrumentName}</p>
                    <p className="text-muted-foreground mt-0.5">{alert.message}</p>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(alert.triggeredAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full text-[9px] px-2 shrink-0 ${
                      alert.type === "CAPITAL_EROSION"
                        ? "text-red-600 border-red-200"
                        : alert.type === "RATE_CHANGE"
                        ? "text-amber-600 border-amber-200"
                        : "text-blue-600 border-blue-200"
                    }`}
                  >
                    {alert.type.replace("_", " ")}
                  </Badge>
                </div>
              ))}
              {(!dashboard?.alerts || dashboard.alerts.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-6">No alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Portfolio Holdings Table (same style as Instruments tab) ────────────────

function PortfolioHoldingsTable({
  instruments,
  formatNumber,
  formatCurrency,
}: {
  instruments: import("@/lib/api/short-term-investments-api").DashboardInstrument[]
  formatNumber: (v: number) => string
  formatCurrency: (v: number) => string
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortKey, setSortKey] = useState<string>("instrumentName")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filtered = useMemo(() => {
    let list = instruments
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.instrumentName.toLowerCase().includes(q) ||
          i.broker.toLowerCase().includes(q) ||
          i.currencyCode.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      list = list.filter((i) => i.status === statusFilter)
    }
    return list
  }, [instruments, search, statusFilter])

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === "principal") return dir * (a.principal - b.principal)
      if (sortKey === "carryingValue") return dir * (a.carryingValue - b.carryingValue)
      if (sortKey === "maturityDate") return dir * (new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime())
      return dir * a.instrumentName.localeCompare(b.instrumentName)
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-full text-[10px] px-2.5" variant="outline">Active</Badge>
      case "settled": return <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-full text-[10px] px-2.5" variant="outline">Settled</Badge>
      default: return <Badge variant="outline" className="rounded-full text-[10px] px-2.5">{status}</Badge>
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold">Portfolio Holdings</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search holdings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-[220px] bg-gray-50 border-gray-200 rounded-full h-9 text-xs shadow-none"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[120px] bg-gray-50 border-gray-200 rounded-full h-9 text-xs shadow-none ring-0 focus:ring-0">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="rounded-full text-[10px] font-medium">
              {filtered.length} instruments
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-medium text-muted-foreground py-3 px-4">
                  <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("instrumentName")}>
                    Instrument <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground py-3 px-3">Broker</th>
                <th className="text-left font-medium text-muted-foreground py-3 px-3">Currency</th>
                <th className="text-right font-medium text-muted-foreground py-3 px-3">
                  <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("principal")}>
                    Principal <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right font-medium text-muted-foreground py-3 px-3">Accrued Interest</th>
                <th className="text-right font-medium text-muted-foreground py-3 px-3">
                  <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("carryingValue")}>
                    Carrying Value <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right font-medium text-muted-foreground py-3 px-3">APY</th>
                <th className="text-center font-medium text-muted-foreground py-3 px-3">
                  <button className="flex items-center gap-1 mx-auto hover:text-foreground" onClick={() => toggleSort("maturityDate")}>
                    Maturity <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-center font-medium text-muted-foreground py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-muted-foreground">
                    No instruments found
                  </td>
                </tr>
              ) : (
                paged.map((inst, index) => (
                  <tr
                    key={inst.instrumentId}
                    className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${index % 2 === 0 ? "" : "bg-muted/20"}`}
                  >
                    <td className="py-3 px-4 font-medium">{inst.instrumentName}</td>
                    <td className="py-3 px-3 text-muted-foreground">{inst.broker}</td>
                    <td className="py-3 px-3">
                      <Badge variant="outline" className="rounded-full text-[10px]">{inst.currencyCode}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{formatNumber(inst.principal)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatNumber(inst.accruedInterest)}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{formatNumber(inst.carryingValue)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={inst.apyAsOf < 0 ? "text-red-600" : "text-emerald-600"}>
                        {(inst.apyAsOf * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-muted-foreground">
                      {format(new Date(inst.maturityDate), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(inst.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sorted.length > pageSize && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3),
                page + 2
              ).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full text-xs ${p === page ? "bg-[#1a3a4a] text-white" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[180px] rounded-full" />
        <Skeleton className="h-10 w-[180px] rounded-full" />
      </div>
      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 p-6 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card h-[320px]">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[240px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="bg-card h-[320px]">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
