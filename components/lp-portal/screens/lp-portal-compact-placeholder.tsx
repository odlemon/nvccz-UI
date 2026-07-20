import Link from "next/link"
import { ArrowRight, Building2, Settings, ShieldCheck } from "lucide-react"
import { LpPageHeader, LpSection } from "@/components/lp-portal/ui"

export function LpPortalCompactPlaceholder({
  kind,
}: {
  kind: "organisation" | "settings"
}) {
  const organisation = kind === "organisation"

  return (
    <div className="space-y-4 p-4 md:p-5">
      <LpPageHeader
        eyebrow={organisation ? "Organisation access" : "Portal preferences"}
        title={organisation ? "My Organisation" : "Settings"}
        description={organisation
          ? "Review the organisation identity and entitlement boundary used throughout this investor portal."
          : "Investor notification, security and display preferences will be managed from this workspace."}
      />
      <LpSection
        title={organisation ? "Arcus Capital Partners LP" : "Investor portal settings"}
        description={organisation ? "Approved investor organisation · 3 authorised users" : "Compact compatibility view"}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            {organisation ? <Building2 className="size-5" /> : <Settings className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900">
              {organisation ? "Organisation-scoped access is active" : "Security controls remain enforced"}
            </p>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500">
              {organisation
                ? "Fund access is limited to approved organisation entitlements. Colleague administration will be connected here without changing the canonical portal route."
                : "MFA, entitlement filtering and auditable document access continue to apply. Detailed preference controls will be added in a later service phase."}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
            <ShieldCheck className="size-3.5" /> Verified
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <Link href="/lp-portal/requests" className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50">
            Request a portal change <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </LpSection>
    </div>
  )
}
