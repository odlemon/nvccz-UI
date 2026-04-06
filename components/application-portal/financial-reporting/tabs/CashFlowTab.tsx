"use client"

import { useMemo } from "react"
import type { CashFlowData } from "../types"

interface Props {
  data: CashFlowData
  onChange: (data: CashFlowData) => void
  readOnly?: boolean
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtSigned(n: number) {
  return n < 0 ? `(${fmtNum(Math.abs(n))})` : fmtNum(n)
}

function ManualInput({
  label,
  field,
  value,
  onChange,
  readOnly,
  indent = 1,
}: {
  label: string
  field: string
  value: number
  onChange: (field: string, value: number) => void
  readOnly?: boolean
  indent?: number
}) {
  return (
    <div className={`flex items-center justify-between py-1.5`} style={{ paddingLeft: `${indent * 16}px` }}>
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
  topBorder = false,
  indent = 0,
}: {
  label: string
  value: number
  bold?: boolean
  highlight?: boolean
  topBorder?: boolean
  indent?: number
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${topBorder ? "border-t border-gray-300 mt-1" : ""}`}
      style={{ paddingLeft: `${indent * 16}px` }}
    >
      <span className={`text-sm flex-1 ${bold ? "font-semibold text-gray-800" : "text-gray-600"}`}>{label}</span>
      <div
        className={`w-40 text-right px-3 py-1.5 rounded border text-sm font-semibold ${
          highlight
            ? value < 0
              ? "bg-orange-50 border-orange-200 text-orange-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
            : "bg-yellow-50 border-yellow-200 text-gray-700"
        }`}
      >
        {fmtSigned(value)}
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

function SubGroupHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-0.5 ml-4">{title}</p>
  )
}

export function CashFlowTab({ data, onChange, readOnly }: Props) {
  const set = (field: string, value: number) => onChange({ ...data, [field]: value })

  const calc = useMemo(() => {
    // Operations
    const totalOpReceipts = data.cashFromCustomers + data.cashFromOtherOperations
    const totalOpPayments =
      data.paidInventory + data.paidAdminExpenses + data.paidWages + data.paidInterest + data.paidIncomeTaxes
    const netOperating = totalOpReceipts - totalOpPayments

    // Investing
    const totalInvReceipts = data.proceedsFromPropertySales + data.principalCollected + data.proceedsFromInvestmentSales
    const totalInvPayments = data.purchaseOfProperty + data.loansToOtherEntities + data.purchaseOfInvestments
    const netInvesting = totalInvReceipts - totalInvPayments

    // Financing
    const totalFinReceipts = data.proceedsFromStockIssuance + data.borrowingProceeds
    const totalFinPayments = data.stockRepurchase + data.loanRepayments + data.dividendsPaid
    const netFinancing = totalFinReceipts - totalFinPayments

    const netCashFlow = netOperating + netInvesting + netFinancing
    const cashAtEnd = data.cashAtBeginning + netCashFlow

    return {
      totalOpReceipts,
      totalOpPayments,
      netOperating,
      totalInvReceipts,
      totalInvPayments,
      netInvesting,
      totalFinReceipts,
      totalFinPayments,
      netFinancing,
      netCashFlow,
      cashAtEnd,
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

      {/* Opening Balance */}
      <SectionHeader title="Opening Cash Balance" />
      <ManualInput label="Cash at Beginning of Period" field="cashAtBeginning" value={data.cashAtBeginning} onChange={set} readOnly={readOnly} indent={0} />

      {/* ── Operations ── */}
      <SectionHeader title="Cash Flows from Operating Activities" />

      <SubGroupHeader title="Receipts" />
      <ManualInput label="Cash Received from Customers" field="cashFromCustomers" value={data.cashFromCustomers} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Cash from Other Operations" field="cashFromOtherOperations" value={data.cashFromOtherOperations} onChange={set} readOnly={readOnly} indent={2} />
      <CalcRow label="Total Operating Receipts" value={calc.totalOpReceipts} indent={1} topBorder />

      <SubGroupHeader title="Payments" />
      <ManualInput label="Paid for Inventory / COGS" field="paidInventory" value={data.paidInventory} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Paid Administrative Expenses" field="paidAdminExpenses" value={data.paidAdminExpenses} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Paid Wages & Salaries" field="paidWages" value={data.paidWages} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Paid Interest" field="paidInterest" value={data.paidInterest} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Paid Income Taxes" field="paidIncomeTaxes" value={data.paidIncomeTaxes} onChange={set} readOnly={readOnly} indent={2} />
      <CalcRow label="Total Operating Payments" value={calc.totalOpPayments} indent={1} topBorder />

      <CalcRow label="Net Cash from Operating Activities" value={calc.netOperating} bold highlight topBorder />

      {/* ── Investing ── */}
      <SectionHeader title="Cash Flows from Investing Activities" />

      <SubGroupHeader title="Receipts" />
      <ManualInput label="Proceeds from Property Sales" field="proceedsFromPropertySales" value={data.proceedsFromPropertySales} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Principal Collected on Loans" field="principalCollected" value={data.principalCollected} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Proceeds from Investment Sales" field="proceedsFromInvestmentSales" value={data.proceedsFromInvestmentSales} onChange={set} readOnly={readOnly} indent={2} />
      <CalcRow label="Total Investing Receipts" value={calc.totalInvReceipts} indent={1} topBorder />

      <SubGroupHeader title="Payments" />
      <ManualInput label="Purchase of Property / Equipment" field="purchaseOfProperty" value={data.purchaseOfProperty} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Loans to Other Entities" field="loansToOtherEntities" value={data.loansToOtherEntities} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Purchase of Investments" field="purchaseOfInvestments" value={data.purchaseOfInvestments} onChange={set} readOnly={readOnly} indent={2} />
      <CalcRow label="Total Investing Payments" value={calc.totalInvPayments} indent={1} topBorder />

      <CalcRow label="Net Cash from Investing Activities" value={calc.netInvesting} bold highlight topBorder />

      {/* ── Financing ── */}
      <SectionHeader title="Cash Flows from Financing Activities" />

      <SubGroupHeader title="Receipts" />
      <ManualInput label="Proceeds from Stock Issuance" field="proceedsFromStockIssuance" value={data.proceedsFromStockIssuance} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Borrowing Proceeds" field="borrowingProceeds" value={data.borrowingProceeds} onChange={set} readOnly={readOnly} indent={2} />
      <CalcRow label="Total Financing Receipts" value={calc.totalFinReceipts} indent={1} topBorder />

      <SubGroupHeader title="Payments" />
      <ManualInput label="Stock Repurchase" field="stockRepurchase" value={data.stockRepurchase} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Loan Repayments" field="loanRepayments" value={data.loanRepayments} onChange={set} readOnly={readOnly} indent={2} />
      <ManualInput label="Dividends Paid" field="dividendsPaid" value={data.dividendsPaid} onChange={set} readOnly={readOnly} indent={2} />
      <CalcRow label="Total Financing Payments" value={calc.totalFinPayments} indent={1} topBorder />

      <CalcRow label="Net Cash from Financing Activities" value={calc.netFinancing} bold highlight topBorder />

      {/* Summary */}
      <SectionHeader title="Net Cash Position" />
      <CalcRow label="Net Cash Flow for Period" value={calc.netCashFlow} bold highlight />
      <CalcRow label="Cash at End of Period" value={calc.cashAtEnd} bold highlight />
    </div>
  )
}
