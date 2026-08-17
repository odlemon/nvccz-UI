'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ReconApiBanner, ReconNavTabs, reconPill, reconPrimaryPill } from '@/components/investments-v2/recon-ui'
import {
  formatOpsError,
  investmentOpsApi,
  type ClientAccountReconciliation,
  type TradeReconBatch,
} from '@/lib/api/investment-ops-api'
import { stockPickerCashApi, type FundCashSummary } from '@/lib/api/stock-picker-cash-api'
import { mapFundOptions } from '@/lib/investments-v2/adapters/orders-adapter'
import { R as C } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

export default function ReconOverviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-full bg-background p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
          <p className="text-[13px]" style={{ color: C.muted }}>
            Loading reconciliation overview…
          </p>
        </main>
      }
    >
      <ReconOverviewInner />
    </Suspense>
  )
}

function ReconOverviewInner() {
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [fundId, setFundId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tradeBatches, setTradeBatches] = useState<TradeReconBatch[]>([])
  const [cashSummary, setCashSummary] = useState<FundCashSummary | null>(null)
  const [positions, setPositions] = useState<ClientAccountReconciliation | null>(null)

  const load = useCallback(async (selectedFundId: string) => {
    setLoading(true)
    setError(null)
    let keepLoading = false
    try {
      const [portfoliosRes, batchesRes, cashRes, posRes] = await Promise.all([
        investmentOpsApi.listPortfolios(),
        selectedFundId
          ? investmentOpsApi.listTradeReconBatches({ fundId: selectedFundId, pageSize: 20 })
          : Promise.resolve({ success: true as const, data: { items: [], total: 0 } }),
        selectedFundId
          ? stockPickerCashApi.getFundCashSummary({ fundId: selectedFundId })
          : Promise.resolve({ success: true as const, data: null }),
        selectedFundId
          ? investmentOpsApi.getClientAccountReconciliation({ fundId: selectedFundId })
          : Promise.resolve({ success: true as const, data: null }),
      ])

      const fundList = mapFundOptions(portfoliosRes.data)
      setFunds(fundList)
      if (!selectedFundId && fundList[0]?.id) {
        keepLoading = true
        setFundId(fundList[0].id)
        return
      }

      if (batchesRes.success === false) {
        throw new Error(formatOpsError(batchesRes, 'Failed to load trade match batches'))
      }
      const batchItems =
        (batchesRes.data as { items?: TradeReconBatch[] } | undefined)?.items ??
        (Array.isArray(batchesRes.data) ? (batchesRes.data as TradeReconBatch[]) : [])
      setTradeBatches(batchItems)

      if (cashRes && 'success' in cashRes && cashRes.success === false) {
        setCashSummary(null)
      } else {
        setCashSummary((cashRes as { data?: FundCashSummary | null }).data ?? null)
      }

      if (posRes.success === false) {
        setPositions(null)
      } else {
        setPositions(posRes.data ?? null)
      }
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load reconciliation overview'))
    } finally {
      if (!keepLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(fundId)
  }, [fundId, load])

  const openTradeBatches = tradeBatches.filter((b) => {
    const s = String(b.status ?? '').toUpperCase()
    return s && s !== 'COMPLETED' && s !== 'CLOSED'
  }).length
  const completedTradeBatches = tradeBatches.filter((b) =>
    ['COMPLETED', 'CLOSED'].includes(String(b.status ?? '').toUpperCase()),
  ).length
  const cashBreaks = Number(cashSummary?.openBreaks ?? cashSummary?.breakCount ?? cashSummary?.unmatchedCount ?? 0)
  const positionBreaks = Number(positions?.breakCount ?? 0)

  return (
    <main className="min-h-full bg-background p-5 text-foreground sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Reconciliation overview</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-full border border-border bg-background px-4 text-[12px]"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
            >
              {funds.length === 0 && <option value="">No funds</option>}
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button type="button" className={cn(reconPill, 'h-9')} onClick={() => void load(fundId)}>
              Refresh
            </button>
          </div>
        </header>

        <ReconNavTabs />
        <ReconApiBanner loading={loading} error={error} />

        <section className="grid gap-4 lg:grid-cols-3">
          <LegCard
            title="Trade match"
            subtitle="Us × Broker × Bank (custodian)"
            primary={`${openTradeBatches} open`}
            secondary={`${completedTradeBatches} completed · ${tradeBatches.length} total batches`}
            href={`/investments-v2/reconciliation/trade${fundId ? `?fundId=${encodeURIComponent(fundId)}` : ''}`}
            cta="Start trade match"
            alert={openTradeBatches > 0}
          />
          <LegCard
            title="Cash match"
            subtitle="Us ledger × Bank statement"
            primary={cashSummary ? `${cashBreaks} open breaks` : '—'}
            secondary={
              cashSummary
                ? `Unmatched ${cashSummary.unmatchedCount ?? '—'} · Match rate ${cashSummary.matchRate ?? '—'}`
                : 'No cash summary yet'
            }
            href={`/investments-v2/reconciliation/fund-cash${fundId ? `?fundId=${encodeURIComponent(fundId)}` : ''}`}
            cta="Start cash match"
            alert={cashBreaks > 0}
          />
          <LegCard
            title="Positions"
            subtitle="Holdings × settled trades"
            primary={`${positionBreaks} breaks`}
            secondary={
              positions
                ? `${positions.positionCount} positions · ${positions.settledTradeCount} settled trades`
                : 'No position recon yet'
            }
            href={`/investments-v2/reconciliation/positions${fundId ? `?fundId=${encodeURIComponent(fundId)}` : ''}`}
            cta="Review position breaks"
            alert={positionBreaks > 0}
          />
        </section>

        <section className="overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
          <div className="border-b px-4 py-3 text-[12px] font-medium" style={{ borderColor: C.cardBorder }}>
            Recent trade match batches
          </div>
          {tradeBatches.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px]" style={{ color: C.muted }}>
              No trade match batches for this fund yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">As of</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {tradeBatches.slice(0, 8).map((b) => (
                    <tr key={b.id} className="border-t" style={{ borderColor: C.cardBorder }}>
                      <td className="px-4 py-3 font-mono text-[11px]">{b.id}</td>
                      <td className="px-4 py-3">{b.status ?? '—'}</td>
                      <td className="px-4 py-3">{String(b.asOfDate ?? b.asOf ?? '—')}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/investments-v2/reconciliation/trade?batchId=${encodeURIComponent(b.id)}`}
                          className="text-[11px] font-medium"
                          style={{ color: C.blueLink }}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function LegCard({
  title,
  subtitle,
  primary,
  secondary,
  href,
  cta,
  alert,
}: {
  title: string
  subtitle: string
  primary: string
  secondary: string
  href: string
  cta: string
  alert?: boolean
}) {
  return (
    <article className="flex flex-col rounded-[12px] border p-4" style={{ background: C.card, borderColor: C.cardBorder }}>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
        {subtitle}
      </p>
      <h2 className="mt-1 text-[16px] font-semibold">{title}</h2>
      <p className="mt-4 text-[22px] font-semibold" style={alert ? { color: C.red } : undefined}>
        {primary}
      </p>
      <p className="mt-1 text-[11px]" style={{ color: C.muted }}>
        {secondary}
      </p>
      <div className="mt-auto pt-4">
        <Link href={href} className={cn(reconPrimaryPill, 'h-9 w-full')}>
          {cta}
        </Link>
      </div>
    </article>
  )
}
