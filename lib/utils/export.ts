import { format } from 'date-fns'
import { TrialBalanceData, IncomeStatementData } from '@/lib/api/accounting-api'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addLetterhead, addReportInfo } from '@/lib/utils/pdf-letterhead'

export const exportTrialBalanceToCSV = (data: TrialBalanceData) => {
  const headers = [
    'Account No.',
    'Account Name',
    'Account Type',
    'Debit Balance',
    'Credit Balance'
  ]

  const rows = data.accounts.map(account => [
    account.accountNo,
    `"${account.accountName}"`, // Quote account names to handle commas
    account.accountType,
    (account.debitBalance || 0).toFixed(2),
    (account.creditBalance || 0).toFixed(2)
  ])

  // Add totals row
  rows.push([
    '',
    '',
    'TOTALS',
    data.totals.totalDebits.toFixed(2),
    data.totals.totalCredits.toFixed(2)
  ])

  const csvContent = [
    `"Trial Balance - As of ${format(new Date(data.date), 'MMMM d, yyyy')}"`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `trial-balance-${data.date}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportTrialBalanceToPDF = async (data: TrialBalanceData) => {
  const formatAmount = (amount: number) =>
    Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const currencyCode = (data as any)?.currency?.code || 'USD'
  const doc = new jsPDF()

  let startY = await addLetterhead(doc, 'Trial Balance')
  startY = addReportInfo(doc, startY, [
    `As of ${format(new Date(data.date), 'MMMM d, yyyy')}`,
    `Currency: ${currencyCode}`,
    `Status: ${data.totals.isBalanced ? 'Balanced' : 'Unbalanced'}`,
  ])

  const rows: any[] = data.accounts.map((account: any) => [
    account.accountNo,
    account.accountName,
    account.accountType,
    formatAmount(account.debitBalance),
    formatAmount(account.creditBalance),
  ])

  rows.push([
    { content: 'TOTALS', colSpan: 3, styles: { fontStyle: 'bold' } },
    { content: formatAmount(data.totals.totalDebits), styles: { fontStyle: 'bold', textColor: [21, 128, 61] } },
    { content: formatAmount(data.totals.totalCredits), styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
  ])

  autoTable(doc, {
    head: [['Account No.', 'Account Name', 'Account Type', 'Debit Balance', 'Credit Balance']],
    body: rows,
    startY,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  })

  doc.save(`TrialBalance_${data.date}.pdf`)
}

export const exportIncomeStatementToPDF = async (data: IncomeStatementData) => {
  // Create a printable HTML page for Income Statement PDF generation
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency.code,
      minimumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  const startDate = format(new Date(data.period.startDate), 'MMMM d, yyyy')
  const endDate = format(new Date(data.period.endDate), 'MMMM d, yyyy')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Income Statement - ${startDate} to ${endDate}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 24px;
          color: #333;
        }
        .header h2 {
          margin: 0 0 10px 0;
          font-size: 20px;
          color: #555;
        }
        .header p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        .statement-container {
          max-width: 600px;
          margin: 0 auto;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          color: #333;
        }
        .line-item {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          margin-left: 30px;
        }
        .line-item .description {
          flex-grow: 1;
          color: #555;
        }
        .line-item .amount {
          font-family: 'Courier New', monospace;
          width: 120px;
          text-align: right;
          color: #333;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          margin-left: 30px;
          border-top: 1px solid #333;
          border-bottom: 2px solid #333;
          font-weight: bold;
          margin-top: 5px;
        }
        .total-line .description {
          flex-grow: 1;
          color: #333;
        }
        .total-line .amount {
          font-family: 'Courier New', monospace;
          width: 120px;
          text-align: right;
        }
        .revenue .total-line .amount {
          color: #16a34a;
        }
        .expenses .total-line .amount {
          color: #dc2626;
        }
        .net-income {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #333;
        }
        .net-income .final-total {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-top: 2px solid #333;
          border-bottom: 4px double #333;
          font-weight: bold;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .net-income .final-total .description {
          flex-grow: 1;
        }
        .net-income .final-total .amount {
          font-family: 'Courier New', monospace;
          width: 120px;
          text-align: right;
        }
        .net-income.profit .final-total {
          color: #16a34a;
        }
        .net-income.loss .final-total {
          color: #dc2626;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          @page { margin: 0.75in; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>National venture capital company of Zimbabwe</h1>
        <h2>Income Statement</h2>
        <p>For the Period from ${startDate} to ${endDate}</p>
      </div>

      <div class="statement-container">
        <!-- Revenue Section -->
        <div class="section revenue">
          <div class="section-title">Revenue</div>
          <div class="line-item">
            <span class="description">Sales Revenue</span>
            <span class="amount">${formatCurrency(Math.abs(data.revenue.total))}</span>
          </div>
          <div class="line-item">
            <span class="description">Other Revenue</span>
            <span class="amount">-</span>
          </div>
          <div class="total-line">
            <span class="description">Total Revenue</span>
            <span class="amount>${formatCurrency(Math.abs(data.revenue.total))}</span>
          </div>
        </div>

        <!-- Expenses Section -->
        <div class="section expenses">
          <div class="section-title">Expenses</div>
          <div class="line-item">
            <span class="description">Cost of Goods Sold</span>
            <span class="amount">${data.expenses.total > 0 ? formatCurrency(data.expenses.total / 2) : '-'}</span>
          </div>
          <div class="line-item">
            <span class="description">Operating Expenses</span>
            <span class="amount">${data.expenses.total > 0 ? formatCurrency(data.expenses.total / 2) : '-'}</span>
          </div>
          <div class="line-item">
            <span class="description">Administrative Expenses</span>
            <span class="amount">-</span>
          </div>
          <div class="line-item">
            <span class="description">Depreciation</span>
            <span class="amount">-</span>
          </div>
          <div class="total-line">
            <span class="description">Total Expenses</span>
            <span class="amount">${formatCurrency(data.expenses.total)}</span>
          </div>
        </div>

        <!-- Net Income Section -->
        <div class="net-income ${data.netIncome >= 0 ? 'profit' : 'loss'}">
          <div class="final-total">
            <span class="description">Net ${data.netIncome >= 0 ? 'Income' : 'Loss'}</span>
            <span class="amount">
              ${data.netIncome < 0 ? '(' : ''}${formatCurrency(Math.abs(data.netIncome))}${data.netIncome < 0 ? ')' : ''}
            </span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Report generated on ${format(new Date(data.generatedAt), 'PPP p')}</p>
        <p>Currency: ${data.currency.name} (${data.currency.code})</p>
        <p>Revenue Accounts: ${data.revenue.accountCount} | Expense Accounts: ${data.expenses.accountCount}</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            setTimeout(() => {
              window.close();
            }, 1000);
          }, 100);
        }
      </script>
    </body>
    </html>
  `

  // Open print-ready version for PDF download
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
  } else {
    throw new Error('Popup blocked. Please allow popups to generate PDF.')
  }
}
