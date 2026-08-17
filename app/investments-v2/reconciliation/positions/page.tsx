'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ReconApiBanner, ReconNavTabs, reconPill } from '@/components/investments-v2/recon-ui'
import { ReconTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import {
  formatOpsError,
  investmentOpsApi,
  type ClientAccountReconBreak,
  type ClientAccountReconciliation,
} from '@/lib/api/investment-ops-api'
import { mapFundOptions } from '@/lib/investments-v2/adapters/orders-adapter'
import { R as C } from '@/lib/investments-v2/recon-tokens'
import { cn } from '@/lib/utils'

export default function PositionsReconPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-full bg-background p-5 sm:p-6" style={{ background: C.page, color: C.text }}>
          <p className="text-[13px]" style={{ color: C.muted }}>
            Loading positions match…
          </p>
        </main>
      }
    >
      <PositionsReconInner />
    </Suspense>
  )
}

function PositionsReconInner() {
  const searchParams = useSearchParams()
  const [funds, setFunds] = useState<{ id: string; name: string }[]>([])
  const [fundId, setFundId] = useState(() => searchParams.get('fundId') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ClientAccountReconciliation | null>(null)

  const loadFunds = useCallback(async () => {
    try {
      const res = await investmentOpsApi.listPortfolios()
      const list = mapFundOptions(res.data)
      setFunds(list)
      setFundId((prev) => prev || list[0]?.id || '')
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load funds'))
    }
  }, [])

  const loadRecon = useCallback(async (id: string) => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await investmentOpsApi.getClientAccountReconciliation({ fundId: id })
      if (res.success === false || !res.data) {
        throw new Error(formatOpsError(res, 'Failed to load position reconciliation'))
      }
      setData(res.data)
    } catch (e) {
      setData(null)
      setError(formatOpsError(e, 'Failed to load position reconciliation'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFunds()
  }, [loadFunds])

  useEffect(() => {
    void loadRecon(fundId)
  }, [fundId, loadRecon])

  const breaks: ClientAccountReconBreak[] = useMemo(() => data?.breaks ?? [], [data])

  return (
    <main className="min-h-full bg-background p-5 text-foreground sm:p-6" style={{ background: C.page, color: C.text }}>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Positions match</h1>
            <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
              Our holdings vs quantity implied by settled trades (us-side break detection).
            </p>
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
            <button
              type="button"
              className={cn(reconPill, 'h-9')}
              onClick={() => void loadRecon(fundId)}
            >
              Refresh
            </button>
            <Link href="/investments-v2/reconciliation/trade" className={cn(reconPill, 'h-9')}>
              Trade match
            </Link>
          </div>
        </header>

        <ReconNavTabs />
        <ReconApiBanner loading={loading} error={error} />

        <section className="grid gap-3 sm:grid-cols-4">
          <Kpi label="Positions" value={data ? String(data.positionCount ?? 0) : '—'} />
          <Kpi label="Settled trades" value={data ? String(data.settledTradeCount ?? 0) : '—'} />
          <Kpi
            label="Breaks"
            value={data ? String(data.breakCount ?? breaks.length) : '—'}
            tone={(data?.breakCount ?? 0) > 0 ? C.red : C.green}
          />
          <Kpi label="As of" value={data?.asOf ? new Date(data.asOf).toLocaleString() : '—'} />
        </section>

        <section className="overflow-hidden rounded-[12px] border" style={{ background: C.card, borderColor: C.cardBorder }}>
          <div className="border-b px-4 py-3 text-[12px] font-medium" style={{ borderColor: C.cardBorder }}>
            Position breaks
          </div>
          {loading ? (
            <div className="p-4">
              <ReconTableSkeleton rows={6} cols={5} />
            </div>
          ) : breaks.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12px]" style={{ color: C.muted }}>
              {(data?.breakCount ?? 0) === 0
                ? 'No position breaks — holdings match settled trades.'
                : 'No break rows returned.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3 text-right">Position qty</th>
                    <th className="px-4 py-3 text-right">Expected (settled)</th>
                    <th className="px-4 py-3 text-right">Variance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {breaks.map((row) => (
                    <tr key={`${row.securityId}-${row.symbol}`} className="border-t" style={{ borderColor: C.cardBorder }}>
                      <td className="px-4 py-3 font-semibold">{row.symbol || row.securityId}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.positionQuantity}</td>
                      <td className="px-4 py-3 text-right font-mono">{row.expectedFromSettledTrades}</td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: C.red }}>
                        {row.variance}
                      </td>
                      <td className="px-4 py-3">{row.status}</td>
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

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <article className="rounded-[12px] border px-4 py-3" style={{ background: C.card, borderColor: C.cardBorder }}>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
        {label}
      </p>
      <p className="mt-2 text-[18px] font-semibold" style={tone ? { color: tone } : undefined}>
        {value}
      </p>
    </article>
  )
}
