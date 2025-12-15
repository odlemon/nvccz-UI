
"use client"

import React, { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchDashboard } from '@/lib/store/slices/procurementV2Slice'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { FileText, ShoppingCart, FileCheck, Package, Plus, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, Building2, ArrowUpRight, CreditCard } from 'lucide-react'
import { CiFileOn, CiDollar, CiShoppingCart, CiReceipt } from 'react-icons/ci'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { toast } from 'sonner'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export function ProcurementDashboard() {
  const dispatch = useAppDispatch()
  const { dashboard, dashboardLoading } = useAppSelector((state) => state.procurementV2)

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchDashboard()).unwrap()
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        toast.error("Failed to load dashboard data")
      }
    }
    fetchData()
  }, [dispatch])

  // Transform data for charts
  const requisitionsByStatus = useMemo(() => {
    if (!dashboard?.requisitions?.byStatus) return []
    return dashboard.requisitions.byStatus.map((item: any) => ({
      status: item.status.replace(/_/g, ' '),
      count: item.count,
      items: item.totalItems || 0
    }))
  }, [dashboard])

  const invoicesByStatus = useMemo(() => {
    if (!dashboard?.invoices?.byStatus) return []
    return dashboard.invoices.byStatus.map((item: any) => ({
      name: item.status.replace(/_/g, ' '),
      value: item.count,
      amount: parseFloat(item.totalAmount) || 0
    }))
  }, [dashboard])

  const invoicesByPaymentStatus = useMemo(() => {
    if (!dashboard?.invoices?.byPaymentStatus) return []
    return dashboard.invoices.byPaymentStatus.map((item: any) => ({
      name: item.paymentStatus.replace(/_/g, ' '),
      value: item.count,
      amount: parseFloat(item.totalAmount) || 0
    }))
  }, [dashboard])

  const topVendors = useMemo(() => {
    if (!dashboard?.vendors?.topVendors) return []
    return dashboard.vendors.topVendors.slice(0, 5).map((item: any) => ({
      name: item.vendor.name,
      invoices: item.invoiceCount,
      amount: parseFloat(item.totalAmount) || 0
    }))
  }, [dashboard])

  const quotationsByStatus = useMemo(() => {
    if (!dashboard?.quotations?.byStatus) return []
    return dashboard.quotations.byStatus.map((item: any) => ({
      status: item.status.replace(/_/g, ' '),
      count: item.count,
      amount: parseFloat(item.totalAmount) || 0
    }))
  }, [dashboard])

  if (dashboardLoading || !dashboard) {
    return <DashboardSkeleton />
  }

  const requisitionsSummary = dashboard.requisitions.summary
  const invoicesSummary = dashboard.invoices.summary
  const invoicesAmounts = dashboard.invoices.amounts
  const rfqsSummary = dashboard.rfqs.summary
  const quotationsSummary = dashboard.quotations.summary

  const totalPendingAmount = invoicesAmounts.pendingPaymentAmount || 0
  const totalPaidAmount = invoicesAmounts.paidAmount || 0
  const paymentProgress = invoicesAmounts.totalAmount > 0 
    ? (totalPaidAmount / invoicesAmounts.totalAmount) * 100 
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Procurement Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive overview of procurement activities, spending, and vendor relationships
        </p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Requisitions Card */}
        <Card className="rounded-2xl gradient-primary text-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Purchase Requisitions</CardTitle>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{requisitionsSummary.total - requisitionsSummary.pending - (requisitionsSummary.draft || 0) - requisitionsSummary.rejected}</div>
            <p className="text-xs text-white/80 mt-1">
              {requisitionsSummary.pending} pending • {requisitionsSummary.draft || 0} draft • {requisitionsSummary.rejected} rejected
            </p>
            <div className="relative mt-3 h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white"
                style={{ 
                  width: `${(requisitionsSummary.total - requisitionsSummary.pending - (requisitionsSummary.draft || 0) - requisitionsSummary.rejected) > 0 ? (requisitionsSummary.approved / (requisitionsSummary.total - requisitionsSummary.pending - (requisitionsSummary.draft || 0) - requisitionsSummary.rejected)) * 100 : 0}%` 
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/80">
              <span>{requisitionsSummary.approved} approved</span>
              <span>{requisitionsSummary.total} total</span>
            </div>
          </CardContent>
        </Card>

        {/* RFQs Card */}
        <Card className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Request for Quotations</CardTitle>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{rfqsSummary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {rfqsSummary.active} active RFQs
            </p>
            <div className="relative mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ 
                  width: `${rfqsSummary.total > 0 ? (rfqsSummary.active / rfqsSummary.total) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting vendor responses
            </p>
          </CardContent>
        </Card>

        {/* Quotations Card */}
        <Card className="rounded-2xl gradient-primary text-white hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Quotations</CardTitle>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <FileCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{quotationsSummary.total}</div>
            <p className="text-xs text-white/80 mt-1">
              {quotationsSummary.pending} pending review
            </p>
            <div className="relative mt-3 h-2 rounded-full bg-white/30 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white"
                style={{ 
                  width: `${quotationsSummary.total > 0 ? (quotationsSummary.accepted / quotationsSummary.total) * 100 : 0}%` 
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/80">
              <span>{quotationsSummary.accepted} accepted</span>
              <span>{quotationsSummary.rejected} rejected</span>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Card */}
        <Card className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{invoicesSummary.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {invoicesSummary.paid} paid • {invoicesSummary.pending} pending
            </p>
            <div className="relative mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ 
                  width: `${invoicesSummary.total > 0 ? (invoicesSummary.paid / invoicesSummary.total) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {invoicesSummary.approved} approved for payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Financial Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Total Invoice Value</h3>
              <p className="text-3xl font-bold text-blue-900">
                ${invoicesAmounts.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Avg: ${invoicesAmounts.averageAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Paid Amount</h3>
              <p className="text-3xl font-bold text-green-700">
                ${totalPaidAmount.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {paymentProgress.toFixed(1)}% of total
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Pending Payment</h3>
              <p className="text-3xl font-bold text-orange-700">
                ${totalPendingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Requires processing
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Tax Amount</h3>
              <p className="text-3xl font-bold text-purple-700">
                ${invoicesAmounts.totalTax.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Subtotal: ${invoicesAmounts.totalSubtotal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="relative mt-4 h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Payment completion: {paymentProgress.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requisitions by Status */}
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CiFileOn className="w-5 h-5 text-blue-600" />
              Requisitions by Status
            </CardTitle>
            <CardDescription>Overview of requisition pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={requisitionsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [value, 'Requisitions']
                    return [value, 'Total Items']
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Requisitions" radius={[8, 8, 0, 0]} />
                <Bar dataKey="items" fill="#8b5cf6" name="Total Items" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CiReceipt className="w-5 h-5 text-green-600" />
              Invoice Status Distribution
            </CardTitle>
            <CardDescription>Current invoice breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={invoicesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoicesByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value} invoices ($${props.payload.amount.toLocaleString()})`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Top Vendors by Spend
            </CardTitle>
            <CardDescription>Your most active vendor relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topVendors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'invoices') return [value, 'Invoices']
                    return [`$${value.toLocaleString()}`, 'Total Spend']
                  }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#8b5cf6" name="Total Spend" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quotations by Status */}
        <Card className="bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CiShoppingCart className="w-5 h-5 text-indigo-600" />
              Quotations Performance
            </CardTitle>
            <CardDescription>Quotation comparison and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={quotationsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any, name: string) => {
                    if (name === 'count') return [value, 'Count']
                    return [`$${value.toLocaleString()}`, 'Amount']
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  name="Count"
                  dot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Amount"
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Requisitions</CardTitle>
              <CardDescription>Latest procurement requests</CardDescription>
            </div>
            <Link href="/procurement/requisitions">
              <Button variant="outline" size="sm" className="rounded-full">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dashboard.requisitions.recent.slice(0, 5).map((req: any) => (
                <li key={req.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{req.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.requisitionNumber} • {req.items?.length || 0} items
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {req.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {req.department}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-white rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest invoice activity</CardDescription>
            </div>
            <Link href="/procurement/invoices">
              <Button variant="outline" size="sm" className="rounded-full">
                View All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {dashboard.invoices.recent.slice(0, 5).map((invoice: any, idx: number) => (
                <li key={invoice.id || idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.vendor?.name} • ${parseFloat(invoice.totalAmount || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {invoice.status?.replace(/_/g, ' ') || 'N/A'}
                      </Badge>
                      {invoice.paymentStatus && (
                        <Badge variant="outline" className="text-xs bg-green-50">
                          {invoice.paymentStatus.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-none">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Link href="/procurement/requisitions">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 h-11">
                <FileText className="w-4 h-4 mr-2" />
                New Requisition
              </Button>
            </Link>
            <Link href="/procurement/rfq">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 h-11">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Manage RFQs
              </Button>
            </Link>
            <Link href="/procurement/quotations">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 h-11">
                <FileCheck className="w-4 h-4 mr-2" />
                Review Quotations
              </Button>
            </Link>
            <Link href="/procurement/invoices">
              <Button variant="outline" className="w-full rounded-full bg-white hover:bg-gray-50 h-11">
                <Package className="w-4 h-4 mr-2" />
                Process Invoices
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-4 w-[200px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px]" />
              <div className="flex items-center gap-4 mt-2">
                <Skeleton className="h-3 w-[60px]" />
                <Skeleton className="h-3 w-[60px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-4 w-[160px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
