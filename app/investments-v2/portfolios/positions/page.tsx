'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { cn } from '@/lib/utils'
import { Filter, Download, ChevronDown, ChevronUp } from 'lucide-react'

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
const PAGE_SIZE = 12

const portfolioLabel = (id: string) =>
  ({ 'equity-world': 'Equity World', 'multi-asset': 'Multi Asset', 'fixed-income': 'Fixed Income', 'asia-select': 'Asia Select' }[id] ?? id)

export default function PositionsPage() {
  const [activePortfolio, setActivePortfolio] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('mktValue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const filtered = positions.filter((p) => activePortfolio === 'all' || p.portfolio === activePortfolio)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'ticker') return dir * a.ticker.localeCompare(b.ticker)
      return dir * (a[sortKey] - b[sortKey])
    })
  }, [filtered, sortKey, sortDir])

  useEffect(() => {
    setPage(1)
  }, [activePortfolio])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const totalMktValue = filtered.reduce((s, p) => s + p.mktValue, 0)
  const totalUnrealPnl = filtered.reduce((s, p) => s + p.unrealPnl, 0)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-2.5 h-2.5 opacity-30" />
    return sortDir === 'desc' ? (
      <ChevronDown className="w-2.5 h-2.5" style={{ color: '#3b82f6' }} />
    ) : (
      <ChevronUp className="w-2.5 h-2.5" style={{ color: '#3b82f6' }} />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Positions" />
      <PortfoliosSubNav />

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 space-y-4">
        {/* Portfolio filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {portfolioTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePortfolio(tab.id)}
              className={cn('cat-pill', activePortfolio === tab.id && 'active')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Market Value', value: `$${(totalMktValue / 1000000).toFixed(2)}M`, color: 'var(--foreground)' },
            {
              label: 'Total Unrealised P&L',
              value: `${totalUnrealPnl >= 0 ? '+' : ''}$${(totalUnrealPnl / 1000).toFixed(0)}k`,
              color: totalUnrealPnl >= 0 ? '#10b981' : '#ef4444',
            },
            { label: 'Open Positions', value: filtered.length, color: 'var(--foreground)' },
            { label: 'Val Date', value: '07 Jul 2026', color: '#3b82f6' },
          ].map((s) => (
            <div key={s.label} className="arcus-card px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {s.label}
              </div>
              <div className="text-lg font-semibold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Filter className="w-3 h-3" /> Filter
          </button>
          <button
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Download className="w-3 h-3" /> Export
          </button>
        </div>

        {/* Positions table card */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
              Portfolio Positions
            </span>
          </div>
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
                  <th className="text-right">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => handleSort('weight')}>
                      Weight <SortIcon col="weight" />
                    </button>
                  </th>
                  <th>Open Date</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((pos) => (
                  <tr key={pos.ticker + pos.portfolio} className="cursor-pointer">
                    <td className="font-mono font-semibold" style={{ color: '#3b82f6' }}>
                      {pos.ticker}
                    </td>
                    <td style={{ color: 'var(--foreground)' }}>{pos.name}</td>
                    <td>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
                      >
                        {pos.type}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{portfolioLabel(pos.portfolio)}</td>
                    <td className="font-mono" style={{ color: 'var(--muted-foreground)' }}>
                      {pos.currency}
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                      {pos.quantity.toLocaleString()}
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--muted-foreground)' }}>
                      {pos.avgCost.toFixed(2)}
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                      {pos.mktPrice.toFixed(2)}
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                      {pos.mktValue.toLocaleString()}
                    </td>
                    <td className="text-right font-mono" style={{ color: pos.unrealPnl >= 0 ? '#10b981' : '#ef4444' }}>
                      {pos.unrealPnl >= 0 ? '+' : ''}
                      {pos.unrealPnl.toLocaleString()}
                    </td>
                    <td className="text-right font-mono" style={{ color: pos.unrealPnlPct >= 0 ? '#10b981' : '#ef4444' }}>
                      {pos.unrealPnlPct >= 0 ? '+' : ''}
                      {pos.unrealPnlPct.toFixed(2)}%
                    </td>
                    <td className="text-right font-mono" style={{ color: 'var(--foreground)' }}>
                      {pos.weight}%
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{pos.openDate}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                  <td colSpan={8} className="text-[11px] font-medium px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>
                    Total ({sorted.length} positions)
                  </td>
                  <td className="text-right font-mono font-semibold px-3 py-2" style={{ color: 'var(--foreground)' }}>
                    {totalMktValue.toLocaleString()}
                  </td>
                  <td
                    className="text-right font-mono font-semibold px-3 py-2"
                    style={{ color: totalUnrealPnl >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {totalUnrealPnl >= 0 ? '+' : ''}
                    {totalUnrealPnl.toLocaleString()}
                  </td>
                  <td colSpan={3} className="px-3 py-2" />
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                Showing {pageRows.length} out of {sorted.length} results
              </span>
              <div className="flex items-center gap-1">
                <button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={cn('pg-btn', page === p && 'active')}>
                    {p}
                  </button>
                ))}
                <button
                  className="pg-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
