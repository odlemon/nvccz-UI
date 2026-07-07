"use client"

import { useEffect, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { fetchPortfolioSettings, updatePortfolioSettings, type PortfolioSettings } from "@/lib/mock/portfolios-mock-data"
import { TerminalTopbar } from "@/components/investments/terminal/topbar"
import { TerminalCard } from "@/components/investments/terminal/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

const CURRENCIES = ["USD", "ZWG", "GBP", "EUR", "ZAR"]

// Portfolio-level configuration (valuation cadence, approval thresholds,
// notifications). No backend endpoint exists yet — backed by
// lib/mock/portfolios-mock-data.ts thunks so the wiring is a drop-in once
// the real settings API lands.
export function PortfolioSetup() {
  const dispatch = useAppDispatch()
  const [settings, setSettings] = useState<PortfolioSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchPortfolioSettings())
      .unwrap()
      .then(setSettings)
      .finally(() => setLoading(false))
  }, [dispatch])

  const field = <K extends keyof PortfolioSettings>(key: K, value: PortfolioSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const saved = await dispatch(updatePortfolioSettings(settings)).unwrap()
      setSettings(saved)
      toast.success("Portfolio settings saved")
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <TerminalTopbar title="Portfolio Setup" subtitle="Valuation cadence, approval thresholds, and notifications" />

      {loading || !settings ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
        </div>
      ) : (
        <TerminalCard bodyClassName="p-6 space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Default Base Currency</Label>
              <Select value={settings.defaultBaseCurrency} onValueChange={(v) => field("defaultBaseCurrency", v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Valuation Frequency</Label>
              <Select
                value={settings.valuationFrequency}
                onValueChange={(v) => field("valuationFrequency", v as PortfolioSettings["valuationFrequency"])}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Price Deviation Threshold (%)</Label>
              <Input
                type="number"
                value={settings.priceDeviationThresholdPct}
                onChange={(e) => field("priceDeviationThresholdPct", Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dual Approval Threshold (USD)</Label>
              <Input
                type="number"
                value={settings.requireDualApprovalAboveUsd}
                onChange={(e) => field("requireDualApprovalAboveUsd", Number(e.target.value))}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Automatic Valuation</p>
                <p className="text-xs text-muted-foreground">Run mark-to-market valuations on the schedule above</p>
              </div>
              <Switch checked={settings.autoValuationEnabled} onCheckedChange={(v) => field("autoValuationEnabled", v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Notify on Settlement Failure</p>
                <p className="text-xs text-muted-foreground">Send an alert when a trade fails to settle</p>
              </div>
              <Switch checked={settings.notifyOnSettlementFailure} onCheckedChange={(v) => field("notifyOnSettlementFailure", v)} />
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
          </div>
        </TerminalCard>
      )}
    </div>
  )
}
