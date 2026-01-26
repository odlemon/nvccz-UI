"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, BarChart3, PieChart, Download, Calendar, Target, Award } from "lucide-react"

const performanceMetrics = [
  {
    period: "Q4 2024",
    irr: "18.7%",
    multiple: "1.4x",
    deployed: "$115M",
    nav: "$161M",
    trend: "up",
    change: "+2.3%",
  },
  {
    period: "Q3 2024",
    irr: "16.4%",
    multiple: "1.3x",
    deployed: "$108M",
    nav: "$140M",
    trend: "up",
    change: "+1.8%",
  },
  {
    period: "Q2 2024",
    irr: "14.1%",
    multiple: "1.2x",
    deployed: "$95M",
    nav: "$114M",
    trend: "up",
    change: "+1.2%",
  },
]

const benchmarkComparison = [
  {
    metric: "IRR",
    arcus: "18.7%",
    benchmark: "15.2%",
    difference: "+3.5%",
    status: "outperforming",
  },
  {
    metric: "Multiple",
    arcus: "1.4x",
    benchmark: "1.2x",
    difference: "+0.2x",
    status: "outperforming",
  },
  {
    metric: "Deployment Rate",
    arcus: "77%",
    benchmark: "72%",
    difference: "+5%",
    status: "outperforming",
  },
]

const topPerformers = [
  {
    company: "TechFlow Solutions",
    investment: "$2.5M",
    currentValue: "$4.2M",
    multiple: "1.68x",
    irr: "23.4%",
  },
  {
    company: "GreenEnergy Corp",
    investment: "$1.8M",
    currentValue: "$2.9M",
    multiple: "1.61x",
    irr: "22.1%",
  },
  {
    company: "HealthTech Innovations",
    investment: "$500K",
    currentValue: "$750K",
    multiple: "1.50x",
    irr: "18.9%",
  },
]

export default function PerformanceAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive performance analysis and benchmarking</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Portfolio IRR</p>
                <p className="text-2xl font-bold text-green-900">18.7%</p>
                <p className="text-sm text-green-600 mt-1">+2.3% vs last quarter</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Portfolio Multiple</p>
                <p className="text-2xl font-bold text-blue-900">1.4x</p>
                <p className="text-sm text-blue-600 mt-1">MOIC across all funds</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Unrealized Gains</p>
                <p className="text-2xl font-bold text-purple-900">$46M</p>
                <p className="text-sm text-purple-600 mt-1">40% of portfolio</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Risk Score</p>
                <p className="text-2xl font-bold text-amber-900">7.2</p>
                <p className="text-sm text-amber-600 mt-1">Moderate risk</p>
              </div>
              <Target className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Quarterly Performance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((period, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{period.period}</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {period.change}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">IRR</p>
                    <p className="font-semibold text-green-600">{period.irr}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Multiple</p>
                    <p className="font-semibold text-blue-600">{period.multiple}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Deployed</p>
                    <p className="font-semibold">{period.deployed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current NAV</p>
                    <p className="font-semibold">{period.nav}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unrealized Gain</p>
                    <p className="font-semibold text-green-600">
                      $
                      {(
                        Number.parseFloat(period.nav.replace("$", "").replace("M", "")) -
                        Number.parseFloat(period.deployed.replace("$", "").replace("M", ""))
                      ).toFixed(0)}
                      M
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Comparison & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Benchmark Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benchmarkComparison.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.metric}</p>
                    <p className="text-sm text-gray-600">
                      Arcus: {item.arcus} | Benchmark: {item.benchmark}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {item.difference}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((company, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{company.company}</h4>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {company.irr}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Investment</p>
                      <p className="font-semibold">{company.investment}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Value</p>
                      <p className="font-semibold text-green-600">{company.currentValue}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Multiple</p>
                      <p className="font-semibold text-blue-600">{company.multiple}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-green-700">7.2</span>
              </div>
              <h4 className="font-semibold">Overall Risk Score</h4>
              <p className="text-sm text-gray-600">Moderate Risk Profile</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-blue-700">85%</span>
              </div>
              <h4 className="font-semibold">Diversification Score</h4>
              <p className="text-sm text-gray-600">Well Diversified</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-amber-700">12%</span>
              </div>
              <h4 className="font-semibold">Volatility</h4>
              <p className="text-sm text-gray-600">Below Market Average</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
