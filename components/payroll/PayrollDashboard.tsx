"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CiWallet, CiUser, CiCalendar, CiViewTable, CiDollar, CiFileOn, CiPercent } from "react-icons/ci"
import { StatCard } from "@/components/payroll/StatCard"
import { PayrollChart } from "@/components/payroll/PayrollChart"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  setTaxRules,
  setAllowanceTypes,
  setDeductionTypes,
  setBankTemplates,
  setApiEmployees,
  setApiPayrollRuns,
  setApiPayslips
} from "@/lib/store/slices/payrollSlice"
import { 
  taxRulesApi, 
  allowanceTypesApi, 
  deductionTypesApi, 
  bankTemplatesApi, 
  employeesApi, 
  payrollRunsApi, 
  payslipsApi 
} from "@/lib/api/payroll-api"

export function PayrollDashboard() {
  const dispatch = useAppDispatch()
  const payroll = useAppSelector(state => state.payroll)
  const payrollRuns = payroll.apiPayrollRuns || []
  const currentRun = payrollRuns[0]
  const employees = payroll.apiEmployees || []
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [runsLoading, setRunsLoading] = useState(false)
  const [payslipsLoading, setPayslipsLoading] = useState(false)
  const [periodStart, setPeriodStart] = useState<Date | null>(null)
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null)
  const [status, setStatus] = useState<'all' | 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'>('all')

  // Load data on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setEmployeesLoading(true)
        const res = await employeesApi.getAll()
        if (res.success) {
          dispatch(setApiEmployees(((res as any).data?.data) ?? res.data ?? []))
        }
      } catch (e) {
        console.error('Failed to load employees:', e)
      } finally {
        setEmployeesLoading(false)
      }
    }

    const loadRuns = async () => {
      try {
        setRunsLoading(true)
        const res = await payrollRunsApi.getAll()
        if (res.success) {
          dispatch(setApiPayrollRuns(((res as any).data?.data) ?? res.data ?? []))
        }
      } catch (e) {
        console.error('Failed to load payroll runs:', e)
      } finally {
        setRunsLoading(false)
      }
    }

    const loadPayslips = async () => {
      try {
        setPayslipsLoading(true)
        const res = await payslipsApi.getAll()
        if (res.success) {
          dispatch(setApiPayslips(((res as any).data?.data) ?? res.data ?? []))
        }
      } catch (e) {
        console.error('Failed to load payslips:', e)
      } finally {
        setPayslipsLoading(false)
      }
    }

    loadEmployees()
    loadRuns()
    loadPayslips()
  }, [dispatch])

  // Filter runs based on current filters
  const filteredRuns = useMemo(() => {
    return payrollRuns.filter((r: any) => {
      const start = new Date(r.startDate ?? r.periodStart)
      const end = new Date(r.endDate ?? r.periodEnd)
      const inStatus = status === 'all' ? true : r.status === status
      const afterStart = periodStart ? start >= new Date(new Date(periodStart).setHours(0,0,0,0)) : true
      const beforeEnd = periodEnd ? end <= new Date(new Date(periodEnd).setHours(23,59,59,999)) : true
      // Current year by default if no filters
      const inYear = (!periodStart && !periodEnd) ? start.getFullYear() === new Date().getFullYear() : true
      return inStatus && afterStart && beforeEnd && inYear
    })
  }, [payrollRuns, status, periodStart, periodEnd])

  const completedRuns = useMemo(() => filteredRuns.filter(r => r.status === 'COMPLETED'), [filteredRuns])
  const totals = useMemo(() => {
    const gross = completedRuns.reduce((acc, r: any) => acc + (parseFloat(r.totalGrossPay ?? r.statistics?.grossTotal ?? 0) as number), 0)
    const net = completedRuns.reduce((acc, r: any) => acc + (parseFloat(r.totalNetPay ?? r.statistics?.netTotal ?? 0) as number), 0)
    return { gross, net }
  }, [completedRuns])

  // Calculate filtered employee count
  const filteredEmployeeCount = useMemo(() => {
    if (status === 'all' && !periodStart && !periodEnd) {
      return employees.length
    }
    
    // Get unique employee IDs from filtered runs
    const employeeIds = new Set()
    filteredRuns.forEach((run: any) => {
      if (run.employeeIds && Array.isArray(run.employeeIds)) {
        run.employeeIds.forEach((id: string) => employeeIds.add(id))
      }
    })
    
    return employeeIds.size || employees.length
  }, [filteredRuns, employees.length, status, periodStart, periodEnd])

  const filteredForChart = useMemo(() => {
    return filteredRuns
  }, [filteredRuns])

  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i)
    const format = (i: number) => new Date(new Date().getFullYear(), i, 1).toLocaleString('en-US', { month: 'short' })
    const byMonth: Record<number, { gross: number; net: number }> = {}
    months.forEach(m => { byMonth[m] = { gross: 0, net: 0 } })
    filteredForChart.forEach((r: any) => {
      const m = new Date(r.startDate ?? r.periodStart).getMonth()
      const gross = parseFloat((r.totalGrossPay ?? r.statistics?.grossTotal ?? 0) as any) || 0
      const net = parseFloat((r.totalNetPay ?? r.statistics?.netTotal ?? 0) as any) || 0
      byMonth[m].gross += gross
      byMonth[m].net += net
    })
    return months.map(m => ({ month: format(m), gross: byMonth[m].gross, net: byMonth[m].net }))
  }, [filteredForChart])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-600 font-normal">Overview of pay runs, employees, and postings</p>
        </div>
        <div className="flex gap-3">
          <Button className="rounded-full gradient-primary text-white" onClick={() => { location.assign('/payroll/runs') }}>Open Pay Run</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Net Payroll" 
          value={runsLoading ? '—' : `$${totals.net.toLocaleString()}`}
          icon={<CiWallet className="w-5 h-5" />} 
        />
        <StatCard 
          title="Gross Total" 
          value={runsLoading ? '—' : `$${totals.gross.toLocaleString()}`}
          icon={<CiDollar className="w-5 h-5" />} 
        />
        <StatCard 
          title="Employees" 
          value={employeesLoading ? '—' : filteredEmployeeCount}
          icon={<CiUser className="w-5 h-5" />} 
        />
        <StatCard 
          title="Next Payout" 
          value={'N/A'} 
          icon={<CiCalendar className="w-5 h-5" />} 
        />
      </div>

      <div className="rounded-2xl border border-gray-200 py-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base font-normal mb-3">
            <div className="flex items-center gap-2">
              <CiViewTable className="w-5 h-5" /> Current Pay Run
            </div>
            {(periodStart || periodEnd || status !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Filters Active
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <DatePicker 
                    value={periodStart ?? undefined} 
                    onChange={(d) => setPeriodStart(d ?? null)} 
                    placeholder="Period Start" 
                    className="h-10 w-full sm:w-[180px] min-w-[160px]" 
                    allowFutureDates={true} 
                  />
                  <DatePicker 
                    value={periodEnd ?? undefined} 
                    onChange={(d) => setPeriodEnd(d ?? null)} 
                    placeholder="Period End" 
                    className="h-10 w-full sm:w-[180px] min-w-[160px]" 
                    allowFutureDates={true} 
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-full h-10 w-full sm:w-auto" 
                  onClick={() => { setPeriodStart(null); setPeriodEnd(null) }}
                >
                  Clear
                </Button>
              </div>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-full lg:w-48 rounded-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {runsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-[320px] w-full rounded-2xl" />
              </div>
            ) : (
              <PayrollChart data={chartData} />
            )}
          </div>
        </CardContent>
      </div>

      {/* Recent Payslips section removed per request */}
    </div>
  )
}


