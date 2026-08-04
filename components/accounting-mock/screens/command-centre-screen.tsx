"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CircleDollarSign,
  Landmark,
  LineChart as LineChartIcon,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  User,
} from "lucide-react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcDelta,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acBudgetSeries,
  acCashByCurrency,
  acCashFootnote,
  acCashTotal,
  acCloseChecklist,
  acCloseReadiness,
  acCloseTarget,
  acControlQueue,
  acControlQueueTotal,
  acKpis,
  acPostingsCount,
  acRecentPostings,
  acRefreshedAt,
  acVersion,
} from "@/lib/accounting-mock/fixtures"
import { cn } from "@/lib/utils"

const kpiIcons = {
  Landmark: <Landmark className="h-3.5 w-3.5" />,
  User: <User className="h-3.5 w-3.5" />,
  ShoppingCart: <ShoppingCart className="h-3.5 w-3.5" />,
  LineChart: <LineChartIcon className="h-3.5 w-3.5" />,
  CircleDollarSign: <CircleDollarSign className="h-3.5 w-3.5" />,
}

function AcSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 pl-3 pr-7 rounded-full border border-[#E5E7EB] bg-white text-[11px] font-medium text-[#374151] outline-none focus:border-[#2563EB] cursor-pointer",
        className
      )}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}

const leftTick = (v: number) => {
  if (v === 0) return "0"
  if (v >= 1000) return `${(v / 1000).toFixed(1)}m`
  return `${v}k`
}

function VariancePill({
  x,
  y,
  value,
}: {
  x?: number | string
  y?: number | string
  value?: number | string
}) {
  if (typeof x !== "number" || typeof y !== "number" || value == null || value === "") return null
  const v = Number(value)
  const negative = v < 0
  return (
    <foreignObject x={x - 17} y={negative ? y + 8 : y - 26} width={34} height={20}>
      <div className="flex items-center justify-center h-[18px] rounded-[4px] bg-[#F59E0B] text-white text-[9px] font-bold leading-none">
        {v > 0 ? "" : "-"}
        {Math.abs(v)}%
      </div>
    </foreignObject>
  )
}

function CloseDonut({ value }: { value: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[150px] w-[150px] shrink-0">
      <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#E5E7EB" strokeWidth="15" />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="#2563EB"
          strokeWidth="15"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[34px] font-bold text-[#2563EB] leading-none tracking-tight">{value}%</span>
        <span className="text-[10px] text-[#6B7280] mt-1">Overall readiness</span>
      </div>
    </div>
  )
}

export function CommandCentreScreen() {
  const router = useRouter()
  const [freq, setFreq] = useState("Monthly")
  const [fy, setFy] = useState("FY 2026")

  return (
    <div className="p-4 lg:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">Accounting Command Centre</h1>
          <p className="text-[11px] text-[#6B7280] mt-1">Control today&apos;s cash, close and compliance work</p>
        </div>
        <AcButton
          variant="outline"
          onClick={() => toast("Customise", { description: "Widget layout preferences (mock)." })}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#6B7280]" /> Customise
        </AcButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {acKpis.map((k) => (
          <AcCard key={k.id} className="px-4 py-3">
            <div className="flex items-center gap-2 text-[#0B1739]">
              {kpiIcons[k.icon as keyof typeof kpiIcons]}
              <span className="text-[11px] font-medium text-[#4B5563]">{k.label}</span>
            </div>
            <p className="mt-1.5 text-[23px] font-bold text-[#0B1739] tracking-tight leading-none">{k.value}</p>
            <p className="mt-2 flex items-center gap-2 text-[10px]">
              <span className="text-[#9CA3AF]">{k.deltaLabel}</span>
              <AcDelta value={k.deltaValue} down={k.tone === "down"} />
            </p>
          </AcCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Actual vs Budget */}
        <AcCard className="xl:col-span-5 overflow-hidden">
          <AcCardHeader
            title="Actual vs Budget (USD)"
            className="border-b-0 pb-0"
            action={
              <div className="flex gap-2">
                <AcSelect value={freq} options={["Monthly", "Quarterly"]} onChange={setFreq} />
                <AcSelect value={fy} options={["FY 2026", "FY 2025"]} onChange={setFy} />
              </div>
            }
          />
          <div className="px-4 pt-2 flex items-center gap-4 text-[10px] font-medium text-[#374151]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#2563EB]" /> Actual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[2px] w-4 rounded bg-[#0B1739]" /> Budget
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Variance %
            </span>
          </div>
          <div className="px-4 pt-2 flex items-center justify-between text-[9px] text-[#9CA3AF]">
            <span>USD</span>
            <span>Variance %</span>
          </div>
          <div className="h-[240px] px-1 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={acBudgetSeries} margin={{ top: 10, right: 6, left: 2, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#EEF1F5" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 1200]}
                  ticks={[0, 200, 400, 600, 800, 1000, 1200]}
                  tickFormatter={leftTick}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[-20, 20]}
                  ticks={[-20, -10, 0, 10, 20]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
                  formatter={(value, name) =>
                    name === "Variance %" ? [`${value}%`, name] : [`$${value}k`, name]
                  }
                />
                <Bar yAxisId="left" dataKey="actual" name="Actual" fill="#2563EB" barSize={22} radius={[2, 2, 0, 0]} />
                <Line
                  yAxisId="left"
                  type="linear"
                  dataKey="budget"
                  name="Budget"
                  stroke="#0B1739"
                  strokeWidth={1.75}
                  dot={{ r: 3, fill: "#0B1739", strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="variance"
                  name="Variance %"
                  stroke="transparent"
                  connectNulls={false}
                  dot={{ r: 4.5, fill: "#F59E0B", strokeWidth: 0 }}
                  activeDot={{ r: 5.5 }}
                >
                  <LabelList dataKey="variance" content={<VariancePill />} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </AcCard>

        {/* Cash position by currency */}
        <AcCard className="xl:col-span-3 overflow-hidden">
          <AcCardHeader title="Cash position by currency" />
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                <th className="px-4 py-2.5 text-left font-normal">Currency</th>
                <th className="px-2 py-2.5 text-right font-normal">Cash &amp; Bank</th>
                <th className="px-2 py-2.5 text-right font-normal">% of Total</th>
                <th className="px-4 py-2.5 text-right font-normal whitespace-nowrap">vs Jun 2026</th>
              </tr>
            </thead>
            <tbody>
              {acCashByCurrency.map((r) => (
                <tr key={r.currency} className="border-b border-[#EEF1F5]">
                  <td className="px-4 py-3.5 font-medium text-[#0B1739]">{r.currency}</td>
                  <td className="px-2 py-3.5 text-right tabular-nums text-[#0B1739]">{r.cash}</td>
                  <td className="px-2 py-3.5 text-right tabular-nums text-[#374151]">{r.pct}</td>
                  <td className="px-4 py-3.5 text-right">
                    <AcDelta value={r.vs} />
                  </td>
                </tr>
              ))}
              <tr className="border-b border-[#EEF1F5]">
                <td className="px-4 py-3.5 font-bold text-[#0B1739]">Total</td>
                <td className="px-2 py-3.5 text-right font-bold tabular-nums text-[#0B1739]">{acCashTotal.cash}</td>
                <td className="px-2 py-3.5 text-right tabular-nums text-[#374151]">{acCashTotal.pct}</td>
                <td className="px-4 py-3.5 text-right">
                  <AcDelta value={acCashTotal.vs} />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="px-4 py-2.5 text-[10px] text-[#9CA3AF]">{acCashFootnote}</p>
        </AcCard>

        {/* Control queue */}
        <AcCard className="xl:col-span-4 overflow-hidden">
          <AcCardHeader title="Control queue" />
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                <th className="px-4 py-2.5 text-left font-normal" colSpan={2}>
                  Work item
                </th>
                <th className="px-2 py-2.5 text-left font-normal">Owner</th>
                <th className="px-2 py-2.5 text-left font-normal whitespace-nowrap">Age / Due</th>
                <th className="px-4 py-2.5 text-left font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {acControlQueue.map((item) => (
                <tr key={item.id} className="border-b border-[#EEF1F5]">
                  <td className="pl-4 pr-1 py-2.5 w-6 align-middle">
                    {item.count === "calendar" ? (
                      <CalendarDays className="h-3.5 w-3.5 text-[#F59E0B]" />
                    ) : (
                      <span
                        className={cn(
                          "text-[13px] font-bold",
                          item.tone === "exception" ? "text-[#DC2626]" : "text-[#F59E0B]"
                        )}
                      >
                        {item.count}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-[#374151] leading-snug">{item.work}</td>
                  <td className="px-2 py-2.5 text-[#374151] whitespace-nowrap">{item.owner}</td>
                  <td className="px-2 py-2.5 text-[#374151] whitespace-nowrap">{item.age}</td>
                  <td className="px-4 py-2.5">
                    <AcButton
                      variant="cobaltOutline"
                      className="h-7 px-3"
                      onClick={() => {
                        toast(item.action, { description: item.work })
                        router.push(item.href)
                      }}
                    >
                      {item.action}
                    </AcButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={() =>
              toast("Control queue", { description: `${acControlQueueTotal} open control items (mock).` })
            }
            className="block px-4 py-2.5 text-[11px] font-medium text-[#2563EB] hover:underline"
          >
            View all control items ({acControlQueueTotal})
          </button>
        </AcCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Recent postings */}
        <AcCard className="xl:col-span-8 overflow-hidden">
          <AcCardHeader title="Recent postings" />
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Date</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Reference</th>
                  <th className="px-3 py-2.5 text-left font-normal">Description</th>
                  <th className="px-3 py-2.5 text-left font-normal">Module</th>
                  <th className="px-3 py-2.5 text-left font-normal">Account</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Debit (USD)</th>
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Credit (USD)</th>
                  <th className="px-3 py-2.5 text-left font-normal">Currency</th>
                  <th className="px-3 py-2.5 text-left font-normal">Status</th>
                  <th className="px-3 py-2.5 text-left font-normal">User</th>
                </tr>
              </thead>
              <tbody>
                {acRecentPostings.map((r) => (
                  <tr key={r.ref} className="border-b border-[#EEF1F5] hover:bg-[#F9FBFE]">
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 text-[#0B1739] font-medium whitespace-nowrap">{r.ref}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.desc}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.module}</td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.account}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.debit}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{r.credit}</td>
                    <td className="px-3 py-2.5 text-[#374151]">{r.currency}</td>
                    <td className="px-3 py-2.5">
                      <AcStatusPill label={r.status} tone={r.status === "Posted" ? "posted" : "pending"} />
                    </td>
                    <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{r.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-[10px] text-[#9CA3AF]">
              Showing {acPostingsCount.shown} of {acPostingsCount.total}
            </span>
            <button
              type="button"
              onClick={() => router.push("/accounting-v2/general-ledger")}
              className="text-[11px] font-medium text-[#2563EB] hover:underline"
            >
              View all postings
            </button>
          </div>
        </AcCard>

        {/* Close readiness */}
        <AcCard className="xl:col-span-4 overflow-hidden">
          <AcCardHeader title="Close readiness" className="border-b-0" />
          <div className="flex flex-wrap items-center gap-4 px-4 pb-4">
            <CloseDonut value={acCloseReadiness} />
            <table className="flex-1 min-w-[200px] text-[11px]">
              <thead>
                <tr className="text-[#6B7280]">
                  <th className="pb-2 text-left font-normal">Area</th>
                  <th className="pb-2 text-left font-normal">Status</th>
                  <th className="pb-2 text-right font-normal">Complete</th>
                </tr>
              </thead>
              <tbody>
                {acCloseChecklist.map((row) => (
                  <tr key={row.area} className="border-t border-[#EEF1F5]">
                    <td className="py-2 text-[#374151] whitespace-nowrap">{row.area}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1.5 text-[#374151] whitespace-nowrap">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            row.status === "In progress" ? "bg-[#2563EB]" : "bg-[#F59E0B]"
                          )}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums text-[#0B1739]">{row.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#EEF1F5]">
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-[#6B7280]">Target close date</span>
              <span className="h-4 w-px bg-[#E5E7EB]" />
              <span className="inline-flex items-center gap-1.5 text-[#0B1739]">
                <CalendarDays className="h-3.5 w-3.5 text-[#6B7280]" />
                <span className="font-semibold">{acCloseTarget.date}</span>
                <span className="text-[#9CA3AF]">({acCloseTarget.days} days)</span>
              </span>
            </div>
            <AcButton variant="cobaltOutline" onClick={() => router.push("/accounting-v2/close")}>
              View close checklist
            </AcButton>
          </div>
        </AcCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2 text-[10px] text-[#9CA3AF]">
        <button
          type="button"
          onClick={() => toast.success("Data refreshed")}
          className="inline-flex items-center gap-1.5 hover:text-[#0B1739]"
        >
          Last data refresh: {acRefreshedAt}
          <RefreshCw className="h-3 w-3" />
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => toast("Audit trail")} className="hover:text-[#2563EB]">
            Audit trail
          </button>
          <button type="button" onClick={() => toast("Data integrity")} className="hover:text-[#2563EB]">
            Data integrity
          </button>
          <button type="button" onClick={() => toast("Support")} className="hover:text-[#2563EB]">
            Support
          </button>
          <span className="h-3 w-px bg-[#E5E7EB]" />
          <span>{acVersion}</span>
        </div>
      </div>
    </div>
  )
}
