'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search, ShieldAlert } from 'lucide-react'
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
import { toast } from 'sonner'

type OverrideHistory = {
  id: string
  order: string
  reason: string
  approver: string
  time: string
  document: string
  outcome: string
  version?: number | string | null
}

const outcomeTone = (outcome: string): 'green' | 'amber' | 'red' | 'slate' | 'violet' | 'blue' => {
  const u = outcome.toUpperCase().replace(/\s+/g, '_')
  if (u === 'PASSED' || u === 'PASS' || outcome === 'Passed') return 'green'
  if (u === 'WARNING' || u === 'WARN' || outcome === 'Warning') return 'amber'
  if (u.includes('APPROVED_WITH') || outcome === 'Approved with Exception') return 'violet'
  if (
    u === 'FAILED' ||
    u === 'FAIL' ||
    u === 'BREACH' ||
    u === 'REJECTED' ||
    u.includes('REQUIRES_OVERRIDE') ||
    outcome === 'Failed' ||
    outcome === 'Rejected' ||
    outcome === 'Requires Override'
  ) {
    return 'red'
  }
  return 'slate'
}

const isOverrideEligible = (row: ComplianceResultRow) => {
  if (!row.id && !row.orderId) return false
  const code = (row.outcomeCode || row.outcome).toUpperCase().replace(/\s+/g, '_')
  return (
    code === 'FAILED' ||
    code === 'FAIL' ||
    code === 'BREACH' ||
    code === 'WARNING' ||
    code === 'WARN' ||
    code === 'REQUIRES_OVERRIDE' ||
    row.outcome === 'Failed' ||
    row.outcome === 'Warning' ||
    row.outcome === 'Requires Override'
  )
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
  const [resultsFilter, setResultsFilter] = useState<'all' | 'override'>('all')
  const [historyAction, setHistoryAction] = useState<{ id: string; decision: 'approve' | 'reject' } | null>(
    null,
  )

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
            id: String(row.id ?? ''),
            order: String(row.orderRef ?? row.orderId ?? '—'),
            reason: String(row.reason ?? row.reasonCode ?? '—'),
            approver: String(row.createdByName ?? row.createdById ?? '—'),
            document: row.reasonCode ? String(row.reasonCode) : 'Override recorded',
            time: row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—',
            outcome: String(row.status ?? '—'),
            version:
              (row as { version?: number | string; expectedVersion?: number | string }).version ??
              (row as { expectedVersion?: number | string }).expectedVersion ??
              null,
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

  const visibleResults = useMemo(() => {
    if (resultsFilter === 'override') return results.filter(isOverrideEligible)
    return results
  }, [results, resultsFilter])

  const overrideEligibleCount = useMemo(() => results.filter(isOverrideEligible).length, [results])

  const submitOverride = async () => {
    if (!reason.trim()) return
    if (!resultOverride?.id && !resultOverride?.orderId && !resultOverride?.orderRef) {
      setOverrideError('Missing compliance result id — refresh Pre-trade results and try again.')
      return
    }
    setOverrideBusy(true)
    setOverrideError(null)
    try {
      const res = await investmentOpsApi.createComplianceOverride({
        ...(resultOverride.id ? { complianceResultId: resultOverride.id } : {}),
        ...(resultOverride.orderId ? { orderId: resultOverride.orderId } : {}),
        ...(resultOverride.orderRef && resultOverride.orderRef !== '—'
          ? { orderRef: resultOverride.orderRef }
          : {}),
        reasonCode: 'CLIENT_OVERRIDE',
        reason: reason.trim(),
      })
      if (res.success === false) {
        setOverrideError(formatOpsError(res, 'Override failed'))
        return
      }
      const status = String(
        (res.data as { status?: string } | undefined)?.status ?? '',
      ).toUpperCase()
      toast.success(
        status === 'PENDING'
          ? 'Override recorded (PENDING).'
          : 'Compliance override submitted.',
      )
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

  const decideOverride = async (item: OverrideHistory, decision: 'approve' | 'reject') => {
    if (!item.id) {
      toast.error('Override is missing an id — refresh and try again.')
      return
    }
    if (historyAction) return
    setHistoryAction({ id: item.id, decision })
    try {
      const body =
        decision === 'approve'
          ? { ...(item.version != null ? { expectedVersion: item.version } : {}) }
          : {
              reason: 'Walkthrough — override rejected',
              ...(item.version != null ? { expectedVersion: item.version } : {}),
            }
      const res =
        decision === 'approve'
          ? await investmentOpsApi.approveComplianceOverride(item.id, body)
          : await investmentOpsApi.rejectComplianceOverride(item.id, body as { reason: string })
      if (res.success === false) {
        toast.error(formatOpsError(res, `Failed to ${decision} override`))
        return
      }
      toast.success(decision === 'approve' ? 'Override approved.' : 'Override rejected.')
      await load()
    } catch (e) {
      toast.error(formatOpsError(e, `Failed to ${decision} override`))
    } finally {
      setHistoryAction(null)
    }
  }

  return (
    <OrdersPage
      title="Compliance"
      description="Pre-trade mandate checks run before orders route to the blotter. Review rule breaches, submit documented overrides, and audit who approved exceptions."
    >
      <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] leading-relaxed text-slate-400">
        This page has <span className="text-slate-200">no inner tabs</span> — scroll the sections below.
        <br />
        <span className="text-slate-300">1.</span> Mandate rule library = rules only (Request override there stays locked).
        <br />
        <span className="text-slate-300">2.</span> Pre-trade results = live checks. Look at <span className="text-slate-200">Outcome</span> (SRD labels like Failed / Warning, not raw BREACH).
        <br />
        <span className="text-slate-300">3.</span> On a Failed / Warning / Requires Override row, click <span className="text-amber-300">Override</span>, then in history click <span className="text-emerald-300">Approve override</span>.
      </p>
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
                          title="Overrides are started from Pre-trade results below — not from the rule library"
                          className={cn(buttonClass, 'h-7 cursor-not-allowed border-white/10 px-3 text-slate-500 opacity-60')}
                        >
                          <ShieldAlert className="h-3 w-3" /> Use results below ↓
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
        <OrdersCard
          title="Pre-trade results"
          eyebrow={loading ? 'Loading…' : `${results.length} checks · ${overrideEligibleCount} override-eligible`}
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                className={cn(buttonClass, 'h-8 px-3', resultsFilter === 'all' && 'border-blue-400/40 bg-blue-600/20 text-blue-200')}
                onClick={() => setResultsFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={cn(
                  buttonClass,
                  'h-8 px-3',
                  resultsFilter === 'override' && 'border-amber-400/40 bg-amber-500/15 text-amber-200',
                )}
                onClick={() => setResultsFilter('override')}
              >
                Override-eligible ({overrideEligibleCount})
              </button>
            </div>
          }
        >
          <div className={cn(tableWrapClass, 'max-h-[min(28rem,55vh)] overflow-y-auto')}>
            <table className={cn(tableClass, '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[#0b1320]')}>
              <thead>
                <tr>
                  <th>Order ref</th>
                  <th>Outcome</th>
                  <th>Action</th>
                  <th>Ticker</th>
                  <th>Side</th>
                  <th>Rule</th>
                  <th>Portfolio</th>
                  <th>Limit</th>
                  <th>Current</th>
                  <th>After trade</th>
                  <th>Checked</th>
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
                {!loading && visibleResults.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-[11px] text-slate-500">
                      {resultsFilter === 'override'
                        ? 'No Failed / Warning / Requires Override rows right now. Switch to All, or place an order that breaches a mandate.'
                        : 'No pre-trade compliance results yet.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  visibleResults.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(isOverrideEligible(row) && 'bg-amber-500/[0.04]')}
                    >
                      <td className="font-mono text-blue-300">{row.orderRef}</td>
                      <td>
                        <Pill tone={outcomeTone(row.outcome)}>{row.outcome}</Pill>
                      </td>
                      <td>
                        {isOverrideEligible(row) ? (
                          <button
                            type="button"
                            className={cn(buttonClass, 'h-7 border-amber-400/30 px-3 text-amber-300')}
                            onClick={() => {
                              setResultOverride(row)
                              setReason('Client override demo — documented exception')
                              setOverrideError(null)
                            }}
                          >
                            <ShieldAlert className="h-3 w-3" /> Override
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="font-semibold">{row.ticker}</td>
                      <td className={row.side === 'BUY' ? 'text-emerald-300' : row.side === 'SELL' ? 'text-red-300' : ''}>
                        {row.side}
                      </td>
                      <td>
                        {row.ruleName}
                        <div className="text-[9px] text-slate-600">{row.ruleType}</div>
                      </td>
                      <td>{fundNames[row.fundId] ?? row.fundId}</td>
                      <td className="font-mono">{row.limitDisplay}</td>
                      <td className="font-mono text-slate-500">{row.currentDisplay}</td>
                      <td className="font-mono">{row.afterTradeDisplay}</td>
                      <td className="text-slate-500">{row.createdAt}</td>
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
            {history.map((h, index) => {
              const pending = h.outcome.toUpperCase() === 'PENDING'
              const approveBusy = historyAction?.id === h.id && historyAction.decision === 'approve'
              const rejectBusy = historyAction?.id === h.id && historyAction.decision === 'reject'
              const anyBusy = Boolean(historyAction)
              return (
                <div key={`${h.id || h.document}-${h.time}-${index}`} className="rounded-[18px] border border-white/[0.07] bg-[#080e18] p-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-[10px] text-blue-300">{h.order}</span>
                    <Pill tone={pending ? 'amber' : h.outcome.toUpperCase().includes('REJECT') ? 'red' : 'violet'}>
                      {h.outcome}
                    </Pill>
                  </div>
                  <p className="mt-2 text-[10px]">{h.reason}</p>
                  <p className="mt-2 text-[9px] text-slate-500">
                    {h.approver} · {h.time} · {h.document}
                  </p>
                  {pending && h.id ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={anyBusy}
                        className={cn(
                          buttonClass,
                          'h-8 border-emerald-400/40 px-3 text-emerald-300',
                          anyBusy && !approveBusy && 'opacity-40',
                        )}
                        onClick={() => void decideOverride(h, 'approve')}
                      >
                        {approveBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {approveBusy ? 'Approving…' : 'Approve override'}
                      </button>
                      <button
                        type="button"
                        disabled={anyBusy}
                        className={cn(
                          buttonClass,
                          'h-8 border-rose-400/30 px-3 text-rose-300',
                          anyBusy && !rejectBusy && 'opacity-40',
                        )}
                        onClick={() => void decideOverride(h, 'reject')}
                      >
                        {rejectBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {rejectBusy ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
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
              {overrideBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {overrideBusy ? 'Submitting…' : 'Submit override'}
            </button>
          </>
        }
      >
        {overrideError && <p className="mb-3 text-[11px] text-rose-300">{overrideError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order ref">
            <input readOnly value={resultOverride?.orderRef ?? ''} className={inputClass} />
          </Field>
          <Field label="Rule">
            <input readOnly value={resultOverride?.ruleName ?? ''} className={inputClass} />
          </Field>
          <Field label="Result id">
            <input readOnly value={resultOverride?.id ?? ''} className={inputClass} />
          </Field>
          <Field label="Outcome">
            <input readOnly value={resultOverride?.outcome ?? ''} className={inputClass} />
          </Field>
          <Field label="Checked">
            <input readOnly value={resultOverride?.createdAt ?? ''} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Override reason">
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-[#0a1220] px-4 py-3 text-[11px] text-slate-100 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-600"
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
