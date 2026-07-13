'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useState } from 'react'
import {
  Upload, Download, Copy, SplitSquareHorizontal, TrendingUp, MessageCircle,
  ChevronRight, ChevronDown, AlertTriangle, XCircle, Info, X, Maximize2
} from 'lucide-react'

const actuals = ['Jun 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025']
const forecast = ['Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025']
const quarters = ['Q1 FY26', 'Q2 FY2026', 'Q3 FY2026', 'Q4 FY2026', 'FY2026']

type RowData = {
  label: string
  indent?: boolean
  bold?: boolean
  isPercent?: boolean
  actuals: (number | null)[]
  forecast: (number | null)[]
  quarters: (number | null)[]
  highlightForecast?: boolean
}

const rows: RowData[] = [
  {
    label: 'Revenue', bold: true, actuals: [9850, 10210, 10530, 10999, 11250],
    forecast: [11600, 11990, 12200, 12550, 12850, 13200, 13600],
    quarters: [30590, 33750, 36650, 39650, 140640],
  },
  {
    label: 'COGS', indent: true, actuals: [-3940, -4080, -4210, -4320, -4460],
    forecast: [-4590, -4720, -4850, -4990, -5120, -5260, -5420],
    quarters: [-12330, -13370, -14560, -15800, -55960],
  },
  {
    label: 'Gross Profit', bold: true, actuals: [5910, 6130, 6320, 6580, 6790],
    forecast: [7010, 7180, 7350, 7560, 7730, 7940, 8180],
    quarters: [18360, 20380, 22090, 23850, 84680],
  },
  {
    label: 'Gross Margin %', isPercent: true, actuals: [60.0, 60.0, 60.0, 60.4, 60.4],
    forecast: [60.4, 60.3, 60.2, 60.2, 60.2, 60.2, 60.1],
    quarters: [60.0, 60.4, 60.2, 60.1, 60.2],
  },
  {
    label: 'Salaries', indent: true, actuals: [-2150, -2180, -2320, -2260, -2300],
    forecast: [-2340, -2380, -2420, -2470, -2510, -2560, -2600],
    quarters: [-6550, -6900, -7270, -7670, -28390],
  },
  {
    label: 'Rent', indent: true, actuals: [-410, -410, -410, -420, -420],
    forecast: [-420, -420, -420, -420, -430, -430, -430],
    quarters: [-1230, -1230, -1270, -1290, -5050],
  },
  {
    label: 'Marketing', indent: true, actuals: [-320, -340, -360, -400, -420],
    forecast: [-440, -440, -440, -450, -460, -460, -480],
    quarters: [-1020, -1260, -1280, -1400, -4960],
  },
  {
    label: 'Travel', indent: true, actuals: [-120, -130, -110, -120, -130],
    forecast: [-140, -140, -120, -130, -130, -150, -150],
    quarters: [-360, -390, -380, -420, -1550],
  },
  {
    label: 'Software', indent: true, actuals: [-210, -220, -230, -240, -240],
    forecast: [-250, -260, -260, -270, -280, -290, -300],
    quarters: [-660, -730, -790, -870, -3050],
  },
  {
    label: 'EBITDA', bold: true, actuals: [2700, 2850, 2990, 3140, 3280],
    forecast: [3420, 3570, 3710, 3920, 4060, 4220, 4380],
    quarters: [8540, 10380, 11100, 12200, 42380],
    highlightForecast: true,
  },
  {
    label: 'EBITDA Margin %', isPercent: true, actuals: [27.4, 27.9, 28.4, 28.5, 29.2],
    forecast: [29.5, 29.7, 30.0, 30.4, 30.5, 30.5, 31.0],
    quarters: [27.9, 30.7, 31.2, 30.3, 30.1],
  },
  {
    label: 'Headcount', bold: true, actuals: [152, 154, 156, 158, 160],
    forecast: [162, 164, 165, 167, 169, 171, 173],
    quarters: [156, 162, 167, 173, 173],
  },
  {
    label: 'Closing Cash', bold: true, actuals: [12430, 12850, 13310, 13680, 14050],
    forecast: [14420, 14880, 15370, 15820, 16210, 16640, 17120],
    quarters: [null, null, null, null, null],
  },
]

const validationMessages = [
  { type: 'warning', item: 'Marketing - Nov 2025', msg: '18% above budget ($390K)', time: 'May 28, 2025 10:32 AM' },
  { type: 'error', item: 'Headcount - Dec 2025', msg: '173 exceeds approved budget (170)', time: 'May 28, 2025 10:32 AM' },
  { type: 'warning', item: 'Closing Cash - Jul 2025', msg: 'Projected cash below minimum threshold ($15,000K)', time: 'May 28, 2025 10:32 AM' },
]

const historyItems = [
  { user: 'Jane Cooper', time: 'May 28, 2025 10:32 AM', value: '$11,600' },
  { user: 'Wade Warren', time: 'May 25, 2025 4:15 PM', value: '$11,300' },
  { user: 'Devon Lane', time: 'May 25, 2025 9:08 AM', value: '$11,600' },
]

function fmt(v: number | null, isPercent?: boolean) {
  if (v === null) return '—'
  if (isPercent) return `${v.toFixed(1)}%`
  const abs = Math.abs(v)
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : abs.toFixed(0)
  return v < 0 ? `(${formatted})` : formatted
}

export default function PlanningWorksheetPage() {
  const [selectedCell, setSelectedCell] = useState({ row: 'Revenue', col: 'Jun 2025' })
  const [showDrawer, setShowDrawer] = useState(true)

  return (
    <DashboardShell>
      <TopBar title="Planning Worksheet" scenario="Base Case" version="FY2026 Working Forecast" period="Jun 2025" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-header */}
          <div className="px-4 pt-3 pb-2" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-sm font-bold text-slate-800">North Region Operating Forecast</h1>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                <Info size={11} /> Model Details
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1"><span className="text-slate-400">Owner</span> <span className="font-medium text-slate-700">Jane Cooper</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span><span className="font-medium text-slate-700">In Progress</span></div>
              <div className="flex items-center gap-1"><span className="text-slate-400">Currency</span> <span className="font-medium text-slate-700">USD</span></div>
              <div className="flex items-center gap-1"><span className="text-slate-400">Last Updated</span> <span className="font-medium text-slate-700">May 28, 2025 10:32 AM</span></div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ backgroundColor: '#fff', borderColor: '#e2e8f0' }}>
            {[
              { icon: Upload, label: 'Import' },
              { icon: Download, label: 'Export' },
              { icon: Copy, label: 'Copy Forward' },
              { icon: SplitSquareHorizontal, label: 'Spread' },
              { icon: TrendingUp, label: 'Apply Growth' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#fff' }}>
                <Icon size={11} />
                {label}
              </button>
            ))}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#2563eb' }}>
              Submit
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border ml-1" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
              <MessageCircle size={11} /> Add Comment
            </button>
            <div className="ml-auto flex items-center gap-2">
              <select className="text-xs px-2 py-1.5 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                <option>$ Amounts</option>
              </select>
              <select className="text-xs px-2 py-1.5 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                <option>Monthly</option>
              </select>
              <Maximize2 size={13} className="text-slate-400 cursor-pointer" />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 1100 }}>
              <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-36 border-b border-r" style={{ borderColor: '#e2e8f0' }}>
                    $ in thousands
                  </th>
                  {/* Actuals header */}
                  <th colSpan={5} className="text-center py-1 font-semibold border-b border-r" style={{ borderColor: '#e2e8f0', color: '#475569', backgroundColor: '#f1f5f9' }}>
                    ACTUALS
                  </th>
                  {/* Forecast header */}
                  <th colSpan={7} className="text-center py-1 font-semibold border-b border-r" style={{ borderColor: '#e2e8f0', color: '#2563eb', backgroundColor: '#eff6ff' }}>
                    FORECAST
                  </th>
                  {/* Quarters */}
                  {quarters.map(q => (
                    <th key={q} className="text-center px-2 py-1 font-medium text-slate-500 border-b" style={{ borderColor: '#e2e8f0', fontSize: 10 }}>
                      {q}
                    </th>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th className="px-3 py-1.5 border-b border-r" style={{ borderColor: '#e2e8f0' }}></th>
                  {actuals.map(a => (
                    <th key={a} className="text-center px-2 py-1.5 font-medium border-b border-r" style={{ borderColor: '#e2e8f0', color: '#64748b', backgroundColor: '#f1f5f9', fontSize: 10, minWidth: 70 }}>
                      {a}
                    </th>
                  ))}
                  {forecast.map((f, i) => (
                    <th key={f} className="text-center px-2 py-1.5 font-medium border-b border-r" style={{
                      borderColor: '#e2e8f0', color: i === 0 ? '#2563eb' : '#64748b',
                      backgroundColor: i === 0 ? '#dbeafe' : '#eff6ff', fontSize: 10, minWidth: 70,
                      fontWeight: i === 0 ? 700 : 500
                    }}>
                      {f}
                    </th>
                  ))}
                  {quarters.map(q => (
                    <th key={q} className="text-center px-2 py-1.5 font-medium border-b border-r" style={{ borderColor: '#e2e8f0', color: '#94a3b8', fontSize: 10, minWidth: 70 }}>
                      {q}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9' }}
                    className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-1.5 border-r font-medium text-slate-700" style={{
                      borderColor: '#e2e8f0',
                      paddingLeft: row.indent ? 20 : 12,
                      fontWeight: row.bold ? 600 : 400,
                      backgroundColor: row.bold ? '#fafbfc' : undefined,
                    }}>
                      <div className="flex items-center gap-1">
                        {row.bold && <ChevronRight size={10} className="text-slate-400" />}
                        {row.label}
                      </div>
                      {row.bold && <div className="text-slate-400 font-normal" style={{ fontSize: 9 }}>$ in thousands</div>}
                    </td>
                    {row.actuals.map((v, ci) => {
                      const colName = actuals[ci]
                      const isSelected = selectedCell.row === row.label && selectedCell.col === colName
                      return (
                        <td key={ci}
                          onClick={() => setSelectedCell({ row: row.label, col: colName })}
                          className="text-center px-2 py-1.5 cursor-pointer border-r"
                          style={{
                            borderColor: '#e2e8f0',
                            backgroundColor: isSelected ? '#dbeafe' : row.bold ? '#fafbfc' : undefined,
                            color: v !== null && v < 0 ? '#dc2626' : '#1e293b',
                            fontWeight: row.bold ? 600 : 400,
                          }}>
                          {fmt(v, row.isPercent)}
                        </td>
                      )
                    })}
                    {row.forecast.map((v, ci) => {
                      const colName = forecast[ci]
                      const isSelected = selectedCell.row === row.label && selectedCell.col === colName
                      const isHighlight = row.highlightForecast && ci === 0
                      return (
                        <td key={ci}
                          onClick={() => setSelectedCell({ row: row.label, col: colName })}
                          className="text-center px-2 py-1.5 cursor-pointer border-r"
                          style={{
                            borderColor: '#e2e8f0',
                            backgroundColor: isSelected ? '#dbeafe' : isHighlight ? '#dbeafe' : ci === 0 ? '#eff6ff' : row.bold ? '#fafbfc' : undefined,
                            color: v !== null && v < 0 ? '#dc2626' : isHighlight ? '#1d4ed8' : '#1e293b',
                            fontWeight: isHighlight ? 700 : row.bold ? 600 : 400,
                            outline: isHighlight ? '1.5px solid #2563eb' : undefined,
                          }}>
                          {fmt(v, row.isPercent)}
                        </td>
                      )
                    })}
                    {row.quarters.map((v, ci) => (
                      <td key={ci} className="text-center px-2 py-1.5 border-r text-slate-500" style={{
                        borderColor: '#e2e8f0', fontWeight: row.bold ? 600 : 400,
                        backgroundColor: row.bold ? '#fafbfc' : undefined,
                      }}>
                        {fmt(v, row.isPercent)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Messages */}
          <div className="border-t px-4 py-2" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Validation Messages</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#f59e0b', fontSize: 10 }}>3</span>
              </div>
              <ChevronDown size={13} className="text-slate-400 cursor-pointer" />
            </div>
            <table className="w-full text-xs">
              <tbody>
                {validationMessages.map((m, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}>
                    <td className="py-1.5 flex items-center gap-1.5">
                      {m.type === 'warning'
                        ? <AlertTriangle size={12} style={{ color: '#d97706' }} />
                        : <XCircle size={12} style={{ color: '#dc2626' }} />}
                      <span className="font-medium text-slate-700">{m.item}</span>
                    </td>
                    <td className="py-1.5 text-slate-500">{m.msg}</td>
                    <td className="py-1.5 text-slate-400">{m.time}</td>
                    <td className="py-1.5 text-right">
                      <button className="text-xs" style={{ color: m.type === 'warning' ? '#d97706' : '#dc2626' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cell Details Drawer */}
        {showDrawer && (
          <div className="w-56 shrink-0 border-l flex flex-col" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-xs font-semibold text-slate-700">Cell Details</span>
              <X size={13} className="text-slate-400 cursor-pointer" onClick={() => setShowDrawer(false)} />
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Selected Cell</p>
                <p className="text-xs font-semibold text-slate-800">Revenue &middot; Jun 2025</p>
                <p className="text-lg font-bold text-slate-800 mt-1">11,600</p>
                <p className="text-xs text-slate-400">thousands</p>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { label: 'Source Type', value: 'Manual Entry' },
                  { label: 'Formula', value: '—' },
                  { label: 'Owner', value: 'Jane Cooper' },
                  { label: 'Validation', value: 'Valid', valueColor: '#16a34a' },
                  { label: 'Last Updated', value: 'May 28, 2025 10:32 AM' },
                ].map(({ label, value, valueColor }) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700" style={valueColor ? { color: valueColor } : {}}>
                      {value === 'Valid' ? '✓ ' : ''}{value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Comments</span>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#2563eb', fontSize: 9 }}>2</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">History</span>
                  <button className="text-xs" style={{ color: '#2563eb' }}>View all</button>
                </div>
                <div className="flex flex-col gap-2">
                  {historyItems.map((h, i) => (
                    <div key={i} className="border-l-2 pl-2" style={{ borderColor: '#e2e8f0' }}>
                      <p className="text-xs font-medium text-slate-700">{h.user}</p>
                      <p className="text-slate-400" style={{ fontSize: 10 }}>{h.time}</p>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{h.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
