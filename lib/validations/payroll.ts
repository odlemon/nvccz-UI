import * as yup from "yup"

// Tax Rule validation schemas
export const taxRuleFormSchema = yup.object({
  name: yup.string().required("Tax rule name is required").min(2, "Name must be at least 2 characters"),
  type: yup.string().oneOf(['PAYE', 'NSSA', 'AIDS_LEVY', 'NEC', 'STANDARDS_LEVY', 'ZIMDEV'], "Invalid tax type").required("Tax type is required"),
  rate: yup.number().required("Rate is required").min(0, "Rate must be positive").max(100, "Rate cannot exceed 100%"),
  threshold: yup.number().nullable().min(0, "Threshold must be positive"),
  ceiling: yup.number().nullable().min(0, "Ceiling must be positive"),
  effectiveDate: yup.date().required("Effective date is required"),
  endDate: yup.date().nullable().min(yup.ref('effectiveDate'), "End date must be after effective date"),
  currencyId: yup.string().required("Currency is required")
})

// Allowance Type validation schemas
export const allowanceTypeFormSchema = yup.object({
  name: yup.string().required("Allowance name is required").min(2, "Name must be at least 2 characters"),
  code: yup.string().required("Code is required").min(2, "Code must be at least 2 characters").max(10, "Code must be at most 10 characters"),
  description: yup.string().required("Description is required").min(10, "Description must be at least 10 characters"),
  type: yup.string().oneOf(['HOUSING', 'TRANSPORT', 'MEDICAL', 'SHORT_TIME', 'SICK_LEAVE', 'ANNUAL_LEAVE', 'UNPAID_LEAVE', 'OTHER'], "Invalid allowance type").required("Allowance type is required"),
  isTaxable: yup.boolean().required("Taxable status is required")
})

// Deduction Type validation schemas
export const deductionTypeFormSchema = yup.object({
  name: yup.string().required("Deduction name is required").min(2, "Name must be at least 2 characters"),
  code: yup.string().required("Code is required").min(2, "Code must be at least 2 characters").max(10, "Code must be at most 10 characters"),
  description: yup.string().required("Description is required").min(10, "Description must be at least 10 characters"),
  isStatutory: yup.boolean().required("Statutory status is required")
})

// Bank Template validation schemas
export const bankTemplateFormSchema = yup.object({
  name: yup.string().required("Template name is required").min(2, "Name must be at least 2 characters"),
  bankName: yup.string().required("Bank name is required").min(2, "Bank name must be at least 2 characters"),
  delimiter: yup.string().required("Delimiter is required").oneOf([',', ';', '|', '\t'], "Invalid delimiter"),
  hasHeader: yup.boolean().required("Header status is required"),
  columnOrder: yup.array().of(yup.string()).min(1, "At least one column is required").required("Column order is required")
})

// Employee validation schemas
export const employeeFormSchema = yup.object({
  userId: yup.string().required("User is required"),
  bankName: yup.string().required("Bank name is required").min(2, "Bank name must be at least 2 characters"),
  branchCode: yup.string().required("Branch code is required").min(2, "Branch code must be at least 2 characters"),
  accountNumber: yup.string().required("Account number is required").min(5, "Account number must be at least 5 characters"),
  basicSalary: yup.number().required("Basic salary is required").min(0, "Salary must be positive"),
  currencyId: yup.string().required("Currency is required"),
  idNumber: yup.string().required("ID number is required").min(5, "ID number must be at least 5 characters"),
  nextOfKin: yup.string().required("Next of kin is required").min(2, "Next of kin name must be at least 2 characters"),
  address: yup.string().required("Address is required").min(5, "Address must be at least 5 characters"),
  pictureUrl: yup.string().url("Picture URL must be a valid URL").nullable()
})

// Salary Structure validation schemas
export const salaryStructureFormSchema = yup.object({
  employeeId: yup.string().required("Employee is required"),
  allowanceTypeId: yup.string().required("Allowance type is required"),
  amount: yup.number().required("Amount is required").min(0, "Amount must be positive"),
  currencyId: yup.string().required("Currency is required"),
  effectiveDate: yup.date().required("Effective date is required"),
  endDate: yup.date().nullable().min(yup.ref('effectiveDate'), "End date must be after effective date")
})

// Payroll Run validation schemas
export const payrollRunFormSchema = yup.object({
  name: yup.string().required("Payroll run name is required").min(2, "Name must be at least 2 characters"),
  payPeriod: yup.string().required("Pay period is required").min(2, "Pay period must be at least 2 characters"),
  startDate: yup.date().required("Start date is required"),
  endDate: yup.date().required("End date is required").min(yup.ref('startDate'), "End date must be after start date"),
  currencyId: yup.string().required("Currency is required")
})

// Export types
export type TaxRuleFormData = yup.InferType<typeof taxRuleFormSchema>
export type AllowanceTypeFormData = yup.InferType<typeof allowanceTypeFormSchema>
export type DeductionTypeFormData = yup.InferType<typeof deductionTypeFormSchema>
export type BankTemplateFormData = yup.InferType<typeof bankTemplateFormSchema>
export type EmployeeFormData = yup.InferType<typeof employeeFormSchema>
export type SalaryStructureFormData = yup.InferType<typeof salaryStructureFormSchema>
export type PayrollRunFormData = yup.InferType<typeof payrollRunFormSchema>
