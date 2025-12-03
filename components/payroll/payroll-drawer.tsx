"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CiUser, 
  CiDollar, 
  CiBuilding, 
  CiTag, 
  CiCalendar,
  CiFileText,
  CiPercent,
  CiMinus,
  CiCheck,
  CiClose,
  CiShield
} from "react-icons/ci"

interface PayrollDrawerProps {
  isOpen: boolean
  onClose: () => void
  data: any
  type: 'tax-rule' | 'allowance-type' | 'deduction-type' | 'bank-template' | 'employee'
  loading?: boolean
}

export function PayrollDrawer({ isOpen, onClose, data, type, loading = false }: PayrollDrawerProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'tax-rule':
        return <CiPercent className="w-6 h-6 text-blue-600" />
      case 'allowance-type':
        return <CiDollar className="w-6 h-6 text-green-600" />
      case 'deduction-type':
        return <CiMinus className="w-6 h-6 text-red-600" />
      case 'bank-template':
        return <CiBuilding className="w-6 h-6 text-purple-600" />
      case 'employee':
        return <CiUser className="w-6 h-6 text-orange-600" />
      default:
        return <CiFileText className="w-6 h-6" />
    }
  }

  const getTypeTitle = () => {
    switch (type) {
      case 'tax-rule':
        return 'Tax Rule Details'
      case 'allowance-type':
        return 'Allowance Type Details'
      case 'deduction-type':
        return 'Deduction Type Details'
      case 'bank-template':
        return 'Bank Template Details'
      case 'employee':
        return 'Employee Details'
      default:
        return 'Details'
    }
  }

  const renderTaxRuleContent = () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-normal">Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-normal text-blue-600">{data?.rate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-normal">Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{data?.type}</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Effective Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CiCalendar className="w-4 h-4 text-gray-400" />
              <span>{new Date(data?.effectiveDate).toLocaleDateString()}</span>
              {data?.endDate && (
                <>
                  <span>to</span>
                  <span>{new Date(data?.endDate).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Tax Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Threshold</label>
                <div className="text-sm font-medium">
                  {data?.threshold ? `$${parseFloat(data.threshold).toLocaleString()}` : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Ceiling</label>
                <div className="text-sm font-medium">
                  {data?.ceiling ? `$${parseFloat(data.ceiling).toLocaleString()}` : 'N/A'}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Currency</label>
              <div className="text-sm font-medium">{data?.currency?.code}</div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  const renderAllowanceTypeContent = () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="font-mono">{data?.code}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Taxable Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {data?.isTaxable ? (
                <CiCheck className="w-4 h-4 text-green-600" />
              ) : (
                <CiClose className="w-4 h-4 text-red-600" />
              )}
              <span className={data?.isTaxable ? 'text-green-600' : 'text-red-600'}>
                {data?.isTaxable ? 'Taxable' : 'Non-Taxable'}
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data?.description}</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  const renderDeductionTypeContent = () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="font-mono">{data?.code}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Statutory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {data?.isStatutory ? (
                <CiShield className="w-4 h-4 text-blue-600" />
              ) : (
                <CiMinus className="w-4 h-4 text-gray-400" />
              )}
              <span className={data?.isStatutory ? 'text-blue-600' : 'text-gray-600'}>
                {data?.isStatutory ? 'Statutory' : 'Voluntary'}
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="details" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data?.description}</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  const renderBankTemplateContent = () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="columns">Columns</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Bank</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{data?.bankName}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Delimiter</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-sm">
              {data?.delimiter === ',' ? 'Comma (,)' : 
               data?.delimiter === ';' ? 'Semicolon (;)' :
               data?.delimiter === '|' ? 'Pipe (|)' :
               data?.delimiter === '\t' ? 'Tab' : data?.delimiter}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Header Row</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {data?.hasHeader ? (
                <CiCheck className="w-4 h-4 text-green-600" />
              ) : (
                <CiClose className="w-4 h-4 text-red-600" />
              )}
              <span className={data?.hasHeader ? 'text-green-600' : 'text-red-600'}>
                {data?.hasHeader ? 'Yes' : 'No'}
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="columns" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Column Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {JSON.parse(data?.columnOrder || '[]').map((column: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                  <span className="text-sm">{column}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  const renderEmployeeContent = () => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="banking">Banking</TabsTrigger>
        <TabsTrigger value="salary">Salary</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Employee Number</label>
              <div className="text-sm font-medium">{data?.employeeNumber}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <div className="text-sm font-medium">{data?.user?.email}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <div className="flex items-center gap-2">
                {data?.isActive ? (
                  <CiCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <CiClose className="w-4 h-4 text-red-600" />
                )}
                <Badge variant={data?.isActive ? "default" : "secondary"}>
                  {data?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="banking" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Banking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Bank Name</label>
              <div className="text-sm font-medium">{data?.bankName}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Branch Code</label>
              <div className="text-sm font-medium font-mono">{data?.branchCode}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Account Number</label>
              <div className="text-sm font-medium font-mono">{data?.accountNumber}</div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="salary" className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal">Salary Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Basic Salary</label>
              <div className="text-2xl font-medium text-green-600">
                {data?.currency?.symbol}{parseFloat(data?.basicSalary || '0').toLocaleString()}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Currency</label>
              <div className="text-sm font-medium">{data?.currency?.code} - {data?.currency?.name}</div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  const renderContent = () => {
    switch (type) {
      case 'tax-rule':
        return renderTaxRuleContent()
      case 'allowance-type':
        return renderAllowanceTypeContent()
      case 'deduction-type':
        return renderDeductionTypeContent()
      case 'bank-template':
        return renderBankTemplateContent()
      case 'employee':
        return renderEmployeeContent()
      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-4 [&>button[aria-label='Close']]:hidden">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getTypeIcon()}
            </div>
            <div>
              <SheetTitle className="text-xl font-normal">{getTypeTitle()}</SheetTitle>
              <SheetDescription>
                {data?.name || `${data?.user?.firstName} ${data?.user?.lastName}` || 'Details'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-40" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
