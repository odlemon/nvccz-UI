"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { InvesteeReportingForm } from "@/components/application-portal/financial-reporting/InvesteeReportingForm"

export default function ReportsPage() {
  return (
    <ApplicationPortalLayout>
      <div className="p-6">
        <InvesteeReportingForm />
      </div>
    </ApplicationPortalLayout>
  )
}
