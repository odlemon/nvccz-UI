/** CUID-style ids the API sometimes embeds in validation copy. */
const EMBEDDED_DB_ID = /\bc[a-z0-9]{20,}\b/gi

export function looksLikeDbId(value?: string | null): boolean {
  if (!value) return false
  return /^c[a-z0-9]{20,}$/i.test(value.trim())
}

export function humanizeDeptIdsInText(
  message: string,
  deptById?: Map<string, string> | null,
  fallback = "this department",
): string {
  if (!message) return message
  return message.replace(EMBEDDED_DB_ID, (id) => {
    const name = deptById?.get(id)
    if (name && !looksLikeDbId(name)) return name
    return fallback
  })
}
