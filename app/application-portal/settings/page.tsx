"use client"

import { ApplicationPortalLayout } from "@/components/layout/application-portal-layout"
import { ApplicationPortalSettings } from "@/components/application-portal/settings/application-portal-settings"

export default function ApplicationPortalSettingsPage() {
  return (
    <ApplicationPortalLayout>
      <div className="p-6">
        <ApplicationPortalSettings />
      </div>
    </ApplicationPortalLayout>
  )
}
