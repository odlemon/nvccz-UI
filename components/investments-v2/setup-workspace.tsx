'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Check, ChevronDown, CircleAlert, CircleCheck, CircleX, GripVertical, Loader2,
  MessageCircle, Pencil, Plus, RefreshCw, Search, TriangleAlert, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchBrokers,
  fetchCustodians,
  fetchCommissions,
  fetchMarkets,
  fetchSetupCurrencies,
  fetchCountries,
  fetchIssuers,
  fetchPriceSources,
  fetchSetupSettings,
  createBroker,
  createCustodian,
  createCommission,
  createMarket,
  createSetupCurrency,
  createCountry,
  createIssuer,
} from '@/lib/store/slices/investmentOpsSlice'

export const cardClass = 'overflow-hidden rounded-[24px] border border-white/[0.05] bg-[linear-gradient(112deg,#172231_0%,#101a29_55%,#0c1522_100%)] shadow-[0_18px_45px_rgba(0,0,0,.18)]'
export const fieldClass = 'h-9 w-full rounded-full border border-white/10 bg-[#0b1421] px-3 text-[11px] text-white outline-none transition placeholder:text-[#526176] focus:border-[#2f87fa] focus:ring-2 focus:ring-[#2f87fa]/20'
export const buttonClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-5 text-[11px] font-semibold text-[#111722] transition hover:bg-[#edf2f8] disabled:opacity-50'
export const secondaryButtonClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 text-[11px] font-medium text-[#b8c3d2] transition hover:bg-white/[0.08] hover:text-white'

export function SetupHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><h1 className="text-[15px] font-semibold text-white">{title}</h1><p className="mt-1 text-[10px] text-[#718095]">{description}</p></div>
      {action}
    </div>
  )
}

export function SetupCard({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(cardClass, className)}>
      <header className="flex min-h-[46px] items-center justify-between border-b border-white/[0.08] px-5">
        <h2 className="text-[12px] font-medium text-white">{title}</h2>{action}
      </header>
      {children}
    </section>
  )
}

export function SetupSelect({ value, options, onChange, label }: { value: string; options: string[]; onChange: (value: string) => void; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      {label && <span className="mb-1.5 block text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</span>}
      <button type="button" onClick={() => setOpen(!open)} className={cn(fieldClass, 'flex items-center justify-between text-left')}>
        <span className="truncate">{value}</span><ChevronDown className="h-3.5 w-3.5 text-[#718095]" />
      </button>
      {open && <><button aria-label="Close options" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#111b29] p-1.5 shadow-2xl">
          {options.map(option => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }}
            className={cn('flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-[11px] hover:bg-white/[0.07]', option === value ? 'text-[#69a9ff]' : 'text-[#bdc7d5]')}>
            {option}{option === value && <Check className="h-3.5 w-3.5" />}
          </button>)}
        </div></>}
    </div>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
    className={cn('relative h-5 w-9 rounded-full transition', checked ? 'bg-[#2f87fa]' : 'bg-[#344155]')}>
    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
  </button>
}

export function SetupModal({ title, description, children, onClose, onSubmit, submitLabel = 'Save' }: {
  title: string; description?: string; children: ReactNode; onClose: () => void; onSubmit: () => void; submitLabel?: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className="w-full max-w-lg rounded-[24px] border border-white/10 bg-[#111b29] p-5 shadow-[0_28px_90px_rgba(0,0,0,.65)]">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="text-sm font-semibold text-white">{title}</h2>{description && <p className="mt-1 text-[10px] text-[#76859a]">{description}</p>}</div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#8391a4] hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button><button type="button" onClick={onSubmit} className={buttonClass}>{submitLabel}</button></div>
      </div>
    </div>
  )
}

const tabs = ['Order Setup', 'Setup', 'Broker/Counterparties', 'Commissions', 'Countries', 'Currencies', 'Instrument Types', 'Issuer', 'Markets']
const LIVE_REFERENCE_TABS = new Set(['Broker/Counterparties', 'Commissions', 'Countries', 'Currencies', 'Issuer', 'Markets'])
const referenceData: Record<string, { columns: string[]; rows: string[][] }> = {
  'Broker/Counterparties': { columns: ['Name', 'Type', 'Contact', 'Delivery', 'Status'], rows: [] },
  Commissions: { columns: ['Id', 'Counterparty', 'Instrument', 'Rate (bps)', 'Flat fee', 'Status'], rows: [] },
  Countries: { columns: ['Code', 'Country', 'Region', 'Status'], rows: [] },
  Currencies: { columns: ['Code', 'Currency', 'Symbol', 'Decimals', 'Default', 'Status'], rows: [] },
  Issuer: { columns: ['Code', 'Legal name', 'Country', 'Sector', 'Status'], rows: [] },
  Markets: { columns: ['Code', 'Market', 'Country', 'Exchange', 'Status'], rows: [] },
}

const corporateRows = ['Dividend Code (without currency)', 'Dividend ex prefix for comment', 'Dividend pay prefix for comment', 'Coupon Code (without currency)', 'Coupon payment prefix comment', 'Cash account code (without currency)']
const tags = [['Tag 0 Headline', 'Country'], ['Tag 1 Headline', 'Company'], ['Tag 2 Headline', 'Government'], ['Tag 3 Headline', 'OECD'], ['Tag 4 Headline', 'EU'], ['Tag 5 Headline', 'EEA'], ['Position Tag 1', 'Credit Institution'], ['Position Tag 2', 'Precious Metal'], ['Position Tag 3', 'Real Estate Exposure']]
const initialCategories = ['Equity', 'Fund', 'Cash', 'ETF', 'Options', 'FX/Forwards', 'Futures', 'CFD', 'Certificate', 'Commodity', 'Bond']
const initialInstruments = [
  ['A', 'Equity', 'Equity', 'Equity', 'v, p, t', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX'],
  ['A01', 'Preferred', 'Preferred', '—', 'v, f, d, p, t', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = COMMON STOCK'],
  ['A02', 'ADR', 'ADR', '—', '—', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = PREFERRED'],
  ['A03', 'GDR', 'GDR', '—', '—', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = ADR'],
  ['A04', 'EDR', 'EDR', '—', '—', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = EDR'],
  ['A05', 'Coupon', 'Coupon', '—', '—', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = MLP'],
  ['A06', 'MLP', 'MLP', '—', '—', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = REIT'],
  ['A07', 'REITs', 'REITs', '—', '—', 'BPIPE_REFERENCE_SECURITY', 'SECURITY_TYP = PREFERRED'],
]

function StatusIcon({ name }: { name: string }) {
  const p = { className: 'h-4 w-4', strokeWidth: 1.5 }
  if (name === 'Error') return <CircleAlert {...p} />
  if (name === 'Not Found') return <Search {...p} />
  if (name === 'OK') return <CircleCheck {...p} />
  if (name === 'OK but Old') return <RefreshCw {...p} />
  if (name === 'Not OK') return <CircleX {...p} />
  if (name === 'Warnings') return <TriangleAlert {...p} />
  return <MessageCircle {...p} />
}

export function ModuleSetupWorkspace({ orderSetupContent }: { orderSetupContent: ReactNode }) {
  const dispatch = useAppDispatch()
  const {
    brokers,
    brokersLoading,
    custodians,
    custodiansLoading,
    commissions,
    commissionsLoading,
    markets,
    marketsLoading,
    setupCurrencies,
    setupCurrenciesLoading,
    countries,
    countriesLoading,
    issuers,
    issuersLoading,
    priceSources,
    priceSourcesLoading,
    setupSettings,
    setupSettingsLoading,
  } = useAppSelector((s) => s.investmentOps)

  const [activeTab, setActiveTab] = useState('Order Setup')
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'reference' | 'type' | 'subcategory' | null>(null)
  const [referenceKind, setReferenceKind] = useState<'coupon' | 'icon' | null>(null)
  const [draft, setDraft] = useState({ code: '', name: '', extra: '' })
  const [categories, setCategories] = useState(initialCategories)
  const [category, setCategory] = useState('Equity')
  const [instruments, setInstruments] = useState(initialInstruments)
  const [couponRows, setCouponRows] = useState([['Monthly', '12', '12'], ['Quarterly', '4', '4'], ['Half Year', '2', '2'], ['Yearly', '1', '1']])
  const [iconNames, setIconNames] = useState(['Error', 'Not Found', 'OK', 'OK but Old', 'Undefined', 'Not OK', 'Approved', 'Warnings'])
  const [setupLoadError, setSetupLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSetupLoadError(null)
    Promise.all([
      dispatch(fetchBrokers()),
      dispatch(fetchCustodians()),
      dispatch(fetchCommissions()),
      dispatch(fetchMarkets()),
      dispatch(fetchSetupCurrencies()),
      dispatch(fetchCountries()),
      dispatch(fetchIssuers({})),
      dispatch(fetchPriceSources()),
      dispatch(fetchSetupSettings()),
    ]).then((results) => {
      if (cancelled) return
      if (results.some((r) => r.meta.requestStatus === 'rejected')) {
        setSetupLoadError('Unable to load setup reference data from the server.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const liveBrokerRows = useMemo(() => {
    const brokerRows = brokers.map((b) => [
      b.name || b.id || '—',
      b.profileType || 'BROKER',
      b.contactEmail || '—',
      b.deliveryMode || '—',
      b.isActive === false ? 'Inactive' : 'Active',
    ])
    const custodianRows = custodians.map((c) => [
      c.name || c.id || '—',
      c.profileType || 'CUSTODIAN',
      c.contactEmail || '—',
      c.deliveryMode || '—',
      c.isActive === false ? 'Inactive' : 'Active',
    ])
    return [...brokerRows, ...custodianRows]
  }, [brokers, custodians])

  const liveCommissionRows = useMemo(() => {
    const nameOf = (id: string) =>
      brokers.find((b) => b.id === id)?.name ||
      custodians.find((c) => c.id === id)?.name ||
      id
    return commissions.map((c) => [
      c.id || '—',
      nameOf(c.stakeholderProfileId),
      c.instrumentTypeCode || 'All',
      String(c.rateBps ?? '—'),
      c.flatFee || '—',
      c.isActive === false ? 'Inactive' : 'Active',
    ])
  }, [commissions, brokers, custodians])

  const liveCountryRows = useMemo(
    () =>
      countries.map((c) => [
        c.countryCode || '—',
        c.countryName || '—',
        c.region || '—',
        c.isActive === false ? 'Inactive' : 'Active',
      ]),
    [countries],
  )

  const liveCurrencyRows = useMemo(
    () =>
      setupCurrencies.map((c) => [
        c.code || '—',
        c.name || '—',
        c.symbol || '—',
        '—',
        c.isDefault ? 'Yes' : 'No',
        c.isActive === false ? 'Inactive' : 'Active',
      ]),
    [setupCurrencies],
  )

  const liveIssuerRows = useMemo(
    () =>
      issuers.map((i) => [
        i.issuerCode || '—',
        i.legalName || '—',
        i.countryCode || '—',
        i.sector || '—',
        i.isActive === false ? 'Inactive' : 'Active',
      ]),
    [issuers],
  )

  const liveMarketRows = useMemo(
    () =>
      markets.map((m) => [
        m.marketCode || '—',
        m.marketName || '—',
        m.countryCode || '—',
        m.exchangeCode || '—',
        m.isActive === false ? 'Inactive' : 'Active',
      ]),
    [markets],
  )

  const settingsRows = useMemo(() => {
    if (!setupSettings) return [] as [string, string][]
    return Object.entries(setupSettings).map(([key, value]) => {
      const display =
        value == null
          ? '—'
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value)
      return [key.replace(/_/g, ' '), display] as [string, string]
    })
  }, [setupSettings])

  const data = referenceData[activeTab]
  const liveRows =
    activeTab === 'Broker/Counterparties'
      ? liveBrokerRows
      : activeTab === 'Commissions'
        ? liveCommissionRows
        : activeTab === 'Countries'
          ? liveCountryRows
          : activeTab === 'Currencies'
            ? liveCurrencyRows
            : activeTab === 'Issuer'
              ? liveIssuerRows
              : activeTab === 'Markets'
                ? liveMarketRows
                : []
  const filtered = useMemo(
    () => liveRows.filter((row) => row.join(' ').toLowerCase().includes(search.toLowerCase())),
    [liveRows, search],
  )
  const liveTabLoading =
    (activeTab === 'Broker/Counterparties' && (brokersLoading || custodiansLoading)) ||
    (activeTab === 'Commissions' && commissionsLoading) ||
    (activeTab === 'Countries' && countriesLoading) ||
    (activeTab === 'Currencies' && setupCurrenciesLoading) ||
    (activeTab === 'Issuer' && issuersLoading) ||
    (activeTab === 'Markets' && marketsLoading)

  const editAction = (key: string) => <button type="button" onClick={() => setEditing(editing === key ? null : key)} className="rounded-full p-2 text-[#73aef6] hover:bg-white/10 hover:text-white">{editing === key ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}</button>
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#05090f]">
      <SetupHeader title="Investment Setup" description="Module-wide reference data, pricing and instrument configuration" />
      <div className="flex shrink-0 overflow-x-auto border-b border-white/[0.08]">
        {tabs.map(tab => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setSearch('') }} className={cn('shrink-0 rounded-full px-4 py-3 text-[11px] font-medium transition focus:outline-none focus-visible:bg-white/[0.08]', activeTab === tab ? 'bg-white/[0.05] text-white' : 'text-[#64748b] hover:bg-white/[0.03] hover:text-[#a9b5c5]')}>{tab}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4 sm:px-5">
        {setupLoadError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{setupLoadError}</div>}
        {activeTab === 'Order Setup' && orderSetupContent}

        {activeTab === 'Setup' && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SetupCard title="Price API">
            <div className="space-y-2.5 p-5 text-[11px] text-[#8290a4]">
              {priceSourcesLoading ? (
                <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading price sources…</div>
              ) : priceSources.length === 0 ? (
                <p>No price sources returned by the API (empty stub or unset).</p>
              ) : (
                priceSources.map((src) => (
                  <div key={src.sourceCode} className="flex items-center justify-between gap-2 rounded-xl border border-white/[.06] bg-[#09111d] px-3 py-2">
                    <span className="text-[#d4dce7]">{src.displayName || src.sourceCode}</span>
                    <span className={src.isEnabled ? 'text-emerald-300' : 'text-amber-300'}>{src.apiStatus || (src.isEnabled ? 'Enabled' : 'Disabled')}</span>
                  </div>
                ))
              )}
            </div>
          </SetupCard>
          <SetupCard title="Settings">
            <div className="space-y-2.5 p-5">
              {setupSettingsLoading ? (
                <div className="flex items-center gap-2 text-[11px] text-[#8290a4]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading settings…</div>
              ) : settingsRows.length === 0 ? (
                <p className="text-[11px] text-[#8290a4]">No settings payload returned (or API returned an empty stub list). See Phase 5 notes in design-refs/investments-v2-backend-asks.md.</p>
              ) : (
                settingsRows.map(([l, v]) => <EditableRow key={l} label={l} value={v} edit={editing === 'settings'} />)
              )}
            </div>
          </SetupCard>
          <SetupCard title="Corporate Actions" action={editAction('corporate')}><div className="space-y-2.5 p-5">{corporateRows.map(row => editing === 'corporate' ? <input key={row} defaultValue={row} className={cn(fieldClass, 'h-6')} /> : <div key={row} className="text-[11px] text-[#c8d0dc]">{row}</div>)}</div></SetupCard>
          <SetupCard title="Tag Names" action={editAction('tags')} className="min-h-[390px]"><div className="space-y-2 p-5">{tags.map(([l, v]) => <EditableRow key={l} label={l} value={v} edit={editing === 'tags'} />)}</div></SetupCard>
          <SetupCard title="Coupon Frequency" action={<button className={cn(buttonClass, 'h-7 px-4')} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setReferenceKind('coupon'); setModal('reference') }}><Plus className="h-3 w-3" /> Add New</button>} className="min-h-[390px]"><DenseTable columns={['Frequency', 'Bloomberg', 'ID']} rows={couponRows} /></SetupCard>
          <SetupCard title="Icons" action={<button className={cn(buttonClass, 'h-7 px-4')} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setReferenceKind('icon'); setModal('reference') }}><Plus className="h-3 w-3" /> Add New</button>} className="min-h-[390px]">
            <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Name', 'Icon', 'ID'].map(h => <th key={h} className="bg-white/[.035] px-5 py-2.5 text-left text-[9px] font-normal text-[#738095]">{h}</th>)}</tr></thead><tbody>{iconNames.map((name, i) => <tr key={`${name}-${i}`} className="border-b border-[#243044] last:border-0"><td className="px-5 py-3 text-[11px] text-[#e2e8f0]">{name}</td><td className="px-5 py-3 text-[#dce4ee]"><StatusIcon name={name} /></td><td className="px-5 py-3 text-[11px] text-[#8793a5]">{i % 4 + 1}</td></tr>)}</tbody></table></div>
          </SetupCard>
        </div>}

        {data && <section className={cardClass}>
          <div className="flex flex-col gap-3 border-b border-white/[.07] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[12px] font-medium text-white">{activeTab}</h2>
              <p className="mt-1 text-[9px] text-[#718095]">
                {LIVE_REFERENCE_TABS.has(activeTab) ? `${filtered.length} records from API` : `${filtered.length} configured records · not wired to API yet`}
              </p>
            </div>
            <div className="flex gap-2"><div className="relative flex-1 sm:w-60"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#627086]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…" className={cn(fieldClass, 'pl-9')} /></div><button className={buttonClass} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setReferenceKind(null); setModal('reference') }}><Plus className="h-3.5 w-3.5" /> Add</button></div>
          </div>
          {liveTabLoading ? (
            <div className="flex items-center gap-2 px-5 py-10 text-[11px] text-[#8290a4]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-[11px] text-[#8290a4]">
              {LIVE_REFERENCE_TABS.has(activeTab)
                ? 'No records returned by the API (or response was an empty/id-only stub).'
                : 'No local records. This tab is not wired to a list endpoint in Phase 5.'}
            </div>
          ) : (
            <DenseTable columns={data.columns} rows={filtered} />
          )}
        </section>}

        {activeTab === 'Instrument Types' && <div>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[13px] font-semibold text-white">Instrument Type</h2><p className="mt-1 text-[9px] text-[#718095]">Classification and market-data mapping</p></div><div className="flex gap-2"><button className={buttonClass} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setModal('type') }}>New Type</button><button className={buttonClass} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setModal('subcategory') }}>New Sub Category</button></div></div>
          <div className="mt-3 flex gap-2 overflow-x-auto border-b border-white/[.08] pb-4">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={cn('h-8 shrink-0 rounded-full px-4 text-[11px] font-medium transition', item === category ? 'bg-[#2f87fa] text-white shadow-[0_8px_24px_rgba(47,135,250,.24)]' : 'border border-white/[.04] bg-[#192536] text-[#d6dde7] hover:bg-[#26364d]')}>{item}</button>)}</div>
          <section className={cn(cardClass, 'mt-4')}><header className="flex h-[52px] items-center px-5"><h3 className="text-[12px] font-medium text-white">Instruments · {category}</h3></header><DenseTable columns={['Code', 'Name', 'Title', 'Item', 'Fields', 'Status', 'API Filter I', 'API Filter II']} rows={instruments.map(row => [...row.slice(0, 5), 'Active', ...row.slice(5)])} /></section>
        </div>}
      </div>
      {modal && <SetupModal title={modal === 'type' ? 'New Instrument Type' : modal === 'subcategory' ? 'New Sub Category' : `Add ${referenceKind === 'coupon' ? 'Coupon Frequency' : referenceKind === 'icon' ? 'Icon' : activeTab}`} description={LIVE_REFERENCE_TABS.has(activeTab) && !referenceKind ? 'Creates a record via the Investment Ops API.' : 'Creates a local prototype record.'} onClose={() => setModal(null)} onSubmit={async () => {
        const code = draft.code.trim(), name = draft.name.trim(), extra = draft.extra.trim(); if (!name && activeTab !== 'Commissions') return
        if (modal === 'type') { setCategories(v => [...v, name]); setCategory(name); setModal(null); return }
        if (modal === 'subcategory') { setInstruments(v => [...v, [code || 'NEW', name, name, '—', '—', 'BPIPE_REFERENCE_SECURITY', `SECURITY_TYP = ${name.toUpperCase()}`]]); setModal(null); return }
        if (modal === 'reference' && referenceKind === 'coupon') {
          const id = String(couponRows.length + 1)
          setCouponRows(rows => [...rows, [name, code || id, id]])
          setModal(null)
          return
        }
        if (modal === 'reference' && referenceKind === 'icon') { setIconNames(rows => [...rows, name]); setModal(null); return }
        if (modal === 'reference' && activeTab === 'Broker/Counterparties') {
          try {
            const email = code.includes('@') ? code : `${code || 'ops'}@example.com`
            if (extra.toUpperCase() === 'CUSTODIAN') {
              await dispatch(createCustodian({ name, contactEmail: email })).unwrap()
              dispatch(fetchCustodians())
            } else {
              await dispatch(createBroker({ name, contactEmail: email })).unwrap()
              dispatch(fetchBrokers())
            }
          } catch {
            setSetupLoadError('Failed to create broker/custodian.')
          }
          setModal(null)
          return
        }
        if (modal === 'reference' && activeTab === 'Currencies') {
          try {
            await dispatch(createSetupCurrency({ code: code || name.slice(0, 3).toUpperCase(), name, symbol: extra || code || name.slice(0, 1) })).unwrap()
            dispatch(fetchSetupCurrencies())
          } catch {
            setSetupLoadError('Failed to create currency.')
          }
          setModal(null)
          return
        }
        if (modal === 'reference' && activeTab === 'Countries') {
          try {
            await dispatch(createCountry({ countryCode: code || name.slice(0, 2).toUpperCase(), countryName: name, region: extra || '—' })).unwrap()
            dispatch(fetchCountries())
          } catch {
            setSetupLoadError('Failed to create country.')
          }
          setModal(null)
          return
        }
        if (modal === 'reference' && activeTab === 'Markets') {
          try {
            await dispatch(createMarket({ marketCode: code || name.slice(0, 4).toUpperCase(), marketName: name, countryCode: extra || 'ZW' })).unwrap()
            dispatch(fetchMarkets())
          } catch {
            setSetupLoadError('Failed to create market.')
          }
          setModal(null)
          return
        }
        if (modal === 'reference' && activeTab === 'Issuer') {
          try {
            await dispatch(createIssuer({ issuerCode: code || name.slice(0, 4).toUpperCase(), legalName: name, countryCode: extra || 'ZW' })).unwrap()
            dispatch(fetchIssuers({}))
          } catch {
            setSetupLoadError('Failed to create issuer.')
          }
          setModal(null)
          return
        }
        if (modal === 'reference' && activeTab === 'Commissions') {
          const rate = Number(name)
          if (!code || !Number.isFinite(rate)) {
            setSetupLoadError('Commission create needs stakeholder profile id (code) and numeric rate bps (name).')
            setModal(null)
            return
          }
          try {
            await dispatch(createCommission({ stakeholderProfileId: code, rateBps: rate })).unwrap()
            dispatch(fetchCommissions())
          } catch {
            setSetupLoadError('Failed to create commission.')
          }
          setModal(null)
          return
        }
        setModal(null)
      }} submitLabel="Create">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[10px] text-[#8b99ad]">
              {activeTab === 'Broker/Counterparties' ? 'Contact email' : activeTab === 'Commissions' ? 'Stakeholder profile id' : 'Code'}
            </span>
            <input autoFocus value={draft.code} onChange={e => setDraft(v => ({ ...v, code: e.target.value }))} className={fieldClass} placeholder={activeTab === 'Broker/Counterparties' ? 'ops@broker.com' : activeTab === 'Commissions' ? 'profile uuid' : 'e.g. EQ'} />
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] text-[#8b99ad]">{activeTab === 'Commissions' ? 'Rate (bps)' : 'Name'}</span>
            <input value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))} className={fieldClass} placeholder={activeTab === 'Commissions' ? '25' : 'Display name'} />
          </label>
          {(activeTab === 'Broker/Counterparties' || activeTab === 'Countries' || activeTab === 'Markets' || activeTab === 'Issuer' || activeTab === 'Currencies') && !referenceKind && (
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] text-[#8b99ad]">
                {activeTab === 'Broker/Counterparties' ? 'Type (BROKER or CUSTODIAN)' : activeTab === 'Currencies' ? 'Symbol' : 'Country / region code'}
              </span>
              <input value={draft.extra} onChange={e => setDraft(v => ({ ...v, extra: e.target.value }))} className={fieldClass} placeholder={activeTab === 'Broker/Counterparties' ? 'BROKER' : activeTab === 'Currencies' ? '$' : 'ZW'} />
            </label>
          )}
        </div>
      </SetupModal>}
    </div>
  )
}

function EditableRow({ label, value, edit }: { label: string; value: string; edit: boolean }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_8px_minmax(70px,1fr)] items-center gap-2 text-[10.5px]"><span className="truncate text-[#778397]">{label}</span><span className="text-[#778397]">:</span>{edit ? <input defaultValue={value} className={cn(fieldClass, 'h-6 min-w-0')} /> : <span className="truncate font-medium text-[#e3e8f0]">{value}</span>}</div>
}

export function DenseTable({ columns, rows, editable = false }: { columns: string[]; rows: string[][]; editable?: boolean }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse"><thead className="bg-white/[.035]"><tr>{columns.map(column => <th key={column} className="px-4 py-2.5 text-left text-[9px] font-normal text-[#738095] first:pl-5 last:pr-5">{column}</th>)}{editable && <th className="w-10" />}</tr></thead><tbody>{rows.map((row, i) => <tr key={`${row[0]}-${i}`} className="border-b border-[#243044] transition last:border-0 hover:bg-[#2f87fa]/[.05]">{row.map((cell, j) => <td key={j} className={cn('whitespace-nowrap px-4 py-3.5 text-[10.5px] first:pl-5 last:pr-5', j === 0 ? 'font-medium text-[#e2e8f0]' : 'text-[#91a0b5]')}>{cell === 'Active' ? <span className="rounded-full border border-[#3e7e33] bg-[#183722] px-3 py-0.5 text-[9px] text-[#65cf55]">Active</span> : cell}</td>)}{editable && <td><button className="rounded-full p-2 text-[#718095] hover:bg-white/10 hover:text-white"><Pencil className="h-3 w-3" /></button></td>}</tr>)}</tbody></table></div>
}

export function DragHandle() {
  return <GripVertical className="h-4 w-4 text-[#526176]" />
}
