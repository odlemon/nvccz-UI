import jsPDF from 'jspdf'

const COMPANY_NAME = 'National venture capital company of Zimbabwe'
const COMPANY_ADDRESS = [
  '4th floor blue bridge',
  'Eastgate mall',
  'Harare',
  'Zimbabwe',
]
const HEADER_BG_COLOR: [number, number, number] = [15, 23, 42] // slate-900
const HEADER_HEIGHT = 40
const LOGO_PATH = '/logo.png'

export interface LetterheadAddress {
  label?: string
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
  logoUrl?: string | null
}

/**
 * Adds a company letterhead to a jsPDF document.
 * Pass `address` to use a dynamic address from the company profile API.
 * Returns the Y position where content should start after the header.
 */
export async function addLetterhead(
  doc: jsPDF,
  title: string,
  subtitle?: string,
  address?: LetterheadAddress | null
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Use address label if available, otherwise fallback to hardcoded company name
  const companyLabel = address?.label || COMPANY_NAME

  // Build address lines from dynamic address or fallback to hardcoded
  const addressLines: string[] = address
    ? [
        address.line1,
        ...(address.line2 ? [address.line2] : []),
        [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
        address.country,
      ]
    : COMPANY_ADDRESS

  // Header background
  doc.setFillColor(...HEADER_BG_COLOR)
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F')

  // Try to load logo — prefer address logoUrl, then fallback to local /logo.png
  const logoSrc = address?.logoUrl || LOGO_PATH
  try {
    const logoImg = await loadImage(logoSrc)
    doc.addImage(logoImg, 'PNG', 10, 6, 28, 28)
  } catch {
    // If logo fails to load, just show company name in place of logo
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(companyLabel, 14, 22)
  }

  // Company details block on the right
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 200, 200)
  const addressX = pageWidth - 14
  doc.setFont('helvetica', 'bold')
  doc.text(companyLabel, addressX, 12, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  addressLines.forEach((line, i) => {
    doc.text(line, addressX, 16 + i * 4, { align: 'right' })
  })

  // Optional subtitle under logo block
  if (subtitle) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(220, 220, 220)
    doc.text(subtitle, 42, 24)
  }

  // Divider line
  doc.setDrawColor(59, 130, 246) // blue-500
  doc.setLineWidth(0.8)
  doc.line(0, HEADER_HEIGHT, pageWidth, HEADER_HEIGHT)

  // Report title below header
  let y = HEADER_HEIGHT + 10
  doc.setTextColor(15, 23, 42) // slate-900
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, y)

  // Reset font for caller
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  return y + 4
}

/**
 * Adds subtitle info lines (period, currency etc) below the title.
 * Returns updated Y position.
 */
export function addReportInfo(doc: jsPDF, startY: number, lines: string[]): number {
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  let y = startY
  lines.forEach(line => {
    y += 5
    doc.text(line, 14, y)
  })
  doc.setTextColor(0, 0, 0)
  return y + 6
}

function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context failed')); return }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load logo'))
    img.src = src
  })
}
