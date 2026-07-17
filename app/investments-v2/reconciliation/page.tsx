'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, FileUp, Search, ShieldCheck, X } from 'lucide-react'

const tabs = ['Cash', 'Holdings', 'Trade', 'Exceptions']
const statuses = ['All statuses', 'Matched', 'Unmatched', 'Partially Matched', 'Investigating', 'Resolved', 'Written Off', 'Escalated']
const batches = [
  { id: 'REC-260717-04', type: 'Cash', source: 'Citi Custody', at: '17 Jul 2026 · 12:42', items: 248, exceptions: 3, status: 'Investigating' },
  { id: 'REC-260717-03', type: 'Holdings', source: 'BNY Mellon', at: '17 Jul 2026 · 11:05', items: 184, exceptions: 1, status: 'Partially Matched' },
  { id: 'REC-260717-02', type: 'Trade', source: 'Bloomberg AIM', at: '17 Jul 2026 · 09:30', items: 92, exceptions: 0, status: 'Matched' },
  { id: 'REC-260716-08', type: 'Cash', source: 'HSBC', at: '16 Jul 2026 · 17:52', items: 61, exceptions: 2, status: 'Resolved' },
]
const reconItems = [
  { id: 'RCI-84218', type: 'Cash', portfolio: 'Equity World', reference: 'CITI-USD-8492', internal: '$18,200,000.00', external: '$18,200,000.00', variance: '$0.00', status: 'Matched', owner: 'System' },
  { id: 'RCI-84217', type: 'Cash', portfolio: 'Multi Asset', reference: 'BNY-USD-5104', internal: '$11,200,000.00', external: '$11,195,000.00', variance: '$5,000.00', status: 'Unmatched', owner: 'T. Ncube' },
  { id: 'RCI-84216', type: 'Holdings', portfolio: 'Asia Select', reference: '0700:HK', internal: '84,200', external: '84,000', variance: '200', status: 'Partially Matched', owner: 'R. Moyo' },
  { id: 'RCI-84215', type: 'Trade', portfolio: 'Fixed Income', reference: 'TRD-93882', internal: '$2,450,000.00', external: '$2,450,000.00', variance: '$0.00', status: 'Resolved', owner: 'A. Dube' },
  { id: 'RCI-84214', type: 'Cash', portfolio: 'Asia Select', reference: 'HSBC-HKD-1022', internal: 'HK$4,200,000', external: 'HK$4,210,000', variance: '-HK$10,000', status: 'Escalated', owner: 'J. Moyo' },
  { id: 'RCI-84213', type: 'Holdings', portfolio: 'Equity World', reference: 'MSFT:US', internal: '42,000', external: '41,950', variance: '50', status: 'Written Off', owner: 'S. Patel' },
]

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return <div ref={ref} className="relative">
    <button type="button" onClick={() => setOpen(!open)} className="flex h-8 min-w-[132px] items-center justify-between gap-3 rounded-full border border-[#334155] bg-[#101927] px-3 text-[10px] text-[#cbd5e1] transition hover:border-[#52637a]">
      <span className="truncate">{value}</span><ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="absolute right-0 z-50 mt-1.5 min-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">
      {options.map(option => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }} className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] ${option === value ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[.07]'}`}>
        {option}{option === value && <Check className="ml-3 h-3 w-3" />}
      </button>)}
    </div>}
  </div>
}

function Status({ value }: { value: string }) {
  const tone = value === 'Matched' || value === 'Resolved' ? 'bg-emerald-400/10 text-emerald-300' : value === 'Unmatched' || value === 'Escalated' ? 'bg-rose-400/10 text-rose-300' : value === 'Written Off' ? 'bg-slate-400/10 text-slate-300' : 'bg-amber-400/10 text-amber-300'
  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-medium ${tone}`}>{value}</span>
}

export default function ReconciliationPage() {
  const [batchRows, setBatchRows] = useState(batches)
  const [activeTab, setActiveTab] = useState('Cash')
  const [status, setStatus] = useState('All statuses')
  const [portfolio, setPortfolio] = useState('All portfolios')
  const [search, setSearch] = useState('')
  const [selectedBatch, setSelectedBatch] = useState(batches[0].id)
  const [selectedItem, setSelectedItem] = useState<(typeof reconItems)[number] | null>(null)
  const [resolution, setResolution] = useState('Resolved')
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState('')
  const [resolutionLog, setResolutionLog] = useState<Record<string, { status: string; user: string; timestamp: string; reason: string; evidence: string }>>({})

  const filtered = useMemo(() => reconItems.filter(item =>
    (activeTab === 'Exceptions' ? item.status !== 'Matched' : item.type === activeTab) &&
    (status === 'All statuses' || item.status === status) &&
    (portfolio === 'All portfolios' || item.portfolio === portfolio) &&
    (!search || `${item.id} ${item.reference} ${item.portfolio}`.toLowerCase().includes(search.toLowerCase()))
  ), [activeTab, portfolio, search, status])

  const submitResolution = () => {
    if (!selectedItem || !reason.trim()) return
    setResolutionLog(current => ({
      ...current,
      [selectedItem.id]: {
        status: resolution,
        user: 'J. Moyo (you)',
        timestamp: '17 Jul 2026 · 13:49 CAT',
        reason: reason.trim(),
        evidence: evidence.trim() || 'No supporting reference supplied',
      },
    }))
    setSelectedItem(null); setReason(''); setEvidence('')
  }

  const createBatch = () => {
    const next = {
      id: `REC-260717-${String(batchRows.length + 1).padStart(2, '0')}`,
      type: activeTab === 'Exceptions' ? 'Cash' : activeTab,
      source: 'Manual operations upload',
      at: '17 Jul 2026 · 13:52',
      items: 0,
      exceptions: 0,
      status: 'Investigating',
    }
    setBatchRows(current => [next, ...current])
    setSelectedBatch(next.id)
  }

  return <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
    <div className="mx-auto max-w-[1600px] space-y-4">
      <section className="rounded-2xl border border-white/[.04] bg-[linear-gradient(120deg,#182434_0%,#101a29_55%,#0b1421_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div><p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Operations control</p><h1 className="mt-1 text-lg font-semibold">Reconciliation workspace</h1><p className="mt-1 text-[11px] text-[#8f9caf]">Compare internal books against custodian, broker and trade sources.</p></div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
            {[['Matched today', '98.4%', 'text-emerald-300'], ['Open breaks', '6', 'text-amber-300'], ['Escalated', '1', 'text-rose-300']].map(([label, value, tone]) => <div key={label} className="rounded-xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3"><p className="text-[9px] text-[#728197]">{label}</p><p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p></div>)}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-white/[.05] bg-[#090f18]/70 p-1">
          {tabs.map(tab => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${activeTab === tab ? 'bg-white text-[#101722] shadow' : 'text-[#8e9bad] hover:bg-white/[.06] hover:text-white'}`}>{tab}{tab === 'Exceptions' && <span className="ml-2 rounded-full bg-rose-500/20 px-1.5 text-rose-300">6</span>}</button>)}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/[.04] bg-[linear-gradient(145deg,#142030,#0d1623)] p-4">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-[12px] font-semibold">Recent batches</h2><p className="text-[9px] text-[#718096]">Select a run to inspect</p></div><button type="button" onClick={createBatch} className="rounded-full bg-[#2f87fa] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#2277e6]">New batch</button></div>
          <div className="space-y-2">{batchRows.map(batch => <button key={batch.id} type="button" onClick={() => { setSelectedBatch(batch.id); setActiveTab(batch.type) }} className={`w-full rounded-xl border p-3 text-left transition ${selectedBatch === batch.id ? 'border-[#2f87fa]/60 bg-[#2f87fa]/10' : 'border-white/[.05] bg-[#09111d]/55 hover:border-white/15'}`}>
            <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-[#dbe5f2]">{batch.id}</span><Status value={batch.status} /></div>
            <p className="mt-2 text-[10px] text-[#9ca9ba]">{batch.type} · {batch.source}</p><div className="mt-2 flex justify-between text-[9px] text-[#64748b]"><span>{batch.at}</span><span>{batch.items} items · {batch.exceptions} breaks</span></div>
          </button>)}</div>
        </aside>

        <div className="min-w-0 rounded-2xl border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
          <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-[12px] font-semibold">{activeTab} reconciliation items</h2><p className="text-[9px] text-[#718096]">{filtered.length} visible records · Batch {selectedBatch}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 items-center gap-2 rounded-full border border-[#334155] bg-[#101927] px-3"><Search className="h-3 w-3 text-[#718096]" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search reference" className="w-28 bg-transparent text-[10px] outline-none placeholder:text-[#66758a]" /></div>
              <Dropdown value={portfolio} options={['All portfolios', 'Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select']} onChange={setPortfolio} />
              <Dropdown value={status} options={statuses} onChange={setStatus} />
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-[10px]">
            <thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]"><tr>{['Item ID', 'Portfolio', 'Reference', 'Internal', 'External', 'Variance', 'Status', 'Owner', ''].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/[.045]">{filtered.map(item => <tr key={item.id} onClick={() => setSelectedItem(item)} className={`cursor-pointer transition hover:bg-white/[.035] ${selectedItem?.id === item.id ? 'bg-[#2f87fa]/10' : ''}`}>
              <td className="px-4 py-3 font-mono text-[#68a9ff]">{item.id}</td><td className="px-4 py-3 text-[#c4cedb]">{item.portfolio}</td><td className="px-4 py-3 font-mono text-[#94a3b8]">{item.reference}</td><td className="px-4 py-3 font-mono">{item.internal}</td><td className="px-4 py-3 font-mono">{item.external}</td><td className={`px-4 py-3 font-mono ${item.variance === '$0.00' ? 'text-emerald-300' : 'text-rose-300'}`}>{item.variance}</td><td className="px-4 py-3"><Status value={resolutionLog[item.id]?.status || item.status} /></td><td className="px-4 py-3 text-[#8795a8]">{item.owner}</td><td className="px-4 py-3"><button type="button" onClick={event => { event.stopPropagation(); setSelectedItem(item) }} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] hover:bg-white/10">Review</button></td>
            </tr>)}</tbody>
          </table></div>
        </div>
      </section>
    </div>

    {selectedItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedItem(null)}>
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#111a28] shadow-2xl" onMouseDown={event => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[.07] p-5"><div><h2 className="text-sm font-semibold">Resolve reconciliation item</h2><p className="mt-1 font-mono text-[10px] text-[#7890ad]">{selectedItem.id} · {selectedItem.reference}</p></div><button type="button" onClick={() => setSelectedItem(null)} className="rounded-full p-2 text-[#8090a5] hover:bg-white/10"><X className="h-4 w-4" /></button></div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#09111d] p-4 text-[10px]"><div><span className="text-[#6f7e92]">Assigned user</span><p className="mt-1 text-[#d8e0eb]">{resolutionLog[selectedItem.id]?.user || 'J. Moyo (you)'}</p></div><div><span className="text-[#6f7e92]">Timestamp</span><p className="mt-1 text-[#d8e0eb]">{resolutionLog[selectedItem.id]?.timestamp || '17 Jul 2026 · 13:49 CAT'}</p></div></div>
          {resolutionLog[selectedItem.id] && <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-[10px] text-[#aab6c5]"><p className="font-medium text-emerald-300">Latest recorded resolution</p><p className="mt-2">{resolutionLog[selectedItem.id].reason}</p><p className="mt-1 text-[9px] text-[#718096]">Evidence: {resolutionLog[selectedItem.id].evidence}</p></div>}
          <label className="block"><span className="mb-2 block text-[10px] text-[#a9b5c4]">Resolution outcome</span><Dropdown value={resolution} options={['Resolved', 'Written Off', 'Escalated', 'Investigating']} onChange={setResolution} /></label>
          <label className="block"><span className="mb-2 block text-[10px] text-[#a9b5c4]">Reason <span className="text-rose-300">*</span></span><textarea value={reason} onChange={event => setReason(event.target.value)} rows={3} placeholder="Explain the variance and resolution decision" className="w-full rounded-xl border border-[#334155] bg-[#0b1420] p-3 text-[11px] outline-none focus:border-[#2f87fa]" /></label>
          <label className="block"><span className="mb-2 block text-[10px] text-[#a9b5c4]">Supporting evidence</span><div className="flex h-10 items-center gap-2 rounded-full border border-dashed border-[#46566d] px-4 text-[10px] text-[#8391a4]"><FileUp className="h-3.5 w-3.5" /><input value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Paste evidence reference or note" className="flex-1 bg-transparent outline-none" /></div></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[.07] p-4"><button type="button" onClick={() => setSelectedItem(null)} className="rounded-full border border-white/10 px-4 py-2 text-[10px] hover:bg-white/5">Cancel</button><button type="button" disabled={!reason.trim()} onClick={submitResolution} className="flex items-center gap-2 rounded-full bg-[#2f87fa] px-5 py-2 text-[10px] font-semibold text-white disabled:opacity-40"><ShieldCheck className="h-3.5 w-3.5" />Record resolution</button></div>
      </div>
    </div>}
  </main>
}
