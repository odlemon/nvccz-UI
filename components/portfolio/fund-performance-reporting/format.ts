export function fmtDate(v?: string | null): string {
  if (!v) return "—"
  const d = new Date(v)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}

export function fmtDateOnly(v?: string | null): string {
  if (!v) return "—"
  const d = new Date(v)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString()
}
