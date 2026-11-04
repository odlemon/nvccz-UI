type Section = { accounts?: Array<{ accountNo?: string; accountName?: string; amount?: number; netAmount?: number }> }
type Statement = { sections: Record<string, Section> }
type Bucket = 'grant' | 'management' | 'otherRevenue' | 'salaries' | 'travel' | 'training' | 'marketing' | 'otherOpex' | 'depreciation' | 'interest' | 'dividend' | 'fairValue' | 'bank' | 'fx' | 'tax' | 'other'

/** Classify each account once. Specific template codes take precedence over overlapping ranges. */
function classify(accountNo: string, section: string): Bucket {
  const code = Number(accountNo)
  if (section === 'incomeTax') return 'tax'
  if (code === 4000) return 'grant'
  if (code === 4200) return 'management'
  if (code === 4100) return 'interest'
  if (code === 4300) return 'dividend'
  if (code === 4400) return 'fairValue'
  if (code === 5270) return 'depreciation'
  if (code === 5360) return 'bank'
  if (code === 5190) return 'fx'
  if (code >= 6000 && code <= 6060) return 'salaries'
  if (code >= 7000 && code <= 7060) return 'travel'
  if (code >= 8000 && code <= 8060) return 'training'
  if (code >= 9000 && code <= 9080) return 'marketing'
  if (code >= 5010 && code <= 5350) return 'otherOpex'
  if (section === 'revenue') return 'otherRevenue'
  if (section === 'operatingExpenses') return 'otherOpex'
  return 'other'
}

function buckets(statement: Statement): Record<Bucket, number> {
  const out: Record<Bucket, number> = { grant:0, management:0, otherRevenue:0, salaries:0, travel:0, training:0, marketing:0, otherOpex:0, depreciation:0, interest:0, dividend:0, fairValue:0, bank:0, fx:0, tax:0, other:0 }
  for (const [section, value] of Object.entries(statement.sections || {})) {
    for (const account of value?.accounts || []) {
      const amount = Number(account.amount ?? account.netAmount ?? 0)
      const bucket = classify(String(account.accountNo || ''), section)
      // FX gains and losses are shown as signed amounts; the other expense rows retain their debit-positive presentation.
      out[bucket] += bucket === 'fx' && section === 'operatingExpenses' ? -amount : amount
    }
  }
  return out
}

export function profitLossTemplateRows(current: Statement, comparative: Statement): (string | number)[][] {
  const a = buckets(current), b = buckets(comparative)
  const revenue = (x: typeof a) => x.grant + x.management + x.otherRevenue
  const operating = (x: typeof a) => revenue(x) - x.salaries - x.travel - x.training - x.marketing - x.otherOpex - x.depreciation
  const investing = (x: typeof a) => x.interest + x.dividend + x.fairValue
  const beforeTax = (x: typeof a) => operating(x) + investing(x) - x.bank + x.fx + x.other
  const money = (n: number) => Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100
  const row = (label: string, code: string, value: (x: typeof a) => number): (string | number)[] => [label, code, '', money(value(a)), money(value(b))]
  return [
    ['1. OPERATING CATEGORY', '', '', '', ''],
    row('Grant Income','4000',x=>x.grant), row('Management Fees','4200',x=>x.management), row('Other operating revenue','Other',x=>x.otherRevenue), row('TOTAL OPERATING REVENUE','',revenue),
    row('Salaries and Wages','6000-6060',x=>x.salaries), row('Travel & Accommodation','7000-7060',x=>x.travel), row('Training and Development','8000-8060',x=>x.training), row('Branding & Marketing','9000-9080',x=>x.marketing), row('Other OPEX','5010-5350 and other operating expenses',x=>x.otherOpex), row('Depreciation','5270',x=>x.depreciation), row('OPERATING PROFIT / (LOSS)','',operating),
    ['2. INVESTING CATEGORY','','','',''], row('Interest Income','4100',x=>x.interest), row('Dividend Income','4300',x=>x.dividend), row('Fair Value Gains on Investments / Financial Assets','4400',x=>x.fairValue), row('NET INVESTING INCOME','',investing), row('PROFIT BEFORE FINANCING AND INCOME TAX','',x=>operating(x)+investing(x)),
    ['3. FINANCING CATEGORY','','','',''], row('Bank Charges & IMTT','5360',x=>x.bank), row('Exchange Gains / (Losses)','5190',x=>x.fx), row('Other non-operating items','Other',x=>x.other), row('NET FINANCING EXPENSE','',x=>-x.bank+x.fx+x.other), row('PROFIT BEFORE INCOME TAX','',beforeTax), row('Income Tax Expense','Tax',x=>x.tax), row('PROFIT FOR THE PERIOD','',x=>beforeTax(x)-x.tax),
  ]
}
