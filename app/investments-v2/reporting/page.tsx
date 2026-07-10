'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Download, FileText, Plus, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchReportTemplates, fetchReports, generateReport } from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'

const FORMAT_EXTENSION: Record<string, string> = {
  DOCX: 'docx',
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
  XLSX: 'xlsx',
  JSON: 'json',
}

const NEW_REPORT_EMPTY = {
  reportType: '',
  format: '',
  clientId: '',
  parameters: '{}',
}

export default function ReportingPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    selectedFundId,
    reportTemplates,
    reportTemplatesLoading,
    reportRuns,
    reportRunsLoading,
    reportGenerating,
  } = useAppSelector((s) => s.investmentOps)
  const [activeTab, setActiveTab] = useState('All')
  const [showGenerate, setShowGenerate] = useState(false)
  const [form, setForm] = useState(NEW_REPORT_EMPTY)
  const [formError, setFormError] = useState('')
  const [downloadingById, setDownloadingById] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dispatch(fetchReportTemplates())
    dispatch(fetchPortfolios())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchReports({ fundId: selectedFundId ?? undefined }))
  }, [dispatch, selectedFundId])

  // Tabs derived from the real scopeType values the API returns — never a fabricated category list.
  const scopeTabs = useMemo(() => ['All', ...Array.from(new Set(reportTemplates.map((t) => t.scopeType)))], [reportTemplates])

  const visibleTemplates = useMemo(
    () => (activeTab === 'All' ? reportTemplates : reportTemplates.filter((t) => t.scopeType === activeTab)),
    [reportTemplates, activeTab]
  )
  const visibleRuns = useMemo(
    () => (activeTab === 'All' ? reportRuns : reportRuns.filter((r) => r.scopeType === activeTab)),
    [reportRuns, activeTab]
  )

  const fundName = (fundId: string | null) => (fundId ? portfolios.find((f) => f.id === fundId)?.name ?? '—' : null)
  const selectedTemplate = reportTemplates.find((t) => t.code === form.reportType)

  const handleReportTypeChange = (code: string) => {
    const tmpl = reportTemplates.find((t) => t.code === code)
    setForm((p) => ({ ...p, reportType: code, format: tmpl?.supportedFormats[0] ?? '' }))
  }

  const handlePickTemplate = (code: string) => {
    handleReportTypeChange(code)
    setShowGenerate(true)
  }

  const handleGenerate = async () => {
    setFormError('')
    if (!selectedTemplate) {
      setFormError('Select a report type')
      return
    }
    if (selectedTemplate.requiresFundId && !selectedFundId) {
      setFormError('This report requires a fund, but none is selected')
      return
    }
    if (selectedTemplate.requiresClientId && !form.clientId) {
      setFormError('This report requires a client ID')
      return
    }
    let parameters: Record<string, any>
    try {
      parameters = JSON.parse(form.parameters || '{}')
    } catch {
      setFormError('Parameters must be valid JSON')
      return
    }
    try {
      await dispatch(
        generateReport({
          fundId: selectedTemplate.requiresFundId ? selectedFundId ?? undefined : undefined,
          clientId: selectedTemplate.requiresClientId ? form.clientId : undefined,
          reportType: form.reportType,
          format: form.format,
          parameters,
        })
      ).unwrap()
      setForm(NEW_REPORT_EMPTY)
      setShowGenerate(false)
      dispatch(fetchReports({ fundId: selectedFundId ?? undefined }))
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate report')
    }
  }

  const handleDownload = async (run: (typeof reportRuns)[number]) => {
    setDownloadingById((p) => ({ ...p, [run.id]: true }))
    try {
      const blob = await investmentOpsApi.downloadReport(run.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = FORMAT_EXTENSION[run.format] ?? run.format.toLowerCase()
      a.download = `${run.reportType}-${run.id}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // no-op — a failed fetch simply leaves nothing downloaded
    } finally {
      setDownloadingById((p) => ({ ...p, [run.id]: false }))
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Reporting" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {scopeTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Report templates */}
        <div className="grid grid-cols-6 gap-3">
          {visibleTemplates.map(tmpl => (
            <button
              key={tmpl.code}
              onClick={() => handlePickTemplate(tmpl.code)}
              className="bg-[#0D1526] border border-white/[0.06] rounded-md p-3 text-left hover:border-[#2563EB]/40 transition-colors"
            >
              <div className="w-8 h-8 rounded bg-[#1E3A5F] flex items-center justify-center mb-2">
                <FileText className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <div className="text-[11px] font-semibold text-[#C8D3E8] leading-tight">{tmpl.name}</div>
              <div className="text-[10px] text-[#4B5A72] mt-0.5 leading-tight">{tmpl.description}</div>
            </button>
          ))}
          {visibleTemplates.length === 0 && !reportTemplatesLoading && (
            <div className="col-span-6 text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No report templates available.</div>
          )}
        </div>

        {/* Report library */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <div className="text-xs font-semibold text-[#E8EDF5]">Report Library</div>
            <button onClick={() => setShowGenerate(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
              <Plus className="w-3 h-3" /> Generate Report
            </button>
          </div>

          {showGenerate && (
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] font-semibold text-[#E8EDF5]">Generate Report</div>
                <button onClick={() => setShowGenerate(false)} className="text-[#6B7A95] hover:text-[#EF4444]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Report Type</label>
                  <select
                    value={form.reportType}
                    onChange={(e) => handleReportTypeChange(e.target.value)}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                  >
                    <option value="" disabled>Select report type…</option>
                    {reportTemplates.map((t) => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Format</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                  >
                    <option value="" disabled>Select format…</option>
                    {(selectedTemplate?.supportedFormats ?? []).map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                {selectedTemplate?.requiresFundId && (
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Fund</label>
                    <div className="px-2.5 py-1.5 text-xs text-[#94a3b8] bg-[#111C30] border border-white/[0.08] rounded">
                      {fundName(selectedFundId) ?? '—'}
                    </div>
                  </div>
                )}
                {selectedTemplate?.requiresClientId && (
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Client ID</label>
                    <input
                      value={form.clientId}
                      onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                      placeholder="Client mandate ID"
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                    />
                  </div>
                )}
                <div className="col-span-3">
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Parameters (JSON)</label>
                  <textarea
                    value={form.parameters}
                    onChange={(e) => setForm((p) => ({ ...p, parameters: e.target.value }))}
                    rows={4}
                    placeholder='{"periodStart": "2026-01-01", "periodEnd": "2026-03-31"}'
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                  />
                </div>
              </div>
              {formError && <div className="text-[11px] text-[#EF4444] mt-2">{formError}</div>}
              <div className="flex items-center justify-end gap-2 mt-3">
                <button onClick={() => setShowGenerate(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                <button
                  onClick={handleGenerate}
                  disabled={reportGenerating}
                  className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {reportGenerating ? 'Generating…' : 'Generate'}
                </button>
              </div>
            </div>
          )}

          <table className="arcus-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Type</th>
                <th>Format</th>
                <th>Scope</th>
                <th>Requested By</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRuns.map(r => (
                <tr key={r.id}>
                  <td className="text-[#60A5FA] font-mono text-[11px]">{r.id}</td>
                  <td>
                    <span className="text-[10px] bg-[#1E3A5F] text-[#60A5FA] px-2 py-0.5 rounded">{r.reportTypeName}</span>
                  </td>
                  <td className="text-[#6B7A95]">{r.format}</td>
                  <td className="text-[#A8B4C8]">{r.fundName ?? r.clientName ?? 'Firm-wide'}</td>
                  <td className="text-[#A8B4C8]">{r.requestedBy?.name ?? '—'}</td>
                  <td className="text-[#6B7A95]">{new Date(r.createdAt).toLocaleString()}</td>
                  <td><StatusBadge status={r.status === 'COMPLETED' ? 'completed' : r.status.toLowerCase()} /></td>
                  <td>
                    {r.downloadAvailable && (
                      <button
                        disabled={!!downloadingById[r.id]}
                        onClick={() => handleDownload(r)}
                        className="flex items-center gap-1 text-[#60A5FA] text-[10px] hover:underline disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" /> {downloadingById[r.id] ? 'Downloading…' : 'Download'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visibleRuns.length === 0 && !reportRunsLoading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No reports generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
