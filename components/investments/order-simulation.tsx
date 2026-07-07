"use client"

import { useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { runOrderSimulation, SIMULATION_PRESETS_MOCK, type SimulationResult } from "@/lib/mock/orders-mock-data"
import { TerminalTopbar } from "./terminal/topbar"
import { TerminalCard } from "./terminal/card"
import { TerminalStatCard } from "./terminal/stat-card"
import { cn } from "@/lib/utils"

type Side = "BUY" | "SELL"

export function OrderSimulation() {
  const dispatch = useAppDispatch()
  const [symbol, setSymbol] = useState(SIMULATION_PRESETS_MOCK[0].securitySymbol)
  const [side, setSide] = useState<Side>(SIMULATION_PRESETS_MOCK[0].side)
  const [quantity, setQuantity] = useState(String(SIMULATION_PRESETS_MOCK[0].quantity))
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [running, setRunning] = useState(false)

  const handleRun = async () => {
    setRunning(true)
    try {
      const res = await dispatch(
        runOrderSimulation({ securitySymbol: symbol, side, quantity: Number(quantity) || 0 }),
      ).unwrap()
      setResult(res)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Simulation" subtitle="Estimate market impact before staging an order (mocked — no live liquidity model yet)" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        <TerminalCard header={{ title: "Order Impact Inputs" }}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Security</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                {Array.from(new Set(SIMULATION_PRESETS_MOCK.map((p) => p.securitySymbol))).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(["BUY", "SELL"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-bold tracking-wide transition-colors",
                    side === s
                      ? s === "BUY" ? "bg-gain text-white" : "bg-loss text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Quantity</label>
              <input
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={running || !quantity}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {running ? "Simulating…" : "Run Simulation"}
            </button>
          </div>
        </TerminalCard>

        <TerminalCard header={{ title: "Estimated Impact" }}>
          {!result ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Run a simulation to see estimated market impact
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <TerminalStatCard label="Est. Fill Price" value={result.estimatedFillPrice.toFixed(4)} />
                <TerminalStatCard label="Price Impact" value={`${result.priceImpactPct.toFixed(2)}%`} highlight={result.priceImpactPct > 0.3} />
                <TerminalStatCard label="Est. Slippage" value={`${result.estimatedSlippageBps} bps`} />
                <TerminalStatCard label="% of ADV" value={`${result.participationOfADV.toFixed(1)}%`} />
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <span className="font-medium text-foreground">Liquidity score: </span>
                <span className="text-muted-foreground">{result.liquidityScore}</span>
              </div>
              <p className="text-[11px] italic text-muted-foreground">{result.note}</p>
            </div>
          )}
        </TerminalCard>
      </div>
    </div>
  )
}
