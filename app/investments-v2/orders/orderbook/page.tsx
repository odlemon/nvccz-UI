'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExternalLink, Loader2, Plus, Search } from 'lucide-react'
import { OpsListSkeleton, OpsSkeleton, OpsCardGridSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { BrokerCommunicationPanel } from '@/components/investments-v2/broker-communication-panel'
import { ConfirmReasonDialog } from '@/components/investments-v2/ui/confirm-reason-dialog'
import { DetailPanel } from '@/components/investments-v2/ui/detail-panel'
import { PlaceEquityOrderModal } from '@/components/investments-v2/place-equity-order-modal'
import { buttonClass, Field, inputClass, Modal, OrdersCard, OrdersPage, Pill, SelectField, tableClass, tableWrapClass } from '@/components/investments-v2/orders-ui'
import { formatOpsError, investmentOpsApi, unwrapList, type BrokerConfirmation, type BrokerConfirmationOutcome, type OpsBlotter } from '@/lib/api/investment-ops-api'
import {
  blotterDeepLink,
  fundNameMap,
  mapBlotterTrades,
  mapFundOptions,
  mapOrderbookOrders,
  ORDERBOOK_LIFECYCLE_TABS,
  orderHasBlotterLink,
  orderMatchesLifecycleTab,
  syncOrderbookStatusFromTrades,
  type OrderbookRow,
} from '@/lib/investments-v2/adapters/orders-adapter'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useInvestmentBrokerReplySocket } from '@/lib/hooks/useNotificationSocket'
import type { OrderApproval } from '@/lib/api/investment-ops-api'

const tabs = [...ORDERBOOK_LIFECYCLE_TABS]

/** Hidden for now — working-set blotters on Orderbook (New Blotter + Open Blotters). */
const SHOW_WORKING_SET_BLOTTERS = false

const tone = (status: string) => {
  if (
    status === 'Executed' ||
    status === 'Settled' ||
    status === 'Approved' ||
    status === 'Confirmation Recorded' ||
    status === 'Broker fill'
  )
    return 'green'
  if (
    status === 'Draft' ||
    status === 'Submitted' ||
    status === 'Sent to Broker' ||
    status === 'Pending Settlement' ||
    status === 'Partially Executed' ||
    status === 'Counter-offer' ||
    status === 'Partial fill'
  )
    return 'amber'
  if (status === 'Broker unable' || status === 'Cancelled' || status === 'Failed' || status === 'Rejected')
    return 'red'
  return 'blue'
}

function isOpenConfirmation(c: BrokerConfirmation): boolean {
  const s = String(c.status ?? 'RECORDED').toUpperCase()
  return s !== 'ACCEPTED' && s !== 'REJECTED'
}

function pickOpenConfirmation(list: BrokerConfirmation[]): BrokerConfirmation | null {
  return list.find(isOpenConfirmation) ?? null
}

function unwrapRecordedConfirmation(data: unknown): BrokerConfirmation | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.confirmation && typeof d.confirmation === 'object') {
    return d.confirmation as BrokerConfirmation
  }
  if (d.id != null && d.orderId != null) return data as BrokerConfirmation
  return null
}

function extractAcceptTradeId(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.tradeId != null) return String(d.tradeId)
  const order = d.order as { tradeId?: string | null } | undefined
  if (order?.tradeId) return String(order.tradeId)
  const trade = d.trade as { id?: string } | undefined
  if (trade?.id) return String(trade.id)
  return null
}

type BlotterCard = {
  id: string
  name: string
  orders: number
  owner: string
  portfolio: string
  updated: string
}

function mapBlotterCards(data: unknown, fundNameById: Record<string, string>): BlotterCard[] {
  return unwrapList<OpsBlotter>(data)
    .map((b) => {
      const fundId = b.fundId != null ? String(b.fundId) : ''
      const rawName = String(b.name ?? b.title ?? '').trim()
      return {
        id: String(b.id ?? ''),
        name: rawName || 'Untitled blotter',
        orders: Number(b.orderCount ?? 0),
        owner: String(b.ownerName ?? b.createdByName ?? '—'),
        portfolio: fundId ? fundNameById[fundId] ?? fundId : '—',
        updated: b.updatedAt
          ? new Date(String(b.updatedAt)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : b.createdAt
            ? new Date(String(b.createdAt)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
        hasName: Boolean(rawName),
      }
    })
    // Hide empty untitled working sets (0 orders, no real name) — clutter from incomplete creates
    .filter((b) => {
      const unnamed = !b.hasName || /^untitled\b/i.test(b.name)
      return !(unnamed && b.orders === 0)
    })
    .map(({ hasName: _hasName, ...card }) => card)
}

export default function OrderbookPage() {
  const searchParams = useSearchParams()
  const deepLinkOrderId = searchParams.get('orderId')
  const [orders, setOrders] = useState<OrderbookRow[]>([])
  const [fundOptions, setFundOptions] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('Orderbook')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Newest first')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<OrderbookRow | null>(null)
  const [newBlotter, setNewBlotter] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [blotters, setBlotters] = useState<BlotterCard[]>([])
  const [blotterName, setBlotterName] = useState('')
  const [defaultPortfolioId, setDefaultPortfolioId] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [lifeBusy, setLifeBusy] = useState<
    null | 'submit' | 'approve' | 'cancel' | 'send' | 'accept' | 'record' | 'rejectConf' | 'reject' | 'fail' | 'archive'
  >(null)
  const [lifeError, setLifeError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [failOpen, setFailOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [rejectConfOpen, setRejectConfOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastReplyUrl, setLastReplyUrl] = useState<string | null>(null)
  const [brokerThreadLoading, setBrokerThreadLoading] = useState(false)
  const [brokerThread, setBrokerThread] = useState<{
    messages: Array<{
      id: string
      direction: string
      channel: string
      kind: string
      body?: string | null
      actorLabel?: string | null
      createdAt: string
      payloadJson?: Record<string, unknown> | null
    }>
    latestInstruction: {
      id: string
      replyUrl: string
      status: string
      toEmail?: string | null
      deliveryError?: string | null
      sentAt?: string | null
      repliedAt?: string | null
    } | null
  } | null>(null)
  const [brokers, setBrokers] = useState<{ id: string; name: string; email: string }[]>([])
  const [confOutcome, setConfOutcome] = useState<BrokerConfirmationOutcome>('FILLED')
  const [confQty, setConfQty] = useState('')
  const [confPrice, setConfPrice] = useState('')
  const [confTradeDate, setConfTradeDate] = useState('')
  const [confValueDate, setConfValueDate] = useState('')
  const [confNotes, setConfNotes] = useState('')
  const [confirmations, setConfirmations] = useState<BrokerConfirmation[]>([])
  const [confirmationsLoading, setConfirmationsLoading] = useState(false)
  const [approvals, setApprovals] = useState<OrderApproval[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersRes, portfoliosRes, blottersRes, tradesRes] = await Promise.all([
        investmentOpsApi.listOrders({ page: 1, pageSize: 200 }),
        investmentOpsApi.listPortfolios(),
        investmentOpsApi.listBlotters({ pageSize: 100 }),
        investmentOpsApi.listTrades(),
      ])
      if (ordersRes.success === false) {
        throw new Error(formatOpsError(ordersRes, 'Failed to load orders'))
      }
      if (blottersRes.success === false) {
        throw new Error(formatOpsError(blottersRes, 'Failed to load blotters'))
      }
      const names = fundNameMap(portfoliosRes.data)
      const funds = mapFundOptions(portfoliosRes.data)
      setFundOptions(funds)
      setDefaultPortfolioId((prev) => prev || funds[0]?.id || '')
      const trades =
        tradesRes.success === false ? [] : mapBlotterTrades(tradesRes.data, names)
      const rows = syncOrderbookStatusFromTrades(
        mapOrderbookOrders(ordersRes.data, names),
        trades,
      ).sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      setOrders(rows)
      setSelected((prev) => (prev ? rows.find((r) => r.apiId === prev.apiId) ?? null : null))
      setBlotters(mapBlotterCards(blottersRes.data, names))
    } catch (e) {
      setError(formatOpsError(e, 'Failed to load orders'))
      setOrders([])
      setBlotters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void investmentOpsApi.listBrokers().catch(() => null).then((brokerRes) => {
      if (brokerRes && brokerRes.success !== false) {
        setBrokers(
          unwrapList<{ id?: string; name?: string; contactEmail?: string }>(brokerRes.data)
            .map((b) => ({
              id: String(b.id ?? ''),
              name: String(b.name ?? b.id ?? 'Broker'),
              email: String(b.contactEmail ?? '').trim(),
            }))
            .filter((b) => b.id),
        )
      }
    })
  }, [])

  const filtered = useMemo(() => {
    const rows = orders.filter((order) => {
      const status = order.status
      return (
        orderMatchesLifecycleTab(status, tab) &&
        `${order.ref} ${order.ticker} ${order.portfolio} ${order.blotter} ${status}`.toLowerCase().includes(search.toLowerCase())
      )
    })
    return [...rows].sort((a, b) => {
      if (sort === 'Oldest first') {
        return (a.createdAt || '').localeCompare(b.createdAt || '')
      }
      if (sort === 'Largest value') return b.grossValue - a.grossValue
      if (sort === 'Status') return a.status.localeCompare(b.status)
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
  }, [orders, tab, search, sort])

  const openConfirmation = pickOpenConfirmation(confirmations)
  const selectedDisplayStatus = selected?.status ?? null

  useEffect(() => {
    if (!selected?.apiId) {
      setConfirmations([])
      return
    }
    let cancelled = false
    setConfirmationsLoading(true)
    void investmentOpsApi
      .listBrokerConfirmations(selected.apiId)
      .then((res) => {
        if (cancelled) return
        if (res.success === false) {
          setConfirmations([])
          return
        }
        setConfirmations(unwrapList<BrokerConfirmation>(res.data))
      })
      .catch(() => {
        if (!cancelled) setConfirmations([])
      })
      .finally(() => {
        if (!cancelled) setConfirmationsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.apiId, selected?.version])

  useEffect(() => {
    if (!selected?.apiId) {
      setBrokerThread(null)
      setBrokerThreadLoading(false)
      return
    }
    let cancelled = false
    setBrokerThreadLoading(true)
    void investmentOpsApi
      .listBrokerMessages(selected.apiId)
      .then((res) => {
        if (cancelled) return
        if (res.success === false || !res.data) {
          setBrokerThread(null)
          return
        }
        setBrokerThread(res.data)
        if (res.data.latestInstruction?.replyUrl) {
          setLastReplyUrl(res.data.latestInstruction.replyUrl)
        }
      })
      .catch(() => {
        if (!cancelled) setBrokerThread(null)
      })
      .finally(() => {
        if (!cancelled) setBrokerThreadLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.apiId, selected?.version, lifeBusy])

  const refreshBrokerData = useCallback(
    async (orderId: string) => {
      if (!orderId) return
      try {
        const [msgRes, confRes] = await Promise.all([
          investmentOpsApi.listBrokerMessages(orderId),
          investmentOpsApi.listBrokerConfirmations(orderId),
        ])
        if (selected?.apiId === orderId) {
          if (msgRes.success !== false && msgRes.data) {
            setBrokerThread(msgRes.data)
            if (msgRes.data.latestInstruction?.replyUrl) {
              setLastReplyUrl(msgRes.data.latestInstruction.replyUrl)
            }
          }
          if (confRes.success !== false) {
            setConfirmations(unwrapList<BrokerConfirmation>(confRes.data))
          }
        }
        await load()
      } catch {
        /* non-fatal live refresh */
      }
    },
    [load, selected?.apiId],
  )

  useInvestmentBrokerReplySocket(
    useCallback(
      (orderId) => {
        void refreshBrokerData(orderId)
      },
      [refreshBrokerData],
    ),
  )

  useEffect(() => {
    if (!deepLinkOrderId || orders.length === 0) return
    const row = orders.find((o) => o.apiId === deepLinkOrderId)
    if (row) setSelected(row)
  }, [deepLinkOrderId, orders])

  useEffect(() => {
    if (!selected?.apiId) {
      setApprovals([])
      return
    }
    let cancelled = false
    setTimelineLoading(true)
    void investmentOpsApi
      .getOrder(selected.apiId)
      .then((res) => {
        if (cancelled) return
        const list = res.data?.approvals ?? []
        setApprovals(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setApprovals([])
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.apiId, selected?.version])

  const pageSize = 4
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const changeTab = (value: string) => {
    setTab(value)
    setPage(1)
  }

  const createBlotter = async () => {
    if (!blotterName.trim()) return
    setCreateBusy(true)
    setCreateError(null)
    try {
      const res = await investmentOpsApi.createBlotter({
        name: blotterName.trim(),
        fundId: defaultPortfolioId || undefined,
      })
      if (res.success === false) {
        throw new Error(formatOpsError(res, 'Failed to create blotter'))
      }
      setBlotterName('')
      setNewBlotter(false)
      await load()
    } catch (e) {
      setCreateError(formatOpsError(e, 'Failed to create blotter'))
    } finally {
      setCreateBusy(false)
    }
  }

  const runLifecycle = async (
    action: 'submit' | 'approve' | 'cancel' | 'send' | 'reject' | 'fail' | 'archive',
    reason?: string,
  ): Promise<boolean> => {
    if (!selected?.apiId || lifeBusy) return false
    if (
      (action === 'reject' || action === 'fail' || action === 'cancel') &&
      !reason?.trim()
    ) {
      return false
    }
    if (action === 'send' && !selected.custodianProfileId?.trim()) {
      toast.error('This order has no custodian. Set one on the order before sending.')
      return false
    }
    if (action === 'send' && !selected.brokerProfileId?.trim()) {
      toast.error('This order has no broker. Set one on the order before sending.')
      return false
    }
    const selectedBroker = brokers.find((b) => b.id === selected.brokerProfileId?.trim())
    if (action === 'send' && selectedBroker && !selectedBroker.email) {
      toast.error(`Broker “${selectedBroker.name}” has no contact email on their record.`)
      return false
    }
    setLifeBusy(action)
    setLifeError(null)
    try {
      const body = { expectedVersion: selected.version }
      let res
      if (action === 'submit') res = await investmentOpsApi.submitOrder(selected.apiId, body)
      else if (action === 'approve') res = await investmentOpsApi.approveOrder(selected.apiId, body)
      else if (action === 'send') {
        res = await investmentOpsApi.sendOrderToBroker(selected.apiId, {
          expectedVersion: selected.version,
          channel: 'EMAIL',
          sentAt: new Date().toISOString(),
          brokerProfileId: selected.brokerProfileId,
          custodianProfileId: selected.custodianProfileId,
          valueDate: selected.valueDateIso || undefined,
          settlementAccountId: selected.settlementAccountId || undefined,
        })
        if (res.success === false) throw new Error(formatOpsError(res, 'Failed to send order'))
        const instruction = (res as { data?: { instruction?: { replyUrl?: string; status?: string; toEmail?: string | null; deliveryError?: string | null } } })
          ?.data?.instruction
        if (instruction?.replyUrl) {
          setLastReplyUrl(instruction.replyUrl)
          toast.success(
            instruction.status === 'SENT'
              ? `Email sent to ${instruction.toEmail || 'broker'}. Broker can reply via the link.`
              : `Instruction created (${instruction.status}). Share the reply link with the broker.`,
            {
              action: {
                label: 'Copy reply link',
                onClick: () => {
                  void navigator.clipboard.writeText(instruction.replyUrl!)
                  toast.message('Broker reply link copied')
                },
              },
              duration: 12000,
            },
          )
        } else {
          toast.success('Order sent to broker. Custodian authorisation recorded — no blotter row yet.')
        }
      } else if (action === 'reject') {
        res = await investmentOpsApi.rejectOrder(selected.apiId, {
          reason: reason!.trim(),
          expectedVersion: selected.version,
        })
      } else if (action === 'fail') {
        res = await investmentOpsApi.failOrder(selected.apiId, {
          reason: reason!.trim(),
          expectedVersion: selected.version,
        })
      } else if (action === 'archive') {
        res = await investmentOpsApi.archiveOrder(selected.apiId, {
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
          expectedVersion: selected.version,
        })
      } else {
        res = await investmentOpsApi.cancelOrder(selected.apiId, reason!.trim())
      }
      if (res.success === false) throw new Error(formatOpsError(res, `Failed to ${action} order`))
      if (action === 'approve') {
        toast.success('Order approved.')
      } else if (action === 'submit') {
        toast.success('Order submitted for approval.')
      } else if (action === 'send') {
        // toast handled above with reply link
      } else if (action === 'fail') {
        toast.success('Order marked Failed.')
      } else if (action === 'archive') {
        toast.success('Order archived.')
      }
      await load()
      return true
    } catch (e) {
      const msg = formatOpsError(e, `Failed to ${action} order`)
      setLifeError(msg)
      toast.error(msg)
      return false
    } finally {
      setLifeBusy(null)
    }
  }

  const openRecordConfirmation = () => {
    if (!selected) return
    const existing = openConfirmation
    const remaining = Math.max(0, selected.qty - selected.filled) || selected.qty
    setConfOutcome((existing?.outcome as BrokerConfirmationOutcome) || 'FILLED')
    setConfQty(existing?.quantity != null ? String(existing.quantity) : String(remaining))
    setConfPrice(
      existing?.price != null
        ? String(existing.price)
        : String(selected.execPrice ?? selected.limitPrice ?? ''),
    )
    setConfTradeDate(
      existing?.tradeDate
        ? String(existing.tradeDate).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    )
    setConfValueDate(existing?.valueDate ? String(existing.valueDate).slice(0, 10) : '')
    setConfNotes(existing?.notes != null ? String(existing.notes) : '')
    setConfirmOpen(true)
  }

  const saveConfirmation = async () => {
    if (!selected?.apiId || lifeBusy) return
    if (!confQty.trim() || !confPrice.trim()) {
      toast.error('Quantity and price from the broker are required.')
      return
    }
    setLifeBusy('record')
    setLifeError(null)
    try {
      const res = await investmentOpsApi.recordBrokerConfirmation(selected.apiId, {
        expectedVersion: selected.version,
        outcome: confOutcome,
        quantity: confQty.trim(),
        price: confPrice.trim(),
        currencyCode: 'USD',
        tradeDate: confTradeDate || undefined,
        valueDate: confValueDate || undefined,
        notes: confNotes.trim() || undefined,
        attachmentFileId: null,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Failed to record confirmation'))
      const recorded = unwrapRecordedConfirmation(res.data)
      if (recorded) {
        setConfirmations((prev) => {
          const without = prev.filter((c) => c.id !== recorded.id)
          return [recorded, ...without]
        })
      }
      setConfirmOpen(false)
      toast.success('Broker confirmation recorded. Accept to create the trade on the blotter.')
      await load()
    } catch (e) {
      const msg = formatOpsError(e, 'Failed to record confirmation')
      setLifeError(msg)
      toast.error(msg)
    } finally {
      setLifeBusy(null)
    }
  }

  const acceptConfirmation = async () => {
    if (!selected?.apiId || !openConfirmation?.id || lifeBusy) return
    setLifeBusy('accept')
    setLifeError(null)
    try {
      const res = await investmentOpsApi.acceptBrokerConfirmation(selected.apiId, openConfirmation.id, {
        expectedVersion: selected.version,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Failed to accept confirmation'))
      const tradeId = extractAcceptTradeId(res.data) ?? selected.tradeId
      const href = blotterDeepLink({
        tradeId: tradeId ? String(tradeId) : null,
        apiId: selected.apiId,
        ref: selected.ref,
      })
      toast.success(tradeId ? `Trade executed (${tradeId})` : 'Trade executed — now on blotter', {
        action: {
          label: 'Open blotter',
          onClick: () => window.open(href, '_blank', 'noopener,noreferrer'),
        },
      })
      setConfirmations([])
      await load()
    } catch (e) {
      const msg = formatOpsError(e, 'Failed to accept confirmation')
      setLifeError(msg)
      toast.error(msg)
    } finally {
      setLifeBusy(null)
    }
  }

  const rejectConfirmation = async (reason: string): Promise<boolean> => {
    if (!selected?.apiId || !openConfirmation?.id || lifeBusy) return false
    setLifeBusy('rejectConf')
    setLifeError(null)
    try {
      const res = await investmentOpsApi.rejectBrokerConfirmation(selected.apiId, openConfirmation.id, {
        reason: reason.trim(),
        expectedVersion: selected.version,
      })
      if (res.success === false) throw new Error(formatOpsError(res, 'Failed to reject confirmation'))
      toast.message('Confirmation rejected. Use Send again to email the same or another broker.')
      setConfirmations([])
      await load()
      return true
    } catch (e) {
      const msg = formatOpsError(e, 'Failed to reject confirmation')
      setLifeError(msg)
      toast.error(msg)
      return false
    } finally {
      setLifeBusy(null)
    }
  }

  const raw = selected?.rawStatus?.toUpperCase() ?? ''
  const anyLifeBusy = Boolean(lifeBusy)
  const awaitingBroker = raw === 'SENT_TO_BROKER' || raw === 'ROUTED'
  const confirmationRecorded =
    raw === 'BROKER_CONFIRMATION_RECORDED' ||
    raw === 'CONFIRMATION_RECORDED' ||
    Boolean(openConfirmation)
  const canRecordConfirmation =
    awaitingBroker ||
    confirmationRecorded ||
    raw === 'PARTIALLY_EXECUTED' ||
    raw.includes('PARTIAL')
  const hasOpenConfirmation = Boolean(openConfirmation)
  const canSendToBroker = raw === 'APPROVED' || (awaitingBroker && !hasOpenConfirmation)
  const sendAgain = awaitingBroker && !hasOpenConfirmation

  /** Open blotter tab only — no extra API; requires order.tradeId on the row. */
  const openBlotterForOrder = (order: OrderbookRow) => {
    if (!order.tradeId) {
      toast.error(
        `No trade on ${order.ref} yet. Record broker confirmation and Accept first.`,
      )
      return
    }
    window.open(blotterDeepLink(order), '_blank', 'noopener,noreferrer')
  }

  return (
    <OrdersPage
      title="Orderbook"
      description="Pending orders only: Draft → Approve → Send to broker → Record confirmation → Accept (trade moves to blotter). Broker negotiation is outside this system."
      actions={
        <div className="flex flex-wrap gap-2">
          <button className={cn(buttonClass, 'border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500')} onClick={() => setShowOrder(true)}>
            <Plus className="h-3.5 w-3.5" /> New order
          </button>
          {SHOW_WORKING_SET_BLOTTERS && (
            <button className={cn(buttonClass)} onClick={() => setNewBlotter(true)}>
              <Plus className="h-3.5 w-3.5" /> New Blotter
            </button>
          )}
        </div>
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

      {SHOW_WORKING_SET_BLOTTERS && (
      <OrdersCard title="Open Blotters" eyebrow="Working sets">
        {loading ? (
          <OpsCardGridSkeleton count={6} />
        ) : (
        <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
          {blotters.length === 0 && (
            <p className="col-span-full px-2 py-6 text-center text-[11px] text-slate-500">No blotters yet. Create one to group related orders.</p>
          )}
          {blotters.map((item) => (
            <button
              key={item.id || item.name}
              onClick={() => {
                setSearch(item.name)
                setTab('Orderbook')
                setPage(1)
              }}
              className="rounded-[24px] border border-white/[0.06] bg-[linear-gradient(135deg,#172333_0%,#101a29_58%,#0b1420_100%)] p-4 text-left transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]"
            >
              <div className="flex justify-between">
                <span className="text-[11px] font-semibold">{item.name}</span>
                <Pill tone="blue">{item.orders} orders</Pill>
              </div>
              <p className="mt-3 text-[10px] text-slate-500">
                {item.orders === 0
                  ? 'No orders in this working set yet. Open New order to add one.'
                  : `${item.orders} order${item.orders === 1 ? '' : 's'} linked to this blotter.`}
              </p>
              <div className="mt-3 flex justify-between text-[9px] text-slate-500">
                <span>
                  {item.owner} · {item.portfolio}
                </span>
                <span title="Last updated">{item.updated}</span>
              </div>
            </button>
          ))}
        </div>
        )}
      </OrdersCard>
      )}

      <OrdersCard
        title="All orders"
        eyebrow={loading ? 'Loading…' : `${filtered.length} records`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3 w-3 text-slate-500" />
              <input className={cn(inputClass, 'w-56 pl-8')} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order or ticker" />
            </div>
            <SelectField value={sort} onChange={setSort}>
              <option>Newest first</option>
              <option>Oldest first</option>
              <option>Largest value</option>
              <option>Status</option>
            </SelectField>
          </div>
        }
      >
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeTab(item)}
              className={cn(
                'h-8 shrink-0 rounded-full px-3 text-[10px]',
                tab === item ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead>
              <tr>
                {['Ref', 'Portfolio', 'Instrument', 'Side', 'Qty', 'Filled', 'Px', 'Gross', 'Broker', 'Trader', 'Dates', 'Status', 'Approval', 'Routing', 'Blotter'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={15} className="p-0">
                    <OpsTableSkeleton rows={8} cols={8} />
                  </td>
                </tr>
              )}
              {!loading &&
                pageRows.map((order) => (
                  <tr
                    key={order.apiId || order.ref}
                    onClick={() => {
                      setLifeError(null)
                      setSelected(order)
                    }}
                    className={cn('cursor-pointer hover:bg-white/[0.03]', selected?.apiId === order.apiId && 'bg-blue-500/10')}
                  >
                    <td className="font-mono">{order.ref}</td>
                    <td>{order.portfolio}</td>
                    <td>
                      {order.ticker}
                      <div className="text-[9px] text-slate-600">{order.instrument}</div>
                    </td>
                    <td>
                      <Pill tone={String(order.side).toUpperCase().includes('SELL') ? 'red' : 'green'}>
                        {order.side}
                      </Pill>
                    </td>
                    <td className="text-right font-mono">{order.qty.toLocaleString()}</td>
                    <td className="text-right font-mono">{order.filled.toLocaleString()}</td>
                    <td className="text-right font-mono">
                      {order.execPrice?.toFixed(2) ?? '—'} / {order.limitPrice?.toFixed(2) ?? 'MKT'}
                    </td>
                    <td className="text-right font-mono">{order.gross}</td>
                    <td>{order.broker}</td>
                    <td>{order.trader}</td>
                    <td>
                      {order.tradeDate}
                      <div className="text-[9px] text-slate-600">VD {order.valueDate}</div>
                    </td>
                    <td>
                      <Pill tone={tone(order.status) as 'green' | 'amber' | 'blue' | 'red'}>{order.status}</Pill>
                      {order.brokerOfferQty && order.brokerOfferPrice ? (
                        <div className="mt-0.5 text-[9px] text-slate-500">
                          {order.brokerOfferQty} @ {order.brokerOfferPrice}
                          {order.brokerOfferCurrency ? ` ${order.brokerOfferCurrency}` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <Pill
                        tone={
                          order.approval.includes('Awaiting')
                            ? 'amber'
                            : order.approval.includes('Rejected')
                              ? 'red'
                              : order.approval.includes('Not')
                                ? 'slate'
                                : 'green'
                        }
                      >
                        {order.approval}
                      </Pill>
                    </td>
                    <td>{order.routing}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {orderHasBlotterLink(order) ? (
                        <button
                          type="button"
                          onClick={() => openBlotterForOrder(order)}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 px-2 py-1 text-[9px] text-blue-300 hover:bg-blue-500/10"
                          title="Open linked trade on Trade Blotter"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 text-[10px] text-slate-500">
          <span>
            Showing {pageRows.length} of {filtered.length} orders
          </span>
          <div className="flex gap-1">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={cn('h-7 w-7 rounded-full hover:bg-white/10', page === n && 'bg-blue-600 text-white')}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </OrdersCard>

      {selected && (
        <DetailPanel open={!!selected} onClose={() => setSelected(null)} width="max-w-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-blue-400">Order detail</p>
              <h2 className="mt-1 font-mono text-base">{selected.ref}</h2>
            </div>
            <button className={buttonClass} onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          {orderHasBlotterLink(selected) && (
            <button
              type="button"
              onClick={() => openBlotterForOrder(selected)}
              className={cn(buttonClass, 'mt-4 w-full border-blue-400/40 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open on Trade Blotter
            </button>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {Object.entries({
              Portfolio: selected.portfolio,
              Instrument: `${selected.ticker} · ${selected.masterRef}`,
              Side: selected.side,
              Quantity: selected.qty.toLocaleString(),
              Broker: selected.broker,
              Custodian: selected.custodian,
              'Settlement account': selected.settlementAccount,
              Trader: selected.trader,
              Approval: selected.approval,
              Routing: selected.routing,
              'Trade date': selected.tradeDate,
              'Value date': selected.valueDate,
              Status: selectedDisplayStatus ?? selected.status,
              'Trade id': selected.tradeId ?? '—',
              Version: String(selected.version),
              ...(openConfirmation
                ? {
                    'Broker qty': String(openConfirmation.quantity),
                    'Broker px': String(openConfirmation.price),
                    Outcome: String(openConfirmation.outcome),
                  }
                : {}),
            }).map(([label, value]) => (
              <div key={label} className="rounded-[16px] bg-white/[0.035] p-3">
                <div className="text-[9px] uppercase text-slate-600">{label}</div>
                {label === 'Side' ? (
                  <div className="mt-1">
                    <Pill tone={String(value).toUpperCase().includes('SELL') ? 'red' : 'green'}>{value}</Pill>
                  </div>
                ) : (
                  <div className="mt-1 text-[11px]">{value}</div>
                )}
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-[11px] font-semibold">Lifecycle actions</h3>
          {lifeError && <p className="mt-2 text-[10px] text-rose-300">{lifeError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {raw === 'DRAFT' && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass, 'bg-blue-600 text-white')} onClick={() => void runLifecycle('submit')}>
                {lifeBusy === 'submit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Submit
              </button>
            )}
            {raw === 'SUBMITTED' && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass, 'border-emerald-400/40 text-emerald-300')} onClick={() => void runLifecycle('approve')}>
                {lifeBusy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Approve
              </button>
            )}
            {canSendToBroker && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass)} onClick={() => void runLifecycle('send')}>
                {lifeBusy === 'send' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {sendAgain ? 'Send again' : 'Send to broker'}
              </button>
            )}
            {canRecordConfirmation && !hasOpenConfirmation && (
              <button
                type="button"
                disabled={anyLifeBusy}
                className={cn(buttonClass, 'bg-emerald-600 text-white')}
                onClick={openRecordConfirmation}
              >
                {lifeBusy === 'record' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Record confirmation
              </button>
            )}
            {canRecordConfirmation && hasOpenConfirmation && (
              <>
                <button
                  type="button"
                  disabled={anyLifeBusy}
                  className={cn(buttonClass)}
                  onClick={openRecordConfirmation}
                >
                  Record another
                </button>
                <button
                  type="button"
                  disabled={anyLifeBusy || String(openConfirmation?.outcome).toUpperCase() === 'UNABLE'}
                  className={cn(buttonClass, 'bg-emerald-600 text-white')}
                  onClick={() => void acceptConfirmation()}
                >
                  {lifeBusy === 'accept' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {lifeBusy === 'accept' ? 'Accepting…' : 'Accept confirmation'}
                </button>
                <button
                  type="button"
                  disabled={anyLifeBusy}
                  className={cn(buttonClass, 'border-amber-400/30 text-amber-200')}
                  onClick={() => setRejectConfOpen(true)}
                >
                  {lifeBusy === 'rejectConf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Reject / keep looking
                </button>
              </>
            )}
            {confirmationsLoading && (
              <span className="text-[9px] text-slate-500">Loading confirmations…</span>
            )}
            {(raw === 'SUBMITTED' || raw === 'APPROVED') && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass, 'border-rose-400/30 text-rose-300')} onClick={() => setRejectOpen(true)}>
                Reject
              </button>
            )}
            {(awaitingBroker ||
              confirmationRecorded ||
              raw === 'PARTIALLY_EXECUTED' ||
              raw === 'EXECUTED' ||
              raw === 'PENDING_SETTLEMENT' ||
              raw.includes('PARTIAL')) && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass, 'border-rose-400/30 text-rose-300')} onClick={() => setFailOpen(true)}>
                Fail
              </button>
            )}
            {(raw === 'SETTLED' || raw === 'REJECTED' || raw === 'CANCELLED' || raw === 'FAILED') && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass)} onClick={() => setArchiveOpen(true)}>
                Archive
              </button>
            )}
            {!['CANCELLED', 'EXECUTED', 'SETTLED', 'REJECTED', 'FAILED', 'ARCHIVED', 'PENDING_SETTLEMENT'].includes(raw) && (
              <button type="button" disabled={anyLifeBusy} className={cn(buttonClass, 'border-rose-400/30 text-rose-300')} onClick={() => setCancelOpen(true)}>
                Cancel
              </button>
            )}
          </div>
          {(brokerThreadLoading ||
            brokerThread?.latestInstruction ||
            lastReplyUrl ||
            awaitingBroker ||
            confirmationRecorded) && (
            <BrokerCommunicationPanel
              loading={brokerThreadLoading}
              messages={brokerThread?.messages ?? []}
              latestInstruction={brokerThread?.latestInstruction ?? null}
              lastReplyUrl={lastReplyUrl}
              openConfirmation={openConfirmation}
              rawStatus={raw}
              onCopyReplyLink={() => {
                const url = brokerThread?.latestInstruction?.replyUrl || lastReplyUrl
                if (!url) return
                void navigator.clipboard.writeText(url)
                toast.message('Reply link copied — send to the broker if needed')
              }}
            />
          )}
          {hasOpenConfirmation && String(openConfirmation?.outcome).toUpperCase() === 'UNABLE' && (
            <p className="mt-2 text-[9px] text-amber-200">
              Broker unable — Reject confirmation and keep looking, then Send again (same or different broker), or Fail the order.
            </p>
          )}

          <h3 className="mt-6 text-[11px] font-semibold">Status timeline</h3>
          <p className="mt-1 text-[9px] text-slate-500">Every transition should log user, timestamp, reason, old → new.</p>
          <div className="mt-3 space-y-3 border-l border-white/10 pl-4">
            <div className="relative">
              <span className="absolute -left-[20px] top-1 h-2 w-2 rounded-full bg-blue-400" />
              <Pill tone={tone(selectedDisplayStatus ?? selected.status) as 'green' | 'amber' | 'blue' | 'red'}>
                {selectedDisplayStatus ?? selected.status}
              </Pill>
              <div className="mt-1 text-[9px] text-slate-600">Current · Created {selected.created}</div>
            </div>
            {timelineLoading && <p className="text-[10px] text-slate-500">Loading transitions…</p>}
            {!timelineLoading &&
              approvals.map((a) => (
                <div key={a.id} className="relative">
                  <span className="absolute -left-[20px] top-1 h-2 w-2 rounded-full bg-slate-500" />
                  <div className="text-[10px] font-medium">
                    {a.oldStatus || '—'} → {a.newStatus || a.status}
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-500">
                    {a.approvalType || 'Transition'}
                    {a.reason ? ` · ${a.reason}` : ''}
                    {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString()}` : ''}
                  </div>
                </div>
              ))}
            {!timelineLoading && approvals.length === 0 && (
              <p className="text-[9px] text-slate-600">No transition history returned for this order yet.</p>
            )}
          </div>
        </DetailPanel>
      )}

      <ConfirmReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject order"
        description={`Reject order ${selected?.ref ?? ''}? This cannot be undone.`}
        reasonLabel="Rejection reason"
        confirmLabel="Reject order"
        onConfirm={(reason) => runLifecycle('reject', reason)}
      />
      <ConfirmReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel order"
        description={`Cancel order ${selected?.ref ?? ''}?`}
        reasonLabel="Cancellation reason"
        confirmLabel="Cancel order"
        onConfirm={(reason) => runLifecycle('cancel', reason)}
      />
      <ConfirmReasonDialog
        open={failOpen}
        onOpenChange={setFailOpen}
        title="Fail order"
        description={`Mark order ${selected?.ref ?? ''} as Failed? Reason is required for audit.`}
        reasonLabel="Failure reason"
        confirmLabel="Fail order"
        onConfirm={(reason) => runLifecycle('fail', reason)}
      />
      <ConfirmReasonDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive order"
        description={`Archive order ${selected?.ref ?? ''}? Optional reason is recorded.`}
        reasonLabel="Archive reason (optional)"
        confirmLabel="Archive order"
        reasonRequired={false}
        onConfirm={(reason) => runLifecycle('archive', reason)}
      />

      <ConfirmReasonDialog
        open={rejectConfOpen}
        onOpenChange={setRejectConfOpen}
        title="Reject broker confirmation"
        description={`Reject confirmation on ${selected?.ref ?? ''}? Order returns to Sent to Broker — no blotter trade.`}
        reasonLabel="Reason"
        confirmLabel="Reject confirmation"
        onConfirm={(reason) => rejectConfirmation(reason)}
      />

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (lifeBusy === 'record') return
          setConfirmOpen(false)
        }}
        title="Record broker confirmation"
        subtitle="Broker negotiation happened outside this system. Capture what they confirmed so you can Accept and create the trade on the blotter."
        footer={
          <>
            <button
              type="button"
              className={buttonClass}
              disabled={lifeBusy === 'record'}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={anyLifeBusy || !confQty.trim() || !confPrice.trim()}
              className={cn(buttonClass, 'bg-emerald-600 text-white')}
              onClick={() => void saveConfirmation()}
            >
              {lifeBusy === 'record' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {lifeBusy === 'record' ? 'Saving…' : 'Save confirmation'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Outcome">
            <select
              className={inputClass}
              value={confOutcome}
              onChange={(e) => setConfOutcome(e.target.value as BrokerConfirmationOutcome)}
            >
              <option value="FILLED">Filled</option>
              <option value="PARTIAL">Partial</option>
              <option value="COUNTER">Counter</option>
              <option value="UNABLE">Unable</option>
            </select>
          </Field>
          <Field label="Confirmed quantity">
            <input className={inputClass} value={confQty} onChange={(e) => setConfQty(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Confirmed price">
            <input className={inputClass} value={confPrice} onChange={(e) => setConfPrice(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Trade date">
            <input className={inputClass} type="date" value={confTradeDate} onChange={(e) => setConfTradeDate(e.target.value)} />
          </Field>
          <Field label="Value date">
            <input className={inputClass} type="date" value={confValueDate} onChange={(e) => setConfValueDate(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Notes">
            <textarea
              className={cn(inputClass, 'min-h-[72px]')}
              value={confNotes}
              onChange={(e) => setConfNotes(e.target.value)}
              placeholder="Optional notes from broker / ops"
            />
          </Field>
        </div>
        {selected && Number(confQty) > 0 && Number(confQty) < selected.qty && (
          <p className="mt-3 text-[10px] text-amber-200">
            Partial — remaining {(selected.qty - Number(confQty)).toLocaleString()} stays open after Accept.
          </p>
        )}
      </Modal>

      {SHOW_WORKING_SET_BLOTTERS && (
      <Modal
        open={newBlotter}
        onClose={() => setNewBlotter(false)}
        title="New blotter"
        subtitle="Create a working set for related orders via the blotters API."
        footer={
          <>
            <button className={buttonClass} onClick={() => setNewBlotter(false)}>
              Cancel
            </button>
            <button
              disabled={!blotterName.trim() || createBusy}
              className={cn(buttonClass, 'bg-blue-600 text-white')}
              onClick={() => void createBlotter()}
            >
              {createBusy ? 'Creating…' : 'Create blotter'}
            </button>
          </>
        }
      >
        {createError && <p className="mb-3 text-[11px] text-rose-300">{createError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Blotter name">
            <input className={inputClass} value={blotterName} onChange={(e) => setBlotterName(e.target.value)} placeholder="e.g. August income rotation" />
          </Field>
          <Field label="Default portfolio">
            <SelectField value={defaultPortfolioId} onChange={setDefaultPortfolioId}>
              {fundOptions.length === 0 && <option value="">—</option>}
              {fundOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </Modal>
      )}

      <PlaceEquityOrderModal open={showOrder} onClose={() => setShowOrder(false)} onComplete={() => void load()} />
    </OrdersPage>
  )
}
