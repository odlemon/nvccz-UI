"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { ApplicantDrawdownPage } from "@/components/user-application-portal/drawdown-page"
import { InvestmentRecipientGuard } from "@/components/user-application-portal/investment-recipient-guard"

export default function DrawdownPage() {
  return (
    <ApplicationPortalLayout>
      <InvestmentRecipientGuard>
        <ApplicantDrawdownPage />
      </InvestmentRecipientGuard>
    </ApplicationPortalLayout>
  )
}
