'use client'

import { useState } from 'react'
import { Beaker, RotateCcw } from 'lucide-react'
import { buttonClass, Field, inputClass, Metric, OrdersCard, OrdersPage, Pill, SelectField } from '@/components/investments-v2/orders-ui'
import { cn } from '@/lib/utils'

export default function SimulationPage() {
  const defaults = { portfolio: 'Arcus Balanced Fund', instrument: 'DELTA · Delta Corporation Ltd', side: 'BUY', quantity: '12500', price: '842.50', type: 'LIMIT', scenario: 'Base case', mode: 'Single order', currency: 'ZWL', fxRate: '1.0000', targetWeight: '8.50' }
  const [form, setForm] = useState(defaults)
  const [ran, setRan] = useState(false)
  const set = (key: keyof typeof form, value: string) => { setForm((old) => ({ ...old, [key]: value })); setRan(false) }
  const gross = (Number(form.quantity) || 0) * (Number(form.price) || 0)
  return (
    <OrdersPage title="Order simulation" description="Model portfolio impact without creating, routing or executing an order."
      actions={<Pill tone="violet">What-if only · no execution</Pill>}>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <OrdersCard title="Scenario inputs" eyebrow="Hypothetical trade">
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-1">
            <Field label="Scenario"><SelectField value={form.scenario} onChange={(value) => set('scenario', value)}><option>Base case</option><option>Price +5%</option><option>Price -5%</option><option>Stress liquidity</option></SelectField></Field>
            <Field label="Simulation mode"><SelectField value={form.mode} onChange={(value) => set('mode', value)}><option>Single order</option><option>Portfolio rebalance</option></SelectField></Field>
            <Field label="Portfolio"><SelectField value={form.portfolio} onChange={(value) => set('portfolio', value)}><option>Arcus Balanced Fund</option><option>Growth Equity Fund</option><option>Pension Preservation</option></SelectField></Field>
            <Field label="Instrument"><SelectField value={form.instrument} onChange={(value) => set('instrument', value)}><option>DELTA · Delta Corporation Ltd</option><option>INNSCOR · Innscor Africa Ltd</option><option>ECO · Econet Wireless Zimbabwe</option></SelectField></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Side"><SelectField value={form.side} onChange={(value) => set('side', value)}><option>BUY</option><option>SELL</option></SelectField></Field><Field label="Order type"><SelectField value={form.type} onChange={(value) => set('type', value)}><option>MARKET</option><option>LIMIT</option><option>STOP LIMIT</option></SelectField></Field></div>
            <div className="grid grid-cols-2 gap-3"><Field label="Quantity"><input className={inputClass} type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} /></Field><Field label="Assumed price"><input className={inputClass} type="number" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field></div>
            <div className="grid grid-cols-3 gap-3"><Field label="Trade currency"><SelectField value={form.currency} onChange={(value) => set('currency', value)}><option>ZWL</option><option>USD</option><option>ZAR</option></SelectField></Field><Field label="FX to ZWL"><input className={inputClass} type="number" value={form.fxRate} onChange={(e) => set('fxRate', e.target.value)} /></Field><Field label="Target weight"><input className={inputClass} type="number" value={form.targetWeight} onChange={(e) => set('targetWeight', e.target.value)} /></Field></div>
            <div className="flex gap-2"><button className={cn(buttonClass, 'flex-1')} onClick={() => { setForm(defaults); setRan(false) }}><RotateCcw className="h-3.5 w-3.5" /> Reset</button><button disabled={!gross || Number(form.fxRate) <= 0} className={cn(buttonClass, 'flex-1 bg-violet-600 text-white')} onClick={() => setRan(true)}><Beaker className="h-3.5 w-3.5" /> Run simulation</button></div>
          </div>
        </OrdersCard>
        <div className="space-y-4 transition">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6"><Metric label="NAV after" value="482.31m" detail="+0.04%" /><Metric label="Projected P/L" value="+1.26m" tone="text-emerald-300" detail="+0.26% NAV" /><Metric label="Cash after" value="41.69m" detail="-10.59m" /><Metric label="Exposure after" value="74.58%" detail="+2.18%" /><Metric label="Currency impact" value={`+${(gross * Number(form.fxRate) / 1_000_000).toFixed(2)}m`} detail={`${form.currency} translated to ZWL`} /><Metric label="Settlement" value={`${(gross * 1.00575).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} detail="ZWL" /></div>
          <OrdersCard title="Before vs after" eyebrow="Portfolio impact"><div className="grid gap-3 p-4 md:grid-cols-2">
            {[['DELTA weight', '6.10%', `${form.targetWeight}%`, `+${(Number(form.targetWeight) - 6.1).toFixed(2)}%`], ['Consumer exposure', '21.86%', '24.18%', '+2.32%'], ['Equity exposure', '72.40%', '74.58%', '+2.18%'], ['Cash weight', '10.86%', '8.64%', '-2.22%'], [`${form.currency} currency exposure`, '78.20%', '80.39%', '+2.19%'], ['NAV', '482.12m', '482.31m', '+0.19m'], ['Projected P/L', '—', '+1.26m', '+0.26%'], ['Rebalance target', '6.10%', `${form.targetWeight}%`, form.mode === 'Portfolio rebalance' ? 'Target applied' : 'What-if']].map(([label, before, after, delta]) => <div key={label} className="rounded-[18px] border border-white/[0.06] bg-black/15 p-4"><div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-3 grid grid-cols-3 text-center"><div><span className="text-[9px] text-slate-600">Before</span><p className="font-mono text-sm">{before}</p></div><div><span className="text-[9px] text-slate-600">After</span><p className="font-mono text-sm">{after}</p></div><div><span className="text-[9px] text-slate-600">Change</span><p className={cn('font-mono text-sm', delta.startsWith('+') ? 'text-emerald-300' : 'text-amber-300')}>{delta}</p></div></div></div>)}
          </div></OrdersCard>
          <div className="grid gap-4 lg:grid-cols-2">
            <OrdersCard title="Costs"><div className="space-y-2 p-4">{[['Gross consideration', gross], ['Brokerage & exchange fees', gross * 0.00375], ['Taxes', gross * 0.002], ['Settlement amount', gross * 1.00575]].map(([label, value]) => <div key={String(label)} className="flex justify-between text-[10px]"><span className="text-slate-500">{label}</span><span className="font-mono">{Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ZWL</span></div>)}</div></OrdersCard>
            <OrdersCard title="Compliance"><div className="space-y-2 p-4">{[['Single security ≤ 10%', 'PASS', '8.42%'], ['Sector exposure ≤ 25%', 'PASS', '24.18%'], ['Cash buffer ≥ 3%', 'PASS', '8.64%'], ['Order ≤ 20% ADV', 'WARNING', '18.75%']].map(([rule, status, value]) => <div key={rule} className="flex items-center justify-between rounded-[14px] bg-black/15 p-2.5"><span className="text-[10px]">{rule}</span><div className="flex items-center gap-2"><span className="font-mono text-[9px] text-slate-500">{value}</span><Pill tone={status === 'PASS' ? 'green' : 'amber'}>{status}</Pill></div></div>)}</div></OrdersCard>
          </div>
        </div>
      </div>
    </OrdersPage>
  )
}
