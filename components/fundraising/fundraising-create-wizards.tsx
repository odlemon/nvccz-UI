"use client"

import { useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"
import {
  FrField,
  FrWizardShell,
  frInputClass,
  frSelectClass,
  type FrWizardStep,
} from "@/components/fundraising/fundraising-modals"
import { fundraisingApi, asNumber, toastFrError } from "@/lib/api/fundraising-api"
import { usersApi, type AppUser } from "@/lib/api/users-api"
import { fundsApi, type Fund } from "@/lib/api/funds-api"

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
  { id: "campaign", short: "1", label: "Campaign" },
  { id: "investor", short: "2", label: "Investor" },
  { id: "amounts", short: "3", label: "Amounts" },
  { id: "details", short: "4", label: "Details" },
  { id: "review", short: "5", label: "Review" },
]

const OPP_TYPES = ["LP_COMMITMENT", "MANDATE", "CO_INVESTMENT", "SPV_INTEREST"]
const OPP_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"]
const OPP_SOURCES = ["DIRECT", "REFERRAL", "CONFERENCE", "PLACEMENT_AGENT", "CONSULTANT", "INBOUND"]

export function FrOpportunityWizard({
  open,
  onOpenChange,
  campaignId: fixedCampaignId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Pre-select / lock a campaign (e.g. when adding from the board). */
  campaignId?: string
  onCreated?: (opportunity: Record<string, any>) => void
}) {
  const wiz = useWizard(OPP_STEPS)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])

  const [campaignId, setCampaignId] = useState(fixedCampaignId || "")
  const [investorId, setInvestorId] = useState("")
  const [opportunityType, setOpportunityType] = useState(OPP_TYPES[0])
  const [currency, setCurrency] = useState("USD")
  const [indicativeAmount, setIndicativeAmount] = useState("")
  const [softCircleAmount, setSoftCircleAmount] = useState("")
  const [priority, setPriority] = useState("MEDIUM")
  const [source, setSource] = useState(OPP_SOURCES[0])
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!open) return
    setLoadingRefs(true)
    Promise.allSettled([
      fundraisingApi.listInvestors({ pageSize: 100 }),
      fundraisingApi.listCampaigns(),
    ])
      .then(([invRes, campRes]) => {
        setInvestors(invRes.status === "fulfilled" ? invRes.value.items ?? [] : [])
        setCampaigns(campRes.status === "fulfilled" ? campRes.value ?? [] : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [open])

  useEffect(() => {
    if (fixedCampaignId) setCampaignId(fixedCampaignId)
  }, [fixedCampaignId])

  const selectedInvestor = investors.find((i) => String(i.id) === investorId)
  const selectedCampaign = campaigns.find((c) => String(c.id) === campaignId)

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "campaign" && !campaignId) e.push("Campaign is required")
    if (wiz.stepId === "investor" && !investorId) e.push("Investor is required")
    return e
  }

  const reset = () => {
    setCampaignId(fixedCampaignId || "")
    setInvestorId("")
    setOpportunityType(OPP_TYPES[0])
    setCurrency("USD")
    setIndicativeAmount("")
    setSoftCircleAmount("")
    setPriority("MEDIUM")
    setSource(OPP_SOURCES[0])
    setExpectedCloseDate("")
    setNotes("")
    wiz.reset()
  }

  const finish = async () => {
    if (!campaignId || !investorId) {
      wiz.setErrors(["Campaign and investor are required"])
      return
    }
    setSubmitting(true)
    try {
      const created = await fundraisingApi.createOpportunity({
        campaignId,
        investorId,
        opportunityType,
        opportunityCurrency: currency,
        indicativeAmount: indicativeAmount ? asNumber(indicativeAmount) : undefined,
        softCircleAmount: softCircleAmount ? asNumber(softCircleAmount) : undefined,
        priority,
        source,
        expectedCloseDate: expectedCloseDate || undefined,
        notes: notes || undefined,
      })
      toast.success("Opportunity created", {
        description: selectedInvestor?.legalName || selectedInvestor?.name,
      })
      onCreated?.(created)
      reset()
      onOpenChange(false)
    } catch (err) {
      toastFrError(err, "Could not create opportunity")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
      title="Add Opportunity"
      steps={OPP_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={finish}
      submitLabel={submitting ? "Creating…" : "Create opportunity"}
      submitDisabled={submitting}
      errors={wiz.errors}
    >
      {wiz.stepId === "campaign" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Campaign" className="sm:col-span-2">
            <select
              className={frSelectClass}
              value={campaignId}
              disabled={Boolean(fixedCampaignId) || loadingRefs}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">{loadingRefs ? "Loading campaigns…" : "Select campaign"}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status ? `(${c.status})` : ""}
                </option>
              ))}
            </select>
          </FrField>
          {selectedCampaign && String(selectedCampaign.status).toUpperCase() !== "ACTIVE" ? (
            <p className="sm:col-span-2 text-[11px] text-[#c2410c]">
              Campaign is not ACTIVE yet — creation will fail until it is activated.
            </p>
          ) : null}
        </div>
      )}
      {wiz.stepId === "investor" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Investor" className="sm:col-span-2">
            <select
              className={frSelectClass}
              value={investorId}
              disabled={loadingRefs}
              onChange={(e) => setInvestorId(e.target.value)}
            >
              <option value="">{loadingRefs ? "Loading investors…" : "Select investor"}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.legalName || i.name}
                </option>
              ))}
            </select>
          </FrField>
          <FrField label="Opportunity type">
            <select className={frSelectClass} value={opportunityType} onChange={(e) => setOpportunityType(e.target.value)}>
              {OPP_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Source">
            <select className={frSelectClass} value={source} onChange={(e) => setSource(e.target.value)}>
              {OPP_SOURCES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "amounts" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FrField label="Indicative amount">
            <input className={frInputClass} value={indicativeAmount} onChange={(e) => setIndicativeAmount(e.target.value)} placeholder="0" />
          </FrField>
          <FrField label="Soft circle amount">
            <input className={frInputClass} value={softCircleAmount} onChange={(e) => setSoftCircleAmount(e.target.value)} placeholder="0" />
          </FrField>
          <FrField label="Currency">
            <select className={frSelectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option>
              <option>ZAR</option>
              <option>EUR</option>
            </select>
          </FrField>
          <p className="sm:col-span-3 text-[11px] text-[#64748b]">
            Soft circle stays separate from signed / admitted / funded amounts (SRD).
          </p>
        </div>
      )}
      {wiz.stepId === "details" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Priority">
            <select className={frSelectClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {OPP_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Expected close date">
            <input type="date" className={frInputClass} value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
          </FrField>
          <FrField label="Notes" className="sm:col-span-2">
            <textarea className={frInputClass + " h-20 py-2"} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context" />
          </FrField>
        </div>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Campaign", value: selectedCampaign?.name || "—" },
            { label: "Investor", value: selectedInvestor?.legalName || selectedInvestor?.name || "—" },
            { label: "Type / source", value: `${opportunityType.replace(/_/g, " ")} · ${source.replace(/_/g, " ")}` },
            { label: "Indicative / soft circle", value: `${currency} ${indicativeAmount || "0"} · ${currency} ${softCircleAmount || "0"}` },
            { label: "Priority", value: priority },
            { label: "Expected close", value: expectedCloseDate || "—" },
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
  { id: "fund", short: "3", label: "Fund & owner" },
  { id: "review", short: "4", label: "Review" },
]

const CAMPAIGN_TYPES = [
  "PE_FUNDRAISE",
  "VC_FUNDRAISE",
  "CO_INVESTMENT",
  "SPV",
  "CONTINUATION_VEHICLE",
  "INSTITUTIONAL_MANDATE",
  "PRODUCT_LAUNCH",
  "DISTRIBUTOR_CAMPAIGN",
]

const CAMPAIGN_TYPES_REQUIRING_FUND = new Set([
  "PE_FUNDRAISE",
  "VC_FUNDRAISE",
  "CO_INVESTMENT",
  "SPV",
  "CONTINUATION_VEHICLE",
])

export function FrCampaignWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (campaign: Record<string, any>) => void
}) {
  const wiz = useWizard(CAMP_STEPS)
  const [submitting, setSubmitting] = useState(false)
  const [loadingReferences, setLoadingReferences] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [name, setName] = useState("")
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0])
  const [targetCapital, setTargetCapital] = useState("")
  const [minimumTarget, setMinimumTarget] = useState("")
  const [hardCap, setHardCap] = useState("")
  const [description, setDescription] = useState("")
  const [regionTags, setRegionTags] = useState("")
  const [investorSegments, setInvestorSegments] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [startDate, setStartDate] = useState("")
  const [closeDate, setCloseDate] = useState("")
  const [fundId, setFundId] = useState("")
  const [activateAfterCreate, setActivateAfterCreate] = useState(false)

  const fundRequired = CAMPAIGN_TYPES_REQUIRING_FUND.has(campaignType)
  const selectedFund = funds.find((fund) => fund.id === fundId)
  const selectedOwner = users.find((user) => user.id === ownerId)

  useEffect(() => {
    if (!open) return
    setLoadingReferences(true)
    Promise.allSettled([fundsApi.getAll({ limit: 100 }), usersApi.getAll()])
      .then(([fundResult, userResult]) => {
        setFunds(
          fundResult.status === "fulfilled"
            ? fundResult.value.data?.funds ?? []
            : [],
        )
        setUsers(
          userResult.status === "fulfilled"
            ? userResult.value.data ?? []
            : [],
        )
      })
      .finally(() => setLoadingReferences(false))
  }, [open])

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "identity" && !name.trim()) e.push("Campaign name is required")
    if (wiz.stepId === "target" && !targetCapital.trim()) e.push("Target capital is required")
    if (wiz.stepId === "fund" && fundRequired && !fundId.trim()) e.push("Fund is required for this campaign type")
    return e
  }

  const reset = () => {
    setName("")
    setCampaignType(CAMPAIGN_TYPES[0])
    setTargetCapital("")
    setMinimumTarget("")
    setHardCap("")
    setDescription("")
    setRegionTags("")
    setInvestorSegments("")
    setOwnerId("")
    setCurrency("USD")
    setStartDate("")
    setCloseDate("")
    setFundId("")
    setActivateAfterCreate(false)
    wiz.reset()
  }

  const finish = async () => {
    setSubmitting(true)
    try {
      const created = await fundraisingApi.createCampaign({
        name,
        campaignType,
        targetCapital: asNumber(targetCapital),
        minimumTargetAmount: minimumTarget ? asNumber(minimumTarget) : undefined,
        hardCapAmount: hardCap ? asNumber(hardCap) : undefined,
        description: description.trim() || undefined,
        regionTags: regionTags.split(",").map((v) => v.trim()).filter(Boolean),
        investorSegments: { types: investorSegments.split(",").map((v) => v.trim()).filter(Boolean) },
        campaignOwnerId: ownerId.trim() || undefined,
        primaryCurrency: currency,
        startDate: startDate || undefined,
        closeDate: closeDate || undefined,
        fundId: fundId || undefined,
      })
      toast.success("Campaign created", { description: name })

      if (activateAfterCreate && created?.id) {
        try {
          await fundraisingApi.activateCampaign(created.id)
          toast.success("Campaign activated")
        } catch (activateErr) {
          toastFrError(activateErr, "Campaign created but could not be activated")
        }
      }

      onCreated?.(created)
      reset()
      onOpenChange(false)
    } catch (err) {
      toastFrError(err, "Could not create campaign")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
      title="New Campaign"
      steps={CAMP_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={finish}
      submitLabel={submitting ? "Creating…" : "Create campaign"}
      submitDisabled={submitting}
      errors={wiz.errors}
    >
      {wiz.stepId === "identity" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Campaign name" className="sm:col-span-2">
            <input className={frInputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fund IV First Close" />
          </FrField>
          <FrField label="Campaign type" className="sm:col-span-2">
            <select className={frSelectClass} value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Description" className="sm:col-span-2">
            <textarea className={frInputClass + " h-20 py-2"} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "target" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FrField label="Target capital">
            <input className={frInputClass} value={targetCapital} onChange={(e) => setTargetCapital(e.target.value)} placeholder="0" />
          </FrField>
          <FrField label="Currency">
            <select className={frSelectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option>
              <option>ZAR</option>
              <option>EUR</option>
            </select>
          </FrField>
          <FrField label="Minimum target"><input className={frInputClass} value={minimumTarget} onChange={(e) => setMinimumTarget(e.target.value)} /></FrField>
          <FrField label="Hard cap"><input className={frInputClass} value={hardCap} onChange={(e) => setHardCap(e.target.value)} /></FrField>
          <FrField label="Start date">
            <input type="date" className={frInputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FrField>
          <FrField label="Target close">
            <input type="date" className={frInputClass} value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "fund" && (
        <div className="space-y-3">
          <FrField label={fundRequired ? "Fund (required for this type)" : "Fund (optional)"}>
            <select className={frSelectClass} value={fundId} onChange={(e) => setFundId(e.target.value)} disabled={loadingReferences}>
              <option value="">{loadingReferences ? "Loading funds…" : "Select fund"}</option>
              {funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}
            </select>
          </FrField>
          <FrField label="Campaign owner">
            <select className={frSelectClass} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={loadingReferences}>
              <option value="">{loadingReferences ? "Loading users…" : "Select owner"}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                </option>
              ))}
            </select>
          </FrField>
          <FrField label="Region tags (comma separated)"><input className={frInputClass} value={regionTags} onChange={(e) => setRegionTags(e.target.value)} /></FrField>
          <FrField label="Investor segments (comma separated)"><input className={frInputClass} value={investorSegments} onChange={(e) => setInvestorSegments(e.target.value)} /></FrField>
          <label className="flex items-center gap-2 text-[12px] text-[#334155]">
            <input
              type="checkbox"
              checked={activateAfterCreate}
              onChange={(e) => setActivateAfterCreate(e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1]"
            />
            Activate campaign immediately after creation
          </label>
        </div>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Campaign", value: name },
            { label: "Type", value: campaignType.replace(/_/g, " ") },
            { label: "Target", value: `${currency} ${targetCapital || "0"}` },
            { label: "Minimum / hard cap", value: `${minimumTarget || "—"} / ${hardCap || "—"}` },
            { label: "Horizon", value: `${startDate || "—"} → ${closeDate || "—"}` },
            { label: "Fund", value: selectedFund?.name || "—" },
            { label: "Owner", value: selectedOwner ? [selectedOwner.firstName, selectedOwner.lastName].filter(Boolean).join(" ") || selectedOwner.email : "—" },
            { label: "Activate on create", value: activateAfterCreate ? "Yes" : "No" },
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
  { id: "linkage", short: "3", label: "Linkage" },
  { id: "review", short: "4", label: "Review" },
]

const MANDATE_STATUSES = ["DRAFT", "AWARDED", "ONBOARDING", "ASSETS_IN_TRANSITION", "PARTIALLY_FUNDED", "ACTIVE"]

export function FrMandateWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (mandate: Record<string, any>) => void
}) {
  const wiz = useWizard(MAND_STEPS)
  const [submitting, setSubmitting] = useState(false)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([])

  const [investorId, setInvestorId] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState("DRAFT")
  const [expectedAum, setExpectedAum] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [assetClass, setAssetClass] = useState("")
  const [geography, setGeography] = useState("")
  const [rfpDueDate, setRfpDueDate] = useState("")

  useEffect(() => {
    if (!open) return
    setLoadingRefs(true)
    Promise.allSettled([
      fundraisingApi.listInvestors({ pageSize: 100 }),
      fundraisingApi.listCampaigns(),
    ])
      .then(([invRes, campRes]) => {
        setInvestors(invRes.status === "fulfilled" ? invRes.value.items ?? [] : [])
        setCampaigns(campRes.status === "fulfilled" ? campRes.value ?? [] : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [open])

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "client" && !investorId) e.push("Client / investor is required")
    if (wiz.stepId === "terms" && !name.trim()) e.push("Mandate name is required")
    return e
  }

  const reset = () => {
    setInvestorId("")
    setCampaignId("")
    setName("")
    setStatus("DRAFT")
    setExpectedAum("")
    setCurrency("USD")
    setAssetClass("")
    setGeography("")
    setRfpDueDate("")
    wiz.reset()
  }

  const finish = async () => {
    setSubmitting(true)
    try {
      const created = await fundraisingApi.createMandate({
        investorId,
        campaignId: campaignId || undefined,
        name,
        status,
        expectedAum: expectedAum ? asNumber(expectedAum) : undefined,
        currency,
        assetClass: assetClass || undefined,
        geography: geography || undefined,
        rfpDueDate: rfpDueDate || undefined,
      })
      toast.success("Mandate created", { description: name })
      onCreated?.(created)
      reset()
      onOpenChange(false)
    } catch (err) {
      toastFrError(err, "Could not create mandate")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedInvestor = investors.find((i) => String(i.id) === investorId)

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
      title="Add Mandate"
      steps={MAND_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={finish}
      submitLabel={submitting ? "Creating…" : "Create mandate"}
      submitDisabled={submitting}
      errors={wiz.errors}
    >
      {wiz.stepId === "client" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Client / investor" className="sm:col-span-2">
            <select className={frSelectClass} value={investorId} disabled={loadingRefs} onChange={(e) => setInvestorId(e.target.value)}>
              <option value="">{loadingRefs ? "Loading investors…" : "Select investor"}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>{i.legalName || i.name}</option>
              ))}
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "terms" && (
        <div className="space-y-3">
          <FrField label="Mandate / product name">
            <input className={frInputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </FrField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FrField label="Expected AUM">
              <input className={frInputClass} value={expectedAum} onChange={(e) => setExpectedAum(e.target.value)} placeholder="0" />
            </FrField>
            <FrField label="Currency">
              <select className={frSelectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option>USD</option>
                <option>ZAR</option>
                <option>EUR</option>
              </select>
            </FrField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FrField label="Asset class (optional)">
              <input className={frInputClass} value={assetClass} onChange={(e) => setAssetClass(e.target.value)} placeholder="e.g. Private Equity" />
            </FrField>
            <FrField label="Geography (optional)">
              <input className={frInputClass} value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="e.g. Sub-Saharan Africa" />
            </FrField>
          </div>
          <FrField label="RFP due date (optional)">
            <input type="date" className={frInputClass} value={rfpDueDate} onChange={(e) => setRfpDueDate(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "linkage" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Related campaign (optional)">
            <select className={frSelectClass} value={campaignId} disabled={loadingRefs} onChange={(e) => setCampaignId(e.target.value)}>
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FrField>
          <FrField label="Status">
            <select className={frSelectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {MANDATE_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Client", value: selectedInvestor?.legalName || selectedInvestor?.name || "—" },
            { label: "Mandate", value: name },
            { label: "Expected AUM", value: `${currency} ${expectedAum || "0"}` },
            { label: "Status", value: status.replace(/_/g, " ") },
            { label: "Campaign", value: campaigns.find((c) => String(c.id) === campaignId)?.name || "—" },
            { label: "Asset class", value: assetClass || "—" },
            { label: "Geography", value: geography || "—" },
            { label: "RFP due date", value: rfpDueDate || "—" },
          ]}
        />
      )}
    </FrWizardShell>
  )
}

/* ─── Commitment ─── */

const COMMIT_STEPS: FrWizardStep[] = [
  { id: "investor", short: "1", label: "Investor" },
  { id: "opportunity", short: "2", label: "Opportunity" },
  { id: "terms", short: "3", label: "Commitment terms" },
  { id: "review", short: "4", label: "Review" },
]

const COMMITMENT_STATUSES = ["INDICATIVE", "SOFT_CIRCLED", "PROPOSED", "DOCUMENTS_ISSUED", "SIGNED", "ACCEPTED"]

export function FrCommitmentWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (commitment: Record<string, any>) => void
}) {
  const wiz = useWizard(COMMIT_STEPS)
  const [submitting, setSubmitting] = useState(false)
  const [loadingRefs, setLoadingRefs] = useState(false)
  const [loadingOpps, setLoadingOpps] = useState(false)
  const [investors, setInvestors] = useState<Record<string, any>[]>([])
  const [opportunities, setOpportunities] = useState<Record<string, any>[]>([])

  const [investorId, setInvestorId] = useState("")
  const [opportunityId, setOpportunityId] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [commitmentAmount, setCommitmentAmount] = useState("")
  const [status, setStatus] = useState("SOFT_CIRCLED")
  const [signedAt, setSignedAt] = useState("")

  useEffect(() => {
    if (!open) return
    setLoadingRefs(true)
    fundraisingApi
      .listInvestors({ pageSize: 100 })
      .then((res) => setInvestors(res.items ?? []))
      .catch(() => setInvestors([]))
      .finally(() => setLoadingRefs(false))
  }, [open])

  useEffect(() => {
    if (!open || !investorId) {
      setOpportunities([])
      return
    }
    setLoadingOpps(true)
    setOpportunityId("")
    fundraisingApi
      .listOpportunities({ investorId })
      .then((res) => setOpportunities(res ?? []))
      .catch(() => setOpportunities([]))
      .finally(() => setLoadingOpps(false))
  }, [open, investorId])

  const selectedInvestor = investors.find((i) => String(i.id) === investorId)
  const selectedOpportunity = opportunities.find((o) => String(o.id) === opportunityId)

  const validate = () => {
    const e: string[] = []
    if (wiz.stepId === "investor" && !investorId) e.push("Investor is required")
    if (wiz.stepId === "opportunity" && !opportunityId) e.push("Opportunity is required")
    if (wiz.stepId === "terms" && !commitmentAmount.trim()) e.push("Commitment amount is required")
    return e
  }

  const reset = () => {
    setInvestorId("")
    setOpportunityId("")
    setOpportunities([])
    setCurrency("USD")
    setCommitmentAmount("")
    setStatus("SOFT_CIRCLED")
    setSignedAt("")
    wiz.reset()
  }

  const finish = async () => {
    const campaignId = selectedOpportunity?.campaignId || selectedOpportunity?.campaign?.id
    if (!investorId || !opportunityId) {
      wiz.setErrors(["Investor and opportunity are required"])
      return
    }
    if (!campaignId) {
      wiz.setErrors(["Selected opportunity has no linked campaign"])
      return
    }
    setSubmitting(true)
    try {
      const created = await fundraisingApi.createCommitment({
        opportunityId,
        investorId,
        campaignId,
        currency,
        commitmentAmount: asNumber(commitmentAmount),
        status,
        signedAt: signedAt ? new Date(signedAt).toISOString() : undefined,
      })
      toast.success("Commitment recorded", {
        description: selectedInvestor?.legalName || selectedInvestor?.name,
      })
      onCreated?.(created)
      reset()
      onOpenChange(false)
    } catch (err) {
      toastFrError(err, "Could not record commitment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FrWizardShell
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
      title="Add Commitment"
      steps={COMMIT_STEPS}
      stepId={wiz.stepId}
      onStepChange={wiz.setStepId}
      onBack={wiz.goBack}
      onNext={() => wiz.goNext(validate)}
      onSubmit={finish}
      submitLabel={submitting ? "Recording…" : "Record commitment"}
      submitDisabled={submitting}
      errors={wiz.errors}
    >
      {wiz.stepId === "investor" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Investor" className="sm:col-span-2">
            <select
              className={frSelectClass}
              value={investorId}
              disabled={loadingRefs}
              onChange={(e) => setInvestorId(e.target.value)}
            >
              <option value="">{loadingRefs ? "Loading investors…" : "Select investor"}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.legalName || i.name}
                </option>
              ))}
            </select>
          </FrField>
        </div>
      )}
      {wiz.stepId === "opportunity" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FrField label="Opportunity" className="sm:col-span-2">
            <select
              className={frSelectClass}
              value={opportunityId}
              disabled={loadingOpps}
              onChange={(e) => setOpportunityId(e.target.value)}
            >
              <option value="">
                {loadingOpps
                  ? "Loading opportunities…"
                  : opportunities.length
                    ? "Select opportunity"
                    : "No opportunities for this investor"}
              </option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {(o.campaign?.name || o.campaignName || "Campaign")} · {(o.currentStage?.stageName || o.stageCode || o.status || "").toString().replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FrField>
          {!loadingOpps && investorId && opportunities.length === 0 ? (
            <p className="sm:col-span-2 text-[11px] text-[#c2410c]">
              This investor has no opportunities yet — create one first from Pipeline.
            </p>
          ) : null}
        </div>
      )}
      {wiz.stepId === "terms" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <FrField label="Commitment amount">
            <input className={frInputClass} value={commitmentAmount} onChange={(e) => setCommitmentAmount(e.target.value)} placeholder="0" />
          </FrField>
          <FrField label="Currency">
            <select className={frSelectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USD</option>
              <option>ZAR</option>
              <option>EUR</option>
            </select>
          </FrField>
          <FrField label="Status">
            <select className={frSelectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {COMMITMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FrField>
          <FrField label="Signed on (optional)" className="sm:col-span-3">
            <input type="date" className={frInputClass} value={signedAt} onChange={(e) => setSignedAt(e.target.value)} />
          </FrField>
        </div>
      )}
      {wiz.stepId === "review" && (
        <ReviewList
          items={[
            { label: "Investor", value: selectedInvestor?.legalName || selectedInvestor?.name || "—" },
            {
              label: "Opportunity / Campaign",
              value: selectedOpportunity
                ? selectedOpportunity.campaign?.name || selectedOpportunity.campaignName || "Linked campaign"
                : "—",
            },
            { label: "Amount", value: `${currency} ${commitmentAmount || "0"}` },
            { label: "Status", value: status.replace(/_/g, " ") },
            { label: "Signed on", value: signedAt || "—" },
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
  onFinish,
  children,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  steps: FrWizardStep[]
  submitLabel: string
  validateStep: (stepId: string) => string[]
  /** Sync completion callback (fires toast itself). Ignored if `onFinish` is provided. */
  onSubmit?: () => void
  /** Async completion callback — dialog stays open and reset is skipped if it throws. */
  onFinish?: () => Promise<void> | void
  children: (stepId: string) => ReactNode
}) {
  const wiz = useWizard(steps)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      if (onFinish) {
        await onFinish()
      } else {
        onSubmit?.()
      }
      wiz.reset()
      onOpenChange(false)
    } catch {
      // caller is expected to toast the error; keep the wizard open so the user can retry
    } finally {
      setSubmitting(false)
    }
  }

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
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Saving…" : submitLabel}
      submitDisabled={submitting}
      errors={wiz.errors}
    >
      {children(wiz.stepId)}
    </FrWizardShell>
  )
}

export { ReviewList }
