// html2canvas itself cannot parse oklch/lab/lch -- it throws "Attempting to parse an unsupported
// color function" on any element whose computed color resolves to one, which Tailwind v4's
// Preflight (border-color: oklch(...) on every element by default) makes unavoidable in this app.
// html2canvas-pro is the actively maintained fork that added support for these color functions,
// with the same API; convertOklchToRgb below still runs as a belt-and-braces fallback.
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

export interface PDFGenerationOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  quality?: number
}

export const generatePDF = async (
  element: HTMLElement,
  options: PDFGenerationOptions = {}
): Promise<Blob> => {
  const {
    filename = 'payslip',
    format = 'a4',
    orientation = 'portrait',
    quality = 0.98
  } = options

  try {
    // Create a temporary container to avoid oklch color issues
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '-9999px'
    tempContainer.style.width = element.offsetWidth + 'px'
    tempContainer.style.height = element.offsetHeight + 'px'
    tempContainer.style.backgroundColor = '#ffffff'
    
    // Clone the element and convert oklch colors to standard colors. The clone must be attached
    // to the document before sanitizing: getComputedStyle on a detached node (not yet appended
    // anywhere) resolves to initial/empty values, not the classes' actual cascaded oklch colors,
    // so calling this before attaching silently sanitized nothing.
    const clonedElement = element.cloneNode(true) as HTMLElement
    tempContainer.appendChild(clonedElement)
    document.body.appendChild(tempContainer)
    convertOklchToRgb(clonedElement)

    // Generate canvas from the temporary container
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: tempContainer.offsetWidth,
      height: tempContainer.offsetHeight,
      ignoreElements: (element) => {
        // Skip elements that might cause issues
        return element.classList.contains('no-print') || 
               element.style.display === 'none'
      }
    })

    // Clean up temporary container
    document.body.removeChild(tempContainer)

    // Create PDF
    const imgData = canvas.toDataURL('image/png', quality)
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // Generate blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}

// Helper function to convert oklch colors to RGB
const convertOklchToRgb = (element: HTMLElement) => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  )

  // TreeWalker.nextNode() only ever advances to a *descendant* of the walker's root -- the root
  // itself (the element callers actually pass in, e.g. the whole preview panel) is never visited
  // by the while loop below. Sanitize it explicitly first, then walk everything under it.
  const sanitizeNode = (htmlElement: HTMLElement) => {
    const computedStyle = window.getComputedStyle(htmlElement)

    // html2canvas cannot parse oklch() (Tailwind v4's default color space). Reading the computed
    // value (not the element's own inline style, which is empty for anything colored via a CSS
    // class -- i.e. almost everything) and writing it back as an inline override is what actually
    // neutralizes a class-applied oklch color before html2canvas walks the clone.
    if (computedStyle.backgroundColor.includes('oklch')) {
      htmlElement.style.backgroundColor = '#ffffff' // Default to white
    }
    if (computedStyle.color.includes('oklch')) {
      htmlElement.style.color = '#000000' // Default to black
    }
    if (computedStyle.borderColor.includes('oklch')) {
      htmlElement.style.borderColor = '#e5e7eb' // Default to gray
    }
  }

  sanitizeNode(element)

  let node = walker.nextNode()
  while (node) {
    const htmlElement = node as HTMLElement
    sanitizeNode(htmlElement)

    node = walker.nextNode()
  }
}

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateAndDownloadPDF = async (
  element: HTMLElement,
  filename: string,
  options?: PDFGenerationOptions
) => {
  try {
    const blob = await generatePDF(element, { ...options, filename })
    downloadPDF(blob, filename)
    return blob
  } catch (error) {
    console.error('Error generating and downloading PDF:', error)
    throw error
  }
}
