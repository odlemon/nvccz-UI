export function auditActionClass(action: string): string {
  const a = String(action || "").toUpperCase()
  if (a.includes("CREATE")) return "bg-[#dcfce7] text-[#15803d]"
  if (a.includes("UPDATE") || a.includes("PATCH")) return "bg-[#dbeafe] text-[#1d4ed8]"
  if (a.includes("DELETE") || a.includes("REMOVE")) return "bg-[#fee2e2] text-[#dc2626]"
  if (a.includes("STAGE") || a.includes("TRANSITION")) return "bg-[#ede9fe] text-[#6d28d9]"
  if (a.includes("UPLOAD") || a.includes("DOCUMENT")) return "bg-[#ffedd5] text-[#c2410c]"
  if (a.includes("APPROV") || a.includes("DECIDE")) return "bg-[#d1fae5] text-[#047857]"
  if (a.includes("EXPORT")) return "bg-[#f1f5f9] text-[#475569]"
  if (a.includes("SEND")) return "bg-[#e0e7ff] text-[#4338ca]"
  if (a.includes("ACCESS") || a.includes("GRANT")) return "bg-[#fef3c7] text-[#b45309]"
  return "bg-[#f1f5f9] text-[#64748b]"
}
