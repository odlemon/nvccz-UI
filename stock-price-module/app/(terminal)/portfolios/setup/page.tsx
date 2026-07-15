'use client'

import { Topbar } from '@/components/arcus/topbar'
import { cn } from '@/lib/utils'
import { Pencil, Plus } from 'lucide-react'
import Link from 'next/link'

const setupTabs = ['Setup', 'Broker/Counterparties', 'Commissions', 'Countries', 'Currencies', 'Instrument Types', 'Issuer', 'Markets']

const portfolioSubNav = [
  { label: 'Overview',     href: '/portfolios' },
  { label: 'Instruments',  href: '/portfolios/instruments' },
  { label: 'Prices',       href: '/portfolios/prices' },
  { label: 'Positions',    href: '/portfolios/positions' },
  { label: 'Transactions', href: '/portfolios/transactions' },
  { label: 'Folder Setup', href: '#' },
  { label: 'Setup',        href: '/portfolios/setup' },
]

const priceApiRows = [
  { label: 'Heartbeat', value: '23 April 21, 22:09' },
  { label: 'Latest Day', value: '29 June 21' },
  { label: 'Message', value: 'Online' },
  { label: 'API Status', value: '' },
  { label: 'Ticks Today', value: '2619' },
]

const settingsRows = [
  { label: '4 eye principal for transaction', value: 'No' },
  { label: 'Open all folder in portfolio view', value: '' },
  { label: 'Stale price counter', value: '5' },
  { label: 'Start date for PnL calculation', value: '1 Jan 21' },
  { label: 'Default currency (for diagrams)', value: 'USD' },
]

const corporateRows = [
  'Dividend Code(without currency)',
  'Dividend ex prefix for comment',
  'Dividend pay prefix for comment',
  'Coupon Code(without currency)',
  'Coupon payment prefix comment',
  'Cash account code(without currency)',
]

const tagRows = [
  { tag: 'Tag 0 Headline', value: 'Country' },
  { tag: 'Tag 1 Headline', value: 'Company' },
  { tag: 'Tag 2 Headline', value: 'Government' },
  { tag: 'Tag 3 Headline', value: 'OECD' },
  { tag: 'Tag 4 Headline', value: 'EU' },
  { tag: 'Tag 5 Headline', value: 'EEA' },
  { tag: 'Tag 6 Headline', value: 'Other' },
  { tag: 'Tag 7 Headline', value: 'Credit Institution' },
  { tag: 'Tag 8 Headline', value: 'Precious Metal' },
  { tag: 'Tag 9 Headline', value: 'Real Estate Exposure' },
  { tag: 'Position Tag 1', value: 'Credit Institution' },
  { tag: 'Position Tag 2', value: 'Precious Metal' },
  { tag: 'Position Tag 3', value: 'Real Estate Exposure' },
]

const iconRows = [
  { name: 'Error',     icon: '⊙', id: 1 },
  { name: 'Not Found', icon: '⊗', id: 2 },
  { name: 'OK',        icon: '⊙', id: 3 },
  { name: 'OK but Old',icon: '↺', id: 4 },
  { name: 'Undefined', icon: '⊘', id: 1 },
  { name: 'Not OK',    icon: '⊗', id: 2 },
  { name: 'Approved',  icon: '⊙', id: 3 },
  { name: 'Warnings',  icon: '△', id: 4 },
]

export default function PortfolioSetupPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Portfolios" />

      {/* Portfolio sub-nav */}
      <div className="flex items-center gap-0 px-5 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {portfolioSubNav.map((t) => (
          <Link key={t.label} href={t.href}
            className={cn(
              'px-4 py-3 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              t.label === 'Setup'
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
          <button key={t}
            className={cn(
              'px-4 pb-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              t === 'Setup'
                ? 'text-white border-[#3b82f6]'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            )}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }} />

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="grid grid-cols-3 gap-4">

          {/* Price API */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Price API</span>
              <button className="opacity-50 hover:opacity-100"><Pencil className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="p-4 space-y-2">
              {priceApiRows.map(r => (
                <div key={r.label} className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: '#64748b', minWidth: 100 }}>{r.label}</span>
                  <span style={{ color: '#64748b' }}>:</span>
                  <span className="font-medium" style={{ color: r.label === 'Message' ? '#10b981' : '#e2e8f0' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Settings</span>
              <button className="opacity-50 hover:opacity-100"><Pencil className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="p-4 space-y-2">
              {settingsRows.map(r => (
                <div key={r.label} className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: '#64748b', flex: 1 }}>{r.label}</span>
                  <span style={{ color: '#64748b' }}>:</span>
                  <span className="font-medium" style={{ color: '#e2e8f0' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Corporate Actions */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Corporate Actions</span>
              <button className="opacity-50 hover:opacity-100"><Pencil className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="p-4 space-y-2">
              {corporateRows.map(r => (
                <div key={r} className="text-[12px]" style={{ color: '#94a3b8' }}>{r}</div>
              ))}
            </div>
          </div>

          {/* Tag Names */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Tag Names</span>
              <button className="opacity-50 hover:opacity-100"><Pencil className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="p-4 space-y-1.5">
              {tagRows.map(r => (
                <div key={r.tag} className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: '#64748b', minWidth: 120 }}>{r.tag}</span>
                  <span style={{ color: '#64748b' }}>:</span>
                  <span style={{ color: '#e2e8f0' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Frequency */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Coupon Frequency</span>
              <button className="btn-white text-[11px] py-1 px-3">Add New</button>
            </div>
            <div className="overflow-x-auto">
              <table className="arcus-table">
                <thead><tr><th>Frequency</th><th>Name - org</th><th>ID</th></tr></thead>
                <tbody>
                  {[['Monthly','Monthly',12],['Quarterly','Quarterly',4],['Half Year','Half Year',2],['Yearly','Yearly',1]].map(([f,n,id]) => (
                    <tr key={f as string}>
                      <td style={{ color: '#e2e8f0' }}>{f}</td>
                      <td style={{ color: '#64748b' }}>{n}</td>
                      <td className="font-mono" style={{ color: '#94a3b8' }}>{id as number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Icons */}
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Icons</span>
              <button className="btn-white text-[11px] py-1 px-3">Add New</button>
            </div>
            <div className="overflow-x-auto">
              <table className="arcus-table">
                <thead><tr><th>Name</th><th>Icon</th><th>ID</th></tr></thead>
                <tbody>
                  {iconRows.map((row) => (
                    <tr key={`${row.name}-${row.id}`}>
                      <td style={{ color: '#e2e8f0' }}>{row.name}</td>
                      <td style={{ color: '#94a3b8', fontSize: 14 }}>{row.icon}</td>
                      <td className="font-mono" style={{ color: '#64748b' }}>{row.id}</td>
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
