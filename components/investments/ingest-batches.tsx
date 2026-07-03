"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchIngestBatches, runIngest } from "@/lib/store/slices/investmentsSlice"
import { investmentsApi } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, ShieldCheck, ShieldAlert, Database, Fingerprint, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { IngestBatch } from "@/lib/api/investments-api"
import { PageHeader } from "./page-header"

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "gain" | "warn" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tone === "gain" ? "bg-gain-muted text-gain-foreground" : tone === "warn" ? "bg-warn-muted text-warn-foreground" : "bg-accent text-accent-foreground")}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-mono text-lg font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function IngestBatches() {
  const dispatch = useAppDispatch()
  const { ingestBatches, batchesLoading, ingestRunning } = useAppSelector((s) => s.investments)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [verified, setVerified] = useState<Record<string, boolean | null>>({})

  useEffect(() => {
    dispatch(fetchIngestBatches())
  }, [dispatch])

  const stats = useMemo(() => {
    const totalRecords = ingestBatches.reduce((sum, b) => sum + (b.record_count ?? 0), 0)
    const verifiedCount = Object.values(verified).filter((v) => v === true).length
    const fallback = ingestBatches.filter((b) => b.source_status === "FALLBACK").length
    return { total: ingestBatches.length, totalRecords, verifiedCount, fallback }
  }, [ingestBatches, verified])

  const handleVerify = async (batch: IngestBatch) => {
    setVerifying((p) => ({ ...p, [batch.batch_id]: true }))
    try {
      const result = await investmentsApi.getIngestBatch(batch.batch_id)
      setVerified((p) => ({ ...p, [batch.batch_id]: result.checksum_valid ?? false }))
      toast[result.checksum_valid ? "success" : "error"](
        result.checksum_valid ? "Checksum verified" : "Checksum mismatch",
        { description: `${batch.source_code} · ${batch.record_count} records` },
      )
    } catch (err: any) {
      toast.error("Verification failed", { description: err.message })
    } finally {
      setVerifying((p) => ({ ...p, [batch.batch_id]: false }))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ingest Batches"
        subtitle="End-of-day market data loads with SHA-256 integrity verification"
        actions={
          <button
            onClick={() => dispatch(runIngest("ALL"))}
            disabled={ingestRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", ingestRunning && "animate-spin")} /> Trigger Ingest
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Database} label="Batches" value={String(stats.total)} />
        <Stat icon={Database} label="Records loaded" value={stats.totalRecords.toLocaleString()} />
        <Stat icon={ShieldCheck} label="Verified" value={String(stats.verifiedCount)} tone="gain" />
        <Stat icon={ShieldAlert} label="Fallback source" value={String(stats.fallback)} tone={stats.fallback ? "warn" : undefined} />
      </div>

      {batchesLoading ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
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
                {ingestBatches.map((b) => {
                  const integrityResult = verified[b.batch_id]
                  return (
                    <tr key={b.batch_id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-foreground">{b.source_code}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(b.ingest_date).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-foreground">{b.record_count.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <Fingerprint className="h-3.5 w-3.5" />
                            {b.sha256_hash ? `${b.sha256_hash.slice(0, 10)}…${b.sha256_hash.slice(-6)}` : "—"}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon" variant="ghost" className="h-5 w-5"
                                  disabled={!b.sha256_hash}
                                  onClick={() => { navigator.clipboard.writeText(b.sha256_hash ?? ""); toast.success("SHA-256 copied") }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy full SHA-256</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", b.source_status === "OK" ? "bg-gain-muted text-gain-foreground ring-gain/30" : "bg-warn-muted text-warn-foreground ring-warn/30")}>
                          {b.source_status === "OK" ? "Primary" : "Fallback"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {integrityResult === undefined ? (
                          <span className="text-xs text-muted-foreground">Not checked</span>
                        ) : integrityResult ? (
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
                          onClick={() => handleVerify(b)}
                          disabled={verifying[b.batch_id]}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
                        >
                          {verifying[b.batch_id] ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          Verify
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {ingestBatches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-sm text-muted-foreground">No ingest batches found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
