"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PmButton, PmCard, PmEmpty, PmModal, PmPageHeader, PmStatusPill } from "@/components/performance-mock/primitives"
import { performanceFpaIntegrationApi, type FpaForecastReviewTrigger } from "@/lib/api/performance-fpa-integration-api"

const STATUS_TONE: Record<string, "warning" | "info" | "success" | "neutral" | "danger"> = {
  OPEN: "danger",
  UNDER_REVIEW: "warning",
  NO_FORECAST_CHANGE: "neutral",
  FORECAST_CHANGE_PROPOSED: "info",
  FORECAST_UPDATED: "success",
  CLOSED: "neutral",
}

function DecideModal({
  trigger,
  onClose,
  onDecided,
}: {
  trigger: FpaForecastReviewTrigger | null
  onClose: () => void
  onDecided: () => void
}) {
  const [status, setStatus] = useState("NO_FORECAST_CHANGE")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (trigger) { setStatus("NO_FORECAST_CHANGE"); setNote("") }
  }, [trigger])

  if (!trigger) return null

  const submit = async () => {
    setBusy(true)
    try {
      await performanceFpaIntegrationApi.decideReviewTrigger(trigger.id, { status, reviewDecision: note || undefined })
      toast.success("Decision recorded")
      onDecided()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record decision")
    } finally {
      setBusy(false)
    }
  }

  return (
    <PmModal
      open={Boolean(trigger)}
      onClose={onClose}
      title="Record review decision"
      description="This never changes FP&A directly — it only records what you decided. Build any actual forecast change as its own FP&A action."
      footer={
        <>
          <PmButton variant="outline" onClick={onClose}>Cancel</PmButton>
          <PmButton onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save decision
          </PmButton>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">Decision</span>
          <select className="mt-1 w-full h-9 rounded-md border border-[#E5E7EB] px-2 text-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="NO_FORECAST_CHANGE">No forecast change needed</option>
            <option value="FORECAST_CHANGE_PROPOSED">Forecast change proposed</option>
            <option value="FORECAST_UPDATED">Forecast updated (separately, in FP&A)</option>
            <option value="CLOSED">Close without action</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[#374151] font-medium">Notes</span>
          <textarea className="mt-1 w-full rounded-md border border-[#E5E7EB] px-2 py-1.5 text-xs" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why, and what (if anything) changes in FP&A" />
        </label>
      </div>
    </PmModal>
  )
}

export function FpaForecastReviewQueueScreen() {
  const [triggers, setTriggers] = useState<FpaForecastReviewTrigger[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [openOnly, setOpenOnly] = useState(true)
  const [deciding, setDeciding] = useState<FpaForecastReviewTrigger | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const res = await performanceFpaIntegrationApi.listReviewTriggers(openOnly ? { openOnly: true } : undefined)
      setTriggers((res as any)?.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load review triggers.")
    } finally {
      setLoading(false)
    }
  }, [openOnly])

  useEffect(() => { void load() }, [load])

  const claim = async (id: string) => {
    try {
      await performanceFpaIntegrationApi.claimReviewTrigger(id)
      toast.success("Claimed for review")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to claim trigger")
    }
  }

  return (
    <div className="p-4 space-y-4">
      <PmPageHeader
        title="Forecast Review Triggers"
        subtitle="Raised automatically when a KPI with a Driver Mapping falls below its achievement threshold. Each one needs a human FP&A decision — nothing here changes FP&A on its own."
        breadcrumbs={["Performance Management", "FP&A Integration", "Review Triggers"]}
        actions={
          <PmButton variant="outline" onClick={() => setOpenOnly((v) => !v)}>
            {openOnly ? "Showing open only" : "Showing all"}
          </PmButton>
        }
      />

      <PmCard className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#6B7280]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm text-[#991B1B]">{error}</p>
            <PmButton variant="outline" className="mt-3" onClick={() => void load()}>Retry</PmButton>
          </div>
        ) : triggers.length === 0 ? (
          <PmEmpty title={openOnly ? "No open review triggers" : "No review triggers yet"} description="A trigger appears here when a mapped KPI's achievement drops below its configured threshold." />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left text-[11px] uppercase tracking-wide text-[#6B7280]">
                <th className="py-2 pr-3 font-medium">KPI / Goal</th>
                <th className="py-2 pr-3 font-medium">Period</th>
                <th className="py-2 pr-3 font-medium">Target</th>
                <th className="py-2 pr-3 font-medium">Actual</th>
                <th className="py-2 pr-3 font-medium">Achievement</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {triggers.map((t) => (
                <tr key={t.id} className="border-b border-[#F3F4F6] last:border-0 align-top">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5 font-medium text-[#111827]"><AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />{t.kpiName || t.kpiId}</div>
                    <div className="text-[#6B7280]">{t.goalTitle}</div>
                  </td>
                  <td className="py-2 pr-3">{t.performancePeriod}</td>
                  <td className="py-2 pr-3">{t.targetValue != null ? Number(t.targetValue).toLocaleString() : "—"}</td>
                  <td className="py-2 pr-3">{t.actualValue != null ? Number(t.actualValue).toLocaleString() : "—"}</td>
                  <td className="py-2 pr-3">{t.achievementPct != null ? `${Number(t.achievementPct).toFixed(1)}%` : "—"}</td>
                  <td className="py-2 pr-3"><PmStatusPill label={t.status.replace(/_/g, " ")} tone={STATUS_TONE[t.status] || "neutral"} /></td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {t.status === "OPEN" && (
                      <PmButton variant="outline" onClick={() => void claim(t.id)}>Claim</PmButton>
                    )}
                    {t.status === "UNDER_REVIEW" && (
                      <PmButton onClick={() => setDeciding(t)}>Decide</PmButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PmCard>

      <DecideModal trigger={deciding} onClose={() => setDeciding(null)} onDecided={() => void load()} />
    </div>
  )
}
