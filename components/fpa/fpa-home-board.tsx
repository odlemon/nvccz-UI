"use client"

/**
 * FP&A Home — hardcoded board matched to SRD mock (vibrant, full-bleed).
 * Interactive filters, View-all dialogs, real avatar photos.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Inbox,
  Info,
  MoreVertical,
  Pin,
  RefreshCw,
  SquareCheck,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import { KpiSparkline } from "./kpi-sparkline"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const CARD =
  "rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const BLUE = "#1d4ed8"
const BLUE_BRIGHT = "#2563eb"
const TEAL = "#0d9488"

/** Real portrait photos (randomuser.me — stable by seed path) */
const AVATARS = {
  jane: "https://randomuser.me/api/portraits/women/44.jpg",
  wade: "https://randomuser.me/api/portraits/men/32.jpg",
  devon: "https://randomuser.me/api/portraits/men/75.jpg",
  esther: "https://randomuser.me/api/portraits/women/68.jpg",
  cody: "https://randomuser.me/api/portraits/men/22.jpg",
  priya: "https://randomuser.me/api/portraits/women/65.jpg",
  daniel: "https://randomuser.me/api/portraits/men/46.jpg",
  arjun: "https://randomuser.me/api/portraits/men/36.jpg",
  james: "https://randomuser.me/api/portraits/men/52.jpg",
  sarah: "https://randomuser.me/api/portraits/women/33.jpg",
  michael: "https://randomuser.me/api/portraits/men/11.jpg",
}

const KPIS = [
  {
    id: "rev",
    label: "Revenue Forecast",
    value: "$125.8M",
    pct: "4.2%",
    vs: "vs Apr 2025",
    up: true,
    spark: [102, 108, 105, 112, 110, 118, 116, 125.8],
    dashed: false,
  },
  {
    id: "ebitda",
    label: "EBITDA",
    value: "$38.4M",
    pct: "6.1%",
    vs: "vs Apr 2025",
    up: true,
    spark: [28, 30, 29, 32, 33, 35, 34, 38.4],
    dashed: false,
  },
  {
    id: "cash",
    label: "Closing Cash",
    value: "$42.6M",
    pct: "2.8%",
    vs: "vs Apr 2025",
    up: false,
    spark: [52, 50, 51, 48, 47, 45, 44, 42.6],
    dashed: false,
  },
  {
    id: "runway",
    label: "Cash Runway",
    value: "14.2 months",
    pct: "0.4",
    vs: "vs Apr 2025",
    up: true,
    spark: [12.2, 12.8, 12.5, 13.2, 13.0, 13.8, 13.6, 14.2],
    dashed: false,
  },
  {
    id: "acc",
    label: "Forecast Accuracy",
    value: "94.2%",
    pct: "1.1%",
    vs: "vs Apr 2025",
    up: true,
    spark: [88, 90, 89, 91, 92, 91.5, 93, 94.2],
    dashed: true,
  },
]

const TREND_12M = [
  { m: "Jun '24", revenue: 72, expenses: 54 },
  { m: "Jul '24", revenue: 78, expenses: 56 },
  { m: "Aug '24", revenue: 82, expenses: 58 },
  { m: "Sep '24", revenue: 88, expenses: 61 },
  { m: "Oct '24", revenue: 92, expenses: 64 },
  { m: "Nov '24", revenue: 96, expenses: 67 },
  { m: "Dec '24", revenue: 102, expenses: 70 },
  { m: "Jan '25", revenue: 108, expenses: 73 },
  { m: "Feb '25", revenue: 112, expenses: 76 },
  { m: "Mar '25", revenue: 118, expenses: 80 },
  { m: "Apr '25", revenue: 122, expenses: 83 },
  { m: "May '25", revenue: 125.8, expenses: 86.4 },
]

const TREND_6M = TREND_12M.slice(-6)
const TREND_3M = TREND_12M.slice(-3)
const TREND_YTD = TREND_12M.slice(6)

const SCENARIOS = [
  {
    metric: "Revenue",
    cells: [
      { label: "Base Case", value: "$125.8M", delta: "▲ 4.2%", up: true },
      { label: "Upside", value: "$138.3M", delta: "▲ 14.6%", up: true },
      { label: "Downside", value: "$113.2M", delta: "▼ -6.3%", up: false },
      { label: "FX Shock", value: "$118.4M", delta: "▼ -2.0%", up: false },
      { label: "Hiring Freeze", value: "$127.1M", delta: "▲ 5.3%", up: true },
    ],
  },
  {
    metric: "EBITDA",
    cells: [
      { label: "Base Case", value: "$23.6M", delta: "▲ 6.1%", up: true },
      { label: "Upside", value: "$29.1M", delta: "▲ 18.4%", up: true },
      { label: "Downside", value: "$17.2M", delta: "▼ -20.5%", up: false },
      { label: "FX Shock", value: "$19.8M", delta: "▼ -8.4%", up: false },
      { label: "Hiring Freeze", value: "$26.4M", delta: "▲ 11.9%", up: true },
    ],
  },
  {
    metric: "Cash Runway",
    cells: [
      { label: "Base Case", value: "14.2 months", delta: "▲ 1.1 mo", up: true },
      { label: "Upside", value: "17.6 months", delta: "▲ 4.5 mo", up: true },
      { label: "Downside", value: "10.2 months", delta: "▼ -3.9 mo", up: false },
      { label: "FX Shock", value: "11.8 months", delta: "▼ -1.3 mo", up: false },
      { label: "Hiring Freeze", value: "15.9 months", delta: "▲ 2.8 mo", up: true },
    ],
  },
]

const SCENARIO_HEADERS = [
  { name: "Base Case", sub: "(Working)" },
  { name: "Upside", sub: "(+10% Growth)" },
  { name: "Downside", sub: "(-10% Growth)" },
  { name: "FX Shock", sub: "(FX −8%)" },
  { name: "Hiring Freeze", sub: "(HC flat)" },
] as const

const WORKFLOW_DONUT = [
  { name: "Submitted", value: 72, color: "#1D4ED8", pct: "72%", count: "(23 / 32)" },
  { name: "In Review", value: 18, color: "#D97706", pct: "18%", count: "(6 / 32)" },
  { name: "Approved", value: 10, color: "#16A34A", pct: "10%", count: "(3 / 32)" },
]

const OVER_BUDGET_ALL = [
  {
    dept: "Marketing",
    budget: "$8.20M",
    actual: "$9.45M",
    variance: "$1.25M (15.2%)",
    owner: "Jane Cooper",
    photo: AVATARS.jane,
    period: "May 2025",
  },
  {
    dept: "Sales",
    budget: "$12.50M",
    actual: "$13.68M",
    variance: "$1.18M (9.4%)",
    owner: "Wade Warren",
    photo: AVATARS.wade,
    period: "May 2025",
  },
  {
    dept: "Product Development",
    budget: "$15.00M",
    actual: "$16.72M",
    variance: "$1.72M (11.5%)",
    owner: "Devon Lane",
    photo: AVATARS.devon,
    period: "May 2025",
  },
  {
    dept: "Customer Success",
    budget: "$4.80M",
    actual: "$5.21M",
    variance: "$0.41M (8.5%)",
    owner: "Esther Howard",
    photo: AVATARS.esther,
    period: "May 2025",
  },
  {
    dept: "IT",
    budget: "$6.40M",
    actual: "$6.88M",
    variance: "$0.48M (7.5%)",
    owner: "Cody Fisher",
    photo: AVATARS.cody,
    period: "May 2025",
  },
  {
    dept: "Finance",
    budget: "$3.10M",
    actual: "$3.42M",
    variance: "$0.32M (10.3%)",
    owner: "Priya Nair",
    photo: AVATARS.priya,
    period: "May 2025",
  },
  {
    dept: "HR",
    budget: "$2.40M",
    actual: "$2.61M",
    variance: "$0.21M (8.8%)",
    owner: "Sarah Delgado",
    photo: AVATARS.sarah,
    period: "May 2025",
  },
  {
    dept: "Marketing",
    budget: "$7.90M",
    actual: "$8.40M",
    variance: "$0.50M (6.3%)",
    owner: "Jane Cooper",
    photo: AVATARS.jane,
    period: "Apr 2025",
  },
  {
    dept: "Sales",
    budget: "$12.00M",
    actual: "$12.90M",
    variance: "$0.90M (7.5%)",
    owner: "Wade Warren",
    photo: AVATARS.wade,
    period: "Apr 2025",
  },
  {
    dept: "IT",
    budget: "$6.10M",
    actual: "$6.55M",
    variance: "$0.45M (7.4%)",
    owner: "Cody Fisher",
    photo: AVATARS.cody,
    period: "Apr 2025",
  },
]

const CASH_BY_SCENARIO: Record<
  string,
  {
    value: string
    unit: string
    delta: string
    up: boolean
    target: number
    bars: Array<{ m: string; bal: number; tick?: boolean }>
  }
> = {
  "Base Case": {
    value: "14.2",
    unit: "months",
    delta: "1.1 mo",
    up: true,
    target: 12,
    bars: [
      { m: "May '25", bal: 48, tick: true },
      { m: "Jun '25", bal: 46 },
      { m: "Jul '25", bal: 43 },
      { m: "Aug '25", bal: 40, tick: true },
      { m: "Sep '25", bal: 37 },
      { m: "Oct '25", bal: 34 },
      { m: "Nov '25", bal: 31, tick: true },
      { m: "Dec '25", bal: 28 },
      { m: "Jan '26", bal: 24 },
      { m: "Feb '26", bal: 20, tick: true },
    ],
  },
  "Upside Case": {
    value: "17.6",
    unit: "months",
    delta: "3.4 mo",
    up: true,
    target: 12,
    bars: [
      { m: "May '25", bal: 56, tick: true },
      { m: "Jun '25", bal: 54 },
      { m: "Jul '25", bal: 52 },
      { m: "Aug '25", bal: 49, tick: true },
      { m: "Sep '25", bal: 47 },
      { m: "Oct '25", bal: 44 },
      { m: "Nov '25", bal: 42, tick: true },
      { m: "Dec '25", bal: 39 },
      { m: "Jan '26", bal: 36 },
      { m: "Feb '26", bal: 34, tick: true },
    ],
  },
  "Downside Case": {
    value: "10.2",
    unit: "months",
    delta: "2.0 mo",
    up: false,
    target: 12,
    bars: [
      { m: "May '25", bal: 38, tick: true },
      { m: "Jun '25", bal: 35 },
      { m: "Jul '25", bal: 31 },
      { m: "Aug '25", bal: 28, tick: true },
      { m: "Sep '25", bal: 24 },
      { m: "Oct '25", bal: 21 },
      { m: "Nov '25", bal: 18, tick: true },
      { m: "Dec '25", bal: 15 },
      { m: "Jan '26", bal: 12 },
      { m: "Feb '26", bal: 9, tick: true },
    ],
  },
  Upside: {
    value: "17.6",
    unit: "months",
    delta: "3.4 mo",
    up: true,
    target: 12,
    bars: [
      { m: "May '25", bal: 56, tick: true },
      { m: "Jun '25", bal: 54 },
      { m: "Jul '25", bal: 52 },
      { m: "Aug '25", bal: 49, tick: true },
      { m: "Sep '25", bal: 47 },
      { m: "Oct '25", bal: 44 },
      { m: "Nov '25", bal: 42, tick: true },
      { m: "Dec '25", bal: 39 },
      { m: "Jan '26", bal: 36 },
      { m: "Feb '26", bal: 34, tick: true },
    ],
  },
  Downside: {
    value: "10.2",
    unit: "months",
    delta: "2.0 mo",
    up: false,
    target: 12,
    bars: [
      { m: "May '25", bal: 38, tick: true },
      { m: "Jun '25", bal: 35 },
      { m: "Jul '25", bal: 31 },
      { m: "Aug '25", bal: 28, tick: true },
      { m: "Sep '25", bal: 24 },
      { m: "Oct '25", bal: 21 },
      { m: "Nov '25", bal: 18, tick: true },
      { m: "Dec '25", bal: 15 },
      { m: "Jan '26", bal: 12 },
      { m: "Feb '26", bal: 9, tick: true },
    ],
  },
  "FX Shock": {
    value: "11.8",
    unit: "months",
    delta: "1.3 mo",
    up: false,
    target: 12,
    bars: [
      { m: "May '25", bal: 42, tick: true },
      { m: "Jun '25", bal: 39 },
      { m: "Jul '25", bal: 36 },
      { m: "Aug '25", bal: 33, tick: true },
      { m: "Sep '25", bal: 30 },
      { m: "Oct '25", bal: 27 },
      { m: "Nov '25", bal: 24, tick: true },
      { m: "Dec '25", bal: 21 },
      { m: "Jan '26", bal: 18 },
      { m: "Feb '26", bal: 15, tick: true },
    ],
  },
  "Hiring Freeze": {
    value: "15.9",
    unit: "months",
    delta: "2.8 mo",
    up: true,
    target: 12,
    bars: [
      { m: "May '25", bal: 50, tick: true },
      { m: "Jun '25", bal: 49 },
      { m: "Jul '25", bal: 47 },
      { m: "Aug '25", bal: 46, tick: true },
      { m: "Sep '25", bal: 44 },
      { m: "Oct '25", bal: 43 },
      { m: "Nov '25", bal: 41, tick: true },
      { m: "Dec '25", bal: 40 },
      { m: "Jan '26", bal: 38 },
      { m: "Feb '26", bal: 37, tick: true },
    ],
  },
}

/** Scenario multipliers for demo KPI / trend dynamics */
const SCENARIO_FX: Record<
  string,
  { rev: number; exp: number; ebitda: number; cash: number; runway: number; acc: number }
> = {
  "Base Case": { rev: 1, exp: 1, ebitda: 1, cash: 1, runway: 1, acc: 1 },
  Upside: { rev: 1.1, exp: 1.04, ebitda: 1.18, cash: 1.12, runway: 1.24, acc: 1.01 },
  Downside: { rev: 0.9, exp: 0.96, ebitda: 0.78, cash: 0.88, runway: 0.72, acc: 0.97 },
  "FX Shock": { rev: 0.94, exp: 1.02, ebitda: 0.84, cash: 0.92, runway: 0.83, acc: 0.98 },
  "Hiring Freeze": { rev: 1.01, exp: 0.93, ebitda: 1.12, cash: 1.06, runway: 1.12, acc: 1.005 },
}

const VERSION_FX: Record<string, { accAdj: number; label: string }> = {
  Working: { accAdj: 0, label: "Working draft" },
  Locked: { accAdj: 0.4, label: "Locked snapshot" },
  Published: { accAdj: 0.8, label: "Published pack" },
}

const PERIOD_META: Record<string, { vs: string; trendScale: number }> = {
  "May 2025": { vs: "vs Apr 2025", trendScale: 1 },
  "Apr 2025": { vs: "vs Mar 2025", trendScale: 0.97 },
  "Mar 2025": { vs: "vs Feb 2025", trendScale: 0.94 },
  FY2025: { vs: "vs FY2024", trendScale: 1.02 },
  FY2026: { vs: "vs FY2025", trendScale: 1.08 },
}

function fmtMoneyM(n: number) {
  return `$${n.toFixed(1)}M`
}

function scaleSpark(values: number[], factor: number) {
  return values.map((v) => +(v * factor).toFixed(2))
}

function buildKpis(scenario: string, version: string, period: string) {
  const fx = SCENARIO_FX[scenario] || SCENARIO_FX["Base Case"]
  const ver = VERSION_FX[version] || VERSION_FX.Working
  const per = PERIOD_META[period] || PERIOD_META["May 2025"]
  const scale = per.trendScale

  const rev = 125.8 * fx.rev * scale
  const ebitda = 38.4 * fx.ebitda * scale
  const cash = 42.6 * fx.cash * scale
  const runway = 14.2 * fx.runway
  const acc = Math.min(99.5, 94.2 * fx.acc + ver.accAdj)

  const revDelta = (fx.rev - 1) * 100 + 4.2
  const ebitdaDelta = (fx.ebitda - 1) * 100 + 6.1
  const cashDelta = (fx.cash - 1) * 100 + 2.8
  const runwayDelta = (fx.runway - 1) * 10 + 0.4
  const accDelta = (fx.acc - 1) * 100 + 1.1 + ver.accAdj * 0.2

  return [
    {
      id: "rev",
      label: "Revenue Forecast",
      value: fmtMoneyM(rev),
      pct: `${Math.abs(revDelta).toFixed(1)}%`,
      vs: per.vs,
      up: revDelta >= 0,
      spark: scaleSpark(KPIS[0].spark, fx.rev * scale),
      dashed: false,
    },
    {
      id: "ebitda",
      label: "EBITDA",
      value: fmtMoneyM(ebitda),
      pct: `${Math.abs(ebitdaDelta).toFixed(1)}%`,
      vs: per.vs,
      up: ebitdaDelta >= 0,
      spark: scaleSpark(KPIS[1].spark, fx.ebitda * scale),
      dashed: false,
    },
    {
      id: "cash",
      label: "Closing Cash",
      value: fmtMoneyM(cash),
      pct: `${Math.abs(cashDelta).toFixed(1)}%`,
      vs: per.vs,
      up: cashDelta >= 0,
      spark: scaleSpark(KPIS[2].spark, fx.cash * scale),
      dashed: false,
    },
    {
      id: "runway",
      label: "Cash Runway",
      value: `${runway.toFixed(1)} months`,
      pct: Math.abs(runwayDelta).toFixed(1),
      vs: per.vs,
      up: runwayDelta >= 0,
      spark: scaleSpark(KPIS[3].spark, fx.runway),
      dashed: false,
    },
    {
      id: "acc",
      label: "Forecast Accuracy",
      value: `${acc.toFixed(1)}%`,
      pct: `${Math.abs(accDelta).toFixed(1)}%`,
      vs: per.vs,
      up: accDelta >= 0,
      spark: scaleSpark(KPIS[4].spark, fx.acc),
      dashed: true,
    },
  ]
}

function scaleTrend(
  rows: Array<{ m: string; revenue: number; expenses: number }>,
  scenario: string,
  period: string,
) {
  const fx = SCENARIO_FX[scenario] || SCENARIO_FX["Base Case"]
  const scale = (PERIOD_META[period] || PERIOD_META["May 2025"]).trendScale
  return rows.map((r) => ({
    ...r,
    revenue: +(r.revenue * fx.rev * scale).toFixed(1),
    expenses: +(r.expenses * fx.exp * scale).toFixed(1),
  }))
}

const ACTIVITY_ALL = [
  {
    title: "Marketing budget submitted for review",
    who: "Jane Cooper",
    when: "2h ago",
    detail: "Marketing Q3 budget package submitted to FP&A for cycle review.",
    icon: "file" as const,
    iconBg: "bg-[#bfdbfe] text-[#1d4ed8]",
  },
  {
    title: "FY26 Base Case revenue updated",
    who: "Wade Warren",
    when: "5h ago",
    detail: "Base Case revenue drivers refreshed for FY26 planning.",
    icon: "file" as const,
    iconBg: "bg-[#bbf7d0] text-[#15803d]",
  },
  {
    title: "New assumption added: Churn Rate",
    who: "Devon Lane",
    when: "1d ago",
    detail: "Added Churn Rate driver assumption to the Base Case pack.",
    icon: "file" as const,
    iconBg: "bg-[#ddd6fe] text-[#6d28d9]",
  },
  {
    title: "Sales forecast updated for Q2",
    who: "Esther Howard",
    when: "1d ago",
    detail: "Q2 sales forecast revised with latest pipeline actuals.",
    icon: "trend" as const,
    iconBg: "bg-[#fed7aa] text-[#c2410c]",
  },
  {
    title: "Q1 Forecast Accuracy improved to 87.3%",
    who: "System",
    when: "2d ago",
    detail: "Automated accuracy score recalculated after actuals close.",
    icon: "check" as const,
    iconBg: "bg-[#bae6fd] text-[#0369a1]",
  },
  {
    title: "Cash runway brief published",
    who: "Cody Fisher",
    when: "3d ago",
    detail: "Treasury published May cash runway brief (14.2 months).",
    icon: "file" as const,
    iconBg: "bg-[#fde68a] text-[#a16207]",
  },
  {
    title: "Ops opex returned for revision",
    who: "James Whitaker",
    when: "3d ago",
    detail: "Returned Operations opex — headcount assumptions incomplete.",
    icon: "file" as const,
    iconBg: "bg-[#fecaca] text-[#b91c1c]",
  },
  {
    title: "Board pack draft generated",
    who: "Sarah Delgado",
    when: "4d ago",
    detail: "Generated board pack PDF for CFO review.",
    icon: "check" as const,
    iconBg: "bg-[#bfdbfe] text-[#1d4ed8]",
  },
]

function ActivityIcon({
  kind,
  className,
}: {
  kind: "file" | "trend" | "check"
  className?: string
}) {
  if (kind === "trend") return <TrendingUp className={className} />
  if (kind === "check") return <SquareCheck className={className} />
  return <FileText className={className} />
}

const OPEN_TASKS_ALL = [
  {
    task: "Review Q2 Marketing Budget",
    module: "Budgeting",
    owner: "Jane Cooper",
    photo: AVATARS.jane,
    due: "May 23, 2025",
    priority: "High" as const,
    status: "In Progress" as const,
  },
  {
    task: "Update Headcount Plan",
    module: "Workforce",
    owner: "Cody Fisher",
    photo: AVATARS.cody,
    due: "May 26, 2025",
    priority: "Medium" as const,
    status: "Not Started" as const,
  },
  {
    task: "Finalize Revenue Forecast Assumptions",
    module: "Revenue",
    owner: "Wade Warren",
    photo: AVATARS.wade,
    due: "May 28, 2025",
    priority: "High" as const,
    status: "In Progress" as const,
  },
  {
    task: "Review Vendor Spend",
    module: "Expenses",
    owner: "Esther Howard",
    photo: AVATARS.esther,
    due: "May 30, 2025",
    priority: "Medium" as const,
    status: "Not Started" as const,
  },
  {
    task: "Prepare Cash Flow Commentary",
    module: "Cash Flow",
    owner: "Devon Lane",
    photo: AVATARS.devon,
    due: "May 30, 2025",
    priority: "Low" as const,
    status: "Not Started" as const,
  },
  {
    task: "Lock Base Case drivers",
    module: "Drivers",
    owner: "Michael Chen",
    photo: AVATARS.michael,
    due: "Jun 2, 2025",
    priority: "High" as const,
    status: "Not Started" as const,
  },
  {
    task: "Approve Engineering budget",
    module: "Budgeting",
    owner: "Sarah Delgado",
    photo: AVATARS.sarah,
    due: "Jun 3, 2025",
    priority: "Medium" as const,
    status: "In Progress" as const,
  },
  {
    task: "Reconcile Sales variance",
    module: "Variance",
    owner: "Priya Nair",
    photo: AVATARS.priya,
    due: "Jun 5, 2025",
    priority: "Low" as const,
    status: "Not Started" as const,
  },
]

type ModalKind = "departments" | "activity" | "tasks" | "scenarios" | "workflow" | "cashflow" | null

function Avatar({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("rounded-full object-cover bg-[#94a3b8]", className)}
      loading="lazy"
    />
  )
}

function EndValueLabel({
  x,
  y,
  value,
  color,
  index,
  lastIndex,
}: {
  x?: number | string
  y?: number | string
  value?: number | string
  color: string
  index?: number
  lastIndex: number
}) {
  if (index !== lastIndex || x == null || y == null || value == null) return null
  const cx = Number(x)
  const cy = Number(y)
  const text = typeof value === "number" ? `${value}M` : String(value)
  const w = Math.max(46, text.length * 7.2)
  const h = 18
  return (
    <g transform={`translate(${cx + 8}, ${cy - h / 2})`}>
      <rect width={w} height={h} rx={3} ry={3} fill={color} />
      <text
        x={w / 2}
        y={h / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={10}
        fontWeight={700}
      >
        {text}
      </text>
    </g>
  )
}

function SeriesDot({ cx, cy, fill }: { cx?: number; cy?: number; fill: string }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={3.5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />
}

/** Slightly squared control — matches mock (not pill-smooth) */
function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-8 inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-[11px] font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        {value}
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#94a3b8] transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[160px] rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
                toast.message(`Filter: ${opt}`)
              }}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]",
                opt === value ? "text-[#2563eb] font-semibold" : "text-[#334155]",
              )}
            >
              {opt}
              {opt === value ? <Check className="w-3.5 h-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CardMenu({
  items,
}: {
  items: Array<{ label: string; icon?: React.ReactNode; onClick: () => void }>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[#64748b] hover:text-[#64748b] p-1 rounded-md hover:bg-[#f8fafc]"
        aria-label="More"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[150px] rounded-md border border-[#e2e8f0] bg-white py-1 shadow-lg">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                it.onClick()
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] text-[#334155] hover:bg-[#f8fafc]"
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PriorityBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2 rounded-[6px] text-[10px] font-semibold",
        level === "High" && "bg-[#fecaca] text-[#991b1b]",
        level === "Medium" && "bg-[#fed7aa] text-[#9a3412]",
        level === "Low" && "bg-[#bbf7d0] text-[#166534]",
      )}
    >
      {level}
    </span>
  )
}

function StatusBadge({ status }: { status: "In Progress" | "Not Started" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2 rounded-[6px] text-[10px] font-semibold",
        status === "In Progress" && "bg-[#bfdbfe] text-[#1d4ed8]",
        status === "Not Started" && "bg-[#e5e7eb] text-[#4b5563]",
      )}
    >
      {status}
    </span>
  )
}

function ScenarioTable({
  compact,
  activeScenario,
}: {
  compact?: boolean
  activeScenario?: string
}) {
  const headers = compact
    ? SCENARIO_HEADERS.filter(
        (h) =>
          ["Base Case", "Upside", "Downside"].includes(h.name) ||
          h.name === activeScenario,
      )
    : SCENARIO_HEADERS

  return (
    <div className="rounded-md border border-[#e2e8f0] overflow-x-auto -mx-0.5">
      <table className="w-full text-[11px] border-collapse min-w-0">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="py-2.5 px-2 text-left font-semibold text-[#1e293b] border-b border-[#e2e8f0] sticky left-0 bg-[#f8fafc] z-[1] whitespace-nowrap">
              Scenario
            </th>
            {headers.map((h) => (
              <th
                key={h.name}
                className={cn(
                  "py-2.5 px-1.5 text-center font-semibold text-[#1e293b] border-b border-l border-[#e2e8f0] whitespace-nowrap",
                  activeScenario === h.name && "bg-[#eff6ff] text-[#1d4ed8]",
                )}
              >
                {h.name}
                <span className="block text-[9px] font-normal text-[#94a3b8]">{h.sub}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCENARIOS.map((r, i) => {
            const cells = compact
              ? r.cells.filter(
                  (c) =>
                    ["Base Case", "Upside", "Downside"].includes(c.label) ||
                    c.label === activeScenario,
                )
              : r.cells
            return (
              <tr key={r.metric}>
                <td
                  className={cn(
                    "py-3 px-2 font-semibold text-[#1e293b] sticky left-0 bg-white z-[1] whitespace-nowrap",
                    i < SCENARIOS.length - 1 && "border-b border-[#e2e8f0]",
                  )}
                >
                  {r.metric}
                </td>
                {cells.map((cell) => (
                  <td
                    key={cell.label}
                    className={cn(
                      "py-3 px-1.5 text-center border-l border-[#e2e8f0]",
                      i < SCENARIOS.length - 1 && "border-b border-[#e2e8f0]",
                      activeScenario === cell.label && "bg-[#eff6ff]/70",
                    )}
                  >
                    <p className="font-bold text-[#1e293b] tabular-nums leading-tight whitespace-nowrap">
                      {cell.value}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-semibold mt-1 leading-none whitespace-nowrap",
                        cell.up ? "text-[#15803d]" : "text-[#b91c1c]",
                      )}
                    >
                      {cell.delta}
                    </p>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DeptTable({
  rows,
  compact,
}: {
  rows: typeof OVER_BUDGET_ALL
  compact?: boolean
}) {
  return (
    <div className="rounded-md border border-[#e2e8f0] overflow-x-auto">
      <table
        className={cn(
          "w-full text-[11px] border-collapse",
          compact ? "min-w-[420px]" : "min-w-[560px]",
        )}
      >
        <thead>
          <tr className="bg-[#f7fafc]">
            <th className="py-2.5 px-2.5 text-left font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Department
            </th>
            <th className="py-2.5 px-2.5 text-right font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Budget
            </th>
            <th className="py-2.5 px-2.5 text-right font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Actual
            </th>
            <th className="py-2.5 px-2.5 text-right font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Variance
            </th>
            {!compact ? (
              <th className="py-2.5 px-2.5 text-left font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
                Owner
              </th>
            ) : null}
            <th className="py-2.5 px-2.5 text-center font-semibold text-[#1a202c] border-b border-[#e2e8f0]">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.dept}-${r.period}-${i}`} className="bg-white hover:bg-[#fafbfc]">
              <td
                className={cn(
                  "py-2.5 px-2.5 text-[#2d3748] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.dept}
              </td>
              <td
                className={cn(
                  "py-2.5 px-2.5 text-right tabular-nums font-bold text-[#1a202c] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.budget}
              </td>
              <td
                className={cn(
                  "py-2.5 px-2.5 text-right tabular-nums font-bold text-[#1a202c] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.actual}
              </td>
              <td
                className={cn(
                  "py-2.5 px-2.5 text-right tabular-nums font-bold text-[#e53e3e] whitespace-nowrap",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                {r.variance}
              </td>
              {!compact ? (
                <td
                  className={cn(
                    "py-2.5 px-2.5",
                    i < rows.length - 1 && "border-b border-[#e2e8f0]",
                  )}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Avatar src={r.photo} alt={r.owner} className="h-7 w-7" />
                    <span className="text-[#2d3748] truncate">{r.owner}</span>
                  </span>
                </td>
              ) : null}
              <td
                className={cn(
                  "py-2.5 px-2.5 text-center",
                  i < rows.length - 1 && "border-b border-[#e2e8f0]",
                )}
              >
                <span className="inline-flex items-center h-6 px-2.5 rounded-[6px] text-[10px] font-semibold bg-[#fecaca] text-[#991b1b] whitespace-nowrap">
                  Over Budget
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FpaHomeBoard() {
  const [scenario, setScenario] = useState("Base Case")
  const [version, setVersion] = useState("Working")
  const [period, setPeriod] = useState("May 2025")
  const [trendRange, setTrendRange] = useState("Last 12 Months")
  const [deptPeriod, setDeptPeriod] = useState("May 2025")
  const [cashScenario, setCashScenario] = useState("Base Case")
  const [modal, setModal] = useState<ModalKind>(null)
  const [modalDeptPeriod, setModalDeptPeriod] = useState("May 2025")

  const kpis = useMemo(
    () => buildKpis(scenario, version, period),
    [scenario, version, period],
  )

  const trendData = useMemo(() => {
    let base = TREND_12M
    if (trendRange === "Last 6 Months") base = TREND_6M
    else if (trendRange === "Last 3 Months") base = TREND_3M
    else if (trendRange === "YTD 2025") base = TREND_YTD
    return scaleTrend(base, scenario, period)
  }, [trendRange, scenario, period])

  const lastTrend = trendData[trendData.length - 1]

  const deptRows = useMemo(
    () => OVER_BUDGET_ALL.filter((r) => r.period === deptPeriod).slice(0, 5),
    [deptPeriod],
  )

  const modalDeptRows = useMemo(
    () => OVER_BUDGET_ALL.filter((r) => r.period === modalDeptPeriod),
    [modalDeptPeriod],
  )

  const cash = CASH_BY_SCENARIO[cashScenario] || CASH_BY_SCENARIO["Base Case"]

  const versionNote = VERSION_FX[version]?.label || "Working draft"

  const visibleTasks = OPEN_TASKS_ALL.slice(0, 5)
  const modalTasks = OPEN_TASKS_ALL

  const applyScenario = (s: string) => {
    setScenario(s)
    setCashScenario(s)
  }

  const applyPeriod = (p: string) => {
    setPeriod(p)
    if (p === "May 2025" || p === "Apr 2025") setDeptPeriod(p)
  }

  const openModal = (kind: ModalKind) => {
    if (kind === "departments") setModalDeptPeriod(deptPeriod)
    setModal(kind)
  }

  return (
    <div className="min-h-full bg-[#f1f5f9]">
      <FpaPageHeader
        title="FP&A Home"
        demoScenarios
        scenario={scenario}
        version={version}
        period={period}
        onScenarioChange={applyScenario}
        onVersionChange={setVersion}
        onPeriodChange={applyPeriod}
      />

      <div className="w-full max-w-full px-3 sm:px-4 py-3 space-y-3 overflow-x-hidden">
        {/* KPI strip — 5-up only on xl so values + sparklines never collide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.id} className={cn(CARD, "px-4 pt-3.5 pb-3.5 min-w-0 overflow-hidden")}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-[#0f172a] leading-snug pr-1">
                  {kpi.label}
                </p>
                <CardMenu
                  items={[
                    {
                      label: "Refresh",
                      icon: <RefreshCw className="w-3.5 h-3.5" />,
                      onClick: () => toast.success(`${kpi.label} refreshed`),
                    },
                    {
                      label: "Export CSV",
                      icon: <Download className="w-3.5 h-3.5" />,
                      onClick: () => toast.success(`Exported ${kpi.label}`),
                    },
                    {
                      label: "Pin to board",
                      icon: <Pin className="w-3.5 h-3.5" />,
                      onClick: () => toast.message(`Pinned ${kpi.label}`),
                    },
                  ]}
                />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] sm:text-[24px] font-bold text-[#0f172a] tabular-nums leading-tight tracking-tight whitespace-nowrap">
                    {kpi.value}
                  </p>
                  <p className="mt-1.5 text-[11px] sm:text-[12px] leading-snug">
                    <span
                      className={cn(
                        "font-semibold",
                        kpi.up ? "text-[#15803d]" : "text-[#b91c1c]",
                      )}
                    >
                      {kpi.up ? "▲" : "▼"} {kpi.pct}
                    </span>
                    <span className="text-[#64748b] font-normal"> {kpi.vs}</span>
                  </p>
                </div>
                <KpiSparkline values={kpi.spark} dashed={kpi.dashed} />
              </div>
            </div>
          ))}
        </div>

        {/* Trend · Scenarios · Workflow — stack until lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <section className={cn(CARD, "lg:col-span-5 flex flex-col min-h-[280px] sm:min-h-[320px] min-w-0")}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#0f172a] truncate">
                  Revenue vs Expense Trend
                </h2>
                <button
                  type="button"
                  title="Monthly revenue and total expenses"
                  onClick={() => toast.message("Revenue vs Expense Trend", {
                    description: "Solid blue = Revenue · Dashed teal = Total Expenses",
                  })}
                >
                  <Info className="w-3.5 h-3.5 text-[#64748b]" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <FilterSelect
                  value={trendRange}
                  options={["Last 12 Months", "Last 6 Months", "Last 3 Months", "YTD 2025"]}
                  onChange={setTrendRange}
                />
                <CardMenu
                  items={[
                    {
                      label: "Export chart",
                      icon: <Download className="w-3.5 h-3.5" />,
                      onClick: () => toast.success("Trend chart exported"),
                    },
                    {
                      label: "Refresh",
                      icon: <RefreshCw className="w-3.5 h-3.5" />,
                      onClick: () => toast.success("Trend refreshed"),
                    },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 pb-1">
              <p className="text-[11px] text-[#64748b]">$ in millions</p>
              <div className="flex items-center gap-4 text-[12px] text-[#334155]">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="22" height="8" aria-hidden>
                    <line x1="0" y1="4" x2="16" y2="4" stroke={BLUE_BRIGHT} strokeWidth="3" />
                    <circle cx="18" cy="4" r={2.5} fill={BLUE_BRIGHT} />
                  </svg>
                  Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="26" height="8" aria-hidden>
                    <line
                      x1="0"
                      y1="4"
                      x2="18"
                      y2="4"
                      stroke={TEAL}
                      strokeWidth="3"
                      strokeDasharray="4 3"
                    />
                    <circle cx="22" cy="4" r={2.5} fill={TEAL} />
                  </svg>
                  Total Expenses
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[200px] sm:min-h-[240px] px-1 sm:px-2 pb-3 min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 10, right: 28, left: 0, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BLUE_BRIGHT} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={BLUE_BRIGHT} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#eef2f7" />
                  <XAxis
                    dataKey="m"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    dy={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => (v === 0 ? "0" : `${v}M`)}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }}
                    formatter={(v: number, name: string) => [
                      `$${Number(v).toFixed(1)}M`,
                      name === "revenue" ? "Revenue" : "Total Expenses",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={BLUE_BRIGHT}
                    strokeWidth={3}
                    fill="url(#revFill)"
                    dot={(props) => <SeriesDot {...props} fill={BLUE_BRIGHT} />}
                    activeDot={{ r: 4.5, fill: BLUE_BRIGHT, stroke: "#fff", strokeWidth: 2 }}
                    label={(props) => (
                      <EndValueLabel
                        {...props}
                        color={BLUE}
                        lastIndex={trendData.length - 1}
                        value={lastTrend?.revenue}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke={TEAL}
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    dot={(props) => <SeriesDot {...props} fill={TEAL} />}
                    activeDot={{ r: 4.5, fill: TEAL, stroke: "#fff", strokeWidth: 2 }}
                    label={(props) => (
                      <EndValueLabel
                        {...props}
                        color={TEAL}
                        lastIndex={trendData.length - 1}
                        value={lastTrend?.expenses}
                      />
                    )}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-4 flex flex-col min-w-0")}>
            <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-3">
              <h2 className="text-[14px] font-semibold text-[#1e293b]">Scenario Comparison</h2>
              <button
                type="button"
                onClick={() =>
                  toast.message("Scenario Comparison", {
                    description: "Base vs Upside (+10%) vs Downside (−10%) for May 2025",
                  })
                }
              >
                <Info className="w-3.5 h-3.5 text-[#64748b]" />
              </button>
            </div>
            <div className="px-3 sm:px-4 pb-3 flex-1 flex flex-col min-w-0 overflow-x-auto">
              <ScenarioTable compact activeScenario={scenario} />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-[#94a3b8]">
                  Showing {scenario} · {versionNote} · {period}
                </p>
                <button
                  type="button"
                  onClick={() => openModal("scenarios")}
                  className="text-[11px] font-medium text-[#1d4ed8] hover:underline shrink-0"
                >
                  View all
                </button>
              </div>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3 flex flex-col min-w-0")}>
            <div className="flex items-center gap-1.5 px-4 pt-3.5 pb-3">
              <h2 className="text-[14px] font-semibold text-[#1f2937]">Budget Workflow Progress</h2>
              <button
                type="button"
                onClick={() =>
                  toast.message("Workflow Progress", {
                    description: "Submitted · In Review · Approved across 32 tasks",
                  })
                }
              >
                <Info className="w-3.5 h-3.5 text-[#4b5563]" />
              </button>
            </div>

            <div className="px-3 sm:px-4 flex-1 flex flex-col xl:flex-row items-center gap-4 min-h-[160px]">
              <div className="h-[132px] w-[132px] sm:h-[140px] sm:w-[140px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={WORKFLOW_DONUT}
                      dataKey="value"
                      innerRadius={46}
                      outerRadius={66}
                      paddingAngle={1.5}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {WORKFLOW_DONUT.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[26px] font-bold text-[#1f2937] leading-none">72%</p>
                  <p className="text-[11px] text-[#4b5563] mt-1">Complete</p>
                </div>
              </div>

              <ul className="w-full space-y-3 min-w-0 flex-1">
                {WORKFLOW_DONUT.map((d) => (
                  <li key={d.name}>
                    <button
                      type="button"
                      onClick={() => {
                        toast.message(d.name, { description: `${d.pct} ${d.count}` })
                        openModal("workflow")
                      }}
                      className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2 text-left hover:opacity-80"
                    >
                      <i
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-[12px] text-[#4b5563] truncate">{d.name}</span>
                      <span className="text-right whitespace-nowrap">
                        <span className="text-[12px] font-bold text-[#1f2937] tabular-nums">
                          {d.pct}
                        </span>{" "}
                        <span className="text-[11px] text-[#4b5563] tabular-nums">{d.count}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 border-t border-[#d1d5db] px-4 py-3 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#4b5563] shrink-0" />
              <p className="text-[12px] text-[#4b5563]">
                Next:{" "}
                <button
                  type="button"
                  onClick={() => openModal("workflow")}
                  className="font-medium text-[#1d4ed8] hover:underline"
                >
                  Marketing budget in review
                </button>
              </p>
            </div>
          </section>
        </div>

        {/* Over budget · Cash · Activity — stack until lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <section className={cn(CARD, "lg:col-span-5 min-w-0")}>
            <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#1a202c]">Departments Over Budget</h2>
                <button
                  type="button"
                  onClick={() =>
                    toast.message("Over Budget", {
                      description: "Departments where actual spend exceeds plan",
                    })
                  }
                >
                  <Info className="w-3.5 h-3.5 text-[#718096]" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <FilterSelect
                  value={deptPeriod}
                  options={["May 2025", "Apr 2025"]}
                  onChange={(p) => {
                    setDeptPeriod(p)
                    setPeriod(p)
                  }}
                />
                <CardMenu
                  items={[
                    {
                      label: "Export CSV",
                      icon: <Download className="w-3.5 h-3.5" />,
                      onClick: () => toast.success("Departments exported"),
                    },
                    {
                      label: "View all",
                      onClick: () => openModal("departments"),
                    },
                  ]}
                />
              </div>
            </div>
            <div className="px-4 pb-3 overflow-x-auto">
              {deptRows.length === 0 ? (
                <p className="text-[12px] text-[#64748b] py-8 text-center">
                  No over-budget departments for {deptPeriod}.
                </p>
              ) : (
                <DeptTable rows={deptRows} compact />
              )}
              <button
                type="button"
                onClick={() => openModal("departments")}
                className="text-[12px] font-medium text-[#1d4ed8] hover:underline mt-3 inline-block"
              >
                View all departments
              </button>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-4 flex flex-col min-w-0")}>
            <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Cash Runway</h2>
                <button
                  type="button"
                  onClick={() =>
                    toast.message("Cash Runway", {
                      description: "Projected months of cash remaining at current burn rate",
                    })
                  }
                >
                  <Info className="w-3.5 h-3.5 text-[#4b5563]" />
                </button>
              </div>
              <FilterSelect
                value={cashScenario}
                options={[
                  "Base Case",
                  "Upside",
                  "Downside",
                  "FX Shock",
                  "Hiring Freeze",
                ]}
                onChange={applyScenario}
              />
            </div>

            <div className="px-5 flex-1 flex flex-col pb-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="leading-none">
                  <span className="text-[32px] font-bold text-[#1a1a1a] tabular-nums tracking-tight">
                    {cash.value}
                  </span>
                  <span className="text-[18px] font-bold text-[#1a1a1a] ml-1.5">{cash.unit}</span>
                </p>
                <p className="text-[12px] leading-none whitespace-nowrap">
                  <span
                    className={cn(
                      "font-semibold",
                      cash.up ? "text-[#047857]" : "text-[#b91c1c]",
                    )}
                  >
                    {cash.up ? "▲" : "▼"} {cash.delta}
                  </span>
                  <span className="text-[#4b5563]"> {(PERIOD_META[period] || PERIOD_META["May 2025"]).vs}</span>
                </p>
              </div>

              <p className="text-[11px] text-[#4b5563] mt-4 mb-1">Cash Balance ($ in millions)</p>

              <div className="flex-1 min-h-[160px] sm:min-h-[180px] min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cash.bars} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="m"
                      tick={{ fontSize: 10, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tickFormatter={(_, i) => (cash.bars[i]?.tick ? cash.bars[i].m : "")}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      ticks={[0, 20, 40, 60]}
                      tickFormatter={(v) => (v === 0 ? "0" : `${v}M`)}
                      domain={[0, 60]}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(37,99,235,0.12)" }}
                      contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }}
                      formatter={(v: number) => [`$${v}M`, "Cash Balance"]}
                      labelFormatter={(l) => String(l)}
                    />
                    <ReferenceLine
                      y={cash.target}
                      stroke="#1d4ed8"
                      strokeDasharray="5 4"
                      strokeWidth={2}
                      label={{
                        value: "12 Months Target",
                        position: "insideTopRight",
                        fill: "#1a1a1a",
                        fontSize: 10,
                        fontWeight: 500,
                      }}
                    />
                    <Bar
                      dataKey="bal"
                      fill={BLUE_BRIGHT}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={28}
                      activeBar={{ fill: BLUE }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <button
                type="button"
                onClick={() => openModal("cashflow")}
                className="text-[13px] font-medium text-[#1d4ed8] hover:underline mt-2 self-start"
              >
                View cash flow
              </button>
            </div>
          </section>

          <section className={cn(CARD, "lg:col-span-3 flex flex-col min-w-0")}>
            <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="text-[14px] font-semibold text-[#1f2937]">Recent Activity</h2>
                <button
                  type="button"
                  onClick={() =>
                    toast.message("Recent Activity", {
                      description: "Latest model, forecast, and workflow events",
                    })
                  }
                >
                  <Info className="w-3.5 h-3.5 text-[#4b5563]" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => openModal("activity")}
                className="text-[12px] font-medium text-[#1d4ed8] hover:underline shrink-0"
              >
                View all
              </button>
            </div>

            <div className="mx-4 mb-4 flex-1 rounded-md border border-[#d1d5db] overflow-hidden">
              <ul>
                {ACTIVITY_ALL.slice(0, 5).map((a, i) => (
                  <li key={a.title}>
                    <button
                      type="button"
                      onClick={() =>
                        toast.message(a.title, {
                          description: `${a.who} · ${a.when} — ${a.detail}`,
                        })
                      }
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-[#f9fafb] transition-colors",
                        i < 4 && "border-b border-[#f3f4f6]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 h-8 w-8 rounded-[6px] flex items-center justify-center shrink-0",
                          a.iconBg,
                        )}
                      >
                        <ActivityIcon kind={a.icon} className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12px] font-semibold text-[#1f2937] leading-snug">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-[#4b5563] mt-1 leading-none">
                          {a.who} • {a.when}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Open Tasks */}
        <section className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-4 pb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-[14px] font-semibold text-[#1a1c1e]">Open Tasks</h2>
              <button
                type="button"
                onClick={() =>
                  toast.message("Open Tasks", {
                    description: "Outstanding planning and review tasks for this cycle",
                  })
                }
              >
                <Info className="w-3.5 h-3.5 text-[#4b5563]" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-4 overflow-x-auto">
            {visibleTasks.length === 0 ? (
              <p className="text-[12px] text-[#4b5563] py-8 text-center">
                No open tasks.
              </p>
            ) : (
              <table className="w-full text-[12px] min-w-[780px]">
                <thead>
                  <tr className="text-left border-b border-[#d1d5db]">
                    <th className="pb-2.5 pr-3 font-semibold text-[#374151]">Task</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Module</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Owner</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Due Date</th>
                    <th className="pb-2.5 px-3 font-semibold text-[#374151]">Priority</th>
                    <th className="pb-2.5 pl-3 font-semibold text-[#374151]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((t, i) => (
                    <tr
                      key={t.task}
                      className={cn(
                        "hover:bg-[#f9fafb] cursor-pointer transition-colors",
                        i < visibleTasks.length - 1 && "border-b border-[#f3f4f6]",
                      )}
                      onClick={() =>
                        toast.message(t.task, {
                          description: `${t.module} · ${t.owner} · Due ${t.due}`,
                        })
                      }
                    >
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-2.5 font-medium text-[#1f2937]">
                          <FileText className="w-4 h-4 text-[#4b5563] shrink-0" />
                          {t.task}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4b5563]">{t.module}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-2">
                          <Avatar src={t.photo} alt={t.owner} className="h-7 w-7" />
                          <span className="text-[#374151]">{t.owner}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#4b5563] tabular-nums whitespace-nowrap">
                        {t.due}
                      </td>
                      <td className="py-3 px-3">
                        <PriorityBadge level={t.priority} />
                      </td>
                      <td className="py-3 pl-3">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              type="button"
              onClick={() => openModal("tasks")}
              className="text-[13px] font-medium text-[#1d4ed8] hover:underline mt-3 inline-block"
            >
              View all tasks
            </button>
          </div>
        </section>
      </div>

      {/* View-all dialogs */}
      <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#e2e8f0] shrink-0">
            <DialogTitle className="text-[15px] text-[#0f172a]">
              {modal === "departments" && "All Departments Over Budget"}
              {modal === "activity" && "All Recent Activity"}
              {modal === "tasks" && "All Open Tasks"}
              {modal === "scenarios" && "Full Scenario Comparison"}
              {modal === "workflow" && "Budget Workflow Details"}
              {modal === "cashflow" && "Cash Flow Detail"}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#64748b]">
              {modal === "departments" && `${modalDeptRows.length} departments · ${modalDeptPeriod}`}
              {modal === "activity" && `${ACTIVITY_ALL.length} events across the planning cycle`}
              {modal === "tasks" && `${modalTasks.length} open tasks`}
              {modal === "scenarios" &&
                `${scenario} · ${version} · ${period} (all scenarios compared)`}
              {modal === "workflow" && "32 tasks · 72% complete · Marketing next in review"}
              {modal === "cashflow" &&
                `${cashScenario} · ${cash.value} ${cash.unit} runway · May ’25 – Feb ’26`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-auto px-5 py-4 space-y-3">
            {modal === "departments" && (
              <>
                <div className="flex justify-end">
                  <FilterSelect
                    value={modalDeptPeriod}
                    options={["May 2025", "Apr 2025"]}
                    onChange={setModalDeptPeriod}
                  />
                </div>
                <DeptTable rows={modalDeptRows} />
              </>
            )}

            {modal === "activity" && (
              <div className="rounded-md border border-[#d1d5db] overflow-hidden">
                <ul>
                  {ACTIVITY_ALL.map((a, i) => (
                    <li key={a.title}>
                      <button
                        type="button"
                        onClick={() =>
                          toast.message(a.title, {
                            description: `${a.who} · ${a.when} — ${a.detail}`,
                          })
                        }
                        className={cn(
                          "w-full flex items-start gap-3 px-3 py-3.5 text-left hover:bg-[#f9fafb]",
                          i < ACTIVITY_ALL.length - 1 && "border-b border-[#f3f4f6]",
                        )}
                      >
                        <span
                          className={cn(
                            "h-9 w-9 rounded-[6px] flex items-center justify-center shrink-0",
                            a.iconBg,
                          )}
                        >
                          <ActivityIcon kind={a.icon} className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#1f2937]">{a.title}</p>
                          <p className="text-[12px] text-[#4b5563] mt-0.5">{a.detail}</p>
                          <p className="text-[11px] text-[#4b5563] mt-1">
                            {a.who} • {a.when}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {modal === "tasks" && (
              <>
                <div className="rounded-md border border-[#e2e8f0] overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-left">
                        <th className="py-2.5 px-3 font-semibold">Task</th>
                        <th className="py-2.5 px-3 font-semibold">Module</th>
                        <th className="py-2.5 px-3 font-semibold">Owner</th>
                        <th className="py-2.5 px-3 font-semibold">Due</th>
                        <th className="py-2.5 px-3 font-semibold">Priority</th>
                        <th className="py-2.5 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalTasks.map((t) => (
                        <tr key={t.task} className="border-t border-[#f1f5f9] hover:bg-[#f9fafb]">
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-2 font-medium text-[#1f2937]">
                              <FileText className="w-4 h-4 text-[#4b5563] shrink-0" />
                              {t.task}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#4b5563]">{t.module}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-2">
                              <Avatar src={t.photo} alt={t.owner} className="h-7 w-7" />
                              <span className="text-[#374151]">{t.owner}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#4b5563]">{t.due}</td>
                          <td className="py-2.5 px-3">
                            <PriorityBadge level={t.priority} />
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={t.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {modal === "scenarios" && (
              <>
                <ScenarioTable activeScenario={scenario} />
                <p className="text-[11px] text-[#94a3b8]">
                  Active: {scenario} · {versionNote} · {period}. Click Export in the card menu to
                  download.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/forecasting/scenarios"
                    className="h-9 inline-flex items-center rounded-full bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
                  >
                    Open Scenarios module
                  </Link>
                </div>
              </>
            )}

            {modal === "workflow" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {WORKFLOW_DONUT.map((d) => (
                    <div
                      key={d.name}
                      className="rounded-md border border-[#e2e8f0] p-3 text-center"
                    >
                      <i
                        className="inline-block h-3 w-3 rounded-full mb-2"
                        style={{ backgroundColor: d.color }}
                      />
                      <p className="text-[12px] text-[#64748b]">{d.name}</p>
                      <p className="text-[18px] font-bold text-[#0f172a] mt-1">{d.pct}</p>
                      <p className="text-[11px] text-[#64748b]">{d.count}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-md border border-[#e2e8f0] px-3 py-3 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[#1d4ed8]" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#0f172a]">
                      Next up: Marketing budget in review
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      Assigned to FP&A · Due May 19, 2025
                    </p>
                  </div>
                </div>
                <Link
                  href="/forecasting/workflow"
                  className="h-9 inline-flex items-center rounded-md bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
                >
                  Open Workflow & Approvals
                </Link>
              </div>
            )}

            {modal === "cashflow" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[28px] font-bold text-[#1a1a1a] tabular-nums leading-none">
                      {cash.value}
                      <span className="text-[16px] ml-1.5">{cash.unit}</span>
                    </p>
                    <p className="text-[12px] mt-1.5">
                      <span
                        className={cn(
                          "font-semibold",
                          cash.up ? "text-[#047857]" : "text-[#b91c1c]",
                        )}
                      >
                        {cash.up ? "▲" : "▼"} {cash.delta}
                      </span>
                      <span className="text-[#4b5563]">
                        {" "}
                        {(PERIOD_META[period] || PERIOD_META["May 2025"]).vs} · {cashScenario}
                      </span>
                    </p>
                  </div>
                  <FilterSelect
                    value={cashScenario}
                    options={[
                      "Base Case",
                      "Upside",
                      "Downside",
                      "FX Shock",
                      "Hiring Freeze",
                    ]}
                    onChange={applyScenario}
                  />
                </div>

                <div className="h-[220px] rounded-md border border-[#d1d5db] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cash.bars} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="m"
                        tick={{ fontSize: 10, fill: "#4b5563" }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tickFormatter={(_, i) => (cash.bars[i]?.tick ? cash.bars[i].m : "")}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#4b5563" }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        ticks={[0, 20, 40, 60]}
                        tickFormatter={(v) => (v === 0 ? "0" : `${v}M`)}
                        domain={[0, 60]}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }}
                        formatter={(v: number) => [`$${v}M`, "Cash Balance"]}
                      />
                      <ReferenceLine
                        y={cash.target}
                        stroke="#2563eb"
                        strokeDasharray="5 4"
                        label={{
                          value: "12 Months Target",
                          position: "insideTopRight",
                          fill: "#1a1a1a",
                          fontSize: 10,
                        }}
                      />
                      <Bar dataKey="bal" fill={BLUE_BRIGHT} radius={[3, 3, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-md border border-[#e2e8f0] overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-left">
                        <th className="py-2 px-3 font-semibold">Period</th>
                        <th className="py-2 px-3 font-semibold text-right">Cash Balance</th>
                        <th className="py-2 px-3 font-semibold text-right">vs Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cash.bars.map((b) => (
                        <tr key={b.m} className="border-t border-[#f1f5f9]">
                          <td className="py-2 px-3 text-[#334155]">{b.m}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-semibold">
                            ${b.bal.toFixed(1)}M
                          </td>
                          <td
                            className={cn(
                              "py-2 px-3 text-right tabular-nums font-medium",
                              b.bal >= cash.target ? "text-[#047857]" : "text-[#b91c1c]",
                            )}
                          >
                            {b.bal >= cash.target ? "+" : ""}
                            {(b.bal - cash.target).toFixed(1)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Link
                  href="/forecasting/cash-flow"
                  className="h-9 inline-flex items-center rounded-md bg-[#2563eb] px-4 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
                >
                  Open Cash Flow module
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
