"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFunds, fetchTrades } from "@/lib/store/slices/investmentsSlice"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"
import { TerminalStatusBadge } from "@/components/investments/terminal/status-badge"
import { ExchangeTag } from "./status-pills"
import { Skeleton } from "@/components/ui/skeleton"

export function PortfolioTransactions() {
  const dispatch = useAppDispatch()
  const { funds, selectedFundId, trades, tradesLoading } = useAppSelector((s) => s.investments)
  const selectedFund = funds.find((f) => f.id === selectedFundId)

  useEffect(() => {
    dispatch(fetchFunds())
    dispatch(fetchTrades())
  }, [dispatch])

  const fundTrades = useMemo(
    () => trades.filter((t) => t.fundId === selectedFundId),
    [trades, selectedFundId],
  )

  return (
    <div className="space-y-5">
      <TerminalTopbar
        title="Transactions"
        subtitle={selectedFund ? `Trade history — ${selectedFund.name}` : "Trade history"}
      />

      {tradesLoading ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding bodyClassName="overflow-x-auto">
          <TerminalTable className="min-w-[900px]">
            <TerminalThead>
              <TerminalTr>
                <TerminalTh>Trade Ref</TerminalTh>
                <TerminalTh>Security</TerminalTh>
                <TerminalTh align="center">Side</TerminalTh>
                <TerminalTh align="right">Quantity</TerminalTh>
                <TerminalTh align="right">Execution Price</TerminalTh>
                <TerminalTh align="right">Fees</TerminalTh>
                <TerminalTh align="center">Status</TerminalTh>
                <TerminalTh>Executed</TerminalTh>
              </TerminalTr>
            </TerminalThead>
            <tbody>
              {fundTrades.map((t) => (
                <TerminalTr key={t.id}>
                  <TerminalTd mono className="font-semibold">{t.tradeRef}</TerminalTd>
                  <TerminalTd>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-foreground">{t.security?.symbol ?? t.securityId.slice(0, 8)}</span>
                      {t.security?.exchangeCode && <ExchangeTag exchange={t.security.exchangeCode} />}
                    </div>
                  </TerminalTd>
                  <TerminalTd align="center">
                    <TerminalStatusBadge status={t.side} />
                  </TerminalTd>
                  <TerminalTd align="right" mono>{Number(t.quantity).toLocaleString("en-US")}</TerminalTd>
                  <TerminalTd align="right" mono>
                    {t.executionCurrencyCode} {Number(t.executionPrice).toFixed(4)}
                  </TerminalTd>
                  <TerminalTd align="right" mono className="text-muted-foreground">
                    {Number(t.fees ?? 0).toFixed(2)}
                  </TerminalTd>
                  <TerminalTd align="center">
                    <TerminalStatusBadge status={t.status} />
                  </TerminalTd>
                  <TerminalTd className="text-muted-foreground">
                    {t.executedAt ? new Date(t.executedAt).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </TerminalTd>
                </TerminalTr>
              ))}
              {fundTrades.length === 0 && (
                <TerminalEmptyRow colSpan={8}>No transactions for this fund</TerminalEmptyRow>
              )}
            </tbody>
          </TerminalTable>
        </TerminalCard>
      )}
    </div>
  )
}
