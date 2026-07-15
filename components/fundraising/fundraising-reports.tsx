"use client"

import { useMemo, useState } from "react"
import { Calendar, FileBarChart, Play, Settings } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FR_REPORTS,
  categoryClass,
  reportColumns,
  type FrReport,
  type ReportSchedule,
} from "./reports-mock-data"
import {
  FrDialogShell,
  FrField,
  FrFormFooter,
  frInputClass,
  frSelectClass,
} from "./fundraising-modals"

const CARD =
  "rounded-[6px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"

const SCHEDULE_OPTIONS: ReportSchedule[] = ["Daily", "Weekly", "Monthly", "On demand"]

export function FundraisingReports() {
  const [reports] = useState(FR_REPORTS)
  const [configureOpen, setConfigureOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [selected, setSelected] = useState<FrReport | null>(null)
  const [form, setForm] = useState({
    schedule: "Weekly" as ReportSchedule,
    recipients: "fundraising@nvccz.co.zw",
    format: "XLSX",
    dateRange: "Last 30 days",
  })

  const resultColumns = useMemo(
    () => (selected ? reportColumns(selected.sampleRows) : []),
    [selected],
  )

  function openConfigure(report: FrReport) {
    setSelected(report)
    setForm({
      schedule: report.schedule,
      recipients: "fundraising@nvccz.co.zw",
      format: "XLSX",
      dateRange: "Last 30 days",
    })
    setConfigureOpen(true)
  }

  function openResults(report: FrReport) {
    setSelected(report)
    setResultsOpen(true)
  }

  function runReport() {
    if (!selected) return
    setConfigureOpen(false)
    toast.success(`"${selected.name}" queued — mock run started`)
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] md:text-[22px]">Reports</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Fundraising progress, conversion and concentration reports
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <article key={report.id} className={cn(CARD, "flex flex-col p-4")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#ede9fe] text-[#7c3aed]">
                <FileBarChart className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "rounded-[4px] px-2 py-0.5 text-[10px] font-semibold",
                  categoryClass(report.category),
                )}
              >
                {report.category}
              </span>
            </div>
            <h2 className="mt-3 text-[14px] font-semibold text-[#0f172a]">{report.name}</h2>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed text-[#64748b]">
              {report.description}
            </p>
            <dl className="mt-3 space-y-1.5 border-t border-[#f1f5f9] pt-3 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-[#94a3b8]">
                  <Calendar className="h-3 w-3" /> Schedule
                </dt>
                <dd className="font-medium text-[#0f172a]">{report.schedule}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#94a3b8]">Last run</dt>
                <dd className="text-[#64748b]">{report.lastRun}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#94a3b8]">Owner</dt>
                <dd className="text-[#64748b]">{report.owner}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-8 flex-1 rounded-full text-[11px]"
                onClick={() => openResults(report)}
              >
                View last run
              </Button>
              <Button
                variant="gradient-info" className="rounded-full h-8 flex-1 text-[11px] shadow-sm font-semibold gap-1.5"
                onClick={() => openConfigure(report)}
              >
                <Settings className="h-3.5 w-3.5" /> Configure & run
              </Button>
            </div>
          </article>
        ))}
      </div>

      <FrDialogShell
        open={configureOpen}
        onOpenChange={setConfigureOpen}
        title={selected ? `Configure — ${selected.name}` : "Configure report"}
        description="Schedule, recipients and output format"
        size="md"
        footer={
          <FrFormFooter
            onCancel={() => setConfigureOpen(false)}
            onSubmit={runReport}
            submitLabel="Run now"
          />
        }
      >
        <div className="space-y-3">
          <FrField label="Schedule">
            <select
              className={frSelectClass}
              value={form.schedule}
              onChange={(e) =>
                setForm((p) => ({ ...p, schedule: e.target.value as ReportSchedule }))
              }
            >
              {SCHEDULE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FrField>
          <FrField label="Recipients">
            <input
              className={frInputClass}
              value={form.recipients}
              onChange={(e) => setForm((p) => ({ ...p, recipients: e.target.value }))}
            />
          </FrField>
          <FrField label="Format">
            <select
              className={frSelectClass}
              value={form.format}
              onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
            >
              <option value="XLSX">Excel (.xlsx)</option>
              <option value="PDF">PDF</option>
              <option value="CSV">CSV</option>
            </select>
          </FrField>
          <FrField label="Date range">
            <select
              className={frSelectClass}
              value={form.dateRange}
              onChange={(e) => setForm((p) => ({ ...p, dateRange: e.target.value }))}
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="Quarter to date">Quarter to date</option>
              <option value="Campaign to date">Campaign to date</option>
            </select>
          </FrField>
        </div>
      </FrDialogShell>

      <FrDialogShell
        open={resultsOpen}
        onOpenChange={setResultsOpen}
        title={selected ? `Last run — ${selected.name}` : "Last run results"}
        description={selected?.lastRun}
        size="xl"
        footer={
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full px-4"
            onClick={() => {
              if (selected) openConfigure(selected)
              setResultsOpen(false)
            }}
          >
            <Play className="h-4 w-4" /> Run again
          </Button>
        }
      >
        {selected && selected.sampleRows.length > 0 ? (
          <div className="overflow-x-auto rounded-[6px] border border-[#f1f5f9]">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                  {resultColumns.map((col) => (
                    <th key={col} className="px-3 py-2 text-[11px] font-semibold text-[#94a3b8]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.sampleRows.map((row, i) => (
                  <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                    {resultColumns.map((col) => (
                      <td key={col} className="px-3 py-2 text-[11px] text-[#0f172a]">
                        {row[col] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-[12px] text-[#94a3b8]">No sample data available.</p>
        )}
      </FrDialogShell>
    </div>
  )
}
