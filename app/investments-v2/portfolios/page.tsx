'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie
} from 'recharts'
import { Folder, FolderOpen, Plus, RefreshCw, ChevronDown } from 'lucide-react'

// ── Portfolio folder tabs ─────────────────────────────────────────
const portfolioTabs = [
  { id: 'equity-world',   label: 'Equity World' },
  { id: 'new-portfolio',  label: 'New Portfolio' },
  { id: 'multi-asset',    label: 'Multi Asset' },
  { id: 'fixed-income',   label: 'Fixed Income' },
  { id: 'asia-select',    label: 'Asia Select' },
]

// ── Composition table rows ────────────────────────────────────────
const compositionRows = [
  { included: 'Securities', total: 9346467.46, pct: '81.46%', interest: 0.00, dividend: 0.00, positions: 11, exposure: 9346467.46, margin: 0.00, valDate: '24 Apr, 20', dot: '#f59e0b', highlight: true },
  { included: 'Cash',       total: 2150000.00, pct: '17.78%', interest: 0.00, dividend: 0.00, positions: 11, exposure: 0.00,        margin: 0.00, valDate: '24 Apr, 20', dot: '#f59e0b' },
  { included: 'Archive',    total: 0.00,       pct: '0.00%',  interest: 0.00, dividend: 0.00, positions: 1,  exposure: 0.00,        margin: 0.00, valDate: '24 Apr, 20', dot: '#f59e0b' },
]

// ── Orders table rows ─────────────────────────────────────────────
const ordersRows = [
  { transaction: 'USD Cash',        type: 'C', ref: 'USD Currency',   qty: 2100100,   cost: -2100100,   price: 1.0000, value: 245893449, nav: 2100100,  dot: '#f59e0b' },
  { transaction: 'Alphabet INC-CL A', type: 'A', ref: 'Google US Equity', qty: 393,   cost: -1000904,   price: 2441.7900, value: 959623,  nav: 959623,  dot: '#3b82f6' },
  { transaction: 'Amazon.com INC',  type: 'A', ref: 'Amazon US Equity',  qty: 272,   cost: -1000242,   price: 3440.1599, value: 935723,  nav: 935723,  dot: '#3b82f6' },
  { transaction: 'Apple INC',       type: 'A', ref: 'Apple US Equity',   qty: 6866,  cost: -999964,    price: 136.9600,  value: 940367,  nav: 940367,  dot: '#3b82f6' },
  { transaction: 'AXA SA',          type: 'A', ref: 'CS FP Equity',      qty: 38556, cost: -1000004,   price: 21.3850,   value: 833694,  nav: 833694,  dot: '#f59e0b' },
]

// ── Country rings chart ────────────────────────────────────────────
const countryRings = [
  { r: 68, pct: 52, color: '#3b82f6',  label: 'US' },
  { r: 53, pct: 17, color: '#6366f1',  label: 'UK' },
  { r: 38, pct: 9,  color: '#8b5cf6',  label: 'FR' },
  { r: 23, pct: 12, color: '#0ea5e9',  label: 'GB' },
]

function CountryRings() {
  const cx = 70, cy = 70
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {countryRings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r
        const dash = (ring.pct / 100) * circ
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
            <circle cx={cx} cy={cy} r={ring.r} fill="none" stroke={ring.color} strokeWidth={9}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Sector bar chart ──────────────────────────────────────────────
const sectorBars = [
  { name: 'Cry', value: 55 },
  { name: 'Ind', value: 38 },
  { name: 'Cmm', value: 42 },
  { name: 'Min', value: 28 },
  { name: 'Tch', value: 87, highlight: true },
  { name: 'Cns', value: 35 },
  { name: 'Mtr', value: 20 },
  { name: 'Fin', value: 48 },
]

// ── Currency pie ─────────────────────────────────────────────────
const currencyPie = [
  { name: 'EUR', value: 52, color: '#3b82f6' },
  { name: 'JYP', value: 17, color: '#8b5cf6' },
  { name: 'CHF', value: 9,  color: '#6366f1' },
  { name: 'USD', value: 12, color: '#0ea5e9' },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function PortfoliosPage() {
  const [activeTab, setActiveTab] = useState('equity-world')
  const [activePage, setActivePage] = useState(2)

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Portfolios" />

      {/* ── Portfolio folder tabs ── */}
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-4 flex-shrink-0 overflow-x-auto">
        {portfolioTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn('folder-tab', activeTab === tab.id && 'active')}
          >
            {activeTab === tab.id
              ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
              : <Folder className="w-3.5 h-3.5 flex-shrink-0" />}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">

        {/* ── Equity World composition card ── */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" style={{ color: '#64748b' }} />
              <span className="text-white text-[13px] font-semibold">Equity World</span>
              <span className="text-[11px] ml-2" style={{ color: '#64748b' }}>
                NAV <span className="font-mono" style={{ color: '#3b82f6' }}>166,238,953.30 USD</span>
              </span>
              <span className="text-[11px]" style={{ color: '#64748b' }}>
                PnL <span className="font-mono" style={{ color: '#94a3b8' }}>332,344 USD</span>
              </span>
            </div>
            <button className="btn-white text-[12px] py-1 px-4">Recalculate</button>
          </div>

          {/* Composition table */}
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Included</th>
                  <th>Total</th>
                  <th>In%</th>
                  <th>Interest</th>
                  <th>Dividend</th>
                  <th>Positions</th>
                  <th>Exposure</th>
                  <th>Margin</th>
                  <th>Valuedate</th>
                </tr>
              </thead>
              <tbody>
                {compositionRows.map((row) => (
                  <tr key={row.included} style={row.highlight ? { background: 'rgba(139,92,246,0.18)' } : {}}>
                    <td style={{ color: '#e2e8f0' }}>{row.included}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: '#e2e8f0' }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                        {fmt(row.total)}
                      </span>
                    </td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{row.pct}</td>
                    <td className="font-mono" style={{ color: '#64748b' }}>{fmt(row.interest)}</td>
                    <td className="font-mono" style={{ color: '#64748b' }}>{fmt(row.dividend)}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 600 }}>{row.positions}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{fmt(row.exposure)}</td>
                    <td className="font-mono" style={{ color: '#64748b' }}>{fmt(row.margin)}</td>
                    <td style={{ color: '#64748b' }}>{row.valDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 3 inline charts ── */}
          <div className="grid grid-cols-3 gap-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Country rings */}
            <div className="flex gap-4 p-4 items-center" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <CountryRings />
              <div className="space-y-1.5">
                {[['US','52%','#3b82f6'],['UK','17%','#6366f1'],['FR','9%','#8b5cf6'],['GB','12%','#0ea5e9'],['CH','17%','#60a5fa'],['CA','9%','#93c5fd']].map(([l,p,c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c as string }} />
                    <span className="text-[11px]" style={{ color: '#94a3b8' }}>{l}({p})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector bars */}
            <div className="p-4 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={sectorBars} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="20%">
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11 }}
                      cursor={false}
                    />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]} maxBarSize={24}>
                      {sectorBars.map((e, i) => (
                        <Cell key={i} fill={e.highlight ? '#3b82f6' : '#1e2d45'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#1e2330', color: '#e2e8f0' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />87%
                </span>
              </div>
            </div>

            {/* Currency pie */}
            <div className="p-4 flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={currencyPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {currencyPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {currencyPie.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-[11px]" style={{ color: '#94a3b8' }}>{c.name}({c.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Orders section ── */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-white text-[13px] font-semibold">Orders(30)</span>
            <button className="btn-white text-[12px] py-1 px-4">New Position</button>
          </div>
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Transactions</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Cost</th>
                  <th className="text-right">Price</th>
                  <th>Value</th>
                  <th className="text-right">FXRate</th>
                  <th className="text-right">NAV</th>
                </tr>
              </thead>
              <tbody>
                {ordersRows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: '#e2e8f0' }} className="font-medium">{row.transaction}</td>
                    <td style={{ color: '#94a3b8' }}>{row.type}</td>
                    <td style={{ color: '#64748b' }}>{row.ref}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{row.qty.toLocaleString()}</td>
                    <td className="text-right font-mono" style={{ color: '#ef4444' }}>{row.cost.toLocaleString()}</td>
                    <td className="text-right font-mono" style={{ color: '#94a3b8' }}>{row.price.toFixed(4)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12px]" style={{ color: '#e2e8f0' }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                        {row.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="text-right font-mono" style={{ color: '#64748b' }}>1.0000</td>
                    <td className="text-right font-mono" style={{ color: '#94a3b8' }}>{row.nav.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[11px]" style={{ color: '#64748b' }}>Showing 12 out of 48 results</span>
            <div className="flex items-center gap-1">
              <button className="pg-btn" onClick={() => setActivePage(Math.max(1, activePage - 1))}>‹</button>
              {[1,2,3,4].map(p => (
                <button key={p} onClick={() => setActivePage(p)} className={cn('pg-btn', activePage === p && 'active')}>{p}</button>
              ))}
              <button className="pg-btn" onClick={() => setActivePage(Math.min(4, activePage + 1))}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
