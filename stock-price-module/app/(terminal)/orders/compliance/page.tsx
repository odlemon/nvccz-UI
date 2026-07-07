'use client'

import { Topbar } from '@/components/arcus/topbar'
import { StatusBadge } from '@/components/arcus/status-badge'
import { cn } from '@/lib/utils'

const complianceResults = [
  { orderId: 'ORD-2840', portfolio: 'Equity World', ticker: 'MSFT', instrument: 'Microsoft Corp', side: 'BUY', qty: 200, rule: 'Single Security Limit', limit: '10%', current: '7.1%', after: '8.6%', result: 'passed', severity: 'info' },
  { orderId: 'ORD-2838', portfolio: 'Multi Asset', ticker: 'GOOGL', instrument: 'Alphabet Inc', side: 'SELL', qty: 50, rule: 'Minimum Cash Balance', limit: '10%', current: '12.7%', after: '11.4%', result: 'warning', severity: 'warning' },
  { orderId: 'ORD-2845', portfolio: 'Asia Select', ticker: 'BABA', instrument: 'Alibaba Group', side: 'BUY', qty: 1000, rule: 'Restricted Instrument', limit: 'Restricted', current: 'N/A', after: 'N/A', result: 'failed', severity: 'critical' },
  { orderId: 'ORD-2844', portfolio: 'Equity World', ticker: 'NVDA', instrument: 'NVIDIA Corp', side: 'BUY', qty: 500, rule: 'Sector Exposure', limit: '40%', current: '38.2%', after: '39.6%', result: 'warning', severity: 'warning' },
  { orderId: 'ORD-2843', portfolio: 'Fixed Income', ticker: 'HY-BOND', instrument: 'HY Bond ETF', side: 'BUY', qty: 5000, rule: 'Min Credit Rating', limit: 'BBB-', current: 'BB+', after: 'BB+', result: 'failed', severity: 'critical' },
  { orderId: 'ORD-2841', portfolio: 'Equity World', ticker: 'META', instrument: 'Meta Platforms', side: 'BUY', qty: 150, rule: 'Currency Exposure', limit: '60%', current: '54.2%', after: '55.1%', result: 'passed', severity: 'info' },
]

const mandateRules = [
  { rule: 'Single Security Limit', portfolio: 'All', limit: '10% of NAV', status: 'active' },
  { rule: 'Country Exposure Limit', portfolio: 'All', limit: '60% single country', status: 'active' },
  { rule: 'Sector Exposure Limit', portfolio: 'All', limit: '40% single sector', status: 'active' },
  { rule: 'Minimum Cash Balance', portfolio: 'All', limit: '5% of NAV', status: 'active' },
  { rule: 'Restricted Instruments', portfolio: 'All', limit: 'See restricted list', status: 'active' },
  { rule: 'Leverage Limit', portfolio: 'Equity World', limit: '1.2x NAV', status: 'active' },
  { rule: 'Minimum Credit Rating', portfolio: 'Fixed Income', limit: 'BBB-', status: 'active' },
  { rule: 'Max Derivative Exposure', portfolio: 'Multi Asset', limit: '15% of NAV', status: 'active' },
]

export default function CompliancePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Compliance" subtitle="Pre-trade checks & mandate rules" showPeriod={false} />

      <div className="flex items-center gap-4 px-4 pt-3 pb-0 border-b border-white/[0.06] flex-shrink-0">
        {['Trade Blotter', 'Orderbook', 'Trading', 'Compliance', 'Simulation', 'Models'].map((t) => (
          <a key={t} href={t === 'Compliance' ? '/orders/compliance' : t === 'Orderbook' ? '/orders/orderbook' : t === 'Trading' ? '/orders/trading' : t === 'Trade Blotter' ? '/orders/blotter' : '#'}
            className={cn('text-xs pb-2 border-b-2 whitespace-nowrap', t === 'Compliance' ? 'border-[#2563EB] text-[#60A5FA]' : 'border-transparent text-[#6B7A95] hover:text-[#A8B4C8]')}>
            {t}
          </a>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary badges */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Checks Passed', value: '3', color: 'text-[#10B981]', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Warnings', value: '2', color: 'text-[#F59E0B]', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Failed', value: '2', color: 'text-[#EF4444]', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Active Rules', value: '8', color: 'text-[#60A5FA]', bg: 'bg-blue-500/10 border-blue-500/20' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-md p-3 border', s.bg)}>
              <div className="text-[10px] text-[#6B7A95] uppercase tracking-wider mb-1">{s.label}</div>
              <div className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Compliance results */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.06]">
            <div className="text-xs font-semibold text-[#E8EDF5]">Pre-Trade Compliance Results</div>
          </div>
          <table className="arcus-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Portfolio</th>
                <th>Ticker</th>
                <th>Side</th>
                <th>Rule Checked</th>
                <th>Limit</th>
                <th>Current</th>
                <th>After Trade</th>
                <th>Result</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complianceResults.map(r => (
                <tr key={r.orderId}>
                  <td className="text-[#60A5FA] font-mono text-[11px]">{r.orderId}</td>
                  <td className="text-[#A8B4C8]">{r.portfolio}</td>
                  <td className="text-[#C8D3E8] font-mono font-semibold">{r.ticker}</td>
                  <td>
                    <span className={cn('text-xs font-bold', r.side === 'BUY' ? 'text-[#10B981]' : 'text-[#EF4444]')}>{r.side}</span>
                  </td>
                  <td className="text-[#A8B4C8]">{r.rule}</td>
                  <td className="font-mono">{r.limit}</td>
                  <td className="font-mono text-[#6B7A95]">{r.current}</td>
                  <td className="font-mono">{r.after}</td>
                  <td><StatusBadge status={r.result} /></td>
                  <td>
                    {r.result === 'failed' && (
                      <button className="text-[10px] text-[#F59E0B] hover:underline">Request Override</button>
                    )}
                    {r.result === 'warning' && (
                      <button className="text-[10px] text-[#60A5FA] hover:underline">Acknowledge</button>
                    )}
                    {r.result === 'passed' && (
                      <span className="text-[10px] text-[#4B5A72]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mandate rules */}
        <div className="bg-[#0D1526] border border-white/[0.06] rounded-md overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <div className="text-xs font-semibold text-[#E8EDF5]">Active Mandate Rules</div>
            <button className="text-[#60A5FA] text-[10px] hover:underline">+ Add Rule</button>
          </div>
          <table className="arcus-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Portfolio Scope</th>
                <th>Limit / Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mandateRules.map(rule => (
                <tr key={rule.rule}>
                  <td className="text-[#C8D3E8]">{rule.rule}</td>
                  <td className="text-[#6B7A95]">{rule.portfolio}</td>
                  <td className="font-mono">{rule.limit}</td>
                  <td><StatusBadge status={rule.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
