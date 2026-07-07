'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ── Top-level Setup tabs ──────────────────────────────────────────
const setupTabs = ['Setup', 'Broker/Counterparties', 'Commissions', 'Countries', 'Currencies', 'Instrument Types', 'Issuer', 'Markets']

// ── Portfolios sub-nav ────────────────────────────────────────────
const portfolioSubNav = [
  { label: 'Overview',     href: '/portfolios' },
  { label: 'Instruments',  href: '/portfolios/instruments' },
  { label: 'Prices',       href: '/portfolios/prices' },
  { label: 'Positions',    href: '/portfolios/positions' },
  { label: 'Transactions', href: '/portfolios/transactions' },
  { label: 'Folder Setup', href: '#' },
  { label: 'Setup',        href: '#' },
]

// ── Category pills ────────────────────────────────────────────────
const categories = ['Equity', 'Fund', 'Cash', 'ETF', 'Options', 'FX/Forwards', 'Features', 'CFD', 'Certificate', 'Commodity', 'Bond']

// ── Instruments table rows (matching reference) ───────────────────
const instruments = [
  { code: 'A',    name: 'Equity',    title: 'Equity',    item: 'Equity',    fields: 'v, p, t',       apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = COMMON S' },
  { code: 'A01',  name: 'Preferred', title: 'Preferred', item: 'Preferred', fields: 'v, f, d, p, t',  apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = PREFFERED' },
  { code: 'A02',  name: 'ADR',       title: 'ADR',       item: 'ADR',       fields: '',              apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = ADR' },
  { code: 'A03',  name: 'GDR',       title: 'GDR',       item: 'GDR',       fields: '',              apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = GDR' },
  { code: 'A04',  name: 'EDR',       title: 'EDR',       item: 'EDR',       fields: '',              apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = EDR' },
  { code: 'A05',  name: 'Coupon',    title: 'Coupon',    item: 'Coupon',    fields: '',              apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = MLP' },
  { code: 'A06',  name: 'MLP',       title: 'MLP',       item: 'MLP',       fields: '',              apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = REIT' },
  { code: 'A07',  name: 'REITs',     title: 'REITs',     item: 'REITs',     fields: '',              apiFilter1: 'BPIPE_REFERNCE_SECURITY', apiFilter2: 'SECURITY_TYP = PREFFERED' },
]

export default function InstrumentsPage() {
  const [activeSetupTab, setActiveSetupTab] = useState('Instrument Types')
  const [activeCategory, setActiveCategory] = useState('Equity')
  const [activePage, setActivePage] = useState(2)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Portfolios" />

      {/* Portfolio sub-nav */}
      <div className="flex items-center gap-0 px-5 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {portfolioSubNav.map((t) => (
          <Link key={t.label} href={t.href}
            className={cn(
              'px-4 py-3 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              t.label === 'Instruments'
                ? 'text-[#3b82f6] border-[#3b82f6]'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            )}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* Setup top-level tabs */}
      <div className="flex items-center gap-0 px-5 pt-3 pb-0 flex-shrink-0 overflow-x-auto">
        {setupTabs.map((t) => (
          <button key={t} onClick={() => setActiveSetupTab(t)}
            className={cn(
              'px-4 pb-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              activeSetupTab === t
                ? 'text-white border-[#3b82f6]'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            )}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }} />

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

        {/* Instrument Type header + actions */}
        <div className="flex items-center justify-between">
          <span className="text-white text-[14px] font-semibold">Instrument Type</span>
          <div className="flex items-center gap-2">
            <button className="btn-white text-[12px] py-1 px-4">New Type</button>
            <button className="btn-white text-[12px] py-1 px-4">New Sub Category</button>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={cn('cat-pill', activeCategory === c && 'active')}>
              {c}
            </button>
          ))}
        </div>

        {/* Instruments table card */}
        <div className="arcus-card">
          <div className="arcus-card-header">
            <span className="text-white text-[13px] font-semibold">Instruments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Title</th>
                  <th>Item</th>
                  <th>Fields</th>
                  <th>Status</th>
                  <th>API Filter 1</th>
                  <th>API Filter 1</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map((row) => (
                  <tr key={row.code} className="cursor-pointer">
                    <td className="font-mono font-medium" style={{ color: '#e2e8f0' }}>{row.code}</td>
                    <td style={{ color: '#e2e8f0' }}>{row.name}</td>
                    <td style={{ color: '#94a3b8' }}>{row.title}</td>
                    <td style={{ color: '#94a3b8' }}>{row.item}</td>
                    <td className="font-mono text-[11px]" style={{ color: '#64748b' }}>{row.fields}</td>
                    <td>
                      <span className="badge badge-green">Active</span>
                    </td>
                    <td className="font-mono text-[11px]" style={{ color: '#64748b' }}>{row.apiFilter1}</td>
                    <td className="font-mono text-[11px]" style={{ color: '#64748b' }}>{row.apiFilter2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[11px]" style={{ color: '#64748b' }}>Showing 12 out of 46 results</span>
            <div className="flex items-center gap-1">
              <button className="pg-btn">‹</button>
              {[1,2,3,4].map(p => (
                <button key={p} onClick={() => setActivePage(p)} className={cn('pg-btn', activePage === p && 'active')}>{p}</button>
              ))}
              <button className="pg-btn">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
