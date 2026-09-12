'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Check, ChevronDown, CircleAlert, CircleCheck, CircleX, GripVertical, Loader2,
  MessageCircle, Pencil, Plus, RefreshCw, Search, TriangleAlert, X,
} from 'lucide-react'
import { OpsListSkeleton, OpsTablePanelSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { cn } from '@/lib/utils'
import {
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type SetupCorporateActionMapping,
  type SetupInstrumentType,
  type SetupTag,
} from '@/lib/api/investment-ops-api'
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
  updateSetupSettings,
  createBroker,
  updateBroker,
  createCustodian,
  updateCustodian,
  createCommission,
  createMarket,
  createSetupCurrency,
  createCountry,
  createIssuer,
} from '@/lib/store/slices/investmentOpsSlice'

export const cardClass = 'overflow-hidden rounded-[24px] border border-white/[0.05] bg-[linear-gradient(112deg,#172231_0%,#101a29_55%,#0c1522_100%)] shadow-[0_18px_45px_rgba(0,0,0,.18)]'
export const fieldClass = 'h-9 w-full rounded-full border border-white/10 bg-[#0b1421] px-3 iv2-text-label text-white outline-none transition placeholder:text-[#526176] focus:border-[#2f87fa] focus:ring-2 focus:ring-[#2f87fa]/20'
export const buttonClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-5 iv2-text-label font-semibold text-[#111722] transition hover:bg-[#edf2f8] disabled:opacity-50'
export const secondaryButtonClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 iv2-text-label font-medium text-[#b8c3d2] transition hover:bg-white/[0.08] hover:text-white'

export function SetupHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><h1 className="text-[15px] font-semibold text-white">{title}</h1><p className="mt-1 iv2-text-label text-[#718095]">{description}</p></div>
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
      {label && <span className="mb-1.5 block iv2-text-micro uppercase tracking-[.12em] text-[#718095]">{label}</span>}
      <button type="button" onClick={() => setOpen(!open)} className={cn(fieldClass, 'flex items-center justify-between text-left')}>
        <span className="truncate">{value}</span><ChevronDown className="h-3.5 w-3.5 text-[#718095]" />
      </button>
      {open && <><button aria-label="Close options" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#111b29] p-1.5 shadow-2xl">
          {options.map(option => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false) }}
            className={cn('flex w-full items-center justify-between rounded-full px-3 py-2 text-left iv2-text-label hover:bg-white/[0.07]', option === value ? 'text-[#69a9ff]' : 'text-[#bdc7d5]')}>
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

export function SetupModal({ title, description, children, onClose, onSubmit, submitLabel = 'Save', submitDisabled = false }: {
  title: string; description?: string; children: ReactNode; onClose: () => void; onSubmit: () => void; submitLabel?: string; submitDisabled?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 dark:bg-black/75" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()} className="w-full max-w-lg rounded-[24px] border border-white/10 bg-[#111b29] p-5 shadow-[0_28px_90px_rgba(0,0,0,.65)]">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="text-sm font-semibold text-white">{title}</h2>{description && <p className="mt-1 iv2-text-label text-[#76859a]">{description}</p>}</div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#8391a4] hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButtonClass}>Cancel</button><button type="button" onClick={onSubmit} disabled={submitDisabled} className={buttonClass}>{submitLabel}</button></div>
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

function formatSetupSettingValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (value.every((item) => typeof item === 'string' || typeof item === 'number')) {
      return value.join(', ')
    }
    const preview = value.slice(0, 3).map((item) => {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>
        return String(rec.name ?? rec.code ?? rec.label ?? rec.id ?? 'item')
      }
      return String(item)
    })
    return value.length > 3 ? `${preview.join(', ')} (+${value.length - 3} more)` : preview.join(', ')
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('enabled' in obj) return obj.enabled ? 'Enabled' : 'Disabled'
    if ('method' in obj) return String(obj.method)
    if ('items' in obj && Array.isArray(obj.items)) {
      return formatSetupSettingValue(obj.items)
    }
    if ('version' in obj && Object.keys(obj).length <= 2) {
      return 'version' in obj && Object.keys(obj).length === 1 ? String(obj.version) : formatSetupSettingValue(obj)
    }
    try {
      const compact = JSON.stringify(value)
      return compact.length > 96 ? `${compact.slice(0, 93)}…` : compact
    } catch {
      return '—'
    }
  }
  return String(value)
}

function settingsEditSeedValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function mappingLabel(row: SetupCorporateActionMapping) {
  const code = typeof row.code === 'string' ? row.code : ''
  const name = typeof row.name === 'string' ? row.name : ''
  return name || code || row.id
}

function mappingValue(row: SetupCorporateActionMapping) {
  const external = typeof row.externalCode === 'string' ? row.externalCode : ''
  const code = typeof row.code === 'string' ? row.code : ''
  return external || code || '—'
}

function tagLabel(row: SetupTag) {
  return row.name || row.code || row.id
}

function tagValue(row: SetupTag) {
  return row.code || '—'
}

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
  const [modal, setModal] = useState<'reference' | 'type' | 'subcategory' | 'corporate' | 'tag' | null>(null)
  const [editingStakeholder, setEditingStakeholder] = useState<{ id: string; profileType: 'BROKER' | 'CUSTODIAN' } | null>(null)
  const [referenceKind, setReferenceKind] = useState<'coupon' | 'icon' | null>(null)
  const [draft, setDraft] = useState({ code: '', name: '', extra: '' })
  const [category, setCategory] = useState('')
  const [instrumentTypes, setInstrumentTypes] = useState<SetupInstrumentType[]>([])
  const [instrumentTypesLoading, setInstrumentTypesLoading] = useState(false)
  const [corporateMappings, setCorporateMappings] = useState<SetupCorporateActionMapping[]>([])
  const [setupTags, setSetupTags] = useState<SetupTag[]>([])
  const [couponFrequencies, setCouponFrequencies] = useState<Array<Record<string, unknown>>>([])
  const [setupIcons, setSetupIcons] = useState<Array<Record<string, unknown>>>([])
  const [subcategories, setSubcategories] = useState<Array<Record<string, unknown>>>([])
  const [setupRefLoading, setSetupRefLoading] = useState(false)
  const [setupLoadError, setSetupLoadError] = useState<string | null>(null)
  const [createSaving, setCreateSaving] = useState(false)
  const [tagEdits, setTagEdits] = useState<Record<string, string>>({})
  const [corpEdits, setCorpEdits] = useState<Record<string, string>>({})
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({})
  const [editSaving, setEditSaving] = useState(false)

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

  const loadInstrumentTypes = async () => {
    setInstrumentTypesLoading(true)
    try {
      const [typesRes, subRes] = await Promise.all([
        investmentOpsApi.listSetupInstrumentTypes(),
        investmentOpsApi.listInstrumentSubcategories().catch(() => null),
      ])
      if (!typesRes.success) throw new Error(formatOpsError(typesRes))
      setInstrumentTypes(unwrapList<SetupInstrumentType>(typesRes.data))
      if (subRes && subRes.success !== false) {
        setSubcategories(unwrapList<Record<string, unknown>>(subRes.data))
      } else {
        setSubcategories([])
      }
    } catch (e) {
      setInstrumentTypes([])
      setSubcategories([])
      setSetupLoadError(e instanceof Error ? e.message : 'Unable to load instrument types.')
    } finally {
      setInstrumentTypesLoading(false)
    }
  }

  const loadSetupReference = async () => {
    setSetupRefLoading(true)
    try {
      const [corpRes, tagRes, couponRes, iconRes] = await Promise.all([
        investmentOpsApi.listCorporateActionMappings(),
        investmentOpsApi.listSetupTags(),
        investmentOpsApi.listCouponFrequencies(),
        investmentOpsApi.listSetupIcons(),
      ])
      if (!corpRes.success) throw new Error(formatOpsError(corpRes))
      if (!tagRes.success) throw new Error(formatOpsError(tagRes))
      if (!couponRes.success) throw new Error(formatOpsError(couponRes))
      if (!iconRes.success) throw new Error(formatOpsError(iconRes))
      setCorporateMappings(unwrapList<SetupCorporateActionMapping>(corpRes.data))
      setSetupTags(unwrapList<SetupTag>(tagRes.data))
      setCouponFrequencies(unwrapList<Record<string, unknown>>(couponRes.data))
      setSetupIcons(unwrapList<Record<string, unknown>>(iconRes.data))
    } catch (e) {
      setCorporateMappings([])
      setSetupTags([])
      setCouponFrequencies([])
      setSetupIcons([])
      setSetupLoadError(e instanceof Error ? e.message : 'Unable to load setup reference data.')
    } finally {
      setSetupRefLoading(false)
    }
  }

  const couponTableRows = useMemo(
    () =>
      couponFrequencies.map((row) => [
        String(row.name ?? row.displayName ?? '—'),
        String(row.code ?? row.bloombergCode ?? '—'),
        String(row.id ?? '—'),
      ]),
    [couponFrequencies],
  )

  useEffect(() => {
    if (activeTab === 'Instrument Types') loadInstrumentTypes()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'Setup') loadSetupReference()
  }, [activeTab])

  const categories = useMemo(
    () => instrumentTypes.map((t) => t.displayName || t.typeCode).filter(Boolean),
    [instrumentTypes],
  )

  useEffect(() => {
    if (!categories.length) {
      if (category) setCategory('')
      return
    }
    if (!category || !categories.includes(category)) setCategory(categories[0])
  }, [categories, category])

  const instrumentTableRows = useMemo(() => {
    const selected = instrumentTypes.filter((t) => (t.displayName || t.typeCode) === category)
    return selected.map((t) => [
      t.typeCode || '—',
      t.displayName || '—',
      t.displayName || '—',
      '—',
      '—',
      t.isActive === false ? 'Inactive' : 'Active',
      '—',
      '—',
    ])
  }, [instrumentTypes, category])

  const liveBrokerRows = useMemo(() => {
    const brokerRows = brokers.map((b) => [
      b.name || b.id || '—',
      b.profileType || 'BROKER',
      b.contactEmail || '—',
      b.deliveryMode || '—',
      b.isActive === false ? 'Inactive' : 'Active',
      b.id,
    ])
    const custodianRows = custodians.map((c) => [
      c.name || c.id || '—',
      c.profileType || 'CUSTODIAN',
      c.contactEmail || '—',
      c.deliveryMode || '—',
      c.isActive === false ? 'Inactive' : 'Active',
      c.id,
    ])
    return [...brokerRows, ...custodianRows]
  }, [brokers, custodians])

  const openEditStakeholder = (id: string, profileType: string) => {
    const row =
      profileType.toUpperCase() === 'CUSTODIAN'
        ? custodians.find((c) => c.id === id)
        : brokers.find((b) => b.id === id)
    if (!row) return
    setEditingStakeholder({
      id: row.id,
      profileType: profileType.toUpperCase() === 'CUSTODIAN' ? 'CUSTODIAN' : 'BROKER',
    })
    setDraft({
      code: row.contactEmail || '',
      name: row.name || '',
      extra: profileType.toUpperCase() === 'CUSTODIAN' ? 'CUSTODIAN' : 'BROKER',
    })
    setReferenceKind(null)
    setModal('reference')
  }

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
        c.decimalPlaces != null ? String(c.decimalPlaces) : c.decimals != null ? String(c.decimals) : '—',
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
    const rows: [string, string][] = []
    for (const [key, value] of Object.entries(setupSettings)) {
      const label = key.replace(/_/g, ' ')
      if (value == null) {
        rows.push([label, '—'])
      } else if (typeof value === 'boolean') {
        rows.push([label, value ? 'Enabled' : 'Disabled'])
      } else if (typeof value === 'object') {
        const obj = value as Record<string, unknown>
        if ('enabled' in obj) {
          rows.push([label, obj.enabled ? 'Enabled' : 'Disabled'])
        } else if ('method' in obj) {
          rows.push([label, String(obj.method)])
        } else if ('items' in obj || 'version' in obj) {
          for (const [subKey, subVal] of Object.entries(obj)) {
            rows.push([`${label} · ${subKey.replace(/_/g, ' ')}`, formatSetupSettingValue(subVal)])
          }
        } else {
          for (const [subKey, subVal] of Object.entries(obj)) {
            rows.push([`${label} · ${subKey.replace(/_/g, ' ')}`, formatSetupSettingValue(subVal)])
          }
        }
      } else {
        rows.push([label, String(value)])
      }
    }
    return rows
  }, [setupSettings])

  const instrumentTypeCodeOptions = useMemo(() => {
    const fromApi = instrumentTypes.map((t) => t.typeCode).filter(Boolean)
    const defaults = ['EQUITY', 'BOND', 'ETF', 'FUND', 'CASH', 'DERIVATIVE', 'COMMODITY']
    return Array.from(new Set([...fromApi, ...defaults]))
  }, [instrumentTypes])

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
    () =>
      liveRows.filter((row) =>
        row
          .slice(0, activeTab === 'Broker/Counterparties' ? 5 : undefined)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [liveRows, search, activeTab],
  )
  const liveTabLoading =
    (activeTab === 'Broker/Counterparties' && (brokersLoading || custodiansLoading)) ||
    (activeTab === 'Commissions' && commissionsLoading) ||
    (activeTab === 'Countries' && countriesLoading) ||
    (activeTab === 'Currencies' && setupCurrenciesLoading) ||
    (activeTab === 'Issuer' && issuersLoading) ||
    (activeTab === 'Markets' && marketsLoading)

  const editAction = (key: string) => (
    <button
      type="button"
      disabled={editSaving}
      onClick={() => {
        void (async () => {
          if (editing === key) {
            setEditSaving(true)
            try {
              if (key === 'tags') {
                for (const row of setupTags) {
                  const nextName = (tagEdits[row.id] ?? tagValue(row)).trim()
                  if (!nextName || nextName === tagValue(row)) continue
                  const res = await investmentOpsApi.updateSetupTag(row.id, {
                    name: nextName,
                    expectedVersion: row.version,
                  })
                  if (!res.success) throw new Error(formatOpsError(res))
                }
                await loadSetupReference()
              } else if (key === 'corporate') {
                for (const row of corporateMappings) {
                  const nextVal = (corpEdits[row.id] ?? mappingValue(row)).trim()
                  if (!nextVal || nextVal === mappingValue(row)) continue
                  const res = await investmentOpsApi.updateCorporateActionMapping(row.id, {
                    externalCode: nextVal,
                    expectedVersion: row.version as number | undefined,
                  })
                  if (!res.success) throw new Error(formatOpsError(res))
                }
                await loadSetupReference()
              } else if (key === 'settings' && setupSettings) {
                const next: Record<string, unknown> = { ...setupSettings }
                for (const [displayKey, raw] of Object.entries(settingsEdits)) {
                  const apiKey = displayKey.replace(/ /g, '_')
                  const original = setupSettings[apiKey]
                  if (typeof original === 'object' && original != null) {
                    try {
                      next[apiKey] = JSON.parse(raw)
                    } catch {
                      next[apiKey] = raw
                    }
                  } else if (typeof original === 'number') {
                    next[apiKey] = Number(raw)
                  } else if (typeof original === 'boolean') {
                    next[apiKey] = raw === 'true'
                  } else {
                    next[apiKey] = raw
                  }
                }
                await dispatch(updateSetupSettings(next as never)).unwrap()
                dispatch(fetchSetupSettings())
              }
              setEditing(null)
            } catch (e) {
              setSetupLoadError(e instanceof Error ? e.message : 'Failed to save edits.')
            } finally {
              setEditSaving(false)
            }
            return
          }
          if (key === 'tags') {
            const seed: Record<string, string> = {}
            setupTags.forEach((row) => {
              seed[row.id] = tagValue(row)
            })
            setTagEdits(seed)
          } else if (key === 'corporate') {
            const seed: Record<string, string> = {}
            corporateMappings.forEach((row) => {
              seed[row.id] = mappingValue(row)
            })
            setCorpEdits(seed)
          } else if (key === 'settings') {
            const seed: Record<string, string> = {}
            if (setupSettings) {
              for (const [apiKey, value] of Object.entries(setupSettings)) {
                const label = apiKey.replace(/_/g, ' ')
                if (value != null && typeof value === 'object' && !('enabled' in value) && !('method' in value)) {
                  for (const [subKey, subVal] of Object.entries(value as Record<string, unknown>)) {
                    seed[`${label} · ${subKey.replace(/_/g, ' ')}`] = settingsEditSeedValue(subVal)
                  }
                } else {
                  seed[label] = settingsEditSeedValue(value)
                }
              }
            }
            setSettingsEdits(seed)
          }
          setEditing(key)
        })()
      }}
      className="rounded-full p-2 text-[#73aef6] hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      {editSaving && editing === key ? <Loader2 className="h-4 w-4 animate-spin" /> : editing === key ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
    </button>
  )
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#05090f]">
      <SetupHeader title="Investment Setup" description="Module-wide reference data, pricing and instrument configuration" />
      <div className="flex shrink-0 overflow-x-auto border-b border-white/[0.08]">
        {tabs.map(tab => <button key={tab} type="button" onClick={() => { setActiveTab(tab); setSearch('') }} className={cn('shrink-0 rounded-full px-4 py-3 iv2-text-label font-medium transition focus:outline-none focus-visible:bg-muted', activeTab === tab ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground')}>{tab}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4 sm:px-5">
        {setupLoadError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 iv2-text-label text-rose-200">{setupLoadError}</div>}
        {activeTab === 'Order Setup' && orderSetupContent}

        {activeTab === 'Setup' && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SetupCard title="Price API">
            <div className="space-y-2.5 p-5 iv2-text-label text-[#8290a4]">
              {priceSourcesLoading ? (
                <OpsListSkeleton rows={3} />
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
                <OpsListSkeleton rows={5} />
              ) : settingsRows.length === 0 ? (
                <p className="iv2-text-label text-[#8290a4]">No settings payload returned (or API returned an empty stub list). See Phase 5 notes in design-refs/investments-v2-backend-asks.md.</p>
              ) : (
                settingsRows.map(([l, v]) => (
                  <EditableRow
                    key={l}
                    label={l}
                    value={editing === 'settings' ? (settingsEdits[l] ?? v) : v}
                    edit={editing === 'settings'}
                    onChange={(next) => setSettingsEdits((prev) => ({ ...prev, [l]: next }))}
                  />
                ))
              )}
            </div>
          </SetupCard>
          <SetupCard title="Corporate Actions" action={
            <div className="flex items-center gap-1">
              <button type="button" className={cn(buttonClass, 'h-7 px-4')} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setModal('corporate') }}><Plus className="h-3 w-3" /> Add New</button>
              {editAction('corporate')}
            </div>
          }>
            <div className="space-y-2.5 p-5">
              {setupRefLoading ? (
                <OpsListSkeleton rows={4} />
              ) : corporateMappings.length === 0 ? (
                <p className="iv2-text-label text-[#8290a4]">No corporate action mappings returned by the API.</p>
              ) : (
                corporateMappings.map((row) => editing === 'corporate'
                  ? (
                    <input
                      key={row.id}
                      value={corpEdits[row.id] ?? mappingValue(row)}
                      onChange={(e) => setCorpEdits((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      className={cn(fieldClass, 'h-6')}
                    />
                  )
                  : <EditableRow key={row.id} label={mappingLabel(row)} value={mappingValue(row)} edit={false} />)
              )}
            </div>
          </SetupCard>
          <SetupCard title="Tag Names" action={
            <div className="flex items-center gap-1">
              <button type="button" className={cn(buttonClass, 'h-7 px-4')} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setModal('tag') }}><Plus className="h-3 w-3" /> Add New</button>
              {editAction('tags')}
            </div>
          } className="min-h-[390px]">
            <div className="space-y-2 p-5">
              {setupRefLoading ? (
                <OpsListSkeleton rows={5} />
              ) : setupTags.length === 0 ? (
                <p className="iv2-text-label text-[#8290a4]">No tags returned by the API.</p>
              ) : (
                setupTags.map((row) => (
                  <EditableRow
                    key={row.id}
                    label={tagLabel(row)}
                    value={editing === 'tags' ? (tagEdits[row.id] ?? tagValue(row)) : tagValue(row)}
                    edit={editing === 'tags'}
                    onChange={(next) => setTagEdits((prev) => ({ ...prev, [row.id]: next }))}
                  />
                ))
              )}
            </div>
          </SetupCard>
          <SetupCard title="Coupon Frequency" action={<button type="button" className={cn(buttonClass, 'h-7 px-4')} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setReferenceKind('coupon'); setModal('reference') }}><Plus className="h-3 w-3" /> Add New</button>} className="min-h-[390px]">
            {setupRefLoading ? (
              <OpsTableSkeleton rows={5} cols={3} className="px-5 py-4" />
            ) : couponTableRows.length === 0 ? (
              <p className="p-5 iv2-text-label text-[#8290a4]">No coupon frequencies returned by the API.</p>
            ) : (
              <DenseTable columns={['Frequency', 'Bloomberg', 'ID']} rows={couponTableRows} />
            )}
          </SetupCard>
          <SetupCard title="Icons" action={<button type="button" className={cn(buttonClass, 'h-7 px-4')} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setReferenceKind('icon'); setModal('reference') }}><Plus className="h-3 w-3" /> Add New</button>} className="min-h-[390px]">
            {setupRefLoading ? (
              <OpsTableSkeleton rows={5} cols={3} className="px-5 py-4" />
            ) : setupIcons.length === 0 ? (
              <p className="p-5 iv2-text-label text-[#8290a4]">No icons returned by the API.</p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Name', 'Icon'].map(h => <th key={h} className="bg-white/[.035] px-5 py-2.5 text-left iv2-text-micro font-normal text-[#738095]">{h}</th>)}</tr></thead><tbody>{setupIcons.map((row) => {
                const name = String(row.name ?? row.label ?? row.code ?? '—')
                return <tr key={String(row.id ?? name)} className="border-b border-[#243044] last:border-0"><td className="px-5 py-3 iv2-text-label text-[#e2e8f0]">{name}</td><td className="px-5 py-3 text-[#dce4ee]"><StatusIcon name={name} /></td></tr>
              })}</tbody></table></div>
            )}
          </SetupCard>
        </div>}

        {data && <section className={cardClass}>
          <div className="flex flex-col gap-3 border-b border-white/[.07] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[12px] font-medium text-white">{activeTab}</h2>
              <p className="mt-1 iv2-text-micro text-[#718095]">
                {LIVE_REFERENCE_TABS.has(activeTab) ? `${filtered.length} records from API` : `${filtered.length} configured records · not wired to API yet`}
              </p>
            </div>
            <div className="flex gap-2"><div className="relative flex-1 sm:w-60"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#627086]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…" className={cn(fieldClass, 'pl-9')} /></div><button className={buttonClass} onClick={() => { setEditingStakeholder(null); setDraft({ code: '', name: '', extra: activeTab === 'Broker/Counterparties' ? 'BROKER' : '' }); setReferenceKind(null); setModal('reference') }}><Plus className="h-3.5 w-3.5" /> Add</button></div>
          </div>
          {liveTabLoading ? (
            <OpsTableSkeleton rows={8} cols={data?.columns.length ?? 5} className="px-5 py-6" />
          ) : filtered.length === 0 ? (
            <div className="px-5 py-10 text-center iv2-text-label text-[#8290a4]">
              {LIVE_REFERENCE_TABS.has(activeTab)
                ? 'No records returned by the API (or response was an empty/id-only stub).'
                : 'No local records. This tab is not wired to a list endpoint in Phase 5.'}
            </div>
          ) : activeTab === 'Broker/Counterparties' ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead className="bg-white/[.035]">
                  <tr>
                    {data.columns.map((column) => (
                      <th key={column} className="px-4 py-2.5 text-left iv2-text-micro font-normal text-[#738095] first:pl-5 last:pr-5">{column}</th>
                    ))}
                    <th className="w-16 px-4 py-2.5 text-right iv2-text-micro font-normal text-[#738095]">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const [name, type, contact, delivery, status, id] = row
                    return (
                      <tr key={`${id}-${i}`} className="border-b border-[#243044] transition last:border-0 hover:bg-[#2f87fa]/[.05]">
                        <td className="whitespace-nowrap px-4 py-3.5 iv2-text-caption font-medium text-[#e2e8f0] first:pl-5">{name}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 iv2-text-caption text-[#91a0b5]">{type}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 iv2-text-caption text-[#91a0b5]">{contact}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 iv2-text-caption text-[#91a0b5]">{delivery}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 iv2-text-caption text-[#91a0b5]">
                          {status === 'Active' ? (
                            <span className="rounded-full border border-[#3e7e33] bg-[#183722] px-3 py-0.5 iv2-text-micro text-[#65cf55]">Active</span>
                          ) : (
                            status
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            title="Edit broker / custodian"
                            onClick={() => openEditStakeholder(id, type)}
                            className="rounded-full p-2 text-[#73aef6] hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <DenseTable columns={data.columns} rows={filtered} />
          )}
        </section>}

        {activeTab === 'Instrument Types' && <div>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[13px] font-semibold text-white">Instrument Type</h2><p className="mt-1 iv2-text-micro text-[#718095]">Classification and market-data mapping · loaded from setup/instrument-types</p></div><div className="flex gap-2"><button type="button" className={buttonClass} onClick={() => { setDraft({ code: '', name: '', extra: '' }); setModal('type') }}>New Type</button><button type="button" className={secondaryButtonClass} onClick={() => { setDraft({ code: '', name: '', extra: category || '' }); setModal('subcategory') }}>New Sub Category</button></div></div>
          {instrumentTypesLoading ? (
            <OpsTablePanelSkeleton rows={8} cols={8} showToolbar={false} className="mt-6 border-0 bg-transparent" />
          ) : categories.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/[.06] bg-white/[.02] px-5 py-10 text-center iv2-text-label text-[#8290a4]">No instrument types returned by the API.</div>
          ) : (
            <>
              <div className="mt-3 flex gap-2 overflow-x-auto border-b border-white/[.08] pb-4">{categories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={cn('h-8 shrink-0 rounded-full px-4 iv2-text-label font-medium transition', item === category ? 'bg-[#2f87fa] text-white shadow-[0_8px_24px_rgba(47,135,250,.24)]' : 'border border-white/[.04] bg-[#192536] text-[#d6dde7] hover:bg-[#26364d]')}>{item}</button>)}</div>
              <section className={cn(cardClass, 'mt-4')}><header className="flex h-[52px] items-center px-5"><h3 className="text-[12px] font-medium text-white">Instruments · {category}</h3></header>
                {instrumentTableRows.length === 0 ? (
                  <div className="px-5 py-10 text-center iv2-text-label text-[#8290a4]">No instrument types in this category.</div>
                ) : (
                  <DenseTable columns={['Code', 'Name', 'Title', 'Item', 'Fields', 'Status', 'API Filter I', 'API Filter II']} rows={instrumentTableRows} />
                )}
              </section>
              <section className={cn(cardClass, 'mt-4')}>
                <header className="flex h-[52px] items-center px-5"><h3 className="text-[12px] font-medium text-white">Subcategories</h3></header>
                {subcategories.length === 0 ? (
                  <div className="px-5 py-8 text-center iv2-text-label text-[#8290a4]">No subcategories returned. Create one with New Sub Category.</div>
                ) : (
                  <DenseTable
                    columns={['Code', 'Name', 'Type', 'Status', 'ID']}
                    rows={subcategories.map((row) => [
                      String(row.code ?? '—'),
                      String(row.name ?? row.displayName ?? '—'),
                      String(row.instrumentTypeCode ?? '—'),
                      row.isActive === false ? 'Inactive' : 'Active',
                      String(row.id ?? '—'),
                    ])}
                  />
                )}
              </section>
            </>
          )}
        </div>}
      </div>
      {modal && <SetupModal title={
        modal === 'type' ? 'New Instrument Type'
          : modal === 'subcategory' ? 'New Sub Category'
            : modal === 'corporate' ? 'New Corporate Action Mapping'
              : modal === 'tag' ? 'New Tag'
                : editingStakeholder
                  ? `Edit ${editingStakeholder.profileType === 'CUSTODIAN' ? 'Custodian' : 'Broker'}`
                  : `Add ${referenceKind === 'coupon' ? 'Coupon Frequency' : referenceKind === 'icon' ? 'Icon' : activeTab}`
      } description={
        modal === 'type' || modal === 'corporate' || modal === 'tag' || modal === 'subcategory'
          ? 'Creates a record via the Investment Ops setup API.'
          : editingStakeholder
            ? 'Update name and contact email used for send-to-broker instructions.'
          : LIVE_REFERENCE_TABS.has(activeTab) && !referenceKind
              ? 'Creates a record via the Investment Ops API.'
              : referenceKind === 'coupon' || referenceKind === 'icon'
                ? 'Creates a record via the Investment Ops setup API.'
                : 'Creates a record via the Investment Ops API when this tab is enabled for writes.'
      } onClose={() => { setModal(null); setEditingStakeholder(null) }} onSubmit={async () => {
        const code = draft.code.trim(), name = draft.name.trim(), extra = draft.extra.trim()
        if (!name && modal !== 'corporate' && activeTab !== 'Commissions' && modal !== 'tag') return
        if (modal === 'type') {
          if (!name) return
          setCreateSaving(true)
          try {
            const typeCode = code || name.toUpperCase().replace(/\s+/g, '_')
            const res = await investmentOpsApi.createSetupInstrumentType({ typeCode, displayName: name, isActive: true })
            if (!res.success) throw new Error(formatOpsError(res))
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
            await loadInstrumentTypes()
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to create instrument type.')
          } finally {
            setCreateSaving(false)
          }
          return
        }
        if (modal === 'corporate') {
          if (!code && !name) return
          setCreateSaving(true)
          try {
            const payload: Record<string, unknown> = {
              code: code || name.toUpperCase().replace(/\s+/g, '_'),
              name: name || code,
              isActive: true,
            }
            if (extra) payload.externalCode = extra
            const res = await investmentOpsApi.createCorporateActionMapping(payload)
            if (!res.success) throw new Error(formatOpsError(res))
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
            await loadSetupReference()
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to create corporate action mapping.')
          } finally {
            setCreateSaving(false)
          }
          return
        }
        if (modal === 'tag') {
          if (!code && !name) return
          setCreateSaving(true)
          try {
            const res = await investmentOpsApi.createSetupTag({
              code: code || name.toUpperCase().replace(/\s+/g, '_'),
              name: name || code,
              isActive: true,
            })
            if (!res.success) throw new Error(formatOpsError(res))
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
            await loadSetupReference()
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to create tag.')
          } finally {
            setCreateSaving(false)
          }
          return
        }
        if (modal === 'subcategory') {
          if (!name && !code) return
          setCreateSaving(true)
          try {
            const selectedType = instrumentTypes.find((t) => (t.displayName || t.typeCode) === category)
            const res = await investmentOpsApi.createInstrumentSubcategory({
              code: code || name.toUpperCase().replace(/\s+/g, '_'),
              name: name || code,
              displayName: name || code,
              instrumentTypeCode: selectedType?.typeCode || extra || undefined,
              isActive: true,
            })
            if (!res.success) throw new Error(formatOpsError(res))
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
            await loadInstrumentTypes()
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to create subcategory.')
          } finally {
            setCreateSaving(false)
          }
          return
        }
        if (modal === 'reference' && referenceKind === 'coupon') {
          if (!code && !name) return
          setCreateSaving(true)
          try {
            const res = await investmentOpsApi.createCouponFrequency({
              code: code || name.toUpperCase().replace(/\s+/g, '_'),
              name: name || code,
              isActive: true,
            })
            if (!res.success) throw new Error(formatOpsError(res))
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
            await loadSetupReference()
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to create coupon frequency.')
          } finally {
            setCreateSaving(false)
          }
          return
        }
        if (modal === 'reference' && referenceKind === 'icon') {
          if (!code && !name) return
          setCreateSaving(true)
          try {
            const res = await investmentOpsApi.createSetupIcon({
              code: code || name.toUpperCase().replace(/\s+/g, '_'),
              name: name || code,
              label: name || code,
            })
            if (!res.success) throw new Error(formatOpsError(res))
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
            await loadSetupReference()
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to create icon.')
          } finally {
            setCreateSaving(false)
          }
          return
        }
        if (modal === 'reference' && activeTab === 'Broker/Counterparties') {
          try {
            const email = code.includes('@') ? code : code ? `${code}@example.com` : ''
            if (!email) {
              setSetupLoadError('Contact email is required (needed for Send to broker).')
              return
            }
            if (editingStakeholder) {
              const payload = { name, contactEmail: email }
              if (editingStakeholder.profileType === 'CUSTODIAN') {
                await dispatch(updateCustodian({ id: editingStakeholder.id, data: payload })).unwrap()
                dispatch(fetchCustodians())
              } else {
                await dispatch(updateBroker({ id: editingStakeholder.id, data: payload })).unwrap()
                dispatch(fetchBrokers())
              }
            } else if (extra.toUpperCase() === 'CUSTODIAN') {
              await dispatch(createCustodian({ name, contactEmail: email })).unwrap()
              dispatch(fetchCustodians())
            } else {
              await dispatch(createBroker({ name, contactEmail: email })).unwrap()
              dispatch(fetchBrokers())
            }
            setEditingStakeholder(null)
            setModal(null)
            setDraft({ code: '', name: '', extra: '' })
          } catch (e) {
            setSetupLoadError(e instanceof Error ? e.message : 'Failed to save broker/custodian.')
          }
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
      }} submitLabel={createSaving ? (editingStakeholder ? 'Saving…' : 'Creating…') : editingStakeholder ? 'Save' : 'Create'} submitDisabled={createSaving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block iv2-text-label text-[#8b99ad]">
              {modal === 'type' ? 'Type code' : modal === 'subcategory' ? 'Instrument type' : modal === 'corporate' ? 'Code' : modal === 'tag' ? 'Tag code' : activeTab === 'Broker/Counterparties' ? 'Contact email' : activeTab === 'Commissions' ? 'Stakeholder profile id' : 'Code'}
            </span>
            {modal === 'type' ? (
              <select
                value={draft.code || instrumentTypeCodeOptions[0] || 'EQUITY'}
                onChange={(e) => setDraft((v) => ({ ...v, code: e.target.value }))}
                className={fieldClass}
              >
                {instrumentTypeCodeOptions.map((code) => (
                  <option key={code} value={code}>{code.replace(/_/g, ' ')}</option>
                ))}
              </select>
            ) : modal === 'subcategory' ? (
              <select
                value={draft.extra || category || instrumentTypeCodeOptions[0] || ''}
                onChange={(e) => setDraft((v) => ({ ...v, extra: e.target.value }))}
                className={fieldClass}
              >
                {(categories.length ? categories : instrumentTypeCodeOptions).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            ) : (
              <input autoFocus value={draft.code} onChange={e => setDraft(v => ({ ...v, code: e.target.value }))} className={fieldClass} placeholder={modal === 'corporate' ? 'e.g. DIV' : modal === 'tag' ? 'e.g. CORE' : activeTab === 'Broker/Counterparties' ? 'ops@broker.com' : activeTab === 'Commissions' ? 'profile uuid' : 'e.g. EQ'} />
            )}
          </label>
          <label>
            <span className="mb-1.5 block iv2-text-label text-[#8b99ad]">{activeTab === 'Commissions' ? 'Rate (bps)' : modal === 'corporate' || modal === 'tag' ? 'Display name' : 'Name'}</span>
            <input value={draft.name} onChange={e => setDraft(v => ({ ...v, name: e.target.value }))} className={fieldClass} placeholder={activeTab === 'Commissions' ? '25' : modal === 'corporate' ? 'Cash dividend' : modal === 'tag' ? 'Core holding' : 'Display name'} />
          </label>
          {(modal === 'corporate' || ((activeTab === 'Broker/Counterparties' || activeTab === 'Countries' || activeTab === 'Markets' || activeTab === 'Issuer' || activeTab === 'Currencies') && !referenceKind)) && (
            <label className="sm:col-span-2">
              <span className="mb-1.5 block iv2-text-label text-[#8b99ad]">
                {modal === 'corporate'
                  ? 'External code (optional)'
                  : activeTab === 'Broker/Counterparties'
                    ? 'Type'
                    : activeTab === 'Currencies'
                      ? 'Symbol'
                      : 'Country / region code'}
              </span>
              {activeTab === 'Broker/Counterparties' && modal === 'reference' ? (
                <select
                  value={draft.extra === 'CUSTODIAN' ? 'CUSTODIAN' : 'BROKER'}
                  disabled={!!editingStakeholder}
                  onChange={(e) => setDraft((v) => ({ ...v, extra: e.target.value }))}
                  className={fieldClass}
                  aria-label="Counterparty type"
                >
                  <option value="BROKER">Broker</option>
                  <option value="CUSTODIAN">Custodian</option>
                </select>
              ) : (
                <input
                  value={draft.extra}
                  onChange={(e) => setDraft((v) => ({ ...v, extra: e.target.value }))}
                  className={fieldClass}
                  placeholder={modal === 'corporate' ? 'e.g. DVCA' : activeTab === 'Currencies' ? '$' : 'ZW'}
                />
              )}
            </label>
          )}
        </div>
      </SetupModal>}
    </div>
  )
}

function EditableRow({
  label,
  value,
  edit,
  onChange,
}: {
  label: string
  value: string
  edit: boolean
  onChange?: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_8px_minmax(70px,1fr)] items-center gap-2 iv2-text-caption">
      <span className="truncate text-[#778397]">{label}</span>
      <span className="text-[#778397]">:</span>
      {edit ? (
        <input value={value} onChange={(e) => onChange?.(e.target.value)} className={cn(fieldClass, 'h-6 min-w-0')} />
      ) : (
        <span className="truncate font-medium text-[#e3e8f0]">{value}</span>
      )}
    </div>
  )
}

export function DenseTable({ columns, rows, editable = false }: { columns: string[]; rows: string[][]; editable?: boolean }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse"><thead className="bg-white/[.035]"><tr>{columns.map(column => <th key={column} className="px-4 py-2.5 text-left iv2-text-micro font-normal text-[#738095] first:pl-5 last:pr-5">{column}</th>)}{editable && <th className="w-10" />}</tr></thead><tbody>{rows.map((row, i) => <tr key={`${row[0]}-${i}`} className="border-b border-[#243044] transition last:border-0 hover:bg-[#2f87fa]/[.05]">{row.map((cell, j) => <td key={j} className={cn('whitespace-nowrap px-4 py-3.5 iv2-text-caption first:pl-5 last:pr-5', j === 0 ? 'font-medium text-[#e2e8f0]' : 'text-[#91a0b5]')}>{cell === 'Active' ? <span className="rounded-full border border-[#3e7e33] bg-[#183722] px-3 py-0.5 iv2-text-micro text-[#65cf55]">Active</span> : cell}</td>)}{editable && <td><button className="rounded-full p-2 text-[#718095] hover:bg-white/10 hover:text-white"><Pencil className="h-3 w-3" /></button></td>}</tr>)}</tbody></table></div>
}

export function DragHandle() {
  return <GripVertical className="h-4 w-4 text-[#526176]" />
}
