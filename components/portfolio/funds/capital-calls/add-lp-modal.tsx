"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  clientsApi,
  type ClientCreateRequest,
} from "@/lib/api/capital-calls-api"
import { toast } from "sonner"
import {
  Loader2,
  UserPlus,
  Building2,
  Mail,
  User,
  Phone,
  MapPin,
  Hash,
  DollarSign,
} from "lucide-react"

interface AddLpModalProps {
  isOpen: boolean
  onClose: () => void
  fundId: string
  fundName: string
  defaultCurrency?: string
  onCreated: () => void
}

const DEFAULT_COUNTRIES = [
  { code: "ZW", name: "Zimbabwe" },
  { code: "ZA", name: "South Africa" },
  { code: "BW", name: "Botswana" },
  { code: "NA", name: "Namibia" },
  { code: "ZM", name: "Zambia" },
  { code: "MW", name: "Malawi" },
  { code: "MZ", name: "Mozambique" },
  { code: "KE", name: "Kenya" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
]

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "ZWG", name: "Zimbabwe Gold" },
  { code: "ZAR", name: "South African Rand" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
]

export function AddLpModal({
  isOpen,
  onClose,
  fundId,
  fundName,
  defaultCurrency = "USD",
  onCreated,
}: AddLpModalProps) {
  const [submitting, setSubmitting] = useState(false)

  // LP profile
  const [legalName, setLegalName] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState<"individual" | "entity" | "trust">(
    "individual"
  )
  const [investorId, setInvestorId] = useState("")
  const [country, setCountry] = useState("ZW")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [taxId, setTaxId] = useState("")
  const [status, setStatus] = useState<"ACTIVE" | "PENDING">("ACTIVE")
  const [notes, setNotes] = useState("")

  // Commitment (optional)
  const [addCommitment, setAddCommitment] = useState(true)
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(defaultCurrency)
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date())

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    // Reset form each time it opens
    setLegalName("")
    setEmail("")
    setType("individual")
    setInvestorId("")
    setCountry("ZW")
    setPhone("")
    setAddress("")
    setTaxId("")
    setStatus("ACTIVE")
    setNotes("")
    setAddCommitment(true)
    setAmount("")
    setCurrency(defaultCurrency)
    setEffectiveDate(new Date())
    setErrors({})
  }, [isOpen, defaultCurrency])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!legalName.trim()) errs.legalName = "Legal name is required"
    if (!email.trim()) errs.email = "Email is required"
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      errs.email = "Enter a valid email address"
    if (addCommitment) {
      const num = Number(amount)
      if (!amount || isNaN(num) || num <= 0)
        errs.amount = "Enter a commitment amount greater than 0"
      if (!effectiveDate) errs.effectiveDate = "Effective date required"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const body: ClientCreateRequest = {
      legal_name: legalName.trim(),
      email: email.trim(),
      type,
      country,
      status,
    }
    if (investorId.trim()) body.investor_id = investorId.trim()
    if (phone.trim()) body.phone = phone.trim()
    if (address.trim()) body.address = address.trim()
    if (taxId.trim()) body.tax_id = taxId.trim()
    if (notes.trim()) body.notes = notes.trim()

    if (addCommitment) {
      body.fund_id = fundId
      body.amount = Number(amount)
      body.currency = currency
      body.effective_date = effectiveDate
        ? format(effectiveDate, "yyyy-MM-dd")
        : undefined
    }

    try {
      setSubmitting(true)
      const res = await clientsApi.create(body)
      toast.success("LP created successfully", {
        description: addCommitment
          ? `${res.data.legalName} with ${currency} ${Number(amount).toLocaleString()} commitment to ${fundName}`
          : res.data.legalName,
      })
      onCreated()
      onClose()
    } catch (e: any) {
      const msg = String(e?.message || "")
      if (msg.toLowerCase().includes("duplicate") || msg.includes("409")) {
        toast.error("Duplicate email or investor ID", {
          description: "An LP with this email or investor ID already exists",
        })
      } else {
        toast.error("Failed to create LP", { description: msg || "Unknown error" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Add Limited Partner</DialogTitle>
              <DialogDescription className="mt-0.5">
                {fundName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Investor Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-card-foreground">
                Investor Profile
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Legal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="rounded-full"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Jamie Patel"
                />
                {errors.legalName && (
                  <p className="text-xs text-red-600">{errors.legalName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    className="rounded-full pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as typeof type)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="entity">Entity / Company</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Investor ID (optional)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="rounded-full pl-9"
                    value={investorId}
                    onChange={(e) => setInvestorId(e.target.value)}
                    placeholder="EXT-LP-2026-0042"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as typeof status)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="rounded-full pl-9"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+263771234567"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="rounded-full pl-9"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, city"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tax ID</Label>
                <Input
                  className="rounded-full"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Tax identifier"
                />
              </div>
            </div>
          </div>

          {/* Fund Commitment */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-card-foreground">
                  Fund Commitment
                </h3>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={addCommitment}
                  onChange={(e) => setAddCommitment(e.target.checked)}
                  className="rounded"
                />
                <span className="text-muted-foreground">
                  Add PENDING commitment now
                </span>
              </label>
            </div>

            {addCommitment ? (
              <>
                <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                  Commitment will be created for <strong>{fundName}</strong> with
                  PENDING status. LPs need at least one ACTIVE or PENDING
                  commitment before a capital call can include them.
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Commitment Amount{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="rounded-full pl-9"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-xs text-red-600">{errors.amount}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="font-mono text-xs mr-1.5">
                              {c.code}
                            </span>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Effective Date <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      value={effectiveDate}
                      onChange={setEffectiveDate}
                      placeholder="Pick date"
                      allowFutureDates
                    />
                    {errors.effectiveDate && (
                      <p className="text-xs text-red-600">
                        {errors.effectiveDate}
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No commitment will be created. You can add one later via the
                LP&apos;s profile.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-xl"
              placeholder="Any relevant context about this LP..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full gap-1.5 gradient-primary text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <UserPlus className="w-4 h-4" />
              Add LP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
