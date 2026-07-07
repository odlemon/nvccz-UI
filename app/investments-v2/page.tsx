'use client'

import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Lock, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'

// ── Data ─────────────────────────────────────────────────────────
const portfolioRows = [
  { name: 'Crypto Portfolio',    nav: 245893449, pnl: 245893449, pnlPct: 63.50, asof: '14 Apr, 20', dot: '#f59e0b' },
  { name: 'Equity World',        nav: 245893449, pnl: 245893449, pnlPct: 63.50, asof: '20 Apr, 20', dot: '#3b82f6' },
  { name: 'Multi Asset',         nav: 245893449, pnl: 245893449, pnlPct: 63.50, asof: '20 Apr, 20', dot: '#3b82f6' },
  { name: 'Fixed Income',        nav: 245893449, pnl: 245893449, pnlPct: 63.50, asof: '21 Apr, 20', dot: '#f59e0b' },
  { name: 'Liquid Asset',        nav: 245893449, pnl: 245893449, pnlPct: 63.50, asof: '24 Apr, 20', dot: '#10b981' },
]

const fundsRows = [
  { name: 'Crypto Fund',         nav: 267980373, valueDate: '2 Jan, 20',   share: 102.4, dot: '#f59e0b' },
  { name: 'Equity World Fund',   nav: 12369689,  valueDate: '26 Apr, 22',  share: 209.6, dot: '#3b82f6' },
  { name: 'Multi Asset SICAV',   nav: 17000000,  valueDate: '14 Jan, 20',  share: 231.2, dot: '#3b82f6' },
  { name: 'Fixed Income UCITS',  nav: 269893564, valueDate: '12 Oct, 22',  share: 100.4, dot: '#10b981' },
  { name: 'Liquid Asset US',     nav: 78835679,  valueDate: '21 Apr, 21',  share: 176.4, dot: '#f59e0b' },
]

const currencyBars = [
  { name: 'USD',   value: 42, highlight: false },
  { name: 'JYP',   value: 58, highlight: false },
  { name: 'GBP',   value: 68, highlight: false },
  { name: 'Euro',  value: 87, highlight: true  },
  { name: 'Others',value: 38, highlight: false },
]

// Concentric ring data for Asset Allocation
const ringData = [
  { label: 'Bond',   pct: 39, color: '#8b5cf6', r: 62 },
  { label: 'Crypto', pct: 29, color: '#3b82f6', r: 48 },
  { label: 'Equity', pct: 16, color: '#6366f1', r: 34 },
  { label: 'Cash',   pct: 14, color: '#1e1b4b', r: 20 },
  { label: 'Others', pct: 2,  color: '#312e81', r: 8  },
]

// SVG concentric arcs — drawn as stroked circles with dasharray
function ConcentricRings() {
  const cx = 80, cy = 80
  const rings = [
    { r: 68, pct: 39, color: '#8b5cf6', width: 10 },
    { r: 53, pct: 29, color: '#3b82f6', width: 10 },
    { r: 38, pct: 16, color: '#6366f1', width: 10 },
    { r: 23, pct: 14, color: '#4338ca', width: 10 },
  ]
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const dash = (ring.pct / 100) * circ
        return (
          <g key={i}>
            {/* Track */}
            <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={ring.width} />
            {/* Filled arc — start from top (-90deg = rotate -90) */}
            <circle
              cx={cx} cy={cy} r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.width}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        )
      })}
    </svg>
  )
}

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-white font-semibold">{payload[0].value}%</div>
        <div style={{ color: '#64748b' }}>{label}</div>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('Monthly')

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* ── Row 1: Portfolios table + Asset Allocation ── */}
        <div className="grid grid-cols-[1fr_280px] gap-4">

          {/* Portfolios card */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">portfolios</span>
              <div className="flex items-center gap-2">
                <button className="sort-pill text-[11px]">
                  Monthly <ChevronDown className="w-3 h-3" />
                </button>
                <button className="btn-white text-[12px] py-1 px-4">Recalculate</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>portfolios</th>
                    <th>NAV</th>
                    <th>As of</th>
                    <th>PnL</th>
                    <th>In%</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioRows.map((row) => (
                    <tr key={row.name}>
                      <td className="font-medium" style={{ color: '#e2e8f0' }}>{row.name}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: '#e2e8f0' }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                          {fmt(row.nav)}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{row.asof}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: '#e2e8f0' }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                          {fmt(row.pnl)}
                        </span>
                      </td>
                      <td className="font-mono" style={{ color: '#94a3b8' }}>{row.pnlPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Asset Allocation card — purple */}
          <div className="rounded-2xl p-4 flex flex-col" style={{ background: 'linear-gradient(145deg, #2d1f6e 0%, #3730a3 50%, #1e1b4b 100%)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-[13px] font-semibold">Asset Allocation</span>
              <button className="flex items-center gap-1 text-[11px] px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: '#c4b5fd' }}>
                Monthly <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center justify-center my-2">
              <ConcentricRings />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {ringData.map(r => (
                <div key={r.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span className="text-[11px]" style={{ color: '#c4b5fd' }}>{r.label}({r.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Currency Exposer + Funds ── */}
        <div className="grid grid-cols-[1fr_1fr] gap-4">

          {/* Currency Exposer */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Currency Exposer</span>
              <button className="sort-pill text-[11px]">
                Monthly <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={currencyBars} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="25%">
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CurrencyTooltip />} cursor={false} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={42}>
                    {currencyBars.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.highlight ? '#3b82f6' : '#1e2d45'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* 87% label */}
              <div className="flex justify-center mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#1e2330', color: '#e2e8f0' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
                  87%
                </span>
              </div>
            </div>
          </div>

          {/* Funds */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Funds</span>
              <div className="flex items-center gap-2">
                <button className="sort-pill text-[11px]">
                  Monthly <ChevronDown className="w-3 h-3" />
                </button>
                <button className="btn-white text-[12px] py-1 px-4">New Valuation</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Fund Name</th>
                    <th>NAV</th>
                    <th>Value Date</th>
                    <th>Share</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fundsRows.map((fund) => (
                    <tr key={fund.name}>
                      <td style={{ color: '#e2e8f0' }} className="font-medium">{fund.name}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: '#e2e8f0' }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: fund.dot }} />
                          {fmt(fund.nav)}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{fund.valueDate}</td>
                      <td className="font-mono" style={{ color: '#94a3b8' }}>{fund.share}</td>
                      <td>
                        <button className="w-6 h-6 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity">
                          <Lock className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
