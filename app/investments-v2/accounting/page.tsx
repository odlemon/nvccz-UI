'use client'

import { Fragment, useEffect, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Download, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPortfolios,
  fetchAccountingEvents,
  reverseAccountingEvent,
  fetchJournalEntries,
  fetchJournalEntryDetail,
} from '@/lib/store/slices/investmentOpsSlice'

const acctTabs = ['Events', 'Journals', 'Posting Status', 'Ledger Export']

const postingStatus = [
  { portfolio: 'Equity World', totalEvents: 42, postedEvents: 41, pendingEvents: 1, failedEvents: 0, lastPosted: '07 Jul 2026 10:15', status: 'partial' },
  { portfolio: 'Multi Asset', totalEvents: 28, postedEvents: 28, pendingEvents: 0, failedEvents: 0, lastPosted: '07 Jul 2026 10:12', status: 'posted' },
  { portfolio: 'Fixed Income', totalEvents: 18, postedEvents: 18, pendingEvents: 0, failedEvents: 0, lastPosted: '07 Jul 2026 10:10', status: 'posted' },
  { portfolio: 'Asia Select', totalEvents: 14, postedEvents: 13, pendingEvents: 1, failedEvents: 0, lastPosted: '07 Jul 2026 09:55', status: 'partial' },
]

export default function AccountingPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    selectedFundId,
    accountingEvents,
    accountingEventActionLoadingById,
    journalEntries,
    journalEntriesLoading,
    selectedJournalEntry,
  } = useAppSelector((s) => s.investmentOps)
  const [activeTab, setActiveTab] = useState('Events')
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchAccountingEvents({ fundId: selectedFundId ?? undefined, pageSize: 100 }))
    dispatch(fetchJournalEntries({ fundId: selectedFundId ?? undefined }))
  }, [dispatch, selectedFundId])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  const handleReverse = (id: string) => {
    const reason = window.prompt('Reason for reversing this accounting event:')
    if (!reason) return
    dispatch(reverseAccountingEvent({ id, reason }))
  }

  const toggleJournal = (id: string) => {
    if (expandedJournalId === id) {
      setExpandedJournalId(null)
      return
    }
    setExpandedJournalId(id)
    dispatch(fetchJournalEntryDetail(id))
  }

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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Events', value: accountingEvents.length },
            { label: 'Posted', value: accountingEvents.filter(e => e.status === 'POSTED').length, color: 'text-[#10B981]' },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1526] border border-white/[0.06] rounded-md px-4 py-2.5">
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-0.5">{s.label}</div>
              <div className={cn('text-lg font-semibold font-mono', 'color' in s ? s.color : 'text-[#E8EDF5]')}>{s.value}</div>
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
              </div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Portfolio</th>
                  <th>Type</th>
                  <th>Trade Ref</th>
                  <th className="text-right">Amount</th>
                  <th>CCY</th>
                  <th>Event Date</th>
                  <th>Post Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {accountingEvents.map(evt => (
                  <tr key={evt.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{evt.id}</td>
                    <td className="text-[#A8B4C8]">{fundName(evt.fundId)}</td>
                    <td className="text-[#C8D3E8]">{evt.eventType}</td>
                    <td className="text-[#C8D3E8] font-mono text-[11px]">{evt.tradeRef}</td>
                    <td className="text-right font-mono">{evt.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="text-[#A8B4C8] font-mono">{evt.currencyCode}</td>
                    <td className="text-[#6B7A95]">{new Date(evt.createdAt).toLocaleDateString()}</td>
                    <td className="text-[#6B7A95]">{evt.postedAt ? new Date(evt.postedAt).toLocaleDateString() : '—'}</td>
                    <td><StatusBadge status={evt.status === 'POSTED' ? 'posted' : evt.status.toLowerCase()} /></td>
                    <td>
                      {evt.status === 'POSTED' && (
                        <button
                          disabled={!!accountingEventActionLoadingById[evt.id]}
                          onClick={() => handleReverse(evt.id)}
                          className="text-[10px] text-[#EF4444] hover:underline font-medium disabled:opacity-50"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {accountingEvents.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No accounting events found.</td>
                  </tr>
                )}
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
                    <th />
                    <th>Journal ID</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th className="text-right">Total Amount</th>
                    <th>CCY</th>
                    <th>Transaction Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map(jnl => {
                    const isExpanded = expandedJournalId === jnl.id
                    const lines = (isExpanded && selectedJournalEntry?.id === jnl.id ? selectedJournalEntry.journalEntryLines : jnl.journalEntryLines) ?? []
                    return (
                      <Fragment key={jnl.id}>
                        <tr className={cn('cursor-pointer', isExpanded && 'bg-[#3b82f614]')} onClick={() => toggleJournal(jnl.id)}>
                          <td className="w-6">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#6B7A95]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#6B7A95]" />}
                          </td>
                          <td className="text-[#60A5FA] font-mono text-[11px]">{jnl.id}</td>
                          <td className="text-[#6B7A95] font-mono text-[11px]">{jnl.referenceNumber}</td>
                          <td className="text-[#A8B4C8] max-w-xs truncate">{jnl.description}</td>
                          <td className="text-right font-mono">{Number(jnl.totalAmount).toLocaleString()}</td>
                          <td className="text-[#A8B4C8] font-mono">{jnl.currency?.code ?? '—'}</td>
                          <td className="text-[#6B7A95]">{new Date(jnl.transactionDate).toLocaleString()}</td>
                          <td><StatusBadge status={jnl.status === 'POSTED' ? 'posted' : jnl.status.toLowerCase()} /></td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <div className="px-6 py-3" style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <table className="arcus-table">
                                  <thead>
                                    <tr>
                                      <th>Account</th>
                                      <th>Description</th>
                                      <th className="text-right">Debit</th>
                                      <th className="text-right">Credit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lines.map((line) => (
                                      <tr key={line.id}>
                                        <td className="text-[#C8D3E8] text-[11px]">{line.chartOfAccount.accountNo} — {line.chartOfAccount.accountName}</td>
                                        <td className="text-[#6B7A95] text-[11px]">{line.description}</td>
                                        <td className="text-right font-mono text-[#10B981]">{Number(line.debitAmount) > 0 ? Number(line.debitAmount).toLocaleString() : '—'}</td>
                                        <td className="text-right font-mono text-[#EF4444]">{Number(line.creditAmount) > 0 ? Number(line.creditAmount).toLocaleString() : '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                  {journalEntries.length === 0 && !journalEntriesLoading && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No journal entries found.</td>
                    </tr>
                  )}
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
