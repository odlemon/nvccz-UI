"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Loader2, Plus, Trash2, CheckCircle2, AlertTriangle, Zap } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AppDispatch, RootState } from "@/lib/store/store"
import { setDriversModalOpen, updateDrivers } from "@/lib/store/slices/forecastingSlice"
import { forecastingApi, type ForecastDriver } from "@/lib/api/forecasting-api"

const DRIVER_TYPES: { value: ForecastDriver["driver_type"]; label: string }[] = [
  { value: "CAGR_DRIVEN",         label: "CAGR-Driven" },
  { value: "HEADCOUNT_GROWTH",    label: "Headcount Growth" },
  { value: "INFLATION_MULTIPLIER", label: "Inflation Multiplier" },
  { value: "FX_SCALAR",           label: "FX Scalar" },
  { value: "LINEAR_REGRESSION",   label: "Linear Regression" },
  { value: "MANUAL_OVERRIDE",     label: "Manual Override" },
]

type DriverTemplate = {
  formula: string
  params: { key: string; value: string }[]
  hint: string
}

const DRIVER_TEMPLATES: Record<ForecastDriver["driver_type"], DriverTemplate> = {
  CAGR_DRIVEN: {
    formula: "HISTORICAL_BASE * (1 + parameters.cagr_scalar)^t",
    params: [
      { key: "cagr_scalar",    value: "0.08" },
      { key: "historical_base", value: "250000" },
      { key: "tx_currency",    value: "USD" },
    ],
    hint: "Compound annual growth from a historical base.",
  },
  HEADCOUNT_GROWTH: {
    formula: "parameters.headcount * (1 + parameters.growth_rate)^t * parameters.cost_per_head",
    params: [
      { key: "headcount",    value: "42" },
      { key: "growth_rate",  value: "0.03" },
      { key: "cost_per_head", value: "2850" },
    ],
    hint: "Total payroll cost driven by headcount and per-head rate.",
  },
  INFLATION_MULTIPLIER: {
    formula: "HISTORICAL_BASE * (1 + parameters.inflation_rate)^t",
    params: [
      { key: "inflation_rate",  value: "0.045" },
      { key: "historical_base", value: "100000" },
    ],
    hint: "Escalates a base amount by an annual inflation rate.",
  },
  FX_SCALAR: {
    formula: "HISTORICAL_BASE * parameters.fx_rate",
    params: [
      { key: "fx_rate",         value: "1.12" },
      { key: "historical_base", value: "100000" },
    ],
    hint: "Translates a foreign-currency base using a fixed FX rate.",
  },
  LINEAR_REGRESSION: {
    formula: "parameters.slope * t + parameters.intercept",
    params: [
      { key: "slope",            value: "5000" },
      { key: "intercept",        value: "50000" },
      { key: "lookback_periods", value: "6" },
    ],
    hint: "Straight-line extrapolation from historical trend.",
  },
  MANUAL_OVERRIDE: {
    formula: "",
    params: [],
    hint: "Values entered directly — no formula applied.",
  },
}

type DriverForm = {
  target_account_range_start: string
  target_account_range_end: string
  driver_type: ForecastDriver["driver_type"]
  formula_expression: string
  parameters: { key: string; value: string }[]
}

const makeDefault = (): DriverForm => {
  const t = DRIVER_TEMPLATES.CAGR_DRIVEN
  return {
    target_account_range_start: "",
    target_account_range_end: "",
    driver_type: "CAGR_DRIVEN",
    formula_expression: t.formula,
    parameters: t.params.map((p) => ({ ...p })),
  }
}

interface DriversPanelProps {
  scenarioId: string
}

export function DriversPanel({ scenarioId }: DriversPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { driversModalOpen, driversSaving, driversError } = useSelector(
    (state: RootState) => state.forecasting
  )

  const [drivers, setDrivers] = useState<DriverForm[]>([makeDefault()])
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<
    Record<number, { valid: boolean; error?: string } | null>
  >({})

  const addDriver = () =>
    setDrivers((prev) => [...prev, makeDefault()])

  const removeDriver = (idx: number) =>
    setDrivers((prev) => prev.filter((_, i) => i !== idx))

  const updateDriver = (idx: number, field: keyof DriverForm, value: any) =>
    setDrivers((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))

  const handleTypeChange = (idx: number, type: ForecastDriver["driver_type"]) => {
    const tpl = DRIVER_TEMPLATES[type]
    setDrivers((prev) =>
      prev.map((d, i) =>
        i === idx
          ? {
              ...d,
              driver_type: type,
              formula_expression: tpl.formula,
              parameters: tpl.params.map((p) => ({ ...p })),
            }
          : d
      )
    )
    setValidationResults((prev) => ({ ...prev, [idx]: null }))
  }

  const addParam = (driverIdx: number) =>
    setDrivers((prev) =>
      prev.map((d, i) =>
        i === driverIdx ? { ...d, parameters: [...d.parameters, { key: "", value: "" }] } : d
      )
    )

  const updateParam = (driverIdx: number, paramIdx: number, field: "key" | "value", val: string) =>
    setDrivers((prev) =>
      prev.map((d, i) => {
        if (i !== driverIdx) return d
        return {
          ...d,
          parameters: d.parameters.map((p, pi) => (pi === paramIdx ? { ...p, [field]: val } : p)),
        }
      })
    )

  const removeParam = (driverIdx: number, paramIdx: number) =>
    setDrivers((prev) =>
      prev.map((d, i) => {
        if (i !== driverIdx) return d
        return { ...d, parameters: d.parameters.filter((_, pi) => pi !== paramIdx) }
      })
    )

  const validateFormula = async (idx: number) => {
    const driver = drivers[idx]
    const expression = driver.formula_expression.trim()
    if (!expression) return
    setValidating(true)
    try {
      const parameters = Object.fromEntries(
        driver.parameters.filter((p) => p.key).map((p) => {
          const n = parseFloat(p.value)
          return [p.key, isNaN(n) ? p.value : n]
        })
      )
      const res = await forecastingApi.validateFormula({
        expression,
        driver_type: driver.driver_type,
        parameters,
      })
      setValidationResults((prev) => ({
        ...prev,
        [idx]: { valid: res.data?.valid ?? false, error: res.data?.error },
      }))
    } catch {
      setValidationResults((prev) => ({ ...prev, [idx]: { valid: false, error: "Validation request failed" } }))
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async () => {
    const formatted = drivers.map((d) => ({
      target_account_range_start: parseInt(d.target_account_range_start) || 0,
      target_account_range_end:   parseInt(d.target_account_range_end)   || 0,
      driver_type: d.driver_type,
      formula_expression: d.formula_expression || undefined,
      parameters: Object.fromEntries(
        d.parameters.filter((p) => p.key).map((p) => {
          const n = parseFloat(p.value)
          return [p.key, isNaN(n) ? p.value : n]
        })
      ),
    }))

    try {
      const result = await dispatch(updateDrivers({ id: scenarioId, drivers: formatted })).unwrap() as any
      const cells = result?.cells_updated ?? 0
      const ms = result?.execution_duration_ms ?? 0
      toast.success("Drivers saved — cascade complete", {
        description: `${cells} cell${cells !== 1 ? "s" : ""} updated in ${ms} ms`,
      })
    } catch (err: any) {
      const msg: string = err?.message ?? driversError ?? ""
      if (
        msg.includes("409") ||
        msg.toUpperCase().includes("OVERLAP") ||
        msg.toUpperCase().includes("DRIVER_RANGE_OVERLAP")
      ) {
        toast.error("Account range overlap", {
          description:
            "Two or more drivers cover overlapping account ranges. Adjust the start/end values so each range is unique.",
        })
      } else {
        toast.error("Failed to save drivers", { description: msg })
      }
    }
  }

  return (
    <Dialog open={driversModalOpen} onOpenChange={(open) => !open && dispatch(setDriversModalOpen(false))}>
      <DialogContent className="!w-[95vw] sm:!max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Configure Calculation Drivers
          </DialogTitle>
          <DialogDescription>
            Bind mathematical drivers to ledger account ranges. Saving replaces the entire driver set and runs cascade compute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {drivers.map((driver, idx) => {
            const validation = validationResults[idx]
            const hint = DRIVER_TEMPLATES[driver.driver_type]?.hint

            return (
              <div key={idx} className="border rounded-xl p-4 space-y-3 relative bg-gray-50/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Driver #{idx + 1}</p>
                  {drivers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeDriver(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Account range + type */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Account Range Start</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={driver.target_account_range_start}
                      onChange={(e) => updateDriver(idx, "target_account_range_start", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Account Range End</Label>
                    <Input
                      type="number"
                      placeholder="5999"
                      value={driver.target_account_range_end}
                      onChange={(e) => updateDriver(idx, "target_account_range_end", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Driver Type</Label>
                    <Select
                      value={driver.driver_type}
                      onValueChange={(v: ForecastDriver["driver_type"]) => handleTypeChange(idx, v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DRIVER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hint && <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>}
                  </div>
                </div>

                {/* Formula */}
                {driver.driver_type !== "MANUAL_OVERRIDE" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Formula Expression</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs text-blue-600 hover:bg-blue-50 rounded-full px-2"
                        onClick={() => validateFormula(idx)}
                        disabled={validating || !driver.formula_expression.trim()}
                      >
                        {validating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Validate
                      </Button>
                    </div>
                    <Textarea
                      className="font-mono text-xs resize-none"
                      rows={2}
                      value={driver.formula_expression}
                      onChange={(e) => {
                        updateDriver(idx, "formula_expression", e.target.value)
                        setValidationResults((prev) => ({ ...prev, [idx]: null }))
                      }}
                    />
                    {validation && (
                      <p className={`text-xs flex items-center gap-1 ${validation.valid ? "text-green-600" : "text-red-500"}`}>
                        {validation.valid ? (
                          <><CheckCircle2 className="w-3 h-3" /> Formula is valid</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3" /> {validation.error || "Invalid formula"}</>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {/* Parameters */}
                {driver.driver_type !== "MANUAL_OVERRIDE" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Parameters</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs rounded-full px-2"
                        onClick={() => addParam(idx)}
                      >
                        <Plus className="w-3 h-3 mr-0.5" /> Add
                      </Button>
                    </div>
                    {driver.parameters.map((param, pi) => (
                      <div key={pi} className="flex items-center gap-2">
                        <Input
                          placeholder="key"
                          value={param.key}
                          onChange={(e) => updateParam(idx, pi, "key", e.target.value)}
                          className="font-mono text-xs h-8"
                        />
                        <span className="text-muted-foreground text-xs shrink-0">:</span>
                        <Input
                          placeholder="value"
                          value={param.value}
                          onChange={(e) => updateParam(idx, pi, "value", e.target.value)}
                          className="font-mono text-xs h-8"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => removeParam(idx, pi)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {driver.parameters.length === 0 && (
                      <p className="text-xs text-muted-foreground">No parameters — add keys referenced in the formula.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 text-xs w-full border-dashed"
            onClick={addDriver}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Another Driver
          </Button>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => dispatch(setDriversModalOpen(false))}
            disabled={driversSaving}
            className="rounded-full h-9 px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={driversSaving}
            className="rounded-full h-9 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow"
          >
            {driversSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Save &amp; Recalculate</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
