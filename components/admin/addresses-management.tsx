"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, RefreshCw, Edit, Trash2, Star, MapPin, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { companyProfileApi, type CompanyAddress, type AddressFormData } from "@/lib/api/company-profile-api"

// ── Form modal ──────────────────────────────────────────────────────────────

const EMPTY_FORM: AddressFormData = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "ZW",
  isActive: false,
  logo: null,
}

function AddressFormModal({
  open,
  existing,
  onClose,
  onSaved,
}: {
  open: boolean
  existing: CompanyAddress | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (existing) {
        setForm({
          label: existing.label,
          line1: existing.line1,
          line2: existing.line2 || "",
          city: existing.city,
          state: existing.state || "",
          postalCode: existing.postalCode || "",
          country: existing.country,
          isActive: existing.isActive,
          logo: null,
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [open, existing])

  const set = (field: keyof AddressFormData, value: any) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.label || !form.line1 || !form.city || !form.country) {
      toast.error("Label, Address Line 1, City and Country are required")
      return
    }
    setSaving(true)
    try {
      if (existing) {
        await companyProfileApi.updateAddress(existing.id, form)
        toast.success("Address updated")
      } else {
        await companyProfileApi.createAddress(form)
        toast.success("Address created")
      }
      onSaved()
      onClose()
    } catch (e: any) {
      toast.error(existing ? "Update failed" : "Create failed", { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Address" : "Add Address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Label *</Label>
              <Input placeholder="e.g. HQ, Branch" value={form.label} onChange={e => set("label", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Country *</Label>
              <Input placeholder="e.g. ZW" value={form.country} onChange={e => set("country", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Address Line 1 *</Label>
            <Input placeholder="Street address" value={form.line1} onChange={e => set("line1", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Address Line 2</Label>
            <Input placeholder="Suite, floor, etc." value={form.line2 || ""} onChange={e => set("line2", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>City *</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>State / Province</Label>
              <Input value={form.state || ""} onChange={e => set("state", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Postal Code</Label>
              <Input value={form.postalCode || ""} onChange={e => set("postalCode", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Logo / Letterhead Image</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => set("logo", e.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                {form.logo ? "Change file" : "Choose file"}
              </Button>
              {form.logo && <span className="text-xs text-muted-foreground">{(form.logo as File).name}</span>}
              {!form.logo && existing?.logoUrl && (
                <span className="text-xs text-muted-foreground">Current logo uploaded</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Switch
              id="addr-active"
              checked={form.isActive}
              onCheckedChange={v => set("isActive", v)}
            />
            <Label htmlFor="addr-active">Set as active address</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gradient-primary text-white">
              {saving ? "Saving…" : existing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main management component ────────────────────────────────────────────────

export function AddressesManagement() {
  const [addresses, setAddresses] = useState<CompanyAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyAddress | null>(null)
  const [deleting, setDeleting] = useState<CompanyAddress | null>(null)
  const [settingActive, setSettingActive] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await companyProfileApi.getAddresses()
      setAddresses(res.data || [])
    } catch (e: any) {
      toast.error("Failed to load addresses", { description: e?.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSetActive = async (addr: CompanyAddress) => {
    setSettingActive(addr.id)
    try {
      await companyProfileApi.setActiveAddress(addr.id)
      toast.success(`"${addr.label}" set as active address`)
      await load()
    } catch (e: any) {
      toast.error("Failed to set active address", { description: e?.message })
    } finally {
      setSettingActive(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await companyProfileApi.deleteAddress(deleting.id)
      toast.success(`Address "${deleting.label}" deleted`)
      setDeleting(null)
      await load()
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Company Addresses</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage office locations used on financial report letterheads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="rounded-full gap-1.5 gradient-primary text-white"
            onClick={() => { setEditing(null); setModalOpen(true) }}
          >
            <Plus className="w-4 h-4" />
            Add Address
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No addresses configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`relative rounded-2xl border bg-card p-5 space-y-3 transition-all ${
                addr.isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {/* Active badge */}
              {addr.isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </div>
              )}

              {/* Label + logo */}
              <div className="flex items-start gap-3">
                {addr.logoUrl ? (
                  <img src={addr.logoUrl} alt={addr.label} className="h-10 w-10 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-card-foreground">{addr.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {addr.isActive ? "Letterhead address" : "Inactive"}
                  </p>
                </div>
              </div>

              {/* Address lines */}
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</p>
                <p className="font-medium text-card-foreground">{addr.country}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                {!addr.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1 text-xs h-7"
                    disabled={settingActive === addr.id}
                    onClick={() => handleSetActive(addr)}
                  >
                    <Star className="h-3 w-3" />
                    {settingActive === addr.id ? "Setting…" : "Set Active"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-7 w-7 p-0 ml-auto"
                  onClick={() => { setEditing(addr); setModalOpen(true) }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => setDeleting(addr)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <AddressFormModal
        open={modalOpen}
        existing={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={load}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={v => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete address?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the &quot;{deleting?.label}&quot; address. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
