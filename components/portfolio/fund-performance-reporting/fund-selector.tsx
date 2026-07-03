"use client"

import { useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchFunds } from "@/lib/store/slices/fundsSlice"
import { setSelectedFundId } from "@/lib/store/slices/fundPerformanceReportingSlice"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Fund-scoping control shared by every screen in the Fund Performance
 * Reporting workspace. Reuses the existing fundsSlice (already populated by
 * app/portfolio/funds/page.tsx) rather than inventing a new fund-listing
 * mechanism. Selection is mirrored into the `?fundId=` query param so every
 * tab is deep-linkable.
 */
export function FundSelector() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { funds, loading } = useAppSelector((s) => s.funds)
  const { selectedFundId } = useAppSelector((s) => s.fundPerformanceReporting)

  useEffect(() => {
    dispatch(fetchFunds())
  }, [dispatch])

  const urlFundId = searchParams.get("fundId")

  useEffect(() => {
    if (urlFundId && urlFundId !== selectedFundId) {
      dispatch(setSelectedFundId(urlFundId))
    } else if (!urlFundId && !selectedFundId && funds.length > 0) {
      handleChange(funds[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFundId, funds])

  const handleChange = (fundId: string) => {
    dispatch(setSelectedFundId(fundId))
    const params = new URLSearchParams(searchParams.toString())
    params.set("fundId", fundId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fund</span>
      <Select value={selectedFundId ?? undefined} onValueChange={handleChange}>
        <SelectTrigger className="h-9 min-w-[220px] bg-white">
          <SelectValue placeholder={loading ? "Loading funds…" : "Select a fund"} />
        </SelectTrigger>
        <SelectContent>
          {funds.map((f) => (
            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
