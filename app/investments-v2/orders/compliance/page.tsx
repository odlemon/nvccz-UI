'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileUp, Loader2, Search, ShieldAlert } from 'lucide-react'
import { buttonClass, Field, inputClass, Metric, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { formatOpsError, investmentOpsApi } from '@/lib/api/investment-ops-api'
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

export default function CompliancePage() {
  const [rules, setRules] = useState<ComplianceRuleRow[]>([])
  const [results, setResults] = useState<ComplianceResultRow[]>([])
  const [fundNames, setFundNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [override, setOverride] = useState<ComplianceRuleRow | null>(null)
  const [reason, setReason] = useState('')
  const [approver, setApprover] = useState('')
  const [document, setDocument] = useState('')
  const [history, setHistory] = useState<OverrideHistory[]>([])
  const [overrideBusy, setOverrideBusy] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesRes, resultsRes, portfoliosRes] = await Promise.all([
        investmentOpsApi.listComplianceRules(),
        investmentOpsApi.listComplianceResults({ pageSize: 100 }),
        investmentOpsApi.listPortfolios(),
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
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load compliance data'))
      setRules([])
      setResults([])
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

  const submit = async () => {
    if (!override || !reason || !approver || !document) return
    setOverrideBusy(true)
    setOverrideError(null)
    try {
      // Override API requires orderId; rule-library overrides are recorded locally until a breach row exists.
      setHistory((h) => [
        {
          order: override.ruleCode,
          reason,
          approver,
          document,
          time: new Date().toLocaleString(),
          outcome: 'Approved with Exception',
        },
        ...h,
      ])
      setOverride(null)
      setReason('')
      setApprover('')
      setDocument('')
    } catch (e) {
      setOverrideError(e instanceof Error ? e.message : 'Override failed')
    } finally {
      setOverrideBusy(false)
    }
  }

  return (
    <OrdersPage title="Compliance" description="Pre-trade mandate checks, exceptions and a complete local override audit trail.">
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {error}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Active rules" value={loading ? '…' : String(activeCount)} tone="text-emerald-300" />
        <Metric label="Inactive" value={loading ? '…' : String(inactiveCount)} tone="text-amber-300" />
        <Metric label="Override history" value={String(history.length)} tone="text-red-300" />
        <Metric label="Rule types" value={loading ? '…' : String(new Set(rules.map((r) => r.ruleType)).size)} tone="text-blue-300" />
      </div>

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
                  <td colSpan={7} className="py-12 text-center text-[11px] text-slate-500">
                    <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
                    Loading compliance rules…
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
                        <button className={cn(buttonClass, 'h-7 border-amber-400/30 px-3 text-amber-300')} onClick={() => setOverride(x)}>
                          <ShieldAlert className="h-3 w-3" /> Override note
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
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-[11px] text-slate-500">
                      <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
                      Loading pre-trade results…
                    </td>
                  </tr>
                )}
                {!loading && results.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-[11px] text-slate-500">
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
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </OrdersCard>
        <OrdersCard title="Override audit history" eyebrow={`${history.length} records`}>
          <div className="space-y-2 p-3">
            {history.length === 0 && <p className="py-8 text-center text-[11px] text-slate-500">No override notes yet.</p>}
            {history.map((h) => (
              <div key={`${h.time}-${h.order}`} className="rounded-[18px] border border-white/[0.07] bg-[#080e18] p-3">
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
        open={!!override}
        onClose={() => setOverride(null)}
        title={`Compliance note · ${override?.ruleCode ?? ''}`}
        subtitle="Record a local override rationale. Order-level overrides require an order id from a breach."
        footer={
          <>
            <button className={buttonClass} onClick={() => setOverride(null)}>
              Cancel
            </button>
            <button disabled={!reason || !approver || !document || overrideBusy} className={cn(buttonClass, 'bg-amber-500 text-slate-950')} onClick={() => void submit()}>
              {overrideBusy ? 'Saving…' : 'Save note'}
            </button>
          </>
        }
      >
        {overrideError && <p className="mb-3 text-[11px] text-rose-300">{overrideError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rule">
            <div className={cn(inputClass, 'flex items-center')}>{override?.rule}</div>
          </Field>
          <Field label="Timestamp">
            <div className={cn(inputClass, 'flex items-center')}>{new Date().toLocaleString()}</div>
          </Field>
          <Field label="Approver">
            <SelectField value={approver} onChange={setApprover}>
              <option value="">Select approver</option>
              <option>CIO</option>
              <option>Head of Risk</option>
              <option>Compliance</option>
            </SelectField>
          </Field>
          <Field label="Supporting document">
            <label className={cn(inputClass, 'flex cursor-pointer items-center gap-2')}>
              <FileUp className="h-3.5 w-3.5" />
              {document || 'Attach approval memo'}
              <input type="file" className="hidden" onChange={(e) => setDocument(e.target.files?.[0]?.name ?? '')} />
            </label>
          </Field>
          <Field label="Override reason">
            <textarea className={cn(inputClass, 'h-24 resize-none py-2')} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain rationale and mitigating controls…" />
          </Field>
        </div>
      </Modal>
    </OrdersPage>
  )
}
