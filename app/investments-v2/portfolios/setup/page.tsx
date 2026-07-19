'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Save, ShieldCheck } from 'lucide-react'
import { DenseTable, SetupCard, SetupHeader, SetupSelect, Toggle, buttonClass, fieldClass } from '@/components/investments-v2/setup-workspace'
import { formatOpsError, investmentOpsApi, type FundSetupLimits } from '@/lib/api/investment-ops-api'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchBrokers,
  fetchCustodians,
  fetchPortfolios,
  fetchSetupCurrencies,
  fetchSetupFunds,
  fetchSetupSettings,
  updateSetupFund,
  updateSetupFundConfig,
  updateSetupSettings,
} from '@/lib/store/slices/investmentOpsSlice'

export default function PortfolioSetupPage() {
  const dispatch = useAppDispatch()
  const {
    portfolios,
    portfoliosLoading,
    setupFunds,
    setupFundsLoading,
    setupCurrencies,
    setupCurrenciesLoading,
    brokers,
    brokersLoading,
    custodians,
    custodiansLoading,
    setupSettings,
    setupSettingsLoading,
    fundConfigSaving,
    setupSettingsSaving,
  } = useAppSelector((s) => s.investmentOps)

  const [fundId, setFundId] = useState('')
  const [status, setStatus] = useState('Active')
  const [currency, setCurrency] = useState('')
  const [brokerId, setBrokerId] = useState('')
  const [custodianId, setCustodianId] = useState('')
  const [valuation, setValuation] = useState('Mark-to-market')
  const [costBasis, setCostBasis] = useState('Weighted average')
  const [pricing, setPricing] = useState('Primary market close')
  const [cycle, setCycle] = useState('T+2')
  const [fourEye, setFourEye] = useState(true)
  const [blockBreaches, setBlockBreaches] = useState(true)
  const [positiveCash, setPositiveCash] = useState(false)
  const [fundLimits, setFundLimits] = useState<FundSetupLimits | null>(null)
  const [limitsLoading, setLimitsLoading] = useState(false)
  const [limitsSaving, setLimitsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    Promise.all([
      dispatch(fetchPortfolios()),
      dispatch(fetchSetupFunds()),
      dispatch(fetchSetupCurrencies()),
      dispatch(fetchBrokers()),
      dispatch(fetchCustodians()),
      dispatch(fetchSetupSettings()),
    ]).then((results) => {
      if (cancelled) return
      if (results.some((r) => r.meta.requestStatus === 'rejected')) {
        setLoadError('Unable to load portfolio setup data from the server.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const fundOptions = useMemo(() => {
    if (setupFunds.length) {
      return setupFunds.map((f) => ({
        id: f.id,
        name: f.name || f.id,
        status: f.status || 'Active',
        config: f.listedEquityFundConfig,
      }))
    }
    return portfolios.map((p) => ({
      id: p.id,
      name: p.name || p.id,
      status: 'Active',
      config: undefined as undefined,
    }))
  }, [setupFunds, portfolios])

  useEffect(() => {
    if (!fundId && fundOptions[0]?.id) setFundId(fundOptions[0].id)
  }, [fundOptions, fundId])

  useEffect(() => {
    const fund = fundOptions.find((f) => f.id === fundId)
    if (!fund) return
    if (fund.status) setStatus(fund.status)
    if (fund.config?.baseCurrencyCode) setCurrency(fund.config.baseCurrencyCode)
    if (fund.config?.brokerProfileId) setBrokerId(fund.config.brokerProfileId)
    if (fund.config?.custodianProfileId) setCustodianId(fund.config.custodianProfileId)
  }, [fundId, fundOptions])

  useEffect(() => {
    if (!currency && setupCurrencies[0]?.code) setCurrency(setupCurrencies[0].code)
  }, [setupCurrencies, currency])

  useEffect(() => {
    if (!brokerId && brokers[0]?.id) setBrokerId(brokers[0].id)
  }, [brokers, brokerId])

  useEffect(() => {
    if (!custodianId && custodians[0]?.id) setCustodianId(custodians[0].id)
  }, [custodians, custodianId])

  useEffect(() => {
    const method = setupSettings?.default_valuation_method?.method
    if (method) {
      const map: Record<string, string> = {
        MTM: 'Mark-to-market',
        MARK_TO_MARKET: 'Mark-to-market',
        AMORTISED_COST: 'Amortised cost',
        NAV: 'NAV',
        FAIR_VALUE: 'Fair value',
      }
      setValuation(map[method] || method)
    }
    const enabled = setupSettings?.four_eye_orders?.enabled
    if (typeof enabled === 'boolean') setFourEye(enabled)
  }, [setupSettings])

  useEffect(() => {
    if (!fundId) return
    let cancelled = false
    setLimitsLoading(true)
    investmentOpsApi
      .getFundLimits(fundId)
      .then((res) => {
        if (cancelled) return
        if (!res.success || !res.data) {
          setFundLimits(null)
          return
        }
        setFundLimits(res.data)
        if (typeof res.data.hardLimitEnabled === 'boolean') setBlockBreaches(res.data.hardLimitEnabled)
        if (typeof res.data.positiveCashRequired === 'boolean') setPositiveCash(res.data.positiveCashRequired)
      })
      .catch(() => {
        if (!cancelled) setFundLimits(null)
      })
      .finally(() => {
        if (!cancelled) setLimitsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fundId])

  const limitRows = useMemo(() => {
    const items = Array.isArray(fundLimits?.limits) ? fundLimits.limits : []
    return items.map((limit) => {
      const row = limit as Record<string, unknown>
      return [
        String(row.limitCode ?? row.name ?? row.id ?? '—'),
        String(row.unit ?? row.measure ?? row.dimensionType ?? '—'),
        String(row.warningValue ?? row.warning ?? '—'),
        String(row.hardValue ?? row.hardLimit ?? '—'),
        row.isActive === false ? 'Archived' : 'Active',
      ]
    })
  }, [fundLimits])

  const selectedFund = fundOptions.find((f) => f.id === fundId)
  const fundNames = fundOptions.length ? fundOptions.map((f) => f.name) : ['No funds returned']
  const currencyOptions = setupCurrencies.length ? setupCurrencies.map((c) => c.code) : currency ? [currency] : ['—']
  const brokerOptions = brokers.length ? brokers.map((b) => b.name || b.id) : ['No brokers returned']
  const custodianOptions = custodians.length ? custodians.map((c) => c.name || c.id) : ['No custodians returned']
  const brokerName = brokers.find((b) => b.id === brokerId)?.name || brokerOptions[0]
  const custodianName = custodians.find((c) => c.id === custodianId)?.name || custodianOptions[0]

  const loading = portfoliosLoading || setupFundsLoading || setupCurrenciesLoading || brokersLoading || custodiansLoading || setupSettingsLoading || limitsLoading
  const saving = fundConfigSaving || setupSettingsSaving || limitsSaving

  const save = async () => {
    setSaveError(null)
    setSaved(false)
    if (!fundId) {
      setSaveError('Select a portfolio before saving.')
      return
    }
    try {
      const statusPayload = status.toUpperCase() === 'ACTIVE' ? 'Active' : status
      await dispatch(updateSetupFund({ id: fundId, data: { status: statusPayload } })).unwrap()
      await dispatch(
        updateSetupFundConfig({
          id: fundId,
          data: {
            baseCurrencyCode: currency || undefined,
            brokerProfileId: brokerId || undefined,
            custodianProfileId: custodianId || undefined,
          },
        }),
      ).unwrap()
      if (setupSettings) {
        const methodMap: Record<string, string> = {
          'Mark-to-market': 'MTM',
          'Amortised cost': 'AMORTISED_COST',
          NAV: 'NAV',
          'Fair value': 'FAIR_VALUE',
        }
        await dispatch(
          updateSetupSettings({
            ...setupSettings,
            four_eye_orders: { enabled: fourEye },
            default_valuation_method: { method: methodMap[valuation] || valuation },
          }),
        ).unwrap()
      }
      setLimitsSaving(true)
      const limitsPayload: FundSetupLimits = {
        ...(fundLimits ?? {}),
        hardLimitEnabled: blockBreaches,
        positiveCashRequired: positiveCash,
        limits: fundLimits?.limits ?? [],
      }
      const limitsRes = await investmentOpsApi.putFundLimits(fundId, limitsPayload)
      if (!limitsRes.success) throw new Error(formatOpsError(limitsRes))
      setFundLimits(limitsRes.data ?? limitsPayload)
      setSaved(true)
      dispatch(fetchSetupFunds())
      window.setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save portfolio setup')
    } finally {
      setLimitsSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#05090f]">
      <SetupHeader
        title="Portfolio Setup"
        description="Portfolio-specific valuation, settlement, controls and investment limits"
        action={
          <button type="button" className={buttonClass} disabled={saving || !fundId} onClick={save}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save changes
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {loadError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{loadError}</div>}
        {saveError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{saveError}</div>}
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Fund status, currency, broker/custodian and settings keys saved via API.
          </div>
        )}
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-[#8290a4]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading portfolio setup…
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <SetupCard title="Portfolio Context">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <SetupSelect
                label="Selected portfolio"
                value={selectedFund?.name || fundNames[0]}
                options={fundNames}
                onChange={(name) => {
                  const found = fundOptions.find((f) => f.name === name)
                  if (found) setFundId(found.id)
                }}
              />
              <Field label="Fund id" value={fundId || '—'} readOnly />
              <SetupSelect label="Status" value={status} options={['Active', 'Restricted', 'Closed']} onChange={setStatus} />
              <SetupSelect label="Base currency" value={currency || currencyOptions[0]} options={currencyOptions} onChange={setCurrency} />
            </div>
          </SetupCard>
          <SetupCard title="Valuation & Cost Basis">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <SetupSelect label="Valuation method" value={valuation} options={['Mark-to-market', 'Amortised cost', 'NAV', 'Fair value']} onChange={setValuation} />
              <SetupSelect label="Cost-basis method" value={costBasis} options={['Weighted average', 'FIFO', 'LIFO', 'Specific lot']} onChange={setCostBasis} />
              <SetupSelect
                label="Pricing source"
                value={pricing}
                options={['Primary market close', 'Bloomberg BVAL', 'Custodian feed']}
                onChange={setPricing}
              />
              <Field label="Valuation cutoff" type="time" value="17:00" />
              <p className="sm:col-span-2 text-[9px] text-[#718095]">
                Valuation method / four-eye persist to setup/settings when settings payload is available. Cost-basis and pricing source have no fund-config fields yet.
              </p>
            </div>
          </SetupCard>
          <SetupCard title="Settlement Defaults">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <SetupSelect label="Settlement cycle" value={cycle} options={['T+0', 'T+1', 'T+2', 'T+3']} onChange={setCycle} />
              <SetupSelect
                label="Default broker"
                value={brokerName}
                options={brokerOptions}
                onChange={(name) => {
                  const found = brokers.find((b) => (b.name || b.id) === name)
                  if (found) setBrokerId(found.id)
                }}
              />
              <SetupSelect
                label="Default custodian"
                value={custodianName}
                options={custodianOptions}
                onChange={(name) => {
                  const found = custodians.find((c) => (c.name || c.id) === name)
                  if (found) setCustodianId(found.id)
                }}
              />
              <Field label="Cash ledger" value="—" readOnly />
            </div>
          </SetupCard>
          <SetupCard title="Four-eye Controls">
            <div className="divide-y divide-white/[.06] px-5">
              <Control title="Four-eye approval" text="Require a separate approver for changes and manual prices. Saved to setup/settings." checked={fourEye} onChange={setFourEye} />
              <Control title="Block hard-limit breaches" text="Prevent orders that breach a hard portfolio limit. Saved to fund limits API." checked={blockBreaches} onChange={setBlockBreaches} />
              <Control title="Enforce positive cash" text="Reject orders producing negative projected settled cash. Saved to fund limits API." checked={positiveCash} onChange={setPositiveCash} />
            </div>
          </SetupCard>
        </div>
        <SetupCard title="Portfolio Limits" className="mt-4">
          <DenseTable columns={['Limit', 'Measure', 'Warning', 'Hard limit', 'Action']} rows={limitRows} />
          <p className="border-t border-white/[.06] px-5 py-3 text-[10px] text-[#718095]">
            {limitsLoading ? 'Loading fund limits…' : limitRows.length ? 'Limits loaded from setup/funds limits API.' : 'No portfolio limits returned for this fund.'}
          </p>
        </SetupCard>
      </div>
    </div>
  )
}

function Field({ label, value, type = 'text', readOnly }: { label: string; value: string; type?: string; readOnly?: boolean }) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</span>
      <input type={type} value={value} readOnly={readOnly} onChange={() => undefined} className={fieldClass} />
    </label>
  )
}
function Control({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex gap-3">
        <ShieldCheck className="h-4 w-4 text-[#69a9ff]" />
        <div>
          <div className="text-[11px] font-medium text-white">{title}</div>
          <div className="mt-1 text-[9px] text-[#718095]">{text}</div>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}
