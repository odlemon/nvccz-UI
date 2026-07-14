'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Download, FileText, Plus, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchReportTemplates, fetchReports, generateReport } from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi } from '@/lib/api/investment-ops-api'
import { useSortedPaginated } from '@/components/investments-v2/ui/use-sorted-paginated'
import { SortableTh } from '@/components/investments-v2/ui/sortable-th'
import { TablePagination } from '@/components/investments-v2/ui/table-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'

type ReportSortKey = 'type' | 'createdAt' | 'status'

const FORMAT_EXTENSION: Record<string, string> = {
  DOCX: 'docx',
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
  XLSX: 'xlsx',
  JSON: 'json',
}

// Per-report-type parameter shape — the generate API has no machine-readable
// parameter schema (only scopeType/requiresFundId/requiresClientId), so this
// mirrors the documented payload examples per report type.
type ParamField = 'periodStart' | 'periodEnd' | 'valuationDate' | 'benchmarkName' | 'assetManagerName'

const REPORT_PARAM_FIELDS: Record<string, ParamField[]> = {
  CLIENT_PORTFOLIO_VALUATION: ['valuationDate'],
  PORTFOLIO_VALUATION: [],
  TRADE_BLOTTER: [],
  HOLDINGS_SUMMARY: [],
  COMPLIANCE_SUMMARY: [],
  RECONCILIATION_SUMMARY: [],
}
const DEFAULT_PARAM_FIELDS: ParamField[] = ['periodStart', 'periodEnd', 'valuationDate', 'benchmarkName', 'assetManagerName']

const PARAM_FIELD_LABELS: Record<ParamField, string> = {
  periodStart: 'Period Start',
  periodEnd: 'Period End',
  valuationDate: 'Valuation Date',
  benchmarkName: 'Benchmark Name',
  assetManagerName: 'Asset Manager Name',
}

const NEW_REPORT_EMPTY = {
  reportType: '',
  format: '',
  clientId: '',
  periodStart: undefined as Date | undefined,
  periodEnd: undefined as Date | undefined,
  valuationDate: undefined as Date | undefined,
  benchmarkName: 'ZSE Industrial Index',
  assetManagerName: 'Arcus Asset Management',
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
  const [reportTypeComboOpen, setReportTypeComboOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [tableScopeFilter, setTableScopeFilter] = useState('All')
  const [tableScopeComboOpen, setTableScopeComboOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  // Radix popovers/selects portal into document.body by default, which sits
  // outside the .investments-terminal div that scopes the dark/light theme
  // CSS variables — without this, portaled dropdowns render with the app's
  // default (light) theme regardless of the investments-v2 theme toggle.
  const [themeContainer, setThemeContainer] = useState<HTMLElement | null>(null)
  const rootRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setThemeContainer(node.closest('.investments-terminal'))
  }, [])

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

  const getReportSortValue = (r: (typeof reportRuns)[number], key: ReportSortKey) => {
    if (key === 'type') return r.reportTypeName
    if (key === 'status') return r.status
    return new Date(r.createdAt).getTime()
  }

  const filteredRuns = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return visibleRuns.filter((r) => {
      if (tableScopeFilter !== 'All' && r.scopeType !== tableScopeFilter) return false
      const createdAt = new Date(r.createdAt)
      if (dateFrom && createdAt < dateFrom) return false
      if (dateTo && createdAt > new Date(dateTo.getTime() + 24 * 60 * 60 * 1000 - 1)) return false
      if (q) {
        const haystack = [r.reportTypeName, r.fundName ?? r.clientName ?? '', r.requestedBy?.name ?? '']
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [visibleRuns, searchText, tableScopeFilter, dateFrom, dateTo])

  const {
    pageRows: runRows,
    sortKey: runSortKey,
    sortDir: runSortDir,
    toggleSort: toggleRunSort,
    page: runPage,
    setPage: setRunPage,
    totalPages: runTotalPages,
    totalRows: runTotalRows,
  } = useSortedPaginated<(typeof reportRuns)[number], ReportSortKey>(filteredRuns, getReportSortValue, 'createdAt', 10)

  const fundName = (fundId: string | null) => (fundId ? portfolios.find((f) => f.id === fundId)?.name ?? '—' : null)
  const selectedTemplate = reportTemplates.find((t) => t.code === form.reportType)
  const paramFields = REPORT_PARAM_FIELDS[form.reportType] ?? DEFAULT_PARAM_FIELDS

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
    for (const f of paramFields) {
      if (!form[f]) {
        setFormError(`${PARAM_FIELD_LABELS[f]} is required for this report type`)
        return
      }
    }
    const parameters: Record<string, any> = {}
    if (paramFields.includes('periodStart') && form.periodStart) parameters.periodStart = format(form.periodStart, 'yyyy-MM-dd')
    if (paramFields.includes('periodEnd') && form.periodEnd) parameters.periodEnd = format(form.periodEnd, 'yyyy-MM-dd')
    if (paramFields.includes('valuationDate') && form.valuationDate) parameters.valuationDate = format(form.valuationDate, 'yyyy-MM-dd')
    if (paramFields.includes('benchmarkName') && form.benchmarkName) parameters.benchmarkName = form.benchmarkName
    if (paramFields.includes('assetManagerName') && form.assetManagerName) parameters.assetManagerName = form.assetManagerName

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
    <div ref={rootRef} className="flex flex-col h-full w-full">
      <PageHeader title="Reporting" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {scopeTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
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
              className="bg-card border border-border rounded-md p-3 text-left hover:border-primary/40 transition-colors"
            >
              <div className="w-8 h-8 rounded bg-accent flex items-center justify-center mb-2">
                <FileText className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="text-[11px] font-semibold text-foreground leading-tight">{tmpl.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{tmpl.description}</div>
            </button>
          ))}
          {visibleTemplates.length === 0 && !reportTemplatesLoading && (
            <div className="col-span-6 text-center py-6 text-[12px] text-muted-foreground">No report templates available.</div>
          )}
        </div>

        {/* Report library */}
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="text-xs font-semibold text-foreground">Report Library</div>
            <Button variant="default" size="pill" onClick={() => setShowGenerate(true)}>
              <Plus className="w-3 h-3" /> Generate Report
            </Button>
          </div>

          {showGenerate && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] font-semibold text-foreground">Generate Report</div>
                <button onClick={() => setShowGenerate(false)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Report Type</label>
                  <Popover open={reportTypeComboOpen} onOpenChange={setReportTypeComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={reportTypeComboOpen}
                        className="w-full justify-between rounded-full font-normal"
                      >
                        <span className="truncate">{selectedTemplate?.name ?? 'Select report type…'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0" align="start" container={themeContainer}>
                      <Command>
                        <CommandInput placeholder="Search report type…" />
                        <CommandList>
                          <CommandEmpty>No report types found.</CommandEmpty>
                          <CommandGroup>
                            {reportTemplates.map((t) => (
                              <CommandItem
                                key={t.code}
                                value={t.name}
                                onSelect={() => {
                                  handleReportTypeChange(t.code)
                                  setReportTypeComboOpen(false)
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', form.reportType === t.code ? 'opacity-100' : 'opacity-0')} />
                                {t.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Format</label>
                  <Select value={form.format} onValueChange={(v) => setForm((p) => ({ ...p, format: v }))}>
                    <SelectTrigger className="w-full rounded-full bg-muted border-input text-foreground">
                      <SelectValue placeholder="Select format…" />
                    </SelectTrigger>
                    <SelectContent container={themeContainer}>
                      {(selectedTemplate?.supportedFormats ?? []).map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTemplate?.requiresFundId && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Fund</label>
                    <Input value={fundName(selectedFundId) ?? '—'} disabled readOnly className="bg-muted border-input text-foreground" />
                  </div>
                )}
                {selectedTemplate?.requiresClientId && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Client ID</label>
                    <Input
                      value={form.clientId}
                      onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                      placeholder="Client mandate ID"
                      className="font-mono bg-muted border-input text-foreground"
                    />
                  </div>
                )}
                {paramFields.includes('periodStart') && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Period Start</label>
                    <DatePicker value={form.periodStart} onChange={(d) => setForm((p) => ({ ...p, periodStart: d }))} className="w-full" container={themeContainer} />
                  </div>
                )}
                {paramFields.includes('periodEnd') && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Period End</label>
                    <DatePicker value={form.periodEnd} onChange={(d) => setForm((p) => ({ ...p, periodEnd: d }))} className="w-full" container={themeContainer} />
                  </div>
                )}
                {paramFields.includes('valuationDate') && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Valuation Date</label>
                    <DatePicker value={form.valuationDate} onChange={(d) => setForm((p) => ({ ...p, valuationDate: d }))} className="w-full" container={themeContainer} />
                  </div>
                )}
                {paramFields.includes('benchmarkName') && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Benchmark Name</label>
                    <Input
                      value={form.benchmarkName}
                      onChange={(e) => setForm((p) => ({ ...p, benchmarkName: e.target.value }))}
                      placeholder="e.g. ZSE Industrial Index"
                      className="bg-muted border-input text-foreground"
                    />
                  </div>
                )}
                {paramFields.includes('assetManagerName') && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Asset Manager Name</label>
                    <Input
                      value={form.assetManagerName}
                      onChange={(e) => setForm((p) => ({ ...p, assetManagerName: e.target.value }))}
                      placeholder="e.g. Arcus Asset Management"
                      className="bg-muted border-input text-foreground"
                    />
                  </div>
                )}
                {paramFields.length === 0 && !selectedTemplate?.requiresFundId && !selectedTemplate?.requiresClientId && (
                  <div className="col-span-3 text-[11px] text-muted-foreground">
                    This report type takes no additional parameters.
                  </div>
                )}
              </div>
              {formError && <div className="text-[11px] text-destructive mt-2">{formError}</div>}
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button variant="outline" size="pill" onClick={() => setShowGenerate(false)}>Cancel</Button>
                <Button variant="default" size="pill" onClick={handleGenerate} disabled={reportGenerating}>
                  {reportGenerating ? 'Generating…' : 'Generate'}
                </Button>
              </div>
            </div>
          )}

          {/* Report Library filters */}
          <div className="flex items-center gap-2 flex-wrap p-4 border-b border-border">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by type, fund/client, or requester…"
              className="w-64 bg-muted border-input text-foreground"
            />
            <Popover open={tableScopeComboOpen} onOpenChange={setTableScopeComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={tableScopeComboOpen} className="w-40 justify-between rounded-full font-normal">
                  <span className="truncate">{tableScopeFilter}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0" align="start" container={themeContainer}>
                <Command>
                  <CommandInput placeholder="Search scope…" />
                  <CommandList>
                    <CommandEmpty>No scopes found.</CommandEmpty>
                    <CommandGroup>
                      {scopeTabs.map((t) => (
                        <CommandItem
                          key={t}
                          value={t}
                          onSelect={() => {
                            setTableScopeFilter(t)
                            setTableScopeComboOpen(false)
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', tableScopeFilter === t ? 'opacity-100' : 'opacity-0')} />
                          {t}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" className="w-40" allowFutureDates container={themeContainer} />
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" className="w-40" allowFutureDates container={themeContainer} />
          </div>

          <table className="arcus-table">
            <thead>
              <tr>
                <SortableTh col="type" label="Type" sortKey={runSortKey} sortDir={runSortDir} onSort={toggleRunSort} />
                <th>Format</th>
                <th>Scope</th>
                <th>Requested By</th>
                <SortableTh col="createdAt" label="Created At" sortKey={runSortKey} sortDir={runSortDir} onSort={toggleRunSort} />
                <SortableTh col="status" label="Status" sortKey={runSortKey} sortDir={runSortDir} onSort={toggleRunSort} />
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {runRows.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded">{r.reportTypeName}</span>
                  </td>
                  <td className="text-muted-foreground">{r.format}</td>
                  <td className="text-muted-foreground">{r.fundName ?? r.clientName ?? 'Firm-wide'}</td>
                  <td className="text-muted-foreground">{r.requestedBy?.name ?? '—'}</td>
                  <td className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</td>
                  <td><StatusBadge status={r.status === 'COMPLETED' ? 'completed' : r.status.toLowerCase()} /></td>
                  <td>
                    {r.downloadAvailable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                        disabled={!!downloadingById[r.id]}
                        onClick={() => handleDownload(r)}
                      >
                        <Download className="w-3 h-3" /> {downloadingById[r.id] ? 'Downloading…' : 'Download'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRuns.length === 0 && !reportRunsLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[12px] text-muted-foreground">No reports generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <TablePagination page={runPage} totalPages={runTotalPages} onPageChange={setRunPage} rowsShown={runRows.length} totalRows={runTotalRows} />
        </div>
      </div>
    </div>
  )
}
