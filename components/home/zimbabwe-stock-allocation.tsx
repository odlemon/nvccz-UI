"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAllCommodities, Commodity } from "@/lib/api/commodities-api"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ZimbabweStockAllocation() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadCommodities()
  }, [])

  const loadCommodities = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllCommodities()
      setCommodities(data)
    } catch (err) {
      setError("Failed to load commodities data")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (commodity: Commodity) => {
    setSelectedCommodity(commodity)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg h-[400px] flex flex-col">
        <h2 className="text-base text-white mb-3 drop-shadow-sm font-medium">Commodities</h2>
        <div className="space-y-2 flex-1 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded bg-white/20" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg h-[400px] flex flex-col">
        <h2 className="text-base text-white mb-3 drop-shadow-sm font-medium">Commodities</h2>
        <div className="text-center py-4 sm:py-6 text-white flex-1 flex flex-col items-center justify-center">
          <p className="text-xs sm:text-sm">{error}</p>
          <button
            onClick={loadCommodities}
            className="mt-2 text-xs text-white/90 hover:text-white hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg h-[400px] flex flex-col">
        <h2 className="text-base text-white mb-3 drop-shadow-sm font-medium">Commodities</h2>
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 z-10">
              <tr className="border-b border-white/20">
                <th className="px-2 py-2 text-left text-white/90 font-normal">Name</th>
                <th className="px-2 py-2 text-right text-white/90 font-normal">Price</th>
                <th className="px-2 py-2 text-right text-white/90 font-normal">Change</th>
              </tr>
            </thead>
            <tbody>
              {commodities.slice(0, 6).map((commodity) => {
                const isPositive = commodity.change > 0
                const isNegative = commodity.change < 0
                const changeColor = isPositive
                  ? "text-green-200"
                  : isNegative
                  ? "text-red-200"
                  : "text-white/70"

                return (
                  <tr
                    key={commodity.id}
                    className="hover:bg-white/10 cursor-pointer transition-colors border-b border-white/10 last:border-0"
                    onClick={() => handleRowClick(commodity)}
                  >
                    <td className="px-2 py-2 text-white drop-shadow-sm">
                      {commodity.name}
                    </td>
                    <td className="px-2 py-2 text-right text-white drop-shadow-sm">
                      ${commodity.latestPrice.toFixed(2)}
                    </td>
                    <td className={`px-2 py-2 text-right ${changeColor} drop-shadow-sm`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : isNegative ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : null}
                        <span>
                          {commodity.change > 0 ? "+" : ""}
                          {commodity.change.toFixed(2)} ({commodity.changePercent > 0 ? "+" : ""}
                          {commodity.changePercent.toFixed(1)}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commodity History Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedCommodity?.name} - Price History</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedCommodity && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Current Price</p>
                  <p className="text-lg font-bold">
                    {selectedCommodity.latestPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{selectedCommodity.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Change</p>
                  <p
                    className={`text-lg font-bold ${
                      selectedCommodity.change > 0
                        ? "text-green-600"
                        : selectedCommodity.change < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {selectedCommodity.change > 0 ? "+" : ""}
                    {selectedCommodity.change.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Change %</p>
                  <p
                    className={`text-lg font-bold ${
                      selectedCommodity.changePercent > 0
                        ? "text-green-600"
                        : selectedCommodity.changePercent < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {selectedCommodity.changePercent > 0 ? "+" : ""}
                    {selectedCommodity.changePercent.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Last Updated</p>
                  <p className="text-sm font-semibold">
                    {new Date(selectedCommodity.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Historical Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Change</th>
                      <th className="px-4 py-2 text-right">Change %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCommodity.history.map((point, idx) => {
                      const currentPrice = parseFloat(point.value)
                      const nextPoint = selectedCommodity.history[idx + 1]
                      const previousPrice = nextPoint
                        ? parseFloat(nextPoint.value)
                        : currentPrice
                      const change = currentPrice - previousPrice
                      const changePercent =
                        previousPrice !== 0 ? (change / previousPrice) * 100 : 0

                      const changeColor =
                        change > 0
                          ? "text-green-600"
                          : change < 0
                          ? "text-red-600"
                          : "text-gray-500"

                      return (
                        <tr
                          key={point.date}
                          className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-4 py-2">
                            {new Date(point.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            {currentPrice.toFixed(2)}
                          </td>
                          <td className={`px-4 py-2 text-right ${changeColor}`}>
                            {idx < selectedCommodity.history.length - 1 ? (
                              <>
                                {change > 0 ? "+" : ""}
                                {change.toFixed(2)}
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className={`px-4 py-2 text-right ${changeColor}`}>
                            {idx < selectedCommodity.history.length - 1 ? (
                              <>
                                {changePercent > 0 ? "+" : ""}
                                {changePercent.toFixed(2)}%
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
