'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3009/api'

type PublicInstruction = {
  instructionId: string
  status: string
  alreadyReplied: boolean
  expiresAt: string
  companyName?: string
  order: {
    orderRef: string
    side: string
    quantity: string | null
    orderType: string
    limitPrice: string | null
    tradeCurrency: string
    valueDate: string | null
    status: string
    fundName: string | null
    securitySymbol: string | null
    notes: string | null
  }
}

type Outcome = 'FILLED' | 'COUNTER' | 'UNABLE' | 'PARTIAL'

export default function BrokerInstructionReplyPage() {
  const params = useParams()
  const token = String(params?.token || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PublicInstruction | null>(null)
  const [outcome, setOutcome] = useState<Outcome>('FILLED')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [proceed, setProceed] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetch(`${API_BASE}/investment-ops/public/broker-instructions/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json.success === false) {
          throw new Error(json.message || json.error?.message || `Failed (${res.status})`)
        }
        return json.data as PublicInstruction
      })
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        setQuantity(payload.order.quantity || '')
        setPrice(payload.order.limitPrice || '')
        if (payload.alreadyReplied) {
          setDone('A response was already submitted for this instruction.')
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Unable to load instruction')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token || submitting || done) return
    if (outcome !== 'UNABLE' && (!quantity.trim() || !price.trim())) {
      setError('Quantity and price are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE}/investment-ops/public/broker-instructions/${encodeURIComponent(token)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outcome,
            quantity: quantity.trim() || undefined,
            price: price.trim() || undefined,
            notes: notes.trim() || undefined,
            proceed: outcome === 'COUNTER' ? proceed : undefined,
          }),
        },
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) {
        throw new Error(json.message || json.error?.message || `Submit failed (${res.status})`)
      }
      setDone(json.data?.message || 'Response recorded. Thank you.')
    } catch (err: any) {
      setError(err?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1262d6]">
          {data?.companyName || 'Investments'}
        </p>
        <h1 className="mt-1 text-xl font-semibold">Broker trade instruction</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review the asset manager&apos;s instruction and respond — fill, counter, or unable.
        </p>

        {loading && (
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading instruction…
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Order</dt>
                <dd className="font-medium">{data.order.orderRef}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fund</dt>
                <dd className="font-medium">{data.order.fundName || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Side</dt>
                <dd className="font-medium">{data.order.side}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Security</dt>
                <dd className="font-medium">{data.order.securitySymbol || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-medium">{data.order.quantity || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Limit</dt>
                <dd className="font-medium">
                  {data.order.limitPrice || 'MARKET'} {data.order.tradeCurrency}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Value date</dt>
                <dd className="font-medium">{data.order.valueDate || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">{data.order.status}</dd>
              </div>
            </dl>
            {data.order.notes ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{data.order.notes}</p>
            ) : null}

            {done ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {done}
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Your response</span>
                  <select
                    className="h-10 w-full rounded-full border border-slate-200 px-3"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as Outcome)}
                  >
                    <option value="FILLED">Filled — can execute at these terms</option>
                    <option value="PARTIAL">Partial fill</option>
                    <option value="COUNTER">Counter — higher / different price</option>
                    <option value="UNABLE">Unable — cannot find at that price</option>
                  </select>
                </label>

                {outcome !== 'UNABLE' && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">Quantity</span>
                      <input
                        className="h-10 w-full rounded-full border border-slate-200 px-3"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium">Price</span>
                      <input
                        className="h-10 w-full rounded-full border border-slate-200 px-3"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                )}

                {outcome === 'COUNTER' && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={proceed}
                      onChange={(e) => setProceed(e.target.checked)}
                    />
                    Ask asset manager: proceed at this counter?
                  </label>
                )}

                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Message / feedback</span>
                  <textarea
                    className="min-h-[88px] w-full rounded-2xl border border-slate-200 px-3 py-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Security not available at limit; best offer is …"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1262d6] px-6 text-sm font-medium text-white shadow-sm disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? 'Submitting…' : 'Submit response'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  )
}
