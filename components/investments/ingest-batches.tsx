"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchIngestBatches } from "@/lib/store/slices/investmentsSlice"
import { investmentsApi } from "@/lib/api/investments-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Copy, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { IngestBatch } from "@/lib/api/investments-api"

export function IngestBatches() {
  const dispatch = useAppDispatch()
  const { ingestBatches, batchesLoading } = useAppSelector((s) => s.investments)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [verified, setVerified] = useState<Record<string, boolean | null>>({})

  useEffect(() => {
    dispatch(fetchIngestBatches())
  }, [dispatch])

  const handleVerify = async (batch: IngestBatch) => {
    setVerifying((p) => ({ ...p, [batch.batch_id]: true }))
    try {
      const result = await investmentsApi.getIngestBatch(batch.batch_id)
      setVerified((p) => ({ ...p, [batch.batch_id]: result.checksum_valid ?? false }))
      toast.success(`Integrity ${result.checksum_valid ? "passed" : "FAILED"}`, {
        description: `Batch ${batch.batch_id} — SHA-256 ${result.checksum_valid ? "matches" : "mismatch detected"}`,
      })
    } catch (err: any) {
      toast.error("Verification failed", { description: err.message })
    } finally {
      setVerifying((p) => ({ ...p, [batch.batch_id]: false }))
    }
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    toast.success("SHA-256 copied")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ingest Batches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Historical price ingest log with integrity verification</p>
      </div>

      {batchesLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Source</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Ingest Date</th>
                <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Records</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">SHA-256</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Source Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Integrity</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {ingestBatches.map((batch) => {
                const integrityResult = verified[batch.batch_id]

                return (
                  <tr key={batch.batch_id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-medium">{batch.source_code}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      {new Date(batch.ingest_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {batch.record_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {batch.sha256_hash.slice(0, 16)}…
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5"
                                onClick={() => handleCopyHash(batch.sha256_hash)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy full SHA-256</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", batch.source_status === "OK" ? "border-emerald-300 text-emerald-600" : "border-amber-300 text-amber-600")}
                      >
                        {batch.source_status === "OK" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                        {batch.source_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {integrityResult === true && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0 gap-1">
                          <ShieldCheck className="w-3 h-3" /> Pass
                        </Badge>
                      )}
                      {integrityResult === false && (
                        <Badge className="text-xs bg-red-100 text-red-700 border-0 gap-1">
                          <ShieldAlert className="w-3 h-3" /> Fail
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        disabled={verifying[batch.batch_id]}
                        onClick={() => handleVerify(batch)}
                      >
                        {verifying[batch.batch_id] ? "Verifying…" : "Verify Integrity"}
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {ingestBatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    No ingest batches found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
