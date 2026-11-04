/**
 * PDF / Excel / CSV export for the Accounting live pages.
 *
 * The live layer (scripts/accounting-live, inlined into the Accounting V52 runtime) renders each page as plain markup and
 * cannot import these libraries, so it hands a plain "spec" — title, summary figures, columns and already-formatted rows
 * — to `window.__AC52_EXPORT__` (published by components/accounting-v52-mock/accounting-v52-app.tsx), and this module
 * writes the file. The rows are the values on screen, so an export can never disagree with the page it was taken from.
 *
 * PDF exports use the client-supplied NVCCZ letterhead; Excel includes its contact details.
 */

export type Ac52ExportKind = "pdf" | "excel" | "csv"

export type Ac52ExportAlign = "left" | "right" | "center"

export type Ac52ExportSection = {
  /** Heading above this table (only used for the extra tables below the main one). */
  title?: string
  columns: string[]
  rows: (string | number)[][]
  /** Per-column alignment; unset columns stay left aligned. */
  align?: Ac52ExportAlign[]
  /** Columns containing amounts, displayed with two decimal places. */
  moneyColumns?: number[]
}

export type Ac52ExportSpec = Omit<Ac52ExportSection, "title"> & {
  /** The page's name, printed as the document's title. */
  title: string
  subtitle?: string
  /** The page's summary figures (its KPI cards), shown above the table. */
  meta?: [string, string][]
  /** Further tables from the same page (locks, history): their own sheet in Excel, their own table in the PDF. */
  extra?: Ac52ExportSection[]
  /** File name without extension or date — this module appends the run date. */
  filename: string
  landscape?: boolean
  /** A line under the table, e.g. the filter the export was taken with. */
  note?: string
  /** Footer label for a branded export produced by another module. */
  footerLabel?: string
  /** Identifies Payroll exports; the shared NVCCZ letterhead is used for the file. */
  letterhead?: "nvccz-payroll"
  /** Left-hand footer line on every PDF page; Portfolio passes its own. */
  footerLabel?: string
  /** Also write the `extra` tables into the CSV, each under its own heading. */
  includeExtraInCsv?: boolean
}

type ExportBrand = { name: string; logo: string; accent: [number, number, number] }

export function ac52ExportBrand(): ExportBrand {
  return { name: "NVCCZ", logo: "/nvccz-letterhead-header-2026.png", accent: [35, 48, 112] }
}

const runDate = () => new Date().toISOString().slice(0, 10)

/** `<filename>-<yyyy-mm-dd>.<ext>`, with the name reduced to what a file system accepts. */
function exportFileName(spec: Ac52ExportSpec, ext: string) {
  const base = String(spec.filename || "accounting-export")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase()
  return `${base || "accounting-export"}-${runDate()}.${ext}`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const csvCell = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvText(section: Ac52ExportSection) {
  return [section.columns.map(csvCell).join(","), ...section.rows.map(row => row.map((v, i) => csvCell(section.moneyColumns?.includes(i) && typeof v === 'number' ? v.toFixed(2) : v)).join(","))].join("\r\n")
}

/** The context line and summary figures of a full-page export, as CSV rows (opt-in via `includeExtraInCsv`). */
function csvSummary(spec: Ac52ExportSpec) {
  if (!spec.includeExtraInCsv) return [] as string[][]
  const rows: string[][] = []
  if (spec.note) rows.push([spec.note], [])
  if (spec.meta && spec.meta.length) rows.push(...spec.meta.map(([label, value]) => [String(label), String(value ?? "")]), [])
  return rows
}

/** Further tables from the same page, each under its own heading (opt-in via `includeExtraInCsv`). */
function csvExtraSections(spec: Ac52ExportSpec) {
  if (!spec.includeExtraInCsv) return ""
  return (spec.extra || [])
    .filter((section) => section.rows.length > 0)
    .map((section) => "\r\n" + [section.title || "Additional detail"].map(csvCell).join(",") + "\r\n" + csvText(section))
    .join("")
}

type LogoImage = { dataUrl: string; width: number; height: number; format: "PNG" | "JPEG" }

/** The logo as a data URL plus its intrinsic size, so the PDF keeps its aspect ratio. A missing logo is not fatal. */
async function loadLogo(src: string): Promise<LogoImage | null> {
  try {
    const res = await fetch(src, { cache: "force-cache" })
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    if (!dataUrl.startsWith("data:image/")) return null
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error("The logo could not be read."))
      img.src = dataUrl
    })
    return { dataUrl, width: size.width, height: size.height, format: dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG" }
  } catch {
    return null
  }
}

async function writePdf(spec: Ac52ExportSpec) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const brand = ac52ExportBrand()
  const doc = new jsPDF({
    orientation: spec.landscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  })
  doc.setProperties({ title: spec.title, subject: spec.subtitle || "Accounting", creator: brand.name, author: brand.name })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentW = pageW - margin * 2

  const letterhead = await loadLogo("/nvccz-letterhead-header-2026.png")
  if (!letterhead) throw new Error("The NVCCZ letterhead could not be loaded.")
  const headerHeight = pageW * letterhead.height / letterhead.width
  const topMargin = headerHeight + 18
  const bottomMargin = 88
  doc.addImage(letterhead.dataUrl, letterhead.format, 0, 0, pageW, headerHeight)
  let y = topMargin

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(12, 27, 46)
  doc.text(spec.title, margin, y)
  y += 15

  if (spec.subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(101, 120, 143)
    const lines = doc.splitTextToSize(spec.subtitle, contentW) as string[]
    doc.text(lines, margin, y)
    y += lines.length * 11 + 2
  }

  if (spec.meta && spec.meta.length) {
    y += 8
    const cols = Math.min(4, spec.meta.length)
    const cellW = contentW / cols
    const rowH = 32
    spec.meta.forEach(([label, value], i) => {
      const x = margin + (i % cols) * cellW
      const top = y + Math.floor(i / cols) * rowH
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(120, 134, 150)
      doc.text(String(label).toUpperCase(), x, top + 9)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10.5)
      doc.setTextColor(12, 27, 46)
      doc.text(String(value ?? "-"), x, top + 23)
    })
    y += Math.ceil(spec.meta.length / cols) * rowH + 4
  }

  const columnStyles = (align?: Ac52ExportAlign[]) =>
    Object.fromEntries(
      (align || []).map((a, i) => [i, { halign: a }]).filter(([, v]) => Boolean((v as { halign?: string }).halign)),
    ) as Record<number, { halign: Ac52ExportAlign }>

  const drawTable = (section: Ac52ExportSection, startY: number) => {
    if (!section.rows.length) return startY
    autoTable(doc, {
      startY,
      head: [section.columns],
      body: section.rows.map((r) => r.map((v, i) => section.moneyColumns?.includes(i) && typeof v === 'number' ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v ?? ""))),
      theme: "grid",
      margin: { left: margin, right: margin, top: margin, bottom: bottomMargin },
      styles: {
        font: "helvetica",
        fontSize: 7.4,
        cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
        lineColor: [226, 234, 243],
        lineWidth: 0.5,
        textColor: [30, 45, 66],
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: { fillColor: brand.accent, textColor: 255, fontStyle: "bold", fontSize: 7.4, lineWidth: 0 },
      alternateRowStyles: { fillColor: [247, 250, 254] },
      columnStyles: columnStyles(section.align),
    })
    const last = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
    return last && typeof last.finalY === "number" ? last.finalY : startY
  }

  let lastY = drawTable(spec, y)
  if (!spec.rows.length) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(101, 120, 143)
    doc.text("Nothing was on this page to export.", margin, y + 12)
    lastY = y + 20
  }

  // Keep a section with its heading and a few rows: an orphaned heading at the foot
  // of a page reads as a section whose table went missing.
  const sectionRoom = 96

  for (const section of spec.extra || []) {
    const headingHeight = section.title ? 9 : 0
    if (section.rows.length && lastY + 22 + headingHeight + sectionRoom > pageH - bottomMargin) {
      doc.addPage()
      lastY = margin - 22
    }
    let top = lastY + 22
    if (section.title) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9.5)
      doc.setTextColor(12, 27, 46)
      doc.text(section.title, margin, top)
      top += 9
    }
    lastY = drawTable(section, top)
  }

  if (spec.note && lastY + 26 < pageH - bottomMargin) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.4)
    doc.setTextColor(101, 120, 143)
    doc.text(doc.splitTextToSize(spec.note, contentW) as string[], margin, lastY + 18)
  }

  // footer on every page: who produced it, when, and which page of how many
  const pages = doc.getNumberOfPages()
  const generated = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(226, 234, 243)
    doc.setLineWidth(0.7)
    const footerY = pageH - bottomMargin + 14
    doc.line(margin, footerY - 12, pageW - margin, footerY - 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(120, 134, 150)
    doc.text(spec.footerLabel || "NVCCZ - Accounting", margin, footerY)
    doc.text(`Generated ${generated}`, pageW / 2, footerY, { align: "center" })
    doc.text(`Page ${p} of ${pages}`, pageW - margin, footerY, { align: "right" })
    doc.setFillColor(35, 48, 112)
    doc.rect(0, pageH - 56, pageW, 56, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text("Directors", pageW / 2, pageH - 42, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text("Mr H. Ruzvidzo (Chairman), Mr J. Bgoni, Mr T. Kambasha, Ms E. Muzondo, Mr A. Ngadya,", pageW / 2, pageH - 29, { align: "center" })
    doc.text("Ms M. Sibanda, Mr E. Sunduza (Executive Director)", pageW / 2, pageH - 17, { align: "center" })
  }

  doc.save(exportFileName(spec, "pdf"))
}

async function writeExcel(spec: Ac52ExportSpec) {
  const XLSX = await import("xlsx")
  const wb = XLSX.utils.book_new()
  const sheetName = (title: string | undefined, fallback: string) =>
    String(title || fallback)
      .replace(/[\\/?*[\]:]/g, " ")
      .trim()
      .slice(0, 31) || fallback

  /** Column widths sized to the content (capped), so a register opens readable rather than in a single narrow column. */
  const widths = (section: Ac52ExportSection) =>
    section.columns.map((c, i) => ({
      wch: Math.min(
        52,
        Math.max(12, String(c).length + 2, ...section.rows.slice(0, 200).map((r) => String(r[i] ?? "").length + 2)),
      ),
    }))

  /** A sheet with the table, preceded by its title and summary figures when it has them. */
  const sheetFor = (section: Ac52ExportSection, head: (string | number)[][] = []) => {
    const ws = XLSX.utils.aoa_to_sheet([...head, section.columns, ...section.rows])
    ws["!cols"] = widths(section)
    section.rows.forEach((row, r) => section.moneyColumns?.forEach(c => {
      if (typeof row[c] !== 'number') return
      const cell = ws[XLSX.utils.encode_cell({ r: head.length + 1 + r, c })]
      if (cell) cell.z = '#,##0.00;[Red](#,##0.00)'
    }))
    return ws
  }

  const importTemplate = /import-template/i.test(spec.filename)
  // Keep Excel branding as ordinary worksheet cells. Editing the OOXML package
  // to attach a PNG drawing can produce files Excel flags for repair.
  const brandRows: (string | number)[][] = importTemplate ? [] : [
    ["NATIONAL VENTURE CAPITAL COMPANY OF ZIMBABWE (NVCCZ)"],
    ["No. 2 Hendrikz Way, Mt. Pleasant, Harare, Zimbabwe"],
    ["+263 867 701 0913 | info@nvccz.com | nvccz.com"],
    [],
  ]
  const head: (string | number)[][] = [...brandRows, [spec.title]]
  if (spec.subtitle) head.push([spec.subtitle])
  head.push([])
  for (const [label, value] of spec.meta || []) head.push([label, value])
  if (spec.meta && spec.meta.length) head.push([])
  if (spec.note) head.push([spec.note], [])

  XLSX.utils.book_append_sheet(wb, sheetFor(spec, head), sheetName(spec.title, "Data"))
  for (const section of spec.extra || []) {
    XLSX.utils.book_append_sheet(
      wb,
      sheetFor(section, [
        ...(importTemplate ? [] : [...brandRows, ...(section.title ? [[section.title], []] : [])]),
      ]),
      sheetName(section.title, "Sheet"),
    )
  }

  const bytes = new Uint8Array(XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer)
  download(
    new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    exportFileName(spec, "xlsx"),
  )
}

/**
 * Write one export file for the Accounting live layer and hand it to the browser. Returns the saved file's name so the
 * page can say what it saved.
 */
export async function downloadAc52Export(kind: Ac52ExportKind, spec: Ac52ExportSpec): Promise<string> {
  if (!spec || !Array.isArray(spec.columns)) throw new Error("There is nothing to export from this page yet.")
  const name = exportFileName(spec, kind === "excel" ? "xlsx" : kind)
  if (kind === "csv") {
    // the BOM keeps Excel from mangling accented supplier and account names
    const header = [['NATIONAL VENTURE CAPITAL COMPANY OF ZIMBABWE (NVCCZ)'], ['No. 2 Hendrikz Way, Mt. Pleasant, Harare, Zimbabwe'], ['+263 867 701 0913 | info@nvccz.com | nvccz.com'], [spec.title], ...(spec.subtitle ? [[spec.subtitle]] : []), [], ...csvSummary(spec)]
    const brand = header.map(row => row.map(csvCell).join(',')).join('\r\n')
    download(new Blob([`\uFEFF${brand}\r\n${csvText(spec)}`, csvExtraSections(spec)], { type: "text/csv;charset=utf-8" }), name)
    return name
  }
  if (kind === "excel") {
    await writeExcel(spec)
    return name
  }
  if (kind !== "pdf") throw new Error(`Unknown export format: ${String(kind)}`)
  await writePdf(spec)
  return name
}
