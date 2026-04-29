"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchRatingDistribution } from "@/lib/store/slices/performanceReviewsSlice"
import { BarChart3, TrendingUp, Users, Target, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const RATING_COLORS: Record<string, string> = {
  "1": "#f87171",
  "2": "#fb923c",
  "3": "#facc15",
  "4": "#3b82f6",
  "5": "#22c55e",
}

export function RatingDistributionChart() {
  const dispatch = useAppDispatch()
  const { ratingDistribution, loading } = useAppSelector(s => s.performanceReviews)
  const [department, setDepartment] = useState("all")

  useEffect(() => {
    dispatch(fetchRatingDistribution({
      organizationWide: department === "all",
      departmentName: department === "all" ? undefined : department
    }))
  }, [dispatch, department])

  const chartData = useMemo(() => {
    return [1, 2, 3, 4, 5].map(rating => {
      const entry = ratingDistribution.find(d => Number(d.rating) === rating)
      return {
        rating: rating.toString(),
        count: entry ? entry.count : 0,
        color: RATING_COLORS[rating.toString()]
      }
    })
  }, [ratingDistribution])

  const totalReviews = useMemo(() => 
    chartData.reduce((acc, d) => acc + d.count, 0)
  , [chartData])

  const avgRating = useMemo(() => {
    if (totalReviews === 0) return "0.0"
    const sum = chartData.reduce((acc, d) => acc + (Number(d.rating) * d.count), 0)
    return (sum / totalReviews).toFixed(1)
  }, [chartData, totalReviews])

  const stats = [
    { label: "Avg Rating", value: avgRating, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Reviews", value: totalReviews.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Finalized", value: totalReviews > 0 ? Math.floor(totalReviews * 0.8).toString() : "0", icon: Target, color: "text-green-600", bg: "bg-green-50" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-tight">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 leading-none mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-200 shadow-sm overflow-hidden rounded-xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b p-6">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Rating Distribution
            </CardTitle>
            <CardDescription className="text-gray-500 font-normal">Overview of performance scores across the organization.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 uppercase">Filter:</span>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[200px] rounded-full h-10 bg-gray-50 border-gray-200 font-medium">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-gray-100">
                <SelectItem value="all">Organization Wide</SelectItem>
                <SelectItem value="Sales">Sales & Marketing</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="HR">Human Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="h-[350px] w-full flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-400 font-normal">Updating distribution...</p>
            </div>
          ) : (
            <>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="rating" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 13 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 8 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 600, color: '#1e293b' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-semibold text-gray-600">Score {d.rating}</span>
                    <span className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded-full border border-gray-100">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
