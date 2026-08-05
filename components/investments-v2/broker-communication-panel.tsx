'use client'

import { cn } from '@/lib/utils'
import type { BrokerConfirmation } from '@/lib/api/investment-ops-api'
import { buttonClass } from '@/components/investments-v2/orders-ui'

export type BrokerMessage = {
  id: string
  direction: string
  channel: string
  kind: string
  body?: string | null
  actorLabel?: string | null
  createdAt: string
  payloadJson?: Record<string, unknown> | null
}

export type BrokerLatestInstruction = {
  id: string
  status: string
  toEmail?: string | null
  deliveryError?: string | null
  replyUrl: string
  sentAt?: string | null
  expiresAt?: string
  repliedAt?: string | null
}

function instructionStatusLabel(status: string | null | undefined): string {
  const u = String(status ?? '').toUpperCase()
  if (u === 'SENT') return 'Email sent'
  if (u === 'REPLIED') return 'Broker replied'
  if (u === 'FAILED') return 'Email failed'
  if (u === 'NO_EMAIL') return 'No email — use reply link'
  if (u === 'PENDING') return 'Preparing email'
  return status ? String(status) : '—'
}

function outcomeLabel(outcome: string): string {
  const u = outcome.toUpperCase()
  if (u === 'FILLED') return 'Can fill'
  if (u === 'COUNTER') return 'Counter-offer'
  if (u === 'UNABLE') return 'Unable'
  if (u === 'PARTIAL') return 'Partial fill'
  return outcome
}

function formatWhen(createdAt?: string): string {
  if (!createdAt) return ''
  try {
    return new Date(createdAt).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function cleanBody(body: string): string {
  let detail = body.trim()
  detail = detail.replace(/\s*\|\s*Via broker reply link\s+\S+/gi, '')
  detail = detail.replace(/^\[Trade instruction\]\s*/i, '')
  detail = detail.replace(/^[A-Z]*ORD-[A-Z0-9]+\s*[—\-–]\s*/i, '')
  if (detail.includes('|')) {
    detail = detail
      .split(/\s*\|\s*/)
      .map((p) => p.trim())
      .filter((p) => p && !/^Via broker/i.test(p) && !/^bins_/i.test(p))
      .join(' · ')
  }
  return detail.trim()
}

export function formatBrokerMessage(m: BrokerMessage): {
  title: string
  detail: string
  when: string
  fields: Array<{ label: string; value: string }>
  isInbound: boolean
  kind: string
} {
  const dir = String(m.direction ?? '').toUpperCase()
  const kind = String(m.kind ?? '').toUpperCase()
  const payload = m.payloadJson ?? {}
  const isInbound = dir === 'INBOUND'

  let title = 'Update'
  if (dir === 'OUTBOUND' && kind === 'INSTRUCTION') title = 'Instruction emailed to broker'
  else if (isInbound && kind === 'FILLED') title = 'Broker can fill at these terms'
  else if (isInbound && kind === 'PARTIAL') title = 'Broker offered a partial fill'
  else if (isInbound && kind === 'COUNTER') title = 'Broker counter-offer'
  else if (isInbound && kind === 'UNABLE') title = 'Broker could not fill'
  else if (dir === 'OUTBOUND') title = 'Message sent to broker'
  else if (isInbound) title = 'Reply from broker'

  const fields: Array<{ label: string; value: string }> = []
  if (payload.quantity != null && String(payload.quantity) !== '') {
    fields.push({ label: 'Quantity', value: String(payload.quantity) })
  }
  if (payload.price != null && String(payload.price) !== '') {
    fields.push({ label: 'Price', value: String(payload.price) })
  }
  if (payload.currencyCode) fields.push({ label: 'Currency', value: String(payload.currencyCode) })
  if (payload.brokerReference) {
    fields.push({ label: 'Broker ref', value: String(payload.brokerReference) })
  }
  if (kind === 'COUNTER' && payload.proceed === true) {
    fields.push({ label: 'Proceed', value: 'Broker asks to proceed at counter' })
  }

  let detail = cleanBody(String(m.body ?? ''))
  if (kind === 'INSTRUCTION' && (!detail || /^BUY|^SELL/i.test(detail))) {
    detail = detail || 'Trade instruction sent'
  }
  if (!detail && m.actorLabel) detail = String(m.actorLabel)

  return {
    title,
    detail,
    when: formatWhen(m.createdAt),
    fields,
    isInbound,
    kind,
  }
}

type BrokerStage = {
  id: string
  label: string
  active: boolean
  done: boolean
}

function buildStages(opts: {
  rawStatus: string
  hasInstruction: boolean
  instructionReplied: boolean
  hasOpenConfirmation: boolean
  openOutcome?: string
}): BrokerStage[] {
  const raw = opts.rawStatus.toUpperCase()
  const outcome = String(opts.openOutcome ?? '').toUpperCase()

  const sent = opts.hasInstruction || raw === 'SENT_TO_BROKER' || raw === 'ROUTED'
  const awaiting =
    sent && !opts.instructionReplied && !opts.hasOpenConfirmation && raw === 'SENT_TO_BROKER'
  const replied = opts.instructionReplied || opts.hasOpenConfirmation
  const amReview =
    opts.hasOpenConfirmation &&
    (outcome === 'COUNTER' || outcome === 'FILLED' || outcome === 'PARTIAL' || outcome === 'UNABLE')

  return [
    { id: 'sent', label: 'Instruction sent', active: sent && !replied, done: sent },
    {
      id: 'awaiting',
      label: 'Awaiting broker',
      active: awaiting,
      done: replied || !awaiting,
    },
    {
      id: 'reply',
      label: outcome ? outcomeLabel(outcome) : 'Broker replied',
      active: replied && !amReview,
      done: replied,
    },
    {
      id: 'review',
      label: 'Your decision',
      active: amReview,
      done: false,
    },
  ]
}

export function BrokerCommunicationPanel({
  loading,
  messages,
  latestInstruction,
  lastReplyUrl,
  openConfirmation,
  rawStatus,
  onCopyReplyLink,
}: {
  loading: boolean
  messages: BrokerMessage[]
  latestInstruction: BrokerLatestInstruction | null
  lastReplyUrl: string | null
  openConfirmation: BrokerConfirmation | null
  rawStatus: string
  onCopyReplyLink: () => void
}) {
  const instructionReplied =
    latestInstruction?.status === 'REPLIED' || Boolean(latestInstruction?.repliedAt)
  const stages = buildStages({
    rawStatus,
    hasInstruction: Boolean(latestInstruction),
    instructionReplied,
    hasOpenConfirmation: Boolean(openConfirmation),
    openOutcome: openConfirmation?.outcome,
  })
  const activeStageId = stages.find((s) => s.active)?.id ?? stages.filter((s) => s.done).pop()?.id
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const latestMessageId = sortedMessages[sortedMessages.length - 1]?.id

  return (
    <div className="mt-4 rounded-2xl border border-slate-600/50 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-100">Broker communication</p>
        {openConfirmation ? (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
              String(openConfirmation.outcome).toUpperCase() === 'COUNTER' &&
                'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
              String(openConfirmation.outcome).toUpperCase() === 'FILLED' &&
                'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40',
              String(openConfirmation.outcome).toUpperCase() === 'UNABLE' &&
                'bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/40',
              String(openConfirmation.outcome).toUpperCase() === 'PARTIAL' &&
                'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/40',
            )}
          >
            {outcomeLabel(String(openConfirmation.outcome))}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {stages.map((stage) => (
          <span
            key={stage.id}
            className={cn(
              'rounded-full px-2.5 py-1 text-[9px] transition-colors',
              stage.id === activeStageId
                ? 'bg-blue-500/25 font-semibold text-blue-100 ring-1 ring-blue-400/50'
                : stage.done
                  ? 'bg-white/[0.06] text-slate-400'
                  : 'bg-white/[0.02] text-slate-600',
            )}
          >
            {stage.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-16 animate-pulse rounded-xl bg-white/5" />
        </div>
      ) : (
        <>
          {openConfirmation && (
            <div
              className={cn(
                'mt-4 rounded-xl border p-3',
                String(openConfirmation.outcome).toUpperCase() === 'COUNTER'
                  ? 'border-amber-400/40 bg-amber-500/[0.08]'
                  : 'border-emerald-400/30 bg-emerald-500/[0.06]',
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                Latest broker terms — {outcomeLabel(String(openConfirmation.outcome))}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
                <div>
                  <dt className="text-[9px] uppercase text-slate-500">Quantity</dt>
                  <dd className="text-[12px] font-semibold text-slate-100">
                    {String(openConfirmation.quantity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase text-slate-500">Price</dt>
                  <dd className="text-[12px] font-semibold text-slate-100">
                    {String(openConfirmation.price)}
                    {openConfirmation.currencyCode ? ` ${openConfirmation.currencyCode}` : ''}
                  </dd>
                </div>
                {openConfirmation.tradeDate ? (
                  <div>
                    <dt className="text-[9px] uppercase text-slate-500">Trade date</dt>
                    <dd className="text-[11px] text-slate-200">
                      {String(openConfirmation.tradeDate).slice(0, 10)}
                    </dd>
                  </div>
                ) : null}
                {openConfirmation.valueDate ? (
                  <div>
                    <dt className="text-[9px] uppercase text-slate-500">Value date</dt>
                    <dd className="text-[11px] text-slate-200">
                      {String(openConfirmation.valueDate).slice(0, 10)}
                    </dd>
                  </div>
                ) : null}
                {openConfirmation.brokerReference ? (
                  <div className="col-span-2">
                    <dt className="text-[9px] uppercase text-slate-500">Broker reference</dt>
                    <dd className="text-[11px] text-slate-200">{openConfirmation.brokerReference}</dd>
                  </div>
                ) : null}
              </dl>
              {openConfirmation.notes ? (
                <p className="mt-2 text-[10px] leading-relaxed text-slate-300">
                  {cleanBody(String(openConfirmation.notes))}
                </p>
              ) : null}
            </div>
          )}

          {latestInstruction && (
            <div className="mt-3 grid gap-1 text-[11px] text-slate-300 sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Sent to </span>
                {latestInstruction.toEmail || 'broker'}
              </p>
              <p>
                <span className="text-slate-500">Instruction </span>
                {instructionStatusLabel(latestInstruction.status)}
              </p>
              {latestInstruction.deliveryError ? (
                <p className="col-span-2 text-amber-200/90">{latestInstruction.deliveryError}</p>
              ) : null}
            </div>
          )}

          {(latestInstruction?.replyUrl || lastReplyUrl) && latestInstruction?.status !== 'REPLIED' ? (
            <button
              type="button"
              className={cn(buttonClass, 'mt-3 h-8 rounded-full px-4 text-[10px]')}
              onClick={onCopyReplyLink}
            >
              Copy reply link
            </button>
          ) : null}

          {sortedMessages.length > 0 ? (
            <ul className="mt-4 max-h-[min(28rem,50vh)] space-y-2 overflow-y-auto border-t border-white/5 pt-4">
              {sortedMessages.map((m) => {
                const line = formatBrokerMessage(m)
                const isLatest = m.id === latestMessageId
                return (
                  <li
                    key={m.id}
                    className={cn(
                      'rounded-xl px-3 py-2.5 transition-colors',
                      isLatest
                        ? line.isInbound
                          ? 'border border-blue-400/40 bg-blue-500/[0.12] shadow-sm shadow-blue-900/20'
                          : 'border border-white/15 bg-white/[0.08]'
                        : 'bg-white/[0.03]',
                      line.isInbound && !isLatest && 'border-l-2 border-l-emerald-500/50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-[11px] text-slate-100',
                          isLatest ? 'font-semibold' : 'font-medium',
                        )}
                      >
                        {line.title}
                        {isLatest ? (
                          <span className="ml-2 text-[9px] font-normal uppercase text-blue-300">
                            Latest
                          </span>
                        ) : null}
                      </p>
                      {line.when ? (
                        <span className="shrink-0 text-[9px] text-slate-500">{line.when}</span>
                      ) : null}
                    </div>
                    {line.fields.length > 0 ? (
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
                        {line.fields.map((f) => (
                          <div key={f.label}>
                            <dt className="text-[8px] uppercase text-slate-500">{f.label}</dt>
                            <dd
                              className={cn(
                                'text-[11px]',
                                isLatest ? 'font-semibold text-slate-100' : 'text-slate-300',
                              )}
                            >
                              {f.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {line.detail ? (
                      <p
                        className={cn(
                          'mt-1.5 text-[10px] leading-relaxed',
                          isLatest ? 'text-slate-200' : 'text-slate-400',
                        )}
                      >
                        {line.detail}
                      </p>
                    ) : null}
                    {m.actorLabel && line.isInbound ? (
                      <p className="mt-1 text-[9px] text-slate-500">From {m.actorLabel}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-3 text-[10px] text-slate-500">No messages yet for this order.</p>
          )}
        </>
      )}
    </div>
  )
}
