/**
 * Map a raw file URL to a URL the browser can actually preview inline.
 *
 * Office formats (Excel/Word/PowerPoint) are wrapped in the Microsoft Office
 * Online viewer. The viewer needs the original URL to be publicly fetchable;
 * presigned S3 or public CDN links work. Other formats (PDF, images) are
 * returned unchanged because browsers render them natively.
 */
const OFFICE_EXTENSIONS = new Set([
  "xls", "xlsx", "xlsm", "xlsb",
  "doc", "docx",
  "ppt", "pptx",
])

function extractExtension(source: string): string {
  const cleaned = source.split("?")[0].split("#")[0]
  const dot = cleaned.lastIndexOf(".")
  if (dot < 0) return ""
  return cleaned.slice(dot + 1).toLowerCase()
}

export function isOfficeDocument(fileNameOrUrl: string): boolean {
  return OFFICE_EXTENSIONS.has(extractExtension(fileNameOrUrl))
}

export function getFilePreviewUrl(fileUrl: string, fileName?: string): string {
  if (!fileUrl) return fileUrl
  const ext = extractExtension(fileName || fileUrl)
  if (OFFICE_EXTENSIONS.has(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
  }
  return fileUrl
}
