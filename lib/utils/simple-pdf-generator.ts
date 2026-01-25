import jsPDF from 'jspdf'

export interface SimplePDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
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

    let yPosition = 20

    // Header
    pdf.setFillColor(37, 99, 235) // Blue background
    pdf.rect(0, 0, 210, 35, 'F')

    pdf.setTextColor(255, 255, 255) // White text
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Kyntaro', 20, 18)

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Kyntaro', 20, 24)
    pdf.text('Chisapi Cres, Harare, Zimbabwe', 20, 28)

    yPosition = 45

    // Title
    pdf.setTextColor(0, 0, 0) // Black text
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Payslip for the period of ${formatDate(payslipData.payrollRun.startDate)}`, 20, yPosition)
    yPosition += 20

    // Employee Information
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Employee Information', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Employee ID: ${payslipData.employee.employeeNumber}`, 20, yPosition)
    pdf.text(`Name: ${payslipData.employee.user.firstName} ${payslipData.employee.user.lastName}`, 20, yPosition + 5)
    pdf.text(`Email: ${payslipData.employee.user.email}`, 20, yPosition + 10)
    pdf.text(`Bank: ${payslipData.employee.bankName}`, 20, yPosition + 15)
    pdf.text(`Account: ${payslipData.employee.accountNumber}`, 20, yPosition + 20)

    // Payroll Information
    pdf.text(`Pay Period: ${payslipData.payrollRun.payPeriod}`, 110, yPosition)
    pdf.text(`Start Date: ${formatDate(payslipData.payrollRun.startDate)}`, 110, yPosition + 5)
    pdf.text(`End Date: ${formatDate(payslipData.payrollRun.endDate)}`, 110, yPosition + 10)
    pdf.text(`Status: ${payslipData.payrollRun.status}`, 110, yPosition + 15)
    pdf.text(`Currency: ${payslipData.currency?.code}`, 110, yPosition + 20)

    yPosition += 40

    // Earnings and Deductions Table
    const tableStartY = yPosition
    const tableWidth = 170
    const colWidth = tableWidth / 2

    // Table headers
    pdf.setFillColor(248, 250, 252) // Light gray background
    pdf.rect(20, tableStartY, colWidth, 10, 'F')
    pdf.rect(20 + colWidth, tableStartY, colWidth, 10, 'F')

    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Earnings', 25, tableStartY + 7)
    pdf.text('Deductions', 25 + colWidth, tableStartY + 7)

    yPosition = tableStartY + 12

    // Earnings rows
    const earnings = [
      { label: 'Basic Salary', amount: parseFloat(payslipData.employee.basicSalary) },
      { label: 'Housing Allowance', amount: 0 },
      { label: 'Transport Allowance', amount: 0 },
      { label: 'Overtime', amount: 0 }
    ]

    const deductions = [
      { label: 'PAYE', amount: parseFloat(payslipData.totalDeductions) * 0.6 },
      { label: 'NSSA', amount: parseFloat(payslipData.totalDeductions) * 0.3 },
      { label: 'AIDS Levy', amount: parseFloat(payslipData.totalDeductions) * 0.1 }
    ]

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    // Draw earnings
    earnings.forEach((earning, index) => {
      const rowY = yPosition + (index * 6)
      pdf.text(earning.label, 25, rowY)
      pdf.text(formatCurrency(earning.amount), 25 + colWidth - 30, rowY)
    })

    // Draw deductions
    deductions.forEach((deduction, index) => {
      const rowY = yPosition + (index * 6)
      pdf.text(deduction.label, 25 + colWidth, rowY)
      pdf.text(formatCurrency(deduction.amount), 25 + colWidth + colWidth - 30, rowY)
    })

    yPosition += Math.max(earnings.length, deductions.length) * 6 + 15

    // Totals
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(229, 231, 235) // Gray background
    pdf.rect(20, yPosition, colWidth, 10, 'F')
    pdf.rect(20 + colWidth, yPosition, colWidth, 10, 'F')

    pdf.text('Total Earnings', 25, yPosition + 7)
    pdf.text(formatCurrency(payslipData.grossPay), 25 + colWidth - 30, yPosition + 7)
    pdf.text('Total Deductions', 25 + colWidth, yPosition + 7)
    pdf.text(formatCurrency(payslipData.totalDeductions), 25 + colWidth + colWidth - 30, yPosition + 7)

    yPosition += 25

    // Net Pay
    pdf.setFillColor(239, 246, 255) // Light blue background
    pdf.rect(20, yPosition, 170, 15, 'F')
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Net Pay (Rounded)', 25, yPosition + 8)
    pdf.setFontSize(20)
    pdf.text(formatCurrency(payslipData.netPay), 25, yPosition + 15)

    yPosition += 30

    // Signatures
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Employer\'s Signature', 20, yPosition)
    pdf.text('Employee\'s Signature', 110, yPosition)
    pdf.line(20, yPosition + 2, 100, yPosition + 2)
    pdf.line(110, yPosition + 2, 190, yPosition + 2)

    yPosition += 15

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(107, 114, 128) // Gray text
    pdf.text('This payslip is computer generated and does not require a signature.', 20, yPosition)
    pdf.text(`Generated on ${formatDate(new Date().toISOString())}`, 20, yPosition + 5)

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
