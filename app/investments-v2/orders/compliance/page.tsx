'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, ShieldAlert } from 'lucide-react'
import { OpsKpiSkeleton, OpsListSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { buttonClass, Field, inputClass, Metric, Modal, OrdersCard, OrdersPage, Pill, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { formatOpsError, investmentOpsApi, unwrapList } from '@/lib/api/investment-ops-api'
import {
  fundNameMap,
  mapComplianceResults,
  mapComplianceRules,
  type ComplianceResultRow,
  type ComplianceRuleRow,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'

type OverrideHistory = {
  order: string
  reason: string
  approver: string
  time: string
  document: string
  outcome: string
}

const outcomeTone = (outcome: string): 'green' | 'amber' | 'red' | 'slate' => {
  const u = outcome.toUpperCase()
  if (u === 'PASSED' || u === 'PASS') return 'green'
  if (u === 'WARNING' || u === 'WARN') return 'amber'
  if (u === 'BREACH' || u === 'FAILED' || u === 'FAIL') return 'red'
  return 'slate'
}

const isOverrideEligible = (row: ComplianceResultRow) => {
  const u = row.outcome.toUpperCase()
  return Boolean(row.orderId) && (u === 'BREACH' || u === 'FAILED' || u === 'FAIL' || u === 'WARNING' || u === 'WARN')
}

export default function CompliancePage() {
  const [rules, setRules] = useState<ComplianceRuleRow[]>([])
  const [results, setResults] = useState<ComplianceResultRow[]>([])
  const [fundNames, setFundNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [resultOverride, setResultOverride] = useState<ComplianceResultRow | null>(null)
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState<OverrideHistory[]>([])
  const [overrideBusy, setOverrideBusy] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesRes, resultsRes, portfoliosRes, overridesRes] = await Promise.all([
        investmentOpsApi.listComplianceRules(),
        investmentOpsApi.listComplianceResults({ pageSize: 100 }),
        investmentOpsApi.listPortfolios(),
        investmentOpsApi.listComplianceOverrides({ page: 1, pageSize: 100 }),
      ])
      if (rulesRes.success === false) {
        throw new Error(formatOpsError(rulesRes, 'Failed to load compliance rules'))
      }
      if (resultsRes.success === false) {
        throw new Error(formatOpsError(resultsRes, 'Failed to load compliance results'))
      }
      const names = fundNameMap(portfoliosRes.data)
      setFundNames(names)
      setRules(mapComplianceRules(rulesRes.data, names))
      setResults(mapComplianceResults(resultsRes.data))
      if (overridesRes.success !== false) {
        const items = unwrapList<Record<string, unknown>>(overridesRes.data)
        setHistory(
          items.map((row) => ({
            order: String(row.orderRef ?? row.orderId ?? '—'),
            reason: String(row.reason ?? row.reasonCode ?? '—'),
            approver: String(row.createdByName ?? row.createdById ?? '—'),
            document: row.id ? `Override ${String(row.id)}` : '—',
            time: row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—',
            outcome: String(row.status ?? '—'),
          })),
        )
      } else {
        setHistory([])
      }
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load compliance data'))
      setRules([])
      setResults([])
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => rules.filter((x) => Object.values(x).join(' ').toLowerCase().includes(query.toLowerCase())),
    [rules, query],
  )

  const activeCount = rules.filter((r) => r.isActive).length
  const inactiveCount = rules.length - activeCount

  const submitOverride = async () => {
    if (!resultOverride?.orderId || !reason.trim()) return
    setOverrideBusy(true)
    setOverrideError(null)
    try {
      const res = await investmentOpsApi.createComplianceOverride({
        orderId: resultOverride.orderId,
        reason: reason.trim(),
      })
      if (res.success === false) {
        setOverrideError(formatOpsError(res, 'Override failed'))
        return
      }
      setResultOverride(null)
      setReason('')
      await load()
    } catch (e) {
      setOverrideError(formatOpsError(e, 'Override failed'))
    } finally {
      setOverrideBusy(false)
    }
  }

  const closeOverrideModal = () => {
    setResultOverride(null)
    setReason('')
    setOverrideError(null)
  }

  return (
    <OrdersPage title="Compliance" description="Pre-trade mandate checks, exceptions and API-backed override history.">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {error}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {loading && rules.length === 0 ? (
        <OpsKpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Active rules" value={loading ? '…' : String(activeCount)} tone="text-emerald-300" />
          <Metric label="Inactive" value={loading ? '…' : String(inactiveCount)} tone="text-amber-300" />
          <Metric label="Override history" value={String(history.length)} tone="text-red-300" />
          <Metric label="Rule types" value={loading ? '…' : String(new Set(rules.map((r) => r.ruleType)).size)} tone="text-blue-300" />
        </div>
      )}

      <OrdersCard
        title="Mandate rule library"
        eyebrow="Compliance rules"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
            <input className={cn(inputClass, 'w-64 pl-8')} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rule, type or portfolio" />
          </div>
        }
      >
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Category</th>
                <th>Rule</th>
                <th>Scope</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <OpsTableSkeleton rows={8} cols={7} />
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[11px] text-slate-500">
                    No compliance rules found.
                  </td>
                </tr>
              )}
              {!loading &&
                visible.map((x) => (
                  <tr key={x.id}>
                    <td className="font-mono text-blue-300">{x.ruleCode}</td>
                    <td>{x.category}</td>
                    <td>{x.rule}</td>
                    <td>{x.scope}</td>
                    <td className="font-mono">{x.threshold}</td>
                    <td>
                      <Pill tone={x.isActive ? 'green' : 'slate'}>{x.status}</Pill>
                    </td>
                    <td>
                      {x.isActive ? (
                        <button
                          type="button"
                          disabled
                          title="Select a breach from Pre-trade results"
                          className={cn(buttonClass, 'h-7 cursor-not-allowed border-white/10 px-3 text-slate-500 opacity-60')}
                        >
                          <ShieldAlert className="h-3 w-3" /> Request override
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </OrdersCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <OrdersCard title="Pre-trade results" eyebrow={loading ? 'Loading…' : `${results.length} checks`}>
          <div className={tableWrapClass}>
            <table className={tableClass}>
              <thead>
                <tr>
                  <th>Order ref</th>
                  <th>Portfolio</th>
                  <th>Ticker</th>
                  <th>Side</th>
                  <th>Rule</th>
                  <th>Limit</th>
                  <th>Current</th>
                  <th>After trade</th>
                  <th>Outcome</th>
                  <th>Checked</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <OpsTableSkeleton rows={8} cols={8} />
                    </td>
                  </tr>
                )}
                {!loading && results.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-[11px] text-slate-500">
                      No pre-trade compliance results yet.
                    </td>
                  </tr>
                )}
                {!loading &&
                  results.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono text-blue-300">{row.orderRef}</td>
                      <td>{fundNames[row.fundId] ?? row.fundId}</td>
                      <td className="font-semibold">{row.ticker}</td>
                      <td className={row.side === 'BUY' ? 'text-emerald-300' : row.side === 'SELL' ? 'text-red-300' : ''}>
                        {row.side}
                      </td>
                      <td>
                        {row.ruleName}
                        <div className="text-[9px] text-slate-600">{row.ruleType}</div>
                      </td>
                      <td className="font-mono">{row.limitDisplay}</td>
                      <td className="font-mono text-slate-500">{row.currentDisplay}</td>
                      <td className="font-mono">{row.afterTradeDisplay}</td>
                      <td>
                        <Pill tone={outcomeTone(row.outcome)}>{row.outcome}</Pill>
                      </td>
                      <td className="text-slate-500">{row.createdAt}</td>
                      <td>
                        {isOverrideEligible(row) ? (
                          <button
                            type="button"
                            className={cn(buttonClass, 'h-7 border-amber-400/30 px-3 text-amber-300')}
                            onClick={() => {
                              setResultOverride(row)
                              setReason('')
                              setOverrideError(null)
                            }}
                          >
                            <ShieldAlert className="h-3 w-3" /> Override
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </OrdersCard>
        <OrdersCard title="Override audit history" eyebrow={loading ? 'Loading…' : `${history.length} from API`}>
          <div className="space-y-2 p-3">
            {loading && history.length === 0 ? (
              <OpsListSkeleton rows={4} />
            ) : history.length === 0 ? (
              <p className="py-8 text-center text-[11px] text-slate-500">No overrides returned by the API.</p>
            ) : null}
            {history.map((h, index) => (
              <div key={`${h.document}-${h.time}-${index}`} className="rounded-[18px] border border-white/[0.07] bg-[#080e18] p-3">
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] text-blue-300">{h.order}</span>
                  <Pill tone="violet">{h.outcome}</Pill>
                </div>
                <p className="mt-2 text-[10px]">{h.reason}</p>
                <p className="mt-2 text-[9px] text-slate-500">
                  {h.approver} · {h.time} · {h.document}
                </p>
              </div>
            ))}
          </div>
        </OrdersCard>
      </div>

      <Modal
        open={!!resultOverride}
        onClose={closeOverrideModal}
        title={`Compliance override · ${resultOverride?.orderRef ?? ''}`}
        subtitle="Submit an order-level override for this pre-trade breach or warning."
        footer={
          <>
            <button className={buttonClass} onClick={closeOverrideModal}>
              Cancel
            </button>
            <button
              disabled={!reason.trim() || overrideBusy}
              className={cn(buttonClass, 'bg-amber-500 text-slate-950')}
              onClick={() => void submitOverride()}
            >
              {overrideBusy ? 'Submitting…' : 'Submit override'}
            </button>
          </>
        }
      >
        {overrideError && <p className="mb-3 text-[11px] text-rose-300">{overrideError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order ref">
            <div className={cn(inputClass, 'flex items-center font-mono text-blue-300')}>{resultOverride?.orderRef}</div>
          </Field>
          <Field label="Rule">
            <div className={cn(inputClass, 'flex items-center')}>{resultOverride?.ruleName}</div>
          </Field>
          <Field label="Outcome">
            <div className={cn(inputClass, 'flex items-center')}>{resultOverride?.outcome}</div>
          </Field>
          <Field label="Checked">
            <div className={cn(inputClass, 'flex items-center')}>{resultOverride?.createdAt}</div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Override reason">
              <textarea
                className={cn(inputClass, 'h-24 resize-none py-2')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain rationale and mitigating controls…"
              />
            </Field>
          </div>
        </div>
      </Modal>
    </OrdersPage>
  )
}
