"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DollarSign,
  FileText,
  Users,
  CreditCard,
  Receipt,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { CiViewTable } from "react-icons/ci"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useAccountingDashboard } from "@/lib/hooks/use-accounting-dashboard"
import { fetchCurrencies } from "@/lib/store/slices/accountingSlice"
import type { RootState, AppDispatch } from "@/lib/store/store"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { accountingApi } from "@/lib/api/accounting-api"  // Add import for accounting API

interface FinancialChartPoint {
  date: string
  sales: number
  credits: number
}

interface FinancialChartProps {
  data: FinancialChartPoint[]
}

// Financial chart component matching PayrollChart exactly but with daily granularity
function FinancialChart({ data }: FinancialChartProps) {
  const config = {
    sales: { label: "Sales Revenue", color: "#60a5fa" },
    credits: { label: "Credit Notes", color: "#ef4444" },
  }

  return (
    <ChartContainer config={config} className="w-full h-80">
      <AreaChart data={data} margin={{ left: 16, right: 16, top: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 14, fill: '#111827' }}
          tickFormatter={(value) => {
            const date = new Date(value);
            // Only show the tick at the 1st of each month to keep it clean
            return date.getDate() === 1 ? format(date, "MMM") : "";
          }}
          interval={0} // Force evaluation for every date to catch the 1st
        />
        <YAxis
          tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fontSize: 14, fill: '#111827' }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="text-sm"
              labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="var(--color-sales)"
          strokeWidth={3}
          fill="var(--color-sales)"
          fillOpacity={0.2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="credits"
          stroke="var(--color-credits)"
          strokeWidth={3}
          fill="var(--color-credits)"
          fillOpacity={0.2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function AccountingDashboard() {
  const dispatch = useDispatch<AppDispatch>()

  const {
    dashboardStats,
    chartData,
    recentExpenses,
    loading,
    loadDashboardData
  } = useAccountingDashboard()

  const [filteredInvoicesTotal, setFilteredInvoicesTotal] = useState(0)
  const [filteredInvoicesCount, setFilteredInvoicesCount] = useState(0)

  useEffect(() => {
    dispatch(fetchCurrencies())
    // Load all data without filters
    loadDashboardData()
  }, [dispatch, loadDashboardData])

  if (loading && !dashboardStats) {
    return <AccountingDashboardSkeleton />
  }

  const accountingMetrics = [
    {
      title: "Sales Invoices",
      value: filteredInvoicesCount || dashboardStats?.invoices.count || 0,
      amount: `$${filteredInvoicesTotal.toLocaleString()}`,
      change: `${(dashboardStats?.invoices.change || 0).toFixed(1)}% from last month`,
      trend: (dashboardStats?.invoices.change || 0) >= 0 ? "up" : "down",
      icon: FileText
    },
    {
      title: "Credit Notes",
      value: dashboardStats?.creditNotes.count || 0,
      amount: `$${(dashboardStats?.creditNotes.totalAmount || 0).toLocaleString()}`,
      change: `${Math.abs(dashboardStats?.creditNotes.change || 0).toFixed(1)}% from last month`,
      trend: (dashboardStats?.creditNotes.change || 0) >= 0 ? "up" : "down",
      icon: CreditCard
    },
    {
      title: "Active Customers",
      value: dashboardStats?.customers.count || 0,
      amount: `$${(dashboardStats?.customers.totalValue || 0).toLocaleString()}`,
      change: `${Math.abs(dashboardStats?.customers.change || 0).toFixed(1)}% from last month`,
      trend: (dashboardStats?.customers.change || 0) >= 0 ? "up" : "down",
      icon: Users
    },
    {
      title: "Expenses",
      value: dashboardStats?.expenses.count || 0,
      amount: `$${(dashboardStats?.expenses.totalAmount || 0).toLocaleString()}`,
      change: `${Math.abs(dashboardStats?.expenses.change || 0).toFixed(1)}% from last month`,
      trend: (dashboardStats?.expenses.change || 0) >= 0 ? "up" : "down",
      icon: Receipt
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Accounting Dashboard</h1>
          <p className="text-gray-600 font-normal">Overview of your financial performance</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {accountingMetrics.map((metric, index) => {
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
                <div className={`text-3xl font-bold ${index % 2 === 0 ? 'text-white' : 'text-gray-900'}`}>{metric.value}</div>
                <div className={`text-lg font-semibold ${index % 2 === 0 ? 'text-white/90' : 'text-gray-700'} mb-2`}>{metric.amount}</div>
                <div className={`flex items-center gap-1 ${index % 2 === 0 ? 'text-white/80' : 'text-gray-600'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span className="text-xs">{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart Section */}
      <div className="rounded-2xl border border-gray-200 py-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base font-normal mb-3">
            <div className="flex items-center gap-2">
              <CiViewTable className="w-5 h-5" /> Financial Overview
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[320px] w-full rounded-2xl" />
          ) : (
            <FinancialChart data={chartData} />
          )}
        </CardContent>
      </div>

      {/* Recent Expenses */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-600" />
            Recent Expenses
          </CardTitle>
          <Button variant="outline" size="sm" className="rounded-full">
            <Eye className="w-4 h-4 mr-2" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentExpenses.length > 0 ? recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                      <Receipt className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{expense.vendor?.name || 'Unknown Vendor'}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {expense.category?.name || 'Uncategorized'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">
                    ${parseFloat(expense.amount || '0').toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(expense.expenseDate || expense.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent expenses found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AccountingDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="border border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full rounded-2xl" />
        </CardContent>
      </Card>

      {/* Recent Expenses Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}