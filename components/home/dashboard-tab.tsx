"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CiDollar,
  CiFilter,
  CiCalendar
} from "react-icons/ci"
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  BarChart3,
  PieChart
} from "lucide-react"

const expenseData = [
  { category: "Operations", amount: 8500, target: 8000, color: "bg-blue-500" },
  { category: "Marketing", amount: 4200, target: 5000, color: "bg-green-500" },
  { category: "Technology", amount: 6800, target: 7000, color: "bg-purple-500" },
  { category: "Administration", amount: 3900, target: 4000, color: "bg-orange-500" }
]

// Trend data for line graphs
const trendData = {
  expenses: [65, 70, 68, 75, 80, 85, 90, 88, 92, 95, 97, 100], // 12 months
  revenue: [45, 50, 55, 60, 58, 65, 70, 75, 80, 85, 90, 95], // 12 months
  expenseProgress: [85, 88, 90, 92, 95, 97, 98, 99, 100, 101, 102, 97.5], // 12 months
  revenueProgress: [95, 98, 100, 102, 105, 108, 110, 112, 115, 118, 120, 104.4] // 12 months
}

const revenueData = [
  { month: "Jan", amount: 45000, target: 40000 },
  { month: "Feb", amount: 52000, target: 45000 },
  { month: "Mar", amount: 48000, target: 50000 },
  { month: "Apr", amount: 61000, target: 55000 },
  { month: "May", amount: 55000, target: 60000 },
  { month: "Jun", amount: 68000, target: 65000 },
  { month: "Jul", amount: 72000, target: 70000 },
  { month: "Aug", amount: 69000, target: 75000 },
  { month: "Sep", amount: 78000, target: 80000 },
  { month: "Oct", amount: 82000, target: 85000 },
  { month: "Nov", amount: 75000, target: 80000 },
  { month: "Dec", amount: 88000, target: 90000 }
]

const filterOptions = [
  { id: "all", label: "All" },
  { id: "expenses", label: "Expenses" },
  { id: "revenue", label: "Revenue" },
  { id: "targets", label: "Targets" }
]

// Component for curved line graph
const CurvedLineGraph = ({ data, color, isPositive, isWhite = false }: { data: number[], color: string, isPositive: boolean, isWhite?: boolean }) => {
  const width = 60
  const height = 20
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue
  
  // Create smooth curved path using quadratic Bézier curves
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - minValue) / range) * height
    return { x, y }
  })
  
  let pathData = `M ${points[0].x},${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]
    
    if (next) {
      // Use quadratic Bézier curves for smooth transitions
      const cp1x = prev.x + (curr.x - prev.x) / 2
      const cp1y = prev.y
      const cp2x = curr.x - (next.x - curr.x) / 2
      const cp2y = curr.y
      
      pathData += ` Q ${cp1x},${cp1y} ${curr.x},${curr.y}`
    } else {
      // Last point
      const cp1x = prev.x + (curr.x - prev.x) / 2
      const cp1y = prev.y
      pathData += ` Q ${cp1x},${cp1y} ${curr.x},${curr.y}`
    }
  }
  
  const strokeColor = isWhite ? "#ffffff" : (isPositive ? "#10b981" : "#ef4444")
  const gradientColor = isWhite ? "#ffffff" : (isPositive ? "#10b981" : "#ef4444")
  
  return (
    <div className="w-16 h-6">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColor} stopOpacity={isWhite ? "0.2" : "0.3"} />
            <stop offset="100%" stopColor={gradientColor} stopOpacity={isWhite ? "0.05" : "0.1"} />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#gradient-${color})`}
        />
      </svg>
    </div>
  )
}

export function DashboardTab() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [chartType, setChartType] = useState<"bar" | "line">("bar")

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0)
  const totalTarget = expenseData.reduce((sum, item) => sum + item.target, 0)
  const progressPercentage = (totalExpenses / totalTarget) * 100

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0)
  const totalRevenueTarget = revenueData.reduce((sum, item) => sum + item.target, 0)
  const revenueProgress = (totalRevenue / totalRevenueTarget) * 100

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-xl border-gray-200 p-4 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-white/80">Total Expenses</p>
              <p className="text-3xl text-white">${totalExpenses.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-2">
                <CurvedLineGraph 
                  data={trendData.expenses} 
                  color="expenses" 
                  isPositive={progressPercentage <= 100}
                  isWhite={true}
                />
                <p className="text-xs text-white/70">{progressPercentage.toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <CiDollar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="border rounded-xl border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl text-gray-900">${totalRevenue.toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-2">
                <CurvedLineGraph 
                  data={trendData.revenue} 
                  color="revenue" 
                  isPositive={revenueProgress >= 100} 
                />
                <p className="text-xs text-gray-500">{revenueProgress.toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="border rounded-xl border-gray-200 p-4 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-white/80">Expense Progress</p>
              <p className="text-3xl text-white">{progressPercentage.toFixed(1)}%</p>
              <p className="text-xs text-white/70 mt-1">
                {progressPercentage > 100 ? "Over Target" : "On Track"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <CurvedLineGraph 
                  data={trendData.expenseProgress} 
                  color="expenseProgress" 
                  isPositive={progressPercentage <= 100}
                  isWhite={true}
                />
                <p className="text-xs text-white/70">{progressPercentage.toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="border rounded-xl border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Revenue Progress</p>
              <p className="text-3xl text-gray-900">{revenueProgress.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {revenueProgress > 100 ? "Exceeding Target" : "On Track"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <CurvedLineGraph 
                  data={trendData.revenueProgress} 
                  color="revenueProgress" 
                  isPositive={revenueProgress >= 100} 
                />
                <p className="text-xs text-gray-500">{revenueProgress.toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Comparison Chart */}
      <div className="border rounded-xl border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-xl text-gray-900 mb-2">Monthly Performance Comparison</h3>
          <p className="text-sm text-gray-600">Revenue vs Target Performance</p>
        </div>
        <div className="h-80 flex items-end justify-between gap-4 relative">
          {/* Y-axis values */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
            <div className="text-right">$100k</div>
            <div className="text-right">$80k</div>
            <div className="text-right">$60k</div>
            <div className="text-right">$40k</div>
            <div className="text-right">$20k</div>
            <div className="text-right">$0</div>
          </div>
          
          {/* Chart area with left margin for Y-axis */}
          <div className="flex-1 flex items-end justify-between gap-4 ml-8">
            {revenueData.map((item, index) => {
              const maxAmount = Math.max(...revenueData.map(d => Math.max(d.amount, d.target)))
              const actualHeight = (item.amount / maxAmount) * 100
              const targetHeight = (item.target / maxAmount) * 100
              
              return (
                <div key={item.month} className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-full flex items-end justify-center gap-1 h-64">
                    {/* Target Bar */}
                    <motion.div
                      className="w-6 bg-gradient-to-t from-orange-200/70 to-orange-300/80 rounded-t-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${targetHeight}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    />
                    
                    {/* Actual Bar */}
                    <motion.div
                      className="w-6 bg-gradient-to-t from-blue-300/60 to-blue-400/70 rounded-t-sm"
                      initial={{ height: 0 }}
                      animate={{ height: `${actualHeight}%` }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>
                  
                  {/* Month Label */}
                  <div className="text-sm text-gray-700 font-medium">{item.month}</div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-blue-300/60 to-blue-400/70 rounded"></div>
            <span className="text-sm text-gray-600">Actual Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-orange-200/70 to-orange-300/80 rounded"></div>
            <span className="text-sm text-gray-600">Target Revenue</span>
          </div>
        </div>
      </div>

      {/* Filters and Chart Controls */}
      <div className="border rounded-xl border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CiFilter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Filter by:</span>
            <div className="flex gap-2">
              {filterOptions.map(option => (
                <Button
                  key={option.id}
                  variant={activeFilter === option.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(option.id)}
                  className={`flex items-center gap-2 rounded-full cursor-pointer transition-all duration-200 ${
                    activeFilter === option.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                      : "bg-transparent border-2 border-transparent text-gray-700 hover:text-white hover:from-green-600 hover:to-teal-700"
                  }`}
                  style={activeFilter === option.id ? {
                    color: 'white'
                  } : {
                    color: '#374151',
                    background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #10b981, #0d9488) border-box',
                    border: '2px solid transparent'
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="border rounded-xl border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Expense Breakdown</h3>
          </div>
          <div className="space-y-4">
            {expenseData.slice(0, 4).map((item, index) => {
              const progress = (item.amount / item.target) * 100
              const isOverTarget = item.amount > item.target
              
              return (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`} />
                      <span className="font-medium text-sm">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${item.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Target: ${item.target.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={isOverTarget ? "text-red-600" : "text-green-600"}>
                      {progress.toFixed(1)}% {isOverTarget ? "Over Target" : "of Target"}
                    </span>
                    {isOverTarget && (
                      <Badge variant="destructive" className="text-xs">
                        Over Budget
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="border rounded-xl border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
          </div>
          <div className="space-y-4">
            {revenueData.slice(0, 6).map((item, index) => {
              const progress = (item.amount / item.target) * 100
              const isOverTarget = item.amount > item.target
              
              return (
                <motion.div
                  key={item.month}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {item.month}
                    </div>
                    <div>
                      <div className="font-medium">${item.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Target: ${item.target.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isOverTarget ? "text-green-600" : "text-gray-600"}`}>
                      {progress.toFixed(1)}%
                    </div>
                    {isOverTarget ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-gray-400 mx-auto" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

    </div>
  )
}
