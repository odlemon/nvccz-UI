'use client'

import { useState } from 'react'
import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, LineChart, Line, ReferenceLine
} from 'recharts'
import { Info, Copy, TrendingUp, Download, MoreHorizontal, TrendingDown, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useForecastingTheme } from '@/components/fpna/theme-provider'

type CaseId = 'base' | 'upside' | 'downside'
type Theme = 'light' | 'dark'

// Base/Upside/Downside keep a consistent hue (blue/green/red) across both
// themes — only brightness/saturation shifts for dark mode legibility.
function caseColor(id: CaseId, theme: Theme) {
  if (id === 'base') return theme === 'dark' ? '#3b82f6' : '#2563eb'
  if (id === 'upside') return theme === 'dark' ? '#10b981' : '#16a34a'
  return theme === 'dark' ? '#ef4444' : '#dc2626'
}

// Soft tint used for badges / card accents behind the case color.
function caseTint(id: CaseId, theme: Theme) {
  if (theme === 'dark') {
    if (id === 'base') return 'rgba(59,130,246,0.16)'
    if (id === 'upside') return 'rgba(16,185,129,0.16)'
    return 'rgba(239,68,68,0.16)'
  }
  if (id === 'base') return '#eff6ff'
  if (id === 'upside') return '#f0fdf4'
  return '#fef2f2'
}

const neutralColor = (theme: Theme) => (theme === 'dark' ? '#64748b' : '#94a3b8')

const scenarioCards: Array<{
  id: CaseId
  num: string
  label: string
  revenue: string
  ebitda: string
  margin: string
  revDelta: string
  ebitdaDelta: string
  marginDelta: string
  cash: string
  runway: string
  headcount: string
  sparkData: number[]
}> = [
  {
    id: 'base', num: '1', label: 'Base Case',
    revenue: '$125.8M', ebitda: '$23.6M', margin: '18.8%',
    revDelta: '+4.2%', ebitdaDelta: '+6.1%', marginDelta: '+29 bps',
    cash: '$38.4M', runway: '14.2 months', headcount: '532 FTEs',
    sparkData: [8, 9, 10, 11, 10, 12, 13, 12, 14, 15, 14, 16],
  },
  {
    id: 'upside', num: '2', label: 'Upside Case',
    revenue: '$138.3M', ebitda: '$29.1M', margin: '21.0%',
    revDelta: '+13.0%', ebitdaDelta: '+18.4%', marginDelta: '+210 bps',
    cash: '$53.2M', runway: '17.6 months', headcount: '548 FTEs',
    sparkData: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  },
  {
    id: 'downside', num: '3', label: 'Downside Case',
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
const bridgeData: Array<{ name: string; bottom: number; bar: number; kind: 'neutral' | 'positive' | 'negative' | 'result' }> = [
  { name: 'Budget',          bottom: 0,     bar: 120,   kind: 'neutral' },
  { name: 'Price / Mix',     bottom: 120,   bar: 6.4,   kind: 'positive' },
  { name: 'Volume',          bottom: 126.4, bar: 8.7,   kind: 'positive' },
  { name: 'New Business',    bottom: 135.1, bar: 7.2,   kind: 'positive' },
  { name: 'Other Income',    bottom: 142.3, bar: 1.1,   kind: 'positive' },
  { name: 'Churn/Attrition', bottom: 139.1, bar: 4.3,   kind: 'negative' },
  { name: 'FX / Other',      bottom: 134.8, bar: 2.5,   kind: 'negative' },
  { name: 'Forecast',        bottom: 0,     bar: 125.8, kind: 'result' },
]

function bridgeFill(kind: 'neutral' | 'positive' | 'negative' | 'result', theme: Theme) {
  if (kind === 'neutral') return neutralColor(theme)
  if (kind === 'positive') return caseColor('upside', theme)
  if (kind === 'negative') return caseColor('downside', theme)
  return caseColor('base', theme)
}

const sensitivityData = [
  { driver: 'Revenue Growth', range: '-5% to +5%', low: '$18.7M', mid: '$23.6M', high: '$28.5M' },
  { driver: 'FX Rate (USD)', range: '-10% to +10%', low: '$20.1M', mid: '$23.6M', high: '$27.2M' },
  { driver: 'Salary Increase', range: '+0% to +10%', low: '$25.8M', mid: '$23.6M', high: '$21.4M' },
  { driver: 'Collection Days', range: '+10 to -10 days', low: '$21.2M', mid: '$23.6M', high: '$26.0M' },
]

const cashRunwayComparison: Array<{ id: CaseId; name: string; value: number }> = [
  { id: 'base', name: 'Base Case', value: 14.2 },
  { id: 'upside', name: 'Upside Case', value: 17.6 },
  { id: 'downside', name: 'Downside Case', value: 10.2 },
]

const notes: Array<{ id: CaseId; label: string; text: string; icon: typeof TrendingUp }> = [
  {
    id: 'upside', label: 'Upside Scenario',
    text: 'Strong revenue upside driven by new logo pipeline and pricing optimizations. Recommend investment in sales capacity to capture growth opportunity.',
    icon: TrendingUp,
  },
  {
    id: 'base', label: 'Base Case',
    text: 'Balanced plan with healthy margin and cash position. Continue operational discipline and monitor macro conditions.',
    icon: TrendingUp,
  },
  {
    id: 'downside', label: 'Downside Scenario',
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

const caseOrder: CaseId[] = ['base', 'upside', 'downside']

export default function ScenarioComparisonPage() {
  const { theme } = useForecastingTheme()
  const [selectedCase, setSelectedCase] = useState<CaseId>('base')
  const selectedScenario = scenarioCards.find((s) => s.id === selectedCase)!

  const cycleCase = () => {
    const idx = caseOrder.indexOf(selectedCase)
    setSelectedCase(caseOrder[(idx + 1) % caseOrder.length])
  }

  return (
    <DashboardShell>
      <TopBar title="Scenario Comparison" scenario="2025 Planning" version="Working" period="May 2025" entity="All Entities" />
      <div className="flex-1 overflow-y-auto p-4 bg-background">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-foreground">Scenario Comparison</h1>
            <Info size={13} className="text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="pill">
              <Copy size={11} /> Duplicate Scenario
            </Button>
            <Button variant="outline" size="pill">
              <TrendingUp size={11} /> Promote to Forecast
            </Button>
            <Button variant="outline" size="pill">
              <Download size={11} /> Export Comparison
            </Button>
            <MoreHorizontal size={16} className="text-muted-foreground cursor-pointer" />
          </div>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {scenarioCards.map((s) => {
            const color = caseColor(s.id, theme)
            const isSelected = selectedCase === s.id
            return (
              <div
                key={s.id}
                onClick={() => setSelectedCase(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCase(s.id) }}
                className="rounded-lg p-4 bg-card cursor-pointer transition-shadow"
                style={{
                  border: `1.5px solid ${isSelected ? color : `${color}33`}`,
                  boxShadow: isSelected ? `0 0 0 2px ${color}33` : 'none',
                  backgroundColor: isSelected ? caseTint(s.id, theme) : 'var(--card)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: color }}>{s.num}</span>
                  <span className="text-sm font-bold" style={{ color: isSelected ? color : 'var(--foreground)' }}>{s.label}</span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color, backgroundColor: caseTint(s.id, theme) }}>Selected</span>
                  )}
                  <div className="ml-auto"><Spark data={s.sparkData} color={color} /></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Revenue', value: s.revenue, delta: s.revDelta },
                    { label: 'EBITDA', value: s.ebitda, delta: s.ebitdaDelta },
                    { label: 'Net Margin', value: s.margin, delta: s.marginDelta },
                  ].map((kpi, ki) => (
                    <div key={ki}>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="text-sm font-bold text-foreground">{kpi.value}</p>
                      <p className="text-xs" style={{ color: kpi.delta.startsWith('-') ? caseColor('downside', theme) : caseColor('upside', theme) }}>
                        {kpi.delta.startsWith('-') ? '▼' : '▲'} {kpi.delta} vs Forecast
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="text-muted-foreground">⬡</span> <span>Closing Cash</span>
                    <span className="font-semibold text-foreground ml-1">{s.cash}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Runway</span>
                    <span className="font-semibold text-foreground ml-1">{s.runway}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={10} />
                    <span className="font-semibold text-foreground">{s.headcount}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Middle row: Comparison Table + Bridge */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Comparison Table */}
          <div className="col-span-6 rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-foreground">Scenario Comparison Table</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border" style={{ color: neutralColor(theme) }}>
                  <th className="text-left font-medium pb-2 w-4">#</th>
                  <th className="text-left font-medium pb-2">Metric</th>
                  <th className="text-right font-medium pb-2">
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: caseTint('base', theme),
                        color: caseColor('base', theme),
                        fontWeight: selectedCase === 'base' ? 700 : 500,
                        outline: selectedCase === 'base' ? `1.5px solid ${caseColor('base', theme)}` : 'none',
                      }}
                    >Base Case</span>
                  </th>
                  <th className="text-right font-medium pb-2">
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: caseTint('upside', theme),
                        color: caseColor('upside', theme),
                        fontWeight: selectedCase === 'upside' ? 700 : 500,
                        outline: selectedCase === 'upside' ? `1.5px solid ${caseColor('upside', theme)}` : 'none',
                      }}
                    >Upside Case</span>
                  </th>
                  <th className="text-right font-medium pb-2">
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: caseTint('downside', theme),
                        color: caseColor('downside', theme),
                        fontWeight: selectedCase === 'downside' ? 700 : 500,
                        outline: selectedCase === 'downside' ? `1.5px solid ${caseColor('downside', theme)}` : 'none',
                      }}
                    >Downside Case</span>
                  </th>
                  <th className="text-right font-medium pb-2 text-xs" style={{ color: caseColor('upside', theme) }}>Upside vs Base</th>
                  <th className="text-right font-medium pb-2 text-xs" style={{ color: caseColor('downside', theme) }}>Downside vs Base</th>
                </tr>
              </thead>
              <tbody>
                {compTable.map((r, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                    <td className="py-1.5 text-foreground">{r.metric}</td>
                    <td className="py-1.5 text-right font-medium text-foreground" style={{ fontWeight: selectedCase === 'base' ? 700 : 500 }}>{r.base}</td>
                    <td className="py-1.5 text-right font-medium text-foreground" style={{ fontWeight: selectedCase === 'upside' ? 700 : 500 }}>{r.upside}</td>
                    <td className="py-1.5 text-right font-medium text-foreground" style={{ fontWeight: selectedCase === 'downside' ? 700 : 500 }}>{r.downside}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: caseColor('upside', theme) }}>{r.uVb}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: caseColor('downside', theme) }}>{r.dVb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Budget to Forecast Bridge */}
          <div className="col-span-6 rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">Budget to Forecast Bridge (Revenue)</span>
                <Info size={11} className="text-muted-foreground" />
              </div>
              <Button variant="secondary" size="pill" onClick={cycleCase}>
                {selectedScenario.label} ▾
              </Button>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bridgeData} margin={{ top: 10, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[80, 150]} tickFormatter={v => `${v}M`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]?.payload as typeof bridgeData[0]
                      const fill = bridgeFill(d.kind, theme)
                      return (
                        <div className="rounded shadow-md border p-2" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', fontSize: 11 }}>
                          <p className="font-semibold text-foreground">{d.name}</p>
                          <p style={{ color: fill }}>${d.bar}M</p>
                        </div>
                      )
                    }}
                  />
                  {/* Invisible spacer bar — renders nothing, creates floating waterfall effect */}
                  <Bar dataKey="bottom" stackId="wf" maxBarSize={36} isAnimationActive={false} legendType="none" shape={<InvisibleBar />} />
                  {/* Visible colored bar on top of spacer */}
                  <Bar dataKey="bar" stackId="wf" maxBarSize={36} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {bridgeData.map((entry, i) => (
                      <Cell key={i} fill={bridgeFill(entry.kind, theme)} />
                    ))}
                  </Bar>
                  <ReferenceLine y={125.8} stroke={caseColor('base', theme)} strokeDasharray="3 3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom row: Sensitivity + Cash Runway + Notes */}
        <div className="grid grid-cols-12 gap-4">
          {/* Sensitivity */}
          <div className="col-span-4 rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-foreground">Sensitivity Analysis</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border" style={{ color: neutralColor(theme) }}>
                  <th className="text-left font-medium pb-2">Driver</th>
                  <th className="text-left font-medium pb-2">Range</th>
                  <th className="text-center font-medium pb-2" colSpan={3}>Impact on EBITDA</th>
                </tr>
                <tr style={{ color: neutralColor(theme) }}>
                  <th></th><th></th>
                  <th className="text-center pb-1 font-medium">Low</th>
                  <th className="text-center pb-1 font-medium">Mid (Base Case)</th>
                  <th className="text-center pb-1 font-medium">High</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityData.map((r, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-1.5 text-foreground">{r.driver}</td>
                    <td className="py-1.5 text-muted-foreground text-xs">{r.range}</td>
                    <td className="py-1.5 text-center font-medium" style={{ color: caseColor('downside', theme) }}>{r.low}</td>
                    <td className="py-1.5 text-center font-medium text-foreground">{r.mid}</td>
                    <td className="py-1.5 text-center font-medium" style={{ color: caseColor('upside', theme) }}>{r.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button variant="link" size="pill" className="mt-2 px-0 h-auto justify-start text-primary">View full sensitivity model</Button>
          </div>

          {/* Cash Runway Comparison */}
          <div className="col-span-4 rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-semibold text-foreground">Cash Runway Comparison</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashRunwayComparison} margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 25]} />
                  <Tooltip contentStyle={{ fontSize: 11, backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  <ReferenceLine y={12} stroke={neutralColor(theme)} strokeDasharray="3 3" label={{ value: '12 Months Target', position: 'right', fontSize: 8, fill: 'var(--muted-foreground)' }} />
                  <Bar dataKey="value" maxBarSize={48} radius={[3, 3, 0, 0]}>
                    {cashRunwayComparison.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={caseColor(entry.id, theme)}
                        fillOpacity={selectedCase === entry.id ? 1 : 0.45}
                        cursor="pointer"
                        onClick={() => setSelectedCase(entry.id)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Button variant="link" size="pill" className="mt-1 px-0 h-auto justify-start text-primary">View cash flow</Button>
          </div>

          {/* Notes & Recommendations */}
          <div className="col-span-4 rounded-lg p-4 bg-card border border-border">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xs font-semibold text-foreground">Notes &amp; Recommendations</span>
              <Info size={11} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => {
                const color = caseColor(n.id, theme)
                return (
                  <div key={i} className="flex items-start gap-2">
                    <n.icon size={13} className="shrink-0" style={{ color, marginTop: 1 }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color }}>{n.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.text}</p>
                    </div>
                  </div>
                )
              })}
              <Button variant="link" size="pill" className="px-0 h-auto justify-start text-primary self-start">Add note</Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
