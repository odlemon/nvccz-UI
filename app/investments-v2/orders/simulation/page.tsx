'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchInstruments, fetchComplianceRules, runSimulation } from '@/lib/store/slices/investmentOpsSlice'

function outcomeBadgeStatus(outcome: string) {
  if (outcome === 'PASSED') return 'passed'
  if (outcome === 'BREACH') return 'breach'
  return 'warning'
}

const SCENARIO_EMPTY = {
  fundId: '',
  instrumentId: '',
  side: 'BUY' as 'BUY' | 'SELL',
  quantity: '',
  price: '',
}

export default function SimulationPage() {
  const dispatch = useAppDispatch()
  const { portfolios, instruments, complianceRules, simulationRun, simulationRunning } = useAppSelector(
    (s) => s.investmentOps
  )
  const [form, setForm] = useState(SCENARIO_EMPTY)

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchInstruments({ status: 'APPROVED', pageSize: 200 }))
  }, [dispatch])

  useEffect(() => {
    if (form.fundId) dispatch(fetchComplianceRules({ fundId: form.fundId }))
  }, [dispatch, form.fundId])

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const handleRun = async () => {
    const fund = portfolios.find((f) => f.id === form.fundId)
    const inst = instruments.find((i) => i.id === form.instrumentId)
    const quantity = Number(form.quantity)
    const price = Number(form.price)
    if (!fund || !inst || quantity <= 0 || price <= 0) {
      toast.error('Fill in fund, instrument, quantity, and price')
      return
    }
    try {
      await dispatch(
        runSimulation({ fundId: fund.id, scenario: { side: form.side, instrumentId: inst.id, quantity, price } })
      ).unwrap()
    } catch (err: any) {
      toast.error('Simulation failed', { description: err.message })
    }
  }

  const result = simulationRun?.resultJson

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── Scenario form ── */}
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white text-[13px] font-semibold">Run Simulation</span>
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
                {portfolios.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.baseCurrencyCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Instrument</label>
              <select
                value={form.instrumentId}
                onChange={(e) => field('instrumentId', e.target.value)}
                className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
              >
                <option value="" disabled>Select instrument…</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>{i.ticker} — {i.fullName}</option>
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
              <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Price</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => field('price', e.target.value)}
                className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 pb-4">
            <button
              onClick={handleRun}
              disabled={simulationRunning}
              className="bg-[#2563eb] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {simulationRunning ? 'Running…' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* ── Result ── */}
        {result && (
          <div className="arcus-card">
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-white text-[13px] font-semibold">Simulation Result</span>
              <StatusBadge status={outcomeBadgeStatus(result.compliance.outcome)} />
            </div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {[
                { label: 'NAV Before', value: result.navBefore },
                { label: 'NAV After', value: result.navAfter },
                { label: 'NAV Impact', value: result.navImpact },
                { label: 'Cash Impact', value: result.cashImpact },
                { label: 'Estimated Fees', value: result.estimatedFees },
                { label: 'Exposure Impact %', value: result.exposureImpactPct, suffix: '%' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: '#64748b' }}>{s.label}</div>
                  <div className="text-xs font-mono font-semibold" style={{ color: '#e2e8f0' }}>
                    {s.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    {s.suffix ?? ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-2 text-[11px]">
                <span style={{ color: '#64748b' }}>Compliance:</span>
                <span style={{ color: '#94a3b8' }}>{result.compliance.message}</span>
              </div>
              <table className="arcus-table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Rule Type</th>
                    <th>Outcome</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.compliance.checks.map((c, i) => {
                    const rule = complianceRules.find((r) => r.id === c.ruleId)
                    return (
                      <tr key={c.ruleId + i}>
                        <td className="text-[#c8d3e8]">{rule?.ruleName ?? c.ruleId}</td>
                        <td className="text-[#64748b]">{c.ruleType}</td>
                        <td><StatusBadge status={outcomeBadgeStatus(c.outcome)} /></td>
                        <td className="text-[#94a3b8]">{c.message}</td>
                      </tr>
                    )
                  })}
                  {result.compliance.checks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No compliance checks returned.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
