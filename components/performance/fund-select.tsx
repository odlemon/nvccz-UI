"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fundsApi, type Fund } from "@/lib/api/funds-api"
import { toast } from "sonner"
import { Loader2, Wallet } from "lucide-react"

interface FundSelectProps {
  value: string
  onChange: (fundId: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  allowEmpty?: boolean
}

let cached: Fund[] | null = null

export function FundSelect({
  value,
  onChange,
  placeholder = "Select fund",
  className,
  disabled,
  allowEmpty,
}: FundSelectProps) {
  const [funds, setFunds] = useState<Fund[]>(cached || [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    fundsApi
      .getAll()
      .then((res) => {
        if (cancelled) return
        const arr = res?.data?.funds || []
        cached = arr
        setFunds(arr)
      })
      .catch((e: any) => {
        if (!cancelled) toast.error("Failed to load funds", { description: e?.message })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Select
      value={value || (allowEmpty ? "__none__" : "")}
      onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
      disabled={disabled || loading}
    >
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
          {loading && funds.length === 0 ? (
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading funds...
            </span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value="__none__">No fund filter</SelectItem>}
        {funds.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No funds available
          </div>
        ) : (
          funds.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              <div className="flex flex-col">
                <span className="truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {f.status}
                </span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
