"use client"

import { useState, useEffect } from "react"
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
import { setDriversModalOpen, updateDrivers, triggerCompute } from "@/lib/store/slices/forecastingSlice"
import { forecastingApi, type ForecastDriver } from "@/lib/api/forecasting-api"

const DRIVER_TYPES = [
  { value: "LINEAR_TREND", label: "Linear Trend" },
  { value: "EXPONENTIAL", label: "Exponential Growth" },
  { value: "CAGR_DRIVEN", label: "CAGR-Driven" },
  { value: "CUSTOM_FORMULA", label: "Custom Formula" },
]

type DriverForm = {
  target_account_range_start: string
  target_account_range_end: string
  driver_type: ForecastDriver["driver_type"]
  formula_expression: string
  parameters: { key: string; value: string }[]
}

const EMPTY_DRIVER: DriverForm = {
  target_account_range_start: "",
  target_account_range_end: "",
  driver_type: "CAGR_DRIVEN",
  formula_expression: "HISTORICAL_BASE * (1 + parameters.cagr_scalar)^t",
  parameters: [
    { key: "cagr_scalar", value: "0.05" },
    { key: "historical_base", value: "10000" },
    { key: "tx_currency", value: "USD" },
  ],
}

interface DriversPanelProps {
  scenarioId: string
}

export function DriversPanel({ scenarioId }: DriversPanelProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { driversModalOpen, driversSaving, driversError } = useSelector(
    (state: RootState) => state.forecasting
  )

  const [drivers, setDrivers] = useState<DriverForm[]>([{ ...EMPTY_DRIVER }])
  const [validating, setValidating] = useState(false)
  const [validationResults, setValidationResults] = useState<Record<number, { valid: boolean; error?: string }>>({})

  const addDriver = () => setDrivers((prev) => [...prev, { ...EMPTY_DRIVER, parameters: [{ key: "", value: "" }] }])
  const removeDriver = (idx: number) => setDrivers((prev) => prev.filter((_, i) => i !== idx))

  const updateDriver = (idx: number, field: keyof DriverForm, value: any) => {
    setDrivers((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))
  }

  const addParam = (driverIdx: number) => {
    setDrivers((prev) =>
      prev.map((d, i) => (i === driverIdx ? { ...d, parameters: [...d.parameters, { key: "", value: "" }] } : d))
    )
  }

  const updateParam = (driverIdx: number, paramIdx: number, field: "key" | "value", val: string) => {
    setDrivers((prev) =>
      prev.map((d, i) => {
        if (i !== driverIdx) return d
        return {
          ...d,
          parameters: d.parameters.map((p, pi) => (pi === paramIdx ? { ...p, [field]: val } : p)),
        }
      })
    )
  }

  const removeParam = (driverIdx: number, paramIdx: number) => {
    setDrivers((prev) =>
      prev.map((d, i) => {
        if (i !== driverIdx) return d
        return { ...d, parameters: d.parameters.filter((_, pi) => pi !== paramIdx) }
      })
    )
  }

  const validateFormula = async (idx: number) => {
    const expression = drivers[idx].formula_expression.trim()
    if (!expression) return
    setValidating(true)
    try {
      const res = await forecastingApi.validateFormula(expression)
      setValidationResults((prev) => ({ ...prev, [idx]: { valid: res.data?.valid ?? false, error: res.data?.error } }))
    } catch {
      setValidationResults((prev) => ({ ...prev, [idx]: { valid: false, error: "Validation failed" } }))
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async () => {
    const formatted = drivers.map((d) => ({
      target_account_range_start: parseInt(d.target_account_range_start) || 0,
      target_account_range_end: parseInt(d.target_account_range_end) || 0,
      driver_type: d.driver_type,
      formula_expression: d.formula_expression || undefined,
      parameters: Object.fromEntries(d.parameters.filter((p) => p.key).map((p) => {
        const numVal = parseFloat(p.value)
        return [p.key, isNaN(numVal) ? p.value : numVal]
      })),
    }))

    try {
      await dispatch(updateDrivers({ id: scenarioId, drivers: formatted })).unwrap()
      toast.success("Drivers saved", { description: "Triggering cascade recalculation..." })
      dispatch(triggerCompute({ scenario_id: scenarioId, edit_type: "SCENARIO_RECALC", options: { include_elapsed_variance: true } }))
    } catch (err: any) {
      toast.error("Failed to save drivers", { description: err?.message || driversError })
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
            Bind mathematical drivers to ledger account ranges. The engine will cascade-calculate all affected cells.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {drivers.map((driver, idx) => {
            const validation = validationResults[idx]
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
                    <Select value={driver.driver_type} onValueChange={(v: any) => updateDriver(idx, "driver_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DRIVER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Formula */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Formula Expression</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs text-blue-600 hover:bg-blue-50 rounded-full px-2"
                      onClick={() => validateFormula(idx)}
                      disabled={validating}
                    >
                      {validating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Validate
                    </Button>
                  </div>
                  <Textarea
                    className="font-mono text-xs resize-none"
                    rows={2}
                    placeholder="HISTORICAL_BASE * (1 + parameters.cagr_scalar)^t"
                    value={driver.formula_expression}
                    onChange={(e) => updateDriver(idx, "formula_expression", e.target.value)}
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

                {/* Parameters */}
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
                </div>
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving & Computing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Save &amp; Recalculate</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
