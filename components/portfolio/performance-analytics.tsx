"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, Download } from "lucide-react"
import { PortfolioTabView, PortfolioTabType } from "./portfolio-tab-view"
import { PerformanceChart } from "./performance-chart"
import { SectorPerformanceChart } from "./sector-performance-chart"
import { RiskReturnChart } from "./risk-return-chart"

export function PerformanceAnalytics() {
  const [activeTab, setActiveTab] = useState<PortfolioTabType>("performance")

  const performanceMetrics = [
    {
      title: "Total Return",
      value: "24.8%",
      benchmark: "18.2%",
      period: "YTD",
      trend: "up",
    },
    {
      title: "Net IRR",
      value: "18.2%",
      benchmark: "15.0%",
      period: "Since Inception",
      trend: "up",
    },
    {
      title: "Multiple (MOIC)",
      value: "2.4x",
      benchmark: "2.1x",
      period: "Realized",
      trend: "up",
    },
    {
      title: "Sharpe Ratio",
      value: "1.85",
      benchmark: "1.42",
      period: "3Y",
      trend: "up",
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "performance":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-normal text-gray-800 mb-4">Portfolio Performance vs Benchmark</h3>
              <PerformanceChart />
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-normal text-gray-800 mb-4">Risk-Return Analysis</h3>
              <RiskReturnChart />
            </div>
          </div>
        )
      
      case "sectors":
        return (
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sector Performance Analysis</h3>
            <SectorPerformanceChart />
          </div>
        )
      
      case "risk":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Metrics</h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Portfolio Beta</span>
                    <Badge className="bg-green-100 text-green-700 border-green-200">0.85</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Value at Risk (95%)</span>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">-2.4%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Maximum Drawdown</span>
                    <Badge className="bg-red-100 text-red-700 border-red-200">-8.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Volatility (Annualized)</span>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">12.4%</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Correlation Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">S&P 500</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">0.72</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">NASDAQ</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">0.68</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Russell 2000</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">0.45</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Private Equity Index</span>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">0.82</Badge>
                </div>
              </div>
            </div>
          </div>
        )
      
      case "benchmarks":
        return (
          <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Benchmark Comparison</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-white/60 border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-700">S&P 500</h4>
                  <div className="text-2xl font-bold mt-1 text-gray-800">+15.2%</div>
                  <p className="text-xs text-gray-600">YTD Return</p>
                </div>
                <div className="p-4 rounded-lg bg-white/60 border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-700">Private Equity Index</h4>
                  <div className="text-2xl font-bold mt-1 text-gray-800">+18.7%</div>
                  <p className="text-xs text-gray-600">YTD Return</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-300">
                  <h4 className="font-medium text-sm text-blue-800">Kyntaro Portfolio</h4>
                  <div className="text-2xl font-bold mt-1 text-blue-900">+24.8%</div>
                  <p className="text-xs text-blue-700">YTD Return</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Performance Analytics</h1>
          <p className="text-lg text-gray-600">Detailed analysis of portfolio performance and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white/80 border-gray-300 hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="bg-white/80 border-gray-300 hover:bg-gray-50">
            <Calendar className="w-4 h-4 mr-2" />
            Time Period
          </Button>
          <Button className="gradient-primary text-white hover:opacity-90">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className={`rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 ${index % 2 === 0 ? 'gradient-primary' : 'bg-white'}`}>
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${index % 2 === 0 ? 'text-white' : 'text-gray-600'}`}>{metric.title}</h3>
              <div className={`text-4xl ${index % 2 === 0 ? 'text-white' : 'text-gray-800'}`}>{metric.value}</div>
              <div className="flex items-center justify-between">
                <Badge className={`text-xs ${index % 2 === 0 ? 'bg-white/20 text-white border-white/30' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                  vs {metric.benchmark}
                </Badge>
                <span className={`text-xs ${index % 2 === 0 ? 'text-white/80' : 'text-gray-500'}`}>{metric.period}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Tabs */}
      <PortfolioTabView activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTabContent()}
      </PortfolioTabView>
    </div>
  )
}
