"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setConfigDrawerOpen, createConfig, updateConfig } from "@/lib/store/slices/streetRatesSlice"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { JsonPreview } from "./json-preview"
import { CURRENCIES } from "./format"
import { toast } from "sonner"

const CONTEXTS = ["GENERIC", "DASHBOARD_ACCOUNTING", "DASHBOARD_PORTFOLIO", "DASHBOARD_CEO", "PRICING_LISTED_EQUITY", "LP_PORTAL"]
const SOURCES = ["ZIMRATE_STREET", "ZIMRATE_OFFICIAL"]

interface ConfigFormData {
  contextCode: string
  fromCurrencyCode: string
  toCurrencyCode: string
  primarySourceCode: string
  comparisonSourceCode: string
  decimals: number
  showBidAsk: boolean
  showSpread: boolean
  labelTemplate: string
  showChangePct: boolean
  sortOrder: number
  isActive: boolean
}

const EMPTY_FORM: ConfigFormData = {
  contextCode: "GENERIC",
  fromCurrencyCode: "USD",
  toCurrencyCode: "ZWG",
  primarySourceCode: "ZIMRATE_STREET",
  comparisonSourceCode: "ZIMRATE_OFFICIAL",
  decimals: 2,
  showBidAsk: true,
  showSpread: true,
  labelTemplate: "ZWG per 1 USD",
  showChangePct: true,
  sortOrder: 99,
  isActive: true,
}

export function ConfigEditDrawer() {
  const dispatch = useAppDispatch()
  const { configDrawerOpen, configDrawerTarget } = useAppSelector((s) => s.streetRates)
  const [form, setForm] = useState<ConfigFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (configDrawerTarget) {
      setForm({
        contextCode: configDrawerTarget.contextCode,
        fromCurrencyCode: configDrawerTarget.fromCurrencyCode,
        toCurrencyCode: configDrawerTarget.toCurrencyCode,
        primarySourceCode: configDrawerTarget.primarySourceCode,
        comparisonSourceCode: configDrawerTarget.comparisonSourceCode,
        decimals: configDrawerTarget.displayFormat.decimals,
        showBidAsk: configDrawerTarget.displayFormat.showBidAsk,
        showSpread: configDrawerTarget.displayFormat.showSpread,
        labelTemplate: configDrawerTarget.displayFormat.labelTemplate,
        showChangePct: configDrawerTarget.displayFormat.showChangePct,
        sortOrder: configDrawerTarget.sortOrder,
        isActive: configDrawerTarget.isActive,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [configDrawerTarget])

  const field = <K extends keyof ConfigFormData>(key: K, value: ConfigFormData[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const displayFormatPreview = {
    decimals: form.decimals,
    showBidAsk: form.showBidAsk,
    showSpread: form.showSpread,
    labelTemplate: form.labelTemplate,
    showChangePct: form.showChangePct,
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        contextCode: form.contextCode,
        fromCurrencyCode: form.fromCurrencyCode,
        toCurrencyCode: form.toCurrencyCode,
        primarySourceCode: form.primarySourceCode,
        comparisonSourceCode: form.comparisonSourceCode,
        displayFormat: displayFormatPreview,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      }
      if (configDrawerTarget) {
        await dispatch(updateConfig({ id: configDrawerTarget.id, data: payload })).unwrap()
        toast.success(`${form.contextCode} configuration updated`)
      } else {
        await dispatch(createConfig(payload)).unwrap()
        toast.success(`${form.contextCode} configuration created`)
      }
    } catch (err: any) {
      toast.error("Save failed", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={configDrawerOpen} onOpenChange={(open) => dispatch(setConfigDrawerOpen(open))}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{configDrawerTarget ? `Edit ${configDrawerTarget.contextCode}` : "New Display Configuration"}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Context</Label>
              <Select value={form.contextCode} onValueChange={(v) => field("contextCode", v)} disabled={!!configDrawerTarget}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEXTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => field("sortOrder", Number(e.target.value))}
                className="h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">From Currency</Label>
              <Select value={form.fromCurrencyCode} onValueChange={(v) => field("fromCurrencyCode", v)}>
                <SelectTrigger className="h-8 font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Currency</Label>
              <Select value={form.toCurrencyCode} onValueChange={(v) => field("toCurrencyCode", v)}>
                <SelectTrigger className="h-8 font-mono"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Primary Source</Label>
              <Select value={form.primarySourceCode} onValueChange={(v) => field("primarySourceCode", v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Comparison Source</Label>
              <Select value={form.comparisonSourceCode} onValueChange={(v) => field("comparisonSourceCode", v)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Display Format</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Decimals</Label>
                <Input
                  type="number"
                  min={0} max={6}
                  value={form.decimals}
                  onChange={(e) => field("decimals", Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label Template</Label>
                <Input
                  value={form.labelTemplate}
                  onChange={(e) => field("labelTemplate", e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Bid/Ask</Label>
              <Switch checked={form.showBidAsk} onCheckedChange={(v) => field("showBidAsk", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Spread</Label>
              <Switch checked={form.showSpread} onCheckedChange={(v) => field("showSpread", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show Change %</Label>
              <Switch checked={form.showChangePct} onCheckedChange={(v) => field("showChangePct", v)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <JsonPreview value={displayFormatPreview} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Active</Label>
            <Switch checked={form.isActive} onCheckedChange={(v) => field("isActive", v)} />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => dispatch(setConfigDrawerOpen(false))}>
              Cancel
            </Button>
            <Button className="flex-1 gradient-primary text-white" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : configDrawerTarget ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
