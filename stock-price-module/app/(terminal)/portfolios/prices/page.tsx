'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Upload, RefreshCw, AlertTriangle, CheckCircle2, Search, Download } from 'lucide-react'

const instrumentTabs = ['Overview', 'Instruments', 'Prices', 'Positions', 'Transactions']

const priceData = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', source: 'Bloomberg', currency: 'USD', prevClose: 125.10, currentPrice: 127.42, change: 2.32, changePct: 1.85, bid: 127.40, ask: 127.44, volume: 42812000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'MSFT', name: 'Microsoft Corp', source: 'Bloomberg', currency: 'USD', prevClose: 429.82, currentPrice: 432.18, change: 2.36, changePct: 0.55, bid: 432.15, ask: 432.20, volume: 18240000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'AAPL', name: 'Apple Inc', source: 'Bloomberg', currency: 'USD', prevClose: 194.20, currentPrice: 196.42, change: 2.22, changePct: 1.14, bid: 196.40, ask: 196.45, volume: 54810000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', source: 'Bloomberg', currency: 'USD', prevClose: 176.10, currentPrice: 174.29, change: -1.81, changePct: -1.03, bid: 174.28, ask: 174.31, volume: 21420000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'BHP', name: 'BHP Group', source: 'Bloomberg', currency: 'AUD', prevClose: 44.80, currentPrice: 44.28, change: -0.52, changePct: -1.16, bid: 44.27, ask: 44.29, volume: 8420000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'TSM', name: 'TSMC ADR', source: 'Bloomberg', currency: 'USD', prevClose: 180.20, currentPrice: 182.50, change: 2.30, changePct: 1.28, bid: 182.48, ask: 182.52, volume: 12820000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'META', name: 'Meta Platforms', source: 'Bloomberg', currency: 'USD', prevClose: 558.40, currentPrice: 562.38, change: 3.98, changePct: 0.71, bid: 562.35, ask: 562.42, volume: 9240000, timestamp: '07 Jul 16:00', status: 'active' },
  { ticker: 'BABA', name: 'Alibaba Group', source: 'Bloomberg', currency: 'USD', prevClose: 84.20, currentPrice: 82.14, change: -2.06, changePct: -2.45, bid: 82.10, ask: 82.18, volume: 0, timestamp: '04 Jul 16:00', status: 'stale' },
  { ticker: 'CBZH', name: 'CBZ Holdings', source: 'ZSE', currency: 'ZiG', prevClose: 1.80, currentPrice: 1.84, change: 0.04, changePct: 2.22, bid: 1.82, ask: 1.86, volume: 1284200, timestamp: '07 Jul 15:30', status: 'active' },
  { ticker: 'ECONET', name: 'Econet Wireless', source: 'VFEX', currency: 'USD', prevClose: 0.40, currentPrice: 0.42, change: 0.02, changePct: 5.00, bid: 0.41, ask: 0.43, volume: 421800, timestamp: '07 Jul 15:30', status: 'active' },
  { ticker: 'UST10Y', name: 'US Treasury 10Y', source: 'Bloomberg', currency: 'USD', prevClose: 98.18, currentPrice: 98.42, change: 0.24, changePct: 0.24, bid: 98.41, ask: 98.43, volume: 0, timestamp: '07 Jul 17:00', status: 'active' },
  { ticker: 'GOLD', name: 'iShares Gold ETF', source: 'Bloomberg', currency: 'USD', prevClose: 184.20, currentPrice: 186.40, change: 2.20, changePct: 1.19, bid: 186.38, ask: 186.42, volume: 2840000, timestamp: '07 Jul 16:00', status: 'active' },
]

const sources = ['All', 'Bloomberg', 'ZSE', 'VFEX', 'Manual']

export default function PricesPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = priceData.filter(p => {
    const matchSource = sourceFilter === 'All' || p.source === sourceFilter
    const matchSearch = !search || p.ticker.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())
    return matchSource && matchSearch
  })

  const staleCount = priceData.filter(p => p.status === 'stale').length

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Portfolio Management" subtitle="Prices" showPeriod={false} />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto">
        {instrumentTabs.map(t => (
          <a key={t}
            href={t === 'Overview' ? '/portfolios' : t === 'Instruments' ? '/portfolios/instruments' : t === 'Positions' ? '/portfolios/positions' : t === 'Transactions' ? '/portfolios/transactions' : '#'}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              t === 'Prices' ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Status strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Instruments Priced', value: priceData.length, color: 'text-[#E8EDF5]' },
            { label: 'Live / Updated Today', value: priceData.filter(p => p.status === 'active').length, color: 'text-[#10B981]' },
            { label: 'Stale Prices', value: staleCount, color: staleCount > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]' },
            { label: 'Last Batch Pull', value: '10:14:58', color: 'text-[#60A5FA]' },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1526] border border-white/[0.06] rounded-md px-4 py-2.5">
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className={cn('text-lg font-semibold font-mono', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {staleCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <span className="text-xs text-[#F59E0B]">
              <span className="font-semibold">{staleCount} stale price{staleCount > 1 ? 's' : ''}</span> detected — prices may be outdated by more than 2 business days. Manual override or re-fetch required.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {sources.map(s => (
              <button key={s} onClick={() => setSourceFilter(s)}
                className={cn('px-3 py-1 rounded text-xs font-medium transition-colors',
                  sourceFilter === s ? 'bg-[#1E3A5F] text-[#60A5FA]' : 'text-[#6B7A95] hover:bg-[#111C30] hover:text-[#A8B4C8]')}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#111C30] border border-white/[0.06] rounded px-2.5 py-1.5">
              <Search className="w-3 h-3 text-[#4B5A72]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-[#A8B4C8] text-xs outline-none w-32 placeholder:text-[#4B5A72]" />
            </div>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Upload className="w-3 h-3" /> Upload CSV
            </button>
            <button onClick={handleRefresh} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
              {refreshing ? 'Fetching...' : 'Refresh Prices'}
            </button>
          </div>
        </div>

        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>CCY</th>
                  <th className="text-right">Prev Close</th>
                  <th className="text-right">Current Price</th>
                  <th className="text-right">Change</th>
                  <th className="text-right">Change %</th>
                  <th className="text-right">Bid</th>
                  <th className="text-right">Ask</th>
                  <th className="text-right">Volume</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.ticker} className={cn('cursor-pointer', p.status === 'stale' && 'bg-amber-500/[0.03]')}>
                    <td className="text-[#60A5FA] font-mono font-semibold">{p.ticker}</td>
                    <td className="text-[#A8B4C8]">{p.name}</td>
                    <td className="text-[#6B7A95]">{p.source}</td>
                    <td className="text-[#A8B4C8] font-mono">{p.currency}</td>
                    <td className="text-right font-mono text-[#6B7A95]">{p.prevClose.toFixed(2)}</td>
                    <td className="text-right font-mono font-semibold text-[#E8EDF5]">{p.currentPrice.toFixed(2)}</td>
                    <td className={cn('text-right font-mono', p.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                      {p.change >= 0 ? '+' : ''}{p.change.toFixed(2)}
                    </td>
                    <td className={cn('text-right font-mono', p.changePct >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                      {p.changePct >= 0 ? '+' : ''}{p.changePct.toFixed(2)}%
                    </td>
                    <td className="text-right font-mono text-[#6B7A95]">{p.bid.toFixed(2)}</td>
                    <td className="text-right font-mono text-[#6B7A95]">{p.ask.toFixed(2)}</td>
                    <td className="text-right font-mono text-[#6B7A95]">
                      {p.volume > 0 ? (p.volume / 1000000).toFixed(2) + 'M' : '—'}
                    </td>
                    <td className={cn('font-mono text-xs', p.status === 'stale' ? 'text-[#F59E0B]' : 'text-[#6B7A95]')}>{p.timestamp}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      {p.status === 'stale' && (
                        <button className="text-[10px] text-[#F59E0B] hover:underline">Override</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
