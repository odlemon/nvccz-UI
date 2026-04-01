"use client"

import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/store/store"
import { setStatementDate, setStatementEndBalance, setReference, setOpeningBalance } from "@/lib/store/slices/reconciliationSlice"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { CashbookBank } from "@/lib/api/cashbook-api"

interface ReconciliationHeaderFormProps {
  selectedBank: CashbookBank | null
  onApply: () => void
  disabled?: boolean
}

export function ReconciliationHeaderForm({ selectedBank, onApply, disabled }: ReconciliationHeaderFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { statementDate, statementEndBalance, reference, openingBalance } = useSelector(
    (state: RootState) => state.reconciliation
  )

  const parsedDate = statementDate ? parseISO(statementDate) : undefined

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statement Date */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Statement Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-lg",
                  !statementDate && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {statementDate ? format(parseISO(statementDate), "dd/MM/yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parsedDate}
                onSelect={(date) => {
                  if (date) dispatch(setStatementDate(format(date, "yyyy-MM-dd")))
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Statement End Balance */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Statement End Balance *</Label>
          <Input
            type="number"
            step="0.01"
            value={statementEndBalance ?? ""}
            onChange={(e) => dispatch(setStatementEndBalance(e.target.value ? parseFloat(e.target.value) : null))}
            placeholder="0.00"
            className="rounded-lg"
            disabled={disabled}
          />
        </div>

        {/* Reference */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Reference</Label>
          <Input
            value={reference}
            onChange={(e) => dispatch(setReference(e.target.value))}
            placeholder="e.g. July 2024"
            className="rounded-lg"
            disabled={disabled}
          />
        </div>

        {/* Opening Balance */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Opening Balance</Label>
          <Input
            type="number"
            step="0.01"
            value={openingBalance ?? ""}
            onChange={(e) => dispatch(setOpeningBalance(e.target.value ? parseFloat(e.target.value) : null))}
            placeholder="0.00"
            className="rounded-lg"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium">Bank Account:</span>{" "}
          {selectedBank ? `${selectedBank.name} (${selectedBank.accountNumber})` : "No bank selected"}
        </div>
        <Button
          onClick={onApply}
          disabled={disabled || !statementDate || statementEndBalance === null}
          className="rounded-full"
        >
          Apply
        </Button>
      </div>
    </div>
  )
}
