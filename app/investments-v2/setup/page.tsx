'use client'

import { Fragment, useEffect, useState } from 'react'
import { PageHeader } from '@/components/investments-v2/page-header'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, Download, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useThemeContainer } from '@/components/investments-v2/ui/use-theme-container'
import { exportRowsToCsv } from '@/components/investments-v2/ui/export-csv'
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
import { useSortedPaginated } from '@/components/investments-v2/ui/use-sorted-paginated'
import { SortableTh } from '@/components/investments-v2/ui/sortable-th'
import { TablePagination } from '@/components/investments-v2/ui/table-pagination'

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
  const { ref: rootRef, container: themeContainer } = useThemeContainer()

  const [activeTab, setActiveTab] = useState('System Settings')
  const [userComboOpenFundId, setUserComboOpenFundId] = useState<string | null>(null)

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

  type FundSortKey = 'name' | 'baseCurrency' | 'totalAmount' | 'remainingAmount' | 'status'
  const fundsTable = useSortedPaginated<(typeof setupFunds)[number], FundSortKey>(
    setupFunds,
    (f, key) => {
      if (key === 'baseCurrency') return f.listedEquityFundConfig?.baseCurrencyCode ?? ''
      if (key === 'totalAmount') return Number(f.totalAmount)
      if (key === 'remainingAmount') return Number(f.remainingAmount)
      if (key === 'status') return f.status
      return f.name
    },
    'name',
    10
  )

  type StakeholderSortKey = 'name' | 'contactEmail' | 'status'
  const brokersTable = useSortedPaginated<(typeof brokers)[number], StakeholderSortKey>(
    brokers,
    (b, key) => (key === 'status' ? (b.isActive ? 1 : 0) : b[key]),
    'name',
    10
  )
  const custodiansTable = useSortedPaginated<(typeof custodians)[number], StakeholderSortKey>(
    custodians,
    (c, key) => (key === 'status' ? (c.isActive ? 1 : 0) : c[key]),
    'name',
    10
  )

  type CommissionSortKey = 'stakeholder' | 'rateBps' | 'currency' | 'status'
  const commissionsTable = useSortedPaginated<(typeof commissions)[number], CommissionSortKey>(
    commissions,
    (c, key) => {
      if (key === 'stakeholder') return stakeholderName(c.stakeholderProfileId)
      if (key === 'rateBps') return c.rateBps
      if (key === 'currency') return c.currencyCode
      return c.isActive ? 1 : 0
    },
    'stakeholder',
    10
  )

  type CurrencySortKey = 'code' | 'name' | 'status'
  const currenciesTable = useSortedPaginated<(typeof setupCurrencies)[number], CurrencySortKey>(
    setupCurrencies,
    (c, key) => (key === 'status' ? (c.isActive ? 1 : 0) : c[key]),
    'code',
    10
  )

  type CountrySortKey = 'countryCode' | 'countryName' | 'region'
  const countriesTable = useSortedPaginated<(typeof countries)[number], CountrySortKey>(
    countries,
    (c, key) => c[key],
    'countryName',
    10
  )

  type IssuerSortKey = 'issuerCode' | 'legalName' | 'countryCode'
  const issuersTable = useSortedPaginated<(typeof issuers)[number], IssuerSortKey>(
    issuers,
    (i, key) => i[key] ?? '',
    'legalName',
    10
  )

  type MarketSortKey = 'marketCode' | 'marketName' | 'countryCode'
  const marketsTable = useSortedPaginated<(typeof markets)[number], MarketSortKey>(
    markets,
    (m, key) => m[key] ?? '',
    'marketName',
    10
  )

  return (
    <div ref={rootRef} className="flex flex-col h-full w-full">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `funds-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Name', 'Base Currency', 'Fund Purpose', 'Total Amount', 'Remaining', 'Status'],
                      fundsTable.sorted.map((f) => [
                        f.name,
                        f.listedEquityFundConfig?.baseCurrencyCode ?? '',
                        f.fundPurpose,
                        f.totalAmount,
                        f.remainingAmount,
                        f.status,
                      ])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewFund(true)}>
                  <Plus className="w-3 h-3" /> New Fund
                </Button>
              </div>
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
                    <Input value={fundForm.name} onChange={(e) => setFundForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Description</label>
                    <Input value={fundForm.description} onChange={(e) => setFundForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Base Currency</label>
                    <Input value={fundForm.baseCurrencyCode} onChange={(e) => setFundForm((p) => ({ ...p, baseCurrencyCode: e.target.value }))} className="font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewFund(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateFund} disabled={setupFundCreating}>
                    {setupFundCreating ? 'Saving…' : 'Save Fund'}
                  </Button>
                </div>
              </div>
            )}

            <table className="arcus-table">
              <thead>
                <tr>
                  <th />
                  <SortableTh col="name" label="Name" sortKey={fundsTable.sortKey} sortDir={fundsTable.sortDir} onSort={fundsTable.toggleSort} />
                  <SortableTh col="baseCurrency" label="Base Currency" sortKey={fundsTable.sortKey} sortDir={fundsTable.sortDir} onSort={fundsTable.toggleSort} />
                  <th>Fund Purpose</th>
                  <SortableTh col="totalAmount" label="Total Amount" sortKey={fundsTable.sortKey} sortDir={fundsTable.sortDir} onSort={fundsTable.toggleSort} align="right" />
                  <SortableTh col="remainingAmount" label="Remaining" sortKey={fundsTable.sortKey} sortDir={fundsTable.sortDir} onSort={fundsTable.toggleSort} align="right" />
                  <SortableTh col="status" label="Status" sortKey={fundsTable.sortKey} sortDir={fundsTable.sortDir} onSort={fundsTable.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {fundsTable.pageRows.map((fund) => {
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
                                    <Input value={cfgForm.baseCurrencyCode}
                                      onChange={(e) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], baseCurrencyCode: e.target.value } }))}
                                      className="font-mono" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Trust Bank ID</label>
                                    <Input value={cfgForm.trustBankId}
                                      onChange={(e) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], trustBankId: e.target.value } }))}
                                      className="font-mono" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Broker</label>
                                    <Select value={cfgForm.brokerProfileId} onValueChange={(v) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], brokerProfileId: v } }))}>
                                      <SelectTrigger className="w-full rounded-full"><SelectValue placeholder="—" /></SelectTrigger>
                                      <SelectContent container={themeContainer}>
                                        {brokers.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Custodian</label>
                                    <Select value={cfgForm.custodianProfileId} onValueChange={(v) => setConfigFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], custodianProfileId: v } }))}>
                                      <SelectTrigger className="w-full rounded-full"><SelectValue placeholder="—" /></SelectTrigger>
                                      <SelectContent container={themeContainer}>
                                        {custodians.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
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
                                  <Button size="sm" variant="default" className="rounded-full" onClick={() => handleSaveConfig(fund.id)} disabled={fundConfigSaving}>
                                    {fundConfigSaving ? 'Saving…' : 'Save Config'}
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <div className="text-[11px] font-semibold text-[#E8EDF5] mb-2">Assign Manager</div>
                                <div className="flex items-center gap-2">
                                  <Popover open={userComboOpenFundId === fund.id} onOpenChange={(o) => setUserComboOpenFundId(o ? fund.id : null)}>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" role="combobox" className="flex-1 justify-between rounded-full font-normal">
                                        <span className="truncate">
                                          {(() => {
                                            const u = users.find((u) => u.id === mgrForm.userId)
                                            return u ? userLabel(u) : 'Select user…'
                                          })()}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start" container={themeContainer}>
                                      <Command>
                                        <CommandInput placeholder="Search users…" />
                                        <CommandList>
                                          <CommandEmpty>No users found.</CommandEmpty>
                                          <CommandGroup>
                                            {users.map((u) => (
                                              <CommandItem
                                                key={u.id}
                                                value={userLabel(u)}
                                                onSelect={() => {
                                                  setManagerFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], userId: u.id } }))
                                                  setUserComboOpenFundId(null)
                                                }}
                                              >
                                                <Check className={cn('mr-2 h-4 w-4', mgrForm.userId === u.id ? 'opacity-100' : 'opacity-0')} />
                                                {userLabel(u)}
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <Input
                                    value={mgrForm.role}
                                    onChange={(e) => setManagerFormByFundId((p) => ({ ...p, [fund.id]: { ...p[fund.id], role: e.target.value } }))}
                                    className="w-40 font-mono"
                                  />
                                  <Button size="sm" variant="default" className="rounded-full whitespace-nowrap" onClick={() => handleAssignManager(fund.id)} disabled={fundManagerAssigning}>
                                    {fundManagerAssigning ? 'Assigning…' : 'Assign'}
                                  </Button>
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
              <Button variant="outline" size="pill" onClick={handleSaveSettings} disabled={setupSettingsSaving}>
                {setupSettingsSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                <div className="text-xs text-[#A8B4C8] w-56">Stale Price Threshold</div>
                <div className="flex-1 max-w-xs flex items-center gap-2">
                  <Input
                    type="number"
                    value={settingsForm.staleHours}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, staleHours: e.target.value }))}
                    className="w-24 font-mono"
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
                <Input
                  value={settingsForm.valuationMethod}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, valuationMethod: e.target.value }))}
                  className="flex-1 max-w-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Brokers' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Brokers</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `brokers-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Name', 'Contact Email', 'Delivery Mode', 'Status'],
                      brokersTable.sorted.map((b) => [b.name, b.contactEmail, b.deliveryMode, b.isActive ? 'active' : 'inactive'])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewBroker(true)}>
                  <Plus className="w-3 h-3" /> Add Broker
                </Button>
              </div>
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
                    <Input value={brokerForm.name} onChange={(e) => setBrokerForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Contact Email</label>
                    <Input value={brokerForm.contactEmail} onChange={(e) => setBrokerForm((p) => ({ ...p, contactEmail: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewBroker(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateBroker} disabled={brokerCreating}>
                    {brokerCreating ? 'Saving…' : 'Save Broker'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="name" label="Name" sortKey={brokersTable.sortKey} sortDir={brokersTable.sortDir} onSort={brokersTable.toggleSort} />
                  <SortableTh col="contactEmail" label="Contact Email" sortKey={brokersTable.sortKey} sortDir={brokersTable.sortDir} onSort={brokersTable.toggleSort} />
                  <th>Delivery Mode</th>
                  <SortableTh col="status" label="Status" sortKey={brokersTable.sortKey} sortDir={brokersTable.sortDir} onSort={brokersTable.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {brokersTable.pageRows.map((b) => (
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
            <TablePagination page={brokersTable.page} totalPages={brokersTable.totalPages} onPageChange={brokersTable.setPage} rowsShown={brokersTable.pageRows.length} totalRows={brokersTable.totalRows} />
          </div>
        )}

        {activeTab === 'Custodians' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Custodians</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `custodians-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Name', 'Contact Email', 'Delivery Mode', 'Status'],
                      custodiansTable.sorted.map((c) => [c.name, c.contactEmail, c.deliveryMode, c.isActive ? 'active' : 'inactive'])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewCustodian(true)}>
                  <Plus className="w-3 h-3" /> Add Custodian
                </Button>
              </div>
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
                    <Input value={custodianForm.name} onChange={(e) => setCustodianForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Contact Email</label>
                    <Input value={custodianForm.contactEmail} onChange={(e) => setCustodianForm((p) => ({ ...p, contactEmail: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewCustodian(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateCustodian} disabled={custodianCreating}>
                    {custodianCreating ? 'Saving…' : 'Save Custodian'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="name" label="Name" sortKey={custodiansTable.sortKey} sortDir={custodiansTable.sortDir} onSort={custodiansTable.toggleSort} />
                  <SortableTh col="contactEmail" label="Contact Email" sortKey={custodiansTable.sortKey} sortDir={custodiansTable.sortDir} onSort={custodiansTable.toggleSort} />
                  <th>Delivery Mode</th>
                  <SortableTh col="status" label="Status" sortKey={custodiansTable.sortKey} sortDir={custodiansTable.sortDir} onSort={custodiansTable.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {custodiansTable.pageRows.map((c) => (
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
            <TablePagination page={custodiansTable.page} totalPages={custodiansTable.totalPages} onPageChange={custodiansTable.setPage} rowsShown={custodiansTable.pageRows.length} totalRows={custodiansTable.totalRows} />
          </div>
        )}

        {activeTab === 'Commissions' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Commission Rates</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `commissions-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Stakeholder', 'Instrument Type', 'Rate (bps)', 'Flat Fee', 'Currency', 'Status'],
                      commissionsTable.sorted.map((c) => [
                        stakeholderName(c.stakeholderProfileId),
                        c.instrumentTypeCode ?? 'All',
                        c.rateBps,
                        c.flatFee ?? '',
                        c.currencyCode,
                        c.isActive ? 'active' : 'inactive',
                      ])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewCommission(true)}>
                  <Plus className="w-3 h-3" /> Add Commission
                </Button>
              </div>
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
                    <Select value={commissionForm.stakeholderProfileId} onValueChange={(v) => setCommissionForm((p) => ({ ...p, stakeholderProfileId: v }))}>
                      <SelectTrigger className="w-full rounded-full"><SelectValue placeholder="Select stakeholder…" /></SelectTrigger>
                      <SelectContent container={themeContainer}>
                        {stakeholders.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.profileType})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Rate (bps)</label>
                    <Input type="number" value={commissionForm.rateBps} onChange={(e) => setCommissionForm((p) => ({ ...p, rateBps: e.target.value }))} className="font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewCommission(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateCommission} disabled={commissionCreating}>
                    {commissionCreating ? 'Saving…' : 'Save Commission'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="stakeholder" label="Stakeholder" sortKey={commissionsTable.sortKey} sortDir={commissionsTable.sortDir} onSort={commissionsTable.toggleSort} />
                  <th>Instrument Type</th>
                  <SortableTh col="rateBps" label="Rate (bps)" sortKey={commissionsTable.sortKey} sortDir={commissionsTable.sortDir} onSort={commissionsTable.toggleSort} align="right" />
                  <th className="text-right">Flat Fee</th>
                  <SortableTh col="currency" label="Currency" sortKey={commissionsTable.sortKey} sortDir={commissionsTable.sortDir} onSort={commissionsTable.toggleSort} />
                  <SortableTh col="status" label="Status" sortKey={commissionsTable.sortKey} sortDir={commissionsTable.sortDir} onSort={commissionsTable.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {commissionsTable.pageRows.map((c) => (
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
            <TablePagination page={commissionsTable.page} totalPages={commissionsTable.totalPages} onPageChange={commissionsTable.setPage} rowsShown={commissionsTable.pageRows.length} totalRows={commissionsTable.totalRows} />
          </div>
        )}

        {activeTab === 'Currencies' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Currencies</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `currencies-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Code', 'Name', 'Symbol', 'Default', 'Status'],
                      currenciesTable.sorted.map((c) => [c.code, c.name, c.symbol, c.isDefault ? 'Yes' : '', c.isActive ? 'active' : 'inactive'])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewCurrency(true)}>
                  <Plus className="w-3 h-3" /> Add Currency
                </Button>
              </div>
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
                    <Input value={currencyForm.code} onChange={(e) => setCurrencyForm((p) => ({ ...p, code: e.target.value }))} className="font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Name</label>
                    <Input value={currencyForm.name} onChange={(e) => setCurrencyForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Symbol</label>
                    <Input value={currencyForm.symbol} onChange={(e) => setCurrencyForm((p) => ({ ...p, symbol: e.target.value }))} className="font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewCurrency(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateCurrency} disabled={setupCurrencyCreating}>
                    {setupCurrencyCreating ? 'Saving…' : 'Save Currency'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="code" label="Code" sortKey={currenciesTable.sortKey} sortDir={currenciesTable.sortDir} onSort={currenciesTable.toggleSort} />
                  <SortableTh col="name" label="Name" sortKey={currenciesTable.sortKey} sortDir={currenciesTable.sortDir} onSort={currenciesTable.toggleSort} />
                  <th>Symbol</th>
                  <th>Default</th>
                  <SortableTh col="status" label="Status" sortKey={currenciesTable.sortKey} sortDir={currenciesTable.sortDir} onSort={currenciesTable.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {currenciesTable.pageRows.map((c) => (
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
            <TablePagination page={currenciesTable.page} totalPages={currenciesTable.totalPages} onPageChange={currenciesTable.setPage} rowsShown={currenciesTable.pageRows.length} totalRows={currenciesTable.totalRows} />
          </div>
        )}

        {activeTab === 'Countries' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Countries</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `countries-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Code', 'Name', 'Region', 'Status'],
                      countriesTable.sorted.map((c) => [c.countryCode, c.countryName, c.region, c.isActive ? 'active' : 'inactive'])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewCountry(true)}>
                  <Plus className="w-3 h-3" /> Add Country
                </Button>
              </div>
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
                    <Input value={countryForm.countryCode} onChange={(e) => setCountryForm((p) => ({ ...p, countryCode: e.target.value }))} className="font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country Name</label>
                    <Input value={countryForm.countryName} onChange={(e) => setCountryForm((p) => ({ ...p, countryName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Region</label>
                    <Input value={countryForm.region} onChange={(e) => setCountryForm((p) => ({ ...p, region: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewCountry(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateCountry} disabled={countryCreating}>
                    {countryCreating ? 'Saving…' : 'Save Country'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="countryCode" label="Code" sortKey={countriesTable.sortKey} sortDir={countriesTable.sortDir} onSort={countriesTable.toggleSort} />
                  <SortableTh col="countryName" label="Name" sortKey={countriesTable.sortKey} sortDir={countriesTable.sortDir} onSort={countriesTable.toggleSort} />
                  <SortableTh col="region" label="Region" sortKey={countriesTable.sortKey} sortDir={countriesTable.sortDir} onSort={countriesTable.toggleSort} />
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {countriesTable.pageRows.map((c) => (
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
            <TablePagination page={countriesTable.page} totalPages={countriesTable.totalPages} onPageChange={countriesTable.setPage} rowsShown={countriesTable.pageRows.length} totalRows={countriesTable.totalRows} />
          </div>
        )}

        {activeTab === 'Issuers' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Issuers</div>
              <div className="flex items-center gap-2">
                <Select value={issuerCountryFilter} onValueChange={setIssuerCountryFilter}>
                  <SelectTrigger className="w-44 rounded-full"><SelectValue placeholder="Select country…" /></SelectTrigger>
                  <SelectContent container={themeContainer}>
                    {countries.map((c) => <SelectItem key={c.id} value={c.countryCode}>{c.countryName} ({c.countryCode})</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `issuers-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Code', 'Legal Name', 'Country', 'Sector', 'Status'],
                      issuersTable.sorted.map((i) => [i.issuerCode, i.legalName, i.countryCode, i.sector ?? '', i.isActive ? 'active' : 'inactive'])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewIssuer(true)}>
                  <Plus className="w-3 h-3" /> Add Issuer
                </Button>
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
                    <Input value={issuerForm.issuerCode} onChange={(e) => setIssuerForm((p) => ({ ...p, issuerCode: e.target.value }))} className="font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Legal Name</label>
                    <Input value={issuerForm.legalName} onChange={(e) => setIssuerForm((p) => ({ ...p, legalName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country</label>
                    <Select value={issuerForm.countryCode} onValueChange={(v) => setIssuerForm((p) => ({ ...p, countryCode: v }))}>
                      <SelectTrigger className="w-full rounded-full"><SelectValue placeholder="Select country…" /></SelectTrigger>
                      <SelectContent container={themeContainer}>
                        {countries.map((c) => <SelectItem key={c.id} value={c.countryCode}>{c.countryName} ({c.countryCode})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewIssuer(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateIssuer} disabled={issuerCreating}>
                    {issuerCreating ? 'Saving…' : 'Save Issuer'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="issuerCode" label="Code" sortKey={issuersTable.sortKey} sortDir={issuersTable.sortDir} onSort={issuersTable.toggleSort} />
                  <SortableTh col="legalName" label="Legal Name" sortKey={issuersTable.sortKey} sortDir={issuersTable.sortDir} onSort={issuersTable.toggleSort} />
                  <SortableTh col="countryCode" label="Country" sortKey={issuersTable.sortKey} sortDir={issuersTable.sortDir} onSort={issuersTable.toggleSort} />
                  <th>Sector</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {issuersTable.pageRows.map((i) => (
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
            <TablePagination page={issuersTable.page} totalPages={issuersTable.totalPages} onPageChange={issuersTable.setPage} rowsShown={issuersTable.pageRows.length} totalRows={issuersTable.totalRows} />
          </div>
        )}

        {activeTab === 'Markets' && (
          <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="text-xs font-semibold text-[#E8EDF5]">Markets</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="pill"
                  onClick={() =>
                    exportRowsToCsv(
                      `markets-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Code', 'Name', 'Country', 'Exchange Code', 'Status'],
                      marketsTable.sorted.map((m) => [m.marketCode, m.marketName, m.countryCode, m.exchangeCode ?? '', m.isActive ? 'active' : 'inactive'])
                    )
                  }
                >
                  <Download className="w-3 h-3" /> Export
                </Button>
                <Button variant="default" size="pill" onClick={() => setShowNewMarket(true)}>
                  <Plus className="w-3 h-3" /> Add Market
                </Button>
              </div>
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
                    <Input value={marketForm.marketCode} onChange={(e) => setMarketForm((p) => ({ ...p, marketCode: e.target.value }))} className="font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Market Name</label>
                    <Input value={marketForm.marketName} onChange={(e) => setMarketForm((p) => ({ ...p, marketName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6B7A95] uppercase tracking-wider block mb-1">Country Code</label>
                    <Input value={marketForm.countryCode} onChange={(e) => setMarketForm((p) => ({ ...p, countryCode: e.target.value }))} className="font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="outline" size="pill" onClick={() => setShowNewMarket(false)}>Cancel</Button>
                  <Button variant="default" size="pill" onClick={handleCreateMarket} disabled={marketCreating}>
                    {marketCreating ? 'Saving…' : 'Save Market'}
                  </Button>
                </div>
              </div>
            )}
            <table className="arcus-table">
              <thead>
                <tr>
                  <SortableTh col="marketCode" label="Code" sortKey={marketsTable.sortKey} sortDir={marketsTable.sortDir} onSort={marketsTable.toggleSort} />
                  <SortableTh col="marketName" label="Name" sortKey={marketsTable.sortKey} sortDir={marketsTable.sortDir} onSort={marketsTable.toggleSort} />
                  <SortableTh col="countryCode" label="Country" sortKey={marketsTable.sortKey} sortDir={marketsTable.sortDir} onSort={marketsTable.toggleSort} />
                  <th>Exchange Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {marketsTable.pageRows.map((m) => (
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
            <TablePagination page={marketsTable.page} totalPages={marketsTable.totalPages} onPageChange={marketsTable.setPage} rowsShown={marketsTable.pageRows.length} totalRows={marketsTable.totalRows} />
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
              <Button variant="default" size="pill">
                <Plus className="w-3 h-3" /> Add Type
              </Button>
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
