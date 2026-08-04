"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Info,
  MoreHorizontal,
  Plus,
  Scale,
  Search,
  Settings,
  Upload,
  UploadCloud,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  AcButton,
  AcCard,
  AcSelectInput,
} from "@/components/accounting-mock/primitives"
import {
  acJournalApprovers,
  acJournalAudit,
  acJournalCurrencyOptions,
  acJournalDateOptions,
  acJournalDeptOptions,
  acJournalEntityOptions,
  acJournalLines,
  acJournalMakerChecker,
  acJournalMeta,
  acJournalPeriodOptions,
  acJournalSourceOptions,
  acJournalSteps,
  acJournalTaxOptions,
  acJournalTotals,
  acJournalValidations,
  acJournalVersions,
} from "@/lib/accounting-mock/fixtures-journal"
import { cn } from "@/lib/utils"

function AcRequiredLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <p className="text-[10px] text-[#6B7280] mb-1">
      {label}
      {required && <span className="text-[#DC2626]"> *</span>}
    </p>
  )
}

function AcTextInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-8 px-2.5 rounded-md border border-[#E5E7EB] bg-white text-[11px] text-[#374151] placeholder:text-[#9CA3AF] outline-none focus:border-[#2563EB]",
        className
      )}
    />
  )
}

function AcStepper() {
  return (
    <div className="flex items-center gap-2">
      {acJournalSteps.map((s, i) => (
        <div key={s.step} className="flex items-center gap-2 min-w-0 first:flex-none flex-1 last:flex-none">
          {i > 0 && (
            <span
              className={cn(
                "h-px flex-1 min-w-[24px]",
                s.state === "todo" ? "border-t border-dashed border-[#D1D5DB]" : "bg-[#2563EB] h-[2px]"
              )}
            />
          )}
          <span
            className={cn(
              "h-6 w-6 shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-bold",
              s.state === "done" && "bg-[#2563EB] text-white",
              s.state === "current" && "border-[1.5px] border-[#F59E0B] text-[#F59E0B] bg-white",
              s.state === "todo" && "border border-[#D1D5DB] text-[#9CA3AF] bg-white"
            )}
          >
            {s.step}
          </span>
          <span
            className={cn(
              "text-[12px] whitespace-nowrap",
              s.state === "done" && "font-semibold text-[#0B1739]",
              s.state === "current" && "font-bold text-[#F59E0B]",
              s.state === "todo" && "text-[#9CA3AF]"
            )}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function JournalEntryScreen() {
  const router = useRouter()
  const [entity, setEntity] = useState(acJournalMeta.entity)
  const [journalDate, setJournalDate] = useState(acJournalMeta.journalDate)
  const [period, setPeriod] = useState(acJournalMeta.postingPeriod)
  const [source, setSource] = useState(acJournalMeta.source)
  const [description, setDescription] = useState(acJournalMeta.description)
  const [reference, setReference] = useState(acJournalMeta.reference)
  const [dept, setDept] = useState(acJournalMeta.department)
  const [currency, setCurrency] = useState(acJournalMeta.currency)
  const [memo, setMemo] = useState("")
  const [hasAttachment, setHasAttachment] = useState(true)
  const [activeVersion, setActiveVersion] = useState(acJournalVersions[0].version)

  return (
    <div className="p-4 lg:p-5">
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <button
            type="button"
            onClick={() => router.push("/accounting-v2/general-ledger")}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#2563EB] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Journal Entries
          </button>

          <div className="flex items-center gap-2.5">
            <h1 className="text-[19px] font-bold text-[#0B1739] tracking-tight">
              New Journal <span className="text-[#6B7280] font-bold">·</span> {acJournalMeta.id}
            </h1>
            <span className="inline-flex items-center px-2 py-[3px] rounded-[4px] bg-[#EEF1F5] text-[10px] font-semibold text-[#4B5563]">
              {acJournalMeta.status}
            </span>
          </div>

          <AcStepper />

          {/* Journal header form */}
          <AcCard className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3">
              <div>
                <AcRequiredLabel label="Entity" />
                <AcSelectInput value={entity} options={acJournalEntityOptions} onChange={setEntity} />
              </div>
              <div>
                <AcRequiredLabel label="Journal Date" required />
                <AcSelectInput
                  value={journalDate}
                  options={acJournalDateOptions}
                  onChange={setJournalDate}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              </div>
              <div>
                <AcRequiredLabel label="Posting Period" required />
                <AcSelectInput value={period} options={acJournalPeriodOptions} onChange={setPeriod} />
              </div>
              <div>
                <AcRequiredLabel label="Source" required />
                <AcSelectInput value={source} options={acJournalSourceOptions} onChange={setSource} />
              </div>
              <div>
                <AcRequiredLabel label="Description" required />
                <AcTextInput value={description} onChange={setDescription} />
              </div>
              <div>
                <AcRequiredLabel label="Reference" />
                <AcTextInput value={reference} onChange={setReference} />
              </div>
              <div>
                <AcRequiredLabel label="Department" />
                <AcSelectInput value={dept} options={acJournalDeptOptions} onChange={setDept} />
              </div>
              <div>
                <AcRequiredLabel label="Currency" required />
                <AcSelectInput value={currency} options={acJournalCurrencyOptions} onChange={setCurrency} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
              <div>
                <AcRequiredLabel label="Supporting Document" />
                {hasAttachment ? (
                  <div className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-[#E5E7EB] bg-white">
                    <FileText className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
                    <button
                      type="button"
                      onClick={() => toast(acJournalMeta.attachment, { description: "Preview attachment (mock)" })}
                      className="text-[11px] font-medium text-[#2563EB] hover:underline truncate"
                    >
                      {acJournalMeta.attachment}
                    </button>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">{acJournalMeta.attachmentSize}</span>
                    <button
                      type="button"
                      aria-label="Remove attachment"
                      onClick={() => {
                        setHasAttachment(false)
                        toast("Attachment removed")
                      }}
                      className="ml-auto text-[#9CA3AF] hover:text-[#DC2626] shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHasAttachment(true)
                      toast("Attachment restored")
                    }}
                    className="flex items-center gap-2 h-8 w-full px-2.5 rounded-md border border-dashed border-[#E5E7EB] text-[11px] text-[#9CA3AF] hover:border-[#2563EB]"
                  >
                    <Upload className="h-3.5 w-3.5" /> Attach a supporting document
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => toast("Upload", { description: "File picker (mock)" })}
                className="flex flex-col items-center justify-center gap-0.5 h-[52px] rounded-md border border-dashed border-[#C7D2E5] bg-[#FBFCFE] hover:border-[#2563EB]"
              >
                <span className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-[11px] font-semibold text-[#0B1739]">Drag &amp; drop files here</span>
                </span>
                <span className="text-[10px] text-[#2563EB]">or click to browse</span>
              </button>
            </div>
          </AcCard>

          {/* Journal lines */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0B1739] tracking-tight">
                Journal Lines
                <Info className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </h2>
              <div className="flex items-center gap-2">
                <AcButton variant="cobaltOutline" onClick={() => toast("Add line", { description: "Line 6 added (mock)" })}>
                  <Plus className="h-3.5 w-3.5" /> Add line
                </AcButton>
                <AcButton variant="cobaltOutline" onClick={() => toast("Import from Excel", { description: "XLSX importer (mock)" })}>
                  <Upload className="h-3.5 w-3.5" /> Import from Excel
                </AcButton>
              </div>
            </div>

            <AcCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[#6B7280] border-b border-[#EEF1F5]">
                      <th className="px-3 py-2.5 text-left font-normal w-10">Line</th>
                      <th className="px-3 py-2.5 text-left font-normal min-w-[170px]">
                        Account<span className="text-[#DC2626]"> *</span>
                      </th>
                      <th className="px-3 py-2.5 text-left font-normal min-w-[150px]">Description</th>
                      <th className="px-3 py-2.5 text-left font-normal min-w-[110px]">Department</th>
                      <th className="px-3 py-2.5 text-left font-normal min-w-[90px]">Project</th>
                      <th className="px-3 py-2.5 text-left font-normal min-w-[140px]">Tax</th>
                      <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Debit (USD)</th>
                      <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap">Credit (USD)</th>
                      <th className="px-3 py-2.5 text-right font-normal w-10">
                        <button
                          type="button"
                          aria-label="Column settings"
                          onClick={() => toast("Column settings")}
                          className="text-[#9CA3AF] hover:text-[#0B1739]"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {acJournalLines.map((l) => (
                      <tr key={l.line} className="border-b border-[#EEF1F5]">
                        <td className="px-3 py-2.5 text-center text-[#374151]">{l.line}</td>
                        <td className="px-3 py-2 border-r border-[#EEF1F5]">
                          <div className="flex items-center gap-2">
                            <span className="min-w-0">
                              <span className="block text-[11px] font-medium text-[#2563EB]">{l.code}</span>
                              <span className="block text-[10px] text-[#6B7280] truncate">{l.account}</span>
                            </span>
                            <button
                              type="button"
                              aria-label={`Look up account for line ${l.line}`}
                              onClick={() => toast("Account lookup", { description: `${l.code} · ${l.account}` })}
                              className="ml-auto text-[#9CA3AF] hover:text-[#2563EB] shrink-0"
                            >
                              <Search className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[#374151] border-r border-[#EEF1F5]">{l.desc}</td>
                        <td className="px-3 py-2 border-r border-[#EEF1F5]">
                          <AcSelectInput value={l.dept} options={acJournalDeptOptions} className="w-[104px]" />
                        </td>
                        <td className="px-3 py-2.5 text-[#6B7280] border-r border-[#EEF1F5]">{l.project}</td>
                        <td className="px-3 py-2 border-r border-[#EEF1F5]">
                          <AcSelectInput value={l.tax} options={acJournalTaxOptions} className="w-[134px]" />
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739] border-r border-[#EEF1F5]">
                          {l.debit}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-[#0B1739]">{l.credit}</td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            aria-label={`Line ${l.line} actions`}
                            onClick={() => toast("Line actions", { description: `Line ${l.line} · ${l.account}` })}
                            className="text-[#9CA3AF] hover:text-[#0B1739]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Empty entry row */}
                    <tr className="bg-[#FBFCFE]">
                      <td className="px-3 py-2.5 text-center text-[#374151]">{acJournalLines.length + 1}</td>
                      <td className="px-3 py-2 border-r border-[#EEF1F5]">
                        <AcTextInput value="" placeholder="Search account code or name" />
                      </td>
                      <td className="px-3 py-2 border-r border-[#EEF1F5]">
                        <AcTextInput value="" placeholder="Enter description" />
                      </td>
                      <td className="px-3 py-2 border-r border-[#EEF1F5]">
                        <AcSelectInput value="Select dept." options={["Select dept.", ...acJournalDeptOptions]} className="w-[104px]" />
                      </td>
                      <td className="px-3 py-2 border-r border-[#EEF1F5]">
                        <AcSelectInput value="Select project" options={["Select project", "PRJ-001", "PRJ-002"]} className="w-[104px]" />
                      </td>
                      <td className="px-3 py-2 border-r border-[#EEF1F5]">
                        <AcSelectInput value="Select tax code" options={["Select tax code", ...acJournalTaxOptions]} className="w-[134px]" />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#9CA3AF] border-r border-[#EEF1F5]">0.00</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[#9CA3AF]">0.00</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-t border-[#EEF1F5]">
                <div className="rounded-md border border-[#E5E7EB] p-3">
                  <p className="text-[10px] text-[#6B7280] mb-1.5">Memo</p>
                  <AcTextInput value={memo} onChange={setMemo} placeholder="Add a memo (optional)" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#E5E7EB] px-4 py-3">
                  <span className="text-[12px] font-semibold text-[#0B1739]">Totals</span>
                  <div className="text-center">
                    <p className="text-[10px] text-[#6B7280]">Debit (USD)</p>
                    <p className="text-[14px] font-bold tabular-nums text-[#0B1739]">{acJournalTotals.debit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#6B7280]">Credit (USD)</p>
                    <p className="text-[14px] font-bold tabular-nums text-[#0B1739]">{acJournalTotals.credit}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#93B4F7] bg-[#EFF6FF] text-[12px] font-semibold text-[#2563EB]">
                    <Scale className="h-3.5 w-3.5" /> {acJournalTotals.state}
                  </span>
                </div>
              </div>
            </AcCard>
          </div>
        </div>

        {/* Validation & controls rail */}
        <AcCard className="w-full xl:w-[320px] shrink-0 overflow-hidden">
          <div className="px-4 py-4">
            <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight mb-3">Validation &amp; Controls</h2>
            <div className="space-y-2.5">
              {acJournalValidations.map((v) => (
                <div key={v.label} className="flex items-start gap-2">
                  {v.tone === "ok" ? (
                    <span className="mt-[1px] h-4 w-4 shrink-0 rounded-full bg-[#2563EB] inline-flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                    </span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="mt-[1px] h-4 w-4 shrink-0 text-[#F59E0B]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                  )}
                  <span className="text-[11px] text-[#374151] leading-snug flex-1">{v.label}</span>
                  {v.value && (
                    <span className="text-[11px] font-semibold tabular-nums text-[#0B1739] shrink-0">{v.value}</span>
                  )}
                  {v.tone === "warn" && (
                    <button
                      type="button"
                      aria-label="Review withholding tax treatment"
                      onClick={() => toast("Withholding tax", { description: "Requires reviewer confirmation (mock)" })}
                      className="text-[#9CA3AF] hover:text-[#0B1739] shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-4 border-t border-[#EEF1F5]">
            <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight mb-3">Approval chain</h2>
            <div className="space-y-1">
              {acJournalApprovers.map((a, i) => (
                <div key={a.initials} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className={cn(
                        "h-8 w-8 rounded-full inline-flex items-center justify-center text-[11px] font-bold",
                        a.active ? "bg-[#2563EB] text-white" : "bg-[#EEF1F5] text-[#6B7280]"
                      )}
                    >
                      {a.initials}
                    </span>
                    {i < acJournalApprovers.length - 1 && (
                      <span
                        className={cn(
                          "w-px h-8 my-1",
                          a.active ? "bg-[#2563EB]" : "bg-[#E5E7EB]"
                        )}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#0B1739] truncate">{a.name}</p>
                        <p className="text-[10px] text-[#6B7280]">{a.role}</p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] shrink-0",
                          a.active ? "font-semibold text-[#2563EB]" : "text-[#9CA3AF]"
                        )}
                      >
                        {a.state}
                      </span>
                    </div>
                    {a.stamp && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                        <Calendar className="h-3 w-3 text-[#9CA3AF]" /> {a.stamp}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-md bg-[#F5F8FC] px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-[#6B7280] shrink-0 mt-[1px]" />
              <p className="text-[10px] leading-snug">
                <span className="block font-semibold text-[#0B1739]">{acJournalMakerChecker.title}</span>
                <span className="block text-[#6B7280]">{acJournalMakerChecker.body}</span>
              </p>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-[#EEF1F5]">
            <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight mb-2">Version history</h2>
            <div className="space-y-1">
              {acJournalVersions.map((v) => (
                <button
                  key={v.version}
                  type="button"
                  onClick={() => {
                    setActiveVersion(v.version)
                    toast(`${v.version} · ${v.label}`, { description: `${v.user} · ${v.stamp}` })
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-md border text-left",
                    activeVersion === v.version
                      ? "border-[#93B4F7] bg-[#F5F9FF]"
                      : "border-transparent hover:bg-[#F5F8FC]"
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold tabular-nums w-8 shrink-0",
                      activeVersion === v.version ? "text-[#2563EB]" : "text-[#0B1739]"
                    )}
                  >
                    {v.version}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] flex-1 min-w-0 truncate",
                      activeVersion === v.version ? "font-semibold text-[#2563EB]" : "text-[#6B7280]"
                    )}
                  >
                    {v.label}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] shrink-0">{v.user}</span>
                  <span className="text-[10px] text-[#9CA3AF] shrink-0 tabular-nums">{v.stamp}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => toast("Version history", { description: "Full history (mock)" })}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 text-[11px] font-medium text-[#2563EB] hover:underline"
            >
              View full history <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="px-4 py-4 border-t border-[#EEF1F5]">
            <h2 className="text-[13px] font-bold text-[#0B1739] tracking-tight mb-2">Audit information</h2>
            {acJournalAudit.map((a) => (
              <div key={a.label} className="flex items-center justify-between gap-3 py-1">
                <span className="text-[11px] text-[#6B7280]">{a.label}</span>
                <span className="text-[11px] text-[#0B1739]">{a.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="text-[11px] text-[#6B7280]">Status</span>
              <span className="inline-flex items-center px-2.5 py-[3px] rounded-[4px] border border-[#93B4F7] bg-[#F5F9FF] text-[10px] font-bold text-[#2563EB]">
                {acJournalMeta.status}
              </span>
            </div>
          </div>
        </AcCard>
      </div>

      <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-end gap-2">
        <AcButton variant="cobaltOutline" className="h-9 px-5" onClick={() => toast.success("Draft saved")}>
          Save draft
        </AcButton>
        <AcButton
          className="bg-[#2563EB] hover:bg-[#1D4ED8] h-9 px-5"
          onClick={() => toast.success("Submitted for review", { description: "Routed to Rudo Chikore" })}
        >
          Submit for review
        </AcButton>
      </div>
    </div>
  )
}
