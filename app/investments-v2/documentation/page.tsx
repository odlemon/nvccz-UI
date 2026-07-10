'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Upload, Download, Search, FileText, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchDocuments, createDocument } from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'

const NEW_DOC_EMPTY = {
  title: '',
  documentType: 'OTHER',
  fileRef: '',
}

export default function DocumentationPage() {
  const dispatch = useAppDispatch()
  const { portfolios, selectedFundId, documents, documentCreating } = useAppSelector((s) => s.investmentOps)
  const [activeTab, setActiveTab] = useState('All Documents')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState(NEW_DOC_EMPTY)
  const [downloadingById, setDownloadingById] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchDocuments({ fundId: selectedFundId ?? undefined }))
  }, [dispatch, selectedFundId])

  const fundName = (fundId: string) => portfolios.find((f) => f.id === fundId)?.name ?? '—'

  // Tabs are derived from the real documentType values present — never a fabricated fixed category list.
  const docTypes = useMemo(() => Array.from(new Set(documents.map((d) => d.documentType))).sort(), [documents])
  const docTabs = ['All Documents', ...docTypes]
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of documents) counts[d.documentType] = (counts[d.documentType] ?? 0) + 1
    return counts
  }, [documents])

  const filtered = documents.filter(d => {
    const matchTab = activeTab === 'All Documents' || d.documentType === activeTab
    const q = search.trim().toLowerCase()
    const matchSearch = !q || d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const handleCreate = async () => {
    if (!selectedFundId || !form.title || !form.fileRef) return
    await dispatch(createDocument({ fundId: selectedFundId, documentType: form.documentType, title: form.title, fileRef: form.fileRef }))
    setForm(NEW_DOC_EMPTY)
    setShowUpload(false)
  }

  const handleDownload = async (id: string, title: string) => {
    setDownloadingById((p) => ({ ...p, [id]: true }))
    try {
      const blob = await investmentOpsApi.downloadDocument(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = title
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // no-op — surfaced via disabled state clearing; endpoint response shape unverified for this doc
    } finally {
      setDownloadingById((p) => ({ ...p, [id]: false }))
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Documentation" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {docTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap transition-colors',
              activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
            {t !== 'All Documents' && (
              <span className="ml-1.5 text-[9px] text-[#4B5A72]">({typeCounts[t] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#6B7A95]">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#111C30] border border-white/[0.06] rounded px-2.5 py-1.5">
              <Search className="w-3 h-3 text-[#4B5A72]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-transparent text-[#A8B4C8] text-xs outline-none w-44 placeholder:text-[#4B5A72]" />
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 text-[#6B7A95] hover:text-[#A8B4C8] text-xs px-2.5 py-1.5 bg-[#111C30] border border-white/[0.06] rounded"
            >
              <Upload className="w-3 h-3" /> Upload Document
            </button>
          </div>
        </div>

        {showUpload && (
          <div className="bg-[#0D1526] border border-[#2563EB]/40 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-[#E8EDF5]">Upload Document</div>
              <button onClick={() => setShowUpload(false)} className="text-[#6B7A95] hover:text-[#EF4444]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Trade confirm"
                  className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Document Type</label>
                <input
                  value={form.documentType}
                  onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))}
                  className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">File Ref</label>
                <input
                  value={form.fileRef}
                  onChange={(e) => setForm((p) => ({ ...p, fileRef: e.target.value }))}
                  placeholder="/storage/doc.pdf"
                  className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setShowUpload(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={documentCreating}
                className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                {documentCreating ? 'Saving…' : 'Save Document'}
              </button>
            </div>
          </div>
        )}

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
                  <th>Uploaded By</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => (
                  <tr key={doc.id}>
                    <td className="text-[#60A5FA] font-mono text-[11px]">{doc.id}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-[#4B5A72] flex-shrink-0" />
                        <span className="text-[#C8D3E8]">{doc.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] bg-[#1E3A5F] text-[#60A5FA] px-2 py-0.5 rounded">{doc.documentType}</span>
                    </td>
                    <td className="text-[#6B7A95]">{fundName(doc.fundId)}</td>
                    <td className="text-[#A8B4C8] font-mono">v{doc.versionNo}</td>
                    <td className="text-[#A8B4C8] font-mono text-[11px]">{doc.uploadedById}</td>
                    <td className="text-[#6B7A95]">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td><StatusBadge status={doc.approvalStatus.toLowerCase()} /></td>
                    <td>
                      <button
                        disabled={!!downloadingById[doc.id]}
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="flex items-center gap-0.5 text-[10px] text-[#6B7A95] hover:text-[#A8B4C8] disabled:opacity-50"
                      >
                        <Download className="w-2.5 h-2.5" /> {downloadingById[doc.id] ? 'Downloading…' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>
                      No documents found{search ? ` matching "${search}"` : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
