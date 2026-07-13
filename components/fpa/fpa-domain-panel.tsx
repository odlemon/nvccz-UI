"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FpaPageHeader } from "./fpa-page-header"
import {
  asNumber,
  formatMoney,
  fpaApi,
  type FpaDomainView,
  type FpaDriver,
  type FpaLineItem,
} from "@/lib/api/fpa-api"
import { useAppSelector } from "@/lib/store"
import { errorMessage, logFpaGap } from "@/lib/fpa/fpa-api-gaps"

type DomainCategory = "workforce" | "revenue" | "expense" | "cash"

const TITLES: Record<DomainCategory, string> = {
  workforce: "Workforce",
  revenue: "Revenue",
  expense: "Expenses",
  cash: "Cash Flow",
}

export function FpaDomainPanel({ category }: { category: DomainCategory }) {
  const { selectedModelId } = useAppSelector((s) => s.fpa)
  const [data, setData] = useState<FpaDomainView | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedModelId) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    try {
      const res = await fpaApi.getDomainView(category, selectedModelId)
      if (!res.success || !res.data) throw new Error(res.message || "Domain view failed")
      setData(res.data)
      if (!res.data.lineItems?.length && !res.data.drivers?.length) {
        logFpaGap({
          category: "missing",
          path: `/v1/fpa/domain/${category}`,
          method: "GET",
          message: "Domain view returned empty lineItems/drivers — hire plan, waterfall, monthly cash not included",
          impact: `${TITLES[category]} shows empty tables`,
        })
      }
    } catch (err) {
      logFpaGap({
        category: "broken",
        path: `/v1/fpa/domain/${category}`,
        method: "GET",
        message: errorMessage(err),
        impact: `${TITLES[category]} empty`,
        request: { modelId: selectedModelId },
        response: err,
      })
      toast.error(errorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [category, selectedModelId])

  useEffect(() => {
    void load()
  }, [load])

  const lineItems: FpaLineItem[] = data?.lineItems || []
  const drivers: FpaDriver[] = data?.drivers || []

  return (
    <div className="min-h-full bg-[#f8fafc]">
      <FpaPageHeader title={TITLES[category]} />

      <div className="p-4 sm:p-5 space-y-4">
        {!selectedModelId ? (
          <p className="text-sm text-[#94a3b8]">Select a model to load this domain view.</p>
        ) : loading ? (
          <div className="flex items-center gap-2 py-12 text-[#64748b]">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading {TITLES[category].toLowerCase()}…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
                <p className="text-xs text-[#64748b]">Line items</p>
                <p className="text-lg font-semibold mt-1 tabular-nums">{lineItems.length}</p>
              </div>
              <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
                <p className="text-xs text-[#64748b]">Drivers</p>
                <p className="text-lg font-semibold mt-1 tabular-nums">{drivers.length}</p>
              </div>
              <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
                <p className="text-xs text-[#64748b]">Category</p>
                <p className="text-lg font-semibold mt-1 capitalize">{category}</p>
              </div>
              <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
                <p className="text-xs text-[#64748b]">Model</p>
                <p className="text-sm font-semibold mt-1 truncate">{selectedModelId.slice(0, 12)}…</p>
              </div>
            </div>

            <section className="rounded-md border border-[#e2e8f0] bg-white overflow-x-auto">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-sm font-semibold text-[#0f172a]">Line items</h2>
              </div>
              {lineItems.length === 0 ? (
                <p className="p-6 text-sm text-[#94a3b8]">No line items in this domain response.</p>
              ) : (
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-left text-xs text-[#64748b]">
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr key={li.id} className="border-t border-[#e2e8f0]">
                        <td className="px-4 py-3 font-mono text-xs">{li.code}</td>
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{li.name}</td>
                        <td className="px-4 py-3 text-[#475569]">{li.lineItemType}</td>
                        <td className="px-4 py-3 text-[#475569]">{li.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="rounded-md border border-[#e2e8f0] bg-white overflow-x-auto">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-sm font-semibold text-[#0f172a]">Drivers</h2>
              </div>
              {drivers.length === 0 ? (
                <p className="p-6 text-sm text-[#94a3b8]">No drivers in this domain response.</p>
              ) : (
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-left text-xs text-[#64748b]">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((d) => (
                      <tr key={d.id} className="border-t border-[#e2e8f0]">
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 font-mono text-xs">{d.code}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {d.unit === "%" ? `${asNumber(d.value)}%` : formatMoney(d.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <p className="text-xs text-[#94a3b8]">
              Hire plans, waterfalls, and monthly cash statement series are not in the domain API payload —
              see frontend feedback doc.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
