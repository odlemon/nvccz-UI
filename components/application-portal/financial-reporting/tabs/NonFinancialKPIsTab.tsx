"use client"

import { useMemo } from "react"
import type { NonFinancialKPIData } from "../types"

interface Props {
  data: NonFinancialKPIData
  onChange: (data: NonFinancialKPIData) => void
  readOnly?: boolean
}

const pct = (n: number) => isNaN(n) || !isFinite(n) ? "N/A" : `${(n * 100).toFixed(1)}%`

function SectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-gray-50 border-t-2 border-gray-300">
      <td colSpan={3} className="py-2 pl-4 text-xs font-bold text-gray-800 uppercase tracking-wider">{title}</td>
    </tr>
  )
}

function SubHeader({ title }: { title: string }) {
  return (
    <tr className="bg-gray-100 border-t border-gray-200">
      <td colSpan={3} className="py-1.5 pl-8 text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</td>
    </tr>
  )
}

function ColHeaders() {
  return (
    <tr className="border-b border-gray-200 text-xs text-gray-500">
      <th className="text-left py-1.5 pl-8 font-semibold w-[45%]">Parameter</th>
      <th className="text-left py-1.5 px-3 font-semibold w-[30%]">Description / Output</th>
      <th className="text-right py-1.5 pr-2 font-semibold w-[25%]">Value</th>
    </tr>
  )
}

function KPIRow({ label, field, data, onChange, readOnly, suffix, description }: {
  label: string; field: keyof NonFinancialKPIData
  data: NonFinancialKPIData; onChange: (d: NonFinancialKPIData) => void
  readOnly?: boolean; suffix?: string; description?: string
}) {
  return (
    <tr className="border-t border-gray-100 hover:bg-blue-50/20">
      <td className="py-2 pl-8 text-sm text-gray-700">{label}</td>
      <td className="py-2 px-3 text-xs text-gray-400">{description}</td>
      <td className="py-1 pr-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <input
            type="number"
            value={(data[field] as number) || ""}
            onChange={e => onChange({ ...data, [field]: parseFloat(e.target.value) || 0 })}
            readOnly={readOnly}
            className={`w-28 text-right px-2 py-1.5 rounded border text-sm focus:outline-none focus:ring-1 ${
              readOnly ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                       : "border-red-300 bg-white focus:border-red-500 focus:ring-red-200"
            }`}
          />
          {suffix && <span className="text-xs text-gray-400 w-5 shrink-0">{suffix}</span>}
        </div>
      </td>
    </tr>
  )
}

function CalcKPIRow({ label, value, description }: { label: string; value: string; description?: string }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 pl-8 text-sm text-gray-700">{label}</td>
      <td className="py-2 px-3 text-xs text-gray-400">{description}</td>
      <td className="py-1 pr-2 text-right">
        <span className="inline-block w-28 text-right px-2 py-1.5 rounded border bg-yellow-50 border-yellow-200 text-yellow-800 text-sm font-semibold">{value}</span>
      </td>
    </tr>
  )
}

export function NonFinancialKPIsTab({ data, onChange, readOnly }: Props) {
  const derived = useMemo(() => {
    const retentionRate = data.customersAtBeginning > 0
      ? (data.customersAtEnd - data.newCustomersAcquired) / data.customersAtBeginning
      : NaN
    return { retentionRate }
  }, [data])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2.5 pl-4 font-medium text-gray-500 min-w-[280px]">
              <span className="inline-flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-red-300 bg-white inline-block" />Manual entry</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-yellow-200 bg-yellow-50 inline-block" />Auto-calculated</span>
              </span>
            </th>
            <th className="text-left py-2.5 px-3 font-medium text-gray-500 w-[30%]">Description</th>
            <th className="text-right py-2.5 pr-2 font-medium text-gray-500 w-[25%]">Value</th>
          </tr>
        </thead>
        <tbody>
          {/* Customer Metrics */}
          <SectionHeader title="Customer Metrics" />

          <SubHeader title="Customer Acquisition" />
          <ColHeaders />
          <KPIRow label="New Customers Acquired"    field="newCustomersAcquired" data={data} onChange={onChange} readOnly={readOnly} description="No. of new clients this period" />
          <KPIRow label="Active Customers"          field="activeCustomers"      data={data} onChange={onChange} readOnly={readOnly} description="Total active client count" />

          <SubHeader title="Customer Retention" />
          <KPIRow label="Customers at Beginning"    field="customersAtBeginning" data={data} onChange={onChange} readOnly={readOnly} description="Headcount at start of period" />
          <KPIRow label="Customers at End"          field="customersAtEnd"       data={data} onChange={onChange} readOnly={readOnly} description="Headcount at end of period" />
          <CalcKPIRow label="Retention Rate"        value={pct(derived.retentionRate)} description="(End – New) / Beginning × 100" />

          <SubHeader title="Customer Satisfaction" />
          <KPIRow label="Complaints per Period"        field="complaintsPerPeriod"     data={data} onChange={onChange} readOnly={readOnly} description="No. of complaints received" />
          <KPIRow label="Complaint Resolution Time"   field="complaintResolutionDays" data={data} onChange={onChange} readOnly={readOnly} suffix="d" description="Average days to resolve" />

          <SubHeader title="Market Penetration" />
          <KPIRow label="Market Outlets Covered"    field="marketOutlets" data={data} onChange={onChange} readOnly={readOnly} description="No. of outlets / distribution points" />

          {/* Innovations */}
          <SectionHeader title="Innovations" />
          <ColHeaders />
          <KPIRow label="New Products / Services Launched" field="newProductsLaunched"   data={data} onChange={onChange} readOnly={readOnly} description="Count of new products" />
          <KPIRow label="New Systems / Automations"        field="newSystemsAutomations" data={data} onChange={onChange} readOnly={readOnly} description="No. of new systems deployed" />
          <KPIRow label="R&D Budget"                       field="rdBudget"              data={data} onChange={onChange} readOnly={readOnly} description="Budget allocated to R&D" />

          {/* HR & Culture */}
          <SectionHeader title="HR & Culture" />
          <ColHeaders />
          <KPIRow label="Staff Turnover"                field="staffTurnoverCount"        data={data} onChange={onChange} readOnly={readOnly} description="No. of employees leaving" />
          <KPIRow label="Trainings & Certifications"    field="trainingsAndCertifications" data={data} onChange={onChange} readOnly={readOnly} description="No. of trainings completed" />
          <KPIRow label="Employee Engagements"          field="employeeEngagements"       data={data} onChange={onChange} readOnly={readOnly} description="No. of engagement activities" />
          <KPIRow label="Health & Safety Trainings"     field="healthSafetyTrainings"     data={data} onChange={onChange} readOnly={readOnly} description="Safety trainings conducted" />

          {/* ESG */}
          <SectionHeader title="ESG — Governance" />
          <ColHeaders />
          <KPIRow label="Board Meeting Frequency"     field="boardMeetingsFrequency"  data={data} onChange={onChange} readOnly={readOnly} description="No. of board meetings held" />
          <KPIRow label="Board Composition"           field="boardCompositionCount"   data={data} onChange={onChange} readOnly={readOnly} description="No. of board members" />
          <KPIRow label="Timely Management Reports"   field="timelyManagementReports" data={data} onChange={onChange} readOnly={readOnly} description="Reports submitted on time" />

          <SectionHeader title="ESG — Environmental" />
          <ColHeaders />
          <KPIRow label="Emissions & Waste Reduced"   field="emissionsWasteReduced" data={data} onChange={onChange} readOnly={readOnly} description="Reduction in emissions / waste" />
          <KPIRow label="Accidents Reduced"           field="accidentsReduced"      data={data} onChange={onChange} readOnly={readOnly} description="Reduction in workplace accidents" />

          <SectionHeader title="ESG — Social" />
          <ColHeaders />
          <KPIRow label="Youth / Women / Disadvantaged Empowered" field="youthWomenEmpowered" data={data} onChange={onChange} readOnly={readOnly} description="No. of beneficiaries" />
          <KPIRow label="Jobs Created"                field="jobsCreated"   data={data} onChange={onChange} readOnly={readOnly} description="Direct jobs created this period" />
          <KPIRow label="CSR Activities"              field="csrActivities" data={data} onChange={onChange} readOnly={readOnly} description="No. of CSR initiatives" />
        </tbody>
      </table>
    </div>
  )
}
