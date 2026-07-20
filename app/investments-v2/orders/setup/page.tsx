'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Plus, Save, ShieldCheck } from 'lucide-react'
import { OpsPageSkeleton, OpsTableSkeleton } from '@/components/investments-v2/loading-skeletons'
import { DenseTable, ModuleSetupWorkspace, SetupCard, SetupModal, SetupSelect, Toggle, buttonClass, fieldClass } from '@/components/investments-v2/setup-workspace'
import {
  formatOpsError,
  investmentOpsApi,
  unwrapList,
  type ApprovalRoute,
  type OpsFund,
  type OrderConfiguration,
} from '@/lib/api/investment-ops-api'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchBrokers,
  fetchCustodians,
  fetchSetupSettings,
  updateSetupSettings,
} from '@/lib/store/slices/investmentOpsSlice'

const CYCLE_OPTIONS = ['T+0', 'T+1', 'T+2', 'T+3']
const CHANNEL_OPTIONS = ['FIX with email fallback', 'Email', 'Broker portal', 'Manual desk']
const DELIVERY_OPTIONS = ['Delivery versus payment', 'Free of payment', 'Receipt versus payment']
const SIGNING_OPTIONS = ['Two authorised signatories', 'Dealer and approver', 'CIO only', 'Digital signature']

function displayValue(value: string) {
  return value || '—'
}

function formatRouteThreshold(route: ApprovalRoute) {
  const min = route.minAmount
  const max = route.maxAmount
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `≥ ${min}`
  if (max != null) return `≤ ${max}`
  const criteria = route.criteria as Record<string, unknown> | undefined
  if (criteria?.minNotional != null) return `≥ ${criteria.minNotional}`
  return 'Any value'
}

function formatRouteSteps(route: ApprovalRoute) {
  const steps = Array.isArray(route.steps) ? route.steps : []
  if (!steps.length) return '—'
  return steps
    .map((step, index) => {
      const row = step as Record<string, unknown>
      return String(row.role ?? row.approverRole ?? row.name ?? `Step ${row.stepNo ?? index + 1}`)
    })
    .join(' → ')
}

function routeTableRow(route: ApprovalRoute): string[] {
  return [
    route.name || route.id,
    formatRouteThreshold(route),
    formatRouteSteps(route),
    route.isActive === false ? 'Inactive' : 'Active',
  ]
}

function applyOrderConfiguration(
  cfg: OrderConfiguration,
  setters: {
    setCycle: (v: string) => void
    setAccount: (v: string) => void
    setDelivery: (v: string) => void
    setSigning: (v: string) => void
    setCutoff: (v: string) => void
    setSwiftBic: (v: string) => void
    setSsiRef: (v: string) => void
    setChannel: (v: string) => void
    setRoute: (v: string) => void
    setDeskCode: (v: string) => void
    setFourEye: (v: boolean) => void
    setCashCheck: (v: boolean) => void
    setAutoRoute: (v: boolean) => void
    setBrokerId: (v: string) => void
    setCustodianId: (v: string) => void
    setConfigVersion: (v: number | undefined) => void
  },
) {
  const settlement = (cfg.settlementPolicyJson ?? {}) as Record<string, unknown>
  const approval = (cfg.approvalPolicyJson ?? {}) as Record<string, unknown>
  const routing = (cfg.routingPolicyJson ?? {}) as Record<string, unknown>

  setters.setConfigVersion(cfg.version)
  setters.setCycle(String(settlement.cycle ?? ''))
  setters.setAccount(String(settlement.settlementAccount ?? ''))
  setters.setDelivery(String(settlement.settlementMethod ?? ''))
  setters.setSigning(String(settlement.signingRule ?? ''))
  setters.setCutoff(String(settlement.instructionCutoff ?? ''))
  setters.setSwiftBic(String(settlement.swiftSenderBic ?? ''))
  setters.setSsiRef(String(settlement.ssiReference ?? ''))
  setters.setChannel(String(routing.channel ?? settlement.channel ?? ''))
  setters.setRoute(String(routing.defaultApprovalRoute ?? ''))
  setters.setDeskCode(String(routing.deskCode ?? ''))
  setters.setFourEye(approval.fourEyeOrders === true)
  setters.setCashCheck(
    typeof routing.cashCheck === 'boolean'
      ? routing.cashCheck
      : settlement.positiveCashRequired === true,
  )
  setters.setAutoRoute(routing.autoRoute === true)
  if (routing.defaultBrokerProfileId) setters.setBrokerId(String(routing.defaultBrokerProfileId))
  if (settlement.defaultCustodianProfileId) setters.setCustodianId(String(settlement.defaultCustodianProfileId))
}

function clearOrderConfiguration(setters: {
  setCycle: (v: string) => void
  setAccount: (v: string) => void
  setDelivery: (v: string) => void
  setSigning: (v: string) => void
  setCutoff: (v: string) => void
  setSwiftBic: (v: string) => void
  setSsiRef: (v: string) => void
  setChannel: (v: string) => void
  setRoute: (v: string) => void
  setDeskCode: (v: string) => void
  setFourEye: (v: boolean) => void
  setCashCheck: (v: boolean) => void
  setAutoRoute: (v: boolean) => void
  setConfigVersion: (v: number | undefined) => void
}) {
  setters.setConfigVersion(undefined)
  setters.setCycle('')
  setters.setAccount('')
  setters.setDelivery('')
  setters.setSigning('')
  setters.setCutoff('')
  setters.setSwiftBic('')
  setters.setSsiRef('')
  setters.setChannel('')
  setters.setRoute('')
  setters.setDeskCode('')
  setters.setFourEye(false)
  setters.setCashCheck(false)
  setters.setAutoRoute(false)
}

export default function OrderSetupPage() {
  const dispatch = useAppDispatch()
  const {
    brokers,
    brokersLoading,
    custodians,
    custodiansLoading,
    setupSettings,
    setupSettingsLoading,
    setupSettingsSaving,
  } = useAppSelector((s) => s.investmentOps)

  const [funds, setFunds] = useState<OpsFund[]>([])
  const [fundId, setFundId] = useState('')
  const [fundsLoading, setFundsLoading] = useState(true)
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [configVersion, setConfigVersion] = useState<number | undefined>()

  const [brokerId, setBrokerId] = useState('')
  const [custodianId, setCustodianId] = useState('')
  const [account, setAccount] = useState('')
  const [route, setRoute] = useState('')
  const [channel, setChannel] = useState('')
  const [signing, setSigning] = useState('')
  const [cutoff, setCutoff] = useState('')
  const [swiftBic, setSwiftBic] = useState('')
  const [ssiRef, setSsiRef] = useState('')
  const [deskCode, setDeskCode] = useState('')
  const [cycle, setCycle] = useState('')
  const [delivery, setDelivery] = useState('')
  const [fourEye, setFourEye] = useState(false)
  const [cashCheck, setCashCheck] = useState(false)
  const [autoRoute, setAutoRoute] = useState(false)

  const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [routesSaving, setRoutesSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState({ name: '', threshold: '', approvers: '' })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const configSetters = {
    setCycle,
    setAccount,
    setDelivery,
    setSigning,
    setCutoff,
    setSwiftBic,
    setSsiRef,
    setChannel,
    setRoute,
    setDeskCode,
    setFourEye,
    setCashCheck,
    setAutoRoute,
    setBrokerId,
    setCustodianId,
    setConfigVersion,
  }

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    Promise.all([
      dispatch(fetchBrokers()),
      dispatch(fetchCustodians()),
      dispatch(fetchSetupSettings()),
    ]).then((results) => {
      if (cancelled) return
      if (results.some((r) => r.meta.requestStatus === 'rejected')) {
        setLoadError('Unable to load order setup reference data from the server.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  useEffect(() => {
    let cancelled = false
    setFundsLoading(true)
    investmentOpsApi
      .listPortfolios()
      .then((res) => {
        if (cancelled) return
        if (!res.success) throw new Error(formatOpsError(res))
        const list = unwrapList<OpsFund>(res.data)
        setFunds(list)
        setFundId((prev) => prev || list[0]?.id || '')
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load portfolios')
      })
      .finally(() => {
        if (!cancelled) setFundsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const enabled = setupSettings?.four_eye_orders?.enabled
    if (typeof enabled === 'boolean' && !configLoading && configVersion == null) {
      setFourEye(enabled)
    }
  }, [setupSettings, configLoading, configVersion])

  useEffect(() => {
    if (!fundId) {
      clearOrderConfiguration(configSetters)
      return
    }
    let cancelled = false
    setConfigLoading(true)
    setSaveError(null)
    investmentOpsApi
      .getOrderConfiguration(fundId)
      .then((res) => {
        if (cancelled) return
        if (!res.success || !res.data) {
          clearOrderConfiguration(configSetters)
          return
        }
        applyOrderConfiguration(res.data, configSetters)
      })
      .catch(() => {
        if (!cancelled) clearOrderConfiguration(configSetters)
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundId])

  const loadRoutes = async () => {
    setRoutesLoading(true)
    try {
      const res = await investmentOpsApi.listApprovalRoutes({ fundId: fundId || undefined, pageSize: 100 })
      if (!res.success) {
        setApprovalRoutes([])
        return
      }
      const data = res.data as Record<string, unknown> | ApprovalRoute[] | undefined
      if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray((data as { routes?: ApprovalRoute[] }).routes)) {
        setApprovalRoutes((data as { routes: ApprovalRoute[] }).routes)
        return
      }
      setApprovalRoutes(unwrapList<ApprovalRoute>(data))
    } catch {
      setApprovalRoutes([])
    } finally {
      setRoutesLoading(false)
    }
  }

  useEffect(() => {
    loadRoutes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundId])

  const brokerOptions = useMemo(
    () => (brokers.length ? brokers.map((b) => b.name || b.id) : ['No brokers returned']),
    [brokers],
  )
  const custodianOptions = useMemo(
    () => (custodians.length ? custodians.map((c) => c.name || c.id) : ['No custodians returned']),
    [custodians],
  )
  const brokerName = brokers.find((b) => b.id === brokerId)?.name || displayValue('')
  const custodianName = custodians.find((c) => c.id === custodianId)?.name || displayValue('')
  const fundName = funds.find((f) => f.id === fundId)?.name || displayValue('')
  const routeNames = useMemo(
    () => (approvalRoutes.length ? approvalRoutes.map((r) => r.name || r.id) : []),
    [approvalRoutes],
  )
  const routeOptions = routeNames.length ? routeNames : ['No routes returned']

  const saveRoute = async () => {
    if (!draft.name.trim()) return
    setRoutesSaving(true)
    setSaveError(null)
    try {
      const steps = (draft.approvers || 'PORTFOLIO_MANAGER')
        .split(/→|->|,/)
        .map((part, index) => ({ stepNo: index + 1, role: part.trim().toUpperCase().replace(/\s+/g, '_') }))
        .filter((step) => step.role)
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        isActive: true,
        steps: steps.length ? steps : [{ stepNo: 1, role: 'PORTFOLIO_MANAGER' }],
      }
      if (fundId) payload.fundId = fundId
      if (draft.threshold.trim()) {
        payload.minAmount = draft.threshold.trim()
        payload.criteria = { minNotional: draft.threshold.trim() }
      }
      const res = await investmentOpsApi.createApprovalRoute(payload)
      if (!res.success) throw new Error(formatOpsError(res))
      setModal(false)
      setDraft({ name: '', threshold: '', approvers: '' })
      await loadRoutes()
    } catch (e) {
      setSaveError(formatOpsError(e))
    } finally {
      setRoutesSaving(false)
    }
  }

  const save = async () => {
    setSaveError(null)
    setSaved(false)
    if (!fundId) {
      setSaveError('Select a portfolio before saving configuration.')
      return
    }
    setConfigSaving(true)
    try {
      const settlementPolicyJson: Record<string, unknown> = {}
      if (cycle) settlementPolicyJson.cycle = cycle
      if (account) settlementPolicyJson.settlementAccount = account
      if (delivery) settlementPolicyJson.settlementMethod = delivery
      if (signing) settlementPolicyJson.signingRule = signing
      if (cutoff) settlementPolicyJson.instructionCutoff = cutoff
      if (swiftBic) settlementPolicyJson.swiftSenderBic = swiftBic
      if (ssiRef) settlementPolicyJson.ssiReference = ssiRef
      if (custodianId) settlementPolicyJson.defaultCustodianProfileId = custodianId
      settlementPolicyJson.positiveCashRequired = cashCheck

      const approvalPolicyJson = { fourEyeOrders: fourEye }

      const routingPolicyJson: Record<string, unknown> = {
        autoRoute,
        cashCheck,
      }
      if (channel) routingPolicyJson.channel = channel
      if (route) routingPolicyJson.defaultApprovalRoute = route
      if (deskCode) routingPolicyJson.deskCode = deskCode
      if (brokerId) routingPolicyJson.defaultBrokerProfileId = brokerId

      const configRes = await investmentOpsApi.updateOrderConfiguration(fundId, {
        settlementPolicyJson,
        approvalPolicyJson,
        routingPolicyJson,
        expectedVersion: configVersion,
      })
      if (!configRes.success) throw new Error(formatOpsError(configRes))
      if (configRes.data) applyOrderConfiguration(configRes.data, configSetters)

      if (setupSettings) {
        await dispatch(
          updateSetupSettings({
            ...setupSettings,
            four_eye_orders: { enabled: fourEye },
          }),
        ).unwrap()
      }

      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(formatOpsError(e))
    } finally {
      setConfigSaving(false)
    }
  }

  const saving = configSaving || setupSettingsSaving
  const pageLoading = brokersLoading || custodiansLoading || setupSettingsLoading || fundsLoading || configLoading

  return (
    <ModuleSetupWorkspace
      orderSetupContent={
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-white">Order Configuration</h2>
              <p className="mt-1 text-[10px] text-[#718095]">Execution, approval, signing and settlement defaults per portfolio.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SetupSelect
                label="Portfolio"
                value={fundsLoading ? 'Loading…' : fundName}
                options={funds.length ? funds.map((f) => f.name) : ['No portfolios returned']}
                onChange={(name) => {
                  const found = funds.find((f) => f.name === name)
                  if (found) setFundId(found.id)
                }}
              />
              <button type="button" className={buttonClass} disabled={saving || configLoading || !fundId} onClick={save}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save configuration
              </button>
            </div>
          </div>
          {loadError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{loadError}</div>}
          {saveError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{saveError}</div>}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Order configuration saved for {fundName}.
            </div>
          )}
          {(brokersLoading || custodiansLoading || setupSettingsLoading || fundsLoading || configLoading) && (
            <OpsPageSkeleton kpis={0} tableRows={6} tableCols={4} className="mb-4" />
          )}
          {!pageLoading && (
          <div className="grid gap-4 lg:grid-cols-2">
            <SetupCard title="Execution & Routing">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <SetupSelect
                  label="Default broker"
                  value={brokerId ? brokerName : '—'}
                  options={brokerOptions}
                  onChange={(name) => {
                    const found = brokers.find((b) => (b.name || b.id) === name)
                    if (found) setBrokerId(found.id)
                  }}
                />
                <SetupSelect
                  label="Routing channel"
                  value={displayValue(channel)}
                  options={['—', ...CHANNEL_OPTIONS]}
                  onChange={(value) => setChannel(value === '—' ? '' : value)}
                />
                <SetupSelect
                  label="Default approval route"
                  value={displayValue(route)}
                  options={['—', ...routeOptions]}
                  onChange={(value) => setRoute(value === '—' || value === 'No routes returned' ? '' : value)}
                />
                <Field label="Routing desk code" value={deskCode} onChange={setDeskCode} />
              </div>
            </SetupCard>
            <SetupCard title="Custody & Settlement">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <SetupSelect
                  label="Default custodian"
                  value={custodianId ? custodianName : '—'}
                  options={custodianOptions}
                  onChange={(name) => {
                    const found = custodians.find((c) => (c.name || c.id) === name)
                    if (found) setCustodianId(found.id)
                  }}
                />
                <Field label="Settlement account" value={account} onChange={setAccount} />
                <SetupSelect
                  label="Settlement cycle"
                  value={displayValue(cycle)}
                  options={['—', ...CYCLE_OPTIONS]}
                  onChange={(value) => setCycle(value === '—' ? '' : value)}
                />
                <SetupSelect
                  label="Settlement method"
                  value={displayValue(delivery)}
                  options={['—', ...DELIVERY_OPTIONS]}
                  onChange={(value) => setDelivery(value === '—' ? '' : value)}
                />
              </div>
            </SetupCard>
            <SetupCard title="Signing Configuration">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <SetupSelect
                  label="Signing rule"
                  value={displayValue(signing)}
                  options={['—', ...SIGNING_OPTIONS]}
                  onChange={(value) => setSigning(value === '—' ? '' : value)}
                />
                <Field label="Instruction cutoff" type="time" value={cutoff} onChange={setCutoff} />
                <Field label="SWIFT sender BIC" value={swiftBic} onChange={setSwiftBic} />
                <Field label="SSI reference" value={ssiRef} onChange={setSsiRef} />
              </div>
            </SetupCard>
            <SetupCard title="Order Controls">
              <div className="divide-y divide-white/[.06] px-5">
                <Control
                  title="Four-eye approval"
                  text="Maker and final approver must be different users. Saved to order configuration and setup/settings."
                  checked={fourEye}
                  onChange={setFourEye}
                />
                <Control
                  title="Pre-trade cash check"
                  text="Require sufficient projected settled cash before routing."
                  checked={cashCheck}
                  onChange={setCashCheck}
                />
                <Control title="Auto-route approved orders" text="Send immediately after final approval." checked={autoRoute} onChange={setAutoRoute} />
              </div>
            </SetupCard>
          </div>
          )}
          <SetupCard
            title="Approval Routes"
            className="mt-4"
            action={
              <button type="button" className={`${buttonClass} h-7 px-4`} onClick={() => setModal(true)}>
                <Plus className="h-3 w-3" />
                New route
              </button>
            }
          >
            {routesLoading ? (
              <OpsTableSkeleton rows={4} cols={4} className="px-5 py-4" />
            ) : (
              <DenseTable columns={['Route', 'Applies to', 'Approval sequence', 'Status']} rows={approvalRoutes.map(routeTableRow)} />
            )}
            <p className="border-t border-white/[.06] px-5 py-3 text-[10px] text-[#718095]">
              {routesLoading ? 'Loading approval routes…' : approvalRoutes.length ? 'Approval routes loaded from API.' : 'No approval routes returned by the API.'}
            </p>
          </SetupCard>
          {modal && (
            <SetupModal title="Create Approval Route" description="Creates a route via the approval-routes API." onClose={() => setModal(false)} onSubmit={saveRoute}>
              <div className="space-y-4">
                <Input label="Route name" value={draft.name} onChange={(name) => setDraft((v) => ({ ...v, name }))} />
                <Input label="Threshold" value={draft.threshold} onChange={(threshold) => setDraft((v) => ({ ...v, threshold }))} />
                <Input label="Approval sequence" value={draft.approvers} onChange={(approvers) => setDraft((v) => ({ ...v, approvers }))} />
              </div>
            </SetupModal>
          )}
        </>
      }
    />
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} placeholder="—" />
    </label>
  )
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] text-[#8b99ad]">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} />
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
