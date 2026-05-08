"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Calculator, CalendarRange } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import type { Asset } from "@/lib/api/accounting-api"
import { accountingApi } from "@/lib/api/accounting-api"

interface CalculateDepreciationModalProps {
  isOpen: boolean
  onClose: () => void
  asset: Asset
  onSuccess: () => void
}

type Mode = "single" | "range"

export function CalculateDepreciationModal({ isOpen, onClose, asset, onSuccess }: CalculateDepreciationModalProps) {
  const [mode, setMode] = useState<Mode>("single")
  const [loading, setLoading] = useState(false)

  // Single mode state
  const [depreciationDate, setDepreciationDate] = useState<Date>(new Date())
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"))

  // Range mode state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [autoPost, setAutoPost] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === "single") {
        const response = await accountingApi.calculateDepreciation(asset.id, {
          depreciationDate: format(depreciationDate, "yyyy-MM-dd"),
          period,
        })
        if (response.success) {
          toast.success("Depreciation calculated successfully")
          onSuccess()
        } else {
          throw new Error(response.error || "Failed to calculate depreciation")
        }
      } else {
        if (!startDate || !endDate) {
          toast.error("Please select both start and end dates")
          return
        }
        if (startDate > endDate) {
          toast.error("Start date must be before end date")
          return
        }
        const response = await accountingApi.backfillDepreciation(asset.id, {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          autoPost,
        })
        if (response.success) {
          toast.success("Depreciation backfill completed successfully")
          onSuccess()
        } else {
          throw new Error(response.error || "Failed to backfill depreciation")
        }
      }
    } catch (error: any) {
      if (error.message?.includes("already calculated")) {
        toast.error("Depreciation already calculated for this period")
      } else {
        toast.error("Failed to calculate depreciation", { description: error.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculate Depreciation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Asset summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="font-semibold text-sm">{asset.assetName}</p>
            <p className="text-xs text-gray-500">Code: {asset.assetCode}</p>
            <p className="text-xs text-gray-500">
              Book Value: ${parseFloat(asset.currentBookValue).toLocaleString()}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-full border border-gray-200 bg-gray-50/50 p-1">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200",
                mode === "single"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Calculator className="w-3.5 h-3.5" />
              Single Period
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200",
                mode === "range"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Date Range
            </button>
          </div>

          {/* Single period fields */}
          {mode === "single" && (
            <div className="space-y-4">
              <div>
                <Label>Depreciation Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-full mt-1 h-10 px-4"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(depreciationDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={depreciationDate}
                      onSelect={(d) => d && setDepreciationDate(d)}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="period">Period (YYYY-MM)</Label>
                <Input
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g. 2025-01"
                  pattern="^\d{4}-\d{2}$"
                  required
                  className="rounded-full mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Format: YYYY-MM (e.g. 2025-01 for January 2025)
                </p>
              </div>
            </div>
          )}

          {/* Range (backfill) fields */}
          {mode === "range" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-full mt-1 text-sm h-10 px-4",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {startDate ? format(startDate, "dd MMM yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-full mt-1 text-sm h-10 px-4",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {endDate ? format(endDate, "dd MMM yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={startDate ? { before: startDate } : undefined}
                        className="rounded-xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPost">Auto-post entries</Label>
                  <p className="text-xs text-gray-400">
                    Automatically post journal entries for each period
                  </p>
                </div>
                <Switch
                  id="autoPost"
                  checked={autoPost}
                  onCheckedChange={setAutoPost}
                />
              </div>

              <p className="text-xs text-gray-400">
                Backfill calculates depreciation for every month between the start and end dates.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full h-10 px-6">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="gradient-create"
              className="rounded-full h-10 px-6 shadow-sm"
            >
              {loading
                ? "Processing..."
                : mode === "single"
                  ? "Calculate Depreciation"
                  : "Run Backfill"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
