"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Loader2,
  RefreshCw,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  CalendarDays,
  Info,
  ChevronRight,
  Zap,
} from "lucide-react"
import {
  portfolioReportingApi,
  type ReportingScheduleConfig,
  type SchedulePreviewResult,
  type SchedulePreviewPeriod,
} from "@/lib/api/portfolio-reporting-api"
import { toast } from "sonner"
import { format } from "date-fns"

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function PeriodStatusBadge({ period }: { period: SchedulePreviewPeriod }) {
  if (period.isSubmissionOverdue)
    return <Badge className="text-[10px] rounded-full bg-red-100 text-red-700">Overdue</Badge>
  if (period.calendarAlreadyOpened)
    return <Badge className="text-[10px] rounded-full bg-emerald-100 text-emerald-700">Open</Badge>
  if (period.openWindowReached)
    return <Badge className="text-[10px] rounded-full bg-amber-100 text-amber-700">Window Reached</Badge>
  return <Badge className="text-[10px] rounded-full bg-blue-100 text-blue-700">Upcoming</Badge>
}

function TimelineRow({
  icon: Icon,
  color,
  label,
  date,
  note,
}: {
  icon: React.ElementType
  color: string
  label: string
  date: string
  note?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {note && <p className="text-[10px] text-muted-foreground leading-tight">{note}</p>}
      </div>
      <p className="text-xs font-semibold text-foreground flex-shrink-0 tabular-nums">{fmtDate(date)}</p>
    </div>
  )
}

interface SchedulePreviewDrawerProps {
  isOpen: boolean
  onClose: () => void
  config: ReportingScheduleConfig | null
}

export function SchedulePreviewDrawer({ isOpen, onClose, config }: SchedulePreviewDrawerProps) {
  const [preview, setPreview] = useState<SchedulePreviewResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [asOfDate, setAsOfDate] = useState<Date>(new Date())
  const [count, setCount] = useState("6")

  const load = useCallback(async () => {
    if (!config) return
    try {
      setLoading(true)
      const res = await portfolioReportingApi.previewScheduleConfig(config.id, {
        asOfDate: format(asOfDate, "yyyy-MM-dd"),
        count: parseInt(count) || 6,
      })
      setPreview(res.data)
    } catch (e: any) {
      toast.error("Failed to load preview", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }, [config, asOfDate, count])

  useEffect(() => {
    if (isOpen && config) load()
  }, [isOpen, config?.id])

  const periods = preview?.periods || []

  return (
    <Sheet open={isOpen} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <SheetTitle className="text-base leading-tight">
                    {config?.name || "Schedule Preview"}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config?.frequency} · {periods.length} period{periods.length !== 1 ? "s" : ""} shown
                  </p>
                </div>
              </div>
              <Badge
                className={`text-[10px] rounded-full flex-shrink-0 mt-1 ${
                  config?.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {config?.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </SheetHeader>

          {/* Controls */}
          <div className="mt-4 flex items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">As-of Date</Label>
              <DatePicker
                value={asOfDate}
                onChange={(d) => d && setAsOfDate(d)}
                allowFutureDates
                className="h-8 text-xs w-44"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Periods to show</Label>
              <Input
                type="number"
                min="1"
                max="24"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="h-8 rounded-full text-xs w-20"
              />
            </div>
            <Button
              size="sm"
              className="h-8 rounded-full gap-1.5 gradient-primary text-white"
              onClick={load}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Preview
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Loading schedule preview…</p>
              </div>
            </div>
          )}

          {!loading && preview && (
            <>
              {/* Config summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Opens after period end</p>
                  <p className="text-2xl font-bold text-blue-700">+{preview.config.openCalendarAfterPeriodEndDays}d</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Submission due</p>
                  <p className="text-2xl font-bold text-orange-700">+{preview.config.dueDateOffsetDaysAfterPeriodEnd}d</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Auto-open</p>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    {preview.config.autoOpenCalendar ? (
                      <><CheckCircle2 className="w-5 h-5 text-emerald-500" /><span className="text-sm font-semibold text-emerald-700">Enabled</span></>
                    ) : (
                      <><XCircle className="w-5 h-5 text-gray-400" /><span className="text-sm font-semibold text-gray-500">Disabled</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Offsets legend */}
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How dates are calculated</p>
                </div>
                {Object.entries(preview.offsetsExplanation).map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <span className="font-medium text-foreground w-40 flex-shrink-0">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                    <span className="text-muted-foreground">{val}</span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border italic">
                  {preview.reminderScheduleNote}
                </p>
              </div>

              {/* Periods */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Reporting Periods
                </h3>
                <div className="space-y-3">
                  {periods.map((period, i) => (
                    <div
                      key={period.reportingPeriod}
                      className={`rounded-2xl border overflow-hidden transition-all ${
                        period.isSubmissionOverdue
                          ? "border-red-200 bg-red-50/30"
                          : period.calendarAlreadyOpened
                          ? "border-emerald-200 bg-emerald-50/20"
                          : i === 0
                          ? "border-blue-200 bg-blue-50/20"
                          : "border-border bg-card"
                      }`}
                    >
                      {/* Period header */}
                      <div className="px-5 py-3.5 flex items-center justify-between border-b border-inherit">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            period.isSubmissionOverdue ? "bg-red-100 text-red-700" :
                            period.calendarAlreadyOpened ? "bg-emerald-100 text-emerald-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{period.reportingPeriodLabel}</p>
                            <p className="text-xs text-muted-foreground">Period ends {fmtDate(period.periodEndDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {period.automationWouldOpenOnTick && (
                            <Badge className="text-[10px] rounded-full bg-purple-100 text-purple-700 gap-1">
                              <Zap className="w-2.5 h-2.5" />Auto-open
                            </Badge>
                          )}
                          <PeriodStatusBadge period={period} />
                        </div>
                      </div>

                      {/* Timeline rows */}
                      <div className="px-5 py-4 space-y-3">
                        <TimelineRow
                          icon={Calendar}
                          color="bg-blue-100 text-blue-600"
                          label="Reporting opens"
                          date={period.reportingOpensOn}
                          note={preview.offsetsExplanation.reportingOpensOn}
                        />
                        <div className="ml-5 border-l-2 border-dashed border-border pl-4 space-y-3">
                          <TimelineRow
                            icon={Bell}
                            color="bg-amber-100 text-amber-600"
                            label="Reminder sent (T−3)"
                            date={period.reminderTMinus3On}
                          />
                          <TimelineRow
                            icon={Clock}
                            color="bg-orange-100 text-orange-600"
                            label="Submission due"
                            date={period.submissionDueDate}
                          />
                          <TimelineRow
                            icon={AlertTriangle}
                            color="bg-red-100 text-red-600"
                            label="Overdue alert"
                            date={period.overdueAlertOn}
                          />
                        </div>

                        {/* Status flags */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            period.calendarAlreadyOpened ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {period.calendarAlreadyOpened
                              ? <><CheckCircle2 className="w-3 h-3" />Calendar opened</>
                              : <><XCircle className="w-3 h-3" />Calendar not opened</>
                            }
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            period.openWindowReached ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {period.openWindowReached
                              ? <><CheckCircle2 className="w-3 h-3" />Window reached</>
                              : <><XCircle className="w-3 h-3" />Window not yet reached</>
                            }
                          </span>
                          {period.isSubmissionOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" />Submission overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!loading && !preview && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
              <div className="p-4 bg-muted rounded-full">
                <CalendarDays className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Click Preview to load the schedule</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
