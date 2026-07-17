"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Download, Filter, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundraisingApi, toastFrError } from "@/lib/api/fundraising-api"
import { mapApprovalRow, titleCase } from "@/lib/fundraising/mappers"
import { exportFundraisingCsv } from "@/lib/fundraising/export"
import {
  priorityClass,
  statusClass,
  typeClass,
  type ApprovalStatus,
} from "./approvals-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrTableSkeleton,
  FrViewAllDialog,
  frInputClass,
  type ViewAllRow,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type Decision = "APPROVED" | "REJECTED"

const IDENTIFIER_ONLY = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i

function embeddedLabel(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() && !IDENTIFIER_ONLY.test(value.trim())) {
      return value.trim()
    }
    if (value && typeof value === "object") {
      const item = value as Record<string, any>
      const nested = embeddedLabel(
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

function mapSafeApprovalRow(raw: Record<string, any>) {
  const mapped = mapApprovalRow(raw)
  return {
    ...mapped,
    campaign:
      embeddedLabel(raw.campaignName, raw.campaign, raw.opportunity?.campaign) || "Name unavailable",
    investor:
      embeddedLabel(raw.investorName, raw.investor, raw.opportunity?.investor) || "Name unavailable",
    requestedBy:
      embeddedLabel(
        raw.requestedByName,
        raw.requesterName,
        raw.createdByName,
        raw.requestedBy,
        raw.requester,
        raw.createdBy,
      ) || "Name unavailable",
    decidedBy: embeddedLabel(raw.decidedByName, raw.decidedBy, raw.approver),
    summary:
      embeddedLabel(raw.description, raw.summary, raw.reason, raw.requestDetails) || mapped.summary,
  }
}

type ApprovalRow = ReturnType<typeof mapSafeApprovalRow>

export function FundraisingApprovals() {
  const [rows, setRows] = useState<ApprovalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("all")
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selected, setSelected] = useState<ApprovalRow | null>(null)
  const [decision, setDecision] = useState<Decision>("APPROVED")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function loadApprovals() {
    setLoading(true)
    try {
      const res = await fundraisingApi.listApprovals(
        statusFilter !== "all" ? { status: statusFilter } : undefined,
      )
      setRows((res ?? []).map(mapSafeApprovalRow))
    } catch (err) {
      toastFrError(err, "Could not load approvals")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApprovals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const pendingCount = useMemo(() => rows.filter((r) => r.status === "PENDING").length, [rows])

  const historyRows = useMemo<ViewAllRow[]>(() => {
    if (!selected) return []
    const items: ViewAllRow[] = [
      {
        id: "submitted",
        title: "Submitted for approval",
        subtitle: selected.summary !== "—" ? selected.summary : undefined,
        meta: `${selected.requestedBy} · ${selected.requestedAt}`,
      },
    ]
    if (selected.status !== "PENDING") {
      items.push({
        id: "decided",
        title: selected.status === "APPROVED" ? "Approved" : "Rejected",
        subtitle: selected.decisionNotes,
        meta: [selected.decidedBy, selected.decidedAt].filter(Boolean).join(" · ") || undefined,
        badge: selected.status === "APPROVED" ? "Approved" : "Rejected",
        badgeClass:
          selected.status === "APPROVED"
            ? "bg-[#dcfce7] text-[#15803d]"
            : "bg-[#fee2e2] text-[#b91c1c]",
      })
    }
    return items
  }, [selected])

  function openDecision(req: ApprovalRow, d: Decision) {
    setSelected(req)
    setDecision(d)
    setReason("")
    setDecisionOpen(true)
  }

  function openHistory(req: ApprovalRow) {
    setSelected(req)
    setHistoryOpen(true)
  }

  async function submitDecision() {
    if (!selected || !reason.trim()) return
    setSubmitting(true)
    try {
      await fundraisingApi.decideApproval(selected.id, {
        decision,
        decisionNotes: reason.trim(),
      })
      toast.success(`Request ${decision === "APPROVED" ? "approved" : "rejected"}`)
      setDecisionOpen(false)
      await loadApprovals()
    } catch (err) {
      toastFrError(err, "Decision failed")
    } finally {
      setSubmitting(false)
    }
  }

  function exportApprovals() {
    if (rows.length === 0) {
      toast.error("There are no approval rows to export")
      return
    }
    exportFundraisingCsv(
      rows,
      [
        { key: "title", label: "Request" },
        { key: "summary", label: "Summary" },
        { key: "type", label: "Type", value: (row) => titleCase(row.type) },
        { key: "campaign", label: "Campaign" },
        { key: "investor", label: "Investor" },
        { key: "amount", label: "Amount" },
        { key: "priority", label: "Priority", value: (row) => titleCase(row.priority || "") },
        { key: "status", label: "Status", value: (row) => titleCase(row.status) },
        { key: "requestedBy", label: "Requested by" },
        { key: "requestedAt", label: "Requested at" },
        { key: "decidedBy", label: "Decided by" },
        { key: "decidedAt", label: "Decided at" },
        { key: "decisionNotes", label: "Decision notes" },
      ],
      "fundraising-approvals-export",
    )
    toast.success("Approvals CSV downloaded")
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Approvals</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Commercial concessions, side letters and stage override approvals
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={exportApprovals}
            disabled={loading}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {pendingCount > 0 ? (
        <div className="mt-4 rounded-[6px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[11px] text-[#92400e]">
          {pendingCount} request{pendingCount === 1 ? "" : "s"} awaiting your decision.
        </div>
      ) : null}

      <div className={cn(CARD, "mt-5 overflow-hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f5f9] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0f172a]">Inbox</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#94a3b8]" />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | ApprovalStatus)}
            >
              <SelectTrigger className="h-8 w-[140px] rounded-full border-[#e2e8f0] text-[11px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                {[
                  "Request",
                  "Type",
                  "Campaign",
                  "Investor",
                  "Priority",
                  "Status",
                  "Requested",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <FrTableSkeleton columns={8} rows={6} />
              ) : (
                rows.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc]"
                  >
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => openHistory(req)}
                        className="rounded-full text-left"
                      >
                        <p className="text-[12px] font-medium text-[#0f172a] hover:text-[#2563eb]">
                          {req.title}
                        </p>
                        <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-[#94a3b8]">
                          {req.summary}
                        </p>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                          typeClass(req.type),
                        )}
                      >
                        {titleCase(req.type)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{req.campaign}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[#64748b]">{req.investor}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                          priorityClass(req.priority),
                        )}
                      >
                        {req.priority ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                          statusClass(req.status),
                        )}
                      >
                        {titleCase(req.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#94a3b8]">
                      <p>{req.requestedBy}</p>
                      <p className="text-[10px]">{req.requestedAt}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {req.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="gradient-create"
                            className="h-7 rounded-full px-3 text-[10px]"
                            onClick={() => openDecision(req, "APPROVED")}
                          >
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-full px-3 text-[10px] text-[#b91c1c] hover:bg-[#fee2e2]"
                            onClick={() => openDecision(req, "REJECTED")}
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openHistory(req)}
                          className="rounded-full text-[11px] font-medium text-[#2563eb] hover:underline"
                        >
                          View history
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12px] text-[#94a3b8]">
            No requests match this filter.
          </p>
        ) : null}
      </div>

      <FrDialogShell
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        title={decision === "APPROVED" ? "Approve request" : "Reject request"}
        description={selected?.title}
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setDecisionOpen(false)}
            onSubmit={submitDecision}
            submitLabel={
              submitting ? "Submitting…" : decision === "APPROVED" ? "Approve" : "Reject"
            }
            submitDisabled={!reason.trim() || submitting}
          />
        }
      >
        <div className="space-y-3">
          {selected ? (
            <div className="rounded-[6px] border border-[#f1f5f9] bg-[#fafafa] px-3 py-2 text-[11px] text-[#64748b]">
              <p>
                <span className="font-medium text-[#0f172a]">{titleCase(selected.type)}</span> —{" "}
                {selected.investor}
                {selected.amount ? ` · ${selected.amount}` : ""}
              </p>
              <p className="mt-1">{selected.summary}</p>
            </div>
          ) : null}
          <FrField label="Reason (required)">
            <textarea
              className={cn(frInputClass, "min-h-[88px] resize-y py-2")}
              placeholder={
                decision === "APPROVED"
                  ? "e.g. Within policy for anchor investors"
                  : "e.g. Outside approved fee grid"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FrField>
        </div>
      </FrDialogShell>

      <FrViewAllDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title={selected ? selected.title : "Request history"}
        description={
          selected ? `${titleCase(selected.type)} · ${titleCase(selected.status)}` : undefined
        }
        rows={historyRows}
        size="lg"
      />
    </div>
  )
}
