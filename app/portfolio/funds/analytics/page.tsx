"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Download } from "lucide-react"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"

const performanceData = [
  {
    fund: "Arcus Growth Fund I",
    irr: "18.5%",
    multiple: "1.4x",
    deployed: "$32M",
    nav: "$44.8M",
    trend: "up",
    companies: 12,
  },
  {
    fund: "Arcus Seed Fund",
    irr: "22.3%",
    multiple: "1.6x",
    deployed: "$15M",
    nav: "$24M",
    trend: "up",
    companies: 8,
  },
  {
    fund: "Arcus Tech Fund",
    irr: "15.2%",
    multiple: "1.2x",
    deployed: "$68M",
    nav: "$81.6M",
    trend: "up",
    companies: 18,
  },
]

const sectorAllocation = [
  { sector: "Technology", percentage: 45, amount: "$51.3M" },
  { sector: "Healthcare", percentage: 25, amount: "$28.5M" },
  { sector: "Clean Energy", percentage: 20, amount: "$22.8M" },
  { sector: "Fintech", percentage: 10, amount: "$11.4M" },
]

export default function FundAnalyticsPage() {
  return (
    <ModuleGuard moduleId="portfolio-management" subModuleId="funds">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fund Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive performance analysis across all funds</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Portfolio IRR</p>
                  <p className="text-2xl font-bold text-blue-900">18.7%</p>
                  <p className="text-sm text-blue-600 mt-1">Weighted average</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Portfolio Multiple</p>
                  <p className="text-2xl font-bold text-green-900">1.4x</p>
                  <p className="text-sm text-green-600 mt-1">Blended MOIC</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Total NAV</p>
                  <p className="text-2xl font-bold text-purple-900">$150.4M</p>
                  <p className="text-sm text-purple-600 mt-1">Current valuation</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">Deployment Rate</p>
                  <p className="text-2xl font-bold text-amber-900">77%</p>
                  <p className="text-sm text-amber-600 mt-1">Capital deployed</p>
                </div>
                <PieChart className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fund Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Fund Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.map((fund, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{fund.fund}</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {fund.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      Performing
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">IRR</p>
                      <p className="font-semibold text-green-600">{fund.irr}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Multiple</p>
                      <p className="font-semibold text-blue-600">{fund.multiple}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Deployed</p>
                      <p className="font-semibold">{fund.deployed}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current NAV</p>
                      <p className="font-semibold">{fund.nav}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Companies</p>
                      <p className="font-semibold">{fund.companies}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unrealized Gain</p>
                      <p className="font-semibold text-green-600">
                        $
                        {(
                          Number.parseFloat(fund.nav.replace("$", "").replace("M", "")) -
                          Number.parseFloat(fund.deployed.replace("$", "").replace("M", ""))
                        ).toFixed(1)}
                        M
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectorAllocation.map((sector, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{sector.sector}</span>
                      <span className="text-sm text-gray-600">{sector.amount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sector.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-gray-600">{sector.percentage}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">IRR Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Top Quartile &gt;20%</span>
                      <span className="font-semibold text-green-600">1 fund</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Second Quartile 15-20%</span>
                      <span className="font-semibold text-blue-600">2 funds</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Below 15%</span>
                      <span className="font-semibold text-gray-600">0 funds</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Vintage Year Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>2021 Vintage</span>
                      <span className="font-semibold">15.2% IRR</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>2022 Vintage</span>
                      <span className="font-semibold">18.5% IRR</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>2023 Vintage</span>
                      <span className="font-semibold">22.3% IRR</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleGuard>
  )
}
