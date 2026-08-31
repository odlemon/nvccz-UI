'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Edit3, Plus, Search } from 'lucide-react'
import { OpsKpiSkeleton, OpsListSkeleton } from '@/components/investments-v2/loading-skeletons'
import { buttonClass, Field, inputClass, Metric, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { formatOpsError, investmentOpsApi } from '@/lib/api/investment-ops-api'
import {
  applyModelDrift,
  mapFundOptions,
  mapModelPortfolios,
  type ModelRow,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'

export default function ModelsPage() {
  const [models, setModels] = useState<ModelRow[]>([])
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [driftLoading, setDriftLoading] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [linkedFundId, setLinkedFundId] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<ModelRow | null | undefined>()
  const [name, setName] = useState('')
  const [strategy, setStrategy] = useState('')
  const [targets, setTargets] = useState('')
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [modelsRes, portfoliosRes] = await Promise.all([
        investmentOpsApi.listModelPortfolios(),
        investmentOpsApi.listPortfolios(),
      ])
      if (modelsRes.success === false) {
        throw new Error(formatOpsError(modelsRes, 'Failed to load model portfolios'))
      }
      const rows = mapModelPortfolios(modelsRes.data)
      const fundList = mapFundOptions(portfoliosRes.data)
      setFunds(fundList)
      setModels(rows)
      setActiveId((prev) => {
        const nextId = prev && rows.some((r) => r.id === prev) ? prev : (rows[0]?.id ?? null)
        const activeModel = rows.find((r) => r.id === nextId)
        setLinkedFundId((linkedPrev) => activeModel?.fundId ?? (linkedPrev || fundList[0]?.id || ''))
        return nextId
      })
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load model portfolios'))
      setModels([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const model = models.find((item) => item.id === activeId) || models[0]

  useEffect(() => {
    if (!model?.id || !linkedFundId) return
    let cancelled = false
    setDriftLoading(true)
    investmentOpsApi
      .getModelPortfolioDrift(model.id, linkedFundId)
      .then((res) => {
        if (cancelled || res.success === false || !res.data) return
        setModels((items) =>
          items.map((item) => (item.id === model.id ? applyModelDrift({ ...item, portfolio: funds.find((f) => f.id === linkedFundId)?.name ?? item.portfolio, fundId: linkedFundId }, res.data) : item)),
        )
      })
      .catch(() => {
        /* drift optional */
      })
      .finally(() => {
        if (!cancelled) setDriftLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [model?.id, linkedFundId, funds])

  const visible = useMemo(
    () => models.filter((item) => `${item.name} ${item.portfolio} ${item.strategy}`.toLowerCase().includes(query.toLowerCase())),
    [models, query],
  )

  const open = (item: ModelRow | null) => {
    setEditing(item)
    setName(item?.name || '')
    setStrategy(item?.strategy && item.strategy !== '—' ? item.strategy : '')
    setTargets(
      item
        ? item.allocations.map((allocation) => `${allocation.asset} ${allocation.target}`).join(', ')
        : '',
    )
    if (item?.fundId) setLinkedFundId(item.fundId)
    setSaveError(null)
  }

  const save = async () => {
    if (!name.trim()) return
    setSaveBusy(true)
    setSaveError(null)
    try {
      const allocations = targets
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const parts = entry.split(/\s+/)
          const weight = Number(parts.pop()) || 0
          return {
            allocationType: 'SECURITY',
            allocationKey: parts.join(' ') || 'Sleeve',
            targetWeightPct: weight,
          }
        })
      const payload = {
        name: name.trim(),
        allocations,
        linkedFundId: linkedFundId || undefined,
      }
      const res = editing
        ? await investmentOpsApi.updateModelPortfolio(editing.id, payload)
        : await investmentOpsApi.createModelPortfolio(payload)
      if (res.success === false) {
        throw new Error(formatOpsError(res, editing ? 'Failed to update model' : 'Failed to create model'))
      }
      setEditing(undefined)
      await load()
      if (res.data?.id) setActiveId(res.data.id)
    } catch (e) {
      setSaveError(formatOpsError(e, 'Save failed'))
    } finally {
      setSaveBusy(false)
    }
  }

  const drifts = model?.allocations.map((a) => (a.live != null ? Math.abs(a.live - a.target) : a.drift != null ? Math.abs(a.drift) : 0)) ?? [0]
  const maxDrift = drifts.length ? Math.max(...drifts) : 0
  const recCount = model?.allocations.filter((item) => {
    const d = item.live != null ? Math.abs(item.live - item.target) : Math.abs(item.drift ?? 0)
    return d >= 1
  }).length ?? 0

  return (
    <OrdersPage
      title="Model portfolios"
      description="Compare live portfolios to target weights and turn drift into rebalance recommendations."
      actions={
        <button className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={() => open(null)}>
          <Plus className="h-3.5 w-3.5" /> New model
        </button>
      }
    >
      <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
        Model portfolios define target weights (e.g. 40% equity sleeve, 60% income).
        Select a model on the left, pick a live portfolio to compare, and review drift in the table.
        Use <span className="text-slate-200">New model</span> to create targets; drift loads automatically when a fund is linked.
      </p>
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {error}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {loading && models.length === 0 ? (
        <OpsKpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Active models" value={loading ? '…' : String(models.filter((m) => m.isActive).length || models.length)} />
          <Metric label="Linked fund" value={funds.find((f) => f.id === linkedFundId)?.name ?? '—'} tone="text-blue-300" />
          <Metric label="Largest drift" value={model ? `${maxDrift.toFixed(1)}%` : '—'} tone="text-amber-300" />
          <Metric label="Recommendations" value={model ? String(recCount) : '—'} tone="text-violet-300" />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <OrdersCard
          title="Models"
          eyebrow="Workspace"
          actions={
            <div className="relative mr-3">
              <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
              <input className={cn(inputClass, 'w-36 pl-8')} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
            </div>
          }
        >
          <div className="space-y-2 p-3">
            {loading && <OpsListSkeleton rows={5} />}
            {!loading && visible.length === 0 && <p className="py-8 text-center text-[11px] text-slate-500">No model portfolios found.</p>}
            {visible.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveId(item.id)
                  if (item.fundId) setLinkedFundId(item.fundId)
                }}
                className={cn(
                  'w-full rounded-full border p-3 text-left transition',
                  item.id === activeId ? 'border-blue-400/40 bg-blue-500/10' : 'border-white/[0.06] bg-[#070d17] hover:border-blue-400/25',
                )}
              >
                <div className="flex justify-between gap-2">
                  <span className="text-[11px] font-semibold">{item.name}</span>
                  <Pill tone={item.isActive ? 'green' : 'slate'}>{item.isActive ? 'Active' : 'Inactive'}</Pill>
                </div>
                <p className="mt-2 text-[9px] text-slate-500">
                  {item.strategy} · {item.currency}
                </p>
              </button>
            ))}
          </div>
        </OrdersCard>

        <div className="space-y-4">
          {!model && !loading && (
            <OrdersCard title="No model selected" eyebrow="Select or create a model">
              <p className="p-6 text-center text-[11px] text-slate-500">Create a model portfolio to view target weights and drift.</p>
            </OrdersCard>
          )}
          {model && (
            <>
              <OrdersCard
                title={model.name}
                eyebrow={`${funds.find((f) => f.id === linkedFundId)?.name ?? '—'} · updated ${model.updated}${driftLoading ? ' · refreshing drift…' : ''}`}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <SelectField value={linkedFundId} onChange={setLinkedFundId} className="w-48">
                      {funds.length === 0 && <option value="">No funds</option>}
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </SelectField>
                    <button className={buttonClass} onClick={() => open(model)}>
                      <Edit3 className="h-3.5 w-3.5" /> Edit targets
                    </button>
                  </div>
                }
              >
                <div className="grid gap-3 border-b border-white/[0.06] p-4 sm:grid-cols-3">
                  <div className="rounded-[16px] bg-black/15 p-3">
                    <p className="text-[9px] uppercase text-slate-600">Currency</p>
                    <p className="mt-1 text-[11px]">{model.currency}</p>
                  </div>
                  <div className="rounded-[16px] bg-black/15 p-3">
                    <p className="text-[9px] uppercase text-slate-600">Strategy</p>
                    <p className="mt-1 text-[11px]">{model.strategy}</p>
                  </div>
                  <div className="rounded-[16px] bg-black/15 p-3">
                    <p className="text-[9px] uppercase text-slate-600">Allocations</p>
                    <p className="mt-1 text-[11px]">{model.allocations.length}</p>
                  </div>
                </div>
                <div className={tableWrapClass}>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th>Target dimension</th>
                        <th>Instrument / sleeve</th>
                        <th className="text-right">Target weight</th>
                        <th className="text-right">Live weight</th>
                        <th className="text-right">Drift</th>
                        <th>Drift status</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.allocations.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-[11px] text-slate-500">
                            No allocations on this model.
                          </td>
                        </tr>
                      )}
                      {model.allocations.map((allocation) => {
                        const live = allocation.live
                        const drift = live != null ? live - allocation.target : allocation.drift
                        const abs = drift != null ? Math.abs(drift) : null
                        const action =
                          allocation.recommendation && allocation.recommendation !== '—'
                            ? allocation.recommendation
                            : abs == null
                              ? '—'
                              : abs < 1
                                ? 'Hold'
                                : drift! > 0
                                  ? 'Trim'
                                  : 'Add'
                        return (
                          <tr key={`${allocation.dimension}-${allocation.asset}`}>
                            <td>
                              <Pill tone="blue">{allocation.dimension}</Pill>
                            </td>
                            <td className="font-semibold">{allocation.asset}</td>
                            <td className="text-right font-mono">{allocation.target.toFixed(1)}%</td>
                            <td className="text-right font-mono">{live != null ? `${live.toFixed(1)}%` : '—'}</td>
                            <td className={cn('text-right font-mono', abs != null && abs >= 2 ? 'text-amber-300' : 'text-slate-400')}>
                              {drift != null ? `${drift > 0 ? '+' : ''}${drift.toFixed(1)}%` : '—'}
                            </td>
                            <td>
                              <Pill tone={abs == null ? 'slate' : abs >= 3 ? 'red' : abs >= 1 ? 'amber' : 'green'}>
                                {abs == null ? 'Unknown' : abs >= 3 ? 'Outside band' : abs >= 1 ? 'Watch' : 'On target'}
                              </Pill>
                            </td>
                            <td>{action}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </OrdersCard>
              <OrdersCard title="Rebalance recommendations" eyebrow="From model drift · no execution">
                <div className="grid gap-3 p-4 md:grid-cols-3">
                  {model.allocations
                    .filter((item) => {
                      const d = item.live != null ? Math.abs(item.live - item.target) : Math.abs(item.drift ?? 0)
                      return d >= 1
                    })
                    .map((item) => {
                      const buy = (item.live ?? item.target) < item.target
                      const d = item.live != null ? Math.abs(item.live - item.target) : Math.abs(item.drift ?? 0)
                      return (
                        <div key={item.asset} className="rounded-[18px] border border-white/[0.07] bg-black/15 p-3">
                          <div className="flex justify-between">
                            <b>{item.asset}</b>
                            <Pill tone={buy ? 'green' : 'red'}>{buy ? 'BUY' : 'SELL'}</Pill>
                          </div>
                          <p className="mt-3 font-mono text-sm">{d.toFixed(1)}% drift</p>
                          <p className="mt-1 text-[9px] text-slate-500">
                            {item.live != null ? `Move ${item.live.toFixed(1)}% → ${item.target.toFixed(1)}%` : `Target ${item.target.toFixed(1)}%`}
                          </p>
                        </div>
                      )
                    })}
                  {recCount === 0 && <p className="col-span-full py-6 text-center text-[11px] text-slate-500">No rebalance recommendations at current drift thresholds.</p>}
                </div>
              </OrdersCard>
            </>
          )}
        </div>
      </div>

      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? 'Edit model targets' : 'Create model portfolio'}
        subtitle={editing ? 'Updates via investment ops model-portfolios PATCH.' : 'Creates via investment ops model-portfolios API.'}
        footer={
          <>
            <button className={buttonClass} onClick={() => setEditing(undefined)}>
              Cancel
            </button>
            <button disabled={!name.trim() || saveBusy} className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={() => void save()}>
              {saveBusy ? 'Saving…' : 'Save model'}
            </button>
          </>
        }
      >
        {saveError && <p className="mb-3 text-[11px] text-rose-300">{saveError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Model name *">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Strategy code">
            <input className={inputClass} value={strategy} onChange={(event) => setStrategy(event.target.value)} placeholder="e.g. MODERATE_GROWTH" />
          </Field>
          <Field label="Linked fund">
            <SelectField value={linkedFundId} onChange={setLinkedFundId}>
              {funds.length === 0 && <option value="">No funds</option>}
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field label="Security target weights" hint="Comma separated instrument and percentage">
            <input className={inputClass} value={targets} onChange={(event) => setTargets(event.target.value)} placeholder="DELTA 20, INNSCOR 20, Cash 10" />
          </Field>
        </div>
      </Modal>
    </OrdersPage>
  )
}
