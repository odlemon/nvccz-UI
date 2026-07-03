"use client"

import { useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchAudit } from "@/lib/store/slices/fundPerformanceReportingSlice"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { FUND_REPORTING_ACTIONS } from "@/lib/config/role-permissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtDate } from "./format"
import { Search } from "lucide-react"
import { AccessDeniedCard } from "./access-denied-card"
import { ProcurementDataTable, type Column } from "@/components/procurement/procurement-data-table"

// Values map to whatever entityType string the backend expects — the audit
// endpoint's own example uses entityType=FundReportTemplate.
const ENTITY_TYPES = [
  { label: "Report Template", value: "FundReportTemplate" },
  { label: "Report Schedule", value: "FundReportSchedule" },
  { label: "Distribution List", value: "FundReportDistributionList" },
  { label: "Report Run", value: "FundReportRun" },
]

interface AuditEntryRow {
  id: string
  action?: string | null
  actorId?: string | null
  diff?: Record<string, any> | null
  createdAt?: string | null
}

export function AuditTrailTable() {
  const dispatch = useAppDispatch()
  const { auditEntries, auditLoading, auditError } = useAppSelector((s) => s.fundPerformanceReporting)
  const { hasSpecificAction } = useRolePermissions()
  const canView = hasSpecificAction("portfolio-management", FUND_REPORTING_ACTIONS.VIEW_AUDIT_TRAIL)

  const [entityType, setEntityType] = useState(ENTITY_TYPES[0].value)
  const [entityId, setEntityId] = useState("")
  const [searched, setSearched] = useState(false)

  const handleSearch = () => {
    if (!entityId.trim()) return
    setSearched(true)
    dispatch(fetchAudit({ entityType, entityId: entityId.trim() }))
  }

  const tableRows: AuditEntryRow[] = useMemo(
    () => auditEntries.map((entry, idx) => ({ ...entry, id: entry?.id ?? String(idx) })),
    [auditEntries]
  )

  if (!canView) return <AccessDeniedCard message="You do not have permission to view the audit trail." />

  const columns: Column<AuditEntryRow>[] = [
    { key: "action", label: "Action", sortable: true, render: (value) => <span className="font-medium text-gray-800">{value ?? "—"}</span> },
    { key: "actorId", label: "Actor", render: (value) => <span className="font-mono text-xs text-gray-500">{value ?? "—"}</span> },
    {
      key: "diff",
      label: "Diff",
      render: (value) =>
        value ? (
          <pre className="text-xs bg-gray-50 rounded-md p-2 max-w-md overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
        ) : "—",
    },
    { key: "createdAt", label: "Timestamp", sortable: true, render: (value) => <span className="text-xs text-gray-500">{fmtDate(value)}</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Entity Type</label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="h-9 w-56 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500">Entity ID</label>
          <Input
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="Paste entity UUID…"
            className="h-9 w-72 bg-white font-mono text-xs"
          />
        </div>
        <Button size="sm" className="h-9 rounded-full gradient-primary text-white" onClick={handleSearch} disabled={!entityId.trim() || auditLoading}>
          <Search className="w-3.5 h-3.5 mr-1.5" /> {auditLoading ? "Searching…" : "Search"}
        </Button>
      </div>

      {auditError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{auditError}</div>
      )}

      {!searched ? (
        <Card className="bg-white border border-gray-200 shadow-none p-10 text-center text-sm text-muted-foreground">
          Select an entity type and enter an entity ID to view its audit trail.
        </Card>
      ) : auditLoading ? (
        <Card className="bg-white border border-gray-200 shadow-none p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </Card>
      ) : (
        <ProcurementDataTable
          data={tableRows}
          columns={columns}
          title="Audit Trail"
          searchPlaceholder="Search audit entries…"
          exportable={false}
          emptyMessage="No audit entries found for this entity."
        />
      )}
    </div>
  )
}
