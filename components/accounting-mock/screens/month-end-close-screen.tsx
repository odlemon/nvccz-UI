"use client"

import { Fragment, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  GitBranch,
  Landmark,
  Lock,
  MoreVertical,
  Paperclip,
  Receipt,
  Send,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcCardHeader,
  AcDrawerSectionTitle,
  AcField,
  AcSelectInput,
  AcStatusPill,
} from "@/components/accounting-mock/primitives"
import {
  acCloseFooter,
  acCloseHeader,
  acCloseKpis,
  acCloseVatDetail,
  acCloseWorkstreams,
  type AcCloseTask,
  type AcCloseTaskStatus,
} from "@/lib/accounting-mock/fixtures-close"
import { cn } from "@/lib/utils"

const wsIcons = {
  bank: Landmark,
  payable: Receipt,
  receivable: FileText,
  payroll: User,
  assets: Wallet,
  investments: Wallet,
  tax: FileText,
  statements: FileText,
}

const kpiIcons = {
  check: { bg: "bg-[#DBEAFE]", color: "text-[#2563EB]", icon: <Check className="h-4 w-4" /> },
  journal: { bg: "bg-[#FFFBF2]", color: "text-[#F59E0B]", icon: <FileText className="h-4 w-4" /> },
  alert: { bg: "bg-[#FEF6F6]", color: "text-[#DC2626]", icon: <AlertTriangle className="h-4 w-4" /> },
  calendar: { bg: "bg-[#FFFBF2]", color: "text-[#F59E0B]", icon: <CalendarDays className="h-4 w-4" /> },
}

function statusTone(s: AcCloseTaskStatus): "posted" | "pending" | "exception" | "neutral" {
  if (s === "Complete") return "posted"
  if (s === "In review") return "pending"
  return "exception"
}

function statusDot(s: AcCloseTaskStatus) {
  const colors = {
    Complete: "bg-[#2563EB]",
    "In review": "bg-[#F59E0B]",
    Exception: "bg-[#DC2626]",
    Blocked: "bg-[#DC2626]",
  }
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[s])} />
}

function CloseDonut({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-[52px] w-[52px] shrink-0">
      <svg viewBox="0 0 52 52" className="h-full w-full -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke="#2563EB"
          strokeWidth="6"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold text-[#2563EB]">{value}%</span>
      </div>
    </div>
  )
}

export function MonthEndCloseScreen() {
  const [openWs, setOpenWs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(acCloseWorkstreams.map((w) => [w.id, true]))
  )
  const [selected, setSelected] = useState("tax-1")
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(acCloseVatDetail.checklist.map((c) => [c.id, c.done]))
  )
  const [footerOpen, setFooterOpen] = useState(true)

  const selectedTask = useMemo(() => {
    for (const ws of acCloseWorkstreams) {
      const t = ws.tasks.find((x) => x.id === selected)
      if (t) return t
    }
    return acCloseWorkstreams[6].tasks[0]
  }, [selected])

  const showVatPanel = selected === "tax-1"

  return (
    <div className="p-4 lg:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">
            Period Close · {acCloseHeader.period}
          </h1>
          <span className="inline-flex items-center px-2.5 py-[3px] rounded-full bg-[#DBEAFE] text-[10px] font-semibold text-[#2563EB]">
            {acCloseHeader.status}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#6B7280]">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Close owner: <span className="font-semibold text-[#0B1739]">{acCloseHeader.owner}</span>
          </span>
          <span className="h-4 w-px bg-[#E5E7EB]" />
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Target close date: <span className="font-semibold text-[#0B1739]">{acCloseHeader.targetDate}</span>
          </span>
          <AcButton
            className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-4"
            onClick={() => toast.success("Close pack sent", { description: "Sent for review (mock)" })}
          >
            <Send className="h-3.5 w-3.5" /> Send close pack for review
          </AcButton>
          <button
            type="button"
            aria-label="More actions"
            onClick={() => toast("More actions")}
            className="text-[#6B7280] hover:text-[#0B1739]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {acCloseKpis.map((k) => (
          <AcCard key={k.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              {k.kind === "donut" ? (
                <CloseDonut value={74} />
              ) : (
                <span
                  className={cn(
                    "h-9 w-9 rounded-full inline-flex items-center justify-center shrink-0",
                    kpiIcons[k.icon!].bg,
                    kpiIcons[k.icon!].color
                  )}
                >
                  {kpiIcons[k.icon!].icon}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-[#6B7280]">{k.label}</p>
                <p className="text-[18px] font-bold text-[#0B1739] leading-tight">{k.value}</p>
                {k.sub && <p className="text-[10px] text-[#9CA3AF]">{k.sub}</p>}
              </div>
            </div>
          </AcCard>
        ))}
      </div>

      {/* Task table + detail */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <AcCard className="flex-1 min-w-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#EEF1F5] text-[#6B7280]">
                  <th className="px-3 py-2.5 text-left font-normal">Workstream / Task</th>
                  <th className="px-3 py-2.5 text-left font-normal">Dependency</th>
                  <th className="px-3 py-2.5 text-left font-normal">Owner</th>
                  <th className="px-3 py-2.5 text-left font-normal whitespace-nowrap">Due</th>
                  <th className="px-3 py-2.5 text-left font-normal">Evidence</th>
                  <th className="px-3 py-2.5 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {acCloseWorkstreams.map((ws) => {
                  const Icon = wsIcons[ws.icon]
                  const expanded = openWs[ws.id]
                  return (
                    <Fragment key={ws.id}>
                      <tr className="border-b border-[#EEF1F5] bg-[#F9FAFB]">
                        <td colSpan={6} className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setOpenWs((p) => ({ ...p, [ws.id]: !p[ws.id] }))}
                            className="flex items-center gap-2 text-[11px] font-bold text-[#0B1739]"
                          >
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-[#6B7280] -rotate-90" />
                            )}
                            <Icon className="h-3.5 w-3.5 text-[#6B7280]" />
                            {ws.name}
                          </button>
                        </td>
                      </tr>
                      {expanded &&
                        ws.tasks.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            selected={selected === t.id}
                            onSelect={() => setSelected(t.id)}
                          />
                        ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AcCard>

        {showVatPanel && (
          <AcCard className="w-full xl:w-[340px] shrink-0 overflow-hidden">
            <AcCardHeader
              title={acCloseVatDetail.title}
              action={
                <button
                  type="button"
                  aria-label="Close panel"
                  onClick={() => setSelected("")}
                  className="text-[#9CA3AF] hover:text-[#0B1739]"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            />
            <div className="px-4 py-2 border-b border-[#EEF1F5] flex items-center gap-2 text-[11px]">
              <CalendarDays className="h-3.5 w-3.5 text-[#DC2626]" />
              <span className="text-[#DC2626] font-medium">Due {acCloseVatDetail.due}</span>
              <span className="text-[#E5E7EB]">|</span>
              <AcStatusPill label={acCloseVatDetail.status} tone="exception" />
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Source reconciliations</AcDrawerSectionTitle>
              <table className="w-full text-[11px] mt-1">
                <thead>
                  <tr className="text-[#6B7280]">
                    <th className="py-1.5 text-left font-normal">Reconciliation</th>
                    <th className="py-1.5 text-left font-normal">Ledger</th>
                    <th className="py-1.5 text-left font-normal">Status</th>
                    <th className="py-1.5 text-right font-normal whitespace-nowrap">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {acCloseVatDetail.reconciliations.map((r) => (
                    <tr key={r.reconciliation} className="border-t border-[#EEF1F5]">
                      <td className="py-2 text-[#374151]">{r.reconciliation}</td>
                      <td className="py-2 text-[#374151]">{r.ledger}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-1.5 text-[#374151]">
                          {statusDot(r.status)}
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums font-semibold text-[#0B1739]">{r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>VAT summary (USD)</AcDrawerSectionTitle>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div>
                  <p className="text-[10px] text-[#6B7280]">Output VAT</p>
                  <p className="text-[12px] font-bold text-[#0B1739] tabular-nums">{acCloseVatDetail.summary.output}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280]">Input VAT</p>
                  <p className="text-[12px] font-bold text-[#0B1739] tabular-nums">{acCloseVatDetail.summary.input}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B7280]">Net VAT payable</p>
                  <p className="text-[12px] font-bold text-[#DC2626] tabular-nums">{acCloseVatDetail.summary.net}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Checklist</AcDrawerSectionTitle>
              <div className="space-y-2 mt-1">
                {acCloseVatDetail.checklist.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!c.exception) {
                          setChecklist((p) => ({ ...p, [c.id]: !p[c.id] }))
                          toast(checklist[c.id] ? "Unchecked" : "Checked", { description: c.label })
                        }
                      }}
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded-full border inline-flex items-center justify-center shrink-0",
                        checklist[c.id]
                          ? "bg-[#2563EB] border-[#2563EB] text-white"
                          : c.exception
                            ? "border-[#DC2626] bg-[#FEF6F6] text-[#DC2626]"
                            : "border-[#D1D5DB]"
                      )}
                    >
                      {checklist[c.id] && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      {c.exception && !checklist[c.id] && <AlertTriangle className="h-2.5 w-2.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#0B1739]">{c.label}</p>
                      {c.sub && <p className="text-[10px] text-[#6B7280]">{c.sub}</p>}
                    </div>
                    {c.action && (
                      <button
                        type="button"
                        onClick={() => toast("Exceptions", { description: c.sub })}
                        className="text-[10px] font-medium text-[#2563EB] hover:underline whitespace-nowrap"
                      >
                        {c.action} &gt;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5] grid grid-cols-2 gap-3">
              <AcField label="Reviewer">
                <AcSelectInput
                  value={acCloseVatDetail.reviewer}
                  options={["Tariro Ncube", "Rudo Chikore", "Farai Moyo"]}
                />
              </AcField>
              <AcField label="Approver">
                <AcSelectInput
                  value={acCloseVatDetail.approver}
                  options={["Farai Moyo", "Rudo Chikore", "Tariro Ncube"]}
                />
              </AcField>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <div className="flex items-center justify-between mb-2">
                <AcDrawerSectionTitle>Evidence attachments ({acCloseVatDetail.attachments.length})</AcDrawerSectionTitle>
                <button
                  type="button"
                  onClick={() => toast("Download all")}
                  className="text-[10px] font-medium text-[#2563EB] hover:underline"
                >
                  Download all
                </button>
              </div>
              <div className="space-y-2">
                {acCloseVatDetail.attachments.map((a) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-7 w-7 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0",
                        a.type === "pdf" ? "bg-[#DC2626]" : "bg-[#2563EB]"
                      )}
                    >
                      {a.type === "pdf" ? "PDF" : "XLS"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-[#0B1739] truncate">{a.name}</p>
                      <p className="text-[10px] text-[#9CA3AF]">
                        {a.size} · {a.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-3 border-b border-[#EEF1F5]">
              <AcDrawerSectionTitle>Comments</AcDrawerSectionTitle>
              <div className="flex gap-2 mt-1">
                <span className="h-7 w-7 rounded-full bg-[#0B1739] text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                  {acCloseVatDetail.comment.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#0B1739]">{acCloseVatDetail.comment.author}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{acCloseVatDetail.comment.date}</p>
                  </div>
                  <p className="text-[11px] text-[#374151] mt-0.5">{acCloseVatDetail.comment.text}</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3">
              <AcDrawerSectionTitle>Approval timeline</AcDrawerSectionTitle>
              <div className="mt-2 space-y-3">
                {acCloseVatDetail.timeline.map((t, i) => (
                  <div key={t.label} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full inline-flex items-center justify-center text-white shrink-0",
                          t.tone === "ok" ? "bg-[#2563EB]" : "bg-[#DC2626]"
                        )}
                      >
                        {t.tone === "ok" ? (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        ) : (
                          <AlertTriangle className="h-3 w-3" strokeWidth={3} />
                        )}
                      </span>
                      {i < acCloseVatDetail.timeline.length - 1 && (
                        <span className="w-px flex-1 bg-[#E5E7EB] my-1 min-h-[12px]" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-[11px] font-semibold text-[#0B1739]">{t.label}</p>
                      <p className="text-[10px] text-[#6B7280]">
                        {t.by} · {t.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AcCard>
        )}

        {!showVatPanel && selectedTask && (
          <AcCard className="w-full xl:w-[340px] shrink-0 overflow-hidden p-4">
            <h2 className="text-[13px] font-bold text-[#0B1739]">{selectedTask.task}</h2>
            <p className="text-[11px] text-[#6B7280] mt-1">{selectedTask.dependency}</p>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Owner</span>
                <span className="font-semibold text-[#0B1739]">{selectedTask.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Due</span>
                <span className="font-semibold text-[#0B1739]">{selectedTask.due}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280]">Status</span>
                <AcStatusPill label={selectedTask.status} tone={statusTone(selectedTask.status)} />
              </div>
            </div>
          </AcCard>
        )}
      </div>

      {/* Footer bar */}
      {footerOpen && (
        <AcCard className="bg-[#D8E8FF] border-[#93B4F7]/40 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
            <div className="flex flex-wrap items-center gap-6">
              <FooterStat
                icon={<GitBranch className="h-3.5 w-3.5" />}
                label="Dependencies"
                value={`${acCloseFooter.dependencies.done} / ${acCloseFooter.dependencies.total}`}
                sub={acCloseFooter.dependencies.label}
              />
              <span className="h-8 w-px bg-[#93B4F7]/50 hidden sm:block" />
              <FooterStat
                icon={<Paperclip className="h-3.5 w-3.5" />}
                label="Evidence collected"
                value={acCloseFooter.evidence.count}
                sub={acCloseFooter.evidence.label}
              />
              <span className="h-8 w-px bg-[#93B4F7]/50 hidden sm:block" />
              <FooterStat
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="Audit trail"
                value={acCloseFooter.audit.status}
                sub={acCloseFooter.audit.label}
              />
            </div>
            <div className="flex items-center gap-2">
              <AcButton variant="cobaltOutline" onClick={() => toast.success("Progress saved")}>
                Save progress
              </AcButton>
              <AcButton
                className="bg-[#2563EB] hover:bg-[#1D4ED8]"
                onClick={() => toast.success("Review requested", { description: "Close pack sent to reviewer." })}
              >
                <Lock className="h-3.5 w-3.5" /> Request review
              </AcButton>
              <button
                type="button"
                aria-label="Collapse footer"
                onClick={() => setFooterOpen(false)}
                className="h-8 w-8 rounded-md border border-[#93B4F7] bg-white inline-flex items-center justify-center text-[#6B7280] hover:bg-[#EFF6FF]"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </AcCard>
      )}
      {!footerOpen && (
        <button
          type="button"
          onClick={() => setFooterOpen(true)}
          className="w-full py-2 text-[11px] font-medium text-[#2563EB] hover:underline"
        >
          Show close footer
        </button>
      )}
    </div>
  )
}

function TaskRow({
  task,
  selected,
  onSelect,
}: {
  task: AcCloseTask
  selected: boolean
  onSelect: () => void
}) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        "border-b border-[#EEF1F5] cursor-pointer transition-colors",
        selected ? "bg-[#DBEAFE]" : "hover:bg-[#F9FBFE]"
      )}
    >
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-2">
          <Circle
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              selected ? "text-[#2563EB] fill-[#2563EB]" : "text-[#D1D5DB]"
            )}
          />
          <span className="text-[#374151]">{task.task}</span>
        </span>
      </td>
      <td className="px-3 py-2.5 text-[#374151]">{task.dependency}</td>
      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{task.owner}</td>
      <td className="px-3 py-2.5 text-[#374151] whitespace-nowrap">{task.due}</td>
      <td className="px-3 py-2.5 text-[#374151]">
        {task.evidence !== "—" ? (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3 text-[#9CA3AF]" />
            {task.evidence}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[#374151] whitespace-nowrap">
          {statusDot(task.status)}
          {task.status}
        </span>
      </td>
    </tr>
  )
}

function FooterStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-8 w-8 rounded-full bg-[#0B1739] text-white inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div>
        <p className="text-[10px] text-[#6B7280]">{label}</p>
        <p className="text-[14px] font-bold text-[#0B1739] leading-tight">{value}</p>
        <p className="text-[10px] text-[#9CA3AF]">{sub}</p>
      </div>
    </div>
  )
}
