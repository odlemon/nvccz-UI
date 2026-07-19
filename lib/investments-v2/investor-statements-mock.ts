/** Investor Statements — screenshot-aligned mock data */

export const statementRuns = [
  {
    period: 'Q2 2025',
    asAt: '30 Jun 2025',
    status: 'Ready for Release' as const,
    investors: '32 / 42',
    generatedBy: 'Tawanda Moyo',
    generatedOn: '27 May 2025, 09:41',
  },
  {
    period: 'Q1 2025',
    asAt: '31 Mar 2025',
    status: 'Released' as const,
    investors: '42 / 42',
    generatedBy: 'Rudo Chikomo',
    generatedOn: '12 Apr 2025, 14:22',
  },
  {
    period: 'Q4 2024',
    asAt: '31 Dec 2024',
    status: 'Released' as const,
    investors: '41 / 41',
    generatedBy: 'Tawanda Moyo',
    generatedOn: '18 Jan 2025, 11:05',
  },
  {
    period: 'Q3 2024',
    asAt: '30 Sep 2024',
    status: 'Released' as const,
    investors: '41 / 41',
    generatedBy: 'Nyasha Dube',
    generatedOn: '24 Oct 2024, 09:55',
  },
  {
    period: 'Q2 2024',
    asAt: '30 Jun 2024',
    status: 'Released' as const,
    investors: '40 / 40',
    generatedBy: 'Rudo Chikomo',
    generatedOn: '19 Jul 2024, 16:10',
  },
  {
    period: 'Q1 2024',
    asAt: '31 Mar 2024',
    status: 'Released' as const,
    investors: '39 / 39',
    generatedBy: 'Tawanda Moyo',
    generatedOn: '14 Apr 2024, 10:33',
  },
  {
    period: 'Q4 2023',
    asAt: '31 Dec 2023',
    status: 'Released' as const,
    investors: '38 / 38',
    generatedBy: 'A. Dube',
    generatedOn: '22 Jan 2024, 08:47',
  },
  {
    period: 'Q3 2023',
    asAt: '30 Sep 2023',
    status: 'Released' as const,
    investors: '37 / 37',
    generatedBy: 'Nyasha Dube',
    generatedOn: '20 Oct 2023, 13:18',
  },
]

/** Client cash statements (trading accounts) */
export const clientStatementRuns = [
  {
    period: 'May 2025',
    asAt: '27 May 2025',
    status: 'Ready for Release' as const,
    clients: '48 / 56',
    generatedBy: 'Tawanda Moyo',
    generatedOn: '27 May 2025, 10:12',
  },
  {
    period: 'Apr 2025',
    asAt: '30 Apr 2025',
    status: 'Released' as const,
    clients: '56 / 56',
    generatedBy: 'Rudo Chikomo',
    generatedOn: '02 May 2025, 09:40',
  },
  {
    period: 'Mar 2025',
    asAt: '31 Mar 2025',
    status: 'Released' as const,
    clients: '55 / 55',
    generatedBy: 'Tawanda Moyo',
    generatedOn: '03 Apr 2025, 11:18',
  },
  {
    period: 'Feb 2025',
    asAt: '28 Feb 2025',
    status: 'Released' as const,
    clients: '54 / 54',
    generatedBy: 'Nyasha Dube',
    generatedOn: '03 Mar 2025, 14:05',
  },
  {
    period: 'Jan 2025',
    asAt: '31 Jan 2025',
    status: 'Released' as const,
    clients: '53 / 53',
    generatedBy: 'Rudo Chikomo',
    generatedOn: '04 Feb 2025, 08:55',
  },
  {
    period: 'Dec 2024',
    asAt: '31 Dec 2024',
    status: 'Released' as const,
    clients: '52 / 52',
    generatedBy: 'Tawanda Moyo',
    generatedOn: '06 Jan 2025, 10:22',
  },
  {
    period: 'Nov 2024',
    asAt: '30 Nov 2024',
    status: 'Released' as const,
    clients: '51 / 51',
    generatedBy: 'A. Dube',
    generatedOn: '04 Dec 2024, 16:41',
  },
  {
    period: 'Oct 2024',
    asAt: '31 Oct 2024',
    status: 'Released' as const,
    clients: '50 / 50',
    generatedBy: 'Nyasha Dube',
    generatedOn: '05 Nov 2024, 09:33',
  },
]

/** Client cash statement preview lines (opening → closing) */
export const clientCashStatementLines = [
  { label: 'Opening Cash', amount: '1,160,032.99' },
  { label: 'Receipts', amount: '124,530.21' },
  { label: 'Payments', amount: '(2,450.00)' },
  { label: 'Fees', amount: '(1,245.00)' },
  { label: 'Realised Gains / Losses', amount: '3,695.00' },
  { label: 'Closing Cash', amount: '1,284,563.20' },
]

/** Capital account lines — Current Period / YTD / Since Inception */
export const capitalAccountLines = [
  { label: 'Opening Balance', period: '31,220,550.18', ytd: '28,450,000.00', inception: '0.00' },
  { label: 'Capital Calls', period: '2,150,000.00', ytd: '5,800,000.00', inception: '28,450,000.00' },
  { label: 'Distributions', period: '(1,250,000.00)', ytd: '(3,100,000.00)', inception: '(9,845,210.44)' },
  { label: 'Management Fees', period: '(187,500.00)', ytd: '(375,000.00)', inception: '(2,140,000.00)' },
  { label: 'Carried Interest', period: '(92,400.00)', ytd: '(184,800.00)', inception: '(920,000.00)' },
  { label: 'Unrealised Value Change', period: '2,772,131.15', ytd: '4,022,581.33', inception: '19,068,000.00' },
]

export const capitalNav = {
  label: 'Net Asset Value (NAV)',
  period: '34,612,781.33',
  ytd: '34,612,781.33',
  inception: '34,612,781.33',
}

export const capitalClosing = {
  label: 'Closing Balance',
  period: '34,612,781.33',
  ytd: '34,612,781.33',
  inception: '34,612,781.33',
}
