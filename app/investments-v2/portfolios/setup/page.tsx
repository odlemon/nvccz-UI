'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { PortfoliosSubNav } from '@/components/investments-v2/portfolios-subnav'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Pencil, Plus, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchBrokers, createBroker,
  fetchCustodians, createCustodian,
  fetchCommissions, createCommission,
  fetchCountries, createCountry,
  fetchSetupCurrencies, createSetupCurrency,
  fetchMarkets, createMarket,
  fetchIssuers, createIssuer,
  fetchPriceSources,
  fetchInstrumentTypes,
  fetchSetupSettings, updateSetupSettings,
} from '@/lib/store/slices/investmentOpsSlice'

const setupTabs = ['Setup', 'Broker/Counterparties', 'Commissions', 'Countries', 'Currencies', 'Instrument Types', 'Issuer', 'Markets']

const corporateRows = [
  'Dividend Code(without currency)',
  'Dividend ex prefix for comment',
  'Dividend pay prefix for comment',
  'Coupon Code(without currency)',
  'Coupon payment prefix comment',
  'Cash account code(without currency)',
]

const tagRows = [
  { tag: 'Tag 0 Headline', value: 'Country' },
  { tag: 'Tag 1 Headline', value: 'Company' },
  { tag: 'Tag 2 Headline', value: 'Government' },
  { tag: 'Tag 3 Headline', value: 'OECD' },
  { tag: 'Tag 4 Headline', value: 'EU' },
  { tag: 'Tag 5 Headline', value: 'EEA' },
  { tag: 'Tag 6 Headline', value: 'Other' },
  { tag: 'Tag 7 Headline', value: 'Credit Institution' },
  { tag: 'Tag 8 Headline', value: 'Precious Metal' },
  { tag: 'Tag 9 Headline', value: 'Real Estate Exposure' },
  { tag: 'Position Tag 1', value: 'Credit Institution' },
  { tag: 'Position Tag 2', value: 'Precious Metal' },
  { tag: 'Position Tag 3', value: 'Real Estate Exposure' },
]

const iconRows = [
  { name: 'Error',     icon: '⊙', id: 1 },
  { name: 'Not Found', icon: '⊗', id: 2 },
  { name: 'OK',        icon: '⊙', id: 3 },
  { name: 'OK but Old',icon: '↺', id: 4 },
  { name: 'Undefined', icon: '⊘', id: 1 },
  { name: 'Not OK',    icon: '⊗', id: 2 },
  { name: 'Approved',  icon: '⊙', id: 3 },
  { name: 'Warnings',  icon: '△', id: 4 },
]

const NEW_STAKEHOLDER_EMPTY = { name: '', contactEmail: '' }
const NEW_COMMISSION_EMPTY = { stakeholderProfileId: '', rateBps: '' }
const NEW_COUNTRY_EMPTY = { countryCode: '', countryName: '', region: '' }
const NEW_CURRENCY_EMPTY = { code: '', name: '', symbol: '' }
const NEW_MARKET_EMPTY = { marketCode: '', marketName: '', countryCode: '' }
const NEW_ISSUER_EMPTY = { issuerCode: '', legalName: '', countryCode: '' }

export default function PortfolioSetupPage() {
  const dispatch = useAppDispatch()
  const {
    brokers, brokerCreating,
    custodians, custodianCreating,
    commissions, commissionCreating,
    countries, countryCreating,
    setupCurrencies, setupCurrencyCreating,
    markets, marketCreating,
    issuers, issuerCreating,
    priceSources,
    instrumentTypes,
    setupSettings, setupSettingsSaving,
  } = useAppSelector((s) => s.investmentOps)

  const [activeTab, setActiveTab] = useState('Setup')
  const [settingsForm, setSettingsForm] = useState({ staleHours: '', fourEyeEnabled: false, valuationMethod: '' })

  const [showNewBroker, setShowNewBroker] = useState(false)
  const [brokerForm, setBrokerForm] = useState(NEW_STAKEHOLDER_EMPTY)
  const [showNewCustodian, setShowNewCustodian] = useState(false)
  const [custodianForm, setCustodianForm] = useState(NEW_STAKEHOLDER_EMPTY)
  const [showNewCommission, setShowNewCommission] = useState(false)
  const [commissionForm, setCommissionForm] = useState(NEW_COMMISSION_EMPTY)
  const [showNewCountry, setShowNewCountry] = useState(false)
  const [countryForm, setCountryForm] = useState(NEW_COUNTRY_EMPTY)
  const [showNewCurrency, setShowNewCurrency] = useState(false)
  const [currencyForm, setCurrencyForm] = useState(NEW_CURRENCY_EMPTY)
  const [showNewMarket, setShowNewMarket] = useState(false)
  const [marketForm, setMarketForm] = useState(NEW_MARKET_EMPTY)
  const [showNewIssuer, setShowNewIssuer] = useState(false)
  const [issuerForm, setIssuerForm] = useState(NEW_ISSUER_EMPTY)
  const [issuerCountryFilter, setIssuerCountryFilter] = useState('')

  useEffect(() => {
    dispatch(fetchBrokers())
    dispatch(fetchCustodians())
    dispatch(fetchCommissions())
    dispatch(fetchCountries())
    dispatch(fetchSetupCurrencies())
    dispatch(fetchMarkets())
    dispatch(fetchPriceSources())
    dispatch(fetchInstrumentTypes())
    dispatch(fetchSetupSettings())
  }, [dispatch])

  useEffect(() => {
    if (setupSettings) {
      setSettingsForm({
        staleHours: String(setupSettings.stale_price_hours?.hours ?? ''),
        fourEyeEnabled: !!setupSettings.four_eye_orders?.enabled,
        valuationMethod: setupSettings.default_valuation_method?.method ?? '',
      })
    }
  }, [setupSettings])

  useEffect(() => {
    if (issuerCountryFilter) dispatch(fetchIssuers({ countryCode: issuerCountryFilter }))
  }, [dispatch, issuerCountryFilter])

  const stakeholders = [...brokers, ...custodians]
  const stakeholderName = (id: string | null) => (id ? stakeholders.find((s) => s.id === id)?.name ?? id : '—')

  const handleSaveSettings = () => {
    dispatch(
      updateSetupSettings({
        stale_price_hours: { hours: Number(settingsForm.staleHours) || 0 },
        four_eye_orders: { enabled: settingsForm.fourEyeEnabled },
        default_valuation_method: { method: settingsForm.valuationMethod },
      })
    )
  }

  const handleCreateBroker = async () => {
    if (!brokerForm.name || !brokerForm.contactEmail) return
    await dispatch(createBroker(brokerForm))
    setBrokerForm(NEW_STAKEHOLDER_EMPTY)
    setShowNewBroker(false)
  }

  const handleCreateCustodian = async () => {
    if (!custodianForm.name || !custodianForm.contactEmail) return
    await dispatch(createCustodian(custodianForm))
    setCustodianForm(NEW_STAKEHOLDER_EMPTY)
    setShowNewCustodian(false)
  }

  const handleCreateCommission = async () => {
    if (!commissionForm.stakeholderProfileId || !commissionForm.rateBps) return
    await dispatch(createCommission({ stakeholderProfileId: commissionForm.stakeholderProfileId, rateBps: Number(commissionForm.rateBps) }))
    setCommissionForm(NEW_COMMISSION_EMPTY)
    setShowNewCommission(false)
  }

  const handleCreateCountry = async () => {
    if (!countryForm.countryCode || !countryForm.countryName || !countryForm.region) return
    await dispatch(createCountry(countryForm))
    setCountryForm(NEW_COUNTRY_EMPTY)
    setShowNewCountry(false)
  }

  const handleCreateCurrency = async () => {
    if (!currencyForm.code || !currencyForm.name || !currencyForm.symbol) return
    await dispatch(createSetupCurrency(currencyForm))
    setCurrencyForm(NEW_CURRENCY_EMPTY)
    setShowNewCurrency(false)
  }

  const handleCreateMarket = async () => {
    if (!marketForm.marketCode || !marketForm.marketName || !marketForm.countryCode) return
    await dispatch(createMarket(marketForm))
    setMarketForm(NEW_MARKET_EMPTY)
    setShowNewMarket(false)
  }

  const handleCreateIssuer = async () => {
    if (!issuerForm.issuerCode || !issuerForm.legalName || !issuerForm.countryCode) return
    await dispatch(createIssuer(issuerForm))
    setIssuerForm(NEW_ISSUER_EMPTY)
    setShowNewIssuer(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader title="Setup" />
      <PortfoliosSubNav />

      {/* Setup top-level tabs */}
      <div className="flex items-center gap-0 px-5 pt-3 pb-0 flex-shrink-0 overflow-x-auto">
        {setupTabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn(
              'px-4 pb-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors border-b-2',
              activeTab === t
                ? 'text-white border-[#3b82f6]'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]'
            )}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }} />

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {activeTab === 'Setup' && (
          <div className="grid grid-cols-3 gap-4">

            {/* Price API — real */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Price Sources</span>
              </div>
              <div className="p-4 space-y-2">
                {priceSources.map((s) => (
                  <div key={s.sourceCode} className="flex items-center gap-2 text-[12px]">
                    <span style={{ color: '#64748b', minWidth: 100 }}>{s.displayName}</span>
                    <span style={{ color: '#64748b' }}>:</span>
                    <span className="font-medium" style={{ color: s.isEnabled ? '#10b981' : '#ef4444' }}>{s.apiStatus}</span>
                  </div>
                ))}
                {priceSources.length === 0 && <div className="text-[12px]" style={{ color: '#64748b' }}>No price sources configured.</div>}
              </div>
            </div>

            {/* Settings — real */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Settings</span>
                <button onClick={handleSaveSettings} disabled={setupSettingsSaving} className="opacity-70 hover:opacity-100 text-[10px] text-[#60A5FA] disabled:opacity-40">
                  {setupSettingsSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: '#64748b', flex: 1 }}>Stale price threshold (hours)</span>
                  <input
                    type="number"
                    value={settingsForm.staleHours}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, staleHours: e.target.value }))}
                    className="w-16 bg-[#111C30] border border-white/[0.08] rounded px-2 py-1 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: '#64748b', flex: 1 }}>Four-eye principle (orders)</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.fourEyeEnabled}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, fourEyeEnabled: e.target.checked }))}
                    className="accent-[#2563EB]"
                  />
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: '#64748b', flex: 1 }}>Default valuation method</span>
                  <input
                    value={settingsForm.valuationMethod}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, valuationMethod: e.target.value }))}
                    className="w-20 bg-[#111C30] border border-white/[0.08] rounded px-2 py-1 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Corporate Actions — no backing endpoint, left as mock */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Corporate Actions</span>
                <button className="opacity-50 hover:opacity-100"><Pencil className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
              </div>
              <div className="p-4 space-y-2">
                {corporateRows.map(r => (
                  <div key={r} className="text-[12px]" style={{ color: '#94a3b8' }}>{r}</div>
                ))}
              </div>
            </div>

            {/* Tag Names — no backing endpoint, left as mock */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Tag Names</span>
                <button className="opacity-50 hover:opacity-100"><Pencil className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
              </div>
              <div className="p-4 space-y-1.5">
                {tagRows.map(r => (
                  <div key={r.tag} className="flex items-center gap-2 text-[12px]">
                    <span style={{ color: '#64748b', minWidth: 120 }}>{r.tag}</span>
                    <span style={{ color: '#64748b' }}>:</span>
                    <span style={{ color: '#e2e8f0' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Frequency — no backing endpoint, left as mock */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Coupon Frequency</span>
                <button className="btn-white text-[11px] py-1 px-3">Add New</button>
              </div>
              <div className="overflow-x-auto">
                <table className="arcus-table">
                  <thead><tr><th>Frequency</th><th>Name - org</th><th>ID</th></tr></thead>
                  <tbody>
                    {[['Monthly','Monthly',12],['Quarterly','Quarterly',4],['Half Year','Half Year',2],['Yearly','Yearly',1]].map(([f,n,id]) => (
                      <tr key={f as string}>
                        <td style={{ color: '#e2e8f0' }}>{f}</td>
                        <td style={{ color: '#64748b' }}>{n}</td>
                        <td className="font-mono" style={{ color: '#94a3b8' }}>{id as number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Icons — no backing endpoint, left as mock */}
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Icons</span>
                <button className="btn-white text-[11px] py-1 px-3">Add New</button>
              </div>
              <div className="overflow-x-auto">
                <table className="arcus-table">
                  <thead><tr><th>Name</th><th>Icon</th><th>ID</th></tr></thead>
                  <tbody>
                    {iconRows.map((row) => (
                      <tr key={`${row.name}-${row.id}`}>
                        <td style={{ color: '#e2e8f0' }}>{row.name}</td>
                        <td style={{ color: '#94a3b8', fontSize: 14 }}>{row.icon}</td>
                        <td className="font-mono" style={{ color: '#64748b' }}>{row.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Broker/Counterparties' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Brokers</span>
                <button onClick={() => setShowNewBroker(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
              </div>
              {showNewBroker && (
                <div className="p-3 border-b border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">New Broker</span>
                    <button onClick={() => setShowNewBroker(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <input placeholder="Name" value={brokerForm.name} onChange={(e) => setBrokerForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  <input placeholder="Contact Email" value={brokerForm.contactEmail} onChange={(e) => setBrokerForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowNewBroker(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                    <button onClick={handleCreateBroker} disabled={brokerCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{brokerCreating ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              )}
              <table className="arcus-table">
                <thead><tr><th>Name</th><th>Contact Email</th><th>Status</th></tr></thead>
                <tbody>
                  {brokers.map((b) => (
                    <tr key={b.id}>
                      <td style={{ color: '#e2e8f0' }}>{b.name}</td>
                      <td style={{ color: '#94a3b8' }}>{b.contactEmail}</td>
                      <td><StatusBadge status={b.isActive ? 'active' : 'inactive'} /></td>
                    </tr>
                  ))}
                  {brokers.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No brokers configured.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="arcus-card">
              <div className="arcus-card-header">
                <span className="text-white text-[13px] font-semibold">Custodians</span>
                <button onClick={() => setShowNewCustodian(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
              </div>
              {showNewCustodian && (
                <div className="p-3 border-b border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white">New Custodian</span>
                    <button onClick={() => setShowNewCustodian(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <input placeholder="Name" value={custodianForm.name} onChange={(e) => setCustodianForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  <input placeholder="Contact Email" value={custodianForm.contactEmail} onChange={(e) => setCustodianForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowNewCustodian(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                    <button onClick={handleCreateCustodian} disabled={custodianCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{custodianCreating ? 'Saving…' : 'Save'}</button>
                  </div>
                </div>
              )}
              <table className="arcus-table">
                <thead><tr><th>Name</th><th>Contact Email</th><th>Status</th></tr></thead>
                <tbody>
                  {custodians.map((c) => (
                    <tr key={c.id}>
                      <td style={{ color: '#e2e8f0' }}>{c.name}</td>
                      <td style={{ color: '#94a3b8' }}>{c.contactEmail}</td>
                      <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                    </tr>
                  ))}
                  {custodians.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No custodians configured.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Commissions' && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Commission Rates</span>
              <button onClick={() => setShowNewCommission(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {showNewCommission && (
              <div className="p-4 border-b border-white/[0.06] grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Stakeholder</label>
                  <select value={commissionForm.stakeholderProfileId} onChange={(e) => setCommissionForm((p) => ({ ...p, stakeholderProfileId: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                    <option value="" disabled>Select…</option>
                    {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.profileType})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Rate (bps)</label>
                  <input type="number" value={commissionForm.rateBps} onChange={(e) => setCommissionForm((p) => ({ ...p, rateBps: e.target.value }))}
                    className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCommission(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                  <button onClick={handleCreateCommission} disabled={commissionCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{commissionCreating ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Stakeholder</th><th>Instrument Type</th><th className="text-right">Rate (bps)</th><th className="text-right">Flat Fee</th><th>Currency</th><th>Status</th></tr></thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: '#e2e8f0' }}>{stakeholderName(c.stakeholderProfileId)}</td>
                    <td style={{ color: '#64748b' }}>{c.instrumentTypeCode ?? 'All'}</td>
                    <td className="text-right font-mono" style={{ color: '#e2e8f0' }}>{c.rateBps}</td>
                    <td className="text-right font-mono" style={{ color: '#94a3b8' }}>{c.flatFee ?? '—'}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{c.currencyCode}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {commissions.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No commission rates configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Countries' && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Countries</span>
              <button onClick={() => setShowNewCountry(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {showNewCountry && (
              <div className="p-4 border-b border-white/[0.06] grid grid-cols-4 gap-3 items-end">
                <input placeholder="Country Code" value={countryForm.countryCode} onChange={(e) => setCountryForm((p) => ({ ...p, countryCode: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                <input placeholder="Country Name" value={countryForm.countryName} onChange={(e) => setCountryForm((p) => ({ ...p, countryName: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                <input placeholder="Region" value={countryForm.region} onChange={(e) => setCountryForm((p) => ({ ...p, region: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCountry(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                  <button onClick={handleCreateCountry} disabled={countryCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{countryCreating ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Name</th><th>Region</th><th>Status</th></tr></thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-bold" style={{ color: '#60A5FA' }}>{c.countryCode}</td>
                    <td style={{ color: '#e2e8f0' }}>{c.countryName}</td>
                    <td style={{ color: '#64748b' }}>{c.region}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {countries.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No countries configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Currencies' && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Currencies</span>
              <button onClick={() => setShowNewCurrency(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {showNewCurrency && (
              <div className="p-4 border-b border-white/[0.06] grid grid-cols-4 gap-3 items-end">
                <input placeholder="Code" value={currencyForm.code} onChange={(e) => setCurrencyForm((p) => ({ ...p, code: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                <input placeholder="Name" value={currencyForm.name} onChange={(e) => setCurrencyForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                <input placeholder="Symbol" value={currencyForm.symbol} onChange={(e) => setCurrencyForm((p) => ({ ...p, symbol: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewCurrency(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                  <button onClick={handleCreateCurrency} disabled={setupCurrencyCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{setupCurrencyCreating ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Name</th><th>Symbol</th><th>Default</th><th>Status</th></tr></thead>
              <tbody>
                {setupCurrencies.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-bold" style={{ color: '#60A5FA' }}>{c.code}</td>
                    <td style={{ color: '#e2e8f0' }}>{c.name}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{c.symbol}</td>
                    <td style={{ color: '#64748b' }}>{c.isDefault ? 'Yes' : '—'}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {setupCurrencies.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No currencies configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Instrument Types' && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Instrument Types</span>
            </div>
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Display Name</th><th>Status</th></tr></thead>
              <tbody>
                {instrumentTypes.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono font-bold" style={{ color: '#60A5FA' }}>{t.typeCode}</td>
                    <td style={{ color: '#e2e8f0' }}>{t.displayName}</td>
                    <td><StatusBadge status={t.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {instrumentTypes.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No instrument types found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Issuer' && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Issuers</span>
              <div className="flex items-center gap-2">
                <select value={issuerCountryFilter} onChange={(e) => setIssuerCountryFilter(e.target.value)}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                  <option value="" disabled>Select country…</option>
                  {countries.map((c) => <option key={c.id} value={c.countryCode}>{c.countryName} ({c.countryCode})</option>)}
                </select>
                <button onClick={() => setShowNewIssuer(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
              </div>
            </div>
            {showNewIssuer && (
              <div className="p-4 border-b border-white/[0.06] grid grid-cols-4 gap-3 items-end">
                <input placeholder="Issuer Code" value={issuerForm.issuerCode} onChange={(e) => setIssuerForm((p) => ({ ...p, issuerCode: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                <input placeholder="Legal Name" value={issuerForm.legalName} onChange={(e) => setIssuerForm((p) => ({ ...p, legalName: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                <select value={issuerForm.countryCode} onChange={(e) => setIssuerForm((p) => ({ ...p, countryCode: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                  <option value="" disabled>Select country…</option>
                  {countries.map((c) => <option key={c.id} value={c.countryCode}>{c.countryName} ({c.countryCode})</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setShowNewIssuer(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                  <button onClick={handleCreateIssuer} disabled={issuerCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{issuerCreating ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Legal Name</th><th>Country</th><th>Sector</th><th>Status</th></tr></thead>
              <tbody>
                {issuers.map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono font-bold" style={{ color: '#60A5FA' }}>{i.issuerCode}</td>
                    <td style={{ color: '#e2e8f0' }}>{i.legalName}</td>
                    <td style={{ color: '#64748b' }}>{i.countryCode}</td>
                    <td style={{ color: '#64748b' }}>{i.sector ?? '—'}</td>
                    <td><StatusBadge status={i.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {issuers.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>
                    {issuerCountryFilter ? 'No issuers found for this country.' : 'Select a country to view its issuers.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Markets' && (
          <div className="arcus-card">
            <div className="arcus-card-header">
              <span className="text-white text-[13px] font-semibold">Markets</span>
              <button onClick={() => setShowNewMarket(true)} className="btn-white text-[11px] py-1 px-3 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {showNewMarket && (
              <div className="p-4 border-b border-white/[0.06] grid grid-cols-4 gap-3 items-end">
                <input placeholder="Market Code" value={marketForm.marketCode} onChange={(e) => setMarketForm((p) => ({ ...p, marketCode: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                <input placeholder="Market Name" value={marketForm.marketName} onChange={(e) => setMarketForm((p) => ({ ...p, marketName: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                <input placeholder="Country Code" value={marketForm.countryCode} onChange={(e) => setMarketForm((p) => ({ ...p, countryCode: e.target.value }))}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                <div className="flex gap-2">
                  <button onClick={() => setShowNewMarket(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06]">Cancel</button>
                  <button onClick={handleCreateMarket} disabled={marketCreating} className="bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-50">{marketCreating ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Name</th><th>Country</th><th>Exchange Code</th><th>Status</th></tr></thead>
              <tbody>
                {markets.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono font-bold" style={{ color: '#60A5FA' }}>{m.marketCode}</td>
                    <td style={{ color: '#e2e8f0' }}>{m.marketName}</td>
                    <td style={{ color: '#64748b' }}>{m.countryCode}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{m.exchangeCode ?? '—'}</td>
                    <td><StatusBadge status={m.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {markets.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-[12px]" style={{ color: '#64748b' }}>No markets configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
