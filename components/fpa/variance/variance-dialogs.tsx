"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  planningAvatarTone,
  planningInitials,
} from "@/components/fpa/planning/planning-collab-sidebar"
import type { VarCommentaryReq, VarDetail } from "@/components/fpa/variance/variance-analysis-view"

const R = "rounded-lg"

function StatusBadge({ status }: { status: VarCommentaryReq["status"] }) {
  const styles =
    status === "Overdue"
      ? "bg-[#fef3f2] text-[#d92d20] border-[#fecdca]"
      : status === "Submitted"
        ? "bg-[#ecfdf3] text-[#079455] border-[#abefc6]"
        : "bg-[#eff8ff] text-[#1570ef] border-[#b2ddff]"
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", styles)}>
      {status}
    </span>
  )
}

export function InfoDialog({
  open,
  onOpenChange,
  title,
  body,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  body: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${R} max-w-md`}>
        <DialogHeader>
          <DialogTitle className="text-[15px]">{title}</DialogTitle>
          <DialogDescription className="text-[13px] text-[#475467] leading-relaxed pt-1">
            {body}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export function CommentaryAllDialog({
  open,
  onOpenChange,
  requests,
  onSelect,
  buildDetail,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requests: VarCommentaryReq[]
  onSelect: (req: VarCommentaryReq) => void
  buildDetail: (req: VarCommentaryReq) => VarDetail
}) {
  const [focused, setFocused] = useState<VarCommentaryReq | null>(null)
  const detail = focused ? buildDetail(focused) : null

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setFocused(null)
        onOpenChange(v)
      }}
    >
      <DialogContent className={`${R} max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0`}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#e4e7ec] shrink-0">
          <DialogTitle className="text-[16px] font-semibold text-[#101828]">
            All Commentary Requests
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#667085]">
            {requests.length} open requests · click a row for full variance detail
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="lg:w-[52%] border-b lg:border-b-0 lg:border-r border-[#e4e7ec] overflow-y-auto max-h-[40vh] lg:max-h-none">
            <table className="w-full border-collapse text-[12px]">
              <thead className="sticky top-0 bg-[#f9fafb] z-10">
                <tr className="border-b border-[#e4e7ec]">
                  <th className="text-left px-4 py-2 font-semibold text-[#344054]">Department</th>
                  <th className="text-left px-3 py-2 font-semibold text-[#344054]">Area</th>
                  <th className="px-3 py-2 text-right font-semibold text-[#344054]">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setFocused(req)}
                    className={cn(
                      "border-b border-[#f2f4f7] cursor-pointer hover:bg-[#f9fafb]",
                      focused?.id === req.id && "bg-[#eff8ff]",
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium text-[#101828]">{req.dept}</td>
                    <td className="px-3 py-2.5 text-[#475467]">{req.area}</td>
                    <td className="px-3 py-2.5 text-right">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-1 overflow-y-auto p-5 min-h-[240px]">
            {detail ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">
                    Variance Detail
                  </p>
                  <h3 className="text-[15px] font-semibold text-[#101828] mt-1">
                    {detail.dept} · {detail.area}
                  </h3>
                  <p className="text-[11px] text-[#667085]">{detail.period}</p>
                </div>
                <p
                  className={cn(
                    "text-[26px] font-semibold tabular-nums",
                    detail.headlineTone === "down" ? "text-[#f04438]" : "text-[#12b76a]",
                  )}
                >
                  {detail.headline}
                </p>
                <p className="text-[12px] text-[#667085]">{detail.pctLabel}</p>
                <div>
                  <p className="text-[11px] font-semibold text-[#344054] mb-1">Explanation</p>
                  <p className="text-[12px] text-[#475467] leading-relaxed">{detail.explanation}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#344054] mb-1">Corrective Action</p>
                  <p className="text-[12px] text-[#475467] leading-relaxed">{detail.correctiveAction}</p>
                </div>
                <dl className={`${R} border border-[#e4e7ec] p-3 space-y-1.5 text-[12px]`}>
                  {detail.supporting.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                      <dt className="text-[#667085]">{row.label}</dt>
                      <dd className="font-medium text-[#101828] tabular-nums">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white",
                      planningAvatarTone(detail.owner),
                    )}
                  >
                    {planningInitials(detail.owner)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#101828]">{detail.owner}</p>
                    <p className="text-[11px] text-[#667085]">Due {detail.due}</p>
                  </div>
                  <StatusBadge status={detail.status} />
                </div>
                <button
                  type="button"
                  className="h-9 rounded-full bg-[#1570ef] px-4 text-[12px] font-medium text-white"
                  onClick={() => {
                    onSelect(focused!)
                    onOpenChange(false)
                    setFocused(null)
                  }}
                >
                  Open in sidebar
                </button>
              </div>
            ) : (
              <p className="text-[13px] text-[#98a2b3] text-center py-12">
                Select a commentary request to view full details.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
