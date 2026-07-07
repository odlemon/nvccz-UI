'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

// ── Module nav tabs ───────────────────────────────────────────────
const moduleTabs = [
  { label: 'Trade Blotter', href: '/orders/blotter' },
  { label: 'Orderbook',     href: '/orders/orderbook' },
  { label: 'Trading',       href: '/orders/trading' },
  { label: 'Compliance',    href: '/orders/compliance' },
  { label: 'Simulation',    href: '#' },
  { label: 'Models',        href: '#' },
  { label: 'Setup',         href: '#' },
]

// ── Orderbook sub-tabs ────────────────────────────────────────────
const obTabs = ['Orderbook', 'New', 'Pending', 'Executed']

// ── Open blotter rows ─────────────────────────────────────────────
const openBlotters = [
  { name: 'Simulation - EW_Securities', transaction: '', tradedate: '24 Apr, 20', id: 11 },
]

// ── Orderbook rows ────────────────────────────────────────────────
const orderbookRows = [
  { status: 'Confirmed', portfolio: 'Equity World', ticker: 'APPL US EQUITY', instrument: 'APPLE INC',                   qty: '5,834.0000', price: '145.6400', order: 'MKT' },
  { status: 'New',       portfolio: 'Equity World', ticker: 'AMZN US EQUITY', instrument: 'AMAZON.COM INC',              qty: '231.0000',   price: '2,677.3600', order: 'MKT' },
  { status: 'Checked',   portfolio: 'Equity World', ticker: 'ROG SW EQUITY',  instrument: 'ROCHE HOLDING AG-GENUSSCHEIN',qty: '2,190.0000', price: '356.2000',  order: 'MKT' },
  { status: 'Checked',   portfolio: 'Equity World', ticker: 'GOOGL US EQUITY',instrument: 'ALPHABET INC-CL A',          qty: '334.0000',   price: '2,546.8300', order: 'MKT' },
  { status: 'Checked',   portfolio: 'Equity World', ticker: '6436 JP EQUITY', instrument: 'AMANO CORP',                 qty: '31,909.0000',price: '2,940.0000', order: 'MKT' },
  { status: 'Checked',   portfolio: 'Equity World', ticker: '6481 JP EQUITY', instrument: 'THK CO LTD',                 qty: '26,652.0000',price: '3,520.0000', order: 'MKT' },
  { status: 'Checked',   portfolio: 'Equity World', ticker: 'CS FP EQUITY',   instrument: 'AXA SA',                    qty: '33,124.0000',price: '21.7700',    order: 'MKT' },
  { status: 'Checked',   portfolio: 'Equity World', ticker: 'CS FP EQUITY',   instrument: 'AXA SA',                    qty: '33,124.0000',price: '21.7700',    order: 'MKT' },
]

const statusColor: Record<string, string> = {
  Confirmed: '#10b981',
  New:       '#3b82f6',
  Checked:   '#64748b',
  Pending:   '#f59e0b',
  Executed:  '#10b981',
  Rejected:  '#ef4444',
}

export default function OrderbookPage() {
  const [obTab, setObTab]       = useState('Orderbook')
  const [activePage, setActivePage] = useState(2)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      {/* Module nav */}
      <div className="flex items-center gap-0 px-5 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {moduleTabs.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={cn(
              'px-4 py-3 text-[12.5px] font-medium whitespace-nowrap transition-colors',
              t.label === 'Orderbook'
                ? 'text-white border-b-2 border-[#3b82f6]'
                : 'text-[#64748b] border-b-2 border-transparent hover:text-[#94a3b8]'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Open Blotters ── */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-white text-[13px] font-semibold">Open Blotters</span>
          </div>
          <table className="arcus-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Transaction</th>
                <th>Tradedate</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {openBlotters.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: '#e2e8f0' }} className="font-medium">{row.name}</td>
                  <td style={{ color: '#64748b' }}>{row.transaction}</td>
                  <td style={{ color: '#64748b' }}>{row.tradedate}</td>
                  <td style={{ color: '#94a3b8' }} className="font-mono">{row.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Orderbook ── */}
        <div className="arcus-card">
          {/* Card header with title + sort + new blotter */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0">
            <span className="text-white text-[13px] font-semibold">Orderbook</span>
            <div className="flex items-center gap-2">
              <button className="sort-pill text-[11px]">
                Sort by: New <ChevronDown className="w-3 h-3" />
              </button>
              <button className="btn-white text-[12px] py-1 px-4">New Blotter</button>
            </div>
          </div>

          {/* Underline sub-tabs */}
          <div className="flex items-center gap-0 px-4 mt-2 pill-tabs" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {obTabs.map(t => (
              <button
                key={t}
                onClick={() => setObTab(t)}
                className={cn('pill-tab', obTab === t && 'active')}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Instrument</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Price</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {orderbookRows.map((row, i) => (
                  <tr key={i} className="cursor-pointer">
                    <td>
                      <span className="text-[12px] font-medium" style={{ color: statusColor[row.status] ?? '#94a3b8' }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{row.portfolio}</td>
                    <td style={{ color: '#e2e8f0' }} className="font-mono font-medium">{row.ticker}</td>
                    <td style={{ color: '#94a3b8' }}>{row.instrument}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{row.qty}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{row.price}</td>
                    <td style={{ color: '#64748b' }}>{row.order}</td>
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
