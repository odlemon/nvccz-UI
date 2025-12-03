"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/lib/store"
import { 
  fetchExchangeRatesThunk,
  fetchTopGainersThunk, 
  fetchTopLosersThunk,
  fetchMarketIndicesThunk,
  fetchSectorIndicesThunk,
  fetchAfricanIndicesThunk,
  fetchWorldIndicesThunk
} from "@/lib/store/slices/financialDataSlice"

interface FinancialDataProviderProps {
  children: React.ReactNode
}

export function FinancialDataProvider({ children }: FinancialDataProviderProps) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Fetch all financial data once when the provider mounts
    const fetchAllData = () => {
      dispatch(fetchExchangeRatesThunk())
      dispatch(fetchTopGainersThunk())
      dispatch(fetchTopLosersThunk())
      dispatch(fetchMarketIndicesThunk())
      dispatch(fetchSectorIndicesThunk())
      dispatch(fetchAfricanIndicesThunk())
      dispatch(fetchWorldIndicesThunk())
    }

    // Initial fetch
    fetchAllData()

    // Set up intervals for different data refresh rates
    const exchangeRatesInterval = setInterval(() => {
      dispatch(fetchExchangeRatesThunk())
    }, 30000) // Exchange rates refresh every 30 seconds

    const marketDataInterval = setInterval(() => {
      dispatch(fetchTopGainersThunk())
      dispatch(fetchTopLosersThunk())
      dispatch(fetchMarketIndicesThunk())
      dispatch(fetchAfricanIndicesThunk())
      dispatch(fetchWorldIndicesThunk())
    }, 60000) // Market data refreshes every 60 seconds

    const sectorDataInterval = setInterval(() => {
      dispatch(fetchSectorIndicesThunk())
    }, 120000) // Sector data refreshes every 2 minutes

    return () => {
      clearInterval(exchangeRatesInterval)
      clearInterval(marketDataInterval)
      clearInterval(sectorDataInterval)
    }
  }, [dispatch])

  return <>{children}</>
}
