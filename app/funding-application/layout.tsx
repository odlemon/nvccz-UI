import type { ReactNode } from "react"

export default function FundingApplicationLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-[#f2f5f9]">{children}</div>
}
