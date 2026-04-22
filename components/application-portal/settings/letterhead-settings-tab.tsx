"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Upload, Trash2, Save, Building2, AlertCircle, FileText } from "lucide-react"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchCompany } from "@/lib/store/slices/applicationPortalSlice"
import {
  fetchLetterhead,
  updateLetterhead,
  deleteLetterhead,
  uploadLetterheadLogo,
} from "@/lib/store/slices/applicationPortalSlice"
import type { UpdateLetterheadRequest } from "@/lib/api/application-portal-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

type FormState = {
  legalName: string
  registrationNumber: string
  taxNumber: string
  email: string
  phone: string
  website: string
  addressLabel: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  twitter: string
  facebook: string
  linkedin: string
  instagram: string
}

const emptyForm = (): FormState => ({
  legalName: "",
  registrationNumber: "",
  taxNumber: "",
  email: "",
  phone: "",
  website: "",
  addressLabel: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  twitter: "",
  facebook: "",
  linkedin: "",
  instagram: "",
})

const toPayload = (form: FormState): UpdateLetterheadRequest => {
  const normalize = (v: string) => {
    const trimmed = v.trim()
    return trimmed === "" ? null : trimmed
  }
  return {
    legalName: form.legalName.trim(),
    registrationNumber: normalize(form.registrationNumber),
    taxNumber: normalize(form.taxNumber),
    email: normalize(form.email),
    phone: normalize(form.phone),
    website: normalize(form.website),
    addressLabel: normalize(form.addressLabel),
    line1: form.line1.trim(),
    line2: normalize(form.line2),
    city: form.city.trim(),
    state: normalize(form.state),
    postalCode: normalize(form.postalCode),
    country: form.country.trim(),
    twitter: normalize(form.twitter),
    facebook: normalize(form.facebook),
    linkedin: normalize(form.linkedin),
    instagram: normalize(form.instagram),
  }
}

export function LetterheadSettingsTab() {
  const dispatch = useAppDispatch()
  const {
    company,
    companyLoading,
    letterhead,
    letterheadLoading,
    letterheadError,
    letterheadSaving,
    letterheadLogoUploading,
  } = useAppSelector((state) => state.applicationPortal)

  const [form, setForm] = useState<FormState>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!company) {
      dispatch(fetchCompany())
    }
  }, [company, dispatch])

  useEffect(() => {
    if (company?.id) {
      dispatch(fetchLetterhead(company.id))
    }
  }, [company?.id, dispatch])

  useEffect(() => {
    if (letterhead) {
      setForm({
        legalName: letterhead.legalName || "",
        registrationNumber: letterhead.registrationNumber || "",
        taxNumber: letterhead.taxNumber || "",
        email: letterhead.email || "",
        phone: letterhead.phone || "",
        website: letterhead.website || "",
        addressLabel: letterhead.addressLabel || "",
        line1: letterhead.line1 || "",
        line2: letterhead.line2 || "",
        city: letterhead.city || "",
        state: letterhead.state || "",
        postalCode: letterhead.postalCode || "",
        country: letterhead.country || "",
        twitter: letterhead.twitter || "",
        facebook: letterhead.facebook || "",
        linkedin: letterhead.linkedin || "",
        instagram: letterhead.instagram || "",
      })
    } else {
      setForm(emptyForm())
    }
    setErrors({})
  }, [letterhead])

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.legalName.trim()) next.legalName = "Legal name is required"
    if (!form.line1.trim()) next.line1 = "Address line 1 is required"
    if (!form.city.trim()) next.city = "City is required"
    if (!form.country.trim()) next.country = "Country is required"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Invalid email address"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!company?.id) {
      toast.error("Portfolio company not loaded yet")
      return
    }
    if (!validate()) return
    try {
      await dispatch(
        updateLetterhead({ portfolioCompanyId: company.id, data: toPayload(form) })
      ).unwrap()
      toast.success("Letterhead saved")
    } catch (error: any) {
      toast.error(error?.toString() || "Failed to save letterhead")
    }
  }

  const handleDelete = async () => {
    if (!company?.id) return
    try {
      await dispatch(deleteLetterhead(company.id)).unwrap()
      toast.success("Letterhead reset")
      setConfirmDeleteOpen(false)
    } catch (error: any) {
      toast.error(error?.toString() || "Failed to delete letterhead")
    }
  }

  const handleLogoChange = async (file: File | null) => {
    if (!file || !company?.id) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    try {
      await dispatch(uploadLetterheadLogo({ portfolioCompanyId: company.id, file })).unwrap()
      toast.success("Logo uploaded")
    } catch (error: any) {
      toast.error(error?.toString() || "Failed to upload logo")
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const isLoading = companyLoading || letterheadLoading
  const hasLetterhead = !!letterhead

  if (isLoading && !letterhead) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-muted-foreground">Loading letterhead…</span>
      </div>
    )
  }

  if (!company?.id) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        Your portfolio company profile isn’t available yet. Once your profile is registered, you can
        configure the letterhead used on exported reports here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-blue-600" />
            Letterhead used on exported reports
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This information (and logo) is printed at the top of PDF exports from your Financial
            Reports page.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {letterheadError && !hasLetterhead && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                No letterhead found yet — fill in the form below and save to create one.
              </span>
            </div>
          )}

          {/* Logo */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
            <div className="w-32 h-32 rounded-xl border bg-gray-50 flex items-center justify-center overflow-hidden">
              {letterhead?.logoUrl ? (
                <Image
                  src={letterhead.logoUrl}
                  alt="Letterhead logo"
                  width={128}
                  height={128}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              ) : (
                <Building2 className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Company logo</Label>
              <p className="text-xs text-muted-foreground">
                PNG or JPG, recommended square. Appears on the top-left of exported reports.
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoChange(e.target.files?.[0] || null)}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={letterheadLogoUploading}
                >
                  {letterheadLogoUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {letterhead?.logoUrl ? "Replace logo" : "Upload logo"}
                </Button>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal name *</Label>
              <Input
                id="legalName"
                value={form.legalName}
                onChange={(e) => handleChange("legalName", e.target.value)}
                placeholder="e.g., Vexma Tech (Pvt) Ltd"
                className={errors.legalName ? "border-red-500" : ""}
              />
              {errors.legalName && <p className="text-sm text-red-500">{errors.legalName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLabel">Header label</Label>
              <Input
                id="addressLabel"
                value={form.addressLabel}
                onChange={(e) => handleChange("addressLabel", e.target.value)}
                placeholder="Optional — shown in the header. Falls back to legal name."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration number</Label>
              <Input
                id="registrationNumber"
                value={form.registrationNumber}
                onChange={(e) => handleChange("registrationNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax number</Label>
              <Input
                id="taxNumber"
                value={form.taxNumber}
                onChange={(e) => handleChange("taxNumber", e.target.value)}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="hello@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+263 ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="line1">Address line 1 *</Label>
                <Input
                  id="line1"
                  value={form.line1}
                  onChange={(e) => handleChange("line1", e.target.value)}
                  className={errors.line1 ? "border-red-500" : ""}
                />
                {errors.line1 && <p className="text-sm text-red-500">{errors.line1}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="line2">Address line 2</Label>
                <Input
                  id="line2"
                  value={form.line2}
                  onChange={(e) => handleChange("line2", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className={errors.country ? "border-red-500" : ""}
                />
                {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Socials */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">Social links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input
                  id="twitter"
                  value={form.twitter}
                  onChange={(e) => handleChange("twitter", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={form.facebook}
                  onChange={(e) => handleChange("facebook", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={form.linkedin}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              {hasLetterhead && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={letterheadSaving}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset letterhead
                </Button>
              )}
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={letterheadSaving}
              className="rounded-full gap-1.5 gradient-primary text-white"
            >
              {letterheadSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {hasLetterhead ? "Save changes" : "Create letterhead"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset letterhead?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears your current letterhead configuration. Exported reports will fall back to
              the default NVCCZ letterhead until you create a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={letterheadSaving}
            >
              {letterheadSaving ? "Deleting…" : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
