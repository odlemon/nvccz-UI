'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Upload, Filter, RefreshCw } from 'lucide-react'

const reconTabs = ['Cash Recon', 'Holdings', 'Trade Recon', 'Exceptions']

const cashItems = [
  { id: 'CR-0821', portfolio: 'Equity World', account: 'Citi Custody USD', arcusBalance: 18200000, custodianBal: 18200000, diff: 0, status: 'matched', reconDate: '07 Jul 2026' },
  { id: 'CR-0820', portfolio: 'Multi Asset', account: 'BNY USD Main', arcusBalance: 11200000, custodianBal: 11195000, diff: 5000, status: 'unmatched', reconDate: '07 Jul 2026' },
  { id: 'CR-0819', portfolio: 'Fixed Income', account: 'Citi Custody USD', arcusBalance: 6800000, custodianBal: 6800000, diff: 0, status: 'matched', reconDate: '07 Jul 2026' },
  { id: 'CR-0818', portfolio: 'Asia Select', account: 'HSBC HKD Acct', arcusBalance: 4200000, custodianBal: 4210000, diff: -10000, status: 'investigating', reconDate: '07 Jul 2026' },
]

const holdingsItems = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', portfolio: 'Equity World', arcusQty: 2500, custodianQty: 2500, diff: 0, status: 'matched' },
  { ticker: 'MSFT', name: 'Microsoft Corp', portfolio: 'Equity World', arcusQty: 1200, custodianQty: 1200, diff: 0, status: 'matched' },
  { ticker: 'TSM', name: 'TSMC', portfolio: 'Asia Select', arcusQty: 300, custodianQty: 300, diff: 0, status: 'matched' },
  { ticker: 'BABA', name: 'Alibaba Group', portfolio: 'Asia Select', arcusQty: 0, custodianQty: 500, diff: -500, status: 'unmatched' },
  { ticker: 'META', name: 'Meta Platforms', portfolio: 'Equity World', arcusQty: 420, custodianQty: 420, diff: 0, status: 'matched' },
  { ticker: 'GOLD', name: 'Gold ETF', portfolio: 'Multi Asset', arcusQty: 500, custodianQty: 498, diff: 2, status: 'investigating' },
]

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState('Cash Recon')

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Reconciliation" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {reconTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
            {t === 'Exceptions' && <span className="ml-1.5 bg-[#F59E0B] text-black text-[9px] rounded-full px-1.5 font-semibold">3</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Matched', value: '7', color: 'text-[#10B981]', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Unmatched', value: '2', color: 'text-[#EF4444]', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Investigating', value: '2', color: 'text-[#F59E0B]', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Total Breaks', value: '$15,000', color: 'text-[#EF4444]', bg: 'bg-[#0D1526] border-white/[0.06]' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-md p-3 border', s.bg)}>
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-1">{s.label}</div>
              <div className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7A95]">Reconciliation date: 07 Jul 2026</div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Upload className="w-3 h-3" /> Upload Custodian File
            </button>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <RefreshCw className="w-3 h-3" /> Run Reconciliation
            </button>
          </div>
        </div>

        {activeTab === 'Cash Recon' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Cash Reconciliation</div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Recon ID</th>
                  <th>Portfolio</th>
                  <th>Account</th>
                  <th className="text-right">Arcus Balance</th>
                  <th className="text-right">Custodian Balance</th>
                  <th className="text-right">Difference</th>
                  <th>Status</th>
                  <th>Recon Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cashItems.map(item => (
                  <tr key={item.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{item.id}</td>
                    <td className="text-[#A8B4C8]">{item.portfolio}</td>
                    <td className="text-[#A8B4C8]">{item.account}</td>
                    <td className="text-right font-mono">{item.arcusBalance.toLocaleString()}</td>
                    <td className="text-right font-mono">{item.custodianBal.toLocaleString()}</td>
                    <td className={cn('text-right font-mono', item.diff !== 0 ? 'text-[#EF4444]' : 'text-[#10B981]')}>
                      {item.diff === 0 ? '—' : item.diff.toLocaleString()}
                    </td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="text-[#6B7A95]">{item.reconDate}</td>
                    <td>
                      {item.status !== 'matched' && (
                        <button className="text-[10px] text-[#60A5FA] hover:underline">Investigate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Holdings' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Holdings Reconciliation vs Custodian</div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Instrument</th>
                  <th>Portfolio</th>
                  <th className="text-right">Arcus Qty</th>
                  <th className="text-right">Custodian Qty</th>
                  <th className="text-right">Difference</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {holdingsItems.map(item => (
                  <tr key={item.ticker + item.portfolio}>
                    <td className="text-[#60A5FA] font-mono font-semibold">{item.ticker}</td>
                    <td className="text-[#A8B4C8]">{item.name}</td>
                    <td className="text-[#6B7A95]">{item.portfolio}</td>
                    <td className="text-right font-mono">{item.arcusQty.toLocaleString()}</td>
                    <td className="text-right font-mono">{item.custodianQty.toLocaleString()}</td>
                    <td className={cn('text-right font-mono', item.diff !== 0 ? 'text-[#EF4444]' : 'text-[#10B981]')}>
                      {item.diff === 0 ? '—' : item.diff}
                    </td>
                    <td><StatusBadge status={item.status} /></td>
                    <td>
                      {item.status !== 'matched' && (
                        <button className="text-[10px] text-[#60A5FA] hover:underline">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
