'use client'

import { useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { cn } from '@/lib/utils'
import { Download, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPortfolios,
  fetchOrders,
  fetchComplianceRules,
  createComplianceRule,
  createComplianceOverride,
} from '@/lib/store/slices/investmentOpsSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
import { ConfirmReasonDialog } from '@/components/investments-v2/ui/confirm-reason-dialog'

function resultBadgeStatus(outcome: string) {
  if (outcome === 'PASSED') return 'passed'
  if (outcome === 'WARNING') return 'warning'
  if (outcome === 'BREACH') return 'failed'
  return outcome.toLowerCase()
}

const newRuleFields = {
  ruleCode: '',
  ruleName: '',
  ruleType: 'MAX_SINGLE_SECURITY_WEIGHT',
  thresholdValue: '',
}

export default function CompliancePage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    orders,
    complianceRules,
    complianceRuleCreating,
    complianceOverrideSubmittingByOrderId,
    selectedFundId,
  } = useAppSelector((s) => s.investmentOps)
  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [showAddRule, setShowAddRule] = useState(false)
  const [ruleForm, setRuleForm] = useState(newRuleFields)
  const [ruleFormError, setRuleFormError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [overrideDialog, setOverrideDialog] = useState<{ orderId: string; orderRef: string } | null>(null)

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchOrders({ pageSize: 100 }))
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchComplianceRules({ fundId: selectedFundId ?? undefined }))
  }, [dispatch, selectedFundId])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  const results = useMemo(() => {
    return orders.flatMap((o) =>
      (o.complianceResults ?? []).map((r) => ({ order: o, result: r }))
    )
  }, [orders])

  const filteredResults = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return results
    return results.filter(({ order: o }) => {
      const haystack = [o.orderRef, o.instrument?.ticker ?? '', fundName(o.fundId)].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [results, searchText])

  const passedCount = results.filter((x) => x.result.outcome === 'PASSED').length
  const warningCount = results.filter((x) => x.result.outcome === 'WARNING').length
  const failedCount = results.filter((x) => x.result.outcome === 'BREACH').length
  const activeRulesCount = complianceRules.filter((r) => r.isActive).length

  const handleAddRule = async () => {
    setRuleFormError('')
    if (!ruleForm.ruleCode || !ruleForm.ruleName || !ruleForm.ruleType || !ruleForm.thresholdValue) {
      setRuleFormError('Rule Code, Rule Name, Rule Type, and Threshold Value are all required.')
      return
    }
    try {
      await dispatch(
        createComplianceRule({
          ruleCode: ruleForm.ruleCode,
          ruleName: ruleForm.ruleName,
          ruleType: ruleForm.ruleType,
          thresholdValue: Number(ruleForm.thresholdValue),
        })
      ).unwrap()
      setRuleForm(newRuleFields)
      setShowAddRule(false)
    } catch (err: any) {
      setRuleFormError(err?.message || 'Failed to create rule')
    }
  }

  const handleExport = () => {
    exportRowsToCsv(
      `compliance-results-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Order ID', 'Portfolio', 'Ticker', 'Side', 'Rule Checked', 'Result'],
      filteredResults.map(({ order: o, result: r }) => {
        const rule = complianceRules.find((cr) => cr.id === r.ruleId)
        return [o.orderRef, fundName(o.fundId), o.instrument?.ticker ?? '', o.side, rule?.ruleName ?? r.ruleId ?? '', r.outcome]
      })
    )
  }

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
      <Topbar title="Compliance" subtitle="Pre-trade checks & mandate rules" showPeriod={false} />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary badges */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Checks Passed', value: String(passedCount), color: 'text-[#10B981]', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Warnings', value: String(warningCount), color: 'text-[#F59E0B]', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Failed', value: String(failedCount), color: 'text-[#EF4444]', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Active Rules', value: String(activeRulesCount), color: 'text-[#60A5FA]', bg: 'bg-blue-500/10 border-blue-500/20' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-md p-3 border', s.bg)}>
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-1">{s.label}</div>
              <div className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Compliance results */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] flex-wrap gap-2">
            <div className="text-xs font-semibold text-[#E8EDF5]">Pre-Trade Compliance Results</div>
            <div className="flex items-center gap-2">
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search order ref or ticker…"
                className="w-56"
              />
              <Button variant="outline" size="pill" onClick={handleExport}>
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>
          </div>
          <table className="arcus-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Portfolio</th>
                <th>Ticker</th>
                <th>Side</th>
                <th>Rule Checked</th>
                <th>Limit</th>
                <th>Current</th>
                <th>After Trade</th>
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(({ order: o, result: r }) => {
                const rule = complianceRules.find((cr) => cr.id === r.ruleId)
                return (
                  <tr key={r.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{o.orderRef}</td>
                    <td className="text-[#A8B4C8]">{fundName(o.fundId)}</td>
                    <td className="text-[#C8D3E8] font-mono font-semibold">{o.instrument?.ticker ?? '—'}</td>
                    <td>
                      <span className={cn('text-xs font-bold', o.side === 'BUY' ? 'text-[#10B981]' : 'text-[#EF4444]')}>{o.side}</span>
                    </td>
                    <td className="text-[#A8B4C8]">{rule?.ruleName ?? r.ruleId ?? '—'}</td>
                    <td className="font-mono">{rule ? `${rule.thresholdValue}${rule.thresholdUnit ?? ''}` : '—'}</td>
                    <td className="font-mono text-[#6B7A95]">—</td>
                    <td className="font-mono">—</td>
                    <td><StatusBadge status={resultBadgeStatus(r.outcome)} /></td>
                    <td>
                      {r.outcome === 'BREACH' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/10"
                          disabled={!!complianceOverrideSubmittingByOrderId[o.id]}
                          onClick={() => setOverrideDialog({ orderId: o.id, orderRef: o.orderRef })}
                        >
                          Request Override
                        </Button>
                      ) : (
                        <span className="text-[10px] text-[#4B5A72]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No compliance results yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mandate rules */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <div className="text-xs font-semibold text-[#E8EDF5]">Active Mandate Rules</div>
            <Button variant="default" size="pill" onClick={() => setShowAddRule(true)}>+ Add Rule</Button>
          </div>

          {showAddRule && (
            <div className="px-4 py-3 border-b border-white/[0.06] bg-[#0A1220]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold text-[#E8EDF5]">New Compliance Rule</div>
                <button onClick={() => setShowAddRule(false)} className="text-[#6B7A95] hover:text-[#EF4444]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Rule Code *</label>
                  <Input
                    value={ruleForm.ruleCode}
                    onChange={(e) => setRuleForm((p) => ({ ...p, ruleCode: e.target.value }))}
                    placeholder="e.g. MAX_WEIGHT"
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Rule Name *</label>
                  <Input
                    value={ruleForm.ruleName}
                    onChange={(e) => setRuleForm((p) => ({ ...p, ruleName: e.target.value }))}
                    placeholder="e.g. Max 25% single name"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Rule Type *</label>
                  <Input
                    value={ruleForm.ruleType}
                    onChange={(e) => setRuleForm((p) => ({ ...p, ruleType: e.target.value }))}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Threshold Value *</label>
                  <Input
                    type="number"
                    value={ruleForm.thresholdValue}
                    onChange={(e) => setRuleForm((p) => ({ ...p, thresholdValue: e.target.value }))}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
              </div>
              {ruleFormError && <div className="text-[11px] text-[#EF4444] mt-2">{ruleFormError}</div>}
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button variant="outline" size="pill" onClick={() => setShowAddRule(false)}>Cancel</Button>
                <Button variant="default" size="pill" onClick={handleAddRule} disabled={complianceRuleCreating}>
                  {complianceRuleCreating ? 'Saving…' : 'Save Rule'}
                </Button>
              </div>
            </div>
          )}

          <table className="arcus-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Portfolio Scope</th>
                <th>Limit / Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {complianceRules.map(rule => (
                <tr key={rule.id}>
                  <td className="text-[#C8D3E8]">{rule.ruleName}</td>
                  <td className="text-[#6B7A95]">{rule.fundId ? fundName(rule.fundId) : 'All'}</td>
                  <td className="font-mono">{rule.thresholdValue}{rule.thresholdUnit ?? ''}</td>
                  <td><StatusBadge status={rule.isActive ? 'active' : 'inactive'} /></td>
                </tr>
              ))}
              {complianceRules.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No compliance rules configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {overrideDialog && (
        <ConfirmReasonDialog
          open={!!overrideDialog}
          onOpenChange={(o) => !o && setOverrideDialog(null)}
          title={`Request Override — ${overrideDialog.orderRef}`}
          description="Requesting an override lets this order proceed despite a compliance breach. Provide a reason for the audit trail."
          reasonLabel="Reason for override"
          confirmLabel="Request Override"
          onConfirm={(reason) => {
            const d = overrideDialog
            setOverrideDialog(null)
            if (d) dispatch(createComplianceOverride({ orderId: d.orderId, reason }))
          }}
          container={themeContainer}
        />
      )}
    </div>
  )
}
