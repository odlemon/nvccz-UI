export type SourceField = { name: string; type: string }

export type SourceSystem = {
  id: string
  name: string
  fieldCount: number
  fields: SourceField[]
}

export type MappingStatus = "Active" | "Warning" | "Failed" | "Inactive"

export type MappingRow = {
  id: string
  sourceField: string
  sourceType: string
  sourceSystem: string
  transformation: string
  transformationDetail: string
  targetField: string
  targetType: string
  targetCategory: string
  enabled: boolean
  status: MappingStatus
  owner: string
  ownerInitials: string
  description: string
  syncFrequency: string
  validation: { level: "danger" | "warning" | "success"; label: string; detail: string }[]
  syncLogs: { at: string; tone: "danger" | "warning" | "success"; title: string; detail: string }[]
  sampleData: { source: string; mapped: string }[]
  testResults: { name: string; passed: boolean; detail: string }[]
}

export const sourceSystems: SourceSystem[] = [
  {
    id: "src-erp",
    name: "ERP System (Oracle ERP)",
    fieldCount: 12,
    fields: [
      { name: "department_code", type: "String" },
      { name: "total_revenue", type: "Number" },
      { name: "operating_expense", type: "Number" },
      { name: "net_profit", type: "Number" },
      { name: "cost_center", type: "String" },
    ],
  },
  {
    id: "src-hr",
    name: "HR System (Workday)",
    fieldCount: 15,
    fields: [
      { name: "headcount", type: "Number" },
      { name: "attrition_rate", type: "Number" },
      { name: "training_hours", type: "Number" },
      { name: "employee_id", type: "String" },
    ],
  },
  {
    id: "src-crm",
    name: "CRM System (Salesforce)",
    fieldCount: 18,
    fields: [
      { name: "customer_satisfaction_c", type: "Number" },
      { name: "NPS_Score", type: "Number" },
      { name: "account_id", type: "String" },
    ],
  },
  {
    id: "src-gsheets",
    name: "Google Sheets (Financials)",
    fieldCount: 6,
    fields: [
      { name: "budget_variance", type: "Number" },
      { name: "forecast_accuracy", type: "Number" },
    ],
  },
]

export const mappingRows: MappingRow[] = [
  {
    id: "MAP-0001",
    sourceField: "total_revenue",
    sourceType: "Number",
    sourceSystem: "ERP System",
    transformation: "Aggregate (Sum)",
    transformationDetail: "Sum by fiscal_month",
    targetField: "Revenue Growth",
    targetType: "Number",
    targetCategory: "KPI (Financial)",
    enabled: true,
    status: "Active",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Maps monthly total revenue to the Revenue Growth KPI.",
    syncFrequency: "Monthly",
    validation: [
      { level: "success", label: "Passed", detail: "Data type validation passed" },
      { level: "success", label: "Passed", detail: "No missing values detected" },
    ],
    syncLogs: [
      { at: "13 Jul 2026, 08:15 AM", tone: "success", title: "Sync successful", detail: "1,248 records processed" },
      { at: "12 Jul 2026, 08:10 AM", tone: "success", title: "Sync successful", detail: "1,244 records processed" },
    ],
    sampleData: [
      { source: "$4,820,000", mapped: "$4,820,000" },
      { source: "$4,910,500", mapped: "$4,910,500" },
    ],
    testResults: [
      { name: "Data type match", passed: true, detail: "Number → Number" },
      { name: "Null check", passed: true, detail: "0 nulls in last sync" },
    ],
  },
  {
    id: "MAP-0002",
    sourceField: "department_code",
    sourceType: "String",
    sourceSystem: "ERP System",
    transformation: "Lookup",
    transformationDetail: "Department Mapping Table",
    targetField: "Department",
    targetType: "Dimension",
    targetCategory: "KPI (Financial)",
    enabled: true,
    status: "Active",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Resolves ERP department codes to human-readable department names.",
    syncFrequency: "Monthly",
    validation: [{ level: "success", label: "Passed", detail: "All codes resolved successfully" }],
    syncLogs: [{ at: "13 Jul 2026, 08:15 AM", tone: "success", title: "Sync successful", detail: "1,248 records processed" }],
    sampleData: [
      { source: "FIN-001", mapped: "Finance Department" },
      { source: "OPS-002", mapped: "Operations Department" },
    ],
    testResults: [{ name: "Lookup coverage", passed: true, detail: "100% of codes mapped" }],
  },
  {
    id: "MAP-0003",
    sourceField: "headcount",
    sourceType: "Number",
    sourceSystem: "HR System",
    transformation: "Transform",
    transformationDetail: "End of Month Snapshot",
    targetField: "Headcount",
    targetType: "Number",
    targetCategory: "KPI (People)",
    enabled: true,
    status: "Active",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Captures the end-of-month headcount snapshot for the Headcount KPI.",
    syncFrequency: "Monthly",
    validation: [{ level: "success", label: "Passed", detail: "Snapshot captured successfully" }],
    syncLogs: [{ at: "13 Jul 2026, 08:15 AM", tone: "success", title: "Sync successful", detail: "412 records processed" }],
    sampleData: [{ source: "412 employees", mapped: "412" }],
    testResults: [{ name: "Snapshot timing", passed: true, detail: "Captured at month-end" }],
  },
  {
    id: "MAP-0004",
    sourceField: "attrition_rate",
    sourceType: "Number",
    sourceSystem: "HR System",
    transformation: "Calculate",
    transformationDetail: "(Leavers / Avg Headcount) * 100",
    targetField: "Attrition Rate",
    targetType: "Percentage",
    targetCategory: "KPI (People)",
    enabled: true,
    status: "Active",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Calculates monthly attrition rate from leavers and average headcount.",
    syncFrequency: "Monthly",
    validation: [{ level: "success", label: "Passed", detail: "Calculation verified against source" }],
    syncLogs: [{ at: "13 Jul 2026, 08:15 AM", tone: "success", title: "Sync successful", detail: "12 records processed" }],
    sampleData: [{ source: "8 leavers / 410 avg", mapped: "1.95%" }],
    testResults: [{ name: "Formula accuracy", passed: true, detail: "Matches manual calculation" }],
  },
  {
    id: "MAP-0005",
    sourceField: "customer_satisfaction_c",
    sourceType: "Number",
    sourceSystem: "CRM System",
    transformation: "Average",
    transformationDetail: "Average by Month",
    targetField: "Customer Satisfaction",
    targetType: "Number",
    targetCategory: "KPI (Customer)",
    enabled: true,
    status: "Warning",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Averages customer satisfaction survey scores by calendar month.",
    syncFrequency: "Monthly",
    validation: [
      { level: "warning", label: "Warning", detail: "Missing values in 3 source records" },
      { level: "success", label: "Passed", detail: "Data type validation passed" },
    ],
    syncLogs: [{ at: "13 Jul 2026, 08:12 AM", tone: "warning", title: "Sync completed with warnings", detail: "3 records with missing values" }],
    sampleData: [{ source: "4.3 / 5.0", mapped: "86%" }],
    testResults: [{ name: "Completeness", passed: false, detail: "3 records missing satisfaction score" }],
  },
  {
    id: "MAP-0006",
    sourceField: "NPS_Score",
    sourceType: "Number",
    sourceSystem: "CRM System",
    transformation: "Transform",
    transformationDetail: "Cast to Number",
    targetField: "NPS Score",
    targetType: "Number",
    targetCategory: "KPI (Customer)",
    enabled: true,
    status: "Active",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Casts the raw NPS score field to a numeric KPI value.",
    syncFrequency: "Monthly",
    validation: [{ level: "success", label: "Passed", detail: "Data type validation passed" }],
    syncLogs: [{ at: "13 Jul 2026, 08:15 AM", tone: "success", title: "Sync successful", detail: "980 records processed" }],
    sampleData: [{ source: "\"62\"", mapped: "62" }],
    testResults: [{ name: "Cast accuracy", passed: true, detail: "All values cast without error" }],
  },
  {
    id: "MAP-0007",
    sourceField: "operating_expense",
    sourceType: "Number",
    sourceSystem: "ERP System (Oracle ERP)",
    transformation: "Aggregate (Sum)",
    transformationDetail: "Sum by fiscal_month",
    targetField: "Operating Expenses",
    targetType: "Number",
    targetCategory: "KPI (Financial)",
    enabled: true,
    status: "Failed",
    owner: "Adm. User",
    ownerInitials: "AU",
    description: "Maps monthly operating expenses to the Operating Expenses KPI.",
    syncFrequency: "Monthly",
    validation: [
      { level: "danger", label: "Failed", detail: "Validation failed on 13 Jul 2026, 08:15 AM" },
      { level: "warning", label: "Warning", detail: "Missing values in 2 source records" },
      { level: "success", label: "Passed", detail: "Data type validation passed" },
    ],
    syncLogs: [
      { at: "13 Jul 2026, 08:15 AM", tone: "danger", title: "Sync failed", detail: "126 records failed validation" },
      { at: "12 Jul 2026, 08:10 AM", tone: "warning", title: "Sync completed with warnings", detail: "2 records with missing values" },
      { at: "11 Jul 2026, 08:10 AM", tone: "success", title: "Sync successful", detail: "1,248 records processed" },
    ],
    sampleData: [
      { source: "$2,140,000", mapped: "$2,140,000" },
      { source: "null", mapped: "Error" },
    ],
    testResults: [
      { name: "Data type match", passed: true, detail: "Number → Number" },
      { name: "Null check", passed: false, detail: "126 nulls found in last sync" },
    ],
  },
]

export const mappingSourceOptions = ["All Sources", "ERP System (Oracle ERP)", "HR System (Workday)", "CRM System (Salesforce)", "Google Sheets (Financials)"]
export const mappingTypeOptions = ["All Types", "Aggregate (Sum)", "Lookup", "Transform", "Calculate", "Average"]
export const mappingStatusOptions: MappingStatus[] = ["Active", "Warning", "Failed", "Inactive"]
export const mappingFrequencyOptions = ["All Frequencies", "Monthly", "Weekly", "Daily", "Real-time"]
