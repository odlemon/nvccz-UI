import jsPDF from 'jspdf'
import { addLetterhead, type LetterheadAddress } from '@/lib/utils/pdf-letterhead'

export interface SimplePDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  letterheadAddress?: LetterheadAddress | null
}

export const generateSimplePDF = async (
  payslipData: any,
  options: SimplePDFOptions = {}
): Promise<Blob> => {
  const {
    filename = 'payslip',
    format = 'a4',
    orientation = 'portrait'
  } = options

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    // Set up fonts and colors
    const primaryColor = '#2563eb'
    const secondaryColor = '#6b7280'
    const textColor = '#000000'
    const borderColor = '#e5e7eb'

    // Helper function to format currency
    const formatCurrency = (amount: string | number) => {
      const num = typeof amount === 'string' ? parseFloat(amount) : amount
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: payslipData.currency?.code || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num)
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // Company letterhead banner
    let yPosition = await addLetterhead(
      pdf,
      `Payslip for the period of ${formatDate(payslipData.payrollRun.startDate)}`,
      undefined,
      options.letterheadAddress
    )
    yPosition += 6

    // Helper function to draw a data row
    const drawDataRow = (label: string, value: string, x: number, y: number, width: number) => {
      pdf.setFont('helvetica', 'normal')
      pdf.text(label, x, y)
      pdf.setFont('helvetica', 'bold')
      pdf.text(value, x + width, y, { align: 'right' })
    }

    // Employee and Payroll Info Grid
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Employee & Payroll Information', 20, yPosition)
    yPosition += 10

    // Draw info in two columns
    pdf.setFontSize(9)
    const leftColX = 20
    const rightColX = 110
    const colWidth = 70

    drawDataRow('Employee ID:', payslipData.employee.employeeNumber, leftColX, yPosition, colWidth)
    drawDataRow('Pay Period:', payslipData.payrollRun.payPeriod, rightColX, yPosition, colWidth)
    yPosition += 6

    drawDataRow('Name:', `${payslipData.employee.user.firstName} ${payslipData.employee.user.lastName}`, leftColX, yPosition, colWidth)
    drawDataRow('Start Date:', formatDate(payslipData.payrollRun.startDate), rightColX, yPosition, colWidth)
    yPosition += 6

    drawDataRow('Email:', payslipData.employee.user.email, leftColX, yPosition, colWidth)
    drawDataRow('End Date:', formatDate(payslipData.payrollRun.endDate), rightColX, yPosition, colWidth)
    yPosition += 6

    drawDataRow('Bank:', payslipData.employee.bankName, leftColX, yPosition, colWidth)
    drawDataRow('Status:', payslipData.payrollRun.status, rightColX, yPosition, colWidth)
    yPosition += 6

    drawDataRow('Account:', payslipData.employee.accountNumber, leftColX, yPosition, colWidth)
    drawDataRow('Currency:', payslipData.currency?.code || 'USD', rightColX, yPosition, colWidth)
    yPosition += 15

    // Earnings and Deductions Table
    const tableWidth = 170
    const halfWidth = tableWidth / 2

    // Headers
    pdf.setFillColor(243, 244, 246)
    pdf.rect(20, yPosition, tableWidth, 10, 'F')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Earnings', 25, yPosition + 7)
    pdf.text('Deductions', 25 + halfWidth, yPosition + 7)
    yPosition += 14

    // Data rows
    const earnings = [
      { label: 'Basic Salary', amount: parseFloat(payslipData.employee.basicSalary) },
      { label: 'Allowances', amount: parseFloat(payslipData.totalAllowances || 0) },
    ]

    const deductions = [
      { label: 'Statutory Deductions', amount: parseFloat(payslipData.totalDeductions || 0) },
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const maxRows = Math.max(earnings.length, deductions.length)
    for (let i = 0; i < maxRows; i++) {
      const rowY = yPosition + (i * 7)
      
      if (earnings[i]) {
        pdf.text(earnings[i].label, 25, rowY)
        pdf.text(formatCurrency(earnings[i].amount), 25 + halfWidth - 10, rowY, { align: 'right' })
      }
      
      if (deductions[i]) {
        pdf.text(deductions[i].label, 25 + halfWidth, rowY)
        pdf.text(formatCurrency(deductions[i].amount), 25 + tableWidth - 10, rowY, { align: 'right' })
      }
    }

    yPosition += (maxRows * 7) + 5

    // Sub-totals
    pdf.setDrawColor(209, 213, 219)
    pdf.line(20, yPosition, 190, yPosition)
    yPosition += 8

    pdf.setFont('helvetica', 'bold')
    pdf.text('Total Earnings', 25, yPosition)
    pdf.text(formatCurrency(payslipData.grossPay), 25 + halfWidth - 10, yPosition, { align: 'right' })
    
    pdf.text('Total Deductions', 25 + halfWidth, yPosition)
    pdf.text(formatCurrency(payslipData.totalDeductions), 25 + tableWidth - 10, yPosition, { align: 'right' })
    
    yPosition += 15

    // Net Pay Block - Standard Professional Style
    pdf.setFillColor(37, 99, 235) // Primary Blue
    pdf.rect(20, yPosition, 170, 20, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Net Pay (Rounded)', 25, yPosition + 12)
    
    pdf.setFontSize(20)
    pdf.text(formatCurrency(payslipData.netPay), 185, yPosition + 12, { align: 'right' })
    
    yPosition += 35

    // Signatures
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Employer\'s Signature', 20, yPosition)
    pdf.text('Employee\'s Signature', 110, yPosition)
    pdf.line(20, yPosition + 2, 100, yPosition + 2)
    pdf.line(110, yPosition + 2, 190, yPosition + 2)

    yPosition += 20

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128)
    pdf.text('This payslip is computer generated and does not require a signature.', 105, yPosition, { align: 'center' })
    pdf.text(`Generated on ${formatDate(new Date().toISOString())}`, 105, yPosition + 5, { align: 'center' })

    // Generate blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    console.error('Error generating simple PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}

export const downloadSimplePDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateAndDownloadSimplePDF = async (
  payslipData: any,
  filename: string,
  options?: SimplePDFOptions
) => {
  try {
    const blob = await generateSimplePDF(payslipData, { ...options, filename })
    downloadSimplePDF(blob, filename)
    return blob
  } catch (error) {
    console.error('Error generating and downloading simple PDF:', error)
    throw error
  }
}
