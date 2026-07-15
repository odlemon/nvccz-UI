"use client"

import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  FrField,
  FrWizardShell,
  frInputClass,
  frSelectClass,
  type FrWizardStep,
} from "@/components/fundraising/fundraising-modals"

function useWizard(steps: FrWizardStep[], initialStep?: string) {
  const [stepId, setStepId] = useState(initialStep ?? steps[0]?.id ?? "")
  const [errors, setErrors] = useState<string[]>([])
  const idx = Math.max(0, steps.findIndex((s) => s.id === stepId))

  const goBack = () => {
    setErrors([])
    if (idx > 0) setStepId(steps[idx - 1].id)
  }

  const goNext = (validate: () => string[]) => {
    const errs = validate()
    if (errs.length) {
      setErrors(errs)
      return
    }
    setErrors([])
    if (idx < steps.length - 1) setStepId(steps[idx + 1].id)
  }

  const reset = () => {
    setStepId(steps[0]?.id ?? "")
    setErrors([])
  }

  return { stepId, setStepId, errors, setErrors, idx, goBack, goNext, reset }
}

function ReviewList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-[#f1f5f9] rounded-[6px] border border-[#e2e8f0]">
      {items.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-3 px-3 py-2.5">
          <dt className="text-[11px] text-[#64748b]">{row.label}</dt>
          <dd className="text-right text-[12px] font-medium text-[#0f172a]">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ─── Opportunity ─── */

const OPP_STEPS: FrWizardStep[] = [
  { id: "basics", short: "1", label: "Basics" },
  { id: "investor", short: "2", label: "Investor" },
  { id: "amounts", short: "3", label: "Amounts" },
  { id: "stage", short: "4", label: "Stage & campaign" },
  { id: "review", short: "5", label: "Review" },
]

export function FrOpportunityWizard({
  open,
  onOpenChange,
  defaultStage,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultStage?: string
  onCreated?: (draft: Record<string, string>) => void
}) {
  const wiz = useWizard(OPP_STEPS)
  const [name, setName] = useState("National Pension Authority — ZGF II")
  const [owner, setOwner] = useState("Sarah Chen")
  const [investor, setInvestor] = useState("National Pension Authority")
  const [type, setType] = useState("Pension")
  const [geography, setGeography] = useState("Zimbabwe")
  const [soft, setSoft] = useState("8.0")
  const [currency, setCurrency] = useState("USD")
  const [probability, setProbability] = useState("40")
  const [campaign, setCampaign] = useState("ZGF II")
  const [stage, setStage] = useState(defaultStage || "Prospect")
  const [scenario, setScenario] = useState("Base")

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "basics" && !name.trim()) e.push("Opportunity name is required")
    if (wiz.stepId === "investor" && !investor.trim()) e.push("Investor is required")
    if (wiz.stepId === "amounts" && !soft.trim()) e.push("Soft circle amount is required")
    return e
  }

  const finish = () => {
    const draft = { name, owner, investor, type, geography, soft, currency, probability, campaign, stage, scenario }
    onCreated?.(draft)
    toast.success("Opportunity created", { description: name })
    wiz.reset()
    onOpenChange(false)
  }

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) wiz.reset()
        onOpenChange(v)
      }}
      title="Add Opportunity"
      steps={OPP_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={finish}
      submitLabel="Create opportunity"
      errors={wiz.errors}
    >
      {wiz.stepId === "basics" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Opportunity name" className="sm:col-span-2">
            <input className={frInputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </FrField>
          <FrField label="Owner">
            <select className={frSelectClass} value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option>Sarah Chen</option>
              <option>James Okello</option>
              <option>You</option>
            </select>
          </FrField>
          <FrField label="Scenario (assumptions only)">
            <select className={frSelectClass} value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option>Downside</option>
              <option>Base</option>
              <option>Upside</option>
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "investor" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Investor / client" className="sm:col-span-2">
            <input className={frInputClass} value={investor} onChange={(e) => setInvestor(e.target.value)} />
          </FrField>
          <FrField label="Investor type">
            <select className={frSelectClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option>Pension</option>
              <option>Insurance</option>
              <option>Family Office</option>
              <option>Endowment</option>
              <option>Corporate</option>
            </select>
          </FrField>
          <FrField label="Geography">
            <input className={frInputClass} value={geography} onChange={(e) => setGeography(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "amounts" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FrField label="Soft circle (M)">
            <input className={frInputClass} value={soft} onChange={(e) => setSoft(e.target.value)} />
          </FrField>
          <FrField label="Currency">
            <select className={frSelectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option>
              <option>ZAR</option>
              <option>EUR</option>
            </select>
          </FrField>
          <FrField label="Probability %">
            <input className={frInputClass} value={probability} onChange={(e) => setProbability(e.target.value)} />
          </FrField>
          <p className="sm:col-span-3 text-[11px] text-[#64748b]">
            Soft circle stays separate from signed / admitted / funded amounts (SRD).
          </p>
        </div>
      )}
      {wiz.stepId === "stage" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Campaign">
            <select className={frSelectClass} value={campaign} onChange={(e) => setCampaign(e.target.value)}>
              <option>ZGF II</option>
              <option>Institutional Mandates FY25</option>
              <option>Co-invest SEZ</option>
            </select>
          </FrField>
          <FrField label="Pipeline stage">
            <select className={frSelectClass} value={stage} onChange={(e) => setStage(e.target.value)}>
              <option>Prospect</option>
              <option>First Meeting</option>
              <option>Data Room</option>
              <option>Term Sheet</option>
              <option>Verbal Soft Circle</option>
              <option>Documentation</option>
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Name", value: name },
            { label: "Investor", value: `${investor} · ${type}` },
            { label: "Geography", value: geography },
            { label: "Soft circle", value: `${currency} ${soft}M @ ${probability}%` },
            { label: "Campaign / stage", value: `${campaign} · ${stage}` },
            { label: "Owner / scenario", value: `${owner} · ${scenario}` },
          ]}
        />
      )}
    </FrWizardShell>
  )
}

/* ─── Campaign ─── */

const CAMP_STEPS: FrWizardStep[] = [
  { id: "identity", short: "1", label: "Identity" },
  { id: "target", short: "2", label: "Target & horizon" },
  { id: "pipeline", short: "3", label: "Pipeline template" },
  { id: "owners", short: "4", label: "Owners" },
  { id: "review", short: "5", label: "Review" },
]

export function FrCampaignWizard({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const wiz = useWizard(CAMP_STEPS)
  const [name, setName] = useState("ZGF II First Close Push")
  const [fundType, setFundType] = useState("PE/VC")
  const [target, setTarget] = useState("60")
  const [start, setStart] = useState("2026-01-01")
  const [end, setEnd] = useState("2026-12-31")
  const [template, setTemplate] = useState("PE fundraising default")
  const [owner, setOwner] = useState("Sarah Chen")
  const [coOwner, setCoOwner] = useState("James Okello")

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "identity" && !name.trim()) e.push("Campaign name is required")
    if (wiz.stepId === "target" && !target.trim()) e.push("Target raise is required")
    return e
  }

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) wiz.reset()
        onOpenChange(v)
      }}
      title="New Campaign"
      steps={CAMP_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={() => {
        toast.success("Campaign created", { description: name })
        wiz.reset()
        onOpenChange(false)
      }}
      submitLabel="Create campaign"
      errors={wiz.errors}
    >
      {wiz.stepId === "identity" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Campaign name" className="sm:col-span-2">
            <input className={frInputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </FrField>
          <FrField label="Fund / product type">
            <select className={frSelectClass} value={fundType} onChange={(e) => setFundType(e.target.value)}>
              <option>PE/VC</option>
              <option>Asset Management</option>
              <option>Co-invest</option>
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "target" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FrField label="Target raise (US$M)">
            <input className={frInputClass} value={target} onChange={(e) => setTarget(e.target.value)} />
          </FrField>
          <FrField label="Start">
            <input type="date" className={frInputClass} value={start} onChange={(e) => setStart(e.target.value)} />
          </FrField>
          <FrField label="Target close">
            <input type="date" className={frInputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "pipeline" && (
        <FrField label="Stage template">
          <select className={frSelectClass} value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option>PE fundraising default</option>
            <option>AM mandate pipeline</option>
            <option>Co-invest abbreviated</option>
          </select>
        </FrField>
      )}
      {wiz.stepId === "owners" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Lead IR">
            <select className={frSelectClass} value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option>Sarah Chen</option>
              <option>James Okello</option>
            </select>
          </FrField>
          <FrField label="Co-owner">
            <select className={frSelectClass} value={coOwner} onChange={(e) => setCoOwner(e.target.value)}>
              <option>James Okello</option>
              <option>Sarah Chen</option>
              <option>Compliance Desk</option>
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Campaign", value: name },
            { label: "Type", value: fundType },
            { label: "Target", value: `US$${target}M` },
            { label: "Horizon", value: `${start} → ${end}` },
            { label: "Template", value: template },
            { label: "Owners", value: `${owner}, ${coOwner}` },
          ]}
        />
      )}
    </FrWizardShell>
  )
}

/* ─── Mandate ─── */

const MAND_STEPS: FrWizardStep[] = [
  { id: "client", short: "1", label: "Client" },
  { id: "terms", short: "2", label: "Mandate terms" },
  { id: "fees", short: "3", label: "Fees & custody" },
  { id: "activation", short: "4", label: "Activation" },
  { id: "review", short: "5", label: "Review" },
]

export function FrMandateWizard({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const wiz = useWizard(MAND_STEPS)
  const [client, setClient] = useState("Old Mutual Investment Group")
  const [product, setProduct] = useState("Balanced Income Mandate")
  const [aum, setAum] = useState("25")
  const [benchmark, setBenchmark] = useState("CPI + 3%")
  const [guidelines, setGuidelines] = useState("Max 40% equity; investment grade credit only")
  const [mgmtFee, setMgmtFee] = useState("0.75")
  const [custody, setCustody] = useState("Stanbic Custody")
  const [start, setStart] = useState("2026-08-01")
  const [owner, setOwner] = useState("James Okello")

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "client" && !client.trim()) e.push("Client is required")
    if (wiz.stepId === "terms" && !product.trim()) e.push("Product / mandate name is required")
    return e
  }

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) wiz.reset()
        onOpenChange(v)
      }}
      title="Add Mandate"
      steps={MAND_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={() => {
        toast.success("Mandate created", { description: product })
        wiz.reset()
        onOpenChange(false)
      }}
      submitLabel="Create mandate"
      errors={wiz.errors}
    >
      {wiz.stepId === "client" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Client" className="sm:col-span-2">
            <input className={frInputClass} value={client} onChange={(e) => setClient(e.target.value)} />
          </FrField>
          <FrField label="Owner">
            <select className={frSelectClass} value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option>James Okello</option>
              <option>Sarah Chen</option>
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "terms" && (
        <div className="space-y-3">
          <FrField label="Mandate / product name">
            <input className={frInputClass} value={product} onChange={(e) => setProduct(e.target.value)} />
          </FrField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FrField label="Target AUM (US$M)">
              <input className={frInputClass} value={aum} onChange={(e) => setAum(e.target.value)} />
            </FrField>
            <FrField label="Benchmark">
              <input className={frInputClass} value={benchmark} onChange={(e) => setBenchmark(e.target.value)} />
            </FrField>
          </div>
          <FrField label="Investment guidelines">
            <textarea
              className={frInputClass + " h-20 py-2"}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
            />
          </FrField>
        </div>
      )}
      {wiz.stepId === "fees" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Management fee %">
            <input className={frInputClass} value={mgmtFee} onChange={(e) => setMgmtFee(e.target.value)} />
          </FrField>
          <FrField label="Custodian">
            <input className={frInputClass} value={custody} onChange={(e) => setCustody(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "activation" && (
        <FrField label="Proposed activation date">
          <input type="date" className={frInputClass} value={start} onChange={(e) => setStart(e.target.value)} />
        </FrField>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Client", value: client },
            { label: "Mandate", value: product },
            { label: "AUM / benchmark", value: `US$${aum}M · ${benchmark}` },
            { label: "Fee / custody", value: `${mgmtFee}% · ${custody}` },
            { label: "Activation", value: start },
            { label: "Owner", value: owner },
          ]}
        />
      )}
    </FrWizardShell>
  )
}

/* ─── Generic helpers for remaining flows ─── */

export function FrSimpleWizard({
  open,
  onOpenChange,
  title,
  steps,
  submitLabel,
  validateStep,
  onSubmit,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  steps: FrWizardStep[]
  submitLabel: string
  validateStep: (stepId: string) => string[]
  onSubmit: () => void
  children: (stepId: string) => ReactNode
}) {
  const wiz = useWizard(steps)
  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) wiz.reset()
        onOpenChange(v)
      }}
      title={title}
      steps={steps}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(() => validateStep(wiz.stepId))}
      onSubmit={() => {
        onSubmit()
        wiz.reset()
        onOpenChange(false)
      }}
      submitLabel={submitLabel}
      errors={wiz.errors}
    >
      {children(wiz.stepId)}
    </FrWizardShell>
  )
}

export { ReviewList }
