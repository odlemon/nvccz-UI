"use client"

import { useState } from "react"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { PillTabs } from "@/components/investments/terminal/tabs"
import { LivePricesTable } from "./live-prices-table"
import { ValidationQueue } from "./validation-queue"
import { IngestBatches } from "./ingest-batches"

const TABS = [
  { id: "live", label: "Live Prices" },
  { id: "validation", label: "Validation Queue" },
  { id: "batches", label: "Ingest Batches" },
]

export function PricesPage() {
  const [tab, setTab] = useState("live")

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Prices" subtitle="Market data feed, validation, and ingest history" />

      <PillTabs items={TABS} activeId={tab} onChange={setTab} />

      {tab === "live" && <LivePricesTable />}
      {tab === "validation" && <ValidationQueue />}
      {tab === "batches" && <IngestBatches />}
    </div>
  )
}
