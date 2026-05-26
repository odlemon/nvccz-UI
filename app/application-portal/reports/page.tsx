"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { InvesteeReportingForm } from "@/components/application-portal/financial-reporting/InvesteeReportingForm"
import { InvestmentRecipientGuard } from "@/components/user-application-portal/investment-recipient-guard"

export default function ReportsPage() {
  return (
    <ApplicationPortalLayout>
      <InvestmentRecipientGuard>
        <div className="p-6">
          <InvesteeReportingForm />
        </div>
      </InvestmentRecipientGuard>
    </ApplicationPortalLayout>
  )
}
