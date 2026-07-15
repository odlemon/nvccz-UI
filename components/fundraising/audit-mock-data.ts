export type AuditAction =
  | "Create"
  | "Update"
  | "Delete"
  | "Stage Change"
  | "Document Upload"
  | "Approval"
  | "Export"
  | "Send"
  | "Access"

export type AuditObjectType =
  | "Opportunity"
  | "Investor"
  | "Contact"
  | "Document"
  | "Agreement"
  | "Commitment"
  | "Campaign"
  | "Data Room"
  | "Meeting"
  | "Settings"

export type AuditLog = {
  id: string
  timestamp: string
  user: string
  action: AuditAction
  objectType: AuditObjectType
  objectName: string
  summary: string
  ip: string
  details: string
}

export const AUDIT_USERS = [
  "Tawanda Chirwa",
  "Chipo Dube",
  "Farai Moyo",
  "Rudo Ncube",
  "System",
] as const

export const AUDIT_ACTIONS: AuditAction[] = [
  "Create",
  "Update",
  "Delete",
  "Stage Change",
  "Document Upload",
  "Approval",
  "Export",
  "Send",
  "Access",
]

export const AUDIT_LOGS: AuditLog[] = [
  {
    id: "al-001",
    timestamp: "15 Jul 2026, 16:42",
    user: "Tawanda Chirwa",
    action: "Stage Change",
    objectType: "Opportunity",
    objectName: "Nyaradzo Pension Fund — ZGF II",
    summary: "DD / Data Room → IC Review",
    ip: "41.223.18.104",
    details:
      "Stage advanced after DD Q&A session. Probability updated from 75% to 82%. Next step set to IC memo preparation. Owner unchanged.",
  },
  {
    id: "al-002",
    timestamp: "15 Jul 2026, 15:18",
    user: "Chipo Dube",
    action: "Document Upload",
    objectType: "Document",
    objectName: "ZGF II — IC Memo Draft v3",
    summary: "— → v3 (Draft)",
    ip: "41.223.18.112",
    details:
      "Uploaded confidential IC memo draft. Category: Investment Committee. Campaign: ZGF II. Version superseded v2. Access restricted to IC members.",
  },
  {
    id: "al-003",
    timestamp: "15 Jul 2026, 14:05",
    user: "Farai Moyo",
    action: "Update",
    objectType: "Commitment",
    objectName: "NMBZ Holdings Limited — US$5.0M",
    summary: "Funding status: In Progress → Funded",
    ip: "196.46.22.88",
    details:
      "Wire confirmation received. Funding date recorded as 15 Jul 2026. KYC and subscription docs marked complete. Closing checklist auto-updated.",
  },
  {
    id: "al-004",
    timestamp: "15 Jul 2026, 11:30",
    user: "Rudo Ncube",
    action: "Send",
    objectType: "Agreement",
    objectName: "Baobab Family Office — Subscription Agreement",
    summary: "Draft → Sent for signature",
    ip: "41.223.18.97",
    details:
      "Signature request sent to 2 signatories. Expiry set to 29 Jul 2026. Version locked at v2. Email delivery via secure link.",
  },
  {
    id: "al-005",
    timestamp: "14 Jul 2026, 17:55",
    user: "Tawanda Chirwa",
    action: "Create",
    objectType: "Meeting",
    objectName: "Management presentation — Old Mutual",
    summary: "— → Scheduled (22 Jul 2026)",
    ip: "41.223.18.104",
    details:
      "Meeting created with 4 attendees. Linked to opportunity Old Mutual Insurance — ZGF II. Agenda: fund strategy, track record, fee terms.",
  },
  {
    id: "al-006",
    timestamp: "14 Jul 2026, 16:12",
    user: "Chipo Dube",
    action: "Access",
    objectType: "Data Room",
    objectName: "ZGF II — Investor Data Room",
    summary: "Grant access → Baobab Family Office",
    ip: "41.223.18.112",
    details:
      "External viewer access granted to 2 contacts at Baobab Family Office. NDA on file. Folder scope: Fund overview, Financials, Legal.",
  },
  {
    id: "al-007",
    timestamp: "14 Jul 2026, 10:08",
    user: "Farai Moyo",
    action: "Approval",
    objectType: "Campaign",
    objectName: "Institutional Mandates FY25",
    summary: "Pipeline target: US$80M → US$95M",
    ip: "196.46.22.88",
    details:
      "Target raise amendment approved by Fundraising Lead. Effective immediately. Dashboard KPIs recalculated. Notification sent to deal team.",
  },
  {
    id: "al-008",
    timestamp: "13 Jul 2026, 15:44",
    user: "Rudo Ncube",
    action: "Update",
    objectType: "Contact",
    objectName: "Grace Mutasa — PIC",
    summary: "Influence: Medium → High",
    ip: "41.223.18.97",
    details:
      "Contact profile updated after board intro call. Consent status confirmed. Next action set to follow-up on term sheet feedback.",
  },
  {
    id: "al-009",
    timestamp: "13 Jul 2026, 09:22",
    user: "Tawanda Chirwa",
    action: "Export",
    objectType: "Opportunity",
    objectName: "Pipeline export — ZGF II",
    summary: "— → CSV (42 rows)",
    ip: "41.223.18.104",
    details:
      "Exported full pipeline for ZGF II campaign. Filters: all stages, PE fund type. File retained in export log for 90 days.",
  },
  {
    id: "al-010",
    timestamp: "12 Jul 2026, 18:01",
    user: "System",
    action: "Update",
    objectType: "Investor",
    objectName: "Stanbic Nominees — CRM sync",
    summary: "Last interaction: 3 Jun → 12 Jul 2026",
    ip: "10.0.4.12",
    details:
      "Automated CRM sync refreshed investor record. No manual edits. Source: email integration webhook.",
  },
  {
    id: "al-011",
    timestamp: "12 Jul 2026, 14:37",
    user: "Chipo Dube",
    action: "Delete",
    objectType: "Document",
    objectName: "Outdated fee schedule — draft",
    summary: "v1 (Draft) → Removed",
    ip: "41.223.18.112",
    details:
      "Obsolete draft removed per document retention policy. Superseded by v4 fee schedule. Deletion logged; file not recoverable after 30 days.",
  },
  {
    id: "al-012",
    timestamp: "11 Jul 2026, 11:15",
    user: "Farai Moyo",
    action: "Update",
    objectType: "Settings",
    objectName: "PE pipeline — IC Review gate",
    summary: "Requirements: 2 → 3 items",
    ip: "196.46.22.88",
    details:
      "Added requirement: Signed NDA on file. Existing gates unchanged. Applies to transitions from DD / Data Room to IC Review.",
  },
]

export function auditActionClass(action: AuditAction): string {
  switch (action) {
    case "Create":
      return "bg-[#dcfce7] text-[#15803d]"
    case "Update":
      return "bg-[#dbeafe] text-[#1d4ed8]"
    case "Delete":
      return "bg-[#fee2e2] text-[#dc2626]"
    case "Stage Change":
      return "bg-[#ede9fe] text-[#6d28d9]"
    case "Document Upload":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "Approval":
      return "bg-[#d1fae5] text-[#047857]"
    case "Export":
      return "bg-[#f1f5f9] text-[#475569]"
    case "Send":
      return "bg-[#e0e7ff] text-[#4338ca]"
    case "Access":
      return "bg-[#fef3c7] text-[#b45309]"
    default:
      return "bg-[#f1f5f9] text-[#64748b]"
  }
}
