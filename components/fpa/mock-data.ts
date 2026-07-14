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

/** SRD §16 — canonical scenario set for comparison boards */
export const SRD_SCENARIO_NAMES = [
  "Base Case",
  "Upside Case",
  "Downside Case",
  "FX Shock",
  "Hiring Freeze",
  "Cost Reduction",
  "Fundraising Case",
  "Expansion Case",
] as const

export const mockScenarioCompareValues: Record<string, Record<string, number>> = {
  "Base Case": {
    REVENUE: 125800000,
    COGS: -48430000,
    GROSS_PROFIT: 77370000,
    GROSS_MARGIN: 61.5,
    OPEX: -24650000,
    EBITDA: 52720000,
    EBITDA_MARGIN: 41.9,
    CAPEX: -8250000,
    HEADCOUNT: 532,
  },
  "Upside Case": {
    REVENUE: 138300000,
    COGS: -51720000,
    GROSS_PROFIT: 86580000,
    GROSS_MARGIN: 62.6,
    OPEX: -23860000,
    EBITDA: 62720000,
    EBITDA_MARGIN: 45.3,
    CAPEX: -8600000,
    HEADCOUNT: 548,
  },
  "Downside Case": {
    REVENUE: 113200000,
    COGS: -44200000,
    GROSS_PROFIT: 69000000,
    GROSS_MARGIN: 61.0,
    OPEX: -22800000,
    EBITDA: 46200000,
    EBITDA_MARGIN: 40.8,
    CAPEX: -7100000,
    HEADCOUNT: 516,
  },
  "FX Shock": {
    REVENUE: 118400000,
    COGS: -46800000,
    GROSS_PROFIT: 71600000,
    GROSS_MARGIN: 60.5,
    OPEX: -25100000,
    EBITDA: 46500000,
    EBITDA_MARGIN: 39.3,
    CAPEX: -8000000,
    HEADCOUNT: 528,
  },
  "Hiring Freeze": {
    REVENUE: 127100000,
    COGS: -47900000,
    GROSS_PROFIT: 79200000,
    GROSS_MARGIN: 62.3,
    OPEX: -22900000,
    EBITDA: 56300000,
    EBITDA_MARGIN: 44.3,
    CAPEX: -7800000,
    HEADCOUNT: 520,
  },
  "Cost Reduction": {
    REVENUE: 121000000,
    COGS: -47200000,
    GROSS_PROFIT: 73800000,
    GROSS_MARGIN: 61.0,
    OPEX: -21500000,
    EBITDA: 52300000,
    EBITDA_MARGIN: 43.2,
    CAPEX: -6500000,
    HEADCOUNT: 510,
  },
  "Fundraising Case": {
    REVENUE: 130500000,
    COGS: -49800000,
    GROSS_PROFIT: 80700000,
    GROSS_MARGIN: 61.8,
    OPEX: -25200000,
    EBITDA: 55500000,
    EBITDA_MARGIN: 42.5,
    CAPEX: -9200000,
    HEADCOUNT: 540,
  },
  "Expansion Case": {
    REVENUE: 144600000,
    COGS: -53200000,
    GROSS_PROFIT: 91400000,
    GROSS_MARGIN: 63.2,
    OPEX: -26800000,
    EBITDA: 64600000,
    EBITDA_MARGIN: 44.7,
    CAPEX: -11200000,
    HEADCOUNT: 572,
  },
}

export const mockScenarioAssumptions: Record<string, Record<string, number>> = {
  "Revenue Growth": { "Base Case": 4.5, "Upside Case": 12.5, "Downside Case": -6.7, "FX Shock": -2.0, "Hiring Freeze": 5.3, "Cost Reduction": 1.0, "Fundraising Case": 8.0, "Expansion Case": 15.0 },
  "Price Change": { "Base Case": 3.0, "Upside Case": 6.0, "Downside Case": -2.5, "FX Shock": -4.0, "Hiring Freeze": 2.0, "Cost Reduction": 0.5, "Fundraising Case": 3.5, "Expansion Case": 5.0 },
  "Volume Growth": { "Base Case": 5.5, "Upside Case": 8.0, "Downside Case": -3.5, "FX Shock": -1.5, "Hiring Freeze": 4.0, "Cost Reduction": 2.0, "Fundraising Case": 6.0, "Expansion Case": 10.0 },
  "Opex Growth": { "Base Case": 6.0, "Upside Case": 2.0, "Downside Case": -3.0, "FX Shock": 4.0, "Hiring Freeze": -4.0, "Cost Reduction": -8.0, "Fundraising Case": 5.0, "Expansion Case": 9.0 },
  "Tax Rate": { "Base Case": 22.0, "Upside Case": 21.0, "Downside Case": 22.5, "FX Shock": 22.3, "Hiring Freeze": 22.0, "Cost Reduction": 22.0, "Fundraising Case": 21.5, "Expansion Case": 22.0 },
  "FX Rate (USD/EUR)": { "Base Case": 1.09, "Upside Case": 1.10, "Downside Case": 1.05, "FX Shock": 0.98, "Hiring Freeze": 1.09, "Cost Reduction": 1.08, "Fundraising Case": 1.09, "Expansion Case": 1.11 },
}

export const mockRollingForecastTrend = [
  { m: "Jan", actual: 9.2, forecast: 9.0, budget: 9.0 },
  { m: "Feb", actual: 9.5, forecast: 9.3, budget: 9.2 },
  { m: "Mar", actual: 9.8, forecast: 9.6, budget: 9.5 },
  { m: "Apr", actual: 10.1, forecast: 9.9, budget: 9.8 },
  { m: "May", actual: 10.4, forecast: 10.2, budget: 10.0 },
  { m: "Jun", actual: null, forecast: 10.6, budget: 10.2 },
  { m: "Jul", actual: null, forecast: 10.9, budget: 10.4 },
  { m: "Aug", actual: null, forecast: 11.2, budget: 10.6 },
  { m: "Sep", actual: null, forecast: 11.5, budget: 10.8 },
  { m: "Oct", actual: null, forecast: 11.8, budget: 11.0 },
  { m: "Nov", actual: null, forecast: 12.1, budget: 11.2 },
  { m: "Dec", actual: null, forecast: 12.4, budget: 11.4 },
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
  {
    dept: "Total Company",
    actual: 125.8,
    budget: 121.5,
    forecast: 127.2,
    varB: 4.3,
    varBp: 3.6,
    varF: -1.3,
    commentary: "yellow" as const,
    commentaryDone: 3,
    commentaryTotal: 8,
    isSummary: true,
  },
  {
    dept: "Marketing",
    actual: 8.2,
    budget: 7.8,
    forecast: 8.1,
    varB: 0.4,
    varBp: 5.1,
    varF: 0.1,
    commentary: "green" as const,
    commentaryDone: 2,
    commentaryTotal: 2,
  },
  {
    dept: "Sales",
    actual: 52.5,
    budget: 50.1,
    forecast: 52.0,
    varB: 2.4,
    varBp: 4.8,
    varF: 0.5,
    commentary: "green" as const,
    commentaryDone: 1,
    commentaryTotal: 1,
  },
  {
    dept: "Product Development",
    actual: 15.0,
    budget: 16.2,
    forecast: 15.5,
    varB: -1.2,
    varBp: -7.4,
    varF: -0.5,
    commentary: "red" as const,
    commentaryDone: 1,
    commentaryTotal: 2,
  },
  {
    dept: "Customer Success",
    actual: 9.1,
    budget: 8.5,
    forecast: 9.0,
    varB: 0.6,
    varBp: 7.1,
    varF: 0.1,
    commentary: "yellow" as const,
    commentaryDone: 3,
    commentaryTotal: 3,
  },
  {
    dept: "IT",
    actual: 11.4,
    budget: 10.9,
    forecast: 11.2,
    varB: 0.5,
    varBp: 4.6,
    varF: 0.2,
    commentary: "green" as const,
    commentaryDone: 2,
    commentaryTotal: 3,
  },
  {
    dept: "Finance",
    actual: 3.9,
    budget: 4.2,
    forecast: 4.0,
    varB: -0.3,
    varBp: -7.1,
    varF: -0.1,
    commentary: "yellow" as const,
    commentaryDone: 2,
    commentaryTotal: 3,
  },
  {
    dept: "People & Culture",
    actual: 5.7,
    budget: 5.9,
    forecast: 5.8,
    varB: -0.2,
    varBp: -3.4,
    varF: -0.1,
    commentary: "red" as const,
    commentaryDone: 0,
    commentaryTotal: 1,
  },
  {
    dept: "Legal",
    actual: 0.85,
    budget: 0.85,
    forecast: 0.85,
    varB: 0,
    varBp: 0,
    varF: 0,
    commentary: "green" as const,
    commentaryDone: 1,
    commentaryTotal: 1,
  },
  {
    dept: "Operations",
    actual: 14.1,
    budget: 13.8,
    forecast: 14.0,
    varB: 0.3,
    varBp: 2.2,
    varF: 0.1,
    commentary: "yellow" as const,
    commentaryDone: 2,
    commentaryTotal: 3,
  },
  {
    dept: "R&D",
    actual: 3.45,
    budget: 3.2,
    forecast: 3.35,
    varB: 0.25,
    varBp: 7.8,
    varF: 0.1,
    commentary: "green" as const,
    commentaryDone: 2,
    commentaryTotal: 2,
  },
  {
    dept: "Shared Services",
    actual: 1.8,
    budget: 2.1,
    forecast: 2.0,
    varB: -0.3,
    varBp: -14.3,
    varF: -0.2,
    commentary: "red" as const,
    commentaryDone: 0,
    commentaryTotal: 2,
  },
]

export const mockCommentaryReqs = [
  { dept: "Product Development", area: "Headcount", owner: "Devon Lane", due: "May 30, 2025", variance: "$(0.80M)", status: "Overdue" as const },
  { dept: "Shared Services", area: "Professional Fees", owner: "Carly Fisher", due: "May 30, 2025", variance: "$(0.30M)", status: "Overdue" as const },
  { dept: "Finance", area: "Other Opex", owner: "Jane Cooper", due: "May 28, 2025", variance: "$(0.10M)", status: "In Progress" as const },
  { dept: "Sales", area: "Commissions", owner: "Wade Warren", due: "May 28, 2025", variance: "$1.00M", status: "In Progress" as const },
  { dept: "Marketing", area: "Advertising", owner: "Jane Cooper", due: "May 26, 2025", variance: "$0.40M", status: "Submitted" as const },
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
  { dept: "Sales", value: 2.4 },
  { dept: "Marketing", value: 0.4 },
  { dept: "Customer Success", value: 0.6 },
  { dept: "IT", value: 0.5 },
  { dept: "R&D", value: 0.25 },
  { dept: "Operations", value: 0.3 },
  { dept: "Product Development", value: -1.2 },
  { dept: "Finance", value: -0.3 },
  { dept: "People & Culture", value: -0.2 },
  { dept: "Shared Services", value: -0.3 },
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

// —— Revenue tab ——
export const mockRevKpis = [
  { label: "Total Revenue", value: "$125.8M", delta: "▲ 4.2% vs Budget", up: true, spark: [98, 102, 108, 112, 118, 122, 125.8] },
  { label: "YoY Growth", value: "18.4%", delta: "▲ 2.1 pp vs Plan", up: true, spark: [12, 13, 14, 15, 16, 17, 18.4] },
  { label: "ARR Mix", value: "58%", delta: "Subscription share", up: true, spark: [52, 53, 54, 55, 56, 57, 58] },
  { label: "Pipeline Cover", value: "1.4×", delta: "▲ 0.2× vs Q1", up: true, spark: [1.0, 1.05, 1.1, 1.15, 1.2, 1.3, 1.4] },
  { label: "Gross Margin", value: "60.7%", delta: "▲ 30 bps vs Budget", up: true, spark: [58, 58.5, 59, 59.5, 60, 60.3, 60.7] },
]

export const mockRevStreamRows = [
  { id: "sub", name: "Subscription ARR", region: "Global", method: "Subscribers × Fee", actual: 72.4, budget: 69.8, forecast: 73.1, yoy: 22.1, share: 58, entity: "North America" },
  { id: "con", name: "Contract Revenue", region: "EMEA", method: "Contract ÷ Months", actual: 31.2, budget: 30.5, forecast: 31.8, yoy: 14.5, share: 25, entity: "EMEA" },
  { id: "vol", name: "Volume / Price", region: "APAC", method: "Units × ASP", actual: 15.8, budget: 14.9, forecast: 16.0, yoy: 11.2, share: 12, entity: "APAC" },
  { id: "pip", name: "Pipeline Weighted", region: "North America", method: "Value × Prob %", actual: 6.4, budget: 6.3, forecast: 6.9, yoy: 8.4, share: 5, entity: "North America" },
]

export const mockRevByRegion = [
  { region: "North America", actual: 58.2, budget: 55.8, forecast: 59.1 },
  { region: "EMEA", actual: 34.6, budget: 33.2, forecast: 35.0 },
  { region: "APAC", actual: 22.4, budget: 21.5, forecast: 22.8 },
  { region: "LATAM", actual: 10.6, budget: 11.0, forecast: 10.3 },
]

export const mockRevMonthly = [
  { m: "Jan", actual: 9.2, budget: 9.0, forecast: 9.1 },
  { m: "Feb", actual: 9.5, budget: 9.2, forecast: 9.4 },
  { m: "Mar", actual: 9.8, budget: 9.5, forecast: 9.7 },
  { m: "Apr", actual: 10.1, budget: 9.8, forecast: 10.0 },
  { m: "May", actual: 10.4, budget: 10.0, forecast: 10.3 },
  { m: "Jun", actual: null, budget: 10.2, forecast: 10.6 },
  { m: "Jul", actual: null, budget: 10.4, forecast: 10.8 },
  { m: "Aug", actual: null, budget: 10.6, forecast: 11.0 },
]

export const mockRevDrivers = [
  { name: "Revenue Growth %", value: 4.5, unit: "%", impact: "+$5.1M at +1pp" },
  { name: "Churn Rate", value: 2.8, unit: "%", impact: "-$2.2M at +0.5pp" },
  { name: "ASP", value: 1240, unit: "$", impact: "+$1.8M at +5%" },
  { name: "Win Rate", value: 32, unit: "%", impact: "+$3.4M at +5pp" },
]

// —— Expenses tab ——
export const mockExpKpis = [
  { label: "Total OpEx", value: "$86.4M", delta: "▼ -2.1% vs Budget", up: true, spark: [72, 74, 76, 78, 80, 83, 86.4] },
  { label: "Budget Utilization", value: "94.2%", delta: "▲ 1.8 pp vs Apr", up: false, spark: [88, 89, 90, 91, 92, 93, 94.2] },
  { label: "Run Rate", value: "$88.1M", delta: "Annualized May", up: false, spark: [82, 83, 84, 85, 86, 87, 88.1] },
  { label: "Savings vs Budget", value: "$1.8M", delta: "▲ Favorable", up: true, spark: [0.2, 0.4, 0.6, 0.9, 1.1, 1.5, 1.8] },
  { label: "Headcount Cost", value: "$42.6M", delta: "49% of OpEx", up: false, spark: [38, 39, 40, 41, 41.5, 42, 42.6] },
]

export const mockExpDeptRows = [
  { id: "mkt", dept: "Marketing", category: "Advertising", budget: 11.0, actual: 12.1, runRate: 12.4, forecast: 12.4, headcount: 45, entity: "North America", status: "over" as const },
  { id: "sal", dept: "Sales", category: "Commissions", budget: 28.0, actual: 27.5, runRate: 27.8, forecast: 28.2, headcount: 120, entity: "North America", status: "ok" as const },
  { id: "it", dept: "IT", category: "Software", budget: 9.5, actual: 9.8, runRate: 10.0, forecast: 10.1, headcount: 88, entity: "EMEA", status: "watch" as const },
  { id: "ga", dept: "G&A", category: "Professional Fees", budget: 7.2, actual: 7.0, runRate: 7.1, forecast: 7.1, headcount: 32, entity: "EMEA", status: "ok" as const },
  { id: "eng", dept: "Engineering", category: "Payroll", budget: 18.2, actual: 18.0, runRate: 18.4, forecast: 18.6, headcount: 210, entity: "North America", status: "watch" as const },
  { id: "ops", dept: "Operations", category: "Facilities", budget: 6.8, actual: 7.55, runRate: 7.6, forecast: 7.4, headcount: 88, entity: "APAC", status: "over" as const },
  { id: "hr", dept: "People & Culture", category: "Payroll", budget: 5.9, actual: 5.7, runRate: 5.8, forecast: 5.8, headcount: 52, entity: "EMEA", status: "ok" as const },
]

export const mockExpCategoryMix = [
  { name: "Payroll", value: 42.6, color: "#2563eb" },
  { name: "Marketing", value: 12.4, color: "#7c3aed" },
  { name: "Sales", value: 28.2, color: "#0d9488" },
  { name: "IT & Software", value: 10.1, color: "#f59e0b" },
  { name: "G&A", value: 7.1, color: "#64748b" },
  { name: "Other", value: 6.0, color: "#94a3b8" },
]

export const mockExpMonthly = [
  { m: "Jan", budget: 6.8, actual: 6.9, forecast: 6.85 },
  { m: "Feb", budget: 6.9, actual: 7.0, forecast: 6.95 },
  { m: "Mar", budget: 7.0, actual: 7.1, forecast: 7.05 },
  { m: "Apr", budget: 7.1, actual: 7.2, forecast: 7.15 },
  { m: "May", budget: 7.2, actual: 7.4, forecast: 7.35 },
  { m: "Jun", budget: 7.3, actual: null, forecast: 7.45 },
  { m: "Jul", budget: 7.4, actual: null, forecast: 7.55 },
  { m: "Aug", budget: 7.5, actual: null, forecast: 7.65 },
]

// —— Cash Flow tab ——
export const mockCashKpis = [
  { label: "Closing Cash", value: "$38.4M", delta: "▲ 8.7% vs Apr", up: true, spark: [32, 33.2, 34.1, 35, 36.2, 37.5, 38.4] },
  { label: "Cash Runway", value: "14.2 mo", delta: "▲ 1.1 mo vs Budget", up: true, spark: [11.5, 12, 12.4, 12.8, 13.2, 13.8, 14.2] },
  { label: "Net Cash Flow", value: "$2.2M", delta: "May inflow", up: true, spark: [0.8, 1.0, 0.9, 1.1, 1.4, 1.8, 2.2] },
  { label: "Collections", value: "$10.4M", delta: "▲ 3.0% vs Budget", up: true, spark: [9.2, 9.5, 9.8, 10.1, 10.2, 10.3, 10.4] },
  { label: "Min Threshold", value: "$15.0M", delta: "Policy floor", up: true, spark: [15, 15, 15, 15, 15, 15, 15] },
]

export const mockCashStatementRows = [
  { id: "open", line: "Opening Cash", type: "total" as const, jan: 32.0, feb: 33.2, mar: 34.1, apr: 35.0, may: 36.2, jun: 37.1, jul: 38.0, aug: 38.8 },
  { id: "col", line: "Collections", type: "inflow" as const, jan: 9.2, feb: 9.5, mar: 9.8, apr: 10.1, may: 10.4, jun: 10.6, jul: 10.8, aug: 11.0 },
  { id: "oth-in", line: "Other Inflows", type: "inflow" as const, jan: 0.4, feb: 0.3, mar: 0.5, apr: 0.4, may: 0.6, jun: 0.5, jul: 0.4, aug: 0.5 },
  { id: "pay", line: "Payroll Out", type: "outflow" as const, jan: -4.1, feb: -4.1, mar: -4.2, apr: -4.3, may: -4.4, jun: -4.5, jul: -4.6, aug: -4.7 },
  { id: "sup", line: "Supplier Payments", type: "outflow" as const, jan: -3.2, feb: -3.3, mar: -3.4, apr: -3.5, may: -3.6, jun: -3.7, jul: -3.8, aug: -3.9 },
  { id: "capex", line: "CapEx", type: "outflow" as const, jan: -1.2, feb: -0.8, mar: -1.5, apr: -0.9, may: -1.1, jun: -1.4, jul: -0.7, aug: -1.0 },
  { id: "debt", line: "Debt Service", type: "outflow" as const, jan: -0.5, feb: -0.5, mar: -0.5, apr: -0.5, may: -0.5, jun: -0.5, jul: -0.5, aug: -0.5 },
  { id: "close", line: "Closing Cash", type: "total" as const, jan: 33.2, feb: 34.1, mar: 35.0, apr: 36.2, may: 38.4, jun: 39.1, jul: 40.1, aug: 41.2 },
]

export const mockCashMonthly = [
  { m: "Jan", inflow: 9.6, outflow: -8.9, net: 0.7, closing: 33.2 },
  { m: "Feb", inflow: 9.8, outflow: -8.7, net: 1.1, closing: 34.1 },
  { m: "Mar", inflow: 10.3, outflow: -9.4, net: 0.9, closing: 35.0 },
  { m: "Apr", inflow: 10.5, outflow: -9.2, net: 1.3, closing: 36.2 },
  { m: "May", inflow: 11.0, outflow: -8.6, net: 2.4, closing: 38.4 },
  { m: "Jun", inflow: 11.1, outflow: -10.1, net: 1.0, closing: 39.1 },
  { m: "Jul", inflow: 11.2, outflow: -9.6, net: 1.6, closing: 40.1 },
  { m: "Aug", inflow: 11.5, outflow: -10.1, net: 1.4, closing: 41.2 },
]

export const mockCashRunwayScenarios = [
  { scenario: "Downside", months: 10.2, closing: 25.1 },
  { scenario: "Base", months: 14.2, closing: 38.4 },
  { scenario: "Upside", months: 17.6, closing: 53.2 },
]

export const mockCashDrivers = [
  { name: "Collection Days", value: 45, unit: "days", impact: "+$0.6M at +5 days" },
  { name: "Payroll Timing", value: 2, unit: "days", impact: "Shift outflow by 2 days" },
  { name: "FX Rate", value: 28.4, unit: "ZiG/USD", impact: "±$0.4M sensitivity" },
  { name: "Min Cash Policy", value: 15, unit: "M", impact: "Treasury floor" },
]

// —— Workforce tab ——
export const mockWfKpis = [
  { label: "Total Headcount", value: "532", delta: "▲ 12 vs Budget", up: true, spark: [498, 505, 512, 518, 524, 528, 532] },
  { label: "Payroll Cost", value: "$42.6M", delta: "▲ 3.2% vs Budget", up: false, spark: [38, 39, 40, 41, 41.5, 42, 42.6] },
  { label: "Net Hires (YTD)", value: "+34", delta: "23 hires · 9 exits", up: true, spark: [4, 8, 12, 18, 22, 28, 34] },
  { label: "Attrition Rate", value: "8.2%", delta: "▼ 0.6 pp vs Plan", up: true, spark: [9.5, 9.2, 9.0, 8.8, 8.6, 8.4, 8.2] },
  { label: "Open Roles", value: "18", delta: "6 critical", up: false, spark: [24, 22, 21, 20, 19, 18, 18] },
]

export const mockWfDeptRows = [
  { id: "eng", dept: "Engineering", entity: "North America", hc: 210, budgetHc: 205, salary: 18.2, avgSalary: 86.7, hires: 12, attrition: 4, openRoles: 8, status: "hiring" as const },
  { id: "sal", dept: "Sales", entity: "North America", hc: 120, budgetHc: 118, salary: 8.4, avgSalary: 70.0, hires: 6, attrition: 2, openRoles: 4, status: "on-track" as const },
  { id: "ops", dept: "Operations", entity: "APAC", hc: 88, budgetHc: 90, salary: 5.6, avgSalary: 63.6, hires: 2, attrition: 2, openRoles: 1, status: "on-track" as const },
  { id: "mkt", dept: "Marketing", entity: "North America", hc: 45, budgetHc: 48, salary: 3.1, avgSalary: 68.9, hires: 3, attrition: 1, openRoles: 2, status: "under" as const },
  { id: "cs", dept: "Customer Success", entity: "EMEA", hc: 38, budgetHc: 36, salary: 2.8, avgSalary: 73.7, hires: 4, attrition: 1, openRoles: 1, status: "over" as const },
  { id: "fin", dept: "Finance", entity: "EMEA", hc: 31, budgetHc: 32, salary: 2.4, avgSalary: 77.4, hires: 1, attrition: 0, openRoles: 1, status: "on-track" as const },
]

export const mockWfHirePlan = [
  { month: "Jun", planned: 8, actual: 6 },
  { month: "Jul", planned: 10, actual: null },
  { month: "Aug", planned: 12, actual: null },
  { month: "Sep", planned: 9, actual: null },
  { month: "Oct", planned: 7, actual: null },
  { month: "Nov", planned: 5, actual: null },
  { month: "Dec", planned: 4, actual: null },
]

export const mockWfAttritionTrend = [
  { m: "Jan", rate: 9.5 },
  { m: "Feb", rate: 9.2 },
  { m: "Mar", rate: 9.0 },
  { m: "Apr", rate: 8.8 },
  { m: "May", rate: 8.2 },
  { m: "Jun", rate: 8.0 },
]

export const mockWfDrivers = [
  { name: "Salary Inflation", value: 6.0, unit: "%", impact: "+$2.1M at +1pp" },
  { name: "Merit Increase", value: 4.5, unit: "%", impact: "Annual cycle Jul 1" },
  { name: "Backfill SLA", value: 45, unit: "days", impact: "Avg time to hire" },
  { name: "Contractor Mix", value: 8, unit: "%", impact: "Of total payroll" },
]
