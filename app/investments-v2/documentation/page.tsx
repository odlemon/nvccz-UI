'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Clock3, FileText, History, Search, ShieldCheck, Upload, X } from 'lucide-react'

const categories = ['All documents', 'Trade Confirmations', 'Custodian & Bank', 'Valuation Packs', 'Legal & Compliance', 'Tax & Corporate Actions']
const documents = [
  { id: 'DOC-4928', name: 'MSFT trade confirmation · 17 Jul', category: 'Trade Confirmations', type: 'Trade confirmation', portfolio: 'Equity World', trade: 'TRD-93882', uploadedBy: 'T. Ncube', date: '17 Jul 2026 · 12:44', approval: 'Approved', version: 'v2.1', access: 'Operations + Compliance' },
  { id: 'DOC-4927', name: 'Citi cash statement · USD', category: 'Custodian & Bank', type: 'Custodian statement', portfolio: 'Multi Asset', trade: '—', uploadedBy: 'System intake', date: '17 Jul 2026 · 11:58', approval: 'Approved', version: 'v1.0', access: 'Operations' },
  { id: 'DOC-4926', name: 'Equity World NAV pack', category: 'Valuation Packs', type: 'NAV support pack', portfolio: 'Equity World', trade: 'NAV-0717-06', uploadedBy: 'J. Moyo', date: '17 Jul 2026 · 11:40', approval: 'Pending review', version: 'v3.0', access: 'Operations + Finance' },
  { id: 'DOC-4925', name: 'Asia Select investment mandate', category: 'Legal & Compliance', type: 'Investment mandate', portfolio: 'Asia Select', trade: '—', uploadedBy: 'R. Moyo', date: '16 Jul 2026 · 15:22', approval: 'Approved', version: 'v4.2', access: 'Restricted' },
  { id: 'DOC-4924', name: 'ZIM 8.5 coupon tax certificate', category: 'Tax & Corporate Actions', type: 'Tax certificate', portfolio: 'Fixed Income', trade: 'CA-11872', uploadedBy: 'S. Patel', date: '16 Jul 2026 · 09:18', approval: 'Changes requested', version: 'v1.1', access: 'Operations + Tax' },
  { id: 'DOC-4923', name: 'BNY holdings statement', category: 'Custodian & Bank', type: 'Holdings statement', portfolio: 'Asia Select', trade: 'REC-260717-03', uploadedBy: 'System intake', date: '15 Jul 2026 · 18:02', approval: 'Approved', version: 'v1.0', access: 'Operations' },
]

const auditEvents = [
  ['17 Jul 2026 · 13:08', 'Approval recorded', 'J. Moyo', 'Approved after matching broker reference.'],
  ['17 Jul 2026 · 12:57', 'Version 2.1 uploaded', 'T. Ncube', 'Replaced unsigned confirmation with executed copy.'],
  ['17 Jul 2026 · 12:49', 'Access changed', 'A. Dube', 'Compliance group granted read access.'],
  ['17 Jul 2026 · 12:44', 'Document created', 'T. Ncube', 'Linked to TRD-93882.'],
]

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  return <div ref={ref} className="relative">
    <button type="button" onClick={() => setOpen(!open)} className="flex h-8 min-w-[140px] items-center justify-between gap-3 rounded-full border border-[#354257] bg-[#101927] px-3 text-[10px] text-[#d4dbe5] transition hover:border-[#52637a]">
      <span className="truncate">{value}</span><ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="absolute right-0 z-40 mt-1.5 min-w-full rounded-2xl border border-white/10 bg-[#111a28] p-1.5 shadow-2xl">
      {options.map(option => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }} className={`flex w-full items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-left text-[10px] ${option === value ? 'bg-[#2f87fa] text-white' : 'text-[#9ca9ba] hover:bg-white/[.07]'}`}>{option}{option === value && <Check className="ml-3 h-3 w-3" />}</button>)}
    </div>}
  </div>
}

function Badge({ value }: { value: string }) {
  const tone = value === 'Approved' ? 'bg-emerald-400/10 text-emerald-300' : value === 'Changes requested' ? 'bg-rose-400/10 text-rose-300' : 'bg-amber-400/10 text-amber-300'
  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-medium ${tone}`}>{value}</span>
}

export default function DocumentationPage() {
  const [documentRows, setDocumentRows] = useState(documents)
  const [category, setCategory] = useState('All documents')
  const [portfolio, setPortfolio] = useState('All portfolios')
  const [approval, setApproval] = useState('All approvals')
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [drawer, setDrawer] = useState<(typeof documents)[number] | null>(null)
  const [drawerTab, setDrawerTab] = useState<'versions' | 'access' | 'audit'>('versions')
  const [selectedVersion, setSelectedVersion] = useState('v2.1')
  const [accessChanges, setAccessChanges] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState('')
  const [documentType, setDocumentType] = useState('Trade confirmation')
  const [uploadPortfolio, setUploadPortfolio] = useState('Equity World')
  const [linkedTrade, setLinkedTrade] = useState('')
  const [access, setAccess] = useState('Operations')
  const [uploaded, setUploaded] = useState(false)

  const filtered = useMemo(() => documentRows.filter(document =>
    (category === 'All documents' || document.category === category) &&
    (portfolio === 'All portfolios' || document.portfolio === portfolio) &&
    (approval === 'All approvals' || document.approval === approval) &&
    (!search || `${document.name} ${document.id} ${document.trade} ${document.type}`.toLowerCase().includes(search.toLowerCase()))
  ), [approval, category, documentRows, portfolio, search])

  const submitUpload = () => {
    if (!fileName) return
    setUploaded(true)
    setDocumentRows(current => [{
      id: `DOC-${4923 + current.length}`,
      name: fileName,
      category: documentType === 'Trade confirmation' ? 'Trade Confirmations' : documentType === 'NAV support pack' ? 'Valuation Packs' : 'Legal & Compliance',
      type: documentType,
      portfolio: uploadPortfolio,
      trade: linkedTrade || '—',
      uploadedBy: 'J. Moyo',
      date: '17 Jul 2026 · 14:02',
      approval: 'Pending review',
      version: 'v1.0',
      access,
    }, ...current])
    window.setTimeout(() => { setUploadOpen(false); setUploaded(false); setFileName(''); setLinkedTrade('') }, 700)
  }

  return <main className="min-h-full bg-[#05090f] p-3 text-[#eef2f8] sm:p-5">
    <div className="mx-auto max-w-[1600px] space-y-4">
      <section className="rounded-[24px] border border-white/[.04] bg-[linear-gradient(120deg,#182434,#101a29_58%,#0b1421)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.22)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div><p className="text-[10px] uppercase tracking-[.2em] text-[#738399]">Controlled records</p><h1 className="mt-1 text-lg font-semibold">Investment documentation</h1><p className="mt-1 text-[11px] text-[#8f9caf]">Versioned evidence, approvals and access history for investment operations.</p></div>
          <div className="flex flex-wrap items-stretch gap-2">
            {[['Documents', '1,284'], ['Awaiting approval', '7'], ['Restricted', '18'], ['Added today', '12']].map(([label, value]) => <div key={label} className="min-w-[118px] rounded-2xl border border-white/[.05] bg-[#09111d]/70 px-4 py-3"><p className="text-[9px] text-[#728197]">{label}</p><p className="mt-1 text-[15px] font-semibold">{value}</p></div>)}
            <button type="button" onClick={() => setUploadOpen(true)} className="flex h-10 self-center items-center gap-2 rounded-full bg-[#2f87fa] px-6 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#2277e6]"><Upload className="h-4 w-4" />Upload document</button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-1 rounded-full border border-white/[.05] bg-[#090f18]/70 p-1">
          {categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-[10px] font-medium transition ${category === item ? 'bg-white text-[#101722] shadow' : 'text-[#8e9bad] hover:bg-white/[.06] hover:text-white'}`}>{item}</button>)}
        </div>
      </section>

      <section className="min-w-0 overflow-visible rounded-[24px] border border-white/[.04] bg-[linear-gradient(135deg,#142030,#0c1522)]">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-[12px] font-semibold">Document register</h2><p className="text-[9px] text-[#718096]">{filtered.length} visible records · immutable audit history retained</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 items-center gap-2 rounded-full border border-[#354257] bg-[#101927] px-3"><Search className="h-3 w-3 text-[#718096]" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search documents" className="w-32 bg-transparent text-[10px] outline-none placeholder:text-[#66758a]" /></div>
            <Dropdown value={portfolio} options={['All portfolios', 'Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select']} onChange={setPortfolio} />
            <Dropdown value={approval} options={['All approvals', 'Approved', 'Pending review', 'Changes requested']} onChange={setApproval} />
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-[10px]">
          <thead className="bg-[#08111d]/60 text-[9px] uppercase tracking-wider text-[#66758a]"><tr>{['Document', 'Type', 'Portfolio', 'Linked trade / run', 'Uploaded by', 'Uploaded date', 'Approval', 'Version', 'Access', ''].map(label => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-white/[.045]">{filtered.map(document => <tr key={document.id} onClick={() => setDrawer(document)} className={`cursor-pointer transition hover:bg-white/[.035] ${drawer?.id === document.id ? 'bg-[#2f87fa]/10' : ''}`}>
            <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="rounded-xl bg-[#2f87fa]/10 p-2 text-[#68a9ff]"><FileText className="h-3.5 w-3.5" /></span><div><p className="max-w-[230px] truncate text-[#d9e1eb]">{document.name}</p><p className="mt-1 font-mono text-[9px] text-[#68a9ff]">{document.id}</p></div></div></td>
            <td className="px-4 py-3 text-[#aeb9c7]">{document.type}</td><td className="px-4 py-3">{document.portfolio}</td><td className="px-4 py-3 font-mono text-[#89a7ca]">{document.trade}</td><td className="px-4 py-3 text-[#9eabbc]">{document.uploadedBy}</td><td className="px-4 py-3 text-[#7f8da1]">{document.date}</td><td className="px-4 py-3"><Badge value={document.approval} /></td><td className="px-4 py-3 font-mono">{document.version}</td><td className="px-4 py-3 text-[#9eabbc]">{document.access}</td><td className="px-4 py-3"><button type="button" onClick={event => { event.stopPropagation(); setDrawer(document); setDrawerTab('audit') }} className="rounded-full border border-white/10 p-2 hover:bg-white/10"><History className="h-3 w-3" /></button></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>

    {uploadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setUploadOpen(false)}>
      <div onMouseDown={event => event.stopPropagation()} className="w-full max-w-2xl rounded-[24px] border border-white/10 bg-[#111a28] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[.07] p-5"><div><h2 className="text-sm font-semibold">Upload controlled document</h2><p className="mt-1 text-[10px] text-[#7890ad]">The prototype stores the selected filename locally only.</p></div><button type="button" onClick={() => setUploadOpen(false)} className="rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-2 block text-[10px] text-[#a9b5c4]">Local file <span className="text-rose-300">*</span></span><div className="relative flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-[#46566d] bg-[#0b1420] p-4 text-center text-[10px] text-[#8290a4] hover:border-[#2f87fa]"><input type="file" onChange={event => setFileName(event.target.files?.[0]?.name || '')} className="absolute inset-0 cursor-pointer opacity-0" /><div><Upload className="mx-auto mb-2 h-4 w-4 text-[#68a9ff]" />{fileName || 'Choose a file from this device'}</div></div></label>
          <label><span className="mb-2 block text-[10px]">Document type</span><Dropdown value={documentType} options={['Trade confirmation', 'Custodian statement', 'NAV support pack', 'Investment mandate', 'Tax certificate', 'Corporate action notice']} onChange={setDocumentType} /></label>
          <label><span className="mb-2 block text-[10px]">Portfolio</span><Dropdown value={uploadPortfolio} options={['Equity World', 'Multi Asset', 'Fixed Income', 'Asia Select']} onChange={setUploadPortfolio} /></label>
          <label><span className="mb-2 block text-[10px]">Linked trade / run</span><input value={linkedTrade} onChange={event => setLinkedTrade(event.target.value)} placeholder="TRD-, NAV-, REC-…" className="h-9 w-full rounded-full border border-[#354257] bg-[#101927] px-4 text-[10px] outline-none focus:border-[#2f87fa]" /></label>
          <label><span className="mb-2 block text-[10px]">Access policy</span><Dropdown value={access} options={['Operations', 'Operations + Compliance', 'Operations + Finance', 'Restricted']} onChange={setAccess} /></label>
          <div className="sm:col-span-2 grid grid-cols-3 gap-2 rounded-2xl bg-[#09111d] p-4 text-[10px]"><div><span className="text-[#6f7e92]">Uploaded by</span><p className="mt-1">J. Moyo (you)</p></div><div><span className="text-[#6f7e92]">Version</span><p className="mt-1">v1.0</p></div><div><span className="text-[#6f7e92]">Approval</span><p className="mt-1">Pending review</p></div></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[.07] p-4"><button type="button" onClick={() => setUploadOpen(false)} className="rounded-full border border-white/10 px-4 py-2 text-[10px]">Cancel</button><button type="button" disabled={!fileName} onClick={submitUpload} className="flex items-center gap-2 rounded-full bg-[#2f87fa] px-5 py-2 text-[10px] font-semibold disabled:opacity-40">{uploaded ? <Check className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}{uploaded ? 'Added locally' : 'Add document'}</button></div>
      </div>
    </div>}

    {drawer && <div className="fixed inset-0 z-50 bg-black/45" onMouseDown={() => setDrawer(null)}>
      <aside onMouseDown={event => event.stopPropagation()} className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto border-l border-white/10 bg-[#0e1724] p-5 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] text-[#68a9ff]">{drawer.id}</p><h2 className="mt-1 text-sm font-semibold">{drawer.name}</h2><p className="mt-1 text-[10px] text-[#7f8da1]">{drawer.type} · {drawer.portfolio}</p></div><button type="button" onClick={() => setDrawer(null)} className="rounded-full p-2 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
        <div className="mt-5 flex gap-1 rounded-full bg-[#08111d] p-1">{(['versions', 'access', 'audit'] as const).map(item => <button key={item} onClick={() => setDrawerTab(item)} className={`flex-1 rounded-full py-2 text-[10px] capitalize ${drawerTab === item ? 'bg-white text-[#111827]' : 'text-[#8d9aae]'}`}>{item === 'versions' ? 'Version history' : item === 'access' ? 'Access control' : 'Audit trail'}</button>)}</div>
        {drawerTab === 'versions' ? <div className="mt-5 space-y-3">
          {[['v2.1', 'Current approved version', 'T. Ncube · 17 Jul 12:57', true], ['v2.0', 'Executed broker copy', 'T. Ncube · 17 Jul 12:46', false], ['v1.0', 'Initial ingestion', 'System intake · 17 Jul 12:44', false]].map(([version, note, by, current]) => <button type="button" onClick={() => setSelectedVersion(version as string)} key={version as string} className={`w-full rounded-full border p-4 text-left transition hover:border-white/20 ${selectedVersion === version ? 'border-[#2f87fa]/50 bg-[#2f87fa]/10' : 'border-white/[.06] bg-[#09111d]'}`}><div className="flex justify-between"><span className="font-mono text-[11px] text-[#dce5ef]">{version}</span>{current && <Badge value="Approved" />}</div><p className="mt-2 text-[10px] text-[#a8b4c3]">{note}</p><p className="mt-1 text-[9px] text-[#69788c]">{by}</p>{selectedVersion === version && <p className="mt-3 border-t border-white/[.06] pt-3 text-[9px] text-[#68a9ff]">Selected for preview · checksum and immutable metadata verified</p>}</button>)}
        </div> : drawerTab === 'access' ? <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-white/[.06] bg-[#09111d] p-4 text-[10px]"><p className="text-[#718096]">Current access policy</p><p className="mt-2 font-medium text-[#dbe4ee]">{accessChanges[drawer.id] || drawer.access}</p><p className="mt-2 text-[9px] text-[#718096]">Owner: Investment Operations · inheritance disabled · download activity audited</p></div>
          <label className="block"><span className="mb-2 block text-[10px] text-[#a9b5c4]">Change access</span><Dropdown value={accessChanges[drawer.id] || drawer.access} options={['Operations', 'Operations + Compliance', 'Operations + Finance', 'Operations + Tax', 'Restricted']} onChange={value => setAccessChanges(current => ({ ...current, [drawer.id]: value }))} /></label>
          <div className="grid grid-cols-2 gap-2">{[['Operations', 'View · download'], ['Compliance', (accessChanges[drawer.id] || drawer.access).includes('Compliance') ? 'View · download' : 'No access'], ['Finance', (accessChanges[drawer.id] || drawer.access).includes('Finance') ? 'View' : 'No access'], ['External users', 'No access']].map(([group, permission]) => <div key={group} className="rounded-2xl border border-white/[.05] bg-[#0b1420] p-3 text-[9px]"><p className="text-[#d4dce7]">{group}</p><p className="mt-1 text-[#718096]">{permission}</p></div>)}</div>
          <button type="button" onClick={() => setDrawerTab('audit')} className="h-9 w-full rounded-full bg-[#2f87fa] text-[10px] font-semibold">Save access and view audit</button>
        </div> : <div className="mt-5 space-y-0">{auditEvents.map(([at, action, user, note], index) => <div key={at} className="relative flex gap-3 pb-5"><div className="relative z-10 mt-0.5 rounded-full bg-[#17263a] p-2 text-[#68a9ff]"><Clock3 className="h-3 w-3" /></div>{index < auditEvents.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-24px)] w-px bg-white/10" />}<div><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-medium">{action}</p><span className="text-[9px] text-[#65758a]">{at}</span></div><p className="mt-1 text-[9px] text-[#8290a4]">{user} · {note}</p></div></div>)}</div>}
        <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-[10px] text-emerald-300"><ShieldCheck className="mr-2 inline h-3.5 w-3.5" />Audit history is append-only and includes access, approval and version events.</div>
      </aside>
    </div>}
  </main>
}
