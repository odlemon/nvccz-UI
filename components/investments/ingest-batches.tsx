"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchIngestBatches, runIngest } from "@/lib/store/slices/investmentsSlice"
import { investmentsApi } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Copy, ShieldCheck, ShieldAlert, Fingerprint, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { IngestBatch } from "@/lib/api/investments-api"
import { TerminalStatCard } from "@/components/investments/terminal/stat-card"
import { TerminalCard } from "@/components/investments/terminal/card"
import { TerminalTable, TerminalThead, TerminalTr, TerminalTh, TerminalTd, TerminalEmptyRow } from "@/components/investments/terminal/data-table"
import { TerminalStatusBadge } from "@/components/investments/terminal/status-badge"

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
      <div className="flex justify-end">
        <Button
          size="pill"
          disabled={ingestRunning}
          onClick={() => dispatch(runIngest("ALL"))}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", ingestRunning && "animate-spin")} /> Trigger Ingest
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TerminalStatCard label="Batches" value={String(stats.total)} />
        <TerminalStatCard label="Records loaded" value={stats.totalRecords.toLocaleString()} />
        <TerminalStatCard label="Verified" value={String(stats.verifiedCount)} />
        <TerminalStatCard label="Fallback source" value={String(stats.fallback)} subValue={stats.fallback ? "Check source feed" : "All primary"} />
      </div>

      {batchesLoading ? (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard noPadding bodyClassName="overflow-x-auto">
          <TerminalTable className="min-w-[820px]">
            <TerminalThead>
              <TerminalTr>
                <TerminalTh>Source</TerminalTh>
                <TerminalTh>Ingested</TerminalTh>
                <TerminalTh align="right">Records</TerminalTh>
                <TerminalTh>SHA-256</TerminalTh>
                <TerminalTh align="center">Source</TerminalTh>
                <TerminalTh align="center">Integrity</TerminalTh>
                <TerminalTh align="right">Action</TerminalTh>
              </TerminalTr>
            </TerminalThead>
            <tbody>
              {ingestBatches.map((b) => {
                const integrityResult = verified[b.batch_id]
                return (
                  <TerminalTr key={b.batch_id}>
                    <TerminalTd mono className="font-medium">{b.source_code}</TerminalTd>
                    <TerminalTd className="text-muted-foreground">
                      {new Date(b.ingest_date).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </TerminalTd>
                    <TerminalTd align="right" mono>{b.record_count.toLocaleString()}</TerminalTd>
                    <TerminalTd>
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
                    </TerminalTd>
                    <TerminalTd align="center">
                      <TerminalStatusBadge status={b.source_status === "OK" ? "Primary" : "Fallback"} variant={b.source_status === "OK" ? "green" : "yellow"} />
                    </TerminalTd>
                    <TerminalTd align="center">
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
                    </TerminalTd>
                    <TerminalTd align="right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => handleVerify(b)}
                        disabled={verifying[b.batch_id]}
                      >
                        {verifying[b.batch_id] ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        Verify
                      </Button>
                    </TerminalTd>
                  </TerminalTr>
                )
              })}
              {ingestBatches.length === 0 && <TerminalEmptyRow colSpan={7}>No ingest batches found</TerminalEmptyRow>}
            </tbody>
          </TerminalTable>
        </TerminalCard>
      )}
    </div>
  )
}
