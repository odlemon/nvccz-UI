"use client"

import { useMemo } from "react"
import type { CashFlowData, V2 } from "../types"

interface Props {
  data: CashFlowData
  onChange: (data: CashFlowData) => void
  readOnly?: boolean
  years: [string, string]
}

const fmt = (n: number) =>
  n === 0 ? "-"
    : n < 0 ? `(${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })})`
    : n.toLocaleString("en-US", { minimumFractionDigits: 0 })

function v2add(...rows: V2[]): V2 { return rows.reduce((a, b) => [a[0]+b[0], a[1]+b[1]], [0,0] as V2) }
function v2sub(a: V2, b: V2): V2 { return [a[0]-b[0], a[1]-b[1]] }

function SectionHeader({ title, sub=false }: { title: string; sub?: boolean }) {
  return (
    <tr className={sub ? "bg-gray-100 border-t border-gray-200" : "bg-gray-50 border-t-2 border-gray-300"}>
      <td colSpan={3} className={`py-2 text-xs font-bold uppercase tracking-wider ${sub ? "pl-8 text-gray-600 font-semibold" : "pl-4 text-gray-800"}`}>
        {title}
      </td>
    </tr>
  )
}

function ManualRow({ label, field, data, onChange, readOnly, indent=2 }: {
  label: string; field: keyof CashFlowData
  data: CashFlowData; onChange: (d: CashFlowData) => void
  readOnly?: boolean; indent?: number
}) {
  const vals = data[field] as V2
  const set = (col: 0|1, value: number) => {
    const updated = [...vals] as V2
    updated[col] = value
    onChange({ ...data, [field]: updated })
  }
  return (
    <tr className="border-t border-gray-100 hover:bg-blue-50/20">
      <td className="py-1.5 pr-4 text-sm text-gray-700" style={{ paddingLeft: `${indent * 20}px` }}>{label}</td>
      {([0,1] as const).map(col => (
        <td key={col} className="py-1 px-1 text-right w-36">
          <input type="number" value={vals[col] || ""}
            onChange={e => set(col, parseFloat(e.target.value) || 0)}
            readOnly={readOnly}
            className={`w-32 text-right px-2 py-1 rounded border text-sm focus:outline-none focus:ring-1 ${
              readOnly ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                       : "border-red-300 bg-white focus:border-red-500 focus:ring-red-200"
            }`} />
        </td>
      ))}
    </tr>
  )
}

function CalcRow({ label, values, bold=false, highlight=false, doubleBorderTop=false, doubleBorderBottom=false, indent=1 }: {
  label: string; values: V2; bold?: boolean; highlight?: boolean
  doubleBorderTop?: boolean; doubleBorderBottom?: boolean; indent?: number
}) {
  return (
    <tr className={[doubleBorderTop ? "border-t-2 border-gray-700" : "border-t border-gray-200", doubleBorderBottom ? "border-b-2 border-gray-700" : ""].join(" ")}>
      <td className={`py-1.5 pr-4 text-sm ${bold ? "font-semibold text-gray-900" : "italic text-gray-600"}`}
          style={{ paddingLeft: `${indent * 20}px` }}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-1 px-1 text-right w-36">
          <span className={`inline-block w-32 text-right px-2 py-1 rounded border text-sm ${
            highlight
              ? v < 0 ? "bg-red-50 border-red-200 text-red-700 font-semibold"
                      : "bg-yellow-50 border-yellow-200 text-yellow-800 font-semibold"
              : "bg-gray-50 border-gray-200 text-gray-700 font-semibold"
          }`}>{fmt(v)}</span>
        </td>
      ))}
    </tr>
  )
}

function Spacer() { return <tr><td colSpan={3} className="h-2" /></tr> }

export function CashFlowTab({ data, onChange, readOnly, years }: Props) {
  const c = useMemo(() => {
    const totalOpReceipts  = v2add(data.cashFromCustomers, data.cashFromOtherOperations)
    const totalOpPayments  = v2add(data.paidInventory, data.paidAdminExpenses, data.paidWages, data.paidInterest, data.paidIncomeTaxes)
    const netOperating     = v2sub(totalOpReceipts, totalOpPayments)
    const totalInvReceipts = v2add(data.proceedsFromPropertySales, data.principalCollected, data.proceedsFromInvestmentSales)
    const totalInvPayments = v2add(data.purchaseOfProperty, data.loansToOtherEntities, data.purchaseOfInvestments)
    const netInvesting     = v2sub(totalInvReceipts, totalInvPayments)
    const totalFinReceipts = v2add(data.proceedsFromStockIssuance, data.borrowingProceeds)
    const totalFinPayments = v2add(data.stockRepurchase, data.loanRepayments, data.dividendsPaid)
    const netFinancing     = v2sub(totalFinReceipts, totalFinPayments)
    const netCashFlow      = v2add(netOperating, netInvesting, netFinancing)
    const cashAtEnd        = v2add(data.cashAtBeginning, netCashFlow)
    return { totalOpReceipts, totalOpPayments, netOperating, totalInvReceipts, totalInvPayments, netInvesting, totalFinReceipts, totalFinPayments, netFinancing, netCashFlow, cashAtEnd }
  }, [data])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2.5 pl-4 font-medium text-gray-500 min-w-[280px]">
              <span className="inline-flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-red-300 bg-white inline-block" />Manual</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-yellow-200 bg-yellow-50 inline-block" />Calculated</span>
              </span>
            </th>
            {years.map(y => <th key={y} className="text-right py-2.5 px-2 font-bold text-gray-900 w-36 whitespace-nowrap">{y}</th>)}
          </tr>
        </thead>
        <tbody>
          {/* Opening */}
          <SectionHeader title="Opening Cash Balance" />
          <ManualRow label="Cash at beginning of period" field="cashAtBeginning" data={data} onChange={onChange} readOnly={readOnly} indent={1} />
          <Spacer />

          {/* Operating */}
          <SectionHeader title="Cash Flows from Operating Activities" />
          <SectionHeader title="Receipts" sub />
          <ManualRow label="Cash received from customers"   field="cashFromCustomers"       data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Cash from other operations"     field="cashFromOtherOperations" data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total operating receipts"       values={c.totalOpReceipts} />
          <SectionHeader title="Payments" sub />
          <ManualRow label="Paid for inventory / COGS"      field="paidInventory"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Paid administrative expenses"   field="paidAdminExpenses" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Paid wages & salaries"          field="paidWages"         data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Paid interest"                  field="paidInterest"      data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Paid income taxes"              field="paidIncomeTaxes"   data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total operating payments"       values={c.totalOpPayments} />
          <CalcRow   label="Net Cash from Operating Activities" values={c.netOperating} bold highlight doubleBorderTop />
          <Spacer />

          {/* Investing */}
          <SectionHeader title="Cash Flows from Investing Activities" />
          <SectionHeader title="Receipts" sub />
          <ManualRow label="Proceeds from property sales"   field="proceedsFromPropertySales"    data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Principal collected on loans"   field="principalCollected"           data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Proceeds from investment sales" field="proceedsFromInvestmentSales"  data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total investing receipts"       values={c.totalInvReceipts} />
          <SectionHeader title="Payments" sub />
          <ManualRow label="Purchase of property / equipment" field="purchaseOfProperty"    data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Loans to other entities"          field="loansToOtherEntities"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Purchase of investments"          field="purchaseOfInvestments" data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total investing payments"         values={c.totalInvPayments} />
          <CalcRow   label="Net Cash from Investing Activities" values={c.netInvesting} bold highlight doubleBorderTop />
          <Spacer />

          {/* Financing */}
          <SectionHeader title="Cash Flows from Financing Activities" />
          <SectionHeader title="Receipts" sub />
          <ManualRow label="Proceeds from stock issuance" field="proceedsFromStockIssuance" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Borrowing proceeds"           field="borrowingProceeds"         data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total financing receipts"     values={c.totalFinReceipts} />
          <SectionHeader title="Payments" sub />
          <ManualRow label="Stock repurchase"  field="stockRepurchase" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Loan repayments"   field="loanRepayments"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Dividends paid"    field="dividendsPaid"   data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total financing payments" values={c.totalFinPayments} />
          <CalcRow   label="Net Cash from Financing Activities" values={c.netFinancing} bold highlight doubleBorderTop />
          <Spacer />

          {/* Summary */}
          <SectionHeader title="Net Cash Position" />
          <CalcRow label="Net Cash Flow for Period" values={c.netCashFlow} bold highlight doubleBorderTop />
          <CalcRow label="Cash at End of Period"    values={c.cashAtEnd}   bold highlight doubleBorderTop doubleBorderBottom />
        </tbody>
      </table>
    </div>
  )
}
