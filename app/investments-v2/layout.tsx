import { InvestmentsV2Layout } from '@/components/layout/investments-v2-layout'

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <InvestmentsV2Layout>
      {children}
    </InvestmentsV2Layout>
  )
}
