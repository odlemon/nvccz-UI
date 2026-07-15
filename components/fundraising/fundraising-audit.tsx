"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ClipboardList, Download, Search } from "lucide-react"
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
import {
  AUDIT_ACTIONS,
  AUDIT_LOGS,
  AUDIT_USERS,
  auditActionClass,
  type AuditLog,
} from "./audit-mock-data"
import { FrDialogShell } from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#94a3b8]">{label}</p>
      <div className="mt-1 text-[12px] text-[#0f172a]">{value}</div>
    </div>
  )
}

export function FundraisingAudit() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return AUDIT_LOGS.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false
      if (userFilter !== "all" && log.user !== userFilter) return false
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
  }, [search, actionFilter, userFilter])

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
          onClick={() => toast.success("Audit export started")}
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total events", value: AUDIT_LOGS.length },
          { label: "Users", value: AUDIT_USERS.filter((u) => u !== "System").length },
          { label: "Stage changes", value: AUDIT_LOGS.filter((l) => l.action === "Stage Change").length },
          { label: "Today", value: AUDIT_LOGS.filter((l) => l.timestamp.startsWith("15 Jul")).length },
        ].map((k) => (
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
                {AUDIT_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
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
                {AUDIT_USERS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {filtered.length === 0 ? (
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
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-[11px] font-medium text-[#0f172a]">{log.objectName}</p>
                      <p className="mt-0.5 text-[10px] text-[#94a3b8]">{log.objectType}</p>
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
      </div>

      <FrDialogShell
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Audit event detail"
        description={selected?.id}
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
                    {selected.action}
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
                    <p className="mt-0.5 text-[11px] text-[#64748b]">{selected.objectType}</p>
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
            <DetailField
              label="Details"
              value={<p className="leading-relaxed text-[#475569]">{selected.details}</p>}
            />
          </div>
        ) : null}
      </FrDialogShell>
    </div>
  )
}
