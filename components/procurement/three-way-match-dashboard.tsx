"use client"

import { useState, useEffect } from "react"
import { procurementApiV2, ThreeWayMatchResult, ProcurementInvoice } from "@/lib/api/procurement-api-v2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProcurementDataTable, Column } from "./procurement-data-table"
import { AlertCircle, CheckCircle, TrendingDown, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface MatchedInvoice extends ProcurementInvoice {
  matchResult?: ThreeWayMatchResult
}

export function ThreeWayMatchDashboard() {
  const [invoices, setInvoices] = useState<MatchedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [matchingId, setMatchingId] = useState<string | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await procurementApiV2.getInvoices()
      if (response.success && response.data) {
        setInvoices(response.data)
      }
    } catch (error) {
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const handleRunMatch = async (invoiceId: string) => {
    setMatchingId(invoiceId)
    try {
      const response = await procurementApiV2.runThreeWayMatch(invoiceId)
      if (response.success && response.data) {
        setInvoices(
          invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, matchResult: response.data } : inv
          )
        )
        toast.success(
          response.data.status === 'MATCHED'
            ? '3-way match successful'
            : 'Match completed with disputes'
        )
      }
    } catch (error: any) {
      toast.error("Match failed", { description: error.message })
    } finally {
      setMatchingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MATCHED': return 'bg-green-100 text-green-800'
      case 'DISPUTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = [
    {
      label: 'Total Invoices',
      value: invoices.length,
      icon: <Card className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center" />,
    },
    {
      label: 'Matched',
      value: invoices.filter(i => i.matchResult?.status === 'MATCHED').length,
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
    },
    {
      label: 'Disputed',
      value: invoices.filter(i => i.matchResult?.status === 'DISPUTED').length,
      icon: <AlertCircle className="w-8 h-8 text-red-600" />,
    },
  ]

  const columns: Column<MatchedInvoice>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      sortable: true,
    },
    {
      key: 'invoiceDate',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (value, row) => `${row.currencyCode || 'USD'} ${value}`
    },
    {
      key: 'matchResult',
      label: 'Match Status',
      render: (value: any) => {
        if (!value) return <Badge variant="outline">Not Matched</Badge>
        return (
          <Badge className={getStatusColor(value.status)}>
            {value.status === 'MATCHED' ? '✓ Matched' : '⚠ Disputed'}
          </Badge>
        )
      }
    },
    {
      key: 'id',
      label: 'Action',
      render: (value, row) => {
        const hasMatch = row.matchResult
        return (
          <Button
            size="sm"
            variant={hasMatch ? 'outline' : 'default'}
            disabled={matchingId === value}
            onClick={() => handleRunMatch(value)}
          >
            {matchingId === value ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Running...
              </>
            ) : hasMatch ? (
              'Re-run'
            ) : (
              'Run Match'
            )}
          </Button>
        )
      }
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-8 h-8 text-blue-600" />
          3-Way Match Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Match purchase orders, goods receipts, and vendor invoices to ensure accuracy
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💡 <span className="font-medium">How it works:</span> The 3-way match compares each invoice line against
            the purchase order and goods received note. Mismatches in quantity, price, or items trigger disputes
            for manual review.
          </p>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <ProcurementDataTable
        data={invoices}
        columns={columns}
        title="Invoices for Matching"
        searchPlaceholder="Search invoices..."
        loading={loading}
        emptyMessage="No invoices to match"
      />

      {/* Disputed Invoices Details */}
      {invoices.some(i => i.matchResult?.status === 'DISPUTED') && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Disputed Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoices
              .filter(i => i.matchResult?.status === 'DISPUTED')
              .map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">{invoice.vendorName}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {invoice.matchResult?.disputes?.length || 0} Disputes
                    </Badge>
                  </div>

                  {invoice.matchResult?.disputes && invoice.matchResult.disputes.length > 0 && (
                    <ul className="text-sm text-red-700 space-y-1">
                      {invoice.matchResult.disputes.map((dispute, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span>•</span>
                          <span>{dispute}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 mt-2"
                  >
                    Review & Resolve
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
