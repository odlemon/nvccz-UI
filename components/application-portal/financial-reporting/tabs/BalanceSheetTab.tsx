"use client"

import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import type { BalanceSheetData, IncomeStatementData, V2 } from "../types"

interface Props {
  data: BalanceSheetData
  incomeStatement: IncomeStatementData
  onChange: (data: BalanceSheetData) => void
  readOnly?: boolean
  years: [string, string]
}

const fmtD = (n: number) =>
  n === 0 ? "$ -"
    : n < 0 ? `$(${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 0 })})`
    : `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`

const fmtR = (n: number, pct = false) =>
  isNaN(n) || !isFinite(n) ? "N/A"
    : pct ? `${(n * 100).toFixed(1)}%`
    : n.toFixed(2)

function safeDiv(a: number, b: number) { return b === 0 ? NaN : a / b }

function SectionHeader({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <tr className={dark ? "bg-gray-800" : "bg-gray-50 border-t-2 border-gray-300"}>
      <td colSpan={3} className={`py-2 pl-4 text-xs font-bold uppercase tracking-wider ${dark ? "text-white" : "text-gray-800"}`}>
        {title}
      </td>
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

function ManualRow({ label, field, data, onChange, readOnly, indent=1 }: {
  label: string; field: keyof BalanceSheetData
  data: BalanceSheetData; onChange: (d: BalanceSheetData) => void
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

function CalcRow({ label, values, bold=false, highlight=false, doubleBorderTop=false, doubleBorderBottom=false }: {
  label: string; values: V2; bold?: boolean; highlight?: boolean
  doubleBorderTop?: boolean; doubleBorderBottom?: boolean
}) {
  return (
    <tr className={[
      doubleBorderTop ? "border-t-2 border-gray-700" : "border-t border-gray-200",
      doubleBorderBottom ? "border-b-2 border-gray-700" : "",
    ].join(" ")}>
      <td className={`py-1.5 pr-4 text-sm ${bold ? "font-semibold text-gray-900" : "italic text-gray-600"}`} style={{ paddingLeft: "20px" }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="py-1 px-1 text-right w-36">
          <span className={`inline-block w-32 text-right px-2 py-1 rounded border text-sm ${
            highlight ? "bg-yellow-50 border-yellow-200 text-yellow-800 font-semibold"
                      : "bg-gray-50 border-gray-200 text-gray-700 font-semibold"
          }`}>{fmtD(v)}</span>
        </td>
      ))}
    </tr>
  )
}

function RatioRow({ label, v1, v2, highlight=false }: { label: string; v1: string; v2: string; highlight?: boolean }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50/50">
      <td className="py-1.5 pl-4 text-sm text-gray-700">{label}</td>
      <td className="py-1 px-2 text-right">
        <span className={`text-sm font-mono font-semibold ${highlight ? "text-blue-700" : "text-gray-700"}`}>{v1}</span>
      </td>
      <td className="py-1 px-2 text-right">
        <span className={`text-sm font-mono font-semibold ${highlight ? "text-blue-700" : "text-gray-700"}`}>{v2}</span>
      </td>
    </tr>
  )
}

function Spacer() { return <tr><td colSpan={3} className="h-2" /></tr> }

export function BalanceSheetTab({ data, incomeStatement, onChange, readOnly, years }: Props) {
  const calc = useMemo(() => {
    const totalCurrentAssets = ([0,1] as const).map(i =>
      data.cash[i] + data.accountsReceivable[i] + data.inventory[i] + data.prepaidExpenses[i] + data.shortTermInvestments[i]
    ) as V2
    const totalFixedAssets = ([0,1] as const).map(i =>
      data.longTermInvestments[i] + data.propertyPlantEquipment[i] - data.accumulatedDepreciation[i] + data.intangibleAssets[i]
    ) as V2
    const totalOtherAssets = ([0,1] as const).map(i =>
      data.deferredIncomeTax[i] + data.otherAssets[i]
    ) as V2
    const totalAssets = ([0,1] as const).map(i =>
      totalCurrentAssets[i] + totalFixedAssets[i] + totalOtherAssets[i]
    ) as V2

    const totalCurrentLiab = ([0,1] as const).map(i =>
      data.accountsPayable[i] + data.shortTermLoans[i] + data.incomeTaxesPayable[i] +
      data.accruedSalariesWages[i] + data.unearnedRevenue[i] + data.currentPortionLTD[i]
    ) as V2
    const totalLTLiab = ([0,1] as const).map(i =>
      data.longTermDebt[i] + data.deferredIncomeTaxLiab[i] + data.otherLiabilities[i]
    ) as V2
    const totalLiabilities = ([0,1] as const).map(i => totalCurrentLiab[i] + totalLTLiab[i]) as V2
    const totalEquity = ([0,1] as const).map(i =>
      data.ownersInvestment[i] + data.retainedEarnings[i] + data.otherEquity[i]
    ) as V2
    const totalLiabAndEquity = ([0,1] as const).map(i => totalLiabilities[i] + totalEquity[i]) as V2
    const balanced = ([0,1] as const).map(i => Math.abs(totalAssets[i] - totalLiabAndEquity[i]) < 0.01)

    // Cross-IS ratios (current year = index 0)
    const rev0  = incomeStatement.grossSales[0] - incomeStatement.returnsRefunds[0] + incomeStatement.otherRevenue[0]
    const rev1  = incomeStatement.grossSales[1] - incomeStatement.returnsRefunds[1] + incomeStatement.otherRevenue[1]
    const cogs0 = incomeStatement.goodsPurchased[0] + incomeStatement.materials[0] + incomeStatement.labour[0] + incomeStatement.overhead[0]
    const opEx0 = incomeStatement.advertisingPromotion[0] + incomeStatement.badDebt[0] + incomeStatement.bankServiceCharges[0] +
      incomeStatement.computerInternet[0] + incomeStatement.deliveryFreight[0] + incomeStatement.furnitureEquipment[0] +
      incomeStatement.insurance[0] + incomeStatement.maintenanceRepairs[0] + incomeStatement.mileage[0] +
      incomeStatement.officeSupplies[0] + incomeStatement.otherExpenses[0] + incomeStatement.payrollProcessing[0] +
      incomeStatement.postageDelivery[0] + incomeStatement.professionalServices[0] + incomeStatement.rentLease[0] +
      incomeStatement.researchDevelopment[0] + incomeStatement.salariesBenefitsWages[0] + incomeStatement.travel[0] +
      incomeStatement.utilitiesTelephone[0] + incomeStatement.depreciationAmortization[0]
    const gp0   = rev0 - cogs0
    const ebit0 = gp0 - opEx0
    const ebt0  = ebit0 + incomeStatement.nonOperatingRevenues[0] - incomeStatement.interestExpense[0]
    const net0  = ebt0 - incomeStatement.incomeTaxExpense[0] +
      incomeStatement.discontinuedOperations[0] + incomeStatement.accountingChanges[0] + incomeStatement.extraordinaryItems[0]

    // Ratios
    const debtRatio       = [safeDiv(totalLiabilities[0], totalAssets[0]), safeDiv(totalLiabilities[1], totalAssets[1])] as V2
    const currentRatio    = [safeDiv(totalCurrentAssets[0], totalCurrentLiab[0]), safeDiv(totalCurrentAssets[1], totalCurrentLiab[1])] as V2
    const workingCapital  = [totalCurrentAssets[0]-totalCurrentLiab[0], totalCurrentAssets[1]-totalCurrentLiab[1]] as V2
    const assetsToEquity  = [safeDiv(totalAssets[0], totalEquity[0]), safeDiv(totalAssets[1], totalEquity[1])] as V2
    const roce            = safeDiv(ebit0, totalAssets[0] - totalCurrentLiab[0])
    const revGrowth       = safeDiv(rev0 - rev1, rev1)
    const netProfitMargin = safeDiv(net0, rev0)
    const roa             = safeDiv(net0, totalAssets[0])
    const roe             = safeDiv(net0, totalEquity[0])
    const grossMargin     = safeDiv(gp0, rev0)
    const burnRate        = data.cash[0]
    const runway          = safeDiv(data.cash[0], burnRate === 0 ? NaN : burnRate)
    const debtToEquity    = [safeDiv(totalLiabilities[0], totalEquity[0]), safeDiv(totalLiabilities[1], totalEquity[1])] as V2
    const ebitda          = net0 + incomeStatement.incomeTaxExpense[0] + incomeStatement.interestExpense[0] + incomeStatement.depreciationAmortization[0]
    const ebitdaMargin    = safeDiv(ebitda, rev0)

    return {
      totalCurrentAssets, totalFixedAssets, totalOtherAssets, totalAssets,
      totalCurrentLiab, totalLTLiab, totalLiabilities, totalEquity, totalLiabAndEquity, balanced,
      debtRatio, currentRatio, workingCapital, assetsToEquity, roce, revGrowth,
      netProfitMargin, roa, roe, grossMargin, burnRate, runway, debtToEquity, ebitdaMargin,
    }
  }, [data, incomeStatement])

  return (
    <div className="overflow-x-auto space-y-4">
      {/* Balance alerts */}
      {[0,1].map(i => !calc.balanced[i] && (calc.totalAssets[i] !== 0 || calc.totalLiabAndEquity[i] !== 0) && (
        <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span><strong>{years[i]}:</strong> Assets {fmtD(calc.totalAssets[i])} ≠ Liabilities + Equity {fmtD(calc.totalLiabAndEquity[i])}</span>
        </div>
      ))}

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
          {/* ASSETS */}
          <SectionHeader title="Assets" />
          <SubHeader title="Current Assets" />
          <ManualRow label="Cash"                    field="cash"                data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Accounts receivable"     field="accountsReceivable"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Inventory"               field="inventory"           data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Prepaid expenses"        field="prepaidExpenses"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Short-term investments"  field="shortTermInvestments" data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total current assets"    values={calc.totalCurrentAssets} bold highlight />

          <Spacer />
          <SubHeader title="Fixed (Long-Term) Assets" />
          <ManualRow label="Long-term investments"              field="longTermInvestments"      data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Property, plant, and equipment"    field="propertyPlantEquipment"   data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="(Less) Accumulated depreciation"   field="accumulatedDepreciation"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Intangible assets"                  field="intangibleAssets"         data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total fixed assets"                 values={calc.totalFixedAssets} bold highlight />

          <Spacer />
          <SubHeader title="Other Assets" />
          <ManualRow label="Deferred income tax"  field="deferredIncomeTax" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Other"                field="otherAssets"       data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total other assets"   values={calc.totalOtherAssets} bold highlight />

          <Spacer />
          <CalcRow label="Total Assets" values={calc.totalAssets} bold highlight doubleBorderTop doubleBorderBottom />
          <Spacer />

          {/* LIABILITIES & EQUITY */}
          <SectionHeader title="Liabilities and Owner's Equity" />
          <SubHeader title="Current Liabilities" />
          <ManualRow label="Accounts payable"                   field="accountsPayable"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Short-term loans"                   field="shortTermLoans"      data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Income taxes payable"               field="incomeTaxesPayable"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Accrued salaries and wages"         field="accruedSalariesWages" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Unearned revenue"                   field="unearnedRevenue"     data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Current portion of long-term debt"  field="currentPortionLTD"   data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total current liabilities"          values={calc.totalCurrentLiab} bold highlight />

          <Spacer />
          <SubHeader title="Long-Term Liabilities" />
          <ManualRow label="Long-term debt"       field="longTermDebt"          data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Deferred income tax"  field="deferredIncomeTaxLiab" data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Other"                field="otherLiabilities"      data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total long-term liabilities" values={calc.totalLTLiab} bold highlight />

          <Spacer />
          <SubHeader title="Owner's Equity" />
          <ManualRow label="Owner's investment"  field="ownersInvestment"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Retained earnings"   field="retainedEarnings"  data={data} onChange={onChange} readOnly={readOnly} />
          <ManualRow label="Other"               field="otherEquity"       data={data} onChange={onChange} readOnly={readOnly} />
          <CalcRow   label="Total owner's equity" values={calc.totalEquity} bold highlight />

          <Spacer />
          <CalcRow label="Total Liabilities and Owner's Equity" values={calc.totalLiabAndEquity} bold highlight doubleBorderTop doubleBorderBottom />
          <Spacer />

          {/* RATIOS */}
          <SectionHeader title="Common Financial Ratios (KPIs)" dark />
          <RatioRow label="Debt Ratio (Total Liabilities / Total Assets)"             v1={fmtR(calc.debtRatio[0])}      v2={fmtR(calc.debtRatio[1])} />
          <RatioRow label="Current Ratio (Current Assets / Current Liabilities)"      v1={fmtR(calc.currentRatio[0])}   v2={fmtR(calc.currentRatio[1])} />
          <RatioRow label="Working Capital (Current Assets – Current Liabilities)"    v1={fmtD(calc.workingCapital[0])} v2={fmtD(calc.workingCapital[1])} />
          <RatioRow label="Assets-to-Equity Ratio (Total Assets / Owner's Equity)"   v1={fmtR(calc.assetsToEquity[0])} v2={fmtR(calc.assetsToEquity[1])} />
          <RatioRow label="ROCE (EBIT / Total Assets – Current Liabilities)"          v1={fmtR(calc.roce)}              v2="—" />
          <RatioRow label="Revenue Growth Rate"                                        v1={fmtR(calc.revGrowth, true)}   v2="—" />

          <tr className="bg-gray-700 border-t border-gray-600">
            <td colSpan={3} className="py-1.5 pl-4 text-xs font-bold text-gray-100 uppercase tracking-wide">Profitability Ratios</td>
          </tr>
          <RatioRow label="Net Profit Margin (Net Profit / Revenue)"                  v1={fmtR(calc.netProfitMargin, true)} v2="—" highlight />
          <RatioRow label="Return on Assets — ROA (Net Profit / Total Assets)"        v1={fmtR(calc.roa, true)}             v2="—" highlight />
          <RatioRow label="Return on Equity — ROE (Net Profit / Owner's Equity)"      v1={fmtR(calc.roe, true)}             v2="—" highlight />
          <RatioRow label="Gross Margin ((Revenue – COGS) / Revenue)"                 v1={fmtR(calc.grossMargin, true)}     v2="—" highlight />
          <RatioRow label="Debt-to-Equity Ratio (Total Liabilities / Owner's Equity)" v1={fmtR(calc.debtToEquity[0])}      v2={fmtR(calc.debtToEquity[1])} />
          <RatioRow label="EBITDA Margin (EBITDA / Revenue)"                           v1={fmtR(calc.ebitdaMargin, true)}   v2="—" highlight />
        </tbody>
      </table>
    </div>
  )
}
