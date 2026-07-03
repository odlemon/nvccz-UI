"use client"

import { useState } from "react"
import { mfaApiService } from "@/lib/api/auth-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Loader2, Copy, Download, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type MfaStep = "idle" | "qr" | "confirm" | "backup-codes" | "enabled"

function errorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string") return err
  if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
    return (err as any).message
  }
  return fallback
}

/**
 * Self-contained MFA enrollment flow for Account Settings > Security. Uses
 * local component state only — this flow isn't consumed anywhere else in the
 * app, so it doesn't need Redux.
 *
 * Login-time MFA verification is explicitly out of scope here (deferred
 * pending real /auth/login MFA-pending response samples) — this is
 * enrollment-only, initiated post-login from this page.
 */
export function MfaSettingsCard() {
  const [step, setStep] = useState<MfaStep>("idle")
  const [loading, setLoading] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [manualEntryKey, setManualEntryKey] = useState("")
  const [otp, setOtp] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const handleEnroll = async () => {
    setLoading(true)
    try {
      const res = await mfaApiService.enroll()
      setQrCodeDataUrl(res.data.qrCodeDataUrl)
      setManualEntryKey(res.data.manualEntryKey)
      setStep("qr")
    } catch (err) {
      toast.error("Failed to start MFA enrollment", { description: errorMessage(err, "Please try again.") })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(manualEntryKey)
    toast.success("Manual entry key copied")
  }

  const handleConfirm = async (token: string) => {
    if (token.length !== 6) return
    setLoading(true)
    try {
      const res = await mfaApiService.confirmEnrollment(token)
      setBackupCodes(res.data.backupCodes)
      setStep("backup-codes")
    } catch (err) {
      toast.error("Invalid or expired code", { description: errorMessage(err, "Please try again.") })
      setOtp("")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    toast.success("Backup codes copied")
  }

  const handleDownloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "arcus-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDone = () => {
    // Note: this "Enabled" state is local-session-only. There is no endpoint
    // yet exposing an "is MFA enabled" flag on the user profile, so a page
    // reload will lose this and the flow will show as idle again. That's a
    // known gap, not a bug to chase down here.
    setStep("enabled")
    setOtp("")
  }

  if (step === "enabled") {
    return (
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Enabled
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Two-Factor Authentication</h4>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
        </div>
        {step === "idle" && (
          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
            Not Enabled
          </Badge>
        )}
      </div>

      {step === "idle" && (
        <Button variant="outline" className="bg-transparent" onClick={handleEnroll} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…
            </>
          ) : (
            "Enable Two-Factor Authentication"
          )}
        </Button>
      )}

      {step === "qr" && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.),
            then enter the 6-digit code it generates.
          </p>
          <div className="flex justify-center p-4 bg-white border rounded-lg">
            {/* qrCodeDataUrl is already a rendered image data-URI from the API */}
            <img src={qrCodeDataUrl} alt="Scan with your authenticator app" className="w-48 h-48" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Can't scan? Enter this key manually</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-gray-50 border text-xs font-mono break-all">
                {manualEntryKey}
              </code>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 bg-transparent" onClick={handleCopyKey}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => setStep("confirm")}
            >
              I've scanned the code
            </Button>
            <Button variant="ghost" onClick={() => setStep("idle")}>Cancel</Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-gray-600">Enter the 6-digit code from your authenticator app to confirm setup.</p>
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleConfirm}
            disabled={loading}
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <div className="flex items-center gap-2">
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => handleConfirm(otp)}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…
                </>
              ) : (
                "Verify & Enable"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("idle")
                setOtp("")
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === "backup-codes" && (
        <div className="space-y-4 max-w-sm">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Save these backup codes now — they won't be shown again. Each code can be used once if you lose
              access to your authenticator app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-gray-50 border font-mono text-sm">
            {backupCodes.map((code) => (
              <div key={code}>{code}</div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-transparent" onClick={handleCopyBackupCodes}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent" onClick={handleDownloadBackupCodes}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download
            </Button>
          </div>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={handleDone}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
