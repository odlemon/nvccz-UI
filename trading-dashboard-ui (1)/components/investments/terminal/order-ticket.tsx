"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { money } from "@/lib/investments/format"
import { LATEST_PRICES, SECURITIES } from "@/lib/investments/mock-data"
import { Delta, ExchangeTag } from "@/components/investments/status-pills"

export function OrderTicket({ symbol }: { symbol: string }) {
  const security = SECURITIES.find((s) => s.symbol === symbol) ?? SECURITIES[0]
  const tick = LATEST_PRICES[security.symbol]
  const [side, setSide] = useState<"BUY" | "SELL">("BUY")
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET")
  const [qty, setQty] = useState<string>("1000")
  const [limit, setLimit] = useState<string>(tick ? tick.price.toFixed(2) : "0")

  const priceUsed = orderType === "MARKET" ? tick?.price ?? 0 : Number(limit) || 0
  const quantity = Number(qty) || 0
  const gross = priceUsed * quantity
  const fees = useMemo(() => Math.max(gross * 0.0015, 5), [gross])
  const net = side === "BUY" ? gross + fees : gross - fees

  const submit = () => {
    if (quantity <= 0) {
      toast.error("Enter a valid quantity")
      return
    }
    toast.success(`${side} order staged`, {
      description: `${quantity.toLocaleString()} ${security.symbol} @ ${
        orderType === "MARKET" ? "MKT" : money(priceUsed)
      } — routing to broker`,
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-panel-border bg-panel text-panel-foreground">
      <div className="flex items-center justify-between border-b border-panel-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">{security.symbol}</span>
            <ExchangeTag code={security.exchangeCode} />
          </div>
          <p className="text-[11px] text-panel-muted">{security.name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-semibold">{tick ? money(tick.price) : "—"}</p>
          {tick && <Delta value={tick.changePct} className="text-xs" />}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Buy / Sell toggle */}
        <div className="grid grid-cols-2 gap-2">
          {(["BUY", "SELL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold transition-colors",
                side === s
                  ? s === "BUY"
                    ? "bg-gain text-white"
                    : "bg-loss text-white"
                  : "bg-white/5 text-panel-muted hover:bg-white/10",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Order type */}
        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1">
          {(["MARKET", "LIMIT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                orderType === t ? "bg-white/15 text-panel-foreground" : "text-panel-muted hover:text-panel-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-panel-muted">
            Quantity
          </label>
          <input
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
            className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 font-mono text-sm text-panel-foreground outline-none focus:border-primary"
          />
          <div className="mt-2 flex gap-1.5">
            {[1000, 5000, 10000, 25000].map((q) => (
              <button
                key={q}
                onClick={() => setQty(String(q))}
                className="flex-1 rounded-md bg-white/5 py-1 text-[11px] text-panel-muted hover:bg-white/10 hover:text-panel-foreground"
              >
                {q >= 1000 ? `${q / 1000}k` : q}
              </button>
            ))}
          </div>
        </div>

        {/* Limit price */}
        {orderType === "LIMIT" && (
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-panel-muted">
              Limit Price ({security.listingCurrencyCode})
            </label>
            <input
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))}
              className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 font-mono text-sm text-panel-foreground outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Summary */}
        <div className="space-y-1.5 rounded-lg border border-panel-border bg-white/5 p-3 text-xs">
          <Row label="Est. price" value={orderType === "MARKET" ? "Market" : `${money(priceUsed)}`} />
          <Row label="Gross" value={`$${money(gross)}`} />
          <Row label="Est. fees" value={`$${money(fees)}`} />
          <div className="my-1 border-t border-panel-border" />
          <Row label={side === "BUY" ? "Net debit" : "Net credit"} value={`$${money(net)}`} strong />
        </div>

        <button
          onClick={submit}
          className={cn(
            "w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90",
            side === "BUY" ? "bg-gain" : "bg-loss",
          )}
        >
          Stage {side} — {security.symbol}
        </button>
        <p className="text-center text-[11px] text-panel-muted">
          Routes: Broker → Custodian → Core Banking → GL
        </p>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-panel-muted">{label}</span>
      <span className={cn("font-mono tabular-nums", strong ? "text-sm font-semibold text-panel-foreground" : "text-panel-foreground")}>
        {value}
      </span>
    </div>
  )
}
