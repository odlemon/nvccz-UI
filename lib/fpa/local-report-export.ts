export type LocalReportType =
  | "BOARD_PACK"
  | "MANAGEMENT_REPORT"
  | "FINANCIAL_STATEMENTS"
  | "DEPT_EXPENSES"

export type GeneratedReport = {
  exportType: LocalReportType
  filename: string
  mimeType: string
  content: string
  sizeLabel: string
  generatedAt: string
}

const ORG = "Arcus Holdings Ltd."
const PREPARED_BY = "Office of the CFO — FP&A"
const CLASSIFICATION = "Confidential — Board & Executive Distribution Only"

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function rowsToCsv(rows: string[][]): string {
  return `\uFEFF${rows.map((r) => r.map(csvEscape).join(",")).join("\r\n")}`
}

function formatSize(content: string): string {
  const kb = Math.max(1, Math.round(new Blob([content]).size / 1024))
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

function pctVar(actual: number, budget: number): string {
  if (!budget) return "—"
  return `${(((actual - budget) / budget) * 100).toFixed(1)}%`
}

function amtVar(actual: number, budget: number): string {
  const v = actual - budget
  return v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
}

function reportHeaderRows(title: string, period: string, modelLabel: string): string[][] {
  const ts = new Date().toISOString()
  return [
    [title],
    ["Organization", ORG],
    ["Planning Model", modelLabel],
    ["Reporting Period", period],
    ["Prepared By", PREPARED_BY],
    ["Generated At (UTC)", ts],
    ["Classification", CLASSIFICATION],
    ["Currency", "USD (millions unless stated)"],
    [],
  ]
}

function boardPackJson(modelLabel: string, period: string): string {
  const generatedAt = new Date().toISOString()
  return JSON.stringify(
    {
      documentControl: {
        title: "Board of Directors — Financial & Operating Review",
        organization: ORG,
        model: modelLabel,
        period,
        preparedBy: PREPARED_BY,
        generatedAt,
        classification: CLASSIFICATION,
        version: "1.0",
        distribution: ["Board of Directors", "Audit Committee", "Executive Leadership Team"],
      },
      tableOfContents: [
        "1. Executive Summary & CEO Letter",
        "2. Financial Performance Dashboard",
        "3. Income Statement — Consolidated",
        "4. Cash Flow & Liquidity",
        "5. Variance Analysis by Department",
        "6. Revenue & Pipeline Commentary",
        "7. Workforce & Compensation",
        "8. Scenario Comparison (Base / Upside / Downside)",
        "9. Capital Expenditure & Investments",
        "10. Risk Register & Mitigations",
        "11. Management Action Items",
        "12. Appendix — Monthly Trend Data",
      ],
      executiveSummary: {
        headline: "Revenue ahead of plan; EBITDA margin stable despite opex investments in GTM.",
        narrative:
          "Consolidated revenue reached $118.2M YTD against a budget of $120.8M (-2.1%), with Q2 acceleration driven by North America enterprise renewals. Full-year forecast has been raised to $125.8M (+4.2% vs original budget) reflecting improved pipeline conversion and pricing realization. EBITDA of $23.8M is below budget due to deliberate investments in cloud infrastructure and marketing campaigns supporting the H2 product launch. Cash position remains strong at $42.6M with 14 months runway at current burn.",
        strategicPriorities: [
          { priority: "Accelerate enterprise ARR growth", owner: "CRO", status: "On Track", target: "$142M FY26 exit ARR" },
          { priority: "Reduce cloud unit cost 12%", owner: "CTO", status: "At Risk", target: "Q3 FY26" },
          { priority: "Launch EMEA regional hub", owner: "COO", status: "On Track", target: "Sep 2026" },
          { priority: "Complete SOC 2 Type II audit", owner: "CFO", status: "On Track", target: "Aug 2026" },
        ],
      },
      financialDashboard: {
        kpis: [
          { metric: "Total Revenue", actual: 118.2, budget: 120.8, forecast: 125.8, priorYear: 108.4, unit: "USD M", variancePct: -2.1, forecastVsBudgetPct: 4.2 },
          { metric: "Gross Profit", actual: 72.4, budget: 74.1, forecast: 78.2, priorYear: 66.8, unit: "USD M", variancePct: -2.3, forecastVsBudgetPct: 5.5 },
          { metric: "Gross Margin %", actual: 61.3, budget: 61.3, forecast: 62.2, priorYear: 61.6, unit: "%", variancePct: 0.0, forecastVsBudgetPct: 0.9 },
          { metric: "Operating Expenses", actual: 48.6, budget: 46.2, forecast: 49.8, priorYear: 44.1, unit: "USD M", variancePct: 5.2, forecastVsBudgetPct: 7.8 },
          { metric: "EBITDA", actual: 23.8, budget: 27.9, forecast: 28.4, priorYear: 22.7, unit: "USD M", variancePct: -14.7, forecastVsBudgetPct: 1.8 },
          { metric: "EBITDA Margin %", actual: 20.1, budget: 23.1, forecast: 22.6, priorYear: 21.0, unit: "%", variancePct: -3.0, forecastVsBudgetPct: -0.5 },
          { metric: "Net Income", actual: 13.9, budget: 17.4, forecast: 18.2, priorYear: 12.1, unit: "USD M", variancePct: -20.1, forecastVsBudgetPct: 4.6 },
          { metric: "Free Cash Flow", actual: 18.4, budget: 16.2, forecast: 19.8, priorYear: 14.6, unit: "USD M", variancePct: 13.6, forecastVsBudgetPct: 22.2 },
          { metric: "Cash & Equivalents", actual: 42.6, budget: 38.1, forecast: 44.2, priorYear: 35.8, unit: "USD M", variancePct: 11.8, forecastVsBudgetPct: 16.0 },
          { metric: "Headcount (FTE)", actual: 842, budget: 820, forecast: 868, priorYear: 756, unit: "FTE", variancePct: 2.7, forecastVsBudgetPct: 5.9 },
        ],
        revenueByRegion: [
          { region: "North America", actual: 68.4, budget: 70.2, forecast: 74.1, sharePct: 57.9 },
          { region: "EMEA", actual: 28.6, budget: 31.4, forecast: 32.8, sharePct: 24.2 },
          { region: "APAC", actual: 14.2, budget: 13.8, forecast: 14.4, sharePct: 12.0 },
          { region: "LATAM", actual: 7.0, budget: 5.4, forecast: 4.5, sharePct: 5.9 },
        ],
        revenueByStream: [
          { stream: "Subscription — Enterprise", actual: 72.8, budget: 74.2, forecast: 79.4, growthYoY: 11.2 },
          { stream: "Subscription — Mid-Market", actual: 28.4, budget: 29.6, forecast: 30.2, growthYoY: 8.4 },
          { stream: "Professional Services", actual: 11.2, budget: 10.8, forecast: 11.8, growthYoY: 4.1 },
          { stream: "Usage & Overage", actual: 5.8, budget: 6.2, forecast: 4.4, growthYoY: -2.3 },
        ],
      },
      incomeStatement: {
        currency: "USD",
        unit: "millions",
        lines: [
          { line: "Revenue", actual: 118.2, budget: 120.8, forecast: 125.8, priorYear: 108.4 },
          { line: "Cost of Revenue", actual: 45.8, budget: 46.7, forecast: 47.6, priorYear: 41.6 },
          { line: "Gross Profit", actual: 72.4, budget: 74.1, forecast: 78.2, priorYear: 66.8, isSubtotal: true },
          { line: "Sales & Marketing", actual: 22.4, budget: 20.8, forecast: 23.1, priorYear: 19.2 },
          { line: "Research & Development", actual: 18.6, budget: 17.4, forecast: 19.2, priorYear: 16.8 },
          { line: "General & Administrative", actual: 7.6, budget: 8.0, forecast: 7.5, priorYear: 8.1 },
          { line: "Total Operating Expenses", actual: 48.6, budget: 46.2, forecast: 49.8, priorYear: 44.1, isSubtotal: true },
          { line: "EBITDA", actual: 23.8, budget: 27.9, forecast: 28.4, priorYear: 22.7, isSubtotal: true },
          { line: "Depreciation & Amortization", actual: 4.2, budget: 4.0, forecast: 4.2, priorYear: 3.8 },
          { line: "EBIT", actual: 19.6, budget: 23.9, forecast: 24.2, priorYear: 18.9, isSubtotal: true },
          { line: "Interest Expense", actual: 1.8, budget: 1.7, forecast: 1.8, priorYear: 1.6 },
          { line: "Tax Expense", actual: 3.9, budget: 4.8, forecast: 4.2, priorYear: 3.2 },
          { line: "Net Income", actual: 13.9, budget: 17.4, forecast: 18.2, priorYear: 12.1, isSubtotal: true },
        ],
      },
      cashFlowSummary: {
        operatingActivities: { actual: 24.6, budget: 22.8, forecast: 26.4 },
        investingActivities: { actual: -8.2, budget: -10.4, forecast: -9.8 },
        financingActivities: { actual: -2.4, budget: -1.8, forecast: -2.2 },
        netChangeInCash: { actual: 14.0, budget: 10.6, forecast: 14.4 },
        openingCash: { actual: 28.6, budget: 27.5, forecast: 29.8 },
        closingCash: { actual: 42.6, budget: 38.1, forecast: 44.2 },
        runwayMonths: 14,
        covenantCompliance: "All debt covenants in compliance. Net leverage 1.2x vs covenant max 3.0x.",
      },
      varianceAnalysis: [
        { department: "Engineering", metric: "Opex", budget: 18.4, actual: 19.9, forecast: 20.2, varianceAmt: 1.5, variancePct: 8.2, status: "Unfavorable", owner: "Leslie Alexander", commentary: "AWS reserved instance true-up and contractor ramp for platform migration." },
        { department: "Sales", metric: "Revenue", budget: 31.2, actual: 30.2, forecast: 32.4, varianceAmt: -1.0, variancePct: -3.2, status: "Unfavorable", owner: "Wade Warren", commentary: "EMEA enterprise deals slipped to Q3; NA upsell exceeded plan." },
        { department: "Marketing", metric: "Opex", budget: 6.8, actual: 7.6, forecast: 7.4, varianceAmt: 0.8, variancePct: 11.8, status: "Unfavorable", owner: "Jane Cooper", commentary: "H2 launch campaign spend pulled forward; ROI tracking on plan." },
        { department: "Customer Success", metric: "Revenue Retention", budget: 94.0, actual: 95.2, forecast: 95.8, varianceAmt: 1.2, variancePct: 1.3, status: "Favorable", owner: "Esther Howard", commentary: "Enterprise NRR improved on expansion modules." },
        { department: "Operations", metric: "Opex", budget: 9.2, actual: 9.0, forecast: 9.3, varianceAmt: -0.2, variancePct: -2.2, status: "Favorable", owner: "Cameron W.", commentary: "Facilities consolidation savings partially offset logistics uplift." },
        { department: "Finance", metric: "Opex", budget: 3.1, actual: 3.0, forecast: 3.1, varianceAmt: -0.1, variancePct: -3.2, status: "Favorable", owner: "Robert Fox", commentary: "Audit fees re-phased to H2." },
      ],
      scenarioComparison: {
        scenarios: ["Base Case", "Upside", "Downside", "FX Shock"],
        metrics: [
          { metric: "FY26 Revenue", values: [125.8, 138.3, 112.4, 121.6] },
          { metric: "FY26 EBITDA", values: [28.4, 34.1, 21.8, 25.2] },
          { metric: "FY26 FCF", values: [19.8, 26.4, 12.6, 16.8] },
          { metric: "Exit Headcount", values: [868, 912, 798, 852] },
          { metric: "Cash Runway (mo)", values: [14, 18, 10, 12] },
        ],
        keyAssumptions: {
          "Base Case": { revenueGrowth: "8.7%", opexGrowth: "6.4%", fxRate: "1.09", attrition: "11%" },
          Upside: { revenueGrowth: "14.2%", opexGrowth: "8.1%", fxRate: "1.07", attrition: "9%" },
          Downside: { revenueGrowth: "3.1%", opexGrowth: "4.2%", fxRate: "1.14", attrition: "14%" },
          "FX Shock": { revenueGrowth: "6.8%", opexGrowth: "6.4%", fxRate: "1.18", attrition: "11%" },
        },
      },
      workforceSummary: {
        totalFte: 842,
        openRoles: 26,
        avgFullyLoadedCost: 142000,
        departments: [
          { dept: "Engineering", fte: 312, budgetFte: 298, avgSalary: 148000, attritionYtd: 9.2 },
          { dept: "Sales", fte: 186, budgetFte: 192, avgSalary: 118000, attritionYtd: 14.1 },
          { dept: "Marketing", fte: 64, budgetFte: 62, avgSalary: 105000, attritionYtd: 8.4 },
          { dept: "Customer Success", fte: 98, budgetFte: 94, avgSalary: 92000, attritionYtd: 11.6 },
          { dept: "Operations", fte: 72, budgetFte: 74, avgSalary: 88000, attritionYtd: 7.8 },
          { dept: "G&A / Finance", fte: 110, budgetFte: 100, avgSalary: 96000, attritionYtd: 6.2 },
        ],
      },
      capexAndInvestments: [
        { project: "Data Platform Modernization", budget: 4.2, actual: 3.8, forecast: 4.6, status: "In Progress", completion: "Q3 FY26" },
        { project: "HQ Office Fit-Out Phase 2", budget: 2.4, actual: 1.2, forecast: 2.8, status: "In Progress", completion: "Q4 FY26" },
        { project: "Security & Compliance Tooling", budget: 1.8, actual: 1.6, forecast: 1.8, status: "On Track", completion: "Q2 FY26" },
        { project: "Short-Term Treasury Investments", budget: 5.0, actual: 5.0, forecast: 5.0, status: "Complete", completion: "Q1 FY26" },
      ],
      riskRegister: [
        { id: "R-01", risk: "Cloud cost inflation exceeds 15% YoY", likelihood: "Medium", impact: "High", mitigation: "Reserved capacity program + FinOps review cadence", owner: "CTO" },
        { id: "R-02", risk: "Key enterprise customer churn (> $2M ARR)", likelihood: "Low", impact: "High", mitigation: "Executive sponsor program + QBR expansion playbook", owner: "CRO" },
        { id: "R-03", risk: "FX headwind on EMEA revenue (USD/EUR)", likelihood: "Medium", impact: "Medium", mitigation: "Natural hedge via local opex + rolling hedges", owner: "CFO" },
        { id: "R-04", risk: "Hiring plan delays for platform team", likelihood: "High", impact: "Medium", mitigation: "Contractor bench + revised milestone scope", owner: "CHRO" },
      ],
      actionItems: [
        { item: "Approve revised FY26 forecast and H2 opex envelope", owner: "Board", due: "Next meeting", priority: "High" },
        { item: "Present EMEA hub business case", owner: "COO", due: "Jul 2026", priority: "Medium" },
        { item: "Finalize cloud cost reduction plan", owner: "CTO / CFO", due: "Aug 2026", priority: "High" },
        { item: "Complete variance commentary for >10% line items", owner: "Department Heads", due: "Jul 2026", priority: "Medium" },
      ],
      monthlyTrend: [
        { month: "Oct 2025", revenue: 9.0, budget: 9.2, forecast: 9.4, ebitda: 1.8, headcount: 798 },
        { month: "Nov 2025", revenue: 9.2, budget: 9.4, forecast: 9.6, ebitda: 1.9, headcount: 804 },
        { month: "Dec 2025", revenue: 9.8, budget: 10.0, forecast: 10.2, ebitda: 2.1, headcount: 812 },
        { month: "Jan 2026", revenue: 9.2, budget: 9.6, forecast: 9.8, ebitda: 1.7, headcount: 818 },
        { month: "Feb 2026", revenue: 9.5, budget: 9.8, forecast: 10.1, ebitda: 1.8, headcount: 826 },
        { month: "Mar 2026", revenue: 9.8, budget: 10.0, forecast: 10.4, ebitda: 1.9, headcount: 832 },
        { month: "Apr 2026", revenue: 10.1, budget: 10.2, forecast: 10.6, ebitda: 2.0, headcount: 836 },
        { month: "May 2026", revenue: 10.4, budget: 10.4, forecast: 10.9, ebitda: 2.1, headcount: 840 },
        { month: "Jun 2026", revenue: 10.8, budget: 10.6, forecast: 11.2, ebitda: 2.2, headcount: 842 },
      ],
      disclaimer:
        "This board pack contains forward-looking statements based on management assumptions. Actual results may differ materially. Figures are unaudited and subject to period-end close adjustments.",
    },
    null,
    2,
  )
}

function managementReportCsv(period: string, modelLabel: string): string {
  const rows: string[][] = [
    ...reportHeaderRows("Management Operating Report — Consolidated", period, modelLabel),
    ["SECTION 1", "Executive KPI Summary"],
    ["Metric", "Actual ($M)", "Budget ($M)", "Forecast ($M)", "Prior Year ($M)", "Var vs Budget ($M)", "Var vs Budget %", "Var vs PY %"],
    ["Total Revenue", "118.2", "120.8", "125.8", "108.4", amtVar(118.2, 120.8), pctVar(118.2, 120.8), pctVar(118.2, 108.4)],
    ["Gross Profit", "72.4", "74.1", "78.2", "66.8", amtVar(72.4, 74.1), pctVar(72.4, 74.1), pctVar(72.4, 66.8)],
    ["Gross Margin %", "61.3", "61.3", "62.2", "61.6", "0.0", "0.0%", pctVar(61.3, 61.6)],
    ["Operating Expenses", "48.6", "46.2", "49.8", "44.1", amtVar(48.6, 46.2), pctVar(48.6, 46.2), pctVar(48.6, 44.1)],
    ["EBITDA", "23.8", "27.9", "28.4", "22.7", amtVar(23.8, 27.9), pctVar(23.8, 27.9), pctVar(23.8, 22.7)],
    ["EBITDA Margin %", "20.1", "23.1", "22.6", "21.0", "-3.0", "-13.0%", "-4.3%"],
    ["Net Income", "13.9", "17.4", "18.2", "12.1", amtVar(13.9, 17.4), pctVar(13.9, 17.4), pctVar(13.9, 12.1)],
    ["Free Cash Flow", "18.4", "16.2", "19.8", "14.6", amtVar(18.4, 16.2), pctVar(18.4, 16.2), pctVar(18.4, 14.6)],
    [],
    ["SECTION 2", "Department P&L — Budget vs Actual vs Forecast"],
    ["Department", "Metric", "Budget ($M)", "Actual ($M)", "Forecast ($M)", "Variance ($M)", "Variance %", "Owner", "Commentary Required"],
    ["Engineering", "Opex", "18.4", "19.9", "20.2", "1.5", "8.2%", "Leslie Alexander", "Yes — cloud infra uplift"],
    ["Sales", "Revenue", "31.2", "30.2", "32.4", "-1.0", "-3.2%", "Wade Warren", "Yes — EMEA slip"],
    ["Sales", "Opex", "12.1", "11.7", "12.4", "-0.4", "-3.3%", "Wade Warren", "No"],
    ["Marketing", "Opex", "6.8", "7.6", "7.4", "0.8", "11.8%", "Jane Cooper", "Yes — campaign pull-forward"],
    ["Customer Success", "Opex", "5.4", "5.6", "5.8", "0.2", "3.7%", "Esther Howard", "No"],
    ["Operations", "Opex", "9.2", "9.0", "9.3", "-0.2", "-2.2%", "Cameron W.", "No"],
    ["Finance", "Opex", "3.1", "3.0", "3.1", "-0.1", "-3.2%", "Robert Fox", "No"],
    ["G&A", "Opex", "4.2", "4.4", "4.3", "0.2", "4.8%", "Robert Fox", "No"],
    ["Total", "Opex", "59.2", "61.2", "62.5", "2.0", "3.4%", "CFO", "—"],
    [],
    ["SECTION 3", "Revenue Bridge — Budget to Forecast ($M)"],
    ["Bridge Component", "Amount ($M)", "Notes"],
    ["Opening Budget (FY26)", "120.8", "Board-approved plan"],
    ["Price / Mix", "+4.2", "Enterprise tier repricing"],
    ["Volume / New Logos", "+5.1", "NA pipeline conversion"],
    ["Churn & Contraction", "-2.8", "Within model assumptions"],
    ["FX Translation", "-1.8", "EUR weakness vs USD"],
    ["In-Year M&A (Pipeline)", "0.0", "Not included in base"],
    ["Closing Forecast (FY26)", "125.8", "Management base case"],
    [],
    ["SECTION 4", "Monthly Revenue & EBITDA Trend"],
    ["Month", "Revenue Actual", "Revenue Budget", "Revenue Forecast", "EBITDA Actual", "EBITDA Budget", "Headcount"],
    ["Oct 2025", "9.0", "9.2", "9.4", "1.8", "2.0", "798"],
    ["Nov 2025", "9.2", "9.4", "9.6", "1.9", "2.1", "804"],
    ["Dec 2025", "9.8", "10.0", "10.2", "2.1", "2.3", "812"],
    ["Jan 2026", "9.2", "9.6", "9.8", "1.7", "2.0", "818"],
    ["Feb 2026", "9.5", "9.8", "10.1", "1.8", "2.1", "826"],
    ["Mar 2026", "9.8", "10.0", "10.4", "1.9", "2.2", "832"],
    ["Apr 2026", "10.1", "10.2", "10.6", "2.0", "2.2", "836"],
    ["May 2026", "10.4", "10.4", "10.9", "2.1", "2.3", "840"],
    ["Jun 2026", "10.8", "10.6", "11.2", "2.2", "2.4", "842"],
    [],
    ["SECTION 5", "Commentary Requirements (>5% variance)"],
    ["Department", "Line Item", "Variance %", "Status", "Due Date", "Assigned To"],
    ["Engineering", "Cloud & Infrastructure", "14.2%", "Submitted", "Jul 15 2026", "Leslie Alexander"],
    ["Marketing", "Digital Campaigns", "18.6%", "Submitted", "Jul 15 2026", "Jane Cooper"],
    ["Sales", "Enterprise Revenue", "-3.2%", "Pending", "Jul 20 2026", "Wade Warren"],
    ["Operations", "Logistics", "6.8%", "Pending", "Jul 20 2026", "Cameron W."],
  ]
  return rowsToCsv(rows)
}

function financialStatementsCsv(period: string, modelLabel: string): string {
  const rows: string[][] = [
    ...reportHeaderRows("Consolidated Financial Statements Package", period, modelLabel),
    ["STATEMENT 1", "Consolidated Income Statement (USD millions)"],
    ["Line Item", "YTD Actual", "YTD Budget", "YTD Forecast", "Prior Year YTD", "Full Year Budget", "Full Year Forecast"],
    ["Revenue", "118.2", "120.8", "125.8", "108.4", "482.0", "503.2"],
    ["Cost of Revenue", "45.8", "46.7", "47.6", "41.6", "186.4", "190.8"],
    ["Gross Profit", "72.4", "74.1", "78.2", "66.8", "295.6", "312.4"],
    ["Gross Margin %", "61.3%", "61.3%", "62.2%", "61.6%", "61.3%", "62.1%"],
    ["Sales & Marketing", "22.4", "20.8", "23.1", "19.2", "84.2", "92.4"],
    ["Research & Development", "18.6", "17.4", "19.2", "16.8", "70.8", "76.8"],
    ["General & Administrative", "7.6", "8.0", "7.5", "8.1", "32.0", "30.0"],
    ["Total Operating Expenses", "48.6", "46.2", "49.8", "44.1", "187.0", "199.2"],
    ["EBITDA", "23.8", "27.9", "28.4", "22.7", "108.6", "113.2"],
    ["Depreciation & Amortization", "4.2", "4.0", "4.2", "3.8", "16.0", "16.8"],
    ["EBIT", "19.6", "23.9", "24.2", "18.9", "92.6", "96.4"],
    ["Interest Expense", "1.8", "1.7", "1.8", "1.6", "6.8", "7.2"],
    ["Other Income / (Expense)", "0.2", "0.0", "0.1", "-0.1", "0.4", "0.2"],
    ["Pre-Tax Income", "18.0", "22.2", "22.5", "17.2", "86.2", "89.4"],
    ["Tax Expense", "3.9", "4.8", "4.2", "3.2", "18.6", "17.8"],
    ["Net Income", "13.9", "17.4", "18.2", "12.1", "67.6", "71.6"],
    [],
    ["STATEMENT 2", "Consolidated Balance Sheet (USD millions)"],
    ["Line Item", "Current Period", "Prior Period", "Budget", "Prior Year End"],
    ["ASSETS", "", "", "", ""],
    ["Cash & Cash Equivalents", "42.6", "38.1", "38.1", "35.8"],
    ["Short-Term Investments", "12.4", "10.8", "11.0", "9.6"],
    ["Accounts Receivable, Net", "28.4", "26.9", "27.2", "24.8"],
    ["Inventory", "3.2", "3.0", "3.1", "2.8"],
    ["Prepaid & Other Current Assets", "4.8", "4.2", "4.5", "3.9"],
    ["Total Current Assets", "91.4", "83.0", "83.9", "76.9"],
    ["Property & Equipment, Net", "18.6", "17.8", "18.2", "16.4"],
    ["Operating Lease ROU Assets", "8.4", "8.6", "8.5", "9.2"],
    ["Intangible Assets, Net", "42.8", "43.2", "42.0", "44.6"],
    ["Goodwill", "24.0", "24.0", "24.0", "24.0"],
    ["Other Non-Current Assets", "1.0", "0.8", "0.9", "0.7"],
    ["TOTAL ASSETS", "186.2", "177.4", "177.5", "171.8"],
    ["LIABILITIES & EQUITY", "", "", "", ""],
    ["Accounts Payable", "14.2", "13.8", "14.0", "12.6"],
    ["Accrued Expenses", "8.6", "7.9", "8.2", "7.4"],
    ["Deferred Revenue (Current)", "18.4", "17.2", "17.8", "15.2"],
    ["Current Portion of Long-Term Debt", "2.4", "2.4", "2.4", "2.4"],
    ["Total Current Liabilities", "43.6", "41.3", "42.4", "37.6"],
    ["Long-Term Debt", "12.8", "13.6", "12.0", "14.8"],
    ["Operating Lease Liabilities", "7.4", "7.6", "7.5", "8.2"],
    ["Deferred Tax Liabilities", "3.2", "3.1", "3.0", "2.8"],
    ["Other Non-Current Liabilities", "1.8", "1.6", "1.6", "1.4"],
    ["Total Liabilities", "68.8", "67.2", "66.5", "64.8"],
    ["Common Stock & APIC", "48.2", "48.2", "48.2", "48.2"],
    ["Retained Earnings", "69.2", "62.0", "62.8", "58.8"],
    ["Total Equity", "117.4", "110.2", "111.0", "107.0"],
    ["TOTAL LIABILITIES & EQUITY", "186.2", "177.4", "177.5", "171.8"],
    [],
    ["STATEMENT 3", "Consolidated Statement of Cash Flows (USD millions)"],
    ["Line Item", "YTD Actual", "YTD Budget", "YTD Forecast", "Prior Year YTD"],
    ["Net Income", "13.9", "17.4", "18.2", "12.1"],
    ["Depreciation & Amortization", "4.2", "4.0", "4.2", "3.8"],
    ["Stock-Based Compensation", "6.8", "6.4", "6.9", "5.6"],
    ["Changes in Working Capital", "-2.4", "-2.8", "-2.1", "-1.8"],
    ["Other Operating Adjustments", "2.1", "1.8", "2.0", "1.4"],
    ["Net Cash from Operating Activities", "24.6", "22.8", "26.4", "21.1"],
    ["Capital Expenditures", "-6.4", "-8.2", "-7.8", "-5.8"],
    ["Acquisitions & Investments", "-1.8", "-2.2", "-2.0", "-0.4"],
    ["Net Cash from Investing Activities", "-8.2", "-10.4", "-9.8", "-6.2"],
    ["Debt Repayment", "-1.2", "-1.0", "-1.2", "-0.8"],
    ["Equity Proceeds / Buybacks", "0.0", "0.0", "0.0", "-2.4"],
    ["Dividends Paid", "-1.2", "-0.8", "-1.0", "-0.6"],
    ["Net Cash from Financing Activities", "-2.4", "-1.8", "-2.2", "-3.8"],
    ["Net Increase in Cash", "14.0", "10.6", "14.4", "11.1"],
    ["Opening Cash Balance", "28.6", "27.5", "29.8", "24.7"],
    ["Closing Cash Balance", "42.6", "38.1", "44.2", "35.8"],
    [],
    ["NOTES", "Accounting Policies & Footnotes"],
    ["Note", "Description"],
    ["1", "Revenue recognized ratably over subscription term per ASC 606."],
    ["2", "Figures unaudited; subject to period-end close and audit adjustments."],
    ["3", "FX translation: EUR/USD 1.09, GBP/USD 1.27 (month-end rates)."],
    ["4", "Related-party transactions: none material in current period."],
  ]
  return rowsToCsv(rows)
}

function deptExpensesCsv(period: string, modelLabel: string): string {
  const depts = [
    {
      dept: "Engineering",
      owner: "Leslie Alexander",
      fte: 312,
      lines: [
        ["Salaries & Benefits", "12.4", "13.1", "13.4", "1.8", "14.5%"],
        ["Cloud & Infrastructure", "4.2", "4.8", "4.9", "0.6", "14.3%"],
        ["Contractors & Consultants", "1.8", "2.0", "1.9", "0.2", "11.1%"],
        ["Software & Licenses", "1.2", "1.3", "1.3", "0.1", "8.3%"],
        ["Travel & Conferences", "0.4", "0.3", "0.4", "-0.1", "-25.0%"],
        ["Recruiting", "0.6", "0.8", "0.7", "0.2", "33.3%"],
      ],
    },
    {
      dept: "Sales",
      owner: "Wade Warren",
      fte: 186,
      lines: [
        ["Salaries & Benefits", "7.2", "6.9", "7.1", "-0.3", "-4.2%"],
        ["Commissions & Variable Comp", "2.4", "2.2", "2.5", "-0.2", "-8.3%"],
        ["Travel & Entertainment", "0.8", "0.6", "0.7", "-0.2", "-25.0%"],
        ["CRM & Sales Tools", "0.6", "0.6", "0.6", "0.0", "0.0%"],
        ["Events & Sponsorships", "0.4", "0.5", "0.4", "0.1", "25.0%"],
        ["Partner Programs", "0.7", "0.9", "0.8", "0.2", "28.6%"],
      ],
    },
    {
      dept: "Marketing",
      owner: "Jane Cooper",
      fte: 64,
      lines: [
        ["Salaries & Benefits", "2.8", "2.9", "2.9", "0.1", "3.6%"],
        ["Digital Campaigns", "2.4", "3.2", "3.0", "0.8", "33.3%"],
        ["Events & Field Marketing", "1.2", "1.4", "1.3", "0.2", "16.7%"],
        ["Brand & Creative", "0.4", "0.5", "0.4", "0.1", "25.0%"],
        ["Marketing Technology", "0.6", "0.6", "0.6", "0.0", "0.0%"],
        ["Agency & Contractors", "0.8", "1.0", "0.9", "0.2", "25.0%"],
      ],
    },
    {
      dept: "Customer Success",
      owner: "Esther Howard",
      fte: 98,
      lines: [
        ["Salaries & Benefits", "3.6", "3.7", "3.8", "0.1", "2.8%"],
        ["Support Tools & Platforms", "1.4", "1.5", "1.5", "0.1", "7.1%"],
        ["Training & Enablement", "0.3", "0.4", "0.3", "0.1", "33.3%"],
        ["Customer Events", "0.2", "0.3", "0.2", "0.1", "50.0%"],
      ],
    },
    {
      dept: "Operations",
      owner: "Cameron W.",
      fte: 72,
      lines: [
        ["Salaries & Benefits", "2.8", "2.7", "2.8", "-0.1", "-3.6%"],
        ["Facilities & Rent", "2.8", "2.7", "2.8", "-0.1", "-3.6%"],
        ["Logistics & Shipping", "1.9", "2.0", "2.1", "0.1", "5.3%"],
        ["Insurance", "0.7", "0.7", "0.7", "0.0", "0.0%"],
        ["Utilities & Maintenance", "0.4", "0.4", "0.4", "0.0", "0.0%"],
      ],
    },
    {
      dept: "Finance & G&A",
      owner: "Robert Fox",
      fte: 110,
      lines: [
        ["Salaries & Benefits", "2.4", "2.3", "2.4", "-0.1", "-4.2%"],
        ["Audit & Compliance", "0.9", "0.8", "0.9", "-0.1", "-11.1%"],
        ["Legal & Professional Fees", "0.8", "0.9", "0.8", "0.1", "12.5%"],
        ["Insurance (Corporate)", "0.7", "0.8", "0.8", "0.1", "14.3%"],
        ["Office & Admin", "0.5", "0.5", "0.5", "0.0", "0.0%"],
        ["Bank & Treasury Fees", "0.2", "0.2", "0.2", "0.0", "0.0%"],
      ],
    },
  ]

  const rows: string[][] = [
    ...reportHeaderRows("Departmental Expense Analysis — Detail", period, modelLabel),
    ["SECTION 1", "Summary by Department"],
    ["Department", "Owner", "FTE", "Budget ($M)", "Actual ($M)", "Run Rate ($M)", "Variance ($M)", "Variance %", "Cost per FTE ($K)"],
  ]

  for (const d of depts) {
    const budget = d.lines.reduce((s, l) => s + parseFloat(l[1]), 0)
    const actual = d.lines.reduce((s, l) => s + parseFloat(l[2]), 0)
    const runRate = d.lines.reduce((s, l) => s + parseFloat(l[3]), 0)
    const costPerFte = Math.round((actual * 1_000_000) / d.fte / 1000)
    rows.push([
      d.dept,
      d.owner,
      String(d.fte),
      budget.toFixed(1),
      actual.toFixed(1),
      runRate.toFixed(1),
      amtVar(actual, budget),
      pctVar(actual, budget),
      String(costPerFte),
    ])
  }

  const totalBudget = depts.reduce((s, d) => s + d.lines.reduce((a, l) => a + parseFloat(l[1]), 0), 0)
  const totalActual = depts.reduce((s, d) => s + d.lines.reduce((a, l) => a + parseFloat(l[2]), 0), 0)
  const totalRun = depts.reduce((s, d) => s + d.lines.reduce((a, l) => a + parseFloat(l[3]), 0), 0)
  const totalFte = depts.reduce((s, d) => s + d.fte, 0)
  rows.push([
    "TOTAL",
    "—",
    String(totalFte),
    totalBudget.toFixed(1),
    totalActual.toFixed(1),
    totalRun.toFixed(1),
    amtVar(totalActual, totalBudget),
    pctVar(totalActual, totalBudget),
    String(Math.round((totalActual * 1_000_000) / totalFte / 1000)),
  ])

  rows.push([])
  rows.push(["SECTION 2", "Expense Category Detail by Department"])
  rows.push(["Department", "Category", "Budget ($M)", "Actual ($M)", "Run Rate ($M)", "Variance ($M)", "Variance %"])

  for (const d of depts) {
    for (const line of d.lines) {
      rows.push([d.dept, line[0], line[1], line[2], line[3], line[4], line[5]])
    }
    rows.push([])
  }

  rows.push(["SECTION 3", "Monthly Burn by Department ($M)"])
  rows.push(["Department", "Apr", "May", "Jun", "Q2 Total", "Q2 Budget", "Q2 Variance %"])
  const monthly = [
    ["Engineering", "6.4", "6.6", "6.9", "19.9", "18.4", "8.2%"],
    ["Sales", "3.8", "3.9", "4.0", "11.7", "12.1", "-3.3%"],
    ["Marketing", "2.4", "2.6", "2.6", "7.6", "6.8", "11.8%"],
    ["Customer Success", "1.8", "1.9", "1.9", "5.6", "5.4", "3.7%"],
    ["Operations", "2.9", "3.0", "3.1", "9.0", "9.2", "-2.2%"],
    ["Finance & G&A", "1.5", "1.5", "1.5", "4.5", "4.6", "-2.2%"],
  ]
  for (const m of monthly) rows.push(m)

  rows.push([])
  rows.push(["SECTION 4", "Headcount Allocation"])
  rows.push(["Department", "Budget FTE", "Actual FTE", "Open Roles", "Avg Fully Loaded Cost", "YoY Headcount Growth %"])
  rows.push(["Engineering", "298", "312", "8", "$148K", "12.4%"])
  rows.push(["Sales", "192", "186", "6", "$118K", "8.1%"])
  rows.push(["Marketing", "62", "64", "2", "$105K", "6.7%"])
  rows.push(["Customer Success", "94", "98", "4", "$92K", "10.2%"])
  rows.push(["Operations", "74", "72", "1", "$88K", "4.3%"])
  rows.push(["Finance & G&A", "100", "110", "5", "$96K", "7.8%"])

  return rowsToCsv(rows)
}

export function generateLocalReport(
  exportType: LocalReportType,
  opts?: { modelName?: string; period?: string },
): GeneratedReport {
  const modelLabel = opts?.modelName || "FY2026 Consolidated Model"
  const period = opts?.period || "Q2 FY2026 (Apr–Jun 2026)"
  const generatedAt = new Date().toISOString()
  const stamp = generatedAt.slice(0, 10)

  if (exportType === "BOARD_PACK") {
    const content = boardPackJson(modelLabel, period)
    return {
      exportType,
      filename: `Arcus_Board_Pack_${stamp}.json`,
      mimeType: "application/json",
      content,
      sizeLabel: formatSize(content),
      generatedAt,
    }
  }

  if (exportType === "MANAGEMENT_REPORT") {
    const content = managementReportCsv(period, modelLabel)
    return {
      exportType,
      filename: `Arcus_Management_Report_${stamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
      content,
      sizeLabel: formatSize(content),
      generatedAt,
    }
  }

  if (exportType === "FINANCIAL_STATEMENTS") {
    const content = financialStatementsCsv(period, modelLabel)
    return {
      exportType,
      filename: `Arcus_Financial_Statements_${stamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
      content,
      sizeLabel: formatSize(content),
      generatedAt,
    }
  }

  const content = deptExpensesCsv(period, modelLabel)
  return {
    exportType,
    filename: `Arcus_Department_Expenses_${stamp}.csv`,
    mimeType: "text/csv;charset=utf-8",
    content,
    sizeLabel: formatSize(content),
    generatedAt,
  }
}

export function downloadGeneratedReport(report: GeneratedReport) {
  const blob = new Blob([report.content], { type: report.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = report.filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function reportTypeLabel(type: LocalReportType): string {
  const map: Record<LocalReportType, string> = {
    BOARD_PACK: "Board Pack",
    MANAGEMENT_REPORT: "Management Report",
    FINANCIAL_STATEMENTS: "Financial Statements",
    DEPT_EXPENSES: "Departmental Expenses",
  }
  return map[type]
}

export function reportFormatLabel(type: LocalReportType): string {
  return type === "BOARD_PACK" ? "JSON (12 sections)" : "CSV workbook"
}

export function reportSectionCount(type: LocalReportType): number {
  const map: Record<LocalReportType, number> = {
    BOARD_PACK: 12,
    MANAGEMENT_REPORT: 5,
    FINANCIAL_STATEMENTS: 3,
    DEPT_EXPENSES: 4,
  }
  return map[type]
}
