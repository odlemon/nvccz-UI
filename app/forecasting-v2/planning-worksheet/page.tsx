'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useThemeContainer } from '@/components/fpna/use-theme-container'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [currency, setCurrency] = useState('USD')
  const [displayMode, setDisplayMode] = useState('$ Amounts')
  const [periodGranularity, setPeriodGranularity] = useState('Monthly')
  const { ref: themeRef, container: themeContainer } = useThemeContainer()

  return (
    <DashboardShell>
      <TopBar title="Planning Worksheet" scenario="Base Case" version="FY2026 Working Forecast" period="Jun 2025" />
      <div ref={themeRef} className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-header */}
          <div className="px-4 pt-3 pb-2 bg-card border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-sm font-bold text-foreground">North Region Operating Forecast</h1>
              <Button variant="outline" size="pill">
                <Info size={11} /> Model Details
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><span className="text-muted-foreground">Owner</span> <span className="font-medium text-foreground">Jane Cooper</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span><span className="font-medium text-foreground">In Progress</span></div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Currency</span>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-6 rounded-full text-xs px-2 min-w-0" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent container={themeContainer}>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ZiG">ZiG</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1"><span className="text-muted-foreground">Last Updated</span> <span className="font-medium text-foreground">May 28, 2025 10:32 AM</span></div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-card" style={{ borderColor: 'var(--border)' }}>
            {[
              { icon: Upload, label: 'Import' },
              { icon: Download, label: 'Export' },
              { icon: Copy, label: 'Copy Forward' },
              { icon: SplitSquareHorizontal, label: 'Spread' },
              { icon: TrendingUp, label: 'Apply Growth' },
            ].map(({ icon: Icon, label }) => (
              <Button key={label} variant="outline" size="pill">
                <Icon size={11} />
                {label}
              </Button>
            ))}
            <Button variant="default" size="pill">
              Submit
            </Button>
            <Button variant="outline" size="pill" className="ml-1">
              <MessageCircle size={11} /> Add Comment
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Select value={displayMode} onValueChange={setDisplayMode}>
                <SelectTrigger className="h-7 rounded-full text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={themeContainer}>
                  <SelectItem value="$ Amounts">$ Amounts</SelectItem>
                  <SelectItem value="% of Revenue">% of Revenue</SelectItem>
                  <SelectItem value="Per Unit">Per Unit</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodGranularity} onValueChange={setPeriodGranularity}>
                <SelectTrigger className="h-7 rounded-full text-xs" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={themeContainer}>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
              <Maximize2 size={13} className="text-muted-foreground cursor-pointer" />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 1100 }}>
              <thead className="bg-muted" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-36 border-b border-r" style={{ borderColor: 'var(--border)' }}>
                    $ in thousands
                  </th>
                  {/* Actuals header */}
                  <th colSpan={5} className="text-center py-1 font-semibold border-b border-r bg-muted text-muted-foreground" style={{ borderColor: 'var(--border)' }}>
                    ACTUALS
                  </th>
                  {/* Forecast header */}
                  <th colSpan={7} className="text-center py-1 font-semibold border-b border-r bg-accent text-accent-foreground" style={{ borderColor: 'var(--border)' }}>
                    FORECAST
                  </th>
                  {/* Quarters */}
                  {quarters.map(q => (
                    <th key={q} className="text-center px-2 py-1 font-medium text-muted-foreground border-b" style={{ borderColor: 'var(--border)', fontSize: 10 }}>
                      {q}
                    </th>
                  ))}
                </tr>
                <tr className="bg-muted">
                  <th className="px-3 py-1.5 border-b border-r" style={{ borderColor: 'var(--border)' }}></th>
                  {actuals.map(a => (
                    <th key={a} className="text-center px-2 py-1.5 font-medium border-b border-r bg-muted text-muted-foreground" style={{ borderColor: 'var(--border)', fontSize: 10, minWidth: 70 }}>
                      {a}
                    </th>
                  ))}
                  {forecast.map((f, i) => (
                    <th key={f} className={`text-center px-2 py-1.5 font-medium border-b border-r ${i === 0 ? 'bg-accent text-accent-foreground' : 'bg-accent/30 text-muted-foreground'}`} style={{
                      borderColor: 'var(--border)', fontSize: 10, minWidth: 70,
                      fontWeight: i === 0 ? 700 : 500
                    }}>
                      {f}
                    </th>
                  ))}
                  {quarters.map(q => (
                    <th key={q} className="text-center px-2 py-1.5 font-medium border-b border-r text-muted-foreground" style={{ borderColor: 'var(--border)', fontSize: 10, minWidth: 70 }}>
                      {q}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-accent/20 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className={`px-3 py-1.5 border-r font-medium text-foreground ${row.bold ? 'bg-muted' : ''}`} style={{
                      borderColor: 'var(--border)',
                      paddingLeft: row.indent ? 20 : 12,
                      fontWeight: row.bold ? 600 : 400,
                    }}>
                      <div className="flex items-center gap-1">
                        {row.bold && <ChevronRight size={10} className="text-muted-foreground" />}
                        {row.label}
                      </div>
                      {row.bold && <div className="text-muted-foreground font-normal" style={{ fontSize: 9 }}>$ in thousands</div>}
                    </td>
                    {row.actuals.map((v, ci) => {
                      const colName = actuals[ci]
                      const isSelected = selectedCell.row === row.label && selectedCell.col === colName
                      return (
                        <td key={ci}
                          onClick={() => setSelectedCell({ row: row.label, col: colName })}
                          className={`text-center px-2 py-1.5 cursor-pointer border-r ${isSelected ? 'bg-accent' : 'bg-muted'} ${v !== null && v < 0 ? 'text-destructive' : 'text-foreground'}`}
                          style={{
                            borderColor: 'var(--border)',
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
                      const isCurrentCol = ci === 0
                      const bgClass = isSelected || isHighlight
                        ? 'bg-accent'
                        : isCurrentCol
                          ? 'bg-accent/30'
                          : 'bg-card'
                      return (
                        <td key={ci}
                          onClick={() => setSelectedCell({ row: row.label, col: colName })}
                          className={`text-center px-2 py-1.5 cursor-pointer border-r ${bgClass} ${v !== null && v < 0 ? 'text-destructive' : isHighlight ? 'text-accent-foreground' : 'text-foreground'}`}
                          style={{
                            borderColor: 'var(--border)',
                            fontWeight: isHighlight ? 700 : row.bold ? 600 : 400,
                            outline: isHighlight ? '1.5px solid var(--primary)' : undefined,
                          }}>
                          {fmt(v, row.isPercent)}
                        </td>
                      )
                    })}
                    {row.quarters.map((v, ci) => (
                      <td key={ci} className="text-center px-2 py-1.5 border-r bg-muted text-muted-foreground" style={{
                        borderColor: 'var(--border)', fontWeight: row.bold ? 600 : 400,
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
          <div className="border-t px-4 py-2 bg-card" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground">Validation Messages</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-amber-500" style={{ fontSize: 10 }}>3</span>
              </div>
              <ChevronDown size={13} className="text-muted-foreground cursor-pointer" />
            </div>
            <table className="w-full text-xs">
              <tbody>
                {validationMessages.map((m, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                    <td className="py-1.5 flex items-center gap-1.5">
                      {m.type === 'warning'
                        ? <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                        : <XCircle size={12} className="text-destructive" />}
                      <span className="font-medium text-foreground">{m.item}</span>
                    </td>
                    <td className="py-1.5 text-muted-foreground">{m.msg}</td>
                    <td className="py-1.5 text-muted-foreground/70">{m.time}</td>
                    <td className="py-1.5 text-right">
                      <Button
                        variant="link"
                        size="sm"
                        className={`h-auto p-0 text-xs ${m.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cell Details Drawer */}
        {showDrawer && (
          <div className="w-56 shrink-0 border-l flex flex-col bg-card" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs font-semibold text-foreground">Cell Details</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowDrawer(false)}>
                <X size={13} className="text-muted-foreground" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Selected Cell</p>
                <p className="text-xs font-semibold text-foreground">Revenue &middot; Jun 2025</p>
                <p className="text-lg font-bold text-foreground mt-1">11,600</p>
                <p className="text-xs text-muted-foreground">thousands</p>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                {[
                  { label: 'Source Type', value: 'Manual Entry' },
                  { label: 'Formula', value: '—' },
                  { label: 'Owner', value: 'Jane Cooper' },
                  { label: 'Validation', value: 'Valid', isValid: true },
                  { label: 'Last Updated', value: 'May 28, 2025 10:32 AM' },
                ].map(({ label, value, isValid }) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-medium ${isValid ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {value === 'Valid' ? '✓ ' : ''}{value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-white bg-primary" style={{ fontSize: 9 }}>2</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">History</span>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">View all</Button>
                </div>
                <div className="flex flex-col gap-2">
                  {historyItems.map((h, i) => (
                    <div key={i} className="border-l-2 pl-2" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs font-medium text-foreground">{h.user}</p>
                      <p className="text-muted-foreground" style={{ fontSize: 10 }}>{h.time}</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{h.value}</p>
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
