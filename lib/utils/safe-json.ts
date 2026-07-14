/** Recursively clone data so JSON.stringify never throws on BigInt / Error objects. */
export function sanitizeForJson<T>(value: T): T {
  if (value === null || value === undefined) return value
  if (typeof value === "bigint") return String(value) as T
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForJson(item)) as T
  }
  if (typeof value === "object") {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      } as T
    }
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeForJson(nested)
    }
    return out as T
  }
  return value
}

export function safeJsonStringify(value: unknown, space?: number): string {
  return JSON.stringify(sanitizeForJson(value), null, space)
}
