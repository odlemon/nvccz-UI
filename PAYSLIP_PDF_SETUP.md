# Payslip PDF Generation Setup

## Required Dependencies

To enable PDF generation functionality for payslips, you need to install the following dependencies:

```bash
# Using npm
npm install html2canvas jspdf

# Using pnpm
pnpm add html2canvas jspdf

# Using yarn
yarn add html2canvas jspdf
```

## TypeScript Types

You may also need to install type definitions:

```bash
# Using npm
npm install --save-dev @types/html2canvas

# Using pnpm
pnpm add -D @types/html2canvas

# Using yarn
yarn add -D @types/html2canvas
```

## Features Implemented

### 1. Payslip Template (`components/payroll/payslip-template.tsx`)
- Professional payslip layout matching the sample design
- Company header with Kyntaro branding
- Employee information section
- Payroll information section
- Earnings breakdown (Basic Salary, Allowances, Overtime)
- Deductions breakdown (PAYE, NSSA, AIDS Levy)
- Net pay calculation
- Signature sections
- Responsive design for PDF generation

### 2. PDF Generator (`lib/utils/pdf-generator.ts`)
- HTML to PDF conversion using html2canvas and jsPDF
- Configurable PDF options (format, orientation, quality)
- Automatic filename generation
- Download functionality
- Error handling

### 3. Updated Payslips Page (`app/payroll/payslips/page.tsx`)
- Integrated payslip template
- PDF generation button with loading state
- Download existing PDF functionality
- Professional preview layout

## Usage

1. Navigate to `/payroll/payslips`
2. Select an employee and payroll run
3. Click "Search Payslip" to load the payslip data
4. Click "Generate PDF" to create and download a PDF version
5. The PDF will be automatically downloaded with a filename like `payslip-EMP001-January-2026.pdf`

## PDF Features

- **Format**: A4 portrait
- **Quality**: High resolution (2x scale)
- **Styling**: Professional layout with proper spacing
- **Content**: All payslip information including earnings, deductions, and net pay
- **Branding**: Kyntaro company header and styling

## Troubleshooting

If PDF generation fails:
1. Ensure all dependencies are installed
2. Check browser console for errors
3. Verify that the payslip data is properly loaded
4. Try refreshing the page and generating again

## Customization

The payslip template can be customized by modifying:
- Company branding in the header
- Color scheme and styling
- Layout structure
- Additional fields or sections
- Currency formatting
