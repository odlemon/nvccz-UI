"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Database, ShieldCheck, ShieldAlert, Fingerprint, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { INGEST_BATCHES, type IngestBatch } from "@/lib/investments/mock-data"
import { PageHeader } from "@/components/investments/page-header"
import { ExchangeTag } from "@/components/investments/status-pills"

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  })
}

export function IngestBatches() {
  const [batches, setBatches] = useState<IngestBatch[]>(INGEST_BATCHES)
  const [verifying, setVerifying] = useState<string | null>(null)

  const verify = (batch: IngestBatch) => {
    setVerifying(batch.batch_id)
    setTimeout(() => {
      const valid = batch.source_status === "OK"
      setBatches((bs) =>
        bs.map((b) => (b.batch_id === batch.batch_id ? { ...b, checksum_valid: valid } : b)),
      )
      setVerifying(null)
      toast[valid ? "success" : "error"](
        valid ? "Checksum verified" : "Checksum mismatch",
        { description: `${batch.source_code} · ${batch.record_count} records` },
      )
    }, 700)
  }

  const totalRecords = batches.reduce((s, b) => s + b.record_count, 0)
  const fallback = batches.filter((b) => b.source_status === "FALLBACK").length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ingest Batches"
        subtitle="End-of-day market data loads with SHA-256 integrity verification"
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <RefreshCw className="h-4 w-4" /> Trigger Ingest
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Database} label="Batches" value={String(batches.length)} />
        <Stat icon={Database} label="Records loaded" value={totalRecords.toLocaleString()} />
        <Stat icon={ShieldCheck} label="Verified" value={String(batches.filter((b) => b.checksum_valid === true).length)} tone="gain" />
        <Stat icon={ShieldAlert} label="Fallback source" value={String(fallback)} tone={fallback ? "warn" : undefined} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Ingested</th>
                <th className="px-4 py-3 text-right font-medium">Records</th>
                <th className="px-4 py-3 text-left font-medium">SHA-256</th>
                <th className="px-4 py-3 text-center font-medium">Source</th>
                <th className="px-4 py-3 text-center font-medium">Integrity</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.batch_id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <ExchangeTag code={b.source_code} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(b.ingest_date)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">
                    {b.record_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                      <Fingerprint className="h-3.5 w-3.5" />
                      {b.sha256_hash.slice(0, 10)}…{b.sha256_hash.slice(-6)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                        b.source_status === "OK"
                          ? "bg-gain-muted text-gain-foreground ring-gain/30"
                          : "bg-warn-muted text-warn-foreground ring-warn/30",
                      )}
                    >
                      {b.source_status === "OK" ? "Primary" : "Fallback"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {b.checksum_valid === undefined ? (
                      <span className="text-xs text-muted-foreground">Not checked</span>
                    ) : b.checksum_valid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gain-foreground">
                        <ShieldCheck className="h-4 w-4 text-gain" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-loss-foreground">
                        <ShieldAlert className="h-4 w-4 text-loss" /> Mismatch
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => verify(b)}
                      disabled={verifying === b.batch_id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                    >
                      {verifying === b.batch_id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: "gain" | "warn"
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          tone === "gain" ? "bg-gain-muted text-gain-foreground" : tone === "warn" ? "bg-warn-muted text-warn-foreground" : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
