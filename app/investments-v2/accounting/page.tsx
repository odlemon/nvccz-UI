'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Download, RotateCcw, Search, X } from 'lucide-react'

const tabs = ['Accounting Events', 'Journals', 'Posting Statuses', 'Reversals', 'Ledger Exports']
const events = [
  { id: 'AE-48218', type: 'Trade Settlement', portfolio: 'Equity World', ref: 'TRD-93882', date: '17 Jul 2026', amount: '$2,450,000.00', status: 'Posted', journal: 'JNL-77219' },
  { id: 'AE-48217', type: 'Dividend', portfolio: 'Multi Asset', ref: 'CA-11872', date: '17 Jul 2026', amount: '$84,220.00', status: 'Ready to Post', journal: 'JNL-77218' },
  { id: 'AE-48216', type: 'Management Fee', portfolio: 'Asia Select', ref: 'FEE-0726', date: '17 Jul 2026', amount: '$18,900.00', status: 'Pending Review', journal: 'JNL-77217' },
  { id: 'AE-48215', type: 'FX Revaluation', portfolio: 'Fixed Income', ref: 'FXR-0717', date: '17 Jul 2026', amount: '$31,882.00', status: 'Posted', journal: 'JNL-77216' },
  { id: 'AE-48214', type: 'Coupon Accrual', portfolio: 'Fixed Income', ref: 'ACC-1992', date: '16 Jul 2026', amount: '$54,310.00', status: 'Failed', journal: 'JNL-77215' },
  { id: 'AE-48213', type: 'Corporate Action', portfolio: 'Multi Asset', ref: 'CA-11864', date: '16 Jul 2026', amount: '$126,400.00', status: 'Reversed', journal: 'JNL-77214' },
]
const journals = [
  { id: 'JNL-77219', event: 'AE-48218', description: 'Equity trade settlement · MSFT US', currency: 'USD', total: '$2,450,000.00', status: 'Posted', lines: [['1100 · Custody cash', '$0.00', '$2,450,000.00'], ['1200 · Listed equities', '$2,450,000.00', '$0.00']] },
  { id: 'JNL-77218', event: 'AE-48217', description: 'Dividend income · VTI US', currency: 'USD', total: '$84,220.00', status: 'Draft', lines: [['1100 · Custody cash', '$84,220.00', '$0.00'], ['4100 · Dividend income', '$0.00', '$84,220.00']] },
  { id: 'JNL-77217', event: 'AE-48216', description: 'Monthly management fee accrual · control break', currency: 'USD', total: '$18,900.00', status: 'Pending Review', lines: [['5100 · Management fees', '$18,900.00', '$0.00'], ['2100 · Accrued expenses', '$0.00', '$18,700.00']] },
]
const reversals = [
  { id: 'REV-1902', original: 'AE-48102', type: 'Trade Settlement', reason: 'Duplicate broker confirmation', by: 'J. Moyo', at: '16 Jul 2026 · 14:22', status: 'Completed' },
  { id: 'REV-1901', original: 'AE-48088', type: 'Dividend', reason: 'Incorrect ex-date applied', by: 'T. Ncube', at: '15 Jul 2026 · 09:41', status: 'Approved' },
]
const exportsData = [
  { id: 'LEX-0421', format: 'CSV · General ledger', period: 'Jul 2026 MTD', portfolio: 'All portfolios', lines: 284, by: 'J. Moyo', at: '17 Jul · 12:18', status: 'Ready' },
  { id: 'LEX-0420', format: 'Sage 300', period: 'Q2 2026', portfolio: 'Equity World', lines: 1420, by: 'System', at: '01 Jul · 00:05', status: 'Downloaded' },
]
function Drop({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])
  return <div ref={ref} className="relative"><button onClick={() => setOpen(!open)} className="flex h-8 min-w-[140px] items-center justify-between rounded-full border border-[#354257] bg-[#101927] px-3 text-[10px] text-[#d4dbe5]">{value}<ChevronDown className="h-3 w-3" /></button>{open && <div className="absolute right-0 z-50 mt-1.5 min-w-full rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">{options.map(o => <button key={o} onClick={() => { onChange(o); setOpen(false) }} className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] ${o === value ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[.07]'}`}>{o}{o === value && <Check className="ml-3 h-3 w-3" />}</button>)}</div>}</div>
}
function Badge({ value }: { value: string }) { const tone = ['Posted', 'Completed', 'Approved', 'Ready', 'Balanced'].includes(value) ? 'bg-emerald-400/10 text-emerald-300' : value === 'Failed' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'; return <span className={`rounded-full px-2 py-1 text-[9px] ${tone}`}>{value}</span> }

export default function AccountingPage() {
  const [tab, setTab] = useState('Accounting Events')
  const [portfolio, setPortfolio] = useState('All portfolios')
  const [status, setStatus] = useState('All statuses')
  const [search, setSearch] = useState('')
  const [journal, setJournal] = useState(journals[0])
  const [posted, setPosted] = useState<string[]>([])
  const [reverseEvent, setReverseEvent] = useState<(typeof events)[number] | null>(null)
  const [reason, setReason] = useState('')
  const [exportFormat, setExportFormat] = useState('CSV · General ledger')
  const [exportRows, setExportRows] = useState(exportsData)
  const [reversalRows, setReversalRows] = useState(reversals)
  const [reversedIds, setReversedIds] = useState<string[]>([])
  const [postingActions, setPostingActions] = useState<Record<string, string>>({})
  const [downloaded, setDownloaded] = useState<string[]>([])
  const filtered = useMemo(() => events.filter(e => (portfolio === 'All portfolios' || e.portfolio === portfolio) && (status === 'All statuses' || e.status === status) && (!search || `${e.id} ${e.ref} ${e.type}`.toLowerCase().includes(search.toLowerCase()))), [portfolio, search, status])
  const debitTotal = journal.lines.reduce((sum, line) => sum + Number(line[1].replace(/[$,]/g, '')), 0)
  const creditTotal = journal.lines.reduce((sum, line) => sum + Number(line[2].replace(/[$,]/g, '')), 0)
  const isBalanced = debitTotal === creditTotal
  const money = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const confirmReversal = () => {
    if (!reverseEvent || !reason.trim()) return
    setReversalRows(current => [{
      id: `REV-${1901 + current.length}`,
      original: reverseEvent.id,
      type: reverseEvent.type,
      reason: reason.trim(),
      by: 'J. Moyo',
      at: '17 Jul 2026 · 13:56',
      status: 'Completed',
    }, ...current])
    setReversedIds(current => [...current, reverseEvent.id])
    setReverseEvent(null)
    setReason('')
  }

  const generateExport = () => {
    setExportRows(current => [{
      id: `LEX-${String(420 + current.length).padStart(4, '0')}`,
      format: exportFormat,
      period: 'Jul 2026 MTD',
      portfolio,
      lines: 312,
      by: 'J. Moyo',
      at: '17 Jul · 13:57',
      status: 'Ready',
    }, ...current])
  }

  return <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5"><div className="mx-auto max-w-[1600px] space-y-4">
    <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(120deg,#182434,#101a29_58%,#0b1421)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Books &amp; records</p><h1 className="mt-1 text-lg font-semibold">Investment accounting</h1><p className="mt-1 text-[11px] text-[#8f9caf]">Control accounting events, balanced journals, postings and ledger delivery.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Events today', '142'], ['Ready to post', '18'], ['Failed', '1'], ['Balanced journals', '100%']].map(([l, v]) => <div key={l} className="rounded-2xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3"><p className="text-[9px] text-[#728197]">{l}</p><p className="mt-1 text-[15px] font-semibold">{v}</p></div>)}</div></div>
      <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-white/[.05] bg-[#090f18]/70 p-1">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${tab === t ? 'bg-white text-[#101722]' : 'text-[#8e9bad] hover:bg-white/[.06] hover:text-white'}`}>{t}</button>)}</div>
    </section>

    {tab === 'Accounting Events' && <Card title="Accounting event register" subtitle="Trade Settlement · Dividend · Coupon Accrual · Fee · FX Revaluation · Corporate Action">
      <Toolbar><div className="flex h-8 items-center gap-2 rounded-full border border-[#354257] bg-[#101927] px-3"><Search className="h-3 w-3 text-[#718096]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events" className="w-28 bg-transparent text-[10px] outline-none" /></div><Drop value={portfolio} options={['All portfolios', 'Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select']} onChange={setPortfolio} /><Drop value={status} options={['All statuses', 'Pending Review', 'Ready to Post', 'Posted', 'Failed', 'Reversed']} onChange={setStatus} /></Toolbar>
      <Table headers={['Event ID', 'Event type', 'Portfolio', 'Reference', 'Event date', 'Amount', 'Journal', 'Status', ''] } rows={filtered.map(e => [e.id, e.type, e.portfolio, e.ref, e.date, e.amount, e.journal, <Badge key="s" value={reversedIds.includes(e.id) ? 'Reversed' : e.status} />, <button key="r" type="button" disabled={reversedIds.includes(e.id)} onClick={() => setReverseEvent(e)} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] hover:bg-white/10 disabled:opacity-40">{reversedIds.includes(e.id) ? 'Reversed' : 'Reverse'}</button>])} />
    </Card>}

    {tab === 'Journals' && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]"><Card title="Journal entries" subtitle="Select a journal to inspect its double-entry lines"><Table headers={['Journal', 'Event', 'Description', 'Currency', 'Total', 'Status']} rows={journals.map(j => [<button key="j" onClick={() => setJournal(j)} className="font-mono text-[#68a9ff]">{j.id}</button>, j.event, j.description, j.currency, j.total, <Badge key="s" value={posted.includes(j.id) ? 'Posted' : j.status} />])} /></Card>
      <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(145deg,#142030,#0d1623)] p-5"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] text-[#68a9ff]">{journal.id}</p><h2 className="mt-1 text-[12px] font-semibold">{journal.description}</h2></div><Badge value={isBalanced ? 'Balanced' : 'Out of balance'} /></div><div className="mt-4 overflow-hidden rounded-2xl border border-white/[.06]"><table className="w-full text-[10px]"><thead className="bg-[#09111d] text-[#718096]"><tr><th className="p-3 text-left">Account</th><th className="p-3 text-right">Debit</th><th className="p-3 text-right">Credit</th></tr></thead><tbody className="divide-y divide-white/[.05]">{journal.lines.map(line => <tr key={line[0]}><td className="p-3 text-[#c6d0dc]">{line[0]}</td><td className="p-3 text-right font-mono text-emerald-300">{line[1]}</td><td className="p-3 text-right font-mono text-rose-300">{line[2]}</td></tr>)}</tbody><tfoot className="border-t border-white/10 bg-[#09111d] font-semibold"><tr><td className="p-3">Totals</td><td className="p-3 text-right font-mono">{money(debitTotal)}</td><td className="p-3 text-right font-mono">{money(creditTotal)}</td></tr></tfoot></table></div><div className={`mt-4 rounded-2xl border p-3 text-[10px] ${isBalanced ? 'border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300' : 'border-rose-400/20 bg-rose-400/[.06] text-rose-300'}`}><Check className="mr-2 inline h-3.5 w-3.5" />{isBalanced ? 'Debit equals credit. Journal is balanced and eligible for posting.' : `Posting blocked: debits and credits differ by ${money(Math.abs(debitTotal - creditTotal))}.`}</div><button disabled={!isBalanced || posted.includes(journal.id)} onClick={() => setPosted(p => [...p, journal.id])} className="mt-4 h-10 w-full rounded-full bg-[#2f87fa] text-[10px] font-semibold disabled:opacity-50">{posted.includes(journal.id) ? 'Posted locally' : isBalanced ? 'Post balanced journal' : 'Posting blocked · journal unbalanced'}</button></section>
    </div>}

    {tab === 'Posting Statuses' && <Card title="Posting status by portfolio" subtitle="Local posting queue and control state"><Table headers={['Portfolio', 'Events', 'Ready', 'Posted', 'Failed', 'Last posting run', 'Status', '']} rows={[['Equity World', '42', '1', '41', '0', '17 Jul · 12:40', 'Ready', 'Post ready'], ['Multi Asset', '38', '0', '38', '0', '17 Jul · 12:38', 'Posted', 'View log'], ['Fixed Income', '34', '0', '33', '1', '17 Jul · 12:35', 'Failed', 'Retry failed'], ['Asia Select', '28', '2', '26', '0', '17 Jul · 12:30', 'Ready', 'Post ready']].map(r => [r[0], ...r.slice(1, 6), <Badge key="s" value={postingActions[r[0]] || r[6]} />, <button key="a" type="button" onClick={() => setPostingActions(current => ({ ...current, [r[0]]: r[7] === 'View log' ? 'Log viewed' : 'Posted' }))} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px]">{postingActions[r[0]] || r[7]}</button>])} /></Card>}
    {tab === 'Reversals' && <Card title="Reversal register" subtitle="Approved counter-entries retain the original event audit trail"><Table headers={['Reversal', 'Original event', 'Type', 'Reason', 'Requested by', 'Timestamp', 'Status']} rows={reversalRows.map(r => [r.id, r.original, r.type, r.reason, r.by, r.at, <Badge key="s" value={r.status} />])} /></Card>}
    {tab === 'Ledger Exports' && <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]"><section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(145deg,#142030,#0d1623)] p-5"><h2 className="text-[12px] font-semibold">Generate ledger export</h2><p className="text-[9px] text-[#718096]">Create a local export package</p><div className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-[10px]">Format</span><Drop value={exportFormat} options={['CSV · General ledger', 'Sage 300', 'Pastel Accounting', 'QuickBooks']} onChange={setExportFormat} /></label><label className="block"><span className="mb-2 block text-[10px]">Period</span><input type="month" defaultValue="2026-07" className="h-9 w-full rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px]" /></label><label className="block"><span className="mb-2 block text-[10px]">Portfolio</span><Drop value={portfolio} options={['All portfolios', 'Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select']} onChange={setPortfolio} /></label></div><button onClick={generateExport} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2f87fa] text-[10px] font-semibold"><Download className="h-3.5 w-3.5" />Generate export</button></section><Card title="Ledger export history" subtitle="Generated files and download status"><Table headers={['Export', 'Format', 'Period', 'Portfolio', 'Lines', 'Generated by', 'Generated at', 'Status', '']} rows={exportRows.map(r => [r.id, r.format, r.period, r.portfolio, String(r.lines), r.by, r.at, <Badge key="s" value={downloaded.includes(r.id) ? 'Downloaded' : r.status} />, <button key="d" type="button" aria-label={`Download ${r.id}`} onClick={() => setDownloaded(current => [...current, r.id])} className="rounded-full border border-white/10 p-2"><Download className="h-3 w-3" /></button>])} /></Card></div>}
  </div>

  {reverseEvent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setReverseEvent(null)}><div onMouseDown={e => e.stopPropagation()} className="w-full max-w-lg rounded-[24px] border border-white/10 bg-[#111a28]"><div className="flex items-center justify-between border-b border-white/[.07] p-5"><div><h2 className="text-sm font-semibold">Reverse accounting event</h2><p className="mt-1 font-mono text-[10px] text-[#7890ad]">{reverseEvent.id} · {reverseEvent.type}</p></div><button onClick={() => setReverseEvent(null)} className="rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></div><div className="p-5"><div className="rounded-2xl bg-[#09111d] p-4 text-[10px] text-[#96a3b4]">A balanced counter-entry will be created. The original event remains immutable and linked in the audit trail.</div><label className="mt-4 block"><span className="mb-2 block text-[10px]">Reversal reason</span><textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="w-full rounded-2xl border border-[#354257] bg-[#0b1420] p-3 text-[10px] outline-none focus:border-[#2f87fa]" /></label></div><div className="flex justify-end gap-2 border-t border-white/[.07] p-4"><button onClick={() => setReverseEvent(null)} className="rounded-full border border-white/10 px-4 py-2 text-[10px]">Cancel</button><button disabled={!reason} onClick={confirmReversal} className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-[10px] font-semibold disabled:opacity-40"><RotateCcw className="h-3 w-3" />Create reversal</button></div></div></div>}
  </main>
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="min-w-0 overflow-visible rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]"><div className="border-b border-white/[.06] p-4"><h2 className="text-[12px] font-semibold">{title}</h2><p className="text-[9px] text-[#718096]">{subtitle}</p></div>{children}</section> }
function Toolbar({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap justify-end gap-2 border-b border-white/[.05] p-3">{children}</div> }
function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) { return <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[10px]"><thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]"><tr>{headers.map((h, i) => <th key={`${h}-${i}`} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-white/[.045]">{rows.map((row, i) => <tr key={i} className="transition hover:bg-white/[.035]">{row.map((cell, j) => <td key={j} className="px-4 py-3 text-[#c5cfdb] first:font-mono first:text-[#68a9ff]">{cell}</td>)}</tr>)}</tbody></table></div> }
