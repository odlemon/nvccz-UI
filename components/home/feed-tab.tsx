"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  ExternalLink,
  BarChart3,
  DollarSign,
  Globe,
  Building2
} from "lucide-react"
import { useState } from "react"
import { useAppSelector } from "@/lib/store"
import { TabContentSkeleton } from "@/components/ui/skeleton-loaders"

// Market sections will be dynamically generated from API data

const articles = [
  {
    id: 1,
    title: "Zimbabwe Stock Exchange Shows Strong Performance in Q4",
    description: "The ZSE has recorded impressive gains across all major indices, with technology and banking sectors leading the charge.",
    image: "/placeholder.jpg",
    author: "Financial Times",
    time: "2 hours ago",
    likes: 24,
    shares: 8
  },
  {
    id: 2,
    title: "RBZ Announces New Monetary Policy Framework",
    description: "The Reserve Bank introduces new measures to stabilize the Zimbabwe Gold currency and control inflation.",
    image: "/placeholder.jpg", 
    author: "Business Herald",
    time: "4 hours ago",
    likes: 18,
    shares: 12
  },
  {
    id: 3,
    title: "African Markets Rally on Positive Economic Indicators",
    description: "Regional stock exchanges show strong performance as economic recovery gains momentum across the continent.",
    image: "/placeholder.jpg",
    author: "African Business",
    time: "6 hours ago", 
    likes: 31,
    shares: 15
  }
]

export function FeedTab() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  
  const topGainers = useAppSelector((state) => state.financialData.topGainers)
  const topLosers = useAppSelector((state) => state.financialData.topLosers)
  const marketIndices = useAppSelector((state) => state.financialData.marketIndices)
  const sectorIndices = useAppSelector((state) => state.financialData.sectorIndices)
  const africanIndices = useAppSelector((state) => state.financialData.africanIndices)
  const worldIndices = useAppSelector((state) => state.financialData.worldIndices)

  const loading = topGainers.loading || topLosers.loading || marketIndices.loading || 
                  sectorIndices.loading || africanIndices.loading || worldIndices.loading
  const error = topGainers.error || topLosers.error || marketIndices.error || 
                sectorIndices.error || africanIndices.error || worldIndices.error

  // Data is now provided by FinancialDataProvider
  // No need for individual API calls here

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      case "error":
        return <div className="w-2 h-2 bg-red-400 rounded-full" />
      case "loading":
        return <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />
    }
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  const formatValue = (value: number, currency: string) => {
    return `${value.toLocaleString()} ${currency}`
  }

  const marketSections = [
    {
      id: "top-gainers",
      title: "Top Gainers (ZSE)",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      status: loading ? "loading" : error ? "error" : "live",
      data: topGainers.data?.top_gainers?.slice(0, 3).map(item => ({
        name: item.symbol,
        change: formatChange(item.change),
        value: formatValue(item.value, item.currency)
      })) || []
    },
    {
      id: "top-losers",
      title: "Top Losers (ZSE)",
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      status: loading ? "loading" : error ? "error" : "live",
      data: topLosers.data?.top_losers?.slice(0, 3).map(item => ({
        name: item.symbol,
        change: formatChange(item.change),
        value: formatValue(item.value, item.currency)
      })) || []
    },
    {
      id: "market-indices",
      title: "Market Indices (ZSE)",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      status: loading ? "loading" : error ? "error" : "live",
      data: marketIndices.data?.market_indices?.slice(0, 3).map(item => ({
        name: item.index,
        change: formatChange(item.change),
        value: formatValue(item.value, item.currency)
      })) || []
    },
    {
      id: "sector-indices",
      title: "Sector Indices (ZSE)",
      icon: Building2,
      color: "from-blue-500 to-blue-600",
      status: loading ? "loading" : error ? "error" : "live",
      data: sectorIndices.data?.sector_indices?.slice(0, 3).map(item => ({
        name: item.index.replace("ZSE ", ""),
        change: formatChange(item.change),
        value: formatValue(item.value, item.currency)
      })) || []
    },
    {
      id: "african-markets",
      title: "African Markets",
      icon: Globe,
      color: "from-teal-500 to-teal-600",
      status: loading ? "loading" : error ? "error" : "live",
      data: africanIndices.data?.indices?.slice(0, 3).map(item => ({
        name: item.symbol,
        change: item['change %'],
        value: item.price
      })) || []
    },
    {
      id: "world-markets",
      title: "World Markets",
      icon: DollarSign,
      color: "from-orange-500 to-orange-600",
      status: loading ? "loading" : error ? "error" : "live",
      data: worldIndices.data?.indices?.slice(0, 3).map(item => ({
        name: item.symbol,
        change: item['change %'],
        value: item.price
      })) || []
    }
  ]

  if (loading) {
    return <TabContentSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Market Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white"
              onClick={() => setSelectedSection(section.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${section.color} flex items-center justify-center`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {section.title}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(section.status)}
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {section.data.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          item.change.startsWith('+') ? 'text-green-600' : 
                          item.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {item.change}
                        </span>
                        <span className="text-gray-500 text-xs">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3 text-xs"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Articles Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Latest Articles</h3>
        <div className="space-y-4">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0">
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{article.author}</span>
                          <span>•</span>
                          <span>{article.time}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {article.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {article.shares}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
