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
    { label: "Avg Rating", value: avgRating, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50/50" },
    { label: "Total Reviews", value: totalReviews.toString(), icon: Users, color: "text-purple-500", bg: "bg-purple-50/50" },
    { label: "Finalized", value: totalReviews > 0 ? Math.floor(totalReviews * 0.8).toString() : "0", icon: Target, color: "text-green-500", bg: "bg-green-50/50" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-gray-100 shadow-none bg-white rounded-xl">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-medium text-gray-900 leading-none mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-none rounded-xl bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 p-6 bg-gray-50/20">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-3 text-gray-900">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Rating Distribution
            </CardTitle>
            <CardDescription className="text-gray-400 font-normal text-xs pt-1">Overview of performance scores across the organization.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Filter:</span>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-[200px] rounded-full h-9 bg-white border-gray-100 font-medium text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg border-gray-50">
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
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2 opacity-30" />
              <p className="text-xs text-gray-300 font-normal">Updating data...</p>
            </div>
          ) : (
            <>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis 
                      dataKey="rating" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc', radius: 4 }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', padding: '10px' }}
                      itemStyle={{ fontWeight: 500, fontSize: '12px', color: '#64748b' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-gray-50/50 border border-gray-50">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color, opacity: 0.7 }} />
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Score {d.rating}</span>
                    <span className="text-[10px] font-medium text-gray-700 bg-white px-2 py-0 rounded-full border border-gray-100">{d.count}</span>
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
