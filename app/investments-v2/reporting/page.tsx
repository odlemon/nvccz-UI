'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Download, FileText, Plus, BarChart2, FileSpreadsheet } from 'lucide-react'

const reportTabs = ['Portfolio Reports', 'P&L Reports', 'Allocation', 'Compliance', 'Trade Reports', 'Investor Reports']

const reports = [
  { id: 'RPT-0841', name: 'Equity World — Monthly Portfolio Report', portfolio: 'Equity World', type: 'Portfolio', format: 'PDF', period: 'Jun 2026', createdBy: 'J.Moyo', createdAt: '07 Jul 2026 09:20', status: 'completed' },
  { id: 'RPT-0840', name: 'Multi Asset — P&L Summary', portfolio: 'Multi Asset', type: 'P&L', format: 'Excel', period: 'Jun 2026', createdBy: 'System', createdAt: '07 Jul 2026 08:00', status: 'completed' },
  { id: 'RPT-0839', name: 'All Portfolios — Asset Allocation', portfolio: 'All', type: 'Allocation', format: 'PDF', period: '07 Jul 2026', createdBy: 'S.Dlamini', createdAt: '07 Jul 2026 10:30', status: 'completed' },
  { id: 'RPT-0838', name: 'Fixed Income — Compliance Breach Report', portfolio: 'Fixed Income', type: 'Compliance', format: 'PDF', period: 'Jul 2026', createdBy: 'Compliance', createdAt: '07 Jul 2026 11:00', status: 'review' },
  { id: 'RPT-0837', name: 'Equity World — Trade Blotter Export', portfolio: 'Equity World', type: 'Trade', format: 'CSV', period: 'Jun 2026', createdBy: 'R.Sithole', createdAt: '06 Jul 2026 16:10', status: 'completed' },
  { id: 'RPT-0836', name: 'Investor Report Q2 2026', portfolio: 'All', type: 'Investor', format: 'PDF', period: 'Q2 2026', createdBy: 'J.Moyo', createdAt: '05 Jul 2026 14:00', status: 'completed' },
]

const reportTemplates = [
  { name: 'Portfolio Valuation Report', type: 'Portfolio', icon: BarChart2, description: 'NAV, holdings, allocation, performance' },
  { name: 'Trade Blotter Export', type: 'Trade', icon: FileSpreadsheet, description: 'All executed trades with fees and settlement' },
  { name: 'P&L Summary', type: 'P&L', icon: BarChart2, description: 'Realised and unrealised gains by period' },
  { name: 'Compliance Report', type: 'Compliance', icon: FileText, description: 'Breaches, exceptions and audit events' },
  { name: 'Investor Statement', type: 'Investor', icon: FileText, description: 'Investor-ready portfolio summary' },
  { name: 'Reconciliation Report', type: 'Recon', icon: FileText, description: 'Cash and holdings reconciliation summary' },
]

export default function ReportingPage() {
  const [activeTab, setActiveTab] = useState('Portfolio Reports')

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Reporting" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {reportTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Report templates */}
        <div className="grid grid-cols-6 gap-3">
          {reportTemplates.map(tmpl => {
            const Icon = tmpl.icon
            return (
              <button key={tmpl.name} className="bg-[#0D1526] border border-white/[0.06] rounded-md p-3 text-left hover:border-[#2563EB]/40 transition-colors group">
                <div className="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center mb-2 group-hover:bg-[#2563EB]">
                  <Icon className="w-4 h-4 text-[#60A5FA] group-hover:text-white" />
                </div>
                <div className="text-[11px] font-semibold text-[#C8D3E8] leading-tight">{tmpl.name}</div>
                <div className="text-[10px] text-[#4B5A72] mt-0.5 leading-tight">{tmpl.description}</div>
              </button>
            )
          })}
        </div>

        {/* Report library */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <div className="text-xs font-semibold text-[#E8EDF5]">Report Library</div>
            <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
              <Plus className="w-3 h-3" /> Generate Report
            </button>
          </div>
          <table className="arcus-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Report Name</th>
                <th>Portfolio</th>
                <th>Type</th>
                <th>Format</th>
                <th>Period</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td className="text-[#60A5FA] font-mono text-[11px]">{r.id}</td>
                  <td className="text-[#C8D3E8]">{r.name}</td>
                  <td className="text-[#A8B4C8]">{r.portfolio}</td>
                  <td>
                    <span className="text-[10px] bg-[#1E3A5F] text-[#60A5FA] px-2 py-0.5 rounded">{r.type}</span>
                  </td>
                  <td className="text-[#6B7A95]">{r.format}</td>
                  <td className="text-[#6B7A95]">{r.period}</td>
                  <td className="text-[#A8B4C8]">{r.createdBy}</td>
                  <td className="text-[#6B7A95]">{r.createdAt}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <button className="flex items-center gap-1 text-[#60A5FA] text-[10px] hover:underline">
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
