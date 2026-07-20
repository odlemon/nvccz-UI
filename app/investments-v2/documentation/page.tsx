'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Download, FileText, History, Loader2, Search, ShieldCheck, Upload, X } from 'lucide-react'
import { OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { createDocument, fetchDocuments, fetchPortfolios } from '@/lib/store/slices/investmentOpsSlice'
import { formatOpsError, investmentOpsApi, type OpsDocument } from '@/lib/api/investment-ops-api'

function bufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const categories = ['All documents', 'Trade Confirmations', 'Custodian & Bank', 'Valuation Packs', 'Legal & Compliance', 'Tax & Corporate Actions']

function categoryForType(documentType: string) {
  const t = documentType.toUpperCase()
  if (t.includes('TRADE')) return 'Trade Confirmations'
  if (t.includes('CUSTODIAN') || t.includes('BANK') || t.includes('HOLDINGS')) return 'Custodian & Bank'
  if (t.includes('NAV') || t.includes('VALUATION')) return 'Valuation Packs'
  if (t.includes('TAX') || t.includes('CORPORATE')) return 'Tax & Corporate Actions'
  if (t.includes('MANDATE') || t.includes('LEGAL') || t.includes('COMPLIANCE')) return 'Legal & Compliance'
  return 'All documents'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatApproval(status: string) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex h-8 min-w-[140px] items-center justify-between gap-3 rounded-full border border-[#354257] bg-[#101927] px-3 text-[10px] text-[#d4dbe5] transition hover:border-[#52637a]">
        <span className="truncate">{value}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1.5 min-w-full rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] ${option === value ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[.07]'}`}
            >
              {option}
              {option === value && <Check className="ml-3 h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Badge({ value }: { value: string }) {
  const upper = value.toUpperCase()
  const tone = upper.includes('APPROVED') && !upper.includes('PENDING')
    ? 'bg-emerald-400/10 text-emerald-300'
    : upper.includes('REJECT') || upper.includes('CHANGE')
      ? 'bg-rose-400/10 text-rose-300'
      : 'bg-amber-400/10 text-amber-300'
  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-medium ${tone}`}>{formatApproval(value)}</span>
}

export default function DocumentationPage() {
  const dispatch = useAppDispatch()
  const { portfolios, documents, documentsLoading, documentCreating } = useAppSelector((s) => s.investmentOps)

  const [category, setCategory] = useState('All documents')
  const [portfolio, setPortfolio] = useState('All portfolios')
  const [approval, setApproval] = useState('All approvals')
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [drawer, setDrawer] = useState<OpsDocument | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [documentType, setDocumentType] = useState('TRADE_CONFIRMATION')
  const [uploadFundId, setUploadFundId] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const selectedFundId = useMemo(() => {
    if (portfolio === 'All portfolios') return undefined
    return portfolios.find((p) => p.name === portfolio)?.id
  }, [portfolio, portfolios])

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    Promise.all([
      dispatch(fetchPortfolios()),
      dispatch(fetchDocuments({ fundId: selectedFundId })),
    ]).then((results) => {
      if (cancelled) return
      if (results.some((r) => r.meta.requestStatus === 'rejected')) {
        setLoadError('Unable to load documents from the server.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch, selectedFundId])

  useEffect(() => {
    if (!uploadFundId && portfolios[0]?.id) setUploadFundId(portfolios[0].id)
  }, [portfolios, uploadFundId])

  const fundName = (id: string) => portfolios.find((p) => p.id === id)?.name ?? id

  const filtered = useMemo(() => {
    return documents.filter((document) => {
      const cat = categoryForType(document.documentType)
      if (category !== 'All documents' && cat !== category) return false
      if (approval !== 'All approvals' && formatApproval(document.approvalStatus) !== approval) return false
      if (!search) return true
      const hay = `${document.title} ${document.id} ${document.documentType} ${document.tradeId || ''} ${document.orderId || ''}`.toLowerCase()
      return hay.includes(search.toLowerCase())
    })
  }, [approval, category, documents, search])

  const pendingCount = documents.filter((d) => d.approvalStatus?.toUpperCase().includes('PENDING')).length

  const approvalOptions = useMemo(() => {
    const fromApi = Array.from(new Set(documents.map((d) => formatApproval(d.approvalStatus))))
    return ['All approvals', ...fromApi]
  }, [documents])

  const submitUpload = async () => {
    if (!selectedFile || !uploadFundId) return
    setUploadError(null)
    setUploading(true)
    try {
      const buffer = await selectedFile.arrayBuffer()
      const contentBase64 = bufferToBase64(buffer)
      const checksumSha256 = await sha256Hex(buffer)
      const uploadRes = await investmentOpsApi.uploadBinaryFile({
        fundId: uploadFundId,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        contentBase64,
        byteSize: selectedFile.size,
        checksumSha256,
      })
      if (!uploadRes.success || !uploadRes.data?.fileId) {
        throw new Error(formatOpsError(uploadRes))
      }
      await dispatch(
        createDocument({
          fundId: uploadFundId,
          documentType,
          title: selectedFile.name,
          fileId: uploadRes.data.fileId,
        }),
      ).unwrap()
      setUploadOpen(false)
      setSelectedFile(null)
      dispatch(fetchDocuments({ fundId: selectedFundId }))
    } catch (e) {
      setUploadError(formatOpsError(e))
    } finally {
      setUploading(false)
    }
  }

  const downloadDoc = async (doc: OpsDocument) => {
    setDownloadError(null)
    setDownloadingId(doc.id)
    try {
      const blob = await investmentOpsApi.downloadDocument(doc.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = doc.title || `${doc.id}.bin`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setDownloadError(formatOpsError(e, 'Failed to download document'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(120deg,#182434,#101a29_58%,#0b1421)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Controlled records</p>
              <h1 className="mt-1 text-lg font-semibold">Investment documentation</h1>
              <p className="mt-1 text-[11px] text-[#8f9caf]">Versioned evidence, approvals and access history for investment operations.</p>
            </div>
            <div className="flex flex-wrap items-stretch gap-2">
              {[
                ['Documents', String(documents.length)],
                ['Awaiting approval', String(pendingCount)],
                ['Portfolios', String(portfolios.length)],
                ['Types', String(new Set(documents.map((d) => d.documentType)).size)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-[118px] rounded-2xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3">
                  <p className="text-[9px] text-[#728197]">{label}</p>
                  <p className="mt-1 text-[15px] font-semibold">{value}</p>
                </div>
              ))}
              <button type="button" onClick={() => setUploadOpen(true)} className="flex h-10 self-center items-center gap-2 rounded-full bg-[#2f87fa] px-6 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#2277e6]">
                <Upload className="h-4 w-4" />
                Upload document
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-white/[.05] bg-[#090f18]/70 p-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${category === item ? 'bg-white text-[#101722] shadow' : 'text-[#8e9bad] hover:bg-white/[.06] hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {loadError && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{loadError}</div>}

        <section className="min-w-0 overflow-visible rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
          <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[12px] font-semibold">Document register</h2>
              <p className="text-[9px] text-[#718096]">{filtered.length} visible records</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 items-center gap-2 rounded-full border border-[#354257] bg-[#101927] px-3">
                <Search className="h-3 w-3 text-[#718096]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" className="w-32 bg-transparent text-[10px] outline-none placeholder:text-[#66758a]" />
              </div>
              <Dropdown value={portfolio} options={['All portfolios', ...portfolios.map((p) => p.name)]} onChange={setPortfolio} />
              <Dropdown value={approval} options={approvalOptions} onChange={setApproval} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-[10px]">
              <thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]">
                <tr>
                  {['Document', 'Type', 'Portfolio', 'Linked trade / run', 'Uploaded by', 'Uploaded date', 'Approval', 'Version', 'Access', ''].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.045]">
                {documentsLoading ? (
                  <tr>
                    <td colSpan={10} className="p-0">
                      <OpsTableSkeleton rows={7} cols={10} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-[#8290a4]">
                      No documents returned by the API.
                    </td>
                  </tr>
                ) : (
                  filtered.map((document) => (
                    <tr
                      key={document.id}
                      onClick={() => setDrawer(document)}
                      className={`cursor-pointer transition hover:bg-white/[.035] ${drawer?.id === document.id ? 'bg-[#2f87fa]/10' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl bg-[#2f87fa]/10 p-2 text-[#68a9ff]">
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="max-w-[230px] truncate text-[#d9e1eb]">{document.title}</p>
                            <p className="mt-1 font-mono text-[9px] text-[#68a9ff]">{document.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#aeb9c7]">{document.documentType}</td>
                      <td className="px-4 py-3">{fundName(document.fundId)}</td>
                      <td className="px-4 py-3 font-mono text-[#89a7ca]">{document.tradeId || document.orderId || '—'}</td>
                      <td className="px-4 py-3 text-[#9eabbc]">{document.uploadedById || '—'}</td>
                      <td className="px-4 py-3 text-[#7f8da1]">{formatDate(document.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Badge value={document.approvalStatus} />
                      </td>
                      <td className="px-4 py-3 font-mono">v{document.versionNo}</td>
                      <td className="px-4 py-3 text-[#9eabbc]">—</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Download"
                            disabled={downloadingId === document.id}
                            onClick={(event) => {
                              event.stopPropagation()
                              void downloadDoc(document)
                            }}
                            className="rounded-full border border-white/10 p-2 hover:bg-white/10 disabled:opacity-40"
                          >
                            {downloadingId === document.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDrawer(document)
                            }}
                            className="rounded-full border border-white/10 p-2 hover:bg-white/10"
                          >
                            <History className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setUploadOpen(false)}>
          <div onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-2xl rounded-[24px] border border-white/10 bg-[#111a28] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[.07] p-5">
              <div>
                <h2 className="text-sm font-semibold">Upload controlled document</h2>
                <p className="mt-1 text-[10px] text-[#7890ad]">Uploads file bytes via the files API, then creates a document record linked by fileId.</p>
              </div>
              <button type="button" onClick={() => setUploadOpen(false)} className="rounded-full p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-[10px] text-[#a9b5c4]">
                  Local file <span className="text-rose-300">*</span>
                </span>
                <div className="relative flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-[#46566d] bg-[#0b1420] p-4 text-center text-[10px] text-[#8290a4] hover:border-[#2f87fa]">
                  <input
                    type="file"
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] ?? null)
                      setUploadError(null)
                    }}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div>
                    <Upload className="mx-auto mb-2 h-4 w-4 text-[#68a9ff]" />
                    {selectedFile?.name || 'Choose a file from this device'}
                  </div>
                </div>
              </label>
              <label>
                <span className="mb-2 block text-[10px]">Document type</span>
                <Dropdown
                  value={documentType}
                  options={['TRADE_CONFIRMATION', 'CUSTODIAN_STATEMENT', 'NAV_SUPPORT_PACK', 'INVESTMENT_MANDATE', 'TAX_CERTIFICATE', 'CORPORATE_ACTION_NOTICE']}
                  onChange={setDocumentType}
                />
              </label>
              <label>
                <span className="mb-2 block text-[10px]">Portfolio</span>
                <Dropdown
                  value={portfolios.find((p) => p.id === uploadFundId)?.name || 'Select portfolio'}
                  options={portfolios.map((p) => p.name)}
                  onChange={(name) => {
                    const found = portfolios.find((p) => p.name === name)
                    if (found) setUploadFundId(found.id)
                  }}
                />
              </label>
              {uploadError && <div className="sm:col-span-2 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] p-3 text-[10px] text-rose-200">{uploadError}</div>}
            </div>
            <div className="flex justify-end gap-2 border-t border-white/[.07] p-4">
              <button type="button" onClick={() => setUploadOpen(false)} className="rounded-full border border-white/10 px-4 py-2 text-[10px]">
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || !uploadFundId || documentCreating || uploading}
                onClick={submitUpload}
                className="flex items-center gap-2 rounded-full bg-[#2f87fa] px-5 py-2 text-[10px] font-semibold disabled:opacity-40"
              >
                {documentCreating || uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? 'Uploading…' : documentCreating ? 'Creating…' : 'Create document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/45" onMouseDown={() => setDrawer(null)}>
          <aside onMouseDown={(event) => event.stopPropagation()} className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#0e1724] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] text-[#68a9ff]">{drawer.id}</p>
                <h2 className="mt-1 text-sm font-semibold">{drawer.title}</h2>
                <p className="mt-1 text-[10px] text-[#7f8da1]">
                  {drawer.documentType} · {fundName(drawer.fundId)}
                </p>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="rounded-full p-2 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-white/[.06] bg-[#09111d] p-4 text-[10px] text-[#a8b4c3]">
              <p>
                Approval: <Badge value={drawer.approvalStatus} />
              </p>
              <p>Version: v{drawer.versionNo}</p>
              <p>File ref: {drawer.fileRef || '—'}</p>
              <p>Created: {formatDate(drawer.createdAt)}</p>
              <p>Uploaded by: {drawer.uploadedById || '—'}</p>
            </div>
            {downloadError && (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] p-3 text-[10px] text-rose-200">{downloadError}</div>
            )}
            <button
              type="button"
              disabled={downloadingId === drawer.id}
              onClick={() => void downloadDoc(drawer)}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2f87fa] text-[10px] font-semibold text-white disabled:opacity-40"
            >
              {downloadingId === drawer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {downloadingId === drawer.id ? 'Downloading…' : 'Download file'}
            </button>
            <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-[10px] text-amber-100">
              Version history and access-control endpoints exist in OpenAPI but are not wired in this drawer yet. Download uses `GET /documents/:id/download`.
            </div>
            <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-[10px] text-emerald-300">
              <ShieldCheck className="mr-2 inline h-3.5 w-3.5" />
              Document list and download are live from `/documents`.
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
