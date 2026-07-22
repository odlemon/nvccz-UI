"use client"

import { useState, type ReactNode } from "react"
import {
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  GitBranch,
  Palette,
  Pencil,
  Plus,
  Save,
  Settings2,
  Shield,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"
import { PerformanceMockTopChrome } from "@/components/performance-mock/shell"
import { PmAvatar, PmButton, PmCard, PmPageHeader, PmSelectChip, PmStatusPill, PmToggle } from "@/components/performance-mock/primitives"
import {
  approvalRulesDefaults,
  auditTrailDefaults,
  brandingDefaults,
  financialYearDefaults,
  generalSettingsDefaults,
  notificationPreferencesDefaults,
  permissionsDefaults,
  ratingScalesDefaults,
  workflowSettingsDefaults,
  type ApprovalRule,
  type AuditEntry,
  type PermissionRow,
  type RatingScale,
} from "@/lib/performance-mock/fixtures/settings"
import { PM_PHOTOS } from "@/lib/performance-mock/photos"
import { cn } from "@/lib/utils"

const PURPLE = "#7C3AED"
const inputCls =
  "w-full h-9 px-3 rounded-lg border border-[#E5E7EB] text-xs outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#DDD6FE] bg-white"

function SettingsCard({
  title,
  icon,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  icon?: ReactNode
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <PmCard className={cn("p-4", className)}>
      <div className="flex items-start justify-between mb-3.5 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
            {icon && <span className="text-[#7C3AED] shrink-0">{icon}</span>}
            {title}
          </h3>
          {subtitle && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </PmCard>
  )
}

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-[#6B7280] mb-1">{label}</span>
      {children}
    </label>
  )
}

function ToggleRow({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#111827]">{label}</p>
        <p className="text-[11px] text-[#9CA3AF] leading-snug">{detail}</p>
      </div>
      <PmToggle checked={checked} onChange={onChange} />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <LabeledField label={label}>
      <div className="relative">
        <input className={cn(inputCls, "pr-8")} value={value} onChange={(e) => onChange(e.target.value)} />
        <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none" />
      </div>
    </LabeledField>
  )
}

export function SettingsMockScreen() {
  const [period, setPeriod] = useState("July 2026")
  const [dept, setDept] = useState("All Departments")

  const [general, setGeneral] = useState(generalSettingsDefaults)
  const [workflow, setWorkflow] = useState(workflowSettingsDefaults)
  const [notifPrefs, setNotifPrefs] = useState(notificationPreferencesDefaults)
  const [ratingScales, setRatingScales] = useState<RatingScale[]>(ratingScalesDefaults)
  const [permissions, setPermissions] = useState<PermissionRow[]>(permissionsDefaults)
  const [branding, setBranding] = useState(brandingDefaults)
  const [financialYear, setFinancialYear] = useState(financialYearDefaults)
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>(approvalRulesDefaults)
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>(auditTrailDefaults)

  const logAudit = (action: string, detail?: string) => {
    const entry: AuditEntry = {
      id: `aud-${Date.now()}`,
      name: "Adm. User",
      role: "Super Administrator",
      initials: "AU",
      color: PURPLE,
      photo: PM_PHOTOS.admin,
      action,
      detail,
      at: "Just now",
    }
    setAuditTrail((prev) => [entry, ...prev])
  }

  const togglePermission = (role: string, field: keyof Omit<PermissionRow, "role">) => {
    setPermissions((prev) => prev.map((p) => (p.role === role ? { ...p, [field]: !p[field] } : p)))
  }

  const addRatingScale = () => {
    const scale: RatingScale = { id: `rs-${Date.now()}`, name: "New Scale", min: "1", max: "10", type: "Numeric", status: "Active" }
    setRatingScales((prev) => [...prev, scale])
    logAudit("Updated Rating Scale", "Added New Scale")
    toast.success("Rating scale added")
  }

  const addApprovalRule = () => {
    const rule: ApprovalRule = {
      id: `ar-${Date.now()}`,
      name: "New Rule",
      condition: "Define condition",
      level: "1-Level Approval",
      status: "Active",
    }
    setApprovalRules((prev) => [...prev, rule])
    logAudit("Updated Approval Rules", "Added new approval rule")
    toast.success("Approval rule added")
  }

  const removeApprovalRule = (id: string) => {
    setApprovalRules((prev) => prev.filter((r) => r.id !== id))
    logAudit("Updated Approval Rules", "Removed an approval rule")
    toast.success("Approval rule removed")
  }

  const saveChanges = () => {
    logAudit("Saved Settings", "Updated general, workflow and notification settings")
    toast.success("Settings saved successfully")
  }

  const colorLabels: Record<"primaryColor" | "secondaryColor" | "accentColor", string> = {
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    accentColor: "Brand Accent Color",
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PerformanceMockTopChrome breadcrumbs={["Performance Management", "Configuration", "Settings"]} searchPlaceholder="Search settings…" />
      <div className="p-5 lg:p-6 space-y-5">
        <PmPageHeader
          title="Settings"
          subtitle="Configure system behavior, workflows, permissions and preferences."
          actions={
            <>
              <PmSelectChip
                icon={<Calendar className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={period}
                onClick={() => setPeriod(period === "July 2026" ? "June 2026" : "July 2026")}
              />
              <PmSelectChip
                icon={<Building2 className="h-3.5 w-3.5 text-[#6B7280]" />}
                label={dept}
                onClick={() => setDept(dept === "All Departments" ? "Finance Department" : "All Departments")}
              />
              <PmButton className="!bg-[#7C3AED] hover:!bg-[#6D28D9]" onClick={saveChanges}>
                <Save className="h-3.5 w-3.5" /> Save Changes
              </PmButton>
            </>
          }
        />

        {/* 3 content columns + audit sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Column 1 */}
          <div className="xl:col-span-3 space-y-4">
            <SettingsCard title="General Settings" icon={<Settings2 className="h-4 w-4" />}>
              <div className="space-y-3">
                <LabeledField label="Organization Name">
                  <input
                    className={inputCls}
                    value={general.organizationName}
                    onChange={(e) => setGeneral((g) => ({ ...g, organizationName: e.target.value }))}
                  />
                </LabeledField>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledField label="Default Language">
                    <select
                      className={inputCls}
                      value={general.defaultLanguage}
                      onChange={(e) => setGeneral((g) => ({ ...g, defaultLanguage: e.target.value }))}
                    >
                      {["English (Zimbabwe)", "English (US)", "French"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </LabeledField>
                  <LabeledField label="Default Timezone">
                    <select
                      className={inputCls}
                      value={general.defaultTimezone}
                      onChange={(e) => setGeneral((g) => ({ ...g, defaultTimezone: e.target.value }))}
                    >
                      {["(UTC+02:00) Harare, Pretoria", "(UTC+00:00) London", "(UTC-05:00) New York"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </LabeledField>
                  <LabeledField label="Date Format">
                    <select
                      className={inputCls}
                      value={general.dateFormat}
                      onChange={(e) => setGeneral((g) => ({ ...g, dateFormat: e.target.value }))}
                    >
                      {["DD MM YYYY (13 Jul 2026)", "MM DD YYYY (07 13 2026)", "YYYY-MM-DD (2026-07-13)"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </LabeledField>
                  <LabeledField label="Week Starts On">
                    <select
                      className={inputCls}
                      value={general.weekStartsOn}
                      onChange={(e) => setGeneral((g) => ({ ...g, weekStartsOn: e.target.value }))}
                    >
                      {["Monday", "Sunday"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </LabeledField>
                </div>
                <div className="border-t border-[#F1F5F9] pt-1">
                  <ToggleRow
                    label="Enable Objectives Cascade"
                    detail="Allow goals to cascade across departments"
                    checked={general.enableObjectivesCascade}
                    onChange={(v) => setGeneral((g) => ({ ...g, enableObjectivesCascade: v }))}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard title="Permissions" icon={<Shield className="h-4 w-4" />} subtitle="Role-based access control">
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-[11px] min-w-[280px]">
                  <thead>
                    <tr className="text-[#9CA3AF]">
                      <th className="text-left font-medium pb-2">Role</th>
                      {(["view", "edit", "approve", "admin"] as const).map((c) => (
                        <th key={c} className="text-center font-medium pb-2 capitalize">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((p) => (
                      <tr key={p.role} className="border-t border-[#F1F5F9]">
                        <td className="py-2 pr-2 text-[#374151] font-medium whitespace-nowrap">{p.role}</td>
                        {(["view", "edit", "approve", "admin"] as const).map((c) => (
                          <td key={c} className="py-2 text-center">
                            <input
                              type="checkbox"
                              checked={p[c]}
                              onChange={() => togglePermission(p.role, c)}
                              className="h-3.5 w-3.5 rounded border-[#D1D5DB] accent-[#7C3AED] cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => toast("Role management opens here in the live product.")}
                className="text-xs font-semibold text-[#7C3AED] hover:underline mt-3"
              >
                Manage Roles &amp; Permissions →
              </button>
            </SettingsCard>

            <SettingsCard title="Branding" icon={<Palette className="h-4 w-4" />}>
              <div className="space-y-3.5">
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Company Logo</p>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      <span
                        className="h-8 w-8 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
                      >
                        A
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#111827] truncate">{branding.logoFile}</p>
                      <p className="text-[10px] text-[#9CA3AF]">PNG or SVG · max 2MB</p>
                    </div>
                    <PmButton variant="outline" className="h-8 px-3 text-xs shrink-0" onClick={() => toast("Logo upload dialog would open here")}>
                      <UploadCloud className="h-3.5 w-3.5" /> Upload
                    </PmButton>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key) => (
                    <label key={key} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#6B7280] font-medium">{colorLabels[key]}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding[key]}
                          onChange={(e) => setBranding((b) => ({ ...b, [key]: e.target.value }))}
                          className="h-7 w-7 rounded-md border border-[#E5E7EB] cursor-pointer p-0.5 bg-white"
                        />
                        <input
                          value={branding[key]}
                          onChange={(e) => setBranding((b) => ({ ...b, [key]: e.target.value }))}
                          className="h-8 w-[88px] px-2 rounded-lg border border-[#E5E7EB] text-[11px] font-mono outline-none focus:border-[#7C3AED]"
                        />
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Favicon</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#111827] truncate">{branding.faviconFile}</p>
                      <p className="text-[10px] text-[#9CA3AF]">ICO or PNG · 32×32</p>
                    </div>
                    <PmButton variant="outline" className="h-8 px-3 text-xs shrink-0" onClick={() => toast("Favicon upload dialog would open here")}>
                      <UploadCloud className="h-3.5 w-3.5" /> Upload
                    </PmButton>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </div>

          {/* Column 2 */}
          <div className="xl:col-span-3 space-y-4">
            <SettingsCard title="Workflow Settings" icon={<GitBranch className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <LabeledField label="Performance Cycle">
                  <select
                    className={inputCls}
                    value={workflow.performanceCycle}
                    onChange={(e) => setWorkflow((w) => ({ ...w, performanceCycle: e.target.value }))}
                  >
                    {["Annual Performance Cycle", "Semi-Annual Cycle", "Quarterly Cycle"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </LabeledField>
                <LabeledField label="Default Review Type">
                  <select
                    className={inputCls}
                    value={workflow.defaultReviewType}
                    onChange={(e) => setWorkflow((w) => ({ ...w, defaultReviewType: e.target.value }))}
                  >
                    {["Annual Review", "Mid-Year Review", "Quarterly Review"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </LabeledField>
                <LabeledField label="KPI Approval Workflow">
                  <select
                    className={inputCls}
                    value={workflow.kpiApprovalWorkflow}
                    onChange={(e) => setWorkflow((w) => ({ ...w, kpiApprovalWorkflow: e.target.value }))}
                  >
                    {["1-Level Approval", "2-Level Approval", "3-Level Approval"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </LabeledField>
                <LabeledField label="Review Approval Workflow">
                  <select
                    className={inputCls}
                    value={workflow.reviewApprovalWorkflow}
                    onChange={(e) => setWorkflow((w) => ({ ...w, reviewApprovalWorkflow: e.target.value }))}
                  >
                    {["1-Level Approval", "2-Level Approval", "3-Level Approval"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </LabeledField>
              </div>
              <div className="mt-1 divide-y divide-[#F1F5F9] border-t border-[#F1F5F9]">
                <ToggleRow
                  label="Allow Self Appraisal"
                  detail="Allow employees to submit self-assessments"
                  checked={workflow.allowSelfAppraisal}
                  onChange={(v) => setWorkflow((w) => ({ ...w, allowSelfAppraisal: v }))}
                />
                <ToggleRow
                  label="Lock Reviewed KPIs"
                  detail="Prevent edits after review is submitted"
                  checked={workflow.lockReviewedKpis}
                  onChange={(v) => setWorkflow((w) => ({ ...w, lockReviewedKpis: v }))}
                />
              </div>
            </SettingsCard>

            <SettingsCard title="Notification Preferences" icon={<Bell className="h-4 w-4" />}>
              <div className="divide-y divide-[#F1F5F9]">
                {notifPrefs.map((n) => (
                  <div key={n.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#111827]">{n.label}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{n.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={n.cadence}
                        disabled={!n.enabled}
                        onChange={(e) =>
                          setNotifPrefs((prev) => prev.map((p) => (p.id === n.id ? { ...p, cadence: e.target.value } : p)))
                        }
                        className="h-7 px-2 rounded-md border border-[#E5E7EB] text-[10px] text-[#374151] bg-white outline-none focus:border-[#7C3AED] disabled:opacity-40"
                      >
                        {["Instant", "Daily", "Weekly"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <PmToggle
                        size="sm"
                        checked={n.enabled}
                        onChange={(v) => setNotifPrefs((prev) => prev.map((p) => (p.id === n.id ? { ...p, enabled: v } : p)))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SettingsCard>

            <SettingsCard
              title="Approval Rules"
              icon={<CheckSquare className="h-4 w-4" />}
              action={
                <button type="button" onClick={addApprovalRule} className="text-[#7C3AED] hover:text-[#6D28D9]" aria-label="Add rule">
                  <Plus className="h-4 w-4" />
                </button>
              }
            >
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-[11px] min-w-[320px]">
                  <thead>
                    <tr className="text-[#9CA3AF]">
                      <th className="text-left font-medium pb-2">Rule Name</th>
                      <th className="text-left font-medium pb-2">Condition</th>
                      <th className="text-left font-medium pb-2 whitespace-nowrap">Approver Level</th>
                      <th className="text-left font-medium pb-2">Status</th>
                      <th className="text-right font-medium pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalRules.map((r) => (
                      <tr key={r.id} className="border-t border-[#F1F5F9] align-top">
                        <td className="py-2 pr-2 font-semibold text-[#111827] whitespace-nowrap">{r.name}</td>
                        <td className="py-2 pr-2 text-[#6B7280] max-w-[140px]">{r.condition}</td>
                        <td className="py-2 pr-2 text-[#374151] whitespace-nowrap">{r.level}</td>
                        <td className="py-2 pr-2">
                          <PmStatusPill label={r.status} tone={r.status === "Active" ? "success" : "neutral"} />
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toast("Edit rule dialog would open here")}
                            className="text-[#7C3AED] hover:text-[#6D28D9] mr-1.5 inline-flex"
                            aria-label="Edit rule"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeApprovalRule(r.id)}
                            className="text-[#EF4444] hover:text-[#DC2626] inline-flex"
                            aria-label="Delete rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-2 mt-3">
                <button
                  type="button"
                  onClick={addApprovalRule}
                  className="h-8 px-3 rounded-lg border border-[#DDD6FE] text-xs font-semibold text-[#7C3AED] hover:bg-[#F5F3FF] inline-flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Rule
                </button>
                <button
                  type="button"
                  onClick={() => toast("Approval workflow manager would open here")}
                  className="text-xs font-semibold text-[#7C3AED] hover:underline"
                >
                  Manage Approval Workflows →
                </button>
              </div>
            </SettingsCard>
          </div>

          {/* Column 3 */}
          <div className="xl:col-span-3 space-y-4">
            <SettingsCard
              title="Rating Scales"
              icon={<Star className="h-4 w-4" />}
              action={
                <button type="button" className="text-[#9CA3AF] hover:text-[#7C3AED]" aria-label="Scale settings">
                  <Settings2 className="h-4 w-4" />
                </button>
              }
            >
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#9CA3AF]">
                    <th className="text-left font-medium pb-2">Scale Name</th>
                    <th className="text-center font-medium pb-2">Min</th>
                    <th className="text-center font-medium pb-2">Max</th>
                    <th className="text-left font-medium pb-2">Type</th>
                    <th className="text-left font-medium pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingScales.map((s) => (
                    <tr key={s.id} className="border-t border-[#F1F5F9]">
                      <td className="py-2 text-[#111827] font-medium">{s.name}</td>
                      <td className="py-2 text-center text-[#374151]">{s.min}</td>
                      <td className="py-2 text-center text-[#374151]">{s.max}</td>
                      <td className="py-2 text-[#374151]">{s.type}</td>
                      <td className="py-2">
                        <PmStatusPill label={s.status} tone={s.status === "Active" ? "success" : "neutral"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={addRatingScale}
                className="w-full mt-3 h-8 rounded-lg border border-dashed border-[#DDD6FE] text-xs font-semibold text-[#7C3AED] hover:bg-[#F5F3FF] inline-flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Scale
              </button>
            </SettingsCard>

            <SettingsCard title="Financial Year / Review Calendar" icon={<Calendar className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label="Financial Year Start"
                  value={financialYear.fyStart}
                  onChange={(v) => setFinancialYear((f) => ({ ...f, fyStart: v }))}
                />
                <DateField
                  label="Financial Year End"
                  value={financialYear.fyEnd}
                  onChange={(v) => setFinancialYear((f) => ({ ...f, fyEnd: v }))}
                />
                <DateField
                  label="Review Start Window"
                  value={financialYear.reviewStartWindow}
                  onChange={(v) => setFinancialYear((f) => ({ ...f, reviewStartWindow: v }))}
                />
                <DateField
                  label="Review End Window"
                  value={financialYear.reviewEndWindow}
                  onChange={(v) => setFinancialYear((f) => ({ ...f, reviewEndWindow: v }))}
                />
                <DateField
                  label="Calibration Meeting Start"
                  value={financialYear.calibrationMeetingStart}
                  onChange={(v) => setFinancialYear((f) => ({ ...f, calibrationMeetingStart: v }))}
                />
                <DateField
                  label="Results Publish Start"
                  value={financialYear.resultsPublishStart}
                  onChange={(v) => setFinancialYear((f) => ({ ...f, resultsPublishStart: v }))}
                />
              </div>
              <div className="mt-3.5 rounded-lg bg-[#F5F3FF] border border-[#EDE9FE] px-3 py-2.5 text-[11px] text-[#6D28D9] leading-relaxed">
                <span className="font-semibold">FY 2026 is active.</span> Current financial year: 01 Jan 2026 – 31 Dec 2026.
              </div>
            </SettingsCard>
          </div>

          {/* Audit Trail */}
          <div className="xl:col-span-3">
            <PmCard className="p-4 xl:sticky xl:top-24 max-h-[calc(100vh-7rem)] flex flex-col">
              <div className="flex items-center justify-between mb-3.5 shrink-0">
                <h3 className="text-sm font-semibold text-[#111827]">Audit Trail</h3>
                <button type="button" onClick={() => toast("Full audit log would open here")} className="text-xs font-semibold text-[#7C3AED] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-0 overflow-y-auto flex-1 relative">
                <div className="absolute left-[15px] top-3 bottom-3 w-px bg-[#E5E7EB]" />
                {auditTrail.map((a) => (
                  <div key={a.id} className="relative flex items-start gap-2.5 py-2.5 first:pt-0">
                    <div className="relative z-[1] shrink-0">
                      <PmAvatar initials={a.initials} src={a.photo} color={a.color} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate">{a.name}</p>
                          <p className="text-[10px] text-[#9CA3AF] truncate">{a.role}</p>
                        </div>
                        <p className="text-[10px] text-[#9CA3AF] whitespace-nowrap shrink-0">{a.at}</p>
                      </div>
                      <p className="text-xs text-[#374151] mt-1 font-medium">{a.action}</p>
                      {a.detail && <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{a.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </PmCard>
          </div>
        </div>
      </div>
    </div>
  )
}
