"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useAppSelector } from "@/lib/store"
import { ExchangeRatesTickerSkeleton } from "@/components/ui/skeleton-loaders"

export function ExchangeRatesTicker() {
  const { data, loading, error } = useAppSelector((state) => state.financialData.exchangeRates)

  // Data is now provided by FinancialDataProvider
  // No need for individual API calls here

  if (loading) {
    return <ExchangeRatesTickerSkeleton />
  }

  if (error || !data?.exchange_rates || data.exchange_rates.length === 0) {
    return (
      <div className="bg-red-50/80 backdrop-blur-sm border-b border-red-100">
        <div className="px-4 sm:px-6 py-1 sm:py-1.5 bg-white/90 backdrop-blur-sm border-b border-red-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-red-700">Exchange Rates - {error || 'No data available'}</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs text-red-600">ERROR</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const exchangeRates = data.exchange_rates
  const baseRate = data.base || 'USD'

  return (
    <div className="bg-blue-50/80 backdrop-blur-sm border-b border-blue-100">
      {/* Title outside the ticker */}
      <div className="px-4 sm:px-6 py-1 sm:py-1.5 bg-white/90 backdrop-blur-sm border-b border-blue-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs text-gray-600">Live Exchange Rates (Base: {baseRate})</h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600">LIVE</span>
          </div>
        </div>
      </div>
      
      {/* Ticker Container */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/60 to-indigo-50/60 py-2 sm:py-3">
        <motion.div
          className="flex gap-8 sm:gap-12 whitespace-nowrap"
          animate={{
            x: [0, -200 * exchangeRates.length]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: exchangeRates.length * 20,
              ease: "linear",
              repeatDelay: 0
            }
          }}
        >
          {[...exchangeRates, ...exchangeRates, ...exchangeRates].map((rate, index) => (
            <div key={index} className="flex-shrink-0 flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                  <span className="text-xs text-white">
                    {rate.flag || rate.code}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-700">{rate.currency}</div>
                  <div className="text-xs text-gray-500">{rate.code}</div>
                </div>
              </div>
              
              {/* Dividing line */}
              <div className="w-px h-5 sm:h-6 bg-gray-300"></div>
              
              <div className="flex items-center gap-2 sm:gap-4 text-xs">
                <div className="group cursor-pointer">
                  <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">{baseRate}→{rate.code}:</div>
                  <div className="text-xs text-gray-700 group-hover:text-blue-700 transition-colors">
                    {rate.rate.toFixed(4)}
                  </div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">{rate.code}→{baseRate}:</div>
                  <div className="text-xs text-gray-700 group-hover:text-blue-700 transition-colors">
                    {rate.inverseRate.toFixed(4)}
                  </div>
                </div>
              </div>
              
              {/* Dividing line */}
              <div className="w-px h-5 sm:h-6 bg-gray-300"></div>
              
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">
                  LIVE
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
