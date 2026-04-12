"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { fetchSTISettings, updateSTISettings } from "@/lib/store/slices/shortTermInvestmentsSlice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Clock, Shield, Save } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import type { PostingMode } from "@/lib/api/short-term-investments-api"

const TIMEZONES = [
  "Africa/Harare",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Cairo",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
]

export function STISettingsPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const stiState = useSelector((state: RootState) => state.shortTermInvestments)
  const settings = stiState?.settings ?? null
  const settingsLoading = stiState?.settingsLoading ?? false

  const [postingMode, setPostingMode] = useState<PostingMode>("DRAFT")
  const [fiscalTimezone, setFiscalTimezone] = useState("Africa/Harare")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setPostingMode(settings.postingMode)
      setFiscalTimezone(settings.fiscalTimezone)
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await dispatch(updateSTISettings({ postingMode, fiscalTimezone })).unwrap()
      toast.success("Settings updated successfully")
    } catch (e: any) {
      toast.error("Failed to update settings", { description: e })
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = settings && (
    settings.postingMode !== postingMode ||
    settings.fiscalTimezone !== fiscalTimezone
  )

  if (settingsLoading && !settings) {
    return (
      <div className="space-y-4">
        <Card className="bg-white border-none rounded-xl">
          <CardContent className="p-6 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Posting Mode */}
      <Card className="shadow-none">
        <CardHeader className="pb-2 pt-5 px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Journal Posting Mode</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Control how daily accrual journal entries are posted to the general ledger
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  postingMode === "DRAFT"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPostingMode("DRAFT")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full border-2 ${postingMode === "DRAFT" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                    {postingMode === "DRAFT" && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-[1px]" />}
                  </div>
                  <span className="text-sm font-semibold">Draft</span>
                </div>
                <p className="text-xs text-muted-foreground ml-5">
                  Entries require manual review and approval before posting to GL
                </p>
              </button>
              <button
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  postingMode === "APPROVED"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPostingMode("APPROVED")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full border-2 ${postingMode === "APPROVED" ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                    {postingMode === "APPROVED" && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-[1px]" />}
                  </div>
                  <span className="text-sm font-semibold">Approved</span>
                </div>
                <p className="text-xs text-muted-foreground ml-5">
                  Entries post directly to GL for continuous real-time close
                </p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiscal Timezone */}
      <Card className="shadow-none">
        <CardHeader className="pb-2 pt-5 px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Fiscal Timezone</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                The timezone used for the daily accrual cron job (23:59 local time)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="mt-4">
            <Select value={fiscalTimezone} onValueChange={setFiscalTimezone}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl h-11 text-sm shadow-none ring-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status Info */}
      {settings && (
        <Card className="shadow-none">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <Settings className="w-4.5 h-4.5 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">System Status</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Current engine status and last run information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-muted-foreground">Last Accrual Watermark</p>
                <p className="text-sm font-semibold mt-1">
                  {format(new Date(settings.lastAccrualWatermark), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-semibold mt-1">
                  {format(new Date(settings.updatedAt), "MMM dd, yyyy HH:mm")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          className="h-10 px-6 rounded-full gap-2 bg-[#4f77ff] hover:bg-[#4f77ff]/90 font-semibold text-xs shadow-md"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
