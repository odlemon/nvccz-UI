"use client"

import { useMemo, useState } from "react"
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
import {
  FR_APPROVALS,
  priorityClass,
  statusClass,
  typeClass,
  type ApprovalRequest,
  type ApprovalStatus,
} from "./approvals-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  FrViewAllDialog,
  frInputClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

type Decision = "Approved" | "Rejected"

export function FundraisingApprovals() {
  const [requests, setRequests] = useState(FR_APPROVALS)
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("all")
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selected, setSelected] = useState<ApprovalRequest | null>(null)
  const [decision, setDecision] = useState<Decision>("Approved")
  const [reason, setReason] = useState("")

  const filtered = useMemo(() => {
    if (statusFilter === "all") return requests
    return requests.filter((r) => r.status === statusFilter)
  }, [requests, statusFilter])

  const pendingCount = requests.filter((r) => r.status === "Pending").length

  const historyRows = useMemo(() => {
    if (!selected) return []
    return selected.history.map((h) => ({
      id: h.id,
      title: h.action,
      subtitle: h.note,
      meta: `${h.actor} · ${h.at}`,
      badge: h.action.includes("Approved")
        ? "Approved"
        : h.action.includes("Rejected")
          ? "Rejected"
          : undefined,
      badgeClass: h.action.includes("Approved")
        ? "bg-[#dcfce7] text-[#15803d]"
        : h.action.includes("Rejected")
          ? "bg-[#fee2e2] text-[#b91c1c]"
          : "bg-[#f1f5f9] text-[#64748b]",
    }))
  }, [selected])

  function openDecision(req: ApprovalRequest, d: Decision) {
    setSelected(req)
    setDecision(d)
    setReason("")
    setDecisionOpen(true)
  }

  function openHistory(req: ApprovalRequest) {
    setSelected(req)
    setHistoryOpen(true)
  }

  function submitDecision() {
    if (!selected || !reason.trim()) return
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== selected.id) return r
        return {
          ...r,
          status: decision,
          history: [
            ...r.history,
            {
              id: `h-${Date.now()}`,
              at: "15 Jul 2026, now",
              actor: "You",
              action: decision,
              note: reason.trim(),
            },
          ],
        }
      }),
    )
    setDecisionOpen(false)
    toast.success(`Request ${decision.toLowerCase()}`)
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
            onClick={() => toast.success("Export started")}
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
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
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc]"
                >
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => openHistory(req)}
                      className="text-left"
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
                      {req.type}
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
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold",
                        statusClass(req.status),
                      )}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-[#94a3b8]">
                    <p>{req.requestedBy}</p>
                    <p className="text-[10px]">{req.requestedAt}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    {req.status === "Pending" ? (
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="gradient-create"
                          className="h-7 rounded-full px-3 text-[10px]"
                          onClick={() => openDecision(req, "Approved")}
                        >
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full px-3 text-[10px] text-[#b91c1c] hover:bg-[#fee2e2]"
                          onClick={() => openDecision(req, "Rejected")}
                        >
                          <X className="h-3 w-3" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openHistory(req)}
                        className="text-[11px] font-medium text-[#2563eb] hover:underline"
                      >
                        View history
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[12px] text-[#94a3b8]">
            No requests match this filter.
          </p>
        ) : null}
      </div>

      <FrDialogShell
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        title={decision === "Approved" ? "Approve request" : "Reject request"}
        description={selected?.title}
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setDecisionOpen(false)}
            onSubmit={submitDecision}
            submitLabel={decision === "Approved" ? "Approve" : "Reject"}
            submitDisabled={!reason.trim()}
          />
        }
      >
        <div className="space-y-3">
          {selected ? (
            <div className="rounded-[6px] border border-[#f1f5f9] bg-[#fafafa] px-3 py-2 text-[11px] text-[#64748b]">
              <p>
                <span className="font-medium text-[#0f172a]">{selected.type}</span> —{" "}
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
                decision === "Approved"
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
          selected
            ? `${selected.type} · ${selected.status} · ${selected.history.length} events`
            : undefined
        }
        rows={historyRows}
        size="lg"
      />
    </div>
  )
}
