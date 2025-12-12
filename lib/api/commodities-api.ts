// Commodities API Service using Alpha Vantage

export interface CommodityDataPoint {
  date: string
  value: string
}

export interface CommodityResponse {
  name: string
  interval: string
  unit: string
  data: CommodityDataPoint[]
}

export interface Commodity {
  id: string
  name: string
  function: string
  unit: string
  latestPrice: number
  previousPrice: number
  change: number
  changePercent: number
  lastUpdated: string
  history: CommodityDataPoint[]
}

const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'RD51WASX7TDVON9F'
const BASE_URL = 'https://www.alphavantage.co/query'

const COMMODITIES = [
  { id: 'wti', name: 'Crude Oil (WTI)', function: 'WTI', unit: 'dollars per barrel' },
  { id: 'natural_gas', name: 'Natural Gas', function: 'NATURAL_GAS', unit: 'dollars per MMBtu' },
  { id: 'copper', name: 'Copper', function: 'COPPER', unit: 'dollars per pound' },
  { id: 'aluminum', name: 'Aluminum', function: 'ALUMINUM', unit: 'dollars per pound' },
  { id: 'wheat', name: 'Wheat', function: 'WHEAT', unit: 'dollars per bushel' },
  { id: 'corn', name: 'Corn', function: 'CORN', unit: 'dollars per bushel' },
  { id: 'cotton', name: 'Cotton', function: 'COTTON', unit: 'cents per pound' },
  { id: 'sugar', name: 'Sugar', function: 'SUGAR', unit: 'cents per pound' },
]

async function fetchCommodityData(functionName: string): Promise<CommodityResponse> {
  const url = `${BASE_URL}?function=${functionName}&interval=daily&apikey=${API_KEY}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${functionName} data`)
  }
  
  const data = await response.json()
  return data
}

function calculateChange(latest: number, previous: number): { change: number; changePercent: number } {
  const change = latest - previous
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0
  
  return { change, changePercent }
}

export async function fetchAllCommodities(): Promise<Commodity[]> {
  const commoditiesData: Commodity[] = []
  
  // Fetch commodities sequentially with delay to avoid rate limiting
  for (const commodity of COMMODITIES) {
    try {
      const data = await fetchCommodityData(commodity.function)
      
      // Check for API error response
      if (data.hasOwnProperty('Error Message') || data.hasOwnProperty('Note')) {
        console.warn(`API limit or error for ${commodity.name}:`, data)
        continue
      }
      
      // Filter out invalid data points (value = ".")
      const validData = data.data?.filter(point => point.value !== "." && point.value !== "") || []
      
      if (validData.length < 2) {
        console.warn(`Not enough data for ${commodity.name}`)
        continue
      }
      
      const latestPrice = parseFloat(validData[0].value)
      const previousPrice = parseFloat(validData[1].value)
      const { change, changePercent } = calculateChange(latestPrice, previousPrice)
      
      commoditiesData.push({
        id: commodity.id,
        name: commodity.name,
        function: commodity.function,
        unit: data.unit || commodity.unit,
        latestPrice,
        previousPrice,
        change,
        changePercent,
        lastUpdated: validData[0].date,
        history: validData.slice(0, 30), // Keep last 30 days
      })
      
      // Add delay between requests to avoid rate limiting (Alpha Vantage free tier: 25 requests/day)
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error(`Error fetching ${commodity.name}:`, error)
    }
  }
  
  return commoditiesData
}

export async function fetchCommodityById(id: string): Promise<Commodity | null> {
  const commodity = COMMODITIES.find(c => c.id === id)
  
  if (!commodity) {
    return null
  }
  
  try {
    const data = await fetchCommodityData(commodity.function)
    const validData = data.data.filter(point => point.value !== "." && point.value !== "")
    
    if (validData.length < 2) {
      return null
    }
    
    const latestPrice = parseFloat(validData[0].value)
    const previousPrice = parseFloat(validData[1].value)
    const { change, changePercent } = calculateChange(latestPrice, previousPrice)
    
    return {
      id: commodity.id,
      name: commodity.name,
      function: commodity.function,
      unit: data.unit || commodity.unit,
      latestPrice,
      previousPrice,
      change,
      changePercent,
      lastUpdated: validData[0].date,
      history: validData,
    }
  } catch (error) {
    console.error(`Error fetching ${commodity.name}:`, error)
    return null
  }
}
