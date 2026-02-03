import { apiClient, ApiResponse } from './api-client'

// Types for API responses
export interface TaxRule {
  id: string
  name: string
  type: 'PAYE' | 'NSSA' | 'AIDS_LEVY'
  rate: string
  threshold: string | null
  ceiling: string | null
  isActive: boolean
  effectiveDate: string
  endDate: string | null
  currencyId: string
  createdById: string
  createdAt: string
  updatedAt: string
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface AllowanceType {
  id: string
  name: string
  code: string
  description: string
  isTaxable: boolean
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface DeductionType {
  id: string
  name: string
  code: string
  description: string
  isStatutory: boolean
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface BankTemplate {
  id: string
  name: string
  bankName: string
  delimiter: string
  hasHeader: boolean
  columnOrder: string[]
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface Employee {
  id: string
  userId: string
  employeeNumber: string
  bankName: string
  branchCode: string
  accountNumber: string
  basicSalary: string
  currencyId: string
  idNumber: string
  nextOfKin: string
  address: string
  pictureUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
}

export interface SalaryStructure {
  id: string
  employeeId: string
  allowanceTypeId: string
  amount: string
  currencyId: string
  isActive: boolean
  effectiveDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    userId: string
    employeeNumber: string
    bankName: string
    branchCode: string
    accountNumber: string
    basicSalary: string
    currencyId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    user: {
      firstName: string
      lastName: string
      email: string
    }
  }
  allowanceType: {
    id: string
    name: string
    code: string
    description: string
    isTaxable: boolean
    isActive: boolean
    createdById: string
    createdAt: string
    updatedAt: string
  }
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  } | null
}

export interface AllowanceType {
  id: string
  name: string
  code: string
  description: string
  isTaxable: boolean
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface DeductionType {
  id: string
  name: string
  code: string
  description: string
  isStatutory: boolean
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface BankTemplate {
  id: string
  name: string
  bankName: string
  delimiter: string
  hasHeader: boolean
  columnOrder: string
  isActive: boolean
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface Employee {
  id: string
  userId: string
  employeeNumber: string
  bankName: string
  branchCode: string
  accountNumber: string
  basicSalary: string
  currencyId: string
  idNumber: string
  nextOfKin: string
  address: string
  pictureUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
}

export interface PayrollRun {
  id: string
  name: string
  payPeriod: string
  startDate: string
  endDate: string
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  totalGrossPay: string
  totalDeductions: string
  totalNetPay: string
  currencyId: string
  createdById: string
  createdAt: string
  updatedAt: string
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  } | null
  createdBy: {
    firstName: string
    lastName: string
    email: string
  }
  _count?: {
    employeePayrolls: number
    payslips: number
  }
  employeePayrolls?: EmployeePayroll[]
}

export interface EmployeePayroll {
  id: string
  payrollRunId: string
  employeeId: string
  basicSalary: string
  totalAllowances: string
  totalDeductions: string
  grossPay: string
  netPay: string
  currencyId: string
  createdAt: string
  updatedAt: string
  employee: {
    id: string
    userId: string
    employeeNumber: string
    bankName: string
    branchCode: string
    accountNumber: string
    basicSalary: string
    currencyId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveType: string
  balance: string
  currencyId: string
  createdAt: string
  updatedAt: string
  employee: Employee
  currency: {
    id: string
    code: string
    name: string
    symbol: string
    isActive: boolean
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
}

export interface Payslip {
  id: string
  payRunId: string
  employeeId: string
  currencyId: string
  lines: {
    id: string
    componentId: string
    type: 'EARNING' | 'DEDUCTION' | 'CONTRIBUTION'
    amount: number
  }[]
  totals: {
    gross: number
    netPay: number
  }
}

// Tax Rules API
export const taxRulesApi = {
  getAll: async (): Promise<ApiResponse<TaxRule[]>> => {
    return apiClient.get<ApiResponse<TaxRule[]>>('/payroll/tax-rules')
  },

  create: async (data: {
    name: string
    type: 'PAYE' | 'NSSA' | 'AIDS_LEVY'
    rate: number
    threshold?: number
    ceiling?: number
    effectiveDate: string
    endDate?: string
    currencyId: string
  }): Promise<ApiResponse<TaxRule>> => {
    return apiClient.post<ApiResponse<TaxRule>>('/payroll/tax-rules', data)
  },

  update: async (id: string, data: {
    name?: string
    rate?: number
    threshold?: number
    ceiling?: number
    effectiveDate?: string
    endDate?: string
  }): Promise<ApiResponse<TaxRule>> => {
    return apiClient.put<ApiResponse<TaxRule>>(`/payroll/tax-rules/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/tax-rules/${id}`)
  }
}


// Deduction Types API
export const deductionTypesApi = {
  getAll: async (): Promise<ApiResponse<DeductionType[]>> => {
    return apiClient.get<ApiResponse<DeductionType[]>>('/payroll/deduction-types')
  },

  create: async (data: {
    name: string
    code: string
    description: string
    isStatutory: boolean
  }): Promise<ApiResponse<DeductionType>> => {
    return apiClient.post<ApiResponse<DeductionType>>('/payroll/deduction-types', data)
  },

  update: async (id: string, data: {
    name?: string
    code?: string
    description?: string
    isStatutory?: boolean
    isActive?: boolean
  }): Promise<ApiResponse<DeductionType>> => {
    return apiClient.put<ApiResponse<DeductionType>>(`/payroll/deduction-types/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/deduction-types/${id}`)
  }
}

// Bank Templates API
export const bankTemplatesApi = {
  getAll: async (): Promise<ApiResponse<BankTemplate[]>> => {
    return apiClient.get<ApiResponse<BankTemplate[]>>('/payroll/bank-templates')
  },

  create: async (data: {
    name: string
    bankName: string
    delimiter: string
    hasHeader: boolean
    columnOrder: string[]
  }): Promise<ApiResponse<BankTemplate>> => {
    return apiClient.post<ApiResponse<BankTemplate>>('/payroll/bank-templates', data)
  },

  update: async (id: string, data: {
    name?: string
    delimiter?: string
    hasHeader?: boolean
    columnOrder?: string[]
  }): Promise<ApiResponse<BankTemplate>> => {
    return apiClient.put<ApiResponse<BankTemplate>>(`/payroll/bank-templates/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/bank-templates/${id}`)
  }
}

// Employees API
export const employeesApi = {
  getAll: async (): Promise<ApiResponse<Employee[]>> => {
    return apiClient.get<ApiResponse<Employee[]>>('/payroll/employees')
  },

  create: async (data: {
    userId: string
    bankName: string
    branchCode: string
    accountNumber: string
    basicSalary: number
    currencyId: string
    idNumber: string
    nextOfKin: string
    address: string
    pictureUrl?: string | null
  }): Promise<ApiResponse<Employee>> => {
    return apiClient.post<ApiResponse<Employee>>('/payroll/employees', data)
  },

  update: async (id: string, data: {
    bankName?: string
    branchCode?: string
    accountNumber?: string
    basicSalary?: number
    idNumber?: string
    nextOfKin?: string
    address?: string
    pictureUrl?: string | null
    isActive?: boolean
  }): Promise<ApiResponse<Employee>> => {
    return apiClient.put<ApiResponse<Employee>>(`/payroll/employees/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/employees/${id}`)
  }
}

// Salary Structures API
export const salaryStructuresApi = {
  getAll: async (): Promise<ApiResponse<SalaryStructure[]>> => {
    return apiClient.get<ApiResponse<SalaryStructure[]>>('/payroll/salary-structures')
  },

  getByEmployee: async (employeeId: string): Promise<ApiResponse<SalaryStructure[]>> => {
    return apiClient.get<ApiResponse<SalaryStructure[]>>(`/payroll/salary-structures/employee/${employeeId}`)
  },

  create: async (data: {
    employeeId: string
    allowanceTypeId: string
    amount: number
    currencyId: string
    effectiveDate: string
    endDate?: string | null
  }): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.post<ApiResponse<SalaryStructure>>('/payroll/salary-structures', data)
  },

  update: async (id: string, data: {
    amount?: number
    isActive?: boolean
    endDate?: string | null
  }): Promise<ApiResponse<SalaryStructure>> => {
    return apiClient.put<ApiResponse<SalaryStructure>>(`/payroll/salary-structures/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/salary-structures/${id}`)
  }
}

// Payroll Runs API
export const payrollRunsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  }): Promise<ApiResponse<PayrollRun[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    
    const queryString = queryParams.toString()
    const url = queryString ? `/payroll/payroll-runs?${queryString}` : '/payroll/payroll-runs'
    return apiClient.get<ApiResponse<PayrollRun[]>>(url)
  },

  getById: async (id: string): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.get<ApiResponse<PayrollRun>>(`/payroll/payroll-runs/${id}`)
  },

  create: async (data: {
    name: string
    payPeriod: string
    startDate: string
    endDate: string
    currencyId: string
  }): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.post<ApiResponse<PayrollRun>>('/payroll/payroll-runs', data)
  },

  update: async (id: string, data: {
    name?: string
    payPeriod?: string
    startDate?: string
    endDate?: string
    currencyId?: string
    status?: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  }): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.put<ApiResponse<PayrollRun>>(`/payroll/payroll-runs/${id}`, data)
  },

  process: async (id: string): Promise<ApiResponse<PayrollRun>> => {
    return apiClient.post<ApiResponse<PayrollRun>>(`/payroll/payroll-runs/${id}/process`)
  },

  generateBankFile: async (id: string, bankTemplateId: string): Promise<Blob> => {
    // Import getAuthToken from cookies
    const { getAuthToken } = await import('@/lib/utils/cookies')
    const token = getAuthToken()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nvccz-pi.vercel.app'}/api/payroll/payroll-runs/${id}/bank-file`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ bankTemplateId })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to generate bank file: ${response.statusText}`)
    }
    
    return response.blob()
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/payroll-runs/${id}`)
  }
}

// Payslips API
export const payslipsApi = {
  getAll: async (): Promise<ApiResponse<Payslip[]>> => {
    return apiClient.get<ApiResponse<Payslip[]>>('/payroll/payslips')
  },

  getByPayRun: async (payRunId: string): Promise<ApiResponse<Payslip[]>> => {
    return apiClient.get<ApiResponse<Payslip[]>>(`/payroll/payslips?payRunId=${payRunId}`)
  },

  getByEmployee: async (employeeId: string): Promise<ApiResponse<Payslip[]>> => {
    return apiClient.get<ApiResponse<Payslip[]>>(`/payroll/payslips?employeeId=${employeeId}`)
  },

  getByEmployeeAndRun: async (employeeId: string, payrollRunId: string): Promise<ApiResponse<Payslip>> => {
    return apiClient.get<ApiResponse<Payslip>>(`/payroll/payslips/${employeeId}/${payrollRunId}`)
  }
}

// Allowance Types API
export const allowanceTypesApi = {
  getAll: async (): Promise<ApiResponse<AllowanceType[]>> => {
    return apiClient.get<ApiResponse<AllowanceType[]>>('/payroll/allowance-types')
  },

  create: async (data: {
    name: string
    code: string
    description: string
    isTaxable: boolean
  }): Promise<ApiResponse<AllowanceType>> => {
    return apiClient.post<ApiResponse<AllowanceType>>('/payroll/allowance-types', data)
  },

  update: async (id: string, data: {
    name?: string
    code?: string
    description?: string
    isTaxable?: boolean
    isActive?: boolean
  }): Promise<ApiResponse<AllowanceType>> => {
    return apiClient.put<ApiResponse<AllowanceType>>(`/payroll/allowance-types/${id}`, data)
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<ApiResponse<void>>(`/payroll/allowance-types/${id}`)
  }
}

// Payroll Dashboard Types
export interface PayrollAlert {
  type: 'warning' | 'info' | 'error'
  message: string
}

export interface PayrollMetricValue {
  value: number
  change: number
  changePercent?: number
}

export interface PayrollMetrics {
  totalPayrollThisMonth: PayrollMetricValue
  totalEmployeesPaid: PayrollMetricValue
  averageSalary: PayrollMetricValue
}

export interface MonthlyTrendPoint {
  month: string
  monthNumber: number
  year: number
  totalPayroll: number
}

export interface DepartmentPayroll {
  department: string
  amount: number
  employees: number
}

export interface PayrollListItem {
  id?: string
  employeeId: string
  name: string
  department: string
  baseSalary: number
  bonuses: number
  totalSalary: number
  status: string
  payDate?: string
}

export interface PayrollDashboardData {
  alert?: PayrollAlert | null
  metrics: PayrollMetrics
  monthlyTrend: MonthlyTrendPoint[]
  departmentDistribution?: DepartmentPayroll[]
  payrollList: PayrollListItem[]
}

export interface PayrollDashboardParams {
  month?: number
  year?: number
  currencyId?: string
}

// Dashboard API
export const payrollDashboardApi = {
  getDashboard: async (params: PayrollDashboardParams = {}): Promise<ApiResponse<PayrollDashboardData>> => {
    const queryParams = new URLSearchParams()
    if (params.month) queryParams.append('month', params.month.toString())
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.currencyId) queryParams.append('currencyId', params.currencyId)

    const queryString = queryParams.toString()
    return apiClient.get<ApiResponse<PayrollDashboardData>>(
      `/payroll/dashboard${queryString ? `?${queryString}` : ''}`
    )
  }
}


// Leave Balances API
export const leaveBalancesApi = {
  getByEmployee: async (employeeId: string): Promise<ApiResponse<LeaveBalance[]>> => {
    return apiClient.get<ApiResponse<LeaveBalance[]>>(`/payroll/leave-balances?employeeId=${employeeId}`)
  },

  create: async (data: {
    employeeId: string
    leaveType: string
    balance: number
    currencyId: string
  }): Promise<ApiResponse<LeaveBalance>> => {
    return apiClient.post<ApiResponse<LeaveBalance>>('/payroll/leave-balances', data)
  },

  update: async (id: string, data: {
    leaveType?: string
    balance?: number
    currencyId?: string
  }): Promise<ApiResponse<LeaveBalance>> => {
    return apiClient.put<ApiResponse<LeaveBalance>>(`/payroll/leave-balances/${id}`, data)
  }
}


