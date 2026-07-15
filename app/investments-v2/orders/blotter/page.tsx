'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { OrdersSubNav } from '@/components/investments-v2/orders-subnav'
import { cn } from '@/lib/utils'
import { Plus, Download, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchPortfolios,
  fetchOpsTrades,
  executeTrade,
  fetchTradeRoutingHops,
  confirmRoutingHop,
  retryRoutingHop,
  cancelRoutingHop,
} from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import type { RoutingHop } from '@/lib/api/investments-api'
import { useSortedPaginated } from '@/components/investments-v2/ui/use-sorted-paginated'
import { SortableTh } from '@/components/investments-v2/ui/sortable-th'
import { TablePagination } from '@/components/investments-v2/ui/table-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
import { ConfirmDialog } from '@/components/investments-v2/ui/confirm-dialog'
import { NewEquityOrderModal } from '@/components/investments-v2/new-equity-order-modal'

type TradeSortKey = 'tradeRef' | 'ticker' | 'side' | 'quantity' | 'netConsideration' | 'executedAt'

function settlementBadgeStatus(s: string) {
  if (s === 'SETTLED') return 'settled'
  if (s === 'SETTLEMENT_FAILED') return 'failed'
  return s.toLowerCase().replace(/_/g, ' ')
}
function accountingBadgeStatus(s: string) {
  return s === 'POSTED' ? 'posted' : 'not posted'
}
function confirmationBadgeStatus(s: string) {
  if (s === 'CONFIRMED') return 'confirmed'
  if (s === 'DISPATCHED') return 'pending'
  return s.toLowerCase().replace(/_/g, ' ')
}

function hopBadgeStatus(s: string) {
  if (s === 'CONFIRMED') return 'confirmed'
  if (s === 'DISPATCHED') return 'pending'
  if (s === 'FAILED') return 'failed'
  if (s === 'RETRYING') return 'review'
  return s.toLowerCase().replace(/_/g, ' ')
}

function hopActions(status: string): Array<{ key: 'confirm' | 'retry' | 'cancel'; label: string }> {
  const actions: Array<{ key: 'confirm' | 'retry' | 'cancel'; label: string }> = []
  if (status === 'DISPATCHED') actions.push({ key: 'confirm', label: 'Confirm' })
  if (status === 'FAILED' || status === 'RETRYING') actions.push({ key: 'retry', label: 'Retry' })
  if (status !== 'CONFIRMED') actions.push({ key: 'cancel', label: 'Cancel' })
  return actions
}

export default function TradeBlotterPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    opsTrades,
    opsTradesLoading,
    tradeActionLoadingById,
    hopActionLoadingById,
    tradeRoutingHopsLoadingById,
  } = useAppSelector((s) => s.investmentOps)
  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [showNewOrder, setShowNewOrder] = useState(false)
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null)
  const [settlementErrorById, setSettlementErrorById] = useState<Record<string, string>>({})
  const [settlementDownloadingById, setSettlementDownloadingById] = useState<Record<string, boolean>>({})

  const [searchText, setSearchText] = useState('')
  const [sideFilter, setSideFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  const [executeConfirm, setExecuteConfirm] = useState<{ id: string; tradeRef: string } | null>(null)
  const [cancelHopConfirm, setCancelHopConfirm] = useState<{ tradeId: string; hopId: string; target: string } | null>(null)

  useEffect(() => {
    dispatch(fetchPortfolios())
    dispatch(fetchOpsTrades())
  }, [dispatch])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  const filteredTrades = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return opsTrades.filter((t) => {
      if (sideFilter !== 'All' && t.side !== sideFilter) return false
      if (t.executedAt) {
        const executed = new Date(t.executedAt)
        if (dateFrom && executed < dateFrom) return false
        if (dateTo && executed > new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1)) return false
      }
      if (q) {
        const haystack = [t.tradeRef, t.security?.symbol ?? '', t.security?.name ?? ''].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [opsTrades, searchText, sideFilter, dateFrom, dateTo])

  const getTradeSortValue = (t: (typeof opsTrades)[number], key: TradeSortKey) => {
    if (key === 'ticker') return t.security?.symbol ?? ''
    if (key === 'executedAt') return t.executedAt ? new Date(t.executedAt).getTime() : 0
    return t[key] as string | number
  }
  const {
    pageRows: tradeRows,
    sortKey: tradeSortKey,
    sortDir: tradeSortDir,
    toggleSort: toggleTradeSort,
    page: tradePage,
    setPage: setTradePage,
    totalPages: tradeTotalPages,
    totalRows: tradeTotalRows,
  } = useSortedPaginated<(typeof opsTrades)[number], TradeSortKey>(filteredTrades, getTradeSortValue, 'executedAt', 15)

  const toggleTrade = (id: string) => {
    if (expandedTradeId === id) {
      setExpandedTradeId(null)
      return
    }
    setExpandedTradeId(id)
    dispatch(fetchTradeRoutingHops(id))
  }

  const handleHopAction = (key: 'confirm' | 'retry' | 'cancel', tradeId: string, hopId: string) => {
    if (key === 'confirm') dispatch(confirmRoutingHop({ tradeId, hopId }))
    if (key === 'retry') dispatch(retryRoutingHop({ tradeId, hopId }))
    if (key === 'cancel') dispatch(cancelRoutingHop({ tradeId, hopId }))
  }

  const handleDownloadSettlement = async (tradeId: string, tradeRef: string) => {
    setSettlementErrorById((p) => ({ ...p, [tradeId]: '' }))
    setSettlementDownloadingById((p) => ({ ...p, [tradeId]: true }))
    try {
      const blob = await investmentOpsApi.getSettlementDocument(tradeId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tradeRef}-settlement.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setSettlementErrorById((p) => ({ ...p, [tradeId]: err?.message || 'Failed to download settlement document' }))
    } finally {
      setSettlementDownloadingById((p) => ({ ...p, [tradeId]: false }))
    }
  }

  const handleExport = () => {
    exportRowsToCsv(
      `blotter-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Trade ID', 'Portfolio', 'Ticker', 'Side', 'Qty', 'Exec Price', 'Gross', 'Fees', 'Net', 'Trade Date'],
      filteredTrades.map((t) => [
        t.tradeRef,
        fundName(t.fundId),
        t.security?.symbol ?? '',
        t.side,
        t.quantity,
        t.executionPrice,
        t.grossConsideration,
        t.fees,
        t.netConsideration,
        t.executedAt ? new Date(t.executedAt).toLocaleDateString() : '',
      ])
    )
  }

  return (
    <div ref={rootRef} className="flex flex-col h-full overflow-hidden">
      <Topbar title="Trade Blotter" subtitle="Executed & Pending Trades" showPeriod={false} />

      <OrdersSubNav />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-[#6B7A95]">{opsTradesLoading ? 'Loading…' : `${filteredTrades.length} of ${opsTrades.length} trades`}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="pill" onClick={handleExport}>
              <Download className="w-3 h-3" /> Export
            </Button>
            <Button variant="default" size="pill" onClick={() => setShowNewOrder(true)}>
              <Plus className="w-3 h-3" /> New Order
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search trade ID or ticker…"
            className="w-64"
          />
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-32 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent container={themeContainer}>
              <SelectItem value="All">All Sides</SelectItem>
              <SelectItem value="BUY">BUY</SelectItem>
              <SelectItem value="SELL">SELL</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" className="w-40" allowFutureDates container={themeContainer} />
          <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" className="w-40" allowFutureDates container={themeContainer} />
        </div>

        {/* Blotter table */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th />
                  <SortableTh col="tradeRef" label="Trade ID" sortKey={tradeSortKey} sortDir={tradeSortDir} onSort={toggleTradeSort} />
                  <th>Portfolio</th>
                  <SortableTh col="ticker" label="Ticker" sortKey={tradeSortKey} sortDir={tradeSortDir} onSort={toggleTradeSort} />
                  <th>Instrument</th>
                  <SortableTh col="side" label="Side" sortKey={tradeSortKey} sortDir={tradeSortDir} onSort={toggleTradeSort} />
                  <SortableTh col="quantity" label="Qty" sortKey={tradeSortKey} sortDir={tradeSortDir} onSort={toggleTradeSort} align="right" />
                  <th className="text-right">Exec Price</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">Fees</th>
                  <SortableTh col="netConsideration" label="Net" sortKey={tradeSortKey} sortDir={tradeSortDir} onSort={toggleTradeSort} align="right" />
                  <th>Broker</th>
                  <th>Custodian</th>
                  <SortableTh col="executedAt" label="Trade Date" sortKey={tradeSortKey} sortDir={tradeSortDir} onSort={toggleTradeSort} />
                  <th>Val Date</th>
                  <th>Settlement</th>
                  <th>Accounting</th>
                  <th>Confirmation</th>
                </tr>
              </thead>
              <tbody>
                {tradeRows.map((t) => {
                  const isExpanded = expandedTradeId === t.id
                  const hopsLoading = !!tradeRoutingHopsLoadingById[t.id]
                  const settlementError = settlementErrorById[t.id]
                  const settlementDownloading = !!settlementDownloadingById[t.id]
                  return (
                    <Fragment key={t.id}>
                      <tr className={cn('cursor-pointer', isExpanded && 'bg-[#3b82f614]')} onClick={() => toggleTrade(t.id)}>
                        <td className="w-6">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#6B7A95]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#6B7A95]" />
                          )}
                        </td>
                        <td className="text-[#60A5FA] font-mono text-[11px]">{t.tradeRef}</td>
                        <td className="text-[#A8B4C8]">{fundName(t.fundId)}</td>
                        <td className="text-[#C8D3E8] font-mono font-semibold">{t.security?.symbol ?? '—'}</td>
                        <td className="text-[#A8B4C8]">{t.security?.name ?? '—'}</td>
                        <td>
                          <span className={cn('text-xs font-bold', t.side === 'BUY' ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                            {t.side}
                          </span>
                        </td>
                        <td className="text-right font-mono">{Number(t.quantity).toLocaleString()}</td>
                        <td className="text-right font-mono">{Number(t.executionPrice).toFixed(2)}</td>
                        <td className="text-right font-mono">{t.grossConsideration.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-right font-mono text-[#F59E0B]">{Number(t.fees)}</td>
                        <td className="text-right font-mono">{t.netConsideration.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="text-[#A8B4C8]">{t.brokerProfileId ?? '—'}</td>
                        <td className="text-[#6B7A95]">{t.custodianProfileId ?? '—'}</td>
                        <td className="text-[#6B7A95]">{t.executedAt ? new Date(t.executedAt).toLocaleDateString() : '—'}</td>
                        <td className="text-[#6B7A95]">{t.valueDate ? new Date(t.valueDate).toLocaleDateString() : '—'}</td>
                        <td><StatusBadge status={settlementBadgeStatus(t.settlementStatus)} /></td>
                        <td><StatusBadge status={accountingBadgeStatus(t.accountingStatus)} /></td>
                        <td><StatusBadge status={confirmationBadgeStatus(t.confirmationStatus)} /></td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={18} className="p-0">
                            <div className="px-6 py-3 space-y-3" style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="flex items-center gap-2">
                                {t.status === 'DRAFT' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="rounded-full"
                                    disabled={!!tradeActionLoadingById[t.id]}
                                    onClick={(e) => { e.stopPropagation(); setExecuteConfirm({ id: t.id, tradeRef: t.tradeRef }) }}
                                  >
                                    Execute Trade
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                  disabled={settlementDownloading}
                                  onClick={(e) => { e.stopPropagation(); handleDownloadSettlement(t.id, t.tradeRef) }}
                                >
                                  <Download className="w-3 h-3" /> {settlementDownloading ? 'Downloading…' : 'Download Settlement Document'}
                                </Button>
                                {settlementError && <span className="text-[11px] text-[#EF4444]">{settlementError}</span>}
                              </div>

                              <table className="arcus-table">
                                <thead>
                                  <tr>
                                    <th>Target</th>
                                    <th>Status</th>
                                    <th className="text-right">Attempts</th>
                                    <th>External Ref</th>
                                    <th>Last Error</th>
                                    <th>Dispatched At</th>
                                    <th>Confirmed At</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.routingHops.map((hop: RoutingHop) => (
                                    <tr key={hop.id}>
                                      <td className="text-[#A8B4C8]">{hop.target}</td>
                                      <td><StatusBadge status={hopBadgeStatus(hop.status)} /></td>
                                      <td className="text-right font-mono">{hop.attemptCount}</td>
                                      <td className="text-[#6B7A95] font-mono text-[11px]">{hop.externalRef ?? '—'}</td>
                                      <td className="text-[#EF4444] text-[11px]">{hop.lastError ?? '—'}</td>
                                      <td className="text-[#6B7A95] text-[11px]">{hop.dispatchedAt ? new Date(hop.dispatchedAt).toLocaleString() : '—'}</td>
                                      <td className="text-[#6B7A95] text-[11px]">{hop.confirmedAt ? new Date(hop.confirmedAt).toLocaleString() : '—'}</td>
                                      <td>
                                        <div className="flex items-center gap-1.5">
                                          {hopActions(hop.status).map((a) => (
                                            <Button
                                              key={a.key}
                                              size="sm"
                                              variant="outline"
                                              className={cn('rounded-full', a.key === 'cancel' && 'text-destructive border-destructive/30 hover:bg-destructive/10')}
                                              disabled={!!hopActionLoadingById[hop.id]}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                if (a.key === 'cancel') setCancelHopConfirm({ tradeId: t.id, hopId: hop.id, target: hop.target })
                                                else handleHopAction(a.key, t.id, hop.id)
                                              }}
                                            >
                                              {a.label}
                                            </Button>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {hopsLoading && t.routingHops.length === 0 && (
                                    <tr>
                                      <td colSpan={8} className="text-center py-4 text-[11px]" style={{ color: '#64748b' }}>Loading routing hops…</td>
                                    </tr>
                                  )}
                                  {!hopsLoading && t.routingHops.length === 0 && (
                                    <tr>
                                      <td colSpan={8} className="text-center py-4 text-[11px]" style={{ color: '#64748b' }}>No routing hops for this trade.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filteredTrades.length === 0 && !opsTradesLoading && (
                  <tr>
                    <td colSpan={18} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No trades match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination page={tradePage} totalPages={tradeTotalPages} onPageChange={setTradePage} rowsShown={tradeRows.length} totalRows={tradeTotalRows} />
        </div>
      </div>

      <NewEquityOrderModal
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        container={themeContainer}
        onOrderCreated={() => dispatch(fetchOpsTrades())}
      />

      {executeConfirm && (
        <ConfirmDialog
          open={!!executeConfirm}
          onOpenChange={(o) => !o && setExecuteConfirm(null)}
          title={`Execute Trade ${executeConfirm.tradeRef}`}
          description="This will execute the trade and route it for settlement. This action cannot be undone."
          confirmLabel="Execute Trade"
          onConfirm={() => {
            const d = executeConfirm
            setExecuteConfirm(null)
            if (d) dispatch(executeTrade(d.id))
          }}
          container={themeContainer}
        />
      )}

      {cancelHopConfirm && (
        <ConfirmDialog
          open={!!cancelHopConfirm}
          onOpenChange={(o) => !o && setCancelHopConfirm(null)}
          title={`Cancel Routing Hop — ${cancelHopConfirm.target}`}
          description="This will cancel this routing hop. This action cannot be undone."
          confirmLabel="Cancel Hop"
          onConfirm={() => {
            const d = cancelHopConfirm
            setCancelHopConfirm(null)
            if (d) handleHopAction('cancel', d.tradeId, d.hopId)
          }}
          container={themeContainer}
        />
      )}
    </div>
  )
}
