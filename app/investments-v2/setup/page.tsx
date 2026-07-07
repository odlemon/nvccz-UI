'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Activity, CheckCircle2, XCircle, Plus } from 'lucide-react'

const setupTabs = ['System Settings', 'Brokers', 'Currencies', 'Markets', 'Instrument Types', 'Price APIs']

const priceAPIs = [
  { name: 'ZSE Market Feed', type: 'Exchange', status: 'active', heartbeat: '10s ago', lastDay: '07 Jul 2026', ticksToday: 12842, lastRun: '10:14:55', failedReqs: 0, retryCount: 0, message: 'OK' },
  { name: 'VFEX Price Feed', type: 'Exchange', status: 'active', heartbeat: '15s ago', lastDay: '07 Jul 2026', ticksToday: 4218, lastRun: '10:14:48', failedReqs: 0, retryCount: 0, message: 'OK' },
  { name: 'Bloomberg Data Feed', type: 'Licensed API', status: 'active', heartbeat: '5s ago', lastDay: '07 Jul 2026', ticksToday: 84200, lastRun: '10:14:58', failedReqs: 2, retryCount: 0, message: 'OK — 2 stale prices flagged' },
  { name: 'Manual CSV Upload', type: 'Manual', status: 'active', heartbeat: 'Manual', lastDay: '07 Jul 2026', ticksToday: 42, lastRun: '08:30:00', failedReqs: 0, retryCount: 0, message: '42 prices uploaded by J.Moyo' },
  { name: 'Refinitiv Eikon', type: 'Licensed API', status: 'inactive', heartbeat: '—', lastDay: '01 Jul 2026', ticksToday: 0, lastRun: '01 Jul 2026', failedReqs: 14, retryCount: 5, message: 'Connection timeout — check API key' },
]

const instrumentTypes = [
  { code: 'EQ', name: 'Equity', subcategories: 'Ordinary, Preference, ADR, GDR', apiFilter: 'type=equity', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'BD', name: 'Bond', subcategories: 'Government, Corporate, HY, IG', apiFilter: 'type=bond', status: 'active', valuationMethod: 'Amortised Cost' },
  { code: 'ETF', name: 'ETF', subcategories: 'Equity ETF, Bond ETF, Commodity ETF', apiFilter: 'type=etf', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'FND', name: 'Fund', subcategories: 'UCITS, Hedge Fund, Money Market', apiFilter: 'type=fund', status: 'active', valuationMethod: 'NAV' },
  { code: 'FX', name: 'FX / Forward', subcategories: 'Spot, Forward, NDF', apiFilter: 'type=fx', status: 'active', valuationMethod: 'MTM' },
  { code: 'FUT', name: 'Futures', subcategories: 'Equity, Commodity, Rate', apiFilter: 'type=futures', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'OPT', name: 'Options', subcategories: 'Call, Put, American, European', apiFilter: 'type=option', status: 'active', valuationMethod: 'Black-Scholes' },
  { code: 'CFD', name: 'CFD', subcategories: 'Equity CFD, Index CFD', apiFilter: 'type=cfd', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'CASH', name: 'Cash', subcategories: 'Call Account, Term Deposit', apiFilter: 'type=cash', status: 'active', valuationMethod: 'Face Value' },
  { code: 'COMM', name: 'Commodity', subcategories: 'Gold, Silver, Oil, Agri', apiFilter: 'type=commodity', status: 'active', valuationMethod: 'Mark-to-Market' },
]

const systemSettings = [
  { key: 'Four-Eye Principle', value: 'Enabled — Orders, Price Overrides, Journals', editable: false },
  { key: 'Default Base Currency', value: 'USD', editable: true },
  { key: 'P&L Start Date', value: '01 Jan 2026', editable: true },
  { key: 'Stale Price Threshold', value: '2 business days', editable: true },
  { key: 'Default Valuation Method', value: 'Mark-to-Market (Closing Price)', editable: true },
  { key: 'Default Pricing Source', value: 'Bloomberg (primary) → ZSE (fallback)', editable: true },
  { key: 'Settlement Cycle', value: 'T+2 (default)', editable: true },
  { key: 'Accounting Method', value: 'Accrual — Weighted Average Cost', editable: true },
  { key: 'Price Deviation Alert', value: '±5% from previous close', editable: true },
  { key: 'Audit Log Retention', value: '7 years (immutable)', editable: false },
]

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState('System Settings')

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Setup & Administration" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {setupTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'System Settings' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">System Settings</div>
              <button className="text-[#60A5FA] text-[10px] hover:underline">Save Changes</button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {systemSettings.map(s => (
                <div key={s.key} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                  <div className="text-xs text-[#A8B4C8] w-56">{s.key}</div>
                  {s.editable ? (
                    <input
                      defaultValue={s.value}
                      className="flex-1 max-w-xs bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                    />
                  ) : (
                    <div className="text-xs text-[#C8D3E8] font-mono flex-1">{s.value}</div>
                  )}
                  {!s.editable && (
                    <span className="text-[10px] text-[#4B5A72] ml-4">Read-only</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Price APIs' && (
          <div className="space-y-3">
            {priceAPIs.map(api => (
              <div key={api.name} className="bg-[#0D1526] border border-white/[0.06] rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      api.status === 'active' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    )} />
                    <div>
                      <div className="text-xs font-semibold text-[#E8EDF5]">{api.name}</div>
                      <div className="text-[10px] text-[#4B5A72]">{api.type}</div>
                    </div>
                  </div>
                  <StatusBadge status={api.status} />
                </div>
                <div className="grid grid-cols-6 gap-4">
                  {[
                    { label: 'Heartbeat', value: api.heartbeat },
                    { label: 'Latest Day', value: api.lastDay },
                    { label: 'Ticks Today', value: api.ticksToday.toLocaleString() },
                    { label: 'Last Successful Run', value: api.lastRun },
                    { label: 'Failed Requests', value: api.failedReqs },
                    { label: 'Retry Count', value: api.retryCount },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-0.5">{f.label}</div>
                      <div className={cn('text-xs font-mono', f.label === 'Failed Requests' && Number(f.value) > 0 ? 'text-[#EF4444]' : 'text-[#C8D3E8]')}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-[#6B7A95]">
                  Message: <span className={cn('ml-1', api.failedReqs > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]')}>{api.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Instrument Types' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Instrument Types</div>
              <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Type
              </button>
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-white/[0.04]">
              {instrumentTypes.map(t => (
                <span key={t.code} className="bg-[#1E3A5F] text-[#60A5FA] text-[11px] font-semibold px-3 py-1 rounded-full">
                  {t.code}
                </span>
              ))}
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Subcategories</th>
                  <th>API Filter</th>
                  <th>Valuation Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {instrumentTypes.map(t => (
                  <tr key={t.code}>
                    <td className="text-[#60A5FA] font-mono font-bold">{t.code}</td>
                    <td className="text-[#C8D3E8] font-medium">{t.name}</td>
                    <td className="text-[#6B7A95]">{t.subcategories}</td>
                    <td className="font-mono text-[#A8B4C8] text-[11px]">{t.apiFilter}</td>
                    <td className="text-[#A8B4C8]">{t.valuationMethod}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'Brokers' || activeTab === 'Currencies' || activeTab === 'Markets') && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[#4B5A72] text-sm mb-1">{activeTab} Configuration</div>
              <div className="text-[#6B7A95] text-xs mb-3">Manage {activeTab.toLowerCase()} registered in the Arcus system</div>
              <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-4 py-2 rounded hover:bg-[#1D4ED8] mx-auto">
                <Plus className="w-3 h-3" /> Add {activeTab.slice(0, -1)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
