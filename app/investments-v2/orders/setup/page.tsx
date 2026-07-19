'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Plus, Save, ShieldCheck } from 'lucide-react'
import { DenseTable, ModuleSetupWorkspace, SetupCard, SetupModal, SetupSelect, Toggle, buttonClass, fieldClass } from '@/components/investments-v2/setup-workspace'
import { formatOpsError, investmentOpsApi, unwrapList, type ApprovalRoute } from '@/lib/api/investment-ops-api'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import {
  fetchBrokers,
  fetchCustodians,
  fetchSetupSettings,
  updateSetupSettings,
} from '@/lib/store/slices/investmentOpsSlice'

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

  const [brokerId, setBrokerId] = useState('')
  const [custodianId, setCustodianId] = useState('')
  const [account, setAccount] = useState('CABS USD Settlement')
  const [route, setRoute] = useState('Standard dealing')
  const [channel, setChannel] = useState('FIX with email fallback')
  const [signing, setSigning] = useState('Two authorised signatories')
  const [cycle, setCycle] = useState('T+2')
  const [delivery, setDelivery] = useState('Delivery versus payment')
  const [fourEye, setFourEye] = useState(true)
  const [cashCheck, setCashCheck] = useState(true)
  const [autoRoute, setAutoRoute] = useState(false)
  const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [routesSaving, setRoutesSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState({ name: '', threshold: '', approvers: '' })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

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
    if (!brokerId && brokers[0]?.id) setBrokerId(brokers[0].id)
  }, [brokers, brokerId])

  useEffect(() => {
    if (!custodianId && custodians[0]?.id) setCustodianId(custodians[0].id)
  }, [custodians, custodianId])

  useEffect(() => {
    const enabled = setupSettings?.four_eye_orders?.enabled
    if (typeof enabled === 'boolean') setFourEye(enabled)
  }, [setupSettings])

  const loadRoutes = async () => {
    setRoutesLoading(true)
    try {
      const res = await investmentOpsApi.listApprovalRoutes({ pageSize: 100 })
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
  }, [])

  const brokerOptions = useMemo(
    () => (brokers.length ? brokers.map((b) => b.name || b.id) : ['No brokers returned']),
    [brokers],
  )
  const custodianOptions = useMemo(
    () => (custodians.length ? custodians.map((c) => c.name || c.id) : ['No custodians returned']),
    [custodians],
  )
  const brokerName = brokers.find((b) => b.id === brokerId)?.name || brokerOptions[0]
  const custodianName = custodians.find((c) => c.id === custodianId)?.name || custodianOptions[0]
  const routeNames = useMemo(
    () => (approvalRoutes.length ? approvalRoutes.map((route) => route.name || route.id) : ['No routes returned']),
    [approvalRoutes],
  )

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
      setSaveError(e instanceof Error ? e.message : 'Failed to create approval route')
    } finally {
      setRoutesSaving(false)
    }
  }

  const save = async () => {
    setSaveError(null)
    setSaved(false)
    if (!setupSettings) {
      setSaveError('Settings API returned an empty stub — cannot persist order controls yet.')
      return
    }
    try {
      await dispatch(
        updateSetupSettings({
          ...setupSettings,
          four_eye_orders: { enabled: fourEye },
        }),
      ).unwrap()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update settings')
    }
  }

  return (
    <ModuleSetupWorkspace
      orderSetupContent={
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[13px] font-semibold text-white">Order Configuration</h2>
              <p className="mt-1 text-[10px] text-[#718095]">Execution, approval, signing and settlement defaults for investment orders.</p>
            </div>
            <button type="button" className={buttonClass} disabled={setupSettingsSaving || setupSettingsLoading} onClick={save}>
              {setupSettingsSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save configuration
            </button>
          </div>
          {loadError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{loadError}</div>}
          {saveError && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-[11px] text-rose-200">{saveError}</div>}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Four-eye order setting saved via setup/settings.
            </div>
          )}
          {(brokersLoading || custodiansLoading || setupSettingsLoading) && (
            <div className="mb-4 flex items-center gap-2 text-[11px] text-[#8290a4]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading brokers, custodians and settings…
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <SetupCard title="Execution & Routing">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <SetupSelect
                  label="Default broker"
                  value={brokerName}
                  options={brokerOptions}
                  onChange={(name) => {
                    const found = brokers.find((b) => (b.name || b.id) === name)
                    if (found) setBrokerId(found.id)
                  }}
                />
                <SetupSelect label="Routing channel" value={channel} options={['FIX with email fallback', 'Email', 'Broker portal', 'Manual desk']} onChange={setChannel} />
                <SetupSelect label="Default approval route" value={route} options={routeNames} onChange={setRoute} />
                <Field label="Routing desk code" value="ARCUS-DEAL-01" />
              </div>
            </SetupCard>
            <SetupCard title="Custody & Settlement">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <SetupSelect
                  label="Default custodian"
                  value={custodianName}
                  options={custodianOptions}
                  onChange={(name) => {
                    const found = custodians.find((c) => (c.name || c.id) === name)
                    if (found) setCustodianId(found.id)
                  }}
                />
                <SetupSelect label="Settlement account" value={account} options={['CABS USD Settlement', 'CBZ ZWG Settlement', 'Stanbic ZAR Settlement']} onChange={setAccount} />
                <SetupSelect label="Settlement cycle" value={cycle} options={['T+0', 'T+1', 'T+2', 'T+3']} onChange={setCycle} />
                <SetupSelect label="Settlement method" value={delivery} options={['Delivery versus payment', 'Free of payment', 'Receipt versus payment']} onChange={setDelivery} />
              </div>
            </SetupCard>
            <SetupCard title="Signing Configuration">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <SetupSelect label="Signing rule" value={signing} options={['Two authorised signatories', 'Dealer and approver', 'CIO only', 'Digital signature']} onChange={setSigning} />
                <Field label="Instruction cutoff" type="time" value="15:30" />
                <Field label="SWIFT sender BIC" value="CABSZWHA" />
                <Field label="SSI reference" value="ARCUS-ZSE-USD-01" />
              </div>
            </SetupCard>
            <SetupCard title="Order Controls">
              <div className="divide-y divide-white/[.06] px-5">
                <Control title="Four-eye approval" text="Maker and final approver must be different users. Persisted to setup/settings when available." checked={fourEye} onChange={setFourEye} />
                <Control title="Pre-trade cash check" text="Require sufficient projected settled cash before routing. UI-only until settings key exists." checked={cashCheck} onChange={setCashCheck} />
                <Control title="Auto-route approved orders" text="Send immediately after final approval. UI-only until settings key exists." checked={autoRoute} onChange={setAutoRoute} />
              </div>
            </SetupCard>
          </div>
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
            <DenseTable columns={['Route', 'Applies to', 'Approval sequence', 'Status']} rows={approvalRoutes.map(routeTableRow)} />
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

function Field({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</span>
      <input type={type} defaultValue={value} className={fieldClass} />
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
