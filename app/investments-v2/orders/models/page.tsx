'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { Download, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchModelPortfolios, createModelPortfolio, fetchModelPortfolioDrift } from '@/lib/store/slices/investmentOpsSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'

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
  const { ref: rootRef, container: themeContainer } = useThemeContainer()
  const [showNewModel, setShowNewModel] = useState(false)
  const [form, setForm] = useState(NEW_MODEL_EMPTY)
  const [formError, setFormError] = useState('')
  const [driftFundByModelId, setDriftFundByModelId] = useState<Record<string, string>>({})
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchModelPortfolios())
  }, [dispatch])

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const filteredModels = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return modelPortfolios
    return modelPortfolios.filter((m) => m.name.toLowerCase().includes(q))
  }, [modelPortfolios, searchText])

  const handleCreate = async () => {
    setFormError('')
    if (!form.name || !form.targetWeightPct) {
      setFormError('Name and Target Weight % are required.')
      return
    }
    try {
      await dispatch(
        createModelPortfolio({
          name: form.name,
          allocations: [
            { allocationType: form.allocationType, allocationKey: form.allocationKey, targetWeightPct: Number(form.targetWeightPct) },
          ],
        })
      ).unwrap()
      setForm(NEW_MODEL_EMPTY)
      setShowNewModel(false)
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create model portfolio')
    }
  }

  const handleCheckDrift = (modelId: string) => {
    const fundId = driftFundByModelId[modelId]
    if (!fundId) return
    dispatch(fetchModelPortfolioDrift({ modelId, fundId }))
    setExpandedModelId(modelId)
  }

  const handleExport = () => {
    exportRowsToCsv(
      `model-portfolios-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Name', 'Strategy', 'Base Currency', 'Allocations', 'Status'],
      filteredModels.map((m) => [
        m.name,
        m.strategyCode ?? '',
        m.baseCurrencyCode,
        m.allocations.map((a) => `${a.allocationKey}: ${a.targetWeightPct}%`).join('; '),
        m.isActive ? 'active' : 'inactive',
      ])
    )
  }

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
      <Topbar title="Orders" />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="arcus-card">
          <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-white text-[13px] font-semibold">Model Portfolios</span>
            <div className="flex items-center gap-2">
              <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search model name…" className="w-56" />
              <Button variant="outline" size="pill" onClick={handleExport}>
                <Download className="w-3 h-3" /> Export
              </Button>
              <Button variant="default" size="pill" onClick={() => setShowNewModel(true)}>+ New Model</Button>
            </div>
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
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => field('name', e.target.value)}
                    placeholder="e.g. Balanced ZSE"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Allocation Type</label>
                  <Input
                    value={form.allocationType}
                    onChange={(e) => field('allocationType', e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Allocation Key</label>
                  <Input
                    value={form.allocationKey}
                    onChange={(e) => field('allocationKey', e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748b] uppercase tracking-wider block mb-1">Target Weight % *</label>
                  <Input
                    type="number"
                    value={form.targetWeightPct}
                    onChange={(e) => field('targetWeightPct', e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
              </div>
              {formError && <div className="text-[11px] text-[#EF4444] mt-2">{formError}</div>}
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button variant="outline" size="pill" onClick={() => setShowNewModel(false)}>Cancel</Button>
                <Button variant="default" size="pill" onClick={handleCreate} disabled={modelPortfolioCreating}>
                  {modelPortfolioCreating ? 'Saving…' : 'Save Model'}
                </Button>
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
                {filteredModels.map((m) => {
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
                            <Select value={driftFundByModelId[m.id] ?? ''} onValueChange={(v) => setDriftFundByModelId((p) => ({ ...p, [m.id]: v }))}>
                              <SelectTrigger className="w-32 rounded-full">
                                <SelectValue placeholder="Fund…" />
                              </SelectTrigger>
                              <SelectContent container={themeContainer}>
                                {portfolios.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => handleCheckDrift(m.id)}
                              disabled={!driftFundByModelId[m.id] || driftLoading}
                            >
                              {driftLoading ? 'Checking…' : 'Check Drift'}
                            </Button>
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
                {filteredModels.length === 0 && !modelPortfoliosLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No model portfolios match the current filters.</td>
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
