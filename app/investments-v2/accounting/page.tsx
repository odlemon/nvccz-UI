'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Download, RefreshCw, Send } from 'lucide-react'

const acctTabs = ['Events', 'Journals', 'Posting Status', 'Ledger Export']

const events = [
  { id: 'EVT-2841', portfolio: 'Equity World', type: 'Trade Purchase', instrument: 'NVDA', amount: 63900, currency: 'USD', eventDate: '07 Jul 2026', postDate: '09 Jul 2026', status: 'pending', ref: 'ORD-2841' },
  { id: 'EVT-2840', portfolio: 'Asia Select', type: 'Trade Purchase', instrument: 'TSM', amount: 54915, currency: 'USD', eventDate: '05 Jul 2026', postDate: '07 Jul 2026', status: 'posted', ref: 'ORD-2836' },
  { id: 'EVT-2839', portfolio: 'Equity World', type: 'Trade Purchase', instrument: 'META', amount: 84610, currency: 'USD', eventDate: '04 Jul 2026', postDate: '07 Jul 2026', status: 'posted', ref: 'ORD-2835' },
  { id: 'EVT-2838', portfolio: 'Multi Asset', type: 'Trade Purchase', instrument: 'GOLD', amount: 93480, currency: 'USD', eventDate: '04 Jul 2026', postDate: '07 Jul 2026', status: 'posted', ref: 'ORD-2834' },
  { id: 'EVT-2837', portfolio: 'Equity World', type: 'Dividend Receipt', instrument: 'MSFT', amount: 900, currency: 'USD', eventDate: '01 Jul 2026', postDate: '01 Jul 2026', status: 'posted', ref: 'DIV-8201' },
  { id: 'EVT-2836', portfolio: 'Fixed Income', type: 'Coupon Receipt', instrument: 'UST10Y', amount: 22500, currency: 'USD', eventDate: '15 Jun 2026', postDate: '15 Jun 2026', status: 'posted', ref: 'CPN-0041' },
  { id: 'EVT-2835', portfolio: 'Equity World', type: 'Trade Sale', instrument: 'BHP', amount: 44147, currency: 'AUD', eventDate: '06 Jul 2026', postDate: '08 Jul 2026', status: 'posted', ref: 'ORD-2839' },
  { id: 'EVT-2834', portfolio: 'Multi Asset', type: 'FX Conversion', instrument: 'USD/ZAR', amount: 183780, currency: 'ZAR', eventDate: '02 Jul 2026', postDate: '02 Jul 2026', status: 'posted', ref: 'FX-0421' },
]

const journals = [
  { id: 'JNL-0841', ref: 'EVT-2840', portfolio: 'Asia Select', description: 'Trade Purchase — TSM 300 shares @ 182.50', debitAcc: '10100 — Securities', debitAmt: 54750, creditAcc: '20100 — Cash at Broker', creditAmt: 54750, feeDebit: '60100 — Brokerage Fee', feeAmt: 165, currency: 'USD', postDate: '07 Jul 2026', status: 'posted', postedBy: 'System' },
  { id: 'JNL-0840', ref: 'EVT-2839', portfolio: 'Equity World', description: 'Trade Purchase — META 150 shares @ 562.38', debitAcc: '10100 — Securities', debitAmt: 84357, creditAcc: '20100 — Cash at Broker', creditAmt: 84357, feeDebit: '60100 — Brokerage Fee', feeAmt: 253, currency: 'USD', postDate: '07 Jul 2026', status: 'posted', postedBy: 'System' },
  { id: 'JNL-0839', ref: 'EVT-2837', portfolio: 'Equity World', description: 'Dividend — MSFT Q2 2026', debitAcc: '20100 — Cash at Broker', debitAmt: 900, creditAcc: '40200 — Dividend Income', creditAmt: 900, feeDebit: '—', feeAmt: 0, currency: 'USD', postDate: '01 Jul 2026', status: 'posted', postedBy: 'System' },
  { id: 'JNL-0838', ref: 'EVT-2836', portfolio: 'Fixed Income', description: 'Coupon — UST 10Y 4.5% Jun 2026', debitAcc: '20100 — Cash at Broker', debitAmt: 22500, creditAcc: '40100 — Interest Income', creditAmt: 22500, feeDebit: '—', feeAmt: 0, currency: 'USD', postDate: '15 Jun 2026', status: 'posted', postedBy: 'System' },
]

const postingStatus = [
  { portfolio: 'Equity World', totalEvents: 42, postedEvents: 41, pendingEvents: 1, failedEvents: 0, lastPosted: '07 Jul 2026 10:15', status: 'partial' },
  { portfolio: 'Multi Asset', totalEvents: 28, postedEvents: 28, pendingEvents: 0, failedEvents: 0, lastPosted: '07 Jul 2026 10:12', status: 'posted' },
  { portfolio: 'Fixed Income', totalEvents: 18, postedEvents: 18, pendingEvents: 0, failedEvents: 0, lastPosted: '07 Jul 2026 10:10', status: 'posted' },
  { portfolio: 'Asia Select', totalEvents: 14, postedEvents: 13, pendingEvents: 1, failedEvents: 0, lastPosted: '07 Jul 2026 09:55', status: 'partial' },
]

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState('Events')

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Accounting" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {acctTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: events.length, sub: '07 Jul 2026' },
            { label: 'Posted', value: events.filter(e => e.status === 'posted').length, color: 'text-[#10B981]' },
            { label: 'Pending Posting', value: events.filter(e => e.status === 'pending').length, color: 'text-[#F59E0B]' },
            { label: 'Failed', value: 0, color: 'text-[#EF4444]' },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1526] border border-white/[0.06] rounded-md px-4 py-2.5">
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className={cn('text-lg font-semibold font-mono', 'color' in s ? s.color : 'text-[#E8EDF5]')}>{s.value}</div>
              {'sub' in s && s.sub && <div className="text-[10px] text-[#4B5A72]">{s.sub}</div>}
            </div>
          ))}
        </div>

        {activeTab === 'Events' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Accounting Events</div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
                  <Download className="w-3 h-3" /> Export
                </button>
                <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                  <Send className="w-3 h-3" /> Post All Pending
                </button>
              </div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Portfolio</th>
                  <th>Type</th>
                  <th>Instrument</th>
                  <th className="text-right">Amount</th>
                  <th>CCY</th>
                  <th>Event Date</th>
                  <th>Post Date</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(evt => (
                  <tr key={evt.id} className="cursor-pointer">
                    <td className="text-[#60A5FA] font-mono text-[11px]">{evt.id}</td>
                    <td className="text-[#A8B4C8]">{evt.portfolio}</td>
                    <td className="text-[#C8D3E8]">{evt.type}</td>
                    <td className="text-[#C8D3E8] font-mono">{evt.instrument}</td>
                    <td className="text-right font-mono">{evt.amount.toLocaleString()}</td>
                    <td className="text-[#A8B4C8] font-mono">{evt.currency}</td>
                    <td className="text-[#6B7A95]">{evt.eventDate}</td>
                    <td className="text-[#6B7A95]">{evt.postDate}</td>
                    <td><StatusBadge status={evt.status} /></td>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{evt.ref}</td>
                    <td>
                      {evt.status === 'pending' && (
                        <button className="text-[10px] text-[#2563EB] hover:underline font-medium">Post</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Journals' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Double-Entry Journal Entries</div>
            </div>
            <div className="overflow-x-auto">
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Journal ID</th>
                    <th>Reference</th>
                    <th>Portfolio</th>
                    <th>Description</th>
                    <th>Debit Account</th>
                    <th className="text-right">Debit Amt</th>
                    <th>Credit Account</th>
                    <th className="text-right">Credit Amt</th>
                    <th>Fee Account</th>
                    <th className="text-right">Fee Amt</th>
                    <th>CCY</th>
                    <th>Post Date</th>
                    <th>Status</th>
                    <th>Posted By</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map(jnl => (
                    <tr key={jnl.id}>
                      <td className="text-[#60A5FA] font-mono text-[11px]">{jnl.id}</td>
                      <td className="text-[#6B7A95] font-mono text-[11px]">{jnl.ref}</td>
                      <td className="text-[#A8B4C8]">{jnl.portfolio}</td>
                      <td className="text-[#A8B4C8] max-w-xs truncate">{jnl.description}</td>
                      <td className="text-[#C8D3E8] text-[11px]">{jnl.debitAcc}</td>
                      <td className="text-right font-mono text-[#10B981]">{jnl.debitAmt.toLocaleString()}</td>
                      <td className="text-[#C8D3E8] text-[11px]">{jnl.creditAcc}</td>
                      <td className="text-right font-mono text-[#EF4444]">{jnl.creditAmt.toLocaleString()}</td>
                      <td className="text-[#6B7A95] text-[11px]">{jnl.feeDebit}</td>
                      <td className="text-right font-mono text-[#F59E0B]">{jnl.feeAmt > 0 ? jnl.feeAmt : '—'}</td>
                      <td className="text-[#A8B4C8] font-mono">{jnl.currency}</td>
                      <td className="text-[#6B7A95]">{jnl.postDate}</td>
                      <td><StatusBadge status={jnl.status} /></td>
                      <td className="text-[#6B7A95]">{jnl.postedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Posting Status' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Posting Status by Portfolio</div>
              <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <RefreshCw className="w-3 h-3" /> Run Auto-Post
              </button>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Portfolio</th>
                  <th className="text-right">Total Events</th>
                  <th className="text-right">Posted</th>
                  <th className="text-right">Pending</th>
                  <th className="text-right">Failed</th>
                  <th>Last Posted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {postingStatus.map(ps => (
                  <tr key={ps.portfolio}>
                    <td className="text-[#C8D3E8] font-medium">{ps.portfolio}</td>
                    <td className="text-right font-mono">{ps.totalEvents}</td>
                    <td className="text-right font-mono text-[#10B981]">{ps.postedEvents}</td>
                    <td className={cn('text-right font-mono', ps.pendingEvents > 0 ? 'text-[#F59E0B]' : 'text-[#6B7A95]')}>{ps.pendingEvents}</td>
                    <td className={cn('text-right font-mono', ps.failedEvents > 0 ? 'text-[#EF4444]' : 'text-[#6B7A95]')}>{ps.failedEvents}</td>
                    <td className="text-[#6B7A95]">{ps.lastPosted}</td>
                    <td><StatusBadge status={ps.status} /></td>
                    <td>
                      {ps.pendingEvents > 0 && (
                        <button className="text-[10px] text-[#2563EB] hover:underline font-medium">Post Pending</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Ledger Export' && (
          <div className="space-y-3">
            <div className="bg-[#0D1526] border border-white/[0.06] rounded-md p-4">
              <div className="text-xs font-semibold text-[#E8EDF5] mb-3">Ledger Export Configuration</div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Export Format', options: ['CSV — General', 'Pastel Accounting', 'Sage 300', 'QuickBooks', 'Custom XML'] },
                  { label: 'Date Range', options: ['Current Month', 'Current Quarter', 'YTD', 'Last Month', 'Custom Range'] },
                  { label: 'Portfolio', options: ['All Portfolios', 'Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select'] },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">{f.label}</label>
                    <select className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-4 py-2 rounded hover:bg-[#1D4ED8]">
                  <Download className="w-3 h-3" /> Generate Ledger Export
                </button>
                <button className="flex items-center gap-1.5 text-[#A8B4C8] text-xs px-3 py-2 rounded bg-[#111C30] border border-white/[0.06] hover:bg-[#1A2540]">
                  Preview Entries
                </button>
              </div>
            </div>

            <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06]">
                <div className="text-xs font-semibold text-[#E8EDF5]">Previous Exports</div>
              </div>
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Export ID</th>
                    <th>Format</th>
                    <th>Period</th>
                    <th>Portfolio</th>
                    <th>Lines</th>
                    <th>Generated By</th>
                    <th>Generated At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'EXP-0421', format: 'CSV — General', period: 'Jun 2026', portfolio: 'All', lines: 284, by: 'J.Moyo', at: '07 Jul 2026 08:00' },
                    { id: 'EXP-0420', format: 'Pastel Accounting', period: 'Q2 2026', portfolio: 'Equity World', lines: 142, by: 'System', at: '01 Jul 2026 00:01' },
                    { id: 'EXP-0419', format: 'CSV — General', period: 'May 2026', portfolio: 'All', lines: 248, by: 'R.Sithole', at: '02 Jun 2026 09:15' },
                  ].map(e => (
                    <tr key={e.id}>
                      <td className="text-[#60A5FA] font-mono text-[11px]">{e.id}</td>
                      <td className="text-[#A8B4C8]">{e.format}</td>
                      <td className="text-[#6B7A95]">{e.period}</td>
                      <td className="text-[#A8B4C8]">{e.portfolio}</td>
                      <td className="font-mono">{e.lines}</td>
                      <td className="text-[#6B7A95]">{e.by}</td>
                      <td className="text-[#6B7A95]">{e.at}</td>
                      <td>
                        <button className="flex items-center gap-1 text-[#60A5FA] text-[10px] hover:underline">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
