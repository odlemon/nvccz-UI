"use client"

import { forwardRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Payslip } from "@/lib/api/payroll-api"

interface PayslipTemplateProps {
  payslip: Payslip
}

export const PayslipTemplate = forwardRef<HTMLDivElement, PayslipTemplateProps>(
  ({ payslip }, ref) => {
    const formatCurrency = (amount: string | number) => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: payslip.currency?.code || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num)
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto" style={{
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#ffffff',
        color: '#000000'
      }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4" style={{ backgroundColor: '#2563eb' }}>
              Kyntaro
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kyntaro</h1>
              <p className="text-gray-600">Kyntaro</p>
              <p className="text-sm text-gray-500">Chisapi Cres, Harare, Zimbabwe</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Payslip for the period of {formatDate(payslip.payrollRun.startDate)}
          </h2>
        </div>

        {/* Employee and Payroll Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Employee ID:</span>
                <span className="font-medium">{payslip.employee.employeeNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{payslip.employee.user.firstName} {payslip.employee.user.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{payslip.employee.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Name:</span>
                <span className="font-medium">{payslip.employee.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Branch Code:</span>
                <span className="font-medium">{payslip.employee.branchCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium">{payslip.employee.accountNumber}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payroll Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pay Period:</span>
                <span className="font-medium">{payslip.payrollRun.payPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">{formatDate(payslip.payrollRun.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">{formatDate(payslip.payrollRun.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={payslip.payrollRun.status === 'COMPLETED' ? 'default' : 'secondary'}>
                  {payslip.payrollRun.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency:</span>
                <span className="font-medium">{payslip.currency?.code}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings and Deductions */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Earnings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Earnings</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex justify-between font-semibold text-sm">
                  <span>Earnings</span>
                  <span>Amount</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">Basic Salary</span>
                  <span className="text-sm font-medium">{formatCurrency(payslip.employee.basicSalary)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">Housing Allowance</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">Transport Allowance</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">Overtime</span>
                  <span className="text-sm font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between bg-gray-50 font-semibold border-t-2 border-gray-300">
                  <span>Total Earnings</span>
                  <span>{formatCurrency(payslip.grossPay)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Deductions</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex justify-between font-semibold text-sm">
                  <span>Deductions</span>
                  <span>Amount</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">PAYE</span>
                  <span className="text-sm font-medium">{formatCurrency(parseFloat(payslip.totalDeductions) * 0.6)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">NSSA</span>
                  <span className="text-sm font-medium">{formatCurrency(parseFloat(payslip.totalDeductions) * 0.3)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm">AIDS Levy</span>
                  <span className="text-sm font-medium">{formatCurrency(parseFloat(payslip.totalDeductions) * 0.1)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between bg-gray-50 font-semibold border-t-2 border-gray-300">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(payslip.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="text-center mb-8">
          <div className="rounded-lg p-6" style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #dbeafe'
          }}>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#1e40af' }}>Net Pay (Rounded)</h3>
            <div className="text-3xl font-bold" style={{ color: '#1e3a8a' }}>{formatCurrency(payslip.netPay)}</div>
            <p className="text-sm mt-2" style={{ color: '#6b7280' }}>(All figures in {payslip.currency?.code})</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <div className="border-t-2 border-gray-300 pt-4">
              <p className="text-sm font-semibold text-gray-700">Employer's Signature</p>
              <div className="h-12 border-b border-gray-300 mt-2"></div>
            </div>
          </div>
          <div>
            <div className="border-t-2 border-gray-300 pt-4">
              <p className="text-sm font-semibold text-gray-700">Employee's Signature</p>
              <div className="h-12 border-b border-gray-300 mt-2"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>This payslip is computer generated and does not require a signature.</p>
          <p>Generated on {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    )
  }
)

PayslipTemplate.displayName = "PayslipTemplate"
