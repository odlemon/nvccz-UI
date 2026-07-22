export const dashboardMetrics = [
  { id: "aum", label: "AUM", value: "$2.48B", trend: "▲ 8.7% vs Apr 30", trendPositive: true, iconBg: "#DBEAFE", iconColor: "#2563EB" },
  { id: "funds", label: "Active Funds", value: "12", trend: "▲ 1 vs Apr 30", trendPositive: true, iconBg: "#F5F3FF", iconColor: "#7C3AED" },
  { id: "companies", label: "Portfolio Companies", value: "48", trend: "▲ 3 vs Apr 30", trendPositive: true, iconBg: "#D1FAE5", iconColor: "#10B981" },
  { id: "irr", label: "IRR (Net)", value: "18.6%", trend: "▲ 1.2pp vs Apr 30", trendPositive: true, iconBg: "#CCFBF1", iconColor: "#0D9488" },
  { id: "tvpi", label: "TVPI (Net)", value: "2.13x", trend: "▲ 0.08x vs Apr 30", trendPositive: true, iconBg: "#E0F2FE", iconColor: "#0284C7" },
  { id: "cash", label: "Cash Available", value: "$126.4M", trend: "▼ 4.1% vs Apr 30", trendPositive: false, iconBg: "#FFEDD5", iconColor: "#F97316" },
  { id: "calls", label: "Open Capital Calls", value: "$73.2M", trend: "▲ 12.4% vs Apr 30", trendPositive: false, iconBg: "#FEE2E2", iconColor: "#EF4444" },
  { id: "reports", label: "Upcoming Reports", value: "7", trend: "2 due this week", trendPositive: undefined, iconBg: "#EDE9FE", iconColor: "#6D28D9" },
]

export const fundTrend = [
  { month: "Jun '24", irr: 14.2, tvpi: 1.72 },
  { month: "Jul '24", irr: 14.8, tvpi: 1.78 },
  { month: "Aug '24", irr: 15.1, tvpi: 1.82 },
  { month: "Sep '24", irr: 15.9, tvpi: 1.88 },
  { month: "Oct '24", irr: 16.4, tvpi: 1.94 },
  { month: "Nov '24", irr: 16.8, tvpi: 1.98 },
  { month: "Dec '24", irr: 17.2, tvpi: 2.02 },
  { month: "Jan '25", irr: 17.5, tvpi: 2.05 },
  { month: "Feb '25", irr: 17.9, tvpi: 2.08 },
  { month: "Mar '25", irr: 18.1, tvpi: 2.1 },
  { month: "Apr '25", irr: 18.3, tvpi: 2.11 },
  { month: "May '25", irr: 18.6, tvpi: 2.13 },
]

export const allocation = [
  { name: "Growth Equity", value: 820, pct: 33, color: "#2563EB" },
  { name: "Buyout", value: 620, pct: 25, color: "#38BDF8" },
  { name: "Venture Capital", value: 446, pct: 18, color: "#86EFAC" },
  { name: "Credit", value: 372, pct: 15, color: "#10B981" },
  { name: "Real Assets", value: 223, pct: 9, color: "#F87171" },
]

export const lpActivity = [
  { label: "Total LPs", value: "186", trend: "+4", up: true },
  { label: "New LP Commitments", value: "$42.5M", trend: "+12%", up: true },
  { label: "Capital Called (MTD)", value: "$18.2M", trend: "-3%", up: false },
  { label: "Distributions (MTD)", value: "$9.7M", trend: "+8%", up: true },
  { label: "Pending KYC", value: "11", trend: "+2", up: false },
]

export const recentDeals = [
  { company: "NovaPay Africa", strategy: "Growth", stage: "Series B", amount: "$18.0M", submitted: "12 May 2025", status: "Under Review", tone: "info" as const },
  { company: "GreenGrid Energy", strategy: "Infra", stage: "Seed", amount: "$4.2M", submitted: "11 May 2025", status: "New", tone: "info" as const },
  { company: "Harvest Logistics", strategy: "Buyout", stage: "Diligence", amount: "$32.5M", submitted: "09 May 2025", status: "Due Diligence", tone: "purple" as const },
  { company: "Skyline PropTech", strategy: "Venture", stage: "Term Sheet", amount: "$7.8M", submitted: "07 May 2025", status: "Term Sheet", tone: "success" as const },
]

export const capitalCalls = [
  { fund: "Arcus Growth II", callNo: "Call 07", amount: "$12.4M", called: "02 May 2025", due: "16 May 2025", status: "Open", tone: "success" as const },
  { fund: "Horizon Credit I", callNo: "Call 04", amount: "$8.1M", called: "28 Apr 2025", due: "12 May 2025", status: "Overdue", tone: "danger" as const },
  { fund: "Venture Seed III", callNo: "Call 11", amount: "$3.6M", called: "05 May 2025", due: "19 May 2025", status: "Open", tone: "success" as const },
]

export const reportingSchedule = [
  { report: "Q1 LP Letter", fund: "Arcus Growth II", due: "20 May 2025", status: "Due Soon", tone: "warning" as const },
  { report: "NAV Pack", fund: "Horizon Credit I", due: "28 May 2025", status: "Upcoming", tone: "info" as const },
  { report: "ESG Update", fund: "All Funds", due: "31 May 2025", status: "Upcoming", tone: "info" as const },
]

export const topFunds = [
  { fund: "Alpha Growth Fund", vintage: "2019", strategy: "Growth", irr: "24.1%", tvpi: "2.84x", dpi: "1.12x", aum: "$420M" },
  { fund: "Venture Seed III", vintage: "2021", strategy: "Venture", irr: "21.4%", tvpi: "2.31x", dpi: "0.64x", aum: "$185M" },
  { fund: "Strategic Buyout I", vintage: "2018", strategy: "Buyout", irr: "19.8%", tvpi: "2.55x", dpi: "1.41x", aum: "$610M" },
  { fund: "Credit Opportunities", vintage: "2020", strategy: "Credit", irr: "14.2%", tvpi: "1.48x", dpi: "0.92x", aum: "$290M" },
  { fund: "Real Assets Partners", vintage: "2017", strategy: "Real Assets", irr: "12.6%", tvpi: "1.72x", dpi: "1.05x", aum: "$340M" },
]

export const distributionsVsContributions = [
  { month: "Jan '25", contributions: 42, distributions: 18 },
  { month: "Feb '25", contributions: 38, distributions: 22 },
  { month: "Mar '25", contributions: 55, distributions: 31 },
  { month: "Apr '25", contributions: 48, distributions: 27 },
  { month: "May '25", contributions: 61, distributions: 35 },
]
