'use client'

import DashboardShell from '@/components/fpna/DashboardShell'
import TopBar from '@/components/fpna/TopBar'
import { useState } from 'react'
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

const depMapNodes = [
  { id: 'units', label: 'Units Forecast', x: 20, y: 120 },
  { id: 'price', label: 'Avg Selling Price', x: 20, y: 160 },
  { id: 'rev', label: 'Revenue Forecast', x: 160, y: 140, highlight: true },
  { id: 'net', label: 'Net Revenue', x: 300, y: 110 },
  { id: 'cogs', label: 'COGS', x: 160, y: 185 },
  { id: 'gp', label: 'Gross Profit', x: 430, y: 130 },
]

export default function ModelBuilderPage() {
  const [selectedItem, setSelectedItem] = useState('Revenue Forecast')
  const [activeTab, setActiveTab] = useState('General')

  return (
    <DashboardShell>
      <TopBar title="Model Builder" scenario="Base Case" version="Working" period="May 2025" />
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel: Components */}
        <div className="w-44 shrink-0 border-r flex flex-col" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-700">Components</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#f1f5f9' }}>
              <Search size={11} className="text-slate-400" />
              <input className="bg-transparent text-xs outline-none text-slate-600 w-full" placeholder="Search components..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarComponents.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-between px-3 py-1.5 cursor-pointer" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="flex items-center gap-1">
                    {group.expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span className="text-xs font-semibold text-slate-700">{group.group}</span>
                  </div>
                  {group.group === 'Dimensions' && <span className="text-xs text-slate-400">8</span>}
                  {group.group !== 'Dimensions' && group.items[0].count && <span className="text-xs text-slate-400">{group.items[0].count}</span>}
                </div>
                {group.expanded && group.group === 'Dimensions' && dimensions.map((d, di) => (
                  <div key={di} className="flex items-center gap-2 px-4 py-1 cursor-pointer hover:bg-blue-50" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dbeafe' }}>
                      <div className="w-full h-full rounded flex items-center justify-center" style={{ fontSize: 7, color: '#2563eb', fontWeight: 700 }}>D</div>
                    </div>
                    <span className="text-xs text-slate-700">{d.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="p-3 border-t" style={{ borderColor: '#e2e8f0' }}>
            <button className="flex items-center gap-1.5 w-full justify-center py-1.5 rounded text-xs font-medium border" style={{ borderColor: '#2563eb', color: '#2563eb' }}>
              <Plus size={11} /> Add Component
            </button>
          </div>
        </div>

        {/* Center: Model table */}
        <div className="flex-1 flex flex-col overflow-hidden border-r" style={{ borderColor: '#e2e8f0' }}>
          {/* Model header */}
          <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Model: FY2026 Revenue &amp; Opex Model</span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Model Status</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>● Healthy</span>
              <span className="text-xs text-slate-400">Last validated: May 23, 2025 9:15 AM ✓</span>
              <button className="px-3 py-1 rounded text-xs font-semibold border" style={{ borderColor: '#e2e8f0', color: '#475569' }}>Validate All</button>
              <button className="px-3 py-1 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#2563eb' }}>Publish Model ▾</button>
            </div>
          </div>

          {/* FY2026 header */}
          <div className="px-4 py-2 border-b flex items-center gap-3" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
            <span className="text-xs font-semibold text-slate-800">FY2026 Revenue &amp; Opex Model</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-500">View</span>
              <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#e2e8f0' }}><option>All Line Items</option></select>
              <Filter size={11} className="text-slate-400" />
              <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#f1f5f9' }}>
                <Search size={11} className="text-slate-400" />
                <input className="bg-transparent text-xs outline-none w-24" placeholder="Search line items..." />
              </div>
              <Settings2 size={13} className="text-slate-400 cursor-pointer" />
              <Download size={13} className="text-slate-400 cursor-pointer" />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs" style={{ minWidth: 700 }}>
              <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th className="w-8 px-3 py-2"></th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Line Item ↕</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Data Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Applies To ↕</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Summary Method</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Formula</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => {
                  const isSelected = item.name === selectedItem
                  return (
                    <tr key={i}
                      onClick={() => setSelectedItem(item.name)}
                      className="cursor-pointer"
                      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? '#eff6ff' : undefined }}
                    >
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-3 h-3" style={{ accentColor: '#2563eb' }} />
                      </td>
                      <td className="px-3 py-1.5 font-medium" style={{ color: isSelected ? '#2563eb' : '#1e293b' }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dbeafe' }}>
                            <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 6, color: '#2563eb', fontWeight: 700 }}>LI</div>
                          </div>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{item.type}</td>
                      <td className="px-3 py-1.5 text-slate-500 max-w-36 truncate">{item.appliesTo}</td>
                      <td className="px-3 py-1.5 text-slate-500">{item.summary}</td>
                      <td className="px-3 py-1.5 text-slate-500 max-w-48 truncate font-mono" style={{ fontSize: 10 }}>{item.formula}</td>
                      <td className="px-3 py-1.5">
                        {item.status === 'Valid'
                          ? <span className="flex items-center gap-1 text-xs" style={{ color: '#16a34a' }}><CheckCircle2 size={11} /> Valid</span>
                          : <span className="flex items-center gap-1 text-xs" style={{ color: '#d97706' }}><AlertTriangle size={11} /> Warning</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-slate-400 border-t" style={{ borderColor: '#e2e8f0' }}>
              <span>1–20 of 42 line items</span>
              <div className="flex items-center gap-1 ml-auto">
                {[1, 2, 3].map(p => (
                  <button key={p} className="w-6 h-6 rounded text-xs" style={{ backgroundColor: p === 1 ? '#2563eb' : undefined, color: p === 1 ? '#fff' : '#64748b' }}>{p}</button>
                ))}
                <span>...</span>
                <span className="text-slate-400">Show 20 ▾</span>
              </div>
            </div>
          </div>

          {/* Bottom: Dep Map + Recent Changes + Overview */}
          <div className="border-t grid grid-cols-3 gap-0" style={{ borderColor: '#e2e8f0', height: 180 }}>
            {/* Dependency Map */}
            <div className="border-r p-3 overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-semibold text-slate-700">Dependency Map</span>
                <span style={{ fontSize: 10 }} className="text-slate-400 cursor-pointer">ⓘ</span>
              </div>
              <svg width="100%" height="120" style={{ fontSize: 10 }}>
                {/* Arrows */}
                <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" /></marker></defs>
                <line x1="115" y1="35" x2="175" y2="50" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arr)" />
                <line x1="115" y1="75" x2="175" y2="60" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arr)" />
                <line x1="270" y1="55" x2="320" y2="45" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arr)" />
                <line x1="175" y1="85" x2="320" y2="55" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arr)" />

                <rect x="5" y="20" width="100" height="20" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
                <text x="55" y="33" textAnchor="middle" fill="#475569">Units Forecast</text>
                <rect x="5" y="62" width="100" height="20" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
                <text x="55" y="75" textAnchor="middle" fill="#475569">Avg Selling Price</text>
                <rect x="155" y="42" width="110" height="22" rx="3" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
                <text x="210" y="57" textAnchor="middle" fill="#1d4ed8" fontWeight="600">Revenue Forecast</text>
                <rect x="170" y="75" width="80" height="20" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
                <text x="210" y="88" textAnchor="middle" fill="#475569">COGS</text>
                <rect x="315" y="35" width="85" height="20" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
                <text x="357" y="48" textAnchor="middle" fill="#475569">Net Revenue</text>
                <rect x="315" y="65" width="85" height="20" rx="3" fill="#f1f5f9" stroke="#e2e8f0" />
                <text x="357" y="78" textAnchor="middle" fill="#475569">Gross Profit</text>
              </svg>
            </div>

            {/* Recent Model Changes */}
            <div className="border-r p-3 overflow-y-auto" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Recent Model Changes</span>
                <button className="text-xs" style={{ color: '#2563eb' }}>View All</button>
              </div>
              <div className="flex flex-col gap-2">
                {recentChanges.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: '#6366f1', fontSize: 9 }}>
                      {c.user.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{c.user}</p>
                      <p style={{ fontSize: 10, color: '#64748b' }}>{c.action}</p>
                      <p style={{ fontSize: 10, color: '#94a3b8' }}>{c.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Overview */}
            <div className="p-3 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Model Overview</span>
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
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-medium text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="w-56 shrink-0 border-l flex flex-col" style={{ borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#e2e8f0' }}>
            <span className="text-xs font-semibold text-slate-700">Properties</span>
            <select className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: '#e2e8f0', color: '#475569' }}><option>Line Item</option></select>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">{selectedItem}</h3>
              <div className="flex gap-1 border-b mb-3" style={{ borderColor: '#e2e8f0' }}>
                {['General', 'Format', 'Security', 'Workflow', 'History'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className="text-xs pb-1.5 px-1"
                    style={{ color: activeTab === t ? '#2563eb' : '#94a3b8', borderBottom: activeTab === t ? '2px solid #2563eb' : '2px solid transparent', fontWeight: activeTab === t ? 600 : 400 }}>
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'General' && (
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Name *</label>
                    <input className="w-full text-xs px-2 py-1.5 rounded border" style={{ borderColor: '#e2e8f0' }} value={selectedItem} readOnly />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Format</label>
                    <div className="flex items-center gap-1">
                      <select className="flex-1 text-xs px-2 py-1.5 rounded border" style={{ borderColor: '#e2e8f0' }}><option>Number</option></select>
                      <select className="w-8 text-xs px-1 py-1.5 rounded border" style={{ borderColor: '#e2e8f0' }}><option>$</option></select>
                      <select className="w-8 text-xs px-1 py-1.5 rounded border" style={{ borderColor: '#e2e8f0' }}><option>0</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Applies To *</label>
                    <div className="flex flex-wrap gap-1">
                      {['Product', 'Region', 'Customer', 'Time', '+2'].map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400">Formula</label>
                      <button className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: '#2563eb', color: '#2563eb' }}>Validate Formula</button>
                    </div>
                    <div className="p-2 rounded font-mono" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 10 }}>
                      <span className="text-slate-400">1</span>
                      <span className="ml-2 text-slate-700">{'"Units Forecast" * "Avg Selling Price"'}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#16a34a' }}>✓ Formula is valid</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Summary Method</label>
                    <select className="w-full text-xs px-2 py-1.5 rounded border" style={{ borderColor: '#e2e8f0' }}><option>Sum</option></select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-0.5">Data Source</label>
                    <select className="w-full text-xs px-2 py-1.5 rounded border" style={{ borderColor: '#e2e8f0' }}><option>Calculated</option></select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked readOnly className="w-3 h-3" style={{ accentColor: '#2563eb' }} />
                    <span className="text-xs text-slate-700">Editable ⓘ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" readOnly className="w-3 h-3" />
                    <span className="text-xs text-slate-700">Approvals Required</span>
                    <span className="text-xs text-slate-400">Workflow: Revenue Approval</span>
                    <button className="text-xs ml-auto" style={{ color: '#2563eb' }}>Change</button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Validation</label>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={10} /> Formula is valid</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: '#16a34a' }}><CheckCircle2 size={10} /> Applies to dimensions are valid</p>
                      <p className="text-xs flex items-center gap-1" style={{ color: '#d97706' }}><AlertTriangle size={10} /> No data source mapped (using calculated)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 p-3 border-t" style={{ borderColor: '#e2e8f0' }}>
            <button className="flex-1 py-1.5 rounded text-xs border font-medium" style={{ borderColor: '#e2e8f0', color: '#475569' }}>Cancel</button>
            <button className="flex-1 py-1.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#2563eb' }}>Save Changes</button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
