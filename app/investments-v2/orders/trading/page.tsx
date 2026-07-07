'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { ChevronDown, Calendar, MoreHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchFunds,
  fetchSecurities,
  fetchLatestPrices,
  fetchTrades,
  createTrade,
  executeTrade,
} from '@/lib/store/slices/investmentsSlice'
import { priceChange, type Trade } from '@/lib/api/investments-api'

const moduleTabs = [
  { label: 'Trade Blotter', href: '/orders/blotter' },
  { label: 'Orderbook',     href: '/orders/orderbook' },
  { label: 'Trading',       href: '/orders/trading' },
  { label: 'Compliance',    href: '/orders/compliance' },
  { label: 'Simulation',    href: '#' },
  { label: 'Models',        href: '#' },
  { label: 'Setup',         href: '#' },
]

const TRADE_STATUS_LABEL: Record<Trade['status'], string> = {
  DRAFT: 'draft',
  EXECUTED: 'executed',
  ROUTING: 'pending',
  SETTLED: 'settled',
  SETTLEMENT_FAILED: 'failed',
  CANCELLED: 'cancelled',
}

function DropdownField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px]" style={{ color: '#64748b' }}>{label}</label>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="text-[12.5px]" style={{ color: '#94a3b8' }}>{value}</span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#64748b' }} />
      </div>
    </div>
  )
}

const NEW_ORDER_EMPTY = { fundId: '', securityId: '', side: 'BUY' as 'BUY' | 'SELL', quantity: '', executionPrice: '', fees: '0' }

export default function TradingPage() {
  const dispatch = useAppDispatch()
  const { funds, securities, latestPrices, trades, executing } = useAppSelector((s) => s.investments)

  const [longShort, setLongShort] = useState<'Long' | 'Short'>('Long')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [form, setForm] = useState(NEW_ORDER_EMPTY)

  useEffect(() => {
    dispatch(fetchFunds())
    dispatch(fetchSecurities())
    dispatch(fetchLatestPrices())
    dispatch(fetchTrades())
  }, [dispatch])

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const openNewOrder = () => {
    setForm(NEW_ORDER_EMPTY)
    setShowNewOrder(true)
  }

  const handleSecurityChange = (securityId: string) => {
    field('securityId', securityId)
    const sec = securities.find((s) => s.id === securityId)
    if (!sec) return
    const tick = latestPrices[sec.symbol] ?? latestPrices[sec.id]
    const change = priceChange(tick)
    if (change.price != null) field('executionPrice', String(change.price))
  }

  const handleSubmitOrder = async () => {
    const fund = funds.find((f) => f.id === form.fundId)
    const security = securities.find((s) => s.id === form.securityId)
    const quantity = Number(form.quantity)
    const executionPrice = Number(form.executionPrice)
    if (!fund || !security || quantity <= 0 || executionPrice <= 0) {
      toast.error('Fill in fund, security, quantity, and price')
      return
    }
    try {
      const created = await dispatch(
        createTrade({
          fundId: fund.id,
          securityId: security.id,
          side: form.side,
          quantity,
          executionPrice,
          executionCurrencyCode: fund.base_currency,
          fees: Number(form.fees) || 0,
        })
      ).unwrap()

      const result = await dispatch(executeTrade(created.id)).unwrap()
      dispatch(fetchTrades())

      toast.success('Trade executed', {
        description: `${result.tradeRef} — ${form.side} ${quantity.toLocaleString()} ${security.symbol}`,
      })
      setShowNewOrder(false)
    } catch (err: any) {
      toast.error('Execution failed', { description: err.message })
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      {/* Module nav */}
      <div className="flex items-center gap-0 px-5 flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {moduleTabs.map((t) => (
          <Link key={t.label} href={t.href}
            className={cn(
              'px-4 py-3 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              t.label === 'Trading'
                ? 'text-white border-[#3b82f6]'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            )}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Filters card ── */}
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-white text-[13px] font-semibold">Filters</span>
            <button onClick={openNewOrder} className="btn-white text-[12px] py-1 px-4">New Order</button>
          </div>

          {/* Filter chips row */}
          <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
            {['All Portfolios', 'Default View', 'From: 11 Oct, 21', 'As of: 11 Oct, 21'].map((chip, i) => (
              <button key={i} className="sort-pill text-[11px]">
                {chip} <ChevronDown className="w-3 h-3" />
              </button>
            ))}
            <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            </button>
          </div>

          {/* 3-column filter grid */}
          <div className="grid grid-cols-3 gap-4 px-4 pb-4">
            {/* Row 1 */}
            <DropdownField label="Closed Positions" value="Exclude" />
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Quantity from/to</label>
              <div className="flex items-center px-3 py-2 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <input placeholder="Enter text" className="bg-transparent outline-none text-[12.5px] w-full" style={{ color: '#94a3b8' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Quantity</label>
              <div className="flex items-center gap-4 px-3 py-2 rounded-lg" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)', height: '38px' }}>
                {(['Long','Short'] as const).map(v => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setLongShort(v)}
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center cursor-pointer"
                      style={{ borderColor: longShort === v ? '#3b82f6' : '#64748b' }}
                    >
                      {longShort === v && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3b82f6' }} />}
                    </div>
                    <span className="text-[12px]" style={{ color: longShort === v ? '#e2e8f0' : '#64748b' }}>{v}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px]" style={{ color: '#64748b' }}>Expiry/Maturity from/to</label>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer" style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[12.5px]" style={{ color: '#64748b' }}>Select</span>
                <Calendar className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
              </div>
            </div>
            <DropdownField label="Portfolio" value="No filter" />
            <DropdownField label="Folder" value="No filter" />

            {/* Row 3 */}
            <DropdownField label="Instrument type" value="No filter" />
            <DropdownField label="Currency" value="No filter" />
            <DropdownField label="Industry" value="No filter" />
          </div>
        </div>

        {/* New Order panel — appears inline above Positions, same visual language as Blotter's New Order entry */}
        {showNewOrder && (
          <div className="arcus-card" style={{ borderColor: 'rgba(59,130,246,0.4)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-white text-[13px] font-semibold">New Order Entry</span>
              <button onClick={() => setShowNewOrder(false)} className="text-[#64748b] hover:text-[#ef4444]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Fund</label>
                <select
                  value={form.fundId}
                  onChange={(e) => field('fundId', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="" disabled>Select fund…</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.base_currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Security</label>
                <select
                  value={form.securityId}
                  onChange={(e) => handleSecurityChange(e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="" disabled>Select security…</option>
                  {securities.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.symbol} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Side</label>
                <select
                  value={form.side}
                  onChange={(e) => field('side', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => field('quantity', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Execution Price</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.executionPrice}
                  onChange={(e) => field('executionPrice', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Fees</label>
                <input
                  type="number"
                  value={form.fees}
                  onChange={(e) => field('fees', e.target.value)}
                  className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 pb-4">
              <div className="flex-1 text-[10px]" style={{ color: '#64748b' }}>
                Submitting will create the trade and route it for execution immediately.
              </div>
              <button className="bg-[#1e2330] text-[#94a3b8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#252b3a]" onClick={() => setShowNewOrder(false)}>Cancel</button>
              <button
                onClick={handleSubmitOrder}
                disabled={executing}
                className="bg-[#2563eb] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {executing ? 'Submitting…' : 'Submit Order'}
              </button>
            </div>
          </div>
        )}

        {/* ── Positions ── */}
        <div className="arcus-card">
          <div className="flex items-center gap-6 px-4 py-3 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white text-[13px] font-semibold">Recent Trades</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Total:</span>
              <span className="font-mono" style={{ color: '#3b82f6' }}>{trades.length}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Settled:</span>
              <span className="font-mono" style={{ color: '#10b981' }}>{trades.filter((t) => t.status === 'SETTLED').length}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span style={{ color: '#64748b' }}>Settlement Failed:</span>
              <span className="font-mono" style={{ color: '#ef4444' }}>{trades.filter((t) => t.status === 'SETTLEMENT_FAILED').length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Trade Ref</th>
                  <th>Security</th>
                  <th>Side</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Price</th>
                  <th>CCY</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="cursor-pointer">
                    <td style={{ color: '#94a3b8' }} className="font-mono text-[11px]">{t.tradeRef}</td>
                    <td style={{ color: '#e2e8f0' }} className="font-medium font-mono">{t.security?.symbol ?? '—'}</td>
                    <td>
                      <span className={cn('text-xs font-bold', t.side === 'BUY' ? 'text-[#10b981]' : 'text-[#ef4444]')}>
                        {t.side}
                      </span>
                    </td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{Number(t.quantity).toLocaleString()}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{Number(t.executionPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: '#64748b' }} className="font-mono">{t.executionCurrencyCode}</td>
                    <td><StatusBadge status={TRADE_STATUS_LABEL[t.status]} /></td>
                  </tr>
                ))}
                {trades.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No trades yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
