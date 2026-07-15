"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchComplianceChecks, type MockComplianceCheck } from "@/lib/mock/orders-mock-data"
import { TerminalTopbar } from "./terminal/topbar"
import { TerminalCard } from "./terminal/card"
import { TerminalStatCard } from "./terminal/stat-card"
import { TerminalTable, TerminalThead, TerminalTbody, TerminalTr, TerminalTh, TerminalTd } from "./terminal/data-table"
import { TerminalStatusBadge } from "./terminal/status-badge"
import { PillTabs } from "./terminal/tabs"
import { Skeleton } from "@/components/ui/skeleton"

const FILTER_TABS = [
  { id: "ALL", label: "All" },
  { id: "PRE_TRADE", label: "Pre-Trade" },
  { id: "POST_TRADE", label: "Post-Trade" },
]

export function ComplianceChecks() {
  const dispatch = useAppDispatch()
  const [checks, setChecks] = useState<MockComplianceCheck[] | null>(null)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => {
    dispatch(fetchComplianceChecks())
      .unwrap()
      .then(setChecks)
  }, [dispatch])

  const filtered = useMemo(() => {
    if (!checks) return []
    return filter === "ALL" ? checks : checks.filter((c) => c.checkType === filter)
  }, [checks, filter])

  const stats = useMemo(() => {
    const list = checks ?? []
    return {
      pass: list.filter((c) => c.status === "PASS").length,
      warning: list.filter((c) => c.status === "WARNING").length,
      breach: list.filter((c) => c.status === "BREACH").length,
    }
  }, [checks])

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Compliance" subtitle="Pre- and post-trade compliance checks (mocked — no live rules engine yet)" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TerminalStatCard label="Total Checks" value={String(checks?.length ?? 0)} />
        <TerminalStatCard label="Pass" value={String(stats.pass)} />
        <TerminalStatCard label="Warnings" value={String(stats.warning)} highlight={stats.warning > 0} />
        <TerminalStatCard label="Breaches" value={String(stats.breach)} highlight={stats.breach > 0} />
      </div>

      <PillTabs items={FILTER_TABS} activeId={filter} onChange={setFilter} />

      {!checks ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding>
          <TerminalTable minWidth="1000px">
            <TerminalThead>
              <tr>
                <TerminalTh>Trade Ref</TerminalTh>
                <TerminalTh>Type</TerminalTh>
                <TerminalTh>Rule</TerminalTh>
                <TerminalTh>Details</TerminalTh>
                <TerminalTh>Status</TerminalTh>
                <TerminalTh align="right">Checked</TerminalTh>
              </tr>
            </TerminalThead>
            <TerminalTbody>
              {filtered.map((check) => (
                <TerminalTr key={check.id}>
                  <TerminalTd className="font-mono text-xs font-semibold text-foreground">{check.tradeRef}</TerminalTd>
                  <TerminalTd className="text-xs text-muted-foreground">{check.checkType === "PRE_TRADE" ? "Pre-Trade" : "Post-Trade"}</TerminalTd>
                  <TerminalTd className="text-sm text-foreground">{check.rule}</TerminalTd>
                  <TerminalTd className="max-w-sm text-xs text-muted-foreground">{check.details}</TerminalTd>
                  <TerminalTd><TerminalStatusBadge status={check.status} /></TerminalTd>
                  <TerminalTd align="right" className="text-xs text-muted-foreground">
                    {new Date(check.checkedAt).toLocaleString()}
                  </TerminalTd>
                </TerminalTr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No compliance checks match this filter
                  </td>
                </tr>
              )}
            </TerminalTbody>
          </TerminalTable>
        </TerminalCard>
      )}
    </div>
  )
}
