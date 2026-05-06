"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchInvestment } from "@/lib/store/slices/applicationPortalSlice"
import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, TrendingUp, DollarSign, FileText, Eye, PieChart, BarChart3 } from "lucide-react"
import { InvestmentSkeleton } from "@/components/investments/investment-skeleton"

export default function InvestmentDetailsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { investment, investmentLoading } = useAppSelector((state) => state.applicationPortal)

  useEffect(() => {
    dispatch(fetchInvestment())
  }, [dispatch])

  if (investmentLoading) {
    return (
      <ApplicationPortalLayout>
        <InvestmentSkeleton />
      </ApplicationPortalLayout>
    )
  }

  if (!investment) {
    return (
      <ApplicationPortalLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Investment Data</h3>
              <p className="text-muted-foreground">Investment details will appear here once available.</p>
            </div>
          </div>
        </div>
      </ApplicationPortalLayout>
    )
  }

  return (
    <ApplicationPortalLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Investment Details
            </h1>
            <p className="text-muted-foreground">Track your investment and funding details</p>
          </div>
        </div>

        {/* Portfolio Company Summary */}
        {investment.portfolioCompany && (
          <Card 
            className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/application-portal/portfolio-company')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  Portfolio Company Overview
                </CardTitle>
                <Button 
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/application-portal/portfolio-company')
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Name
                  </label>
                  <p className="text-lg font-medium">{investment.portfolioCompany.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Industry
                  </label>
                  <p className="text-lg font-medium">{investment.portfolioCompany.industry}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Badge className={
                    investment.portfolioCompany.status === 'ACTIVE'
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 mt-1'
                      : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200 mt-1'
                  }>
                    {investment.portfolioCompany.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Term Sheet Information */}
        {investment.termSheet ? (
          <Card 
            className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => router.push('/application-portal/term-sheets')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  Term Sheet Details
                </CardTitle>
                <Button 
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push('/application-portal/term-sheets')
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Term Sheet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-500" />
                    Investment Amount
                  </label>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    ${Number(investment.termSheet.investmentAmount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-green-500" />
                    Equity Percentage
                  </label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {investment.termSheet.equityPercentage}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    Valuation
                  </label>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    ${Number(investment.termSheet.valuation || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Badge 
                    variant="default" 
                    className="mt-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200"
                  >
                    {investment.termSheet.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-l-4 border-l-gray-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                Term Sheet Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No term sheet available yet</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Details */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              Investment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {investment.investment.fund && (
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <label className="text-sm text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    Fund
                  </label>
                  <p className="font-medium mt-1">
                    {investment.investment.fund.name || '—'}
                  </p>
                  {investment.investment.fund.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {investment.investment.fund.description}
                    </p>
                  )}
                  {investment.investment.fund.totalAmount && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fund size: ${Number(investment.investment.fund.totalAmount).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {investment.investment.startDate && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="text-sm text-muted-foreground">Start Date</label>
                  <p className="font-medium mt-1">
                    {new Date(investment.investment.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {investment.investment.endDate && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <label className="text-sm text-muted-foreground">End Date</label>
                  <p className="font-medium mt-1">
                    {new Date(investment.investment.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {!investment.investment.fund && !investment.investment.startDate && !investment.investment.endDate && (
                <div className="col-span-2 text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No additional investment details available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cap Table */}
        {investment.investment.capTable && (
          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-amber-600" />
                </div>
                Capitalization Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Cap table information will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial KPIs */}
        {investment.investment.financialKpis && (
          <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-100 to-blue-200 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
                Financial KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Financial KPI data will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ApplicationPortalLayout>
  )
}
