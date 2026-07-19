/** Fund Cash Reconciliation — screenshot-aligned mock */

export const internalEntries = [
  { id: 'cll_12', date: '26 May 2025', description: 'Bank charges', amount: -1245.0 },
  { id: 'cll_11', date: '26 May 2025', description: 'Dividend ECO.ZW', amount: 245870.0 },
  { id: 'cll_10', date: '25 May 2025', description: 'Unit deal inflow', amount: 1200000.0 },
  { id: 'cll_09', date: '25 May 2025', description: 'Custody fee', amount: -18400.0 },
  { id: 'cll_08', date: '24 May 2025', description: 'Broker settlement buy', amount: -4820000.0 },
  { id: 'cll_07', date: '24 May 2025', description: 'Interest income', amount: 42850.0 },
  { id: 'cll_06', date: '23 May 2025', description: 'FX settlement', amount: -850000.0 },
  { id: 'cll_05', date: '23 May 2025', description: 'Subscription proceeds', amount: 2500000.0 },
  { id: 'cll_04', date: '22 May 2025', description: 'Management fee', amount: -125000.0 },
  { id: 'cll_03', date: '22 May 2025', description: 'Transfer in', amount: 750000.0 },
  { id: 'cll_02', date: '21 May 2025', description: 'Redemption payment', amount: -980000.0 },
  { id: 'cll_01', date: '21 May 2025', description: 'Corporate action cash', amount: 156200.0 },
]

export const bankEntries = [
  { id: 'esl_44', date: '26 May 2025', description: 'BANK CHARGE', amount: -1315.0 },
  { id: 'esl_43', date: '26 May 2025', description: 'DIVIDEND CREDIT ECO', amount: 245870.0 },
  { id: 'esl_42', date: '25 May 2025', description: 'TRANSFER IN', amount: 1200000.0 },
  { id: 'esl_41', date: '25 May 2025', description: 'CUSTODY FEE', amount: -18400.0 },
  { id: 'esl_40', date: '24 May 2025', description: 'PURCHASE SETTLEMENT', amount: -4820000.0 },
  { id: 'esl_39', date: '24 May 2025', description: 'INTEREST CREDIT', amount: 42850.0 },
  { id: 'esl_38', date: '23 May 2025', description: 'FX OUT', amount: -850000.0 },
  { id: 'esl_37', date: '23 May 2025', description: 'SUBSCRIPTION', amount: 2500000.0 },
  { id: 'esl_36', date: '22 May 2025', description: 'MGMT FEE', amount: -125000.0 },
  { id: 'esl_35', date: '22 May 2025', description: 'INCOMING TT', amount: 750000.0 },
  { id: 'esl_34', date: '21 May 2025', description: 'REDEMPTION', amount: -980000.0 },
  { id: 'esl_33', date: '21 May 2025', description: 'CORP ACTION', amount: 156200.0 },
  { id: 'esl_32', date: '20 May 2025', description: 'UNMATCHED CREDIT', amount: 42000.0 },
  { id: 'esl_31', date: '20 May 2025', description: 'SERVICE CHARGE', amount: -890.0 },
]

export const breakRows = [
  {
    id: 'BRK-000023',
    date: '26 May 2025',
    type: 'Bank Charge Difference',
    details: 'Charge variance',
    amount: 75.0,
  },
  {
    id: 'BRK-000022',
    date: '25 May 2025',
    type: 'Timing Difference',
    details: 'Value date lag T+1',
    amount: 42100.0,
  },
  {
    id: 'BRK-000021',
    date: '24 May 2025',
    type: 'Missing Entry (Bank)',
    details: 'Internal fee not on statement',
    amount: 2850.0,
  },
  {
    id: 'BRK-000020',
    date: '23 May 2025',
    type: 'FX Variance',
    details: 'Residual after FX posting',
    amount: 1205.0,
  },
  {
    id: 'BRK-000019',
    date: '22 May 2025',
    type: 'Missing Entry (Internal)',
    details: 'Bank credit unmatched',
    amount: 42000.0,
  },
]

export const matchSuggestions = [
  {
    internal: 'cll_09 · Custody fee',
    bank: 'esl_41 · CUSTODY FEE',
    reason: 'Exact amount and date match',
    confidence: 100,
  },
  {
    internal: 'cll_11 · Dividend ECO.ZW',
    bank: 'esl_43 · DIVIDEND CREDIT ECO',
    reason: 'Exact amount · 0 day lag',
    confidence: 98,
  },
  {
    internal: 'cll_10 · Unit deal inflow',
    bank: 'esl_42 · TRANSFER IN',
    reason: 'Amount match within tolerance',
    confidence: 92,
  },
]

export const reconRules = [
  { label: 'Exact Amount & Date Match', mode: 'Auto-match' },
  { label: 'Reference Exact Match', mode: 'Auto-match' },
  { label: 'Amount ±1 day tolerance', mode: 'Review' },
  { label: 'Many-to-one net settlement', mode: 'Review' },
  { label: 'Bank charge variance ≤ ZWL 100', mode: 'Review' },
]

export const breakByReason = [
  { name: 'Timing Difference', value: 8, color: '#3B82F6' },
  { name: 'Missing Entry (Internal)', value: 5, color: '#A855F7' },
  { name: 'Bank Charge Difference', value: 4, color: '#EF4444' },
  { name: 'FX Variance', value: 3, color: '#F59E0B' },
  { name: 'Missing Entry (Bank)', value: 3, color: '#64748B' },
]

export function formatZwl(n: number) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-${abs}` : abs
}
