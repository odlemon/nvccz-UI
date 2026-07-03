"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { ExchangeCode, Security } from "@/lib/investments/mock-data"

const EXCHANGES: ExchangeCode[] = ["ZSE", "VFEX", "SECZIM", "NYSE", "NASDAQ", "LSE"]
const CURRENCIES = ["USD", "GBP", "ZWG", "ZAR", "EUR"]

type Draft = {
  symbol: string
  name: string
  exchangeCode: ExchangeCode
  listingCurrencyCode: string
  isin: string
  isActive: boolean
}

const EMPTY: Draft = {
  symbol: "",
  name: "",
  exchangeCode: "ZSE",
  listingCurrencyCode: "USD",
  isin: "",
  isActive: true,
}

export function SecurityFormDialog({
  open,
  onOpenChange,
  security,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  security?: Security | null
}) {
  const isEdit = Boolean(security)
  const [draft, setDraft] = useState<Draft>(EMPTY)

  useEffect(() => {
    if (open) {
      setDraft(
        security
          ? {
              symbol: security.symbol,
              name: security.name,
              exchangeCode: security.exchangeCode,
              listingCurrencyCode: security.listingCurrencyCode,
              isin: security.isin ?? "",
              isActive: security.isActive,
            }
          : EMPTY,
      )
    }
  }, [open, security])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const valid = draft.symbol.trim() && draft.name.trim()

  function submit() {
    if (!valid) {
      toast.error("Symbol and name are required")
      return
    }
    toast.success(isEdit ? `Updated ${draft.symbol}` : `Created ${draft.symbol}`, {
      description: `${draft.name} · ${draft.exchangeCode} · ${draft.listingCurrencyCode}`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit security" : "Add security"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update reference data for this instrument."
              : "Register a new tradable instrument in the securities master."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="Symbol"
              value={draft.symbol}
              onChange={(v) => set("symbol", v.toUpperCase())}
              placeholder="ECO.ZW"
              mono
            />
            <LabeledInput
              label="ISIN"
              value={draft.isin}
              onChange={(v) => set("isin", v.toUpperCase())}
              placeholder="ZW0009011983"
              mono
            />
          </div>
          <LabeledInput
            label="Name"
            value={draft.name}
            onChange={(v) => set("name", v)}
            placeholder="Econet Wireless Zimbabwe"
          />
          <div className="grid grid-cols-2 gap-3">
            <LabeledSelect
              label="Exchange"
              value={draft.exchangeCode}
              onChange={(v) => set("exchangeCode", v as ExchangeCode)}
              options={EXCHANGES}
            />
            <LabeledSelect
              label="Listing currency"
              value={draft.listingCurrencyCode}
              onChange={(v) => set("listingCurrencyCode", v)}
              options={CURRENCIES}
            />
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Active for trading</p>
              <p className="text-[11px] text-muted-foreground">Inactive instruments are hidden from the order ticket.</p>
            </div>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-5 w-5 rounded border-border accent-[var(--primary)]"
            />
          </label>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isEdit ? "Save changes" : "Create security"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary ${mono ? "font-mono" : ""}`}
      />
    </label>
  )
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
