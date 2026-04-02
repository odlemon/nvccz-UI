"use client"

import * as React from "react"
import { useDispatch, useSelector } from "react-redux"
import { Globe } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { RootState, AppDispatch } from "@/lib/store/store"
import { setSelectedCurrencyId } from "@/lib/store/slices/accountingSlice"
import { Badge } from "@/components/ui/badge"

export function CurrencyFilter() {
  const dispatch = useDispatch<AppDispatch>()
  const { currencies, selectedCurrencyId, currenciesLoading } = useSelector(
    (state: RootState) => state.accounting
  )

  const handleCurrencyChange = (value: string) => {
    dispatch(setSelectedCurrencyId(value))
  }

  const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId)

  if (currencies.length === 0 && !currenciesLoading) {
    return null
  }

  return (
    <div className="flex items-center">
      <Select
        value={selectedCurrencyId || ""}
        onValueChange={handleCurrencyChange}
        disabled={currenciesLoading}
      >
        <SelectTrigger className="h-10 min-w-[120px] w-auto rounded-full bg-background border-input shadow-sm focus:ring-1 focus:ring-ring px-4 transition-all hover:bg-muted/50">
          <SelectValue placeholder="Currency">
            {selectedCurrency ? (
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">{selectedCurrency.code}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">- {selectedCurrency.name}</span>
              </div>
            ) : (
              "Currency"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[220px] rounded-xl shadow-lg border-border/50 backdrop-blur-sm">
          {currencies.map((currency) => (
            <SelectItem key={currency.id} value={currency.id} className="rounded-lg m-1">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{currency.code}</span>
                  <span className="text-xs text-muted-foreground">{currency.name}</span>
                </div>
                {currency.symbol && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none bg-muted/30 border-muted-foreground/20 shrink-0">
                    {currency.symbol}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
