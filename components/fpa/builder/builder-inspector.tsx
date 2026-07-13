"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Expand,
  Loader2,
  Minimize2,
  Settings2,
  Table2,
} from "lucide-react"
import type { FpaLineItem } from "@/lib/api/fpa-api"
import { lineItemKind } from "@/components/fpa/grid/cell-state"
import { cn } from "@/lib/utils"

type RefRow = {
  name: string
  path: string
}

type Props = {
  selected: FpaLineItem | null
  expression: string
  onExpressionChange: (v: string) => void
  canEdit: boolean
  busy: boolean
  formulaValid: boolean | null
  formulaMessage: string | null
  impact: unknown
  dimensionTags?: string[]
  modulePath?: string | null
  onValidateFormula: () => void
  onSaveFormula: () => void
  onSelectReference?: (name: string) => void
  onPersistProperties?: (patch: {
    name?: string
    description?: string
    format?: string
    currency?: string | null
    displayScale?: number
    summaryMethod?: string
  }) => void
}

const DEFAULT_DIMS = ["Time", "Product", "Region", "Customer Segment", "Version"]

const FORMAT_OPTIONS = ["Number", "Currency", "Percent", "Integer"]
const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "ZAR"]
const DECIMAL_OPTIONS = ["0", "1", "2", "3", "4"]
const SUMMARY_OPTIONS = ["Sum", "Average", "Last", "First", "None"]

export function BuilderInspector({
  selected,
  expression,
  onExpressionChange,
  canEdit,
  busy,
  formulaValid,
  formulaMessage,
  impact,
  dimensionTags,
  modulePath,
  onValidateFormula,
  onSaveFormula,
  onSelectReference,
  onPersistProperties,
}: Props) {
  const [tab, setTab] = useState<"properties" | "formula" | "references">("properties")
  const [usedInOpen, setUsedInOpen] = useState(false)
  const [formulaExpanded, setFormulaExpanded] = useState(false)
  const [dimTipOpen, setDimTipOpen] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState("Number")
  const [currency, setCurrency] = useState("USD")
  const [decimals, setDecimals] = useState("0")
  const [summary, setSummary] = useState("Sum")

  const persist = (patch: Parameters<NonNullable<Props["onPersistProperties"]>>[0]) => {
    if (!selected || selected.id.startsWith("demo-")) return
    onPersistProperties?.(patch)
  }

  useEffect(() => {
    if (!selected) return
    setTab("properties")
    setName(selected.name)
    setDescription(selected.description || demoDescription(selected))
    setFormat(selected.format || "Number")
    setCurrency(selected.currency || selected.currencyCode || "USD")
    setDecimals(String(selected.displayScale ?? selected.decimalPlaces ?? 0))
    setSummary(selected.summaryMethod || "Sum")
    setUsedInOpen(false)
    setFormulaExpanded(false)
  }, [selected?.id])

  const kind = selected ? lineItemKind(selected) : "INPUT"
  const dims = dimensionTags?.length ? dimensionTags : DEFAULT_DIMS
  const path = modulePath || "Revenue Planning / Units & Pricing"

  const refs = useMemo(() => parseFormulaRefs(expression, path), [expression, path])
  const impactObj = impact as {
    precedents?: Array<{ code?: string; name?: string; module?: string }>
    dependents?: Array<{ code?: string; name?: string }>
    usedIn?: Array<{ code?: string; name?: string }>
  } | null
  const usedInApi = impactObj?.usedIn || impactObj?.dependents || []
  const usedIn =
    usedInApi.length > 0
      ? usedInApi.map((u) => ({ name: u.name || u.code || "—", path }))
      : demoUsedIn(selected?.name)

  if (!selected) {
    return (
      <aside className="h-full rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-5 text-[13px] text-[#94a3b8]">
        Select a line item to edit properties and formulas.
      </aside>
    )
  }

  const tabs = [
    { id: "properties" as const, label: "Properties" },
    { id: "formula" as const, label: "Formula Editor" },
    { id: "references" as const, label: "References" },
  ]

  const showProps = tab === "properties" || tab === "formula"
  const showFormulaBlock = kind === "CALCULATED" && (tab === "properties" || tab === "formula")
  const showRefsBlock = tab === "properties" || tab === "references"

  return (
    <aside
      id="fpa-builder-inspector"
      className="h-full min-h-0 flex flex-col rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden"
    >
      {/* Tabs */}
      <div className="flex border-b border-[#e2e8f0] px-3 gap-1 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 px-2.5 text-[12px] font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              tab === t.id
                ? "border-[#2563eb] text-[#2563eb]"
                : "border-transparent text-[#64748b] hover:text-[#334155]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="fpa-thin-scroll flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
        {showProps && (
          <>
            <Field label="Line Item">
              <input
                className={inputClass}
                value={name}
                disabled={!canEdit}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  if (name.trim() && name !== selected?.name) persist({ name: name.trim() })
                }}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={2}
                className={cn(inputClass, "h-auto py-2 resize-none leading-snug")}
                value={description}
                disabled={!canEdit}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => persist({ description })}
              />
            </Field>

            {tab === "properties" && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Format">
                    <NativeSelect
                      value={format}
                      disabled={!canEdit}
                      options={FORMAT_OPTIONS}
                      onChange={(v) => {
                        setFormat(v)
                        persist({ format: v })
                      }}
                    />
                  </Field>
                  <Field label="Currency">
                    <NativeSelect
                      value={currency}
                      disabled={!canEdit}
                      options={CURRENCY_OPTIONS}
                      onChange={(v) => {
                        setCurrency(v)
                        persist({ currency: v })
                      }}
                    />
                  </Field>
                </div>

                <Field label="Decimal Places">
                  <NativeSelect
                    value={decimals}
                    disabled={!canEdit}
                    options={DECIMAL_OPTIONS}
                    onChange={(v) => {
                      setDecimals(v)
                      persist({ displayScale: Number(v) })
                    }}
                  />
                </Field>

                <Field label="Summary Method">
                  <NativeSelect
                    value={summary}
                    disabled={!canEdit}
                    options={SUMMARY_OPTIONS}
                    onChange={(v) => {
                      setSummary(v)
                      persist({ summaryMethod: v.toUpperCase() })
                    }}
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-medium text-[#64748b]">Dimensionality</p>
                    <div className="relative">
                      <button
                        type="button"
                        className="p-1 rounded-md text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f8fafc]"
                        aria-label="Dimensionality settings"
                        onClick={() => setDimTipOpen((v) => !v)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                      {dimTipOpen ? (
                        <div className="absolute right-0 top-7 z-20 w-52 rounded-[8px] border border-[#e2e8f0] bg-white p-2.5 text-[11px] text-[#475569] shadow-lg">
                          Dimensions applied to this line item. Backend dimension APIs will manage
                          membership; for now tags reflect the model catalog.
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dims.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-medium text-[#475569]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[#64748b] mb-1.5">Data Type</p>
                  <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0f172a]">
                    {kind === "CALCULATED" ? (
                      <>
                        <span className="text-[#2563eb] text-[12px] font-bold italic leading-none">
                          ƒ<sub className="text-[9px]">x</sub>
                        </span>
                        Calculated
                      </>
                    ) : (
                      <>
                        <span className="text-[#64748b] text-[12px] font-semibold">123</span>
                        Input
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {showFormulaBlock && (
          <div>
            {tab === "formula" ? (
              <p className="text-[11px] font-medium text-[#64748b] mb-1.5">Formula</p>
            ) : null}
            <FormulaEditorBox
              expression={expression}
              onChange={onExpressionChange}
              canEdit={canEdit && (tab === "formula" || tab === "properties")}
              formulaValid={formulaValid}
              formulaMessage={formulaMessage}
              busy={busy}
              onValidate={onValidateFormula}
              onExpand={() => setFormulaExpanded(true)}
              compact={tab === "properties"}
            />
            {tab === "formula" && (
              <button
                type="button"
                disabled={!canEdit || busy}
                onClick={onSaveFormula}
                className="mt-2.5 h-8 w-full rounded-[6px] bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Formula
              </button>
            )}
          </div>
        )}

        {showRefsBlock && (
          <div>
            <p className="text-[12px] font-semibold text-[#0f172a] mb-2">References</p>
            {refs.length === 0 ? (
              <p className="text-[12px] text-[#94a3b8]">
                {kind === "INPUT" ? "Input rows have no formula references." : "No references yet."}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {refs.map((r) => (
                  <li key={r.name}>
                    <button
                      type="button"
                      className="w-full text-left flex items-start gap-2 group"
                      onClick={() => onSelectReference?.(r.name)}
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#dcfce7] text-[#16a34a] shrink-0">
                        <Table2 className="w-3 h-3" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-[#0f172a] group-hover:text-[#2563eb]">
                          {r.name}
                        </span>
                        <span className="block text-[11px] text-[#94a3b8] truncate">{r.path}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="mt-3 flex w-full items-center gap-1 text-[12px] font-medium text-[#0f172a]"
              onClick={() => setUsedInOpen((v) => !v)}
            >
              {usedInOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#64748b]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
              )}
              Used In ({usedIn.length})
            </button>
            {usedInOpen && (
              <ul className="mt-2 ml-1 space-y-2 border-l border-[#e2e8f0] pl-3">
                {usedIn.length === 0 ? (
                  <li className="text-[12px] text-[#94a3b8]">Not referenced elsewhere.</li>
                ) : (
                  usedIn.map((u) => (
                    <li key={u.name}>
                      <button
                        type="button"
                        className="w-full text-left group"
                        onClick={() => onSelectReference?.(u.name)}
                      >
                        <span className="block text-[12px] font-medium text-[#0f172a] group-hover:text-[#2563eb]">
                          {u.name}
                        </span>
                        <span className="block text-[11px] text-[#94a3b8]">{u.path}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#e2e8f0] px-4 py-3 text-[11px] text-[#94a3b8] space-y-1 shrink-0">
        <p>
          <span className="text-[#64748b]">Created:</span>{" "}
          {selected.createdAt
            ? new Date(selected.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
          {selected.createdByName ? ` by ${selected.createdByName}` : ""}
        </p>
        <p>
          <span className="text-[#64748b]">Last Modified:</span>{" "}
          {selected.updatedAt
            ? new Date(selected.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
          {selected.updatedByName ? ` by ${selected.updatedByName}` : ""}
        </p>
      </div>

      {formulaExpanded && (
        <FormulaExpandModal
          expression={expression}
          onChange={onExpressionChange}
          canEdit={canEdit}
          formulaValid={formulaValid}
          formulaMessage={formulaMessage}
          busy={busy}
          onValidate={onValidateFormula}
          onSave={onSaveFormula}
          onClose={() => setFormulaExpanded(false)}
        />
      )}
    </aside>
  )
}

const inputClass =
  "mt-1 w-full h-8 rounded-[6px] border border-[#e2e8f0] bg-white px-2.5 text-[12px] text-[#0f172a] outline-none focus:border-[#2563eb] disabled:bg-[#f8fafc] disabled:text-[#64748b]"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium text-[#64748b]">
      {label}
      {children}
    </label>
  )
}

function NativeSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="relative mt-1">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputClass,
          "appearance-none pr-8 cursor-pointer",
          "bg-[length:12px] bg-[right_10px_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]",
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function FormulaEditorBox({
  expression,
  onChange,
  canEdit,
  formulaValid,
  formulaMessage,
  busy,
  onValidate,
  onExpand,
  compact,
}: {
  expression: string
  onChange: (v: string) => void
  canEdit: boolean
  formulaValid: boolean | null
  formulaMessage: string | null
  busy: boolean
  onValidate: () => void
  onExpand: () => void
  compact?: boolean
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="rounded-[8px] border border-[#e2e8f0] bg-white overflow-hidden">
      <div className="relative">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 px-3 py-2.5 font-mono text-[12px] leading-5 whitespace-pre-wrap break-words overflow-hidden",
            compact ? "min-h-[64px]" : "min-h-[120px]",
          )}
        >
          <HighlightedFormula text={expression || " "} />
        </div>
        <textarea
          ref={taRef}
          className={cn(
            "relative w-full bg-transparent px-3 py-2 font-mono text-[12px] leading-5 text-transparent caret-[#0f172a] outline-none resize-none",
            compact ? "min-h-[64px]" : "min-h-[120px]",
          )}
          value={expression}
          disabled={!canEdit}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            const backdrop = e.currentTarget.previousElementSibling as HTMLElement | null
            if (backdrop) {
              backdrop.scrollTop = e.currentTarget.scrollTop
              backdrop.scrollLeft = e.currentTarget.scrollLeft
            }
          }}
        />
        {formulaValid === true && (
          <span className="absolute top-2 right-2 text-[#16a34a]" title="Valid">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        )}
        {formulaValid === false && (
          <span className="absolute top-2 right-2 text-[#dc2626] text-[10px] font-medium max-w-[40%] text-right">
            !
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 px-2.5 py-2 border-t border-[#f1f5f9]">
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={onValidate}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] bg-[#2563eb] px-2.5 text-[11px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Validate
        </button>

        {formulaValid === true && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            No issues
          </span>
        )}
        {formulaValid === false && (
          <span className="text-[11px] text-[#b91c1c] truncate">
            {formulaMessage || "Invalid formula"}
          </span>
        )}
        {formulaValid === null && (
          <span className="text-[11px] text-[#94a3b8]">Not validated</span>
        )}

        <button
          type="button"
          className="ml-auto p-1.5 rounded-[6px] text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#64748b]"
          aria-label="Expand formula editor"
          onClick={onExpand}
        >
          <Expand className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function FormulaExpandModal({
  expression,
  onChange,
  canEdit,
  formulaValid,
  formulaMessage,
  busy,
  onValidate,
  onSave,
  onClose,
}: {
  expression: string
  onChange: (v: string) => void
  canEdit: boolean
  formulaValid: boolean | null
  formulaMessage: string | null
  busy: boolean
  onValidate: () => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-xl rounded-xl border border-[#e2e8f0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
          <h4 className="text-[13px] font-semibold text-[#0f172a]">Formula Editor</h4>
          <button
            type="button"
            className="p-1.5 rounded-md text-[#64748b] hover:bg-[#f8fafc]"
            onClick={onClose}
            aria-label="Close"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <FormulaEditorBox
            expression={expression}
            onChange={onChange}
            canEdit={canEdit}
            formulaValid={formulaValid}
            formulaMessage={formulaMessage}
            busy={busy}
            onValidate={onValidate}
            onExpand={onClose}
            compact={false}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="h-8 rounded-[6px] border border-[#e2e8f0] px-3 text-[12px] font-medium text-[#475569]"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              disabled={!canEdit || busy}
              onClick={() => {
                onSave()
                onClose()
              }}
              className="h-8 rounded-[6px] bg-[#2563eb] px-3 text-[12px] font-medium text-white disabled:opacity-50"
            >
              Save Formula
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HighlightedFormula({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={i} className="text-[#c026d3] font-medium">
            {part}
          </span>
        ) : (
          <span key={i} className="text-[#0f172a]">
            {part}
          </span>
        ),
      )}
    </>
  )
}

function parseFormulaRefs(expression: string, path: string): RefRow[] {
  const matches = expression.match(/\[([^\]]+)\]/g) || []
  const names = [...new Set(matches.map((m) => m.slice(1, -1)))]
  return names.map((name) => ({ name, path }))
}

function demoDescription(li: FpaLineItem): string {
  const n = li.name.toLowerCase()
  if (n.includes("revenue") && !n.includes("net")) {
    return "Total revenue before discounts and adjustments."
  }
  if (n.includes("units")) return "Volume driver for revenue calculations."
  if (n.includes("price")) return "Average selling price per unit."
  if (n.includes("cogs")) return "Cost of goods sold for the period."
  if (n.includes("margin")) return "Gross margin as a percentage of revenue."
  return li.code ? `${li.name} (${li.code})` : li.name
}

function demoUsedIn(name?: string): RefRow[] {
  if (!name) return []
  const n = name.toLowerCase()
  if (n.includes("revenue") || n.includes("units") || n.includes("price")) {
    return [
      { name: "Net Revenue", path: "Revenue Planning / Revenue Summary" },
      { name: "Gross Profit", path: "Revenue Planning / Gross Profit Analysis" },
    ]
  }
  return [{ name: "Income Statement", path: "Financial Statements" }]
}
