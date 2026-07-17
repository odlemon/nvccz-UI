'use client'

import { useMemo, useState } from 'react'
import { FileUp, Search, ShieldAlert } from 'lucide-react'
import { buttonClass, Field, inputClass, Metric, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { cn } from '@/lib/utils'

const checks = [
  { order: 'ORD-260717-041', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', side: 'BUY', category: 'Security exposure', rule: 'Maximum single-security exposure', limit: '≤ 15.00%', current: '13.62%', after: '16.18%', status: 'Requires Override' },
  { order: 'ORD-260717-041', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', side: 'BUY', category: 'Issuer exposure', rule: 'Maximum issuer exposure', limit: '≤ 18.00%', current: '13.62%', after: '16.18%', status: 'Warning' },
  { order: 'ORD-260717-040', portfolio: 'Growth Equity Fund', ticker: 'INNSCOR', side: 'SELL', category: 'Country exposure', rule: 'Maximum Zimbabwe exposure', limit: '≤ 90.00%', current: '86.40%', after: '84.10%', status: 'Passed' },
  { order: 'ORD-260717-041', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', side: 'BUY', category: 'Sector exposure', rule: 'Maximum consumer exposure', limit: '≤ 25.00%', current: '23.40%', after: '26.12%', status: 'Failed' },
  { order: 'ORD-260717-039', portfolio: 'Pension Preservation', ticker: 'CBZ', side: 'BUY', category: 'Currency exposure', rule: 'Maximum ZWL exposure', limit: '≤ 85.00%', current: '78.20%', after: '80.11%', status: 'Passed' },
  { order: 'ORD-260717-039', portfolio: 'Pension Preservation', ticker: 'CBZ', side: 'BUY', category: 'Cash balance', rule: 'Minimum cash balance', limit: '≥ 5.00%', current: '7.84%', after: '5.21%', status: 'Warning' },
  { order: 'ORD-260716-038', portfolio: 'Arcus Balanced Fund', ticker: 'ECO', side: 'BUY', category: 'Liquidity', rule: 'Maximum illiquid asset exposure', limit: '≤ 20.00%', current: '12.50%', after: '14.10%', status: 'Passed' },
  { order: 'ORD-260716-037', portfolio: 'Growth Equity Fund', ticker: 'FBC', side: 'SELL', category: 'Restricted securities', rule: 'Issuer restricted list', limit: 'Not restricted', current: 'Restricted', after: 'Restricted', status: 'Rejected' },
  { order: 'ORD-260716-038', portfolio: 'Arcus Balanced Fund', ticker: 'ECO', side: 'BUY', category: 'Restricted markets', rule: 'Approved exchange list', limit: 'Approved only', current: 'ZSE approved', after: 'ZSE approved', status: 'Passed' },
  { order: 'ORD-260717-040', portfolio: 'Growth Equity Fund', ticker: 'INNSCOR', side: 'SELL', category: 'Restricted brokers', rule: 'Approved broker list', limit: 'Approved only', current: 'IH approved', after: 'IH approved', status: 'Passed' },
  { order: 'ORD-260717-039', portfolio: 'Pension Preservation', ticker: 'CBZ', side: 'BUY', category: 'Credit rating', rule: 'Minimum credit rating', limit: '≥ BBB-', current: 'BBB', after: 'BBB', status: 'Passed' },
  { order: 'ORD-260717-039', portfolio: 'Pension Preservation', ticker: 'CBZ', side: 'BUY', category: 'Maturity', rule: 'Maximum maturity', limit: '≤ 10 years', current: 'Equity / N/A', after: 'Equity / N/A', status: 'Passed' },
  { order: 'ORD-260717-041', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', side: 'BUY', category: 'Leverage', rule: 'Gross leverage limit', limit: '≤ 110.00%', current: '98.20%', after: '100.40%', status: 'Passed' },
  { order: 'ORD-260717-040', portfolio: 'Growth Equity Fund', ticker: 'INNSCOR', side: 'SELL', category: 'Derivatives', rule: 'Derivative exposure limit', limit: '≤ 10.00%', current: '0.00%', after: '0.00%', status: 'Passed' },
  { order: 'ORD-260717-041', portfolio: 'Arcus Balanced Fund', ticker: 'DELTA', side: 'BUY', category: 'ESG restrictions', rule: 'Minimum internal ESG score', limit: '≥ 60', current: '72', after: '72', status: 'Approved with Exception' },
  { order: 'ORD-260717-039', portfolio: 'Pension Preservation', ticker: 'CBZ', side: 'BUY', category: 'Client mandate', rule: 'Pension mandate approved universe', limit: 'Approved only', current: 'Approved', after: 'Approved', status: 'Passed' },
]
const rules = [
  ['Security / issuer', 'Maximum security and issuer exposure', 'Portfolio / fund', '15% / 18%'],
  ['Country / sector', 'Maximum geographic and sector exposure', 'Client mandate', '90% / 25%'],
  ['Currency / cash', 'Currency cap and minimum cash', 'Portfolio', '85% / 5%'],
  ['Liquidity', 'Maximum illiquid asset exposure', 'Instrument type', '20%'],
  ['Restricted lists', 'Securities, markets and brokers', 'All portfolios', 'Approved only'],
  ['Credit / maturity', 'Minimum rating and maximum maturity', 'Instrument type', 'BBB- / 10y'],
  ['Leverage / derivatives', 'Gross and derivative exposure', 'Fund', '110% / 10%'],
  ['ESG / client mandate', 'ESG and client-specific restrictions', 'Client mandate', 'Score ≥ 60'],
]

export default function CompliancePage() {
  const [items, setItems] = useState(checks)
  const [query, setQuery] = useState('')
  const [override, setOverride] = useState<(typeof checks)[number] | null>(null)
  const [reason, setReason] = useState('')
  const [approver, setApprover] = useState('')
  const [document, setDocument] = useState('')
  const [history, setHistory] = useState<{ order: string; reason: string; approver: string; time: string; document: string; outcome: string }[]>([
    { order: 'ORD-260715-032', reason: 'Temporary concentration accepted during staged rebalance.', approver: 'CIO · R. Chirwa', time: '15 Jul 2026, 14:22', document: 'IC-minute-1507.pdf', outcome: 'Approved with Exception' },
  ])
  const visible = useMemo(() => items.filter((x) => Object.values(x).join(' ').toLowerCase().includes(query.toLowerCase())), [items, query])
  const submit = () => {
    if (!override || !reason || !approver || !document) return
    setItems((rows) => rows.map((row) => row.order === override.order && row.rule === override.rule ? { ...row, status: 'Approved with Exception' } : row))
    setHistory((h) => [{ order: override.order, reason, approver, document, time: new Date().toLocaleString(), outcome: 'Approved with Exception' }, ...h])
    setOverride(null); setReason(''); setApprover(''); setDocument('')
  }
  return <OrdersPage title="Compliance" description="Pre-trade mandate checks, exceptions and a complete local override audit trail.">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Checks passed" value={String(items.filter((x) => x.status === 'Passed').length)} tone="text-emerald-300" /><Metric label="Warnings" value={String(items.filter((x) => x.status === 'Warning').length)} tone="text-amber-300" /><Metric label="Exceptions" value={String(items.filter((x) => ['Failed', 'Requires Override', 'Rejected'].includes(x.status)).length)} tone="text-red-300" /><Metric label="Check categories" value="16" tone="text-blue-300" /></div>
    <OrdersCard title="Pre-trade results" eyebrow="Latest checks" actions={<div className="relative"><Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" /><input className={cn(inputClass, 'w-64 pl-8')} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order, rule or portfolio" /></div>}>
      <div className={tableWrapClass}><table className={tableClass}><thead><tr><th>Order</th><th>Portfolio</th><th>Instrument</th><th>Side</th><th>Category</th><th>Rule</th><th>Limit</th><th>Current</th><th>After trade</th><th>Result</th><th>Action</th></tr></thead>
        <tbody>{visible.map((x) => <tr key={`${x.order}-${x.rule}`}><td className="font-mono text-blue-300">{x.order}</td><td>{x.portfolio}</td><td className="font-semibold">{x.ticker}</td><td className={x.side === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{x.side}</td><td>{x.category}</td><td>{x.rule}</td><td className="font-mono">{x.limit}</td><td className="font-mono">{x.current}</td><td className="font-mono">{x.after}</td><td><Pill tone={x.status === 'Passed' ? 'green' : x.status === 'Warning' ? 'amber' : x.status === 'Approved with Exception' ? 'violet' : 'red'}>{x.status}</Pill></td><td>{['Failed', 'Requires Override'].includes(x.status) ? <button className={cn(buttonClass, 'h-7 border-amber-400/30 px-3 text-amber-300')} onClick={() => setOverride(x)}><ShieldAlert className="h-3 w-3" /> Override</button> : '—'}</td></tr>)}</tbody>
      </table></div>
    </OrdersCard>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <OrdersCard title="Mandate rule library" eyebrow="Required categories"><div className={tableWrapClass}><table className={tableClass}><thead><tr><th>Category</th><th>Rule</th><th>Scope</th><th>Threshold</th><th>Status</th></tr></thead><tbody>{rules.map((r) => <tr key={r[1]}>{r.map((v) => <td key={v}>{v}</td>)}<td><Pill tone="green">Active</Pill></td></tr>)}</tbody></table></div></OrdersCard>
      <OrdersCard title="Override audit history" eyebrow={`${history.length} permanent-style local records`}><div className="space-y-2 p-3">{history.map((h) => <div key={h.time} className="rounded-[18px] border border-white/[0.07] bg-[#080e18] p-3"><div className="flex justify-between"><span className="font-mono text-[10px] text-blue-300">{h.order}</span><Pill tone="violet">{h.outcome}</Pill></div><p className="mt-2 text-[10px]">{h.reason}</p><p className="mt-2 text-[9px] text-slate-500">{h.approver} · {h.time} · {h.document}</p></div>)}</div></OrdersCard>
    </div>
    <Modal open={!!override} onClose={() => setOverride(null)} title={`Compliance override · ${override?.order ?? ''}`} subtitle="All fields are required and written to the local audit history." footer={<><button className={buttonClass} onClick={() => setOverride(null)}>Cancel</button><button disabled={!reason || !approver || !document} className={cn(buttonClass, 'bg-amber-500 text-slate-950')} onClick={submit}>Request override</button></>}>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Breach"><div className={cn(inputClass, 'flex items-center')}>{override?.rule}</div></Field><Field label="Timestamp"><div className={cn(inputClass, 'flex items-center')}>{new Date().toLocaleString()}</div></Field><Field label="Approver"><SelectField value={approver} onChange={setApprover}><option value="">Select approver</option><option>CIO · R. Chirwa</option><option>Head of Risk · P. Dube</option></SelectField></Field><Field label="Supporting document"><label className={cn(inputClass, 'flex cursor-pointer items-center gap-2')}><FileUp className="h-3.5 w-3.5" />{document || 'Attach approval memo'}<input type="file" className="hidden" onChange={(e) => setDocument(e.target.files?.[0]?.name ?? '')} /></label></Field><Field label="Override reason"><textarea className={cn(inputClass, 'h-24 resize-none py-2')} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain rationale and mitigating controls…" /></Field></div>
    </Modal>
  </OrdersPage>
}
