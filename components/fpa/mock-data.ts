/** Mock data aligned to Arcus FP&A Home design screenshot */

export const mockKpis = [
  {
    label: "Revenue Forecast",
    value: "$125.8M",
    delta: "4.2% vs Apr 2025",
    up: true,
    spark: [40, 42, 45, 48, 52, 58, 62, 70, 74, 78, 82, 88],
  },
  {
    label: "EBITDA",
    value: "$23.6M",
    delta: "6.1% vs Apr 2025",
    up: true,
    spark: [20, 22, 21, 24, 26, 28, 30, 32, 35, 38, 40, 44],
  },
  {
    label: "Closing Cash",
    value: "$38.4M",
    delta: "8.7% vs Apr 2025",
    up: true,
    spark: [30, 32, 31, 34, 36, 38, 40, 42, 45, 48, 50, 54],
  },
  {
    label: "Cash Runway",
    value: "14.2 months",
    delta: "1.1 mo vs Apr 2025",
    up: true,
    spark: [10, 10.2, 10.5, 11, 11.5, 12, 12.4, 12.8, 13.2, 13.5, 13.8, 14.2],
  },
  {
    label: "Forecast Accuracy",
    value: "87.3%",
    delta: "3.6 pp vs Apr 2025",
    up: true,
    spark: [70, 72, 74, 75, 76, 78, 80, 81, 83, 84, 86, 87],
  },
]

export const mockRevenueExpenseTrend = [
  { period: "Jun '24", revenue: 78, expenses: 54 },
  { period: "Jul '24", revenue: 82, expenses: 56 },
  { period: "Aug '24", revenue: 86, expenses: 58 },
  { period: "Sep '24", revenue: 90, expenses: 60 },
  { period: "Oct '24", revenue: 94, expenses: 63 },
  { period: "Nov '24", revenue: 98, expenses: 66 },
  { period: "Dec '24", revenue: 104, expenses: 70 },
  { period: "Jan '25", revenue: 108, expenses: 72 },
  { period: "Feb '25", revenue: 112, expenses: 76 },
  { period: "Mar '25", revenue: 118, expenses: 80 },
  { period: "Apr '25", revenue: 122, expenses: 84 },
  { period: "May '25", revenue: 125.8, expenses: 86.4 },
]

export const mockScenarioTable = [
  {
    name: "Base Case",
    subtitle: "Working",
    revenue: "$125.8M",
    ebitda: "$23.6M",
    runway: "14.2 mo",
    revDelta: null as string | null,
    ebitdaDelta: null as string | null,
    runwayDelta: null as string | null,
  },
  {
    name: "Upside Case",
    subtitle: "+10% Growth",
    revenue: "$138.4M",
    ebitda: "$28.1M",
    runway: "16.8 mo",
    revDelta: "+10.0%",
    ebitdaDelta: "+19.1%",
    runwayDelta: "+2.6 mo",
  },
  {
    name: "Downside Case",
    subtitle: "-10% Growth",
    revenue: "$113.2M",
    ebitda: "$18.4M",
    runway: "11.1 mo",
    revDelta: "-10.0%",
    ebitdaDelta: "-22.0%",
    runwayDelta: "-3.1 mo",
  },
]

export const mockWorkflowDonut = [
  { name: "Submitted", value: 72, count: "23/32", color: "#3b82f6" },
  { name: "In Review", value: 18, count: "6/32", color: "#f59e0b" },
  { name: "Approved", value: 10, count: "3/32", color: "#22c55e" },
]

export const mockOverBudget = [
  { dept: "Marketing", budget: "$8.2M", actual: "$9.45M", variance: "$1.25M (15.2%)", owner: "Jane Cooper", initials: "JC", avatar: "#93c5fd" },
  { dept: "Sales", budget: "$12.4M", actual: "$13.9M", variance: "$1.50M (12.1%)", owner: "Wade Warren", initials: "WW", avatar: "#86efac" },
  { dept: "Operations", budget: "$6.8M", actual: "$7.55M", variance: "$0.75M (11.0%)", owner: "Cody Fisher", initials: "CF", avatar: "#fcd34d" },
  { dept: "IT", budget: "$4.1M", actual: "$4.65M", variance: "$0.55M (13.4%)", owner: "Esther Howard", initials: "EH", avatar: "#c4b5fd" },
  { dept: "HR", budget: "$3.2M", actual: "$3.60M", variance: "$0.40M (12.5%)", owner: "Cameron W.", initials: "CW", avatar: "#fda4af" },
  { dept: "Product", budget: "$9.5M", actual: "$10.4M", variance: "$0.90M (9.5%)", owner: "Leslie A.", initials: "LA", avatar: "#67e8f9" },
  { dept: "Finance", budget: "$2.1M", actual: "$2.35M", variance: "$0.25M (11.9%)", owner: "Robert Fox", initials: "RF", avatar: "#a5b4fc" },
  { dept: "Legal", budget: "$1.4M", actual: "$1.58M", variance: "$0.18M (12.9%)", owner: "Devon Lane", initials: "DL", avatar: "#fdba74" },
]

export const mockCashRunwayBars = [
  { month: "Jun", value: 28 },
  { month: "Jul", value: 30 },
  { month: "Aug", value: 31 },
  { month: "Sep", value: 33 },
  { month: "Oct", value: 34 },
  { month: "Nov", value: 35 },
  { month: "Dec", value: 36 },
  { month: "Jan", value: 37 },
  { month: "Feb", value: 37.5 },
  { month: "Mar", value: 38 },
  { month: "Apr", value: 38.2 },
  { month: "May", value: 38.4 },
]

export const mockActivity = [
  { title: "Marketing budget submitted for review", user: "Jane Cooper", time: "2h ago", tone: "blue" },
  { title: "Base Case scenario locked by CFO", user: "Robert Fox", time: "4h ago", tone: "green" },
  { title: "FX rate assumption updated to 28.40", user: "Leslie Alexander", time: "Yesterday", tone: "amber" },
  { title: "Q2 variance commentary requested", user: "System", time: "Yesterday", tone: "red" },
  { title: "Rolling forecast rolled forward to May", user: "FP&A", time: "2d ago", tone: "blue" },
]

export const mockOpenTasks = [
  { task: "Review Q2 Marketing Budget", module: "Budgeting", owner: "Jane Cooper", initials: "JC", avatar: "#93c5fd", due: "May 23, 2025", priority: "High", status: "In Progress" },
  { task: "Update headcount drivers", module: "Workforce", owner: "Wade Warren", initials: "WW", avatar: "#86efac", due: "May 24, 2025", priority: "Medium", status: "In Progress" },
  { task: "Prepare board pack draft", module: "Reports", owner: "Esther Howard", initials: "EH", avatar: "#c4b5fd", due: "May 28, 2025", priority: "High", status: "Not Started" },
  { task: "Close Apr actuals sync", module: "Forecasts", owner: "Cody Fisher", initials: "CF", avatar: "#fcd34d", due: "May 22, 2025", priority: "Low", status: "In Progress" },
  { task: "Downside FX shock scenario", module: "Scenarios", owner: "Cameron Williamson", initials: "CW", avatar: "#fda4af", due: "May 30, 2025", priority: "Medium", status: "Not Started" },
  { task: "Consolidate North Region OpEx", module: "Budgeting", owner: "Leslie Alexander", initials: "LA", avatar: "#67e8f9", due: "Jun 2, 2025", priority: "Medium", status: "Not Started" },
  { task: "Validate cash runway drivers", module: "Cash Flow", owner: "Robert Fox", initials: "RF", avatar: "#a5b4fc", due: "Jun 5, 2025", priority: "High", status: "In Progress" },
]

export const mockModels = [
  {
    id: "m1",
    name: "Arcus Consolidated FY27",
    type: "ANNUAL_BUDGET",
    currency: "USD",
    horizon: "Jan 2027 – Dec 2027",
    status: "DRAFT",
  },
  {
    id: "m2",
    name: "Rolling 18-Month Forecast",
    type: "ROLLING_FORECAST",
    currency: "USD",
    horizon: "Apr 2026 – Sep 2027",
    status: "ACTIVE",
  },
]

export const mockWorksheetRows = [
  { line: "Revenue", type: "REVENUE" as const, jan: 920, feb: 940, mar: 980, apr: 1010, formula: false, actualThrough: "Mar" },
  { line: "Cost of Sales", type: "EXPENSE" as const, jan: 410, feb: 420, mar: 435, apr: 450, formula: true, actualThrough: "Mar" },
  { line: "Gross Profit", type: "REVENUE" as const, jan: 510, feb: 520, mar: 545, apr: 560, formula: true, actualThrough: "Mar" },
  { line: "Salaries", type: "EXPENSE" as const, jan: 210, feb: 210, mar: 215, apr: 230, formula: false, actualThrough: "Mar" },
  { line: "EBITDA", type: "REVENUE" as const, jan: 180, feb: 190, mar: 200, apr: 205, formula: true, actualThrough: "Mar" },
  { line: "Closing Cash", type: "CASH" as const, jan: 2400, feb: 2480, mar: 2550, apr: 2600, formula: true, actualThrough: "Mar" },
]

export const mockVarianceRows = [
  { line: "Revenue", dept: "Sales", actual: 980, budget: 950, forecast: 970, amount: 30, pct: 3.2, fav: true, type: "REVENUE" },
  { line: "Marketing", dept: "Marketing", actual: 85, budget: 70, forecast: 75, amount: 15, pct: 21.4, fav: false, type: "EXPENSE" },
  { line: "Salaries", dept: "HR", actual: 215, budget: 220, forecast: 218, amount: -5, pct: -2.3, fav: true, type: "EXPENSE" },
  { line: "Closing Cash", dept: "Treasury", actual: 2550, budget: 2500, forecast: 2520, amount: 50, pct: 2.0, fav: true, type: "CASH" },
]

export const mockDrivers = [
  { name: "Revenue Growth %", category: "Revenue", value: "4.5%", period: "FY27" },
  { name: "USD/ZiG Rate", category: "FX", value: "28.40", period: "Apr 2026" },
  { name: "Salary Inflation", category: "Payroll", value: "6.0%", period: "FY27" },
  { name: "Collection Days", category: "Cash", value: "45", period: "FY27" },
]

export const mockBuilderComponents = [
  { id: "dim", label: "Dimensions", items: ["Time", "Entity", "Department", "Account"] },
  { id: "li", label: "Line Items", items: ["Revenue", "COS", "Salaries", "EBITDA", "Closing Cash"] },
  { id: "drv", label: "Drivers", items: ["Growth %", "FX Rate", "Headcount"] },
  { id: "wf", label: "Workflow", items: ["Dept Submit", "FP&A Review", "CFO Lock"] },
]

export const mockTasks = [
  { id: "1", title: "Sales FY27 OpEx input", department: "Sales", status: "OPEN", assignee: "A. Ndlovu" },
  { id: "2", title: "HR headcount plan", department: "HR", status: "SUBMITTED", assignee: "T. Moyo" },
  { id: "3", title: "Finance consolidation review", department: "Finance", status: "OPEN", assignee: "FP&A" },
]

export const mockWorkflowStages = ["Create", "Input", "Submit", "Review", "CFO Approve", "Lock"]

export const mockScenarioCompare = [
  { metric: "Revenue", base: 12.4, upside: 13.8, downside: 10.9 },
  { metric: "EBITDA", base: 3.1, upside: 3.9, downside: 2.2 },
  { metric: "Cash", base: 2.6, upside: 3.4, downside: 1.8 },
]

export const mockForecastTrend = [
  { period: "Jan", actual: 920, forecast: 900, budget: 880 },
  { period: "Feb", actual: 940, forecast: 930, budget: 900 },
  { period: "Mar", actual: 980, forecast: 970, budget: 950 },
  { period: "Apr", actual: null, forecast: 1010, budget: 990 },
  { period: "May", actual: null, forecast: 1040, budget: 1020 },
  { period: "Jun", actual: null, forecast: 1080, budget: 1050 },
]

// —— Worksheet ——
export const wsActuals = ["Jan", "Feb", "Mar"] as const
export const wsForecast = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const
export const wsQuarters = ["Q1", "Q2", "Q3", "Q4", "FY"] as const

export type WsRow = {
  id: string
  label: string
  unit?: string
  expandable?: boolean
  children?: WsRow[]
  values: Record<string, number>
  isPct?: boolean
}

function series(base: number, growth = 0.02): Record<string, number> {
  const months = [...wsActuals, ...wsForecast]
  const out: Record<string, number> = {}
  months.forEach((m, i) => {
    out[m] = Math.round(base * Math.pow(1 + growth, i))
  })
  out.Q1 = out.Jan + out.Feb + out.Mar
  out.Q2 = out.Apr + out.May + out.Jun
  out.Q3 = out.Jul + out.Aug + out.Sep
  out.Q4 = out.Oct + out.Nov + out.Dec
  out.FY = out.Q1 + out.Q2 + out.Q3 + out.Q4
  return out
}

export const mockWorksheetTree: WsRow[] = [
  {
    id: "rev",
    label: "Revenue",
    expandable: true,
    values: series(10800, 0.015),
    children: [{ id: "rev-amt", label: "$ in thousands", values: series(10800, 0.015) }],
  },
  {
    id: "cogs",
    label: "COGS",
    expandable: true,
    values: series(4200, 0.012),
    children: [{ id: "cogs-amt", label: "$ in thousands", values: series(4200, 0.012) }],
  },
  {
    id: "gp",
    label: "Gross Profit",
    expandable: true,
    values: series(6600, 0.016),
    children: [
      { id: "gp-amt", label: "$ in thousands", values: series(6600, 0.016) },
      { id: "gp-pct", label: "% of Revenue", values: series(61, 0.001), isPct: true },
    ],
  },
  { id: "sal", label: "Salaries", values: series(2100, 0.01) },
  { id: "rent", label: "Rent", values: series(480, 0.005) },
  { id: "mkt", label: "Marketing", values: series(620, 0.02) },
  { id: "trv", label: "Travel", values: series(180, 0.01) },
  { id: "sw", label: "Software", values: series(310, 0.015) },
  {
    id: "ebitda",
    label: "EBITDA",
    expandable: true,
    values: series(2910, 0.018),
    children: [
      { id: "eb-amt", label: "$ in thousands", values: series(2910, 0.018) },
      { id: "eb-pct", label: "% of Revenue", values: series(23, 0.002), isPct: true },
    ],
  },
  { id: "hc", label: "Headcount", values: series(160, 0.008) },
  { id: "cash", label: "Closing Cash", values: series(24000, 0.01) },
]

export const mockWsValidations = [
  { id: "1", severity: "warn" as const, text: "Marketing - Nov 2025: 18% above budget ($390K)", time: "10:14 AM" },
  { id: "2", severity: "error" as const, text: "Headcount - Dec 2025: 173 exceeds approved budget (170)", time: "09:52 AM" },
  { id: "3", severity: "warn" as const, text: "Closing Cash - Jul 2025: Projected cash below minimum threshold ($15,000K)", time: "Yesterday" },
]

export const mockWsCellHistory = [
  { at: "Today 09:41", user: "Jane Cooper", value: "$11,600" },
  { at: "May 12", user: "Wade Warren", value: "$11,300" },
  { at: "May 8", user: "Leslie Alexander", value: "$11,100" },
]

// —— Model Builder ——
export const mockBuilderNav = [
  { id: "dim", label: "Dimensions", count: 8, items: ["Account", "Department", "Product", "Customer", "Region", "Scenario", "Version", "Time"] },
  { id: "li", label: "Line Items", count: 42, items: [] },
  { id: "ver", label: "Versions", count: 3, items: ["Working", "Submitted", "Board Approved"] },
  { id: "sc", label: "Scenarios", count: 4, items: ["Base", "Upside", "Downside", "FX Shock"] },
  { id: "drv", label: "Drivers", count: 18, items: [] },
  { id: "fx", label: "Formulas", count: 27, items: [] },
  { id: "wf", label: "Workflows", count: 6, items: [] },
  { id: "sec", label: "Security", count: 12, items: [] },
]

export const mockLineItems = [
  { name: "Revenue Forecast", type: "Number", applies: ["Product", "Region", "Time"], summary: "Sum", formula: "Units × ASP", status: "Valid" as const },
  { name: "Units Forecast", type: "Number", applies: ["Product", "Region", "Time"], summary: "Sum", formula: "—", status: "Valid" as const },
  { name: "Avg Selling Price", type: "Number", applies: ["Product", "Time"], summary: "Weighted Avg", formula: "—", status: "Valid" as const },
  { name: "COGS %", type: "Percent", applies: ["Product", "Time"], summary: "Weighted Avg", formula: "Driver", status: "Warning" as const },
  { name: "Gross Profit", type: "Number", applies: ["Region", "Time"], summary: "Sum", formula: "Revenue − COGS", status: "Valid" as const },
  { name: "Salaries", type: "Number", applies: ["Department", "Time"], summary: "Sum", formula: "HC × Avg Salary", status: "Valid" as const },
  { name: "EBITDA", type: "Number", applies: ["Time"], summary: "Sum", formula: "GP − Opex", status: "Valid" as const },
  { name: "Closing Cash", type: "Number", applies: ["Time"], summary: "Last", formula: "Opening + Net", status: "Valid" as const },
]

export const mockModelChanges = [
  { user: "Jane Cooper", change: "Edited formula for 'Revenue Forecast'", time: "2h ago" },
  { user: "Wade Warren", change: "Added dimension Product to Units Forecast", time: "Yesterday" },
  { user: "Leslie Alexander", change: "Published Working → Submitted", time: "2d ago" },
]

// —— Scenarios (full comparison) ——
export const mockScenarioCards = [
  {
    name: "Base Case",
    tone: "blue" as const,
    revenue: "$125.8M",
    revDelta: "+4.2%",
    ebitda: "$23.6M",
    ebitdaDelta: "+6.1%",
    margin: "18.8%",
    marginDelta: "+30 bps",
    cash: "$38.4M",
    runway: "14.2 mo",
    hc: "532",
    spark: [40, 45, 48, 52, 58, 62, 70, 74, 78, 82, 86, 90],
  },
  {
    name: "Upside Case",
    tone: "green" as const,
    revenue: "$138.3M",
    revDelta: "+13.0%",
    ebitda: "$29.1M",
    ebitdaDelta: "+18.4%",
    margin: "21.0%",
    marginDelta: "+210 bps",
    cash: "$53.2M",
    runway: "17.6 mo",
    hc: "548",
    spark: [42, 48, 55, 60, 68, 74, 80, 88, 94, 100, 108, 115],
  },
  {
    name: "Downside Case",
    tone: "red" as const,
    revenue: "$113.2M",
    revDelta: "-6.7%",
    ebitda: "$17.2M",
    ebitdaDelta: "-20.5%",
    margin: "15.2%",
    marginDelta: "-120 bps",
    cash: "$25.1M",
    runway: "10.2 mo",
    hc: "516",
    spark: [40, 42, 41, 40, 38, 37, 36, 35, 34, 33, 32, 31],
  },
]

export const mockScenarioMetrics = [
  { metric: "Revenue", base: "$125.8M", up: "$138.3M", down: "$113.2M", upPct: "+10.0%", downPct: "-10.0%" },
  { metric: "Gross Profit", base: "$76.4M", up: "$86.1M", down: "$66.8M", upPct: "+12.7%", downPct: "-12.6%" },
  { metric: "Gross Margin", base: "60.7%", up: "62.3%", down: "59.0%", upPct: "+160 bps", downPct: "-170 bps" },
  { metric: "EBITDA", base: "$23.6M", up: "$29.1M", down: "$17.2M", upPct: "+23.3%", downPct: "-27.1%" },
  { metric: "EBITDA Margin", base: "18.8%", up: "21.0%", down: "15.2%", upPct: "+220 bps", downPct: "-360 bps" },
  { metric: "Net Income", base: "$14.2M", up: "$18.9M", down: "$9.1M", upPct: "+33.1%", downPct: "-35.9%" },
  { metric: "Closing Cash", base: "$38.4M", up: "$53.2M", down: "$25.1M", upPct: "+38.5%", downPct: "-34.6%" },
  { metric: "Cash Runway (months)", base: "14.2", up: "17.6", down: "10.2", upPct: "+24.0%", downPct: "-28.2%" },
  { metric: "Headcount (FTEs)", base: "532", up: "548", down: "516", upPct: "+3.0%", downPct: "-3.0%" },
]

export const mockWaterfall = [
  { name: "Budget", value: 121.5, type: "total" },
  { name: "Price/Mix", value: 2.1, type: "up" },
  { name: "Volume", value: 3.4, type: "up" },
  { name: "New Business", value: 1.8, type: "up" },
  { name: "Other Income", value: 0.4, type: "up" },
  { name: "Churn", value: -2.2, type: "down" },
  { name: "FX/Other", value: -1.2, type: "down" },
  { name: "Forecast", value: 125.8, type: "total" },
]

export const mockSensitivity = [
  { driver: "Revenue Growth", low: "-$4.2M", mid: "$0.0M", high: "+$5.1M" },
  { driver: "FX Rate", low: "-$1.8M", mid: "$0.0M", high: "+$1.2M" },
  { driver: "Salary Increase", low: "+$0.9M", mid: "$0.0M", high: "-$1.4M" },
  { driver: "Collection Days", low: "-$0.6M", mid: "$0.0M", high: "+$0.5M" },
]

export const mockCashRunwayCompare = [
  { case: "Downside", months: 10.2 },
  { case: "Base", months: 14.2 },
  { case: "Upside", months: 17.6 },
]

// —— Workflow ——
export const mockCycleStages = [
  { name: "Setup", status: "done" as const, date: "Apr 1" },
  { name: "Department Input", status: "current" as const, date: "Apr 15–May 10" },
  { name: "FP&A Review", status: "todo" as const, date: "May 12–20" },
  { name: "CFO Approval", status: "todo" as const, date: "May 22" },
  { name: "Locked", status: "todo" as const, date: "May 30" },
]

export const mockRecentApprovals = [
  { user: "Robert Fox", role: "CFO", item: "Finance consolidation", time: "1h ago" },
  { user: "Leslie Alexander", role: "FP&A Manager", item: "Sales OpEx", time: "3h ago" },
  { user: "Jane Cooper", role: "Dept Head", item: "Marketing budget", time: "Yesterday" },
]

export const mockWorkflowTasks = [
  { id: "t1", task: "Marketing Department Budget", dept: "Marketing", assignee: "Jane Cooper", due: "May 23", priority: "High", status: "In Review", submitted: "May 20 09:12", reviewer: "Leslie Alexander" },
  { id: "t2", task: "Sales Pipeline Forecast", dept: "Sales", assignee: "Wade Warren", due: "May 24", priority: "Medium", status: "Submitted", submitted: "May 21 14:02", reviewer: "Leslie Alexander" },
  { id: "t3", task: "IT CapEx Plan", dept: "IT", assignee: "Cody Fisher", due: "May 22", priority: "High", status: "Returned", submitted: "May 18 11:40", reviewer: "Robert Fox" },
  { id: "t4", task: "HR Headcount Plan", dept: "HR", assignee: "Esther Howard", due: "May 28", priority: "Low", status: "In Progress", submitted: "—", reviewer: "—" },
  { id: "t5", task: "Operations OpEx", dept: "Operations", assignee: "Cameron W.", due: "May 25", priority: "Medium", status: "Not Submitted", submitted: "—", reviewer: "—" },
]

export const mockDeptProgress = [
  { dept: "Marketing", submitted: 70, review: 20, progress: 10, none: 0 },
  { dept: "Sales", submitted: 55, review: 25, progress: 15, none: 5 },
  { dept: "IT", submitted: 40, review: 20, progress: 20, none: 20 },
  { dept: "HR", submitted: 30, review: 10, progress: 40, none: 20 },
]

export const mockWorkflowComments = [
  { user: "Leslie Alexander", text: "Please break out digital vs brand spend.", time: "2h ago" },
  { user: "Jane Cooper", text: "Updated attachment with revised rates.", time: "4h ago" },
  { user: "Robert Fox", text: "Return IT CapEx — missing ROI notes.", time: "Yesterday" },
]

// —— Variance ——
export const mockVarKpis = [
  { label: "Actual Revenue", value: "$125.8M", delta: "+4.2% vs Budget", up: true, spark: [70, 72, 74, 78, 80, 84, 88, 90, 94, 98, 102, 110] },
  { label: "Budget Revenue", value: "$121.5M", delta: "Baseline", up: true, spark: [70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92] },
  { label: "Revenue Variance", value: "$4.3M", delta: "+3.6% vs Budget", up: true, spark: [2, 2.2, 2.5, 2.8, 3, 3.2, 3.5, 3.6, 3.8, 4, 4.1, 4.3] },
  { label: "Opex Variance", value: "$(2.7M)", delta: "-2.1% vs Budget", up: true, spark: [1, 1.2, 1.5, 1.8, 2, 2.1, 2.3, 2.4, 2.5, 2.6, 2.65, 2.7] },
  { label: "EBITDA Variance", value: "$7.0M", delta: "+8.7% vs Budget", up: true, spark: [3, 3.5, 4, 4.5, 5, 5.5, 5.8, 6, 6.3, 6.5, 6.8, 7] },
]

export const mockVarDeptRows = [
  { dept: "Total Company", actual: 125.8, budget: 121.5, forecast: 124.0, varB: 4.3, varBp: 3.6, varF: 1.8, commentary: "green" as const },
  { dept: "Marketing", actual: 12.4, budget: 11.0, forecast: 11.8, varB: 1.4, varBp: 12.7, varF: 0.6, commentary: "yellow" as const },
  { dept: "Sales", actual: 48.2, budget: 45.0, forecast: 47.0, varB: 3.2, varBp: 7.1, varF: 1.2, commentary: "green" as const },
  { dept: "Product Development", actual: 18.6, budget: 19.4, forecast: 19.0, varB: -0.8, varBp: -4.1, varF: -0.4, commentary: "red" as const },
  { dept: "Operations", actual: 22.1, budget: 21.5, forecast: 21.8, varB: 0.6, varBp: 2.8, varF: 0.3, commentary: "green" as const },
  { dept: "Shared Services", actual: 9.8, budget: 10.5, forecast: 10.2, varB: -0.7, varBp: -6.7, varF: -0.4, commentary: "yellow" as const },
]

export const mockCommentaryReqs = [
  { dept: "Product Development", area: "Headcount", owner: "Devon Lane", due: "May 22", variance: "$(0.80M)", status: "Overdue" as const },
  { dept: "Marketing", area: "Campaign spend", owner: "Jane Cooper", due: "May 24", variance: "+$1.40M", status: "In Progress" as const },
  { dept: "Shared Services", area: "Facilities", owner: "Esther Howard", due: "May 26", variance: "$(0.70M)", status: "Submitted" as const },
]

export const mockVarTrend = [
  { m: "Jun", budget: 0.4, forecast: 0.2 },
  { m: "Jul", budget: 0.8, forecast: 0.5 },
  { m: "Aug", budget: 1.1, forecast: 0.6 },
  { m: "Sep", budget: 1.5, forecast: 0.9 },
  { m: "Oct", budget: 2.0, forecast: 1.1 },
  { m: "Nov", budget: 2.4, forecast: 1.3 },
  { m: "Dec", budget: 2.8, forecast: 1.4 },
  { m: "Jan", budget: 3.2, forecast: 1.5 },
  { m: "Feb", budget: 3.5, forecast: 1.6 },
  { m: "Mar", budget: 3.8, forecast: 1.7 },
  { m: "Apr", budget: 4.0, forecast: 1.75 },
  { m: "May", budget: 4.3, forecast: 1.8 },
]

export const mockVarTornado = [
  { dept: "Sales", value: 3.2 },
  { dept: "Marketing", value: 1.4 },
  { dept: "Operations", value: 0.6 },
  { dept: "Shared Services", value: -0.7 },
  { dept: "Product Development", value: -0.8 },
]

// —— Remaining tabs ——
export const mockBudgetCycles = [
  { name: "FY2026 Annual Budget", status: "In Progress", progress: 62, owner: "Leslie Alexander", due: "May 30, 2025" },
  { name: "FY2025 Mid-Year Rebudget", status: "Locked", progress: 100, owner: "Robert Fox", due: "Aug 15, 2024" },
]

export const mockDeptSubmitPct = [
  { dept: "Marketing", pct: 85 },
  { dept: "Sales", pct: 72 },
  { dept: "IT", pct: 55 },
  { dept: "HR", pct: 40 },
  { dept: "Operations", pct: 68 },
]

export const mockHorizonMonths = [
  { m: "Jan", kind: "actual" as const },
  { m: "Feb", kind: "actual" as const },
  { m: "Mar", kind: "actual" as const },
  { m: "Apr", kind: "actual" as const },
  { m: "May", kind: "forecast" as const },
  { m: "Jun", kind: "forecast" as const },
  { m: "Jul", kind: "forecast" as const },
  { m: "Aug", kind: "forecast" as const },
  { m: "Sep", kind: "forecast" as const },
  { m: "Oct", kind: "forecast" as const },
]

export const mockWorkforceRows = [
  { dept: "Sales", hc: 120, salary: 8.4, hires: 6, attrition: 2 },
  { dept: "Engineering", hc: 210, salary: 18.2, hires: 12, attrition: 4 },
  { dept: "Marketing", hc: 45, salary: 3.1, hires: 3, attrition: 1 },
  { dept: "Operations", hc: 88, salary: 5.6, hires: 2, attrition: 2 },
]

export const mockRevenueStreams = [
  { name: "Subscription ARR", method: "Subscribers × Fee", amount: "$72.4M", share: "58%" },
  { name: "Contract Revenue", method: "Contract ÷ Months", amount: "$31.2M", share: "25%" },
  { name: "Volume / Price", method: "Units × ASP", amount: "$15.8M", share: "12%" },
  { name: "Pipeline Weighted", method: "Value × Prob %", amount: "$6.4M", share: "5%" },
]

export const mockExpenseDepts = [
  { dept: "Marketing", budget: 11.0, runRate: 12.1, forecast: 12.4 },
  { dept: "Sales", budget: 28.0, runRate: 27.5, forecast: 28.2 },
  { dept: "IT", budget: 9.5, runRate: 9.8, forecast: 10.1 },
  { dept: "G&A", budget: 7.2, runRate: 7.0, forecast: 7.1 },
]

export const mockCashFlowRows = [
  { line: "Opening Cash", jan: 32.0, feb: 33.2, mar: 34.1, apr: 35.0, may: 36.2 },
  { line: "Collections", jan: 9.2, feb: 9.5, mar: 9.8, apr: 10.1, may: 10.4 },
  { line: "Payroll Out", jan: -4.1, feb: -4.1, mar: -4.2, apr: -4.3, may: -4.4 },
  { line: "Supplier Payments", jan: -3.2, feb: -3.3, mar: -3.4, apr: -3.5, may: -3.6 },
  { line: "Closing Cash", jan: 33.2, feb: 34.1, mar: 35.0, apr: 36.2, may: 38.4 },
]

export const mockReports = [
  { name: "Board Pack – May 2025", type: "Board Pack", version: "Working", status: "Draft" },
  { name: "Management P&L Forecast", type: "Management", version: "Base Case", status: "Ready" },
  { name: "Cash Runway Brief", type: "Treasury", version: "Working", status: "Ready" },
]

export const mockSettingsSections = [
  { title: "Entities & currencies", desc: "Legal entities, base currency, FX sources" },
  { title: "Actuals sync sources", desc: "Accounting, Payroll, Procurement, Cashbook" },
  { title: "Variance thresholds", desc: "Materiality % and absolute $ for commentary" },
  { title: "Default workflow", desc: "Maker-checker stages and SLA days" },
]
