'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, Download, FileText, Loader2, Plus, Search, X } from 'lucide-react'
import { OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchPortfolios, fetchReportTemplates, fetchReports, generateReport } from '@/lib/store/slices/investmentOpsSlice'
import { investmentOpsApi, type ReportTemplate } from '@/lib/api/investment-ops-api'
import { useSortedPaginated } from '@/components/investments-v2/ui/use-sorted-paginated'
import { SortableTh } from '@/components/investments-v2/ui/sortable-th'
import { TablePagination } from '@/components/investments-v2/ui/table-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'

type ReportSortKey = 'type' | 'createdAt' | 'status'

const FORMAT_EXTENSION: Record<string, string> = {
  DOCX: 'docx',
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
  XLSX: 'xlsx',
  JSON: 'json',
}

type ParamField = 'periodStart' | 'periodEnd' | 'valuationDate' | 'benchmarkName' | 'assetManagerName'

const PARAM_FIELD_LABELS: Record<ParamField, string> = {
  periodStart: 'Period Start',
  periodEnd: 'Period End',
  valuationDate: 'Valuation Date',
  benchmarkName: 'Benchmark Name',
  assetManagerName: 'Asset Manager Name',
}

const SCHEMA_TO_FIELD: Record<string, ParamField> = {
  periodStart: 'periodStart',
  periodEnd: 'periodEnd',
  valuationDate: 'valuationDate',
  asOf: 'valuationDate',
  benchmarkName: 'benchmarkName',
  assetManagerName: 'assetManagerName',
}

/** Prefer API parameterSchema; fall back for older payloads. */
function paramFieldsForTemplate(tmpl: ReportTemplate | undefined): ParamField[] {
  if (!tmpl) return []
  const props = tmpl.parameterSchema?.properties
  if (props && Object.keys(props).length) {
    const fields: ParamField[] = []
    const seen = new Set<ParamField>()
    for (const key of Object.keys(props)) {
      if (key === 'fundId' || key === 'clientId' || key === 'format') continue
      const mapped = SCHEMA_TO_FIELD[key]
      if (!mapped || seen.has(mapped)) continue
      seen.add(mapped)
      fields.push(mapped)
    }
    return fields
  }
  if (tmpl.hasDocxTemplate) {
    return ['periodStart', 'periodEnd', 'valuationDate', 'benchmarkName', 'assetManagerName']
  }
  return []
}

function preferredFormat(tmpl: ReportTemplate | undefined): string {
  if (!tmpl?.supportedFormats?.length) return ''
  if (tmpl.hasDocxTemplate && tmpl.supportedFormats.includes('DOCX')) return 'DOCX'
  return tmpl.supportedFormats[0]
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
  const paramFields = paramFieldsForTemplate(selectedTemplate)

  const handleReportTypeChange = (code: string) => {
    const tmpl = reportTemplates.find((t) => t.code === code)
    setForm((p) => ({ ...p, reportType: code, format: preferredFormat(tmpl) }))
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
    if (!form.format) {
      setFormError('Select an output format')
      return
    }
    if (selectedTemplate.requiresFundId && !selectedFundId) {
      setFormError('Select a fund from the portfolio switcher before generating this report')
      return
    }
    if (selectedTemplate.requiresClientId && !form.clientId.trim()) {
      setFormError('This report requires a client mandate ID')
      return
    }
    const parameters: Record<string, string> = {}
    if (paramFields.includes('periodStart') && form.periodStart) {
      parameters.periodStart = format(form.periodStart, 'yyyy-MM-dd')
    }
    if (paramFields.includes('periodEnd') && form.periodEnd) {
      parameters.periodEnd = format(form.periodEnd, 'yyyy-MM-dd')
    }
    if (paramFields.includes('valuationDate') && form.valuationDate) {
      parameters.valuationDate = format(form.valuationDate, 'yyyy-MM-dd')
      parameters.asOf = parameters.valuationDate
    }
    if (paramFields.includes('benchmarkName') && form.benchmarkName.trim()) {
      parameters.benchmarkName = form.benchmarkName.trim()
    }
    if (paramFields.includes('assetManagerName') && form.assetManagerName.trim()) {
      parameters.assetManagerName = form.assetManagerName.trim()
    }

    try {
      const run = await dispatch(
        generateReport({
          fundId: selectedTemplate.requiresFundId ? selectedFundId ?? undefined : undefined,
          clientId: selectedTemplate.requiresClientId ? form.clientId.trim() : undefined,
          reportType: form.reportType,
          format: form.format,
          parameters,
        }),
      ).unwrap()
      toast.success(
        run?.status === 'COMPLETED'
          ? `${selectedTemplate.name} ready to download`
          : `${selectedTemplate.name} queued`,
      )
      setForm(NEW_REPORT_EMPTY)
      setShowGenerate(false)
      dispatch(fetchReports({ fundId: selectedFundId ?? undefined }))
    } catch (err: any) {
      const msg = err.message || 'Failed to generate report'
      setFormError(msg)
      toast.error(msg)
    }
  }

  const handleDownload = async (run: (typeof reportRuns)[number]) => {
    if (!run.downloadAvailable && String(run.status).toUpperCase() !== 'COMPLETED') {
      toast.error('Report is not ready to download yet')
      return
    }
    setDownloadingById((p) => ({ ...p, [run.id]: true }))
    try {
      const blob = await investmentOpsApi.downloadReport(run.id)
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('Empty download response')
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = FORMAT_EXTENSION[String(run.format).toUpperCase()] ?? String(run.format).toLowerCase()
      a.download = `${run.reportTypeName || run.reportType}-${run.id}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to download report')
    } finally {
      setDownloadingById((p) => ({ ...p, [run.id]: false }))
    }
  }

  const completedReports = reportRuns.filter((run) => run.status.toUpperCase() === 'COMPLETED').length
  const processingReports = reportRuns.filter((run) => run.status.toUpperCase() === 'PROCESSING').length

  return (
    <div ref={rootRef} className="min-h-full bg-background p-3 text-foreground dark:bg-[#05090f] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="rounded-[24px] border border-border bg-[linear-gradient(120deg,var(--card),var(--secondary)_58%,var(--background))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.18)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">Portfolio intelligence</p>
              <h1 className="mt-1 text-lg font-semibold">Investment reporting</h1>
              <p className="mt-1 max-w-xl text-[11px] text-muted-foreground">
                Generate Word (DOCX) pack reports from Arcus templates, plus flat PDF/Excel summaries. Yellow authoring
                marks are stripped on download.
              </p>
            </div>
            <div className="flex flex-wrap items-stretch gap-2">
              {[
                ['Available templates', reportTemplates.length],
                ['Generated reports', reportRuns.length],
                ['Completed', completedReports],
                ['Processing', processingReports],
              ].map(([label, value]) => (
                <div key={label} className="min-w-[112px] rounded-2xl border border-border bg-background/60 px-4 py-3">
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                  <p className="mt-1 text-[15px] font-semibold">{reportTemplatesLoading || reportRunsLoading ? '—' : value}</p>
                </div>
              ))}
              <Button className="h-10 self-center rounded-full px-6 text-[11px] shadow-sm" onClick={() => setShowGenerate(true)}>
                <Plus className="h-4 w-4" /> Generate Report
              </Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-border bg-background/60 p-1">
            {scopeTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-4 py-2 text-[10px] font-medium transition',
                  activeTab === tab ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-[12px] font-semibold">Template library</h2>
            <p className="text-[9px] text-muted-foreground">Choose a live API template to prefill a new report request.</p>
          </div>
          {reportTemplatesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-[18px] border border-border bg-card" />
              ))}
            </div>
          ) : visibleTemplates.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleTemplates.map((template) => (
                <button
                  key={template.code}
                  type="button"
                  onClick={() => handlePickTemplate(template.code)}
                  className="group flex min-h-40 flex-col rounded-[18px] border border-border bg-[linear-gradient(145deg,var(--card),var(--secondary))] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-2xl bg-accent p-2.5 text-accent-foreground"><FileText className="h-4 w-4" /></span>
                    <span className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-[9px] text-muted-foreground">{template.scopeType}</span>
                  </div>
                  <p className="mt-4 text-[11px] font-semibold leading-snug">{template.name}</p>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">{template.description}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                    <div className="flex flex-wrap gap-1">
                      {template.supportedFormats.map((reportFormat) => <span key={reportFormat} className="rounded-full bg-muted px-2 py-1 text-[8px] font-medium text-muted-foreground">{reportFormat}</span>)}
                    </div>
                    <span className="text-[9px] font-medium text-primary">{template.hasDocxTemplate ? 'Word template ready' : 'Available'}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border bg-card/50 px-5 py-10 text-center text-[11px] text-muted-foreground">No report templates are available for this scope.</div>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-[24px] border border-border bg-[linear-gradient(135deg,var(--card),var(--secondary))]">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[12px] font-semibold">Report Library</h2>
              <p className="text-[9px] text-muted-foreground">{filteredRuns.length} matching reports · generated files remain available when the API marks them ready</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 min-w-[220px] items-center gap-2 rounded-full border border-input bg-muted px-3">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search reports"
                  className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Popover open={tableScopeComboOpen} onOpenChange={setTableScopeComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={tableScopeComboOpen} className="h-9 w-36 justify-between rounded-full bg-muted text-[10px] font-normal">
                    <span className="truncate">{tableScopeFilter}</span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-0" align="start" container={themeContainer}>
                  <Command>
                    <CommandInput placeholder="Search scope…" />
                    <CommandList>
                      <CommandEmpty>No scopes found.</CommandEmpty>
                      <CommandGroup>
                        {scopeTabs.map((tab) => (
                          <CommandItem key={tab} value={tab} onSelect={() => { setTableScopeFilter(tab); setTableScopeComboOpen(false) }}>
                            <Check className={cn('mr-2 h-4 w-4', tableScopeFilter === tab ? 'opacity-100' : 'opacity-0')} />{tab}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" className="h-9 w-36 bg-muted text-[10px]" allowFutureDates container={themeContainer} />
              <DatePicker value={dateTo} onChange={setDateTo} placeholder="To date" className="h-9 w-36 bg-muted text-[10px]" allowFutureDates container={themeContainer} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="terminal-table w-full min-w-[940px] text-left">
              <thead className="bg-background/45 uppercase tracking-wider">
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
              <tbody className="divide-y divide-border">
                {reportRunsLoading ? (
                  <tr><td colSpan={7} className="p-0"><OpsTableSkeleton rows={8} cols={7} /></td></tr>
                ) : runRows.length > 0 ? runRows.map((run) => (
                  <tr key={run.id}>
                    <td><div><p className="max-w-[230px] truncate font-medium">{run.reportTypeName}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{format(new Date(run.createdAt), 'dd MMM yyyy HH:mm')}</p></div></td>
                    <td><span className="rounded-full bg-muted px-2 py-1 text-[9px] font-medium text-muted-foreground">{run.format}</span></td>
                    <td className="text-muted-foreground">{run.fundName ?? run.clientName ?? 'Firm-wide'}</td>
                    <td className="text-muted-foreground">{run.requestedBy?.name ?? '—'}</td>
                    <td className="whitespace-nowrap text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</td>
                    <td><StatusBadge status={run.status === 'COMPLETED' ? 'completed' : run.status.toLowerCase()} className="rounded-full" /></td>
                    <td>
                      {run.downloadAvailable ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-[9px]" disabled={!!downloadingById[run.id]} onClick={() => handleDownload(run)}>
                          {downloadingById[run.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                          {downloadingById[run.id] ? 'Downloading…' : 'Download'}
                        </Button>
                      ) : <span className="text-[9px] text-muted-foreground">Not available</span>}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="py-10 text-center text-[11px] text-muted-foreground">No reports match the current scope and filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination page={runPage} totalPages={runTotalPages} onPageChange={setRunPage} rowsShown={runRows.length} totalRows={runTotalRows} />
        </section>
      </div>

      {showGenerate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5" onMouseDown={() => setShowGenerate(false)}>
          <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <p className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">New output request</p>
                <h2 className="mt-1 text-sm font-semibold">Generate Report</h2>
                <p className="mt-1 text-[10px] text-muted-foreground">Choose a live template and provide its required generation parameters.</p>
              </div>
              <button type="button" aria-label="Close generate report" onClick={() => setShowGenerate(false)} className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Report Type</label>
                <Popover open={reportTypeComboOpen} onOpenChange={setReportTypeComboOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={reportTypeComboOpen} className="w-full justify-between rounded-full bg-muted text-[10px] font-normal">
                      <span className="truncate">{selectedTemplate?.name ?? 'Select report type…'}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start" container={themeContainer}>
                    <Command>
                      <CommandInput placeholder="Search report type…" />
                      <CommandList>
                        <CommandEmpty>No report types found.</CommandEmpty>
                        <CommandGroup>
                          {reportTemplates.map((template) => (
                            <CommandItem key={template.code} value={template.name} onSelect={() => { handleReportTypeChange(template.code); setReportTypeComboOpen(false) }}>
                              <Check className={cn('mr-2 h-4 w-4', form.reportType === template.code ? 'opacity-100' : 'opacity-0')} />{template.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Format</label>
                <Select value={form.format} onValueChange={(value) => setForm((previous) => ({ ...previous, format: value }))}>
                  <SelectTrigger className="w-full rounded-full border-input bg-muted text-[10px] text-foreground"><SelectValue placeholder="Select format…" /></SelectTrigger>
                  <SelectContent container={themeContainer}>{(selectedTemplate?.supportedFormats ?? []).map((reportFormat) => <SelectItem key={reportFormat} value={reportFormat}>{reportFormat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedTemplate?.requiresFundId && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Fund</label><Input value={fundName(selectedFundId) ?? '—'} disabled readOnly className="rounded-full border-input bg-muted text-[10px] text-foreground" /></div>}
              {selectedTemplate?.requiresClientId && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Client ID</label><Input value={form.clientId} onChange={(event) => setForm((previous) => ({ ...previous, clientId: event.target.value }))} placeholder="Client mandate ID" className="rounded-full border-input bg-muted font-mono text-[10px] text-foreground" /></div>}
              {paramFields.includes('periodStart') && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Period Start</label><DatePicker value={form.periodStart} onChange={(date) => setForm((previous) => ({ ...previous, periodStart: date }))} className="w-full bg-muted text-[10px]" container={themeContainer} /></div>}
              {paramFields.includes('periodEnd') && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Period End</label><DatePicker value={form.periodEnd} onChange={(date) => setForm((previous) => ({ ...previous, periodEnd: date }))} className="w-full bg-muted text-[10px]" container={themeContainer} /></div>}
              {paramFields.includes('valuationDate') && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Valuation Date</label><DatePicker value={form.valuationDate} onChange={(date) => setForm((previous) => ({ ...previous, valuationDate: date }))} className="w-full bg-muted text-[10px]" container={themeContainer} /></div>}
              {paramFields.includes('benchmarkName') && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Benchmark Name</label><Input value={form.benchmarkName} onChange={(event) => setForm((previous) => ({ ...previous, benchmarkName: event.target.value }))} placeholder="e.g. ZSE Industrial Index" className="rounded-full border-input bg-muted text-[10px] text-foreground" /></div>}
              {paramFields.includes('assetManagerName') && <div><label className="mb-1.5 block text-[9px] uppercase tracking-wider text-muted-foreground">Asset Manager Name</label><Input value={form.assetManagerName} onChange={(event) => setForm((previous) => ({ ...previous, assetManagerName: event.target.value }))} placeholder="e.g. Arcus Asset Management" className="rounded-full border-input bg-muted text-[10px] text-foreground" /></div>}
              {paramFields.length === 0 && !selectedTemplate?.requiresFundId && !selectedTemplate?.requiresClientId && <div className="rounded-2xl bg-muted p-4 text-[10px] text-muted-foreground sm:col-span-2 xl:col-span-3">This report type takes no additional parameters.</div>}
            </div>
            {formError && <div className="mx-5 mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-[10px] text-destructive">{formError}</div>}
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button variant="outline" className="rounded-full px-5 text-[10px]" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button className="rounded-full px-6 text-[10px]" onClick={handleGenerate} disabled={reportGenerating}>
                {reportGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{reportGenerating ? 'Generating…' : 'Generate Report'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
