"use client"

import type { NonFinancialKPIData } from "../types"

interface Props {
  data: NonFinancialKPIData
  onChange: (data: NonFinancialKPIData) => void
  readOnly?: boolean
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-5 mb-1">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function KPIInput({
  label,
  field,
  value,
  onChange,
  readOnly,
  suffix,
  hint,
}: {
  label: string
  field: string
  value: number
  onChange: (field: string, value: number) => void
  readOnly?: boolean
  suffix?: string
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5 pl-4">
      <div className="flex-1">
        <label className="text-sm text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value || ""}
          onChange={e => onChange(field, parseFloat(e.target.value) || 0)}
          readOnly={readOnly}
          className={`w-36 text-right px-3 py-1.5 rounded border text-sm font-medium focus:outline-none focus:ring-1 ${
            readOnly
              ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
              : "border-red-300 bg-white focus:border-red-400 focus:ring-red-300"
          }`}
        />
        {suffix && <span className="text-xs text-gray-500 w-6">{suffix}</span>}
      </div>
    </div>
  )
}

export function NonFinancialKPIsTab({ data, onChange, readOnly }: Props) {
  const set = (field: string, value: number) => onChange({ ...data, [field]: value })

  return (
    <div className="max-w-2xl mx-auto space-y-1 py-2">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded border border-red-300 bg-white" />
          Manual entry
        </span>
      </div>

      {/* Customer Metrics */}
      <SectionHeader title="Customer Metrics" />
      <KPIInput label="Total Active Customers" field="totalCustomers" value={data.totalCustomers} onChange={set} readOnly={readOnly} />
      <KPIInput label="New Customers Acquired" field="newCustomers" value={data.newCustomers} onChange={set} readOnly={readOnly} hint="Customers added during this period" />
      <KPIInput label="Lost Customers / Churn" field="lostCustomers" value={data.lostCustomers} onChange={set} readOnly={readOnly} />
      <KPIInput label="Monthly Recurring Revenue (MRR)" field="monthlyRecurringRevenue" value={data.monthlyRecurringRevenue} onChange={set} readOnly={readOnly} hint="For subscription-based businesses" />
      <KPIInput label="Customer Acquisition Cost (CAC)" field="customerAcquisitionCost" value={data.customerAcquisitionCost} onChange={set} readOnly={readOnly} />
      <KPIInput label="Average Revenue per Customer" field="avgRevenuePerCustomer" value={data.avgRevenuePerCustomer} onChange={set} readOnly={readOnly} />

      {/* Human Capital */}
      <SectionHeader title="Human Capital" />
      <KPIInput label="Total Headcount" field="totalHeadcount" value={data.totalHeadcount} onChange={set} readOnly={readOnly} hint="Full-time employees at end of period" />
      <KPIInput label="New Hires" field="newHires" value={data.newHires} onChange={set} readOnly={readOnly} />
      <KPIInput label="Staff Departures" field="staffDepartures" value={data.staffDepartures} onChange={set} readOnly={readOnly} />
      <KPIInput label="Training Hours per Employee" field="trainingHours" value={data.trainingHours} onChange={set} readOnly={readOnly} suffix="hrs" />

      {/* Operational */}
      <SectionHeader title="Operational Metrics" />
      <KPIInput label="Unit Sales Volume" field="unitSales" value={data.unitSales} onChange={set} readOnly={readOnly} hint="Total units / transactions sold" />
      <KPIInput label="Average Selling Price" field="avgSellingPrice" value={data.avgSellingPrice} onChange={set} readOnly={readOnly} />
      <KPIInput label="Variable Cost per Unit" field="variableCostPerUnit" value={data.variableCostPerUnit} onChange={set} readOnly={readOnly} />
      <KPIInput label="Inventory Units on Hand" field="inventoryUnits" value={data.inventoryUnits} onChange={set} readOnly={readOnly} />

      {/* Innovation */}
      <SectionHeader title="Innovation & Growth" />
      <KPIInput label="New Products / Services Launched" field="newProductsLaunched" value={data.newProductsLaunched} onChange={set} readOnly={readOnly} />
      <KPIInput label="Patents Filed" field="patentsFiled" value={data.patentsFiled} onChange={set} readOnly={readOnly} />
      <KPIInput label="Conversion Rate" field="conversionRate" value={data.conversionRate} onChange={set} readOnly={readOnly} suffix="%" hint="Lead-to-customer conversion %" />
    </div>
  )
}
