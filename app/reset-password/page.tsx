"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAppDispatch } from "@/lib/store"
import { resetPassword } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()

  const token = searchParams.get("token")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.")
    }
  }, [token])

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required"
    if (password.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/[0-9]/.test(password)) return "Password must contain at least one number"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!token) {
      setError("Invalid or missing reset token")
      return
    }

    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required")
      return
    }

    const passwordValidationError = validatePassword(newPassword)
    if (passwordValidationError) {
      setError(passwordValidationError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setIsSubmitting(true)
      const response = await dispatch(resetPassword({ token, newPassword })).unwrap()
      setSubmitted(true)

      const successMessage = response?.message || "Password reset successful!"
      toast.success(successMessage)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      const errorMessage = error?.message || error || "Failed to reset password"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="rounded-3xl p-8" style={{ backgroundColor: "#F8F8F8" }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
              <p className="text-gray-600">
                The password reset link is missing or invalid. Please request a new reset link.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => router.push("/forgot-password")}
                variant="gradient-info"
                size="lg"
                className="w-full rounded-full h-12 shadow-md"
              >
                Request New Reset Link
              </Button>
              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                size="lg"
                className="w-full rounded-full h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="rounded-3xl p-8" style={{ backgroundColor: "#F8F8F8" }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
              <p className="text-gray-600">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>

            <Button
              onClick={() => router.push("/login")}
              variant="gradient-info"
              size="lg"
              className="w-full rounded-full h-12 shadow-md"
            >
              Go to Login
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="rounded-3xl p-8" style={{ backgroundColor: "#F8F8F8" }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 text-sm mt-2">Enter your new password below</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setError(null)
                  }}
                  className="pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                At least 8 characters, with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError(null)
                  }}
                  className="pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient-info"
              size="lg"
              className="w-full rounded-full mt-6 h-12 shadow-md"
              disabled={isSubmitting || !newPassword || !confirmPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
