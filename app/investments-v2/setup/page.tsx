'use client'

import { Fragment, useEffect, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { fetchUsers } from '@/lib/store/slices/adminSlice'
import {
  fetchSetupFunds,
  createSetupFund,
  updateSetupFundConfig,
  assignFundManager,
  fetchBrokers,
  createBroker,
  fetchCustodians,
  createCustodian,
  fetchCommissions,
  createCommission,
  fetchMarkets,
  createMarket,
  fetchSetupCurrencies,
  createSetupCurrency,
  fetchCountries,
  createCountry,
  fetchIssuers,
  createIssuer,
  fetchPriceSources,
  fetchSetupSettings,
  updateSetupSettings,
} from '@/lib/store/slices/investmentOpsSlice'

const setupTabs = ['Funds', 'System Settings', 'Brokers', 'Custodians', 'Commissions', 'Currencies', 'Countries', 'Issuers', 'Markets', 'Instrument Types', 'Price APIs']

const instrumentTypes = [
  { code: 'EQ', name: 'Equity', subcategories: 'Ordinary, Preference, ADR, GDR', apiFilter: 'type=equity', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'BD', name: 'Bond', subcategories: 'Government, Corporate, HY, IG', apiFilter: 'type=bond', status: 'active', valuationMethod: 'Amortised Cost' },
  { code: 'ETF', name: 'ETF', subcategories: 'Equity ETF, Bond ETF, Commodity ETF', apiFilter: 'type=etf', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'FND', name: 'Fund', subcategories: 'UCITS, Hedge Fund, Money Market', apiFilter: 'type=fund', status: 'active', valuationMethod: 'NAV' },
  { code: 'FX', name: 'FX / Forward', subcategories: 'Spot, Forward, NDF', apiFilter: 'type=fx', status: 'active', valuationMethod: 'MTM' },
  { code: 'FUT', name: 'Futures', subcategories: 'Equity, Commodity, Rate', apiFilter: 'type=futures', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'OPT', name: 'Options', subcategories: 'Call, Put, American, European', apiFilter: 'type=option', status: 'active', valuationMethod: 'Black-Scholes' },
  { code: 'CFD', name: 'CFD', subcategories: 'Equity CFD, Index CFD', apiFilter: 'type=cfd', status: 'active', valuationMethod: 'Mark-to-Market' },
  { code: 'CASH', name: 'Cash', subcategories: 'Call Account, Term Deposit', apiFilter: 'type=cash', status: 'active', valuationMethod: 'Face Value' },
  { code: 'COMM', name: 'Commodity', subcategories: 'Gold, Silver, Oil, Agri', apiFilter: 'type=commodity', status: 'active', valuationMethod: 'Mark-to-Market' },
]

const NEW_FUND_EMPTY = { name: '', description: '', baseCurrencyCode: 'USD' }
const NEW_STAKEHOLDER_EMPTY = { name: '', contactEmail: '' }
const NEW_COMMISSION_EMPTY = { stakeholderProfileId: '', rateBps: '' }
const NEW_MARKET_EMPTY = { marketCode: '', marketName: '', countryCode: 'ZW' }
const NEW_CURRENCY_EMPTY = { code: '', name: '', symbol: '' }
const NEW_COUNTRY_EMPTY = { countryCode: '', countryName: '', region: '' }
const NEW_ISSUER_EMPTY = { issuerCode: '', legalName: '', countryCode: '' }

export default function SetupPage() {
  const dispatch = useAppDispatch()
  const {
    setupFunds, setupFundCreating, fundConfigSaving, fundManagerAssigning,
    brokers, brokerCreating, custodians, custodianCreating,
    commissions, commissionCreating, markets, marketCreating,
    setupCurrencies, setupCurrencyCreating,
    countries, countryCreating,
    issuers, issuerCreating,
    priceSources,
    setupSettings, setupSettingsSaving,
  } = useAppSelector((s) => s.investmentOps)
  const { users } = useAppSelector((s) => s.admin)

  const [activeTab, setActiveTab] = useState('System Settings')

  const [showNewFund, setShowNewFund] = useState(false)
  const [fundForm, setFundForm] = useState(NEW_FUND_EMPTY)
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null)
  const [configFormByFundId, setConfigFormByFundId] = useState<Record<string, { baseCurrencyCode: string; trustBankId: string; brokerProfileId: string; custodianProfileId: string }>>({})
  const [managerFormByFundId, setManagerFormByFundId] = useState<Record<string, { userId: string; role: string }>>({})

  const [showNewBroker, setShowNewBroker] = useState(false)
  const [brokerForm, setBrokerForm] = useState(NEW_STAKEHOLDER_EMPTY)
  const [showNewCustodian, setShowNewCustodian] = useState(false)
  const [custodianForm, setCustodianForm] = useState(NEW_STAKEHOLDER_EMPTY)
  const [showNewCommission, setShowNewCommission] = useState(false)
  const [commissionForm, setCommissionForm] = useState(NEW_COMMISSION_EMPTY)
  const [showNewMarket, setShowNewMarket] = useState(false)
  const [marketForm, setMarketForm] = useState(NEW_MARKET_EMPTY)

  const [showNewCurrency, setShowNewCurrency] = useState(false)
  const [currencyForm, setCurrencyForm] = useState(NEW_CURRENCY_EMPTY)
  const [showNewCountry, setShowNewCountry] = useState(false)
  const [countryForm, setCountryForm] = useState(NEW_COUNTRY_EMPTY)
  const [showNewIssuer, setShowNewIssuer] = useState(false)
  const [issuerForm, setIssuerForm] = useState(NEW_ISSUER_EMPTY)
  const [issuerCountryFilter, setIssuerCountryFilter] = useState('')
  const [settingsForm, setSettingsForm] = useState({ staleHours: '', fourEyeEnabled: false, valuationMethod: '' })

  useEffect(() => {
    dispatch(fetchSetupFunds())
    dispatch(fetchBrokers())
    dispatch(fetchCustodians())
    dispatch(fetchCommissions())
    dispatch(fetchMarkets())
    dispatch(fetchUsers())
    dispatch(fetchSetupCurrencies())
    dispatch(fetchCountries())
    dispatch(fetchPriceSources())
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
  const userLabel = (u: { firstName: string; lastName: string; email: string }) => `${u.firstName} ${u.lastName} (${u.email})`

  const toggleFund = (fund: (typeof setupFunds)[number]) => {
    if (expandedFundId === fund.id) {
      setExpandedFundId(null)
      return
    }
    setExpandedFundId(fund.id)
    if (!configFormByFundId[fund.id]) {
      const cfg = fund.listedEquityFundConfig
      setConfigFormByFundId((p) => ({
        ...p,
        [fund.id]: {
          baseCurrencyCode: cfg?.baseCurrencyCode ?? '',
          trustBankId: cfg?.trustBankId ?? '',
          brokerProfileId: cfg?.brokerProfileId ?? '',
          custodianProfileId: cfg?.custodianProfileId ?? '',
        },
      }))
    }
    if (!managerFormByFundId[fund.id]) {
      setManagerFormByFundId((p) => ({ ...p, [fund.id]: { userId: '', role: 'fund_manager' } }))
    }
  }

  const handleCreateFund = async () => {
    if (!fundForm.name || !fundForm.baseCurrencyCode) return
    await dispatch(createSetupFund(fundForm))
    setFundForm(NEW_FUND_EMPTY)
    setShowNewFund(false)
  }

  const handleSaveConfig = (fundId: string) => {
    const form = configFormByFundId[fundId]
    if (!form) return
    dispatch(
      updateSetupFundConfig({
        id: fundId,
        data: {
          baseCurrencyCode: form.baseCurrencyCode || undefined,
          trustBankId: form.trustBankId || undefined,
          brokerProfileId: form.brokerProfileId || undefined,
          custodianProfileId: form.custodianProfileId || undefined,
        },
      })
    )
  }

  const handleAssignManager = (fundId: string) => {
    const form = managerFormByFundId[fundId]
    if (!form?.userId || !form.role) return
    dispatch(assignFundManager({ fundId, data: { userId: form.userId, role: form.role } }))
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

  const handleCreateMarket = async () => {
    if (!marketForm.marketCode || !marketForm.marketName) return
    await dispatch(createMarket(marketForm))
    setMarketForm(NEW_MARKET_EMPTY)
    setShowNewMarket(false)
  }

  const handleCreateCurrency = async () => {
    if (!currencyForm.code || !currencyForm.name || !currencyForm.symbol) return
    await dispatch(createSetupCurrency(currencyForm))
    setCurrencyForm(NEW_CURRENCY_EMPTY)
    setShowNewCurrency(false)
  }

  const handleCreateCountry = async () => {
    if (!countryForm.countryCode || !countryForm.countryName || !countryForm.region) return
    await dispatch(createCountry(countryForm))
    setCountryForm(NEW_COUNTRY_EMPTY)
    setShowNewCountry(false)
  }

  const handleCreateIssuer = async () => {
    if (!issuerForm.issuerCode || !issuerForm.legalName || !issuerForm.countryCode) return
    await dispatch(createIssuer(issuerForm))
    setIssuerForm(NEW_ISSUER_EMPTY)
    setShowNewIssuer(false)
  }

  const handleSaveSettings = () => {
    dispatch(
      updateSetupSettings({
        stale_price_hours: { hours: Number(settingsForm.staleHours) || 0 },
        four_eye_orders: { enabled: settingsForm.fourEyeEnabled },
        default_valuation_method: { method: settingsForm.valuationMethod },
      })
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      <PageHeader title="Setup & Administration" />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
        {setupTabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', activeTab === t ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'Funds' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Funds</div>
              <button onClick={() => setShowNewFund(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> New Fund
              </button>
            </div>

            {showNewFund && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Fund</span>
                  <button onClick={() => setShowNewFund(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Name</label>
                    <input value={fundForm.name} onChange={(e) => setFundForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Description</label>
                    <input value={fundForm.description} onChange={(e) => setFundForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Base Currency</label>
                    <input value={fundForm.baseCurrencyCode} onChange={(e) => setFundForm((p) => ({ ...p, baseCurrencyCode: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewFund(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateFund} disabled={setupFundCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {setupFundCreating ? 'Saving…' : 'Save Fund'}
                  </button>
                </div>
              </div>
            )}

            <table className="arcus-table">
              <thead>
                <tr>
                  <th />
                  <th>Name</th>
                  <th>Base Currency</th>
                  <th>Fund Purpose</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-right">Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {setupFunds.map((fund) => {
                  const isExpanded = expandedFundId === fund.id
                  const cfgForm = configFormByFundId[fund.id]
                  const mgrForm = managerFormByFundId[fund.id]
                  return (
                    <Fragment key={fund.id}>
                      <tr className="cursor-pointer" onClick={() => toggleFund(fund)}>
                        <td className="w-6">{isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#6B7A95]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#6B7A95]" />}</td>
                        <td className="text-[#C8D3E8] font-medium">{fund.name}</td>
                        <td className="font-mono text-[#A8B4C8]">{fund.listedEquityFundConfig?.baseCurrencyCode ?? '—'}</td>
                        <td className="text-[#6B7A95]">{fund.fundPurpose}</td>
                        <td className="text-right font-mono">{Number(fund.totalAmount).toLocaleString()}</td>
                        <td className="text-right font-mono">{Number(fund.remainingAmount).toLocaleString()}</td>
                        <td><StatusBadge status={fund.status.toLowerCase()} /></td>
                      </tr>
                      {isExpanded && cfgForm && mgrForm && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="px-6 py-3 space-y-4" style={{ background: 'rgba(59,130,246,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div>
                                <div className="text-[11px] font-semibold text-[#E8EDF5] mb-2">Config</div>
                                <div className="grid grid-cols-4 gap-3">
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Base Currency</label>
                                    <input value={cfgForm.baseCurrencyCode}
                                      onChange={(e) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], baseCurrencyCode: e.target.value } }))}
                                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Trust Bank ID</label>
                                    <input value={cfgForm.trustBankId}
                                      onChange={(e) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], trustBankId: e.target.value } }))}
                                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Broker</label>
                                    <select value={cfgForm.brokerProfileId}
                                      onChange={(e) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], brokerProfileId: e.target.value } }))}
                                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                                      <option value="">—</option>
                                      {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Custodian</label>
                                    <select value={cfgForm.custodianProfileId}
                                      onChange={(e) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], custodianProfileId: e.target.value } }))}
                                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                                      <option value="">—</option>
                                      {custodians.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                  </div>
                                </div>
                                {fund.listedEquityFundConfig?.coaMappingJson && (
                                  <div className="mt-2">
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">COA Mapping (read-only)</label>
                                    <pre className="text-[10px] text-[#6B7A95] font-mono bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 overflow-x-auto">
                                      {JSON.stringify(fund.listedEquityFundConfig.coaMappingJson, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                <div className="flex justify-end mt-2">
                                  <button onClick={() => handleSaveConfig(fund.id)} disabled={fundConfigSaving}
                                    className="bg-[#2563EB] text-white text-[11px] font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                                    {fundConfigSaving ? 'Saving…' : 'Save Config'}
                                  </button>
                                </div>
                              </div>

                              <div>
                                <div className="text-[11px] font-semibold text-[#E8EDF5] mb-2">Assign Manager</div>
                                <div className="flex items-center gap-2">
                                  <select value={mgrForm.userId}
                                    onChange={(e) => setManagerFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], userId: e.target.value } }))}
                                    className="flex-1 bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                                    <option value="" disabled>Select user…</option>
                                    {users.map((u) => <option key={u.id} value={u.id}>{userLabel(u)}</option>)}
                                  </select>
                                  <input value={mgrForm.role}
                                    onChange={(e) => setManagerFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], role: e.target.value } }))}
                                    className="w-40 bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                                  <button onClick={() => handleAssignManager(fund.id)} disabled={fundManagerAssigning}
                                    className="bg-[#2563EB] text-white text-[11px] font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50 whitespace-nowrap">
                                    {fundManagerAssigning ? 'Assigning…' : 'Assign'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {setupFunds.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No funds configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'System Settings' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">System Settings</div>
              <button onClick={handleSaveSettings} disabled={setupSettingsSaving} className="text-[#60A5FA] text-[10px] hover:underline disabled:opacity-50">
                {setupSettingsSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                <div className="text-xs text-[#A8B4C8] w-56">Stale Price Threshold</div>
                <div className="flex-1 max-w-xs flex items-center gap-2">
                  <input
                    type="number"
                    value={settingsForm.staleHours}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, staleHours: e.target.value }))}
                    className="w-24 bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                  />
                  <span className="text-[10px] text-[#6B7A95]">hours</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                <div className="text-xs text-[#A8B4C8] w-56">Four-Eye Principle (Orders)</div>
                <label className="flex-1 max-w-xs flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.fourEyeEnabled}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, fourEyeEnabled: e.target.checked }))}
                    className="accent-[#2563EB]"
                  />
                  <span className="text-xs text-[#C8D3E8]">{settingsForm.fourEyeEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                <div className="text-xs text-[#A8B4C8] w-56">Default Valuation Method</div>
                <input
                  value={settingsForm.valuationMethod}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, valuationMethod: e.target.value }))}
                  className="flex-1 max-w-xs bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Brokers' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Brokers</div>
              <button onClick={() => setShowNewBroker(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Broker
              </button>
            </div>
            {showNewBroker && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Broker</span>
                  <button onClick={() => setShowNewBroker(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Name</label>
                    <input value={brokerForm.name} onChange={(e) => setBrokerForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Contact Email</label>
                    <input value={brokerForm.contactEmail} onChange={(e) => setBrokerForm((p) => ({ ...p, contactEmail: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewBroker(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateBroker} disabled={brokerCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {brokerCreating ? 'Saving…' : 'Save Broker'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Name</th><th>Contact Email</th><th>Delivery Mode</th><th>Status</th></tr></thead>
              <tbody>
                {brokers.map((b) => (
                  <tr key={b.id}>
                    <td className="text-[#C8D3E8] font-medium">{b.name}</td>
                    <td className="text-[#A8B4C8]">{b.contactEmail}</td>
                    <td className="text-[#6B7A95]">{b.deliveryMode}</td>
                    <td><StatusBadge status={b.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {brokers.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No brokers configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Custodians' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Custodians</div>
              <button onClick={() => setShowNewCustodian(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Custodian
              </button>
            </div>
            {showNewCustodian && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Custodian</span>
                  <button onClick={() => setShowNewCustodian(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Name</label>
                    <input value={custodianForm.name} onChange={(e) => setCustodianForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Contact Email</label>
                    <input value={custodianForm.contactEmail} onChange={(e) => setCustodianForm((p) => ({ ...p, contactEmail: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewCustodian(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateCustodian} disabled={custodianCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {custodianCreating ? 'Saving…' : 'Save Custodian'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Name</th><th>Contact Email</th><th>Delivery Mode</th><th>Status</th></tr></thead>
              <tbody>
                {custodians.map((c) => (
                  <tr key={c.id}>
                    <td className="text-[#C8D3E8] font-medium">{c.name}</td>
                    <td className="text-[#A8B4C8]">{c.contactEmail}</td>
                    <td className="text-[#6B7A95]">{c.deliveryMode}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {custodians.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No custodians configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Commissions' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Commission Rates</div>
              <button onClick={() => setShowNewCommission(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Commission
              </button>
            </div>
            {showNewCommission && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Commission Rate</span>
                  <button onClick={() => setShowNewCommission(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Stakeholder</label>
                    <select value={commissionForm.stakeholderProfileId} onChange={(e) => setCommissionForm((p) => ({ ...p, stakeholderProfileId: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                      <option value="" disabled>Select stakeholder…</option>
                      {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.profileType})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Rate (bps)</label>
                    <input type="number" value={commissionForm.rateBps} onChange={(e) => setCommissionForm((p) => ({ ...p, rateBps: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewCommission(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateCommission} disabled={commissionCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {commissionCreating ? 'Saving…' : 'Save Commission'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Stakeholder</th><th>Instrument Type</th><th className="text-right">Rate (bps)</th><th className="text-right">Flat Fee</th><th>Currency</th><th>Status</th></tr></thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="text-[#C8D3E8]">{stakeholderName(c.stakeholderProfileId)}</td>
                    <td className="text-[#6B7A95]">{c.instrumentTypeCode ?? 'All'}</td>
                    <td className="text-right font-mono">{c.rateBps}</td>
                    <td className="text-right font-mono">{c.flatFee ?? '—'}</td>
                    <td className="font-mono text-[#A8B4C8]">{c.currencyCode}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {commissions.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No commission rates configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Currencies' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Currencies</div>
              <button onClick={() => setShowNewCurrency(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Currency
              </button>
            </div>
            {showNewCurrency && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Currency</span>
                  <button onClick={() => setShowNewCurrency(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Code</label>
                    <input value={currencyForm.code} onChange={(e) => setCurrencyForm((p) => ({ ...p, code: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Name</label>
                    <input value={currencyForm.name} onChange={(e) => setCurrencyForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Symbol</label>
                    <input value={currencyForm.symbol} onChange={(e) => setCurrencyForm((p) => ({ ...p, symbol: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewCurrency(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateCurrency} disabled={setupCurrencyCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {setupCurrencyCreating ? 'Saving…' : 'Save Currency'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Name</th><th>Symbol</th><th>Default</th><th>Status</th></tr></thead>
              <tbody>
                {setupCurrencies.map((c) => (
                  <tr key={c.id}>
                    <td className="text-[#60A5FA] font-mono font-bold">{c.code}</td>
                    <td className="text-[#C8D3E8] font-medium">{c.name}</td>
                    <td className="font-mono text-[#A8B4C8]">{c.symbol}</td>
                    <td className="text-[#6B7A95]">{c.isDefault ? 'Yes' : '—'}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {setupCurrencies.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No currencies configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Countries' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Countries</div>
              <button onClick={() => setShowNewCountry(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Country
              </button>
            </div>
            {showNewCountry && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Country</span>
                  <button onClick={() => setShowNewCountry(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country Code</label>
                    <input value={countryForm.countryCode} onChange={(e) => setCountryForm((p) => ({ ...p, countryCode: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country Name</label>
                    <input value={countryForm.countryName} onChange={(e) => setCountryForm((p) => ({ ...p, countryName: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Region</label>
                    <input value={countryForm.region} onChange={(e) => setCountryForm((p) => ({ ...p, region: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewCountry(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateCountry} disabled={countryCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {countryCreating ? 'Saving…' : 'Save Country'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Name</th><th>Region</th><th>Status</th></tr></thead>
              <tbody>
                {countries.map((c) => (
                  <tr key={c.id}>
                    <td className="text-[#60A5FA] font-mono font-bold">{c.countryCode}</td>
                    <td className="text-[#C8D3E8] font-medium">{c.countryName}</td>
                    <td className="text-[#6B7A95]">{c.region}</td>
                    <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {countries.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No countries configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Issuers' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Issuers</div>
              <div className="flex items-center gap-2">
                <select
                  value={issuerCountryFilter}
                  onChange={(e) => setIssuerCountryFilter(e.target.value)}
                  className="bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60"
                >
                  <option value="" disabled>Select country…</option>
                  {countries.map((c) => <option key={c.id} value={c.countryCode}>{c.countryName} ({c.countryCode})</option>)}
                </select>
                <button onClick={() => setShowNewIssuer(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                  <Plus className="w-3 h-3" /> Add Issuer
                </button>
              </div>
            </div>
            {showNewIssuer && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Issuer</span>
                  <button onClick={() => setShowNewIssuer(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Issuer Code</label>
                    <input value={issuerForm.issuerCode} onChange={(e) => setIssuerForm((p) => ({ ...p, issuerCode: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Legal Name</label>
                    <input value={issuerForm.legalName} onChange={(e) => setIssuerForm((p) => ({ ...p, legalName: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country</label>
                    <select value={issuerForm.countryCode} onChange={(e) => setIssuerForm((p) => ({ ...p, countryCode: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60">
                      <option value="" disabled>Select country…</option>
                      {countries.map((c) => <option key={c.id} value={c.countryCode}>{c.countryName} ({c.countryCode})</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewIssuer(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateIssuer} disabled={issuerCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {issuerCreating ? 'Saving…' : 'Save Issuer'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Legal Name</th><th>Country</th><th>Sector</th><th>Status</th></tr></thead>
              <tbody>
                {issuers.map((i) => (
                  <tr key={i.id}>
                    <td className="text-[#60A5FA] font-mono font-bold">{i.issuerCode}</td>
                    <td className="text-[#C8D3E8] font-medium">{i.legalName}</td>
                    <td className="text-[#6B7A95]">{i.countryCode}</td>
                    <td className="text-[#6B7A95]">{i.sector ?? '—'}</td>
                    <td><StatusBadge status={i.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {issuers.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>
                    {issuerCountryFilter ? 'No issuers found for this country.' : 'Select a country to view its issuers.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Markets' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Markets</div>
              <button onClick={() => setShowNewMarket(true)} className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Market
              </button>
            </div>
            {showNewMarket && (
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-[#E8EDF5]">New Market</span>
                  <button onClick={() => setShowNewMarket(false)} className="text-[#6B7A95] hover:text-[#EF4444]"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Market Code</label>
                    <input value={marketForm.marketCode} onChange={(e) => setMarketForm((p) => ({ ...p, marketCode: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Market Name</label>
                    <input value={marketForm.marketName} onChange={(e) => setMarketForm((p) => ({ ...p, marketName: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country Code</label>
                    <input value={marketForm.countryCode} onChange={(e) => setMarketForm((p) => ({ ...p, countryCode: e.target.value }))}
                      className="w-full bg-[#111C30] border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-[#C8D3E8] outline-none focus:border-[#2563EB]/60 font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button onClick={() => setShowNewMarket(false)} className="bg-[#111C30] text-[#A8B4C8] text-xs px-3 py-1.5 rounded border border-white/[0.06] hover:bg-[#1A2540]">Cancel</button>
                  <button onClick={handleCreateMarket} disabled={marketCreating} className="bg-[#2563EB] text-white text-xs font-medium px-4 py-1.5 rounded hover:bg-[#1D4ED8] disabled:opacity-50">
                    {marketCreating ? 'Saving…' : 'Save Market'}
                  </button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead><tr><th>Code</th><th>Name</th><th>Country</th><th>Exchange Code</th><th>Status</th></tr></thead>
              <tbody>
                {markets.map((m) => (
                  <tr key={m.id}>
                    <td className="text-[#60A5FA] font-mono font-bold">{m.marketCode}</td>
                    <td className="text-[#C8D3E8] font-medium">{m.marketName}</td>
                    <td className="text-[#6B7A95]">{m.countryCode}</td>
                    <td className="font-mono text-[#A8B4C8]">{m.exchangeCode ?? '—'}</td>
                    <td><StatusBadge status={m.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                ))}
                {markets.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No markets configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Price APIs' && (
          <div className="space-y-3">
            {priceSources.map(api => (
              <div key={api.sourceCode} className="bg-[#0D1526] border border-white/[0.06] rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      api.isEnabled ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                    )} />
                    <div>
                      <div className="text-xs font-semibold text-[#E8EDF5]">{api.displayName}</div>
                      <div className="text-[10px] text-[#4B5A72] font-mono">{api.sourceCode}</div>
                    </div>
                  </div>
                  <StatusBadge status={api.isEnabled ? 'active' : 'inactive'} />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Last Successful Run', value: api.lastSuccessfulRun ? new Date(api.lastSuccessfulRun).toLocaleString() : '—' },
                    { label: 'Ticks Today', value: api.ticksToday.toLocaleString() },
                    { label: 'Failed Requests', value: api.failedRequests },
                    { label: 'Retry Count', value: api.retryCount },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-0.5">{f.label}</div>
                      <div className={cn('text-xs font-mono', f.label === 'Failed Requests' && Number(f.value) > 0 ? 'text-[#EF4444]' : 'text-[#C8D3E8]')}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-[#6B7A95]">
                  Message: <span className={cn('ml-1', api.failedRequests > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]')}>{api.message}</span>
                </div>
              </div>
            ))}
            {priceSources.length === 0 && (
              <div className="text-center py-8 text-[12px]" style={{ color: '#64748b' }}>No price sources configured.</div>
            )}
          </div>
        )}

        {activeTab === 'Instrument Types' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Instrument Types</div>
              <button className="flex items-center gap-1.5 bg-[#2563EB] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#1D4ED8]">
                <Plus className="w-3 h-3" /> Add Type
              </button>
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-white/[0.04]">
              {instrumentTypes.map(t => (
                <span key={t.code} className="bg-[#1E3A5F] text-[#60A5FA] text-[11px] font-semibold px-3 py-1 rounded-full">
                  {t.code}
                </span>
              ))}
            </div>
            <table className="arcus-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Subcategories</th>
                  <th>API Filter</th>
                  <th>Valuation Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {instrumentTypes.map(t => (
                  <tr key={t.code}>
                    <td className="text-[#60A5FA] font-mono font-bold">{t.code}</td>
                    <td className="text-[#C8D3E8] font-medium">{t.name}</td>
                    <td className="text-[#6B7A95]">{t.subcategories}</td>
                    <td className="font-mono text-[#A8B4C8] text-[11px]">{t.apiFilter}</td>
                    <td className="text-[#A8B4C8]">{t.valuationMethod}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
