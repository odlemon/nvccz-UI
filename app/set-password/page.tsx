"use client"

/**
 * Forced password change for a signed-in user whose password we issued.
 *
 * An invited investor is emailed a temporary password (see `LpPortalInviteService`), and the login
 * response carries `mustChangePassword: true` until they choose their own. This page is where they
 * are sent, and it deliberately offers no way onward except changing the password — the
 * requirement is meaningless if it can be dismissed.
 *
 * Distinct from `/reset-password`, which authenticates with a one-time token for someone who
 * cannot sign in. Here the user is already signed in and supplies their current password.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApiService } from "@/lib/api/auth-api"
import { PORTAL_ID, portalHomePath } from "@/lib/portal/config"
import { getCookie, setCookie } from "@/lib/utils/cookies"

function validatePassword(password: string): string | null {
  if (!password) return "Password is required"
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
  if (!/[0-9]/.test(password)) return "Password must contain at least one number"
  return null
}

export default function SetPasswordPage() {
  const router = useRouter()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = getCookie("token")
    if (!t) {
      router.replace("/login")
      return
    }
    setToken(t)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError("Enter the temporary password from your invitation email")
      return
    }
    const invalid = validatePassword(newPassword)
    if (invalid) {
      setError(invalid)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("The two passwords do not match")
      return
    }
    if (newPassword === currentPassword) {
      setError("Choose a password different from the temporary one")
      return
    }
    if (!token) {
      setError("Your session has expired. Please sign in again.")
      return
    }

    setIsSubmitting(true)
    try {
      await authApiService.changePassword(currentPassword, newPassword, token)

      // Changing a password increments the user's token version, which is correct — every other
      // session should die — but it also kills the one they are holding right now. Without
      // re-authenticating, the investor sets their password and is dumped on the login screen with
      // no explanation. Sign them straight back in with the password they just chose.
      let email: string | null = null
      try {
        const raw = getCookie("user")
        if (raw) email = JSON.parse(decodeURIComponent(raw))?.email ?? null
      } catch {
        // fall through — handled below
      }

      if (email) {
        try {
          const fresh = await authApiService.login({ email, password: newPassword })
          const maxAge = parseInt(process.env.NEXT_PUBLIC_AUTH_COOKIE_MAX_AGE || "604800")
          setCookie(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || "token", fresh.token, { maxAge })
          setCookie(
            process.env.NEXT_PUBLIC_AUTH_USER_KEY || "user",
            encodeURIComponent(JSON.stringify(fresh.user)),
            { maxAge },
          )
        } catch {
          // Re-authentication failed for some reason; the password change itself did succeed, so
          // send them to sign in rather than leaving them on a dead session.
          toast.success("Password updated", { description: "Please sign in with your new password." })
          setTimeout(() => {
            window.location.href = "/login"
          }, 1200)
          return
        }
      }

      setDone(true)
      toast.success("Password updated", { description: "Signing you in to the portal." })
      setTimeout(() => {
        window.location.href = portalHomePath(PORTAL_ID)
      }, 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not change your password"
      setError(message)
      toast.error("Password not changed", { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 size-12 text-emerald-600" />
          <h1 className="text-[18px] font-semibold text-[#111827]">Password set</h1>
          <p className="mt-2 text-[13px] text-[#4b5563]">Taking you to the portal…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#eaf2ff]">
            <Lock className="size-5 text-[#2563eb]" />
          </div>
          <h1 className="text-[18px] font-semibold text-[#111827]">Choose your password</h1>
          <p className="mt-1.5 text-[13px] leading-5 text-[#4b5563]">
            You signed in with the temporary password from your invitation email. Set your own
            password to continue — the temporary one stops working straight away.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
            <p className="text-[12px] leading-5 text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-[12px] font-medium text-[#374151]">
              Temporary password
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#9ca3af] hover:text-[#4b5563]"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-[12px] font-medium text-[#374151]">
              New password
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#9ca3af] hover:text-[#4b5563]"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] leading-4 text-[#6b7280]">
              At least 8 characters, with an uppercase letter, a lowercase letter and a number.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-[12px] font-medium text-[#374151]">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Setting your password…
              </>
            ) : (
              "Set password and continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
