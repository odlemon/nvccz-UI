"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ClipboardList, Download, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { mapAuditLogRow, titleCase } from "@/lib/fundraising/mappers"
import { downloadCsvPayload } from "@/lib/fundraising/export"
import { auditActionClass } from "./audit-mock-data"
import { FrDialogShell, FrTableSkeleton } from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const UUID_ONLY = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function auditLabel(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && !UUID_ONLY.test(value.trim())) {
      return value.trim()
    }
    if (value && typeof value === "object") {
      const item = value as Record<string, any>
      const nested = auditLabel(
        item.displayName,
        item.userName,
        item.fullName,
        item.legalName,
        item.name,
        item.label,
        item.title,
      )
      if (nested) return nested
    }
  }
  return undefined
}

function auditSummary(raw: Record<string, any>) {
  for (const value of [
    raw.message,
    raw.description,
    raw.summary,
    raw.change,
    raw.changeDescription,
    raw.details?.message,
  ]) {
    if (typeof value === "string" && value.trim()) return value.trim()
    if (value && typeof value === "object") return JSON.stringify(value)
  }
  return "No summary available"
}

function mapSafeAuditLogRow(raw: Record<string, any>) {
  const mapped = mapAuditLogRow(raw)
  return {
    ...mapped,
    user:
      auditLabel(
        raw.userName,
        raw.actorName,
        raw.user,
        raw.actor,
        raw.createdBy,
        raw.performedBy,
      ) || "System",
    objectName:
      auditLabel(
        raw.objectName,
        raw.objectLabel,
        raw.entityName,
        raw.subject,
        raw.object,
        raw.campaign,
        raw.investor,
        raw.opportunity,
      ) || "Name unavailable",
    summary: auditSummary(raw),
  }
}

type AuditRow = ReturnType<typeof mapSafeAuditLogRow>

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#94a3b8]">{label}</p>
      <div className="mt-1 text-[12px] text-[#0f172a]">{value}</div>
    </div>
  )
}

export function FundraisingAudit() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [objectFilter, setObjectFilter] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [limit, setLimit] = useState(200)
  const [selected, setSelected] = useState<AuditRow | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fundraisingApi
      .listAuditLogs({ limit })
      .then((res) => setLogs((res ?? []).map(mapSafeAuditLogRow)))
      .catch((err) => {
        toastFrError(err, "Could not load audit logs")
        setLogs([])
      })
      .finally(() => setLoading(false))
  }, [limit])

  const actions = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).filter((a) => a !== "—").sort(),
    [logs],
  )
  const users = useMemo(
    () => Array.from(new Set(logs.map((l) => l.user))).sort(),
    [logs],
  )
  const objectTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.objectType))).filter((v) => v !== "—").sort(),
    [logs],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false
      if (userFilter !== "all" && log.user !== userFilter) return false
      if (objectFilter !== "all" && log.objectType !== objectFilter) return false
      const rawDate = log.raw?.createdAt || log.raw?.timestamp || log.raw?.occurredAt
      if (fromDate && rawDate && new Date(rawDate) < new Date(`${fromDate}T00:00:00`)) return false
      if (toDate && rawDate && new Date(rawDate) > new Date(`${toDate}T23:59:59`)) return false
      if (
        q &&
        !log.objectName.toLowerCase().includes(q) &&
        !log.summary.toLowerCase().includes(q) &&
        !log.user.toLowerCase().includes(q) &&
        !log.objectType.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [logs, search, actionFilter, userFilter, objectFilter, fromDate, toDate])

  const today = new Date().toDateString()
  const kpis = [
    { label: "Total events", value: logs.length },
    { label: "Users", value: users.filter((u) => u !== "System").length },
    {
      label: "Stage changes",
      value: logs.filter((l) => l.action.toUpperCase().includes("STAGE")).length,
    },
    {
      label: "Today",
      value: logs.filter((l) => {
        const raw = l.raw?.createdAt || l.raw?.timestamp || l.raw?.occurredAt
        return raw && new Date(raw).toDateString() === today
      }).length,
    },
  ]

  async function exportLogs() {
    setExporting(true)
    try {
      const selectedUserId =
        userFilter === "all"
          ? undefined
          : logs.find((log) => log.user === userFilter)?.raw?.userId ||
            logs.find((log) => log.user === userFilter)?.raw?.actorId
      const payload = await fundraisingApi.exportAuditLogs({
        objectType: objectFilter === "all" ? undefined : objectFilter,
        userId: selectedUserId,
        action: actionFilter === "all" ? undefined : actionFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit,
      })
      downloadCsvPayload(payload, `fundraising-audit-logs-${new Date().toISOString().slice(0, 10)}`)
      toast.success("Audit log CSV downloaded")
    } catch (err) {
      toastFrError(err, "Could not export audit logs")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Audit Logs</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Immutable object-level audit trail for material fundraising actions
          </p>
        </div>
        <Button
          variant="outline"
          className="h-9 rounded-full px-4"
          onClick={exportLogs}
          disabled={exporting}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Exporting…" : "Export"}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={cn(CARD, "p-3.5")}>
            <p className="text-[11px] text-[#64748b]">{k.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{k.value}</p>
          </div>
        ))}
      </div>

      <div className={cn(CARD, "mt-5 overflow-hidden")}>
        <div className="flex flex-col gap-2 border-b border-[#f1f5f9] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#64748b]" />
            <h2 className="text-[13px] font-semibold text-[#0f172a]">Event log</h2>
            <span className="rounded-[4px] bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#64748b]">
              {filtered.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative sm:w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="h-8 rounded-[6px] border-[#e2e8f0] pl-8 text-[12px] shadow-none"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-8 w-[140px] rounded-full border-[#e2e8f0] text-[12px] shadow-none">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {titleCase(a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="h-8 w-[160px] rounded-full border-[#e2e8f0] text-[12px] shadow-none">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={objectFilter} onValueChange={setObjectFilter}>
              <SelectTrigger className="h-8 w-[140px] rounded-full border-[#e2e8f0] text-[12px] shadow-none"><SelectValue placeholder="Object" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All objects</SelectItem>
                {objectTypes.map((type) => <SelectItem key={type} value={type}>{titleCase(type)}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 rounded-full border border-[#e2e8f0] px-3 text-[11px]" aria-label="From date" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 rounded-full border border-[#e2e8f0] px-3 text-[11px]" aria-label="To date" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                {["Timestamp", "User", "Action", "Object", "Summary", "IP"].map((h) => (
                  <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <FrTableSkeleton columns={6} rows={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-[12px] text-[#94a3b8]">
                    No audit events match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    className="cursor-pointer border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc]"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] tabular-nums text-[#64748b]">
                      {log.timestamp}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] font-medium text-[#0f172a]">
                      {log.user}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                          auditActionClass(log.action),
                        )}
                      >
                        {titleCase(log.action)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-[11px] font-medium text-[#0f172a]">{log.objectName}</p>
                      <p className="mt-0.5 text-[10px] text-[#94a3b8]">{titleCase(log.objectType)}</p>
                    </td>
                    <td className="max-w-[240px] truncate px-3 py-2 text-[11px] text-[#475569]">
                      {log.summary}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-[#94a3b8]">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logs.length >= limit ? (
          <div className="border-t border-[#f1f5f9] p-3 text-center">
            <Button type="button" variant="outline" className="h-8 rounded-full px-4 text-[11px]" onClick={() => setLimit((value) => value + 200)}>Load more</Button>
          </div>
        ) : null}
      </div>

      <FrDialogShell
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Audit event detail"
        description="Recorded fundraising activity"
        size="lg"
        footer={
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => setSelected(null)}
          >
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Timestamp" value={selected.timestamp} />
              <DetailField label="User" value={selected.user} />
              <DetailField
                label="Action"
                value={
                  <span
                    className={cn(
                      "inline-flex rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                      auditActionClass(selected.action),
                    )}
                  >
                    {titleCase(selected.action)}
                  </span>
                }
              />
              <DetailField label="IP address" value={<span className="font-mono">{selected.ip}</span>} />
            </div>
            <div className="border-t border-[#f1f5f9] pt-4">
              <DetailField
                label="Object"
                value={
                  <>
                    <p className="font-medium">{selected.objectName}</p>
                    <p className="mt-0.5 text-[11px] text-[#64748b]">{titleCase(selected.objectType)}</p>
                  </>
                }
              />
            </div>
            <DetailField
              label="Change summary"
              value={
                <span className="rounded-[4px] bg-[#f8fafc] px-2 py-1 font-mono text-[11px] text-[#475569]">
                  {selected.summary}
                </span>
              }
            />
            {selected.previousValue != null || selected.newValue != null ? (
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Previous value"
                  value={<span className="font-mono">{String(selected.previousValue ?? "—")}</span>}
                />
                <DetailField
                  label="New value"
                  value={<span className="font-mono">{String(selected.newValue ?? "—")}</span>}
                />
              </div>
            ) : null}
            {selected.details ? (
              <DetailField
                label="Details"
                value={<p className="leading-relaxed text-[#475569]">{selected.details}</p>}
              />
            ) : null}
          </div>
        ) : null}
      </FrDialogShell>
    </div>
  )
}
