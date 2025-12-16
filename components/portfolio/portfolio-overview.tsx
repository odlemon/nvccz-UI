"use client"

import { useEffect, useMemo } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchPortfolioDashboardData } from "@/lib/store/slices/portfolioDashboardSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Users,
  Calendar,
  Filter,
  FileText,
} from "lucide-react"
import { AssetAllocationChart } from "./asset-allocation-chart"
import { PerformanceChart } from "./performance-chart"

export function PortfolioOverview() {
  const dispatch = useAppDispatch()
  const { metrics, isLoading, companies, funds, applications, error } = useAppSelector(
    (state) => state.portfolioDashboard
  )

  useEffect(() => {
    dispatch(fetchPortfolioDashboardData())
  }, [dispatch])

  const portfolioMetrics = [
    {
      title: "Total Portfolio Value",
      value: `$${(metrics.totalInvested / 1000).toFixed(1)}K`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Total Requested",
      value: `$${(metrics.totalRequested / 1000).toFixed(1)}K`,
      change: `${metrics.totalApplications} apps`,
      trend: "up",
      icon: FileText,
    },
    {
      title: "Active Companies",
      value: companies.length.toString(),
      change: `of ${companies.length}`,
      trend: "up",
      icon: Building2,
    },
    {
      title: "Total Disbursed",
      value: `$${(metrics.totalDisbursed / 1000).toFixed(1)}K`,
      change: `${funds.reduce((sum, f) => sum + (f.fundDisbursements?.length || 0), 0)} txns`,
      trend: "up",
      icon: PieChart,
    },
  ]

  // Get top performing sectors by investment
  const topPerformers = useMemo(() => {
    const sectorMap = new Map<string, { value: number, count: number }>()
    
    companies.forEach(company => {
      const invested = Number(company.totalInvested) || 0
      const existing = sectorMap.get(company.industry) || { value: 0, count: 0 }
      sectorMap.set(company.industry, {
        value: existing.value + invested,
        count: existing.count + 1
      })
    })

    return Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        name: sector,
        sector: sector,
        value: `$${data.value > 0 ? (data.value / 1000).toFixed(1) : '0'}K`,
        rawValue: data.value,
        return: `${data.count} ${data.count === 1 ? 'company' : 'companies'}`
      }))
      .sort((a, b) => b.rawValue - a.rawValue)
      .slice(0, 4)
  }, [companies])

  // Get recent disbursements across all funds
  const recentTransactions = useMemo(() => {
    const allDisbursements = funds.flatMap(fund => 
      (fund.fundDisbursements || []).map(d => ({
        ...d,
        fundName: fund.name
      }))
    )
    
    return allDisbursements
      .sort((a, b) => {
        const dateA = new Date(a.disbursedAt || a.createdAt || a.disbursementDate || '').getTime()
        const dateB = new Date(b.disbursedAt || b.createdAt || b.disbursementDate || '').getTime()
        return dateB - dateA
      })
      .slice(0, 5)
  }, [funds])

  // Get monthly performance data for funds and companies
  const monthlyPerformanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    // Initialize data structure
    const monthlyData = months.map((month, index) => ({
      month,
      fundsDisbursed: 0,
      companiesInvested: 0
    }))

    // Aggregate fund disbursements by month
    funds.forEach(fund => {
      (fund.fundDisbursements || []).forEach(disbursement => {
        if (disbursement.status === 'DISBURSED' && disbursement.disbursedAt) {
          const date = new Date(disbursement.disbursedAt)
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth()
            monthlyData[monthIndex].fundsDisbursed += Number(disbursement.amount || 0)
          }
        }
      })
    })

    // Aggregate company investments by month (using disbursement date)
    companies.forEach(company => {
      if (company.disbursements && Array.isArray(company.disbursements)) {
        company.disbursements.forEach(disbursement => {
          if (disbursement && disbursement.disbursementDate) {
            const date = new Date(disbursement.disbursementDate)
            if (date.getFullYear() === currentYear) {
              const monthIndex = date.getMonth()
              monthlyData[monthIndex].companiesInvested += Number(disbursement.amount || 0)
            }
          }
        })
      }
    })

    return monthlyData
  }, [funds, companies])

  // Sector distribution for pie chart
  const sectorDistribution = useMemo(() => {
    const sectorMap = new Map<string, number>()
    companies.forEach(company => {
      sectorMap.set(company.industry, (sectorMap.get(company.industry) || 0) + 1)
    })
    return Array.from(sectorMap.entries()).map(([name, value]) => ({ name, value }))
  }, [companies])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border border-gray-200 rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Health Indicators Skeleton */}
        <Card className="border border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => dispatch(fetchPortfolioDashboardData())} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal">Portfolio Overview</h1>
          <p className="text-muted-foreground">Comprehensive view of your investment portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="bg-transparent">
            <Calendar className="w-4 h-4 mr-2" />
            Q4 2024
          </Button>
          <Button className="gradient-primary text-white" onClick={() => dispatch(fetchPortfolioDashboardData())}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioMetrics.map((metric, index) => {
          const Icon = metric.icon
          const isPositive = metric.trend === "up"

          return (
            <Card key={index} className={`border border-gray-200 hover:border-gray-300 transition-all duration-300 ${index % 2 === 0 ? 'gradient-primary' : 'bg-white'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${index % 2 === 0 ? 'text-white' : ''}`}>{metric.title}</CardTitle>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index % 2 === 0 ? 'bg-white/20' : 'gradient-primary'}`}>
                  <Icon className={`h-4 w-4 ${index % 2 === 0 ? 'text-white' : 'text-white'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-5xl font-normal ${index % 2 === 0 ? 'text-white' : ''}`}>{metric.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {isPositive ? (
                    <ArrowUpRight className={`w-3 h-3 ${index % 2 === 0 ? 'text-white/80' : 'text-green-600'}`} />
                  ) : (
                    <ArrowDownRight className={`w-3 h-3 ${index % 2 === 0 ? 'text-white/80' : 'text-red-600'}`} />
                  )}
                  <p className={`text-sm font-medium ${index % 2 === 0 ? 'text-white/80' : isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <div className="border border-gray-200 rounded-2xl p-3 bg-white hover:border-gray-300 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <PieChart className="w-4 h-4 text-white" />
              </div>
              Sector Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssetAllocationChart data={sectorDistribution} />
          </CardContent>
        </div>

        {/* Performance Chart */}
        <div className="border border-gray-200 rounded-2xl p-3 hover:border-gray-300 transition-all duration-300 gradient-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Monthly Performance ({new Date().getFullYear()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={monthlyPerformanceData} />
          </CardContent>
        </div>
      </div>

      {/* Top Performers & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              Top Sectors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.length > 0 ? (
              topPerformers.map((sector, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{sector.name}</h4>
                    <p className="text-xs text-muted-foreground">{sector.sector}</p>
                    <p className="text-sm font-semibold mt-1">{sector.value}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{sector.return}</Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 gradient-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Recent Disbursements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions?.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-white">{txn.investmentImplementation.portfolioCompany.name}</h4>
                      <p className="text-xs text-white/70">{txn.fundName}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(txn.disbursedAt || txn.disbursementDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">${Number(txn.amount).toLocaleString()}</p>
                      <Badge className="bg-white/20 text-white text-xs">{txn.disbursementType}</Badge>
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <p className="text-center text-white/70 py-4">No disbursements yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Portfolio Health Indicators */}
      <Card className="border border-gray-200 hover:border-gray-300 transition-all duration-300 bg-white">
        <CardHeader>
          <CardTitle>Portfolio Health Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Diversification Score</span>
                <span className="font-medium">
                  {companies.length === 0 
                    ? '0%' 
                    : sectorDistribution.length === 0 
                    ? '0%'
                    : sectorDistribution.length === 1 
                    ? '20%'
                    : sectorDistribution.length === 2
                    ? '40%'
                    : sectorDistribution.length === 3
                    ? '65%'
                    : sectorDistribution.length >= 4
                    ? '85%'
                    : '0%'
                  }
                </span>
              </div>
              <Progress 
                value={companies.length === 0 
                  ? 0 
                  : sectorDistribution.length === 0 
                  ? 0
                  : sectorDistribution.length === 1 
                  ? 20
                  : sectorDistribution.length === 2
                  ? 40
                  : sectorDistribution.length === 3
                  ? 65
                  : sectorDistribution.length >= 4
                  ? 85
                  : 0
                } 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {companies.length === 0 
                  ? 'No companies in portfolio'
                  : sectorDistribution.length === 0
                  ? 'No sector data available'
                  : sectorDistribution.length === 1
                  ? 'Single sector - high concentration risk'
                  : sectorDistribution.length === 2
                  ? 'Limited diversification - consider expanding'
                  : sectorDistribution.length === 3
                  ? 'Moderate diversification'
                  : 'Well diversified across sectors'
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deployment Rate</span>
                <span className="font-medium">
                  {metrics.totalInvested > 0 && metrics.totalRequested > 0 
                    ? `${Math.round((metrics.totalInvested / metrics.totalRequested) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <Progress 
                value={metrics.totalInvested > 0 && metrics.totalRequested > 0 
                  ? (metrics.totalInvested / metrics.totalRequested) * 100
                  : 0
                } 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {metrics.totalInvested === 0 && metrics.totalRequested === 0
                  ? 'No deployment activity yet'
                  : 'Capital deployment efficiency'
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Portfolio</span>
                <span className="font-medium">
                  {companies.length > 0 ? `${Math.round((metrics.activeCompanies / companies.length) * 100)}%` : '0%'}
                </span>
              </div>
              <Progress 
                value={companies.length > 0 ? (metrics.activeCompanies / companies.length) * 100 : 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {companies.length === 0 
                  ? 'No companies in portfolio'
                  : 'Active company ratio'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
