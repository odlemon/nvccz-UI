"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { InvesteeGRNPage } from "@/components/user-application-portal/investee-grn-page"
import { InvestmentRecipientGuard } from "@/components/user-application-portal/investment-recipient-guard"

export default function InvesteeGRNRoute() {
  return (
    <ApplicationPortalLayout>
      <InvestmentRecipientGuard>
        <div className="p-6">
          <InvesteeGRNPage />
        </div>
      </InvestmentRecipientGuard>
    </ApplicationPortalLayout>
  )
}
