"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { format } from "date-fns"
import { AlertTriangle, RefreshCw, AlertCircle, Shield, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { fetchAuditFeed, fetchHighPriorityAudit } from "@/lib/store/slices/forecastingSlice"
import type { ForecastAuditEntry } from "@/lib/api/forecasting-api"

function AuditRow({ entry }: { entry: ForecastAuditEntry }) {
  const isHigh = entry.priority === "HIGH"
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50/60 transition-colors ${isHigh ? "bg-red-50/40" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isHigh ? "bg-red-100" : "bg-blue-100"}`}>
        {isHigh ? (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        ) : (
          <Activity className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 font-mono">{entry.action_type}</span>
          {isHigh && (
            <Badge className="bg-red-100 text-red-700 border-0 text-xs">HIGH PRIORITY</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {entry.scenario_name && (
            <span className="text-xs text-muted-foreground">Scenario: <span className="text-gray-700 font-medium">{entry.scenario_name}</span></span>
          )}
          {entry.user_name && (
            <span className="text-xs text-muted-foreground">· By: <span className="text-gray-700">{entry.user_name}</span></span>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 pt-1">
        {entry.timestamp ? format(new Date(entry.timestamp), "MMM d, HH:mm") : "—"}
      </span>
    </div>
  )
}

export function AuditFeedPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { auditLogs, auditLoading, highPriorityAudit, highPriorityLoading } = useSelector(
    (state: RootState) => state.forecasting
  )

  useEffect(() => {
    dispatch(fetchAuditFeed())
    dispatch(fetchHighPriorityAudit())
  }, [dispatch])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">All forecasting scenario audit events</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-9"
          onClick={() => { dispatch(fetchAuditFeed()); dispatch(fetchHighPriorityAudit()) }}
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="rounded-full bg-gray-100 p-1">
          <TabsTrigger value="all" className="rounded-full text-xs px-4">
            <Activity className="w-3.5 h-3.5 mr-1.5" /> All Events
          </TabsTrigger>
          <TabsTrigger value="high" className="rounded-full text-xs px-4">
            <Shield className="w-3.5 h-3.5 mr-1.5" /> High Priority
            {highPriorityAudit.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {highPriorityAudit.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                {auditLogs.length} events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {auditLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No audit events found</p>
                </div>
              ) : (
                auditLogs.map((entry: ForecastAuditEntry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                {highPriorityAudit.length} high-priority events (LOCK_VIOLATION etc.)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {highPriorityLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                </div>
              ) : highPriorityAudit.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Shield className="w-10 h-10 text-green-400/60 mb-3" />
                  <p className="text-sm text-muted-foreground">No high-priority events</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">All clear — no lock violations detected</p>
                </div>
              ) : (
                highPriorityAudit.map((entry: ForecastAuditEntry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
