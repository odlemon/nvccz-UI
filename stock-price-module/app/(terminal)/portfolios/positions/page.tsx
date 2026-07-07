'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { cn } from '@/lib/utils'
import { Filter, Download, ChevronDown, ChevronUp } from 'lucide-react'

const instrumentTabs = ['Overview', 'Instruments', 'Prices', 'Positions', 'Transactions']

const portfolioTabs = [
  { id: 'all', label: 'All Portfolios' },
  { id: 'equity-world', label: 'Equity World' },
  { id: 'multi-asset', label: 'Multi Asset' },
  { id: 'fixed-income', label: 'Fixed Income' },
  { id: 'asia-select', label: 'Asia Select' },
]

const positions = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', type: 'EQ', portfolio: 'equity-world', currency: 'USD', quantity: 2500, avgCost: 112.40, mktPrice: 127.42, mktValue: 318550, bookCost: 281000, unrealPnl: 37550, unrealPnlPct: 13.36, realPnl: 0, totalPnl: 37550, weight: 8.2, country: 'US', sector: 'Technology', openDate: '14 Jan 2026' },
  { ticker: 'MSFT', name: 'Microsoft Corp', type: 'EQ', portfolio: 'equity-world', currency: 'USD', quantity: 1200, avgCost: 398.20, mktPrice: 432.18, mktValue: 518616, bookCost: 477840, unrealPnl: 40776, unrealPnlPct: 8.53, realPnl: 12400, totalPnl: 53176, weight: 7.1, country: 'US', sector: 'Technology', openDate: '06 Feb 2026' },
  { ticker: 'AAPL', name: 'Apple Inc', type: 'EQ', portfolio: 'equity-world', currency: 'USD', quantity: 1800, avgCost: 185.50, mktPrice: 196.42, mktValue: 353556, bookCost: 333900, unrealPnl: 19656, unrealPnlPct: 5.89, realPnl: 0, totalPnl: 19656, weight: 6.2, country: 'US', sector: 'Technology', openDate: '14 Jan 2026' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', type: 'EQ', portfolio: 'equity-world', currency: 'USD', quantity: 600, avgCost: 182.40, mktPrice: 174.29, mktValue: 104574, bookCost: 109440, unrealPnl: -4866, unrealPnlPct: -4.45, realPnl: 0, totalPnl: -4866, weight: 3.8, country: 'US', sector: 'Technology', openDate: '22 Mar 2026' },
  { ticker: 'META', name: 'Meta Platforms', type: 'EQ', portfolio: 'equity-world', currency: 'USD', quantity: 420, avgCost: 498.40, mktPrice: 562.38, mktValue: 236199, bookCost: 209328, unrealPnl: 26871, unrealPnlPct: 12.84, realPnl: 0, totalPnl: 26871, weight: 3.6, country: 'US', sector: 'Technology', openDate: '10 Mar 2026' },
  { ticker: 'BHP', name: 'BHP Group', type: 'EQ', portfolio: 'equity-world', currency: 'AUD', quantity: 4200, avgCost: 46.80, mktPrice: 44.28, mktValue: 185976, bookCost: 196560, unrealPnl: -10584, unrealPnlPct: -5.38, realPnl: 0, totalPnl: -10584, weight: 3.1, country: 'AU', sector: 'Materials', openDate: '18 Feb 2026' },
  { ticker: 'AMZN', name: 'Amazon.com', type: 'EQ', portfolio: 'multi-asset', currency: 'USD', quantity: 800, avgCost: 178.20, mktPrice: 192.80, mktValue: 154240, bookCost: 142560, unrealPnl: 11680, unrealPnlPct: 8.19, realPnl: 0, totalPnl: 11680, weight: 4.2, country: 'US', sector: 'Consumer Disc.', openDate: '14 Jan 2026' },
  { ticker: 'GOLD', name: 'iShares Gold ETF', type: 'ETF', portfolio: 'multi-asset', currency: 'USD', quantity: 500, avgCost: 178.40, mktPrice: 186.40, mktValue: 93200, bookCost: 89200, unrealPnl: 4000, unrealPnlPct: 4.48, realPnl: 0, totalPnl: 4000, weight: 2.8, country: 'IE', sector: 'Commodities', openDate: '04 Jul 2026' },
  { ticker: 'TSM', name: 'TSMC ADR', type: 'EQ', portfolio: 'asia-select', currency: 'USD', quantity: 300, avgCost: 166.20, mktPrice: 182.50, mktValue: 54750, bookCost: 49860, unrealPnl: 4890, unrealPnlPct: 9.81, realPnl: 0, totalPnl: 4890, weight: 5.2, country: 'TW', sector: 'Technology', openDate: '05 Jul 2026' },
  { ticker: 'UST10Y', name: 'US Treasury 10Y 4.5%', type: 'BD', portfolio: 'fixed-income', currency: 'USD', quantity: 100, avgCost: 97.80, mktPrice: 98.42, mktValue: 9842000, bookCost: 9780000, unrealPnl: 62000, unrealPnlPct: 0.63, realPnl: 0, totalPnl: 62000, weight: 42.0, country: 'US', sector: 'Government', openDate: '05 Jul 2026' },
]

type SortKey = 'ticker' | 'mktValue' | 'unrealPnl' | 'unrealPnlPct' | 'weight'

export default function PositionsPage() {
  const [activePortfolio, setActivePortfolio] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('mktValue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = positions.filter(p => activePortfolio === 'all' || p.portfolio === activePortfolio)
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'ticker') return dir * a.ticker.localeCompare(b.ticker)
    return dir * (a[sortKey] - b[sortKey])
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const totalMktValue = filtered.reduce((s, p) => s + p.mktValue, 0)
  const totalUnrealPnl = filtered.reduce((s, p) => s + p.unrealPnl, 0)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-2.5 h-2.5 opacity-30" />
    return sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5 text-[#60A5FA]" /> : <ChevronUp className="w-2.5 h-2.5 text-[#60A5FA]" />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Portfolio Management" subtitle="Positions" showPeriod={false} />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto">
        {instrumentTabs.map(t => (
          <a key={t}
            href={t === 'Overview' ? '/portfolios' : t === 'Instruments' ? '/portfolios/instruments' : t === 'Prices' ? '/portfolios/prices' : t === 'Transactions' ? '/portfolios/transactions' : '#'}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              t === 'Positions' ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </a>
        ))}
      </div>

      {/* Portfolio filter tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] bg-[#070B14] flex-shrink-0 overflow-x-auto">
        {portfolioTabs.map(tab => (
          <button key={tab.id} onClick={() => setActivePortfolio(tab.id)}
            className={cn('px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
              activePortfolio === tab.id ? 'bg-[#1E3A5F] text-[#60A5FA]' : 'text-[#6B7A95] hover:bg-[#111C30] hover:text-[#A8B4C8]')}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-px bg-white/[0.03] rounded-md overflow-hidden">
          {[
            { label: 'Total Market Value', value: `$${(totalMktValue / 1000000).toFixed(2)}M`, sub: 'USD' },
            { label: 'Total Unrealised P&L', value: `${totalUnrealPnl >= 0 ? '+' : ''}$${(totalUnrealPnl / 1000).toFixed(0)}k`, green: totalUnrealPnl >= 0 },
            { label: 'Open Positions', value: filtered.length, sub: 'instruments' },
            { label: 'Val Date', value: '07 Jul 2026', sub: 'Last recalc: 10:15' },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1526] px-4 py-2.5">
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className={cn('text-sm font-semibold font-mono', 'green' in s ? (s.green ? 'text-[#10B981]' : 'text-[#EF4444]') : 'text-[#E8EDF5]')}>{s.value}</div>
              {'sub' in s && s.sub && <div className="text-[10px] text-[#4B5A72]">{s.sub}</div>}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
            <Filter className="w-3 h-3" /> Filter
          </button>
          <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
            <Download className="w-3 h-3" /> Export
          </button>
        </div>

        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>
                    <button className="flex items-center gap-1" onClick={() => handleSort('ticker')}>
                      Ticker <SortIcon col="ticker" />
                    </button>
                  </th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Portfolio</th>
                  <th>CCY</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Avg Cost</th>
                  <th className="text-right">Mkt Price</th>
                  <th className="text-right">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('mktValue')}>
                      Mkt Value <SortIcon col="mktValue" />
                    </button>
                  </th>
                  <th className="text-right">Book Cost</th>
                  <th className="text-right">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('unrealPnl')}>
                      Unrealised P&L <SortIcon col="unrealPnl" />
                    </button>
                  </th>
                  <th className="text-right">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('unrealPnlPct')}>
                      P&L % <SortIcon col="unrealPnlPct" />
                    </button>
                  </th>
                  <th className="text-right">Realised P&L</th>
                  <th className="text-right">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('weight')}>
                      Weight <SortIcon col="weight" />
                    </button>
                  </th>
                  <th>Open Date</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(pos => (
                  <tr key={pos.ticker + pos.portfolio} className="cursor-pointer">
                    <td className="text-[#60A5FA] font-mono font-semibold">{pos.ticker}</td>
                    <td className="text-[#A8B4C8]">{pos.name}</td>
                    <td>
                      <span className="bg-[#1E3A5F] text-[#60A5FA] text-[10px] font-bold px-2 py-0.5 rounded font-mono">{pos.type}</span>
                    </td>
                    <td className="text-[#6B7A95] capitalize">{pos.portfolio.replace('-', ' ').replace('equity world', 'Equity World').replace('multi asset', 'Multi Asset').replace('fixed income', 'Fixed Income').replace('asia select', 'Asia Select')}</td>
                    <td className="text-[#A8B4C8] font-mono">{pos.currency}</td>
                    <td className="text-right font-mono">{pos.quantity.toLocaleString()}</td>
                    <td className="text-right font-mono text-[#6B7A95]">{pos.avgCost.toFixed(2)}</td>
                    <td className="text-right font-mono">{pos.mktPrice.toFixed(2)}</td>
                    <td className="text-right font-mono">{pos.mktValue.toLocaleString()}</td>
                    <td className="text-right font-mono text-[#6B7A95]">{pos.bookCost.toLocaleString()}</td>
                    <td className={cn('text-right font-mono', pos.unrealPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                      {pos.unrealPnl >= 0 ? '+' : ''}{pos.unrealPnl.toLocaleString()}
                    </td>
                    <td className={cn('text-right font-mono', pos.unrealPnlPct >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                      {pos.unrealPnlPct >= 0 ? '+' : ''}{pos.unrealPnlPct.toFixed(2)}%
                    </td>
                    <td className={cn('text-right font-mono', pos.realPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                      {pos.realPnl === 0 ? '—' : (pos.realPnl >= 0 ? '+' : '') + pos.realPnl.toLocaleString()}
                    </td>
                    <td className="text-right font-mono">{pos.weight}%</td>
                    <td className="text-[#6B7A95]">{pos.openDate}</td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-[#111C30] border-t border-white/[0.06]">
                  <td colSpan={8} className="text-[11px] text-[#6B7A95] font-medium px-3 py-2">Total ({sorted.length} positions)</td>
                  <td className="text-right font-mono font-semibold text-[#E8EDF5] px-3 py-2">{totalMktValue.toLocaleString()}</td>
                  <td className="px-3 py-2"></td>
                  <td className={cn('text-right font-mono font-semibold px-3 py-2', totalUnrealPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                    {totalUnrealPnl >= 0 ? '+' : ''}{totalUnrealPnl.toLocaleString()}
                  </td>
                  <td colSpan={4} className="px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
