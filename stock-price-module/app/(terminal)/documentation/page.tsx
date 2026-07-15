'use client'

import { useState } from 'react'
import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Upload, Download, Search, FolderOpen, FileText, File, Plus } from 'lucide-react'

const docTabs = ['All Documents', 'Mandates', 'Prospectuses', 'Compliance Docs', 'Audit Reports', 'Contracts']

const documents = [
  { id: 'DOC-0841', name: 'Arcus Growth Fund — Investment Mandate', type: 'Mandate', portfolio: 'Equity World', version: 'v3.2', format: 'PDF', size: '2.4 MB', uploadedBy: 'J.Moyo', uploadedAt: '01 Jan 2026', expiryDate: '31 Dec 2027', status: 'active', category: 'Mandates' },
  { id: 'DOC-0840', name: 'Arcus Growth Fund — Prospectus 2026', type: 'Prospectus', portfolio: 'Equity World', version: 'v2.0', format: 'PDF', size: '8.1 MB', uploadedBy: 'J.Moyo', uploadedAt: '01 Jan 2026', expiryDate: '31 Dec 2026', status: 'active', category: 'Prospectuses' },
  { id: 'DOC-0839', name: 'Compliance Policy Manual — Investment', type: 'Compliance', portfolio: 'All', version: 'v4.1', format: 'PDF', size: '5.8 MB', uploadedBy: 'Compliance', uploadedAt: '15 Mar 2026', expiryDate: '14 Mar 2027', status: 'active', category: 'Compliance Docs' },
  { id: 'DOC-0838', name: 'Q2 2026 Internal Audit Report', type: 'Audit Report', portfolio: 'All', version: 'v1.0', format: 'PDF', size: '3.2 MB', uploadedBy: 'Audit', uploadedAt: '05 Jul 2026', expiryDate: '—', status: 'review', category: 'Audit Reports' },
  { id: 'DOC-0837', name: 'Goldman Sachs Prime Brokerage Agreement', type: 'Contract', portfolio: 'All', version: 'v2.1', format: 'PDF', size: '1.8 MB', uploadedBy: 'Operations', uploadedAt: '01 Feb 2026', expiryDate: '31 Jan 2028', status: 'active', category: 'Contracts' },
  { id: 'DOC-0836', name: 'ZSE Exchange Membership — Annual Renewal', type: 'Licence', portfolio: 'All', version: 'v1.0', format: 'PDF', size: '0.8 MB', uploadedBy: 'Operations', uploadedAt: '01 Jan 2026', expiryDate: '31 Dec 2026', status: 'active', category: 'Compliance Docs' },
  { id: 'DOC-0835', name: 'Citi Custody Agreement', type: 'Contract', portfolio: 'Equity World', version: 'v3.0', format: 'PDF', size: '2.1 MB', uploadedBy: 'Operations', uploadedAt: '15 Jan 2025', expiryDate: '14 Jan 2028', status: 'active', category: 'Contracts' },
  { id: 'DOC-0834', name: 'Multi Asset Fund Mandate', type: 'Mandate', portfolio: 'Multi Asset', version: 'v2.0', format: 'PDF', size: '2.2 MB', uploadedBy: 'J.Moyo', uploadedAt: '01 Jan 2026', expiryDate: '31 Dec 2027', status: 'active', category: 'Mandates' },
  { id: 'DOC-0833', name: 'Fixed Income Benchmark Policy', type: 'Policy', portfolio: 'Fixed Income', version: 'v1.5', format: 'PDF', size: '1.4 MB', uploadedBy: 'Compliance', uploadedAt: '01 Feb 2026', expiryDate: '31 Jan 2027', status: 'active', category: 'Compliance Docs' },
  { id: 'DOC-0832', name: 'Old Investment Mandate v2.1 — Superseded', type: 'Mandate', portfolio: 'Equity World', version: 'v2.1', format: 'PDF', size: '1.9 MB', uploadedBy: 'J.Moyo', uploadedAt: '01 Jan 2025', expiryDate: '31 Dec 2025', status: 'archived', category: 'Mandates' },
]

const categoryIcons: Record<string, typeof FileText> = {
  Mandates: FileText,
  Prospectuses: File,
  'Compliance Docs': FileText,
  'Audit Reports': FileText,
  Contracts: File,
}

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('All Documents')
  const [search, setSearch] = useState('')

  const filtered = documents.filter(d => {
    const matchTab = activeTab === 'All Documents' || d.category === activeTab
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const categories = ['Mandates', 'Prospectuses', 'Compliance Docs', 'Audit Reports', 'Contracts']
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = documents.filter(d => d.category === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Documentation" subtitle="Fund documents, mandates, compliance and contracts" showPeriod={false} />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0 overflow-x-auto">
        {docTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
            {t !== 'All Documents' && (
              <span className="ml-1.5 text-[9px] text-[#4B5A72]">({categoryCounts[t] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Category cards */}
        {activeTab === 'All Documents' && (
          <div className="grid grid-cols-5 gap-3">
            {categories.map(cat => {
              const Icon = categoryIcons[cat] ?? File
              const count = categoryCounts[cat]
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className="bg-[#0D1526] border border-white/[0.06] rounded-md p-3.5 text-left hover:border-[#2563EB]/40 transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center mb-2 group-hover:bg-[#2563EB]">
                    <Icon className="w-4 h-4 text-[#60A5FA] group-hover:text-white" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#E8EDF5]">{count}</div>
                  <div className="text-[10px] text-[#6B7A95] mt-0.5">{cat}</div>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7A95]">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#111C30] border border-white/[0.06] rounded px-2.5 py-1.5">
              <Search className="w-3 h-3 text-[#4B5A72]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-transparent text-[#A8B4C8] text-xs outline-none w-44 placeholder:text-[#4B5A72]" />
            </div>
            <button className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded">
              <Upload className="w-3 h-3" /> Upload Document
            </button>
            <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
              <Plus className="w-3 h-3" /> New Folder
            </button>
          </div>
        </div>

        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Document ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Portfolio</th>
                  <th>Version</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Upload Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id} className="cursor-pointer">
                    <td className="text-[#60A5FA] font-mono text-[11px]">{doc.id}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-[#4B5A72] flex-shrink-0" />
                        <span className="text-[#C8D3E8]">{doc.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] bg-[#1E3A5F] text-[#60A5FA] px-2 py-0.5 rounded">{doc.type}</span>
                    </td>
                    <td className="text-[#6B7A95]">{doc.portfolio}</td>
                    <td className="text-[#A8B4C8] font-mono">{doc.version}</td>
                    <td className="text-[#6B7A95]">{doc.format}</td>
                    <td className="text-[#6B7A95] font-mono">{doc.size}</td>
                    <td className="text-[#A8B4C8]">{doc.uploadedBy}</td>
                    <td className="text-[#6B7A95]">{doc.uploadedAt}</td>
                    <td className={cn('font-mono', doc.expiryDate !== '—' && doc.status !== 'archived' ? 'text-[#A8B4C8]' : 'text-[#6B7A95]')}>
                      {doc.expiryDate}
                    </td>
                    <td><StatusBadge status={doc.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="text-[10px] text-[#60A5FA] hover:underline">View</button>
                        <button className="flex items-center gap-0.5 text-[10px] text-[#6B7A95] hover:text-[#A8B4C8]">
                          <Download className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
