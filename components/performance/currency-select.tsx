"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { accountingApi, type AccountingCurrency } from "@/lib/api/accounting-api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CurrencySelectProps {
  /** Currency code (e.g. USD) */
  value: string
  onChange: (code: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

let cached: AccountingCurrency[] | null = null

export function CurrencySelect({
  value,
  onChange,
  placeholder = "Select currency",
  className,
  disabled,
}: CurrencySelectProps) {
  const [currencies, setCurrencies] = useState<AccountingCurrency[]>(cached || [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    accountingApi
      .getCurrencies()
      .then((res: any) => {
        if (cancelled) return
        const arr: AccountingCurrency[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : []
        cached = arr
        setCurrencies(arr)
      })
      .catch((e: any) => {
        if (!cancelled) toast.error("Failed to load currencies", { description: e?.message })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className={className}>
        {loading && currencies.length === 0 ? (
          <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading currencies...
          </span>
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {currencies.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No currencies found
          </div>
        ) : (
          currencies.map((c) => (
            <SelectItem key={c.id} value={c.code}>
              <span className="font-mono text-xs mr-2">{c.code}</span>
              <span>
                {c.symbol} · {c.name}
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
