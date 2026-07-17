'use client'

import { useMemo, useState } from 'react'
import { Edit3, Plus, Search } from 'lucide-react'
import { buttonClass, Field, inputClass, Metric, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { cn } from '@/lib/utils'

type Allocation = { dimension: 'Asset class' | 'Security' | 'Sector' | 'Currency'; asset: string; target: number; live: number }
type Model = { id: number; name: string; strategy: string; risk: string; mandate: string; portfolio: string; allocations: Allocation[]; updated: string }
const seed: Model[] = [
  { id: 1, name: 'Balanced ZSE Core', strategy: 'Moderate growth', risk: 'Moderate', mandate: 'Balanced Fund Mandate 2026', portfolio: 'Arcus Balanced Fund', updated: '17 Jul 2026', allocations: [
    { dimension: 'Asset class', asset: 'Listed equity', target: 70, live: 72.4 }, { dimension: 'Asset class', asset: 'Cash', target: 10, live: 11.5 },
    { dimension: 'Security', asset: 'DELTA', target: 18, live: 21.4 }, { dimension: 'Security', asset: 'INNSCOR', target: 16, live: 13.2 }, { dimension: 'Security', asset: 'ECO', target: 14, live: 14.6 }, { dimension: 'Security', asset: 'CBZ', target: 12, live: 9.8 },
    { dimension: 'Sector', asset: 'Consumer Staples', target: 28, live: 31.6 }, { dimension: 'Sector', asset: 'Financials', target: 18, live: 15.2 },
    { dimension: 'Currency', asset: 'ZWL', target: 80, live: 78.2 }, { dimension: 'Currency', asset: 'USD', target: 20, live: 21.8 },
  ] },
  { id: 2, name: 'ZSE Growth Leaders', strategy: 'High growth', risk: 'Aggressive', mandate: 'Growth Equity Mandate', portfolio: 'Growth Equity Fund', updated: '16 Jul 2026', allocations: [
    { dimension: 'Asset class', asset: 'Listed equity', target: 90, live: 92.1 }, { dimension: 'Security', asset: 'INNSCOR', target: 25, live: 28.1 }, { dimension: 'Security', asset: 'DELTA', target: 20, live: 18.4 }, { dimension: 'Sector', asset: 'Consumer Staples', target: 40, live: 44.2 }, { dimension: 'Currency', asset: 'ZWL', target: 85, live: 87.3 },
  ] },
]

export default function ModelsPage() {
  const [models, setModels] = useState(seed)
  const [activeId, setActiveId] = useState(1)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Model | null | undefined>()
  const [name, setName] = useState('')
  const [strategy, setStrategy] = useState('Moderate growth')
  const [risk, setRisk] = useState('Moderate')
  const [mandate, setMandate] = useState('Balanced Fund Mandate 2026')
  const [portfolio, setPortfolio] = useState('Arcus Balanced Fund')
  const [targets, setTargets] = useState('DELTA 20, INNSCOR 20, ECO 15, CBZ 15, Cash 10')
  const model = models.find((item) => item.id === activeId) || models[0]
  const visible = useMemo(() => models.filter((item) => `${item.name} ${item.portfolio}`.toLowerCase().includes(query.toLowerCase())), [models, query])
  const open = (item: Model | null) => {
    setEditing(item)
    setName(item?.name || '')
    setStrategy(item?.strategy || 'Moderate growth')
    setRisk(item?.risk || 'Moderate')
    setMandate(item?.mandate || 'Balanced Fund Mandate 2026')
    setPortfolio(item?.portfolio || 'Arcus Balanced Fund')
    setTargets(item ? item.allocations.map((allocation) => `${allocation.asset} ${allocation.target}`).join(', ') : 'DELTA 20, INNSCOR 20, ECO 15, CBZ 15, Cash 10')
  }
  const save = () => {
    if (!name.trim()) return
    const allocations = targets.split(',').map((entry, index) => {
      const parts = entry.trim().split(/\s+/)
      const weight = Number(parts.pop()) || 0
      return { dimension: (editing?.allocations[index]?.dimension ?? 'Security') as Allocation['dimension'], asset: parts.join(' ') || `Sleeve ${index + 1}`, target: weight, live: editing?.allocations[index]?.live ?? 8 + index * 2.7 }
    })
    if (editing) setModels((items) => items.map((item) => item.id === editing.id ? { ...item, name, strategy, risk, mandate, portfolio, allocations, updated: 'Just now' } : item))
    else {
      const created = { id: Date.now(), name, strategy, risk, mandate, portfolio, allocations, updated: 'Just now' }
      setModels((items) => [...items, created])
      setActiveId(created.id)
    }
    setEditing(undefined)
  }
  const maxDrift = Math.max(...model.allocations.map((allocation) => Math.abs(allocation.live - allocation.target)))

  return (
    <OrdersPage title="Model portfolios" description="Compare live portfolios to target weights and turn drift into rebalance recommendations." actions={<button className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={() => open(null)}><Plus className="h-3.5 w-3.5" /> New model</button>}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Active models" value={String(models.length)} /><Metric label="Linked portfolios" value={String(new Set(models.map((item) => item.portfolio)).size)} tone="text-blue-300" /><Metric label="Largest drift" value={`${maxDrift.toFixed(1)}%`} tone="text-amber-300" /><Metric label="Recommendations" value={String(model.allocations.filter((item) => Math.abs(item.live - item.target) >= 1).length)} tone="text-violet-300" /></div>
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <OrdersCard title="Models" eyebrow="Local workspace" actions={<div className="relative mr-3"><Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" /><input className={cn(inputClass, 'w-36 pl-8')} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></div>}>
          <div className="space-y-2 p-3">{visible.map((item) => <button key={item.id} onClick={() => setActiveId(item.id)} className={cn('w-full rounded-full border p-3 text-left transition', item.id === activeId ? 'border-blue-400/40 bg-blue-500/10' : 'border-white/[0.06] bg-[#070d17] hover:border-blue-400/25')}><div className="flex justify-between gap-2"><span className="text-[11px] font-semibold">{item.name}</span><Pill tone="green">Active</Pill></div><p className="mt-2 text-[9px] text-slate-500">{item.strategy} · {item.portfolio}</p></button>)}</div>
        </OrdersCard>
        <div className="space-y-4">
          <OrdersCard title={model.name} eyebrow={`${model.portfolio} · updated ${model.updated}`} actions={<button className={buttonClass} onClick={() => open(model)}><Edit3 className="h-3.5 w-3.5" /> Edit targets</button>}>
            <div className="grid gap-3 border-b border-white/[0.06] p-4 sm:grid-cols-3"><div className="rounded-[16px] bg-black/15 p-3"><p className="text-[9px] uppercase text-slate-600">Risk category</p><p className="mt-1 text-[11px]">{model.risk}</p></div><div className="rounded-[16px] bg-black/15 p-3"><p className="text-[9px] uppercase text-slate-600">Client mandate</p><p className="mt-1 text-[11px]">{model.mandate}</p></div><div className="rounded-[16px] bg-black/15 p-3"><p className="text-[9px] uppercase text-slate-600">Strategy</p><p className="mt-1 text-[11px]">{model.strategy}</p></div></div>
            <div className={tableWrapClass}><table className={tableClass}><thead><tr><th>Target dimension</th><th>Instrument / sleeve</th><th className="text-right">Target weight</th><th className="text-right">Live weight</th><th className="text-right">Drift</th><th>Drift status</th><th>Recommendation</th></tr></thead><tbody>{model.allocations.map((allocation) => { const drift = allocation.live - allocation.target; const action = allocation.dimension !== 'Security' ? 'Review allocation' : Math.abs(drift) < 1 ? 'Hold' : drift > 0 ? `Sell ${(drift * 1.72).toFixed(1)}m ZWL` : `Buy ${(-drift * 1.72).toFixed(1)}m ZWL`; return <tr key={`${allocation.dimension}-${allocation.asset}`}><td><Pill tone="blue">{allocation.dimension}</Pill></td><td className="font-semibold">{allocation.asset}</td><td className="text-right font-mono">{allocation.target.toFixed(1)}%</td><td className="text-right font-mono">{allocation.live.toFixed(1)}%</td><td className={cn('text-right font-mono', Math.abs(drift) >= 2 ? 'text-amber-300' : 'text-slate-400')}>{drift > 0 ? '+' : ''}{drift.toFixed(1)}%</td><td><Pill tone={Math.abs(drift) >= 3 ? 'red' : Math.abs(drift) >= 1 ? 'amber' : 'green'}>{Math.abs(drift) >= 3 ? 'Outside band' : Math.abs(drift) >= 1 ? 'Watch' : 'On target'}</Pill></td><td>{action}</td></tr> })}</tbody></table></div>
          </OrdersCard>
          <OrdersCard title="Rebalance recommendations" eyebrow="Security-level draft actions · no execution"><div className="grid gap-3 p-4 md:grid-cols-3">{model.allocations.filter((item) => item.dimension === 'Security' && Math.abs(item.live - item.target) >= 1).map((item) => { const buy = item.live < item.target; return <div key={item.asset} className="rounded-[18px] border border-white/[0.07] bg-black/15 p-3"><div className="flex justify-between"><b>{item.asset}</b><Pill tone={buy ? 'green' : 'red'}>{buy ? 'BUY' : 'SELL'}</Pill></div><p className="mt-3 font-mono text-sm">{(Math.abs(item.live - item.target) * 1.72).toFixed(1)}m ZWL</p><p className="mt-1 text-[9px] text-slate-500">Move {item.live.toFixed(1)}% → {item.target.toFixed(1)}%</p></div> })}</div></OrdersCard>
        </div>
      </div>
      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit model targets' : 'Create model portfolio'} subtitle="Changes remain in this local prototype." footer={<><button className={buttonClass} onClick={() => setEditing(undefined)}>Cancel</button><button disabled={!name.trim()} className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={save}>Save model</button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Model name *"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Strategy"><SelectField value={strategy} onChange={setStrategy}><option>Moderate growth</option><option>High growth</option><option>Capital preservation</option></SelectField></Field><Field label="Risk category"><SelectField value={risk} onChange={setRisk}><option>Conservative</option><option>Moderate</option><option>Aggressive</option></SelectField></Field><Field label="Client mandate"><SelectField value={mandate} onChange={setMandate}><option>Balanced Fund Mandate 2026</option><option>Growth Equity Mandate</option><option>Pension Preservation Mandate</option></SelectField></Field><Field label="Linked portfolio"><SelectField value={portfolio} onChange={setPortfolio}><option>Arcus Balanced Fund</option><option>Growth Equity Fund</option><option>Pension Preservation</option></SelectField></Field><Field label="Security target weights" hint="Comma separated instrument and percentage"><input className={inputClass} value={targets} onChange={(event) => setTargets(event.target.value)} /></Field></div>
      </Modal>
    </OrdersPage>
  )
}
