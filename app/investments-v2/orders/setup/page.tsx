'use client'

import { useState } from 'react'
import { CheckCircle2, Plus, Save, ShieldCheck } from 'lucide-react'
import { DenseTable, ModuleSetupWorkspace, SetupCard, SetupModal, SetupSelect, Toggle, buttonClass, fieldClass } from '@/components/investments-v2/setup-workspace'

const initialRoutes = [['Standard dealing', '≤ USD 100,000', 'Portfolio Manager → Dealer', 'Active'], ['Large order', '> USD 100,000', 'PM → CIO → Dealer', 'Active'], ['Restricted instrument', 'Any value', 'PM → Compliance → CIO', 'Active']]

export default function OrderSetupPage() {
  const [broker, setBroker] = useState('Imara Edwards Securities')
  const [custodian, setCustodian] = useState('CABS Custody')
  const [account, setAccount] = useState('CABS USD Settlement')
  const [route, setRoute] = useState('Standard dealing')
  const [channel, setChannel] = useState('FIX with email fallback')
  const [signing, setSigning] = useState('Two authorised signatories')
  const [cycle, setCycle] = useState('T+2')
  const [delivery, setDelivery] = useState('Delivery versus payment')
  const [fourEye, setFourEye] = useState(true)
  const [cashCheck, setCashCheck] = useState(true)
  const [autoRoute, setAutoRoute] = useState(false)
  const [routes, setRoutes] = useState(initialRoutes)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState({ name: '', threshold: '', approvers: '' })
  const [saved, setSaved] = useState(false)
  const saveRoute = () => {
    if (!draft.name.trim()) return
    setRoutes(rows => [...rows, [draft.name, draft.threshold || 'Any value', draft.approvers || 'Portfolio Manager → Dealer', 'Active']])
    setModal(false)
  }
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2500) }

  return (
    <ModuleSetupWorkspace orderSetupContent={
      <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[13px] font-semibold text-white">Order Configuration</h2>
          <p className="mt-1 text-[10px] text-[#718095]">Execution, approval, signing and settlement defaults for investment orders.</p>
        </div>
        <button className={buttonClass} onClick={save}><Save className="h-3.5 w-3.5" />Save configuration</button>
      </div>
        {saved && <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] text-emerald-300"><CheckCircle2 className="h-4 w-4" />Order setup saved locally.</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          <SetupCard title="Execution & Routing"><div className="grid gap-4 p-5 sm:grid-cols-2">
            <SetupSelect label="Default broker" value={broker} options={['Imara Edwards Securities', 'Morgan & Co.', 'ABC Stockbrokers']} onChange={setBroker} />
            <SetupSelect label="Routing channel" value={channel} options={['FIX with email fallback', 'Email', 'Broker portal', 'Manual desk']} onChange={setChannel} />
            <SetupSelect label="Default approval route" value={route} options={routes.map(item => item[0])} onChange={setRoute} />
            <Field label="Routing desk code" value="ARCUS-DEAL-01" />
          </div></SetupCard>
          <SetupCard title="Custody & Settlement"><div className="grid gap-4 p-5 sm:grid-cols-2">
            <SetupSelect label="Default custodian" value={custodian} options={['CABS Custody', 'CBZ Custodial Services', 'Stanbic Investor Services']} onChange={setCustodian} />
            <SetupSelect label="Settlement account" value={account} options={['CABS USD Settlement', 'CBZ ZWG Settlement', 'Stanbic ZAR Settlement']} onChange={setAccount} />
            <SetupSelect label="Settlement cycle" value={cycle} options={['T+0', 'T+1', 'T+2', 'T+3']} onChange={setCycle} />
            <SetupSelect label="Settlement method" value={delivery} options={['Delivery versus payment', 'Free of payment', 'Receipt versus payment']} onChange={setDelivery} />
          </div></SetupCard>
          <SetupCard title="Signing Configuration"><div className="grid gap-4 p-5 sm:grid-cols-2">
            <SetupSelect label="Signing rule" value={signing} options={['Two authorised signatories', 'Dealer and approver', 'CIO only', 'Digital signature']} onChange={setSigning} />
            <Field label="Instruction cutoff" type="time" value="15:30" /><Field label="SWIFT sender BIC" value="CABSZWHA" /><Field label="SSI reference" value="ARCUS-ZSE-USD-01" />
          </div></SetupCard>
          <SetupCard title="Order Controls"><div className="divide-y divide-white/[.06] px-5">
            <Control title="Four-eye approval" text="Maker and final approver must be different users." checked={fourEye} onChange={setFourEye} />
            <Control title="Pre-trade cash check" text="Require sufficient projected settled cash before routing." checked={cashCheck} onChange={setCashCheck} />
            <Control title="Auto-route approved orders" text="Send immediately after final approval." checked={autoRoute} onChange={setAutoRoute} />
          </div></SetupCard>
        </div>
        <SetupCard title="Approval Routes" className="mt-4" action={<button className={`${buttonClass} h-7 px-4`} onClick={() => setModal(true)}><Plus className="h-3 w-3" />New route</button>}>
          <DenseTable columns={['Route', 'Applies to', 'Approval sequence', 'Status']} rows={routes} />
        </SetupCard>
        {modal && <SetupModal title="Create Approval Route" description="Creates a local prototype route." onClose={() => setModal(false)} onSubmit={saveRoute}><div className="space-y-4">
          <Input label="Route name" value={draft.name} onChange={name => setDraft(v => ({ ...v, name }))} /><Input label="Threshold" value={draft.threshold} onChange={threshold => setDraft(v => ({ ...v, threshold }))} /><Input label="Approval sequence" value={draft.approvers} onChange={approvers => setDraft(v => ({ ...v, approvers }))} />
        </div></SetupModal>}
      </>
    } />
  )
}

function Field({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  return <label><span className="mb-1.5 block text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</span><input type={type} defaultValue={value} className={fieldClass} /></label>
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] text-[#8b99ad]">{label}</span><input value={value} onChange={event => onChange(event.target.value)} className={fieldClass} /></label>
}
function Control({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div className="flex gap-3"><ShieldCheck className="h-4 w-4 text-[#69a9ff]" /><div><div className="text-[11px] font-medium text-white">{title}</div><div className="mt-1 text-[9px] text-[#718095]">{text}</div></div></div><Toggle checked={checked} onChange={onChange} /></div>
}
