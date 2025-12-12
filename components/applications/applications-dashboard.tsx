"use client"

import { useState, useEffect } from "react"
import { useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IconType } from "react-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  CiFileOn, 
  CiUser, 
  CiCircleCheck, 
  CiDollar, 
  CiClock1, 
  CiCircleChevUp, 
  CiFilter, 
  CiCirclePlus, 
  CiSearch 
} from "react-icons/ci"
import { Input } from "@/components/ui/input"
import { ApplicationsPipeline } from "./applications-pipeline"
import { RecentApplications } from "./recent-applications"
import { ApplicationTimeline } from "./application-timeline"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts'
import { DashboardSkeleton } from "@/components/ui/skeleton-loader"
import { InitiateFundDisbursementDialog } from "./initiate-fund-disbursement-dialog"

export type Application = {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  applicantAddress: string
  businessName: string
  businessDescription: string
  industry: string
  businessStage: string
  foundingDate: string
  requestedAmount: string
  currentStage: string
  submittedAt: string | null
  updatedAt: string
  createdAt: string
  portfolioCompanyId: string
  fundId: string
  investmentImplementation?: {
    id: string
    portfolioCompanyId: string
  } | null
  documents: Array<{
    id: string
    documentType: string
    fileName: string
    isRequired: boolean
    isSubmitted: boolean
  }>
}

export function ApplicationsDashboard() {
  const token = useAppSelector((s) => s.auth.token)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showInitiateFundDisbursementDialog, setShowInitiateFundDisbursementDialog] = useState(false)
  const [selectedApplicationForDisbursement, setSelectedApplicationForDisbursement] = useState<Application | null>(null)

  // Fetch applications data
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("http://31.220.82.129:3010/api/applications", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const data = await res.json()
        setApplications(data.data?.applications || [])
      } catch (error: any) {
        console.error("Error fetching applications:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchApplications()
    }
  }, [token])

  // Calculate actual statistics
  const calculateStats = () => {
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
      return {
        pipelineStats: [],
        chartData: [],
        keyMetrics: [
          {
            title: "Applications This Month",
            value: "0",
            change: "+0%",
            trend: "up",
          },
          {
            title: "Average Processing Time",
            value: "0 days",
            change: "0%",
            trend: "down",
          },
          {
            title: "Approval Rate",
            value: "0%",
            change: "0%",
            trend: "up",
          },
          {
            title: "Total Pipeline Value",
            value: "$0M",
            change: "0%",
            trend: "up",
          },
        ],
        totalApplications: 0,
        totalValue: 0
      }
    }

    // Group applications by stage - merge DUE_DILIGENCE_COMPLETED into UNDER_DUE_DILIGENCE
    const stageGroups = applications.reduce((acc, app) => {
      let stage = app.currentStage
      
      // Merge DUE_DILIGENCE_COMPLETED into UNDER_DUE_DILIGENCE for display
      if (stage === 'DUE_DILIGENCE_COMPLETED') {
        stage = 'UNDER_DUE_DILIGENCE'
      }
      
      if (!acc[stage]) {
        acc[stage] = { count: 0, totalAmount: 0, applications: [] }
      }
      acc[stage].count++
      acc[stage].totalAmount += parseFloat(app.requestedAmount || '0')
      acc[stage].applications.push(app)
      return acc
    }, {} as Record<string, { count: number; totalAmount: number; applications: Application[] }>)

    // Map stages to display names and calculate percentages
    const stageMapping = {
      'INITIAL_SCREENING': { name: 'Initial Screening', icon: CiFileOn, color: 'oklch(0.60 0.18 252)', order: 1 },
      'SHORTLISTED': { name: 'Shortlisted', icon: CiFileOn, color: 'oklch(0.60 0.18 252)', order: 2 },
      'UNDER_DUE_DILIGENCE': { name: 'Due Diligence', icon: CiUser, color: 'oklch(0.72 0.12 225)', order: 3 },
      'UNDER_BOARD_REVIEW': { name: 'Board Review', icon: CiCircleCheck, color: 'oklch(0.58 0.09 260)', order: 4 },
      'BOARD_APPROVED': { name: 'Board Approved', icon: CiCircleCheck, color: 'oklch(0.58 0.09 260)', order: 5 },
      'TERM_SHEET': { name: 'Term Sheet', icon: CiCircleCheck, color: 'oklch(0.58 0.09 260)', order: 6 },
      'INVESTMENT_IMPLEMENTATION': { name: 'Investment Implementation', icon: CiDollar, color: 'oklch(0.78 0.12 190)', order: 7 },
      'FUND_DISBURSED': { name: 'Fund Disbursed', icon: CiDollar, color: 'oklch(0.78 0.12 190)', order: 8 }
    }

    const totalApplications = applications.length
    const totalValue = applications.reduce((sum, app) => sum + parseFloat(app.requestedAmount || '0'), 0)

    // Create pipeline stats - sort by order and avoid duplicates
    const pipelineStats = Object.entries(stageGroups)
      .map(([stage, data]) => {
        const stageInfo = stageMapping[stage as keyof typeof stageMapping] || { 
          name: stage.replaceAll('_', ' '), 
          icon: CiFileOn, 
          color: 'oklch(0.60 0.18 252)',
          order: 999
        }
        const percentage = Math.round((data.count / totalApplications) * 100)
        
        return {
          stage: stageInfo.name,
          count: data.count,
          value: data.totalAmount >= 1000000 
            ? `$${(data.totalAmount / 1000000).toFixed(1)}M`
            : `$${(data.totalAmount / 1000).toFixed(0)}K`,
          percentage,
          icon: stageInfo.icon,
          color: stageInfo.color,
          order: stageInfo.order
        }
      })
      .sort((a, b) => a.order - b.order) // Sort by order

    // Create chart data from sorted pipeline stats
    const chartData = pipelineStats.map((stat, index) => ({
      name: stat.stage,
      value: stat.count,
      fill: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5A2B', '#6B7280', '#EC4899'][index % 9]
    }))

    // Calculate key metrics
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const thisMonthApps = applications.filter(app => 
      new Date(app.createdAt) >= thisMonth
    )
    
    const approvedApps = applications.filter(app => 
      ['BOARD_APPROVED', 'TERM_SHEET', 'INVESTMENT_IMPLEMENTATION', 'FUND_DISBURSED'].includes(app.currentStage)
    )

    const keyMetrics = [
      {
        title: "Applications This Month",
        value: thisMonthApps.length.toString(),
        change: "+15%",
        trend: "up",
      },
      {
        title: "Average Processing Time",
        value: "45 days",
        change: "-8%",
        trend: "down",
      },
      {
        title: "Approval Rate",
        value: `${Math.round((approvedApps.length / totalApplications) * 100)}%`,
        change: "+5%",
        trend: "up",
      },
      {
        title: "Total Pipeline Value",
        value: `$${(totalValue / 1000000).toFixed(0)}M`,
        change: "+22%",
        trend: "up",
      },
    ]

    return { pipelineStats, chartData, keyMetrics, totalApplications, totalValue }
  }

  const { pipelineStats, chartData, keyMetrics }: {
    pipelineStats: Array<{
      stage: string
      count: number
      value: string
      percentage: number
      icon: IconType
      color: string
      order: number
    }>
    chartData: Array<{
      name: string
      value: number
      fill: string
    }>
    keyMetrics: Array<{
      title: string
      value: string
      change: string
      trend: string
    }>
  } = calculateStats()

  // Handle application click
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application)
    setDrawerOpen(true)
  }

  // Handle view details (alias for handleApplicationClick)
  const handleViewDetails = (application: Application) => {
    handleApplicationClick(application);
  }

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Handle fund disbursement actions
  const handleInitiateFundDisbursement = (application: Application) => {
    setSelectedApplicationForDisbursement(application)
    setShowInitiateFundDisbursementDialog(true)
  }

  const handleFundDisbursementSuccess = () => {
    setShowInitiateFundDisbursementDialog(false)
    setSelectedApplicationForDisbursement(null)
    fetchApplications()
  }

  // Calculate real monthly data for the current year
  const calculateMonthlyData = () => {
    const currentYear = new Date().getFullYear()
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    const monthlyData = months.map(month => {
      const monthIndex = months.indexOf(month)
      const monthStart = new Date(currentYear, monthIndex, 1)
      const monthEnd = new Date(currentYear, monthIndex + 1, 0)
      
      // Filter applications for this month
      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.createdAt)
        return appDate >= monthStart && appDate <= monthEnd
      })
      
      const totalAmount = monthApplications.reduce((sum, app) => 
        sum + parseFloat(app.requestedAmount || '0'), 0
      )
      
      return {
        month,
        applications: monthApplications.length,
        amount: totalAmount / 1000, // Convert to thousands for better display
        amountFormatted: `$${(totalAmount / 1000).toFixed(0)}K`
      }
    })
    
    return monthlyData
  }

  const monthlyData = calculateMonthlyData()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications Management</h1>
          <p className="text-muted-foreground">Track and manage investment applications through the pipeline</p>
        </div>
      </div>

      {/* Key Metrics - Commented out for now */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className={`card-shadow hover:card-shadow-hover transition-all duration-300 ${index % 2 === 0 ? 'gradient-primary' : 'bg-white'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${index % 2 === 0 ? 'text-white' : ''}`}>{metric.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={`text-3xl ${index % 2 === 0 ? 'text-white' : ''}`}>{metric.value}</div>
                <div className="flex items-center gap-1">
                  {metric.trend === "up" ? (
                    <CiCircleChevUp size={16} className={index % 2 === 0 ? 'text-white/80' : 'text-green-600'} />
                  ) : (
                    <CiClock1 size={16} className={index % 2 === 0 ? 'text-white/80' : 'text-green-600'} />
                  )}
                  <p className={`text-xs ${index % 2 === 0 ? 'text-white/80' : 'text-green-600'}`}>{metric.change} from last month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pipelineStats.map((stage, index) => {
          const Icon = stage.icon

          return (
            <Card key={index} className={`card-shadow hover:card-shadow-hover transition-all duration-300 ${index % 2 === 0 ? 'gradient-primary' : 'bg-white'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${index % 2 === 0 ? 'bg-white/20' : 'gradient-primary'}`}
                    style={index % 2 === 1 ? { backgroundColor: stage.color } : {}}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
                  <CardTitle className={`text-sm font-medium ${index % 2 === 0 ? 'text-white' : ''}`}>{stage.stage}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl ${index % 2 === 0 ? 'text-white' : ''}`}>{stage.count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stage.value}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={stage.percentage} 
                      className="h-3 bg-white/20" 
                    />
                    <div 
                      className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                  <p className={`text-xs ${index % 2 === 0 ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {stage.percentage}% of total applications
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiCircleCheck size={24} className="text-white" />
              </div>
              Applications Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#8884d8"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                        >
                          {`${chartData[index].name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart - Monthly Money Requested */}
        <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiCircleChevUp size={24} className="text-white" />
              </div>
              Monthly Money Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="moneyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.2)" />
                  <XAxis dataKey="month" stroke="#000000" fontSize={16} />
                  <YAxis stroke="#000000" fontSize={16} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      color: "#374151",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value, name) => [
                      name === "amount" ? `$${value}K` : value,
                      name === "amount" ? "Amount Requested" : "Applications"
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={4} 
                    fill="url(#moneyGradient)" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Pipeline */}
      <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiFileOn size={24} className="text-white" />
              </div>
              Applications Pipeline
            </div>
            <Button 
              variant="outline" 
              className="bg-transparent"
              onClick={() => window.location.href = '/portfolio/applications'}
            >
              View More
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationsPipeline 
            applications={applications?.slice(0, 10) || []} 
            loading={loading} 
            onApplicationClick={handleApplicationClick}
          />
        </CardContent>
      </Card>

      {/* Charts Section - Commented out for now */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        {/* <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiCircleCheck size={24} className="text-white" />
              </div>
              Applications Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = 25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#8884d8"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                        >
                          {`${chartData[index].name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}

        {/* Line Chart - Monthly Money Requested */}
        {/* <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiCircleChevUp size={24} className="text-white" />
              </div>
              Monthly Money Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="moneyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.2)" />
                  <XAxis dataKey="month" stroke="#000000" fontSize={16} />
                  <YAxis stroke="#000000" fontSize={16} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      color: "#374151",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value, name) => [
                      name === "amount" ? `$${value}K` : value,
                      name === "amount" ? "Amount Requested" : "Applications"
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={4} 
                    fill="url(#moneyGradient)" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Applications Pipeline */}
      {/* <Card className="card-shadow hover:card-shadow-hover transition-all duration-300 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <CiFileOn size={24} className="text-white" />
              </div>
              Applications Pipeline
            </div>
            <Button 
              variant="outline" 
              className="bg-transparent"
              onClick={() => window.location.href = '/portfolio/applications'}
            >
              View More
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationsPipeline 
            applications={applications?.slice(0, 10) || []} 
            loading={loading} 
            onApplicationClick={handleApplicationClick}
          />
        </CardContent>
      </Card> */}

      {/* Application Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[60vw] min-w-[1000px] max-w-[1600px] overflow-y-auto p-5 [&>button[aria-label='Close']]:hidden">
          <SheetHeader>
            <SheetTitle className="text-2xl font-normal flex items-center gap-2">
              <CiFileOn className="w-6 h-6" /> {selectedApplication?.businessName}
            </SheetTitle>
          </SheetHeader>

          {selectedApplication && (
            <ApplicationTimeline
              application={selectedApplication}
              onInitiateDueDiligence={() => {}}
              onUpdateDueDiligence={() => {}}
              onCompleteDueDiligence={() => {}}
              onInitiateBoardReview={() => {}}
              onUpdateBoardReview={() => {}}
              onCompleteBoardReview={() => {}}
              onCreateTermSheet={() => {}}
              onUpdateTermSheet={() => {}}
              onFinalizeTermSheet={() => {}}
              onInitiateFundDisbursement={handleInitiateFundDisbursement}
              refreshTrigger={refreshTrigger}
              onRefresh={handleRefresh}
              // onClose={() => setDrawerOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Initiate Fund Disbursement Dialog */}
      {selectedApplicationForDisbursement && (
        <InitiateFundDisbursementDialog
          isOpen={showInitiateFundDisbursementDialog}
          onClose={() => {
            setShowInitiateFundDisbursementDialog(false)
            setSelectedApplicationForDisbursement(null)
          }}
          applicationId={selectedApplicationForDisbursement.id}
          applicationName={selectedApplicationForDisbursement.businessName}
          portfolioCompanyId={selectedApplicationForDisbursement.portfolioCompanyId || ''}
          fundId={selectedApplicationForDisbursement.fundId}
          onSuccess={handleFundDisbursementSuccess}
          onRefresh={fetchApplications}
        />
      )}
    </div>
  )
}
