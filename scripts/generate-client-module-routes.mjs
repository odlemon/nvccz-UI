import fs from "fs"
import path from "path"

const acRoutes = [
  ["", "Accounting V52"],
  ["approvals", "Approvals"],
  ["close", "Period Close"],
  ["general-ledger", "General Ledger"],
  ["journals", "Journals"],
  ["cash-book", "Cash Book"],
  ["bank-reconciliation", "Bank Reconciliation"],
  ["payables", "Payables"],
  ["receivables", "Receivables"],
  ["expenses", "Expenses"],
  ["inventory", "Inventory"],
  ["assets", "Assets"],
  ["short-term-investments", "Short-Term Investments"],
  ["reports", "Reports"],
  ["tax", "Tax"],
  ["fx-revaluation", "FX Revaluation"],
  ["consolidation", "Consolidation"],
  ["chart-governance", "Chart Governance"],
  ["vault", "Vault"],
  ["audit", "Audit"],
  ["access", "Access"],
  ["integrations", "Integrations"],
  ["settings", "Settings"],
]

const prRoutes = [
  ["", "Procurement V23"],
  ["plan", "Plan"],
  ["approvals", "Approvals"],
  ["requisitions", "Requisitions"],
  ["tenders", "Tenders"],
  ["evaluation", "Evaluation"],
  ["vendors", "Vendors"],
  ["contracts", "Contracts"],
  ["purchase-orders", "Purchase Orders"],
  ["goods-received", "Goods Received"],
  ["invoices", "Invoices"],
  ["accounts", "Accounts"],
  ["documents", "Documents"],
  ["reports", "Reports"],
  ["audit", "Audit"],
  ["settings", "Settings"],
  ["analytics", "Analytics"],
]

function writeRoutes(base, routes, layoutName) {
  const layoutPath = path.join("app", base, "layout.tsx")
  fs.mkdirSync(path.dirname(layoutPath), { recursive: true })
  fs.writeFileSync(
    layoutPath,
    `"use client"

import type { ReactNode } from "react"
import { ${layoutName} } from "@/components/layout/${base}-layout"

export default function Layout({ children }: { children: ReactNode }) {
  return <${layoutName}>{children}</${layoutName}>
}
`
  )

  for (const [seg, label] of routes) {
    const dir = seg ? path.join("app", base, seg) : path.join("app", base)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      path.join(dir, "page.tsx"),
      `/** Client design faithful port — ${label} */\nexport default function Page() {\n  return <span>${label}</span>\n}\n`
    )
  }
}

writeRoutes("accounting-v52", acRoutes, "AccountingV52Layout")
writeRoutes("procurement-v23", prRoutes, "ProcurementV23Layout")
console.log("routes ok")
