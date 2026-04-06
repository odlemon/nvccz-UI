"use client"

import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import type { BalanceSheetData } from "../types"

interface Props {
  data: BalanceSheetData
  onChange: (data: BalanceSheetData) => void
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
}: {
  label: string
  field: string
  value: number
  onChange: (field: string, value: number) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5 pl-4">
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
  top = false,
}: {
  label: string
  value: number
  bold?: boolean
  highlight?: boolean
  top?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${top ? "border-t border-gray-300 mt-1" : ""}`}>
      <span className={`text-sm flex-1 ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}>{label}</span>
      <div
        className={`w-40 text-right px-3 py-1.5 rounded border text-sm font-semibold ${
          highlight
            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
            : "bg-yellow-50 border-yellow-200 text-gray-700"
        }`}
      >
        {fmtNum(value)}
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

export function BalanceSheetTab({ data, onChange, readOnly }: Props) {
  const set = (field: string, value: number) => onChange({ ...data, [field]: value })

  const calc = useMemo(() => {
    const totalCurrentAssets =
      data.cashEquivalents + data.accountsReceivable + data.inventory + data.prepaidExpenses + data.otherCurrentAssets
    const totalNonCurrentAssets =
      data.propertyPlantEquipment + data.intangibleAssets + data.longTermInvestments + data.otherNonCurrentAssets
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets

    const totalCurrentLiabilities =
      data.accountsPayable + data.shortTermLoans + data.accruedExpenses + data.currentPortionLTD + data.otherCurrentLiabilities
    const totalNonCurrentLiabilities =
      data.longTermLoans + data.deferredTaxLiabilities + data.otherNonCurrentLiabilities
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities

    const totalEquity =
      data.shareCapital + data.retainedEarnings + data.additionalPaidInCapital + data.otherEquity
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

    const balanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01

    return {
      totalCurrentAssets,
      totalNonCurrentAssets,
      totalAssets,
      totalCurrentLiabilities,
      totalNonCurrentLiabilities,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanced,
    }
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

      {/* Balance check alert */}
      {!calc.balanced && (calc.totalAssets !== 0 || calc.totalLiabilitiesAndEquity !== 0) && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Balance sheet does not balance</p>
            <p className="text-xs mt-0.5">
              Total Assets: {fmtNum(calc.totalAssets)} &nbsp;≠&nbsp; Total Liabilities + Equity: {fmtNum(calc.totalLiabilitiesAndEquity)}
            </p>
          </div>
        </div>
      )}

      {/* ASSETS */}
      <SectionHeader title="Current Assets" />
      <ManualInput label="Cash & Cash Equivalents" field="cashEquivalents" value={data.cashEquivalents} onChange={set} readOnly={readOnly} />
      <ManualInput label="Accounts Receivable" field="accountsReceivable" value={data.accountsReceivable} onChange={set} readOnly={readOnly} />
      <ManualInput label="Inventory" field="inventory" value={data.inventory} onChange={set} readOnly={readOnly} />
      <ManualInput label="Prepaid Expenses" field="prepaidExpenses" value={data.prepaidExpenses} onChange={set} readOnly={readOnly} />
      <ManualInput label="Other Current Assets" field="otherCurrentAssets" value={data.otherCurrentAssets} onChange={set} readOnly={readOnly} />
      <CalcRow label="Total Current Assets" value={calc.totalCurrentAssets} bold top />

      <SectionHeader title="Non-Current Assets" />
      <ManualInput label="Property, Plant & Equipment" field="propertyPlantEquipment" value={data.propertyPlantEquipment} onChange={set} readOnly={readOnly} />
      <ManualInput label="Intangible Assets" field="intangibleAssets" value={data.intangibleAssets} onChange={set} readOnly={readOnly} />
      <ManualInput label="Long-Term Investments" field="longTermInvestments" value={data.longTermInvestments} onChange={set} readOnly={readOnly} />
      <ManualInput label="Other Non-Current Assets" field="otherNonCurrentAssets" value={data.otherNonCurrentAssets} onChange={set} readOnly={readOnly} />
      <CalcRow label="Total Non-Current Assets" value={calc.totalNonCurrentAssets} bold top />
      <CalcRow label="TOTAL ASSETS" value={calc.totalAssets} bold highlight />

      {/* LIABILITIES */}
      <SectionHeader title="Current Liabilities" />
      <ManualInput label="Accounts Payable" field="accountsPayable" value={data.accountsPayable} onChange={set} readOnly={readOnly} />
      <ManualInput label="Short-Term Loans" field="shortTermLoans" value={data.shortTermLoans} onChange={set} readOnly={readOnly} />
      <ManualInput label="Accrued Expenses" field="accruedExpenses" value={data.accruedExpenses} onChange={set} readOnly={readOnly} />
      <ManualInput label="Current Portion of Long-Term Debt" field="currentPortionLTD" value={data.currentPortionLTD} onChange={set} readOnly={readOnly} />
      <ManualInput label="Other Current Liabilities" field="otherCurrentLiabilities" value={data.otherCurrentLiabilities} onChange={set} readOnly={readOnly} />
      <CalcRow label="Total Current Liabilities" value={calc.totalCurrentLiabilities} bold top />

      <SectionHeader title="Non-Current Liabilities" />
      <ManualInput label="Long-Term Loans" field="longTermLoans" value={data.longTermLoans} onChange={set} readOnly={readOnly} />
      <ManualInput label="Deferred Tax Liabilities" field="deferredTaxLiabilities" value={data.deferredTaxLiabilities} onChange={set} readOnly={readOnly} />
      <ManualInput label="Other Non-Current Liabilities" field="otherNonCurrentLiabilities" value={data.otherNonCurrentLiabilities} onChange={set} readOnly={readOnly} />
      <CalcRow label="Total Non-Current Liabilities" value={calc.totalNonCurrentLiabilities} bold top />
      <CalcRow label="Total Liabilities" value={calc.totalLiabilities} bold highlight />

      {/* EQUITY */}
      <SectionHeader title="Equity" />
      <ManualInput label="Share Capital" field="shareCapital" value={data.shareCapital} onChange={set} readOnly={readOnly} />
      <ManualInput label="Retained Earnings" field="retainedEarnings" value={data.retainedEarnings} onChange={set} readOnly={readOnly} />
      <ManualInput label="Additional Paid-In Capital" field="additionalPaidInCapital" value={data.additionalPaidInCapital} onChange={set} readOnly={readOnly} />
      <ManualInput label="Other Equity" field="otherEquity" value={data.otherEquity} onChange={set} readOnly={readOnly} />
      <CalcRow label="Total Equity" value={calc.totalEquity} bold top />
      <CalcRow label="TOTAL LIABILITIES + EQUITY" value={calc.totalLiabilitiesAndEquity} bold highlight />
    </div>
  )
}
