'use client'

import { useState } from 'react'
import { CheckCircle2, Save, ShieldCheck } from 'lucide-react'
import { DenseTable, SetupCard, SetupHeader, SetupSelect, Toggle, buttonClass, fieldClass } from '@/components/investments-v2/setup-workspace'

export default function PortfolioSetupPage() {
  const [portfolio, setPortfolio] = useState('Arcus Balanced Fund')
  const [manager, setManager] = useState('Tariro Moyo')
  const [status, setStatus] = useState('Active')
  const [currency, setCurrency] = useState('USD')
  const [valuation, setValuation] = useState('Mark-to-market')
  const [costBasis, setCostBasis] = useState('Weighted average')
  const [pricing, setPricing] = useState('Primary market close')
  const [cycle, setCycle] = useState('T+2')
  const [account, setAccount] = useState('CABS Â· 001-88340-02')
  const [fourEye, setFourEye] = useState(true)
  const [blockBreaches, setBlockBreaches] = useState(true)
  const [positiveCash, setPositiveCash] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#05090f]">
      <SetupHeader title="Portfolio Setup" description="Portfolio-specific valuation, settlement, controls and investment limits"
        action={<button className={buttonClass} onClick={save}><Save className="h-3.5 w-3.5" />Save changes</button>} />
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {saved && <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] text-emerald-300"><CheckCircle2 className="h-4 w-4" />Portfolio configuration saved locally.</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          <SetupCard title="Portfolio Context"><div className="grid gap-4 p-5 sm:grid-cols-2">
            <SetupSelect label="Selected portfolio" value={portfolio} options={['Arcus Balanced Fund', 'Arcus Income Fund', 'Arcus Growth Fund']} onChange={setPortfolio} />
            <SetupSelect label="Portfolio manager" value={manager} options={['Tariro Moyo', 'Simba Ndlovu', 'Ruvimbo Chirwa']} onChange={setManager} />
            <SetupSelect label="Status" value={status} options={['Active', 'Restricted', 'Closed']} onChange={setStatus} />
            <SetupSelect label="Base currency" value={currency} options={['USD', 'ZWG', 'ZAR', 'GBP']} onChange={setCurrency} />
          </div></SetupCard>
          <SetupCard title="Valuation & Cost Basis"><div className="grid gap-4 p-5 sm:grid-cols-2">
            <SetupSelect label="Valuation method" value={valuation} options={['Mark-to-market', 'Amortised cost', 'NAV', 'Fair value']} onChange={setValuation} />
            <SetupSelect label="Cost-basis method" value={costBasis} options={['Weighted average', 'FIFO', 'LIFO', 'Specific lot']} onChange={setCostBasis} />
            <SetupSelect label="Pricing source" value={pricing} options={['Primary market close', 'Bloomberg BVAL', 'Custodian feed']} onChange={setPricing} />
            <Field label="Valuation cutoff" type="time" value="17:00" />
          </div></SetupCard>
          <SetupCard title="Settlement Defaults"><div className="grid gap-4 p-5 sm:grid-cols-2">
            <SetupSelect label="Settlement cycle" value={cycle} options={['T+0', 'T+1', 'T+2', 'T+3']} onChange={setCycle} />
            <SetupSelect label="Settlement account" value={account} options={['CABS Â· 001-88340-02', 'CBZ Â· 100-44291-11', 'Stanbic Â· 914-20218-90']} onChange={setAccount} />
            <Field label="Custody account" value="CABS-CUST-ABF-01" /><Field label="Cash ledger" value="1100-USD-CASH" />
          </div></SetupCard>
          <SetupCard title="Four-eye Controls"><div className="divide-y divide-white/[.06] px-5">
            <Control title="Four-eye approval" text="Require a separate approver for changes and manual prices." checked={fourEye} onChange={setFourEye} />
            <Control title="Block hard-limit breaches" text="Prevent orders that breach a hard portfolio limit." checked={blockBreaches} onChange={setBlockBreaches} />
            <Control title="Enforce positive cash" text="Reject orders producing negative projected settled cash." checked={positiveCash} onChange={setPositiveCash} />
          </div></SetupCard>
        </div>
        <SetupCard title="Portfolio Limits" className="mt-4"><DenseTable columns={['Limit', 'Measure', 'Warning', 'Hard limit', 'Action']} rows={[
          ['Single issuer exposure', '% of NAV', '8%', '10%', 'Block'], ['Unlisted instruments', '% of NAV', '12%', '15%', 'Escalate'], ['Minimum liquidity', '% liquid assets', '22%', '20%', 'Block'], ['Foreign currency exposure', '% of NAV', '28%', '30%', 'Escalate'],
        ]} /></SetupCard>
      </div>
    </div>
  )
}

function Field({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  return <label><span className="mb-1.5 block text-[9px] uppercase tracking-[.12em] text-[#718095]">{label}</span><input type={type} defaultValue={value} className={fieldClass} /></label>
}
function Control({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div className="flex gap-3"><ShieldCheck className="h-4 w-4 text-[#69a9ff]" /><div><div className="text-[11px] font-medium text-white">{title}</div><div className="mt-1 text-[9px] text-[#718095]">{text}</div></div></div><Toggle checked={checked} onChange={onChange} /></div>
}
