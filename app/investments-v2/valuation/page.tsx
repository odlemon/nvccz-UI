'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Play, RefreshCw, ShieldAlert, X } from 'lucide-react'

const tabs = ['NAV Runs', 'P&L Runs', 'Price Validation', 'FX Conversion', 'Valuation Exceptions']
const navRuns = [
  { id: 'NAV-0717-06', portfolio: 'Equity World', asOf: '17 Jul 2026', method: 'WAC', prices: 'Bloomberg BVAL', fx: 'Reuters WM/Refinitiv', nav: '$142,852,410', pnl: '+$684,220', exceptions: 0, status: 'Completed' },
  { id: 'NAV-0717-05', portfolio: 'Multi Asset', asOf: '17 Jul 2026', method: 'FIFO', prices: 'Approved close', fx: 'Reuters WM/Refinitiv', nav: '$87,321,904', pnl: '-$92,104', exceptions: 2, status: 'Completed' },
  { id: 'NAV-0717-04', portfolio: 'Fixed Income', asOf: '17 Jul 2026', method: 'Amortised cost', prices: 'Bloomberg BVAL', fx: 'Central bank', nav: '$56,104,822', pnl: '+$31,882', exceptions: 1, status: 'Completed' },
  { id: 'NAV-0716-09', portfolio: 'Asia Select', asOf: '16 Jul 2026', method: 'WAC', prices: 'Approved close', fx: 'Reuters WM/Refinitiv', nav: '$33,447,200', pnl: '+$214,006', exceptions: 0, status: 'Completed' },
]
const priceRows = [
  { instrument: 'MSFT US', source: 'Bloomberg BVAL', received: '$512.44', approved: '$512.44', age: '00:08', variance: '0.00%', status: 'Approved' },
  { instrument: '0700 HK', source: 'Refinitiv', received: 'HK$504.50', approved: 'HK$503.80', age: '00:14', variance: '0.14%', status: 'Review' },
  { instrument: 'ZIM 8.5 2034', source: 'Bloomberg BVAL', received: '$97.21', approved: '$96.88', age: '01:42', variance: '0.34%', status: 'Override' },
  { instrument: 'TSLA US', source: 'Exchange close', received: '$321.67', approved: '$321.67', age: '00:12', variance: '0.00%', status: 'Approved' },
]
const fxRows = [
  { pair: 'USD/ZAR', source: 'Reuters WM/Refinitiv', market: '17.8642', approved: '17.8642', timestamp: '17 Jul · 12:00', status: 'Approved' },
  { pair: 'GBP/USD', source: 'Reuters WM/Refinitiv', market: '1.3428', approved: '1.3428', timestamp: '17 Jul · 12:00', status: 'Approved' },
  { pair: 'USD/JPY', source: 'Central bank', market: '149.2200', approved: '149.1800', timestamp: '17 Jul · 11:55', status: 'Override' },
]
const exceptions = [
  { id: 'VEX-1804', instrument: '0700 HK', portfolio: 'Asia Select', issue: 'Price moved beyond 12% tolerance', impact: '$82,100', status: 'Open' },
  { id: 'VEX-1803', instrument: 'USD/JPY', portfolio: 'Multi Asset', issue: 'Reference rate differs from approved source', impact: '$14,820', status: 'Investigating' },
  { id: 'VEX-1802', instrument: 'ZIM 8.5 2034', portfolio: 'Fixed Income', issue: 'Stale price older than policy threshold', impact: '$41,002', status: 'Open' },
]

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])
  return <div ref={ref} className="relative"><button type="button" onClick={() => setOpen(!open)} className="flex h-9 w-full min-w-[150px] items-center justify-between rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px] text-[#d4dbe5] hover:border-[#52637a]">{value}<ChevronDown className={`h-3 w-3 ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="absolute z-50 mt-1.5 min-w-full rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">{options.map(o => <button key={o} onClick={() => { onChange(o); setOpen(false) }} className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] ${o === value ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[.07]'}`}>{o}{o === value && <Check className="ml-3 h-3 w-3" />}</button>)}</div>}</div>
}
function Badge({ value }: { value: string }) {
  const tone = ['Completed', 'Approved', 'Resolved'].includes(value) ? 'bg-emerald-400/10 text-emerald-300' : value === 'Running' ? 'bg-blue-400/10 text-blue-300' : value === 'Pending' ? 'bg-slate-400/10 text-slate-300' : 'bg-amber-400/10 text-amber-300'
  return <span className={`rounded-full px-2 py-1 text-[9px] ${tone}`}>{value}</span>
}

export default function ValuationPage() {
  const [tab, setTab] = useState('NAV Runs')
  const [portfolio, setPortfolio] = useState('Equity World')
  const [method, setMethod] = useState('Weighted average cost')
  const [priceSource, setPriceSource] = useState('Bloomberg BVAL')
  const [fxSource, setFxSource] = useState('Reuters WM/Refinitiv')
  const [runState, setRunState] = useState<'idle' | 'pending' | 'running' | 'completed'>('idle')
  const [modal, setModal] = useState<(typeof exceptions)[number] | null>(null)
  const [outcome, setOutcome] = useState('Approve override')
  const [override, setOverride] = useState('')
  const [reason, setReason] = useState('')
  const [decisions, setDecisions] = useState<Record<string, string>>({})

  const run = () => {
    setRunState('pending')
    window.setTimeout(() => setRunState('running'), 600)
    window.setTimeout(() => setRunState('completed'), 2400)
  }

  const recordDecision = () => {
    if (!modal || !reason.trim() || !override.trim()) return
    const status = outcome === 'Escalate' ? 'Escalated' : outcome === 'Reject valuation' ? 'Rejected' : 'Resolved'
    setDecisions(current => ({ ...current, [modal.id]: status }))
    setModal(null)
    setReason('')
    setOverride('')
  }

  return <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
    <div className="mx-auto max-w-[1600px] space-y-4">
      <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(120deg,#182434,#101a29_58%,#0b1421)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Investment operations</p><h1 className="mt-1 text-lg font-semibold">Valuation control centre</h1><p className="mt-1 text-[11px] text-[#8f9caf]">Run reproducible NAV and P&amp;L calculations against approved market references.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Total NAV', '$319.7M'], ['Daily P&L', '+$838K'], ['Validated prices', '99.2%'], ['Open exceptions', '3']].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3"><p className="text-[9px] text-[#728197]">{label}</p><p className="mt-1 text-[15px] font-semibold">{value}</p></div>)}</div></div>
        <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-white/[.05] bg-[#090f18]/70 p-1">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${tab === t ? 'bg-white text-[#101722]' : 'text-[#8e9bad] hover:bg-white/[.06] hover:text-white'}`}>{t}{t === 'Valuation Exceptions' && <span className="ml-2 rounded-full bg-rose-500/20 px-1.5 text-rose-300">3</span>}</button>)}</div>
      </section>

      {tab === 'NAV Runs' && <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(145deg,#142030,#0d1623)] p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-[12px] font-semibold">New valuation run</h2><p className="text-[9px] text-[#718096]">Required run inputs</p></div><span className="rounded-full bg-blue-400/10 px-2 py-1 text-[9px] text-blue-300">NAV + P&amp;L</span></div>
          <div className="mt-5 space-y-4">{[
            ['Portfolio', portfolio, ['Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select'], setPortfolio],
            ['Cost basis methodology', method, ['Weighted average cost', 'FIFO', 'LIFO', 'Amortised cost'], setMethod],
            ['Approved price reference', priceSource, ['Bloomberg BVAL', 'Approved close', 'Refinitiv', 'Exchange close'], setPriceSource],
            ['Approved FX reference', fxSource, ['Reuters WM/Refinitiv', 'Central bank', 'Bloomberg BFIX'], setFxSource],
          ].map(([label, value, options, setter]) => <label key={label as string} className="block"><span className="mb-2 block text-[10px] text-[#9ba8b8]">{label as string}</span><Dropdown value={value as string} options={options as string[]} onChange={setter as (v: string) => void} /></label>)}
            <label className="block"><span className="mb-2 block text-[10px] text-[#9ba8b8]">Valuation date &amp; cut-off</span><input type="datetime-local" defaultValue="2026-07-17T12:00" className="h-9 w-full rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px] outline-none focus:border-[#2f87fa]" /></label>
          </div>
          <div className="mt-5 rounded-2xl border border-white/[.05] bg-[#09111d] p-4 text-[10px] text-[#8290a4]"><p className="flex justify-between"><span>Position snapshot</span><strong className="text-[#d6deea]">12:00 CAT · locked</strong></p><p className="mt-2 flex justify-between"><span>Base currency</span><strong className="text-[#d6deea]">USD</strong></p><p className="mt-2 flex justify-between"><span>Tolerance policy</span><strong className="text-[#d6deea]">Standard · 5%</strong></p></div>
          <button type="button" disabled={runState === 'pending' || runState === 'running'} onClick={run} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2f87fa] text-[10px] font-semibold text-white transition hover:bg-[#2277e6] disabled:opacity-60">{runState === 'running' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : runState === 'completed' ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{runState === 'pending' ? 'Queued — pending worker' : runState === 'running' ? 'Running valuation…' : runState === 'completed' ? 'Run completed' : 'Run valuation'}</button>
          {runState === 'completed' && <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-[10px]"><div className="flex items-center justify-between"><span className="text-emerald-300">NAV-0717-07 completed locally</span><Badge value="Completed" /></div><div className="mt-3 grid grid-cols-2 gap-3 text-[#8290a4]"><p>NAV output<br /><strong className="text-[#e1e8f0]">$143,018,904</strong></p><p>P&amp;L output<br /><strong className="text-emerald-300">+$166,494</strong></p><p>Methodology<br /><strong className="text-[#e1e8f0]">{method}</strong></p><p>Exceptions<br /><strong className="text-amber-300">1 validation warning</strong></p></div></div>}
        </section>
        <section className="min-w-0 rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)] overflow-hidden">
          <div className="border-b border-white/[.06] p-4"><h2 className="text-[12px] font-semibold">NAV run history</h2><p className="text-[9px] text-[#718096]">Inputs, outputs and exception counts for each calculation</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[930px] text-left text-[10px]"><thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]"><tr>{['Run', 'Portfolio', 'As of', 'Method', 'Price / FX references', 'NAV output', 'P&L output', 'Exceptions', 'Status'].map(x => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody className="divide-y divide-white/[.045]">{navRuns.map(row => <tr key={row.id} className="transition hover:bg-white/[.035]"><td className="px-4 py-3 font-mono text-[#68a9ff]">{row.id}</td><td className="px-4 py-3">{row.portfolio}</td><td className="px-4 py-3 text-[#8290a4]">{row.asOf}</td><td className="px-4 py-3">{row.method}</td><td className="px-4 py-3 text-[#8290a4]">{row.prices}<br /><span className="text-[9px]">{row.fx}</span></td><td className="px-4 py-3 font-mono">{row.nav}</td><td className={`px-4 py-3 font-mono ${row.pnl.startsWith('+') ? 'text-emerald-300' : 'text-rose-300'}`}>{row.pnl}</td><td className="px-4 py-3 text-center">{row.exceptions}</td><td className="px-4 py-3"><Badge value={row.status} /></td></tr>)}</tbody></table></div>
        </section>
      </div>}

      {tab === 'P&L Runs' && <TableCard title="P&L calculation runs" subtitle="Realised and unrealised output by portfolio" headers={['Run', 'Portfolio', 'Method', 'Opening value', 'Cash movement', 'Realised', 'Unrealised', 'Total P&L', 'Status']} rows={navRuns.map(r => [r.id.replace('NAV', 'PNL'), r.portfolio, r.method, r.nav, '$120,000', r.pnl, '+$184,224', r.pnl, <Badge key="b" value="Completed" />])} />}
      {tab === 'Price Validation' && <TableCard title="Approved price references" subtitle="Validation against tolerance, freshness and source policy" headers={['Instrument', 'Source', 'Received price', 'Approved price', 'Age', 'Variance', 'Status', '']} rows={priceRows.map(r => [r.instrument, r.source, r.received, r.approved, r.age, r.variance, <Badge key="b" value={r.status} />, <button key="a" onClick={() => setModal(exceptions.find(e => e.instrument === r.instrument) || exceptions[0])} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] hover:bg-white/10">Review</button>])} />}
      {tab === 'FX Conversion' && <TableCard title="Approved FX references" subtitle="Rates used to translate positions into portfolio base currency" headers={['Currency pair', 'Approved source', 'Market rate', 'Approved rate', 'Timestamp', 'Status', '']} rows={fxRows.map(r => [r.pair, r.source, r.market, r.approved, r.timestamp, <Badge key="b" value={r.status} />, <button key="a" onClick={() => setModal(exceptions[1])} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] hover:bg-white/10">Inspect</button>])} />}
      {tab === 'Valuation Exceptions' && <TableCard title="Valuation exceptions" subtitle="Items requiring resolution or controlled override" headers={['Exception', 'Instrument', 'Portfolio', 'Issue', 'Estimated NAV impact', 'Status', '']} rows={exceptions.map(r => [r.id, r.instrument, r.portfolio, r.issue, r.impact, <Badge key="b" value={decisions[r.id] || r.status} />, <button key="a" onClick={() => setModal(r)} className="rounded-full bg-[#2f87fa] px-3 py-1.5 text-[9px] text-white">{decisions[r.id] ? 'Review decision' : 'Resolve'}</button>])} />}
    </div>

    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setModal(null)}><div onMouseDown={e => e.stopPropagation()} className="w-full max-w-xl rounded-[24px] border border-white/10 bg-[#111a28] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[.07] p-5"><div><h2 className="text-sm font-semibold">Resolve or override exception</h2><p className="mt-1 font-mono text-[10px] text-[#7890ad]">{modal.id} · {modal.instrument}</p></div><button onClick={() => setModal(null)} className="rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></div><div className="space-y-4 p-5"><div className="rounded-2xl bg-[#09111d] p-4 text-[10px] text-[#96a3b4]"><ShieldAlert className="mb-2 h-4 w-4 text-amber-300" />{modal.issue}<p className="mt-2 text-[#d4dce7]">Estimated NAV impact: {modal.impact}</p>{decisions[modal.id] && <p className="mt-2 text-emerald-300">Current local decision: {decisions[modal.id]}</p>}</div><label className="block"><span className="mb-2 block text-[10px]">Decision</span><Dropdown value={outcome} options={['Approve override', 'Resolve with reference', 'Reject valuation', 'Escalate']} onChange={setOutcome} /></label><label className="block"><span className="mb-2 block text-[10px]">Override value / approved reference</span><input value={override} onChange={e => setOverride(e.target.value)} placeholder="e.g. 503.80 · Bloomberg close" className="h-10 w-full rounded-full border border-[#354257] bg-[#0b1420] px-4 text-[10px] outline-none focus:border-[#2f87fa]" /></label><label className="block"><span className="mb-2 block text-[10px]">Reason</span><textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#354257] bg-[#0b1420] p-3 text-[10px] outline-none focus:border-[#2f87fa]" /></label></div><div className="flex justify-end gap-2 border-t border-white/[.07] p-4"><button onClick={() => setModal(null)} className="rounded-full border border-white/10 px-4 py-2 text-[10px]">Cancel</button><button disabled={!reason || !override} onClick={recordDecision} className="rounded-full bg-[#2f87fa] px-5 py-2 text-[10px] font-semibold disabled:opacity-40">Record decision</button></div></div></div>}
  </main>
}

function TableCard({ title, subtitle, headers, rows }: { title: string; subtitle: string; headers: string[]; rows: React.ReactNode[][] }) {
  return <section className="overflow-hidden rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]"><div className="border-b border-white/[.06] p-4"><h2 className="text-[12px] font-semibold">{title}</h2><p className="text-[9px] text-[#718096]">{subtitle}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-[10px]"><thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]"><tr>{headers.map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-white/[.045]">{rows.map((row, i) => <tr key={i} className="transition hover:bg-white/[.035]">{row.map((cell, j) => <td key={j} className="px-4 py-3 text-[#c5cfdb] first:font-mono first:text-[#68a9ff]">{cell}</td>)}</tr>)}</tbody></table></div></section>
}
