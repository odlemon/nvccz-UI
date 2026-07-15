"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchTradingModels, type MockTradingModel } from "@/lib/mock/orders-mock-data"
import { TerminalTopbar } from "./terminal/topbar"
import { TerminalCard } from "./terminal/card"
import { TerminalStatusBadge } from "./terminal/status-badge"
import { Delta } from "./status-pills"
import { Skeleton } from "@/components/ui/skeleton"

export function TradingModels() {
  const dispatch = useAppDispatch()
  const [models, setModels] = useState<MockTradingModel[] | null>(null)

  useEffect(() => {
    dispatch(fetchTradingModels())
      .unwrap()
      .then(setModels)
  }, [dispatch])

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Trading Models" subtitle="Systematic strategies available to this fund (mocked — no live model registry yet)" />

      {!models ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {models.map((model) => (
            <TerminalCard
              key={model.id}
              header={{
                title: model.name,
                subtitle: model.assetClass,
                actions: <TerminalStatusBadge status={model.status} />,
              }}
            >
              <p className="text-sm text-muted-foreground">{model.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">
                  Last run {model.lastRunAt ? new Date(model.lastRunAt).toLocaleDateString() : "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">YTD:</span>
                  <Delta value={model.performanceYtdPct} />
                </span>
              </div>
            </TerminalCard>
          ))}
        </div>
      )}
    </div>
  )
}
