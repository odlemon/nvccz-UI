"use client"

import * as React from "react"
import {
  Bell,
  Eye,
  Globe2,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type PrefKey =
  | "emailCapital"
  | "emailDocuments"
  | "emailNotices"
  | "emailMessages"
  | "inAppCapital"
  | "inAppDocuments"
  | "inAppNotices"
  | "inAppMessages"

export function LpSettingsScreen() {
  const [prefs, setPrefs] = React.useState<Record<PrefKey, boolean>>({
    emailCapital: true,
    emailDocuments: true,
    emailNotices: true,
    emailMessages: true,
    inAppCapital: true,
    inAppDocuments: true,
    inAppNotices: true,
    inAppMessages: true,
  })
  const [displayCurrency, setDisplayCurrency] = React.useState("USD")
  const [asOfDefault, setAsOfDefault] = React.useState("latest-final")
  const [digest, setDigest] = React.useState("daily")

  const toggle = (key: PrefKey) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const save = () => toast.success("Settings saved (mock).")

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#0f172a]">Settings</h1>
          <p className="mt-1.5 text-[13px] leading-5 text-[#6b7280]">
            Notification preferences, security controls, and display defaults for your portal.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-full bg-[#2563eb] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
          onClick={save}
        >
          Save Changes
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "MFA Status",
            value: "Enabled",
            helper: "Authenticator app",
            icon: <Smartphone className="size-4" />,
            bg: "bg-[#dcfce7]",
            color: "text-[#16a34a]",
          },
          {
            label: "Security",
            value: "Compliant",
            helper: "Session + entitlement checks",
            icon: <ShieldCheck className="size-4" />,
            bg: "bg-[#dbeafe]",
            color: "text-[#2563eb]",
          },
          {
            label: "Email Digest",
            value: digest === "daily" ? "Daily" : digest === "weekly" ? "Weekly" : "Off",
            helper: "Capital & document alerts",
            icon: <Mail className="size-4" />,
            bg: "bg-[#ede9fe]",
            color: "text-[#7c3aed]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <span className={cn("flex size-8 items-center justify-center rounded-full", card.bg, card.color)}>
              {card.icon}
            </span>
            <p className="mt-3 text-[12px] font-medium text-[#6b7280]">{card.label}</p>
            <p className="mt-1 text-[18px] font-bold text-[#0f172a]">{card.value}</p>
            <p className="mt-1 text-[12px] text-[#9ca3af]">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-[#2563eb]" />
            <h2 className="text-[14px] font-semibold text-[#111827]">Notification Preferences</h2>
          </div>
          <p className="mt-1 text-[12px] text-[#6b7280]">
            Choose how you receive capital activity, document, notice, and message alerts.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#e5e7eb]">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#fafafa] text-[11px] font-semibold text-[#6b7280]">
                  <th className="px-4 py-2.5">Alert Type</th>
                  <th className="px-3 py-2.5 text-center">Email</th>
                  <th className="px-3 py-2.5 text-center">In-App</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Capital calls & distributions", "emailCapital", "inAppCapital"],
                    ["Documents published", "emailDocuments", "inAppDocuments"],
                    ["Notices & acknowledgements", "emailNotices", "inAppNotices"],
                    ["Requests & messages", "emailMessages", "inAppMessages"],
                  ] as const
                ).map(([label, emailKey, inAppKey]) => (
                  <tr key={label} className="border-b border-[#f3f4f6] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#111827]">{label}</td>
                    <td className="px-3 py-3 text-center">
                      <Switch
                        checked={prefs[emailKey]}
                        onCheckedChange={() => toggle(emailKey)}
                        aria-label={`${label} email`}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Switch
                        checked={prefs[inAppKey]}
                        onCheckedChange={() => toggle(inAppKey)}
                        aria-label={`${label} in-app`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
              Email digest cadence
            </label>
            <Select value={digest} onValueChange={setDigest}>
              <SelectTrigger className="h-9 w-full max-w-[220px] rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily summary</SelectItem>
                <SelectItem value="weekly">Weekly summary</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-[#2563eb]" />
              <h2 className="text-[14px] font-semibold text-[#111827]">Security</h2>
            </div>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] px-3 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#111827]">Multi-factor authentication</p>
                  <p className="mt-0.5 text-[11px] text-[#6b7280]">Required for bank instruction changes</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full border-[#e5e7eb] px-3 text-[11px] font-medium shadow-none"
                  onClick={() => toast.message("Manage MFA (mock).")}
                >
                  Manage
                </Button>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] px-3 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#111827]">Active sessions</p>
                  <p className="mt-0.5 text-[11px] text-[#6b7280]">2 devices · last sign-in today</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full border-[#e5e7eb] px-3 text-[11px] font-medium shadow-none"
                  onClick={() => toast.message("View sessions (mock).")}
                >
                  Review
                </Button>
              </li>
              <li className="flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] px-3 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#111827]">Password</p>
                  <p className="mt-0.5 text-[11px] text-[#6b7280]">Last changed 48 days ago</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full border-[#e5e7eb] px-3 text-[11px] font-medium shadow-none"
                  onClick={() => toast.message("Change password (mock).")}
                >
                  Change
                </Button>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-[#2563eb]" />
              <h2 className="text-[14px] font-semibold text-[#111827]">Display Preferences</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Display currency
                </label>
                <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                  <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="ZAR">ZAR</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-4 text-[#9ca3af]">
                  <Globe2 className="mt-0.5 size-3.5 shrink-0" />
                  Display currency never overwrites original amounts or historical FX rates.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-[#374151]">
                  Default as-of preference
                </label>
                <Select value={asOfDefault} onValueChange={setAsOfDefault}>
                  <SelectTrigger className="h-9 rounded-lg border-[#e5e7eb] text-[12px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest-final">Latest FINAL valuation</SelectItem>
                    <SelectItem value="latest-any">Latest available (incl. provisional)</SelectItem>
                    <SelectItem value="month-end">Prior month-end FINAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
