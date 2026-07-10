'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Upload, Filter, RefreshCw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPortfolios,
  fetchReconciliationBatches,
  runReconciliation,
  uploadReconciliation,
  fetchReconciliationBatchDetail,
  resolveReconciliationItem,
} from '@/lib/store/slices/investmentOpsSlice'

const reconTabs = ['Cash Recon', 'Holdings', 'Trade Recon', 'Exceptions']

function parseInternalRef(ref: string | null) {
  if (!ref) return { ticker: '—', exchange: '—' }
  const [ticker, exchange] = ref.split(':')
  return { ticker: ticker ?? ref, exchange: exchange ?? '—' }
}

const cashItems = [
  { id: 'CR-0821', portfolio: 'Equity World', account: 'Citi Custody USD', arcusBalance: 18200000, custodianBal: 18200000, diff: 0, status: 'matched', reconDate: '07 Jul 2026' },
  { id: 'CR-0820', portfolio: 'Multi Asset', account: 'BNY USD Main', arcusBalance: 11200000, custodianBal: 11195000, diff: 5000, status: 'unmatched', reconDate: '07 Jul 2026' },
  { id: 'CR-0819', portfolio: 'Fixed Income', account: 'Citi Custody USD', arcusBalance: 6800000, custodianBal: 6800000, diff: 0, status: 'matched', reconDate: '07 Jul 2026' },
  { id: 'CR-0818', portfolio: 'Asia Select', account: 'HSBC HKD Acct', arcusBalance: 4200000, custodianBal: 4210000, diff: -10000, status: 'investigating', reconDate: '07 Jul 2026' },
]

export default function ReconciliationPage() {
  const dispatch = useAppDispatch()
  const { portfolios, selectedFundId, reconciliationBatches, reconciliationRunning, selectedReconBatch, reconItemResolvingById } =
    useAppSelector((s) => s.investmentOps)
  const [activeTab, setActiveTab] = useState('Cash Recon')
  const [runReconType, setRunReconType] = useState<'HOLDINGS' | 'CUSTODIAN_POSITION'>('HOLDINGS')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchReconciliationBatches({ fundId: selectedFundId ?? undefined }))
  }, [dispatch, selectedFundId])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  const items = selectedReconBatch?.items ?? []
  const unmatchedItems = useMemo(() => items.filter((i) => i.status === 'UNMATCHED'), [items])
  const resolvedCount = useMemo(() => items.filter((i) => i.resolvedAt).length, [items])

  const handleRun = () => {
    if (!selectedFundId) return
    dispatch(runReconciliation({ fundId: selectedFundId, reconType: runReconType }))
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selectedFundId) return
    const csvText = await file.text()
    dispatch(uploadReconciliation({ fundId: selectedFundId, reconType: 'CUSTODIAN_POSITION', csvText, fileName: file.name }))
  }

  const handleResolve = (itemId: string) => {
    const reason = window.prompt('Reason for resolving this reconciliation item:')
    if (!reason) return
    dispatch(resolveReconciliationItem({ id: itemId, reason }))
  }

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Reconciliation" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {reconTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
            {t === 'Exceptions' && unmatchedItems.length > 0 && (
              <span className="ml-1.5 bg-[#F59E0B] text-black text-[9px] rounded-full px-1.5 font-semibold">{unmatchedItems.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Matched', value: String(selectedReconBatch?.matchedCount ?? 0), color: 'text-[#10B981]', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Unmatched', value: String(selectedReconBatch?.unmatchedCount ?? 0), color: 'text-[#EF4444]', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Resolved', value: String(resolvedCount), color: 'text-[#60A5FA]', bg: 'bg-[#0D1526] border-white/[0.06]' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-md p-3 border', s.bg)}>
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-1">{s.label}</div>
              <div className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7A95]">
            {selectedReconBatch ? `Reconciliation date: ${new Date(selectedReconBatch.asOfDate).toLocaleDateString()} · ${selectedReconBatch.reconType}` : 'No reconciliation run selected'}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
            <button
              onClick={handleUploadClick}
              disabled={reconciliationRunning || !selectedFundId}
              className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded disabled:opacity-50"
            >
              <Upload className="w-3 h-3" /> Upload Custodian File
            </button>
            <select
              value={runReconType}
              onChange={(e) => setRunReconType(e.target.value as 'HOLDINGS' | 'CUSTODIAN_POSITION')}
              className="bg-[#111C30] border border-white/[0.06] rounded px-2 py-1.5 text-xs text-[#A8B4C8] outline-none"
            >
              <option value="HOLDINGS">Holdings</option>
              <option value="CUSTODIAN_POSITION">Custodian Position</option>
            </select>
            <button
              onClick={handleRun}
              disabled={reconciliationRunning || !selectedFundId}
              className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3', reconciliationRunning && 'animate-spin')} /> {reconciliationRunning ? 'Running…' : 'Run Reconciliation'}
            </button>
          </div>
        </div>

        {/* Batch history */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-[#4B5A72]">Batches:</span>
          {reconciliationBatches.slice(0, 12).map((b) => (
            <button
              key={b.id}
              onClick={() => dispatch(fetchReconciliationBatchDetail(b.id))}
              className={cn(
                'text-[10px] px-2 py-1 rounded border',
                selectedReconBatch?.id === b.id ? 'border-[#2563EB] text-[#60A5FA]' : 'border-white/[0.06] text-[#6B7A95] hover:text-[#A8B4C8]'
              )}
            >
              {new Date(b.asOfDate).toLocaleDateString()} · {b.reconType} · {b.unmatchedCount === 0 ? 'clean' : `${b.unmatchedCount} unmatched`}
            </button>
          ))}
        </div>

        {activeTab === 'Cash Recon' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Cash Reconciliation</div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Recon ID</th>
                  <th>Portfolio</th>
                  <th>Account</th>
                  <th className="text-right">Arcus Balance</th>
                  <th className="text-right">Custodian Balance</th>
                  <th className="text-right">Difference</th>
                  <th>Status</th>
                  <th>Recon Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cashItems.map(item => (
                  <tr key={item.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{item.id}</td>
                    <td className="text-[#A8B4C8]">{item.portfolio}</td>
                    <td className="text-[#A8B4C8]">{item.account}</td>
                    <td className="text-right font-mono">{item.arcusBalance.toLocaleString()}</td>
                    <td className="text-right font-mono">{item.custodianBal.toLocaleString()}</td>
                    <td className={cn('text-right font-mono', item.diff !== 0 ? 'text-[#EF4444]' : 'text-[#10B981]')}>
                      {item.diff === 0 ? '—' : item.diff.toLocaleString()}
                    </td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="text-[#6B7A95]">{item.reconDate}</td>
                    <td>
                      {item.status !== 'matched' && (
                        <button className="text-[10px] text-[#60A5FA] hover:underline">Investigate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Holdings' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Holdings Reconciliation vs Custodian</div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Exchange</th>
                  <th className="text-right">Internal Amount</th>
                  <th className="text-right">External Amount</th>
                  <th className="text-right">Variance</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const { ticker, exchange } = parseInternalRef(item.internalRef)
                  const variance = Number(item.variance ?? 0)
                  return (
                    <tr key={item.id}>
                      <td className="text-[#60A5FA] font-mono font-semibold">{ticker}</td>
                      <td className="text-[#6B7A95]">{exchange}</td>
                      <td className="text-right font-mono">{item.internalAmount != null ? Number(item.internalAmount).toLocaleString() : '—'}</td>
                      <td className="text-right font-mono">{item.externalAmount != null ? Number(item.externalAmount).toLocaleString() : '—'}</td>
                      <td className={cn('text-right font-mono', variance !== 0 ? 'text-[#EF4444]' : 'text-[#10B981]')}>
                        {variance === 0 ? '—' : variance.toLocaleString()}
                      </td>
                      <td><StatusBadge status={item.status === 'MATCHED' ? 'matched' : 'unmatched'} /></td>
                      <td className="text-[#6B7A95] text-[11px]">{item.message}</td>
                      <td>
                        {item.status !== 'MATCHED' && !item.resolvedAt && (
                          <button
                            disabled={!!reconItemResolvingById[item.id]}
                            onClick={() => handleResolve(item.id)}
                            className="text-[10px] text-[#60A5FA] hover:underline disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        )}
                        {item.resolvedAt && <span className="text-[10px] text-[#4B5A72]">Resolved</span>}
                      </td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>
                      No batch selected — run a reconciliation or pick one from Batches above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Exceptions' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Unmatched Items</div>
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Exchange</th>
                  <th className="text-right">Internal Amount</th>
                  <th className="text-right">External Amount</th>
                  <th>Message</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedItems.map(item => {
                  const { ticker, exchange } = parseInternalRef(item.internalRef ?? item.externalRef)
                  return (
                    <tr key={item.id}>
                      <td className="text-[#60A5FA] font-mono font-semibold">{ticker}</td>
                      <td className="text-[#6B7A95]">{exchange}</td>
                      <td className="text-right font-mono">{item.internalAmount != null ? Number(item.internalAmount).toLocaleString() : '—'}</td>
                      <td className="text-right font-mono">{item.externalAmount != null ? Number(item.externalAmount).toLocaleString() : '—'}</td>
                      <td className="text-[#A8B4C8] text-[11px]">{item.message}</td>
                      <td>
                        {!item.resolvedAt ? (
                          <button
                            disabled={!!reconItemResolvingById[item.id]}
                            onClick={() => handleResolve(item.id)}
                            className="text-[10px] text-[#60A5FA] hover:underline disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#4B5A72]">Resolved</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {unmatchedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No unmatched items in the selected batch.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
