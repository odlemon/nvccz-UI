// Financial data API service functions

const BASE_URL = 'http://ss8008o44k04k0kogoskcsg8.31.220.82.129.sslip.io/api'

export interface ExchangeRate {
  currency: string
  mid_rate: number
  pair: string
  we_buy: number
  we_sell: number
}

export interface ExchangeRatesResponse {
  date: string
  date_iso: string
  exchange_rates: ExchangeRate[]
  source: string
  status: string
  timestamp: string
  url: string
}

export interface TopGainer {
  change: number
  currency: string
  direction: string
  symbol: string
  value: number
}

export interface TopGainersResponse {
  count: number
  source: string
  status: string
  timestamp: string
  top_gainers: TopGainer[]
  url: string
}

export interface TopLoser {
  change: number
  currency: string
  direction: string
  symbol: string
  value: number
}

export interface TopLosersResponse {
  count: number
  source: string
  status: string
  timestamp: string
  top_losers: TopLoser[]
  url: string
}

export interface MarketIndex {
  change: number
  currency: string
  direction: string
  index: string
  value: number
}

export interface MarketIndicesResponse {
  count: number
  market_indices: MarketIndex[]
  source: string
  status: string
  timestamp: string
  url: string
}

export interface SectorIndex {
  change: number
  currency: string
  direction: string
  index: string
  unit: string
  value: number
}

export interface SectorIndicesResponse {
  count: number
  sector_indices: SectorIndex[]
  source: string
  status: string
  timestamp: string
  url: string
}

export interface AfricanIndex {
  change: string
  'change %': string
  full_name: string
  high: string
  low: string
  name: string
  price: string
  symbol: string
  tech_rating: string
}

export interface AfricanIndicesResponse {
  count: number
  indices: AfricanIndex[]
  source: string
  status: string
  timestamp: string
  url: string
}

export interface WorldIndex {
  change: string
  'change %': string
  full_name: string
  high: string
  low: string
  name: string
  price: string
  symbol: string
  tech_rating: string
}

export interface WorldIndicesResponse {
  columns: string[]
  count: number
  indices: WorldIndex[]
  source: string
  status: string
  timestamp: string
  url: string
}

// API Service Functions
export async function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/rbz/exchange-rates`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    throw error
  }
}

export async function fetchTopGainers(): Promise<TopGainersResponse> {
  try {
    const response = await fetch(`${BASE_URL}/zse/top-gainers`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching top gainers:', error)
    throw error
  }
}

export async function fetchTopLosers(): Promise<TopLosersResponse> {
  try {
    const response = await fetch(`${BASE_URL}/zse/top-losers`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching top losers:', error)
    throw error
  }
}

export async function fetchMarketIndices(): Promise<MarketIndicesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/zse/market-indices`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching market indices:', error)
    throw error
  }
}

export async function fetchSectorIndices(): Promise<SectorIndicesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/zse/sector-indices`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching sector indices:', error)
    throw error
  }
}

export async function fetchAfricanIndices(): Promise<AfricanIndicesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/tradingview/african-indices`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching African indices:', error)
    throw error
  }
}

export async function fetchWorldIndices(): Promise<WorldIndicesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/tradingview/world-indices`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching world indices:', error)
    throw error
  }
}

// Combined data fetching for dashboard
export async function fetchAllFinancialData() {
  try {
    const [
      exchangeRates,
      topGainers,
      topLosers,
      marketIndices,
      sectorIndices,
      africanIndices,
      worldIndices
    ] = await Promise.all([
      fetchExchangeRates(),
      fetchTopGainers(),
      fetchTopLosers(),
      fetchMarketIndices(),
      fetchSectorIndices(),
      fetchAfricanIndices(),
      fetchWorldIndices()
    ])

    return {
      exchangeRates,
      topGainers,
      topLosers,
      marketIndices,
      sectorIndices,
      africanIndices,
      worldIndices
    }
  } catch (error) {
    console.error('Error fetching financial data:', error)
    throw error
  }
}
