"use client"

import { useState } from "react"
import { ArrowLeft, Loader2, CheckCircle2, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/lib/store"
import { forgotPassword } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import { MatanhoAuthShell, MATANHO_TEAL } from "@/components/auth/matanho-auth-shell"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await dispatch(forgotPassword(email)).unwrap()
      setSubmitted(true)

      const successMessage = response?.message || "Reset link sent!"
      const successDescription = response?.message
        ? undefined
        : "Check your email for password reset instructions"

      toast.success(successMessage, {
        description: successDescription,
      })
    } catch (error: any) {
      const errorMessage = error?.message || error || "Failed to send reset email"
      const errorDescription = error?.message ? undefined : "Please try again later"

      toast.error(errorMessage, {
        description: errorDescription,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "block w-full h-12 pl-4 pr-11 rounded-xl bg-[#0E1520]/80 border border-white/15 text-white text-sm placeholder:text-white/35 outline-none focus:border-[#14C4CE] focus:ring-1 focus:ring-[#14C4CE]/40 transition-colors disabled:opacity-50"

  if (submitted) {
    return (
      <MatanhoAuthShell trustLine="Secure | Compliant | Trusted">
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{ backgroundColor: `${MATANHO_TEAL}22` }}
          >
            <CheckCircle2 className="w-7 h-7" style={{ color: MATANHO_TEAL }} />
          </div>
          <h2 className="text-[26px] font-semibold text-white tracking-tight mb-2">Check your email</h2>
          <p className="text-[14px] text-white/55 leading-relaxed mb-6">
            If an account with <span className="text-white/85 font-medium">{email}</span> exists, we&apos;ve
            sent password reset instructions.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-[13px] text-white/60 mb-6">
            <p className="font-medium text-white/80 mb-1.5">Didn&apos;t receive the email?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your spam folder</li>
              <li>Confirm you entered the correct email</li>
              <li>Wait a few minutes and try again</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full h-12 rounded-full text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2"
            style={{ backgroundColor: MATANHO_TEAL }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>
      </MatanhoAuthShell>
    )
  }

  return (
    <MatanhoAuthShell>
      <div className="mb-7">
        <h2 className="text-[28px] sm:text-[30px] font-semibold text-white tracking-tight">Forgot password?</h2>
        <p className="mt-1.5 text-[14px] text-white/55">
          Enter your email and we&apos;ll send reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[13px] text-white/65 mb-1.5">Email address</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@matanho.com"
              disabled={isSubmitting}
              required
              className={inputClass}
            />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-full text-white text-[15px] font-semibold shadow-lg shadow-black/25 transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: MATANHO_TEAL }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </button>

        <div className="text-center pt-1">
          <Link
            href="/login"
            className="text-[13px] font-medium inline-flex items-center gap-1 hover:underline underline-offset-2"
            style={{ color: MATANHO_TEAL }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </form>
    </MatanhoAuthShell>
  )
}
