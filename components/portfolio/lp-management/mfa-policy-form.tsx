"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchMfaPolicy, updateMfaPolicy } from "@/lib/store/slices/lpPortalAdminSlice"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { LP_MANAGEMENT_ACTIONS } from "@/lib/config/role-permissions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return fallback
}

export function MfaPolicyForm() {
  const dispatch = useAppDispatch()
  const { mfaPolicy, mfaPolicyLoading, mfaPolicySaving, mfaPolicyError } = useAppSelector((s) => s.lpPortalAdmin)
  const { hasSpecificAction } = useRolePermissions()
  const canManage = hasSpecificAction("portfolio-management", LP_MANAGEMENT_ACTIONS.MANAGE_MFA_POLICY)

  const [requireMfaForLp, setRequireMfaForLp] = useState(false)
  const [issuerName, setIssuerName] = useState("")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    dispatch(fetchMfaPolicy())
  }, [dispatch])

  useEffect(() => {
    if (mfaPolicy && !dirty) {
      setRequireMfaForLp(mfaPolicy.requireMfaForLp)
      setIssuerName(mfaPolicy.issuerName)
    }
  }, [mfaPolicy, dirty])

  const handleSave = async () => {
    try {
      await dispatch(updateMfaPolicy({ requireMfaForLp, issuerName })).unwrap()
      toast.success("MFA policy updated")
      setDirty(false)
    } catch (err) {
      toast.error("Failed to update MFA policy", { description: errorMessage(err, "Please try again.") })
    }
  }

  if (mfaPolicyLoading && !mfaPolicy) {
    return (
      <div className="p-6 max-w-2xl">
        <Card className="bg-white border border-gray-200 shadow-none p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-4 h-4 text-blue-500" /> LP Portal Security
          </CardTitle>
          <CardDescription>
            {canManage
              ? "Controls whether multi-factor authentication is required for LP portal users."
              : "You have read-only access to this policy."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Require MFA for LP portal users</p>
              <p className="text-xs text-muted-foreground">
                When enabled, all LP portal users must enroll in multi-factor authentication.
              </p>
            </div>
            <Switch
              checked={requireMfaForLp}
              onCheckedChange={(v) => {
                setRequireMfaForLp(v)
                setDirty(true)
              }}
              disabled={!canManage}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Issuer Name</Label>
            <Input
              value={issuerName}
              onChange={(e) => {
                setIssuerName(e.target.value)
                setDirty(true)
              }}
              disabled={!canManage}
              placeholder="e.g. Arcus Capital"
              className="h-9"
            />
            <p className="text-xs text-muted-foreground">Shown in authenticator apps when LP users enroll in MFA.</p>
          </div>
          {mfaPolicyError && <p className="text-xs text-red-600">{mfaPolicyError}</p>}
          {canManage && (
            <div className="flex justify-end">
              <Button className="gradient-primary text-white" onClick={handleSave} disabled={mfaPolicySaving || !dirty}>
                {mfaPolicySaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Policy"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
