'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, Filter, Trash2, ChevronRight, ChevronDown, Plus,
  CheckCircle2, AlertTriangle, Download, Settings2, X, Clock
} from 'lucide-react'

const dimensions = [
  { name: 'Account', count: 8 },
  { name: 'Department', count: null },
  { name: 'Product', count: null },
  { name: 'Customer', count: null },
  { name: 'Region', count: null },
  { name: 'Scenario', count: null },
  { name: 'Version', count: null },
  { name: 'Time', count: null },
]

const lineItems = [
  { name: 'Revenue Forecast', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: '= "Units Forecast" * "Avg Selling Price"', status: 'Valid', selected: true },
  { name: 'Units Forecast', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: 'Input', status: 'Valid' },
  { name: 'Avg Selling Price', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Weighted Avg', formula: 'Input', status: 'Valid' },
  { name: 'Discount %', type: 'Percent', appliesTo: 'Product, Region, Customer, Time', summary: 'Weighted Avg', formula: 'Input', status: 'Valid' },
  { name: 'Net Revenue', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: '= "Revenue Forecast" * (1 - "Discount %")', status: 'Valid' },
  { name: 'COGS', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: '= "Units Forecast" * "Unit Cost"', status: 'Valid' },
  { name: 'Gross Profit', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: '= "Net Revenue" - "COGS"', status: 'Valid' },
  { name: 'Gross Margin %', type: 'Percent', appliesTo: 'Product, Region, Customer, Time', summary: 'Weighted Avg', formula: '= "Gross Profit" / "Net Revenue"', status: 'Valid' },
  { name: 'Opex - Sales & Mktg', type: 'Number', appliesTo: 'Department, Region, Time', summary: 'Sum', formula: 'Input', status: 'Warning' },
  { name: 'Opex - R&D', type: 'Number', appliesTo: 'Department, Region, Time', summary: 'Sum', formula: 'Input', status: 'Valid' },
  { name: 'Opex - G&A', type: 'Number', appliesTo: 'Department, Region, Time', summary: 'Sum', formula: 'Input', status: 'Valid' },
  { name: 'Total Opex', type: 'Number', appliesTo: 'Department, Region, Time', summary: 'Sum', formula: '= Opex - Sales & Mktg + Opex ...', status: 'Valid' },
  { name: 'Operating Income', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: 'Input', status: 'Valid' },
  { name: 'Other Income', type: 'Number', appliesTo: 'Number, Region, Time', summary: 'Sum', formula: 'Input', status: 'Valid' },
  { name: 'EBITDA', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: '= "Operating Income" + Depreciation', status: 'Valid' },
  { name: 'Depreciation', type: 'Number', appliesTo: 'Region, Time', summary: 'Sum', formula: 'Input', status: 'Valid' },
  { name: 'EBIT', type: 'Number', appliesTo: 'Product, Region, Customer, Time', summary: 'Sum', formula: '= "EBITDA" - "Depreciation"', status: 'Valid' },
]

const recentChanges = [
  { user: 'Jane Cooper', role: 'FP&A Analyst', action: 'Edited formula for "Revenue Forecast"', time: 'May 23, 2025 9:12 AM' },
  { user: 'Devon Lane', role: 'Finance Manager', action: 'Added line item "Customer Rebates"', time: 'May 22, 2025 4:43 PM' },
  { user: 'Cody Fisher', role: 'FP&A Analyst', action: 'Updated summary method for "Avg Selling Price"', time: 'May 22, 2025 11:30 AM' },
  { user: 'Wade Warren', role: 'FP&A Manager', action: 'Updated data source for "Opex - R&D"', time: 'May 21, 2025 3:20 PM' },
]

const sidebarComponents = [
  { group: 'Dimensions', items: dimensions, expanded: true },
  { group: 'Line Items', items: [{ name: 'Line Items', count: 42 }], expanded: false },
  { group: 'Versions', items: [{ name: 'Versions', count: 3 }], expanded: false },
  { group: 'Scenarios', items: [{ name: 'Scenarios', count: 4 }], expanded: false },
  { group: 'Drivers', items: [{ name: 'Drivers', count: 18 }], expanded: false },
  { group: 'Formulas', items: [{ name: 'Formulas', count: 27 }], expanded: false },
  { group: 'Workflows', items: [{ name: 'Workflows', count: 6 }], expanded: false },
  { group: 'Security', items: [{ name: 'Security', count: 12 }], expanded: false },
]

const VIEW_FILTERS = ['All Line Items', 'Valid Only', 'Warnings Only'] as const
type ViewFilter = typeof VIEW_FILTERS[number]

export default function ModelBuilderPage() {
  const [selectedItem, setSelectedItem] = useState('Revenue Forecast')
  const [activeTab, setActiveTab] = useState('General')
  const [componentSearch, setComponentSearch] = useState('')
  const [lineItemSearch, setLineItemSearch] = useState('')
  const [viewFilter, setViewFilter] = useState<ViewFilter>('All Line Items')

  const filteredDimensions = useMemo(() => {
    const q = componentSearch.trim().toLowerCase()
    if (!q) return dimensions
    return dimensions.filter((d) => d.name.toLowerCase().includes(q))
  }, [componentSearch])

  const filteredLineItems = useMemo(() => {
    const q = lineItemSearch.trim().toLowerCase()
    return lineItems.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.appliesTo.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q)
      const matchesFilter =
        viewFilter === 'All Line Items' ||
        (viewFilter === 'Valid Only' && item.status === 'Valid') ||
        (viewFilter === 'Warnings Only' && item.status === 'Warning')
      return matchesSearch && matchesFilter
    })
  }, [lineItemSearch, viewFilter])

  const cycleViewFilter = () => {
    const idx = VIEW_FILTERS.indexOf(viewFilter)
    setViewFilter(VIEW_FILTERS[(idx + 1) % VIEW_FILTERS.length])
  }

  return (
    <DashboardShell>
      <TopBar title="Model Builder" scenario="Base Case" version="Working" period="May 2025" />
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel: Components */}
        <div className="w-44 shrink-0 border-r border-border flex flex-col bg-card">
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-foreground">Components</p>
            </div>
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                placeholder="Search components..."
                className="h-7 pl-7 pr-2 text-xs bg-muted border-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarComponents.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-between px-3 py-1.5 cursor-pointer bg-muted">
                  <div className="flex items-center gap-1">
                    {group.expanded ? <ChevronDown size={10} className="text-muted-foreground" /> : <ChevronRight size={10} className="text-muted-foreground" />}
                    <span className="text-xs font-semibold text-foreground">{group.group}</span>
                  </div>
                  {group.group === 'Dimensions' && <span className="text-xs text-muted-foreground">{filteredDimensions.length}</span>}
                  {group.group !== 'Dimensions' && group.items[0].count && <span className="text-xs text-muted-foreground">{group.items[0].count}</span>}
                </div>
                {group.expanded && group.group === 'Dimensions' && filteredDimensions.map((d, di) => (
                  <div key={di} className="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-accent/50 border-t border-border">
                    <div className="w-3 h-3 rounded bg-accent">
                      <div className="w-full h-full rounded flex items-center justify-center text-accent-foreground" style={{ fontSize: 7, fontWeight: 700 }}>D</div>
                    </div>
                    <span className="text-xs text-foreground">{d.name}</span>
                  </div>
                ))}
                {group.expanded && group.group === 'Dimensions' && filteredDimensions.length === 0 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground">No dimensions match &quot;{componentSearch}&quot;</div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="pill" className="w-full border-primary text-primary hover:bg-accent">
              <Plus size={11} /> Add Component
            </Button>
          </div>
        </div>

        {/* Center: Model table */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          {/* Model header */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Model: FY2026 Revenue &amp; Opex Model</span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Model Status</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">● Healthy</span>
              <span className="text-xs text-muted-foreground">Last validated: May 23, 2025 9:15 AM ✓</span>
              <Button variant="outline" size="pill">Validate All</Button>
              <Button variant="default" size="pill">Publish Model ▾</Button>
            </div>
          </div>

          {/* FY2026 header */}
          <div className="px-4 py-2 border-b border-border flex items-center gap-3 bg-card">
            <span className="text-xs font-semibold text-foreground">FY2026 Revenue &amp; Opex Model</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">View</span>
              <select
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value as ViewFilter)}
                className="text-xs px-2 py-1 rounded border border-border bg-card text-foreground"
              >
                {VIEW_FILTERS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <Button
                variant={viewFilter === 'All Line Items' ? 'ghost' : 'default'}
                size="sm"
                onClick={cycleViewFilter}
                title="Cycle status filter"
                className="h-7 px-2 gap-1"
              >
                <Filter size={11} />
              </Button>
              <div className="relative">
                <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={lineItemSearch}
                  onChange={(e) => setLineItemSearch(e.target.value)}
                  placeholder="Search line items..."
                  className="h-7 pl-7 pr-2 text-xs w-32 bg-muted border-none"
                />
              </div>
              <Button variant="ghost" size="sm" className="p-1.5 h-auto">
                <Settings2 size={13} className="text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1.5 h-auto">
                <Download size={13} className="text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs" style={{ minWidth: 700 }}>
              <thead className="bg-muted" style={{ position: 'sticky', top: 0 }}>
                <tr className="border-b border-border">
                  <th className="w-8 px-3 py-2"></th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Line Item ↕</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Data Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Applies To ↕</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Summary Method</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Formula</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLineItems.map((item, i) => {
                  const isSelected = item.name === selectedItem
                  return (
                    <tr key={i}
                      onClick={() => setSelectedItem(item.name)}
                      className={`cursor-pointer border-b border-border ${isSelected ? 'bg-accent/40' : ''}`}
                    >
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-3 h-3" style={{ accentColor: 'var(--primary)' }} />
                      </td>
                      <td className={`px-3 py-1.5 font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-accent">
                            <div className="w-full h-full flex items-center justify-center text-accent-foreground" style={{ fontSize: 6, fontWeight: 700 }}>LI</div>
                          </div>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{item.type}</td>
                      <td className="px-3 py-1.5 text-muted-foreground max-w-36 truncate">{item.appliesTo}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{item.summary}</td>
                      <td className="px-3 py-1.5 text-muted-foreground max-w-48 truncate font-mono" style={{ fontSize: 10 }}>{item.formula}</td>
                      <td className="px-3 py-1.5">
                        {item.status === 'Valid'
                          ? <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 size={11} /> Valid</span>
                          : <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"><AlertTriangle size={11} /> Warning</span>}
                      </td>
                    </tr>
                  )
                })}
                {filteredLineItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      No line items match your search{viewFilter !== 'All Line Items' ? ` and filter (${viewFilter})` : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border">
              <span>1–{filteredLineItems.length} of {lineItems.length} line items</span>
              <div className="flex items-center gap-1 ml-auto">
                {[1, 2, 3].map(p => (
                  <Button
                    key={p}
                    variant={p === 1 ? 'default' : 'ghost'}
                    size="sm"
                    className="w-6 h-6 p-0 rounded-full text-xs"
                  >
                    {p}
                  </Button>
                ))}
                <span>...</span>
                <span className="text-muted-foreground">Show 20 ▾</span>
              </div>
            </div>
          </div>

          {/* Bottom: Dep Map + Recent Changes + Overview */}
          <div className="border-t border-border grid grid-cols-3 gap-0" style={{ height: 180 }}>
            {/* Dependency Map */}
            <div className="border-r border-border p-3 overflow-hidden">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-semibold text-foreground">Dependency Map</span>
                <span style={{ fontSize: 10 }} className="text-muted-foreground cursor-pointer">ⓘ</span>
              </div>
              <svg width="100%" height="120" style={{ fontSize: 10 }}>
                {/* Arrows */}
                <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" className="fill-muted-foreground" /></marker></defs>
                <line x1="115" y1="35" x2="175" y2="50" className="stroke-muted-foreground" strokeWidth="1" markerEnd="url(#arr)" />
                <line x1="115" y1="75" x2="175" y2="60" className="stroke-muted-foreground" strokeWidth="1" markerEnd="url(#arr)" />
                <line x1="270" y1="55" x2="320" y2="45" className="stroke-muted-foreground" strokeWidth="1" markerEnd="url(#arr)" />
                <line x1="175" y1="85" x2="320" y2="55" className="stroke-muted-foreground" strokeWidth="1" markerEnd="url(#arr)" />

                <rect x="5" y="20" width="100" height="20" rx="3" className="fill-muted stroke-border" />
                <text x="55" y="33" textAnchor="middle" className="fill-muted-foreground">Units Forecast</text>
                <rect x="5" y="62" width="100" height="20" rx="3" className="fill-muted stroke-border" />
                <text x="55" y="75" textAnchor="middle" className="fill-muted-foreground">Avg Selling Price</text>
                <rect x="155" y="42" width="110" height="22" rx="3" className="fill-accent stroke-primary" strokeWidth="1.5" />
                <text x="210" y="57" textAnchor="middle" className="fill-primary" fontWeight="600">Revenue Forecast</text>
                <rect x="170" y="75" width="80" height="20" rx="3" className="fill-muted stroke-border" />
                <text x="210" y="88" textAnchor="middle" className="fill-muted-foreground">COGS</text>
                <rect x="315" y="35" width="85" height="20" rx="3" className="fill-muted stroke-border" />
                <text x="357" y="48" textAnchor="middle" className="fill-muted-foreground">Net Revenue</text>
                <rect x="315" y="65" width="85" height="20" rx="3" className="fill-muted stroke-border" />
                <text x="357" y="78" textAnchor="middle" className="fill-muted-foreground">Gross Profit</text>
              </svg>
            </div>

            {/* Recent Model Changes */}
            <div className="border-r border-border p-3 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Recent Model Changes</span>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline">View All</Button>
              </div>
              <div className="flex flex-col gap-2">
                {recentChanges.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-indigo-500" style={{ fontSize: 9 }}>
                      {c.user.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{c.user}</p>
                      <p style={{ fontSize: 10 }} className="text-muted-foreground">{c.action}</p>
                      <p style={{ fontSize: 10 }} className="text-muted-foreground/80">{c.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Overview */}
            <div className="p-3 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Model Overview</span>
              </div>
              {[
                { label: 'Total Line Items', value: '42' },
                { label: 'Formulas', value: '27' },
                { label: 'Dimensions', value: '8' },
                { label: 'Created By', value: 'Jane Cooper' },
                { label: 'Last Modified', value: 'May 23, 2025 9:12 AM' },
                { label: 'Created On', value: 'Apr 10, 2025 10:55 AM' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="w-56 shrink-0 border-l border-border flex flex-col bg-card">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Properties</span>
            <select className="text-xs px-2 py-0.5 rounded border border-border bg-card text-muted-foreground"><option>Line Item</option></select>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">{selectedItem}</h3>
              <div className="flex gap-1 border-b border-border mb-3">
                {['General', 'Format', 'Security', 'Workflow', 'History'].map(t => (
                  <Button
                    key={t}
                    variant="ghost"
                    onClick={() => setActiveTab(t)}
                    className={`text-xs pb-1.5 px-1 h-auto rounded-none shadow-none hover:bg-transparent border-b-2 ${
                      activeTab === t ? 'text-primary border-primary font-semibold' : 'text-muted-foreground border-transparent font-normal'
                    }`}
                  >
                    {t}
                  </Button>
                ))}
              </div>

              {activeTab === 'General' && (
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Name *</label>
                    <Input className="w-full h-7 text-xs px-2 py-1.5" value={selectedItem} readOnly />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Format</label>
                    <div className="flex items-center gap-1">
                      <select className="flex-1 text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground"><option>Number</option></select>
                      <select className="w-8 text-xs px-1 py-1.5 rounded border border-border bg-card text-foreground"><option>$</option></select>
                      <select className="w-8 text-xs px-1 py-1.5 rounded border border-border bg-card text-foreground"><option>0</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Applies To *</label>
                    <div className="flex flex-wrap gap-1">
                      {['Product', 'Region', 'Customer', 'Time', '+2'].map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-accent text-accent-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-muted-foreground">Formula</label>
                      <Button variant="outline" size="sm" className="h-auto text-xs px-2 py-0.5 border-primary text-primary">Validate Formula</Button>
                    </div>
                    <div className="p-2 rounded font-mono bg-muted border border-border" style={{ fontSize: 10 }}>
                      <span className="text-muted-foreground">1</span>
                      <span className="ml-2 text-foreground">{'"Units Forecast" * "Avg Selling Price"'}</span>
                    </div>
                    <p className="text-xs mt-1 text-green-600 dark:text-green-400">✓ Formula is valid</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Summary Method</label>
                    <select className="w-full text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground"><option>Sum</option></select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Data Source</label>
                    <select className="w-full text-xs px-2 py-1.5 rounded border border-border bg-card text-foreground"><option>Calculated</option></select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked readOnly className="w-3 h-3" style={{ accentColor: 'var(--primary)' }} />
                    <span className="text-xs text-foreground">Editable ⓘ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" readOnly className="w-3 h-3" />
                    <span className="text-xs text-foreground">Approvals Required</span>
                    <span className="text-xs text-muted-foreground">Workflow: Revenue Approval</span>
                    <Button variant="ghost" size="sm" className="text-xs h-auto p-0 ml-auto text-primary hover:bg-transparent hover:underline">Change</Button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Validation</label>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 size={10} /> Formula is valid</p>
                      <p className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400"><CheckCircle2 size={10} /> Applies to dimensions are valid</p>
                      <p className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={10} /> No data source mapped (using calculated)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 p-3 border-t border-border">
            <Button variant="outline" size="pill" className="flex-1">Cancel</Button>
            <Button variant="default" size="pill" className="flex-1">Save Changes</Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
