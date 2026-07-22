'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ExternalLink, FileCheck, Loader2, Plus, Search } from 'lucide-react'
import { OpsKpiSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { DetailPanel } from '@/components/investments-v2/ui/detail-panel'
import { NewEquityOrderModal } from '@/components/investments-v2/new-equity-order-modal'
import { buttonClass, Field, inputClass, Metric, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { formatOpsError, investmentOpsApi } from '@/lib/api/investment-ops-api'
import {
  accountingDeepLink,
  cashLedgerDeepLink,
  formatCompact,
  fundNameMap,
  mapBlotterTrades,
  reconDeepLink,
  type BlotterTradeRow,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function findTradeFromDeepLink(
  rows: BlotterTradeRow[],
  params: { tradeId: string | null; orderId: string | null; orderRef: string | null },
): BlotterTradeRow | null {
  if (params.tradeId) {
    const tid = params.tradeId
    const byTrade = rows.find((r) => r.apiId === tid || r.id === tid)
    if (byTrade) return byTrade
  }
  if (params.orderId) {
    const byOrderId = rows.find((r) => r.orderId === params.orderId)
    if (byOrderId) return byOrderId
  }
  if (params.orderRef) {
    const ref = params.orderRef.toLowerCase()
    const byRef = rows.find(
      (r) =>
        (r.order && r.order !== '—' && r.order.toLowerCase() === ref) ||
        (r.order && r.order.toLowerCase().includes(ref)),
    )
    if (byRef) return byRef
  }
  return null
}

function TradeBlotterPageInner() {
  const searchParams = useSearchParams()
  const deepTradeId = searchParams.get('tradeId')
  const deepOrderId = searchParams.get('orderId')
  const deepOrderRef = searchParams.get('orderRef')
  const wantSelect = searchParams.get('select') === '1' || Boolean(deepTradeId || deepOrderId || deepOrderRef)
  const hasDeepLink = Boolean(deepTradeId || deepOrderId || deepOrderRef)

  const [trades, setTrades] = useState<BlotterTradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<BlotterTradeRow | null>(null)
  const [showOrder, setShowOrder] = useState(false)
  const [actionBusy, setActionBusy] = useState<'confirm' | 'settle' | 'post' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [settleOpen, setSettleOpen] = useState(false)
  const [settleAt, setSettleAt] = useState('')
  const [custodianReference, setCustodianReference] = useState('')
  const [deepLinkMsg, setDeepLinkMsg] = useState<string | null>(null)
  const deepLinkApplied = useRef<string | null>(null)
  const deepLinkFailed = useRef<string | null>(null)
  /** Keep detail panel on the deep-linked trade across list refresh. */
  const preferredTradeId = useRef<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tradesRes, portfoliosRes] = await Promise.all([
        investmentOpsApi.listTrades(),
        investmentOpsApi.listPortfolios(),
      ])
      if (tradesRes.success === false) {
        throw new Error(tradesRes.message || tradesRes.error || 'Failed to load trades')
      }
      const names = fundNameMap(portfoliosRes.data)
      const rows = mapBlotterTrades(tradesRes.data, names).sort((a, b) => b.sortKey - a.sortKey)
      setTrades(rows)
      setSelected((prev) => {
        const prefer = preferredTradeId.current
        if (prefer) {
          const hit = rows.find((r) => r.apiId === prefer || r.id === prefer)
          if (hit) return hit
        }
        return prev ? rows.find((r) => r.apiId === prev.apiId) ?? null : null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades')
      setTrades([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Focus from Orderbook deep-link using URL tradeId only (no GET /orders).
  useEffect(() => {
    if (loading || !hasDeepLink) return
    const key = `${deepTradeId ?? ''}|${deepOrderId ?? ''}|${deepOrderRef ?? ''}`
    if (deepLinkApplied.current === key || deepLinkFailed.current === key) return

    const match = findTradeFromDeepLink(trades, {
      tradeId: deepTradeId,
      orderId: deepOrderId,
      orderRef: deepOrderRef,
    })
    if (match) {
      deepLinkApplied.current = key
      preferredTradeId.current = match.apiId
      setStatus('All')
      if (wantSelect) {
        setSelected(match)
        setQuery(match.id)
      }
      setDeepLinkMsg(
        `Focused trade ${match.id}${deepOrderRef ? ` · order ${deepOrderRef}` : ''}`,
      )
      return
    }

    if (trades.length === 0) return
    deepLinkFailed.current = key
    setDeepLinkMsg(
      `Could not find trade${deepTradeId ? ` ${deepTradeId}` : ''} on blotter. ` +
        `Need order.tradeId + trade.orderId/orderRef populated (BA-T5 / seed).`,
    )
  }, [loading, trades, hasDeepLink, deepTradeId, deepOrderId, deepOrderRef, wantSelect])

  useEffect(() => {
    if (!selected?.apiId) return
    const el = document.getElementById(`blotter-trade-${selected.apiId}`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected?.apiId])

  const visible = useMemo(
    () =>
      trades.filter((trade) => {
        const statusOk =
          status === 'All' ||
          trade.status === status ||
          (status === 'Pending Settlement' && trade.settlement === 'Pending Settlement') ||
          (status === 'Settled' && (trade.status === 'Settled' || trade.settlement === 'Settled'))
        return (
          statusOk &&
          `${trade.id} ${trade.order} ${trade.ticker} ${trade.portfolio}`.toLowerCase().includes(query.toLowerCase())
        )
      }),
    [trades, status, query],
  )

  const money = (value: number | null | undefined) =>
    value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 2 })

  const runTradeAction = async (
    kind: 'confirm' | 'settle' | 'post',
    action: () => Promise<{ success?: boolean; message?: string; error?: string; code?: string }>,
  ) => {
    if (!selected?.apiId || actionBusy) return
    setActionBusy(kind)
    setActionError(null)
    try {
      const res = await action()
      if (res.success === false) {
        setActionError(formatOpsError(res, 'Trade action failed'))
        return
      }
      await load()
    } catch (e) {
      setActionError(formatOpsError(e, 'Trade action failed'))
    } finally {
      setActionBusy(null)
    }
  }

  const confirmSelectedTrade = () =>
    runTradeAction('confirm', () => investmentOpsApi.confirmTrade(selected!.apiId))

  const openSettleModal = () => {
    if (!selected) return
    setSettleAt(new Date().toISOString().slice(0, 16))
    setCustodianReference('')
    setSettleOpen(true)
  }

  const settleSelectedTrade = async () => {
    if (!selected?.apiId || actionBusy) return
    if (!custodianReference.trim()) {
      toast.error('Custodian / CSD reference is required.')
      return
    }
    const settledAtIso = settleAt
      ? new Date(settleAt).toISOString()
      : new Date().toISOString()
    await runTradeAction('settle', () =>
      investmentOpsApi.settleTrade(selected.apiId, {
        allowDeferredAccounting: true,
        settledAt: settledAtIso,
        custodianReference: custodianReference.trim(),
      }),
    )
    setSettleOpen(false)
  }

  /**
   * Settle requiring immediate accounting, or re-call settle after deferred settle
   * so books move to Posted (same settle endpoint, allowDeferredAccounting: false).
   */
  const postSelectedTrade = () =>
    runTradeAction('post', () =>
      investmentOpsApi.settleTrade(selected!.apiId, {
        allowDeferredAccounting: false,
        settledAt: new Date().toISOString(),
        ...(custodianReference.trim() ? { custodianReference: custodianReference.trim() } : {}),
      }),
    )

  const openTradeRecon = async () => {
    if (!selected?.apiId) return
    try {
      const res = await investmentOpsApi.getTradeReconciliationSummary(selected.apiId)
      if (res.success === false) {
        throw new Error(formatOpsError(res, 'Failed to load recon summary'))
      }
      const deepLink =
        res.data?.deepLink ||
        reconDeepLink({ tradeId: selected.apiId, fundId: selected.fundId })
      window.open(deepLink, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast.error(formatOpsError(e, 'Failed to open trade recon'))
      window.open(
        reconDeepLink({ tradeId: selected.apiId, fundId: selected.fundId }),
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  const grossTotal = trades.reduce((sum, t) => sum + t.gross, 0)
  const executedCount = trades.filter((t) => t.status === 'Executed').length
  const pendingCount = trades.filter((t) => t.status === 'Pending' || t.status === 'Partial').length
  const unmatchedCount = trades.filter((t) => t.settlement === 'Unmatched').length

  const isConfirmed = selected?.confirmation === 'Confirmed'
  const isSettled = selected?.settlement === 'Settled'
  const isPosted = selected?.accounting === 'Posted'
  // Blotter post-trade sequence: Confirm → Settle → Post
  const canConfirm = Boolean(selected) && !isConfirmed
  const canSettle = Boolean(selected) && isConfirmed && !isSettled
  const canPost = Boolean(selected) && isConfirmed && isSettled && !isPosted
  const settleHint = !isConfirmed
    ? 'Confirm the trade first'
    : isSettled
      ? 'Already settled'
      : null
  const postHint = !isConfirmed
    ? 'Confirm the trade first'
    : !isSettled
      ? 'Mark settled first'
      : isPosted
        ? 'Already posted'
        : null

  return (
    <OrdersPage
      title="Trade Blotter"
      description="Executed trades only. After Accept on the orderbook, confirm → settle with custodian → post books → reconcile (internal × broker × custodian)."
      actions={
        <button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white')} onClick={() => setShowOrder(true)}>
          <Plus className="h-3.5 w-3.5" /> New order
        </button>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-[12px] text-rose-200">
          {error}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}
      {deepLinkMsg && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[12px] text-blue-100">
          {deepLinkMsg}
          <button type="button" className={cn(buttonClass, 'ml-3 h-7 px-3')} onClick={() => setDeepLinkMsg(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading && trades.length === 0 ? (
        <OpsKpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Gross traded" value={loading ? '…' : formatCompact(grossTotal)} detail="All loaded trades" />
          <Metric label="Executed" value={loading ? '…' : String(executedCount)} tone="text-emerald-300" />
          <Metric label="Pending" value={loading ? '…' : String(pendingCount)} tone="text-amber-300" />
          <Metric label="Unmatched" value={loading ? '…' : String(unmatchedCount)} tone="text-red-300" />
        </div>
      )}

      <OrdersCard
        title="Trades"
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
              <input className={cn(inputClass, 'w-56 pl-8')} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trade or ticker" />
            </div>
            <SelectField className="w-44" value={status} onChange={setStatus}>
              <option>All</option>
              <option>Executed</option>
              <option>Partially Executed</option>
              <option>Pending Settlement</option>
              <option>Settled</option>
              <option>Pending</option>
            </SelectField>
          </div>
        }
      >
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th>Trade / order</th>
                <th>Portfolio</th>
                <th>Instrument</th>
                <th>Side</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Exec price</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Fees</th>
                <th className="text-right">Taxes</th>
                <th className="text-right">Net</th>
                <th>Broker</th>
                <th>Custodian</th>
                <th>Trade date</th>
                <th>Value date</th>
                <th>Status</th>
                <th>Settlement</th>
                <th>Accounting</th>
                <th>Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={18} className="p-0">
                    <OpsTableSkeleton rows={8} cols={8} />
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-[11px] text-slate-500">
                    No executed trades yet. Accept a broker confirmation on the orderbook to create a blotter row.
                  </td>
                </tr>
              )}
              {!loading &&
                visible.map((trade) => (
                  <tr
                    key={trade.apiId || trade.id}
                    id={trade.apiId ? `blotter-trade-${trade.apiId}` : undefined}
                    className={cn(
                      'cursor-pointer hover:bg-white/[0.03]',
                      selected?.apiId === trade.apiId && 'bg-blue-500/10 ring-1 ring-inset ring-blue-400/30',
                    )}
                    onClick={() => {
                      preferredTradeId.current = trade.apiId
                      setSelected(trade)
                    }}
                  >
                    <td>
                      <div className="font-mono text-blue-300">{trade.id}</div>
                      <div className="text-[9px] text-slate-600">{trade.order}</div>
                    </td>
                    <td>{trade.portfolio}</td>
                    <td>
                      <b>{trade.ticker}</b>
                      <span className="ml-2 text-slate-500">{trade.name}</span>
                    </td>
                    <td className={trade.side === 'BUY' ? 'text-emerald-300' : 'text-red-300'}>{trade.side}</td>
                    <td className="text-right font-mono">{trade.qty.toLocaleString()}</td>
                    <td className="text-right font-mono">{trade.price.toFixed(2)}</td>
                    <td className="text-right font-mono">{money(trade.gross)}</td>
                    <td className="text-right font-mono">{money(trade.fees)}</td>
                    <td className="text-right font-mono">{money(trade.taxes)}</td>
                    <td className="text-right font-mono">{money(trade.net)}</td>
                    <td>{trade.broker}</td>
                    <td>{trade.custodian}</td>
                    <td>{trade.tradeDate}</td>
                    <td>{trade.valueDate}</td>
                    <td>
                      <Pill tone={trade.status === 'Executed' ? 'green' : 'amber'}>{trade.status}</Pill>
                    </td>
                    <td>
                      <Pill tone={trade.settlement === 'Settled' ? 'green' : trade.settlement === 'Unmatched' ? 'red' : 'amber'}>
                        {trade.settlement}
                      </Pill>
                    </td>
                    <td>
                      <Pill tone={trade.accounting === 'Posted' ? 'green' : 'slate'}>{trade.accounting}</Pill>
                    </td>
                    <td>
                      <Pill tone={trade.confirmation === 'Confirmed' ? 'green' : 'slate'}>{trade.confirmation}</Pill>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </OrdersCard>

      {selected && (
        <DetailPanel
          open={!!selected}
          onClose={() => {
            preferredTradeId.current = null
            setSelected(null)
          }}
          width="max-w-lg"
        >
          <div className="flex justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-blue-400">Trade detail</div>
              <h2 className="mt-1 font-mono text-base">{selected.id}</h2>
            </div>
            <button
              className={buttonClass}
              onClick={() => {
                preferredTradeId.current = null
                setSelected(null)
              }}
            >
              Close
            </button>
          </div>
          <div className="mt-5 rounded-[22px] border border-white/[0.07] bg-gradient-to-br from-[#101b30] to-[#080e18] p-4">
            <div className="flex items-center justify-between">
              <div>
                <b className="text-lg">{selected.ticker}</b>
                <p className="text-[10px] text-slate-500">{selected.name}</p>
              </div>
              <Pill tone={selected.side === 'BUY' ? 'green' : 'red'}>
                {selected.side} {selected.qty.toLocaleString()}
              </Pill>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-[10px]">
              <div>
                <span className="text-slate-600">Gross</span>
                <p className="mt-1 font-mono">{money(selected.gross)}</p>
              </div>
              <div>
                <span className="text-slate-600">Fees + tax</span>
                <p className="mt-1 font-mono">{money(selected.fees + (selected.taxes ?? 0))}</p>
              </div>
              <div>
                <span className="text-slate-600">Net</span>
                <p className="mt-1 font-mono">{money(selected.net)}</p>
              </div>
            </div>
          </div>
          {actionError && (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">
              {actionError}
            </div>
          )}
          <h3 className="mt-6 text-[11px] font-semibold">Post-trade & custodian</h3>
          <p className="mt-1 text-[9px] text-slate-500">
            Broker fill was already accepted on the orderbook. Here:{' '}
            <span className="text-slate-300">1. Confirm trade</span>
            {' → '}
            <span className="text-slate-300">2. Custodian settle</span>
            {' → '}
            <span className="text-slate-300">3. Post books</span>
            {' → '}
            <span className="text-slate-300">4. Reconcile</span>
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">1. Confirm trade</p>
                  <p className="mt-1 text-[9px] text-slate-500">Ops check that blotter qty/price match the accepted confirmation.</p>
                </div>
                <Pill tone={selected.confirmation === 'Confirmed' ? 'green' : 'amber'}>{selected.confirmation}</Pill>
              </div>
              <button
                type="button"
                disabled={Boolean(actionBusy) || !canConfirm}
                title={isConfirmed ? 'Already confirmed' : undefined}
                className={cn(
                  buttonClass,
                  'mt-3 w-full',
                  (Boolean(actionBusy) || !canConfirm) && 'cursor-not-allowed opacity-40',
                )}
                onClick={() => void confirmSelectedTrade()}
              >
                {actionBusy === 'confirm' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileCheck className="h-3.5 w-3.5" />
                )}
                {isConfirmed ? 'Confirmed' : 'Confirm trade'}
              </button>
            </div>
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">2. Custodian settlement</p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    Cash + securities via {selected.custodian} · value date {selected.valueDate}
                  </p>
                </div>
                <Pill tone={selected.settlement === 'Settled' ? 'green' : 'amber'}>{selected.settlement}</Pill>
              </div>
              <button
                type="button"
                disabled={Boolean(actionBusy) || !canSettle}
                title={settleHint ?? undefined}
                className={cn(
                  buttonClass,
                  'mt-3 w-full border-emerald-400/30 text-emerald-300',
                  (Boolean(actionBusy) || !canSettle) && 'cursor-not-allowed opacity-40',
                )}
                onClick={openSettleModal}
              >
                {actionBusy === 'settle' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {isSettled ? 'Settled' : 'Settle with custodian'}
              </button>
              {settleHint && !isSettled && (
                <p className="mt-2 text-[9px] text-amber-400/80">{settleHint}</p>
              )}
            </div>
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium">3. Accounting posting</p>
                  <p className="mt-1 text-[9px] text-slate-500">
                    After custodian settlement, post books (immediate accounting).
                  </p>
                </div>
                <Pill tone={selected.accounting === 'Posted' ? 'green' : 'slate'}>{selected.accounting}</Pill>
              </div>
              <button
                type="button"
                disabled={Boolean(actionBusy) || !canPost}
                title={postHint ?? undefined}
                className={cn(
                  buttonClass,
                  'mt-3 w-full border-blue-400/30 text-blue-300',
                  (Boolean(actionBusy) || !canPost) && 'cursor-not-allowed opacity-40',
                )}
                onClick={() => void postSelectedTrade()}
              >
                {actionBusy === 'post' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {isPosted ? 'Posted' : 'Post books'}
              </button>
              {postHint && !isPosted && (
                <p className="mt-2 text-[9px] text-amber-400/80">{postHint}</p>
              )}
              {isPosted && (
                <button
                  type="button"
                  className={cn(buttonClass, 'mt-3 w-full border-blue-400/40 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30')}
                  onClick={() =>
                    window.open(accountingDeepLink(selected), '_blank', 'noopener,noreferrer')
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open accounting event
                </button>
              )}
            </div>
            <div className="rounded-[18px] border border-white/[0.07] p-4">
              <div>
                <p className="text-[11px] font-medium">4. Reconcile</p>
                <p className="mt-1 text-[9px] text-slate-500">
                  Match internal trade × broker statement × custodian statement. Cash lines linked on settle (BA-RC-2).
                </p>
              </div>
              <button
                type="button"
                className={cn(buttonClass, 'mt-3 w-full border-violet-400/40 bg-violet-600/20 text-violet-100 hover:bg-violet-600/30')}
                onClick={() => void openTradeRecon()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open trade recon
              </button>
              <button
                type="button"
                className={cn(buttonClass, 'mt-2 w-full border-blue-400/30 text-blue-200')}
                onClick={() =>
                  window.open(
                    cashLedgerDeepLink({ tradeId: selected.apiId, fundId: selected.fundId }),
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open cash ledger for trade
              </button>
            </div>
          </div>
        </DetailPanel>
      )}
      <Modal
        open={settleOpen}
        onClose={() => {
          if (actionBusy === 'settle') return
          setSettleOpen(false)
        }}
        title="Custodian settlement"
        subtitle={`Record cash + securities settlement via ${selected?.custodian ?? 'custodian'}.`}
        footer={
          <>
            <button
              type="button"
              className={buttonClass}
              disabled={actionBusy === 'settle'}
              onClick={() => setSettleOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={Boolean(actionBusy) || !custodianReference.trim()}
              className={cn(buttonClass, 'border-emerald-400/40 bg-emerald-600 text-white')}
              onClick={() => void settleSelectedTrade()}
            >
              {actionBusy === 'settle' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {actionBusy === 'settle' ? 'Settling…' : 'Confirm settlement'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Settled at">
            <input
              className={inputClass}
              type="datetime-local"
              value={settleAt}
              onChange={(e) => setSettleAt(e.target.value)}
            />
          </Field>
          <Field label="Custodian / CSD reference">
            <input
              className={inputClass}
              value={custodianReference}
              onChange={(e) => setCustodianReference(e.target.value)}
              placeholder="e.g. CSD-99102"
            />
          </Field>
        </div>
        <p className="mt-3 text-[10px] text-slate-500">
          Value date on trade: {selected?.valueDate ?? '—'} · Custodian: {selected?.custodian ?? '—'}
        </p>
      </Modal>

      <NewEquityOrderModal
        open={showOrder}
        onClose={() => setShowOrder(false)}
        onOrderCreated={() => {
          toast.success('Order submitted. View pending orders in Orderbook until executed.')
          setShowOrder(false)
          void load()
        }}
      />
    </OrdersPage>
  )
}

export default function TradeBlotterPage() {
  return (
    <Suspense
      fallback={
        <OrdersPage
          title="Trade Blotter"
          description="Executed trades only. Confirm → custodian settle → post → reconcile."
        >
          <OpsKpiSkeleton count={4} />
        </OrdersPage>
      }
    >
      <TradeBlotterPageInner />
    </Suspense>
  )
}
