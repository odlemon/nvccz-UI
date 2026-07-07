'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { cn } from '@/lib/utils'
import { ChevronDown, Calendar, MoreHorizontal, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const moduleTabs = [
  { label: 'Trade Blotter', href: '/orders/blotter' },
  { label: 'Orderbook',     href: '/orders/orderbook' },
  { label: 'Trading',       href: '/orders/trading' },
  { label: 'Compliance',    href: '/orders/compliance' },
  { label: 'Simulation',    href: '#' },
  { label: 'Models',        href: '#' },
  { label: 'Setup',         href: '#' },
]

const positions = [
  { portfolio: 'Multi Asset',    ref: 'CADCAD CURUNCY', shortName: 'CADCAD CURUNCY', qty: '2,000,000',   open: 0, price: '1.0', tr: '0.00' },
  { portfolio: 'Fixed Income',   ref: 'EUR CASH',       shortName: 'EUR CASH',       qty: '10,000,000',  open: 0, price: '1.0', tr: '0.00' },
  { portfolio: 'Multi Asset',    ref: 'GBP CASH',       shortName: 'GBP CASH',       qty: '1,800,000',   open: 0, price: '1.0', tr: '0.00' },
  { portfolio: 'Asia Select',    ref: 'JPY CASH',       shortName: 'JPY CASH',       qty: '200,000,000', open: 0, price: '1.0', tr: '0.00' },
  { portfolio: 'Multi Asset',    ref: 'JPY CASH',       shortName: 'JPY CASH',       qty: '200,000,000', open: 0, price: '1.0', tr: '0.00' },
  { portfolio: 'Equity World',   ref: 'USD CASH',       shortName: 'USD CASH',       qty: '5,400,000',   open: 0, price: '1.0', tr: '0.00' },
  { portfolio: 'Fixed Income',   ref: 'USD CASH',       shortName: 'USD CASH',       qty: '8,200,000',   open: 0, price: '1.0', tr: '0.00' },
]

function DropdownField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px]" style={{ color: '#64748b' }}>{label}</label>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[12.5px]" style={{ color: '#94a3b8' }}>{value}</span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#64748b' }} />
      </div>
    </div>
  )
}

export default function TradingPage() {
  const [longShort, setLongShort] = useState<'Long' | 'Short'>('Long')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      {/* Module nav */}
      <div className="flex items-center gap-0 px-5 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {moduleTabs.map((t) => (
          <Link key={t.label} href={t.href}
            className={cn(
              'px-4 py-3 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              t.label === 'Trading'
                ? 'text-white border-[#3b82f6]'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            )}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Filters card ── */}
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white text-[13px] font-semibold">Filters</span>
            <button className="btn-white text-[12px] py-1 px-4">Recalculate</button>
          </div>

          {/* Filter chips row */}
          <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
            {['All Portfolios', 'Default View', 'From: 11 Oct, 21', 'As of: 11 Oct, 21'].map((chip, i) => (
              <button key={i} className="sort-pill text-[11px]">
                {chip} <ChevronDown className="w-3 h-3" />
              </button>
            ))}
            <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            </button>
          </div>

          {/* 3-column filter grid */}
          <div className="grid grid-cols-3 gap-4 px-4 pb-4">
            {/* Row 1 */}
            <DropdownField label="Closed Positions" value="Exclude" />
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Quantity from/to</label>
              <div className="flex items-center px-3 py-2 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <input placeholder="Enter text" className="bg-transparent outline-none text-[12.5px] w-full" style={{ color: '#94a3b8' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Quantity</label>
              <div className="flex items-center gap-4 px-3 py-2 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)', height: '38px' }}>
                {(['Long','Short'] as const).map(v => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setLongShort(v)}
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center cursor-pointer"
                      style={{ borderColor: longShort === v ? '#3b82f6' : '#64748b' }}
                    >
                      {longShort === v && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />}
                    </div>
                    <span className="text-[12px]" style={{ color: longShort === v ? '#e2e8f0' : '#64748b' }}>{v}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Expiry/Maturity from/to</label>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[12.5px]" style={{ color: '#64748b' }}>Select</span>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              </div>
            </div>
            <DropdownField label="Portfolio" value="No filter" />
            <DropdownField label="Folder" value="No filter" />

            {/* Row 3 */}
            <DropdownField label="Instrument type" value="No filter" />
            <DropdownField label="Currency" value="No filter" />
            <DropdownField label="Industry" value="No filter" />
          </div>
        </div>

        {/* ── Positions ── */}
        <div className="arcus-card">
          <div className="flex items-center gap-6 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white text-[13px] font-semibold">Positions</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>NAV:</span>
              <span className="font-mono" style={{ color: '#3b82f6' }}>166,238,953.30</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Securities:</span>
              <span className="font-mono" style={{ color: '#3b82f6' }}>166,238,953.30</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Cash balance:</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Checked Cash: 24 May 24</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Pending Cash:</span>
              <span className="font-mono" style={{ color: '#ef4444' }}>679,191.78</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th>Reference</th>
                  <th>Short Name</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Open</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">TR</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, i) => (
                  <tr key={i} className="cursor-pointer">
                    <td style={{ color: '#94a3b8' }}>{pos.portfolio}</td>
                    <td style={{ color: '#e2e8f0' }} className="font-medium">{pos.ref}</td>
                    <td style={{ color: '#94a3b8' }}>{pos.shortName}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{pos.qty}</td>
                    <td className="text-right font-mono" style={{ color: '#64748b' }}>{pos.open}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{pos.price}</td>
                    <td className="text-right font-mono" style={{ color: '#64748b' }}>{pos.tr}</td>
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
