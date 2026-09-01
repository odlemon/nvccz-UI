"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { applicationsApi } from "@/lib/api/applications-api"
import {
  REQUIRED_DOC_TYPES,
  clearDraft,
  emptyDraft,
  FUNDING_STEPS,
  loadDraft,
  newUseOfFundsRow,
  saveDraft,
  type FundingApplicationDraft,
  type UploadedDoc,
} from "@/lib/funding-application/draft"
import "./funding-application.css"

const DOC_LABELS: Record<string, string> = {
  BUSINESS_PLAN: "Business plan",
  PROOF_OF_CONCEPT: "Proof of concept",
  MARKET_RESEARCH: "Market research",
  PROJECTED_CASH_FLOWS: "Projected cash flows",
  FINANCIAL_MODEL: "Financial model",
  CAP_TABLE: "Cap table",
  HISTORICAL_FINANCIALS: "Historical financials",
}

function pctComplete(draft: FundingApplicationDraft) {
  return Math.round(((draft.stepIndex + 1) / FUNDING_STEPS.length) * 100)
}

function stepStatus(draft: FundingApplicationDraft, index: number) {
  if (index < draft.stepIndex) return "Complete"
  if (index === draft.stepIndex) return "In progress"
  return "Not started"
}

function docFor(draft: FundingApplicationDraft, type: string) {
  return draft.documents.find((d) => d.documentType === type)
}

export function FundingApplicationApp() {
  const [draft, setDraft] = useState<FundingApplicationDraft>(() => emptyDraft())
  const [hydrated, setHydrated] = useState(false)
  const [autosaveLabel, setAutosaveLabel] = useState("Not saved yet")
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextAutosave = useRef(true)
  const draftRef = useRef(draft)
  draftRef.current = draft

  useEffect(() => {
    const existing = loadDraft()
    if (existing) {
      setDraft(existing)
      setAutosaveLabel(
        `Restored draft · ${new Date(existing.updatedAt).toLocaleString()}`,
      )
      toast.message("Draft restored", {
        description: "Your previous progress was loaded from this browser.",
      })
    }
    setHydrated(true)
  }, [])

  const persist = (next: FundingApplicationDraft, manual = false) => {
    saveDraft(next)
    setAutosaveLabel(
      manual
        ? `Saved · ${new Date().toLocaleTimeString()}`
        : `Autosaved · ${new Date().toLocaleTimeString()}`,
    )
  }

  useEffect(() => {
    if (!hydrated) return
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      persist(draftRef.current, false)
    }, 700)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [draft, hydrated])

  const patch = (partial: Partial<FundingApplicationDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }))
    setError(null)
  }

  const requiredUploaded = useMemo(
    () => REQUIRED_DOC_TYPES.filter((t) => Boolean(docFor(draft, t))).length,
    [draft],
  )

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!draft.applicantName.trim()) return "Applicant name is required"
      if (!draft.applicantEmail.trim()) return "Applicant email is required"
      if (!draft.applicantPhone.trim()) return "Applicant phone is required"
      if (!draft.applicantAddress.trim()) return "Applicant address is required"
      if (!draft.businessName.trim()) return "Business name is required"
      if (!draft.businessDescription.trim()) return "Business description is required"
      if (!draft.industry.trim()) return "Industry is required"
      if (!draft.businessStage.trim()) return "Business stage is required"
      if (!draft.foundingDate) return "Founding date is required"
    }
    if (index === 4) {
      if (!draft.requestedAmount || Number(draft.requestedAmount) <= 0) {
        return "Requested investment amount is required"
      }
      if (!draft.fundingRound.trim()) return "Funding round is required"
    }
    if (index === 6) {
      if (!draft.declarationAccurate || !draft.declarationConsent) {
        return "Please accept both declarations before submitting"
      }
      const missing = REQUIRED_DOC_TYPES.filter((t) => !docFor(draft, t))
      if (missing.length) {
        return `Upload required documents: ${missing.map((t) => DOC_LABELS[t] || t).join(", ")}`
      }
    }
    return null
  }

  const goNext = () => {
    const err = validateStep(draft.stepIndex)
    if (err) {
      setError(err)
      toast.error(err)
      return
    }
    if (draft.stepIndex >= FUNDING_STEPS.length - 1) {
      void handleSubmit()
      return
    }
    patch({ stepIndex: draft.stepIndex + 1 })
  }

  const goPrev = () => {
    if (draft.stepIndex <= 0) return
    patch({ stepIndex: draft.stepIndex - 1 })
  }

  const handleSaveDraft = () => {
    setSaving(true)
    persist(draft, true)
    toast.success("Draft saved in this browser")
    setSaving(false)
  }

  const handleClearDraft = () => {
    clearDraft()
    skipNextAutosave.current = true
    setDraft(emptyDraft())
    setAutosaveLabel("Draft cleared")
    toast.message("Draft cleared")
  }

  const upsertDocument = (doc: UploadedDoc) => {
    setDraft((prev) => {
      const rest = prev.documents.filter((d) => d.documentType !== doc.documentType)
      return { ...prev, documents: [...rest, doc] }
    })
  }

  const handleUpload = async (documentType: string, file: File | null) => {
    if (!file) return
    setUploadingType(documentType)
    setError(null)
    try {
      const res = await applicationsApi.uploadDocuments([file], [documentType])
      const uploaded = res.data?.documents?.[0]
      if (!uploaded?.fileUrl) throw new Error(res.message || "Upload failed")
      upsertDocument({
        documentType: uploaded.documentType || documentType,
        fileName: uploaded.fileName || file.name,
        fileUrl: uploaded.fileUrl,
        fileSize: uploaded.fileSize || file.size,
      })
      toast.success(`${DOC_LABELS[documentType] || documentType} uploaded`)
    } catch (e: any) {
      const msg = e?.message || "File upload failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setUploadingType(null)
    }
  }

  const handleSubmit = async () => {
    const err = validateStep(6)
    if (err) {
      setError(err)
      toast.error(err)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const documents = draft.documents.map((d) => ({
        documentType: d.documentType,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileSize: d.fileSize,
        isRequired: REQUIRED_DOC_TYPES.includes(d.documentType as (typeof REQUIRED_DOC_TYPES)[number]),
      }))
      const res = await applicationsApi.createWithDocumentUrls({
        applicantName: draft.applicantName.trim(),
        applicantEmail: draft.applicantEmail.trim(),
        applicantPhone: draft.applicantPhone.trim(),
        applicantAddress: draft.applicantAddress.trim(),
        businessName: draft.businessName.trim(),
        businessDescription: draft.businessDescription.trim(),
        industry: draft.industry.trim(),
        businessStage: draft.businessStage.trim() || draft.fundingRound.trim(),
        foundingDate: draft.foundingDate,
        requestedAmount: Number(draft.requestedAmount),
        applicationFormData: {
          ownershipPercent: draft.ownershipPercent,
          boardComposition: draft.boardComposition,
          keyShareholders: draft.keyShareholders,
          governanceNotes: draft.governanceNotes,
          marketSize: draft.marketSize,
          competitors: draft.competitors,
          goToMarket: draft.goToMarket,
          productOverview: draft.productOverview,
          revenueModel: draft.revenueModel,
          historicalRevenue: draft.historicalRevenue,
          projectedRevenue: draft.projectedRevenue,
          burnRate: draft.burnRate,
          runwayMonths: draft.runwayMonths,
          fundingRound: draft.fundingRound,
          proposedOwnership: draft.proposedOwnership,
          preMoneyValuation: draft.preMoneyValuation,
          targetCloseDate: draft.targetCloseDate,
          useOfFunds: draft.useOfFunds.map(({ category, description, allocation }) => ({
            category,
            description,
            allocation,
          })),
          fundingRationale: draft.fundingRationale,
          milestones: draft.milestones,
          existingInvestors: draft.existingInvestors,
          impactStatement: draft.impactStatement,
          esgPractices: draft.esgPractices,
          jobsCreated: draft.jobsCreated,
          declarations: {
            accurate: draft.declarationAccurate,
            consent: draft.declarationConsent,
          },
        },
        documents,
      })
      clearDraft()
      skipNextAutosave.current = true
      setDraft(emptyDraft())
      setAutosaveLabel("Submitted")
      setSubmittedId(res.data?.id || "submitted")
      toast.success("Application submitted")
    } catch (e: any) {
      const msg = e?.message || "Failed to submit application"
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const updateUseOfFunds = (id: string, field: "category" | "description" | "allocation", value: string) => {
    setDraft((prev) => ({
      ...prev,
      useOfFunds: prev.useOfFunds.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }))
  }

  const removeUseOfFunds = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      useOfFunds: prev.useOfFunds.filter((row) => row.id !== id),
    }))
  }

  const addUseOfFunds = () => {
    setDraft((prev) => ({
      ...prev,
      useOfFunds: [...prev.useOfFunds, newUseOfFundsRow()],
    }))
  }

  if (!hydrated) {
    return (
      <div className="funding-application-root">
        <div className="fa-shell">
          <p className="fa-muted">Loading application…</p>
        </div>
      </div>
    )
  }

  if (submittedId) {
    return (
      <div className="funding-application-root">
        <header className="fa-topbar">
          <a className="fa-brand" href="/funding-application">
            <img src="/new_logo.png" alt="Matanho" height={32} width={120} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            Funding Application
          </a>
        </header>
        <div className="fa-shell" style={{ maxWidth: 640 }}>
          <div className="fa-card">
            <div className="fa-card-body" style={{ padding: 28, textAlign: "center" }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Application submitted</h1>
              <p className="fa-muted">We received your application successfully.</p>
              {submittedId !== "submitted" && (
                <p style={{ marginTop: 12, fontSize: 13 }}>
                  Reference: <strong>{submittedId}</strong>
                </p>
              )}
              <div className="fa-actions" style={{ justifyContent: "center", marginTop: 18 }}>
                <button
                  type="button"
                  className="fa-button primary"
                  onClick={() => {
                    setSubmittedId(null)
                    skipNextAutosave.current = true
                    setDraft(emptyDraft())
                    setAutosaveLabel("Not saved yet")
                  }}
                >
                  Start another application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const step = FUNDING_STEPS[draft.stepIndex]
  const progress = pctComplete(draft)

  return (
    <div className="funding-application-root">
      <header className="fa-topbar">
        <a className="fa-brand" href="/funding-application">
          <img src="/new_logo.png" alt="Matanho" height={32} width={120} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          Funding Application
        </a>
        <div className="fa-topbar-meta">
          <span className={`fa-pill ${autosaveLabel.startsWith("Autosaved") || autosaveLabel.startsWith("Saved") || autosaveLabel.startsWith("Restored") ? "success" : "info"}`}>
            {autosaveLabel}
          </span>
          <span className="fa-pill info">External Portal</span>
        </div>
      </header>

      <div className="fa-shell">
        <div className="fa-page-header">
          <div>
            <h1>Funding Application</h1>
            <p>Secure applicant-facing portfolio company application. Progress is autosaved in this browser.</p>
          </div>
          <div className="fa-actions">
            <button type="button" className="fa-button ghost" onClick={handleClearDraft}>
              Clear draft
            </button>
            <button type="button" className="fa-button" onClick={handleSaveDraft} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </button>
          </div>
        </div>

        <div className="fa-layout">
          <aside className="fa-card">
            <div className="fa-card-body" style={{ paddingTop: 15 }}>
              <div>
                <span className="fa-muted">Application progress</span>
                <div className="fa-metric">{progress}%</div>
                <div className="fa-progress">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="fa-timeline">
                {FUNDING_STEPS.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`fa-timeline-item ${index === draft.stepIndex ? "active" : ""}`}
                    style={{
                      background: "transparent",
                      borderTop: 0,
                      borderRight: 0,
                      borderBottom: 0,
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      padding: "0 0 0 12px",
                    }}
                    onClick={() => patch({ stepIndex: index })}
                  >
                    <strong>{label}</strong>
                    <small>{stepStatus(draft, index)}</small>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="fa-card">
            <div className="fa-card-head">
              <div>
                <h2 className="fa-card-title">{step}</h2>
                <div className="fa-card-subtitle">Step {draft.stepIndex + 1} of {FUNDING_STEPS.length}</div>
              </div>
              <span className="fa-pill success">{autosaveLabel}</span>
            </div>
            <div className="fa-card-body">
              {draft.stepIndex === 0 && (
                <div className="fa-form-grid">
                  <div className="fa-field"><label className="required">Applicant full name</label><input value={draft.applicantName} onChange={(e) => patch({ applicantName: e.target.value })} placeholder="Primary contact" /></div>
                  <div className="fa-field"><label className="required">Applicant email</label><input type="email" value={draft.applicantEmail} onChange={(e) => patch({ applicantEmail: e.target.value })} placeholder="you@company.com" /></div>
                  <div className="fa-field"><label className="required">Applicant phone</label><input value={draft.applicantPhone} onChange={(e) => patch({ applicantPhone: e.target.value })} placeholder="+263 …" /></div>
                  <div className="fa-field"><label className="required">Applicant address</label><input value={draft.applicantAddress} onChange={(e) => patch({ applicantAddress: e.target.value })} placeholder="City, country" /></div>
                  <div className="fa-field"><label className="required">Business name</label><input value={draft.businessName} onChange={(e) => patch({ businessName: e.target.value })} /></div>
                  <div className="fa-field"><label className="required">Industry</label><input value={draft.industry} onChange={(e) => patch({ industry: e.target.value })} placeholder="e.g. FinTech" /></div>
                  <div className="fa-field"><label className="required">Business stage</label>
                    <select value={draft.businessStage} onChange={(e) => patch({ businessStage: e.target.value })}>
                      <option value="">Select stage</option>
                      <option>Seed</option>
                      <option>Series A</option>
                      <option>Series B</option>
                      <option>Growth</option>
                      <option>Buyout</option>
                    </select>
                  </div>
                  <div className="fa-field"><label className="required">Founding date</label><input type="date" value={draft.foundingDate} onChange={(e) => patch({ foundingDate: e.target.value })} /></div>
                  <div className="fa-field full"><label className="required">Business description</label><textarea value={draft.businessDescription} onChange={(e) => patch({ businessDescription: e.target.value })} placeholder="What does the company do?" /></div>
                </div>
              )}

              {draft.stepIndex === 1 && (
                <div className="fa-form-grid">
                  <div className="fa-field"><label>Founder ownership (%)</label><input value={draft.ownershipPercent} onChange={(e) => patch({ ownershipPercent: e.target.value })} /></div>
                  <div className="fa-field"><label>Board composition</label><input value={draft.boardComposition} onChange={(e) => patch({ boardComposition: e.target.value })} /></div>
                  <div className="fa-field full"><label>Key shareholders</label><textarea value={draft.keyShareholders} onChange={(e) => patch({ keyShareholders: e.target.value })} /></div>
                  <div className="fa-field full"><label>Governance notes</label><textarea value={draft.governanceNotes} onChange={(e) => patch({ governanceNotes: e.target.value })} /></div>
                </div>
              )}

              {draft.stepIndex === 2 && (
                <div className="fa-form-grid">
                  <div className="fa-field full"><label>Product overview</label><textarea value={draft.productOverview} onChange={(e) => patch({ productOverview: e.target.value })} /></div>
                  <div className="fa-field"><label>Market size</label><input value={draft.marketSize} onChange={(e) => patch({ marketSize: e.target.value })} /></div>
                  <div className="fa-field"><label>Go-to-market</label><input value={draft.goToMarket} onChange={(e) => patch({ goToMarket: e.target.value })} /></div>
                  <div className="fa-field full"><label>Competitors</label><textarea value={draft.competitors} onChange={(e) => patch({ competitors: e.target.value })} /></div>
                </div>
              )}

              {draft.stepIndex === 3 && (
                <div className="fa-form-grid">
                  <div className="fa-field"><label>Revenue model</label><input value={draft.revenueModel} onChange={(e) => patch({ revenueModel: e.target.value })} /></div>
                  <div className="fa-field"><label>Runway (months)</label><input value={draft.runwayMonths} onChange={(e) => patch({ runwayMonths: e.target.value })} /></div>
                  <div className="fa-field"><label>Historical revenue</label><input value={draft.historicalRevenue} onChange={(e) => patch({ historicalRevenue: e.target.value })} /></div>
                  <div className="fa-field"><label>Projected revenue</label><input value={draft.projectedRevenue} onChange={(e) => patch({ projectedRevenue: e.target.value })} /></div>
                  <div className="fa-field full"><label>Monthly burn rate</label><input value={draft.burnRate} onChange={(e) => patch({ burnRate: e.target.value })} /></div>
                </div>
              )}

              {draft.stepIndex === 4 && (
                <div className="fa-form-grid">
                  <div className="fa-field"><label className="required">Funding round</label>
                    <select value={draft.fundingRound} onChange={(e) => patch({ fundingRound: e.target.value })}>
                      <option value="">Select round</option>
                      <option>Seed</option>
                      <option>Series A</option>
                      <option>Series B</option>
                      <option>Growth Equity</option>
                    </select>
                  </div>
                  <div className="fa-field"><label className="required">Requested investment (USD)</label><input type="number" min={0} value={draft.requestedAmount} onChange={(e) => patch({ requestedAmount: e.target.value })} /></div>
                  <div className="fa-field"><label>Proposed ownership (%)</label><input value={draft.proposedOwnership} onChange={(e) => patch({ proposedOwnership: e.target.value })} /></div>
                  <div className="fa-field"><label>Pre-money valuation (USD)</label><input type="number" min={0} value={draft.preMoneyValuation} onChange={(e) => patch({ preMoneyValuation: e.target.value })} /></div>
                  <div className="fa-field"><label>Target close date</label><input type="date" value={draft.targetCloseDate} onChange={(e) => patch({ targetCloseDate: e.target.value })} /></div>
                  <div className="fa-field full">
                    <label>Use of funds</label>
                    <div className="fa-table-wrap">
                      <table className="fa-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Allocation (%)</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {draft.useOfFunds.length === 0 && (
                            <tr>
                              <td colSpan={4} className="fa-muted">No categories yet. Add one below.</td>
                            </tr>
                          )}
                          {draft.useOfFunds.map((row) => (
                            <tr key={row.id}>
                              <td><input value={row.category} onChange={(e) => updateUseOfFunds(row.id, "category", e.target.value)} placeholder="Category" /></td>
                              <td><input value={row.description} onChange={(e) => updateUseOfFunds(row.id, "description", e.target.value)} placeholder="Description" /></td>
                              <td><input type="number" value={row.allocation} onChange={(e) => updateUseOfFunds(row.id, "allocation", e.target.value)} placeholder="%" /></td>
                              <td>
                                <button type="button" className="fa-button ghost" onClick={() => removeUseOfFunds(row.id)}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className="fa-button" onClick={addUseOfFunds}>
                        + Add category
                      </button>
                    </div>
                  </div>
                  <div className="fa-field full"><label>Funding rationale</label><textarea value={draft.fundingRationale} onChange={(e) => patch({ fundingRationale: e.target.value })} /></div>
                  <div className="fa-field"><label>24-month milestones</label><textarea value={draft.milestones} onChange={(e) => patch({ milestones: e.target.value })} /></div>
                  <div className="fa-field"><label>Existing investors</label><textarea value={draft.existingInvestors} onChange={(e) => patch({ existingInvestors: e.target.value })} /></div>
                  <UploadField
                    label="Financial model"
                    documentType="FINANCIAL_MODEL"
                    doc={docFor(draft, "FINANCIAL_MODEL")}
                    uploading={uploadingType === "FINANCIAL_MODEL"}
                    onUpload={handleUpload}
                  />
                  <UploadField
                    label="Cap table"
                    documentType="CAP_TABLE"
                    doc={docFor(draft, "CAP_TABLE")}
                    uploading={uploadingType === "CAP_TABLE"}
                    onUpload={handleUpload}
                  />
                </div>
              )}

              {draft.stepIndex === 5 && (
                <div className="fa-form-grid">
                  <div className="fa-field full"><label>Impact statement</label><textarea value={draft.impactStatement} onChange={(e) => patch({ impactStatement: e.target.value })} /></div>
                  <div className="fa-field full"><label>ESG practices</label><textarea value={draft.esgPractices} onChange={(e) => patch({ esgPractices: e.target.value })} /></div>
                  <div className="fa-field"><label>Jobs created / planned</label><input value={draft.jobsCreated} onChange={(e) => patch({ jobsCreated: e.target.value })} /></div>
                </div>
              )}

              {draft.stepIndex === 6 && (
                <div className="fa-form-grid">
                  <div className="fa-field full">
                    <label>Required documents</label>
                    <div className="fa-upload">
                      {REQUIRED_DOC_TYPES.map((type) => (
                        <UploadField
                          key={type}
                          label={DOC_LABELS[type]}
                          documentType={type}
                          required
                          doc={docFor(draft, type)}
                          uploading={uploadingType === type}
                          onUpload={handleUpload}
                        />
                      ))}
                    </div>
                  </div>
                  <label className="fa-check-row">
                    <input
                      type="checkbox"
                      checked={draft.declarationAccurate}
                      onChange={(e) => patch({ declarationAccurate: e.target.checked })}
                    />
                    <span>I confirm that the information provided is accurate and complete.</span>
                  </label>
                  <label className="fa-check-row">
                    <input
                      type="checkbox"
                      checked={draft.declarationConsent}
                      onChange={(e) => patch({ declarationConsent: e.target.checked })}
                    />
                    <span>I consent to Matanho / Arcus processing this application and related documents.</span>
                  </label>
                </div>
              )}

              {error && <div className="fa-error">{error}</div>}

              <div className="fa-foot">
                <button type="button" className="fa-button" onClick={goPrev} disabled={draft.stepIndex === 0 || submitting}>
                  Previous
                </button>
                <button type="button" className="fa-button" onClick={handleSaveDraft} disabled={saving || submitting}>
                  Save draft
                </button>
                <button
                  type="button"
                  className="fa-button primary"
                  onClick={goNext}
                  disabled={submitting || Boolean(uploadingType)}
                >
                  {draft.stepIndex >= FUNDING_STEPS.length - 1
                    ? submitting
                      ? "Submitting…"
                      : "Submit application"
                    : "Continue"}
                </button>
              </div>
            </div>
          </section>

          <aside className="fa-side-stack">
            <div className="fa-card">
              <div className="fa-card-head"><div><h3 className="fa-card-title">Application checklist</h3></div></div>
              <div className="fa-card-body">
                <div className="fa-reason-list">
                  {FUNDING_STEPS.map((label, index) => (
                    <div key={label} className={`fa-reason-item ${index > draft.stepIndex ? "warning" : ""}`}>
                      <span className="dot" />
                      <div><strong>{label}</strong></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="fa-card">
              <div className="fa-card-head"><div><h3 className="fa-card-title">Validation</h3></div></div>
              <div className="fa-card-body">
                <div className="fa-reason-item">
                  <span className="dot" />
                  <div>
                    <strong>{error ? "Fix the highlighted issue" : "Ready to continue"}</strong>
                    <small style={{ display: "block", color: "var(--muted)", marginTop: 2 }}>
                      {error || "Required fields on this step are checked when you continue."}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="fa-card">
              <div className="fa-card-head"><div><h3 className="fa-card-title">Required documents</h3></div></div>
              <div className="fa-card-body">
                <div className="fa-info-row">
                  <span>{requiredUploaded} of {REQUIRED_DOC_TYPES.length} uploaded</span>
                  <strong>{Math.round((requiredUploaded / REQUIRED_DOC_TYPES.length) * 100)}%</strong>
                </div>
                <div className="fa-progress" style={{ marginTop: 8 }}>
                  <span style={{ width: `${(requiredUploaded / REQUIRED_DOC_TYPES.length) * 100}%` }} />
                </div>
                <p className="fa-muted" style={{ marginTop: 10 }}>
                  Files upload immediately to secure media storage. Draft metadata (including file URLs) stays in this browser until you submit.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function UploadField({
  label,
  documentType,
  doc,
  uploading,
  required,
  onUpload,
}: {
  label: string
  documentType: string
  doc?: UploadedDoc
  uploading: boolean
  required?: boolean
  onUpload: (documentType: string, file: File | null) => void
}) {
  const inputId = `upload-${documentType}`
  return (
    <div className="fa-field">
      <label className={required ? "required" : undefined}>{label}</label>
      <div className="fa-upload-row">
        <div>
          <strong>{doc ? doc.fileName : "No file selected"}</strong>
          <small>{doc ? "Stored on server media" : "PDF, DOCX, XLSX or image"}</small>
        </div>
        <div>
          <input
            id={inputId}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            disabled={uploading}
            onChange={(e) => onUpload(documentType, e.target.files?.[0] || null)}
          />
          <label htmlFor={inputId} className="fa-button" style={{ cursor: uploading ? "wait" : "pointer" }}>
            {uploading ? "Uploading…" : doc ? "Replace" : "Upload"}
          </label>
        </div>
      </div>
    </div>
  )
}
