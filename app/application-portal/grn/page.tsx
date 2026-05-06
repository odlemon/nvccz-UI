"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { InvesteeGRNPage } from "@/components/user-application-portal/investee-grn-page"

export default function InvesteeGRNRoute() {
  return (
    <ApplicationPortalLayout>
      <div className="p-6">
          <InvesteeGRNPage />
      </div>
    </ApplicationPortalLayout>
  )
}
