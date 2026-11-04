type PayslipExportInput = {
  period: string
  employeeName: string
  employeeNumber: string
  department: string
  paymentDate: string
  currency: string
  gross: number
  deductions: number
  net: number
}

function safeFilenamePart(value: string) {
  return String(value || "").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "Employee"
}

async function imageData(url: string): Promise<{ data: string; format: "PNG" | "JPEG"; width: number; height: number }> {
  const response = await fetch(url, { cache: "force-cache" })
  if (!response.ok) throw new Error("The NVCCZ letterhead could not be loaded.")
  const blob = await response.blob()
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error("The NVCCZ letterhead image is invalid."))
    img.src = data
  })
  return { data, format: data.startsWith("data:image/png") ? "PNG" : "JPEG", ...size }
}

/** Create a one-page PDF with the same NVCCZ letterhead and summary shown in My Pay preview. */
export async function downloadBrandedPayslipPdf(input: PayslipExportInput) {
  const [{ jsPDF }, head] = await Promise.all([import("jspdf"), imageData("/nvccz-letterhead-header-2026.png")])
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 42
  const contentW = pageW - margin * 2
  const headerH = Math.min(128, contentW * head.height / head.width)
  doc.setProperties({ title: `Payslip ${input.period}`, subject: "Confidential employee payslip", creator: "NVCCZ Payroll", author: "National Venture Capital Company of Zimbabwe" })
  doc.addImage(head.data, head.format, margin, 28, contentW, headerH)

  let y = 28 + headerH + 22
  doc.setDrawColor(214, 222, 235)
  doc.line(margin, y, pageW - margin, y)
  y += 27
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(21, 39, 67)
  doc.text("PAYSLIP", margin, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(11)
  doc.text(input.period, pageW - margin, y, { align: "right" })
  y += 28

  const boxGap = 10
  const boxW = (contentW - boxGap) / 2
  const boxH = 54
  const drawBox = (x: number, top: number, label: string, value: string) => {
    doc.setFillColor(246, 248, 252)
    doc.setDrawColor(219, 227, 239)
    doc.roundedRect(x, top, boxW, boxH, 6, 6, "FD")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(91, 107, 130)
    doc.text(label, x + 11, top + 17)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(21, 39, 67)
    doc.text(value || "—", x + 11, top + 37, { maxWidth: boxW - 22 })
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(21, 39, 67)
  doc.text("Employee details", margin, y)
  y += 12
  drawBox(margin, y, "Employee name", input.employeeName)
  drawBox(margin + boxW + boxGap, y, "Employee number", input.employeeNumber)
  y += boxH + boxGap
  drawBox(margin, y, "Department", input.department)
  drawBox(margin + boxW + boxGap, y, "Payment date", input.paymentDate)
  y += boxH + 20

  const amount = (value: number) => `${input.currency} ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  drawBox(margin, y, "Gross earnings", amount(input.gross))
  drawBox(margin + boxW + boxGap, y, "Total deductions", amount(input.deductions))
  y += boxH + 10
  doc.setFillColor(16, 47, 93)
  doc.setDrawColor(16, 47, 93)
  doc.roundedRect(margin, y, contentW, 44, 6, 6, "FD")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text("Net pay", margin + 12, y + 27)
  doc.setFontSize(14)
  doc.text(amount(input.net), pageW - margin - 12, y + 27, { align: "right" })

  const footerY = pageH - 38
  doc.setDrawColor(36, 48, 112)
  doc.setLineWidth(1.2)
  doc.line(margin, footerY - 10, pageW - margin, footerY - 10)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(91, 107, 130)
  doc.text("National Venture Capital Company of Zimbabwe · Payroll · Confidential", margin, footerY + 4)

  const filename = `Payslip-${safeFilenamePart(input.employeeName)}-${safeFilenamePart(input.period)}.pdf`
  doc.save(filename)
  return filename
}
