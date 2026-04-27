"use client"

import { useState, useEffect } from "react"
import { procurementApiV2, CFODashboardData } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function CFODashboard() {
  const [dashboardData, setDashboardData] = useState<CFODashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await procurementApiV2.getCFODashboard()
      if (response.success && response.data) {
        setDashboardData(response.data)
      }
    } catch (error) {
      toast.error("Failed to load CFO dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center text-gray-500">
          No data available
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      title: 'Total Invoices',
      value: dashboardData.totalBills,
      icon: AlertTriangle,
      color: 'bg-blue-600',
      description: 'Vendor invoices processed'
    },
    {
      title: 'Matched Bills',
      value: dashboardData.matchedBills,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'Successfully matched to PO & GRN'
    },
    {
      title: 'Disputed Bills',
      value: dashboardData.disputedBills,
      icon: AlertTriangle,
      color: 'bg-red-600',
      description: 'Require manual review'
    },
    {
      title: 'Pending Verification',
      value: dashboardData.pendingVerification,
      icon: Clock,
      color: 'bg-amber-600',
      description: 'Awaiting human verification'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          CFO Dashboard — Procurement Overview
        </h1>
        <p className="text-gray-600 mt-2">
          Executive summary of invoice matching and procurement status
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Match Rate */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Match Rate</span>
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              {dashboardData.matchRate.toFixed(1)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
              style={{ width: `${Math.min(dashboardData.matchRate, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{dashboardData.matchedBills}</p>
              <p className="text-xs text-gray-600 mt-1">Matched</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{dashboardData.disputedBills}</p>
              <p className="text-xs text-gray-600 mt-1">Disputed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{dashboardData.pendingVerification}</p>
              <p className="text-xs text-gray-600 mt-1">Pending</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 p-3 bg-blue-50 rounded border border-blue-200">
            <span className="font-medium">Target:</span> Achieve 99%+ match rate to minimize manual
            processing and ensure accurate vendor payments.
          </p>
        </CardContent>
      </Card>

      {/* Total Invoice Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Total Invoice Amount Under Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Amount</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">${dashboardData.totalInvoiceAmount}</p>
            </div>
            <div className="flex-1 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg opacity-30" />
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-green-900 text-base">Matched & Ready for Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{dashboardData.matchedBills}</p>
            <p className="text-sm text-gray-600 mt-2">
              Invoices successfully matched to PO and goods receipt. Ready for approval and payment processing.
            </p>
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
              Approve & Process Payment
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-red-900 text-base">Under Dispute</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{dashboardData.disputedBills}</p>
            <p className="text-sm text-gray-600 mt-2">
              Invoices with price, quantity, or line-item mismatches. Require manual investigation and resolution.
            </p>
            <Button variant="outline" className="w-full mt-4 text-red-600 border-red-300 hover:bg-red-50">
              Review Disputes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Verification */}
      {dashboardData.pendingVerification > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="text-amber-900 text-base">Pending Human Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{dashboardData.pendingVerification}</p>
            <p className="text-sm text-gray-600 mt-2">
              Invoices extracted from PDF with AI. Waiting for procurement team verification before matching.
            </p>
            <Button variant="outline" className="w-full mt-4 text-amber-600 border-amber-300 hover:bg-amber-50">
              Verify Queue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button className="gradient-primary text-white">
              Upload New Invoice
            </Button>
            <Button variant="outline">
              View Payment Schedule
            </Button>
            <Button variant="outline">
              Export Report
            </Button>
            <Button variant="outline" onClick={loadDashboard}>
              Refresh Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
