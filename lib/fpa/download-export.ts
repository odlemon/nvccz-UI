import { getAuthToken } from "@/lib/utils/cookies"

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://31.220.82.129:3009/api"

/** Pull export job id from `/api/v1/fpa/exports/{id}/download` style paths. */
export function extractFpaExportId(urlOrPath: string): string | null {
  const match = urlOrPath.match(/\/exports\/([^/?#]+)/i)
  return match?.[1] || null
}

function toAbsoluteApiUrl(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath
  if (urlOrPath.startsWith("/api/")) {
    return `${API_BASE}${urlOrPath.replace(/^\/api/, "")}`
  }
  if (urlOrPath.startsWith("/v1/")) return `${API_BASE}${urlOrPath}`
  if (urlOrPath.startsWith("/")) return `${API_BASE}${urlOrPath}`
  const id = extractFpaExportId(urlOrPath)
  if (id) return `${API_BASE}/v1/fpa/exports/${id}/download`
  return urlOrPath
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = objectUrl
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}

function filenameFromHeaders(res: Response, fallback: string): string {
  const cd = res.headers.get("content-disposition") || ""
  const match = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i)
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1].replace(/"/g, "").trim())
    } catch {
      return match[1].replace(/"/g, "").trim()
    }
  }
  return fallback
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

type LooseCell = {
  lineItemId?: string
  periodDate?: string
  value?: string | number
  departmentId?: string | null
  departmentName?: string | null
  currencyCode?: string
  cellStatus?: string
  lineItem?: { code?: string; name?: string; id?: string }
}

/**
 * Pivot cells into a spreadsheet-friendly CSV (line × period) so CFOs can open
 * the board pack in Excel when the API still returns a JSON cell pack.
 */
export function boardPackPayloadToCsv(payload: unknown): string | null {
  const root = payload as {
    cells?: LooseCell[]
    lineItems?: Array<{ id?: string; code?: string; name?: string }>
    periods?: Array<{ periodDate?: string; key?: string; label?: string }>
  }
  const cells = Array.isArray(root?.cells) ? root.cells : null
  if (!cells || cells.length === 0) return null

  const lineMeta = new Map<string, { code: string; name: string }>()
  for (const li of root.lineItems || []) {
    if (!li.id) continue
    lineMeta.set(li.id, {
      code: li.code || "",
      name: li.name || li.code || li.id,
    })
  }
  for (const c of cells) {
    const id = c.lineItemId || c.lineItem?.id
    if (!id || lineMeta.has(id)) continue
    lineMeta.set(id, {
      code: c.lineItem?.code || "",
      name: c.lineItem?.name || c.lineItem?.code || id,
    })
  }

  const periodSet = new Set<string>()
  for (const p of root.periods || []) {
    const key = p.periodDate || p.key
    if (key) periodSet.add(key)
  }
  for (const c of cells) {
    if (c.periodDate) periodSet.add(c.periodDate)
  }
  const periods = Array.from(periodSet).sort()

  const valueMap = new Map<string, string | number>()
  for (const c of cells) {
    const lid = c.lineItemId || c.lineItem?.id
    if (!lid || !c.periodDate) continue
    valueMap.set(`${lid}::${c.periodDate}`, c.value ?? "")
  }

  const header = ["Line code", "Line item", ...periods.map((p) => {
    const d = new Date(p)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    }
    return p
  })]

  const lines = Array.from(lineMeta.entries()).sort((a, b) =>
    a[1].code.localeCompare(b[1].code) || a[1].name.localeCompare(b[1].name),
  )

  const rows = [header.map(csvEscape).join(",")]
  for (const [id, meta] of lines) {
    const row = [
      csvEscape(meta.code),
      csvEscape(meta.name),
      ...periods.map((p) => csvEscape(valueMap.get(`${id}::${p}`) ?? "")),
    ]
    rows.push(row.join(","))
  }

  // Excel-friendly BOM
  return `\uFEFF${rows.join("\r\n")}`
}

/**
 * Download an FP&A export through the authenticated API (never navigate to
 * relative `/api/v1/fpa/exports/...` on the Next host — those 404).
 *
 * When the API returns a JSON cell pack instead of xlsx/pdf, we convert to CSV
 * so the file opens in Excel for CFO review.
 */
export async function downloadFpaExportFile(opts: {
  exportId?: string | null
  url?: string | null
  filename?: string
}): Promise<{ filename: string; format: "binary" | "csv" | "json" }> {
  const filename = opts.filename || "fpa-export.xlsx"
  let fetchUrl: string | null = null

  if (opts.exportId) {
    fetchUrl = `${API_BASE}/v1/fpa/exports/${opts.exportId}/download`
  } else if (opts.url) {
    const id = extractFpaExportId(opts.url)
    fetchUrl = id
      ? `${API_BASE}/v1/fpa/exports/${id}/download`
      : toAbsoluteApiUrl(opts.url)
  }

  if (!fetchUrl) throw new Error("No export file to download")

  const token = getAuthToken()
  const res = await fetch(fetchUrl, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    let message = `Download failed (${res.status})`
    try {
      const err = await res.json()
      if (err?.message) message = String(err.message)
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase()
  if (contentType.includes("application/json")) {
    const json = await res.json()
    const nested =
      json?.data?.downloadUrl ||
      json?.data?.url ||
      json?.downloadUrl ||
      json?.url
    if (typeof nested === "string" && nested) {
      return downloadFpaExportFile({ url: nested, filename })
    }

    // Backend currently returns the export payload as JSON (cells pack), not a binary file.
    const payload =
      json?.data && typeof json.data === "object" && !Array.isArray(json.data)
        ? json.data
        : json
    if (
      payload &&
      typeof payload === "object" &&
      (Array.isArray((payload as { cells?: unknown }).cells) ||
        (payload as { cellCount?: unknown }).cellCount != null ||
        (payload as { exportType?: unknown }).exportType)
    ) {
      const csv = boardPackPayloadToCsv(payload)
      if (csv) {
        const csvName = filename
          .replace(/\.xlsx$/i, ".csv")
          .replace(/\.xls$/i, ".csv")
          .replace(/\.json$/i, ".csv")
        const finalName = csvName.endsWith(".csv") ? csvName : `${csvName}.csv`
        triggerBrowserDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), finalName)
        return { filename: finalName, format: "csv" }
      }

      if (/\.csv$/i.test(filename)) {
        throw new Error("Export returned JSON without a cell grid — cannot build CSV")
      }

      const jsonName = filename.replace(/\.xlsx$/i, ".json").replace(/\.xls$/i, ".json")
      const finalName = jsonName.endsWith(".json") ? jsonName : `${jsonName}.json`
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
      triggerBrowserDownload(blob, finalName)
      return { filename: finalName, format: "json" }
    }

    throw new Error(json?.message || "Download not ready yet")
  }

  const blob = await res.blob()
  const finalName = filenameFromHeaders(res, filename)
  triggerBrowserDownload(blob, finalName)
  return { filename: finalName, format: "binary" }
}
