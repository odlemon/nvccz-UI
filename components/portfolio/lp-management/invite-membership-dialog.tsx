"use client"

import { useMemo, useState } from "react"
import { useAppDispatch } from "@/lib/store"
import { inviteMembership } from "@/lib/store/slices/lpPortalAdminSlice"
import { useRolePermissions } from "@/lib/hooks/useRolePermissions"
import { LP_MANAGEMENT_ACTIONS } from "@/lib/config/role-permissions"
import type { ClientRecord } from "@/lib/api/capital-calls-api"
import type { LpRole } from "@/lib/api/lp-portal-admin-api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { MultiSelect, type OptionType } from "@/components/ui/multi-select"
import { ClientPicker } from "./client-picker"
import { LinkClientUserForm } from "./link-client-user-dialog"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return fallback
}

type Step = "client" | "link" | "form"

export function InviteMembershipDialog() {
  const dispatch = useAppDispatch()
  const { hasSpecificAction } = useRolePermissions()
  const canInvite = hasSpecificAction("portfolio-management", LP_MANAGEMENT_ACTIONS.INVITE_LP_MEMBER)

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("client")
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null)
  const [fundIds, setFundIds] = useState<string[]>([])
  const [fundIdsText, setFundIdsText] = useState("")
  // VIEWER / MANAGER are placeholder values from the (unconfirmed) LpRole type
  // in lib/api/lp-portal-admin-api.ts — adjust once the real enum is sampled.
  const [lpRole, setLpRole] = useState<LpRole>("VIEWER")
  const [submitting, setSubmitting] = useState(false)

  const fundOptions: OptionType[] = useMemo(() => {
    if (!selectedClient?.investmentCommitments?.length) return []
    const seen = new Map<string, string>()
    for (const c of selectedClient.investmentCommitments) {
      if (!seen.has(c.fundId)) seen.set(c.fundId, c.fund?.name || c.fundId)
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }))
  }, [selectedClient])

  const reset = () => {
    setStep("client")
    setSelectedClient(null)
    setFundIds([])
    setFundIdsText("")
    setLpRole("VIEWER")
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) reset()
  }

  const handleSelectClient = (client: ClientRecord) => {
    setSelectedClient(client)
    setFundIds([])
    setFundIdsText("")
    setStep(client.userId ? "form" : "link")
  }

  const effectiveFundIds = fundOptions.length > 0
    ? fundIds
    : fundIdsText.split(",").map((s) => s.trim()).filter(Boolean)

  const handleSubmit = async () => {
    if (!selectedClient?.userId) return
    if (effectiveFundIds.length === 0) {
      toast.error("Select at least one fund")
      return
    }
    setSubmitting(true)
    try {
      await dispatch(
        inviteMembership({
          clientId: selectedClient.id,
          userId: selectedClient.userId,
          lpRole,
          fundIds: effectiveFundIds,
        })
      ).unwrap()
      toast.success("LP membership invitation sent")
      handleOpenChange(false)
    } catch (err) {
      toast.error("Failed to invite LP member", { description: errorMessage(err, "Please try again.") })
    } finally {
      setSubmitting(false)
    }
  }

  if (!canInvite) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" className="rounded-full h-9 gradient-primary text-white shadow" onClick={() => setOpen(true)}>
        <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite LP Member
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite LP Member</DialogTitle>
          <DialogDescription>Grant a client's linked portal user access to the LP portal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</Label>
            <ClientPicker
              selectedClient={selectedClient}
              onSelect={handleSelectClient}
              placeholder="Search for a client to invite…"
            />
          </div>

          {step === "link" && selectedClient && (
            <LinkClientUserForm
              client={selectedClient}
              onLinked={(updated) => {
                setSelectedClient(updated)
                setStep("form")
              }}
              onCancel={() => {
                setSelectedClient(null)
                setStep("client")
              }}
            />
          )}

          {step === "form" && selectedClient && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Funds</Label>
                {fundOptions.length > 0 ? (
                  <MultiSelect
                    key={selectedClient.id}
                    options={fundOptions}
                    onValueChange={setFundIds}
                    placeholder="Select funds…"
                  />
                ) : (
                  <>
                    <Input
                      value={fundIdsText}
                      onChange={(e) => setFundIdsText(e.target.value)}
                      placeholder="fund-id-1, fund-id-2"
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">
                      No investment commitments found for this client — enter comma-separated fund IDs.
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">LP Role</Label>
                <Select value={lpRole} onValueChange={(v) => setLpRole(v as LpRole)}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          {step === "form" && (
            <Button
              className="gradient-primary text-white"
              onClick={handleSubmit}
              disabled={submitting || effectiveFundIds.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Inviting…
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
