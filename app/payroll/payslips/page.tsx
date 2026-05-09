"use client"

import { useEffect, useRef, useState } from "react"
import { PayrollLayout } from "@/components/layout/payroll-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { employeesApi, payrollRunsApi, payslipsApi } from "@/lib/api/payroll-api"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { setApiEmployees, setApiPayrollRuns } from "@/lib/store/slices/payrollSlice"
import { Download, Loader2, FileText } from "lucide-react"
import { PayslipTemplate } from "@/components/payroll/payslip-template"
import { generateAndDownloadPDF } from "@/lib/utils/pdf-generator"
import { generateAndDownloadSimplePDF } from "@/lib/utils/simple-pdf-generator"
import { ModuleGuard } from "@/components/permissions/PermissionGuards"
import { useActiveAddress } from "@/lib/hooks/useActiveAddress"

function PayslipsPage() {
  const dispatch = useAppDispatch()
  const { apiEmployees, apiPayrollRuns } = useAppSelector(s => s.payroll)
  const [employeeId, setEmployeeId] = useState("")
  const [payrollRunId, setPayrollRunId] = useState("")
  const [loading, setLoading] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [runsLoading, setRunsLoading] = useState(false)
  const [payslip, setPayslip] = useState<any | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const payslipRef = useRef<HTMLDivElement>(null)
  const letterheadAddress = useActiveAddress()

  useEffect(() => {
    const load = async () => {
      try {
        setEmployeesLoading(true)
        setRunsLoading(true)
        const [emps, runs] = await Promise.all([employeesApi.getAll(), payrollRunsApi.getAll()])
        if (emps.success) dispatch(setApiEmployees(emps.data || []))
        if (runs.success) dispatch(setApiPayrollRuns(runs.data || []))
      } catch {}
      finally {
        setEmployeesLoading(false)
        setRunsLoading(false)
      }
    }
    if (apiEmployees.length === 0 || apiPayrollRuns.length === 0) load()
  }, [apiEmployees.length, apiPayrollRuns.length, dispatch])

  const handleSearch = async () => {
    if (!employeeId || !payrollRunId) return
    try {
      setLoading(true)
      const res = await payslipsApi.getByEmployeeAndRun(employeeId, payrollRunId)
      if (res.success && res.data) setPayslip(res.data)
      else setPayslip(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = () => {
    if (!payslip?.pdfPath) return
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://nvccz-pi.vercel.app'
    const pdfUrl = payslip.pdfPath.startsWith('http') ? payslip.pdfPath : `${base}${payslip.pdfPath}`
    window.open(pdfUrl, '_blank')
  }

  const handleGeneratePDF = async () => {
    if (!payslip) return
    
    try {
      setGeneratingPDF(true)
      const filename = `payslip-${payslip.employee.employeeNumber}-${payslip.payrollRun.payPeriod.replace(/\s+/g, '-')}`
      
      // Try the simple PDF generator first (more reliable)
      await generateAndDownloadSimplePDF(payslip, filename, {
        format: 'a4',
        orientation: 'portrait',
        letterheadAddress,
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // If simple PDF fails, try the template-based PDF as fallback
      if (payslipRef.current) {
        try {
          await generateAndDownloadPDF(payslipRef.current, filename, {
            format: 'a4',
            orientation: 'portrait'
          })
        } catch (fallbackError) {
          console.error('Fallback PDF generation also failed:', fallbackError)
          alert('Failed to generate PDF. Please try again or contact support.')
        }
      } else {
        alert('Failed to generate PDF. Please try again or contact support.')
      }
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <PayrollLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">Payslips</h1>
          <p className="text-gray-600">Search and view payslips by employee and pay run</p>
        </div>

        <div className="rounded-2xl border-1 border-gray-200 p-6">
          <CardHeader>
            <CardTitle className="text-base font-normal">Search Payslip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-700">Employee</label>
                <Select value={employeeId} onValueChange={setEmployeeId} disabled={employeesLoading}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder={employeesLoading ? 'Loading employees...' : 'Select employee'} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      apiEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.user.firstName} {e.user.lastName} ({e.employeeNumber})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Payroll Run</label>
                <Select value={payrollRunId} onValueChange={setPayrollRunId} disabled={runsLoading}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder={runsLoading ? 'Loading runs...' : 'Select payroll run'} />
                  </SelectTrigger>
                  <SelectContent>
                    {runsLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      apiPayrollRuns.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} — {new Date(r.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} variant="gradient" className="rounded-full h-10 px-6 font-semibold text-xs" disabled={loading || !employeeId || !payrollRunId}>
                  {loading ? 'Searching...' : 'Search Payslip'}
                </Button>
                <Button type="button" variant="outline" className="rounded-full h-10 px-5 font-semibold text-xs" onClick={() => { setEmployeeId(''); setPayrollRunId(''); setPayslip(null); }} disabled={loading}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </div>

        {payslip && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Payslip Preview</h2>
              <div className="flex gap-3">
                <Button 
                  onClick={handleGeneratePDF} 
                  variant="gradient-info"
                  className="rounded-full h-10 px-6 gap-2 font-semibold text-xs" 
                  disabled={generatingPDF}
                >
                  {generatingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate PDF
                    </>
                  )}
                </Button>
                {payslip?.pdfPath && (
                  <Button 
                    onClick={handleDownloadPdf} 
                    variant="gradient-create"
                    className="rounded-full h-10 px-6 gap-2 font-semibold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    Download Existing PDF
                  </Button>
                )}
              </div>
            </div>

            {/* Payslip Template */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <PayslipTemplate payslip={payslip} ref={payslipRef} />
            </div>
          </div>
        )}
      </div>
    </PayrollLayout>
  )
}

function PayslipsPageWrapper() {
  return (
    <ModuleGuard moduleId="payroll" subModuleId="payroll-payslips" requiredAccess="read">
      <PayslipsPage />
    </ModuleGuard>
  )
}

export default PayslipsPageWrapper