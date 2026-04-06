"use client"

import { useMemo } from "react"
import type { IncomeStatementData } from "../types"

interface Props {
  data: IncomeStatementData
  onChange: (data: IncomeStatementData) => void
  readOnly?: boolean
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ManualInput({
  label,
  field,
  value,
  onChange,
  readOnly,
  indent = false,
}: {
  label: string
  field: string
  value: number
  onChange: (field: string, value: number) => void
  readOnly?: boolean
  indent?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : ""}`}>
      <label className="text-sm text-gray-700 flex-1">{label}</label>
      <input
        type="number"
        value={value || ""}
        onChange={e => onChange(field, parseFloat(e.target.value) || 0)}
        readOnly={readOnly}
        className={`w-40 text-right px-3 py-1.5 rounded border text-sm font-medium focus:outline-none focus:ring-1 ${
          readOnly
            ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            : "border-red-300 bg-white focus:border-red-400 focus:ring-red-300"
        }`}
      />
    </div>
  )
}

function CalcRow({
  label,
  value,
  bold = false,
  highlight = false,
  indent = false,
}: {
  label: string
  value: number
  bold?: boolean
  highlight?: boolean
  indent?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm flex-1 ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}>{label}</span>
      <div
        className={`w-40 text-right px-3 py-1.5 rounded border text-sm font-semibold ${
          highlight
            ? value < 0
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
            : "bg-yellow-50 border-yellow-200 text-gray-700"
        }`}
      >
        {value < 0 ? `(${fmtNum(Math.abs(value))})` : fmtNum(value)}
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-5 mb-1">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-200 my-1" />
}

export function IncomeStatementTab({ data, onChange, readOnly }: Props) {
  const set = (field: string, value: number) => onChange({ ...data, [field]: value })

  const calc = useMemo(() => {
    const grossRevenue = data.totalRevenue + data.otherIncome
    const grossProfit = grossRevenue - data.costOfGoodsSold
    const totalOpEx =
      data.sellingExpenses +
      data.adminExpenses +
      data.depreciationAmortization +
      data.rdExpenses +
      data.otherOperatingExpenses
    const ebit = grossProfit - totalOpEx
    const ebitda = ebit + data.depreciationAmortization
    const netFinance = data.financeIncome - data.financeExpense
    const ebt = ebit + netFinance
    const netProfit = ebt - data.incomeTax
    const grossMargin = grossRevenue ? (grossProfit / grossRevenue) * 100 : 0
    const netMargin = grossRevenue ? (netProfit / grossRevenue) * 100 : 0
    return { grossRevenue, grossProfit, totalOpEx, ebit, ebitda, netFinance, ebt, netProfit, grossMargin, netMargin }
  }, [data])

  return (
    <div className="max-w-2xl mx-auto space-y-1 py-2">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded border border-red-300 bg-white" />
          Manual entry
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded border border-yellow-200 bg-yellow-50" />
          Auto-calculated
        </span>
      </div>

      {/* Revenue */}
      <SectionHeader title="Revenue" />
      <ManualInput label="Total Revenue" field="totalRevenue" value={data.totalRevenue} onChange={set} readOnly={readOnly} />
      <ManualInput label="Other Income" field="otherIncome" value={data.otherIncome} onChange={set} readOnly={readOnly} />
      <CalcRow label="Gross Revenue" value={calc.grossRevenue} bold />

      {/* Cost of Sales */}
      <SectionHeader title="Cost of Sales" />
      <ManualInput label="Cost of Goods Sold" field="costOfGoodsSold" value={data.costOfGoodsSold} onChange={set} readOnly={readOnly} />
      <Divider />
      <CalcRow label="Gross Profit" value={calc.grossProfit} bold highlight />

      {/* Operating Expenses */}
      <SectionHeader title="Operating Expenses" />
      <ManualInput label="Selling Expenses" field="sellingExpenses" value={data.sellingExpenses} onChange={set} readOnly={readOnly} indent />
      <ManualInput label="Administrative Expenses" field="adminExpenses" value={data.adminExpenses} onChange={set} readOnly={readOnly} indent />
      <ManualInput label="Depreciation & Amortization" field="depreciationAmortization" value={data.depreciationAmortization} onChange={set} readOnly={readOnly} indent />
      <ManualInput label="R&D Expenses" field="rdExpenses" value={data.rdExpenses} onChange={set} readOnly={readOnly} indent />
      <ManualInput label="Other Operating Expenses" field="otherOperatingExpenses" value={data.otherOperatingExpenses} onChange={set} readOnly={readOnly} indent />
      <Divider />
      <CalcRow label="Total Operating Expenses" value={calc.totalOpEx} bold />
      <CalcRow label="EBIT (Earnings Before Interest & Tax)" value={calc.ebit} bold highlight />
      <CalcRow label="EBITDA" value={calc.ebitda} />

      {/* Finance Items */}
      <SectionHeader title="Finance Items" />
      <ManualInput label="Finance Income" field="financeIncome" value={data.financeIncome} onChange={set} readOnly={readOnly} indent />
      <ManualInput label="Finance Expense" field="financeExpense" value={data.financeExpense} onChange={set} readOnly={readOnly} indent />
      <Divider />
      <CalcRow label="Net Finance Income / (Expense)" value={calc.netFinance} />
      <CalcRow label="EBT (Earnings Before Tax)" value={calc.ebt} bold />

      {/* Tax & Net Profit */}
      <SectionHeader title="Tax & Net Profit" />
      <ManualInput label="Income Tax" field="incomeTax" value={data.incomeTax} onChange={set} readOnly={readOnly} />
      <Divider />
      <CalcRow label="Net Profit / (Loss)" value={calc.netProfit} bold highlight />

      {/* Margins */}
      <SectionHeader title="Profitability Ratios" />
      <CalcRow label="Gross Profit Margin (%)" value={calc.grossMargin} />
      <CalcRow label="Net Profit Margin (%)" value={calc.netMargin} />
    </div>
  )
}
