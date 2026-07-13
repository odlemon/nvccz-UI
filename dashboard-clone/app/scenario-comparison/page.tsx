'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, LineChart, Line, ReferenceLine
} from 'recharts'
import { Info, Copy, TrendingUp, Download, MoreHorizontal, TrendingDown, Users } from 'lucide-react'

const scenarioCards = [
  {
    num: '1', label: 'Base Case', color: '#2563eb', bgColor: '#eff6ff',
    revenue: '$125.8M', ebitda: '$23.6M', margin: '18.8%',
    revDelta: '+4.2%', ebitdaDelta: '+6.1%', marginDelta: '+29 bps',
    cash: '$38.4M', runway: '14.2 months', headcount: '532 FTEs',
    sparkData: [8, 9, 10, 11, 10, 12, 13, 12, 14, 15, 14, 16],
  },
  {
    num: '2', label: 'Upside Case', color: '#16a34a', bgColor: '#f0fdf4',
    revenue: '$138.3M', ebitda: '$29.1M', margin: '21.0%',
    revDelta: '+13.0%', ebitdaDelta: '+18.4%', marginDelta: '+210 bps',
    cash: '$53.2M', runway: '17.6 months', headcount: '548 FTEs',
    sparkData: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  {
    num: '3', label: 'Downside Case', color: '#dc2626', bgColor: '#fff7ed',
    revenue: '$113.2M', ebitda: '$17.2M', margin: '15.2%',
    revDelta: '-6.7%', ebitdaDelta: '-20.5%', marginDelta: '-120 bps',
    cash: '$25.1M', runway: '10.2 months', headcount: '516 FTEs',
    sparkData: [12, 11, 10, 9, 8, 9, 8, 7, 8, 7, 6, 7],
  },
]

const compTable = [
  { metric: 'Revenue', base: '$125.8M', upside: '$138.3M', downside: '$113.2M', uVb: '+9.9%', dVb: '-10.0%' },
  { metric: 'Gross Profit', base: '$81.7M', upside: '$90.6M', downside: '$72.5M', uVb: '+10.9%', dVb: '-11.3%' },
  { metric: 'Gross Margin', base: '64.9%', upside: '65.5%', downside: '64.1%', uVb: '+60 bps', dVb: '-80 bps' },
  { metric: 'EBITDA', base: '$23.4M', upside: '$29.1M', downside: '$17.2M', uVb: '+24.4%', dVb: '-26.5%' },
  { metric: 'EBITDA Margin', base: '18.8%', upside: '21.0%', downside: '15.2%', uVb: '+220 bps', dVb: '-360 bps' },
  { metric: 'Operating Income', base: '$19.5M', upside: '$25.3M', downside: '$13.6M', uVb: '+27.8%', dVb: '-31.3%' },
  { metric: 'Net Income', base: '$14.5M', upside: '$18.9M', downside: '$9.4M', uVb: '+30.3%', dVb: '-34.9%' },
  { metric: 'Net Margin', base: '11.5%', upside: '13.7%', downside: '8.3%', uVb: '+200 bps', dVb: '-320 bps' },
  { metric: 'Closing Cash', base: '$38.4M', upside: '$53.2M', downside: '$25.1M', uVb: '+38.5%', dVb: '-34.6%' },
  { metric: 'Cash Runway (months)', base: '14.2', upside: '17.6', downside: '10.2', uVb: '+3.4 months', dVb: '-4.0 months' },
  { metric: 'CapEx', base: '$7.8M', upside: '$8.3M', downside: '$6.1M', uVb: '+6.4%', dVb: '-21.8%' },
  { metric: 'Headcount (FTEs)', base: '532', upside: '548', downside: '516', uVb: '+16', dVb: '-16' },
]

// Waterfall bridge — stacked bar chart with invisible spacer.
// For positive bars: bottom = running total before bar, bar = delta
// For negative bars: bottom = running total AFTER the drop (lower point), bar = abs(delta)
// Budget 120 → +6.4 → +8.7 → +7.2 → +1.1 → -4.3 → -2.5 → Forecast 135.7 (shown as 125.8 label)
const bridgeData = [
  { name: 'Budget',          bottom: 0,     bar: 120,  fill: '#94a3b8' },
  { name: 'Price / Mix',     bottom: 120,   bar: 6.4,  fill: '#10b981' },
  { name: 'Volume',          bottom: 126.4, bar: 8.7,  fill: '#10b981' },
  { name: 'New Business',    bottom: 135.1, bar: 7.2,  fill: '#10b981' },
  { name: 'Other Income',    bottom: 142.3, bar: 1.1,  fill: '#10b981' },
  { name: 'Churn/Attrition', bottom: 139.1, bar: 4.3,  fill: '#ef4444' },
  { name: 'FX / Other',      bottom: 134.8, bar: 2.5,  fill: '#ef4444' },
  { name: 'Forecast',        bottom: 0,     bar: 125.8, fill: '#2563eb' },
]

const sensitivityData = [
  { driver: 'Revenue Growth', range: '-5% to +5%', low: '$18.7M', mid: '$23.6M', high: '$28.5M' },
  { driver: 'FX Rate (USD)', range: '-10% to +10%', low: '$20.1M', mid: '$23.6M', high: '$27.2M' },
  { driver: 'Salary Increase', range: '+0% to +10%', low: '$25.8M', mid: '$23.6M', high: '$21.4M' },
  { driver: 'Collection Days', range: '+10 to -10 days', low: '$21.2M', mid: '$23.6M', high: '$26.0M' },
]

const cashRunwayComparison = [
  { name: 'Base Case', value: 14.2, color: '#2563eb' },
  { name: 'Upside Case', value: 17.6, color: '#10b981' },
  { name: 'Downside Case', value: 10.2, color: '#dc2626' },
]

const notes = [
  {
    label: 'Upside Scenario', color: '#16a34a',
    text: 'Strong revenue upside driven by new logo pipeline and pricing optimizations. Recommend investment in sales capacity to capture growth opportunity.',
    icon: TrendingUp,
  },
  {
    label: 'Base Case', color: '#2563eb',
    text: 'Balanced plan with healthy margin and cash position. Continue operational discipline and monitor macro conditions.',
    icon: TrendingUp,
  },
  {
    label: 'Downside Scenario', color: '#dc2626',
    text: 'Revenue pressure and higher costs impact profitability and runway. Recommend cost controls and prioritizing high ROI initiatives.',
    icon: TrendingDown,
  },
]

// Custom shape that renders nothing — used as the invisible waterfall spacer
function InvisibleBar() { return null as unknown as React.ReactElement }

function Spark({ data, color }: { data: number[], color: string }) {
  const pts = data.map((v, i) => ({ v, i }))
  return (
    <ResponsiveContainer width={80} height={28}>
      <LineChart data={pts} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function ScenarioComparisonPage() {
  return (
    <DashboardShell>
      <TopBar title="Scenario Comparison" scenario="2025 Planning" version="Working" period="May 2025" entity="All Entities" />
      <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#f0f2f5' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-slate-800">Scenario Comparison</h1>
            <Info size={13} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#fff' }}>
              <Copy size={11} /> Duplicate Scenario
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#fff' }}>
              <TrendingUp size={11} /> Promote to Forecast
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#fff' }}>
              <Download size={11} /> Export Comparison
            </button>
            <MoreHorizontal size={16} className="text-slate-400 cursor-pointer" />
          </div>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {scenarioCards.map((s, i) => (
            <div key={i} className="rounded-lg p-4" style={{ backgroundColor: '#fff', border: `1.5px solid ${s.color}20` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: s.color }}>{s.num}</span>
                <span className="text-sm font-bold text-slate-800">{s.label}</span>
                <div className="ml-auto"><Spark data={s.sparkData} color={s.color} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Revenue', value: s.revenue, delta: s.revDelta },
                  { label: 'EBITDA', value: s.ebitda, delta: s.ebitdaDelta },
                  { label: 'Net Margin', value: s.margin, delta: s.marginDelta },
                ].map((kpi, ki) => (
                  <div key={ki}>
                    <p className="text-xs text-slate-400">{kpi.label}</p>
                    <p className="text-sm font-bold text-slate-800">{kpi.value}</p>
                    <p className="text-xs" style={{ color: kpi.delta.startsWith('-') ? '#dc2626' : '#16a34a' }}>
                      {kpi.delta.startsWith('-') ? '▼' : '▲'} {kpi.delta} vs Forecast
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="text-slate-400">⬡</span> <span>Closing Cash</span>
                  <span className="font-semibold text-slate-700 ml-1">{s.cash}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Runway</span>
                  <span className="font-semibold text-slate-700 ml-1">{s.runway}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users size={10} />
                  <span className="font-semibold text-slate-700">{s.headcount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle row: Comparison Table + Bridge */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Comparison Table */}
          <div className="col-span-6 rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-slate-700">Scenario Comparison Table</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8' }}>
                  <th className="text-left font-medium pb-2 w-4">#</th>
                  <th className="text-left font-medium pb-2">Metric</th>
                  <th className="text-right font-medium pb-2"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>Base Case</span></th>
                  <th className="text-right font-medium pb-2"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>Upside Case</span></th>
                  <th className="text-right font-medium pb-2"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>Downside Case</span></th>
                  <th className="text-right font-medium pb-2 text-xs" style={{ color: '#16a34a' }}>Upside vs Base</th>
                  <th className="text-right font-medium pb-2 text-xs" style={{ color: '#dc2626' }}>Downside vs Base</th>
                </tr>
              </thead>
              <tbody>
                {compTable.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td className="py-1.5 text-slate-400">{i + 1}</td>
                    <td className="py-1.5 text-slate-700">{r.metric}</td>
                    <td className="py-1.5 text-right font-medium text-slate-800">{r.base}</td>
                    <td className="py-1.5 text-right font-medium text-slate-800">{r.upside}</td>
                    <td className="py-1.5 text-right font-medium text-slate-800">{r.downside}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: '#16a34a' }}>{r.uVb}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: '#dc2626' }}>{r.dVb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Budget to Forecast Bridge */}
          <div className="col-span-6 rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Budget to Forecast Bridge (Revenue)</span>
                <Info size={11} className="text-slate-400" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>Base Case ▾</span>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bridgeData} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[80, 150]} tickFormatter={v => `${v}M`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload as typeof bridgeData[0]
                      return (
                        <div className="rounded shadow-md border p-2" style={{ backgroundColor: '#fff', borderColor: '#e2e8f0', fontSize: 11 }}>
                          <p className="font-semibold text-slate-700">{d.name}</p>
                          <p style={{ color: d.fill }}>${d.bar}M</p>
                        </div>
                      )
                    }}
                  />
                  {/* Invisible spacer bar — renders nothing, creates floating waterfall effect */}
                  <Bar dataKey="bottom" stackId="wf" maxBarSize={36} isAnimationActive={false} legendType="none" shape={<InvisibleBar />} />
                  {/* Visible colored bar on top of spacer */}
                  <Bar dataKey="bar" stackId="wf" maxBarSize={36} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {bridgeData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                  <ReferenceLine y={125.8} stroke="#2563eb" strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom row: Sensitivity + Cash Runway + Notes */}
        <div className="grid grid-cols-12 gap-4">
          {/* Sensitivity */}
          <div className="col-span-4 rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-slate-700">Sensitivity Analysis</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#94a3b8' }}>
                  <th className="text-left font-medium pb-2">Driver</th>
                  <th className="text-left font-medium pb-2">Range</th>
                  <th className="text-center font-medium pb-2" colSpan={3}>Impact on EBITDA</th>
                </tr>
                <tr style={{ color: '#94a3b8' }}>
                  <th></th><th></th>
                  <th className="text-center pb-1 font-medium">Low</th>
                  <th className="text-center pb-1 font-medium">Mid (Base Case)</th>
                  <th className="text-center pb-1 font-medium">High</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td className="py-1.5 text-slate-700">{r.driver}</td>
                    <td className="py-1.5 text-slate-400 text-xs">{r.range}</td>
                    <td className="py-1.5 text-center font-medium" style={{ color: '#dc2626' }}>{r.low}</td>
                    <td className="py-1.5 text-center font-medium text-slate-700">{r.mid}</td>
                    <td className="py-1.5 text-center font-medium" style={{ color: '#16a34a' }}>{r.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="text-xs mt-2" style={{ color: '#2563eb' }}>View full sensitivity model</button>
          </div>

          {/* Cash Runway Comparison */}
          <div className="col-span-4 rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-semibold text-slate-700">Cash Runway Comparison</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashRunwayComparison} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 25]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={12} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '12 Months Target', position: 'right', fontSize: 8 }} />
                  <Bar dataKey="value" maxBarSize={48} radius={[3, 3, 0, 0]}>
                    {cashRunwayComparison.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button className="text-xs mt-1" style={{ color: '#2563eb' }}>View cash flow</button>
          </div>

          {/* Notes & Recommendations */}
          <div className="col-span-4 rounded-lg p-4" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-slate-700">Notes &amp; Recommendations</span>
              <Info size={11} className="text-slate-400" />
            </div>
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => (
                <div key={i} className="flex items-start gap-2">
                  <n.icon size={13} style={{ color: n.color, marginTop: 1, shrink: 0 }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: n.color }}>{n.label}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{n.text}</p>
                  </div>
                </div>
              ))}
              <button className="text-xs" style={{ color: '#2563eb' }}>Add note</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
