'use client'

import { Fragment, useEffect, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchModelPortfolios, createModelPortfolio, fetchModelPortfolioDrift } from '@/lib/store/slices/investmentOpsSlice'

const NEW_MODEL_EMPTY = {
  name: '',
  allocationType: 'ASSET_CLASS',
  allocationKey: 'EQUITY',
  targetWeightPct: '',
}

export default function ModelPortfoliosPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    modelPortfolios,
    modelPortfoliosLoading,
    modelPortfolioCreating,
    modelPortfolioDriftById,
    modelPortfolioDriftLoadingById,
  } = useAppSelector((s) => s.investmentOps)
  const [showNewModel, setShowNewModel] = useState(false)
  const [form, setForm] = useState(NEW_MODEL_EMPTY)
  const [driftFundByModelId, setDriftFundByModelId] = useState<Record<string, string>>({})
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchModelPortfolios())
  }, [dispatch])

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const handleCreate = async () => {
    if (!form.name || !form.targetWeightPct) return
    await dispatch(
      createModelPortfolio({
        name: form.name,
        allocations: [
          { allocationType: form.allocationType, allocationKey: form.allocationKey, targetWeightPct: Number(form.targetWeightPct) },
        ],
      })
    )
    setForm(NEW_MODEL_EMPTY)
    setShowNewModel(false)
  }

  const handleCheckDrift = (modelId: string) => {
    const fundId = driftFundByModelId[modelId]
    if (!fundId) return
    dispatch(fetchModelPortfolioDrift({ modelId, fundId }))
    setExpandedModelId(modelId)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white text-[13px] font-semibold">Model Portfolios</span>
            <button onClick={() => setShowNewModel(true)} className="btn-white text-[12px] py-1 px-4">+ New Model</button>
          </div>

          {showNewModel && (
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold" style={{ color: '#e2e8f0' }}>New Model Portfolio</span>
                <button onClick={() => setShowNewModel(false)} className="text-[#64748b] hover:text-[#ef4444]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => field('name', e.target.value)}
                    placeholder="e.g. Balanced ZSE"
                    className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Allocation Type</label>
                  <input
                    value={form.allocationType}
                    onChange={(e) => field('allocationType', e.target.value)}
                    className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Allocation Key</label>
                  <input
                    value={form.allocationKey}
                    onChange={(e) => field('allocationKey', e.target.value)}
                    className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Target Weight %</label>
                  <input
                    type="number"
                    value={form.targetWeightPct}
                    onChange={(e) => field('targetWeightPct', e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1e2330] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60 font-mono"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button onClick={() => setShowNewModel(false)} className="bg-[#1e2330] text-[#94a3b8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#252b3a]">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={modelPortfolioCreating}
                  className="bg-[#2563eb] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1d4ed8] disabled:opacity-60"
                >
                  {modelPortfolioCreating ? 'Saving…' : 'Save Model'}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Strategy</th>
                  <th>Base Currency</th>
                  <th>Allocations</th>
                  <th>Status</th>
                  <th>Check Drift</th>
                </tr>
              </thead>
              <tbody>
                {modelPortfolios.map((m) => {
                  const isExpanded = expandedModelId === m.id
                  const drift = modelPortfolioDriftById[m.id]
                  const driftLoading = !!modelPortfolioDriftLoadingById[m.id]
                  return (
                    <Fragment key={m.id}>
                      <tr>
                        <td className="text-[#c8d3e8] font-medium">{m.name}</td>
                        <td className="text-[#64748b]">{m.strategyCode ?? '—'}</td>
                        <td className="font-mono" style={{ color: '#94a3b8' }}>{m.baseCurrencyCode}</td>
                        <td className="text-[#94a3b8] text-[11px]">
                          {m.allocations.length === 0
                            ? '—'
                            : m.allocations.map((a) => `${a.allocationKey}: ${a.targetWeightPct}%`).join(', ')}
                        </td>
                        <td><StatusBadge status={m.isActive ? 'active' : 'inactive'} /></td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={driftFundByModelId[m.id] ?? ''}
                              onChange={(e) => setDriftFundByModelId((p) => ({ ...p, [m.id]: e.target.value }))}
                              className="bg-[#1e2330] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-[#c8d3e8] outline-none focus:border-[#3b82f6]/60"
                            >
                              <option value="" disabled>Fund…</option>
                              {portfolios.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleCheckDrift(m.id)}
                              disabled={!driftFundByModelId[m.id] || driftLoading}
                              className="text-[10px] px-2 py-1 rounded border border-white/[0.08] hover:bg-[#1e2330] disabled:opacity-50"
                              style={{ color: '#60a5fa' }}
                            >
                              {driftLoading ? 'Checking…' : 'Check Drift'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && drift && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <div className="px-6 py-3" style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <table className="arcus-table">
                                <thead>
                                  <tr>
                                    <th>Key</th>
                                    <th className="text-right">Target %</th>
                                    <th className="text-right">Live %</th>
                                    <th className="text-right">Drift %</th>
                                    <th>Rebalance Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {drift.drift.map((d, i) => (
                                    <tr key={d.key + i}>
                                      <td className="text-[#c8d3e8]">{d.key}</td>
                                      <td className="text-right font-mono">{d.targetWeightPct}%</td>
                                      <td className="text-right font-mono">{d.liveWeightPct}%</td>
                                      <td className="text-right font-mono" style={{ color: d.driftPct === 0 ? '#94a3b8' : '#f59e0b' }}>
                                        {d.driftPct > 0 ? '+' : ''}{d.driftPct}%
                                      </td>
                                      <td className="text-[#64748b]">{d.rebalanceAction}</td>
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
                {modelPortfolios.length === 0 && !modelPortfoliosLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No model portfolios yet.</td>
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
