export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export function priorityClass(priority: string | null | undefined) {
  switch (String(priority || "").toUpperCase()) {
    case "HIGH":
    case "URGENT":
      return "bg-[#fee2e2] text-[#b91c1c]"
    case "MED":
    case "MEDIUM":
      return "bg-[#ffedd5] text-[#c2410c]"
    case "LOW":
      return "bg-[#f1f5f9] text-[#64748b]"
    default:
      return "bg-[#f1f5f9] text-[#94a3b8]"
  }
}

export function statusClass(status: string) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#15803d]"
    case "REJECTED":
      return "bg-[#fee2e2] text-[#b91c1c]"
    default:
      return "bg-[#fef3c7] text-[#b45309]"
  }
}

export function typeClass(type: string) {
  const t = String(type || "").toUpperCase()
  if (t.includes("CAMPAIGN")) return "bg-[#dcfce7] text-[#15803d]"
  if (t.includes("COMMITMENT") || t.includes("FEE")) return "bg-[#ede9fe] text-[#6d28d9]"
  if (t.includes("OPPORTUNITY") || t.includes("STAGE")) return "bg-[#e0f2fe] text-[#0369a1]"
  if (t.includes("AGREEMENT") || t.includes("SIDE_LETTER")) return "bg-[#dbeafe] text-[#1d4ed8]"
  return "bg-[#f1f5f9] text-[#64748b]"
}
