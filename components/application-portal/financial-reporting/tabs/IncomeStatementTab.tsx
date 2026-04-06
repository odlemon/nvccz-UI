"use client"

import { useMemo } from "react"
import type { IncomeStatementData, V3 } from "../types"

interface Props {
  data: IncomeStatementData
  onChange: (data: IncomeStatementData) => void
  readOnly?: boolean
  years: [string, string, string]
}

const fmt = (n: number) =>
  n === 0 ? "-"
    : n < 0 ? `(${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })})`
    : n.toLocaleString("en-US", { minimumFractionDigits: 0 })

function add(...rows: V3[]): V3 {
  return rows.reduce((a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], [0,0,0] as V3)
}
function sub(a: V3, b: V3): V3 { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]] }

function SectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-gray-50 border-t-2 border-gray-300">
      <td colSpan={4} className="py-2 pl-4 text-xs font-bold text-gray-800 uppercase tracking-wider">
        {title}
      </td>
    </tr>
  )
}

function ManualRow({
  label, field, data, onChange, readOnly, indent = 1,
}: {
  label: string; field: keyof IncomeStatementData
  data: IncomeStatementData; onChange: (d: IncomeStatementData) => void
  readOnly?: boolean; indent?: number
}) {
  const vals = data[field] as V3
  const set = (col: 0|1|2, value: number) => {
    const updated = [...vals] as V3
    updated[col] = value
    onChange({ ...data, [field]: updated })
  }
  return (
    <tr className="border-t border-gray-100 hover:bg-blue-50/20">
      <td className="py-1.5 pr-4 text-sm text-gray-700" style={{ paddingLeft: `${indent * 20}px` }}>
        {label}
      </td>
      {([0,1,2] as const).map(col => (
        <td key={col} className="py-1 px-1 text-right w-36">
          <input
            type="number"
            value={vals[col] || ""}
            onChange={e => set(col, parseFloat(e.target.value) || 0)}
            readOnly={readOnly}
            className={`w-32 text-right px-2 py-1 rounded border text-sm focus:outline-none focus:ring-1 ${
              readOnly ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                       : "border-red-300 bg-white focus:border-red-500 focus:ring-red-200"
            }`}
          />
        </td>
      ))}
    </tr>
  )
}

function CalcRow({
  label, values, bold=false, highlight=false, doubleBorderTop=false, doubleBorderBottom=false, indent=0,
}: {
  label: string; values: V3; bold?: boolean; highlight?: boolean
  doubleBorderTop?: boolean; doubleBorderBottom?: boolean; indent?: number
}) {
  return (
    <tr className={[
      doubleBorderTop ? "border-t-2 border-gray-700" : "border-t border-gray-200",
      doubleBorderBottom ? "border-b-2 border-gray-700" : "",
    ].join(" ")}>
      <td className={`py-1.5 pr-4 text-sm ${bold ? "font-semibold text-gray-900" : "text-gray-600 italic"}`}
          style={{ paddingLeft: `${indent * 20}px` }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-1 px-1 text-right w-36">
          <span className={`inline-block w-32 text-right px-2 py-1 rounded border text-sm ${
            highlight
              ? v < 0 ? "bg-red-50 border-red-200 text-red-700 font-semibold"
                      : "bg-yellow-50 border-yellow-200 text-yellow-800 font-semibold"
              : bold ? "bg-gray-50 border-gray-200 text-gray-800 font-semibold"
                     : "bg-gray-50 border-gray-200 text-gray-600"
          }`}>{fmt(v)}</span>
        </td>
      ))}
    </tr>
  )
}

function Spacer() { return <tr><td colSpan={4} className="h-2" /></tr> }

export function IncomeStatementTab({ data, onChange, readOnly, years }: Props) {
  const c = useMemo(() => {
    const totalNetRevenue  = sub(add(data.grossSales, data.otherRevenue), data.returnsRefunds)
    const totalCOGS        = add(data.goodsPurchased, data.materials, data.labour, data.overhead)
    const grossProfit      = sub(totalNetRevenue, totalCOGS)
    const totalOpEx        = add(
      data.advertisingPromotion, data.badDebt, data.bankServiceCharges, data.computerInternet,
      data.deliveryFreight, data.furnitureEquipment, data.insurance, data.maintenanceRepairs,
      data.mileage, data.officeSupplies, data.otherExpenses, data.payrollProcessing,
      data.postageDelivery, data.professionalServices, data.rentLease, data.researchDevelopment,
      data.salariesBenefitsWages, data.travel, data.utilitiesTelephone, data.depreciationAmortization,
    )
    const ebit             = sub(grossProfit, totalOpEx)
    const ebt              = sub(add(ebit, data.nonOperatingRevenues), data.interestExpense)
    const incomeFromCont   = sub(ebt, data.incomeTaxExpense)
    const btlTotal         = add(data.discontinuedOperations, data.accountingChanges, data.extraordinaryItems)
    const netIncome        = add(incomeFromCont, btlTotal)
    return { totalNetRevenue, totalCOGS, grossProfit, totalOpEx, ebit, ebt, incomeFromCont, btlTotal, netIncome }
  }, [data])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {/* Header */}
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2.5 pl-4 font-medium text-gray-500 min-w-[280px]">
              <span className="inline-flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded border border-red-300 bg-white inline-block" />
                  Manual
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded border border-yellow-200 bg-yellow-50 inline-block" />
                  Calculated
                </span>
              </span>
            </th>
            {years.map(y => (
              <th key={y} className="text-right py-2.5 px-2 font-bold text-gray-900 w-36 whitespace-nowrap">{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* REVENUE */}
          <SectionHeader title="Revenue" />
          <ManualRow label="Gross sales"                      field="grossSales"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Returns, refunds and allowances"  field="returnsRefunds" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Other revenue"                    field="otherRevenue"   data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total net revenue"                values={c.totalNetRevenue} bold highlight />
          <Spacer />

          {/* COGS */}
          <SectionHeader title="Cost of goods sold" />
          <ManualRow label="Goods purchased" field="goodsPurchased" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Materials"        field="materials"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Labour"           field="labour"        data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Overhead"         field="overhead"      data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total cost of goods sold" values={c.totalCOGS} bold highlight />
          <Spacer />
          <CalcRow   label="Gross profit" values={c.grossProfit} bold highlight doubleBorderTop />
          <Spacer />

          {/* OPERATING EXPENSES */}
          <SectionHeader title="Operating expenses" />
          <ManualRow label="Advertising and promotion"      field="advertisingPromotion"   data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Bad debt"                       field="badDebt"                data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Bank service charges"           field="bankServiceCharges"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Computer and internet"          field="computerInternet"       data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Delivery / freight expense"     field="deliveryFreight"        data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Furniture and equipment"        field="furnitureEquipment"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Insurance"                      field="insurance"              data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Maintenance and repairs"        field="maintenanceRepairs"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Mileage"                        field="mileage"                data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Office supplies"                field="officeSupplies"         data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Other expenses"                 field="otherExpenses"          data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Payroll processing"             field="payrollProcessing"      data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Postage and delivery"           field="postageDelivery"        data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Professional services"          field="professionalServices"   data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Rent / lease"                   field="rentLease"              data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Research and development"       field="researchDevelopment"    data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Salaries, benefits and wages"   field="salariesBenefitsWages"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Travel"                         field="travel"                 data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Utilities / telephone"          field="utilitiesTelephone"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Depreciation and amortisation"  field="depreciationAmortization" data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total operating expenses"       values={c.totalOpEx} bold highlight />
          <Spacer />

          {/* EBIT / EBT */}
          <CalcRow label="Operating income (loss) — EBIT" values={c.ebit} bold highlight doubleBorderTop />
          <Spacer />
          <ManualRow label="Non-operating revenues and expenses" field="nonOperatingRevenues" data={data} onChange={onChange} readOnly={readOnly} indent={2} />
          <ManualRow label="(Less) Interest expense"             field="interestExpense"       data={data} onChange={onChange} readOnly={readOnly} indent={2} />
          <CalcRow   label="Income before taxes (EBT)"           values={c.ebt} bold highlight />
          <Spacer />
          <ManualRow label="(Less) Income tax expense"           field="incomeTaxExpense"      data={data} onChange={onChange} readOnly={readOnly} indent={2} />
          <CalcRow   label="Income from continuing operations"   values={c.incomeFromCont} bold highlight />
          <Spacer />

          {/* BELOW-THE-LINE */}
          <SectionHeader title="Below-the-line items" />
          <ManualRow label="Income from discontinued operations" field="discontinuedOperations" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Effect of accounting changes"        field="accountingChanges"      data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Extraordinary items"                 field="extraordinaryItems"     data={data} onChange={onChange} readOnly={readOnly} />
          <Spacer />

          {/* NET INCOME */}
          <CalcRow label="Net income" values={c.netIncome} bold highlight doubleBorderTop doubleBorderBottom />
        </tbody>
      </table>
    </div>
  )
}
