"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { ApplicantDrawdownPage } from "@/components/user-application-portal/drawdown-page"

export default function DrawdownPage() {
  return (
    <ApplicationPortalLayout>
      <ApplicantDrawdownPage />
    </ApplicationPortalLayout>
  )
}
